/**
 * Server-side initialization
 * This module runs once when the server starts
 */

import { initializeEnvironment } from './env-validation';

// Flag to ensure initialization only happens once
let initialized = false;

export function initializeServer() {
  if (initialized) {
    return;
  }
  
  console.log('🚀 Initializing Skolr server...');
  
  try {
    // Validate environment variables
    initializeEnvironment();
    
    // Add other server initialization tasks here in the future
    // e.g., database connection pooling, cache warming, etc.
    
    initialized = true;
    console.log('✅ Server initialization complete');
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
    // In production, we want to fail fast
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// Run initialization immediately when this module is imported
if (typeof window === 'undefined') {
  initializeServer();
}