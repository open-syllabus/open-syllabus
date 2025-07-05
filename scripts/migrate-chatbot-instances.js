#!/usr/bin/env node

// Script to create missing student_chatbot_instances for existing room memberships
// Usage: ADMIN_MIGRATION_KEY=your-key node scripts/migrate-chatbot-instances.js

const https = require('https');
const http = require('http');

async function runMigration() {
  const adminKey = process.env.ADMIN_MIGRATION_KEY;
  
  if (!adminKey) {
    console.error('Error: ADMIN_MIGRATION_KEY environment variable is required');
    console.error('Usage: ADMIN_MIGRATION_KEY=your-key node scripts/migrate-chatbot-instances.js');
    process.exit(1);
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL('/api/admin/migrate-chatbot-instances', baseUrl);
  
  console.log(`Running migration at: ${url.toString()}`);
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': adminKey
    }
  };

  return new Promise((resolve, reject) => {
    const protocol = url.protocol === 'https:' ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('Migration completed successfully!');
            console.log('Results:', JSON.stringify(result, null, 2));
            resolve(result);
          } else {
            console.error('Migration failed:', result);
            reject(new Error(result.error || 'Unknown error'));
          }
        } catch (error) {
          console.error('Failed to parse response:', error);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('Request failed:', error);
      reject(error);
    });
    
    req.end();
  });
}

// Run the migration
runMigration()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });