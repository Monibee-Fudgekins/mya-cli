/**
 * Module: MYA API Gateway
 * Purpose: Cloudflare Worker proxy gateway for MYA CLI requests to mya-LLM backend
 * Dependencies: hono (web framework), middleware (JWT, rate limiting), proxy (request forwarding)
 * Used by: MYA CLI (cli-http.ts), directly accessed by end users
 *
 * Simplified Cloudflare Worker that acts as a gateway/proxy for CLI requests.
 * Forwards all requests to the mya-LLM Python agent for processing.
 * Handles authentication, rate limiting, and CORS headers.
 *
 * Configuration: Required Secrets
 * - JWT_SECRET: Secret key for JWT token verification. Set with: wrangler secret put JWT_SECRET --env [env]
 * - MYA_LLM_URL: Backend LLM service URL. Set with: wrangler secret put MYA_LLM_URL --env [env]
 *
 * Architecture:
 * - JWT validation via middleware from worker/middleware.ts
 * - Rate limiting per user based on KV storage
 * - Request forwarding to MYA_LLM_URL backend via worker/proxy.ts
 * - CORS headers for CLI client
 *
 * All AI processing, market data fetching, and analysis happens in mya-llm.
 */
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getJwtMiddleware, getRateLimitMiddleware } from './worker/middleware.js';
import { proxyToBackend, proxyMcp } from './worker/proxy.js';
import { getLlmClientFromEnv } from './worker/llm-client.js';
import { RequestQueue } from './worker/queue.js';
import { handleAuth, handleVerifyOtp, handleAuthVerify, handleSessionByEmail } from './worker/auth.js';
const app = new Hono();
const forwardHeaders = (c) => {
    const headers = ['Authorization', 'X-User-Id', 'X-Forwarded-For', 'X-MCP-Client'];
    return headers.reduce((acc, header) => {
        const value = c.req.header(header);
        if (value) {
            acc[header] = value;
        }
        return acc;
    }, {});
};
const readJsonBody = async (c) => {
    try {
        return await c.req.json();
    }
    catch {
        return {};
    }
};
const withLlmClient = async (c, handler) => {
    const env = c.env;
    const result = getLlmClientFromEnv(env, {
        origin: 'https://mya.monibee-fudgekin.workers.dev',
        userAgent: 'MYA-Worker/1.0',
    });
    if (!result.ok) {
        return c.json(result.error, 503);
    }
    return handler(result.client);
};
app.use(logger());
app.use(cors({
    origin: '*',
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: false,
}));
// Session-by-email is registered later after middleware setup to ensure middleware application
// Apply middleware using factory functions
app.use('*', async (c, next) => {
    const env = c.env;
    const jwtMiddleware = getJwtMiddleware(env);
    return jwtMiddleware(c, next);
});
// Enable rate limiting middleware (per README: 10 req/min default via env)
app.use('*', async (c, next) => {
    const env = c.env;
    const rateLimitMiddleware = getRateLimitMiddleware(env);
    return rateLimitMiddleware(c, next);
});
// Register session lookup route after app declaration
app.post('/auth/session-by-email', async (c) => {
    const env = c.env;
    return handleSessionByEmail(c, env);
});
/**
 * Health check endpoint
 */
app.get('/health', (c) => {
    return c.json({
        status: 'healthy',
        service: 'mya-gateway',
        version: '2.0.0',
    });
});
// MCP passthrough endpoints – forward to backend MCP server
app.all('/mcp', async (c) => proxyMcp(c, c.env));
app.all('/mcp/*', async (c) => proxyMcp(c, c.env));
/**
 * Test endpoint - Get OTP for testing (dev only)
 * Only available in dev environment for testing
 * In production, OTP is sent via email
 */
app.get('/test/otp/:methodId', async (c) => {
    const env = c.env;
    // Only allow in dev environment
    if (env.ENVIRONMENT !== 'dev') {
        return c.json({ error: 'Not available in production' }, 404);
    }
    try {
        const methodId = c.req.param('methodId');
        const kv = env.KV_NAMESPACE;
        if (!kv) {
            return c.json({ error: 'KV not available' }, 503);
        }
        const otpJson = await kv.get(`otp:${methodId}`);
        if (!otpJson) {
            return c.json({ error: 'OTP not found', methodId }, 404);
        }
        const otpData = JSON.parse(otpJson);
        return c.json({
            methodId,
            email: otpData.email,
            code: otpData.code,
            expiresAt: otpData.expiresAt,
        });
    }
    catch (error) {
        console.error('[TEST OTP] Failed to retrieve OTP', error);
        return c.json({ error: 'Failed to retrieve OTP' }, 500);
    }
});
/**
 * API Routes - All forward to mya-llm backend via proxy module
 * Heavy operations (analyze, forecast) use request queue for better throughput
 * Light operations (health, auth, status checks) proxy directly
 */
/**
 * Analyze endpoint - uses queue for POST (submit analysis)
 * Direct proxy for GET (check results)
 */
app.post('/analyze', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.analyze(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
app.get('/analyze/:jobId', async (c) => {
    return withLlmClient(c, async (client) => {
        const jobId = c.req.param('jobId');
        const { status, data } = await client.analyzeStatus(jobId, forwardHeaders(c));
        return c.json(data, status);
    });
});
app.post('/forecast', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.forecast(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
app.get('/daily-report', async (c) => {
    return withLlmClient(c, async (client) => {
        const { status, data } = await client.dailyReport(forwardHeaders(c));
        return c.json(data, status);
    });
});
app.get('/learning-metrics', async (c) => {
    return withLlmClient(c, async (client) => {
        const { status, data } = await client.learningMetrics(forwardHeaders(c));
        return c.json(data, status);
    });
});
/**
 * Authentication Endpoints - Handled Locally by Worker
 * Auth is handled directly in the worker using Stytch for secure OTP delivery
 * Worker is the auth boundary - no backend dependency for authentication
 */
app.post('/auth', async (c) => {
    const env = c.env;
    return handleAuth(c, env);
});
app.post('/auth/verify', async (c) => {
    const env = c.env;
    return handleAuthVerify(c, env);
});
app.post('/verify-otp', async (c) => {
    const env = c.env;
    return handleVerifyOtp(c, env);
});
app.get('/recommendations/open', async (c) => {
    return withLlmClient(c, async (client) => {
        const { status, data } = await client.recommendationsOpen(forwardHeaders(c));
        return c.json(data, status);
    });
});
app.post('/announcements', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.announcements(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
// Recent results proxy - returns recent results summary for the authenticated user
app.get('/recent-results', async (c) => {
    return withLlmClient(c, async (client) => {
        const { status, data } = await client.recentResults(forwardHeaders(c));
        return c.json(data, status);
    });
});
app.post('/double', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.double(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
app.post('/cmt', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.cmt(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
app.post('/benchmark', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.benchmark(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
/**
 * Agent API routes - forward to mya-llm agent endpoints
 */
app.post('/agent/ingest', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.agentIngest(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
app.post('/agent/predict', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.agentPredict(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
app.post('/agent/benchmark', async (c) => {
    return withLlmClient(c, async (client) => {
        const payload = await readJsonBody(c);
        const { status, data } = await client.agentBenchmark(payload, forwardHeaders(c));
        return c.json(data, status);
    });
});
app.get('/agent/status', async (c) => {
    return withLlmClient(c, async (client) => {
        const { status, data } = await client.agentStatus(forwardHeaders(c));
        return c.json(data, status);
    });
});
/**
 * Queue Management Endpoints
 * Provide access to request queue status and operations
 */
/**
 * Check status of a queued request
 * Returns current status (pending, processing, completed, failed)
 * and result if completed
 */
app.get('/queue/status/:queueId', async (c) => {
    const env = c.env;
    const userId = c.get('userId') || 'anonymous';
    const queueId = c.req.param('queueId');
    try {
        const queue = new RequestQueue(env);
        const request = await queue.getRequestStatus(userId, queueId);
        if (!request) {
            return c.json({ error: 'Request not found', queueId }, 404);
        }
        return c.json({
            queueId: request.id,
            status: request.status,
            result: request.status === 'completed' ? request.result : null,
            error: request.status === 'failed' ? request.error : null,
            timestamp: request.timestamp,
        });
    }
    catch (error) {
        console.error('[QUEUE STATUS ERROR]', error);
        return c.json({
            error: 'Failed to get queue status',
            details: error instanceof Error ? error.message : String(error),
        }, 500);
    }
});
/**
 * Get queue statistics for current user
 * Returns counts of pending, processing, completed, and failed requests
 */
app.get('/queue/stats', async (c) => {
    const env = c.env;
    const userId = c.get('userId') || 'anonymous';
    try {
        const queue = new RequestQueue(env);
        const stats = await queue.getQueueStats(userId);
        return c.json(stats);
    }
    catch (error) {
        console.error('[QUEUE STATS ERROR]', error);
        return c.json({
            error: 'Failed to get queue stats',
            details: error instanceof Error ? error.message : String(error),
        }, 500);
    }
});
/**
 * Clear completed and failed requests from user's queue
 * Helps maintain queue efficiency
 */
app.post('/queue/cleanup', async (c) => {
    const env = c.env;
    const userId = c.get('userId') || 'anonymous';
    try {
        const queue = new RequestQueue(env);
        const removed = await queue.clearCompleted(userId);
        return c.json({
            message: 'Cleanup completed',
            removedCount: removed,
        });
    }
    catch (error) {
        console.error('[QUEUE CLEANUP ERROR]', error);
        return c.json({
            error: 'Failed to cleanup queue',
            details: error instanceof Error ? error.message : String(error),
        }, 500);
    }
});
/**
 * Catch-all route for /api/v1/* paths
 * Strips /api/v1 prefix and forwards to backend
 * CLI calls /analyze (spec-compliant endpoint)
 */
app.all('/api/v1/*', async (c) => {
    const env = c.env;
    const method = c.req.method;
    const pathname = c.req.path.replace(/^\/api\/v1/, '') || '/';
    console.log(`[CATCHALL] ${method} /api/v1${pathname} -> /api/v1${pathname}`);
    return proxyToBackend(c, env, method, `/api/v1${pathname}`);
});
/**
 * Default 404 handler
 */
app.notFound((c) => {
    return c.json({ error: 'Not found' }, 404);
});
/**
 * Error handler
 */
app.onError((err, c) => {
    console.error('[ERROR]', err);
    return c.json({
        error: 'Internal server error',
        details: err instanceof Error ? err.message : String(err),
    }, 500);
});
export default app;
//# sourceMappingURL=worker.js.map