/**
 * Module: Worker Proxy
 * Purpose: Handle request forwarding to mya-llm backend
 * Dependencies: Cloudflare Workers API, WorkerEnv types, LlmClient
 * Used by: worker.ts
 */
import { getLlmClientFromEnv } from './llm-client.js';
/**
 * Proxy MCP traffic to the backend without JSON parsing to preserve streaming.
 */
export async function proxyMcp(c, env) {
    if (!env.MYA_LLM_URL) {
        return c.json({ error: 'Backend service not configured', details: 'MYA_LLM_URL must be set' }, 503);
    }
    if (!env.LLM_API_TOKEN) {
        return c.json({ error: 'Backend authentication not configured', details: 'LLM_API_TOKEN must be set' }, 503);
    }
    const incomingUrl = new URL(c.req.url);
    const backendUrl = new URL(env.MYA_LLM_URL);
    const pathSuffix = c.req.path.replace(/^\/mcp/, '') || '';
    backendUrl.pathname = `/mcp${pathSuffix}`;
    backendUrl.search = incomingUrl.search;
    const headers = new Headers(c.req.raw.headers);
    headers.set('X-API-Token', env.LLM_API_TOKEN);
    try {
        const mcpClient = headers.get('X-MCP-Client') || env.MCP_CLIENT || process?.env?.MCP_CLIENT;
        if (mcpClient) {
            headers.set('X-MCP-Client', String(mcpClient));
        }
    }
    catch {
        // ignore optional env access issues
    }
    if (!headers.has('Origin')) {
        headers.set('Origin', 'https://mya.monibee-fudgekin.workers.dev');
    }
    const method = c.req.method;
    const init = {
        method,
        headers,
        redirect: 'manual',
    };
    if (method !== 'GET' && method !== 'HEAD') {
        init.body = c.req.raw.body;
        init.duplex = 'half'; // Ensure streaming uploads are allowed
    }
    try {
        const backendResponse = await fetch(backendUrl.toString(), init);
        const responseHeaders = new Headers(backendResponse.headers);
        return new Response(backendResponse.body, {
            status: backendResponse.status,
            headers: responseHeaders,
        });
    }
    catch (error) {
        console.error('[MCP PROXY ERROR]', error);
        return c.json({
            error: 'Failed to proxy MCP request',
            details: error instanceof Error ? error.message : String(error),
        }, 502);
    }
}
export async function proxyToBackend(c, env, method, path) {
    const clientResult = getLlmClientFromEnv(env, {
        origin: 'https://mya.monibee-fudgekin.workers.dev',
        userAgent: 'MYA-Worker/1.0',
    });
    if (!clientResult.ok) {
        return c.json(clientResult.error, 503);
    }
    try {
        const forwardHeaders = ['Authorization', 'X-User-Id', 'X-Forwarded-For', 'X-MCP-Client'];
        const headers = forwardHeaders.reduce((acc, header) => {
            const value = c.req.header(header);
            if (value) {
                acc[header] = value;
            }
            return acc;
        }, {});
        // If MCP client metadata is available in the environment and not provided
        // by the incoming request, attach it for observability.
        try {
            const mcpClient = env.MCP_CLIENT || process?.env?.MCP_CLIENT;
            if (mcpClient && !headers['X-MCP-Client']) {
                headers['X-MCP-Client'] = String(mcpClient);
            }
        }
        catch {
            // ignore environment access issues
        }
        let bodyText = null;
        if (method !== 'GET' && method !== 'HEAD') {
            bodyText = await c.req.text();
        }
        const parseJsonBody = () => {
            if (!bodyText) {
                return {};
            }
            try {
                return JSON.parse(bodyText);
            }
            catch {
                return {};
            }
        };
        console.log(`[PROXY] ${method} ${path}`);
        const client = clientResult.client;
        let response;
        if (path === '/analyze' && method === 'POST') {
            response = await client.analyze(parseJsonBody(), headers);
        }
        else if (path.startsWith('/analyze/') && method === 'GET') {
            const jobId = path.split('/analyze/')[1];
            response = await client.analyzeStatus(jobId, headers);
        }
        else if (path === '/api/v1/forecast' && method === 'POST') {
            response = await client.forecast(parseJsonBody(), headers);
        }
        else if (path === '/api/v1/daily-report' && method === 'GET') {
            response = await client.dailyReport(headers);
        }
        else if (path === '/api/v1/learning-metrics' && method === 'GET') {
            response = await client.learningMetrics(headers);
        }
        else if (path === '/api/v1/recommendations/open' && method === 'GET') {
            response = await client.recommendationsOpen(headers);
        }
        else if (path === '/api/v1/announcements' && method === 'POST') {
            response = await client.announcements(parseJsonBody(), headers);
        }
        else if (path === '/api/v1/double' && method === 'POST') {
            response = await client.double(parseJsonBody(), headers);
        }
        else if (path === '/api/v1/cmt' && method === 'POST') {
            response = await client.cmt(parseJsonBody(), headers);
        }
        else if (path === '/api/v1/benchmark' && method === 'POST') {
            response = await client.benchmark(parseJsonBody(), headers);
        }
        else if (path === '/api/v1/agent/ingest' && method === 'POST') {
            response = await client.agentIngest(parseJsonBody(), headers);
        }
        else if (path === '/api/v1/agent/predict' && method === 'POST') {
            response = await client.agentPredict(parseJsonBody(), headers);
        }
        else if (path === '/api/v1/agent/benchmark' && method === 'POST') {
            response = await client.agentBenchmark(parseJsonBody(), headers);
        }
        else if (path === '/api/v1/agent/status' && method === 'GET') {
            response = await client.agentStatus(headers);
        }
        else if (path === '/api/v1/system/status' && method === 'GET') {
            response = await client.systemStatus(headers);
        }
        else {
            response = await client.request(path, {
                method,
                headers,
                body: bodyText && bodyText.length > 0 ? bodyText : null,
            });
        }
        return c.json(response.data, response.status);
    }
    catch (error) {
        console.error('[PROXY ERROR]', error);
        const errorMsg = error instanceof Error ? error.message : String(error);
        return c.json({
            error: 'Backend request failed',
            details: errorMsg,
            troubleshooting: 'Verify mya-llm backend is running at the configured MYA_LLM_URL with correct LLM_API_TOKEN'
        }, 503);
    }
}
export function createRouteHandlers(env) {
    return {
        analyzePost: async (c) => proxyToBackend(c, env, 'POST', '/analyze'),
        analyzeGet: async (c) => {
            const jobId = c.req.param('jobId');
            return proxyToBackend(c, env, 'GET', `/analyze/${jobId}`);
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