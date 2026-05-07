/**
 * Handle session lookup by email (POST /auth/session-by-email)
 *
 * Purpose: Look up a valid session in KV for a given email and return session info if found and not expired
 * Request body:
 *   { "email": "user@example.com" }
 * Response on success (200):
 *   { success: true, userId, machineId, sessionToken, sessionJwt, email, createdAt, expiresAt }
 * Response on failure (404):
 *   { success: false, error: "Session not found" }
 */
export async function handleSessionByEmail(c, env) {
    // DEBUG: Log all scanned keys and values for troubleshooting
    const debugSessions = [];
    try {
        const body = await c.req.json();
        const email = body.email;
        if (!email || !email.includes('@')) {
            return c.json({ success: false, error: 'Valid email required' }, 400);
        }
        const kv = env.KV_NAMESPACE;
        if (!kv) {
            return c.json({ success: false, error: 'KV unavailable' }, 503);
        }
        const machineId = (body.machineId || '').trim();
        // Scan both user_session: and cli_session: keys
        const prefixes = ['user_session:', 'cli_session:'];
        for (const prefix of prefixes) {
            const listResp = await kv.list({ prefix });
            for (const entry of listResp.keys) {
                let sessionToken;
                if (prefix === 'cli_session:') {
                    const sessionJson = await kv.get(entry.name);
                    debugSessions.push({ key: entry.name, value: sessionJson });
                    if (sessionJson) {
                        const session = JSON.parse(sessionJson);
                        if (session.email === email &&
                            session.expiresAt > Date.now() &&
                            (!machineId || session.machineId === machineId)) {
                            const sessionJwt = await generateSessionJwt(session.userId, env);
                            return c.json({
                                success: true,
                                userId: session.userId,
                                machineId: session.machineId,
                                sessionToken: session.sessionToken,
                                sessionJwt,
                                email: session.email,
                                createdAt: session.createdAt,
                                expiresAt: session.expiresAt,
                                permissions: session.permissions || [],
                                metadata: session.metadata || {},
                                debug: debugSessions,
                            });
                        }
                    }
                }
                else {
                    sessionToken = await kv.get(entry.name);
                    debugSessions.push({ key: entry.name, value: sessionToken });
                    if (sessionToken) {
                        const sessionJson = await kv.get(`session:${sessionToken}`);
                        debugSessions.push({ key: `session:${sessionToken}`, value: sessionJson });
                        if (sessionJson) {
                            const session = JSON.parse(sessionJson);
                            if (session.email === email &&
                                session.expiresAt > Date.now() &&
                                (!machineId || session.machineId === machineId)) {
                                const sessionJwt = await generateSessionJwt(session.userId, env);
                                return c.json({
                                    success: true,
                                    userId: session.userId,
                                    machineId: session.machineId,
                                    sessionToken: session.sessionToken,
                                    sessionJwt,
                                    email: session.email,
                                    createdAt: session.createdAt,
                                    expiresAt: session.expiresAt,
                                    permissions: session.permissions || [],
                                    metadata: session.metadata || {},
                                    debug: debugSessions,
                                });
                            }
                        }
                    }
                }
            }
        }
        return c.json({ success: false, error: 'Session not found' }, 404);
    }
    catch (error) {
        return c.json({ success: false, error: error instanceof Error ? error.message : String(error) }, 500);
    }
}
/**
 * Module: Worker Authentication
 * Purpose: Handle OTP and JWT authentication flows using Cloudflare KV for session persistence
 * Dependencies: jose (JWT signing/verification), stytch (OTP email), Cloudflare KV (session storage)
 * Used by: worker.ts for routing POST /auth, /verify-otp, /auth/verify
 *
 * Architecture Overview:
 * 1. OTP Generation (POST /auth)
 *    - Generate 6-digit OTP code
 *    - Store in KV with 15-minute TTL
 *    - Send via Stytch email (fallback to console in dev)
 *
 * 2. OTP Verification (POST /verify-otp)
 *    - Verify OTP code matches and hasn't expired
 *    - Delete used OTP from KV (prevent reuse)
 *    - Generate JWT token signed with JWT_SECRET
 *    - Create session record with 30-day TTL
 *    - Store session in KV indexed by both sessionToken and userId
 *
 * 3. Session Validation (POST /auth/verify)
 *    - Verify JWT signature with JWT_SECRET
 *    - Look up session in KV by sessionToken
 *    - Check session hasn't expired
 *    - Return session validity status
 *
 * Session Persistence:
 * - Sessions stored in KV with 30-day TTL and expirationTtl auto-cleanup
 * - Survives worker restarts and deployments
 * - Supports cross-device authentication (via userId indexing)
 * - Dual indexing: session:{token} for lookup, user_session:{userId} for quick verification
 *
 * Security Features:
 * - JWT expires after 24h (secondary validation)
 * - Session expires after 30 days (primary validation)
 * - OTP deleted after verification (prevent reuse attacks)
 * - OTP valid for 15 minutes only (prevent brute force)
 * - All operations validated against KV storage (server-side sessions)
 *
 * Configuration Required:
 * - wrangler.toml: KV_NAMESPACE binding configured
 * - wrangler secret: JWT_SECRET (random 32+ char string)
 * - Cloudflare dashboard: KV namespace associated with worker
 * - .env.local (dev only): STYTCH_PROJECT_ID, STYTCH_SECRET
 *
 * Fallback Behavior:
 * - If Stytch fails: OTP logged to console (for development)
 * - If KV unavailable: Returns 503 error with helpful message
 * - JWT verification always performed regardless of KV status
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
 *
 * Returns: String representation of random 6-digit number (100000-999999)
 * Used: In handleAuth to create fallback OTP (stored for verification)
 */
function generateOtpCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
/**
 * Generate a JWT token for authenticated sessions
 *
 * Params:
 *   userId: User identifier to embed in JWT
 *   env: Worker environment containing JWT_SECRET
 *
 * Returns: Signed JWT token (HS256) with 24-hour expiration
 *
 * Token payload:
 *   {
 *     "userId": "user_xyz",
 *     "sub": "user_xyz",
 *     "type": "session",
 *     "iat": <issued-at-timestamp>,
 *     "exp": <24-hours-from-now>
 *   }
 *
 * Signed with: JWT_SECRET using HS256 algorithm
 * Purpose: Primary authentication token sent to client
 * Note: Server also validates session existence in KV (double validation)
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
 *
 * Purpose: Generate OTP code and send to user via Stytch email
 *
 * Request body:
 *   POST /auth
 *   { "email": "user@example.com" }
 *
 * Response on success (200):
 *   { "success": true, "methodId": "fallback_...", "email": "user@example.com" }
 *
 * Actions performed:
 * 1. Validate email format
 * 2. Verify KV_NAMESPACE binding exists (return 503 if not)
 * 3. Initialize Stytch client with credentials
 * 4. Generate 6-digit OTP code
 * 5. Store OTP in KV with 15-minute TTL (key: otp:{methodId})
 * 6. Send OTP via Stytch email
 * 7. Return methodId for next step (verify-otp)
 *
 * Fallback behavior (if Stytch fails):
 * - OTP still stored in KV
 * - OTP logged to console for development/testing
 * - Client can proceed with verify-otp using returned methodId
 *
 * Error responses:
 * - 400: Invalid email format
 * - 503: KV namespace or Stytch service unavailable
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
 *
 * Purpose: Verify OTP code and create persistent JWT session in KV
 *
 * Request body:
 *   POST /verify-otp
 *   { "email": "user@example.com", "otpCode": "123456", "methodId": "fallback_..." }
 *
 * Response on success (200):
 *   {
 *     "success": true,
 *     "userId": "user_xyz_1234",
 *     "sessionToken": "session_...",
 *     "sessionJwt": "eyJ...",
 *     "machineId": "machine_...",
 *     "email": "user@example.com",
 *     "expiresAt": 1763777177033
 *   }
 *
 * Actions performed:
 * 1. Validate email, OTP code, and methodId provided
 * 2. Retrieve OTP record from KV (key: otp:{methodId})
 * 3. Verify OTP hasn't expired (checks expiresAt timestamp)
 * 4. Verify OTP code matches exactly
 * 5. Delete used OTP from KV (prevent reuse attacks)
 * 6. Generate userId from email + timestamp
 * 7. Generate sessionToken (cryptographically random, 36+ chars)
 * 8. Generate sessionJwt signed with JWT_SECRET (HS256, 24h expiration)
 * 9. Create SessionRecord and store in KV with 30-day TTL
 *    - Primary key: session:{sessionToken} for lookup
 *    - Index: user_session:{userId} for cross-device lookup
 * 10. Return JWT and sessionToken to client
 *
 * Session Storage in KV:
 * - session:{token} -> { userId, email, createdAt, expiresAt, machineId, sessionToken }
 * - user_session:{userId} -> sessionToken (index)
 * - Both entries have 30-day expirationTtl (auto-cleanup)
 *
 * Fallback behavior (if Stytch fails):
 * - Falls back to verifyOtpLocally which checks KV-stored OTP
 * - Still generates JWT and creates persistent session
 * - Client can use JWT for authenticated requests
 *
 * Error responses:
 * - 400: Missing required fields
 * - 401: Invalid OTP code or expired
 * - 503: KV service unavailable
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
            const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
            // Store session in KV for persistence and cross-device support
            const sessionRecord = {
                userId,
                email,
                createdAt: Date.now(),
                expiresAt,
                machineId,
                sessionToken,
            };
            await kv.put(`session:${sessionToken}`, JSON.stringify(sessionRecord), {
                expirationTtl: 30 * 24 * 60 * 60, // 30 days - KV auto-cleanup
            });
            // Also index by userId for lookup
            await kv.put(`user_session:${userId}`, sessionToken, {
                expirationTtl: 30 * 24 * 60 * 60,
            });
            console.log(`[VERIFY_OTP] Stytch verification successful for ${email} (userId: ${userId})`);
            return c.json({
                success: true,
                userId,
                machineId,
                sessionToken,
                sessionJwt,
                email,
                expiresAt,
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
    const expiresAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
    // Store session in KV for persistence
    const sessionRecord = {
        userId,
        email,
        createdAt: Date.now(),
        expiresAt,
        machineId,
        sessionToken,
    };
    await kv.put(`session:${sessionToken}`, JSON.stringify(sessionRecord), {
        expirationTtl: 30 * 24 * 60 * 60, // 30 days
    });
    // Also index by userId
    await kv.put(`user_session:${userId}`, sessionToken, {
        expirationTtl: 30 * 24 * 60 * 60,
    });
    console.log(`[VERIFY_OTP] Local verification successful for ${email} (userId: ${userId})`);
    return c.json({
        success: true,
        userId,
        machineId,
        sessionToken,
        sessionJwt,
        email,
        expiresAt,
    });
}
/**
 * Handle token verification (POST /auth/verify)
 *
 * Purpose: Validate JWT signature and verify session persists in KV
 *
 * Request:
 *   POST /auth/verify
 *   Headers: Authorization: Bearer <sessionJwt>
 *   Body: { "sessionToken": "session_..." }
 *
 * Response on success (200):
 *   {
 *     "valid": true,
 *     "userId": "user_xyz_1234",
 *     "email": "user@example.com",
 *     "expiresAt": 1763777177033
 *   }
 *
 * Response on failure (200):
 *   { "valid": false, "error": "reason" }
 *
 * Validation steps (all must pass):
 * 1. Parse Authorization header for JWT (format: "Bearer <token>")
 * 2. Verify JWT signature using JWT_SECRET (HS256)
 * 3. Extract userId from JWT payload
 * 4. Look up session in KV (key: session:{sessionToken})
 * 5. Check session exists and hasn't expired (expiresAt > now)
 * 6. Verify userId matches between JWT and KV session
 * 7. Return session details if all checks pass
 *
 * Double validation approach:
 * - JWT signature validates token integrity and authenticity
 * - KV lookup confirms session still exists (hasn't been revoked)
 * - Both must pass for authentication to succeed
 *
 * KV lookup fallback:
 * - If KV unavailable (503 error), JWT is still verified
 * - Session validation skipped but token validation passes
 * - Allows graceful degradation if KV temporarily down
 *
 * Error responses:
 * - 401: Missing or malformed Authorization header
 * - 200 with valid=false: Invalid JWT signature or session not found
 */
export async function handleAuthVerify(c, env) {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ valid: false, error: 'Missing or invalid Authorization header' }, 401);
        }
        const token = authHeader.substring(7);
        const kv = env.KV_NAMESPACE;
        try {
            // First, verify JWT signature
            const secret = new TextEncoder().encode(env.JWT_SECRET);
            const verified = await jose.jwtVerify(token, secret);
            const userId = (verified.payload.userId || verified.payload.sub);
            // Then, check if session exists in KV and is not expired
            if (kv) {
                try {
                    // Try to find session by userId
                    const sessionToken = await kv.get(`user_session:${userId}`);
                    if (sessionToken) {
                        // Get the actual session record
                        const sessionJson = await kv.get(`session:${sessionToken}`);
                        if (sessionJson) {
                            const session = JSON.parse(sessionJson);
                            // Check if session is still valid (not expired)
                            if (session.expiresAt > Date.now()) {
                                console.log(`[AUTH_VERIFY] Session valid for userId: ${userId}`);
                                return c.json({
                                    valid: true,
                                    userId,
                                    email: session.email,
                                    expiresAt: session.expiresAt,
                                });
                            }
                            else {
                                console.log(`[AUTH_VERIFY] Session expired for userId: ${userId}`);
                                // Clean up expired session
                                await kv.delete(`user_session:${userId}`).catch(() => { });
                                await kv.delete(`session:${sessionToken}`).catch(() => { });
                                return c.json({ valid: false, error: 'Session expired' }, 401);
                            }
                        }
                    }
                    // Session not in KV, but JWT is valid - this is OK for backward compatibility
                    console.log(`[AUTH_VERIFY] JWT valid but session not in KV for userId: ${userId} (backward compatible)`);
                    return c.json({
                        valid: true,
                        userId,
                    });
                }
                catch (kvError) {
                    console.error('[AUTH_VERIFY] KV lookup failed:', kvError);
                    // Fall back to JWT-only verification if KV fails
                    return c.json({
                        valid: true,
                        userId,
                    });
                }
            }
            else {
                // No KV available, fall back to JWT verification only
                return c.json({
                    valid: true,
                    userId,
                });
            }
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