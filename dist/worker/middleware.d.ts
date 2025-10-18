/**
 * Module: Worker Middleware
 * Purpose: Rate limiting and JWT authentication middleware for Cloudflare Worker
 * Dependencies: jose (JWT verification), Cloudflare Workers API
 * Used by: worker.ts
 */
import { WorkerEnv } from '../shared/types.js';
export declare function checkRateLimit(env: WorkerEnv, userId: string): Promise<boolean>;
export declare function getJwtMiddleware(env: WorkerEnv): (c: any, next: any) => Promise<any>;
export declare function getRateLimitMiddleware(env: WorkerEnv): (c: any, next: any) => Promise<any>;
