const Redis = require('ioredis');

// Initialize Redis client (optional if Redis not available)
let redis = null;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
      // Stop retrying after 5 attempts
      if (times > 5) {
        console.log('[Cache] Redis retry limit reached - caching disabled');
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    enableOfflineQueue: false
  });

  redis.on('connect', () => console.log('[Cache] Redis connected'));
  redis.on('error', (err) => {
    // Suppress repeated connection errors
    if (err.message !== 'lastError') {
      // Only log once per unique error
    }
  });
} catch (err) {
  console.log('[Cache] Redis initialization skipped - caching disabled');
  redis = null;
}

// Cache middleware for GET requests
const cacheResponse = (ttl = 300) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests or if Redis is unavailable
    if (req.method !== 'GET' || !redis) {
      return next();
    }

    try {
      const cacheKey = `api:${req.originalUrl}`;
      const cachedData = await redis.get(cacheKey);

      if (cachedData) {
        console.log(`[Cache HIT] ${req.originalUrl}`);
        return res.json(JSON.parse(cachedData));
      }

      // Store original res.json
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = function (data) {
        console.log(`[Cache SET] ${req.originalUrl} (TTL: ${ttl}s)`);
        redis.setex(cacheKey, ttl, JSON.stringify(data)).catch(err => 
          console.error('[Cache] Error setting cache:', err.message)
        );
        return originalJson(data);
      };

      next();
    } catch (err) {
      console.error('[Cache] Middleware error:', err.message);
      next();
    }
  };
};

// Clear cache for a pattern
const clearCache = async (pattern = '*') => {
  if (!redis) return;
  
  try {
    const keys = await redis.keys(`api:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[Cache] Cleared ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (err) {
    console.error('[Cache] Clear cache error:', err.message);
  }
};

// Clear specific cache
const invalidateCache = async (url) => {
  if (!redis) return;
  
  try {
    const cacheKey = `api:${url}`;
    await redis.del(cacheKey);
    console.log(`[Cache] Invalidated: ${url}`);
  } catch (err) {
    console.error('[Cache] Invalidate cache error:', err.message);
  }
};

module.exports = {
  cacheResponse,
  clearCache,
  invalidateCache,
  redis
};
