import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_LOCAL_FIRM_PROFILE,
  deleteLocalFirmCollectionDoc,
  getActiveLocalFirmId,
  loadLocalFirmCollection,
  loadLocalFirmProfiles,
  loadLocalShopDetails,
  replaceLocalFirmCollection,
  saveLocalFirmCollectionDoc,
  saveLocalFirmProfiles,
  saveLocalShopDetails,
  setActiveLocalFirmId,
} from './localFirmStorage';

function createMockLocalStorage() {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe('localFirmStorage (login-free device persistence)', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createMockLocalStorage(),
      configurable: true,
      writable: true,
    });
  });

  it('auto-creates a default local firm profile when none exist so dashboard opens directly', () => {
    const profiles = loadLocalFirmProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].id).toBe(DEFAULT_LOCAL_FIRM_PROFILE.id);
    expect(getActiveLocalFirmId(profiles)).toBe(DEFAULT_LOCAL_FIRM_PROFILE.id);
  });

  it('migrates previously saved user firm profiles without requiring login', () => {
    localStorage.setItem(
      'jewel_user_uid123_profiles',
      JSON.stringify([{ ...DEFAULT_LOCAL_FIRM_PROFILE, id: 'firm-old-1', name: 'Shreem Mahal' }])
    );
    localStorage.setItem('jewel_user_uid123_active_profile', 'firm-old-1');

    const profiles = loadLocalFirmProfiles();
    expect(profiles).toHaveLength(1);
    expect(profiles[0].name).toBe('Shreem Mahal');
    expect(getActiveLocalFirmId(profiles)).toBe('firm-old-1');
  });

  it('saves, updates, replaces, and deletes firm collection items and shop details', () => {
    const firmId = 'firm-local-main';
    saveLocalFirmProfiles([{ ...DEFAULT_LOCAL_FIRM_PROFILE, id: firmId }]);
    setActiveLocalFirmId(firmId);

    saveLocalFirmCollectionDoc(firmId, 'inventory', { id: 'item-1', name: 'Gold Ring', quantity: 2 });
    saveLocalFirmCollectionDoc(firmId, 'inventory', { id: 'item-2', name: 'Silver Chain', quantity: 5 });
    expect(loadLocalFirmCollection<any>(firmId, 'inventory')).toHaveLength(2);

    saveLocalFirmCollectionDoc(firmId, 'inventory', { id: 'item-1', name: 'Gold Ring', quantity: 1 });
    const updated = loadLocalFirmCollection<any>(firmId, 'inventory');
    expect(updated.find((i) => i.id === 'item-1')?.quantity).toBe(1);

    deleteLocalFirmCollectionDoc(firmId, 'inventory', 'item-2');
    expect(loadLocalFirmCollection<any>(firmId, 'inventory')).toHaveLength(1);

    replaceLocalFirmCollection(firmId, 'customers', [{ id: 'cust-1', name: 'Ramesh' }]);
    expect(loadLocalFirmCollection<any>(firmId, 'customers')).toHaveLength(1);

    saveLocalShopDetails(firmId, {
      firmId,
      name: 'Shreem Mahal',
      tagline: 'Jewellers',
      address: 'Bhopal',
      cityStatePincode: '462042',
      phone: '9999999999',
      email: '',
      gstin: '23AAA',
      bisHallmarkRegNo: '',
      panNo: '',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      terms: [],
    });
    expect(loadLocalShopDetails(firmId)?.name).toBe('Shreem Mahal');
  });
});
