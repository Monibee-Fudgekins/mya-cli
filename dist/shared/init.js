/**
 * Module: Shared Initialization
 * Purpose: Common initialization functions used by CLI
 * Dependencies: apiRequest from api-client module
 * Used by: cli-http.ts
 */
export async function initializeServices(apiRequest) {
    try {
        await apiRequest('/initialize', { method: 'POST' });
    }
    catch (error) {
        // Allow CLI to continue if service initialization fails
        // This is not critical for basic functionality
        if (error instanceof Error && error.message.includes('Unable to connect')) {
            throw error; // Re-throw connection errors
        }
        // Service initialization skipped (non-critical)
    }
}
//# sourceMappingURL=init.js.map