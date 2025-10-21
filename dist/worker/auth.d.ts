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
import { WorkerEnv } from '../shared/types.js';
/**
 * Handle authentication request (POST /auth)
 * Generates OTP and sends it via Stytch email service
 */
export declare function handleAuth(c: any, env: WorkerEnv): Promise<Response>;
/**
 * Handle OTP verification (POST /verify-otp)
 * Verifies OTP code with Stytch and creates JWT session
 */
export declare function handleVerifyOtp(c: any, env: WorkerEnv): Promise<Response>;
/**
 * Handle token verification (POST /auth/verify)
 * Validates JWT token from Authorization header
 */
export declare function handleAuthVerify(c: any, env: WorkerEnv): Promise<Response>;
