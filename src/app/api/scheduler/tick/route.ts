import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/auth/firebase-admin';
import { getAvailableLocations, fetchCurrentAQI } from '@/lib/aqi/aggregator';

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getAdminDb();
    const locations = getAvailableLocations();
    const now = new Date().toISOString();

    // Refresh AQI for all locations and cache
    const results = await Promise.allSettled(
      locations.map(async (location) => {
        const aqi = await fetchCurrentAQI(location);
        if (aqi) {
          // Could store in Firestore for historical tracking
          // await db.collection('aqi_cache').doc(location.id).set({ ...aqi, updatedAt: now });
        }
        return { location: location.id, success: !!aqi };
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    // Could also trigger daily notifications, challenge updates, etc.

    return NextResponse.json({
      success: true,
      timestamp: now,
      locationsChecked: locations.length,
      successful,
      failed,
      message: `AQI refresh completed: ${successful} successful, ${failed} failed`,
    });
  } catch (error) {
    console.error('[Cron /scheduler/tick] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}