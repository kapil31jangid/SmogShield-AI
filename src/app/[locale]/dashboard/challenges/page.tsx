'use client';

import { useTranslations } from 'next-intl';
import { Target, Users, Calendar, Trophy, CheckCircle, Clock, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Modal, Label, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { MainLayout } from '@/components/layout';
import { useState } from 'react';
import type { CommunityChallenge } from '@/types';

const mockChallenges: CommunityChallenge[] = [
  {
    id: '1',
    title: 'Clean Air Commute Week',
    description: 'Use public transport, carpool, or walk/cycle for your commute for 5 days this week',
    type: 'household',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    targetActions: 5,
    currentActions: 3,
    participants: ['demo'],
    isActive: true,
  },
  {
    id: '2',
    title: 'Indoor Air Health Challenge',
    description: 'Eliminate 3 indoor pollution sources (incense, candles, smoking, mosquito coils) from your home',
    type: 'household',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    targetActions: 3,
    currentActions: 1,
    participants: [],
    isActive: true,
  },
  {
    id: '3',
    title: 'Neighborhood Clean Air Drive',
    description: 'Organize a community awareness event, tree planting, or clean-up drive in your neighborhood',
    type: 'neighborhood',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    targetActions: 1,
    currentActions: 0,
    participants: ['demo'],
    isActive: true,
  },
  {
    id: '4',
    title: 'School Clean Air Challenge',
    description: 'Work with your child\'s school to implement clean air measures: no idling zone, indoor purifiers, walk-to-school day',
    type: 'school',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date().toISOString(),
    targetActions: 4,
    currentActions: 4,
    participants: ['demo'],
    isActive: false,
  },
];

const typeIcons = {
  household: Users,
  school: Trophy,
  neighborhood: Users,
};

const typeLabels = {
  household: 'Household',
  school: 'School',
  neighborhood: 'Neighborhood',
};

export default function ChallengesPage() {
  const t = useTranslations('challenges');
  const common = useTranslations('common');
  const [challenges] = useState<CommunityChallenge[]>(mockChallenges);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState<Partial<CommunityChallenge>>({});

  const activeChallenges = challenges.filter(c => c.isActive);
  const completedChallenges = challenges.filter(c => !c.isActive);
  const userJoined = challenges.filter(c => c.participants.includes('demo'));

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newChallenge: CommunityChallenge = {
      id: Date.now().toString(),
      title: formData.title!,
      description: formData.description!,
      type: formData.type as CommunityChallenge['type'],
      startDate: new Date().toISOString(),
      endDate: formData.endDate!,
      targetActions: Number(formData.targetActions) || 1,
      currentActions: 0,
      participants: ['demo'],
      isActive: true,
    };
    // In production, would save to database
    setShowCreateModal(false);
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  const getProgress = (challenge: CommunityChallenge) => {
    return Math.min(100, Math.round((challenge.currentActions / challenge.targetActions) * 100));
  };

  return (
    <MainLayout>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Challenge
        </Button>
      </div>

      {/* User Participation Summary */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 rounded-xl bg-brand-primary/10">
              <p className="text-3xl font-bold text-brand-primary">{userJoined.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('yourParticipation')}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-brand-secondary/10">
              <p className="text-3xl font-bold text-brand-secondary">{activeChallenges.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('active')}</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{completedChallenges.length}</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{t('completed')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Challenges */}
      <div className="mb-6">
        <h2 className="section-title mb-4">{t('active')}</h2>
        {activeChallenges.length === 0 ? (
          <Card>
            <CardContent className="pt-6 pb-12 text-center">
              <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No active challenges</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">Check back later for new community challenges</p>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your Own
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeChallenges.map((challenge) => {
              const Icon = typeIcons[challenge.type];
              const isJoined = challenge.participants.includes('demo');
              const progress = getProgress(challenge);
              const daysLeft = getDaysRemaining(challenge.endDate);

              return (
                <Card variant="hover" key={challenge.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="h-14 w-14 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                          <Icon className="h-7 w-7 text-brand-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-slate-900 dark:text-white">{challenge.title}</h3>
                            <Badge variant="info">{typeLabels[challenge.type]}</Badge>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 mb-3">{challenge.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              {challenge.currentActions}/{challenge.targetActions} actions
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              {challenge.participants.length} participants
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {daysLeft} {t('days')} left
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
                        <div className="w-full lg:w-48">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 dark:text-slate-400">Progress</span>
                            <span className="font-medium text-slate-900 dark:text-white">{progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-primary rounded-full transition-all duration-500"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        {isJoined ? (
                          <Button variant="secondary" className="w-full lg:w-auto gap-2">
                            <CheckCircle className="h-4 w-4" />
                            {t('joined')}
                          </Button>
                        ) : (
                          <Button variant="primary" className="w-full lg:w-auto gap-2" onClick={() => { /* join logic */ }}>
                            <ArrowRight className="h-4 w-4" />
                            {t('join')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div className="mb-6">
          <h2 className="section-title mb-4">{t('completed')}</h2>
          <div className="grid gap-4">
            {completedChallenges.map((challenge) => {
              const Icon = typeIcons[challenge.type];
              return (
                <Card key={challenge.id} className="opacity-70">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                        <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{challenge.title}</h3>
                          <Badge variant="success">{t('completed')}</Badge>
                          <Badge variant="info">{typeLabels[challenge.type]}</Badge>
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{challenge.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {challenge.currentActions}/{challenge.targetActions}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Complete</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Challenge Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Community Challenge"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="title" required>Title</Label>
            <Input id="title" value={formData.title || ''} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
          </div>
          <div>
            <Label htmlFor="description" required>Description</Label>
            <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} required />
          </div>
          <div>
            <Label htmlFor="type" required>Type</Label>
            <Select id="type" value={formData.type || 'household'} onChange={(value: string) => setFormData({ ...formData, type: value as 'household' | 'school' | 'neighborhood' })}>
              <option value="household">Household</option>
              <option value="school">School</option>
              <option value="neighborhood">Neighborhood</option>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="targetActions" required>Target Actions</Label>
              <Input id="targetActions" type="number" value={formData.targetActions?.toString() || '1'} onChange={(e) => setFormData({ ...formData, targetActions: Number(e.target.value) })} min="1" required />
            </div>
            <div>
              <Label htmlFor="endDate" required>End Date</Label>
              <Input id="endDate" type="date" value={formData.endDate || ''} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} required />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>{common('cancel')}</Button>
            <Button type="submit">{common('save')}</Button>
          </div>
        </form>
      </Modal>
    </MainLayout>
  );
}