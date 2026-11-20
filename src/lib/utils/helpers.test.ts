import { describe, it, expect } from 'vitest';
import type { TrackedAction } from '@/types';
import {
  getAQIColor,
  getAQILabel,
  formatTimestamp,
  formatRelativeTime,
  calculateCO2eSavings,
  generateId,
  isValidLatitude,
  isValidLongitude,
} from '@/lib/utils/helpers';

describe('AQI Helpers', () => {
  describe('getAQIColor', () => {
    it('returns correct colors for each AQI range', () => {
      expect(getAQIColor(25)).toBe('#00e400'); // Good
      expect(getAQIColor(75)).toBe('#ffff00'); // Moderate
      expect(getAQIColor(125)).toBe('#ff7e00'); // Unhealthy for Sensitive
      expect(getAQIColor(175)).toBe('#ff0000'); // Unhealthy
      expect(getAQIColor(250)).toBe('#8f3f97'); // Very Unhealthy
      expect(getAQIColor(350)).toBe('#7e0023'); // Hazardous
    });

    it('clamps at boundaries', () => {
      expect(getAQIColor(-10)).toBe('#00e400');
      expect(getAQIColor(600)).toBe('#7e0023');
    });
  });

  describe('getAQILabel', () => {
    it('returns correct labels', () => {
      expect(getAQILabel(25)).toBe('Good');
      expect(getAQILabel(75)).toBe('Moderate');
      expect(getAQILabel(125)).toBe('Unhealthy for Sensitive');
      expect(getAQILabel(175)).toBe('Unhealthy');
      expect(getAQILabel(250)).toBe('Very Unhealthy');
      expect(getAQILabel(350)).toBe('Hazardous');
    });
  });

  describe('formatTimestamp', () => {
    it('formats timestamp in English', () => {
      const result = formatTimestamp('2024-01-15T10:30:00Z', 'en');
      expect(result).toContain('Jan');
      expect(result).toContain('2024');
    });

    it('formats timestamp in Hindi', () => {
      const result = formatTimestamp('2024-01-15T10:30:00Z', 'hi');
      expect(result).toContain('2024');
    });
  });

  describe('formatRelativeTime', () => {
    it('shows "Just now" for recent times', () => {
      const now = new Date().toISOString();
      expect(formatRelativeTime(now, 'en')).toBe('Just now');
      expect(formatRelativeTime(now, 'hi')).toBe('अभी');
    });

    it('shows minutes for recent past', () => {
      const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinsAgo, 'en')).toBe('5m ago');
    });

    it('shows hours for older times', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(twoHoursAgo, 'en')).toBe('2h ago');
    });

    it('shows days for old times', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeDaysAgo, 'en')).toBe('3d ago');
    });
  });

  describe('calculateCO2eSavings', () => {
    it('calculates savings for carpool', () => {
      const result = calculateCO2eSavings('carpool', 10);
      expect(result.value).toBeGreaterThan(0);
      expect(result.unit).toContain('kg CO₂e');
      expect(result.assumptions.length).toBeGreaterThan(0);
    });

    it('calculates savings for public transport', () => {
      const result = calculateCO2eSavings('public_transport', 5);
      expect(result.value).toBeGreaterThan(0);
    });

    it('calculates savings for walk/cycle', () => {
      const result = calculateCO2eSavings('walk_cycle', 3);
      expect(result.value).toBeGreaterThan(0);
    });

    it('returns zero for unknown action types', () => {
      const result = calculateCO2eSavings('unknown' as TrackedAction['type'], 10);
      expect(result.value).toBe(0);
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('generates IDs with timestamp prefix', () => {
      const id = generateId();
      expect(id).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('Coordinate validation', () => {
    it('validates latitude', () => {
      expect(isValidLatitude(0)).toBe(true);
      expect(isValidLatitude(90)).toBe(true);
      expect(isValidLatitude(-90)).toBe(true);
      expect(isValidLatitude(91)).toBe(false);
      expect(isValidLatitude(-91)).toBe(false);
    });

    it('validates longitude', () => {
      expect(isValidLongitude(0)).toBe(true);
      expect(isValidLongitude(180)).toBe(true);
      expect(isValidLongitude(-180)).toBe(true);
      expect(isValidLongitude(181)).toBe(false);
      expect(isValidLongitude(-181)).toBe(false);
    });
  });
});