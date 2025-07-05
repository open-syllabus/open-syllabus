// middleware.ts
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { createServerClient } from '@supabase/ssr';
import { verifyUserMatchesUrlParam } from '@/lib/supabase/auth-helpers';
import { getCachedRole, setCachedRole } from '@/lib/cache/role-cache';
import { getRateLimiter } from '@/lib/rate-limiter/redis-limiter';

// Rate limiting configuration
const RATE_LIMITS = {
  api: { requests: 60, windowMs: 60 * 1000 }, // 60 requests per minute for API
  general: { requests: 120, windowMs: 60 * 1000 }, // 120 requests per minute for pages
  strict: { requests: 10, windowMs: 60 * 1000 }, // 10 requests per minute for sensitive endpoints
};

const rateLimiter = getRateLimiter();

export async function middleware(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Check for large headers (431 error prevention)
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader && cookieHeader.length > 4096) {
    console.warn(`[Middleware] Large cookie header detected: ${cookieHeader.length} bytes`);
    
    // For API routes, return error immediately
    if (pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Request headers too large. Please clear cookies.' },
        { status: 431 }
      );
    }
  }
  
  // RATE LIMITING - First line of defense
  if (!pathname.startsWith('/_next') && !pathname.includes('favicon.ico')) {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0]?.trim() || realIp || '127.0.0.1';
    
    const key = `${ip}:${pathname.startsWith('/api') ? 'api' : 'general'}`;
    
    // Determine rate limit based on endpoint sensitivity
    let limit = RATE_LIMITS.general;
    if (pathname.startsWith('/api')) {
      if (pathname.includes('/chat/') || 
          pathname.includes('/debug-')) {
        limit = RATE_LIMITS.strict; // Sensitive endpoints
      } else {
        limit = RATE_LIMITS.api; // Regular API endpoints (includes auth)
      }
    }
    
    // Use Redis-based rate limiter
    const { allowed, remaining, resetTime } = await rateLimiter.checkLimit(
      key,
      limit.requests,
      limit.windowMs
    );
    
    if (!allowed) {
      console.warn(`[Rate Limit] Blocked request from ${ip} to ${pathname}`);
      return new NextResponse('Rate limit exceeded', { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': limit.requests.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(),
        }
      });
    }
  }
  
  // Print full URL for debugging
  console.log(`[Middleware] Processing request: ${request.url}`);
  
  // HIGHEST PRIORITY: Before anything else, check if teacher is trying to access student dashboard
  // This is a blanket redirect regardless of how they got there
  try {
    // Skip this check for static assets and API routes
    if (!pathname.startsWith('/_next') && 
        !pathname.startsWith('/api') && 
        !pathname.includes('favicon.ico')) {
      
      // Create the client to check user details
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() { /* Not needed */ },
            remove() { /* Not needed */ }
          }
        }
      );
      
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // If we have a user and they're trying to access student routes
      // BUT allow teachers to preview courses/lessons
      const isStudentRoute = pathname.startsWith('/student/');
      const isPreviewingContent = pathname.includes('/courses/') && pathname.includes('/lessons/');
      
      if (user && isStudentRoute && !isPreviewingContent) {
        console.log(`[Middleware] User ${user.id} trying to access ${pathname} - checking role`);
        
        // Check cache first
        const cachedRole = getCachedRole(user.id);
        if (cachedRole === 'teacher') {
          console.log(`[Middleware] Teacher detected from cache, redirecting away from student area`);
          return NextResponse.redirect(new URL('/teacher-dashboard', request.url));
        }
        
        // If not in cache, check metadata and database
        if (cachedRole === undefined) {
          // First check if we can directly detect they are a teacher from metadata
          if (user.user_metadata?.role === 'teacher') {
            setCachedRole(user.id, 'teacher');
            console.log(`[Middleware] Teacher detected from metadata, redirecting away from student area`);
            return NextResponse.redirect(new URL('/teacher-dashboard', request.url));
          }
          
          // If not, check teacher_profiles table
          const { data: teacherProfile } = await supabase
            .from('teacher_profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (teacherProfile) {
            setCachedRole(user.id, 'teacher');
            console.log(`[Middleware] Teacher detected from teacher_profiles, redirecting away from student area`);
            return NextResponse.redirect(new URL('/teacher-dashboard', request.url));
          } else {
            // Cache as student if not a teacher
            setCachedRole(user.id, 'student');
          }
        }
      }
      
      // Special logging for teachers accessing preview content
      if (user && isStudentRoute && isPreviewingContent) {
        console.log(`[Middleware] Allowing teacher ${user.id} to preview content at ${pathname}`);
      }
      
      // Log teacher accessing teacher preview routes
      if (user && pathname.includes('/teacher-dashboard/courses/') && pathname.includes('/preview')) {
        console.log(`[Middleware] Teacher accessing preview route: ${pathname}`);
      }
      
      // NEW: Check for identity mismatch: user trying to access another user's resources
      // Only check this for routes that might have studentId or userId parameters
      const studentPathPatterns = [
        '/room/', 
        '/student/'
      ];
      
      const checkIdentityMismatch = studentPathPatterns.some(pattern => pathname.includes(pattern));
      
      if (checkIdentityMismatch && user) {
        console.log(`[Middleware] Checking identity match for route: ${pathname}`);
        
        const { authorized, redirect, user: authUser, urlUserId } = await verifyUserMatchesUrlParam(request);
        
        if (!authorized && redirect) {
          console.log(`[Middleware] Unauthorized access detected: User ${authUser?.id} attempting to access ${urlUserId} via ${pathname}`);
          
          // Log this security incident for future auditing
          if (authUser && urlUserId) {
            try {
              // You could add actual security logging here in production
              console.warn(`[SECURITY WARNING] User ${authUser.id} attempted unauthorized access to ${urlUserId}`);
            } catch (logError) {
              console.error('[Middleware] Failed to log security incident:', logError);
            }
          }
          
          return redirect;
        }
      }
    }
  } catch (error) {
    console.error('[Middleware] Error in teacher detection check:', error);
    // Continue processing if there's an error
  }
  
  // Update session first to ensure we have the latest auth state
  const response = await updateSession(request);
  
  // For normal route protection and dashboard access
  try {
    // Check for login/auth routes that shouldn't redirect
    const isAuthPage = pathname === '/auth' || pathname.startsWith('/auth/');
    const isHomePage = pathname === '/';
    const isJoinRoomPage = pathname === '/join-room' || pathname.startsWith('/room-join/');
    const isStudentAccessPage = pathname === '/student-access' || pathname === '/pin-login';
    const isPublicRoute = isAuthPage || isHomePage || pathname === '/student-login' || isJoinRoomPage || isStudentAccessPage;
    
    // Check for timestamp parameter indicating a fresh redirect
    const hasTimestamp = url.searchParams.has('_t');
    
    // For non-public routes, check authentication
    if (!isPublicRoute && !hasTimestamp) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value;
            },
            set() { /* Not needed */ },
            remove() { /* Not needed */ }
          }
        }
      );
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not authenticated, redirect to auth
        console.log(`[Middleware] User not authenticated, redirecting to /auth from ${pathname}`);
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }
  } catch (error) {
    console.error('[Middleware] Error in route protection:', error);
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Make sure to include API routes for auth session to be available everywhere
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/(.*)'
  ],
};