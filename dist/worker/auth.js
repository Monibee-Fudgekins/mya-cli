/**
 * Module: Worker Authentication
 * Purpose: Handle authentication flows directly in the worker without proxying to backend
 * Dependencies: jose (JWT), Cloudflare Workers API, EmailService for OTP sending
 * Used by: worker.ts
 *
 * Auth Flows Handled Locally:
 * - POST /auth: Generate OTP and send via email
 * - POST /verify-otp: Verify OTP code and create JWT session
 * - POST /auth/verify: Validate JWT token
 *
 * Why Local Handling:
 * Authentication should not depend on backend availability
 * Worker is the auth boundary for the system
 * OTP and JWT can be generated and validated in the worker
 * No backend call needed for initial login
 */
import * as jose from 'jose';
/**
 * Generate a 6-digit OTP code
 */
function generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Generate a JWT token for authenticated sessions
 */
async function generateSessionJwt(userId, env) {
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new jose.SignJWT({
        userId,
        sub: userId,
        type: 'session',
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);
    return token;
}
/**
 * Store OTP in KV with expiration
 */
async function storeOtp(email, code, kv) {
    const methodId = `method_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes
    const otpData = {
        email,
        code,
        timestamp: Date.now(),
        expiresAt,
    };
    await kv.put(`otp:${methodId}`, JSON.stringify(otpData), {
        expirationTtl: 15 * 60, // 15 minutes
    });
    return methodId;
}
/**
 * Retrieve and verify OTP
 */
async function verifyOtp(methodId, code, kv) {
    const otpJson = await kv.get(`otp:${methodId}`);
    if (!otpJson) {
        return { valid: false };
    }
    const otpData = JSON.parse(otpJson);
    if (Date.now() > otpData.expiresAt) {
        await kv.delete(`otp:${methodId}`);
        return { valid: false };
    }
    if (otpData.code !== code) {
        return { valid: false };
    }
    // OTP is valid - delete it so it can't be reused
    await kv.delete(`otp:${methodId}`);
    return { valid: true, email: otpData.email };
}
/**
 * Handle authentication request (POST /auth)
 * Generates OTP and stores it in KV
 * In production, this would send OTP via email
 */
export async function handleAuth(c, env) {
    try {
        const body = await c.req.json();
        const email = body.email;
        if (!email || !email.includes('@')) {
            return c.json({ success: false, error: 'Valid email required' }, 400);
        }
        const kv = env.KV_NAMESPACE;
        if (!kv) {
            console.error('[AUTH] KV_NAMESPACE not configured in environment');
            return c.json({
                success: false,
                error: 'Auth service unavailable',
                details: 'KV_NAMESPACE binding is not configured. Ensure wrangler.toml has KV namespace binding and wrangler secret put JWT_SECRET was run.',
            }, 503);
        }
        const otpCode = generateOtpCode();
        const methodId = await storeOtp(email, otpCode, kv);
        // In production, send OTP via email here
        // For now, log it for testing
        console.log(`[AUTH] OTP for ${email}: ${otpCode}`);
        return c.json({
            success: true,
            methodId,
            email,
            message: 'OTP sent to email (check console in dev mode)',
        });
    }
    catch (error) {
        console.error('[AUTH ERROR]', error);
        return c.json({ success: false, error: 'Authentication failed', details: error instanceof Error ? error.message : String(error) }, 500);
    }
}
/**
 * Handle OTP verification (POST /verify-otp)
 * Verifies OTP code and creates JWT session
 */
export async function handleVerifyOtp(c, env) {
    try {
        const body = await c.req.json();
        const { email, otpCode, methodId } = body;
        if (!email || !otpCode || !methodId) {
            return c.json({ success: false, error: 'Email, OTP code, and method ID required' }, 400);
        }
        const kv = env.KV_NAMESPACE;
        if (!kv) {
            return c.json({ success: false, error: 'Auth service unavailable' }, 503);
        }
        const { valid, email: storedEmail } = await verifyOtp(methodId, otpCode, kv);
        if (!valid || storedEmail !== email) {
            return c.json({ success: false, error: 'Invalid OTP code' }, 401);
        }
        // Generate session JWT
        const userId = `user_${email.split('@')[0]}_${Date.now()}`;
        const sessionJwt = await generateSessionJwt(userId, env);
        const machineId = `machine_${Math.random().toString(36).substr(2, 9)}`;
        const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return c.json({
            success: true,
            userId,
            machineId,
            sessionToken,
            sessionJwt,
            email,
            expiresAt: Date.now() + (24 * 60 * 60 * 1000),
        });
    }
    catch (error) {
        console.error('[VERIFY_OTP ERROR]', error);
        return c.json({ success: false, error: 'OTP verification failed' }, 500);
    }
}
/**
 * Handle token verification (POST /auth/verify)
 * Validates JWT token from Authorization header
 */
export async function handleAuthVerify(c, env) {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ valid: false, error: 'Missing or invalid Authorization header' }, 401);
        }
        const token = authHeader.substring(7);
        try {
            const secret = new TextEncoder().encode(env.JWT_SECRET);
            const verified = await jose.jwtVerify(token, secret);
            const userId = (verified.payload.userId || verified.payload.sub);
            return c.json({
                valid: true,
                userId,
            });
        }
        catch {
            return c.json({ valid: false, error: 'Token verification failed' }, 401);
        }
    }
    catch (error) {
        console.error('[AUTH_VERIFY ERROR]', error);
        return c.json({ valid: false, error: 'Token verification failed' }, 500);
    }
}
//# sourceMappingURL=auth.js.map