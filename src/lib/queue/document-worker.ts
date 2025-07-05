import { Job, DoneCallback } from 'bull';
import { documentQueue, DocumentJobData, DocumentJobResult } from './document-queue';
import { createAdminClient } from '@/lib/supabase/admin';
import { processDocument } from '@/lib/document-processing/processor';

// Connection pool for Supabase admin clients
const connectionPool = new Map<string, ReturnType<typeof createAdminClient>>();
const MAX_POOL_SIZE = 50;
const CONNECTION_TTL = 5 * 60 * 1000; // 5 minutes

interface PooledConnection {
  client: ReturnType<typeof createAdminClient>;
  lastUsed: number;
}

// Get or create a pooled connection
function getPooledConnection(): ReturnType<typeof createAdminClient> {
  const now = Date.now();
  
  // Clean up old connections
  for (const [key, conn] of connectionPool.entries()) {
    if (now - (conn as any).lastUsed > CONNECTION_TTL) {
      connectionPool.delete(key);
    }
  }
  
  // Reuse existing connection or create new one
  if (connectionPool.size < MAX_POOL_SIZE) {
    const client = createAdminClient();
    const key = `conn_${now}_${Math.random()}`;
    connectionPool.set(key, client);
    (client as any).lastUsed = now;
    return client;
  } else {
    // Reuse least recently used connection
    let oldestKey = '';
    let oldestTime = Infinity;
    
    for (const [key, client] of connectionPool.entries()) {
      const lastUsed = (client as any).lastUsed || 0;
      if (lastUsed < oldestTime) {
        oldestTime = lastUsed;
        oldestKey = key;
      }
    }
    
    const client = connectionPool.get(oldestKey)!;
    (client as any).lastUsed = now;
    return client;
  }
}

// Process document job
async function processDocumentJob(job: Job<DocumentJobData>): Promise<DocumentJobResult> {
  const { documentId, chatbotId, userId, filePath, fileType, fileName } = job.data;
  const startTime = Date.now();
  
  console.log(`[Document Worker] Processing job ${job.id} for document ${documentId}`);
  
  try {
    // Update job progress
    await job.progress(10);
    
    // Get pooled connection
    const supabase = getPooledConnection();
    
    // Update document status to processing
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        status: 'processing',
        processing_started_at: new Date().toISOString(),
        retry_count: job.attemptsMade - 1,
      })
      .eq('document_id', documentId);
    
    if (updateError) {
      console.error('[Document Worker] Failed to update document status:', updateError);
      throw new Error(`Failed to update document status: ${updateError.message}`);
    }
    
    await job.progress(20);
    
    // Process the document
    console.log(`[Document Worker] Starting document processing for ${fileName}`);
    const result = await processDocument({
      document_id: documentId,
      chatbot_id: chatbotId,
      file_name: fileName,
      file_path: filePath,
      file_type: fileType as any,
      file_size: 0, // Will be updated by processor
      status: 'processing',
      error_message: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    
    await job.progress(90);
    
    // Get the current document status (processor might have set it to 'completed' or 'error')
    const { data: currentDoc, error: fetchError } = await supabase
      .from('documents')
      .select('status')
      .eq('document_id', documentId)
      .single();
    
    if (fetchError) {
      console.error('[Document Worker] Failed to fetch document status:', fetchError);
    } else if (currentDoc) {
      console.log(`[Document Worker] Document ${documentId} final status: ${currentDoc.status}`);
      
      // Only update metadata, keep the status set by the processor
      const { error: completeError } = await supabase
        .from('documents')
        .update({
          processing_completed_at: new Date().toISOString(),
          processing_metadata: {
            processing_time_ms: Date.now() - startTime,
            chunks_created: result.chunksCreated || 0,
            job_id: job.id,
            worker_id: process.pid,
            final_status: currentDoc.status,
          },
        })
        .eq('document_id', documentId);
      
      if (completeError) {
        console.error('[Document Worker] Failed to update completion metadata:', completeError);
        // Don't throw here, document was processed successfully
      } else {
        console.log(`[Document Worker] Successfully updated metadata for document ${documentId}`);
      }
    }
    
    await job.progress(100);
    
    const processingTime = Date.now() - startTime;
    console.log(`[Document Worker] Job ${job.id} completed in ${processingTime}ms`);
    
    return {
      success: true,
      documentId,
      chunksCreated: result.chunksCreated,
    };
    
  } catch (error) {
    console.error(`[Document Worker] Job ${job.id} failed:`, error);
    
    // Update document with error
    const supabase = getPooledConnection();
    await supabase
      .from('documents')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        processing_metadata: {
          processing_time_ms: Date.now() - startTime,
          job_id: job.id,
          worker_id: process.pid,
          error: error instanceof Error ? error.message : String(error),
          attempts: job.attemptsMade,
        },
      })
      .eq('document_id', documentId);
    
    return {
      success: false,
      documentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Worker configuration
const CONCURRENCY = parseInt(process.env.DOCUMENT_WORKER_CONCURRENCY || '10');

// Start the document worker
export function startDocumentWorker() {
  console.log(`[Document Worker] Starting with concurrency: ${CONCURRENCY}`);
  
  // Process document jobs
  documentQueue.process('process-document', CONCURRENCY, async (job: Job<DocumentJobData>, done: DoneCallback) => {
    try {
      const result = await processDocumentJob(job);
      done(null, result);
    } catch (error) {
      done(error as Error);
    }
  });
  
  // Monitor worker health
  setInterval(async () => {
    try {
      const metrics = await getWorkerMetrics();
      console.log('[Document Worker] Metrics:', metrics);
      
      // Alert if queue is backing up
      if (metrics.waiting > 100) {
        console.warn('[Document Worker] High queue backlog:', metrics.waiting);
      }
    } catch (error) {
      console.error('[Document Worker] Failed to get metrics:', error);
    }
  }, 60000); // Check every minute
}

// Get worker metrics
async function getWorkerMetrics() {
  const [waiting, active, completed, failed] = await Promise.all([
    documentQueue.getWaitingCount(),
    documentQueue.getActiveCount(),
    documentQueue.getCompletedCount(),
    documentQueue.getFailedCount(),
  ]);
  
  return {
    waiting,
    active,
    completed,
    failed,
    connectionPoolSize: connectionPool.size,
  };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Document Worker] Received SIGTERM, shutting down gracefully...');
  await documentQueue.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Document Worker] Received SIGINT, shutting down gracefully...');
  await documentQueue.close();
  process.exit(0);
});

// Auto-start if this file is run directly
if (require.main === module) {
  startDocumentWorker();
}