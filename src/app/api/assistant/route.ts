import { NextRequest, NextResponse } from 'next/server';
import { getLocationById, fetchCurrentAQI } from '@/lib/aqi/aggregator';
import { generateAIResponse, generateDailyPlan } from '@/lib/ai/orchestrator';
import { assistantRequestSchema } from '@/lib/validators/schemas';
import type { AQIReading, HouseholdProfile } from '@/types';

// Simple in-process rate limiter (resets on cold start — acceptable for free tier)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // 10 requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending another message.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      );
    }

    const body = await request.json();
    const validation = assistantRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { message, context } = validation.data;
    const language: 'en' | 'hi' = (context as { language?: string } | undefined)?.language === 'hi' ? 'hi' : 'en';

    let aqi: AQIReading | undefined;
    let profiles: HouseholdProfile[] | undefined;

    if (context?.locationId) {
      const location = getLocationById(context.locationId);
      if (location) {
        aqi = await fetchCurrentAQI(location) ?? undefined;
      }
    }

    if (context?.profiles) {
      profiles = context.profiles;
    }

    // If generating daily plan
    if (message.toLowerCase().includes('daily plan') || message.toLowerCase().includes('action plan') || message.toLowerCase().includes('आज की योजना')) {
      const planResult = await generateDailyPlan({
        aqi,
        profiles,
        language,
      });
      return NextResponse.json({
        response: planResult.plan,
        citations: planResult.citations,
        type: 'daily_plan',
      });
    }

    // Regular conversation
    const aiContext = {
      aqi,
      profiles,
      language,
    };

    const result = await generateAIResponse(message, aiContext, []);

    return NextResponse.json({
      response: result.response,
      citations: result.citations,
      type: 'conversation',
    });
  } catch (error) {
    console.error('[API /assistant] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}