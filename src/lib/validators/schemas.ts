import { z } from 'zod';

export const locationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  timezone: z.string().min(1),
});

export const aqiReadingSchema = z.object({
  aqi: z.number().int().min(0).max(500),
  pm25: z.number().min(0).optional(),
  pm10: z.number().min(0).optional(),
  no2: z.number().min(0).optional(),
  o3: z.number().min(0).optional(),
  so2: z.number().min(0).optional(),
  co: z.number().min(0).optional(),
  timestamp: z.string().datetime(),
  source: z.string().min(1),
  location: locationSchema,
  dataFreshness: z.enum(['live', 'cached', 'stale', 'demo']),
});

export const householdProfileSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string().min(1).max(50),
  category: z.enum(['child', 'adult', 'older_adult']),
  conditions: z.array(z.string()).default([]),
  outdoorFrequency: z.enum(['low', 'medium', 'high']),
  commutePattern: z.enum(['walk', 'cycle', 'public_transport', 'car', 'mixed']),
  hasAirPurifier: z.boolean(),
  purifierCADR: z.number().positive().optional(),
  roomSizeSqFt: z.number().positive().optional(),
  preferredLanguage: z.enum(['en', 'hi']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const createProfileSchema = householdProfileSchema.omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const updateProfileSchema = createProfileSchema.partial();

export const plannedActivitySchema = z.object({
  id: z.string().min(1),
  profileId: z.string().min(1),
  type: z.enum(['exercise', 'commute', 'school', 'errand', 'leisure', 'other']),
  plannedTime: z.string().datetime(),
  durationMinutes: z.number().int().positive(),
  isEssential: z.boolean(),
  location: z.enum(['indoor', 'outdoor']).optional(),
});

export const indoorConditionsSchema = z.object({
  pm25: z.number().min(0).optional(),
  co2: z.number().min(0).optional(),
  humidity: z.number().min(0).max(100).optional(),
  temperature: z.number().optional(),
  lastVentilated: z.string().datetime().optional(),
  sources: z.array(z.string()).default([]),
});

export const travelPatternSchema = z.object({
  profileId: z.string().min(1),
  mode: z.enum(['walk', 'cycle', 'public_transport', 'car', 'carpool']),
  frequency: z.enum(['daily', 'weekdays', 'weekly', 'occasional']),
  durationMinutes: z.number().int().positive(),
  routeAQI: z.number().int().min(0).max(500).optional(),
});

export const recommendationContextSchema = z.object({
  aqi: aqiReadingSchema,
  profiles: z.array(householdProfileSchema),
  plannedActivities: z.array(plannedActivitySchema).default([]),
  indoorConditions: indoorConditionsSchema.optional(),
  travelPatterns: z.array(travelPatternSchema).default([]),
});

export const recommendationSchema = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
  reason: z.string().min(1),
  supportingData: z.string().min(1),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
  timeWindow: z.string().min(1),
  limitations: z.array(z.string()).default([]),
  category: z.enum(['outdoor', 'indoor', 'travel', 'community', 'lifestyle']),
  profileIds: z.array(z.string()).optional(),
});

export const trackedActionSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  profileId: z.string().optional(),
  type: z.enum(['carpool', 'public_transport', 'walk_cycle', 'avoided_trip', 'source_reduction', 'community_event']),
  description: z.string().min(1),
  estimatedCO2eKg: z.number().min(0),
  assumptions: z.array(z.string()).default([]),
  dataSource: z.string().min(1),
  timestamp: z.string().datetime(),
  verified: z.boolean(),
});

export const createActionSchema = trackedActionSchema.omit({
  id: true,
  userId: true,
  timestamp: true,
  verified: true,
});

export const communityChallengeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['household', 'school', 'neighborhood']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  targetActions: z.number().int().positive(),
  currentActions: z.number().int().min(0),
  participants: z.array(z.string()).default([]),
  isActive: z.boolean(),
});

export const aiMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2000),
  timestamp: z.string().datetime(),
  citations: z.array(z.string()).optional(),
});

export const aiConversationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  messages: z.array(aiMessageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    data: dataSchema.nullable(),
    error: z.string().nullable(),
    freshness: z.enum(['live', 'cached', 'stale', 'demo']),
    timestamp: z.string().datetime(),
  });

// Input validation for API routes
export const aqiQuerySchema = z.object({
  location: z.string().min(1),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});

export const recommendationsRequestSchema = z.object({
  locationId: z.string().min(1),
  profileIds: z.array(z.string()).optional(),
  activityIds: z.array(z.string()).optional(),
});

export const assistantRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().optional(),
  context: z.object({
    locationId: z.string().optional(),
    aqi: aqiReadingSchema.optional(),
    profiles: z.array(householdProfileSchema).optional(),
  }).optional(),
});

export const actionRequestSchema = z.object({
  type: z.enum(['carpool', 'public_transport', 'walk_cycle', 'avoided_trip', 'source_reduction', 'community_event']),
  description: z.string().min(1).max(200),
  profileId: z.string().optional(),
});

export const challengeParticipationSchema = z.object({
  challengeId: z.string().min(1),
  actionId: z.string().min(1),
});