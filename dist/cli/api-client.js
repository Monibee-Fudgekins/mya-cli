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
import { getCLIConfig } from './session.js';
export async function makeApiRequest(url, options = {}) {
    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        }
        catch (error) {
            if (attempt === maxRetries) {
                throw new Error(`Request failed after ${maxRetries} attempts: ${error.message}`);
            }
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
    }
    throw new Error('Request failed');
}
export async function apiRequest(endpoint, options = {}) {
    const config = getCLIConfig();
    const url = `${config.apiUrl}${endpoint}`;
    const response = await makeApiRequest(url, options);
    if (!response.ok) {
        let errorDetails = '';
        try {
            const errorBody = await response.text();
            errorDetails = errorBody ? ` - ${errorBody}` : '';
        }
        catch {
            // Ignore error reading response body
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}${errorDetails}`);
    }
    try {
        return await response.json();
    }
    catch {
        const textBody = await response.text();
        throw new Error(`Invalid JSON response from server: ${textBody.substring(0, 500)}`);
    }
}
export async function checkServiceAvailability() {
    try {
        const config = getCLIConfig();
        const response = await fetch(`${config.apiUrl}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=api-client.js.map