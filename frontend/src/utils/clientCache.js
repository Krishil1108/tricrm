/**
 * High-Speed Client-Side Cache Engine with Stale-While-Revalidate
 * Eliminates redundant network requests when switching between pages,
 * providing instant (0ms) render times.
 */

class ClientCacheManager {
  constructor(defaultTTL = 60000, staleThreshold = 15000) {
    this.cache = new Map();
    this.defaultTTL = defaultTTL; // 60 seconds
    this.staleThreshold = staleThreshold; // 15 seconds
    this.subscribers = new Map();
  }

  generateKey(endpoint, params = {}) {
    const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    return sortedParams ? `${endpoint}?${sortedParams}` : endpoint;
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if totally expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  isStale(key) {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > this.staleThreshold;
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    });
    
    // Notify any active subscribers
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(cb => cb(data));
    }
  }

  invalidate(pattern) {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, 'i');
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Fetch with Stale-While-Revalidate
   * Returns cached data immediately if available, then updates in background.
   */
  async fetchWithCache(key, fetcherFn, options = {}) {
    const { ttl = this.defaultTTL, force = false } = options;

    if (!force) {
      const cached = this.get(key);
      if (cached !== null) {
        // If stale, refresh in background without blocking caller
        if (this.isStale(key)) {
          fetcherFn()
            .then(freshData => {
              if (freshData !== undefined && freshData !== null) {
                this.set(key, freshData, ttl);
              }
            })
            .catch(() => {}); // SWR background refresh error is silently caught
        }
        return cached;
      }
    }

    // Not in cache or forced: fetch fresh
    const freshData = await fetcherFn();
    this.set(key, freshData, ttl);
    return freshData;
  }
}

export const clientCache = new ClientCacheManager(60000, 15000);
export default clientCache;
