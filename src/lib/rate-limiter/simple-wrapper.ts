/**
 * Simple rate limiting wrapper that works with Next.js App Router
 * Uses Redis for distributed rate limiting with in-memory fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRateLimiter } from './redis-limiter';

export interface RateLimitConfig {
  limit: number;          // Max requests per window
  windowMs: number;       // Time window in milliseconds
  keyGenerator?: (req: NextRequest) => Promise<string> | string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

/**
 * Default key generator - uses IP address and optionally user ID
 */
async function defaultKeyGenerator(req: NextRequest): Promise<string> {
  // Try to get IP from various headers
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0] || realIp || '127.0.0.1';
  
  // For authenticated requests, include user ID
  const auth = req.headers.get('authorization');
  if (auth) {
    // Simple hash of auth token to create a unique key
    const hash = auth.slice(-10);
    return `${ip}:${hash}`;
  }
  
  return ip;
}

/**
 * Apply rate limiting to an API route
 * 
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const rateLimitResult = await checkRateLimit(request, {
 *     limit: 10,
 *     windowMs: 60 * 1000, // 1 minute
 *   });
 * 
 *   if (!rateLimitResult.allowed) {
 *     return rateLimitResult.response;
 *   }
 * 
 *   // Your handler logic here
 *   return NextResponse.json({ success: true });
 * }
 * ```
 */
export async function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; response?: NextResponse; headers: Record<string, string> }> {
  const limiter = getRateLimiter();
  const key = await (config.keyGenerator || defaultKeyGenerator)(request);
  
  const result = await limiter.checkLimit(
    key,
    config.limit,
    config.windowMs
  );
  
  // Always include rate limit headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': config.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
  };
  
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
    headers['Retry-After'] = retryAfter.toString();
    
    const response = NextResponse.json(
      {
        error: config.message || 'Too many requests, please try again later.',
        retryAfter,
      },
      { 
        status: 429,
        headers 
      }
    );
    
    return { allowed: false, response, headers };
  }
  
  return { allowed: true, headers };
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  // Authentication endpoints: 5 attempts per 15 minutes
  auth: {
    limit: 5,
    windowMs: 15 * 60 * 1000,
    message: 'Too many authentication attempts. Please try again later.'
  },
  
  // Chat/AI endpoints: 60 requests per minute
  chat: {
    limit: 60,
    windowMs: 60 * 1000,
    message: 'Message rate limit exceeded. Please slow down.'
  },
  
  // General API: 100 requests per minute
  api: {
    limit: 100,
    windowMs: 60 * 1000,
    message: 'API rate limit exceeded. Please try again later.'
  },
  
  // File upload: 10 uploads per hour
  upload: {
    limit: 10,
    windowMs: 60 * 60 * 1000,
    message: 'Upload limit reached. Please try again later.'
  },
  
  // Search/Read endpoints: 300 requests per minute
  read: {
    limit: 300,
    windowMs: 60 * 1000,
    message: 'Too many requests. Please try again shortly.'
  }
};