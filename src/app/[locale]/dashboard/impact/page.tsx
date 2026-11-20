'use client';

import { useTranslations } from 'next-intl';
import { Plus, TrendingUp, Calendar, TreePine, Smartphone, Car, Fuel, Award, Filter, Download, Leaf, Trash2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Label, Select, Modal, Textarea } from '@/components/ui';
import { MainLayout } from '@/components/layout';
import { useState } from 'react';
import { calculateImpactSummary, getActionTypeLabel, getActionTypeIcon, estimateActionImpact } from '@/lib/impact/calculator';
import type { TrackedAction } from '@/types';

const mockActions: TrackedAction[] = [
  { id: '1', userId: 'demo', profileId: '1', type: 'carpool', description: 'Carpooled to work with colleague', estimatedCO2eKg: 2.3, assumptions: ['15km trip', 'Car: 150g/km'], dataSource: 'CSTEP 2023', timestamp: new Date(Date.now() - 86400000).toISOString(), verified: false },
  { id: '2', userId: 'demo', profileId: '2', type: 'public_transport', description: 'Took metro instead of driving', estimatedCO2eKg: 3.1, assumptions: ['15km trip'], dataSource: 'TERI', timestamp: new Date(Date.now() - 2 * 86400000).toISOString(), verified: false },
  { id: '3', userId: 'demo', profileId: '1', type: 'walk_cycle', description: 'Walked to nearby market', estimatedCO2eKg: 1.1, assumptions: ['2km trip'], dataSource: 'ICCT', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(), verified: false },
  { id: '4', userId: 'demo', profileId: '3', type: 'avoided_trip', description: 'Combined grocery and pharmacy trip', estimatedCO2eKg: 2.25, assumptions: ['Avoided 15km car trip'], dataSource: 'CSTEP 2023', timestamp: new Date(Date.now() - 4 * 86400000).toISOString(), verified: false },
  { id: '5', userId: 'demo', profileId: '1', type: 'source_reduction', description: 'Stopped burning incense indoors', estimatedCO2eKg: 0.5, assumptions: ['Daily reduction'], dataSource: 'EPA', timestamp: new Date(Date.now() - 5 * 86400000).toISOString(), verified: false },
  { id: '6', userId: 'demo', type: 'community_event', description: 'Participated in neighborhood tree planting', estimatedCO2eKg: 10, assumptions: ['10 trees planted'], dataSource: 'Forest Survey', timestamp: new Date(Date.now() - 7 * 86400000).toISOString(), verified: false },
];

const actionIcons = {
  carpool: Car,
  public_transport: Car, // Would use Bus
  walk_cycle: Car, // Would use Bike
  avoided_trip: Car,
  source_reduction: Car, // Would use Home
  community_event: Award,
};

export default function ImpactPage() {
  const t = useTranslations('impact');
  const common = useTranslations('common');
  const [actions, setActions] = useState<TrackedAction[]>(mockActions);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<TrackedAction | null>(null);
  const [formData, setFormData] = useState<Partial<TrackedAction>>({});
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week');

  const summary = calculateImpactSummary(actions, []);

  const filteredActions = filterType === 'all'
    ? actions
    : actions.filter(a => a.type === filterType);

  const openAddModal = () => {
    setEditingAction(null);
    setFormData({
      type: 'carpool',
      description: '',
      profileId: undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const estimate = estimateActionImpact(formData.type as TrackedAction['type'], formData.description || '');
    const newAction: TrackedAction = {
      id: Date.now().toString(),
      userId: 'demo',
      profileId: formData.profileId,
      type: formData.type as TrackedAction['type'],
      description: formData.description || '',
      estimatedCO2eKg: estimate.estimatedCO2eKg,
      assumptions: estimate.assumptions,
      dataSource: estimate.dataSource,
      timestamp: new Date().toISOString(),
      verified: false,
    };
    setActions(prev => [newAction, ...prev]);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this action?')) {
      setActions(prev => prev.filter(a => a.id !== id));
    }
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
        <Button onClick={openAddModal} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('addAction')}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('totalActions')}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{summary.totalActions}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t('totalCO2e')}</p>
                <p className="text-3xl font-bold text-brand-secondary">{summary.totalCO2eKg.toFixed(1)} kg</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">This Week</p>
                <p className="text-3xl font-bold text-brand-primary">
                  {summary.weeklyTrend[summary.weeklyTrend.length - 1]?.co2eKg.toFixed(1) || 0} kg
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-brand-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Equivalent</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {summary.equivalencies[0] ? summary.equivalencies[0].value : 0}
                </p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <TreePine className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div></CardContent>
        </Card>
      </div>

      {/* Trends */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-primary" />
              {t('weeklyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-around px-2">
              {summary.weeklyTrend.map((week, i) => {
                const maxVal = Math.max(...summary.weeklyTrend.map(w => w.co2eKg), 1);
                const height = (week.co2eKg / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 w-14">
                    <div
                      className="w-full rounded-t transition-all duration-300 bg-brand-primary"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{week.week}</span>
                    <span className="text-xs font-medium text-slate-900 dark:text-white">{week.co2eKg.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-brand-secondary" />
              {t('monthlyTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end justify-around px-2">
              {summary.monthlyTrend.map((month, i) => {
                const maxVal = Math.max(...summary.monthlyTrend.map(m => m.co2eKg), 1);
                const height = (month.co2eKg / maxVal) * 100;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 w-14">
                    <div
                      className="w-full rounded-t transition-all duration-300 bg-brand-secondary"
                      style={{ height: `${height}%` }}
                    />
                    <span className="text-xs text-slate-500 dark:text-slate-400">{month.month}</span>
                    <span className="text-xs font-medium text-slate-900 dark:text-white">{month.co2eKg.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equivalencies */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5 text-amber-600" />
            {t('equivalencies')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {summary.equivalencies.map((eq, i) => (
              <div key={i} className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-center">
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{eq.value}</p>
                <p className="text-sm text-amber-700 dark:text-amber-300">{eq.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>Your Actions</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filterType} onChange={(value: string) => setFilterType(value)} className="w-auto">
                <option value="all">All Types</option>
                <option value="carpool">Carpool</option>
                <option value="public_transport">Public Transport</option>
                <option value="walk_cycle">Walk/Cycle</option>
                <option value="avoided_trip">Avoided Trip</option>
                <option value="source_reduction">Source Reduction</option>
                <option value="community_event">Community Event</option>
              </Select>
              <Select value={dateRange} onChange={(value: string) => setDateRange(value as 'week' | 'month' | 'year')} className="w-auto">
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 dark:text-slate-400">No actions logged yet</p>
              <Button onClick={openAddModal} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                {t('addAction')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.map((action) => {
                const Icon = actionIcons[action.type] || Car;
                return (
                  <div key={action.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-brand-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-brand-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{getActionTypeLabel(action.type)}</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{action.description}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(action.timestamp).toLocaleDateString()} • ~{action.estimatedCO2eKg.toFixed(1)} kg CO₂e
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">{action.estimatedCO2eKg.toFixed(1)} kg</Badge>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(action.id)} aria-label="Delete">
                        <Trash2 className="h-4 w-4 text-brand-accent" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assumptions & Limitations */}
      <Card className="mt-6 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
            {t('assumptions')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {Array.isArray(t('limitations', { returnArray: true })) ? t('limitations', { returnArray: true }) : [t('limitations')].map((limitation: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                {limitation}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Add Action Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('addAction')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type" required>{t('actionTypes.carpool')}</Label>
            <Select id="type" value={formData.type || 'carpool'} onChange={(value: string) => setFormData({ ...formData, type: value as 'carpool' | 'public_transport' | 'walk_cycle' | 'avoided_trip' | 'source_reduction' | 'community_event' })}>
              <option value="carpool">{t('actionTypes.carpool')}</option>
              <option value="public_transport">{t('actionTypes.public_transport')}</option>
              <option value="walk_cycle">{t('actionTypes.walk_cycle')}</option>
              <option value="avoided_trip">{t('actionTypes.avoided_trip')}</option>
              <option value="source_reduction">{t('actionTypes.source_reduction')}</option>
              <option value="community_event">{t('actionTypes.community_event')}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="description" required>{t('description')}</Label>
            <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={t('descriptionPlaceholder')} rows={3} required />
          </div>
          <div>
            <Label htmlFor="profileId">{t('profiles.name')}</Label>
            <Select id="profileId" value={formData.profileId || ''} onChange={(value: string) => setFormData({ ...formData, profileId: value || undefined })}>
              <option value="">None (General)</option>
              <option value="1">Priya</option>
              <option value="2">Arjun</option>
              <option value="3">Dadi</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>{common('cancel')}</Button>
            <Button type="submit">{common('save')}</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}