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
const QUEUE_TTL = 3600; // 1 hour
const QUEUE_PREFIX = 'queue:';
const MAX_QUEUE_SIZE = 100;
export class RequestQueue {
    kvNamespace;
    env;
    constructor(env) {
        this.env = env;
        this.kvNamespace = env.KV_NAMESPACE;
    }
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
    async enqueue(userId, path, method, body) {
        const requestId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const queueKey = `${QUEUE_PREFIX}${userId}:queue`;
        const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
        const queuedRequest = {
            id: requestId,
            userId,
            path,
            method,
            body,
            timestamp: Date.now(),
            status: 'pending',
        };
        try {
            // Get current queue
            const queueStr = await this.kvNamespace.get(queueKey);
            const queue = queueStr ? JSON.parse(queueStr) : [];
            // Check queue size limit
            if (queue.length >= MAX_QUEUE_SIZE) {
                throw new Error(`Queue full for user ${userId}. Maximum ${MAX_QUEUE_SIZE} requests allowed.`);
            }
            // Add to queue
            queue.push(requestId);
            await this.kvNamespace.put(queueKey, JSON.stringify(queue), { expirationTtl: QUEUE_TTL });
            // Store request details
            await this.kvNamespace.put(entryKey, JSON.stringify(queuedRequest), { expirationTtl: QUEUE_TTL });
            console.log(`[QUEUE] Request ${requestId} enqueued for user ${userId}. Queue size: ${queue.length}`);
            return requestId;
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to enqueue request:', error);
            throw error;
        }
    }
    /**
     * Get the next request from a user's queue
     * Purpose: Retrieve next pending request for processing
     * Args:
     *   userId: User identifier
     * Returns: Next queued request or null if queue is empty
     */
    async dequeue(userId) {
        const queueKey = `${QUEUE_PREFIX}${userId}:queue`;
        try {
            const queueStr = await this.kvNamespace.get(queueKey);
            if (!queueStr) {
                return null;
            }
            const queue = JSON.parse(queueStr);
            if (queue.length === 0) {
                return null;
            }
            // Get first item
            const requestId = queue[0];
            const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
            const requestStr = await this.kvNamespace.get(entryKey);
            if (!requestStr) {
                // Clean up invalid queue entry
                queue.shift();
                await this.kvNamespace.put(queueKey, JSON.stringify(queue), { expirationTtl: QUEUE_TTL });
                return this.dequeue(userId); // Recursive call to get next valid request
            }
            const request = JSON.parse(requestStr);
            return request;
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to dequeue request:', error);
            throw error;
        }
    }
    /**
     * Remove request from queue after processing
     * Purpose: Clean up completed or failed requests from queue
     * Args:
     *   userId: User identifier
     *   requestId: ID of request to remove
     */
    async removeFromQueue(userId, requestId) {
        const queueKey = `${QUEUE_PREFIX}${userId}:queue`;
        const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
        try {
            const queueStr = await this.kvNamespace.get(queueKey);
            if (!queueStr) {
                return;
            }
            const queue = JSON.parse(queueStr);
            const index = queue.indexOf(requestId);
            if (index > -1) {
                queue.splice(index, 1);
                await this.kvNamespace.put(queueKey, JSON.stringify(queue), { expirationTtl: QUEUE_TTL });
            }
            // Delete request details
            await this.kvNamespace.delete(entryKey);
            console.log(`[QUEUE] Request ${requestId} removed from queue for user ${userId}`);
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to remove request from queue:', error);
            throw error;
        }
    }
    /**
     * Mark request as processing
     * Purpose: Update request status to indicate it's being handled
     * Args:
     *   userId: User identifier
     *   requestId: ID of request to update
     */
    async markProcessing(userId, requestId) {
        const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
        try {
            const requestStr = await this.kvNamespace.get(entryKey);
            if (!requestStr) {
                throw new Error(`Request ${requestId} not found`);
            }
            const request = JSON.parse(requestStr);
            request.status = 'processing';
            await this.kvNamespace.put(entryKey, JSON.stringify(request), { expirationTtl: QUEUE_TTL });
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to mark request as processing:', error);
            throw error;
        }
    }
    /**
     * Mark request as completed with result
     * Purpose: Store completion status and result for retrieval
     * Args:
     *   userId: User identifier
     *   requestId: ID of request
     *   result: Result data to store
     */
    async markCompleted(userId, requestId, result) {
        const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
        try {
            const requestStr = await this.kvNamespace.get(entryKey);
            if (!requestStr) {
                throw new Error(`Request ${requestId} not found`);
            }
            const request = JSON.parse(requestStr);
            request.status = 'completed';
            request.result = result;
            await this.kvNamespace.put(entryKey, JSON.stringify(request), { expirationTtl: QUEUE_TTL });
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to mark request as completed:', error);
            throw error;
        }
    }
    /**
     * Mark request as failed with error message
     * Purpose: Store failure status and error details for debugging
     * Args:
     *   userId: User identifier
     *   requestId: ID of request
     *   error: Error message or Error object
     */
    async markFailed(userId, requestId, error) {
        const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
        try {
            const requestStr = await this.kvNamespace.get(entryKey);
            if (!requestStr) {
                throw new Error(`Request ${requestId} not found`);
            }
            const request = JSON.parse(requestStr);
            request.status = 'failed';
            request.error = error instanceof Error ? error.message : String(error);
            await this.kvNamespace.put(entryKey, JSON.stringify(request), { expirationTtl: QUEUE_TTL });
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to mark request as failed:', error);
            throw error;
        }
    }
    /**
     * Get request status by ID
     * Purpose: Retrieve current status and result of queued request
     * Args:
     *   userId: User identifier
     *   requestId: ID of request to check
     * Returns: Request object with current status and result/error
     */
    async getRequestStatus(userId, requestId) {
        const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
        try {
            const requestStr = await this.kvNamespace.get(entryKey);
            if (!requestStr) {
                return null;
            }
            return JSON.parse(requestStr);
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to get request status:', error);
            throw error;
        }
    }
    /**
     * Get queue statistics for a user
     * Purpose: Retrieve overview of user's queue state
     * Args:
     *   userId: User identifier
     * Returns: Statistics object with request counts by status
     */
    async getQueueStats(userId) {
        const queueKey = `${QUEUE_PREFIX}${userId}:queue`;
        try {
            const queueStr = await this.kvNamespace.get(queueKey);
            const queue = queueStr ? JSON.parse(queueStr) : [];
            let pendingCount = 0;
            let processingCount = 0;
            let completedCount = 0;
            let failedCount = 0;
            // Count requests by status
            for (const requestId of queue) {
                const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
                const requestStr = await this.kvNamespace.get(entryKey);
                if (requestStr) {
                    const request = JSON.parse(requestStr);
                    switch (request.status) {
                        case 'pending':
                            pendingCount++;
                            break;
                        case 'processing':
                            processingCount++;
                            break;
                        case 'completed':
                            completedCount++;
                            break;
                        case 'failed':
                            failedCount++;
                            break;
                    }
                }
            }
            return {
                userId,
                totalRequests: queue.length,
                pendingRequests: pendingCount,
                processingRequests: processingCount,
                completedRequests: completedCount,
                failedRequests: failedCount,
            };
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to get queue stats:', error);
            throw error;
        }
    }
    /**
     * Clear all completed and failed requests from user's queue
     * Purpose: Clean up finished requests to keep queue organized
     * Args:
     *   userId: User identifier
     */
    async clearCompleted(userId) {
        const queueKey = `${QUEUE_PREFIX}${userId}:queue`;
        try {
            const queueStr = await this.kvNamespace.get(queueKey);
            if (!queueStr) {
                return 0;
            }
            let queue = JSON.parse(queueStr);
            const originalLength = queue.length;
            // Filter out completed and failed requests
            queue = queue.filter(async (requestId) => {
                const entryKey = `${QUEUE_PREFIX}${userId}:${requestId}`;
                const requestStr = await this.kvNamespace.get(entryKey);
                if (requestStr) {
                    const request = JSON.parse(requestStr);
                    if (request.status === 'completed' || request.status === 'failed') {
                        await this.kvNamespace.delete(entryKey);
                        return false;
                    }
                }
                return true;
            });
            if (queue.length !== originalLength) {
                await this.kvNamespace.put(queueKey, JSON.stringify(queue), { expirationTtl: QUEUE_TTL });
            }
            const removedCount = originalLength - queue.length;
            console.log(`[QUEUE] Cleared ${removedCount} completed/failed requests for user ${userId}`);
            return removedCount;
        }
        catch (error) {
            console.error('[QUEUE ERROR] Failed to clear completed requests:', error);
            throw error;
        }
    }
}
/**
 * Create a global queue instance for use in worker
 * Purpose: Factory function to initialize RequestQueue with environment
 * Args:
 *   env: Worker environment with KV namespace
 * Returns: RequestQueue instance
 */
export function createQueue(env) {
    return new RequestQueue(env);
}
//# sourceMappingURL=queue.js.map