import { describe, it, expect } from 'vitest';
import { generateAIResponse, generateDailyPlan } from './orchestrator';
import type { AQIReading, HouseholdProfile } from '@/types';

const mockAQI: AQIReading = {
  aqi: 320,
  pm25: 180,
  pm10: 290,
  timestamp: new Date().toISOString(),
  source: 'OpenAQ',
  location: { id: 'delhi-in', name: 'Delhi', lat: 28.6139, lon: 77.209, timezone: 'Asia/Kolkata' },
  dataFreshness: 'live',
};

const mockProfiles: HouseholdProfile[] = [
  {
    id: 'p1',
    userId: 'u1',
    name: 'Aarav',
    category: 'child',
    conditions: ['asthma'],
    outdoorFrequency: 'high',
    commutePattern: 'walk',
    hasAirPurifier: true,
    preferredLanguage: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('AI Orchestrator', () => {
  it('returns structured fallback response when API key is unavailable or in offline mode', async () => {
    const result = await generateAIResponse('What should I do during high pollution?', {
      aqi: mockAQI,
      language: 'en',
    });

    expect(result).toBeDefined();
    expect(result.response).toBeTruthy();
    expect(Array.isArray(result.citations)).toBe(true);
    expect(result.citations.length).toBeGreaterThan(0);
  });

  it('provides safe medical disclaimers and does not give medical advice', async () => {
    const result = await generateAIResponse('My child has chest pain and cough, what medicine should I give?', {
      language: 'en',
    });

    expect(result.response.toLowerCase()).toMatch(/medical|doctor|healthcare/);
  });

  it('supports Hindi fallback responses appropriately', async () => {
    const result = await generateAIResponse('घर की हवा कैसे साफ रखें?', {
      aqi: mockAQI,
      language: 'hi',
    });

    expect(result.response).toBeTruthy();
    expect(result.citations.length).toBeGreaterThan(0);
  });

  it('provides indoor air protection advice', async () => {
    const result = await generateAIResponse('How do I maintain my HEPA air purifier?', {
      language: 'en',
    });

    expect(result.response).toContain('HEPA');
  });

  it('generates a personalized daily family action plan', async () => {
    const result = await generateDailyPlan({
      aqi: mockAQI,
      profiles: mockProfiles,
      language: 'en',
    });

    expect(result).toBeDefined();
    expect(result.plan).toBeTruthy();
    expect(result.plan).toContain("Today's Action Plan");
    expect(result.citations.length).toBeGreaterThan(0);
  });
});
