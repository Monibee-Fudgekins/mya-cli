/**
 * Module: CLI Display Utilities
 * Purpose: Format and display analysis results, system status, and fallback notices
 * Dependencies: chalk (color output), ora (spinners), AnalysisResult, SystemStatus types
 * Used by: cli-http.ts
 */
import { AnalysisResult, SystemStatus, UserSession } from '../shared/types.js';
export declare function displayFallbackNotice(result?: AnalysisResult | null): void;
export declare function startYahooCooldownPolling(spinner: any, baseText: string): () => void;
export declare function printSystemStatus(status: SystemStatus | null): void;
export declare function displayAnalysisResults(requestId: string, session: UserSession, getAnalysisResult: (id: string, userId: string) => Promise<any>): Promise<void>;
