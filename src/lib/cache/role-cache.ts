// Role caching for middleware optimization
// This dramatically reduces database queries for role checking

interface RoleCache {
  role: 'teacher' | 'student' | null;
  expires: number;
}

// In-memory cache with TTL
const roleCache = new Map<string, RoleCache>();
const ROLE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean up expired entries every minute
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of roleCache.entries()) {
      if (now > data.expires) {
        roleCache.delete(key);
      }
    }
  }, 60 * 1000);
}

export function getCachedRole(userId: string): 'teacher' | 'student' | null | undefined {
  const cached = roleCache.get(userId);
  if (!cached) return undefined;
  
  if (Date.now() > cached.expires) {
    roleCache.delete(userId);
    return undefined;
  }
  
  return cached.role;
}

export function setCachedRole(userId: string, role: 'teacher' | 'student' | null) {
  roleCache.set(userId, {
    role,
    expires: Date.now() + ROLE_CACHE_TTL
  });
}

export function clearRoleCache(userId?: string) {
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
}

export function getRoleCacheStats() {
  return {
    size: roleCache.size,
    entries: Array.from(roleCache.entries()).map(([userId, data]) => ({
      userId: userId.substring(0, 8) + '...',
      role: data.role,
      expiresIn: Math.max(0, data.expires - Date.now())
    }))
  };
}