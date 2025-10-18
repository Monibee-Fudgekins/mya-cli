/**
 * Module: Shared API Types
 * Purpose: Common interface definitions for CLI and Worker communication
 * Dependencies: None (type definitions only)
 * Used by: cli-http.ts, worker.ts, all CLI and Worker modules
 */
export interface ApiResponse {
    success: boolean;
    error?: string;
}
export interface AuthResponse extends ApiResponse {
    method_id?: string;
    methodId?: string;
    user_id?: string;
    userId?: string;
}
export interface SessionResponse extends ApiResponse {
    userId?: string;
    machineId?: string;
    sessionToken?: string;
    sessionJwt?: string;
    expiresAt?: number;
}
export interface ValidationResponse {
    valid: boolean;
    error?: string;
    session?: unknown;
}
export interface AnalysisResult {
    recommendations?: unknown[];
    analysis?: string;
    aiAnalysis?: string;
    marketData?: unknown;
    technicalAnalysis?: unknown;
    news?: unknown[];
    symbols?: string[];
    timestamp?: string;
    dataPoints?: unknown;
    marketContext?: unknown;
    fallback?: AnalysisFallback;
    [key: string]: unknown;
}
export interface AnalysisFallback {
    reason?: string;
    mode?: string;
    timestamp?: string;
    [key: string]: unknown;
}
export interface AnalysisResponse extends ApiResponse {
    requestId?: string;
    status?: string;
    result?: AnalysisResult;
    aiAnalysis?: string;
    analysis?: string;
    symbols?: string[];
    timestamp?: string;
    dataPoints?: unknown;
    marketContext?: unknown;
}
export interface SystemFallbackTelemetry {
    count: number;
    lastTimestamp?: string;
    lastMetadata?: Record<string, unknown> | null;
}
export interface SystemStatus {
    timestamp: string;
    agentMode: {
        enabled: boolean;
    };
    launchDarkly: {
        ready: boolean;
        model?: string;
        variationKey?: string;
        error?: string;
        lastChecked?: string;
    };
    fallbacks: {
        launchdarkly: SystemFallbackTelemetry;
        ai: SystemFallbackTelemetry;
    };
    vectorize: {
        lastAnnouncementsUpdate?: string | null;
    };
    yahooCooldown?: {
        active: boolean;
        nextAvailableAt?: number;
        attemptCount?: number;
        remainingMs?: number;
    };
    cron: Record<string, string | null>;
    trading: {
        halted: boolean;
        reason?: string;
        since?: string;
    };
}
export interface StatusResponse {
    authenticated: boolean;
    userId?: string;
    email?: string;
    machineId?: string;
    expiresAt?: number;
    permissions?: string[];
    error?: string;
}
export interface CLIConfig {
    apiUrl: string;
    sessionFile: string;
}
export interface UserSession {
    userId: string;
    machineId: string;
    sessionId: string;
    sessionJwt: string;
    email: string;
    isActive: boolean;
    createdAt: number;
    lastActivity: number;
    expiresAt: number;
}
export interface WorkerEnv {
    KV_NAMESPACE: any;
    MYA_LLM_URL: string;
    JWT_SECRET: string;
    RATE_LIMIT_REQUESTS?: number;
    ENVIRONMENT?: string;
}
export interface HonoContext {
    userId?: string;
    [key: string]: any;
}
