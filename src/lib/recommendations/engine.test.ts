import { describe, it, expect } from 'vitest';
import { generateRecommendations, getDailyActionPlan } from '@/lib/recommendations/engine';
import type { RecommendationContext, HouseholdProfile, AQIReading, Location } from '@/types';

const mockLocation: Location = {
  id: 'delhi-in',
  name: 'Delhi, India',
  lat: 28.6139,
  lon: 77.2090,
  timezone: 'Asia/Kolkata',
};

const createMockAQI = (aqi: number, pm25?: number): AQIReading => ({
  aqi,
  pm25,
  timestamp: new Date().toISOString(),
  source: 'Test',
  location: mockLocation,
  dataFreshness: 'live',
});

const mockProfiles: HouseholdProfile[] = [
  {
    id: '1',
    userId: 'demo',
    name: 'Healthy Adult',
    category: 'adult',
    conditions: [],
    outdoorFrequency: 'medium',
    commutePattern: 'public_transport',
    hasAirPurifier: true,
    purifierCADR: 400,
    roomSizeSqFt: 150,
    preferredLanguage: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: 'demo',
    name: 'Child with Asthma',
    category: 'child',
    conditions: ['asthma'],
    outdoorFrequency: 'high',
    commutePattern: 'walk',
    hasAirPurifier: false,
    preferredLanguage: 'en',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    userId: 'demo',
    name: 'Elderly with Heart Condition',
    category: 'older_adult',
    conditions: ['hypertension'],
    outdoorFrequency: 'low',
    commutePattern: 'car',
    hasAirPurifier: true,
    purifierCADR: 300,
    roomSizeSqFt: 120,
    preferredLanguage: 'hi',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('Recommendation Engine', () => {
  describe('generateRecommendations', () => {
    it('generates critical recommendations for Hazardous AQI', () => {
      const aqi = createMockAQI(350, 250);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);

      expect(recs.length).toBeGreaterThan(0);
      const criticalRecs = recs.filter(r => r.priority === 'critical');
      expect(criticalRecs.length).toBeGreaterThan(0);
      expect(criticalRecs.some(r => r.category === 'outdoor')).toBe(true);
      expect(criticalRecs.some(r => r.category === 'indoor')).toBe(true);
    });

    it('generates high priority for Unhealthy AQI with sensitive profiles', () => {
      const aqi = createMockAQI(160, 80);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);
      const highRecs = recs.filter(r => r.priority === 'high' || r.priority === 'critical');
      expect(highRecs.length).toBeGreaterThan(0);
    });

    it('generates moderate recommendations for Moderate AQI', () => {
      const aqi = createMockAQI(75, 25);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);
      expect(recs.some(r => r.priority === 'medium' || r.priority === 'low')).toBe(true);
    });

    it('includes indoor protection recommendations when AQI > 100', () => {
      const aqi = createMockAQI(150, 60);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);
      const indoorRecs = recs.filter(r => r.category === 'indoor');
      expect(indoorRecs.length).toBeGreaterThan(0);
      expect(indoorRecs.some(r => r.action.includes('purifier'))).toBe(true);
      expect(indoorRecs.some(r => r.action.includes('window') || r.action.includes('ventilat'))).toBe(true);
    });

    it('prioritizes critical recommendations first', () => {
      const aqi = createMockAQI(350, 250);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);
      const priorities = recs.map(r => r.priority);
      const criticalIndex = priorities.indexOf('critical');
      const highIndex = priorities.indexOf('high');
      const mediumIndex = priorities.indexOf('medium');
      const lowIndex = priorities.indexOf('low');

      expect(criticalIndex).toBeLessThan(highIndex);
      if (highIndex !== -1 && mediumIndex !== -1) expect(highIndex).toBeLessThan(mediumIndex);
      if (mediumIndex !== -1 && lowIndex !== -1) expect(mediumIndex).toBeLessThan(lowIndex);
    });

    it('generates travel recommendations for walk/cycle commuters at high AQI', () => {
      const aqi = createMockAQI(200, 120);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [
          { profileId: '2', mode: 'walk', frequency: 'daily', durationMinutes: 30 },
        ],
      };

      const recs = generateRecommendations(context);
      const travelRecs = recs.filter(r => r.category === 'travel');
      expect(travelRecs.length).toBeGreaterThan(0);
      expect(travelRecs.some(r => r.action.includes('N95') || r.action.toLowerCase().includes('switch'))).toBe(true);
    });

    it('includes limitations in recommendations', () => {
      const aqi = createMockAQI(150, 60);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);
      expect(recs.every(r => r.limitations.length > 0)).toBe(true);
    });

    it('assigns profile IDs to relevant recommendations', () => {
      const aqi = createMockAQI(200, 120);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);
      const withProfiles = recs.filter(r => r.profileIds && r.profileIds.length > 0);
      expect(withProfiles.length).toBeGreaterThan(0);
    });
  });

  describe('getDailyActionPlan', () => {
    it('categorizes recommendations by time of day', () => {
      const aqi = createMockAQI(150, 60);
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const plan = getDailyActionPlan(context);

      expect(plan.morning).toBeDefined();
      expect(plan.afternoon).toBeDefined();
      expect(plan.evening).toBeDefined();
      expect(plan.overnight).toBeDefined();

      // All recommendations should be in one of the buckets
      const allRecs = [...plan.morning, ...plan.afternoon, ...plan.evening, ...plan.overnight];
      const originalRecs = generateRecommendations(context);
      expect(allRecs.length).toBeLessThanOrEqual(originalRecs.length);
    });
  });

  describe('Edge cases', () => {
    it('handles empty profiles array', () => {
      const aqi = createMockAQI(100, 35);
      const context: RecommendationContext = {
        aqi,
        profiles: [],
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);
      expect(Array.isArray(recs)).toBe(true);
    });

    it('handles missing pollutant data', () => {
      const aqi: AQIReading = {
        aqi: 100,
        timestamp: new Date().toISOString(),
        source: 'Test',
        location: mockLocation,
        dataFreshness: 'live',
      };
      const context: RecommendationContext = {
        aqi,
        profiles: mockProfiles,
        plannedActivities: [],
        travelPatterns: [],
      };

      const recs = generateRecommendations(context);
      expect(recs.length).toBeGreaterThan(0);
    });
  });
});