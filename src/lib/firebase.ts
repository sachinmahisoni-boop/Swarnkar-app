import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  Firestore 
} from 'firebase/firestore';

const REQUIRED_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
] as const;

export const missingFirebaseEnvVars: string[] = REQUIRED_ENV_VARS.filter(
  (varName) => !import.meta.env[varName]
);

export const firebaseConfigError: string | null = missingFirebaseEnvVars.length > 0
  ? `Missing required Firebase environment variables: ${missingFirebaseEnvVars.join(', ')}`
  : null;

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || '';
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || '';
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '';
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '';
const appId = import.meta.env.VITE_FIREBASE_APP_ID || '';

const rawDatabaseId = import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
export const firestoreDatabaseId = (rawDatabaseId && rawDatabaseId.trim()) ? rawDatabaseId.trim() : '(default)';

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (missingFirebaseEnvVars.length > 0) {
  const startupErrorMsg = `[Firebase Startup Error] Missing required environment variables: ${missingFirebaseEnvVars.join(', ')}`;
  console.error(startupErrorMsg);
}

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  db = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    },
    firestoreDatabaseId
  );

  auth = getAuth(app);
} catch (err: any) {
  console.error('Firebase initialization error:', err);
}

export { app, auth, db };
