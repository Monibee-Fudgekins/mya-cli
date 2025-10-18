/**
 * Module: Worker Middleware
 * Purpose: Rate limiting and JWT authentication middleware for Cloudflare Worker
 * Dependencies: jose (JWT verification), Cloudflare Workers API
 * Used by: worker.ts
 */
import * as jose from 'jose';
export async function checkRateLimit(env, userId) {
    const kv = env.KV_NAMESPACE;
    const rateLimitPerMinute = env.RATE_LIMIT_REQUESTS || 60;
    const key = `ratelimit:${userId}`;
    const ttl = 60; // 1 minute window
    try {
        const current = await kv.get(key);
        const count = current ? parseInt(current, 10) : 0;
        if (count >= rateLimitPerMinute) {
            return false;
        }
        await kv.put(key, String(count + 1), { expirationTtl: ttl });
        return true;
    }
    catch (error) {
        console.error('Rate limit check failed:', error);
        return true; // Allow if check fails
    }
}
export function getJwtMiddleware(env) {
    // Public endpoints that don't require authentication
    const publicEndpoints = [
        '/health',
        '/auth',
        '/verify-otp',
        '/auth/verify',
        '/api/v1/health',
        '/api/v1/auth',
        '/api/v1/verify-otp',
        '/api/v1/auth/verify'
    ];
    return async (c, next) => {
        const path = c.req.path;
        // Check if this is a public endpoint
        const isPublic = publicEndpoints.some(endpoint => path === endpoint || path.startsWith(endpoint + '/'));
        if (isPublic) {
            // Public endpoints don't need JWT verification
            c.set('userId', 'anonymous');
            return next();
        }
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized: Missing or invalid Authorization header' }, 401);
        }
        const token = authHeader.substring(7);
        try {
            const secret = new TextEncoder().encode(env.JWT_SECRET);
            const verified = await jose.jwtVerify(token, secret);
            const userId = (verified.payload.userId || verified.payload.sub || 'anonymous');
            c.set('userId', userId);
        }
        catch {
            return c.json({ error: 'Unauthorized: Token verification failed' }, 401);
        }
        return next();
    };
}
export function getRateLimitMiddleware(env) {
    return async (c, next) => {
        const userId = c.get('userId') || 'anonymous';
        const allowed = await checkRateLimit(env, userId);
        if (!allowed) {
            return c.json({ error: 'Rate limit exceeded' }, 429);
        }
        return next();
    };
}
//# sourceMappingURL=middleware.js.map