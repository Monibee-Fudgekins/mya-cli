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
import { WorkerEnv } from '../shared/types.js';
/**
 * Handle authentication request (POST /auth)
 * Generates OTP and stores it in KV
 * In production, this would send OTP via email
 */
export declare function handleAuth(c: any, env: WorkerEnv): Promise<Response>;
/**
 * Handle OTP verification (POST /verify-otp)
 * Verifies OTP code and creates JWT session
 */
export declare function handleVerifyOtp(c: any, env: WorkerEnv): Promise<Response>;
/**
 * Handle token verification (POST /auth/verify)
 * Validates JWT token from Authorization header
 */
export declare function handleAuthVerify(c: any, env: WorkerEnv): Promise<Response>;
