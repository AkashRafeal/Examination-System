/**
 * High-performance In-Memory Sliding Window Rate Limiter.
 * Zero external infrastructure required; ideal for single-node high-concurrency production deployments.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const store = new Map<string, RateLimitRecord>();

// Cleanup stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 120000);
      if (record.timestamps.length === 0) {
        store.delete(key);
      }
    }
  }, 300000);
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const windowStart = now - options.windowMs;

  let record = store.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    store.set(identifier, record);
  }

  // Filter timestamps within current window
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= options.limit) {
    const oldest = record.timestamps[0] || now;
    const resetMs = Math.max(0, oldest + options.windowMs - now);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);

  return {
    allowed: true,
    remaining: options.limit - record.timestamps.length,
    resetMs: options.windowMs,
  };
}
