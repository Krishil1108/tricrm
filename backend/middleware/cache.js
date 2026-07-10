const redis = require('redis');

let redisClient = null;

// Initialize Redis client gracefully
const initRedis = async () => {
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = redis.createClient({ url });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      // If it fails to connect, we just won't use caching
      redisClient = null;
    });

    redisClient.on('connect', () => {
      console.log('Connected to Redis');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    redisClient = null;
  }
};

// Initialize it
initRedis();

/**
 * Cache Middleware
 * @param {number} duration - Cache duration in seconds
 */
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    // Skip caching if Redis is not available or if it's not a GET request
    if (!redisClient || req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;
    
    try {
      const cachedResponse = await redisClient.get(key);
      if (cachedResponse) {
        return res.json(JSON.parse(cachedResponse));
      }
      
      // Override res.json to cache the response before sending it
      const originalJson = res.json;
      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(key, duration, JSON.stringify(body)).catch(err => {
            console.error('Redis set error:', err);
          });
        }
        return originalJson.call(res, body);
      };
      
      next();
    } catch (error) {
      console.error('Redis get error:', error);
      next(); // Fail gracefully
    }
  };
};

/**
 * Helper to clear cache matching a pattern (e.g. when data is updated)
 * @param {string} pattern - Key pattern to delete (e.g. 'cache:/api/finance*')
 */
const clearCache = async (pattern) => {
  if (!redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Redis clear cache error:', error);
  }
};

module.exports = {
  cacheMiddleware,
  clearCache
};
