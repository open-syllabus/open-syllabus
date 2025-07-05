# Rate Limiting Implementation Guide

## Overview

Skolr uses a production-ready rate limiting system with Redis for distributed rate limiting and in-memory fallback for development/single-server deployments.

## Architecture

### Components

1. **Redis-based Rate Limiter** (`/src/lib/rate-limiter/redis-limiter.ts`)
   - Primary rate limiting using Redis for distributed systems
   - Automatic fallback to in-memory when Redis is unavailable
   - Connection resilience with retry logic

2. **Simple Wrapper** (`/src/lib/rate-limiter/simple-wrapper.ts`)
   - Easy-to-use interface for applying rate limiting
   - Predefined configurations for common use cases
   - Automatic rate limit headers in responses

## How to Apply Rate Limiting

### 1. Basic Implementation

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitPresets } from '@/lib/rate-limiter/simple-wrapper';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = await checkRateLimit(request, RateLimitPresets.api);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  // Your handler logic here
  return NextResponse.json({ success: true });
}
```

### 2. Custom Rate Limits

```typescript
const customRateLimit = await checkRateLimit(request, {
  limit: 20,                    // 20 requests
  windowMs: 5 * 60 * 1000,     // per 5 minutes
  message: 'Custom rate limit message'
});
```

### 3. Available Presets

- **`RateLimitPresets.auth`**: 5 requests per 15 minutes (for login endpoints)
- **`RateLimitPresets.chat`**: 60 requests per minute (for AI/chat endpoints)
- **`RateLimitPresets.api`**: 100 requests per minute (general API endpoints)
- **`RateLimitPresets.upload`**: 10 uploads per hour
- **`RateLimitPresets.read`**: 300 requests per minute (for read-heavy endpoints)

## Current Implementation Status

✅ **Implemented:**
- `/api/chat/[roomId]` - Chat messages (60/min)
- `/api/auth/student-pin-login` - Authentication (5/15min)
- `/api/teacher/rooms` - Room creation (100/min)

❌ **Need Rate Limiting:**
- Document upload endpoints
- Assessment endpoints
- Teacher dashboard data endpoints
- Student data access endpoints
- All other authentication endpoints

## Best Practices

1. **Choose Appropriate Limits**
   - Authentication: Very strict (5-10 per 15 minutes)
   - AI/Chat: Moderate (30-60 per minute)
   - Read operations: Relaxed (200-300 per minute)
   - Uploads: Strict (10-20 per hour)

2. **Key Generation**
   - Default uses IP + auth token hash
   - Custom key generators can be used for specific needs
   - Consider user ID for authenticated endpoints

3. **Error Messages**
   - Provide clear, helpful error messages
   - Include retry time in response
   - Don't reveal system internals

4. **Headers**
   - Always included: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
   - On 429: `Retry-After` header

## Testing Rate Limiting

### Local Testing (without Redis)
```bash
# The system will use in-memory rate limiting
npm run dev

# Test with curl
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/auth/student-pin-login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","pin_code":"1234"}'
done
```

### Production Testing (with Redis)
```bash
# Start Redis
docker run -d -p 6379:6379 redis

# Set Redis URL
export REDIS_URL=redis://localhost:6379

# Start the app
npm run dev
```

## Monitoring

Rate limit violations are logged. Monitor for:
- Frequent 429 responses (may need to adjust limits)
- Patterns of abuse
- Performance impact

## Scaling Considerations

1. **Redis Required for Multi-Server**
   - Essential for distributed deployments
   - Handles millions of requests efficiently
   - Low latency (<1ms typical)

2. **Memory Cleanup**
   - In-memory fallback auto-cleans old entries
   - Redis uses TTL for automatic cleanup

3. **Performance Impact**
   - Minimal: <5ms per request with Redis
   - In-memory even faster for single-server

## Future Enhancements

1. **Dynamic Rate Limits**
   - Different limits for different user tiers
   - Adjust based on system load

2. **Advanced Key Strategies**
   - Per-endpoint + per-user limits
   - Organization-level limits

3. **Analytics**
   - Track rate limit hits
   - Identify patterns for optimization