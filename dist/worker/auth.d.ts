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
export declare function handleSessionByEmail(c: any, env: WorkerEnv): Promise<Response>;
import { WorkerEnv } from '../shared/types.js';
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
export declare function handleAuth(c: any, env: WorkerEnv): Promise<Response>;
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
export declare function handleVerifyOtp(c: any, env: WorkerEnv): Promise<Response>;
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
export declare function handleAuthVerify(c: any, env: WorkerEnv): Promise<Response>;
