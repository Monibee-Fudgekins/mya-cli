/**
 * Module: LLM Client SDK
 * Purpose: Centralize Cloudflare Worker -> mya-llm API requests
 * Dependencies: Cloudflare Workers fetch API, WorkerEnv types
 * Used by: worker/proxy.ts
 */
import { AnalysisResponse, ApiResponse, WorkerEnv, AnalysisResult, StatusResponse, SystemStatus } from '../shared/types.js';
export interface LlmClientConfig {
    baseUrl: string;
    apiToken: string;
    origin?: string;
    userAgent?: string;
}
export interface LlmClientResponse<T = unknown> {
    status: number;
    data: T;
}
export declare class LlmClient {
    private baseUrl;
    private apiToken;
    private origin?;
    private userAgent;
    constructor(config: LlmClientConfig);
    request<T = unknown>(path: string, options: {
        method: string;
        headers?: Record<string, string>;
        body?: string | null;
    }): Promise<LlmClientResponse<T>>;
    analyze(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<AnalysisResponse>>;
    analyzeStatus(jobId: string, headers?: Record<string, string>): Promise<LlmClientResponse<AnalysisResponse>>;
    forecast(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<AnalysisResponse>>;
    dailyReport(headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse & {
        report?: AnalysisResult;
    }>>;
    learningMetrics(headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse & {
        metrics?: Record<string, unknown>;
    }>>;
    recommendationsOpen(headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse & {
        recommendations?: unknown[];
    }>>;
    announcements(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse>>;
    double(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse>>;
    cmt(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse>>;
    benchmark(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse>>;
    agentIngest(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse>>;
    agentPredict(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse>>;
    agentBenchmark(payload: Record<string, unknown>, headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse>>;
    agentStatus(headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse & {
        status?: StatusResponse;
    }>>;
    systemStatus(headers?: Record<string, string>): Promise<LlmClientResponse<SystemStatus>>;
    recentResults(headers?: Record<string, string>): Promise<LlmClientResponse<ApiResponse & {
        results?: unknown[];
    }>>;
}
export declare function getLlmClientFromEnv(env: WorkerEnv, options?: {
    origin?: string;
    userAgent?: string;
}): {
    ok: true;
    client: LlmClient;
} | {
    ok: false;
    error: {
        error: string;
        details: string;
    };
};
