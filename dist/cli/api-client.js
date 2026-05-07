/**
 * Module: CLI API Client
 * Purpose: HTTP request utilities for CLI communication with backend
 * Dependencies: getCLIConfig from session.ts
 * Used by: cli-http.ts, auth.ts, market.ts
 *
 * Error Handling:
 * - Retry logic: Attempts requests up to 3 times with exponential backoff (5s, 10s intervals)
 * - Timeout protection: 5-minute timeout per request to handle rate-limited backend responses
 * - JSON parsing: Catches and reports JSON parse failures with response snippet
 * - HTTP errors: Includes full response body in error messages for debugging
 */
import { getCLIConfig } from './session.js';
export async function makeApiRequest(url, options = {}) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes timeout for rate-limited requests
            const providedHeaders = options.headers || {};
            const mcpClient = process.env.MCP_CLIENT || 'mya-cli/1.0';
            const headers = {
                ...providedHeaders,
                'X-MCP-Client': providedHeaders['X-MCP-Client'] || mcpClient,
            };
            const response = await fetch(url, {
                ...options,
                headers,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            if (attempt === maxRetries) {
                throw new Error(`Request failed after ${maxRetries} attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 5000 * attempt)); // 5s, 10s backoff
        }
    }
    throw new Error('Request failed');
}
export async function apiRequest(endpoint, options = {}) {
    const config = getCLIConfig();
    const url = `${config.apiUrl}${endpoint}`;
    const response = await makeApiRequest(url, options);
    // Read response body once to avoid consuming stream twice
    let responseText = '';
    try {
        responseText = await response.text();
    }
    catch (error) {
        throw new Error(`Failed to read response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    if (!response.ok) {
        let errorBody = '';
        // Try to parse as JSON first for structured error responses
        try {
            const jsonError = JSON.parse(responseText);
            errorBody = JSON.stringify(jsonError);
        }
        catch {
            // If not JSON, use text as-is
            errorBody = responseText || response.statusText;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorBody ? ' - ' + errorBody : ''}`);
    }
    // Try to parse response as JSON
    if (!responseText) {
        throw new Error('Empty response from server');
    }
    try {
        return JSON.parse(responseText);
    }
    catch {
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 500)}`);
    }
}
export async function checkServiceAvailability() {
    try {
        const config = getCLIConfig();
        const mcpClient = process.env.MCP_CLIENT || 'mya-cli/1.0';
        const response = await fetch(`${config.apiUrl}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-MCP-Client': mcpClient,
            },
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=api-client.js.map