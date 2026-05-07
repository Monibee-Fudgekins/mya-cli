/**
 * Module: LLM Client SDK
 * Purpose: Centralize Cloudflare Worker -> mya-llm API requests
 * Dependencies: Cloudflare Workers fetch API, WorkerEnv types
 * Used by: worker/proxy.ts
 */
export class LlmClient {
    baseUrl;
    apiToken;
    origin;
    userAgent;
    constructor(config) {
        this.baseUrl = config.baseUrl;
        this.apiToken = config.apiToken;
        this.origin = config.origin;
        this.userAgent = config.userAgent ?? 'MYA-Worker/1.0';
    }
    async request(path, options) {
        const url = new URL(this.baseUrl);
        url.pathname = path;
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': this.userAgent,
            'X-API-Token': this.apiToken,
            ...options.headers,
        };
        if (this.origin) {
            headers['Origin'] = this.origin;
        }
        const response = await fetch(url.toString(), {
            method: options.method,
            headers,
            body: options.body ?? undefined,
        });
        const responseBody = await response.text();
        let data;
        try {
            data = JSON.parse(responseBody || '{}');
        }
        catch {
            data = {
                error: 'Backend returned invalid response',
                details: responseBody ? responseBody.substring(0, 200) : 'Empty response',
                statusCode: response.status,
                troubleshooting: 'Ensure mya-llm is running and LLM_API_TOKEN is correctly set',
            };
        }
        return { status: response.status, data };
    }
    analyze(payload, headers) {
        return this.request('/analyze', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    analyzeStatus(jobId, headers) {
        return this.request(`/analyze/${jobId}`, {
            method: 'GET',
            headers,
        });
    }
    forecast(payload, headers) {
        return this.request('/api/v1/forecast', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    dailyReport(headers) {
        return this.request('/api/v1/daily-report', {
            method: 'GET',
            headers,
        });
    }
    learningMetrics(headers) {
        return this.request('/api/v1/learning-metrics', {
            method: 'GET',
            headers,
        });
    }
    recommendationsOpen(headers) {
        return this.request('/api/v1/recommendations/open', {
            method: 'GET',
            headers,
        });
    }
    announcements(payload, headers) {
        return this.request('/api/v1/announcements', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    double(payload, headers) {
        return this.request('/api/v1/double', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    cmt(payload, headers) {
        return this.request('/api/v1/cmt', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    benchmark(payload, headers) {
        return this.request('/api/v1/benchmark', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    agentIngest(payload, headers) {
        return this.request('/api/v1/agent/ingest', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    agentPredict(payload, headers) {
        return this.request('/api/v1/agent/predict', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    agentBenchmark(payload, headers) {
        return this.request('/api/v1/agent/benchmark', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload ?? {}),
        });
    }
    agentStatus(headers) {
        return this.request('/api/v1/agent/status', {
            method: 'GET',
            headers,
        });
    }
    systemStatus(headers) {
        return this.request('/api/v1/system/status', {
            method: 'GET',
            headers,
        });
    }
    recentResults(headers) {
        return this.request('/api/v1/recent-results', {
            method: 'GET',
            headers,
        });
    }
}
export function getLlmClientFromEnv(env, options) {
    const myaLlmUrl = env.MYA_LLM_URL;
    const llmApiToken = env.LLM_API_TOKEN;
    if (!myaLlmUrl) {
        return {
            ok: false,
            error: {
                error: 'Backend service not configured',
                details: 'MYA_LLM_URL environment variable must be set (e.g., http://localhost:7860 or http://your-backend.com:7860)',
            },
        };
    }
    if (!llmApiToken) {
        return {
            ok: false,
            error: {
                error: 'Backend authentication not configured',
                details: 'LLM_API_TOKEN environment variable must be set with the API token for backend authentication',
            },
        };
    }
    return {
        ok: true,
        client: new LlmClient({
            baseUrl: myaLlmUrl,
            apiToken: llmApiToken,
            origin: options?.origin,
            userAgent: options?.userAgent,
        }),
    };
}
//# sourceMappingURL=llm-client.js.map