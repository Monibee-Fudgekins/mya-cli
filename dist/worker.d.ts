/**
 * Module: MYA API Gateway
 * Purpose: Cloudflare Worker proxy gateway for MYA CLI requests to mya-LLM backend
 * Dependencies: hono (web framework), middleware (JWT, rate limiting), proxy (request forwarding)
 * Used by: MYA CLI (cli-http.ts), directly accessed by end users
 *
 * Simplified Cloudflare Worker that acts as a gateway/proxy for CLI requests.
 * Forwards all requests to the mya-LLM Python agent for processing.
 * Handles authentication, rate limiting, and CORS headers.
 *
 * Configuration: Required Secrets
 * - JWT_SECRET: Secret key for JWT token verification. Set with: wrangler secret put JWT_SECRET --env [env]
 * - MYA_LLM_URL: Backend LLM service URL. Set with: wrangler secret put MYA_LLM_URL --env [env]
 *
 * Architecture:
 * - JWT validation via middleware from worker/middleware.ts
 * - Rate limiting per user based on KV storage
 * - Request forwarding to MYA_LLM_URL backend via worker/proxy.ts
 * - CORS headers for CLI client
 *
 * All AI processing, market data fetching, and analysis happens in mya-llm.
 */
import { Hono } from 'hono';
import { WorkerEnv, HonoContext } from './shared/types.js';
declare const app: Hono<{
    Bindings: WorkerEnv;
    Variables: HonoContext;
}, import("hono/types").BlankSchema, "/">;
export default app;
