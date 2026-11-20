import type {
  Recommendation,
  RecommendationContext,
  HouseholdProfile,
  AQIReading,
  PlannedActivity,
  IndoorConditions,
  TravelPattern,
} from '@/types';
import { getAQICategory } from '@/types';
import { generateId } from '@/lib/utils/helpers';

interface ProfileRiskFactor {
  profile: HouseholdProfile;
  riskMultiplier: number;
  sensitivityLevel: 'low' | 'medium' | 'high' | 'critical';
}

function calculateProfileRisk(profile: HouseholdProfile, aqi: number): ProfileRiskFactor {
  let riskMultiplier = 1.0;
  let sensitivityLevel: ProfileRiskFactor['sensitivityLevel'] = 'low';

  switch (profile.category) {
    case 'child':
      riskMultiplier *= 1.5;
      sensitivityLevel = 'high';
      break;
    case 'older_adult':
      riskMultiplier *= 1.5;
      sensitivityLevel = 'high';
      break;
    case 'adult':
      riskMultiplier *= 1.0;
      sensitivityLevel = 'medium';
      break;
  }

  const respiratoryConditions = ['asthma', 'copd', 'bronchitis', 'respiratory', 'lung', 'allergy'];
  const cardiacConditions = ['heart', 'cardiac', 'hypertension', 'blood pressure'];
  const hasRespiratory = profile.conditions.some(c => respiratoryConditions.some(rc => c.toLowerCase().includes(rc)));
  const hasCardiac = profile.conditions.some(c => cardiacConditions.some(cc => c.toLowerCase().includes(cc)));

  if (hasRespiratory) {
    riskMultiplier *= 2.0;
    sensitivityLevel = 'critical';
  }
  if (hasCardiac) {
    riskMultiplier *= 1.5;
    if (sensitivityLevel !== 'critical') sensitivityLevel = 'high';
  }

  if (profile.outdoorFrequency === 'high') riskMultiplier *= 1.2;
  else if (profile.outdoorFrequency === 'low') riskMultiplier *= 0.9;

  if (profile.commutePattern === 'walk' || profile.commutePattern === 'cycle') riskMultiplier *= 1.3;
  else if (profile.commutePattern === 'public_transport') riskMultiplier *= 1.1;

  if (profile.hasAirPurifier && profile.purifierCADR && profile.roomSizeSqFt) {
    const ach = (profile.purifierCADR * 60) / (profile.roomSizeSqFt * 8);
    if (ach >= 5) riskMultiplier *= 0.7;
    else if (ach >= 3) riskMultiplier *= 0.85;
  }

  const effectiveAQI = Math.min(500, Math.round(aqi * riskMultiplier));

  return { profile, riskMultiplier, sensitivityLevel };
}

function getEffectiveCategory(aqi: number, riskMultiplier: number): ReturnType<typeof getAQICategory> {
  const effectiveAQI = Math.min(500, Math.round(aqi * riskMultiplier));
  return getAQICategory(effectiveAQI);
}

export function generateRecommendations(context: RecommendationContext): Recommendation[] {
  const { aqi, profiles, plannedActivities, indoorConditions, travelPatterns } = context;
  const recommendations: Recommendation[] = [];
  const baseCategory = getAQICategory(aqi.aqi);

  const profileRisks = profiles.map(p => calculateProfileRisk(p, aqi.aqi));
  const maxRisk = Math.max(...profileRisks.map(pr => pr.riskMultiplier));
  const worstSensitivity = profileRisks.reduce((worst: 'low' | 'medium' | 'high' | 'critical', pr) => {
    const order = { low: 0, medium: 1, high: 2, critical: 3 };
    return order[pr.sensitivityLevel] > order[worst] ? pr.sensitivityLevel : worst;
  }, 'low');

  if (baseCategory.range[0] >= 101) {
    const sensitiveProfiles = profileRisks.filter(pr => pr.sensitivityLevel === 'high' || pr.sensitivityLevel === 'critical');
    if (sensitiveProfiles.length > 0) {
      recommendations.push({
        id: generateId(),
        action: 'Sensitive individuals should avoid all outdoor exertion',
        reason: `Current AQI ${aqi.aqi} (${baseCategory.label}) poses health risks for children, older adults, and those with respiratory/cardiac conditions`,
        supportingData: `AQI: ${aqi.aqi}, PM2.5: ${aqi.pm25 ?? 'N/A'} μg/m³, Sensitive profiles: ${sensitiveProfiles.length}`,
        priority: 'critical',
        timeWindow: 'Immediate, until AQI improves below 100',
        limitations: ['Based on outdoor AQI; indoor air may differ', 'Individual sensitivity varies'],
        category: 'outdoor',
        profileIds: sensitiveProfiles.map(pr => pr.profile.id),
      });
    }

    // CPCB Poor (201-300) and Very Poor (301-400) and Severe (401+) affect general population
    if (baseCategory.range[0] >= 201) {
      recommendations.push({
        id: generateId(),
        action: 'Everyone should limit outdoor activities; avoid strenuous exercise outdoors',
        reason: `AQI ${aqi.aqi} (${baseCategory.label}) — CPCB advisory: health effects likely for general population with prolonged exposure`,
        supportingData: `AQI: ${aqi.aqi}, Category: ${baseCategory.label} (CPCB scale)`,
        priority: 'critical',
        timeWindow: 'Until AQI drops below 200',
        limitations: ['Essential travel may still be necessary', 'Indoor air quality not accounted for'],
        category: 'outdoor',
      });
    }
  } else if (baseCategory.range[0] >= 51) {
    recommendations.push({
      id: generateId(),
      action: 'Sensitive individuals should consider reducing prolonged outdoor exertion',
      reason: `AQI ${aqi.aqi} (${baseCategory.label}) — may cause minor breathing discomfort for sensitive people`,
      supportingData: `AQI: ${aqi.aqi}, PM2.5: ${aqi.pm25 ?? 'N/A'} μg/m³`,
      priority: 'medium',
      timeWindow: 'During peak pollution hours (typically morning/evening rush)',
      limitations: ['General population unlikely affected'],
      category: 'outdoor',
    });
  }

  for (const activity of plannedActivities) {
    const profile = profiles.find(p => p.id === activity.profileId);
    if (!profile) continue;

    const profileRisk = profileRisks.find(pr => pr.profile.id === profile.id);
    const effectiveAQI = profileRisk ? Math.min(500, Math.round(aqi.aqi * profileRisk.riskMultiplier)) : aqi.aqi;
    const effectiveCategory = getAQICategory(effectiveAQI);

    if (activity.location === 'outdoor' || activity.type === 'exercise' || activity.type === 'school') {
      if (effectiveCategory.range[0] >= 151 && !activity.isEssential) {
        recommendations.push({
          id: generateId(),
          action: `Postpone ${activity.type} scheduled for ${new Date(activity.plannedTime).toLocaleTimeString()}`,
          reason: `Effective AQI for ${profile.name} is ${effectiveAQI} (${effectiveCategory.label}) - outdoor exertion not recommended`,
          supportingData: `Planned: ${activity.type}, Duration: ${activity.durationMinutes}min, Effective AQI: ${effectiveAQI}`,
          priority: activity.isEssential ? 'high' : 'medium',
          timeWindow: `At scheduled time (${new Date(activity.plannedTime).toLocaleString()})`,
          limitations: ['Reschedule when AQI improves', 'Consider indoor alternatives'],
          category: 'outdoor',
          profileIds: [profile.id],
        });
      } else if (effectiveCategory.range[0] >= 101) {
        recommendations.push({
          id: generateId(),
          action: `Take precautions during ${activity.type}: wear N95/KN95, limit duration`,
          reason: `Effective AQI ${effectiveAQI} (${effectiveCategory.label}) requires protection for ${profile.name}`,
          supportingData: `Activity: ${activity.type}, Effective AQI: ${effectiveAQI}`,
          priority: 'high',
          timeWindow: `During activity (${new Date(activity.plannedTime).toLocaleString()})`,
          limitations: ['N95/KN95 must fit properly', 'Reduce intensity and duration'],
          category: 'outdoor',
          profileIds: [profile.id],
        });
      }
    }
  }

  const hasHighIndoorRisk = profiles.some(p => p.category === 'child' || p.category === 'older_adult' || p.conditions.length > 0);
  if (baseCategory.range[0] >= 101 || hasHighIndoorRisk) {
    const purifierRecs = profiles.filter(p => !p.hasAirPurifier);
    if (purifierRecs.length > 0) {
      recommendations.push({
        id: generateId(),
        action: 'Use HEPA air purifier in bedrooms and living areas',
        reason: `Outdoor AQI ${aqi.aqi} (${baseCategory.label}) infiltrates indoors; HEPA filtration reduces indoor PM2.5 by 50-80%`,
        supportingData: `Outdoor AQI: ${aqi.aqi}, Profiles without purifier: ${purifierRecs.length}`,
        priority: baseCategory.range[0] >= 201 ? 'critical' : 'high',
        timeWindow: 'Continuous, especially during sleep hours',
        limitations: ['Requires proper sizing (CADR ≥ 2/3 room volume for 5 ACH)', 'Filters need regular replacement', 'Keep windows/doors closed while running'],
        category: 'indoor',
        profileIds: purifierRecs.map(p => p.id),
      });
    }

    if (profiles.some(p => p.hasAirPurifier)) {
      recommendations.push({
        id: generateId(),
        action: 'Run air purifiers on high; check filter replacement schedule',
        reason: 'High outdoor pollution increases filter loading; replace per manufacturer guidelines (typically 6-12 months)',
        supportingData: `Outdoor AQI: ${aqi.aqi}, Current filter age unknown`,
        priority: 'medium',
        timeWindow: 'Ongoing',
        limitations: ['Filter life varies by usage and pollution levels', 'Pre-filters extend HEPA life'],
        category: 'indoor',
      });
    }

    recommendations.push({
      id: generateId(),
      action: 'Keep windows and doors closed; use recirculation mode on HVAC',
      reason: `Outdoor PM2.5 (${aqi.pm25 ?? 'elevated'} μg/m³) will infiltrate; sealing reduces indoor levels by 30-50%`,
      supportingData: `Outdoor AQI: ${aqi.aqi}, PM2.5: ${aqi.pm25 ?? 'N/A'} μg/m³`,
      priority: 'high',
      timeWindow: 'While outdoor AQI > 100',
      limitations: ['Monitor indoor CO2 if sealed for >4 hours', 'Ventilate briefly when outdoor AQI temporarily improves', 'Never seal home with unvented combustion appliances'],
      category: 'indoor',
    });

    recommendations.push({
      id: generateId(),
      action: 'Eliminate indoor particle sources: no smoking, incense, candles, or frying without ventilation',
      reason: 'Indoor sources add to infiltrated outdoor pollution; eliminating them significantly reduces total exposure',
      supportingData: 'Indoor sources can contribute 20-50% of total PM2.5 exposure',
      priority: 'high',
      timeWindow: 'Immediate and ongoing',
      limitations: ['Cooking ventilation essential - use exhaust fan or open window briefly if outdoor AQI permits'],
      category: 'indoor',
    });
  }

  if (indoorConditions?.pm25 && aqi.pm25) {
    if (indoorConditions.pm25 > aqi.pm25) {
      recommendations.push({
        id: generateId(),
        action: 'Ventilate now: indoor PM2.5 exceeds outdoor',
        reason: `Indoor PM2.5 (${indoorConditions.pm25} μg/m³) > Outdoor (${aqi.pm25} μg/m³) - cross-ventilation will reduce indoor levels`,
        supportingData: `Indoor: ${indoorConditions.pm25} μg/m³, Outdoor: ${aqi.pm25} μg/m³`,
        priority: 'high',
        timeWindow: '15-30 minutes cross-ventilation, then reseal',
        limitations: ['Only when outdoor AQI < indoor', 'Close windows after ventilation', 'Monitor outdoor AQI during ventilation'],
        category: 'indoor',
      });
    } else if (aqi.aqi <= 50) {
      recommendations.push({
        id: generateId(),
        action: 'Good time to ventilate: outdoor air quality is Good',
        reason: `Outdoor AQI ${aqi.aqi} (Good) - safe to bring in fresh air`,
        supportingData: `Outdoor AQI: ${aqi.aqi}`,
        priority: 'low',
        timeWindow: 'Next few hours while AQI remains good',
        limitations: ['Monitor for changes', 'Close if AQI rises'],
        category: 'indoor',
      });
    }
  }

  if (travelPatterns) {
    for (const pattern of travelPatterns) {
      const profile = profiles.find(p => p.id === pattern.profileId);
      if (!profile) continue;

      const profileRisk = profileRisks.find(pr => pr.profile.id === profile.id);
      const effectiveAQI = profileRisk ? Math.min(500, Math.round(aqi.aqi * profileRisk.riskMultiplier)) : aqi.aqi;

      if (pattern.mode === 'walk' || pattern.mode === 'cycle') {
        if (effectiveAQI >= 151) {
          recommendations.push({
            id: generateId(),
            action: `Switch ${pattern.mode} commute to public transport or carpool`,
            reason: `Active commute at AQI ${effectiveAQI} increases inhalation dose 2-5x vs rest`,
            supportingData: `Commute: ${pattern.mode}, Duration: ${pattern.durationMinutes}min, Effective AQI: ${effectiveAQI}`,
            priority: 'high',
            timeWindow: 'Next commute',
            limitations: ['May not be feasible for all routes', 'Consider electric vehicle if available'],
            category: 'travel',
            profileIds: [profile.id],
          });
        } else if (effectiveAQI >= 101) {
          recommendations.push({
            id: generateId(),
            action: `Wear N95/KN95 during ${pattern.mode} commute`,
            reason: `Moderate-high pollution during active commute increases respiratory deposition`,
            supportingData: `Commute: ${pattern.mode}, Effective AQI: ${effectiveAQI}`,
            priority: 'medium',
            timeWindow: 'During commute',
            limitations: ['Mask must seal properly', 'Reduce exertion level'],
            category: 'travel',
            profileIds: [profile.id],
          });
        }
      } else if (pattern.mode === 'car') {
        recommendations.push({
          id: generateId(),
          action: 'Use car recirculation mode with cabin filter; consider carpooling',
          reason: 'Vehicle cabin filters reduce but don\'t eliminate PM2.5; recirculation reduces infiltration',
          supportingData: `Commute: car, Outdoor AQI: ${aqi.aqi}`,
          priority: 'medium',
          timeWindow: 'During commute',
          limitations: ['CO2 buildup in recirculation - switch to fresh air every 15-20 min', 'Cabin filter replacement per schedule'],
          category: 'travel',
          profileIds: [profile.id],
        });
      }
    }
  }

  if (baseCategory.range[0] >= 201) {
    recommendations.push({
      id: generateId(),
      action: 'Report visible pollution sources (burning waste, dust, industrial emissions) to local authorities',
      reason: 'Community reporting helps enforcement; major sources contribute disproportionately to local AQI',
      supportingData: `Current AQI: ${aqi.aqi} (${baseCategory.label})`,
      priority: 'medium',
      timeWindow: 'Ongoing',
      limitations: ['Requires local authority responsiveness', 'Document with photos/time/location'],
      category: 'community',
    });
  }

  if (baseCategory.range[0] >= 101) {
    recommendations.push({
      id: generateId(),
      action: 'Combine errands into fewer trips; use public transport for non-essential travel',
      reason: 'Reducing vehicle trips lowers local emissions contribution; each car trip adds ~150g CO2/km + PM',
      supportingData: 'Transport contributes 20-40% of urban PM2.5 in Indian cities',
      priority: 'low',
      timeWindow: 'This week',
      limitations: ['Individual impact small; collective action matters'],
      category: 'lifestyle',
    });
  }

  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

interface DailyActionPlan {
  morning: Recommendation[];
  afternoon: Recommendation[];
  evening: Recommendation[];
  overnight: Recommendation[];
}

export function getDailyActionPlan(context: RecommendationContext): DailyActionPlan {
  const recs = generateRecommendations(context);
  const now = new Date();
  const hour = now.getHours();

  function getHour(timeWindow: string): number {
    const match = timeWindow.match(/(\d{1,2})/);
    return match && match[1] ? parseInt(match[1], 10) : -1;
  }

  const morning = recs.filter(r => {
    const h = getHour(r.timeWindow);
    return h !== -1 ? h < 12 : hour < 12;
  });
  const afternoon = recs.filter(r => {
    const h = getHour(r.timeWindow);
    return h !== -1 ? h >= 12 && h < 17 : hour >= 12 && hour < 17;
  });
  const evening = recs.filter(r => {
    const h = getHour(r.timeWindow);
    return h !== -1 ? h >= 17 && h < 22 : hour >= 17 && hour < 22;
  });
  const overnight = recs.filter(r => {
    const h = getHour(r.timeWindow);
    return h !== -1 ? (h >= 22 || h < 6) : (hour >= 22 || hour < 6);
  });

  return { morning, afternoon, evening, overnight };
}