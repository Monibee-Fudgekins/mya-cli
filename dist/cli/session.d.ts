/**
 * Module: CLI Session Management
 * Purpose: Manage user session persistence and configuration
 * Dependencies: fs, path, os (Node.js built-ins)
 * Used by: cli-http.ts, auth.ts
 */
import { UserSession, CLIConfig } from '../shared/types.js';
export declare function getCLIConfig(): CLIConfig;
export declare function loadSession(): UserSession | null;
export declare function saveSession(session: UserSession): void;
export declare function clearSession(): void;
