import React, { useState, useEffect, useRef } from 'react';
import { 
  JewelleryItem, 
  Customer, 
  GSTInvoice, 
  MetalRate, 
  ShopDetails, 
  JewellerProfile, 
  Karigar, 
  KarigarJobCard, 
  GirviLoan,
  Vendor,
  PurchaseInvoice,
  ShopExpense,
  CashBankTransfer,
  CertifiedGemstone,
  GemstoneRate,
  AppUserAccessRecord,
  FirmUsageInvoicesDoc,
  MasterControlSettings,
  PublicSupportConfig,
  StaffInviteRecord
} from './types';
import { 
  initialShopDetails, 
  initialProfiles,
  initialRates, 
  initialInventory, 
  initialCustomers, 
  initialInvoices, 
  initialKarigars, 
  initialKarigarJobCards, 
  initialGirviLoans, 
  initialCategories,
  initialVendors,
  initialPurchases,
  initialExpenses,
  initialCashInHand,
  initialBankBalance,
  initialTransfers,
  initialGemstones,
  initialGemstoneRates,
  defaultCity, 
  cityRatesPresets 
} from './data/initialData';
import { Header, SyncStatusType } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { Sidebar } from './components/Sidebar';
import { FirmManagerModal } from './components/FirmManagerModal';
import { RatesModal } from './components/RatesModal';
import { StockAlertsModal } from './components/StockAlertsModal';
import { ShopSettingsModal } from './components/ShopSettingsModal';
import { InvoicePrintModal } from './components/InvoicePrintModal';
import { BillingPOS } from './components/Billing/BillingPOS';
import { InventoryList } from './components/Inventory/InventoryList';
import { GemstoneManager } from './components/Gemstones/GemstoneManager';
import { BarcodeTagManager } from './components/Barcode/BarcodeTagManager';
import { KarigarLedger } from './components/Karigar/KarigarLedger';
import { GirviLedger } from './components/Girvi/GirviLedger';
import { ItemModal } from './components/Inventory/ItemModal';
import { InvoiceList } from './components/Invoices/InvoiceList';
import { CustomerList } from './components/Customers/CustomerList';
import { GSTAccountingReports } from './components/Reports/GSTAccountingReports';
import { ProfitReport } from './components/Reports/ProfitReport';
import { PurchaseManager } from './components/Purchases/PurchaseManager';
import { VendorList } from './components/Vendors/VendorList';
import { ExpenseManager } from './components/Expenses/ExpenseManager';
import { CashBankDashboard } from './components/CashBank/CashBankDashboard';
import { CategoryModal } from './components/Categories/CategoryModal';
import { QuickGenerateItemModal } from './components/Inventory/QuickGenerateItemModal';
import { Login, SignupMetadata } from './components/Auth/Login';
import { ApprovalGateScreen } from './components/Auth/ApprovalGateScreen';
import { MasterControlPanel } from './components/MasterAdmin/MasterControlPanel';
import { FirmRegistrationScreen } from './components/Auth/FirmRegistrationScreen';
import { MMIDashboard } from './components/Dashboard/MMIDashboard';
import { CustomerOrderManager } from './components/Orders/CustomerOrderManager';
import { BullionTradingDesk } from './components/Bullion/BullionTradingDesk';
import { KittySchemeManager } from './components/Kitty/KittySchemeManager';
import { CRMManager } from './components/CRM/CRMManager';
import { StaffPayrollManager } from './components/Payroll/StaffPayrollManager';
import { DataBackupModal } from './components/DataBackupModal';
import { LegacyMigrationModal } from './components/LegacyMigrationModal';
import { FirebaseConfigMissingScreen } from './components/FirebaseConfigMissingScreen';
import { auth, db, firestoreDatabaseId, missingFirebaseEnvVars, firebaseConfigError } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ensureFirmRootDoc,
  clearFirmRootReady,
  fetchUserFirms,
  fetchAllFirmsForMaster,
  checkFirmHasFirestoreData,
  getLegacyLocalStorageData,
  subscribeToFirmCollection,
  subscribeToFirmDoc,
  subscribeToSnapshotsInSync,
  subscribeToUserAccess,
  ensureUserAccessRecord,
  fetchUserAccessOnce,
  checkIsPlatformAdmin,
  getPublicSupportConfig,
  getMasterControlSettings,
  subscribeToUserInvoiceUsage,
  subscribeToFirmStaffInvites,
  createOrUpdateStaffInvite,
  updateFirmStaffPermissions,
  removeFirmStaffMember,
  claimStaffInvitesForUser,
  saveFirmDoc, 
  deleteFirmDoc, 
  createInvoiceAtomic, 
  cancelInvoiceAtomic,
  createPurchaseAtomic,
  FirmDataSnapshot,
  SnapshotMetadataInfo
} from './lib/firestoreSync';
import {
  DEFAULT_TRIAL_INVOICE_LIMIT,
  DEFAULT_TRIAL_DAYS,
  FULL_PERMISSIONS,
  resolveEffectivePermissions,
  canUserAccessApp,
  canUserAccessTab,
  canUserCreateInvoice,
  getFirstAllowedTab,
  hasActionPermission
} from './lib/accessControl';
import { getISTDate, formatSequentialNumber } from './lib/invoiceNumber';

export default function App() {
  if (missingFirebaseEnvVars.length > 0 || !auth || !db) {
    return (
      <FirebaseConfigMissingScreen
        missingVars={missingFirebaseEnvVars}
        errorMsg={firebaseConfigError || 'Firebase Auth/Firestore could not be initialized.'}
      />
    );
  }

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>(() => auth.currentUser?.uid || '');
  const [userAccess, setUserAccess] = useState<AppUserAccessRecord | null>(null);
  const [userAccessLoaded, setUserAccessLoaded] = useState<boolean>(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean>(false);
  const [userAccessRefreshNonce, setUserAccessRefreshNonce] = useState<number>(0);
  const [masterSettings, setMasterSettings] = useState<MasterControlSettings>({
    id: 'master',
    defaultTrialInvoiceLimit: DEFAULT_TRIAL_INVOICE_LIMIT,
    defaultTrialDays: DEFAULT_TRIAL_DAYS,
    requireApprovalForNewSignups: true,
    updatedAt: ''
  });
  const [supportConfig, setSupportConfig] = useState<PublicSupportConfig>({
    id: 'public',
    supportName: 'Platform Support Desk',
    supportPhone: '',
    supportEmail: ''
  });
  const [firmUsage, setFirmUsage] = useState<FirmUsageInvoicesDoc | null>(null);
  const [firmOwnerAccess, setFirmOwnerAccess] = useState<AppUserAccessRecord | null>(null);
  const [staffInvites, setStaffInvites] = useState<StaffInviteRecord[]>([]);
  const [inspectedFirm, setInspectedFirm] = useState<JewellerProfile | null>(null);
  const [trialReadOnlyMode, setTrialReadOnlyMode] = useState<boolean>(false);
  const pendingSignupMetaRef = useRef<SignupMetadata | null>(null);

  const getEffectiveUserId = (): string => {
    if (auth.currentUser?.uid) return auth.currentUser.uid;
    if (isDemoUser) return 'demo';
    return currentUserId || '';
  };

  const getUserProfiles = (uid: string): JewellerProfile[] => {
    if (!uid) return [];
    const key = `jewel_user_${uid}_profiles`;
    const saved = localStorage.getItem(key);
    if (saved !== null) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    if (uid === 'demo') {
      return initialProfiles;
    }
    return [];
  };

  // Firm onboarding & selection state
  const [isFirmActive, setIsFirmActive] = useState<boolean>(false);

  // Light / Dark Theme State with local storage persistence
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('jewel_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    localStorage.setItem('jewel_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [activeProfileId, setActiveProfileId] = useState<string>('');
  const [profiles, setProfiles] = useState<JewellerProfile[]>([]);

  useEffect(() => {
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      setIsLoading(false);
      if (user) {
        setCurrentUserId(user.uid);
        setIsDemoUser(false);
        setIsAuthenticated(true);
        setUserAccessLoaded(false);

        let accessRecord: AppUserAccessRecord | null = null;
        try {
          const signupMeta = pendingSignupMetaRef.current;
          pendingSignupMetaRef.current = null;
          accessRecord = await ensureUserAccessRecord(user, signupMeta || undefined);
          if (cancelled) return;
          setUserAccess(accessRecord);
          setUserAccessLoaded(true);
        } catch (err: any) {
          if (!cancelled) {
            setUserAccessLoaded(true);
            handleFirestoreError(err);
          }
        }

        const platformAdminVerified = await checkIsPlatformAdmin(user.uid);
        if (cancelled) return;
        setIsPlatformAdmin(platformAdminVerified);

        try {
          const [cfg, pubSupport] = await Promise.all([
            getMasterControlSettings(),
            getPublicSupportConfig()
          ]);
          if (!cancelled) {
            setMasterSettings(cfg);
            setSupportConfig(pubSupport);
          }
        } catch {
          // Ignore non-fatal config read error
        }

        const accessCheck = canUserAccessApp(accessRecord, platformAdminVerified);

        if (!platformAdminVerified && !accessCheck.allowed) {
          setProfiles([]);
          setActiveProfileId('');
          setIsFirmActive(false);
          return;
        }

        if (!platformAdminVerified) {
          try {
            await claimStaffInvitesForUser(user);
          } catch {
            // Non-fatal
          }
        }

        const localProfs = getUserProfiles(user.uid);
        let mergedProfs = [...localProfs];

        try {
          const cloudProfs = platformAdminVerified
            ? await fetchAllFirmsForMaster()
            : await fetchUserFirms(user.uid);
          if (cancelled) return;
          const byId = new Map<string, JewellerProfile>();
          localProfs.forEach(p => byId.set(p.id, p));
          cloudProfs.forEach(p => byId.set(p.id, { ...byId.get(p.id), ...p }));
          mergedProfs = Array.from(byId.values());
        } catch (err: any) {
          if (!cancelled) {
            handleFirestoreError(err);
          }
        }

        setProfiles(mergedProfs);
        if (mergedProfs.length > 0) {
          const savedActive = localStorage.getItem(`jewel_user_${user.uid}_active_profile`);
          const chosen = mergedProfs.some(p => p.id === savedActive) ? savedActive! : mergedProfs[0].id;
          setActiveProfileId(chosen);
          setIsFirmActive(true);
          if (platformAdminVerified) {
            setActiveTab('master_control');
          }
        } else if (platformAdminVerified) {
          setActiveProfileId('');
          setIsFirmActive(true);
          setActiveTab('master_control');
        } else {
          setActiveProfileId('');
          setIsFirmActive(false);
        }
      } else if (!isDemoUser) {
        clearFirmRootReady();
        setIsFirmRootReady(false);
        setIsAuthenticated(false);
        setCurrentUserId('');
        setUserAccess(null);
        setUserAccessLoaded(false);
        setIsPlatformAdmin(false);
        setFirmUsage(null);
        setFirmOwnerAccess(null);
        setStaffInvites([]);
        setInspectedFirm(null);
        setProfiles([]);
        setActiveProfileId('');
        setIsFirmActive(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isDemoUser, userAccessRefreshNonce]);

  // Realtime listener on /users/{uid} so approvals, suspensions, trial limits & permissions sync immediately
  useEffect(() => {
    if (!isAuthenticated || isDemoUser || !currentUserId) return;
    const unsub = subscribeToUserAccess(
      currentUserId,
      (record) => {
        if (record) {
          setUserAccess(record);
        }
        setUserAccessLoaded(true);
      },
      (err) => {
        console.error('User access subscription error:', err);
        setUserAccessLoaded(true);
      }
    );
    return () => unsub();
  }, [isAuthenticated, isDemoUser, currentUserId, userAccessRefreshNonce]);

  const buildDefaultShopDetails = (firmId: string, prof?: JewellerProfile): ShopDetails => ({
    firmId,
    name: prof?.name || 'Swarnkar Jewellery Shop',
    tagline: 'सराफा एवं आभूषण विक्रेता',
    address: '',
    cityStatePincode: '',
    phone: prof?.phone || '',
    email: '',
    gstin: prof?.gstin || 'URP-UNREGISTERED',
    bisHallmarkRegNo: '',
    panNo: '',
    bankName: '',
    accountNo: '',
    ifscCode: '',
    terms: ['बिक्री पर 3% GST लागू है।', 'हॉलमार्क आभूषण की शुद्धता की 100% गारंटी है।'],
    logoUrl: prof?.logoUrl || undefined
  });

  const [shopDetails, setShopDetails] = useState<ShopDetails>(() => buildDefaultShopDetails(''));

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    const saved = localStorage.getItem('jewel_selected_city');
    return saved || defaultCity;
  });

  const [rates, setRates] = useState<MetalRate[]>(() => {
    const saved = localStorage.getItem('jewel_rates_v3');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return initialRates;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('jewel_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  // All firm collections start empty and are populated ONLY from Firestore (or Demo fixtures in-memory)
  const [inventory, setInventory] = useState<JewelleryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);
  const [transfers, setTransfers] = useState<CashBankTransfer[]>([]);
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [jobCards, setJobCards] = useState<KarigarJobCard[]>([]);
  const [girviLoans, setGirviLoans] = useState<GirviLoan[]>([]);
  const [gemstones, setGemstones] = useState<CertifiedGemstone[]>([]);

  const [gemstoneRates, setGemstoneRates] = useState<GemstoneRate[]>(() => {
    const saved = localStorage.getItem('jewel_gemstone_rates_v1');
    return saved ? JSON.parse(saved) : initialGemstoneRates;
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Left Sidebar Collapse & Mobile Drawer State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('jewel_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Network, Firm Root & Sync State
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isSynced, setIsSynced] = useState<boolean>(true);
  const [isFirmRootReady, setIsFirmRootReady] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusType>('synced');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncRetryNonce, setSyncRetryNonce] = useState<number>(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [pendingWritesCount, setPendingWritesCount] = useState<number>(0);
  const [syncSource, setSyncSource] = useState<'cloud' | 'cache'>(() =>
    navigator.onLine ? 'cloud' : 'cache'
  );
  const [lastSyncEventLabel, setLastSyncEventLabel] = useState<string | null>(null);
  const [syncPulseKey, setSyncPulseKey] = useState<number>(0);
  const inFlightWritesRef = useRef<number>(0);
  const pendingCollectionsRef = useRef<Set<string>>(new Set());
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [migrationPrompt, setMigrationPrompt] = useState<{
    firmId: string;
    counts: Record<string, number>;
    totalCount: number;
    snapshot: FirmDataSnapshot;
  } | null>(null);

  const recomputeSyncCounts = () => {
    const totalPending = inFlightWritesRef.current + pendingCollectionsRef.current.size;
    setPendingWritesCount(totalPending);
    return totalPending;
  };

  const beginSyncWrite = (label: string) => {
    inFlightWritesRef.current += 1;
    recomputeSyncCounts();
    setLastSyncEventLabel(label);
    setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
  };

  const endSyncWrite = (label: string, success: boolean) => {
    inFlightWritesRef.current = Math.max(0, inFlightWritesRef.current - 1);
    const remaining = recomputeSyncCounts();
    if (success) {
      setLastSyncedAt(Date.now());
      setSyncSource(navigator.onLine ? 'cloud' : 'cache');
      setLastSyncEventLabel(label);
      setSyncPulseKey(k => k + 1);
      if (remaining === 0) {
        setSyncStatus(navigator.onLine ? 'synced' : 'offline');
      }
    }
  };

  const handleFirestoreError = (err: any) => {
    const code = err?.code || '';
    const msg = err?.message || String(err);
    console.error('Firestore error:', err);
    if (code === 'permission-denied' || msg.toLowerCase().includes('permission')) {
      setSyncStatus('permission-error');
      setIsSynced(false);
      setSyncError(`Firestore अनुमति त्रुटि (Permission Error): ${msg}`);
    } else if (!navigator.onLine || code === 'unavailable') {
      setSyncStatus('offline');
      setIsSynced(false);
      setSyncSource('cache');
      setSyncError(null);
    } else {
      setSyncStatus('error');
      setIsSynced(false);
      setSyncError(`Firestore सिंक त्रुटि: ${msg}`);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncSource('cloud');
      if (isFirmRootReady && !syncError) {
        const pending = inFlightWritesRef.current + pendingCollectionsRef.current.size;
        setSyncStatus(pending > 0 ? 'syncing' : 'synced');
        setSyncPulseKey(k => k + 1);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncSource('cache');
      if (!syncError) {
        setSyncStatus('offline');
        setLastSyncEventLabel('Offline - Local cache active');
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isFirmRootReady, syncError]);

  // Modals state
  const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isStockAlertsModalOpen, setIsStockAlertsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isQuickGenerateOpen, setIsQuickGenerateOpen] = useState(false);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelleryItem | null>(null);

  const [printingInvoices, setPrintingInvoices] = useState<GSTInvoice[] | null>(null);

  // Step 1: Ensure `firms/{firmId}` root document exists BEFORE any subcollection read/write
  const isMasterAdmin = !isDemoUser && isPlatformAdmin;
  const activeUserAccess = isDemoUser ? null : userAccess;
  const isUserApproved = isDemoUser || canUserAccessApp(userAccess, isPlatformAdmin).allowed;
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || initialProfiles[0];
  const effectivePermissions = !isDemoUser && (isMasterAdmin || activeUserAccess)
    ? resolveEffectivePermissions({
        isPlatformAdmin: isMasterAdmin,
        userAccess: activeUserAccess,
        firmProfile: activeProfile,
        uid: currentUserId,
        ownerAccess: firmOwnerAccess
      })
    : undefined;

  useEffect(() => {
    if (!isAuthenticated || isDemoUser || !activeProfileId || !isFirmActive || !currentUserId || !isUserApproved) {
      clearFirmRootReady();
      setIsFirmRootReady(false);
      return;
    }

    let cancelled = false;
    setIsFirmRootReady(false);
    clearFirmRootReady(activeProfileId);
    setSyncStatus('syncing');
    setSyncError(null);

    // Clear stale in-memory data from any previous firm before switching
    setInventory([]);
    setCustomers([]);
    setInvoices([]);
    setVendors([]);
    setPurchases([]);
    setExpenses([]);
    setTransfers([]);
    setKarigars([]);
    setJobCards([]);
    setGirviLoans([]);
    setGemstones([]);

    const prof = profiles.find(p => p.id === activeProfileId);
    setShopDetails(buildDefaultShopDetails(activeProfileId, prof));

    (async () => {
      try {
        await ensureFirmRootDoc(
          activeProfileId,
          {
            name: prof?.name || 'Swarnkar Jewellery Shop',
            gstin: prof?.gstin || '',
            phone: prof?.phone || '',
            code: prof?.code,
            counterName: prof?.counterName,
            counterType: prof?.counterType,
            operatorName: prof?.operatorName
          },
          { uid: currentUserId, isMasterAdmin }
        );
        if (cancelled) return;

        setIsFirmRootReady(true);
        setIsSynced(true);
        setSyncStatus(navigator.onLine ? 'synced' : 'offline');
        setSyncSource(navigator.onLine ? 'cloud' : 'cache');
        setLastSyncedAt(Date.now());
        setLastSyncEventLabel('Firm workspace connected');
        setSyncPulseKey(k => k + 1);

        // Check one-time legacy localStorage migration ONLY if Firestore is empty and user hasn't migrated
        const alreadyMigrated = localStorage.getItem(`jewel_migration_done_${activeProfileId}`);
        if (!alreadyMigrated) {
          const legacyCheck = getLegacyLocalStorageData(activeProfileId);
          if (legacyCheck.hasData) {
            const hasCloudData = await checkFirmHasFirestoreData(activeProfileId, { uid: currentUserId });
            if (!cancelled && !hasCloudData) {
              setMigrationPrompt({
                firmId: activeProfileId,
                counts: legacyCheck.counts,
                totalCount: legacyCheck.totalCount,
                snapshot: legacyCheck.snapshot
              });
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setIsFirmRootReady(false);
          handleFirestoreError(err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isDemoUser, activeProfileId, isFirmActive, currentUserId, isUserApproved, isMasterAdmin, syncRetryNonce]);

  // Step 2: Firestore Realtime Subscriptions (blocked until firms/{firmId} root doc is ready)
  useEffect(() => {
    if (!activeProfileId || !isFirmRootReady || isDemoUser || !isAuthenticated) return;

    pendingCollectionsRef.current.clear();
    recomputeSyncCounts();
    setSyncStatus(navigator.onLine ? 'syncing' : 'offline');
    setLastSyncEventLabel(navigator.onLine ? 'Syncing cloud records...' : 'Offline - Local cache active');

    const onSubError = (err: Error) => handleFirestoreError(err);
    const markSynced = (colName: string, meta?: SnapshotMetadataInfo) => {
      if (meta?.hasPendingWrites) {
        pendingCollectionsRef.current.add(colName);
      } else {
        pendingCollectionsRef.current.delete(colName);
      }
      const totalPending = recomputeSyncCounts();
      const fromCache = Boolean(meta?.fromCache);
      setSyncSource(fromCache ? 'cache' : 'cloud');

      if (!navigator.onLine) {
        setSyncStatus('offline');
        setLastSyncEventLabel(`Offline cache (${colName})`);
        return;
      }

      if (totalPending > 0) {
        setSyncStatus('syncing');
        setLastSyncEventLabel(`Syncing ${colName}...`);
        return;
      }

      setIsSynced(true);
      setSyncError(null);
      setSyncStatus('synced');
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel(fromCache ? `Cached (${colName})` : `Synced ${colName}`);
      setSyncPulseKey(k => k + 1);
    };

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribeToSnapshotsInSync(() => {
        const remaining = recomputeSyncCounts();
        if (!navigator.onLine) {
          setSyncStatus('offline');
          return;
        }
        if (remaining === 0) {
          setIsSynced(true);
          setSyncError(null);
          setSyncStatus('synced');
          setSyncSource('cloud');
          setLastSyncedAt(Date.now());
          setSyncPulseKey(k => k + 1);
        }
      })
    );

    const perms = effectivePermissions;
    const canReadInventory = isMasterAdmin || Boolean(perms && (perms.inventory || perms.billing || perms.estimates || perms.purchases));
    const canReadCustomers = isMasterAdmin || Boolean(perms && (perms.customers || perms.billing || perms.estimates));
    const canReadInvoices = isMasterAdmin || Boolean(perms && (perms.billing || perms.estimates || perms.reports || perms.gstReports));
    const canReadVendors = isMasterAdmin || Boolean(perms && (perms.vendors || perms.purchases));
    const canReadPurchases = isMasterAdmin || Boolean(perms && (perms.purchases || perms.reports));
    const canReadExpensesAndTransfers = isMasterAdmin || Boolean(perms && (perms.expenses || perms.reports));
    const canReadKarigar = isMasterAdmin || Boolean(perms?.karigar);
    const canReadGirvi = isMasterAdmin || Boolean(perms && (perms.girvi || perms.expenses));
    const canReadGemstones = isMasterAdmin || Boolean(perms?.gemstones);

    unsubs.push(subscribeToFirmDoc<ShopDetails>(activeProfileId, 'shop_details', 'main', (docData, meta) => {
      markSynced('shop_details', meta);
      if (docData) {
        setShopDetails(docData);
      }
    }, onSubError));

    if (canReadInventory) {
      unsubs.push(subscribeToFirmCollection<JewelleryItem>(activeProfileId, 'inventory', (items, meta) => {
        markSynced('inventory', meta);
        setInventory(items);
      }, onSubError));
    } else {
      setInventory([]);
    }

    if (canReadCustomers) {
      unsubs.push(subscribeToFirmCollection<Customer>(activeProfileId, 'customers', (items, meta) => {
        markSynced('customers', meta);
        setCustomers(items);
      }, onSubError));
    } else {
      setCustomers([]);
    }

    if (canReadInvoices) {
      unsubs.push(subscribeToFirmCollection<GSTInvoice>(activeProfileId, 'invoices', (items, meta) => {
        markSynced('invoices', meta);
        setInvoices(items);
      }, onSubError));
    } else {
      setInvoices([]);
    }

    if (canReadVendors) {
      unsubs.push(subscribeToFirmCollection<Vendor>(activeProfileId, 'vendors', (items, meta) => {
        markSynced('vendors', meta);
        setVendors(items);
      }, onSubError));
    } else {
      setVendors([]);
    }

    if (canReadPurchases) {
      unsubs.push(subscribeToFirmCollection<PurchaseInvoice>(activeProfileId, 'purchases', (items, meta) => {
        markSynced('purchases', meta);
        setPurchases(items);
      }, onSubError));
    } else {
      setPurchases([]);
    }

    if (canReadExpensesAndTransfers) {
      unsubs.push(subscribeToFirmCollection<ShopExpense>(activeProfileId, 'expenses', (items, meta) => {
        markSynced('expenses', meta);
        setExpenses(items);
      }, onSubError));

      unsubs.push(subscribeToFirmCollection<CashBankTransfer>(activeProfileId, 'transfers', (items, meta) => {
        markSynced('transfers', meta);
        setTransfers(items);
      }, onSubError));
    } else {
      setExpenses([]);
      setTransfers([]);
    }

    if (canReadKarigar) {
      unsubs.push(subscribeToFirmCollection<Karigar>(activeProfileId, 'karigars', (items, meta) => {
        markSynced('karigars', meta);
        setKarigars(items);
      }, onSubError));

      unsubs.push(subscribeToFirmCollection<KarigarJobCard>(activeProfileId, 'jobcards', (items, meta) => {
        markSynced('jobcards', meta);
        setJobCards(items);
      }, onSubError));
    } else {
      setKarigars([]);
      setJobCards([]);
    }

    if (canReadGirvi) {
      unsubs.push(subscribeToFirmCollection<GirviLoan>(activeProfileId, 'girvi', (items, meta) => {
        markSynced('girvi', meta);
        setGirviLoans(items);
      }, onSubError));
    } else {
      setGirviLoans([]);
    }

    if (canReadGemstones) {
      unsubs.push(subscribeToFirmCollection<CertifiedGemstone>(activeProfileId, 'gemstones', (items, meta) => {
        markSynced('gemstones', meta);
        setGemstones(items);
      }, onSubError));
    } else {
      setGemstones([]);
    }

    return () => {
      pendingCollectionsRef.current.clear();
      unsubs.forEach(unsub => unsub());
    };
  }, [
    activeProfileId,
    isFirmRootReady,
    isDemoUser,
    isAuthenticated,
    isMasterAdmin,
    effectivePermissions?.inventory,
    effectivePermissions?.customers,
    effectivePermissions?.billing,
    effectivePermissions?.estimates,
    effectivePermissions?.vendors,
    effectivePermissions?.purchases,
    effectivePermissions?.expenses,
    effectivePermissions?.reports,
    effectivePermissions?.gstReports,
    effectivePermissions?.karigar,
    effectivePermissions?.girvi,
    effectivePermissions?.gemstones
  ]);


  // Persist ONLY UI preferences in localStorage (NEVER firm ERP collections)
  useEffect(() => {
    localStorage.setItem('jewel_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    const uid = getEffectiveUserId();
    if (uid && uid !== 'demo') {
      localStorage.setItem(`jewel_user_${uid}_profiles`, JSON.stringify(profiles));
    }
  }, [profiles, isDemoUser, currentUserId]);

  useEffect(() => {
    const uid = getEffectiveUserId();
    if (uid && uid !== 'demo' && activeProfileId) {
      localStorage.setItem(`jewel_user_${uid}_active_profile`, activeProfileId);
    }
  }, [activeProfileId, isDemoUser, currentUserId]);

  useEffect(() => {
    localStorage.setItem('jewel_selected_city', selectedCity);
  }, [selectedCity]);

  useEffect(() => {
    localStorage.setItem('jewel_rates_v3', JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem('jewel_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('jewel_gemstone_rates_v1', JSON.stringify(gemstoneRates));
  }, [gemstoneRates]);

  // Helper wrappers for gated Firestore writes (never swallow errors)
  const persistFirmDoc = <T extends { id: string }>(colName: string, data: T) => {
    if (isDemoUser) {
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel(`Updated ${colName} (Demo)`);
      setSyncPulseKey(k => k + 1);
      return;
    }
    if (!activeProfileId) return;
    if (!isFirmRootReady) {
      handleFirestoreError(new Error(`फर्म रूट डॉक्यूमेंट (firms/${activeProfileId}) तैयार नहीं है। सेव रोका गया।`));
      return;
    }
    beginSyncWrite(`Saving ${colName}...`);
    saveFirmDoc(activeProfileId, colName, data)
      .then(() => endSyncWrite(`Saved ${colName}`, true))
      .catch((err) => {
        endSyncWrite(`Failed ${colName}`, false);
        handleFirestoreError(err);
      });
  };

  const removeFirmDoc = (colName: string, docId: string) => {
    if (isDemoUser) {
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel(`Deleted from ${colName} (Demo)`);
      setSyncPulseKey(k => k + 1);
      return;
    }
    if (!activeProfileId) return;
    if (!isFirmRootReady) {
      handleFirestoreError(new Error(`फर्म रूट डॉक्यूमेंट (firms/${activeProfileId}) तैयार नहीं है। डिलीट रोका गया।`));
      return;
    }
    beginSyncWrite(`Removing from ${colName}...`);
    deleteFirmDoc(activeProfileId, colName, docId)
      .then(() => endSyncWrite(`Removed from ${colName}`, true))
      .catch((err) => {
        endSyncWrite(`Delete failed (${colName})`, false);
        handleFirestoreError(err);
      });
  };

  // Subscribe to per-owner invoice usage counter: users/{ownerUid}/usage/invoices
  const effectiveUsageOwnerUid = !isDemoUser
    ? (activeProfile?.ownerUid || currentUserId)
    : '';

  useEffect(() => {
    if (!isAuthenticated || isDemoUser || !isUserApproved || !effectiveUsageOwnerUid) {
      setFirmUsage(null);
      return;
    }
    const unsub = subscribeToUserInvoiceUsage(
      effectiveUsageOwnerUid,
      (usage) => {
        setFirmUsage(usage);
      },
      (err) => {
        console.warn('User invoice usage listener error:', err);
      }
    );
    return () => unsub();
  }, [isAuthenticated, isDemoUser, isUserApproved, effectiveUsageOwnerUid]);

  useEffect(() => {
    if (isDemoUser || !isAuthenticated || !activeProfile?.ownerUid || activeProfile.ownerUid === currentUserId) {
      setFirmOwnerAccess(null);
      return;
    }
    let cancelled = false;
    fetchUserAccessOnce(activeProfile.ownerUid)
      .then((rec) => {
        if (!cancelled) setFirmOwnerAccess(rec);
      })
      .catch(() => {
        if (!cancelled) setFirmOwnerAccess(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isDemoUser, isAuthenticated, activeProfile?.ownerUid, currentUserId]);

  useEffect(() => {
    if (
      isDemoUser ||
      !isAuthenticated ||
      !isFirmRootReady ||
      !activeProfileId ||
      (!isMasterAdmin && activeProfile?.ownerUid !== currentUserId)
    ) {
      setStaffInvites([]);
      return;
    }
    const unsub = subscribeToFirmStaffInvites(
      activeProfileId,
      (invites) => setStaffInvites(invites),
      () => setStaffInvites([])
    );
    return () => unsub();
  }, [isDemoUser, isAuthenticated, isFirmRootReady, activeProfileId, isMasterAdmin, activeProfile?.ownerUid, currentUserId]);

  // Redirect activeTab cleanly if user permissions disallow current tab
  useEffect(() => {
    if (!isDemoUser && (activeUserAccess || isMasterAdmin)) {
      if (!canUserAccessTab(activeUserAccess, activeTab, effectivePermissions, isMasterAdmin)) {
        setActiveTab(getFirstAllowedTab(activeUserAccess, effectivePermissions, isMasterAdmin));
      }
    }
  }, [isDemoUser, activeUserAccess, activeTab, effectivePermissions, isMasterAdmin]);

  // Global Keyboard Shortcuts (F1-F12 + Girvi) gated by user permissions
  useEffect(() => {
    const canGo = (tab: TabType) =>
      isDemoUser || canUserAccessTab(activeUserAccess, tab, effectivePermissions, isMasterAdmin);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (canGo('dashboard')) setActiveTab('dashboard');
      } else if (e.key === 'F2') {
        e.preventDefault();
        if (canGo('pos')) setActiveTab('pos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        if (canGo('purchases')) setActiveTab('purchases');
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (canGo('inventory')) setActiveTab('inventory');
      } else if (e.key === 'F5') {
        e.preventDefault();
        if (canGo('cashbank')) setActiveTab('cashbank');
      } else if (e.key === 'F6') {
        e.preventDefault();
        if (canGo('expenses')) setActiveTab('expenses');
      } else if (e.key === 'F7') {
        e.preventDefault();
        if (canGo('vendors')) setActiveTab('vendors');
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (canGo('barcode')) setActiveTab('barcode');
      } else if (e.key === 'F9') {
        e.preventDefault();
        if (canGo('karigar')) setActiveTab('karigar');
      } else if (e.key === 'F10') {
        e.preventDefault();
        if (canGo('gemstones')) setActiveTab('gemstones');
      } else if (e.key === 'F11') {
        e.preventDefault();
        if (canGo('profit')) setActiveTab('profit');
      } else if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        if (canGo('girvi')) setActiveTab('girvi');
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (isDemoUser || hasActionPermission(activeUserAccess, 'canEditSettings', effectivePermissions, isMasterAdmin)) {
          setIsSettingsModalOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDemoUser, activeUserAccess, effectivePermissions, isMasterAdmin]);

  // Compute Live Cash In Hand & Bank Balance
  const salesCashIn = invoices
    .filter(i => i.payment.method === 'Cash')
    .reduce((s, i) => s + i.payment.amountPaid, 0);

  const girviCashIn = girviLoans.reduce((s, g) => s + g.interestPaidSoFar + g.principalPaid, 0);
  
  const purchasesCashOut = purchases
    .filter(p => p.paymentMode === 'Cash')
    .reduce((s, p) => s + p.amountPaid, 0);

  const expensesCashOut = expenses
    .filter(e => e.paymentSource === 'Cash in Hand')
    .reduce((s, e) => s + e.amount, 0);

  const cashDepositedToBank = transfers
    .filter(t => t.type === 'DEPOSIT_TO_BANK')
    .reduce((s, t) => s + t.amount, 0);

  const cashWithdrawnFromBank = transfers
    .filter(t => t.type === 'WITHDRAW_FROM_BANK')
    .reduce((s, t) => s + t.amount, 0);

  const computedCashInHand = initialCashInHand + salesCashIn + girviCashIn + cashWithdrawnFromBank - (purchasesCashOut + expensesCashOut + cashDepositedToBank);

  const salesDigitalIn = invoices
    .filter(i => i.payment.method !== 'Cash')
    .reduce((s, i) => s + i.payment.amountPaid, 0);

  const purchasesBankOut = purchases
    .filter(p => p.paymentMode === 'Bank Transfer' || p.paymentMode === 'UPI')
    .reduce((s, p) => s + p.amountPaid, 0);

  const expensesBankOut = expenses
    .filter(e => e.paymentSource === 'Bank Account')
    .reduce((s, e) => s + e.amount, 0);

  const computedBankBalance = initialBankBalance + salesDigitalIn + cashDepositedToBank - (purchasesBankOut + expensesBankOut + cashWithdrawnFromBank);

  // Derived counts
  const lowStockCount = inventory.filter(i => i.quantity <= i.minStockAlert).length;
  const unpaidInvoicesCount = invoices.filter(i => i.status !== 'Paid').length;
  const vendorDuesCount = vendors.filter(v => v.cashBalanceDue > 0).length;
  const activeGirviCount = girviLoans.filter(l => l.status === 'Active' || l.status === 'Overdue').length;
  const activeKarigarJobsCount = jobCards.filter(j => j.status === 'Issued' || j.status === 'In Progress').length;

  // Handlers
  const handleSelectCity = (newCity: string) => {
    setSelectedCity(newCity);
    const preset = cityRatesPresets.find(c => c.city === newCity);
    if (preset) {
      setRates(preset.rates);
    }
  };

  const handleAddProfile = async (newProfile: JewellerProfile) => {
    setProfiles(prev => [...prev, newProfile]);
    if (!isDemoUser && currentUserId) {
      try {
        await ensureFirmRootDoc(
          newProfile.id,
          {
            name: newProfile.name,
            gstin: newProfile.gstin,
            phone: newProfile.phone,
            code: newProfile.code,
            counterName: newProfile.counterName,
            counterType: newProfile.counterType,
            operatorName: newProfile.operatorName
          },
          { uid: currentUserId }
        );
      } catch (err: any) {
        handleFirestoreError(err);
      }
    }
  };

  const handleUpdateProfile = (updatedProfile: JewellerProfile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
  };

  // Gemstone Handlers
  const handleAddGemstone = (newGem: CertifiedGemstone) => {
    const tagged = { ...newGem, firmId: activeProfileId };
    if (isDemoUser) setGemstones(prev => [tagged, ...prev]);
    persistFirmDoc('gemstones', tagged);
  };

  const handleUpdateGemstone = (updatedGem: CertifiedGemstone) => {
    const tagged = { ...updatedGem, firmId: activeProfileId };
    if (isDemoUser) setGemstones(prev => prev.map(g => g.id === updatedGem.id ? tagged : g));
    persistFirmDoc('gemstones', tagged);
  };

  const handleDeleteGemstone = (id: string) => {
    if (!isDemoUser && !hasActionPermission(activeUserAccess, 'canDeleteRecords', effectivePermissions, isMasterAdmin)) {
      alert('Master Admin द्वारा आपको रिकॉर्ड डिलीट करने की अनुमति नहीं दी गई है।');
      return;
    }
    if (isDemoUser) setGemstones(prev => prev.filter(g => g.id !== id));
    removeFirmDoc('gemstones', id);
  };

  const handleUpdateGemstoneRates = (updatedRates: GemstoneRate[]) => {
    setGemstoneRates(updatedRates);
  };

  // Categories Handlers
  const handleAddCategory = (newCat: string) => {
    setCategories(prev => [...prev, newCat]);
  };

  const handleDeleteCategory = (catToDelete: string) => {
    setCategories(prev => prev.filter(c => c !== catToDelete));
  };

  const handleAddCustomer = (newCust: Customer) => {
    const tagged = { ...newCust, firmId: activeProfileId };
    if (isDemoUser) setCustomers(prev => [tagged, ...prev]);
    persistFirmDoc('customers', tagged);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    const tagged = { ...updatedCust, firmId: activeProfileId };
    if (isDemoUser) setCustomers(prev => prev.map(c => c.id === updatedCust.id ? tagged : c));
    persistFirmDoc('customers', tagged);
  };

  const handleDeleteCustomer = (id: string) => {
    if (!isDemoUser && !hasActionPermission(activeUserAccess, 'canDeleteRecords', effectivePermissions, isMasterAdmin)) {
      alert('Master Admin द्वारा आपको रिकॉर्ड डिलीट करने की अनुमति नहीं दी गई है।');
      return;
    }
    if (isDemoUser) setCustomers(prev => prev.filter(c => c.id !== id));
    removeFirmDoc('customers', id);
  };

  const trialOwnerRecord =
    activeProfile?.ownerUid && activeProfile.ownerUid !== currentUserId && firmOwnerAccess
      ? firmOwnerAccess
      : activeUserAccess;

  const invoiceQuotaStatus =
    !isDemoUser && (isMasterAdmin || trialOwnerRecord)
      ? canUserCreateInvoice(
          trialOwnerRecord,
          firmUsage?.count ?? 0,
          Date.now(),
          isMasterAdmin,
          effectivePermissions
        )
      : undefined;

  // Sales Invoice Creation
  const handleCreateInvoice = async (
    invoiceDraft: Omit<GSTInvoice, 'id' | 'invoiceNumber'>,
    prefix: string = 'SMJ'
  ): Promise<GSTInvoice | undefined> => {
    if (!activeProfileId) {
      alert('कोई फर्म सक्रिय नहीं है। कृपया पहले अपनी फर्म चुनें या रजिस्टर करें।');
      return;
    }

    if (invoiceQuotaStatus && !invoiceQuotaStatus.allowed) {
      const msg = invoiceQuotaStatus.reason || 'इनवॉइस बनाने की अनुमति नहीं है।';
      alert(msg);
      throw new Error(msg);
    }

    if (isDemoUser) {
      const istInfo = getISTDate();
      const seq = invoices.length + 1;
      const demoInvoice: GSTInvoice = {
        ...invoiceDraft,
        id: `demo-inv-${Date.now()}`,
        invoiceNumber: formatSequentialNumber(prefix, istInfo.financialYear.finYearStr, seq),
        firmId: activeProfileId
      };
      setInvoices(prev => [demoInvoice, ...prev]);
      setInventory(prev =>
        prev.map(it => {
          const soldQty = invoiceDraft.items
            .filter(c => c.itemId === it.id)
            .reduce((s, c) => s + (c.quantity || 1), 0);
          return soldQty > 0 ? { ...it, quantity: Math.max(0, it.quantity - soldQty) } : it;
        })
      );
      setPrintingInvoices([demoInvoice]);
      return demoInvoice;
    }

    if (!isFirmRootReady) {
      const msg = 'फर्म रूट डॉक्यूमेंट तैयार नहीं है। कृपया सिंक पूरा होने दें या Retry दबाएं।';
      alert(msg);
      throw new Error(msg);
    }

    beginSyncWrite('Saving invoice...');
    try {
      const createdInvoice = await createInvoiceAtomic(
        activeProfileId,
        invoiceDraft,
        inventory,
        customers,
        prefix,
        { uid: currentUserId, isMasterAdmin }
      );
      endSyncWrite(`Invoice ${createdInvoice.invoiceNumber} synced`, true);
      setPrintingInvoices([createdInvoice]);
      return createdInvoice;
    } catch (err: any) {
      endSyncWrite('Invoice sync failed', false);
      handleFirestoreError(err);
      alert(`इनवॉइस बनाने में त्रुटि: ${err.message || err}`);
      throw err;
    }
  };

  const handleDeleteInvoice = (id: string) => {
    alert('GST नियमों के तहत इनवॉइस को डिलीट नहीं किया जा सकता। आप इसे Cancel (रद्द) कर सकते हैं।');
  };

  const handleUpdateInvoiceStatus = (id: string, newTotalPaid: number) => {
    const inv = invoices.find(i => i.id === id);
    if (!inv || !activeProfileId) return;
    const due = Math.max(0, inv.grandTotal - newTotalPaid);
    const status = due === 0 ? 'Paid' : newTotalPaid > 0 ? 'Partial' : 'Unpaid';
    const updated: GSTInvoice = {
      ...inv,
      payment: {
        ...inv.payment,
        amountPaid: newTotalPaid,
        dueAmount: due
      },
      status
    };
    if (isDemoUser) setInvoices(prev => prev.map(i => i.id === id ? updated : i));
    persistFirmDoc('invoices', updated);
  };

  // Inward Purchase Creation
  const handleAddPurchase = async (newPurchase: PurchaseInvoice, stockItemsToInsert: JewelleryItem[]) => {
    if (!activeProfileId) return;
    const taggedPurchase = { ...newPurchase, firmId: activeProfileId };
    const taggedItems = stockItemsToInsert.map(it => ({ ...it, firmId: activeProfileId }));
    const vendor = vendors.find(v => v.id === newPurchase.vendorId);

    if (isDemoUser) {
      setPurchases(prev => [taggedPurchase, ...prev]);
      if (vendor) {
        const updatedVendor: Vendor = {
          ...vendor,
          cashBalanceDue: vendor.cashBalanceDue + newPurchase.balanceDue,
          totalPurchasesAmount: vendor.totalPurchasesAmount + newPurchase.grandTotal
        };
        setVendors(prev => prev.map(v => v.id === vendor.id ? updatedVendor : v));
      }
      if (taggedItems.length > 0) {
        setInventory(prev => [...taggedItems, ...prev]);
      }
      return;
    }

    if (!isFirmRootReady) {
      handleFirestoreError(new Error(`फर्म रूट डॉक्यूमेंट (firms/${activeProfileId}) तैयार नहीं है। खरीद सेव रोकी गई।`));
      return;
    }

    beginSyncWrite('Saving purchase...');
    try {
      await createPurchaseAtomic(activeProfileId, taggedPurchase, taggedItems, vendor);
      endSyncWrite('Purchase & stock synced', true);
    } catch (err: any) {
      endSyncWrite('Purchase sync failed', false);
      handleFirestoreError(err);
      alert(`खरीद बिल सेव करने में त्रुटि: ${err?.message || err}`);
    }
  };

  // Vendors Handlers
  const handleAddVendor = (newVendor: Vendor) => {
    const tagged = { ...newVendor, firmId: activeProfileId };
    if (isDemoUser) setVendors(prev => [tagged, ...prev]);
    persistFirmDoc('vendors', tagged);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    const tagged = { ...updatedVendor, firmId: activeProfileId };
    if (isDemoUser) setVendors(prev => prev.map(v => v.id === updatedVendor.id ? tagged : v));
    persistFirmDoc('vendors', tagged);
  };

  const handleDeleteVendor = (id: string) => {
    if (!isDemoUser && !hasActionPermission(activeUserAccess, 'canDeleteRecords', effectivePermissions, isMasterAdmin)) {
      alert('Master Admin द्वारा आपको रिकॉर्ड डिलीट करने की अनुमति नहीं दी गई है।');
      return;
    }
    if (isDemoUser) setVendors(prev => prev.filter(v => v.id !== id));
    removeFirmDoc('vendors', id);
  };

  const handleUpdateVendorBalance = (vendorId: string, cashDelta: number, goldDelta: number) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor && activeProfileId) {
      const updated: Vendor = {
        ...vendor,
        cashBalanceDue: vendor.cashBalanceDue + cashDelta,
        goldBalanceOwed: vendor.goldBalanceOwed + goldDelta
      };
      if (isDemoUser) setVendors(prev => prev.map(v => v.id === vendorId ? updated : v));
      persistFirmDoc('vendors', updated);
    }
  };

  // Expenses Handlers
  const handleAddExpense = (newExpense: ShopExpense) => {
    const tagged = { ...newExpense, firmId: activeProfileId };
    if (isDemoUser) setExpenses(prev => [tagged, ...prev]);
    persistFirmDoc('expenses', tagged);
  };

  const handleDeleteExpense = (id: string) => {
    if (!isDemoUser && !hasActionPermission(activeUserAccess, 'canDeleteRecords', effectivePermissions, isMasterAdmin)) {
      alert('Master Admin द्वारा आपको रिकॉर्ड डिलीट करने की अनुमति नहीं दी गई है।');
      return;
    }
    if (isDemoUser) setExpenses(prev => prev.filter(e => e.id !== id));
    removeFirmDoc('expenses', id);
  };

  // Contra Transfer Handlers
  const handleAddTransfer = (newTransfer: CashBankTransfer) => {
    const tagged = { ...newTransfer, firmId: activeProfileId };
    if (isDemoUser) setTransfers(prev => [tagged, ...prev]);
    persistFirmDoc('transfers', tagged);
  };

  // Inventory Handlers
  const handleUpdateInventoryQty = (itemId: string, qtyDeltaOrNewValue: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || !activeProfileId) return;
    const newQty = qtyDeltaOrNewValue < 0 ? Math.max(0, item.quantity + qtyDeltaOrNewValue) : qtyDeltaOrNewValue;
    const updated = { ...item, quantity: newQty, firmId: activeProfileId };
    if (isDemoUser) setInventory(prev => prev.map(i => i.id === itemId ? updated : i));
    persistFirmDoc('inventory', updated);
  };

  const handleSaveInventoryItem = (item: JewelleryItem) => {
    const tagged = { ...item, firmId: activeProfileId };
    if (isDemoUser) {
      setInventory(prev => {
        const exists = prev.some(i => i.id === item.id);
        return exists ? prev.map(i => i.id === item.id ? tagged : i) : [tagged, ...prev];
      });
    }
    persistFirmDoc('inventory', tagged);
  };

  const handleItemGenerated = (newItem: JewelleryItem) => {
    const tagged = { ...newItem, firmId: activeProfileId };
    if (isDemoUser) setInventory(prev => [tagged, ...prev]);
    persistFirmDoc('inventory', tagged);
  };

  const handleDeleteInventoryItem = (id: string) => {
    if (!isDemoUser && !hasActionPermission(activeUserAccess, 'canDeleteRecords', effectivePermissions, isMasterAdmin)) {
      alert('Master Admin द्वारा आपको स्टॉक आइटम डिलीट करने की अनुमति नहीं दी गई है।');
      return;
    }
    if (isDemoUser) setInventory(prev => prev.filter(i => i.id !== id));
    removeFirmDoc('inventory', id);
  };

  // Karigar Handlers
  const handleAddJobCard = (card: KarigarJobCard) => {
    if (!activeProfileId) return;
    const tagged = { ...card, firmId: activeProfileId };
    if (isDemoUser) setJobCards(prev => [tagged, ...prev]);
    persistFirmDoc('jobcards', tagged);

    const karigar = karigars.find(k => k.id === card.karigarId);
    if (karigar) {
      const updatedK: Karigar = {
        ...karigar,
        goldBalanceGram: card.metal === 'Gold' ? karigar.goldBalanceGram + card.rawMetalIssuedWeight : karigar.goldBalanceGram,
        silverBalanceGram: card.metal === 'Silver' ? karigar.silverBalanceGram + card.rawMetalIssuedWeight : karigar.silverBalanceGram,
        activeJobsCount: karigar.activeJobsCount + 1,
      };
      if (isDemoUser) setKarigars(prev => prev.map(k => k.id === karigar.id ? updatedK : k));
      persistFirmDoc('karigars', updatedK);
    }
  };

  const handleUpdateJobCard = (updatedCard: KarigarJobCard) => {
    if (!activeProfileId) return;
    const tagged = { ...updatedCard, firmId: activeProfileId };
    if (isDemoUser) setJobCards(prev => prev.map(c => c.id === updatedCard.id ? tagged : c));
    persistFirmDoc('jobcards', tagged);

    if (updatedCard.status === 'Received') {
      const karigar = karigars.find(k => k.id === updatedCard.karigarId);
      if (karigar) {
        const goldRet = updatedCard.metal === 'Gold' ? (updatedCard.finishedOrnamentWeight || 0) : 0;
        const updatedK: Karigar = {
          ...karigar,
          goldBalanceGram: Math.max(0, karigar.goldBalanceGram - goldRet),
          activeJobsCount: Math.max(0, karigar.activeJobsCount - 1),
        };
        if (isDemoUser) setKarigars(prev => prev.map(k => k.id === karigar.id ? updatedK : k));
        persistFirmDoc('karigars', updatedK);
      }
    }
  };

  const handleAddKarigar = (newKg: Karigar) => {
    const tagged = { ...newKg, firmId: activeProfileId };
    if (isDemoUser) setKarigars(prev => [...prev, tagged]);
    persistFirmDoc('karigars', tagged);
  };

  // Girvi Handlers
  const handleAddGirviLoan = (newLoan: GirviLoan) => {
    const tagged = { ...newLoan, firmId: activeProfileId };
    if (isDemoUser) setGirviLoans(prev => [tagged, ...prev]);
    persistFirmDoc('girvi', tagged);
  };

  const handleUpdateGirviLoan = (updatedLoan: GirviLoan) => {
    const tagged = { ...updatedLoan, firmId: activeProfileId };
    if (isDemoUser) setGirviLoans(prev => prev.map(l => l.id === updatedLoan.id ? tagged : l));
    persistFirmDoc('girvi', tagged);
  };

  const handleRegisterFirmFromScreen = async (newProfile: JewellerProfile, shopUpdate?: Partial<ShopDetails>) => {
    const uid = getEffectiveUserId();
    const newFirmId = newProfile.id;
    newProfile.firmId = newFirmId;
    newProfile.userId = uid;

    const newShopDetails: ShopDetails = {
      firmId: newFirmId,
      name: newProfile.name,
      tagline: shopUpdate?.tagline || 'सराफा एवं आभूषण विक्रेता',
      address: shopUpdate?.address || '',
      cityStatePincode: shopUpdate?.cityStatePincode || '',
      phone: shopUpdate?.phone || '',
      email: shopUpdate?.email || '',
      gstin: newProfile.gstin || '',
      bisHallmarkRegNo: '',
      panNo: '',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      terms: [
        'बिक्री पर 3% GST लागू है।',
        'हॉलमार्क आभूषण की शुद्धता की 100% गारंटी है।'
      ],
      logoUrl: shopUpdate?.logoUrl || undefined
    };

    if (!isDemoUser && uid) {
      try {
        await ensureFirmRootDoc(
          newFirmId,
          {
            name: newProfile.name,
            gstin: newProfile.gstin,
            phone: newProfile.phone || shopUpdate?.phone || '',
            code: newProfile.code,
            counterName: newProfile.counterName,
            counterType: newProfile.counterType,
            operatorName: newProfile.operatorName
          },
          { uid }
        );
        await saveFirmDoc(newFirmId, 'shop_details', { id: 'main', ...newShopDetails }, { uid });
      } catch (err: any) {
        handleFirestoreError(err);
        alert(`फर्म रजिस्ट्रेशन त्रुटि: ${err?.message || err}`);
        return;
      }
    }

    const updatedProfiles = [newProfile, ...profiles];
    setProfiles(updatedProfiles);
    if (uid && uid !== 'demo') {
      localStorage.setItem(`jewel_user_${uid}_profiles`, JSON.stringify(updatedProfiles));
      localStorage.setItem(`jewel_user_${uid}_active_profile`, newFirmId);
      localStorage.setItem(`jewel_user_${uid}_firm_confirmed`, 'true');
    }

    setActiveProfileId(newFirmId);
    setShopDetails(newShopDetails);

    // Completely clear React collections in memory for the new firm
    setInventory([]);
    setCustomers([]);
    setInvoices([]);
    setVendors([]);
    setPurchases([]);
    setExpenses([]);
    setTransfers([]);
    setKarigars([]);
    setJobCards([]);
    setGirviLoans([]);
    setGemstones([]);

    setIsFirmActive(true);
  };

  const handleSelectExistingFirmFromScreen = (firmId: string) => {
    const uid = getEffectiveUserId();
    setActiveProfileId(firmId);
    setIsFirmActive(true);
    if (uid && uid !== 'demo') {
      localStorage.setItem(`jewel_user_${uid}_firm_confirmed`, 'true');
      localStorage.setItem(`jewel_user_${uid}_active_profile`, firmId);
    }
  };

  const handleLogout = () => {
    const uid = getEffectiveUserId();
    if (uid && uid !== 'demo') {
      localStorage.removeItem(`jewel_user_${uid}_firm_confirmed`);
    }
    clearFirmRootReady();
    setIsFirmRootReady(false);
    setSyncError(null);
    setIsFirmActive(false);
    setActiveProfileId('');
    setIsDemoUser(false);
    setCurrentUserId('');
    setUserAccess(null);
    setUserAccessLoaded(false);
    setIsPlatformAdmin(false);
    setFirmUsage(null);
    setFirmOwnerAccess(null);
    setStaffInvites([]);
    setInspectedFirm(null);
    setProfiles([]);
    
    // Clear all in-memory React state
    setInventory([]);
    setCustomers([]);
    setInvoices([]);
    setVendors([]);
    setPurchases([]);
    setExpenses([]);
    setTransfers([]);
    setKarigars([]);
    setJobCards([]);
    setGirviLoans([]);
    setGemstones([]);

    if (auth.currentUser) {
      auth.signOut();
    }
    setIsAuthenticated(false);
  };

  const handleDeleteFirm = (firmIdToDelete: string) => {
    const uid = getEffectiveUserId();
    const updatedProfiles = profiles.filter(p => p.id !== firmIdToDelete);
    setProfiles(updatedProfiles);
    if (uid && uid !== 'demo') {
      localStorage.setItem(`jewel_user_${uid}_profiles`, JSON.stringify(updatedProfiles));
    }

    if (activeProfileId === firmIdToDelete) {
      if (updatedProfiles.length > 0) {
        setActiveProfileId(updatedProfiles[0].id);
      } else {
        handleLogout();
      }
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={(firmProfile, shopUpdate, isDemo, signupMeta) => {
          if (isDemo) {
            setIsDemoUser(true);
            setIsAuthenticated(true);
            setCurrentUserId('demo');
            setUserAccess(null);
            setUserAccessLoaded(true);
            const demoProfs = getUserProfiles('demo');
            setProfiles(demoProfs);
            setActiveProfileId(demoProfs[0]?.id || 'prof-main');
            setShopDetails(initialShopDetails);
            setInventory(initialInventory);
            setCustomers(initialCustomers);
            setInvoices(initialInvoices);
            setVendors(initialVendors);
            setPurchases(initialPurchases);
            setExpenses(initialExpenses);
            setTransfers(initialTransfers);
            setKarigars(initialKarigars);
            setJobCards(initialKarigarJobCards);
            setGirviLoans(initialGirviLoans);
            setGemstones(initialGemstones);
            setIsFirmActive(true);
            return;
          }

          if (signupMeta) {
            pendingSignupMetaRef.current = signupMeta;
          }

          setIsAuthenticated(true);
          if (firmProfile && auth.currentUser) {
            // Defer firm creation until Master Admin approves user (stored in userAccess.firmName)
            const uid = auth.currentUser.uid;
            setCurrentUserId(uid);
          } else {
            const uid = auth.currentUser?.uid || '';
            setCurrentUserId(uid);
          }
        }} 
      />
    );
  }

  // Enforce Master Admin Approval Gate for all real registered users
  if (!isDemoUser && currentUserId) {
    if (!userAccessLoaded) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-stone-100 dark:bg-slate-950 text-xs font-bold text-stone-600 dark:text-slate-300">
          खाते की स्वीकृति व अनुमतियाँ जाँची जा रही हैं (Verifying Account Access)...
        </div>
      );
    }

    const accessCheck = canUserAccessApp(userAccess, isPlatformAdmin);
    if (!accessCheck.allowed && !isMasterAdmin) {
      return (
        <ApprovalGateScreen
          userAccess={userAccess}
          userEmail={auth.currentUser?.email}
          userUid={currentUserId}
          supportConfig={supportConfig}
          permissionError={syncError}
          databaseId={firestoreDatabaseId}
          onRefresh={() => {
            setSyncError(null);
            setUserAccessRefreshNonce(n => n + 1);
          }}
          onLogout={handleLogout}
        />
      );
    }
  }

  if (!isFirmActive && !isMasterAdmin) {
    return (
      <FirmRegistrationScreen
        existingFirms={profiles}
        onRegisterFirm={handleRegisterFirmFromScreen}
        onSelectExistingFirm={handleSelectExistingFirmFromScreen}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-white transition-colors duration-200">
      
      {/* Top Header Bar with Live Bullion Ticker & Live Cash/Bank Indicators */}
      <Header
        shopDetails={shopDetails}
        rates={rates}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        activeProfile={activeProfile}
        cashInHand={computedCashInHand}
        bankBalance={computedBankBalance}
        onOpenProfilesModal={() => setIsProfilesModalOpen(true)}
        onOpenRatesModal={() => setIsRatesModalOpen(true)}
        lowStockCount={lowStockCount}
        onOpenStockAlertsModal={() => setIsStockAlertsModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onSelectTab={setActiveTab}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onToggleDesktopSidebar={() => setIsSidebarCollapsed(prev => !prev)}
        isDesktopSidebarCollapsed={isSidebarCollapsed}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
        isOnline={isOnline}
        isSynced={isSynced}
        syncStatus={syncStatus}
        syncError={syncError}
        lastSyncedAt={lastSyncedAt}
        pendingWritesCount={pendingWritesCount}
        syncSource={syncSource}
        lastSyncEventLabel={lastSyncEventLabel}
        syncPulseKey={syncPulseKey}
        onRetrySync={() => setSyncRetryNonce(n => n + 1)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        userAccess={activeUserAccess}
        effectivePermissions={effectivePermissions}
        firmUsageCount={firmUsage?.count ?? 0}
        isMasterAdmin={isMasterAdmin}
      />

      {/* Trial Quota & Limit Reached Banner */}
      {!isDemoUser && !isMasterAdmin && trialOwnerRecord?.status === 'trial' && invoiceQuotaStatus && (
        (() => {
          const cleanPhone = (supportConfig.supportPhone || '').replace(/[^\d+]/g, '');
          const waDigits = cleanPhone.replace(/^\+/, '');
          const isBlocked = invoiceQuotaStatus.limitReached || invoiceQuotaStatus.isExpired;
          if (isBlocked) {
            return (
              <div
                data-testid="trial-limit-reached-banner"
                className="bg-rose-600 text-white px-4 py-2.5 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-sm"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span>
                    {invoiceQuotaStatus.isExpired
                      ? `Trial expired (${invoiceQuotaStatus.used}/${invoiceQuotaStatus.limit} invoices used). Read-only mode, backup/export & invoice cancel remain active.`
                      : `Trial limit reached (${invoiceQuotaStatus.used}/${invoiceQuotaStatus.limit} invoices used). Read-only mode, backup/export & invoice cancel remain active.`}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {waDigits && (
                    <a
                      href={`https://wa.me/${waDigits}?text=${encodeURIComponent(`Hello Admin, my trial (${invoiceQuotaStatus.used}/${invoiceQuotaStatus.limit}) on Swarnkar ERP needs renewal. Account: ${auth.currentUser?.email || currentUserId}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black rounded-lg text-[11px]"
                    >
                      WhatsApp Admin
                    </a>
                  )}
                  {cleanPhone && (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="px-3 py-1 bg-white/15 hover:bg-white/25 text-white font-bold rounded-lg text-[11px]"
                    >
                      Call {supportConfig.supportPhone}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsBackupModalOpen(true)}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black rounded-lg text-[11px] cursor-pointer"
                  >
                    Backup / Export Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setTrialReadOnlyMode((prev) => !prev)}
                    className="px-3 py-1 bg-stone-950/60 hover:bg-stone-950 text-white font-bold rounded-lg text-[11px] cursor-pointer"
                  >
                    {trialReadOnlyMode ? 'Trial Expired Screen' : 'Read-Only & Cancel Bills'}
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              data-testid="trial-active-banner"
              className="bg-sky-50 dark:bg-sky-950/60 border-b border-sky-200 dark:border-sky-800 px-4 py-1.5 text-xs font-bold text-sky-900 dark:text-sky-200 flex flex-wrap items-center justify-between gap-2"
            >
              <span>
                Trial Mode: <strong>{invoiceQuotaStatus.remaining ?? 0}</strong> / {invoiceQuotaStatus.limit ?? DEFAULT_TRIAL_INVOICE_LIMIT} invoices remaining
                {typeof invoiceQuotaStatus.daysRemaining === 'number'
                  ? ` • ${invoiceQuotaStatus.daysRemaining} day(s) remaining`
                  : ''}
              </span>
              {waDigits && (
                <a
                  href={`https://wa.me/${waDigits}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] underline hover:opacity-80"
                >
                  Upgrade / Contact Admin
                </a>
              )}
            </div>
          );
        })()
      )}

      {/* Master Admin Cross-Firm Inspection Banner */}
      {isMasterAdmin && inspectedFirm && activeTab !== 'master_control' && (
        <div className="bg-stone-900 text-amber-300 border-b border-amber-500/40 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2">
          <span>
            Master Inspect Mode: आप अभी फर्म <strong>{inspectedFirm.name}</strong> ({inspectedFirm.code}) का लाइव डेटा देख व नियंत्रित कर रहे हैं।
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('master_control')}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-lg text-[11px] cursor-pointer"
          >
            Back to Master Control
          </button>
        </div>
      )}

      {/* Surfaced Firestore Sync / Permission Error Banner */}
      {syncError && (
        <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-300 dark:border-rose-800 px-4 py-2 text-xs font-bold text-rose-800 dark:text-rose-200 flex flex-wrap items-center justify-between gap-2">
          <span>⚠️ {syncError}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSyncRetryNonce(n => n + 1)}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold cursor-pointer"
            >
              Retry Sync
            </button>
            <button
              type="button"
              onClick={() => setSyncError(null)}
              className="px-2 py-1 text-rose-700 dark:text-rose-300 hover:underline text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main ERP Layout: Left-Side Vertical Sidebar List + Right-Side Content Viewport */}
      <div className="flex-1 flex w-full relative min-h-[calc(100vh-100px)] overflow-hidden">
        
        {/* Left-Side Vertical Navigation Sidebar List */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          inventoryAlertCount={lowStockCount}
          unpaidInvoicesCount={unpaidInvoicesCount}
          vendorDuesCount={vendorDuesCount}
          activeGirviCount={activeGirviCount}
          activeKarigarJobsCount={activeKarigarJobsCount}
          cashInHand={computedCashInHand}
          bankBalance={computedBankBalance}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenNewItem={() => {
            setEditingItem(null);
            setIsItemModalOpen(true);
          }}
          onOpenQuickGenerate={() => setIsQuickGenerateOpen(true)}
          onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
          customLogo={activeProfile?.logoUrl || shopDetails.logoUrl}
          onLogout={handleLogout}
          userAccess={activeUserAccess}
          effectivePermissions={effectivePermissions}
          isMasterAdmin={isMasterAdmin}
        />

        {/* Right Main Screen Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto px-2.5 sm:px-5 lg:px-7 py-3 sm:py-5 max-w-full">

        {/* Clear Trial Expired / Trial Limit Reached Screen (keeps reads, backup/export & invoice cancel accessible) */}
        {!isDemoUser &&
          !isMasterAdmin &&
          trialOwnerRecord?.status === 'trial' &&
          invoiceQuotaStatus &&
          (invoiceQuotaStatus.isExpired || invoiceQuotaStatus.limitReached) &&
          !trialReadOnlyMode && (
          <div
            data-testid="trial-expired-screen"
            className="max-w-2xl mx-auto my-6 bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-800 rounded-3xl shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-rose-950 via-stone-900 to-rose-950 text-white p-6 text-center border-b border-rose-500/30">
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 border border-rose-400/40 text-rose-200 mb-2">
                {invoiceQuotaStatus.isExpired ? 'Trial Period Expired' : 'Trial Invoice Quota Reached'}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {invoiceQuotaStatus.isExpired
                  ? 'Trial Expired — Read-Only Access Active'
                  : 'Trial Limit Reached — Read-Only Access Active'}
              </h2>
              <p className="text-xs text-stone-300 mt-1.5 max-w-lg mx-auto">
                {invoiceQuotaStatus.isExpired
                  ? 'आपकी ट्रायल अवधि समाप्त हो गई है। नई एंट्री (बिल, खरीद, स्टॉक, ग्राहक, गिरवी, खर्चे) बंद हैं, लेकिन आप अपना पूरा डेटा देख सकते हैं, बैकअप/एक्सपोर्ट कर सकते हैं और पुराने इनवॉइस रद्द (Cancel) कर सकते हैं।'
                  : `आपकी ट्रायल बिल सीमा (${invoiceQuotaStatus.used}/${invoiceQuotaStatus.limit}) पूरी हो गई है। नई एंट्री बंद हैं, लेकिन डेटा देखना, बैकअप/एक्सपोर्ट और इनवॉइस रद्द करना चालू है।`}
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 rounded-2xl p-3.5">
                  <div className="text-stone-500 dark:text-slate-400 font-semibold">Invoices Used</div>
                  <div className="text-lg font-black font-mono text-stone-900 dark:text-white mt-0.5">
                    {invoiceQuotaStatus.used} / {invoiceQuotaStatus.limit ?? 0}
                  </div>
                </div>
                <div className="bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 rounded-2xl p-3.5">
                  <div className="text-stone-500 dark:text-slate-400 font-semibold">Trial Status</div>
                  <div className="text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5">
                    {invoiceQuotaStatus.isExpired ? 'Expired (0d left)' : 'Quota Full'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2.5">
                {(() => {
                  const cleanPhone = (supportConfig.supportPhone || '').replace(/[^\d+]/g, '');
                  const waDigits = cleanPhone.replace(/^\+/, '');
                  return (
                    <>
                      {waDigits && (
                        <a
                          href={`https://wa.me/${waDigits}?text=${encodeURIComponent(`Hello Admin, my Swarnkar ERP trial has ended (${invoiceQuotaStatus.used}/${invoiceQuotaStatus.limit}). Account: ${auth.currentUser?.email || currentUserId}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 min-w-[160px] py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs text-center transition"
                        >
                          WhatsApp Admin to Renew
                        </a>
                      )}
                      {cleanPhone && (
                        <a
                          href={`tel:${cleanPhone}`}
                          className="py-2.5 px-4 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-900 dark:text-white font-bold rounded-xl text-xs transition"
                        >
                          Call {supportConfig.supportPhone}
                        </a>
                      )}
                    </>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-stone-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBackupModalOpen(true)}
                  className="py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs cursor-pointer transition"
                >
                  Backup / Export Data
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTrialReadOnlyMode(true);
                    setActiveTab('invoices');
                  }}
                  className="py-2.5 px-3 bg-stone-900 hover:bg-stone-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl text-xs cursor-pointer transition"
                >
                  Open Invoices (Cancel)
                </button>
                <button
                  type="button"
                  onClick={() => setTrialReadOnlyMode(true)}
                  className="py-2.5 px-3 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 font-bold rounded-xl text-xs cursor-pointer transition"
                >
                  Browse Read-Only Data
                </button>
              </div>
            </div>
          </div>
        )}

        {(isDemoUser ||
          isMasterAdmin ||
          trialOwnerRecord?.status !== 'trial' ||
          !invoiceQuotaStatus ||
          (!invoiceQuotaStatus.isExpired && !invoiceQuotaStatus.limitReached) ||
          trialReadOnlyMode) && (
        <>

        {/* TAB: Master Super Admin Control Panel */}
        {activeTab === 'master_control' && isMasterAdmin && (
          <MasterControlPanel
            currentAdminUid={currentUserId}
            currentAdminEmail={auth.currentUser?.email || userAccess?.email}
            masterSettings={masterSettings}
            supportConfig={supportConfig}
            activeFirmId={activeProfileId}
            onUpdateMasterSettings={setMasterSettings}
            onUpdateSupportConfig={setSupportConfig}
            onInspectFirm={(firm) => {
              setInspectedFirm(firm);
              setProfiles((prev) => (prev.some((p) => p.id === firm.id) ? prev : [firm, ...prev]));
              setActiveProfileId(firm.id);
              setIsFirmActive(true);
              setActiveTab('dashboard');
            }}
          />
        )}
        
        {/* TAB 0: Swarnkar Executive Dashboard [F1] */}
        {activeTab === 'dashboard' && (
          <MMIDashboard
            invoices={invoices}
            inventory={inventory}
            rates={rates}
            onNavigateTab={setActiveTab}
          />
        )}

        {/* Customer Orders & Approval Sale (Uchhanti) */}
        {activeTab === 'orders' && (
          <CustomerOrderManager
            customers={customers}
            inventory={inventory}
            rates={rates}
            onBillApprovedItem={() => setActiveTab('pos')}
          />
        )}

        {/* TAB 1: POS Sales Desk (बिक्री काउंटर) [F2] */}
        {activeTab === 'pos' && (
          <BillingPOS
            inventory={inventory}
            customers={customers}
            rates={rates}
            activeProfile={activeProfile}
            onAddCustomer={handleAddCustomer}
            onCreateInvoice={handleCreateInvoice}
            onUpdateInventoryQty={handleUpdateInventoryQty}
            canCreateInvoice={isDemoUser || hasActionPermission(activeUserAccess, 'canCreateInvoice', effectivePermissions, isMasterAdmin)}
            invoiceQuotaStatus={invoiceQuotaStatus}
          />
        )}

        {/* TAB 2: Purchases / Inward Stock (खरीद / माल की आवक) [F3] */}
        {activeTab === 'purchases' && (
          <PurchaseManager
            purchases={purchases}
            vendors={vendors}
            categories={categories}
            rates={rates}
            onAddPurchase={handleAddPurchase}
            onUpdateVendorBalance={handleUpdateVendorBalance}
            onAddVendor={handleAddVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
          />
        )}

        {/* TAB 3: Stock Inventory & Item Management [F4] */}
        {activeTab === 'inventory' && (
          <InventoryList
            inventory={inventory}
            rates={rates}
            categories={categories}
            shopName={shopDetails.name}
            onAddItem={() => {
              setEditingItem(null);
              setIsItemModalOpen(true);
            }}
            onEditItem={(item) => {
              setEditingItem(item);
              setIsItemModalOpen(true);
            }}
            onDeleteItem={handleDeleteInventoryItem}
            onUpdateQty={(id, newQty) => handleUpdateInventoryQty(id, newQty)}
            onSelectForBarcode={(item) => {
              setActiveTab('barcode');
            }}
            onOpenCategoryModal={() => setIsCategoryModalOpen(true)}
            onOpenQuickGenerate={() => setIsQuickGenerateOpen(true)}
            onBulkAddItems={(newItems) => {
              const taggedItems = newItems.map(it => ({ ...it, firmId: activeProfileId }));
              if (isDemoUser) {
                setInventory(prev => [...taggedItems, ...prev]);
              }
              taggedItems.forEach(it => persistFirmDoc('inventory', it));
            }}
          />
        )}

        {/* TAB: Gemstones & Navratna Hub [F10] */}
        {activeTab === 'gemstones' && (
          <GemstoneManager
            gemstones={gemstones}
            gemstoneRates={gemstoneRates}
            onAddGemstone={handleAddGemstone}
            onUpdateGemstone={handleUpdateGemstone}
            onDeleteGemstone={handleDeleteGemstone}
            onUpdateGemstoneRates={handleUpdateGemstoneRates}
            onSellInPOS={(gemItem) => {
              const tagged = { ...gemItem, firmId: activeProfileId };
              if (!inventory.some(i => i.id === tagged.id)) {
                if (isDemoUser) setInventory(prev => [tagged, ...prev]);
                persistFirmDoc('inventory', tagged);
              }
              setActiveTab('pos');
            }}
            onPrintTag={(gemItem) => {
              const tagged = { ...gemItem, firmId: activeProfileId };
              if (!inventory.some(i => i.id === tagged.id)) {
                if (isDemoUser) setInventory(prev => [tagged, ...prev]);
                persistFirmDoc('inventory', tagged);
              }
              setActiveTab('barcode');
            }}
          />
        )}

        {/* TAB 4: Cash in Hand & Bank Deposit Reconciliation [F5] */}
        {activeTab === 'cashbank' && (
          <CashBankDashboard
            initialCash={initialCashInHand}
            initialBank={initialBankBalance}
            invoices={invoices}
            purchases={purchases}
            expenses={expenses}
            girviLoans={girviLoans}
            transfers={transfers}
            onAddTransfer={handleAddTransfer}
          />
        )}

        {/* TAB 5: Shop Expenses (दुकान खर्चे) [F6] */}
        {activeTab === 'expenses' && (
          <ExpenseManager
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {/* TAB 6: Vendors / Suppliers Directory [F7] */}
        {activeTab === 'vendors' && (
          <VendorList
            vendors={vendors}
            onAddVendor={handleAddVendor}
            onUpdateVendor={handleUpdateVendor}
            onDeleteVendor={handleDeleteVendor}
            onOpenNewPurchase={(vendorId) => {
              setActiveTab('purchases');
            }}
          />
        )}

        {/* TAB 7: Barcode & QR Code Tag Generator [F8] */}
        {activeTab === 'barcode' && (
          <BarcodeTagManager
            inventory={inventory}
            rates={rates}
            onSelectForPOS={(item) => {
              setActiveTab('pos');
            }}
          />
        )}

        {/* TAB 8: Karigar (Goldsmith) Job Card Ledger [F9] */}
        {activeTab === 'karigar' && (
          <KarigarLedger
            karigars={karigars}
            jobCards={jobCards}
            onAddJobCard={handleAddJobCard}
            onUpdateJobCard={handleUpdateJobCard}
            onAddKarigar={handleAddKarigar}
          />
        )}

        {/* TAB 9: Girvi (Pawn Loan) Ledger & Calculator */}
        {activeTab === 'girvi' && (
          <GirviLedger
            loans={girviLoans}
            onAddLoan={handleAddGirviLoan}
            onUpdateLoan={handleUpdateGirviLoan}
          />
        )}

        {/* TAB 10: Sales Invoices Register */}
        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            onViewPrintInvoice={(inv) => setPrintingInvoices([inv])}
            onBatchPrintInvoices={(invs) => setPrintingInvoices(invs)}
            onDeleteInvoice={handleDeleteInvoice}
            canCancelInvoice={isDemoUser || hasActionPermission(activeUserAccess, 'canCancelInvoice', effectivePermissions, isMasterAdmin)}
            onCancelInvoice={async (inv, reason) => {
              if (!isDemoUser && !hasActionPermission(activeUserAccess, 'canCancelInvoice', effectivePermissions, isMasterAdmin)) {
                const msg = 'Master Admin द्वारा आपको इनवॉइस रद्द (Cancel) करने की अनुमति नहीं दी गई है।';
                alert(msg);
                throw new Error(msg);
              }
              if (isDemoUser) {
                setInvoices(prev => prev.map(i => i.id === inv.id ? {
                  ...i,
                  status: 'Cancelled',
                  cancelReason: reason,
                  cancelledBy: shopDetails.name || 'Owner',
                  cancelledAt: getISTDate().isoDateStr
                } : i));
                setInventory(prev =>
                  prev.map(it => {
                    const restoreQty = inv.items
                      .filter(c => c.itemId === it.id)
                      .reduce((s, c) => s + (c.quantity || 1), 0);
                    return restoreQty > 0 ? { ...it, quantity: it.quantity + restoreQty } : it;
                  })
                );
                return;
              }

              if (!activeProfileId || !isFirmRootReady) {
                const msg = 'फर्म रूट डॉक्यूमेंट तैयार नहीं है। इनवॉइस रद्द नहीं किया जा सकता।';
                alert(msg);
                throw new Error(msg);
              }

              beginSyncWrite('Cancelling invoice...');
              try {
                // Only call cancelInvoiceAtomic and await it; UI updates from Firestore snapshot
                await cancelInvoiceAtomic(activeProfileId, inv, reason, shopDetails.name || 'Owner', {
                  uid: currentUserId,
                  isMasterAdmin
                });
                endSyncWrite(`Invoice ${inv.invoiceNumber} cancelled`, true);
              } catch (err: any) {
                endSyncWrite('Cancel invoice failed', false);
                handleFirestoreError(err);
                alert(`इनवॉइस रद्द करने में त्रुटि: ${err?.message || err}`);
                throw err;
              }
            }}
            onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          />
        )}

        {/* TAB 11: Customers & Khata Dues */}
        {activeTab === 'customers' && (
          <CustomerList
            customers={customers}
            invoices={invoices}
            shopDetails={shopDetails}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        )}

        {/* TAB 12: Daily Sales & GST GSTR-1 Reports */}
        {activeTab === 'reports' && (
          <GSTAccountingReports
            invoices={invoices}
            inventory={inventory}
            rates={rates}
            girviLoans={girviLoans}
            onNavigateToProfit={() => setActiveTab('profit')}
          />
        )}

        {/* TAB 13: Profit & Margins Analytics (मुनाफा व मार्जिन रिपोर्ट) */}
        {activeTab === 'profit' && (
          <ProfitReport
            invoices={invoices}
            inventory={inventory}
            rates={rates}
            expenses={expenses}
            purchases={purchases}
            categories={categories}
            shopDetails={shopDetails}
          />
        )}

        {/* Sarafa Bullion Trading Desk (सौदा व बदला) */}
        {activeTab === 'bullion' && (
          <BullionTradingDesk rates={rates} />
        )}

        {/* Kitty Gold Savings Scheme (11+1 बचत योजना) */}
        {activeTab === 'kitty' && (
          <KittySchemeManager customers={customers} />
        )}

        {/* CRM, Bulk SMS & Greetings */}
        {activeTab === 'crm' && (
          <CRMManager customers={customers} invoices={invoices} />
        )}

        {/* Staff Payroll & Biometric Attendance */}
        {activeTab === 'payroll' && (
          <StaffPayrollManager />
        )}

        </>
        )}

        </main>
      </div>

      {/* MODALS */}

      {/* Manage Custom Jewellery Categories Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      {/* 1-Click Fast Auto-Generate Item Modal */}
      <QuickGenerateItemModal
        isOpen={isQuickGenerateOpen}
        onClose={() => setIsQuickGenerateOpen(false)}
        categories={categories}
        rates={rates}
        existingInventoryCount={inventory.length}
        onItemGenerated={handleItemGenerated}
      />
      
      <FirmManagerModal
        isOpen={isProfilesModalOpen}
        onClose={() => setIsProfilesModalOpen(false)}
        firms={profiles}
        activeFirmId={activeProfileId}
        onSelectFirm={setActiveProfileId}
        onAddFirm={handleAddProfile}
        onUpdateFirm={handleUpdateProfile}
        onDeleteFirm={handleDeleteFirm}
        canManageStaff={!isDemoUser && hasActionPermission(activeUserAccess, 'staffManagement', effectivePermissions, isMasterAdmin)}
        currentUid={currentUserId}
        ownerPermissions={effectivePermissions || FULL_PERMISSIONS}
        staffInvites={staffInvites}
        onInviteStaff={async ({ email, displayName, role, permissions }) => {
          if (!activeProfileId || !activeProfile) return;
          await createOrUpdateStaffInvite({
            firmId: activeProfileId,
            firmName: activeProfile.name,
            ownerUid: activeProfile.ownerUid || currentUserId,
            email,
            displayName,
            role,
            permissions,
            ownerPermissions: effectivePermissions || FULL_PERMISSIONS
          });
        }}
        onUpdateStaffPermissions={async ({ staffUid, email, role, permissions }) => {
          if (!activeProfileId) return;
          await updateFirmStaffPermissions({
            firmId: activeProfileId,
            staffUid,
            email,
            role,
            permissions,
            ownerPermissions: effectivePermissions || FULL_PERMISSIONS
          });
        }}
        onRemoveStaff={async (staffUid, email) => {
          if (!activeProfileId) return;
          await removeFirmStaffMember(activeProfileId, staffUid, email);
        }}
      />

      {/* Daily Metal Rate Configurator Modal */}
      <RatesModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        rates={rates}
        selectedCity={selectedCity}
        onSelectCity={handleSelectCity}
        onSaveRates={(updated) => setRates(updated)}
      />

      {/* Stock Alerts Modal */}
      <StockAlertsModal
        isOpen={isStockAlertsModalOpen}
        onClose={() => setIsStockAlertsModalOpen(false)}
        inventory={inventory}
        rates={rates}
        onNavigateToInventory={() => {
          setIsStockAlertsModalOpen(false);
          setActiveTab('inventory');
        }}
      />

      {/* Shop Settings Modal */}
      <ShopSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        shopDetails={shopDetails}
        onSaveShopDetails={(updated) => {
          setShopDetails(updated);
          persistFirmDoc('shop_details', { id: 'main', ...updated });
        }}
      />

      {/* Add / Edit Jewellery Stock Item Modal */}
      <ItemModal
        isOpen={isItemModalOpen}
        onClose={() => {
          setIsItemModalOpen(false);
          setEditingItem(null);
        }}
        initialItem={editingItem}
        categories={categories}
        onSaveItem={handleSaveInventoryItem}
      />

      {/* Printable GST / Estimate Invoice Modal */}
      <InvoicePrintModal
        isOpen={!!printingInvoices}
        onClose={() => setPrintingInvoices(null)}
        invoices={printingInvoices}
        shopDetails={shopDetails}
        customLogo={activeProfile?.logoUrl || shopDetails.logoUrl}
      />

      {/* Cloud & Local Data Backup / Export Modal */}
      <DataBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        firmId={activeProfileId}
        firmName={activeProfile?.name || shopDetails.name}
        allFirmData={{
          shopDetails,
          inventory,
          customers,
          invoices,
          vendors,
          purchases,
          expenses,
          transfers,
          karigars,
          jobCards,
          girviLoans,
          gemstones,
          profiles
        }}
        onRestoreData={(restored) => {
          if (isDemoUser) {
            if (restored.inventory) setInventory(restored.inventory);
            if (restored.customers) setCustomers(restored.customers);
            if (restored.invoices) setInvoices(restored.invoices);
            if (restored.vendors) setVendors(restored.vendors);
            if (restored.purchases) setPurchases(restored.purchases);
            if (restored.expenses) setExpenses(restored.expenses);
            if (restored.transfers) setTransfers(restored.transfers);
            if (restored.karigars) setKarigars(restored.karigars);
            if (restored.jobCards) setJobCards(restored.jobCards);
            if (restored.girviLoans) setGirviLoans(restored.girviLoans);
            if (restored.gemstones) setGemstones(restored.gemstones);
            if (restored.shopDetails) setShopDetails(restored.shopDetails);
            return;
          }
          // Upload restored collections to Firestore
          if (restored.shopDetails) persistFirmDoc('shop_details', { id: 'main', ...restored.shopDetails });
          (restored.inventory || []).forEach((it: JewelleryItem) => persistFirmDoc('inventory', { ...it, firmId: activeProfileId }));
          (restored.customers || []).forEach((c: Customer) => persistFirmDoc('customers', { ...c, firmId: activeProfileId }));
          (restored.invoices || []).forEach((inv: GSTInvoice) => persistFirmDoc('invoices', { ...inv, firmId: activeProfileId }));
          (restored.vendors || []).forEach((v: Vendor) => persistFirmDoc('vendors', { ...v, firmId: activeProfileId }));
          (restored.purchases || []).forEach((p: PurchaseInvoice) => persistFirmDoc('purchases', { ...p, firmId: activeProfileId }));
          (restored.expenses || []).forEach((ex: ShopExpense) => persistFirmDoc('expenses', { ...ex, firmId: activeProfileId }));
          (restored.transfers || []).forEach((tr: CashBankTransfer) => persistFirmDoc('transfers', { ...tr, firmId: activeProfileId }));
          (restored.karigars || []).forEach((k: Karigar) => persistFirmDoc('karigars', { ...k, firmId: activeProfileId }));
          (restored.jobCards || []).forEach((j: KarigarJobCard) => persistFirmDoc('jobcards', { ...j, firmId: activeProfileId }));
          (restored.girviLoans || []).forEach((g: GirviLoan) => persistFirmDoc('girvi', { ...g, firmId: activeProfileId }));
          (restored.gemstones || []).forEach((gm: CertifiedGemstone) => persistFirmDoc('gemstones', { ...gm, firmId: activeProfileId }));
        }}
      />

      {/* First-load Legacy localStorage -> Firestore Migration Modal */}
      {migrationPrompt && (
        <LegacyMigrationModal
          isOpen={true}
          firmId={migrationPrompt.firmId}
          firmName={activeProfile?.name || shopDetails.name}
          counts={migrationPrompt.counts}
          totalCount={migrationPrompt.totalCount}
          legacySnapshot={migrationPrompt.snapshot}
          onComplete={() => setMigrationPrompt(null)}
          onSkip={() => setMigrationPrompt(null)}
        />
      )}

    </div>
  );
}
