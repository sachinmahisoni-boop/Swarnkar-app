import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const initializeAppMock = vi.fn(() => ({ name: '[DEFAULT]' }));
const getAppsMock = vi.fn(() => []);
const getAppMock = vi.fn(() => ({ name: '[DEFAULT]' }));
const getAuthMock = vi.fn(() => ({ currentUser: null }));
const initializeFirestoreMock = vi.fn(() => ({ type: 'firestore' }));
const getFirestoreMock = vi.fn(() => ({ type: 'firestore' }));
const persistentLocalCacheMock = vi.fn(() => ({}));
const persistentMultipleTabManagerMock = vi.fn(() => ({}));

vi.mock('firebase/app', () => ({
  initializeApp: initializeAppMock,
  getApps: getAppsMock,
  getApp: getAppMock
}));

vi.mock('firebase/auth', () => ({
  getAuth: getAuthMock
}));

vi.mock('firebase/firestore', () => ({
  initializeFirestore: initializeFirestoreMock,
  getFirestore: getFirestoreMock,
  persistentLocalCache: persistentLocalCacheMock,
  persistentMultipleTabManager: persistentMultipleTabManagerMock
}));

describe('firebase startup configuration', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does NOT call initializeApp, initializeFirestore, or getAuth when env vars are missing', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', '');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', '');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '');

    const mod = await import('./firebase');

    expect(mod.missingFirebaseEnvVars).toEqual([
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ]);
    expect(mod.firebaseConfigError).toContain('Missing required Firebase environment variables');
    expect(mod.auth).toBeUndefined();
    expect(mod.db).toBeUndefined();
    expect(initializeAppMock).not.toHaveBeenCalled();
    expect(initializeFirestoreMock).not.toHaveBeenCalled();
    expect(getAuthMock).not.toHaveBeenCalled();
  });

  it('trims whitespace and quotes and initializes Firebase when all required env vars are present', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', ' "test-api-key-123" ');
    vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-app.firebaseapp.com');
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com');
    vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '1234567890');
    vi.stubEnv('VITE_FIREBASE_APP_ID', '1:1234567890:web:abcdef');
    vi.stubEnv('VITE_FIREBASE_FIRESTORE_DATABASE_ID', ' custom-db ');

    const mod = await import('./firebase');

    expect(mod.missingFirebaseEnvVars).toEqual([]);
    expect(mod.firebaseConfigError).toBeNull();
    expect(mod.firestoreDatabaseId).toBe('custom-db');
    expect(initializeAppMock).toHaveBeenCalledWith({
      apiKey: 'test-api-key-123',
      authDomain: 'test-app.firebaseapp.com',
      projectId: 'test-project',
      storageBucket: 'test-project.appspot.com',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:web:abcdef'
    });
    expect(initializeFirestoreMock).toHaveBeenCalledTimes(1);
    expect(getAuthMock).toHaveBeenCalledTimes(1);
  });
});
