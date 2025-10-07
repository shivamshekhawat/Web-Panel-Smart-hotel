// Simple cache to prevent duplicate API calls
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

class DataCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly CACHE_DURATION = 30000; // 30 seconds

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > this.CACHE_DURATION;
  }

  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const entry = this.cache.get(key);
    
    // If we have a valid cached entry, return it
    if (entry && !this.isExpired(entry)) {
      console.log(`📦 Cache hit for ${key}`);
      return entry.data;
    }
    
    // If there's already a pending request, wait for it
    if (entry?.promise) {
      console.log(`⏳ Waiting for pending request: ${key}`);
      return entry.promise;
    }
    
    // Make a new request
    console.log(`🔄 Cache miss, fetching: ${key}`);
    const promise = fetcher();
    
    // Store the promise immediately to prevent duplicate requests
    this.cache.set(key, {
      data: null,
      timestamp: Date.now(),
      promise
    });
    
    try {
      const data = await promise;
      
      // Update cache with the actual data
      this.cache.set(key, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      // Remove failed request from cache
      this.cache.delete(key);
      throw error;
    }
  }

  clear(keyPattern?: string): void {
    if (keyPattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(keyPattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }
}

export const dataCache = new DataCache();