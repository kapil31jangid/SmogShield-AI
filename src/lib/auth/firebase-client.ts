import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, type Firestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;

export function getFirebaseClient(): { app: FirebaseApp; auth: Auth; db: Firestore } {
  if (firebaseApp && firebaseAuth && firebaseDb) {
    return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
  }

  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  firebaseAuth = getAuth(firebaseApp);
  firebaseDb = getFirestore(firebaseApp);

  // Connect to emulators in development
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Only connect if not already connected
    try {
      connectAuthEmulator(firebaseAuth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
    } catch {
      // Already connected
    }
  }

  return { app: firebaseApp!, auth: firebaseAuth!, db: firebaseDb! };
}

export function getClientAuth(): Auth {
  return getFirebaseClient().auth;
}

export function getClientDb(): Firestore {
  return getFirebaseClient().db;
}