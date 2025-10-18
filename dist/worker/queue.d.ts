/**
 * Module: Worker Request Queue
 * Purpose: FIFO queue system for handling multiple concurrent requests sequentially
 * Dependencies: Cloudflare Workers KV namespace, types from shared/types.ts
 * Used by: worker.ts routes, proxy.ts for queued requests
 *
 * Implements a First-In-First-Out (FIFO) queue using Cloudflare KV storage.
 * Allows processing requests sequentially to avoid overwhelming the backend.
 * Each user has their own queue to prevent cross-user blocking.
 * Queue keys are stored with TTL to auto-cleanup abandoned requests.
 *
 * Configuration:
 * - QUEUE_TTL: Time-to-live for queue entries (default: 3600 seconds = 1 hour)
 * - QUEUE_PREFIX: KV key prefix for queue entries (default: 'queue:')
 * - MAX_QUEUE_SIZE: Maximum requests per user queue (default: 100)
 */
import { WorkerEnv } from '../shared/types.js';
interface QueuedRequest {
    id: string;
    userId: string;
    path: string;
    method: string;
    body?: string;
    timestamp: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: any;
    error?: string;
}
interface QueueStats {
    userId: string;
    totalRequests: number;
    pendingRequests: number;
    processingRequests: number;
    completedRequests: number;
    failedRequests: number;
}
export declare class RequestQueue {
    private kvNamespace;
    private env;
    constructor(env: WorkerEnv);
    /**
     * Add a request to the queue for a specific user
     * Purpose: Store incoming request in FIFO queue
     * Args:
     *   userId: User identifier for queue isolation
     *   path: Request path (e.g., /api/v1/analyze)
     *   method: HTTP method (GET, POST, etc)
     *   body: Optional request body as string
     * Returns: Queue entry ID for tracking
     * Raises: Error if queue is full or KV operation fails
     */
    enqueue(userId: string, path: string, method: string, body?: string): Promise<string>;
    /**
     * Get the next request from a user's queue
     * Purpose: Retrieve next pending request for processing
     * Args:
     *   userId: User identifier
     * Returns: Next queued request or null if queue is empty
     */
    dequeue(userId: string): Promise<QueuedRequest | null>;
    /**
     * Remove request from queue after processing
     * Purpose: Clean up completed or failed requests from queue
     * Args:
     *   userId: User identifier
     *   requestId: ID of request to remove
     */
    removeFromQueue(userId: string, requestId: string): Promise<void>;
    /**
     * Mark request as processing
     * Purpose: Update request status to indicate it's being handled
     * Args:
     *   userId: User identifier
     *   requestId: ID of request to update
     */
    markProcessing(userId: string, requestId: string): Promise<void>;
    /**
     * Mark request as completed with result
     * Purpose: Store completion status and result for retrieval
     * Args:
     *   userId: User identifier
     *   requestId: ID of request
     *   result: Result data to store
     */
    markCompleted(userId: string, requestId: string, result: any): Promise<void>;
    /**
     * Mark request as failed with error message
     * Purpose: Store failure status and error details for debugging
     * Args:
     *   userId: User identifier
     *   requestId: ID of request
     *   error: Error message or Error object
     */
    markFailed(userId: string, requestId: string, error: any): Promise<void>;
    /**
     * Get request status by ID
     * Purpose: Retrieve current status and result of queued request
     * Args:
     *   userId: User identifier
     *   requestId: ID of request to check
     * Returns: Request object with current status and result/error
     */
    getRequestStatus(userId: string, requestId: string): Promise<QueuedRequest | null>;
    /**
     * Get queue statistics for a user
     * Purpose: Retrieve overview of user's queue state
     * Args:
     *   userId: User identifier
     * Returns: Statistics object with request counts by status
     */
    getQueueStats(userId: string): Promise<QueueStats>;
    /**
     * Clear all completed and failed requests from user's queue
     * Purpose: Clean up finished requests to keep queue organized
     * Args:
     *   userId: User identifier
     */
    clearCompleted(userId: string): Promise<number>;
}
/**
 * Create a global queue instance for use in worker
 * Purpose: Factory function to initialize RequestQueue with environment
 * Args:
 *   env: Worker environment with KV namespace
 * Returns: RequestQueue instance
 */
export declare function createQueue(env: WorkerEnv): RequestQueue;
export {};
