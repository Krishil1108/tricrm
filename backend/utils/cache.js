/**
 * High-performance In-Memory Cache Utility for TRICRM Backend
 * Provides micro-second key-value retrieval, TTL auto-expiration,
 * LRU-style max size management, and Express caching middleware.
 */

class MemoryCache {
  constructor(defaultTTLSeconds = 60, maxSize = 1000) {
    this.defaultTTL = defaultTTLSeconds * 1000;
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  set(key, value, ttlSeconds) {
    const ttl = (ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL);
    const expiresAt = Date.now() + ttl;

    // Prune if cache grows too large
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const record = this.cache.get(key);
    if (!record) return null;

    if (Date.now() > record.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return record.value;
  }

  del(key) {
    this.cache.delete(key);
  }

  invalidatePrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) || key.includes(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  flush() {
    this.cache.clear();
  }
}

const globalCache = new MemoryCache(60, 2000);

/**
 * Express Middleware for Caching GET requests
 * @param {number} ttlSeconds - Time-to-live in seconds
 * @param {string} prefix - Optional namespace prefix
 */
const cacheMiddleware = (ttlSeconds = 60, prefix = '') => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip if user explicitly requests no-cache
    if (req.headers['x-no-cache']) {
      return next();
    }

    const key = `${prefix}:${req.originalUrl || req.url}`;
    const cachedData = globalCache.get(key);

    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedData);
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to cache response before sending
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        globalCache.set(key, body, ttlSeconds);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Middleware to invalidate cache on mutative requests (POST, PUT, DELETE, PATCH)
 * @param {string|string[]} prefixes - Cache prefixes to invalidate
 */
const invalidateCacheMiddleware = (prefixes = []) => {
  const prefixArray = Array.isArray(prefixes) ? prefixes : [prefixes];
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        prefixArray.forEach(p => globalCache.invalidatePrefix(p));
      }
      return originalJson(body);
    };
    next();
  };
};

module.exports = {
  globalCache,
  cacheMiddleware,
  invalidateCacheMiddleware
};
