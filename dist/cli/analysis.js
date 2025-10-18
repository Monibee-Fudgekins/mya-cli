/**
 * Module: CLI Analysis
 * Purpose: Submit and retrieve analysis requests from backend
 * Dependencies: apiRequest, loadSession, AnalysisResponse types
 * Used by: cli-http.ts
 */
import { apiRequest } from './api-client.js';
import { loadSession } from './session.js';
export async function submitAnalysisRequest(userId, machineId, analysisType, parameters) {
    // Load session to get JWT token
    const session = loadSession();
    if (!session || !session.sessionJwt) {
        throw new Error('No valid session found');
    }
    return apiRequest('/api/v1/analyze', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.sessionJwt}`,
        },
        body: JSON.stringify({ userId, machineId, analysisType, parameters }),
    });
}
export async function getAnalysisResult(requestId, _userId) {
    // Load session to get JWT token
    const session = loadSession();
    if (!session || !session.sessionJwt) {
        throw new Error('No valid session found');
    }
    return apiRequest(`/api/v1/analyze/${requestId}`, {
        headers: {
            'Authorization': `Bearer ${session.sessionJwt}`,
        },
    });
}
export async function _getUserStatus(_userId, _machineId) {
    // Load session to get the JWT token
    const session = loadSession();
    if (!session || !session.sessionJwt) {
        throw new Error('No valid session found');
    }
    return apiRequest('/api/v1/status', {
        headers: {
            'Authorization': `Bearer ${session.sessionJwt}`,
        },
    });
}
export async function _logoutUser(_userId, _machineId) {
    await apiRequest('/api/v1/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ userId: _userId, machineId: _machineId }),
    });
}
//# sourceMappingURL=analysis.js.map