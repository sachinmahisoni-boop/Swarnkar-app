import React, { useState, useEffect } from 'react';
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
  GemstoneRate
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
import { Login } from './components/Auth/Login';
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
import { auth, missingFirebaseEnvVars, firebaseConfigError } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ensureFirmRootDoc,
  clearFirmRootReady,
  fetchUserFirms,
  checkFirmHasFirestoreData,
  getLegacyLocalStorageData,
  subscribeToFirmCollection,
  subscribeToFirmDoc,
  saveFirmDoc, 
  deleteFirmDoc, 
  createInvoiceAtomic, 
  cancelInvoiceAtomic,
  createPurchaseAtomic,
  FirmDataSnapshot
} from './lib/firestoreSync';
import { getISTDate, formatSequentialNumber } from './lib/invoiceNumber';

export default function App() {
  if (missingFirebaseEnvVars.length > 0) {
    return (
      <FirebaseConfigMissingScreen
        missingVars={missingFirebaseEnvVars}
        errorMsg={firebaseConfigError}
      />
    );
  }

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoUser, setIsDemoUser] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>(() => auth.currentUser?.uid || '');

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

        const localProfs = getUserProfiles(user.uid);
        let mergedProfs = [...localProfs];

        try {
          const cloudProfs = await fetchUserFirms(user.uid);
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
        } else {
          setActiveProfileId('');
          setIsFirmActive(false);
        }
      } else if (!isDemoUser) {
        clearFirmRootReady();
        setIsFirmRootReady(false);
        setIsAuthenticated(false);
        setCurrentUserId('');
        setProfiles([]);
        setActiveProfileId('');
        setIsFirmActive(false);
      }
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [isDemoUser]);

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
  const [isBackupModalOpen, setIsBackupModalOpen] = useState<boolean>(false);
  const [migrationPrompt, setMigrationPrompt] = useState<{
    firmId: string;
    counts: Record<string, number>;
    totalCount: number;
    snapshot: FirmDataSnapshot;
  } | null>(null);

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
      if (isFirmRootReady && !syncError) {
        setSyncStatus('synced');
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (!syncError) {
        setSyncStatus('offline');
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
  useEffect(() => {
    if (!isAuthenticated || isDemoUser || !activeProfileId || !isFirmActive || !currentUserId) {
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
          { uid: currentUserId }
        );
        if (cancelled) return;

        setIsFirmRootReady(true);
        setIsSynced(true);
        setSyncStatus(navigator.onLine ? 'synced' : 'offline');

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
  }, [isAuthenticated, isDemoUser, activeProfileId, isFirmActive, currentUserId, syncRetryNonce]);

  // Step 2: Firestore Realtime Subscriptions (blocked until firms/{firmId} root doc is ready)
  useEffect(() => {
    if (!activeProfileId || !isFirmRootReady || isDemoUser || !isAuthenticated) return;

    const onSubError = (err: Error) => handleFirestoreError(err);
    const markSynced = () => {
      setIsSynced(true);
      setSyncError(null);
      setSyncStatus(navigator.onLine ? 'synced' : 'offline');
    };

    const unsubs: (() => void)[] = [];

    unsubs.push(subscribeToFirmDoc<ShopDetails>(activeProfileId, 'shop_details', 'main', (docData) => {
      markSynced();
      if (docData) {
        setShopDetails(docData);
      }
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<JewelleryItem>(activeProfileId, 'inventory', (items) => {
      markSynced();
      setInventory(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<Customer>(activeProfileId, 'customers', (items) => {
      markSynced();
      setCustomers(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<GSTInvoice>(activeProfileId, 'invoices', (items) => {
      markSynced();
      setInvoices(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<Vendor>(activeProfileId, 'vendors', (items) => {
      markSynced();
      setVendors(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<PurchaseInvoice>(activeProfileId, 'purchases', (items) => {
      markSynced();
      setPurchases(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<ShopExpense>(activeProfileId, 'expenses', (items) => {
      markSynced();
      setExpenses(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<CashBankTransfer>(activeProfileId, 'transfers', (items) => {
      markSynced();
      setTransfers(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<Karigar>(activeProfileId, 'karigars', (items) => {
      markSynced();
      setKarigars(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<KarigarJobCard>(activeProfileId, 'jobcards', (items) => {
      markSynced();
      setJobCards(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<GirviLoan>(activeProfileId, 'girvi', (items) => {
      markSynced();
      setGirviLoans(items);
    }, onSubError));

    unsubs.push(subscribeToFirmCollection<CertifiedGemstone>(activeProfileId, 'gemstones', (items) => {
      markSynced();
      setGemstones(items);
    }, onSubError));

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [activeProfileId, isFirmRootReady, isDemoUser, isAuthenticated]);

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
    if (isDemoUser || !activeProfileId) return;
    if (!isFirmRootReady) {
      handleFirestoreError(new Error(`फर्म रूट डॉक्यूमेंट (firms/${activeProfileId}) तैयार नहीं है। सेव रोका गया।`));
      return;
    }
    saveFirmDoc(activeProfileId, colName, data).catch(handleFirestoreError);
  };

  const removeFirmDoc = (colName: string, docId: string) => {
    if (isDemoUser || !activeProfileId) return;
    if (!isFirmRootReady) {
      handleFirestoreError(new Error(`फर्म रूट डॉक्यूमेंट (firms/${activeProfileId}) तैयार नहीं है। डिलीट रोका गया।`));
      return;
    }
    deleteFirmDoc(activeProfileId, colName, docId).catch(handleFirestoreError);
  };

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

  // Derived metrics
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0] || initialProfiles[0];
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
    if (isDemoUser) setCustomers(prev => prev.filter(c => c.id !== id));
    removeFirmDoc('customers', id);
  };

  // Sales Invoice Creation
  const handleCreateInvoice = async (
    invoiceDraft: Omit<GSTInvoice, 'id' | 'invoiceNumber'>,
    prefix: string = 'SMJ'
  ): Promise<GSTInvoice | undefined> => {
    if (!activeProfileId) {
      alert('कोई फर्म सक्रिय नहीं है। कृपया पहले अपनी फर्म चुनें या रजिस्टर करें।');
      return;
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

    try {
      const createdInvoice = await createInvoiceAtomic(
        activeProfileId,
        invoiceDraft,
        inventory,
        customers,
        prefix
      );
      setPrintingInvoices([createdInvoice]);
      return createdInvoice;
    } catch (err: any) {
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

    try {
      await createPurchaseAtomic(activeProfileId, taggedPurchase, taggedItems, vendor);
    } catch (err: any) {
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
        onLogin={(firmProfile, shopUpdate, isDemo) => {
          if (isDemo) {
            setIsDemoUser(true);
            setIsAuthenticated(true);
            setCurrentUserId('demo');
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

          setIsAuthenticated(true);
          if (firmProfile) {
            handleRegisterFirmFromScreen(firmProfile, shopUpdate);
          } else {
            const uid = auth.currentUser?.uid || '';
            setCurrentUserId(uid);
            const userProfs = getUserProfiles(uid);
            setProfiles(userProfs);
            if (userProfs.length > 0) {
              setActiveProfileId(userProfs[0].id);
              setIsFirmActive(true);
            } else {
              setActiveProfileId('');
              setIsFirmActive(false);
            }
          }
        }} 
      />
    );
  }

  if (!isFirmActive) {
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
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
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
          onLogout={handleLogout}
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
            onCancelInvoice={async (inv, reason) => {
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

              try {
                // Only call cancelInvoiceAtomic and await it; UI updates from Firestore snapshot
                await cancelInvoiceAtomic(activeProfileId, inv, reason, shopDetails.name || 'Owner');
              } catch (err: any) {
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
