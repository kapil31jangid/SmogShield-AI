export interface Location {
  id: string;
  name: string;
  lat: number;
  lon: number;
  timezone: string;
}

export interface AQIProvider {
  name: string;
  attribution: string;
  fetchCurrent(location: Location): Promise<AQIReading | null>;
  fetchHistorical(location: Location, days: number): Promise<AQIReading[]>;
  isConfigured(): boolean;
}

export interface AQIReading {
  aqi: number;
  pm25?: number;
  pm10?: number;
  no2?: number;
  o3?: number;
  so2?: number;
  co?: number;
  timestamp: string;
  source: string;
  location: Location;
  dataFreshness: 'live' | 'cached' | 'stale' | 'demo';
}

export interface AQICategory {
  label: string;
  color: string;
  range: [number, number];
  description: string;
}

export const AQI_CATEGORIES: AQICategory[] = [
  { label: 'Good', color: '#55a84f', range: [0, 50], description: 'Air quality is considered satisfactory and pollution poses little or no risk.' },
  { label: 'Satisfactory', color: '#a3c853', range: [51, 100], description: 'Air quality is acceptable; minor breathing discomfort for unusually sensitive individuals.' },
  { label: 'Moderate', color: '#fff833', range: [101, 200], description: 'May cause breathing discomfort to people with lung/heart disease. General public less likely to be affected.' },
  { label: 'Poor', color: '#f29c33', range: [201, 300], description: 'May cause breathing discomfort to people on prolonged outdoor exposure. Those with lung/heart disease may experience worsening.' },
  { label: 'Very Poor', color: '#e93f33', range: [301, 400], description: 'May cause respiratory illness on prolonged exposure. Effect may be more pronounced in people with lung/heart disease.' },
  { label: 'Severe', color: '#af2d24', range: [401, 500], description: 'May affect healthy people and seriously impacts those with existing lung/heart disease. Health warning: everyone may experience serious effects.' },
];

export function getAQICategory(aqi: number): AQICategory {
  const category = AQI_CATEGORIES.find(c => aqi >= c.range[0] && aqi <= c.range[1]);
  return category ?? AQI_CATEGORIES[AQI_CATEGORIES.length - 1] as AQICategory;
}

export interface HouseholdProfile {
  id: string;
  userId: string;
  name: string;
  category: 'child' | 'adult' | 'older_adult';
  conditions: string[];
  outdoorFrequency: 'low' | 'medium' | 'high';
  commutePattern: 'walk' | 'cycle' | 'public_transport' | 'car' | 'mixed';
  hasAirPurifier: boolean;
  purifierCADR?: number;
  roomSizeSqFt?: number;
  preferredLanguage: 'en' | 'hi';
  createdAt: string;
  updatedAt: string;
}

export interface PlannedActivity {
  id: string;
  profileId: string;
  type: 'exercise' | 'commute' | 'school' | 'errand' | 'leisure' | 'other';
  plannedTime: string;
  durationMinutes: number;
  isEssential: boolean;
  location?: 'indoor' | 'outdoor';
}

export interface IndoorConditions {
  pm25?: number;
  co2?: number;
  humidity?: number;
  temperature?: number;
  lastVentilated?: string;
  sources: string[];
}

export interface TravelPattern {
  profileId: string;
  mode: 'walk' | 'cycle' | 'public_transport' | 'car' | 'carpool';
  frequency: 'daily' | 'weekdays' | 'weekly' | 'occasional';
  durationMinutes: number;
  routeAQI?: number;
}

export interface Recommendation {
  id: string;
  action: string;
  reason: string;
  supportingData: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeWindow: string;
  limitations: string[];
  category: 'outdoor' | 'indoor' | 'travel' | 'community' | 'lifestyle';
  profileIds?: string[];
}

export interface RecommendationContext {
  aqi: AQIReading;
  profiles: HouseholdProfile[];
  plannedActivities: PlannedActivity[];
  indoorConditions?: IndoorConditions;
  travelPatterns?: TravelPattern[];
}

export interface TrackedAction {
  id: string;
  userId: string;
  profileId?: string;
  type: 'carpool' | 'public_transport' | 'walk_cycle' | 'avoided_trip' | 'source_reduction' | 'community_event';
  description: string;
  estimatedCO2eKg: number;
  assumptions: string[];
  dataSource: string;
  timestamp: string;
  verified: boolean;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'household' | 'school' | 'neighborhood';
  startDate: string;
  endDate: string;
  targetActions: number;
  currentActions: number;
  participants: string[];
  isActive: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: string[];
}

export interface AIConversation {
  id: string;
  userId: string;
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export type DataFreshness = 'live' | 'cached' | 'stale' | 'demo';

export interface APIResponse<T> {
  data: T | null;
  error: string | null;
  freshness: DataFreshness;
  timestamp: string;
}