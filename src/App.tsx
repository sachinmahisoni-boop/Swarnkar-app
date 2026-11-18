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
  StaffInviteRecord
} from './types';
import { 
  initialProfiles,
  initialRates, 
  initialCategories,
  initialCashInHand,
  initialBankBalance,
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
import { FirmRegistrationScreen } from './components/Auth/FirmRegistrationScreen';
import { MMIDashboard } from './components/Dashboard/MMIDashboard';
import { CustomerOrderManager } from './components/Orders/CustomerOrderManager';
import { BullionTradingDesk } from './components/Bullion/BullionTradingDesk';
import { KittySchemeManager } from './components/Kitty/KittySchemeManager';
import { CRMManager } from './components/CRM/CRMManager';
import { StaffPayrollManager } from './components/Payroll/StaffPayrollManager';
import { DataBackupModal } from './components/DataBackupModal';
import { LegacyMigrationModal } from './components/LegacyMigrationModal';
import { auth, db } from './lib/firebase';
import {
  getLocalDeviceInvoices,
  saveLocalDeviceInvoice,
  mergeDeviceAndCloudInvoices,
  allocateNextDeviceInvoiceNumber,
  buildStandaloneInvoiceHtmlDocument,
  writeInvoiceToConnectedFolder,
  saveLocalDevicePurchase,
  getLocalDevicePurchases
} from './lib/deviceInvoiceStorage';
import {
  DEFAULT_LOCAL_FIRM_PROFILE,
  loadLocalFirmProfiles,
  saveLocalFirmProfiles,
  getActiveLocalFirmId,
  setActiveLocalFirmId,
  loadLocalFirmCollection,
  saveLocalFirmCollectionDoc,
  deleteLocalFirmCollectionDoc,
  replaceLocalFirmCollection,
  loadLocalShopDetails,
  saveLocalShopDetails
} from './lib/localFirmStorage';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ensureFirmRootDoc,
  isFirmRootReady as isFirmRootReadyFn,
  clearFirmRootReady,
  fetchUserFirms,
  checkFirmHasFirestoreData,
  getLegacyLocalStorageData,
  subscribeToFirmCollection,
  subscribeToFirmDoc,
  subscribeToSnapshotsInSync,
  subscribeToUserAccess,
  ensureUserAccessRecord,
  subscribeToFirmStaffInvites,
  createOrUpdateStaffInvite,
  updateFirmStaffPermissions,
  removeFirmStaffMember,
  claimStaffInvitesForUser,
  updateFirmMetaByMaster,
  saveFirmDoc, 
  deleteFirmDoc, 
  cancelInvoiceAtomic,
  createPurchaseAtomic,
  sanitizeInvoicePayload,
  FirmDataSnapshot,
  SnapshotMetadataInfo
} from './lib/firestoreSync';
import {
  FULL_PERMISSIONS,
} from './lib/accessControl';
import { getISTDate } from './lib/invoiceNumber';

export default function App() {
  const hasCloudSupport = Boolean(auth && db);
  const [isDemoUser] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>(() => auth?.currentUser?.uid || '');
  const [userAccess, setUserAccess] = useState<AppUserAccessRecord | null>(null);
  const [userAccessRefreshNonce, setUserAccessRefreshNonce] = useState<number>(0);
  const [staffInvites, setStaffInvites] = useState<StaffInviteRecord[]>([]);

  const getEffectiveUserId = (): string => {
    if (auth?.currentUser?.uid) return auth.currentUser.uid;
    return currentUserId || '';
  };

  // Firm onboarding & selection state (always ready immediately without login)
  const [isFirmActive, setIsFirmActive] = useState<boolean>(true);

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

  const [profiles, setProfiles] = useState<JewellerProfile[]>(() => loadLocalFirmProfiles());
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const initialList = loadLocalFirmProfiles();
    return getActiveLocalFirmId(initialList);
  });

  useEffect(() => {
    if (!hasCloudSupport || !auth) return;
    let cancelled = false;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (cancelled) return;
      if (user) {
        setCurrentUserId(user.uid);
        try {
          const accessRecord = await ensureUserAccessRecord(user);
          if (!cancelled) setUserAccess(accessRecord);
        } catch {
          // Non-fatal
        }

        try {
          await claimStaffInvitesForUser(user);
        } catch {
          // Non-fatal
        }

        try {
          const cloudProfs = await fetchUserFirms(user.uid);
          if (cancelled) return;
          if (cloudProfs.length > 0) {
            setProfiles((prev) => {
              const byId = new Map<string, JewellerProfile>();
              prev.forEach(p => byId.set(p.id, p));
              cloudProfs.forEach(p => byId.set(p.id, { ...byId.get(p.id), ...p }));
              const merged = Array.from(byId.values());
              saveLocalFirmProfiles(merged);
              return merged;
            });
          }
        } catch (err: any) {
          if (!cancelled) {
            handleFirestoreError(err);
          }
        }
      } else {
        clearFirmRootReady();
        setIsFirmRootReady(false);
        setCurrentUserId('');
        setUserAccess(null);
        setStaffInvites([]);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [hasCloudSupport, userAccessRefreshNonce]);

  // Realtime listener on /users/{uid} profile metadata when signed in
  useEffect(() => {
    if (!hasCloudSupport || !currentUserId) return;
    const unsub = subscribeToUserAccess(
      currentUserId,
      (record) => {
        if (record) {
          setUserAccess(record);
        }
      },
      (err) => {
        console.warn('User profile subscription warning:', err);
      }
    );
    return () => unsub();
  }, [hasCloudSupport, currentUserId, userAccessRefreshNonce]);

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
  const syncStatusRef = useRef<SyncStatusType>('synced');
  const syncErrorRef = useRef<string | null>(null);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [migrationPrompt, setMigrationPrompt] = useState<{
    firmId: string;
    counts: Record<string, number>;
    totalCount: number;
    snapshot: FirmDataSnapshot;
  } | null>(null);

  const updateSyncStatus = (next: SyncStatusType) => {
    syncStatusRef.current = next;
    setSyncStatus(next);
  };

  const updateSyncError = (next: string | null) => {
    syncErrorRef.current = next;
    setSyncError(next);
  };

  const recomputeSyncCounts = () => {
    const totalPending = inFlightWritesRef.current + pendingCollectionsRef.current.size;
    setPendingWritesCount(totalPending);
    return totalPending;
  };

  const beginSyncWrite = (label: string) => {
    inFlightWritesRef.current += 1;
    recomputeSyncCounts();
    setLastSyncEventLabel(label);
    updateSyncStatus(navigator.onLine ? 'syncing' : 'offline');
  };

  const endSyncWrite = (label: string, success: boolean) => {
    inFlightWritesRef.current = Math.max(0, inFlightWritesRef.current - 1);
    const remaining = recomputeSyncCounts();
    if (success) {
      updateSyncError(null);
      setIsSynced(true);
      setLastSyncedAt(Date.now());
      setSyncSource(navigator.onLine ? 'cloud' : 'cache');
      setLastSyncEventLabel(label);
      setSyncPulseKey(k => k + 1);
      if (remaining === 0) {
        updateSyncStatus(navigator.onLine ? 'synced' : 'offline');
      }
    }
  };

  const handleFirestoreError = (err: any) => {
    const code = err?.code || '';
    const msg = err?.message || String(err);
    console.error('Firestore error:', err);
    if (code === 'permission-denied' || msg.toLowerCase().includes('permission')) {
      updateSyncStatus('permission-error');
      setIsSynced(false);
      updateSyncError(`Firestore अनुमति त्रुटि (Permission Error): ${msg}`);
    } else if (!navigator.onLine || code === 'unavailable') {
      updateSyncStatus('offline');
      setIsSynced(false);
      setSyncSource('cache');
      updateSyncError(null);
    } else {
      updateSyncStatus('error');
      setIsSynced(false);
      updateSyncError(`Firestore सिंक त्रुटि: ${msg}`);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncSource('cloud');
      if (isFirmRootReady && !syncErrorRef.current) {
        const pending = inFlightWritesRef.current + pendingCollectionsRef.current.size;
        updateSyncStatus(pending > 0 ? 'syncing' : 'synced');
        setSyncPulseKey(k => k + 1);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncSource('cache');
      if (!syncErrorRef.current) {
        updateSyncStatus('offline');
        setLastSyncEventLabel('Offline - Local cache active');
      }
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isFirmRootReady]);

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
  const activeUserAccess = isDemoUser ? null : userAccess;
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || initialProfiles[0];
  const effectivePermissions = FULL_PERMISSIONS;

  useEffect(() => {
    if (!activeProfileId || !isFirmActive) {
      clearFirmRootReady();
      setIsFirmRootReady(false);
      return;
    }

    let cancelled = false;
    const prof = profiles.find(p => p.id === activeProfileId);

    // Load all device-stored firm collections immediately (works 100% without login)
    const savedShop = loadLocalShopDetails(activeProfileId);
    setShopDetails(savedShop || buildDefaultShopDetails(activeProfileId, prof));
    setInventory(loadLocalFirmCollection<JewelleryItem>(activeProfileId, 'inventory'));
    setCustomers(loadLocalFirmCollection<Customer>(activeProfileId, 'customers'));
    setInvoices(getLocalDeviceInvoices(activeProfileId));
    setVendors(loadLocalFirmCollection<Vendor>(activeProfileId, 'vendors'));
    const storedLocalPurchases = loadLocalFirmCollection<PurchaseInvoice>(activeProfileId, 'purchases');
    const devicePurchases = getLocalDevicePurchases<PurchaseInvoice>(activeProfileId);
    const purchaseMap = new Map<string, PurchaseInvoice>();
    [...devicePurchases, ...storedLocalPurchases].forEach(p => {
      if (p?.id) purchaseMap.set(p.id, p);
    });
    setPurchases(Array.from(purchaseMap.values()));
    setExpenses(loadLocalFirmCollection<ShopExpense>(activeProfileId, 'expenses'));
    setTransfers(loadLocalFirmCollection<CashBankTransfer>(activeProfileId, 'transfers'));
    setKarigars(loadLocalFirmCollection<Karigar>(activeProfileId, 'karigars'));
    setJobCards(loadLocalFirmCollection<KarigarJobCard>(activeProfileId, 'jobcards'));
    setGirviLoans(loadLocalFirmCollection<GirviLoan>(activeProfileId, 'girvi'));
    setGemstones(loadLocalFirmCollection<CertifiedGemstone>(activeProfileId, 'gemstones'));
    updateSyncError(null);

    if (!hasCloudSupport || !currentUserId) {
      clearFirmRootReady(activeProfileId);
      setIsFirmRootReady(false);
      setIsSynced(true);
      updateSyncStatus('synced');
      setSyncSource('cache');
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel('Saved on this device');
      setSyncPulseKey(k => k + 1);
      return;
    }

    if (isFirmRootReadyFn(activeProfileId, currentUserId)) {
      setIsFirmRootReady(true);
      setIsSynced(true);
      updateSyncStatus(navigator.onLine ? 'synced' : 'offline');
      setSyncSource(navigator.onLine ? 'cloud' : 'cache');
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel('Firm workspace connected');
      setSyncPulseKey(k => k + 1);
      return;
    }

    setIsFirmRootReady(false);
    clearFirmRootReady(activeProfileId);
    updateSyncStatus('syncing');

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
            operatorName: prof?.operatorName,
            logoUrl: prof?.logoUrl || undefined
          },
          { uid: currentUserId }
        );
        if (cancelled) return;

        setIsFirmRootReady(true);
        setIsSynced(true);
        updateSyncStatus(navigator.onLine ? 'synced' : 'offline');
        setSyncSource(navigator.onLine ? 'cloud' : 'cache');
        setLastSyncedAt(Date.now());
        setLastSyncEventLabel('Firm workspace connected');
        setSyncPulseKey(k => k + 1);

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
  }, [hasCloudSupport, activeProfileId, isFirmActive, currentUserId, syncRetryNonce]);

  // Step 2: Optional Firestore Realtime Subscriptions (only when signed in with Firebase)
  useEffect(() => {
    if (!hasCloudSupport || !activeProfileId || !isFirmRootReady || !currentUserId) return;

    pendingCollectionsRef.current.clear();
    recomputeSyncCounts();
    updateSyncStatus(navigator.onLine ? 'syncing' : 'offline');
    setLastSyncEventLabel(navigator.onLine ? 'Syncing cloud records...' : 'Offline - Local cache active');

    const onSubError = (err: Error) => handleFirestoreError(err);
    const hasActiveError = () =>
      Boolean(syncErrorRef.current) ||
      syncStatusRef.current === 'permission-error' ||
      syncStatusRef.current === 'error';

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
        if (!hasActiveError()) {
          updateSyncStatus('offline');
          setLastSyncEventLabel(`Offline cache (${colName})`);
        }
        return;
      }

      if (totalPending > 0) {
        if (!hasActiveError()) {
          updateSyncStatus('syncing');
          setLastSyncEventLabel(`Syncing ${colName}...`);
        }
        return;
      }

      if (hasActiveError()) {
        return;
      }

      setIsSynced(true);
      updateSyncStatus('synced');
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel(fromCache ? `Cached (${colName})` : `Synced ${colName}`);
      setSyncPulseKey(k => k + 1);
    };

    const unsubs: (() => void)[] = [];

    unsubs.push(
      subscribeToSnapshotsInSync(() => {
        const remaining = recomputeSyncCounts();
        if (!navigator.onLine) {
          if (!hasActiveError()) {
            updateSyncStatus('offline');
          }
          return;
        }
        if (remaining === 0 && !hasActiveError()) {
          setIsSynced(true);
          updateSyncStatus('synced');
          setSyncSource('cloud');
          setLastSyncedAt(Date.now());
          setSyncPulseKey(k => k + 1);
        }
      })
    );

    unsubs.push(subscribeToFirmDoc<ShopDetails>(activeProfileId, 'shop_details', 'main', (docData, meta) => {
      markSynced('shop_details', meta);
      if (docData) {
        setShopDetails(docData);
      }
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<JewelleryItem>(activeProfileId, 'inventory', (items, meta) => {
      markSynced('inventory', meta);
      setInventory(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<Customer>(activeProfileId, 'customers', (items, meta) => {
      markSynced('customers', meta);
      setCustomers(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<GSTInvoice>(activeProfileId, 'invoices', (items, meta) => {
      markSynced('invoices', meta);
      setInvoices(mergeDeviceAndCloudInvoices(activeProfileId, items));
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<Vendor>(activeProfileId, 'vendors', (items, meta) => {
      markSynced('vendors', meta);
      setVendors(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<PurchaseInvoice>(activeProfileId, 'purchases', (items, meta) => {
      markSynced('purchases', meta);
      const localPurchases = getLocalDevicePurchases<PurchaseInvoice>(activeProfileId);
      const mergedMap = new Map<string, PurchaseInvoice>();
      items.forEach(p => { if (p?.id) mergedMap.set(p.id, p); });
      localPurchases.forEach(p => { if (p?.id && !mergedMap.has(p.id)) mergedMap.set(p.id, p); });
      setPurchases(Array.from(mergedMap.values()));
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<ShopExpense>(activeProfileId, 'expenses', (items, meta) => {
      markSynced('expenses', meta);
      setExpenses(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<CashBankTransfer>(activeProfileId, 'transfers', (items, meta) => {
      markSynced('transfers', meta);
      setTransfers(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<Karigar>(activeProfileId, 'karigars', (items, meta) => {
      markSynced('karigars', meta);
      setKarigars(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<KarigarJobCard>(activeProfileId, 'jobcards', (items, meta) => {
      markSynced('jobcards', meta);
      setJobCards(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<GirviLoan>(activeProfileId, 'girvi', (items, meta) => {
      markSynced('girvi', meta);
      setGirviLoans(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<CertifiedGemstone>(activeProfileId, 'gemstones', (items, meta) => {
      markSynced('gemstones', meta);
      setGemstones(items);
    }, onSubError));

    return () => {
      pendingCollectionsRef.current.clear();
      unsubs.forEach(unsub => unsub());
    };
  }, [
    hasCloudSupport,
    activeProfileId,
    isFirmRootReady,
    currentUserId,
  ]);


  // Persist UI preferences & firm profiles locally on device
  useEffect(() => {
    localStorage.setItem('jewel_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    saveLocalFirmProfiles(profiles);
    const uid = getEffectiveUserId();
    if (uid && uid !== 'demo') {
      localStorage.setItem(`jewel_user_${uid}_profiles`, JSON.stringify(profiles));
    }
  }, [profiles, currentUserId]);

  useEffect(() => {
    if (activeProfileId) {
      setActiveLocalFirmId(activeProfileId);
      const uid = getEffectiveUserId();
      if (uid && uid !== 'demo') {
        localStorage.setItem(`jewel_user_${uid}_active_profile`, activeProfileId);
      }
    }
  }, [activeProfileId, currentUserId]);

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

  const upsertLocalCollectionState = <T extends { id: string }>(colName: string, data: T) => {
    if (!activeProfileId) return;
    if (colName === 'shop_details') {
      const nextShop = data as unknown as ShopDetails;
      saveLocalShopDetails(activeProfileId, nextShop);
      setShopDetails(nextShop);
      return;
    }
    if (colName === 'invoices') {
      const inv = data as unknown as GSTInvoice;
      saveLocalDeviceInvoice(activeProfileId, inv);
      setInvoices(prev => {
        const exists = prev.some(i => i.id === inv.id);
        return exists ? prev.map(i => (i.id === inv.id ? inv : i)) : [inv, ...prev];
      });
      return;
    }
    if (colName === 'purchases') {
      const p = data as unknown as PurchaseInvoice;
      saveLocalDevicePurchase(activeProfileId, p);
    }

    const updated = saveLocalFirmCollectionDoc<T>(activeProfileId, colName, data);
    switch (colName) {
      case 'inventory':
        setInventory(updated as unknown as JewelleryItem[]);
        break;
      case 'customers':
        setCustomers(updated as unknown as Customer[]);
        break;
      case 'vendors':
        setVendors(updated as unknown as Vendor[]);
        break;
      case 'purchases':
        setPurchases(updated as unknown as PurchaseInvoice[]);
        break;
      case 'expenses':
        setExpenses(updated as unknown as ShopExpense[]);
        break;
      case 'transfers':
        setTransfers(updated as unknown as CashBankTransfer[]);
        break;
      case 'karigars':
        setKarigars(updated as unknown as Karigar[]);
        break;
      case 'jobcards':
        setJobCards(updated as unknown as KarigarJobCard[]);
        break;
      case 'girvi':
        setGirviLoans(updated as unknown as GirviLoan[]);
        break;
      case 'gemstones':
        setGemstones(updated as unknown as CertifiedGemstone[]);
        break;
      default:
        break;
    }
  };

  const deleteLocalCollectionState = (colName: string, docId: string) => {
    if (!activeProfileId) return;
    const updated = deleteLocalFirmCollectionDoc<any>(activeProfileId, colName, docId);
    switch (colName) {
      case 'inventory':
        setInventory(updated as JewelleryItem[]);
        break;
      case 'customers':
        setCustomers(updated as Customer[]);
        break;
      case 'vendors':
        setVendors(updated as Vendor[]);
        break;
      case 'expenses':
        setExpenses(updated as ShopExpense[]);
        break;
      case 'transfers':
        setTransfers(updated as CashBankTransfer[]);
        break;
      case 'karigars':
        setKarigars(updated as Karigar[]);
        break;
      case 'jobcards':
        setJobCards(updated as KarigarJobCard[]);
        break;
      case 'girvi':
        setGirviLoans(updated as GirviLoan[]);
        break;
      case 'gemstones':
        setGemstones(updated as CertifiedGemstone[]);
        break;
      default:
        break;
    }
  };

  // Device-first writes (with optional Firestore sync if user happens to be signed in)
  const persistFirmDoc = <T extends { id: string }>(colName: string, data: T) => {
    if (!activeProfileId) return;
    upsertLocalCollectionState(colName, data);

    if (!hasCloudSupport || !currentUserId || !isFirmRootReady) {
      setIsSynced(true);
      updateSyncStatus('synced');
      setSyncSource('cache');
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel(`Saved ${colName} on device`);
      setSyncPulseKey(k => k + 1);
      return;
    }

    if (!navigator.onLine) {
      setSyncSource('cache');
      updateSyncStatus('offline');
      setLastSyncEventLabel(`Queued offline (${colName})`);
      saveFirmDoc(activeProfileId, colName, data).catch((err) => {
        handleFirestoreError(err);
      });
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
    if (!activeProfileId) return;
    deleteLocalCollectionState(colName, docId);

    if (!hasCloudSupport || !currentUserId || !isFirmRootReady) {
      setIsSynced(true);
      updateSyncStatus('synced');
      setSyncSource('cache');
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel(`Removed from ${colName} on device`);
      setSyncPulseKey(k => k + 1);
      return;
    }

    if (!navigator.onLine) {
      setSyncSource('cache');
      updateSyncStatus('offline');
      setLastSyncEventLabel(`Queued offline delete (${colName})`);
      deleteFirmDoc(activeProfileId, colName, docId).catch((err) => {
        handleFirestoreError(err);
      });
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

  useEffect(() => {
    if (
      !hasCloudSupport ||
      !currentUserId ||
      !isFirmRootReady ||
      !activeProfileId ||
      activeProfile?.ownerUid !== currentUserId
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
  }, [hasCloudSupport, isFirmRootReady, activeProfileId, activeProfile?.ownerUid, currentUserId]);

  // Global Keyboard Shortcuts (F1-F12 + Girvi)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('dashboard');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('pos');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('purchases');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('cashbank');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setActiveTab('expenses');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setActiveTab('vendors');
      } else if (e.key === 'F8') {
        e.preventDefault();
        setActiveTab('barcode');
      } else if (e.key === 'F9') {
        e.preventDefault();
        setActiveTab('karigar');
      } else if (e.key === 'F10') {
        e.preventDefault();
        setActiveTab('gemstones');
      } else if (e.key === 'F11') {
        e.preventDefault();
        setActiveTab('profit');
      } else if (e.altKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        setActiveTab('girvi');
      } else if (e.key === 'F12') {
        e.preventDefault();
        setIsSettingsModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    const uid = getEffectiveUserId();
    const enriched: JewellerProfile = {
      ...newProfile,
      firmId: newProfile.id,
      userId: uid,
      ownerUid: uid || newProfile.ownerUid
    };
    setProfiles(prev => {
      const next = [...prev, enriched];
      saveLocalFirmProfiles(next);
      return next;
    });
    setActiveProfileId(enriched.id);
    setActiveLocalFirmId(enriched.id);

    if (hasCloudSupport && uid) {
      try {
        await ensureFirmRootDoc(
          enriched.id,
          {
            name: enriched.name,
            gstin: enriched.gstin,
            phone: enriched.phone,
            code: enriched.code,
            counterName: enriched.counterName,
            counterType: enriched.counterType,
            operatorName: enriched.operatorName,
            logoUrl: enriched.logoUrl || undefined
          },
          { uid }
        );
      } catch (err: any) {
        handleFirestoreError(err);
      }
    }
    setActiveTab('dashboard');
    setIsFirmActive(true);
  };

  const handleUpdateProfile = (updatedProfile: JewellerProfile) => {
    setProfiles(prev => {
      const next = prev.map(p => p.id === updatedProfile.id ? updatedProfile : p);
      saveLocalFirmProfiles(next);
      return next;
    });
    if (updatedProfile.id === activeProfileId) {
      setShopDetails(prev => {
        const nextShop = {
          ...prev,
          name: updatedProfile.name,
          gstin: updatedProfile.gstin,
          phone: updatedProfile.phone,
          logoUrl: updatedProfile.logoUrl || ''
        };
        saveLocalShopDetails(activeProfileId, nextShop);
        return nextShop;
      });
    }
    if (hasCloudSupport && currentUserId) {
      updateFirmMetaByMaster(updatedProfile.id, {
        name: updatedProfile.name,
        counterName: updatedProfile.counterName,
        counterType: updatedProfile.counterType,
        operatorName: updatedProfile.operatorName,
        gstin: updatedProfile.gstin,
        phone: updatedProfile.phone,
        logoUrl: updatedProfile.logoUrl || ''
      }).catch((err) => handleFirestoreError(err));
    }
  };

  // Gemstone Handlers
  const handleAddGemstone = (newGem: CertifiedGemstone) => {
    const tagged = { ...newGem, firmId: activeProfileId };
    persistFirmDoc('gemstones', tagged);
  };

  const handleUpdateGemstone = (updatedGem: CertifiedGemstone) => {
    const tagged = { ...updatedGem, firmId: activeProfileId };
    persistFirmDoc('gemstones', tagged);
  };

  const handleDeleteGemstone = (id: string) => {
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
    persistFirmDoc('customers', tagged);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    const tagged = { ...updatedCust, firmId: activeProfileId };
    persistFirmDoc('customers', tagged);
  };

  const handleDeleteCustomer = (id: string) => {
    removeFirmDoc('customers', id);
  };

  // Sales Invoice Creation (Device-First: Stored locally in Device Invoice Folder without requiring Firebase server sync)
  const handleCreateInvoice = async (
    invoiceDraft: Omit<GSTInvoice, 'id' | 'invoiceNumber'>,
    prefix: string = 'SMJ'
  ): Promise<GSTInvoice | undefined> => {
    if (!activeProfileId) {
      throw new Error('कोई फर्म सक्रिय नहीं है। कृपया पहले अपनी फर्म चुनें या रजिस्टर करें।');
    }

    const series = invoiceDraft.invoiceType || 'GST_INVOICE';
    const sanitizedDraft = sanitizeInvoicePayload(invoiceDraft, 'invoiceDraft');
    const { invoiceNumber } = allocateNextDeviceInvoiceNumber(
      activeProfileId,
      series,
      prefix,
      invoices
    );

    const createdInvoice: GSTInvoice = sanitizeInvoicePayload(
      {
        ...sanitizedDraft,
        id: isDemoUser ? `demo-inv-${Date.now()}` : `local-inv-${Date.now()}`,
        series,
        invoiceType: series,
        invoiceNumber,
        firmId: activeProfileId
      },
      'createdInvoice'
    );

    // 1. Update local inventory & customer ledger state + local storage immediately
    const updatedInventoryItems: JewelleryItem[] = [];
    setInventory(prev => {
      const next = prev.map(it => {
        const soldQty = sanitizedDraft.items
          .filter(c => c.itemId === it.id)
          .reduce((s, c) => s + (c.quantity || 1), 0);
        if (soldQty > 0) {
          const nextItem = { ...it, quantity: Math.max(0, it.quantity - soldQty) };
          updatedInventoryItems.push(nextItem);
          return nextItem;
        }
        return it;
      });
      replaceLocalFirmCollection(activeProfileId, 'inventory', next);
      return next;
    });

    let updatedCustomer: Customer | null = null;
    if (sanitizedDraft.customerId && sanitizedDraft.customerId !== 'walkin') {
      setCustomers(prev => {
        const next = prev.map(c => {
          if (c.id === sanitizedDraft.customerId) {
            const nextCust: Customer = {
              ...c,
              totalPurchases: (Number(c.totalPurchases) || 0) + (Number(sanitizedDraft.grandTotal) || 0),
              outstandingBalance:
                (Number(c.outstandingBalance) || 0) + (Number(sanitizedDraft.payment?.dueAmount) || 0)
            };
            updatedCustomer = nextCust;
            return nextCust;
          }
          return c;
        });
        replaceLocalFirmCollection(activeProfileId, 'customers', next);
        return next;
      });
    }

    // 2. Save invoice locally on the device (and linked device Invoices folder if configured)
    setInvoices(prev => [createdInvoice, ...prev.filter(i => i.id !== createdInvoice.id)]);
    saveLocalDeviceInvoice(activeProfileId, createdInvoice);
    const htmlSnapshot = buildStandaloneInvoiceHtmlDocument(
      createdInvoice,
      shopDetails,
      activeProfile?.logoUrl || shopDetails.logoUrl
    );
    writeInvoiceToConnectedFolder(activeProfileId, createdInvoice, htmlSnapshot).catch(() => {});

    // 3. Best-effort silent background stock/customer sync when signed in & online
    if (hasCloudSupport && currentUserId && navigator.onLine && isFirmRootReady) {
      updatedInventoryItems.forEach((item) => {
        saveFirmDoc(activeProfileId, 'inventory', { id: item.id, quantity: item.quantity }, {
          uid: currentUserId
        }).catch(() => {});
      });
      if (updatedCustomer) {
        const c: Customer = updatedCustomer;
        saveFirmDoc(
          activeProfileId,
          'customers',
          { id: c.id, totalPurchases: c.totalPurchases, outstandingBalance: c.outstandingBalance },
          { uid: currentUserId }
        ).catch(() => {});
      }
    }

    setLastSyncedAt(Date.now());
    setLastSyncEventLabel(`Invoice ${createdInvoice.invoiceNumber} saved on device`);
    setPrintingInvoices([createdInvoice]);
    return createdInvoice;
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
    setInvoices(prev => prev.map(i => i.id === id ? updated : i));
    saveLocalDeviceInvoice(activeProfileId, updated);
    if (hasCloudSupport && currentUserId && !id.startsWith('local-inv-') && !id.startsWith('demo-inv-') && navigator.onLine && isFirmRootReady) {
      persistFirmDoc('invoices', updated);
    }
  };

  // Inward Purchase Creation
  const handleAddPurchase = async (
    newPurchase: PurchaseInvoice,
    stockItemsToInsert: JewelleryItem[],
    vendorSnapshot?: Vendor
  ) => {
    if (!activeProfileId) {
      throw new Error('कोई फर्म सक्रिय नहीं है। कृपया पहले अपनी फर्म चुनें।');
    }

    const taggedPurchase = sanitizeInvoicePayload({ ...newPurchase, firmId: activeProfileId }, 'purchase');
    const taggedItems = stockItemsToInsert.map(it =>
      sanitizeInvoicePayload({ ...it, firmId: activeProfileId }, `stock.${it.id}`)
    );
    const vendor = vendors.find(v => v.id === newPurchase.vendorId) || vendorSnapshot;

    // Persist purchase, updated vendor, and stock items locally immediately
    setPurchases(prev => {
      const next = [taggedPurchase, ...prev.filter(p => p.id !== taggedPurchase.id)];
      replaceLocalFirmCollection(activeProfileId, 'purchases', next);
      return next;
    });
    saveLocalDevicePurchase(activeProfileId, taggedPurchase);

    if (vendor) {
      const updatedVendor: Vendor = {
        ...vendor,
        firmId: activeProfileId,
        cashBalanceDue: (Number(vendor.cashBalanceDue) || 0) + (Number(taggedPurchase.balanceDue) || 0),
        totalPurchasesAmount: (Number(vendor.totalPurchasesAmount) || 0) + (Number(taggedPurchase.grandTotal) || 0)
      };
      saveLocalFirmCollectionDoc(activeProfileId, 'vendors', updatedVendor);
      setVendors(prev => {
        const exists = prev.some(v => v.id === vendor.id);
        return exists ? prev.map(v => (v.id === vendor.id ? updatedVendor : v)) : [updatedVendor, ...prev];
      });
    }

    if (taggedItems.length > 0) {
      taggedItems.forEach(it => saveLocalFirmCollectionDoc(activeProfileId, 'inventory', it));
      setInventory(prev => {
        const existingIds = new Set(prev.map(i => i.id));
        const fresh = taggedItems.filter(it => !existingIds.has(it.id));
        return [...fresh, ...prev];
      });
    }

    if (!hasCloudSupport || !currentUserId || !isFirmRootReady || !navigator.onLine) {
      setLastSyncedAt(Date.now());
      setLastSyncEventLabel('Purchase & stock saved on device');
      return;
    }

    beginSyncWrite('Saving purchase...');
    try {
      await createPurchaseAtomic(activeProfileId, taggedPurchase, taggedItems, vendor, {
        uid: currentUserId
      });
      endSyncWrite('Purchase & stock synced', true);
    } catch (err: any) {
      endSyncWrite('Purchase saved locally', false);
      console.warn('[App] createPurchaseAtomic failed, keeping local state & retrying individual doc saves:', err);
      try {
        await saveFirmDoc(activeProfileId, 'purchases', taggedPurchase, { uid: currentUserId });
        for (const it of taggedItems) {
          await saveFirmDoc(activeProfileId, 'inventory', it, { uid: currentUserId });
        }
        if (vendor) {
          await saveFirmDoc(
            activeProfileId,
            'vendors',
            {
              ...vendor,
              firmId: activeProfileId,
              cashBalanceDue: (Number(vendor.cashBalanceDue) || 0) + (Number(taggedPurchase.balanceDue) || 0),
              totalPurchasesAmount: (Number(vendor.totalPurchasesAmount) || 0) + (Number(taggedPurchase.grandTotal) || 0)
            },
            { uid: currentUserId }
          );
        }
      } catch (fallbackErr) {
        console.warn('[App] Fallback purchase save failed; kept locally on device:', fallbackErr);
      }
    }
  };

  // Vendors Handlers
  const handleAddVendor = (newVendor: Vendor) => {
    const tagged = { ...newVendor, firmId: activeProfileId };
    persistFirmDoc('vendors', tagged);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    const tagged = { ...updatedVendor, firmId: activeProfileId };
    persistFirmDoc('vendors', tagged);
  };

  const handleDeleteVendor = (id: string) => {
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
      persistFirmDoc('vendors', updated);
    }
  };

  // Expenses Handlers
  const handleAddExpense = (newExpense: ShopExpense) => {
    const tagged = { ...newExpense, firmId: activeProfileId };
    persistFirmDoc('expenses', tagged);
  };

  const handleDeleteExpense = (id: string) => {
    removeFirmDoc('expenses', id);
  };

  // Contra Transfer Handlers
  const handleAddTransfer = (newTransfer: CashBankTransfer) => {
    const tagged = { ...newTransfer, firmId: activeProfileId };
    persistFirmDoc('transfers', tagged);
  };

  // Inventory Handlers
  const handleUpdateInventoryQty = (itemId: string, qtyDeltaOrNewValue: number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item || !activeProfileId) return;
    const newQty = qtyDeltaOrNewValue < 0 ? Math.max(0, item.quantity + qtyDeltaOrNewValue) : qtyDeltaOrNewValue;
    const updated = { ...item, quantity: newQty, firmId: activeProfileId };
    persistFirmDoc('inventory', updated);
  };

  const handleSaveInventoryItem = (item: JewelleryItem) => {
    const tagged = { ...item, firmId: activeProfileId };
    persistFirmDoc('inventory', tagged);
  };

  const handleItemGenerated = (newItem: JewelleryItem) => {
    const tagged = { ...newItem, firmId: activeProfileId };
    persistFirmDoc('inventory', tagged);
  };

  const handleDeleteInventoryItem = (id: string) => {
    removeFirmDoc('inventory', id);
  };

  // Karigar Handlers
  const handleAddJobCard = (card: KarigarJobCard) => {
    if (!activeProfileId) return;
    const tagged = { ...card, firmId: activeProfileId };
    persistFirmDoc('jobcards', tagged);

    const karigar = karigars.find(k => k.id === card.karigarId);
    if (karigar) {
      const updatedK: Karigar = {
        ...karigar,
        goldBalanceGram: card.metal === 'Gold' ? karigar.goldBalanceGram + card.rawMetalIssuedWeight : karigar.goldBalanceGram,
        silverBalanceGram: card.metal === 'Silver' ? karigar.silverBalanceGram + card.rawMetalIssuedWeight : karigar.silverBalanceGram,
        activeJobsCount: karigar.activeJobsCount + 1,
      };
      persistFirmDoc('karigars', updatedK);
    }
  };

  const handleUpdateJobCard = (updatedCard: KarigarJobCard) => {
    if (!activeProfileId) return;
    const tagged = { ...updatedCard, firmId: activeProfileId };
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
        persistFirmDoc('karigars', updatedK);
      }
    }
  };

  const handleAddKarigar = (newKg: Karigar) => {
    const tagged = { ...newKg, firmId: activeProfileId };
    persistFirmDoc('karigars', tagged);
  };

  // Girvi Handlers
  const handleAddGirviLoan = (newLoan: GirviLoan) => {
    const tagged = { ...newLoan, firmId: activeProfileId };
    persistFirmDoc('girvi', tagged);
  };

  const handleUpdateGirviLoan = (updatedLoan: GirviLoan) => {
    const tagged = { ...updatedLoan, firmId: activeProfileId };
    persistFirmDoc('girvi', tagged);
  };

  const handleRegisterFirmFromScreen = async (newProfile: JewellerProfile, shopUpdate?: Partial<ShopDetails>): Promise<string | void> => {
    const uid = getEffectiveUserId();
    const newFirmId = newProfile.id;
    newProfile.firmId = newFirmId;
    newProfile.userId = uid;
    newProfile.ownerUid = uid || newProfile.ownerUid;

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

    if (hasCloudSupport && uid) {
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
            operatorName: newProfile.operatorName,
            logoUrl: newProfile.logoUrl || undefined
          },
          { uid }
        );
      } catch (err: any) {
        handleFirestoreError(err);
        return `फर्म रजिस्ट्रेशन त्रुटि: ${err?.message || err}`;
      }

      try {
        await saveFirmDoc(newFirmId, 'shop_details', { id: 'main', ...newShopDetails }, { uid });
      } catch (err: any) {
        console.warn('Initial shop_details write deferred:', err);
      }
    }

    saveLocalShopDetails(newFirmId, newShopDetails);
    const updatedProfiles = [newProfile, ...profiles];
    setProfiles(updatedProfiles);
    saveLocalFirmProfiles(updatedProfiles);
    setActiveLocalFirmId(newFirmId);
    if (uid && uid !== 'demo') {
      localStorage.setItem(`jewel_user_${uid}_profiles`, JSON.stringify(updatedProfiles));
      localStorage.setItem(`jewel_user_${uid}_active_profile`, newFirmId);
      localStorage.setItem(`jewel_user_${uid}_firm_confirmed`, 'true');
    }

    setSyncError(null);
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

    setIsFirmRootReady(Boolean(hasCloudSupport && uid));
    setActiveTab('dashboard');
    setIsFirmActive(true);
  };

  const handleSelectExistingFirmFromScreen = (firmId: string) => {
    const uid = getEffectiveUserId();
    setSyncError(null);
    setActiveProfileId(firmId);
    setActiveLocalFirmId(firmId);
    setActiveTab('dashboard');
    setIsFirmActive(true);
    if (uid && uid !== 'demo') {
      localStorage.setItem(`jewel_user_${uid}_firm_confirmed`, 'true');
      localStorage.setItem(`jewel_user_${uid}_active_profile`, firmId);
    }
  };

  const handleDeleteFirm = (firmIdToDelete: string) => {
    const uid = getEffectiveUserId();
    const filtered = profiles.filter(p => p.id !== firmIdToDelete);
    const updatedProfiles = filtered.length > 0 ? filtered : [{ ...DEFAULT_LOCAL_FIRM_PROFILE }];
    setProfiles(updatedProfiles);
    saveLocalFirmProfiles(updatedProfiles);
    if (uid && uid !== 'demo') {
      localStorage.setItem(`jewel_user_${uid}_profiles`, JSON.stringify(updatedProfiles));
    }

    if (activeProfileId === firmIdToDelete) {
      const nextId = updatedProfiles[0].id;
      setActiveProfileId(nextId);
      setActiveLocalFirmId(nextId);
    }
  };

  if (!isFirmActive) {
    return (
      <FirmRegistrationScreen
        existingFirms={profiles}
        initialFirmName={userAccess?.firmName || ''}
        initialOwnerName={userAccess?.displayName || ''}
        initialPhone={userAccess?.phone || ''}
        userEmail={auth?.currentUser?.email || userAccess?.email}
        accountStatus="active"
        syncError={syncError}
        onRetryLoad={() => {
          setSyncError(null);
          setUserAccessRefreshNonce(n => n + 1);
        }}
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
      />

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
          userAccess={activeUserAccess}
          effectivePermissions={effectivePermissions}
        />

        {/* Right Main Screen Viewport */}
        <main className="flex-1 min-w-0 overflow-y-auto px-2.5 sm:px-5 lg:px-7 py-3 sm:py-5 max-w-full">
        
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
            canCreateInvoice={true}
            userRole="owner"
            userStatus="active"
            currentUserId={currentUserId}
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
                persistFirmDoc('inventory', tagged);
              }
              setActiveTab('pos');
            }}
            onPrintTag={(gemItem) => {
              const tagged = { ...gemItem, firmId: activeProfileId };
              if (!inventory.some(i => i.id === tagged.id)) {
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
            shopDetails={shopDetails}
            firmId={activeProfileId}
            customLogo={activeProfile?.logoUrl || shopDetails.logoUrl}
            onViewPrintInvoice={(inv) => setPrintingInvoices([inv])}
            onBatchPrintInvoices={(invs) => setPrintingInvoices(invs)}
            onDeleteInvoice={handleDeleteInvoice}
            canCancelInvoice={true}
            onCancelInvoice={async (inv, reason) => {
              const cancelledInv: GSTInvoice = {
                ...inv,
                status: 'Cancelled',
                cancelReason: reason,
                cancelledBy: shopDetails.name || 'Owner',
                cancelledAt: getISTDate().isoDateStr
              };

              const updateLocalCancelled = () => {
                setInvoices(prev => prev.map(i => (i.id === inv.id ? cancelledInv : i)));
                saveLocalDeviceInvoice(activeProfileId, cancelledInv);
                setInventory(prev => {
                  const next = prev.map(it => {
                    const restoreQty = inv.items
                      .filter(c => c.itemId === it.id)
                      .reduce((s, c) => s + (c.quantity || 1), 0);
                    return restoreQty > 0 ? { ...it, quantity: it.quantity + restoreQty } : it;
                  });
                  replaceLocalFirmCollection(activeProfileId, 'inventory', next);
                  return next;
                });
              };

              if (!hasCloudSupport || !currentUserId || inv.id.startsWith('local-inv-') || inv.id.startsWith('demo-inv-') || !navigator.onLine || !isFirmRootReady) {
                updateLocalCancelled();
                return;
              }

              beginSyncWrite('Cancelling invoice...');
              try {
                await cancelInvoiceAtomic(activeProfileId, inv, reason, shopDetails.name || 'Owner', {
                  uid: currentUserId
                });
                updateLocalCancelled();
                endSyncWrite(`Invoice ${inv.invoiceNumber} cancelled`, true);
              } catch (err: any) {
                updateLocalCancelled();
                endSyncWrite(`Invoice ${inv.invoiceNumber} cancelled locally`, true);
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
        canManageStaff={Boolean(hasCloudSupport && currentUserId && (activeProfile?.ownerUid === currentUserId || !activeProfile?.ownerUid))}
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
          if (activeProfileId) {
            setProfiles(prev => {
              const next = prev.map(p =>
                p.id === activeProfileId
                  ? { ...p, logoUrl: updated.logoUrl || undefined }
                  : p
              );
              saveLocalFirmProfiles(next);
              return next;
            });
            if (hasCloudSupport && currentUserId) {
              updateFirmMetaByMaster(activeProfileId, {
                logoUrl: updated.logoUrl || ''
              }).catch(() => {});
            }
          }
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
        firmId={activeProfileId}
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
