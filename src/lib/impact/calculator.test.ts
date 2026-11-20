import { describe, it, expect } from 'vitest';
import { estimateActionImpact, calculateImpactSummary, getActionTypeLabel, getActionTypeIcon } from '@/lib/impact/calculator';
import type { TrackedAction, HouseholdProfile } from '@/types';

const mockProfiles: HouseholdProfile[] = [
  { id: '1', userId: 'demo', name: 'Priya', category: 'adult', conditions: [], outdoorFrequency: 'medium', commutePattern: 'car', hasAirPurifier: false, preferredLanguage: 'en', createdAt: '', updatedAt: '' },
  { id: '2', userId: 'demo', name: 'Arjun', category: 'child', conditions: [], outdoorFrequency: 'high', commutePattern: 'walk', hasAirPurifier: false, preferredLanguage: 'en', createdAt: '', updatedAt: '' },
];

const mockActions: TrackedAction[] = [
  { id: '1', userId: 'demo', profileId: '1', type: 'carpool', description: 'Carpooled to work', estimatedCO2eKg: 2.3, assumptions: [], dataSource: 'test', timestamp: new Date().toISOString(), verified: false },
  { id: '2', userId: 'demo', profileId: '2', type: 'public_transport', description: 'Took metro', estimatedCO2eKg: 3.1, assumptions: [], dataSource: 'test', timestamp: new Date().toISOString(), verified: false },
  { id: '3', userId: 'demo', type: 'walk_cycle', description: 'Walked to store', estimatedCO2eKg: 1.1, assumptions: [], dataSource: 'test', timestamp: new Date(Date.now() - 86400000).toISOString(), verified: false },
  { id: '4', userId: 'demo', profileId: '1', type: 'avoided_trip', description: 'Combined errands', estimatedCO2eKg: 2.25, assumptions: [], dataSource: 'test', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), verified: false },
];

describe('Impact Calculator', () => {
  describe('estimateActionImpact', () => {
    it('estimates carpool impact', () => {
      const result = estimateActionImpact('carpool', 'Carpooled to work');
      expect(result.estimatedCO2eKg).toBeGreaterThan(0);
      expect(result.assumptions.length).toBeGreaterThan(0);
      expect(result.dataSource).toContain('CSTEP');
    });

    it('estimates public transport impact', () => {
      const result = estimateActionImpact('public_transport', 'Took metro');
      expect(result.estimatedCO2eKg).toBeGreaterThan(0);
    });

    it('estimates walk/cycle impact', () => {
      const result = estimateActionImpact('walk_cycle', 'Walked to store');
      expect(result.estimatedCO2eKg).toBeGreaterThan(0);
    });

    it('adjusts for profile', () => {
      const profile = mockProfiles[1]; // Child
      const result = estimateActionImpact('walk_cycle', 'Walked to school', profile);
      expect(result.estimatedCO2eKg).toBeGreaterThan(0);
      expect(result.assumptions.some(a => a.includes('Child'))).toBe(true);
    });

    it('includes limitations', () => {
      const result = estimateActionImpact('carpool', 'Carpooled');
      expect(result.limitations.length).toBeGreaterThan(0);
      expect(result.limitations.some(l => l.includes('negligible'))).toBe(true);
    });
  });

  describe('calculateImpactSummary', () => {
    it('calculates totals correctly', () => {
      const summary = calculateImpactSummary(mockActions, mockProfiles);

      expect(summary.totalActions).toBe(4);
      expect(summary.totalCO2eKg).toBeCloseTo(8.75, 1);
    });

    it('groups by type', () => {
      const summary = calculateImpactSummary(mockActions, mockProfiles);

      expect(summary.byType.carpool).toBeDefined();
      expect(summary.byType.carpool!.count).toBe(1);
      expect(summary.byType.carpool!.co2eKg).toBe(2.3);

      expect(summary.byType.public_transport).toBeDefined();
      expect(summary.byType.public_transport!.count).toBe(1);
    });

    it('groups by profile', () => {
      const summary = calculateImpactSummary(mockActions, mockProfiles);

      expect(summary.byProfile.Priya).toBeDefined();
      expect(summary.byProfile.Priya!.count).toBe(2);
      expect(summary.byProfile.Priya!.co2eKg).toBeCloseTo(4.55, 1);
    });

    it('calculates weekly trend', () => {
      const summary = calculateImpactSummary(mockActions, mockProfiles);

      expect(summary.weeklyTrend.length).toBe(8);
      expect(summary.weeklyTrend.every(w => typeof w.week === 'string' && typeof w.co2eKg === 'number')).toBe(true);
    });

    it('calculates monthly trend', () => {
      const summary = calculateImpactSummary(mockActions, mockProfiles);

      expect(summary.monthlyTrend.length).toBe(6);
      expect(summary.monthlyTrend.every(m => typeof m.month === 'string' && typeof m.co2eKg === 'number')).toBe(true);
    });

    it('generates equivalencies', () => {
      const summary = calculateImpactSummary(mockActions, mockProfiles);

      expect(summary.equivalencies.length).toBeGreaterThan(0);
      expect(summary.equivalencies.every(e => e.label && e.value)).toBe(true);
    });
  });

  describe('getActionTypeLabel', () => {
    it('returns correct labels', () => {
      expect(getActionTypeLabel('carpool')).toBe('Carpool Trip');
      expect(getActionTypeLabel('public_transport')).toBe('Public Transport');
      expect(getActionTypeLabel('walk_cycle')).toBe('Walk/Cycle');
      expect(getActionTypeLabel('avoided_trip')).toBe('Avoided Trip');
      expect(getActionTypeLabel('source_reduction')).toBe('Indoor Source Reduction');
      expect(getActionTypeLabel('community_event')).toBe('Community Event');
    });
  });

  describe('getActionTypeIcon', () => {
    it('returns icon names', () => {
      expect(getActionTypeIcon('carpool')).toBe('car');
      expect(getActionTypeIcon('public_transport')).toBe('bus');
      expect(getActionTypeIcon('walk_cycle')).toBe('bike');
      expect(getActionTypeIcon('avoided_trip')).toBe('minus-circle');
      expect(getActionTypeIcon('source_reduction')).toBe('home');
      expect(getActionTypeIcon('community_event')).toBe('users');
    });
  });
});