import type { TrackedAction, HouseholdProfile } from '@/types';
import { calculateCO2eSavings } from '@/lib/utils/helpers';

export interface ImpactSummary {
  totalActions: number;
  totalCO2eKg: number;
  byType: Record<string, { count: number; co2eKg: number }>;
  byProfile: Record<string, { count: number; co2eKg: number }>;
  weeklyTrend: Array<{ week: string; co2eKg: number }>;
  monthlyTrend: Array<{ month: string; co2eKg: number }>;
  equivalencies: Array<{ label: string; value: string }>;
}

export interface ActionEstimate {
  estimatedCO2eKg: number;
  assumptions: string[];
  dataSource: string;
  limitations: string[];
}

export function estimateActionImpact(
  actionType: TrackedAction['type'],
  description: string,
  profile?: HouseholdProfile
): ActionEstimate {
  const base = calculateCO2eSavings(actionType, 1);
  let multiplier = 1;
  const additionalAssumptions: string[] = [];

  // Adjust based on profile
  if (profile) {
    if (profile.commutePattern === 'car' && actionType === 'carpool') {
      multiplier = 1.5; // Longer commutes = more savings
      additionalAssumptions.push('Assumes longer than average car commute');
    }
    if (profile.category === 'child' && actionType === 'walk_cycle') {
      multiplier = 0.5; // Shorter trips
      additionalAssumptions.push('Child trips typically shorter distance');
    }
  }

  // Adjust based on description keywords
  const desc = description.toLowerCase();
  if (desc.includes('long') || desc.includes('far')) multiplier *= 1.3;
  if (desc.includes('short') || desc.includes('near')) multiplier *= 0.7;
  if (desc.includes('daily') || desc.includes('everyday')) multiplier *= 5; // Per week estimate

  const estimatedCO2eKg = Math.round(base.value * multiplier * 100) / 100;

  return {
    estimatedCO2eKg,
    assumptions: [
      ...base.assumptions,
      `Multiplier applied: ${multiplier.toFixed(1)}x based on context`,
      ...additionalAssumptions,
      'Estimates are indicative only; actual savings vary significantly',
      'Does not account for induced demand or systemic effects',
    ],
    dataSource: base.unit.includes('trip') ? 'Indian transport emission factors (CSTEP, TERI, ICCT)' : 'Household energy/behavior estimates',
    limitations: [
      'Individual action impact on ambient AQI is negligible',
      'Estimates based on averages, not your specific situation',
      'Upstream emissions (vehicle manufacturing, fuel extraction) not included',
      'Behavioral rebound effects not modeled (e.g., savings spent on other consumption)',
    ],
  };
}

export function calculateImpactSummary(actions: TrackedAction[], profiles: HouseholdProfile[]): ImpactSummary {
  const now = new Date();
  const byType: Record<string, { count: number; co2eKg: number }> = {};
  const byProfile: Record<string, { count: number; co2eKg: number }> = {};
  let totalCO2eKg = 0;

  for (const action of actions) {
    totalCO2eKg += action.estimatedCO2eKg;

    const typeEntry = byType[action.type] ?? { count: 0, co2eKg: 0 };
    byType[action.type] = typeEntry;
    typeEntry.count++;
    typeEntry.co2eKg += action.estimatedCO2eKg;

    if (action.profileId) {
      const profile = profiles.find(p => p.id === action.profileId);
      const profileName = profile?.name ?? action.profileId;
      if (!byProfile[profileName]) byProfile[profileName] = { count: 0, co2eKg: 0 };
      byProfile[profileName].count++;
      byProfile[profileName].co2eKg += action.estimatedCO2eKg;
    }
  }

  // Weekly trend (last 8 weeks)
  const weeklyTrend: Array<{ week: string; co2eKg: number }> = [];
  for (let i = 7; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 86400000);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);

    const weekActions = actions.filter(a => {
      const actionDate = new Date(a.timestamp);
      return actionDate >= weekStart && actionDate < weekEnd;
    });

    const weekCO2e = weekActions.reduce((sum, a) => sum + a.estimatedCO2eKg, 0);
    weeklyTrend.push({
      week: weekStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      co2eKg: Math.round(weekCO2e * 100) / 100,
    });
  }

  // Monthly trend (last 6 months)
  const monthlyTrend: Array<{ month: string; co2eKg: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

    const monthActions = actions.filter(a => {
      const actionDate = new Date(a.timestamp);
      return actionDate >= monthStart && actionDate < monthEnd;
    });

    const monthCO2e = monthActions.reduce((sum, a) => sum + a.estimatedCO2eKg, 0);
    monthlyTrend.push({
      month: monthStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      co2eKg: Math.round(monthCO2e * 100) / 100,
    });
  }

  // Equivalencies
  const equivalencies = [
    { label: 'Tree seedlings grown for 10 years', value: `${Math.round(totalCO2eKg / 0.06)}` },
    { label: 'Smartphone charges', value: `${Math.round(totalCO2eKg / 0.008)}` },
    { label: 'Kilometers driven by average car', value: `${Math.round(totalCO2eKg / 0.15)}` },
    { label: 'Litres of petrol avoided', value: `${Math.round(totalCO2eKg / 2.3)}` },
  ].filter(e => parseInt(e.value) > 0);

  return {
    totalActions: actions.length,
    totalCO2eKg: Math.round(totalCO2eKg * 100) / 100,
    byType,
    byProfile,
    weeklyTrend,
    monthlyTrend,
    equivalencies,
  };
}

export function getActionTypeLabel(type: TrackedAction['type']): string {
  const labels: Record<TrackedAction['type'], string> = {
    carpool: 'Carpool Trip',
    public_transport: 'Public Transport',
    walk_cycle: 'Walk/Cycle',
    avoided_trip: 'Avoided Trip',
    source_reduction: 'Indoor Source Reduction',
    community_event: 'Community Event',
  };
  return labels[type];
}

export function getActionTypeIcon(type: TrackedAction['type']): string {
  const icons: Record<TrackedAction['type'], string> = {
    carpool: 'car',
    public_transport: 'bus',
    walk_cycle: 'bike',
    avoided_trip: 'minus-circle',
    source_reduction: 'home',
    community_event: 'users',
  };
  return icons[type];
}