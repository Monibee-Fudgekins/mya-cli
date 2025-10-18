/**
 * Module: CLI Authentication
 * Purpose: Handle user login, OTP verification, and session validation
 * Dependencies: chalk, ora, inquirer (CLI UI), apiRequest, initializeServices, session management
 * Used by: cli-http.ts
 *
 * Error Handling Improvements:
 * - Added specific troubleshooting for HTTP 503 errors from backend
 * - Detects when MYA_LLM_URL environment variable is not configured
 * - Provides clear guidance to users when backend is unavailable
 * - Reports non-JSON responses from backend gracefully
 */
import { AuthResponse, SessionResponse, UserSession } from '../shared/types.js';
export declare function processAuth(email: string): Promise<AuthResponse>;
export declare function verifyOtpAndCreateSession(email: string, otpCode: string, methodId: string): Promise<SessionResponse>;
export declare function validateSession(_userId: string, _machineId: string, _sessionId: string): Promise<boolean>;
export declare function authenticateUser(): Promise<UserSession | null>;
export declare function ensureAuthenticated(): Promise<UserSession | null>;
