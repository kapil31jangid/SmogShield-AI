import { BaseAQIProvider } from './base';
import type { AQIReading, Location } from '@/types';

const DEMO_CITIES: Location[] = [
  { id: 'delhi-in', name: 'Delhi, India', lat: 28.6139, lon: 77.2090, timezone: 'Asia/Kolkata' },
  { id: 'mumbai-in', name: 'Mumbai, India', lat: 19.0760, lon: 72.8777, timezone: 'Asia/Kolkata' },
  { id: 'kolkata-in', name: 'Kolkata, India', lat: 22.5726, lon: 88.3639, timezone: 'Asia/Kolkata' },
  { id: 'chennai-in', name: 'Chennai, India', lat: 13.0827, lon: 80.2707, timezone: 'Asia/Kolkata' },
  { id: 'bangalore-in', name: 'Bengaluru, India', lat: 12.9716, lon: 77.5946, timezone: 'Asia/Kolkata' },
  { id: 'hyderabad-in', name: 'Hyderabad, India', lat: 17.3850, lon: 78.4867, timezone: 'Asia/Kolkata' },
  { id: 'pune-in', name: 'Pune, India', lat: 18.5204, lon: 73.8567, timezone: 'Asia/Kolkata' },
  { id: 'ahmedabad-in', name: 'Ahmedabad, India', lat: 23.0225, lon: 72.5714, timezone: 'Asia/Kolkata' },
];

const WINTER_BASE_AQI: Record<string, number> = {
  'delhi-in': 320,
  'mumbai-in': 180,
  'kolkata-in': 220,
  'chennai-in': 120,
  'bangalore-in': 95,
  'hyderabad-in': 140,
  'pune-in': 110,
  'ahmedabad-in': 190,
};

const POLLUTANT_RATIOS: Record<string, { pm25: number; pm10: number; no2: number; o3: number; so2: number; co: number }> = {
  'delhi-in': { pm25: 1.0, pm10: 1.8, no2: 0.15, o3: 0.08, so2: 0.05, co: 0.03 },
  'mumbai-in': { pm25: 1.0, pm10: 1.5, no2: 0.12, o3: 0.1, so2: 0.04, co: 0.02 },
  'kolkata-in': { pm25: 1.0, pm10: 1.6, no2: 0.18, o3: 0.07, so2: 0.06, co: 0.03 },
  'chennai-in': { pm25: 1.0, pm10: 1.4, no2: 0.1, o3: 0.12, so2: 0.03, co: 0.02 },
  'bangalore-in': { pm25: 1.0, pm10: 1.3, no2: 0.08, o3: 0.15, so2: 0.02, co: 0.01 },
  'hyderabad-in': { pm25: 1.0, pm10: 1.4, no2: 0.11, o3: 0.1, so2: 0.03, co: 0.02 },
  'pune-in': { pm25: 1.0, pm10: 1.3, no2: 0.09, o3: 0.13, so2: 0.02, co: 0.01 },
  'ahmedabad-in': { pm25: 1.0, pm10: 1.7, no2: 0.14, o3: 0.09, so2: 0.05, co: 0.02 },
};

export class DemoProvider extends BaseAQIProvider {
  readonly name = 'Demo Data';
  readonly attribution = 'Demonstration data — not live measurements. For demo purposes only.';

  isConfigured(): boolean {
    return true;
  }

  async fetchCurrent(location: Location): Promise<AQIReading | null> {
    const city = DEMO_CITIES.find(c => c.id === location.id);
    if (!city) return null;

    const baseAQI = WINTER_BASE_AQI[location.id] ?? 150;
    const variation = (Math.sin(Date.now() / 3600000) * 0.15 + 0.9); // ±15% hourly variation
    const aqi = Math.round(baseAQI * variation);
    const clampedAQI = Math.min(500, Math.max(0, aqi));

    const ratios = POLLUTANT_RATIOS[location.id] ?? POLLUTANT_RATIOS['delhi-in']!;
    const pm25 = clampedAQI > 200 ? clampedAQI * 0.6 : clampedAQI * 0.5; // Rough PM2.5 estimate

    const pollutants = {
      pm25: Math.round(pm25),
      pm10: Math.round(pm25 * ratios.pm10),
      no2: Math.round(pm25 * ratios.no2),
      o3: Math.round(pm25 * ratios.o3),
      so2: Math.round(pm25 * ratios.so2),
      co: Math.round(pm25 * ratios.co * 10) / 10,
    };

    return this.createReading(clampedAQI, city, pollutants, 'demo');
  }

  async fetchHistorical(location: Location, days: number): Promise<AQIReading[]> {
    const city = DEMO_CITIES.find(c => c.id === location.id);
    if (!city) return [];

    const baseAQI = WINTER_BASE_AQI[location.id] ?? 150;
    const ratios = POLLUTANT_RATIOS[location.id] ?? POLLUTANT_RATIOS['delhi-in']!;

    const readings: AQIReading[] = [];
    const now = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - i * 86400000);
      const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
      const seasonalFactor = 1 + 0.3 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365); // Winter peak
      const dailyVariation = 0.85 + Math.random() * 0.3; // ±15% daily variation
      const aqi = Math.round(baseAQI * seasonalFactor * dailyVariation);
      const clampedAQI = Math.min(500, Math.max(0, aqi));
      const pm25 = clampedAQI > 200 ? clampedAQI * 0.6 : clampedAQI * 0.5;

      readings.push(this.createReading(
        clampedAQI,
        city,
        {
          pm25: Math.round(pm25),
          pm10: Math.round(pm25 * ratios.pm10),
          no2: Math.round(pm25 * ratios.no2),
          o3: Math.round(pm25 * ratios.o3),
          so2: Math.round(pm25 * ratios.so2),
          co: Math.round(pm25 * ratios.co * 10) / 10,
        },
        'demo'
      ));
    }

    return readings;
  }

  getDemoCities(): Location[] {
    return DEMO_CITIES;
  }
}

export const demoProvider = new DemoProvider();