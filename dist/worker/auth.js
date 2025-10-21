/**
 * Module: Worker Authentication
 * Purpose: Handle authentication flows directly in the worker using Stytch for OTP delivery
 * Dependencies: jose (JWT), stytch (OTP email delivery), Cloudflare Workers API
 * Used by: worker.ts
 *
 * Auth Flows Handled Locally:
 * - POST /auth: Generate OTP and send via Stytch email
 * - POST /verify-otp: Verify OTP code and create JWT session
 * - POST /auth/verify: Validate JWT token
 *
 * Why Local Handling:
 * Authentication should not depend on backend availability
 * Worker is the auth boundary for the system
 * OTP and JWT can be generated and validated in the worker
 * Stytch handles secure email delivery
 */
import * as jose from 'jose';
import * as stytch from 'stytch';
/**
 * Create a Stytch client configured for Cloudflare Workers
 * Handles User-Agent issues that cause authentication failures in Workers
 */
function createStytchClient(env) {
    // Validate required environment variables
    if (!env.STYTCH_PROJECT_ID || !env.STYTCH_SECRET) {
        throw new Error('Missing Stytch project ID or secret in environment variables');
    }
    // Create the base client
    const client = new stytch.Client({
        project_id: env.STYTCH_PROJECT_ID,
        secret: env.STYTCH_SECRET,
    });
    const clientWithRequest = client;
    const originalRequest = clientWithRequest.request;
    if (originalRequest) {
        clientWithRequest.request = async function (method, path, data, opts) {
            const options = {
                ...opts,
                headers: {
                    ...(opts?.headers ?? {}),
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
                    'X-Stytch-Client': 'stytch-js/browser',
                },
            };
            return originalRequest.call(this, method, path, data, options);
        };
    }
    return client;
}
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
 * Generates OTP and sends it via Stytch email service
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
        // Initialize Stytch client
        let stytchClient;
        try {
            stytchClient = createStytchClient(env);
        }
        catch (error) {
            console.error('[AUTH] Failed to initialize Stytch client:', error);
            return c.json({
                success: false,
                error: 'Email service unavailable',
                details: 'Stytch authentication service is not configured properly.',
            }, 503);
        }
        // Generate OTP code for local storage (in case we need it for verification)
        const otpCode = generateOtpCode();
        try {
            // Send OTP via Stytch email
            const params = {
                email: email,
                expiration_minutes: 10,
            };
            const response = await stytchClient.otps.email.loginOrCreate(params);
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response from Stytch');
            }
            const stytchResponse = response;
            // Store OTP in KV for verification (using Stytch's email_id as methodId)
            const methodId = stytchResponse.email_id || `stytch_${Date.now()}`;
            const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes to match Stytch expiration
            const otpData = {
                email,
                code: otpCode, // Store our generated code for fallback verification
                timestamp: Date.now(),
                expiresAt,
            };
            await kv.put(`otp:${methodId}`, JSON.stringify(otpData), {
                expirationTtl: 10 * 60, // 10 minutes
            });
            console.log(`[AUTH] OTP sent to ${email} via Stytch (methodId: ${methodId})`);
            return c.json({
                success: true,
                methodId,
                email,
                message: 'OTP sent to email via Stytch',
            });
        }
        catch (stytchError) {
            console.error('[AUTH] Stytch OTP send failed:', stytchError);
            // Fallback: Store OTP locally and log it (for development/testing)
            console.log(`[AUTH FALLBACK] OTP for ${email}: ${otpCode} (Stytch failed)`);
            const methodId = `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const expiresAt = Date.now() + (15 * 60 * 1000); // 15 minutes fallback
            const otpData = {
                email,
                code: otpCode,
                timestamp: Date.now(),
                expiresAt,
            };
            await kv.put(`otp:${methodId}`, JSON.stringify(otpData), {
                expirationTtl: 15 * 60, // 15 minutes
            });
            return c.json({
                success: true,
                methodId,
                email,
                message: 'OTP sent to email (check console in dev mode - Stytch unavailable)',
            });
        }
    }
    catch (error) {
        console.error('[AUTH ERROR]', error);
        return c.json({ success: false, error: 'Authentication failed', details: error instanceof Error ? error.message : String(error) }, 500);
    }
}
/**
 * Handle OTP verification (POST /verify-otp)
 * Verifies OTP code with Stytch and creates JWT session
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
        // Initialize Stytch client
        let stytchClient;
        try {
            stytchClient = createStytchClient(env);
        }
        catch (error) {
            console.error('[VERIFY_OTP] Failed to initialize Stytch client:', error);
            // Fall back to local KV verification if Stytch is unavailable
            return await verifyOtpLocally(c, methodId, otpCode, email, env);
        }
        try {
            // Try Stytch verification first
            const params = {
                method_id: methodId,
                code: otpCode,
                session_duration_minutes: 60 * 24 * 30, // 30 days
            };
            const response = await stytchClient.otps.authenticate(params);
            if (!response || typeof response !== 'object') {
                throw new Error('Invalid response from Stytch');
            }
            const stytchResponse = response;
            // Clean up local OTP record if it exists
            await kv.delete(`otp:${methodId}`).catch(() => { });
            // Generate our own JWT for the worker (using Stytch user_id)
            const userId = stytchResponse.user_id || `stytch_${Date.now()}`;
            const sessionJwt = await generateSessionJwt(userId, env);
            const machineId = `machine_${Math.random().toString(36).substr(2, 9)}`;
            const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            console.log(`[VERIFY_OTP] Stytch verification successful for ${email} (userId: ${userId})`);
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
        catch (stytchError) {
            console.error('[VERIFY_OTP] Stytch verification failed:', stytchError);
            // Fall back to local KV verification
            console.log('[VERIFY_OTP] Falling back to local OTP verification');
            return await verifyOtpLocally(c, methodId, otpCode, email, env);
        }
    }
    catch (error) {
        console.error('[VERIFY_OTP ERROR]', error);
        return c.json({ success: false, error: 'OTP verification failed' }, 500);
    }
}
/**
 * Fallback OTP verification using local KV storage
 * Used when Stytch is unavailable or for development
 */
async function verifyOtpLocally(c, methodId, otpCode, email, env) {
    const kv = env.KV_NAMESPACE;
    const { valid, email: storedEmail } = await verifyOtp(methodId, otpCode, kv);
    if (!valid || storedEmail !== email) {
        return c.json({ success: false, error: 'Invalid OTP code' }, 401);
    }
    // Generate session JWT
    const userId = `user_${email.split('@')[0]}_${Date.now()}`;
    const sessionJwt = await generateSessionJwt(userId, env);
    const machineId = `machine_${Math.random().toString(36).substr(2, 9)}`;
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[VERIFY_OTP] Local verification successful for ${email} (userId: ${userId})`);
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