import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAQI(aqi: number): string {
  return aqi.toString();
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#00e400';
  if (aqi <= 100) return '#ffff00';
  if (aqi <= 150) return '#ff7e00';
  if (aqi <= 200) return '#ff0000';
  if (aqi <= 300) return '#8f3f97';
  return '#7e0023';
}

export function getAQILabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function formatTimestamp(timestamp: string, locale: 'en' | 'hi' = 'en'): string {
  const date = new Date(timestamp);
  if (locale === 'hi') {
    return date.toLocaleString('hi-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatRelativeTime(timestamp: string, locale: 'en' | 'hi' = 'en'): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (locale === 'hi') {
    if (diffMins < 1) return 'अभी';
    if (diffMins < 60) return `${diffMins} मिनट पहले`;
    if (diffHours < 24) return `${diffHours} घंटे पहले`;
    return `${diffDays} दिन पहले`;
  }

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function formatNumber(num: number, locale: 'en' | 'hi' = 'en'): string {
  return new Intl.NumberFormat(locale === 'hi' ? 'hi-IN' : 'en-IN').format(num);
}

export function calculateCO2eSavings(actionType: string, count: number): { value: number; unit: string; assumptions: string[] } {
  const factors: Record<string, { kgPerUnit: number; unit: string; assumptions: string[] }> = {
    carpool: { kgPerUnit: 2.3, unit: 'trip', assumptions: ['Average 15km trip', 'Single occupancy car: 150g CO2/km', 'Carpool (2 people): 75g CO2/km per person'] },
    public_transport: { kgPerUnit: 3.1, unit: 'trip', assumptions: ['Average 15km trip', 'Car: 150g CO2/km', 'Bus/Metro: ~20g CO2/km per passenger'] },
    walk_cycle: { kgPerUnit: 2.25, unit: 'trip', assumptions: ['Average 5km trip replaced', 'Zero emissions vs car'] },
    avoided_trip: { kgPerUnit: 2.25, unit: 'trip', assumptions: ['Average 15km trip not taken', 'Car: 150g CO2/km'] },
    source_reduction: { kgPerUnit: 0.5, unit: 'day', assumptions: ['Reduced indoor combustion sources', 'Estimated based on typical household'] },
    community_event: { kgPerUnit: 10, unit: 'event', assumptions: ['Community tree planting/cleanup', 'Rough estimate per participant'] },
  };

  const factor = factors[actionType] || { kgPerUnit: 0, unit: 'action', assumptions: ['Unknown action type'] };
  return {
    value: Math.round(factor.kgPerUnit * count * 100) / 100,
    unit: `kg CO₂e per ${factor.unit}`,
    assumptions: factor.assumptions,
  };
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number): T {
  let timeoutId: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  }) as T;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

export function isValidLongitude(lon: number): boolean {
  return lon >= -180 && lon <= 180;
}