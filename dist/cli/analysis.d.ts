/**
 * Module: CLI Analysis
 * Purpose: Submit and retrieve analysis requests from backend
 * Dependencies: apiRequest, loadSession, AnalysisResponse types
 * Used by: cli-http.ts
 */
import { AnalysisResponse } from '../shared/types.js';
export declare function submitAnalysisRequest(userId: string, machineId: string, analysisType: string, parameters: Record<string, unknown>): Promise<AnalysisResponse>;
export declare function getAnalysisResult(requestId: string, _userId: string): Promise<AnalysisResponse>;
export declare function _getUserStatus(_userId: string, _machineId: string): Promise<any>;
export declare function _logoutUser(_userId: string, _machineId: string): Promise<void>;
