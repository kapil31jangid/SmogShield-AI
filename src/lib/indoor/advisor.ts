import type { HouseholdProfile, AQIReading } from '@/types';
import { generateId } from '@/lib/utils/helpers';

export interface IndoorGuidance {
  id: string;
  category: 'source_control' | 'filtration' | 'ventilation' | 'monitoring' | 'myths';
  title: string;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  actionItems: string[];
  caveats: string[];
}

export function getIndoorGuidance(profiles: HouseholdProfile[], aqi?: AQIReading): IndoorGuidance[] {
  const guidance: IndoorGuidance[] = [];
  const hasHighRisk = profiles.some(p => p.category === 'child' || p.category === 'older_adult' || p.conditions.length > 0);
  const outdoorAQI = aqi?.aqi ?? 100;

  // 1. SOURCE CONTROL
  guidance.push({
    id: generateId(),
    category: 'source_control',
    title: 'Eliminate Indoor Particle Sources',
    description: 'Indoor activities can create significant PM2.5. Eliminating these sources is the most effective way to reduce exposure.',
    priority: 'essential',
    actionItems: [
      'No smoking indoors (cigarettes, bidis, hookah) - single cigarette creates 1000+ μg/m³ PM2.5 locally',
      'Avoid incense sticks (agarbatti), dhoop, camphor - religious use creates 500-2000 μg/m³',
      'No candles or oil lamps (diyas) indoors - paraffin candles emit PM2.5 and VOCs',
      'Use exhaust fan or chimney when cooking, especially frying, roasting, or tadka',
      'Avoid mosquito coils indoors - use screened windows or electric repellents instead',
      'Don\'t use vacuum cleaners without HEPA filters - they redistribute fine particles',
    ],
    caveats: [
      'Cooking ventilation is essential - never seal kitchen without exhaust',
      'If cultural/religious practices require incense, do it near open window with fan exhausting out',
    ],
  });

  // 2. FILTRATION
  const needsPurifier = profiles.some(p => !p.hasAirPurifier);
  guidance.push({
    id: generateId(),
    category: 'filtration',
    title: 'HEPA Air Purifier Selection and Use',
    description: 'A properly sized HEPA purifier is the single most effective intervention for reducing indoor PM2.5.',
    priority: needsPurifier ? 'essential' : 'recommended',
    actionItems: [
      'Choose True HEPA (H13/H14) - captures 99.97% of 0.3μm particles',
      'Size by CADR: Need ≥ 2/3 × room volume (ft³) for 5 air changes/hour',
      'Example: 150 sq ft room × 8 ft ceiling = 1200 ft³ → CADR ≥ 400 cfm (≈ 680 m³/h)',
      'Place in bedroom (where you spend 8+ hours) and living room',
      'Run on high during high pollution; auto mode acceptable otherwise',
      'Keep doors/windows closed while purifier runs',
      'Replace filters per manufacturer (typically 6-12 months for HEPA, 3 months for pre-filter)',
      'Clean pre-filter monthly to extend HEPA life',
    ],
    caveats: [
      'CADR ratings are for clean filters - real-world performance drops as filter loads',
      'No purifier removes gases (CO2, VOCs, NO2) - ventilation still needed',
      'Ozone generators, ionizers, UV purifiers NOT recommended - can produce harmful byproducts',
    ],
  });

  // 3. VENTILATION
  guidance.push({
    id: generateId(),
    category: 'ventilation',
    title: 'Smart Ventilation Strategy',
    description: 'Ventilation reduces CO2 and VOCs but can bring in outdoor pollution. Timing is critical.',
    priority: 'recommended',
    actionItems: [
      'VENTILATE when: Outdoor AQI < Indoor AQI (if monitored) OR Outdoor AQI ≤ 50 (Good)',
      'Best times: Typically mid-day (11 AM - 3 PM) when boundary layer is highest',
      'Cross-ventilation: Open windows on opposite sides for 15-30 minutes',
      'SEAL when: Outdoor AQI > 100, or during peak traffic hours (7-10 AM, 5-8 PM)',
      'Use exhaust fans in kitchen/bathroom with door closed to create negative pressure',
      'If no outdoor AQI data: Ventilate 15 min every 4 hours, monitor for symptoms',
    ],
    caveats: [
      'Never seal home with unvented gas appliances (risk of CO buildup)',
      'CO2 > 1000 ppm indicates insufficient ventilation - prioritize brief airing',
      'High humidity (>60%) + sealing = mold risk - use dehumidifier if needed',
    ],
  });

  // 4. MONITORING
  guidance.push({
    id: generateId(),
    category: 'monitoring',
    title: 'Indoor Air Quality Monitoring',
    description: 'Low-cost sensors help but have limitations. Use as trend indicators, not absolute values.',
    priority: 'optional',
    actionItems: [
      'Place monitor in bedroom at breathing height (not near window, door, or purifier)',
      'Look for PM2.5, CO2, TVOC, temperature, humidity',
      'Calibrate against reference if possible (co-location test)',
      'Track trends: Is indoor PM2.5 consistently 30-50% of outdoor? Good.',
      'If indoor > outdoor: Check for indoor sources or purifier failure',
      'CO2 > 800 ppm: Ventilate. CO2 > 1500 ppm: Ventilate immediately.',
    ],
    caveats: [
      'Consumer sensors (±30-50% accuracy) cannot replace reference monitors',
      'Relative trends more reliable than absolute values',
      'Sensor drift over time - replace or recalibrate annually',
    ],
  });

  // 5. MYTHS
  guidance.push({
    id: generateId(),
    category: 'myths',
    title: 'Common Myths - What Doesn\'t Work',
    description: 'Popular beliefs that waste money or create false security.',
    priority: 'recommended',
    actionItems: [
      '❌ Indoor plants "purify air" - NASA study used sealed chambers; real-world effect negligible (<1% reduction)',
      '❌ Salt lamps / Himalayan salt - no scientific evidence for air cleaning',
      '❌ Essential oil diffusers - add VOCs, don\'t remove PM2.5',
      '❌ "Natural" ventilation always better - not when outdoor AQI is hazardous',
      '❌ Air conditioners filter PM2.5 - standard AC filters catch only large dust (MERV 1-4)',
      '❌ Opening window "just a crack" - minimal air exchange, lets pollution in',
    ],
    caveats: [
      'Plants have psychological benefits - keep them for wellbeing, not air cleaning',
      'Some AC units accept MERV 13+ filters - check compatibility before upgrading',
    ],
  });

  // Add AQI-specific guidance
  if (outdoorAQI >= 201) {
    guidance.push({
      id: generateId(),
      category: 'filtration',
      title: 'Emergency Protocol: Very Unhealthy / Hazardous AQI',
      description: `Outdoor AQI ${outdoorAQI} requires maximum protection.`,
      priority: 'essential',
      actionItems: [
        'Run ALL purifiers on MAXIMUM continuously',
        'Seal windows/doors with tape/towels if infiltration suspected',
        'Create "clean room" - one room with best purifier, sealed, for sleeping',
        'Limit time in other rooms; wear N95 if moving through house',
        'No cooking that generates smoke/fumes; use microwave/electric',
        'Monitor household members for symptoms (cough, wheeze, chest tightness, headache)',
        'Seek medical attention if symptoms worsen',
      ],
      caveats: [
        'CO2 will rise in sealed room - open door briefly every 2-3 hours if safe',
        'Never use unvented heaters/stoves in sealed space',
      ],
    });
  }

  return guidance;
}

export function getPurifierSizingGuide(roomSqFt: number, ceilingFt: number = 8): { requiredCADR: number; recommendedModels: string[] } {
  const volume = roomSqFt * ceilingFt;
  const requiredCADR = Math.ceil(volume * 5 / 60); // 5 ACH
  return {
    requiredCADR,
    recommendedModels: [
      `Minimum CADR: ${requiredCADR} cfm (${Math.round(requiredCADR * 1.7)} m³/h)`,
      'Look for AHAM Verifide seal with CADR ratings for smoke/dust/pollen',
      'For Indian market: Check CADR in m³/h (1 cfm = 1.7 m³/h)',
    ],
  };
}