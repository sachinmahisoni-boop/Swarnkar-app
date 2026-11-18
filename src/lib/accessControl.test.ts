import { describe, it, expect } from 'vitest';
import {
  CASHIER_PERMISSIONS,
  FULL_PERMISSIONS,
  MANAGER_PERMISSIONS,
  RESTRICTED_PERMISSIONS,
  canUserAccessApp,
  canUserAccessTab,
  canUserCreateInvoice,
  capStaffPermissionsToOwner,
  hasActionPermission,
  mapCollectionToPermissionKey,
  resolveEffectivePermissions,
} from './accessControl';
import { AppUserAccessRecord, JewellerProfile } from '../types';

const makeUser = (overrides: Partial<AppUserAccessRecord> = {}): AppUserAccessRecord => ({
  uid: 'user-1',
  email: 'shop@example.com',
  displayName: 'Test Jeweller',
  status: 'active',
  role: 'owner',
  trialInvoiceLimit: 10,
  trialEndsAt: null,
  invoicesCreatedCount: 0,
  permissions: { ...FULL_PERMISSIONS },
  createdAt: '2026-11-12T00:00:00.000Z',
  ...overrides,
});

describe('accessControl (Unrestricted Open Access)', () => {
  it('immediately grants access to all signed-in users regardless of legacy pending/suspended/null records', () => {
    expect(canUserAccessApp(makeUser({ status: 'pending' })).allowed).toBe(true);
    expect(canUserAccessApp(makeUser({ status: 'suspended' })).allowed).toBe(true);
    expect(canUserAccessApp(makeUser({ status: 'trial' })).allowed).toBe(true);
    expect(canUserAccessApp(makeUser({ status: 'active' })).allowed).toBe(true);
    expect(canUserAccessApp(null).allowed).toBe(true);
  });

  it('never blocks invoice creation due to trial limits or expiration dates', () => {
    const now = Date.parse('2026-11-12T12:00:00.000Z');
    const past = Date.parse('2026-11-10T12:00:00.000Z');

    const legacyTrialUser = makeUser({
      status: 'trial',
      trialInvoiceLimit: 10,
      trialEndsAt: new Date(past).toISOString(),
      permissions: RESTRICTED_PERMISSIONS,
    });

    const res = canUserCreateInvoice(legacyTrialUser, 500, now);
    expect(res.allowed).toBe(true);
    expect(res.isTrial).toBe(false);
    expect(res.limit).toBeNull();
    expect(res.isExpired).toBe(false);
    expect(res.limitReached).toBe(false);
  });

  it('caps staff permissions helper cleanly against owner permissions', () => {
    const ownerPerms = {
      ...FULL_PERMISSIONS,
      purchases: false,
      gstReports: false,
      staffManagement: false,
    };
    const requestedStaff = {
      ...MANAGER_PERMISSIONS,
      purchases: true,
      gstReports: true,
      staffManagement: true,
    };

    const capped = capStaffPermissionsToOwner(requestedStaff, ownerPerms);
    expect(capped.billing).toBe(true);
    expect(capped.purchases).toBe(false);
    expect(capped.gstReports).toBe(false);
    expect(capped.staffManagement).toBe(false);
  });

  it('grants full effective permissions without Master Admin gating', () => {
    const staffUser = makeUser({
      uid: 'staff-1',
      status: 'pending',
      role: 'staff',
      permissions: RESTRICTED_PERMISSIONS,
    });
    const firm: JewellerProfile = {
      id: 'firm-1',
      ownerUid: 'owner-1',
      code: 'FIRM-01',
      name: 'Shreem Mahal',
      counterName: 'Main',
      counterType: 'Main Showroom',
      operatorName: 'Owner',
      gstin: '23AABCS1234F1Z5',
      phone: '9999999999',
    };

    const effective = resolveEffectivePermissions({
      isPlatformAdmin: false,
      userAccess: staffUser,
      firmProfile: firm,
      uid: 'staff-1',
    });

    expect(effective).toEqual(FULL_PERMISSIONS);
  });

  it('allows all ERP tabs and actions while disabling master_control', () => {
    const user = makeUser({ status: 'pending', permissions: CASHIER_PERMISSIONS });
    expect(canUserAccessTab(user, 'pos')).toBe(true);
    expect(canUserAccessTab(user, 'purchases')).toBe(true);
    expect(canUserAccessTab(user, 'reports')).toBe(true);
    expect(canUserAccessTab(user, 'dashboard')).toBe(true);

    expect(hasActionPermission(user, 'canCreateInvoice')).toBe(true);
    expect(hasActionPermission(user, 'canEditRates')).toBe(true);
    expect(hasActionPermission(user, 'canExportBackup')).toBe(true);
    expect(hasActionPermission(user, 'canCancelInvoice')).toBe(true);
    expect(hasActionPermission(user, 'canDeleteRecords')).toBe(true);

    expect(mapCollectionToPermissionKey('invoices')).toBe('billing');
    expect(mapCollectionToPermissionKey('purchases')).toBe('purchases');
    expect(mapCollectionToPermissionKey('rates')).toBe('rates');
    expect(mapCollectionToPermissionKey('girvi')).toBe('girvi');
    expect(RESTRICTED_PERMISSIONS.billing).toBe(false);
  });
});
