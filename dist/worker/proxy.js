/**
 * Module: Worker Proxy
 * Purpose: Handle request forwarding to mya-llm backend with optional queue support
 * Dependencies: Cloudflare Workers API, WorkerEnv types, RequestQueue from queue.ts
 * Used by: worker.ts
 *
 * Provides two modes of request handling:
 * 1. Direct proxying: Immediate forwarding to backend (fast requests)
 * 2. Queued proxying: FIFO queue-based processing (heavy workloads)
 *
 * Use proxyToBackend for direct requests (auth, health checks)
 * Use proxyToBackendQueued for expensive operations (analyze, forecast)
 *
 * Error Handling:
 * - Previous issue: When backend returns HTML error pages (5xx), JSON parsing failed
 * - Current fix: Gracefully handle non-JSON responses with detailed error messages
 * - Result: Users get meaningful error info about backend configuration issues
 * - Root cause errors usually indicate: MYA_LLM_URL not set in wrangler secrets
 */
import { RequestQueue } from './queue.js';
export async function proxyToBackend(c, env, method, path) {
    const myaLlmUrl = env.MYA_LLM_URL;
    if (!myaLlmUrl) {
        return c.json({ error: 'Backend service not configured' }, 503);
    }
    try {
        const url = new URL(myaLlmUrl);
        url.pathname = path;
        const requestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-Forwarded-For': c.req.header('X-Forwarded-For') || 'unknown',
                'X-User-Id': c.get('userId') || 'anonymous',
            },
        };
        if (method !== 'GET' && method !== 'HEAD') {
            const body = await c.req.text();
            if (body) {
                requestInit.body = body;
            }
        }
        console.log(`[PROXY] ${method} ${path} -> ${url.toString()}`);
        const response = await fetch(url.toString(), requestInit);
        const responseBody = await response.text();
        let responseData;
        try {
            responseData = JSON.parse(responseBody || '{}');
        }
        catch {
            responseData = {
                error: 'Backend returned invalid response',
                details: responseBody ? responseBody.substring(0, 200) : 'Empty response',
                statusCode: response.status,
            };
        }
        return c.json(responseData, response.status);
    }
    catch (error) {
        console.error('[PROXY ERROR]', error);
        return c.json({
            error: 'Backend request failed',
            details: error instanceof Error ? error.message : String(error),
        }, 503);
    }
}
/**
 * Proxy request through FIFO queue
 * Purpose: Handle expensive operations (analyze, forecast) through request queue
 * Args:
 *   c: Hono context
 *   env: Worker environment with KV namespace
 *   method: HTTP method
 *   path: Backend path
 * Returns: Response with queueId for polling or immediate result if processed
 * Side effects: Stores request in KV-based queue under user ID
 */
export async function proxyToBackendQueued(c, env, method, path) {
    const userId = c.get('userId') || 'anonymous';
    const queue = new RequestQueue(env);
    try {
        const body = method !== 'GET' && method !== 'HEAD' ? await c.req.text() : undefined;
        // Add request to queue
        const queueId = await queue.enqueue(userId, path, method, body);
        console.log(`[PROXY QUEUED] Request ${queueId} queued for user ${userId}`);
        // Return queue info for client to poll
        return c.json({
            status: 'queued',
            queueId,
            pollUrl: `/queue/status/${queueId}`,
            message: 'Request queued for processing. Use queueId to check status.',
        }, 202 // Accepted status code for async operations
        );
    }
    catch (error) {
        console.error('[PROXY QUEUE ERROR]', error);
        return c.json({
            error: 'Failed to queue request',
            details: error instanceof Error ? error.message : String(error),
        }, 503);
    }
}
/**
 * Process next request from user's queue
 * Purpose: Worker background task to process queued requests
 * Args:
 *   env: Worker environment
 *   userId: User identifier
 * Returns: Object with processing result
 * Side effects: Updates request status and stores result
 */
export async function processQueuedRequest(env, userId) {
    const queue = new RequestQueue(env);
    const myaLlmUrl = env.MYA_LLM_URL;
    if (!myaLlmUrl) {
        throw new Error('Backend service not configured');
    }
    try {
        // Get next request
        const request = await queue.dequeue(userId);
        if (!request) {
            return { status: 'no_requests', message: 'No pending requests in queue' };
        }
        // Mark as processing
        await queue.markProcessing(userId, request.id);
        console.log(`[QUEUE PROCESSOR] Processing request ${request.id} for user ${userId}`);
        // Forward to backend
        const url = new URL(myaLlmUrl);
        url.pathname = request.path;
        const requestInit = {
            method: request.method,
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId,
            },
        };
        if (request.body) {
            requestInit.body = request.body;
        }
        const response = await fetch(url.toString(), requestInit);
        const responseBody = await response.text();
        const result = JSON.parse(responseBody || '{}');
        // Mark as completed
        await queue.markCompleted(userId, request.id, result);
        // Remove from queue
        await queue.removeFromQueue(userId, request.id);
        console.log(`[QUEUE PROCESSOR] Request ${request.id} completed successfully`);
        return {
            status: 'processed',
            queueId: request.id,
            result,
        };
    }
    catch (error) {
        console.error('[QUEUE PROCESSOR ERROR]', error);
        // Mark as failed but keep in queue for retrieval
        if (error instanceof Error) {
            await queue.markFailed(userId, error.requestId || 'unknown', error.message);
        }
        throw error;
    }
}
export function createRouteHandlers(env) {
    return {
        analyzePost: async (c) => proxyToBackend(c, env, 'POST', '/api/v1/analyze'),
        analyzeGet: async (c) => {
            const jobId = c.req.param('jobId');
            return proxyToBackend(c, env, 'GET', `/api/v1/analyze/${jobId}`);
        },
        forecastPost: async (c) => proxyToBackend(c, env, 'POST', '/api/v1/forecast'),
        dailyReportGet: async (c) => proxyToBackend(c, env, 'GET', '/api/v1/daily-report'),
        metricsGet: async (c) => proxyToBackend(c, env, 'GET', '/api/v1/learning-metrics'),
        authPost: async (c) => proxyToBackend(c, env, 'POST', '/auth'),
        authVerifyPost: async (c) => proxyToBackend(c, env, 'POST', '/auth/verify'),
        otpVerifyPost: async (c) => proxyToBackend(c, env, 'POST', '/verify-otp'),
        recommendationsGet: async (c) => proxyToBackend(c, env, 'GET', '/recommendations/open'),
    };
}
//# sourceMappingURL=proxy.js.map