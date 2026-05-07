/**
 * Module: CLI Analysis
 * Purpose: Submit and retrieve analysis requests from backend
 * Dependencies: apiRequest, loadSession, AnalysisResponse types
 * Used by: cli-http.ts
 */
import { apiRequest } from './api-client.js';
import { loadSession } from './session.js';
function normalizeAnalysisResponse(raw) {
    // The CLI historically expects an ApiResponse-like envelope.
    // Some backend endpoints already return { success, ... } while others return a raw result.
    if (raw && typeof raw === 'object' && typeof raw.success === 'boolean') {
        return raw;
    }
    return {
        success: true,
        result: raw,
    };
}
function buildBackendRequest(userId, machineId, analysisType, parameters) {
    const analysisTypeLower = (analysisType || '').toLowerCase();
    const resolveGoalHint = () => {
        const hints = [
            analysisTypeLower,
            parameters?.analysisMode,
            parameters?.requestType,
            parameters?.analysisDepth,
            parameters?.depth,
            parameters?.validationMode,
            parameters?.statisticalMode,
            parameters?.analysisCategory,
            parameters?.goalId,
            parameters?.mode,
            parameters?.target,
            parameters?.strategy,
        ];
        let preferDeep = false;
        let preferStatistical = false;
        let preferValidation = false;
        for (const hint of hints) {
            if (typeof hint === 'string') {
                const lower = hint.toLowerCase();
                if (lower.includes('deep')) {
                    preferDeep = true;
                }
                if (lower.includes('statistical')) {
                    preferStatistical = true;
                }
                if (lower.includes('validation')) {
                    preferValidation = true;
                }
            }
        }
        if (preferStatistical) {
            return { goalId: 'statistical', analysisMode: 'statistical' };
        }
        if (preferValidation) {
            return { goalId: 'validation', analysisMode: 'validation' };
        }
        if (preferDeep) {
            return { goalId: 'recommendations', analysisMode: 'deep' };
        }
        return null;
    };
    const goalHint = resolveGoalHint();
    // Route legacy CLI analysisType values to the newer backend task endpoints.
    if (analysisTypeLower.includes('announcements')) {
        // Use dedicated announcements endpoint on backend; keep body minimal.
        return {
            endpoint: '/api/v1/announcements',
            body: {
                userId,
                machineId,
                force_refresh: false,
            },
        };
    }
    if (analysisTypeLower.includes('double')) {
        const minReturnTarget = parameters?.minReturnTarget;
        return {
            endpoint: '/api/v1/double',
            body: {
                userId,
                machineId,
                goalId: goalHint?.goalId,
                analysisMode: goalHint?.analysisMode,
                symbols: parameters?.symbols,
                min_return_potential: typeof minReturnTarget === 'number' ? minReturnTarget : 200,
                include_options: Boolean(parameters?.includeOptions ?? parameters?.include_options ?? true),
                include_stocks: Boolean(parameters?.includeStocks ?? parameters?.include_stocks ?? true),
                historyDays: parameters?.historyDays,
                options_leverage: parameters?.optionsLeverage ?? parameters?.options_leverage,
            },
        };
    }
    // Earnings analysis should go through the LLM-backed /analyze endpoint.
    if (analysisTypeLower.includes('earnings')) {
        return {
            endpoint: '/analyze',
            body: {
                userId,
                machineId,
                goalId: goalHint?.goalId ?? 'recommendations',
                analysisType: 'earnings',
                parameters: goalHint ? { ...parameters, analysisMode: goalHint.analysisMode } : parameters,
            },
        };
    }
    // Default CLI "analyze" command uses the LLM-backed /analyze endpoint.
    if (analysisTypeLower.includes('cmt') || analysisTypeLower.includes('analyze')) {
        return {
            endpoint: '/analyze',
            body: {
                userId,
                machineId,
                goalId: goalHint?.goalId ?? 'recommendations',
                analysisType: 'general',
                parameters: goalHint ? { ...parameters, analysisMode: goalHint.analysisMode } : parameters,
            },
        };
    }
    // Fallback to /analyze for any unknown analysis type.
    return {
        endpoint: '/analyze',
        body: {
            userId,
            machineId,
            goalId: goalHint?.goalId ?? 'recommendations',
            analysisType: 'general',
            parameters: goalHint ? { ...parameters, analysisMode: goalHint.analysisMode } : parameters,
        },
    };
}
export async function submitAnalysisRequest(userId, machineId, analysisType, parameters) {
    // Load session to get JWT token
    const session = loadSession();
    if (!session || !session.sessionJwt) {
        throw new Error('No valid session found');
    }
    const { endpoint, body } = buildBackendRequest(userId, machineId, analysisType, parameters);
    const raw = await apiRequest(endpoint, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${session.sessionJwt}`,
        },
        body: JSON.stringify(body),
    });
    return normalizeAnalysisResponse(raw);
}
export async function getAnalysisResult(requestId, _userId) {
    // Load session to get JWT token
    const session = loadSession();
    if (!session || !session.sessionJwt) {
        throw new Error('No valid session found');
    }
    return apiRequest(`/analyze/${requestId}`, {
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