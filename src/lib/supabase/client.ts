// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';

// Create a singleton instance of the Supabase client
let clientInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export const createClient = () => {
  // Return existing instance if available
  if (clientInstance) {
    return clientInstance;
  }

  // Create new instance
  clientInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'x-client-info': 'supabase-js-web'
        }
      }
    }
  );

  return clientInstance;
};