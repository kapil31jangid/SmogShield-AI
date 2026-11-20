import { NextRequest, NextResponse } from 'next/server';
import { getLocationById, fetchCurrentAQI } from '@/lib/aqi/aggregator';
import { generateRecommendations, getDailyActionPlan } from '@/lib/recommendations/engine';
import { getIndoorGuidance } from '@/lib/indoor/advisor';
import { recommendationsRequestSchema } from '@/lib/validators/schemas';
import type { RecommendationContext } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = recommendationsRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { locationId, profileIds, activityIds } = validation.data;

    const location = getLocationById(locationId);
    if (!location) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    const aqi = await fetchCurrentAQI(location);
    if (!aqi) {
      return NextResponse.json({ error: 'Failed to fetch AQI data' }, { status: 503 });
    }

    // In production, fetch profiles and activities from database
    // For now, use mock data
    const mockProfiles = [
      { id: '1', userId: 'demo', name: 'Priya', category: 'adult' as const, conditions: ['asthma'], outdoorFrequency: 'medium' as const, commutePattern: 'public_transport' as const, hasAirPurifier: true, purifierCADR: 400, roomSizeSqFt: 150, preferredLanguage: 'en' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', userId: 'demo', name: 'Arjun', category: 'child' as const, conditions: [], outdoorFrequency: 'high' as const, commutePattern: 'walk' as const, hasAirPurifier: false, preferredLanguage: 'en' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '3', userId: 'demo', name: 'Dadi', category: 'older_adult' as const, conditions: ['hypertension'], outdoorFrequency: 'low' as const, commutePattern: 'car' as const, hasAirPurifier: true, purifierCADR: 300, roomSizeSqFt: 120, preferredLanguage: 'hi' as const, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];

    const filteredProfiles = profileIds?.length
      ? mockProfiles.filter(p => profileIds.includes(p.id))
      : mockProfiles;

    const context: RecommendationContext = {
      aqi,
      profiles: filteredProfiles,
      plannedActivities: [],
      travelPatterns: [],
    };

    const recommendations = generateRecommendations(context);
    const dailyPlan = getDailyActionPlan(context);
    const indoorGuidance = getIndoorGuidance(filteredProfiles, aqi);

    return NextResponse.json({
      recommendations,
      dailyPlan,
      indoorGuidance,
      aqi,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API /recommendations] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}