import Bull from 'bull';
import { getRedisConnection } from './redis';

export interface DocumentJobData {
  documentId: string;
  chatbotId: string;
  userId: string;
  filePath: string;
  fileType: string;
  fileName: string;
}

export interface DocumentJobResult {
  success: boolean;
  documentId: string;
  chunksCreated?: number;
  error?: string;
}

// Create the document processing queue
export const documentQueue = new Bull<DocumentJobData>('document-processing', {
  createClient: () => getRedisConnection(),
  defaultJobOptions: {
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 500,     // Keep last 500 failed jobs
    attempts: 3,           // Retry 3 times
    backoff: {
      type: 'exponential',
      delay: 2000,         // Start with 2 second delay
    },
  },
});

// Queue event handlers
documentQueue.on('completed', (job, result: DocumentJobResult) => {
  console.log(`[Document Queue] Job ${job.id} completed:`, {
    documentId: result.documentId,
    chunksCreated: result.chunksCreated,
  });
});

documentQueue.on('failed', (job, err) => {
  console.error(`[Document Queue] Job ${job.id} failed:`, {
    documentId: job.data.documentId,
    error: err.message,
    attempts: job.attemptsMade,
  });
});

documentQueue.on('stalled', (job) => {
  console.warn(`[Document Queue] Job ${job.id} stalled:`, {
    documentId: job.data.documentId,
  });
});

// Add a document to the processing queue
export async function queueDocumentForProcessing(data: DocumentJobData): Promise<Bull.Job<DocumentJobData>> {
  const job = await documentQueue.add('process-document', data, {
    // Override default options if needed
    priority: data.fileType === 'pdf' ? 1 : 0, // PDFs get higher priority
  });
  
  console.log(`[Document Queue] Queued document ${data.documentId} for processing (Job ID: ${job.id})`);
  return job;
}

// Get queue metrics
export async function getDocumentQueueMetrics() {
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
  };
}

// Clean old jobs
export async function cleanDocumentQueue() {
  await documentQueue.clean(1000 * 60 * 60 * 24); // Clean jobs older than 24 hours
  console.log('[Document Queue] Cleaned old jobs');
}