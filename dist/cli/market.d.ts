/**
 * Module: CLI Market Utilities
 * Purpose: Market hours checking, timezone handling, and system status fetching
 * Dependencies: apiRequest from api-client.ts, loadSession from session.ts
 * Used by: cli-http.ts, display.ts
 */
import { SystemStatus } from '../shared/types.js';
export declare function getETParts(): {
    day: number;
    hour: number;
    minute: number;
    tzAbbr: string;
};
export declare function isMarketHours(): boolean;
export declare function getMarketStatusMessage(): string;
export declare function fetchSystemStatus(): Promise<SystemStatus | null>;
export declare function getHuggingFaceFreshness(): Promise<void>;
