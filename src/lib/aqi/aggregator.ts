import { OpenAQProvider } from './providers/openaq';
import { WAQIProvider } from './providers/waqi';
import { DemoProvider, demoProvider } from './providers/demo';
import type { AQIProvider, AQIReading, Location } from '@/types';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl: ttlMs });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const currentCache = new SimpleCache();
const historicalCache = new SimpleCache();

const CURRENT_TTL = 15 * 60 * 1000; // 15 minutes
const HISTORICAL_TTL = 60 * 60 * 1000; // 1 hour

const providers: AQIProvider[] = [
  new OpenAQProvider(),
  new WAQIProvider(),
  demoProvider,
].filter(p => p.isConfigured() || p.name === 'Demo Data');

function getCacheKey(prefix: string, location: Location): string {
  return `${prefix}:${location.id}`;
}

function determineFreshness(source: string, cached: boolean): AQIReading['dataFreshness'] {
  if (source === 'Demo Data') return 'demo';
  if (cached) return 'cached';
  return 'live';
}

export async function fetchCurrentAQI(location: Location): Promise<AQIReading | null> {
  const cacheKey = getCacheKey('current', location);
  const cached = currentCache.get<AQIReading>(cacheKey);
  if (cached) {
    return { ...cached, dataFreshness: 'cached' as const };
  }

  for (const provider of providers) {
    try {
      const reading = await provider.fetchCurrent(location);
      if (reading) {
        const freshness = determineFreshness(provider.name, false);
        const result = { ...reading, dataFreshness: freshness };
        currentCache.set(cacheKey, result, CURRENT_TTL);
        return result;
      }
    } catch (error) {
      console.error(`[AQI Aggregator] ${provider.name} failed:`, error);
      continue;
    }
  }

  return null;
}

export async function fetchHistoricalAQI(location: Location, days: number = 7): Promise<AQIReading[]> {
  const cacheKey = getCacheKey(`historical:${days}`, location);
  const cached = historicalCache.get<AQIReading[]>(cacheKey);
  if (cached) {
    return cached.map(r => ({ ...r, dataFreshness: 'cached' as const }));
  }

  for (const provider of providers) {
    try {
      const readings = await provider.fetchHistorical(location, days);
      if (readings.length > 0) {
        const freshness = determineFreshness(provider.name, false);
        const result = readings.map(r => ({ ...r, dataFreshness: freshness }));
        historicalCache.set(cacheKey, result, HISTORICAL_TTL);
        return result;
      }
    } catch (error) {
      console.error(`[AQI Aggregator] ${provider.name} historical failed:`, error);
      continue;
    }
  }

  return [];
}

export function getAvailableLocations(): Location[] {
  return demoProvider.getDemoCities();
}

export function getLocationById(id: string): Location | undefined {
  return getAvailableLocations().find(l => l.id === id);
}

export function clearCache(): void {
  currentCache.clear();
  historicalCache.clear();
}

export function getProviders(): AQIProvider[] {
  return providers;
}

export function getAttributions(): string[] {
  return providers.map(p => p.attribution).filter(Boolean);
}