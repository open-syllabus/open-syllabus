import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      reconnectOnError: (err) => {
        console.error('Redis connection error:', err);
        return true; // Always reconnect
      },
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
    });
  }

  return redisClient;
}

// Clean up on process exit
process.on('SIGTERM', async () => {
  if (redisClient) {
    await redisClient.quit();
  }
});

process.on('SIGINT', async () => {
  if (redisClient) {
    await redisClient.quit();
  }
});