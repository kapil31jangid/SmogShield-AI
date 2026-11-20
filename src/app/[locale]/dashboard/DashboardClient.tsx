'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { RefreshCw, AlertTriangle, Shield, Home, Users, Bot, TrendingUp, Target, ChevronDown, MapPin, Clock } from 'lucide-react';
import { cn, formatTimestamp, formatRelativeTime, getAQIColor, getAQILabel } from '@/lib/utils/helpers';
import { getAvailableLocations, getLocationById, fetchCurrentAQI, fetchHistoricalAQI } from '@/lib/aqi/aggregator';
import { generateRecommendations, getDailyActionPlan } from '@/lib/recommendations/engine';
import { getIndoorGuidance } from '@/lib/indoor/advisor';
import { generateAIResponse, generateDailyPlan } from '@/lib/ai/orchestrator';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, AQIBadge, PriorityBadge, Modal, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui';
import { MainLayout } from '@/components/layout';
import type { Location, AQIReading, HouseholdProfile, Recommendation } from '@/types';

const POLLUTANT_LABELS = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  no2: 'NO₂',
  o3: 'O₃',
  so2: 'SO₂',
  co: 'CO',
} as const;

const POLLUTANT_UNITS = {
  pm25: 'μg/m³',
  pm10: 'μg/m³',
  no2: 'μg/m³',
  o3: 'μg/m³',
  so2: 'μg/m³',
  co: 'mg/m³',
} as const;

export function DashboardClient({ locale }: { locale: string }) {
  const t = useTranslations('dashboard');
  const common = useTranslations('common');

  // State
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [aqiData, setAqiData] = useState<AQIReading | null>(null);
  const [historicalData, setHistoricalData] = useState<AQIReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [profiles, setProfiles] = useState<HouseholdProfile[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dailyPlan, setDailyPlan] = useState<{ morning: Recommendation[]; afternoon: Recommendation[]; evening: Recommendation[]; overnight: Recommendation[] } | null>(null);
  const [indoorGuidance, setIndoorGuidance] = useState<ReturnType<typeof getIndoorGuidance>>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'pollutants' | 'history'>('overview');

  // Load saved location from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('smogshield-location');
    if (saved) {
      try {
        const loc = JSON.parse(saved);
        const location = getLocationById(loc.id);
        if (location) {
          setSelectedLocation(location);
        }
      } catch {
        // Ignore parse errors
      }
    }
    if (!selectedLocation) {
      setShowLocationModal(true);
    }
  }, []);

  // Fetch AQI data
  const fetchAQI = useCallback(async () => {
    if (!selectedLocation) return;
    setIsLoading(true);
    setError(null);

    try {
      const [current, historical] = await Promise.all([
        fetchCurrentAQI(selectedLocation),
        fetchHistoricalAQI(selectedLocation, 7),
      ]);

      if (current) {
        setAqiData(current);
        setHistoricalData(historical);
        generateRecs(current);
      } else {
        setError(t('errors.failedToLoad'));
      }
    } catch (err) {
      console.error('AQI fetch error:', err);
      setError(t('errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation, t]);

  // Generate recommendations
  const generateRecs = (aqi: AQIReading) => {
    const mockProfiles: HouseholdProfile[] = [
      { id: '1', userId: 'demo', name: 'Priya', category: 'adult', conditions: ['asthma'], outdoorFrequency: 'medium', commutePattern: 'public_transport', hasAirPurifier: true, purifierCADR: 400, roomSizeSqFt: 150, preferredLanguage: 'en', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '2', userId: 'demo', name: 'Arjun', category: 'child', conditions: [], outdoorFrequency: 'high', commutePattern: 'walk', hasAirPurifier: false, preferredLanguage: 'en', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: '3', userId: 'demo', name: 'Dadi', category: 'older_adult', conditions: ['hypertension'], outdoorFrequency: 'low', commutePattern: 'car', hasAirPurifier: true, purifierCADR: 300, roomSizeSqFt: 120, preferredLanguage: 'hi', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    setProfiles(mockProfiles);

    const recs = generateRecommendations({
      aqi,
      profiles: mockProfiles,
      plannedActivities: [],
      travelPatterns: [],
    });
    setRecommendations(recs);
    setDailyPlan(getDailyActionPlan({ aqi, profiles: mockProfiles, plannedActivities: [], travelPatterns: [] }));
    setIndoorGuidance(getIndoorGuidance(mockProfiles, aqi));
  };

  // Fetch on location change
  useEffect(() => {
    if (selectedLocation) {
      fetchAQI();
    }
  }, [fetchAQI]);

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(fetchAQI, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAQI]);

  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    localStorage.setItem('smogshield-location', JSON.stringify(location));
    setShowLocationModal(false);
  };

  const handleRefresh = () => {
    fetchAQI();
  };

  if (!selectedLocation) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          {/* Location Modal */}
          <Modal
            isOpen={showLocationModal}
            onClose={() => setShowLocationModal(false)}
            title={t('step1.title')}
            description={t('step1.description')}
            size="lg"
            showCloseButton={false}
          >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {getAvailableLocations().map((location) => (
                <button
                  key={location.id}
                  onClick={() => handleLocationSelect(location)}
                  className={cn(
                    'w-full text-left p-4 rounded-xl border transition-all',
                    'border-slate-200 hover:border-brand-primary hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-brand-primary" />
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{location.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="primary" onClick={() => setShowLocationModal(false)} disabled={!selectedLocation}>
                {common('getStarted')}
              </Button>
            </div>
          </Modal>
        </div>
      </MainLayout>
    );
  }

  const aqi = aqiData?.aqi ?? 0;
  const aqiColor = getAQIColor(aqi);
  const aqiLabel = getAQILabel(aqi);
  const category = aqiData ? getAQILabel(aqi) : '';
  const freshness = aqiData?.dataFreshness ?? 'demo';

  return (
    <MainLayout>
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowLocationModal(true)} className="gap-2">
            <MapPin className="h-4 w-4" />
            <span>{selectedLocation.name}</span>
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button variant="secondary" onClick={handleRefresh} isLoading={isLoading} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span>{common('refresh')}</span>
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-800" role="alert">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Main AQI Card */}
      <Card className="mb-6 overflow-hidden" variant="elevated">
        <div className={cn('relative px-6 py-8', `bg-gradient-to-br from-${aqiColor}/10 to-${aqiColor}/5`)}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className={cn('rounded-2xl p-4 text-white', `bg-[${aqiColor}]`)}>
                <span className="text-4xl sm:text-5xl font-bold">{aqi}</span>
              </div>
              <div>
                <AQIBadge aqi={aqi} label={aqiLabel} />
                <div className="mt-2 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedLocation.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {aqiData ? formatRelativeTime(aqiData.timestamp) : '—'}
                  </span>
                  <Badge variant={freshness === 'live' ? 'success' : freshness === 'cached' ? 'info' : freshness === 'demo' ? 'warning' : 'default'}>
                    {t(`dataFreshness.${freshness}`)}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right sm:text-left">
              <p className="text-lg font-medium text-slate-900 dark:text-white">{t('aqiCategories.' + category.toLowerCase().replace(' ', ''))}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {freshness === 'demo' && '⚠️ '}{t('dataFreshness.' + freshness)}
              </p>
            </div>
          </div>

          {/* Pollutant Grid */}
          {aqiData && (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
              {(Object.keys(POLLUTANT_LABELS) as Array<keyof typeof POLLUTANT_LABELS>).map((key) => {
                const value = aqiData[key];
                if (value === undefined) return null;
                return (
                  <div key={key} className="rounded-xl bg-white/50 dark:bg-slate-800/50 p-3 text-center">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                      {POLLUTANT_LABELS[key]}
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {value} <span className="text-xs font-normal text-slate-500">{POLLUTANT_UNITS[key]}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Tabs for Overview/Pollutants/History */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={(v: string) => setActiveTab(v as 'overview' | 'pollutants' | 'history')} className="mb-6">
        <TabsList>
          <TabsTrigger value="overview">{t('recommendations')}</TabsTrigger>
          <TabsTrigger value="pollutants">{t('pollutants')}</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Today's Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-brand-primary" />
                  {t('recommendations')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">{common('loading')}</p>
                ) : (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {recommendations.slice(0, 8).map((rec) => (
                      <div
                        key={rec.id}
                        className={cn(
                          'rounded-xl p-4 border-l-4 transition-colors',
                          rec.priority === 'critical' && 'border-red-500 bg-red-50 dark:bg-red-900/10',
                          rec.priority === 'high' && 'border-orange-500 bg-orange-50 dark:bg-orange-900/10',
                          rec.priority === 'medium' && 'border-amber-500 bg-amber-50 dark:bg-amber-900/10',
                          rec.priority === 'low' && 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-slate-900 dark:text-white">{rec.action}</span>
                              <PriorityBadge priority={rec.priority} />
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{rec.reason}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {rec.timeWindow}
                              </span>
                              {rec.category && (
                                <Badge variant="default" className="text-xs">{rec.category}</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {rec.limitations.length > 0 && (
                          <details className="mt-2 group">
                            <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer flex items-center gap-1">
                              <span>Limitations</span>
                              <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
                            </summary>
                            <ul className="mt-1 ml-4 list-disc text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                              {rec.limitations.map((l, i) => (
                                <li key={i}>{l}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Action Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-brand-secondary" />
                  {t('recommendations')} (Time-based)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dailyPlan ? (
                  <div className="space-y-4">
                    {([
                      { key: 'morning', label: 'Morning (6-10 AM)', icon: '🌅' },
                      { key: 'afternoon', label: 'Afternoon (10 AM-4 PM)', icon: '☀️' },
                      { key: 'evening', label: 'Evening (4-8 PM)', icon: '🌆' },
                      { key: 'overnight', label: 'Night (8 PM+)', icon: '🌙' },
                    ] as const).map(({ key, label, icon }) => {
                      const items = dailyPlan[key as keyof typeof dailyPlan];
                      return items.length > 0 ? (
                        <div key={key} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <span>{icon}</span>
                            <span className="font-medium text-slate-900 dark:text-white">{label}</span>
                          </div>
                          <ul className="space-y-1">
                            {items.slice(0, 2).map((item) => (
                              <li key={item.id} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brand-primary shrink-0" />
                                {item.action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null;
                    })}
                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">{common('loading')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Family Exposure & Indoor Protection */}
          <div className="grid gap-6 lg:grid-cols-2 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-brand-primary" />
                  {t('familyExposure')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {profiles.map((profile) => (
                    <div key={profile.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-brand-primary/10 flex items-center justify-center">
                          {profile.category === 'child' ? '👶' : profile.category === 'older_adult' ? '👴' : '👤'}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{profile.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{profile.category.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        {profile.hasAirPurifier && (
                          <Badge variant="success" className="gap-1">
                            <Shield className="h-3 w-3" /> Purifier
                          </Badge>
                        )}
                        <Badge variant="info">{profile.outdoorFrequency}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5 text-brand-secondary" />
                  {t('indoorProtection')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {indoorGuidance.filter(g => g.priority === 'essential').slice(0, 3).map((guidance) => (
                    <div key={guidance.id} className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3">
                      <p className="font-medium text-slate-900 dark:text-white mb-1">{guidance.title}</p>
                      <ul className="space-y-1">
                        {guidance.actionItems.slice(0, 2).map((item, i) => (
                          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-brand-secondary shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full">
                    View All Indoor Guidance →
                  </Button>
                </div>
              </CardContent></Card>
          </div>
        </TabsContent>

        {/* Pollutants Tab */}
        <TabsContent value="pollutants">
          <Card>
            <CardHeader>
              <CardTitle>{t('pollutants')}</CardTitle>
              <CardDescription>Detailed pollutant breakdown and health information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {(Object.keys(POLLUTANT_LABELS) as Array<keyof typeof POLLUTANT_LABELS>).map((key) => {
                  const value = aqiData?.[key];
                  if (value === undefined) return null;
                  return (
                    <div key={key} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">{POLLUTANT_LABELS[key]}</h4>
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">
                          {value} <span className="text-sm font-normal text-slate-500">{POLLUTANT_UNITS[key]}</span>
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {key === 'pm25' && 'Fine particles that penetrate deep into lungs and bloodstream'}
                        {key === 'pm10' && 'Coarse particles that irritate eyes, nose, and throat'}
                        {key === 'no2' && 'Traffic-related gas that inflames airways'}
                        {key === 'o3' && 'Ground-level ozone that damages lung tissue'}
                        {key === 'so2' && 'Industrial gas that causes bronchial constriction'}
                        {key === 'co' && 'Colorless gas that reduces oxygen delivery'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>7-Day AQI History</CardTitle>
              <CardDescription>Historical trends for {selectedLocation.name}</CardDescription>
            </CardHeader>
            <CardContent>
              {historicalData.length > 0 ? (
                <div className="h-64 relative">
                  {/* Simple bar chart using divs */}
                  <div className="flex items-end justify-around h-full px-2">
                    {historicalData.slice(0, 7).reverse().map((reading, i) => {
                      const height = Math.max(20, (reading.aqi / 500) * 100);
                      const color = getAQIColor(reading.aqi);
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 w-12">
                          <div
                            className="w-full rounded-t transition-all duration-300"
                            style={{ height: `${height}%`, backgroundColor: color }}
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(reading.timestamp).toLocaleDateString('en-IN', { weekday: 'short' })}
                          </span>
                          <span className="text-xs font-medium text-slate-900 dark:text-white">{reading.aqi}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-center text-slate-500 dark:text-slate-400 py-12">No historical data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* AI Assistant Entry */}
      <Card className="mt-6" variant="glass">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{t('aiAssistant')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Ask about air quality, health, or protection</p>
              </div>
            </div>
            <Button variant="primary" className="gap-2">
              <Bot className="h-4 w-4" />
              Open Assistant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Impact Progress */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-secondary" />
            {t('impactProgress')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">0</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Actions This Week</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">0.0 kg</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">CO₂e Saved</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">0</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Active Challenges</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        title={t('step1.title')}
        description={t('step1.description')}
        size="lg"
        showCloseButton={false}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {getAvailableLocations().map((location) => (
            <button
              key={location.id}
              onClick={() => handleLocationSelect(location)}
              className={cn(
                'w-full text-left p-4 rounded-xl border transition-all',
                selectedLocation?.id === location.id
                  ? 'border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10'
                  : 'border-slate-200 hover:border-brand-primary hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-brand-primary" />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{location.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
                    </p>
                  </div>
                </div>
                {selectedLocation?.id === location.id && (
                  <span className="text-brand-primary">✓ Selected</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="primary" onClick={() => setShowLocationModal(false)} disabled={!selectedLocation}>
            {common('getStarted')}
          </Button>
        </div>
      </Modal>
    </MainLayout>
  );
}