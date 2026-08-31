const redis = require('redis');

let redisClient = null;

// Initialize Redis client gracefully
const initRedis = async () => {
  // If we are in production and REDIS_URL is not configured, skip Redis completely
  if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL) {
    console.log('Redis URL is not configured. Caching is disabled.');
    redisClient = null;
    return;
  }

  const url = process.env.REDIS_URL || 'redis://localhost:6379';
  
  // Create a local client reference first to manage connection lifecycle
  const client = redis.createClient({
    url,
    socket: {
      // Limit reconnection attempts to avoid infinite loops and log spam
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          console.log('Redis reconnection attempts exceeded. Disabling caching.');
          return false; // Stop retrying
        }
        return Math.min(retries * 2000, 10000); // Back off up to 10 seconds
      }
    }
  });

  let connectionFailed = false;
  let hasLoggedError = false;

  client.on('error', (err) => {
    // Only log the error if we haven't already logged one
    if (!hasLoggedError) {
      console.error('Redis Client Error:', err.message || err);
      hasLoggedError = true;
    }
    
    // If we've hit an error, disable caching
    if (redisClient === client) {
      redisClient = null;
    }
  });

  client.on('connect', () => {
    console.log('Connected to Redis');
    redisClient = client;
    connectionFailed = false;
    hasLoggedError = false;
  });

  try {
    await client.connect();
    redisClient = client;
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message || error);
    connectionFailed = true;
    redisClient = null;
    
    // Safely disconnect the client to release resources and stop reconnect attempts
    try {
      await client.disconnect();
    } catch (disconnectError) {
      // Ignore disconnect errors during cleanup
    }
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
