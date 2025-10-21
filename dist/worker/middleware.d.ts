/**
 * Module: Worker Middleware
 * Purpose: Rate limiting and JWT authentication middleware for Cloudflare Worker
 * Dependencies: jose (JWT verification), Cloudflare Workers API
 * Used by: worker.ts
 *
 * Public Endpoints (no JWT required):
 *   - /health, /api/v1/health
 *   - /auth, /api/v1/auth (for initial login)
 *   - /verify-otp, /api/v1/verify-otp (for OTP verification)
 *   - /auth/verify, /api/v1/auth/verify (for token validation)
 *   - /announcements, /api/v1/announcements (market announcements)
 *
 * All other endpoints require valid JWT Bearer token in Authorization header
 */
import { WorkerEnv } from '../shared/types.js';
export declare function checkRateLimit(env: WorkerEnv, userId: string): Promise<boolean>;
export declare function getJwtMiddleware(env: WorkerEnv): (c: any, next: any) => Promise<any>;
export declare function getRateLimitMiddleware(env: WorkerEnv): (c: any, next: any) => Promise<any>;
