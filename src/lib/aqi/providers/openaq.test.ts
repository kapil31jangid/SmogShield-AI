import { describe, it, expect } from 'vitest';
import { OpenAQProvider } from '@/lib/aqi/providers/openaq';
import type { Location } from '@/types';

const mockLocation: Location = {
  id: 'delhi-in',
  name: 'Delhi, India',
  lat: 28.6139,
  lon: 77.2090,
  timezone: 'Asia/Kolkata',
};

describe('OpenAQProvider', () => {
  const provider = new OpenAQProvider();

  it('calculates AQI from PM2.5 using Indian CPCB breakpoints', () => {
    // CPCB: 0-30 µg/m³ = AQI 0-50 (Good)
    expect(provider['calculateAQIFromPM25'](0)).toBe(0);
    expect(provider['calculateAQIFromPM25'](15)).toBeLessThanOrEqual(50);
    expect(provider['calculateAQIFromPM25'](30)).toBeLessThanOrEqual(50);
    // CPCB: 31-60 µg/m³ = AQI 51-100 (Satisfactory)
    expect(provider['calculateAQIFromPM25'](31)).toBeGreaterThan(50);
    expect(provider['calculateAQIFromPM25'](60)).toBeLessThanOrEqual(100);
    // CPCB: 61-90 µg/m³ = AQI 101-200 (Moderate)
    expect(provider['calculateAQIFromPM25'](61)).toBeGreaterThan(100);
    expect(provider['calculateAQIFromPM25'](90)).toBeLessThanOrEqual(200);
    // CPCB: 91-120 µg/m³ = AQI 201-300 (Poor)
    expect(provider['calculateAQIFromPM25'](91)).toBeGreaterThan(200);
    expect(provider['calculateAQIFromPM25'](120)).toBeLessThanOrEqual(300);
    // CPCB: 121-250 µg/m³ = AQI 301-400 (Very Poor)
    expect(provider['calculateAQIFromPM25'](121)).toBeGreaterThan(300);
    expect(provider['calculateAQIFromPM25'](250)).toBeLessThanOrEqual(400);
    // CPCB: >250 µg/m³ = AQI 401+ (Severe)
    expect(provider['calculateAQIFromPM25'](251)).toBeGreaterThan(400);
  });

  it('calculates AQI from PM10 using Indian CPCB breakpoints', () => {
    // CPCB: 0-50 µg/m³ = AQI 0-50 (Good)
    expect(provider['calculateAQIFromPM10'](25)).toBeLessThanOrEqual(50);
    expect(provider['calculateAQIFromPM10'](50)).toBeLessThanOrEqual(50);
    // CPCB: 51-100 µg/m³ = AQI 51-100 (Satisfactory)
    expect(provider['calculateAQIFromPM10'](51)).toBeGreaterThan(50);
    expect(provider['calculateAQIFromPM10'](100)).toBeLessThanOrEqual(100);
    // CPCB: 101-250 µg/m³ = AQI 101-200 (Moderate)
    expect(provider['calculateAQIFromPM10'](200)).toBeGreaterThan(100);
    expect(provider['calculateAQIFromPM10'](250)).toBeLessThanOrEqual(200);
    // CPCB: 251-350 µg/m³ = AQI 201-300 (Poor)
    expect(provider['calculateAQIFromPM10'](300)).toBeGreaterThan(200);
    expect(provider['calculateAQIFromPM10'](350)).toBeLessThanOrEqual(300);
  });

  it('normalizes AQI to 0-500 range', () => {
    expect(provider['normalizeAQI'](-10)).toBe(0);
    expect(provider['normalizeAQI'](600)).toBe(500);
    expect(provider['normalizeAQI'](150)).toBe(150);
  });

  it('creates reading with correct structure', () => {
    const reading = provider['createReading'](150, mockLocation, { pm25: 60 }, 'live');
    expect(reading.aqi).toBe(150);
    expect(reading.pm25).toBe(60);
    expect(reading.source).toBe('OpenAQ');
    expect(reading.location.id).toBe('delhi-in');
    expect(reading.dataFreshness).toBe('live');
  });

  it('calculates haversine distance', () => {
    // Delhi to Mumbai ~ 1150 km
    const dist = provider['haversineDistance'](28.6139, 77.2090, 19.0760, 72.8777);
    expect(dist).toBeGreaterThan(1100);
    expect(dist).toBeLessThan(1200);
  });
});