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
import { WorkerEnv } from '../shared/types.js';
export declare function proxyToBackend(c: any, env: WorkerEnv, method: string, path: string): Promise<Response>;
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
export declare function proxyToBackendQueued(c: any, env: WorkerEnv, method: string, path: string): Promise<Response>;
/**
 * Process next request from user's queue
 * Purpose: Worker background task to process queued requests
 * Args:
 *   env: Worker environment
 *   userId: User identifier
 * Returns: Object with processing result
 * Side effects: Updates request status and stores result
 */
export declare function processQueuedRequest(env: WorkerEnv, userId: string): Promise<any>;
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
