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
  getTrialDaysRemaining,
  hasActionPermission,
  mapCollectionToPermissionKey,
  resolveEffectivePermissions,
} from './accessControl';
import { AppUserAccessRecord, JewellerProfile } from '../types';

const makeUser = (overrides: Partial<AppUserAccessRecord> = {}): AppUserAccessRecord => ({
  uid: 'user-1',
  email: 'shop@example.com',
  displayName: 'Test Jeweller',
  status: 'pending',
  role: 'owner',
  trialInvoiceLimit: 10,
  trialEndsAt: null,
  invoicesCreatedCount: 0,
  permissions: { ...CASHIER_PERMISSIONS },
  createdAt: '2026-11-12T00:00:00.000Z',
  ...overrides,
});

describe('accessControl RBAC & trial limits', () => {
  it('blocks pending and suspended users while allowing trial and active users', () => {
    expect(canUserAccessApp(makeUser({ status: 'pending' })).allowed).toBe(false);
    expect(canUserAccessApp(makeUser({ status: 'suspended' })).allowed).toBe(false);
    expect(canUserAccessApp(makeUser({ status: 'trial' })).allowed).toBe(true);
    expect(canUserAccessApp(makeUser({ status: 'active' })).allowed).toBe(true);
    expect(canUserAccessApp(null, true).allowed).toBe(true);
  });

  it('enforces both trial invoice count limit and trialEndsAt expiration', () => {
    const now = Date.parse('2026-11-12T12:00:00.000Z');
    const future = Date.parse('2026-11-27T12:00:00.000Z');
    const past = Date.parse('2026-11-10T12:00:00.000Z');

    const trialOk = makeUser({
      status: 'trial',
      trialInvoiceLimit: 10,
      trialEndsAt: new Date(future).toISOString(),
      permissions: FULL_PERMISSIONS,
    });

    const resOk = canUserCreateInvoice(trialOk, 4, now);
    expect(resOk.allowed).toBe(true);
    expect(resOk.remaining).toBe(6);
    expect(resOk.daysRemaining).toBe(15);

    // At invoice limit 10/10 -> blocked
    const resLimit = canUserCreateInvoice(trialOk, 10, now);
    expect(resLimit.allowed).toBe(false);
    expect(resLimit.limitReached).toBe(true);
    expect(resLimit.remaining).toBe(0);

    // Past trialEndsAt -> blocked even if usage < limit
    const trialExpired = makeUser({
      status: 'trial',
      trialInvoiceLimit: 10,
      trialEndsAt: new Date(past).toISOString(),
      permissions: FULL_PERMISSIONS,
    });
    const resExpired = canUserCreateInvoice(trialExpired, 2, now);
    expect(resExpired.allowed).toBe(false);
    expect(resExpired.isExpired).toBe(true);
    expect(getTrialDaysRemaining(trialExpired.trialEndsAt, now)).toBe(0);

    // Active users have no limit
    const activeUser = makeUser({
      status: 'active',
      trialInvoiceLimit: 10,
      trialEndsAt: new Date(past).toISOString(),
      permissions: FULL_PERMISSIONS,
    });
    const resActive = canUserCreateInvoice(activeUser, 250, now);
    expect(resActive.allowed).toBe(true);
    expect(resActive.limit).toBeNull();
  });

  it('caps staff permissions strictly at owner permissions', () => {
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

  it('computes effective permissions for staff member on firm', () => {
    const owner = makeUser({
      uid: 'owner-1',
      status: 'active',
      permissions: { ...FULL_PERMISSIONS, girvi: false },
    });
    const staffUser = makeUser({
      uid: 'staff-1',
      status: 'active',
      role: 'staff',
      permissions: FULL_PERMISSIONS,
    });
    const firm: JewellerProfile = {
      id: 'firm-1',
      ownerUid: 'owner-1',
      staff: { 'staff-1': 'cashier' },
      staffPermissions: {
        'staff-1': { ...CASHIER_PERMISSIONS, girvi: true },
      },
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
      ownerAccess: owner,
    });

    expect(effective.billing).toBe(true);
    expect(effective.girvi).toBe(false); // capped because owner lacks girvi
    expect(effective.purchases).toBe(false);
    expect(effective.rates).toBe(false);
  });

  it('maps sidebar tabs, action permissions, and Firestore collections accurately', () => {
    const cashier = makeUser({ status: 'active', permissions: CASHIER_PERMISSIONS });
    expect(canUserAccessTab(cashier, 'pos')).toBe(true);
    expect(canUserAccessTab(cashier, 'purchases')).toBe(false);
    expect(canUserAccessTab(cashier, 'reports')).toBe(false);
    expect(canUserAccessTab(cashier, 'master_control')).toBe(false);
    expect(canUserAccessTab(cashier, 'master_control', null, true)).toBe(true);

    expect(hasActionPermission(cashier, 'canCreateInvoice')).toBe(true);
    expect(hasActionPermission(cashier, 'canEditRates')).toBe(false);
    expect(hasActionPermission(cashier, 'canExportBackup')).toBe(false);
    expect(hasActionPermission(cashier, 'canCancelInvoice')).toBe(false);

    expect(mapCollectionToPermissionKey('invoices')).toBe('billing');
    expect(mapCollectionToPermissionKey('purchases')).toBe('purchases');
    expect(mapCollectionToPermissionKey('rates')).toBe('rates');
    expect(mapCollectionToPermissionKey('girvi')).toBe('girvi');
    expect(RESTRICTED_PERMISSIONS.billing).toBe(false);
  });
});
