import Redis from 'ioredis';

// Redis-based rate limiter for production scale
export class RedisRateLimiter {
  private redis: Redis | null = null;
  private fallbackMap = new Map<string, { count: number; resetTime: number; blockUntil?: number }>();

  constructor() {
    // Only initialize Redis if URL is provided
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 100, 3000);
          }
        });

        this.redis.on('error', (err) => {
          console.error('[Redis Rate Limiter] Error:', err);
          // Fall back to in-memory on Redis errors
        });

        this.redis.on('connect', () => {
          console.log('[Redis Rate Limiter] Connected to Redis');
        });
      } catch (err) {
        console.error('[Redis Rate Limiter] Failed to initialize:', err);
      }
    }
  }

  async checkLimit(
    key: string, 
    limit: number, 
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const window = Math.floor(now / windowMs);
    const redisKey = `rate:${key}:${window}`;

    // Try Redis first
    if (this.redis) {
      try {
        const pipeline = this.redis.pipeline();
        pipeline.incr(redisKey);
        pipeline.expire(redisKey, Math.ceil(windowMs / 1000));
        const results = await pipeline.exec();
        
        if (results && results[0] && results[0][1]) {
          const count = results[0][1] as number;
          const allowed = count <= limit;
          const resetTime = (window + 1) * windowMs;
          
          return {
            allowed,
            remaining: Math.max(0, limit - count),
            resetTime
          };
        }
      } catch (err) {
        console.error('[Redis Rate Limiter] Redis error, falling back:', err);
      }
    }

    // Fallback to in-memory
    return this.checkLimitInMemory(key, limit, windowMs);
  }

  private checkLimitInMemory(
    key: string, 
    limit: number, 
    windowMs: number
  ): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    let data = this.fallbackMap.get(key);

    if (!data || now > data.resetTime) {
      data = { count: 0, resetTime: now + windowMs };
      this.fallbackMap.set(key, data);
    }

    data.count++;
    const allowed = data.count <= limit;
    
    // Clean up old entries periodically
    if (this.fallbackMap.size > 10000) {
      const cutoff = now - windowMs;
      for (const [k, v] of this.fallbackMap.entries()) {
        if (v.resetTime < cutoff) {
          this.fallbackMap.delete(k);
        }
      }
    }

    return {
      allowed,
      remaining: Math.max(0, limit - data.count),
      resetTime: data.resetTime
    };
  }

  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Singleton instance
let rateLimiter: RedisRateLimiter | null = null;

export function getRateLimiter(): RedisRateLimiter {
  if (!rateLimiter) {
    rateLimiter = new RedisRateLimiter();
  }
  return rateLimiter;
}