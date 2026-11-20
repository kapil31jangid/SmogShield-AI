import type { AQIProvider, AQIReading, Location } from '@/types';

export abstract class BaseAQIProvider implements AQIProvider {
  abstract readonly name: string;
  abstract readonly attribution: string;

  abstract fetchCurrent(location: Location): Promise<AQIReading | null>;
  abstract fetchHistorical(location: Location, days: number): Promise<AQIReading[]>;

  isConfigured(): boolean {
    return true;
  }

  protected normalizeAQI(usAQI: number): number {
    return Math.min(500, Math.max(0, Math.round(usAQI)));
  }

  protected calculateAQIFromPM25(pm25: number): number {
    // Indian CPCB AQI calculation for PM2.5 (24-hour average, µg/m³)
    // Source: CPCB National Ambient Air Quality Standards, 2014
    const breakpoints = [
      { cLow: 0,   cHigh: 30,  iLow: 0,   iHigh: 50  },  // Good
      { cLow: 31,  cHigh: 60,  iLow: 51,  iHigh: 100 },  // Satisfactory
      { cLow: 61,  cHigh: 90,  iLow: 101, iHigh: 200 },  // Moderate
      { cLow: 91,  cHigh: 120, iLow: 201, iHigh: 300 },  // Poor
      { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 },  // Very Poor
      { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 },  // Severe
    ];

    for (const bp of breakpoints) {
      if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
        const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow;
        return this.normalizeAQI(aqi);
      }
    }
    return 500;
  }

  protected createReading(
    aqi: number,
    location: Location,
    pollutants: Partial<Pick<AQIReading, 'pm25' | 'pm10' | 'no2' | 'o3' | 'so2' | 'co'>> = {},
    freshness: AQIReading['dataFreshness'] = 'live'
  ): AQIReading {
    return {
      aqi,
      ...pollutants,
      timestamp: new Date().toISOString(),
      source: this.name,
      location,
      dataFreshness: freshness,
    };
  }
}