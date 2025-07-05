# CSRF Protection Implementation Guide

## Overview

Skolr uses a **Double Submit Cookie** pattern for CSRF protection. This approach is simpler than synchronizer tokens while providing robust protection against cross-site request forgery attacks.

## Architecture

### How It Works

1. **Token Generation**: When a user visits the site, middleware generates a cryptographically secure random token
2. **Cookie Storage**: Token is stored as an httpOnly cookie with secure settings
3. **Header Validation**: Protected requests must include the same token in a custom header
4. **Server Verification**: Server validates that cookie and header tokens match

### Components

1. **CSRF Protection Library** (`/src/lib/csrf/protection.ts`)
   - Core CSRF validation logic
   - Token generation and validation
   - Middleware for API routes

2. **Client Utilities** (`/src/lib/csrf/client.ts`)
   - `csrfFetch`: Drop-in replacement for fetch()
   - Automatically includes CSRF token in headers
   - React hooks for token management

3. **Middleware Integration** (`/middleware.ts`)
   - Automatically generates tokens for new sessions
   - Sets secure cookies on responses

## Implementation Status

✅ **Implemented:**
- Core CSRF protection system
- Middleware token generation
- Client-side utilities
- `/api/teacher/rooms` - Room creation endpoint

❌ **Need CSRF Protection:**
- All other POST/PUT/DELETE endpoints
- Student data modification endpoints
- Assessment creation/update endpoints
- Document upload endpoints
- Settings/profile update endpoints

## How to Apply CSRF Protection

### 1. Server-Side (API Routes)

```typescript
import { withCSRFProtection, setCSRFCookie } from '@/lib/csrf/protection';

export async function POST(request: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await withCSRFProtection(request);
  if (csrfResult.error) {
    return csrfResult.response!;
  }
  
  // Your handler logic here
  const response = NextResponse.json({ success: true });
  
  // Set new token if needed (optional)
  if (csrfResult.newToken) {
    setCSRFCookie(response, csrfResult.newToken);
  }
  
  return response;
}
```

### 2. Client-Side (React Components)

Replace `fetch` with `csrfFetch`:

```typescript
import { csrfFetch } from '@/lib/csrf/client';

// Before:
const response = await fetch('/api/teacher/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});

// After:
const response = await csrfFetch('/api/teacher/rooms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data)
});
```

### 3. Using React Hook (Alternative)

```typescript
import { useCSRFetch } from '@/lib/csrf/client';

function MyComponent() {
  const csrfFetch = useCSRFetch();
  
  const handleSubmit = async () => {
    const response = await csrfFetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };
}
```

## Security Settings

### Cookie Configuration

- **Name**: `__Host-csrf` (using __Host- prefix for enhanced security)
- **HttpOnly**: Yes (prevents JavaScript access)
- **Secure**: Yes in production (HTTPS only)
- **SameSite**: Strict (prevents cross-site submission)
- **Path**: / (available site-wide)
- **Max-Age**: 86400 seconds (24 hours)

### Token Properties

- **Length**: 32 bytes (256 bits)
- **Generation**: crypto.randomBytes (cryptographically secure)
- **Comparison**: Constant-time to prevent timing attacks

## Exempt Endpoints

The following endpoints are exempt from CSRF protection:
- `/api/health` - Health checks
- `/api/auth/callback` - OAuth callbacks

## Testing CSRF Protection

### Manual Testing

1. **Valid Request** (should succeed):
```bash
# First, get a CSRF token by visiting the site
# Then use the token in your request:
curl -X POST http://localhost:3000/api/teacher/rooms \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: <token-from-cookie>" \
  -H "Cookie: __Host-csrf=<same-token>" \
  -d '{"room_name": "Test Room"}'
```

2. **Invalid Request** (should fail with 403):
```bash
# Missing CSRF header
curl -X POST http://localhost:3000/api/teacher/rooms \
  -H "Content-Type: application/json" \
  -d '{"room_name": "Test Room"}'
```

### Automated Testing

```typescript
// Example test
it('should reject requests without CSRF token', async () => {
  const response = await fetch('/api/teacher/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_name: 'Test' })
  });
  
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({
    error: 'CSRF validation failed'
  });
});
```

## Common Issues & Solutions

### 1. "CSRF validation failed" errors

**Cause**: Token mismatch or missing token
**Solution**: 
- Ensure using `csrfFetch` on client
- Check cookies are enabled
- Verify not blocking httpOnly cookies

### 2. Token not being set

**Cause**: Middleware not running
**Solution**:
- Check middleware matcher config
- Ensure visiting non-API route first
- Token only set on page visits, not API calls

### 3. Cross-domain issues

**Cause**: CSRF tokens are domain-specific
**Solution**:
- Use same domain for frontend and API
- Configure proper CORS if needed
- Consider proxy setup for development

## Best Practices

1. **Always use csrfFetch**: Don't bypass CSRF protection
2. **Don't disable for convenience**: Security > convenience
3. **Monitor 403 errors**: May indicate attack attempts
4. **Rotate tokens**: Consider rotating on sensitive operations
5. **Log failures**: Track potential security incidents

## Future Enhancements

1. **Per-form tokens**: Generate unique tokens for critical forms
2. **Token rotation**: Rotate tokens after successful submissions
3. **Rate limit integration**: Combine with rate limiting for defense in depth
4. **Monitoring dashboard**: Track CSRF validation failures

## Migration Checklist

When adding CSRF to an endpoint:

- [ ] Import withCSRFProtection
- [ ] Add CSRF check at start of handler
- [ ] Update all client code to use csrfFetch
- [ ] Test both success and failure cases
- [ ] Update API documentation
- [ ] Monitor for increased 403 errors after deployment