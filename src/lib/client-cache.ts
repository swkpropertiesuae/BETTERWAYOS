'use client';

import { useCallback, useEffect, useState } from 'react';

const memCache = new Map<string, { ts: number; data: unknown }>();
const STORAGE_PREFIX = 'bw_os_cache_v3:';

export function readCachedJson<T>(key: string, maxAgeMs = 120_000): T | null {
  const hit = memCache.get(key);
  if (hit && Date.now() - hit.ts <= maxAgeMs) {
    return hit.data as T;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = window.sessionStorage.getItem(STORAGE_PREFIX + key);
      if (raw) {
        const parsed = JSON.parse(raw) as { ts: number; data: T };
        if (parsed && Date.now() - parsed.ts <= maxAgeMs * 3) {
          memCache.set(key, parsed);
          return parsed.data;
        }
      }
    } catch {
      /* ignore storage quota errors */
    }
  }
  return null;
}

export function writeCachedJson<T>(key: string, data: T): void {
  const entry = { ts: Date.now(), data };
  memCache.set(key, entry);
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry));
    } catch {
      /* ignore */
    }
  }
}

export function invalidateApiCache(prefix?: string): void {
  if (!prefix) {
    memCache.clear();
  } else {
    for (const k of memCache.keys()) {
      if (k.startsWith(prefix)) memCache.delete(k);
    }
  }
  if (typeof window !== 'undefined') {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith(STORAGE_PREFIX + (prefix || ''))) keysToRemove.push(k);
      }
      for (const k of keysToRemove) window.sessionStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
}

export function prefetchApi(url: string): void {
  if (typeof window === 'undefined') return;
  if (readCachedJson(url, 30_000)) return;
  fetch(url, { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d) writeCachedJson(url, d);
    })
    .catch(() => {});
}

/**
 * Zero-loading stale-while-revalidate hook:
 * - Renders cached data at 0ms immediately on tab/route switch
 * - Refreshes live Supabase data silently in the background
 */
export function useInstantApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(() => (url ? readCachedJson<T>(url) : null));
  const [refreshing, setRefreshing] = useState(false);

  const reload = useCallback(async () => {
    if (!url) return;
    setRefreshing(true);
    try {
      const r = await fetch(url, { cache: 'no-store' });
      if (r.ok) {
        const json = (await r.json()) as T;
        writeCachedJson(url, json);
        setData(json);
      }
    } finally {
      setRefreshing(false);
    }
  }, [url]);

  useEffect(() => {
    if (!url) return;
    const cached = readCachedJson<T>(url);
    if (cached) setData(cached);
    void reload();
  }, [url, reload]);

  return { data, setData, refreshing, reload };
}
