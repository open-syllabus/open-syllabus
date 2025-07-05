/**
 * Environment Variable Validation
 * Ensures all required environment variables are present at runtime
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  serverOnly: boolean;
  description: string;
}

const ENV_VARS: EnvVarConfig[] = [
  // Server-only API Keys (NEVER expose to client)
  {
    name: 'OPENROUTER_API_KEY',
    required: true,
    serverOnly: true,
    description: 'OpenRouter API key for AI models'
  },
  {
    name: 'PINECONE_API_KEY',
    required: true,
    serverOnly: true,
    description: 'Pinecone API key for vector database'
  },
  {
    name: 'PINECONE_INDEX_NAME',
    required: true,
    serverOnly: true,
    description: 'Pinecone index name'
  },
  {
    name: 'SUPABASE_SERVICE_ROLE_KEY',
    required: true,
    serverOnly: true,
    description: 'Supabase service role key for admin operations'
  },
  {
    name: 'RESEND_API_KEY',
    required: false,
    serverOnly: true,
    description: 'Resend API key for email notifications'
  },
  {
    name: 'REDIS_URL',
    required: false,
    serverOnly: true,
    description: 'Redis URL for queue system (optional in dev)'
  },
  {
    name: 'DIRECT_ACCESS_ADMIN_KEY',
    required: false,
    serverOnly: true,
    description: 'Admin key for direct API access'
  },
  
  // Client-safe environment variables (can be exposed)
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    required: true,
    serverOnly: false,
    description: 'Supabase project URL'
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    required: true,
    serverOnly: false,
    description: 'Supabase anonymous key (safe for client)'
  }
];

/**
 * Validates that all required environment variables are present
 * Call this in your API routes or server initialization
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Only check server-side
  if (typeof window !== 'undefined') {
    return { valid: true, errors: [] };
  }
  
  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];
    
    if (envVar.required && !value) {
      errors.push(`Missing required environment variable: ${envVar.name} - ${envVar.description}`);
    }
    
    // Warn if server-only variables are prefixed with NEXT_PUBLIC_
    if (envVar.serverOnly && envVar.name.startsWith('NEXT_PUBLIC_')) {
      errors.push(`WARNING: ${envVar.name} is marked as server-only but uses NEXT_PUBLIC_ prefix`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Gets environment variable with type safety
 * Throws error if required variable is missing
 */
export function getEnvVar(name: string, required: boolean = true): string {
  const value = process.env[name];
  
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  return value || '';
}

/**
 * Safe environment variable access for client components
 * Only returns NEXT_PUBLIC_ variables
 */
export function getPublicEnvVar(name: string): string | undefined {
  if (!name.startsWith('NEXT_PUBLIC_')) {
    console.error(`Attempted to access non-public env var from client: ${name}`);
    return undefined;
  }
  
  return process.env[name];
}

/**
 * Initialize environment validation (call once at startup)
 */
export function initializeEnvironment() {
  if (typeof window !== 'undefined') {
    // Client-side - no validation needed
    return;
  }
  
  const { valid, errors } = validateEnvironment();
  
  if (!valid) {
    console.error('=== ENVIRONMENT VALIDATION FAILED ===');
    errors.forEach(error => console.error(`❌ ${error}`));
    console.error('=====================================');
    
    // In development, log but continue
    // In production, this should throw
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Environment validation failed. Check server logs.');
    }
  } else {
    console.log('✅ Environment validation passed');
  }
}

/**
 * Type-safe environment variable access
 */
export const env = {
  // Server-only (never exposed to client)
  OPENROUTER_API_KEY: () => getEnvVar('OPENROUTER_API_KEY'),
  PINECONE_API_KEY: () => getEnvVar('PINECONE_API_KEY'),
  PINECONE_INDEX_NAME: () => getEnvVar('PINECONE_INDEX_NAME'),
  SUPABASE_SERVICE_ROLE_KEY: () => getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  RESEND_API_KEY: () => getEnvVar('RESEND_API_KEY', false),
  REDIS_URL: () => getEnvVar('REDIS_URL', false),
  DIRECT_ACCESS_ADMIN_KEY: () => getEnvVar('DIRECT_ACCESS_ADMIN_KEY', false),
  
  // Client-safe (can be exposed)
  NEXT_PUBLIC_SUPABASE_URL: () => getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: () => getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
};