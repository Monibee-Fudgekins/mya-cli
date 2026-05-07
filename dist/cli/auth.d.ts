/**
 * Module: CLI Authentication
 * Purpose: Handle user login, OTP verification, and session validation
 * Dependencies: chalk, ora, inquirer (CLI UI), apiRequest, session management
 * Used by: cli-http.ts
 */
import { UserSession } from '../shared/types.js';
export declare function validateSession(userId: string, machineId: string, sessionId: string): Promise<boolean>;
export declare function authenticateUser(): Promise<UserSession | null>;
export declare function ensureAuthenticated(): Promise<UserSession | null>;
