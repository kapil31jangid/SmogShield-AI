import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

export function getFirebaseAdmin(): { app: App; auth: Auth; db: Firestore } {
  if (adminApp && adminAuth && adminDb) {
    return { app: adminApp, auth: adminAuth, db: adminDb };
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not configured');
  }

  let serviceAccount: Record<string, unknown>;
  try {
    const decoded = Buffer.from(serviceAccountJson, 'base64').toString('utf-8');
    serviceAccount = JSON.parse(decoded);
  } catch {
    throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON (must be base64 encoded)');
  }

  adminApp = getApps().length === 0
    ? initializeApp({ credential: cert(serviceAccount) })
    : getApps()[0]!;

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);

  return { app: adminApp!, auth: adminAuth!, db: adminDb! };
}

export function getAdminAuth(): Auth {
  return getFirebaseAdmin().auth;
}

export function getAdminDb(): Firestore {
  return getFirebaseAdmin().db;
}

export async function verifyIdToken(idToken: string) {
  const { auth } = getFirebaseAdmin();
  return auth.verifyIdToken(idToken);
}

export async function createSessionCookie(idToken: string, expiresIn: number) {
  const { auth } = getFirebaseAdmin();
  return auth.createSessionCookie(idToken, { expiresIn });
}

export async function verifySessionCookie(sessionCookie: string) {
  const { auth } = getFirebaseAdmin();
  return auth.verifySessionCookie(sessionCookie, true);
}