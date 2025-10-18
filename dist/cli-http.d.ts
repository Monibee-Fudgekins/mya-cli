#!/usr/bin/env node
/**
 * Module: MYA CLI - HTTP Client
 * Purpose: Main CLI entry point for MYA trading platform
 * Dependencies: commander (CLI), chalk (colors), ora (spinners), modules in cli/ and shared/
 * Used by: CLI users, bin/mya.cjs
 *
 * This is the main CLI orchestrator that handles all user commands.
 * Business logic is split into modules in cli/ for easier maintenance:
 * - cli/auth.ts - Authentication and session validation
 * - cli/session.ts - Session persistence and config
 * - cli/api-client.ts - HTTP API communication
 * - cli/analysis.ts - Analysis request handling
 * - cli/display.ts - Result formatting and display
 * - cli/market.ts - Market utilities and timestamps
 */
export {};
