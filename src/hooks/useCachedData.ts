import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheOptions {
  cacheKey: string;
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  version?: string; // Cache version - invalidates on change
  enabled?: boolean; // Enable/disable caching
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_PREFIX = 'carelo_cache_';

/**
 * Custom hook for cached data fetching
 * Only reloads data if:
 * - Cache doesn't exist
 * - Cache is expired (older than TTL)
 * - Cache version changed
 * - Explicitly invalidated
 */
export function useCachedData<T>(
  fetchFn: () => Promise<T>,
  options: CacheOptions
) {
  const { cacheKey, ttl = DEFAULT_TTL, version = '1.0', enabled = true } = options;
  const fullCacheKey = `${CACHE_PREFIX}${cacheKey}`;

  // Read fresh cache synchronously on first render to avoid loading flash
  const readFreshCache = (): T | null => {
    if (!enabled) return null;
    try {
      const cached = localStorage.getItem(fullCacheKey);
      if (!cached) return null;
      const entry: CacheEntry<T> = JSON.parse(cached);
      if (entry.version !== version || Date.now() - entry.timestamp > ttl) return null;
      return entry.data;
    } catch {
      return null;
    }
  };

  const [data, setData] = useState<T | null>(readFreshCache);
  const [isLoading, setIsLoading] = useState<boolean>(() => readFreshCache() === null && enabled);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchFnRef = useRef(fetchFn);
  
  // Update ref when fetchFn changes
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  // Fetch data
  const fetchData = useCallback(async (force = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    // Try cache first (unless forced)
    if (!force && enabled) {
      try {
        const cached = localStorage.getItem(fullCacheKey);
        if (cached) {
          const entry: CacheEntry<T> = JSON.parse(cached);
          
          // Check version
          if (entry.version === version) {
            // Check TTL
            const age = Date.now() - entry.timestamp;
            if (age <= ttl) {
              setData(entry.data);
              setIsLoading(false);
              setError(null);
              return;
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load from cache:', e);
        localStorage.removeItem(fullCacheKey);
      }
    }
    
    // Fetch fresh data
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await fetchFnRef.current();
      if (!abortControllerRef.current?.signal.aborted) {
        setData(result);
        try {
          localStorage.setItem(fullCacheKey, JSON.stringify({
            data: result,
            timestamp: Date.now(),
            version,
          }));
        } catch (e) {
          console.warn('Failed to save to cache:', e);
        }
        setError(null);
      }
    } catch (e: any) {
      if (!abortControllerRef.current?.signal.aborted) {
        const error = e instanceof Error ? e : new Error(String(e));
        setError(error);
        
        // Try to use stale cache on error
        try {
          const cached = localStorage.getItem(fullCacheKey);
          if (cached) {
            const entry: CacheEntry<T> = JSON.parse(cached);
            setData(entry.data);
          }
        } catch (cacheError) {
          // Ignore cache errors
        }
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [enabled, fullCacheKey, version, ttl]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    localStorage.removeItem(fullCacheKey);
    fetchData(true);
  }, [fullCacheKey, fetchData]);

  // Initial load
  useEffect(() => {
    fetchData(false);
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey, version]); // Only re-fetch when cache key or version changes

  // Stable refetch function
  const refetch = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidate,
  };
}

/**
 * Invalidate cache for a specific key
 */
export function invalidateCache(cacheKey: string) {
  const fullCacheKey = `${CACHE_PREFIX}${cacheKey}`;
  localStorage.removeItem(fullCacheKey);
  
  // Dispatch custom event for components to react
  window.dispatchEvent(new CustomEvent('carelo:cache-invalidate', {
    detail: { cacheKey }
  }));
}

/**
 * Invalidate all caches
 */
export function invalidateAllCache() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keys.push(key);
    }
  }
  keys.forEach(key => localStorage.removeItem(key));
  
  window.dispatchEvent(new CustomEvent('carelo:cache-invalidate-all'));
}

