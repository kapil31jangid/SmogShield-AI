import type { TravelPattern, HouseholdProfile } from '@/types';
import { generateId } from '@/lib/utils/helpers';

export interface EmissionAlternative {
  id: string;
  originalMode: string;
  alternativeMode: string;
  description: string;
  co2eSavedKgPerTrip: number;
  co2eSavedKgPerYear: number;
  assumptions: string[];
  dataSource: string;
  feasibility: 'easy' | 'moderate' | 'hard';
  aqiCondition?: string;
}

export interface TripPlan {
  id: string;
  profileId: string;
  originalMode: string;
  suggestedMode: string;
  reason: string;
  estimatedSavings: { co2eKg: number; rupees?: number };
  aqiConstraint: string;
}

const EMISSION_FACTORS_INDIA = {
  // g CO2e per passenger-km (Indian context)
  car_petrol: 150,
  car_diesel: 130,
  car_electric: 60, // Indian grid average
  car_cng: 90,
  motorbike: 80,
  auto_rickshaw: 60,
  bus: 25,
  metro: 20,
  local_train: 15,
  walk: 0,
  cycle: 0,
  carpool_2: 75, // per person
  carpool_3: 50,
  carpool_4: 37.5,
};

const AVERAGE_TRIP_KM = 12; // Typical urban commute
const WORKING_DAYS_YEAR = 250;

export function getEmissionAlternatives(
  currentMode: TravelPattern['mode'],
  profile: HouseholdProfile,
  aqi: number
): EmissionAlternative[] {
  const alternatives: EmissionAlternative[] = [];
  const currentFactor = EMISSION_FACTORS_INDIA[currentMode as keyof typeof EMISSION_FACTORS_INDIA] ?? 100;
  const currentPerTrip = (currentFactor * AVERAGE_TRIP_KM) / 1000; // kg CO2e
  const currentPerYear = currentPerTrip * 2 * WORKING_DAYS_YEAR; // round trip

  const modeOptions: Array<{
    mode: keyof typeof EMISSION_FACTORS_INDIA;
    label: string;
    feasibility: 'easy' | 'moderate' | 'hard';
    aqiConstraint?: string;
  }> = [
    { mode: 'metro', label: 'Metro Rail', feasibility: 'easy', aqiConstraint: 'Any AQI' },
    { mode: 'bus', label: 'Public Bus', feasibility: 'easy', aqiConstraint: 'Any AQI' },
    { mode: 'local_train', label: 'Local/Suburban Train', feasibility: 'moderate', aqiConstraint: 'Any AQI' },
    { mode: 'carpool_2', label: 'Carpool (2 people)', feasibility: 'moderate', aqiConstraint: 'Any AQI' },
    { mode: 'carpool_3', label: 'Carpool (3+ people)', feasibility: 'hard', aqiConstraint: 'Any AQI' },
    { mode: 'cycle', label: 'Cycle', feasibility: 'moderate', aqiConstraint: 'AQI < 150' },
    { mode: 'walk', label: 'Walk', feasibility: 'hard', aqiConstraint: 'AQI < 100, distance < 3km' },
    { mode: 'car_electric', label: 'Electric Vehicle', feasibility: 'hard', aqiConstraint: 'Any AQI' },
    { mode: 'car_cng', label: 'CNG Vehicle', feasibility: 'hard', aqiConstraint: 'Any AQI' },
  ];

  for (const opt of modeOptions) {
    const altFactor = EMISSION_FACTORS_INDIA[opt.mode];
    const altPerTrip = (altFactor * AVERAGE_TRIP_KM) / 1000;
    const savingsPerTrip = currentPerTrip - altPerTrip;

    if (savingsPerTrip <= 0) continue;

    // Check AQI constraint
    let aqiOk = true;
    if (opt.aqiConstraint && opt.aqiConstraint !== 'Any AQI') {
      if (opt.aqiConstraint.includes('< 150')) aqiOk = aqi < 150;
      else if (opt.aqiConstraint.includes('< 100')) aqiOk = aqi < 100;
    }

    alternatives.push({
      id: generateId(),
      originalMode: currentMode,
      alternativeMode: opt.label,
      description: `Switch from ${currentMode.replace('_', ' ')} to ${opt.label} for daily commute`,
      co2eSavedKgPerTrip: Math.round(savingsPerTrip * 100) / 100,
      co2eSavedKgPerYear: Math.round(savingsPerTrip * 2 * WORKING_DAYS_YEAR * 100) / 100,
      assumptions: [
        `Average trip distance: ${AVERAGE_TRIP_KM} km one way`,
        `Working days/year: ${WORKING_DAYS_YEAR}`,
        `Emission factors based on Indian transport studies (CSTEP, TERI, ICCT)`,
        `Car occupancy: 1.2 (solo) vs carpool 2-4`,
        `Electric vehicle: Indian grid average (~700g CO2/kWh)`,
      ],
      dataSource: 'Indian transport emission factors (CSTEP 2023, TERI, ICCT India)',
      feasibility: opt.feasibility,
      aqiCondition: aqiOk ? '' : `Not recommended at current AQI ${aqi} (${opt.aqiConstraint})`,
    });
  }

  // Sort by savings descending
  return alternatives.sort((a, b) => b.co2eSavedKgPerYear - a.co2eSavedKgPerYear);
}

export function getDailyTripPlan(
  profiles: HouseholdProfile[],
  travelPatterns: TravelPattern[],
  aqi: number
): TripPlan[] {
  const plans: TripPlan[] = [];

  for (const pattern of travelPatterns) {
    const profile = profiles.find(p => p.id === pattern.profileId);
    if (!profile) continue;

    const alternatives = getEmissionAlternatives(pattern.mode, profile, aqi);
    const bestAlt = alternatives[0];

    if (bestAlt && bestAlt.co2eSavedKgPerTrip > 0.1) {
      plans.push({
        id: generateId(),
        profileId: profile.id,
        originalMode: pattern.mode,
        suggestedMode: bestAlt.alternativeMode,
        reason: bestAlt.aqiCondition
          ? `Would save ${bestAlt.co2eSavedKgPerYear.toFixed(1)} kg CO₂e/year but not recommended at current AQI`
          : `Save ~${bestAlt.co2eSavedKgPerYear.toFixed(1)} kg CO₂e/year (${bestAlt.co2eSavedKgPerTrip.toFixed(2)} kg/trip)`,
        estimatedSavings: {
          co2eKg: bestAlt.co2eSavedKgPerYear,
          rupees: Math.round(bestAlt.co2eSavedKgPerYear * 50), // Rough social cost of carbon ₹50/kg
        },
        aqiConstraint: bestAlt.aqiCondition ?? 'Safe at current AQI',
      });
    }
  }

  return plans;
}

export function getHouseholdEmissionBaseline(
  profiles: HouseholdProfile[],
  travelPatterns: TravelPattern[]
): { totalKgPerYear: number; byMode: Record<string, number>; byProfile: Record<string, number> } {
  const byMode: Record<string, number> = {};
  const byProfile: Record<string, number> = {};
  let totalKgPerYear = 0;

  for (const pattern of travelPatterns) {
    const profile = profiles.find(p => p.id === pattern.profileId);
    if (!profile) continue;

    const factor = EMISSION_FACTORS_INDIA[pattern.mode as keyof typeof EMISSION_FACTORS_INDIA] ?? 100;
    const perTripKg = (factor * AVERAGE_TRIP_KM) / 1000;
    const perYearKg = perTripKg * 2 * WORKING_DAYS_YEAR * (pattern.frequency === 'daily' ? 1 : 0.5);

    byMode[pattern.mode] = (byMode[pattern.mode] ?? 0) + perYearKg;
    byProfile[profile.name] = (byProfile[profile.name] ?? 0) + perYearKg;
    totalKgPerYear += perYearKg;
  }

  return {
    totalKgPerYear: Math.round(totalKgPerYear * 100) / 100,
    byMode,
    byProfile,
  };
}

export function getCombinedErrandsSavings(tripsPerWeek: number, combinedTripsPerWeek: number): {
  tripsReduced: number;
  co2eKgPerYear: number;
  assumptions: string[];
} {
  const tripsReduced = tripsPerWeek - combinedTripsPerWeek;
  const co2ePerTrip = (EMISSION_FACTORS_INDIA.car_petrol * AVERAGE_TRIP_KM) / 1000;
  const co2eKgPerYear = tripsReduced * co2ePerTrip * 52;

  return {
    tripsReduced,
    co2eKgPerYear: Math.round(co2eKgPerYear * 100) / 100,
    assumptions: [
      `Avoided trips replaced car trips (${EMISSION_FACTORS_INDIA.car_petrol}g CO2/km)`,
      `Average trip distance: ${AVERAGE_TRIP_KM} km`,
      `Weeks per year: 52`,
    ],
  };
}