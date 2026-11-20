import { BaseAQIProvider } from './base';
import type { AQIReading, Location } from '@/types';

interface WAQIResponse {
  status: 'ok' | 'error';
  data: {
    aqi: number;
    idx: number;
    city: { name: string; geo: [number, number] };
    dominentpol: string;
    iaqi: Record<string, { v: number }>;
    time: { s: string; tz: string };
    forecast: {
      daily: Record<string, Array<{ day: string; avg: number; min: number; max: number }>>;
    };
  };
}

export class WAQIProvider extends BaseAQIProvider {
  readonly name = 'WAQI';
  readonly attribution = 'Data provided by World Air Quality Index project (https://aqicn.org)';
  private readonly baseUrl = 'https://api.waqi.info';
  private readonly apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = process.env.WAQI_API_KEY;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  async fetchCurrent(location: Location): Promise<AQIReading | null> {
    if (!this.apiKey) return null;

    try {
      const url = new URL(`${this.baseUrl}/feed/geo:${location.lat};${location.lon}/`);
      url.searchParams.set('token', this.apiKey);

      const response = await fetch(url.toString(), { next: { revalidate: 900 } });

      if (!response.ok) throw new Error(`WAQI API error: ${response.status}`);

      const data: WAQIResponse = await response.json();

      if (data.status !== 'ok' || !data.data) return null;

      return this.parseWAQIData(data.data, location);
    } catch (error) {
      console.error('[WAQI] Fetch error:', error);
      return null;
    }
  }

  async fetchHistorical(location: Location, days: number): Promise<AQIReading[]> {
    if (!this.apiKey) return [];

    try {
      const url = new URL(`${this.baseUrl}/feed/geo:${location.lat};${location.lon}/`);
      url.searchParams.set('token', this.apiKey);

      const response = await fetch(url.toString(), { next: { revalidate: 3600 } });

      if (!response.ok) throw new Error(`WAQI historical error: ${response.status}`);

      const data: WAQIResponse = await response.json();

      if (data.status !== 'ok' || !data.data?.forecast?.daily) return [];

      const readings: AQIReading[] = [];
      const forecast = data.data.forecast.daily;

      for (const [pollutant, dailyData] of Object.entries(forecast)) {
        if (pollutant === 'pm25') {
          for (const day of dailyData.slice(0, days)) {
            const aqi = this.calculateAQIFromPM25(day.avg);
            readings.push(this.createReading(aqi, location, { pm25: day.avg }, 'cached'));
          }
          break;
        }
      }

      return readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('[WAQI] Historical fetch error:', error);
      return [];
    }
  }

  private parseWAQIData(data: WAQIResponse['data'], location: Location): AQIReading | null {
    const pollutants: Record<string, number> = {};

    for (const [key, value] of Object.entries(data.iaqi)) {
      pollutants[key] = value.v;
    }

    const aqi = data.aqi;
    return this.createReading(aqi, location, pollutants);
  }
}