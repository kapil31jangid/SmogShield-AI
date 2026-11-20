import { NextRequest, NextResponse } from 'next/server';
import { getLocationById, fetchCurrentAQI, fetchHistoricalAQI } from '@/lib/aqi/aggregator';
import { aqiQuerySchema } from '@/lib/validators/schemas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ location: string }> }
) {
  try {
    const { location: locationId } = await params;
    const { searchParams } = new URL(request.url);

    const validation = aqiQuerySchema.safeParse({
      location: locationId,
      lat: searchParams.get('lat') ? Number(searchParams.get('lat')) : undefined,
      lon: searchParams.get('lon') ? Number(searchParams.get('lon')) : undefined,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid location parameters', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    let location = getLocationById(locationId);

    // If not in predefined list, create from query params
    if (!location && validation.data.lat && validation.data.lon) {
      location = {
        id: locationId,
        name: locationId,
        lat: validation.data.lat,
        lon: validation.data.lon,
        timezone: 'Asia/Kolkata',
      };
    }

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    const days = searchParams.get('days') ? Number(searchParams.get('days')) : 7;

    const [current, historical] = await Promise.all([
      fetchCurrentAQI(location),
      fetchHistoricalAQI(location, days),
    ]);

    if (!current) {
      return NextResponse.json(
        { error: 'Failed to fetch AQI data from all providers' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      current,
      historical,
      location,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /aqi] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}