import {
  AppUserAccessRecord,
  FirestoreTimestampLike,
  JewellerProfile,
  UserApprovalStatus,
  UserPermissions,
} from '../types';
import { TabType } from '../components/Navigation';

export const DEFAULT_TRIAL_INVOICE_LIMIT = 10;
export const DEFAULT_TRIAL_DAYS = 15;

export const FULL_PERMISSIONS: UserPermissions = {
  billing: true,
  estimates: true,
  purchases: true,
  inventory: true,
  customers: true,
  vendors: true,
  karigar: true,
  girvi: true,
  gemstones: true,
  expenses: true,
  reports: true,
  gstReports: true,
  rates: true,
  backupExport: true,
  invoiceCancel: true,
  staffManagement: true,
};

export const MANAGER_PERMISSIONS: UserPermissions = {
  billing: true,
  estimates: true,
  purchases: true,
  inventory: true,
  customers: true,
  vendors: true,
  karigar: true,
  girvi: true,
  gemstones: true,
  expenses: true,
  reports: true,
  gstReports: true,
  rates: true,
  backupExport: true,
  invoiceCancel: true,
  staffManagement: false,
};

export const CASHIER_PERMISSIONS: UserPermissions = {
  billing: true,
  estimates: true,
  purchases: false,
  inventory: true,
  customers: true,
  vendors: false,
  karigar: false,
  girvi: false,
  gemstones: false,
  expenses: false,
  reports: false,
  gstReports: false,
  rates: false,
  backupExport: false,
  invoiceCancel: false,
  staffManagement: false,
};

export const RESTRICTED_PERMISSIONS: UserPermissions = {
  billing: false,
  estimates: false,
  purchases: false,
  inventory: false,
  customers: false,
  vendors: false,
  karigar: false,
  girvi: false,
  gemstones: false,
  expenses: false,
  reports: false,
  gstReports: false,
  rates: false,
  backupExport: false,
  invoiceCancel: false,
  staffManagement: false,
};

export const PERMISSION_PRESETS: Record<'cashier' | 'manager' | 'full', UserPermissions> = {
  cashier: CASHIER_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
  full: FULL_PERMISSIONS,
};

export type PermissionKey = keyof UserPermissions;

export const MODULE_PERMISSION_META: {
  key: PermissionKey;
  label: string;
  hindi: string;
  category: 'module' | 'action';
}[] = [
  { key: 'billing', label: 'Billing / POS', hindi: 'POS बिक्री व GST बिल', category: 'module' },
  { key: 'estimates', label: 'Estimates & Orders', hindi: 'कच्चा एस्टिमेट व आर्डर', category: 'module' },
  { key: 'purchases', label: 'Purchases', hindi: 'खरीद / आवक', category: 'module' },
  { key: 'inventory', label: 'Inventory & Barcode', hindi: 'स्टॉक व बारकोड', category: 'module' },
  { key: 'customers', label: 'Customers & Kitty/CRM', hindi: 'ग्राहक खाता व स्कीम', category: 'module' },
  { key: 'vendors', label: 'Vendors', hindi: 'सप्लायर / व्यापारी', category: 'module' },
  { key: 'karigar', label: 'Karigar Ledger', hindi: 'कारीगर हिसाब', category: 'module' },
  { key: 'girvi', label: 'Girvi Ledger', hindi: 'गिरवी खाता', category: 'module' },
  { key: 'gemstones', label: 'Gemstones', hindi: 'रत्न डेस्क', category: 'module' },
  { key: 'expenses', label: 'Expenses & Cash/Bank', hindi: 'खर्चे, रोकड़ व वेतन', category: 'module' },
  { key: 'reports', label: 'Reports & Profit', hindi: 'मुनाफा व रिपोर्ट्स', category: 'module' },
  { key: 'gstReports', label: 'GST & HSN Reports', hindi: 'GSTR-1 व टैक्स लेखा', category: 'module' },
  { key: 'rates', label: 'Daily Metal Rates', hindi: 'दैनिक भाव अपडेट', category: 'action' },
  { key: 'backupExport', label: 'Backup / Export', hindi: 'डेटा बैकअप व एक्सपोर्ट', category: 'action' },
  { key: 'invoiceCancel', label: 'Cancel Invoices', hindi: 'इनवॉइस रद्द करना', category: 'action' },
  { key: 'staffManagement', label: 'User / Staff & Settings', hindi: 'स्टाफ व शॉप सेटिंग्स', category: 'action' },
];

export function toEpochMs(value?: FirestoreTimestampLike | null): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (value instanceof Date) {
    const ms = value.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'object') {
    if (typeof value.toMillis === 'function') {
      const ms = value.toMillis();
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof value.toDate === 'function') {
      const ms = value.toDate().getTime();
      return Number.isFinite(ms) ? ms : null;
    }
    if (typeof value.seconds === 'number') {
      return value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1_000_000);
    }
  }
  return null;
}

export function getTrialDaysRemaining(
  trialEndsAt?: FirestoreTimestampLike | null,
  nowMs: number = Date.now()
): number | null {
  const endMs = toEpochMs(trialEndsAt);
  if (endMs === null) return null;
  const diff = endMs - nowMs;
  if (diff <= 0) return 0;
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

export function normalizePermissions(
  perms?: Partial<UserPermissions> | null,
  fallback: UserPermissions = RESTRICTED_PERMISSIONS
): UserPermissions {
  const out = { ...fallback };
  if (!perms) return out;
  for (const key of Object.keys(out) as PermissionKey[]) {
    if (typeof perms[key] === 'boolean') {
      out[key] = Boolean(perms[key]);
    }
  }
  return out;
}

/**
 * Ensures staff permissions can NEVER exceed the firm owner's permissions.
 */
export function capStaffPermissionsToOwner(
  staffPerms: Partial<UserPermissions> | null | undefined,
  ownerPerms: Partial<UserPermissions> | null | undefined
): UserPermissions {
  const cleanStaff = normalizePermissions(staffPerms, RESTRICTED_PERMISSIONS);
  const cleanOwner = normalizePermissions(ownerPerms, RESTRICTED_PERMISSIONS);
  const capped = { ...RESTRICTED_PERMISSIONS };
  for (const key of Object.keys(capped) as PermissionKey[]) {
    capped[key] = Boolean(cleanStaff[key] && cleanOwner[key]);
  }
  return capped;
}

export function isApprovedOrTrialStatus(status?: string | null): boolean {
  return status === 'active' || status === 'trial' || status === 'approved';
}

export function resolveEffectivePermissions(_params: {
  isPlatformAdmin?: boolean;
  userAccess?: AppUserAccessRecord | null;
  firmProfile?: JewellerProfile | null;
  uid?: string | null;
  ownerAccess?: AppUserAccessRecord | null;
}): UserPermissions {
  return { ...FULL_PERMISSIONS };
}

export function validateTrialFirestoreReadiness(
  _record?: AppUserAccessRecord | null,
  _nowMs: number = Date.now()
): {
  valid: boolean;
  reason?: string;
} {
  return { valid: true };
}

export function canUserAccessApp(
  _record?: AppUserAccessRecord | null,
  _isPlatformAdmin: boolean = false
): {
  allowed: boolean;
  status: UserApprovalStatus | 'unregistered';
  message?: string;
} {
  return { allowed: true, status: 'active' };
}

export function canUserCreateInvoice(
  record?: AppUserAccessRecord | null,
  firmUsageCount?: number | null,
  _nowMs: number = Date.now(),
  _isPlatformAdmin: boolean = false,
  _effectivePerms?: UserPermissions | null
): {
  allowed: boolean;
  isTrial: boolean;
  remaining: number | null;
  limit: number | null;
  used: number;
  daysRemaining: number | null;
  isExpired: boolean;
  limitReached: boolean;
  reason?: string;
} {
  return {
    allowed: true,
    isTrial: false,
    remaining: null,
    limit: null,
    used: Math.max(0, firmUsageCount ?? record?.invoicesCreatedCount ?? 0),
    daysRemaining: null,
    isExpired: false,
    limitReached: false,
  };
}

export function mapTabToPermissionKey(tab: TabType): PermissionKey | null {
  switch (tab) {
    case 'dashboard':
      return 'reports';
    case 'pos':
    case 'invoices':
      return 'billing';
    case 'orders':
      return 'estimates';
    case 'purchases':
      return 'purchases';
    case 'inventory':
    case 'barcode':
      return 'inventory';
    case 'customers':
    case 'kitty':
    case 'crm':
      return 'customers';
    case 'vendors':
      return 'vendors';
    case 'karigar':
      return 'karigar';
    case 'girvi':
      return 'girvi';
    case 'gemstones':
      return 'gemstones';
    case 'expenses':
    case 'cashbank':
    case 'bullion':
    case 'payroll':
      return 'expenses';
    case 'reports':
      return 'gstReports';
    case 'profit':
      return 'reports';
    default:
      return 'billing';
  }
}

export function canUserAccessTab(
  _record: AppUserAccessRecord | null | undefined,
  tab: TabType,
  _effectivePerms?: UserPermissions | null,
  _isPlatformAdmin: boolean = false
): boolean {
  if ((tab as string) === 'master_control') {
    return false;
  }
  return true;
}

export function getFirstAllowedTab(
  _record: AppUserAccessRecord | null | undefined,
  _effectivePerms?: UserPermissions | null,
  _isPlatformAdmin: boolean = false
): TabType {
  return 'dashboard';
}

export type LegacyActionKey =
  | 'canCreateInvoice'
  | 'canCancelInvoice'
  | 'canEditRates'
  | 'canEditSettings'
  | 'canDeleteRecords'
  | 'canExportBackup';

export function hasActionPermission(
  _record: AppUserAccessRecord | null | undefined,
  _action: LegacyActionKey | PermissionKey,
  _effectivePerms?: UserPermissions | null,
  _isPlatformAdmin: boolean = false
): boolean {
  return true;
}

export function mapCollectionToPermissionKey(collectionName: string): PermissionKey | null {
  switch (collectionName) {
    case 'invoices':
    case 'sequence_counters':
    case 'usage':
      return 'billing';
    case 'purchases':
      return 'purchases';
    case 'inventory':
      return 'inventory';
    case 'customers':
      return 'customers';
    case 'vendors':
      return 'vendors';
    case 'karigars':
    case 'jobcards':
      return 'karigar';
    case 'girvi':
      return 'girvi';
    case 'gemstones':
      return 'gemstones';
    case 'expenses':
    case 'transfers':
      return 'expenses';
    case 'rates':
      return 'rates';
    case 'shop_details':
    case 'staff_invites':
      return 'staffManagement';
    default:
      return null;
  }
}
