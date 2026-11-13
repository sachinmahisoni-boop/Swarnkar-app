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

export function resolveEffectivePermissions(params: {
  isPlatformAdmin?: boolean;
  userAccess?: AppUserAccessRecord | null;
  firmProfile?: JewellerProfile | null;
  uid?: string | null;
  ownerAccess?: AppUserAccessRecord | null;
}): UserPermissions {
  const { isPlatformAdmin, userAccess, firmProfile, uid, ownerAccess } = params;
  if (isPlatformAdmin) return { ...FULL_PERMISSIONS };
  if (!userAccess || !isApprovedOrTrialStatus(userAccess.status)) {
    return { ...RESTRICTED_PERMISSIONS };
  }

  const userPerms = normalizePermissions(userAccess.permissions, FULL_PERMISSIONS);
  if (!firmProfile || !uid) return userPerms;

  const isOwner = firmProfile.ownerUid === uid;
  if (isOwner) return userPerms;

  // Staff member: intersect staff firm permissions, user's own permissions, and owner's permissions
  const firmStaffPerms = firmProfile.staffPermissions?.[uid];
  const ownerPerms = ownerAccess
    ? normalizePermissions(ownerAccess.permissions, FULL_PERMISSIONS)
    : FULL_PERMISSIONS;
  const staffRole = firmProfile.staff?.[uid];
  const roleDefault =
    staffRole === 'manager'
      ? MANAGER_PERMISSIONS
      : staffRole === 'cashier'
        ? CASHIER_PERMISSIONS
        : RESTRICTED_PERMISSIONS;

  const effectiveStaffPerms = firmStaffPerms
    ? normalizePermissions(firmStaffPerms, RESTRICTED_PERMISSIONS)
    : roleDefault;

  return capStaffPermissionsToOwner(
    capStaffPermissionsToOwner(effectiveStaffPerms, userPerms),
    ownerPerms
  );
}

export function canUserAccessApp(
  record?: AppUserAccessRecord | null,
  isPlatformAdmin: boolean = false
): {
  allowed: boolean;
  status: UserApprovalStatus | 'unregistered';
  message?: string;
} {
  if (isPlatformAdmin) {
    return { allowed: true, status: 'active' };
  }
  if (!record) {
    return {
      allowed: false,
      status: 'unregistered',
      message: 'आपका यूज़र प्रोफ़ाइल सत्यापित किया जा रहा है...',
    };
  }
  if (isApprovedOrTrialStatus(record.status)) {
    const normalized: UserApprovalStatus = record.status === 'trial' ? 'trial' : 'active';
    return { allowed: true, status: normalized };
  }
  if (record.status === 'pending') {
    return {
      allowed: false,
      status: 'pending',
      message: 'आपका खाता अभी Master Admin की स्वीकृति (Approval) की प्रतीक्षा में है।',
    };
  }
  return {
    allowed: false,
    status: 'suspended',
    message: 'Master Admin द्वारा आपका खाता अस्थायी रूप से रोका (Suspended) गया है।',
  };
}

export function canUserCreateInvoice(
  record?: AppUserAccessRecord | null,
  firmUsageCount?: number | null,
  nowMs: number = Date.now(),
  isPlatformAdmin: boolean = false,
  effectivePerms?: UserPermissions | null
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
  if (isPlatformAdmin) {
    return {
      allowed: true,
      isTrial: false,
      remaining: null,
      limit: null,
      used: firmUsageCount ?? 0,
      daysRemaining: null,
      isExpired: false,
      limitReached: false,
    };
  }

  if (!record) {
    return {
      allowed: false,
      isTrial: false,
      remaining: 0,
      limit: 0,
      used: 0,
      daysRemaining: null,
      isExpired: false,
      limitReached: false,
      reason: 'User access record not loaded.',
    };
  }

  if (!isApprovedOrTrialStatus(record.status)) {
    return {
      allowed: false,
      isTrial: false,
      remaining: 0,
      limit: 0,
      used: firmUsageCount ?? record.invoicesCreatedCount ?? 0,
      daysRemaining: null,
      isExpired: false,
      limitReached: false,
      reason: 'Account is not approved for billing.',
    };
  }

  const perms = effectivePerms || normalizePermissions(record.permissions, RESTRICTED_PERMISSIONS);
  if (!perms.billing && !perms.estimates) {
    return {
      allowed: false,
      isTrial: record.status === 'trial',
      remaining: 0,
      limit: record.status === 'trial' ? (record.trialInvoiceLimit ?? DEFAULT_TRIAL_INVOICE_LIMIT) : null,
      used: firmUsageCount ?? record.invoicesCreatedCount ?? 0,
      daysRemaining: record.status === 'trial' ? getTrialDaysRemaining(record.trialEndsAt, nowMs) : null,
      isExpired: false,
      limitReached: false,
      reason: 'Master Admin द्वारा आपको नया बिल बनाने की अनुमति (Billing Permission) नहीं दी गई है।',
    };
  }

  const used = Math.max(0, firmUsageCount ?? record.invoicesCreatedCount ?? 0);
  if (record.status === 'trial') {
    const limit = Math.max(0, record.trialInvoiceLimit ?? DEFAULT_TRIAL_INVOICE_LIMIT);
    const remaining = Math.max(0, limit - used);
    const endsAtMs = toEpochMs(record.trialEndsAt);
    const daysRemaining = getTrialDaysRemaining(record.trialEndsAt, nowMs);
    const isExpired = endsAtMs !== null && nowMs >= endsAtMs;
    const limitReached = used >= limit;

    if (isExpired) {
      return {
        allowed: false,
        isTrial: true,
        remaining,
        limit,
        used,
        daysRemaining: 0,
        isExpired: true,
        limitReached,
        reason: 'ट्रायल अवधि समाप्त हो गई है (Trial period expired)। कृपया Master Admin से संपर्क करें।',
      };
    }

    if (limitReached) {
      return {
        allowed: false,
        isTrial: true,
        remaining: 0,
        limit,
        used,
        daysRemaining,
        isExpired: false,
        limitReached: true,
        reason: `ट्रायल बिल सीमा समाप्त (${used}/${limit} इनवॉइस)। आगे बिल बनाने के लिए Master Admin से संपर्क करें।`,
      };
    }

    return {
      allowed: true,
      isTrial: true,
      remaining,
      limit,
      used,
      daysRemaining,
      isExpired: false,
      limitReached: false,
    };
  }

  return {
    allowed: true,
    isTrial: false,
    remaining: null,
    limit: null,
    used,
    daysRemaining: null,
    isExpired: false,
    limitReached: false,
  };
}

export function mapTabToPermissionKey(tab: TabType): PermissionKey | null {
  switch (tab) {
    case 'master_control':
      return null;
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
  record: AppUserAccessRecord | null | undefined,
  tab: TabType,
  effectivePerms?: UserPermissions | null,
  isPlatformAdmin: boolean = false
): boolean {
  if (tab === 'master_control') {
    return isPlatformAdmin;
  }
  if (isPlatformAdmin) return true;
  if (!record || !isApprovedOrTrialStatus(record.status)) return false;

  const perms = effectivePerms || normalizePermissions(record.permissions, RESTRICTED_PERMISSIONS);
  if (tab === 'dashboard') {
    // Allow dashboard for any active/trial user who has at least one operational permission
    return Object.values(perms).some(Boolean);
  }
  const key = mapTabToPermissionKey(tab);
  if (!key) return false;
  if (tab === 'invoices') {
    return Boolean(perms.billing || perms.estimates);
  }
  return Boolean(perms[key]);
}

export function getFirstAllowedTab(
  record: AppUserAccessRecord | null | undefined,
  effectivePerms?: UserPermissions | null,
  isPlatformAdmin: boolean = false
): TabType {
  if (isPlatformAdmin) return 'master_control';
  if (!record) return 'dashboard';
  const orderedTabs: TabType[] = [
    'dashboard',
    'pos',
    'invoices',
    'inventory',
    'customers',
    'orders',
    'purchases',
    'vendors',
    'expenses',
    'karigar',
    'girvi',
    'gemstones',
    'reports',
    'profit',
  ];
  for (const tab of orderedTabs) {
    if (canUserAccessTab(record, tab, effectivePerms, isPlatformAdmin)) {
      return tab;
    }
  }
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
  record: AppUserAccessRecord | null | undefined,
  action: LegacyActionKey | PermissionKey,
  effectivePerms?: UserPermissions | null,
  isPlatformAdmin: boolean = false
): boolean {
  if (isPlatformAdmin) return true;
  if (!record || !isApprovedOrTrialStatus(record.status)) return false;
  const perms = effectivePerms || normalizePermissions(record.permissions, RESTRICTED_PERMISSIONS);

  switch (action) {
    case 'canCreateInvoice':
      return Boolean(perms.billing || perms.estimates);
    case 'canCancelInvoice':
      return Boolean(perms.invoiceCancel);
    case 'canEditRates':
      return Boolean(perms.rates);
    case 'canEditSettings':
      return Boolean(perms.staffManagement);
    case 'canExportBackup':
      return Boolean(perms.backupExport);
    case 'canDeleteRecords':
      return Boolean(perms.inventory || perms.expenses);
    default:
      return Boolean(perms[action as PermissionKey]);
  }
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
