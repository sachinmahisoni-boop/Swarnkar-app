import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore,
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

function readEnvVar(name: keyof ImportMetaEnv): string {
  const raw = import.meta.env[name];
  if (typeof raw !== 'string') return '';
  const cleaned = raw.trim().replace(/^(['"])(.*)\1$/, '$2').trim();
  if (!cleaned || cleaned === 'undefined' || cleaned === 'null') {
    return '';
  }
  return cleaned;
}

export const missingFirebaseEnvVars: string[] = REQUIRED_ENV_VARS.filter(
  (varName) => !readEnvVar(varName)
);

const apiKey = readEnvVar('VITE_FIREBASE_API_KEY');
const authDomain = readEnvVar('VITE_FIREBASE_AUTH_DOMAIN');
const projectId = readEnvVar('VITE_FIREBASE_PROJECT_ID');
const storageBucket = readEnvVar('VITE_FIREBASE_STORAGE_BUCKET');
const messagingSenderId = readEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID');
const appId = readEnvVar('VITE_FIREBASE_APP_ID');

const rawDatabaseId = readEnvVar('VITE_FIREBASE_FIRESTORE_DATABASE_ID');
export const firestoreDatabaseId = rawDatabaseId || '(default)';

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

let app: FirebaseApp = undefined as unknown as FirebaseApp;
let auth: Auth = undefined as unknown as Auth;
let db: Firestore = undefined as unknown as Firestore;
let firebaseInitError: string | null = null;

if (missingFirebaseEnvVars.length > 0) {
  const startupErrorMsg = `[Firebase Startup Error] Missing required environment variables: ${missingFirebaseEnvVars.join(', ')}`;
  console.error(startupErrorMsg);
} else {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

    try {
      db = initializeFirestore(
        app,
        {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        },
        firestoreDatabaseId
      );
    } catch {
      db = getFirestore(app, firestoreDatabaseId);
    }

    auth = getAuth(app);
  } catch (err: any) {
    firebaseInitError = err?.message || String(err);
    console.error('Firebase initialization error:', err);
  }
}

export const firebaseConfigError: string | null =
  missingFirebaseEnvVars.length > 0
    ? `Missing required Firebase environment variables: ${missingFirebaseEnvVars.join(', ')}`
    : firebaseInitError;

export { app, auth, db };
