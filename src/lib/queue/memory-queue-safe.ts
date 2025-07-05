import Bull from 'bull';
import Redis from 'ioredis';

// Check if Redis is enabled
const REDIS_ENABLED = process.env.ENABLE_REDIS === 'true';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true, // Don't connect immediately
  retryStrategy: (times: number) => {
    if (times > 3) {
      // Stop retrying after 3 attempts
      return null;
    }
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

// Create a mock queue for when Redis is not available
class MockQueue {
  async add(name: string, data: any, options?: any) {
    console.log(`[Mock Queue] Would queue job: ${name}`, data);
    return { id: `mock-${Date.now()}` };
  }

  on(event: string, handler: Function) {
    // No-op for mock
  }

  async getWaitingCount() { return 0; }
  async getActiveCount() { return 0; }
  async getCompletedCount() { return 0; }
  async getFailedCount() { return 0; }
  async getDelayedCount() { return 0; }
  async getPausedCount() { return 0; }
  async close() { return Promise.resolve(); }
  async process() { return Promise.resolve(); }
  async getJob(jobId: string) { 
    return {
      id: jobId,
      progress: () => Promise.resolve(),
      getState: () => Promise.resolve('completed'),
      opts: {},
      data: {}
    };
  }
  async isReady() { return Promise.resolve(); }
}

// Create Redis clients for Bull
const createRedisClient = () => {
  const client = new Redis(redisConfig);
  
  // Add connection error handler
  client.on('error', (err) => {
    if ((err as any).code === 'ECONNREFUSED') {
      console.log('[Memory Queue] Redis not available - memory features disabled');
      client.disconnect(false); // Stop trying to reconnect
    }
  });
  
  return client;
};

// Initialize queue based on Redis availability
let memoryQueue: Bull.Queue | MockQueue;

if (REDIS_ENABLED) {
  try {
    memoryQueue = new Bull('memory-processing', {
      createClient: (type) => {
        switch (type) {
          case 'client':
            return createRedisClient();
          case 'subscriber':
            return createRedisClient();
          case 'bclient':
            return createRedisClient();
          default:
            return createRedisClient();
        }
      },
      defaultJobOptions: {
        removeOnComplete: {
          age: 24 * 3600, // keep completed jobs for 24 hours
          count: 1000, // keep max 1000 completed jobs
        },
        removeOnFail: {
          age: 24 * 3600, // keep failed jobs for 24 hours
          count: 5000, // keep max 5000 failed jobs
        },
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // initial delay of 2 seconds
        },
      },
    });

    // Add error handler to prevent crashes
    (memoryQueue as Bull.Queue).on('error', (error) => {
      if ((error as any).code === 'ECONNREFUSED') {
        console.log('[Memory Queue] Redis connection refused - switching to mock queue');
        // Switch to mock queue if Redis fails
        memoryQueue = new MockQueue();
      } else {
        console.error('[Memory Queue] Error:', error.message);
      }
    });
  } catch (error) {
    console.log('[Memory Queue] Failed to initialize Bull queue, using mock');
    memoryQueue = new MockQueue();
  }
} else {
  console.log('[Memory Queue] Redis disabled, using mock queue');
  memoryQueue = new MockQueue();
}

// Queue metrics for monitoring
export async function getQueueMetrics() {
  try {
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      memoryQueue.getWaitingCount(),
      memoryQueue.getActiveCount(),
      memoryQueue.getCompletedCount(),
      memoryQueue.getFailedCount(),
      memoryQueue.getDelayedCount(),
      memoryQueue.getPausedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      paused,
      total: waiting + active + delayed + paused,
    };
  } catch (error) {
    // Return zeros if Redis is not available
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      paused: 0,
      total: 0,
    };
  }
}

// Graceful shutdown
export async function gracefulShutdown() {
  console.log('[Memory Queue] Shutting down gracefully...');
  try {
    await memoryQueue.close();
  } catch (error) {
    console.log('[Memory Queue] Error during shutdown:', error);
  }
}

// Health check
export async function isQueueHealthy(): Promise<boolean> {
  if (memoryQueue instanceof MockQueue) {
    return true; // Mock queue is always "healthy"
  }
  
  try {
    await (memoryQueue as Bull.Queue).isReady();
    return true;
  } catch (error) {
    console.error('[Memory Queue] Health check failed:', error);
    return false;
  }
}

// Job types
export interface MemoryJobData {
  userId: string;
  roomId: string;
  memory: {
    content: string;
    embedding?: number[];
    metadata?: Record<string, any>;
  };
  priority?: 'low' | 'normal' | 'high';
}

export interface MemoryJobResult {
  success: boolean;
  memoryId?: string;
  error?: string;
}

// Podcast generation job types
export interface PodcastJobData {
  studyGuideId: string;
  userId: string;
  studyGuideContent: string;
  studyGuideTitle: string;
  voice: string;
  speed: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface PodcastJobResult {
  success: boolean;
  podcastId?: string;
  audioUrl?: string;
  error?: string;
  progress?: number;
}

// Helper function to add podcast generation jobs
export async function addPodcastJob(data: PodcastJobData): Promise<string> {
  try {
    const job = await memoryQueue.add('podcast-generation', data, {
      priority: data.priority === 'high' ? 1 : data.priority === 'low' ? 3 : 2,
      attempts: 2, // Only retry once for podcast generation
      backoff: {
        type: 'exponential',
        delay: 5000, // 5 second initial delay
      },
    });
    
    return job.id?.toString() || `fallback-${Date.now()}`;
  } catch (error) {
    console.error('[Memory Queue] Failed to add podcast job:', error);
    throw error;
  }
}

// Helper function to get job status
export async function getPodcastJobStatus(jobId: string): Promise<{
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'unknown';
  progress?: number;
  result?: PodcastJobResult;
  error?: string;
}> {
  try {
    const job = await memoryQueue.getJob(jobId);
    if (!job) {
      return { status: 'unknown' };
    }
    
    const state = await job.getState();
    const progress = await job.progress();
    
    return {
      status: state as any,
      progress: typeof progress === 'number' ? progress : undefined,
      result: (job as any).returnvalue,
      error: (job as any).failedReason,
    };
  } catch (error) {
    console.error('[Memory Queue] Failed to get job status:', error);
    return { status: 'unknown', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export { memoryQueue };