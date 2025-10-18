/**
 * Module: Shared Initialization
 * Purpose: Common initialization functions used by CLI
 * Dependencies: apiRequest from api-client module
 * Used by: cli-http.ts
 */
export declare function initializeServices(apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>): Promise<void>;
