'use client';

import { useTranslations } from 'next-intl';
import { Plus, Edit, Trash2, Shield, User, Baby, UserCheck, HeartPulse, Car, Bike, Bus, Footprints, Wind, Languages, Users } from 'lucide-react';
import { cn } from '@/lib/utils/helpers';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Modal, Input, Label, Select, Textarea } from '@/components/ui';
import { MainLayout } from '@/components/layout';
import { useState } from 'react';
import type { HouseholdProfile } from '@/types';

const mockProfiles: HouseholdProfile[] = [
  { id: '1', userId: 'demo', name: 'Priya', category: 'adult', conditions: ['asthma'], outdoorFrequency: 'medium', commutePattern: 'public_transport', hasAirPurifier: true, purifierCADR: 400, roomSizeSqFt: 150, preferredLanguage: 'en', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '2', userId: 'demo', name: 'Arjun', category: 'child', conditions: [], outdoorFrequency: 'high', commutePattern: 'walk', hasAirPurifier: false, preferredLanguage: 'en', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: '3', userId: 'demo', name: 'Dadi', category: 'older_adult', conditions: ['hypertension'], outdoorFrequency: 'low', commutePattern: 'car', hasAirPurifier: true, purifierCADR: 300, roomSizeSqFt: 120, preferredLanguage: 'hi', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
];

export default function ProfilesPage() {
  const t = useTranslations('profiles');
  const common = useTranslations('common');
  const [profiles, setProfiles] = useState<HouseholdProfile[]>(mockProfiles);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<HouseholdProfile | null>(null);
  interface ProfileFormData {
  name: string;
  category: 'child' | 'adult' | 'older_adult';
  conditions: string;
  outdoorFrequency: 'low' | 'medium' | 'high';
  commutePattern: 'walk' | 'cycle' | 'public_transport' | 'car' | 'mixed';
  hasAirPurifier: boolean;
  purifierCADR: string;
  roomSizeSqFt: string;
  preferredLanguage: 'en' | 'hi';
}

const [formData, setFormData] = useState<ProfileFormData>({
  name: '',
  category: 'adult',
  conditions: '',
  outdoorFrequency: 'medium',
  commutePattern: 'public_transport',
  hasAirPurifier: false,
  purifierCADR: '',
  roomSizeSqFt: '',
  preferredLanguage: 'en',
});

  const openAddModal = () => {
    setEditingProfile(null);
    setFormData({
      name: '',
      category: 'adult',
      conditions: '',
      outdoorFrequency: 'medium',
      commutePattern: 'public_transport',
      hasAirPurifier: false,
      purifierCADR: '',
      roomSizeSqFt: '',
      preferredLanguage: 'en',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (profile: HouseholdProfile) => {
    setEditingProfile(profile);
    setFormData({
      name: profile.name,
      category: profile.category,
      conditions: profile.conditions.join(', '),
      outdoorFrequency: profile.outdoorFrequency,
      commutePattern: profile.commutePattern,
      hasAirPurifier: profile.hasAirPurifier,
      purifierCADR: profile.purifierCADR?.toString() || '',
      roomSizeSqFt: profile.roomSizeSqFt?.toString() || '',
      preferredLanguage: profile.preferredLanguage,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile = {
      ...formData,
      conditions: formData.conditions?.split(',').map(c => c.trim()).filter(Boolean) || [],
      purifierCADR: formData.purifierCADR ? Number(formData.purifierCADR) : undefined,
      roomSizeSqFt: formData.roomSizeSqFt ? Number(formData.roomSizeSqFt) : undefined,
      hasAirPurifier: formData.hasAirPurifier || false,
      updatedAt: new Date().toISOString(),
    };
    if (editingProfile) {
      setProfiles(profiles.map(p => p.id === editingProfile.id ? { ...p, ...updatedProfile } : p));
    } else {
      const newProfile: HouseholdProfile = {
        id: Date.now().toString(),
        userId: 'demo',
        name: formData.name!,
        category: formData.category as HouseholdProfile['category'],
        conditions: formData.conditions?.split(',').map(c => c.trim()).filter(Boolean) || [],
        outdoorFrequency: formData.outdoorFrequency as HouseholdProfile['outdoorFrequency'],
        commutePattern: formData.commutePattern as HouseholdProfile['commutePattern'],
        hasAirPurifier: formData.hasAirPurifier || false,
        purifierCADR: formData.purifierCADR ? Number(formData.purifierCADR) : undefined,
        roomSizeSqFt: formData.roomSizeSqFt ? Number(formData.roomSizeSqFt) : undefined,
        preferredLanguage: formData.preferredLanguage as HouseholdProfile['preferredLanguage'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfiles([...profiles, newProfile]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this profile?')) {
      setProfiles(profiles.filter(p => p.id !== id));
    }
  };

  const categoryIcons = {
    child: Baby,
    adult: User,
    older_adult: UserCheck,
  };

  const conditionIcons = {
    asthma: HeartPulse,
    default: Shield,
  };

  const commuteIcons = {
    walk: Footprints,
    cycle: Bike,
    public_transport: Bus,
    car: Car,
    mixed: Wind,
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
          {t('addProfile')}
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">{t('noProfiles')}</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">{t('addFirstProfile')}</p>
            <Button onClick={openAddModal} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('addProfile')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((profile) => {
            const CategoryIcon = categoryIcons[profile.category];
            const CommuteIcon = commuteIcons[profile.commutePattern];
            return (
              <Card key={profile.id} variant="hover" className="relative">
                <div className="absolute top-3 right-3 flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(profile)} aria-label={t('editProfile')}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(profile.id)} aria-label={t('deleteProfile')}>
                    <Trash2 className="h-4 w-4 text-brand-accent" />
                  </Button>
                </div>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                      <CategoryIcon className="h-7 w-7 text-brand-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{profile.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                        <Badge variant="info" className="gap-1">
                          <CategoryIcon className="h-3 w-3" />
                          {t(`categories.${profile.category}`)}
                        </Badge>
                        <Badge variant="default" className="gap-1">
                          <CommuteIcon className="h-3 w-3" />
                          {t(`commutePatterns.${profile.commutePattern}`)}
                        </Badge>
                        <Badge variant={profile.outdoorFrequency === 'high' ? 'warning' : profile.outdoorFrequency === 'low' ? 'success' : 'info'}>
                          {t(`outdoorFrequencies.${profile.outdoorFrequency}`)}
                        </Badge>
                      </div>
                      {profile.conditions.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {profile.conditions.map((condition) => (
                            <Badge key={condition} variant="warning" className="gap-1">
                              <HeartPulse className="h-3 w-3" />
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {profile.hasAirPurifier && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Shield className="h-4 w-4 text-brand-secondary" />
                          <span>Purifier: {profile.purifierCADR} m³/h • {profile.roomSizeSqFt} sq ft</span>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <Languages className="h-3 w-3" />
                        <span>{t(`languages.${profile.preferredLanguage}`)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProfile ? t('editProfile') : t('addProfile')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" required>{t('name')}</Label>
            <Input id="name" value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('name')} required />
          </div>
          <div>
            <Label htmlFor="category" required>{t('category')}</Label>
            <Select id="category" value={formData.category || 'adult'} onChange={(value: string) => setFormData({ ...formData, category: value as 'child' | 'adult' | 'older_adult' })}>
              <option value="child">{t('categories.child')}</option>
              <option value="adult">{t('categories.adult')}</option>
              <option value="older_adult">{t('categories.older_adult')}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="conditions">{t('conditions')}</Label>
            <Input id="conditions" value={formData.conditions || ''} onChange={(e) => setFormData({ ...formData, conditions: e.target.value })} placeholder={t('conditionsPlaceholder')} />
          </div>
          <div>
            <Label htmlFor="outdoorFrequency" required>{t('outdoorFrequency')}</Label>
            <Select id="outdoorFrequency" value={formData.outdoorFrequency || 'medium'} onChange={(value: string) => setFormData({ ...formData, outdoorFrequency: value as 'low' | 'medium' | 'high' })}>
              <option value="low">{t('outdoorFrequencies.low')}</option>
              <option value="medium">{t('outdoorFrequencies.medium')}</option>
              <option value="high">{t('outdoorFrequencies.high')}</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="commutePattern" required>{t('commutePattern')}</Label>
            <Select id="commutePattern" value={formData.commutePattern || 'public_transport'} onChange={(value: string) => setFormData({ ...formData, commutePattern: value as 'walk' | 'cycle' | 'public_transport' | 'car' | 'mixed' })}>
              <option value="walk">{t('commutePatterns.walk')}</option>
              <option value="cycle">{t('commutePatterns.cycle')}</option>
              <option value="public_transport">{t('commutePatterns.public_transport')}</option>
              <option value="car">{t('commutePatterns.car')}</option>
              <option value="mixed">{t('commutePatterns.mixed')}</option>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasAirPurifier"
              checked={formData.hasAirPurifier || false}
              onChange={(e) => setFormData({ ...formData, hasAirPurifier: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary"
            />
            <Label htmlFor="hasAirPurifier" className="mb-0 cursor-pointer">{t('hasAirPurifier')}</Label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="purifierCADR">{t('purifierCADR')}</Label>
              <Input id="purifierCADR" type="number" value={formData.purifierCADR || ''} onChange={(e) => setFormData({ ...formData, purifierCADR: e.target.value })} placeholder="400" />
            </div>
            <div>
              <Label htmlFor="roomSizeSqFt">{t('roomSizeSqFt')}</Label>
              <Input id="roomSizeSqFt" type="number" value={formData.roomSizeSqFt || ''} onChange={(e) => setFormData({ ...formData, roomSizeSqFt: e.target.value })} placeholder="150" />
            </div>
          </div>
          <div>
            <Label htmlFor="preferredLanguage" required>{t('preferredLanguage')}</Label>
            <Select id="preferredLanguage" value={formData.preferredLanguage || 'en'} onChange={(value: string) => setFormData({ ...formData, preferredLanguage: value as 'en' | 'hi' })}>
              <option value="en">{t('languages.en')}</option>
              <option value="hi">{t('languages.hi')}</option>
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