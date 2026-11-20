'use client';

import { useTranslations } from 'next-intl';
import { Bus, Train, Bike, Footprints, Car, Users, Shield, Leaf, Calculator, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Label, Select } from '@/components/ui';
import { MainLayout } from '@/components/layout';
import { useState } from 'react';
import { getEmissionAlternatives, getDailyTripPlan, getHouseholdEmissionBaseline, getCombinedErrandsSavings } from '@/lib/planner/emissions';
import type { HouseholdProfile, TravelPattern } from '@/types';

const mockProfiles: HouseholdProfile[] = [
  { id: '1', userId: 'demo', name: 'Priya', category: 'adult', conditions: ['asthma'], outdoorFrequency: 'medium', commutePattern: 'public_transport', hasAirPurifier: true, purifierCADR: 400, roomSizeSqFt: 150, preferredLanguage: 'en', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', userId: 'demo', name: 'Arjun', category: 'child', conditions: [], outdoorFrequency: 'high', commutePattern: 'walk', hasAirPurifier: false, preferredLanguage: 'en', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', userId: 'demo', name: 'Dadi', category: 'older_adult', conditions: ['hypertension'], outdoorFrequency: 'low', commutePattern: 'car', hasAirPurifier: true, purifierCADR: 300, roomSizeSqFt: 120, preferredLanguage: 'hi', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

const mockTravelPatterns: TravelPattern[] = [
  { profileId: '1', mode: 'public_transport', frequency: 'daily', durationMinutes: 45 },
  { profileId: '2', mode: 'walk', frequency: 'daily', durationMinutes: 20 },
  { profileId: '3', mode: 'car', frequency: 'daily', durationMinutes: 30 },
];

const modeIcons = {
  walk: Footprints,
  cycle: Bike,
  public_transport: Bus,
  car: Car,
  carpool: Users,
  carpool_2: Users,
  carpool_3: Users,
  car_cng: Leaf,
  car_electric: Leaf,
  metro: Train,
  bus: Bus,
  local_train: Train,
};

const modeLabels: Record<string, string> = {
  walk: 'Walk',
  cycle: 'Cycle',
  public_transport: 'Public Transport',
  car: 'Car (Solo)',
  carpool: 'Carpool',
  carpool_2: 'Carpool (2)',
  carpool_3: 'Carpool (3+)',
  car_cng: 'CNG Vehicle',
  car_electric: 'Electric Vehicle',
  metro: 'Metro Rail',
  bus: 'Public Bus',
  local_train: 'Local Train',
};

export default function PlannerPage() {
  const t = useTranslations('planner');
  const [aqi, setAqi] = useState(156);
  const [tripsPerWeek, setTripsPerWeek] = useState(7);
  const [combinedTrips, setCombinedTrips] = useState(3);
  const [errandSavings, setErrandSavings] = useState<ReturnType<typeof getCombinedErrandsSavings> | null>(null);

  const carProfile = mockProfiles[2];
  const alternatives = carProfile ? getEmissionAlternatives('car', carProfile, aqi) : [];
  const tripPlans = getDailyTripPlan(mockProfiles, mockTravelPatterns, aqi);
  const baseline = getHouseholdEmissionBaseline(mockProfiles, mockTravelPatterns);

  const calculateErrands = () => {
    const savings = getCombinedErrandsSavings(tripsPerWeek, combinedTrips);
    setErrandSavings(savings);
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="page-title">{t('title')}</h1>
        <p className="page-subtitle">{t('subtitle')}</p>
      </div>

      {/* AQI Context */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-brand-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Current AQI Context</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Recommendations adjust based on air quality</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-primary">{aqi}</p>
                <p className="text-xs text-slate-500">AQI</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setAqi(Math.max(0, aqi - 10))}>-10</Button>
              <Button variant="outline" size="sm" onClick={() => setAqi(Math.min(500, aqi + 10))}>+10</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Household Baseline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-brand-primary" />
            {t('currentCommute')} - Household Baseline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{baseline.totalKgPerYear.toFixed(1)} kg</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">CO₂e / Year</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-3xl font-bold text-brand-primary">{Object.keys(baseline.byProfile).length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Commuters</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-3xl font-bold text-brand-secondary">{Object.keys(baseline.byMode).length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Transport Modes</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="font-medium text-slate-900 dark:text-white">By Family Member</h4>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(baseline.byProfile).map(([name, kg]) => (
                <div key={name} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <p className="font-medium text-slate-900 dark:text-white">{name}</p>
                  <p className="text-2xl font-bold text-brand-primary">{kg.toFixed(1)} kg CO₂e/yr</p>
                </div>
              ))}
            </div>

            <h4 className="font-medium text-slate-900 dark:text-white mt-4">By Transport Mode</h4>
            <div className="grid gap-2 sm:grid-cols-4">
              {Object.entries(baseline.byMode).map(([mode, kg]) => {
                const Icon = modeIcons[mode as keyof typeof modeIcons] || Car;
                return (
                  <div key={mode} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-center">
                    <Icon className="h-6 w-6 text-brand-primary mx-auto mb-1" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{modeLabels[mode] || mode}</p>
                    <p className="text-lg font-bold text-brand-secondary">{kg.toFixed(1)} kg</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent></Card>

      {/* Daily Trip Plans */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-brand-secondary" />
            {t('alternatives')} for Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tripPlans.length === 0 ? (
            <p className="text-center text-slate-500 dark:text-slate-400 py-8">No trip plans available</p>
          ) : (
            <div className="space-y-3">
              {tripPlans.map((plan) => {
                const profile = mockProfiles.find(p => p.id === plan.profileId);
                const Icon = modeIcons[plan.suggestedMode as keyof typeof modeIcons] || Car;
                return (
                  <div key={plan.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-brand-secondary/10 flex items-center justify-center">
                          <Icon className="h-5 w-5 text-brand-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{profile?.name}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {modeLabels[plan.originalMode]} → {plan.suggestedMode}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-brand-secondary">{plan.estimatedSavings.co2eKg.toFixed(1)} kg</p>
                          <p className="text-xs text-slate-500">CO₂e / Year</p>
                        </div>
                        {plan.aqiConstraint && (
                          <Badge variant="warning" className="whitespace-nowrap">{plan.aqiConstraint}</Badge>
                        )}
                        <Button variant="outline" size="sm">
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{plan.reason}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent></Card>

      {/* All Alternatives for Car Commute */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="h-5 w-5 text-brand-secondary" />
            All Cleaner Alternatives (for Car Commute)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alternatives.map((alt) => {
              const Icon = modeIcons[alt.alternativeMode.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, '_') as keyof typeof modeIcons] || Car;
              return (
                <div key={alt.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{alt.alternativeMode}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{alt.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{alt.co2eSavedKgPerYear.toFixed(1)} kg</p>
                        <p className="text-xs text-slate-500">{t('perYear')}</p>
                      </div>
                      <Badge variant={alt.feasibility === 'easy' ? 'success' : alt.feasibility === 'moderate' ? 'info' : 'warning'}>
                        {t(`feasibility.${alt.feasibility}`)}
                      </Badge>
                      {alt.aqiCondition && <Badge variant="warning">{alt.aqiCondition}</Badge>}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Assumptions: {alt.assumptions.slice(0, 2).join('; ')}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent></Card>

      {/* Combine Errands Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-brand-primary" />
            {t('combineErrands')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 max-w-md">
            <div>
              <Label htmlFor="tripsPerWeek">{t('tripsPerWeek')}</Label>
              <Input
                id="tripsPerWeek"
                type="number"
                value={tripsPerWeek}
                onChange={(e) => setTripsPerWeek(Math.max(0, Number(e.target.value)))}
                min={0}
              />
            </div>
            <div>
              <Label htmlFor="combinedTrips">{t('combinedTrips')}</Label>
              <Input
                id="combinedTrips"
                type="number"
                value={combinedTrips}
                onChange={(e) => setCombinedTrips(Math.max(0, Number(e.target.value)))}
                min={0}
              />
            </div>
          </div>
          <Button onClick={calculateErrands} className="mt-4 gap-2">
            <Calculator className="h-4 w-4" />
            {t('calculateSavings')}
          </Button>

          {errandSavings && (
            <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-emerald-800 dark:text-emerald-300">By combining {errandSavings.tripsReduced} trips/week:</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{errandSavings.co2eKgPerYear.toFixed(1)} kg CO₂e/year saved</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                Assumptions: {errandSavings.assumptions.join('; ')}
              </p>
            </div>
          )}
        </CardContent></Card>
    </MainLayout>
  );
}