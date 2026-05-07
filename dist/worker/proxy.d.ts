/**
 * Module: Worker Proxy
 * Purpose: Handle request forwarding to mya-llm backend
 * Dependencies: Cloudflare Workers API, WorkerEnv types, LlmClient
 * Used by: worker.ts
 */
import { WorkerEnv } from '../shared/types.js';
/**
 * Proxy MCP traffic to the backend without JSON parsing to preserve streaming.
 */
export declare function proxyMcp(c: any, env: WorkerEnv): Promise<Response>;
export declare function proxyToBackend(c: any, env: WorkerEnv, method: string, path: string): Promise<Response>;
export declare function createRouteHandlers(env: WorkerEnv): {
    analyzePost: (c: any) => Promise<Response>;
    analyzeGet: (c: any) => Promise<Response>;
    forecastPost: (c: any) => Promise<Response>;
    dailyReportGet: (c: any) => Promise<Response>;
    metricsGet: (c: any) => Promise<Response>;
    authPost: (c: any) => Promise<Response>;
    authVerifyPost: (c: any) => Promise<Response>;
    otpVerifyPost: (c: any) => Promise<Response>;
    recommendationsGet: (c: any) => Promise<Response>;
};
