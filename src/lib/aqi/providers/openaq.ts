import { BaseAQIProvider } from './base';
import type { AQIReading, Location } from '@/types';

interface OpenAQResponse {
  results: Array<{
    location: string;
    coordinates: { latitude: number; longitude: number };
    parameters: Array<{
      parameter: string;
      value: number;
      unit: string;
      lastUpdated: string;
      averagingPeriod?: { value: number; unit: string };
    }>;
  }>;
  meta: { found: number; page: number; limit: number };
}

export class OpenAQProvider extends BaseAQIProvider {
  readonly name = 'OpenAQ';
  readonly attribution = 'Data provided by OpenAQ (https://openaq.org)';
  private readonly baseUrl = 'https://api.openaq.org/v2';
  private readonly apiKey: string | undefined;

  constructor() {
    super();
    this.apiKey = process.env.OPENAQ_API_KEY;
  }

  isConfigured(): boolean {
    return true; // Works without API key (lower rate limits)
  }

  async fetchCurrent(location: Location): Promise<AQIReading | null> {
    try {
      const url = new URL(`${this.baseUrl}/latest`);
      url.searchParams.set('coordinates', `${location.lat},${location.lon}`);
      url.searchParams.set('radius', '25000'); // 25km radius
      url.searchParams.set('limit', '10');
      url.searchParams.set('parameters', 'pm25,pm10,no2,o3,so2,co');

      const headers: HeadersInit = { 'Accept': 'application/json' };
      if (this.apiKey) headers['X-API-Key'] = this.apiKey;

      const response = await fetch(url.toString(), { headers, next: { revalidate: 900 } });

      if (!response.ok) {
        if (response.status === 429) throw new Error('Rate limited');
        throw new Error(`OpenAQ API error: ${response.status}`);
      }

      const data: OpenAQResponse = await response.json();

      if (!data.results.length) return null;

      // Find closest station
      let closest = data.results[0]!;
      let minDist = this.haversineDistance(location.lat, location.lon, closest.coordinates.latitude, closest.coordinates.longitude);

      for (const station of data.results) {
        const dist = this.haversineDistance(location.lat, location.lon, station.coordinates.latitude, station.coordinates.longitude);
        if (dist < minDist) {
          minDist = dist;
          closest = station;
        }
      }

      return this.parseStationData(closest, location);
    } catch (error) {
      console.error('[OpenAQ] Fetch error:', error);
      return null;
    }
  }

  async fetchHistorical(location: Location, days: number): Promise<AQIReading[]> {
    try {
      const url = new URL(`${this.baseUrl}/measurements`);
      url.searchParams.set('coordinates', `${location.lat},${location.lon}`);
      url.searchParams.set('radius', '25000');
      url.searchParams.set('limit', '1000');
      url.searchParams.set('parameters', 'pm25,pm10,no2,o3,so2,co');
      url.searchParams.set('date_from', new Date(Date.now() - days * 86400000).toISOString().split('T')[0]!);
      url.searchParams.set('date_to', new Date().toISOString().split('T')[0]!);
      url.searchParams.set('order_by', 'lastUpdated');
      url.searchParams.set('sort', 'desc');

      const headers: HeadersInit = { 'Accept': 'application/json' };
      if (this.apiKey) headers['X-API-Key'] = this.apiKey;

      const response = await fetch(url.toString(), { headers, next: { revalidate: 3600 } });

      if (!response.ok) throw new Error(`OpenAQ historical error: ${response.status}`);

      const data: OpenAQResponse = await response.json();

      // Group by date and calculate daily averages
      const dailyMap = new Map<string, { sum: number; count: number; pollutants: Record<string, number[]>; timestamp: string }>();

      for (const result of data.results) {
        for (const param of result.parameters) {
          const date = param.lastUpdated.split('T')[0]!;
          if (!dailyMap.has(date)) {
            dailyMap.set(date, { sum: 0, count: 0, pollutants: {}, timestamp: param.lastUpdated });
          }
          const day = dailyMap.get(date)!;
          if (param.parameter === 'pm25') {
            day.sum += param.value;
            day.count++;
          }
          if (!day.pollutants[param.parameter]) day.pollutants[param.parameter] = [];
          day.pollutants[param.parameter]!.push(param.value);
        }
      }

      const readings: AQIReading[] = [];
      for (const [date, dayData] of dailyMap) {
        if (dayData.count === 0) continue;
        const avgPM25 = dayData.sum / dayData.count;
        const aqi = this.calculateAQIFromPM25(avgPM25);
        const pollutants: Record<string, number> = {};
        for (const [param, values] of Object.entries(dayData.pollutants)) {
          pollutants[param] = values.reduce((a, b) => a + b, 0) / values.length;
        }
        readings.push(this.createReading(aqi, location, pollutants as Record<string, number>, 'cached'));
      }

      return readings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      console.error('[OpenAQ] Historical fetch error:', error);
      return [];
    }
  }

  private parseStationData(station: OpenAQResponse['results'][0], location: Location): AQIReading | null {
    const pollutants: Record<string, number> = {};
    let pm25Value: number | undefined;

    for (const param of station.parameters) {
      if (param.unit === 'µg/m³' || param.unit === 'ppm') {
        pollutants[param.parameter] = param.value;
        if (param.parameter === 'pm25') pm25Value = param.value;
      }
    }

    if (pm25Value === undefined) {
      // Calculate AQI from available pollutants using dominant pollutant method
      let maxAQI = 0;
      for (const [param, value] of Object.entries(pollutants)) {
        let aqi = 0;
        switch (param) {
          case 'pm10': aqi = this.calculateAQIFromPM10(value); break;
          case 'no2': aqi = this.calculateAQIFromNO2(value); break;
          case 'o3': aqi = this.calculateAQIFromO3(value); break;
          case 'so2': aqi = this.calculateAQIFromSO2(value); break;
          case 'co': aqi = this.calculateAQIFromCO(value); break;
        }
        maxAQI = Math.max(maxAQI, aqi);
      }
      if (maxAQI === 0) return null;
      return this.createReading(maxAQI, location, pollutants);
    }

    const aqi = this.calculateAQIFromPM25(pm25Value);
    return this.createReading(aqi, location, pollutants);
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private calculateAQIFromPM10(pm10: number): number {
    // Indian CPCB AQI breakpoints for PM10 (24-hour average, µg/m³)
    const breakpoints = [
      { cLow: 0,   cHigh: 50,  iLow: 0,   iHigh: 50  },  // Good
      { cLow: 51,  cHigh: 100, iLow: 51,  iHigh: 100 },  // Satisfactory
      { cLow: 101, cHigh: 250, iLow: 101, iHigh: 200 },  // Moderate
      { cLow: 251, cHigh: 350, iLow: 201, iHigh: 300 },  // Poor
      { cLow: 351, cHigh: 430, iLow: 301, iHigh: 400 },  // Very Poor
      { cLow: 431, cHigh: 600, iLow: 401, iHigh: 500 },  // Severe
    ];
    for (const bp of breakpoints) {
      if (pm10 >= bp.cLow && pm10 <= bp.cHigh) {
        return this.normalizeAQI(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm10 - bp.cLow) + bp.iLow);
      }
    }
    return 500;
  }

  private calculateAQIFromNO2(no2: number): number {
    // NO2 in ppb, convert to ppb if needed
    const breakpoints = [
      { cLow: 0, cHigh: 53, iLow: 0, iHigh: 50 },
      { cLow: 54, cHigh: 100, iLow: 51, iHigh: 100 },
      { cLow: 101, cHigh: 360, iLow: 101, iHigh: 150 },
      { cLow: 361, cHigh: 649, iLow: 151, iHigh: 200 },
      { cLow: 650, cHigh: 1249, iLow: 201, iHigh: 300 },
      { cLow: 1250, cHigh: 2049, iLow: 301, iHigh: 500 },
    ];
    for (const bp of breakpoints) {
      if (no2 >= bp.cLow && no2 <= bp.cHigh) {
        return this.normalizeAQI(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (no2 - bp.cLow) + bp.iLow);
      }
    }
    return 500;
  }

  private calculateAQIFromO3(o3: number): number {
    // O3 in ppb (8-hour)
    const breakpoints = [
      { cLow: 0, cHigh: 54, iLow: 0, iHigh: 50 },
      { cLow: 55, cHigh: 70, iLow: 51, iHigh: 100 },
      { cLow: 71, cHigh: 85, iLow: 101, iHigh: 150 },
      { cLow: 86, cHigh: 105, iLow: 151, iHigh: 200 },
      { cLow: 106, cHigh: 200, iLow: 201, iHigh: 300 },
    ];
    for (const bp of breakpoints) {
      if (o3 >= bp.cLow && o3 <= bp.cHigh) {
        return this.normalizeAQI(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (o3 - bp.cLow) + bp.iLow);
      }
    }
    return 500;
  }

  private calculateAQIFromSO2(so2: number): number {
    // SO2 in ppb (1-hour)
    const breakpoints = [
      { cLow: 0, cHigh: 35, iLow: 0, iHigh: 50 },
      { cLow: 36, cHigh: 75, iLow: 51, iHigh: 100 },
      { cLow: 76, cHigh: 185, iLow: 101, iHigh: 150 },
      { cLow: 186, cHigh: 304, iLow: 151, iHigh: 200 },
      { cLow: 305, cHigh: 604, iLow: 201, iHigh: 300 },
      { cLow: 605, cHigh: 1004, iLow: 301, iHigh: 500 },
    ];
    for (const bp of breakpoints) {
      if (so2 >= bp.cLow && so2 <= bp.cHigh) {
        return this.normalizeAQI(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (so2 - bp.cLow) + bp.iLow);
      }
    }
    return 500;
  }

  private calculateAQIFromCO(co: number): number {
    // CO in ppm (8-hour)
    const breakpoints = [
      { cLow: 0.0, cHigh: 4.4, iLow: 0, iHigh: 50 },
      { cLow: 4.5, cHigh: 9.4, iLow: 51, iHigh: 100 },
      { cLow: 9.5, cHigh: 12.4, iLow: 101, iHigh: 150 },
      { cLow: 12.5, cHigh: 15.4, iLow: 151, iHigh: 200 },
      { cLow: 15.5, cHigh: 30.4, iLow: 201, iHigh: 300 },
      { cLow: 30.5, cHigh: 50.4, iLow: 301, iHigh: 500 },
    ];
    for (const bp of breakpoints) {
      if (co >= bp.cLow && co <= bp.cHigh) {
        return this.normalizeAQI(((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (co - bp.cLow) + bp.iLow);
      }
    }
    return 500;
  }
}