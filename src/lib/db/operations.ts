import { getAdminDb } from '@/lib/auth/firebase-admin';
import type { HouseholdProfile, TrackedAction, CommunityChallenge, AIConversation, AIMessage } from '@/types';
import { generateId } from '@/lib/utils/helpers';

const COLLECTIONS = {
  PROFILES: 'profiles',
  ACTIONS: 'actions',
  CHALLENGES: 'challenges',
  CONVERSATIONS: 'conversations',
  PREFERENCES: 'preferences',
} as const;

function getDb() {
  return getAdminDb();
}

function profileDocRef(userId: string, profileId: string) {
  return getDb().doc(`users/${userId}/${COLLECTIONS.PROFILES}/${profileId}`);
}

function profilesCollectionRef(userId: string) {
  return getDb().collection(`users/${userId}/${COLLECTIONS.PROFILES}`);
}

function actionDocRef(userId: string, actionId: string) {
  return getDb().doc(`users/${userId}/${COLLECTIONS.ACTIONS}/${actionId}`);
}

function actionsCollectionRef(userId: string) {
  return getDb().collection(`users/${userId}/${COLLECTIONS.ACTIONS}`);
}

function challengeDocRef(challengeId: string) {
  return getDb().doc(`${COLLECTIONS.CHALLENGES}/${challengeId}`);
}

function challengesCollectionRef() {
  return getDb().collection(COLLECTIONS.CHALLENGES);
}

function conversationDocRef(userId: string, conversationId: string) {
  return getDb().doc(`users/${userId}/${COLLECTIONS.CONVERSATIONS}/${conversationId}`);
}

function conversationsCollectionRef(userId: string) {
  return getDb().collection(`users/${userId}/${COLLECTIONS.CONVERSATIONS}`);
}

// Profile Operations
export async function createProfile(userId: string, data: Omit<HouseholdProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<HouseholdProfile> {
  const profileId = generateId();
  const now = new Date().toISOString();
  const profile: HouseholdProfile = {
    ...data,
    id: profileId,
    userId,
    createdAt: now,
    updatedAt: now,
  };
  await profileDocRef(userId, profileId).set(profile);
  return profile;
}

export async function getProfile(userId: string, profileId: string): Promise<HouseholdProfile | null> {
  const snap = await profileDocRef(userId, profileId).get();
  return snap.exists ? (snap.data() as HouseholdProfile) : null;
}

export async function getProfiles(userId: string): Promise<HouseholdProfile[]> {
  const snap = await profilesCollectionRef(userId).orderBy('createdAt', 'desc').get();
  return snap.docs.map(d => d.data() as HouseholdProfile);
}

export async function updateProfile(userId: string, profileId: string, data: Partial<HouseholdProfile>): Promise<void> {
  await profileDocRef(userId, profileId).update({ ...data, updatedAt: new Date().toISOString() });
}

export async function deleteProfile(userId: string, profileId: string): Promise<void> {
  await profileDocRef(userId, profileId).delete();
}

// Action Operations
export async function createAction(userId: string, data: Omit<TrackedAction, 'id' | 'userId' | 'timestamp' | 'verified'>): Promise<TrackedAction> {
  const actionId = generateId();
  const now = new Date().toISOString();
  const action: TrackedAction = {
    ...data,
    id: actionId,
    userId,
    timestamp: now,
    verified: false,
  };
  await actionDocRef(userId, actionId).set(action);
  return action;
}

export async function getActions(userId: string, limitCount: number = 50): Promise<TrackedAction[]> {
  const snap = await actionsCollectionRef(userId).orderBy('timestamp', 'desc').limit(limitCount).get();
  return snap.docs.map(d => d.data() as TrackedAction);
}

export async function getActionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<TrackedAction[]> {
  const snap = await actionsCollectionRef(userId)
    .where('timestamp', '>=', startDate.toISOString())
    .where('timestamp', '<=', endDate.toISOString())
    .orderBy('timestamp', 'desc')
    .get();
  return snap.docs.map(d => d.data() as TrackedAction);
}

// Challenge Operations
export async function getActiveChallenges(): Promise<CommunityChallenge[]> {
  const now = new Date().toISOString();
  const snap = await challengesCollectionRef()
    .where('isActive', '==', true)
    .where('startDate', '<=', now)
    .where('endDate', '>=', now)
    .orderBy('startDate', 'asc')
    .get();
  return snap.docs.map(d => d.data() as CommunityChallenge);
}

export async function joinChallenge(userId: string, challengeId: string): Promise<void> {
  const challengeRef = challengeDocRef(challengeId);
  const challengeSnap = await challengeRef.get();
  if (!challengeSnap.exists) throw new Error('Challenge not found');

  const challenge = challengeSnap.data() as CommunityChallenge;
  if (challenge.participants.includes(userId)) return;

  await challengeRef.update({
    participants: [...challenge.participants, userId],
    currentActions: challenge.currentActions + 1,
  });
}

export async function createChallenge(data: Omit<CommunityChallenge, 'id' | 'currentActions' | 'participants'>): Promise<CommunityChallenge> {
  const challengeId = generateId();
  const challenge: CommunityChallenge = {
    ...data,
    id: challengeId,
    currentActions: 0,
    participants: [],
  };
  await challengeDocRef(challengeId).set(challenge);
  return challenge;
}

// Conversation Operations
export async function createConversation(userId: string, firstMessage: AIMessage): Promise<AIConversation> {
  const conversationId = generateId();
  const now = new Date().toISOString();
  const conversation: AIConversation = {
    id: conversationId,
    userId,
    messages: [firstMessage],
    createdAt: now,
    updatedAt: now,
  };
  await conversationDocRef(userId, conversationId).set(conversation);
  return conversation;
}

export async function getConversation(userId: string, conversationId: string): Promise<AIConversation | null> {
  const snap = await conversationDocRef(userId, conversationId).get();
  return snap.exists ? (snap.data() as AIConversation) : null;
}

export async function getConversations(userId: string, limitCount: number = 10): Promise<AIConversation[]> {
  const snap = await conversationsCollectionRef(userId).orderBy('updatedAt', 'desc').limit(limitCount).get();
  return snap.docs.map(d => d.data() as AIConversation);
}

export async function addMessageToConversation(userId: string, conversationId: string, message: AIMessage): Promise<void> {
  const convRef = conversationDocRef(userId, conversationId);
  const convSnap = await convRef.get();
  if (!convSnap.exists) throw new Error('Conversation not found');

  const conversation = convSnap.data() as AIConversation;
  await convRef.update({
    messages: [...conversation.messages, message],
    updatedAt: new Date().toISOString(),
  });
}

// Demo data seeding
export async function seedDemoChallenges(): Promise<void> {
  const challenges: Omit<CommunityChallenge, 'id' | 'currentActions' | 'participants'>[] = [
    {
      title: 'Clean Air Commute Week',
      description: 'Use public transport, carpool, or walk/cycle for your commute for 5 days',
      type: 'household',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      targetActions: 5,
      isActive: true,
    },
    {
      title: 'Indoor Air Health Challenge',
      description: 'Eliminate 3 indoor pollution sources (incense, candles, smoking, etc.)',
      type: 'household',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      targetActions: 3,
      isActive: true,
    },
    {
      title: 'Neighborhood Clean Air Drive',
      description: 'Organize a community awareness event or tree planting',
      type: 'neighborhood',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      targetActions: 1,
      isActive: true,
    },
  ];

  const batch = getDb().batch();
  for (const challenge of challenges) {
    const challengeId = generateId();
    batch.set(challengeDocRef(challengeId), {
      ...challenge,
      id: challengeId,
      currentActions: 0,
      participants: [],
    });
  }
  await batch.commit();
}