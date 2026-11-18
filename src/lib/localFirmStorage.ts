import { JewellerProfile, ShopDetails } from '../types';

const LOCAL_PROFILES_KEY = 'jewel_local_profiles_v1';
const LOCAL_ACTIVE_PROFILE_KEY = 'jewel_local_active_profile_v1';
const LOCAL_COL_PREFIX = 'jewel_local_col_';
const LOCAL_SHOP_PREFIX = 'jewel_local_shop_';

export const DEFAULT_LOCAL_FIRM_PROFILE: JewellerProfile = {
  id: 'firm-local-main',
  firmId: 'firm-local-main',
  code: 'SMJ-01',
  name: 'Swarnkar Jewellers',
  counterName: 'Main Showroom Counter',
  counterType: 'Main Showroom',
  operatorName: 'Owner',
  gstin: 'URP-UNREGISTERED',
  phone: '',
  isDefault: true,
};

function canUseStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function readJson<T>(key: string): T | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[localFirmStorage] Failed to write ${key}:`, err);
  }
}

/**
 * Loads saved firm profiles from device localStorage.
 * Migrates any existing user-scoped profiles from older sessions if present,
 * otherwise creates and stores a ready-to-use default firm profile so the app opens directly.
 */
export function loadLocalFirmProfiles(): JewellerProfile[] {
  if (!canUseStorage()) return [DEFAULT_LOCAL_FIRM_PROFILE];

  const saved = readJson<JewellerProfile[]>(LOCAL_PROFILES_KEY);
  if (Array.isArray(saved) && saved.length > 0) {
    return saved;
  }

  // Migrate any firms created in previous sessions so existing users never lose firm setup
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('jewel_user_') && k.endsWith('_profiles') && k !== 'jewel_user_demo_profiles') {
        const legacy = readJson<JewellerProfile[]>(k);
        if (Array.isArray(legacy) && legacy.length > 0) {
          saveLocalFirmProfiles(legacy);
          return legacy;
        }
      }
    }
  } catch {
    // Ignore storage enumeration issues
  }

  const starter = [{ ...DEFAULT_LOCAL_FIRM_PROFILE }];
  saveLocalFirmProfiles(starter);
  return starter;
}

export function saveLocalFirmProfiles(profiles: JewellerProfile[]): void {
  writeJson(LOCAL_PROFILES_KEY, profiles);
}

export function getActiveLocalFirmId(profiles: JewellerProfile[]): string {
  if (!canUseStorage()) return profiles[0]?.id || DEFAULT_LOCAL_FIRM_PROFILE.id;

  const savedActive = localStorage.getItem(LOCAL_ACTIVE_PROFILE_KEY);
  if (savedActive && profiles.some((p) => p.id === savedActive)) {
    return savedActive;
  }

  // Fallback to any previously active profile from older session keys
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('jewel_user_') && k.endsWith('_active_profile') && k !== 'jewel_user_demo_active_profile') {
        const candidate = localStorage.getItem(k);
        if (candidate && profiles.some((p) => p.id === candidate)) {
          setActiveLocalFirmId(candidate);
          return candidate;
        }
      }
    }
  } catch {
    // Ignore storage enumeration issues
  }

  const fallbackId = profiles[0]?.id || DEFAULT_LOCAL_FIRM_PROFILE.id;
  setActiveLocalFirmId(fallbackId);
  return fallbackId;
}

export function setActiveLocalFirmId(firmId: string): void {
  if (!canUseStorage() || !firmId) return;
  try {
    localStorage.setItem(LOCAL_ACTIVE_PROFILE_KEY, firmId);
  } catch {
    // Ignore storage errors
  }
}

export function loadLocalFirmCollection<T>(firmId: string, colName: string): T[] {
  if (!firmId || !colName) return [];
  const parsed = readJson<T[]>(`${LOCAL_COL_PREFIX}${firmId}_${colName}`);
  return Array.isArray(parsed) ? parsed : [];
}

export function replaceLocalFirmCollection<T>(firmId: string, colName: string, items: T[]): void {
  if (!firmId || !colName) return;
  writeJson(`${LOCAL_COL_PREFIX}${firmId}_${colName}`, items);
}

export function saveLocalFirmCollectionDoc<T extends { id: string }>(
  firmId: string,
  colName: string,
  doc: T
): T[] {
  const existing = loadLocalFirmCollection<T>(firmId, colName);
  const idx = existing.findIndex((item) => item && item.id === doc.id);
  const next = idx >= 0
    ? existing.map((item, i) => (i === idx ? { ...item, ...doc } : item))
    : [doc, ...existing];
  replaceLocalFirmCollection(firmId, colName, next);
  return next;
}

export function deleteLocalFirmCollectionDoc<T extends { id: string }>(
  firmId: string,
  colName: string,
  docId: string
): T[] {
  const existing = loadLocalFirmCollection<T>(firmId, colName);
  const next = existing.filter((item) => item && item.id !== docId);
  replaceLocalFirmCollection(firmId, colName, next);
  return next;
}

export function loadLocalShopDetails(firmId: string): ShopDetails | null {
  if (!firmId) return null;
  return readJson<ShopDetails>(`${LOCAL_SHOP_PREFIX}${firmId}`);
}

export function saveLocalShopDetails(firmId: string, details: ShopDetails): void {
  if (!firmId) return;
  writeJson(`${LOCAL_SHOP_PREFIX}${firmId}`, details);
}
