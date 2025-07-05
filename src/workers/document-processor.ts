#!/usr/bin/env node

// Start the document processing worker
import { startDocumentWorker } from '@/lib/queue/document-worker';

console.log('Starting Document Processing Worker...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  WORKER_CONCURRENCY: process.env.DOCUMENT_WORKER_CONCURRENCY || '10',
  REDIS_URL: process.env.REDIS_URL ? 'SET' : 'NOT SET',
});

// Start the worker
startDocumentWorker();

console.log('Document Processing Worker started successfully');