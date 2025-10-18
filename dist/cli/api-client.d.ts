/**
 * Module: CLI API Client
 * Purpose: HTTP request utilities for CLI communication with backend
 * Dependencies: getCLIConfig from session.ts
 * Used by: cli-http.ts, auth.ts, market.ts
 *
 * Error Handling:
 * - Retry logic: Attempts requests up to 3 times with exponential backoff (1s, 2s intervals)
 * - Timeout protection: 30-second timeout per request to handle network issues
 * - JSON parsing: Catches and reports JSON parse failures with response snippet
 * - HTTP errors: Includes full response body in error messages for debugging
 */
export declare function makeApiRequest(url: string, options?: RequestInit): Promise<Response>;
export declare function apiRequest(endpoint: string, options?: RequestInit): Promise<any>;
export declare function checkServiceAvailability(): Promise<boolean>;
