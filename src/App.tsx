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
import { Header } from './components/Header';
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
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Firm onboarding & selection state
  const [isFirmActive, setIsFirmActive] = useState<boolean>(() => {
    return localStorage.getItem('jewel_firm_confirmed') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);
  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const saved = localStorage.getItem('jewel_active_profile');
    return saved || 'prof-main';
  });

  const getFirmStorageKey = (firmId: string, col: string) => `jewel_firm_${firmId}_${col}`;

  const getFirmCollectionData = <T,>(firmId: string, col: string, legacyKey?: string, defaultData: T[] = []): T[] => {
    if (!firmId) return [];
    const scopedKey = getFirmStorageKey(firmId, col);
    const saved = localStorage.getItem(scopedKey);
    if (saved !== null) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return defaultData;
      }
    }
    if ((firmId === 'prof-main' || firmId === 'firm-main') && legacyKey) {
      const legacySaved = localStorage.getItem(legacyKey);
      if (legacySaved !== null) {
        try {
          return JSON.parse(legacySaved);
        } catch (e) {
          return defaultData;
        }
      }
      return defaultData;
    }
    return [];
  };

  const [shopDetails, setShopDetails] = useState<ShopDetails>(() => {
    const saved = localStorage.getItem(`jewel_firm_${activeProfileId}_shop_details`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    if (activeProfileId === 'prof-main' || activeProfileId === 'firm-main') {
      const oldSaved = localStorage.getItem('jewel_shop_details_v2');
      if (oldSaved) {
        try { return JSON.parse(oldSaved); } catch (e) {}
      }
      return initialShopDetails;
    }
    return {
      firmId: activeProfileId,
      name: 'Swarnkar Jewellery Shop',
      tagline: 'सराफा एवं आभूषण विक्रेता',
      address: '',
      cityStatePincode: '',
      phone: '',
      email: '',
      gstin: 'URP-UNREGISTERED',
      bisHallmarkRegNo: '',
      panNo: '',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      terms: ['बिक्री पर 3% GST लागू है।', 'हॉलमार्क आभूषण की शुद्धता की 100% गारंटी है।'],
      logoUrl: undefined
    };
  });

  const [profiles, setProfiles] = useState<JewellerProfile[]>(() => {
    const saved = localStorage.getItem('jewel_profiles');
    return saved ? JSON.parse(saved) : initialProfiles;
  });

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

  const [inventory, setInventory] = useState<JewelleryItem[]>(() =>
    getFirmCollectionData(activeProfileId, 'inventory', 'jewel_inventory', activeProfileId === 'prof-main' ? initialInventory : [])
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    getFirmCollectionData(activeProfileId, 'customers', 'jewel_customers', activeProfileId === 'prof-main' ? initialCustomers : [])
  );

  const [invoices, setInvoices] = useState<GSTInvoice[]>(() =>
    getFirmCollectionData(activeProfileId, 'invoices', 'jewel_invoices', activeProfileId === 'prof-main' ? initialInvoices : [])
  );

  const [vendors, setVendors] = useState<Vendor[]>(() =>
    getFirmCollectionData(activeProfileId, 'vendors', 'jewel_vendors', activeProfileId === 'prof-main' ? initialVendors : [])
  );

  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() =>
    getFirmCollectionData(activeProfileId, 'purchases', 'jewel_purchases', activeProfileId === 'prof-main' ? initialPurchases : [])
  );

  const [expenses, setExpenses] = useState<ShopExpense[]>(() =>
    getFirmCollectionData(activeProfileId, 'expenses', 'jewel_expenses', activeProfileId === 'prof-main' ? initialExpenses : [])
  );

  const [transfers, setTransfers] = useState<CashBankTransfer[]>(() =>
    getFirmCollectionData(activeProfileId, 'transfers', 'jewel_transfers', activeProfileId === 'prof-main' ? initialTransfers : [])
  );

  const [karigars, setKarigars] = useState<Karigar[]>(() =>
    getFirmCollectionData(activeProfileId, 'karigars', 'jewel_karigars', activeProfileId === 'prof-main' ? initialKarigars : [])
  );

  const [jobCards, setJobCards] = useState<KarigarJobCard[]>(() =>
    getFirmCollectionData(activeProfileId, 'jobcards', 'jewel_jobcards', activeProfileId === 'prof-main' ? initialKarigarJobCards : [])
  );

  const [girviLoans, setGirviLoans] = useState<GirviLoan[]>(() =>
    getFirmCollectionData(activeProfileId, 'girvi', 'jewel_girvi', activeProfileId === 'prof-main' ? initialGirviLoans : [])
  );

  const [gemstones, setGemstones] = useState<CertifiedGemstone[]>(() =>
    getFirmCollectionData(activeProfileId, 'gemstones', 'jewel_gemstones_v1', activeProfileId === 'prof-main' ? initialGemstones : [])
  );

  const [gemstoneRates, setGemstoneRates] = useState<GemstoneRate[]>(() => {
    const saved = localStorage.getItem('jewel_gemstone_rates_v1');
    return saved ? JSON.parse(saved) : initialGemstoneRates;
  });

  // Reload collection state whenever active profile/firm changes
  useEffect(() => {
    if (activeProfileId) {
      setInventory(getFirmCollectionData(activeProfileId, 'inventory', 'jewel_inventory', activeProfileId === 'prof-main' ? initialInventory : []));
      setCustomers(getFirmCollectionData(activeProfileId, 'customers', 'jewel_customers', activeProfileId === 'prof-main' ? initialCustomers : []));
      setInvoices(getFirmCollectionData(activeProfileId, 'invoices', 'jewel_invoices', activeProfileId === 'prof-main' ? initialInvoices : []));
      setVendors(getFirmCollectionData(activeProfileId, 'vendors', 'jewel_vendors', activeProfileId === 'prof-main' ? initialVendors : []));
      setPurchases(getFirmCollectionData(activeProfileId, 'purchases', 'jewel_purchases', activeProfileId === 'prof-main' ? initialPurchases : []));
      setExpenses(getFirmCollectionData(activeProfileId, 'expenses', 'jewel_expenses', activeProfileId === 'prof-main' ? initialExpenses : []));
      setTransfers(getFirmCollectionData(activeProfileId, 'transfers', 'jewel_transfers', activeProfileId === 'prof-main' ? initialTransfers : []));
      setKarigars(getFirmCollectionData(activeProfileId, 'karigars', 'jewel_karigars', activeProfileId === 'prof-main' ? initialKarigars : []));
      setJobCards(getFirmCollectionData(activeProfileId, 'jobcards', 'jewel_jobcards', activeProfileId === 'prof-main' ? initialKarigarJobCards : []));
      setGirviLoans(getFirmCollectionData(activeProfileId, 'girvi', 'jewel_girvi', activeProfileId === 'prof-main' ? initialGirviLoans : []));
      setGemstones(getFirmCollectionData(activeProfileId, 'gemstones', 'jewel_gemstones_v1', activeProfileId === 'prof-main' ? initialGemstones : []));

      const savedShop = localStorage.getItem(getFirmStorageKey(activeProfileId, 'shop_details'));
      if (savedShop) {
        try { setShopDetails(JSON.parse(savedShop)); } catch (e) {}
      } else if (activeProfileId !== 'prof-main' && activeProfileId !== 'firm-main') {
        const firmProf = profiles.find(p => p.id === activeProfileId);
        setShopDetails({
          firmId: activeProfileId,
          name: firmProf?.name || 'Swarnkar Jewellery Shop',
          tagline: 'सराफा एवं आभूषण विक्रेता',
          address: '',
          cityStatePincode: '',
          phone: firmProf?.phone || '',
          email: '',
          gstin: firmProf?.gstin || 'URP-UNREGISTERED',
          bisHallmarkRegNo: '',
          panNo: '',
          bankName: '',
          accountNo: '',
          ifscCode: '',
          terms: ['बिक्री पर 3% GST लागू है।', 'हॉलमार्क आभूषण की शुद्धता की 100% गारंटी है।'],
          logoUrl: firmProf?.logoUrl || undefined
        });
      }
    }
  }, [activeProfileId]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Left Sidebar Collapse & Mobile Drawer State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('jewel_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Modals state
  const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [isStockAlertsModalOpen, setIsStockAlertsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isQuickGenerateOpen, setIsQuickGenerateOpen] = useState(false);
  
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelleryItem | null>(null);

  const [printingInvoice, setPrintingInvoice] = useState<GSTInvoice | null>(null);

  // Sync to LocalStorage on state change (Firm Scoped)
  useEffect(() => {
    localStorage.setItem('jewel_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'shop_details'), JSON.stringify(shopDetails));
    }
  }, [shopDetails, activeProfileId]);

  useEffect(() => {
    localStorage.setItem('jewel_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('jewel_active_profile', activeProfileId);
  }, [activeProfileId]);

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
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'inventory'), JSON.stringify(inventory));
    }
  }, [inventory, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'customers'), JSON.stringify(customers));
    }
  }, [customers, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'invoices'), JSON.stringify(invoices));
    }
  }, [invoices, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'vendors'), JSON.stringify(vendors));
    }
  }, [vendors, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'purchases'), JSON.stringify(purchases));
    }
  }, [purchases, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'expenses'), JSON.stringify(expenses));
    }
  }, [expenses, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'transfers'), JSON.stringify(transfers));
    }
  }, [transfers, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'karigars'), JSON.stringify(karigars));
    }
  }, [karigars, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'jobcards'), JSON.stringify(jobCards));
    }
  }, [jobCards, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'girvi'), JSON.stringify(girviLoans));
    }
  }, [girviLoans, activeProfileId]);

  useEffect(() => {
    if (activeProfileId) {
      localStorage.setItem(getFirmStorageKey(activeProfileId, 'gemstones'), JSON.stringify(gemstones));
    }
  }, [gemstones, activeProfileId]);

  useEffect(() => {
    localStorage.setItem('jewel_gemstone_rates_v1', JSON.stringify(gemstoneRates));
  }, [gemstoneRates]);

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

  const handleAddProfile = (newProfile: JewellerProfile) => {
    setProfiles(prev => [...prev, newProfile]);
  };

  const handleUpdateProfile = (updatedProfile: JewellerProfile) => {
    setProfiles(prev => prev.map(p => p.id === updatedProfile.id ? updatedProfile : p));
  };

  // Gemstone Handlers
  const handleAddGemstone = (newGem: CertifiedGemstone) => {
    const tagged = { ...newGem, firmId: activeProfileId };
    setGemstones(prev => [tagged, ...prev]);
  };

  const handleUpdateGemstone = (updatedGem: CertifiedGemstone) => {
    setGemstones(prev => prev.map(g => g.id === updatedGem.id ? { ...updatedGem, firmId: activeProfileId } : g));
  };

  const handleDeleteGemstone = (id: string) => {
    setGemstones(prev => prev.filter(g => g.id !== id));
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
    setCustomers(prev => [tagged, ...prev]);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? { ...updatedCust, firmId: activeProfileId } : c));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // Sales Invoice Creation
  const handleCreateInvoice = (newInvoice: GSTInvoice) => {
    const tagged = { ...newInvoice, firmId: activeProfileId };
    setInvoices(prev => [tagged, ...prev]);
    
    // Update customer total purchases & outstanding dues ledger
    setCustomers(prev => prev.map(c => {
      if (c.id === newInvoice.customerId) {
        return {
          ...c,
          totalPurchases: c.totalPurchases + newInvoice.grandTotal,
          outstandingBalance: c.outstandingBalance + newInvoice.payment.dueAmount
        };
      }
      return c;
    }));

    // Auto open print modal for generated invoice!
    setPrintingInvoice(tagged);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const handleUpdateInvoiceStatus = (id: string, newTotalPaid: number) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        const due = Math.max(0, inv.grandTotal - newTotalPaid);
        const status = due === 0 ? 'Paid' : newTotalPaid > 0 ? 'Partial' : 'Unpaid';
        return {
          ...inv,
          payment: {
            ...inv.payment,
            amountPaid: newTotalPaid,
            dueAmount: due
          },
          status
        };
      }
      return inv;
    }));
  };

  // Inward Purchase Creation
  const handleAddPurchase = (newPurchase: PurchaseInvoice, stockItemsToInsert: JewelleryItem[]) => {
    const taggedPurchase = { ...newPurchase, firmId: activeProfileId };
    setPurchases(prev => [taggedPurchase, ...prev]);

    // Update vendor dues & purchases count
    setVendors(prev => prev.map(v => {
      if (v.id === newPurchase.vendorId) {
        return {
          ...v,
          cashBalanceDue: v.cashBalanceDue + newPurchase.balanceDue,
          totalPurchasesAmount: v.totalPurchasesAmount + newPurchase.grandTotal
        };
      }
      return v;
    }));

    // If stock items were marked for insertion, add them directly to inventory!
    if (stockItemsToInsert.length > 0) {
      const taggedItems = stockItemsToInsert.map(i => ({ ...i, firmId: activeProfileId }));
      setInventory(prev => [...taggedItems, ...prev]);
    }
  };

  // Vendors Handlers
  const handleAddVendor = (newVendor: Vendor) => {
    const tagged = { ...newVendor, firmId: activeProfileId };
    setVendors(prev => [tagged, ...prev]);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    setVendors(prev => prev.map(v => v.id === updatedVendor.id ? { ...updatedVendor, firmId: activeProfileId } : v));
  };

  const handleDeleteVendor = (id: string) => {
    setVendors(prev => prev.filter(v => v.id !== id));
  };

  const handleUpdateVendorBalance = (vendorId: string, cashDelta: number, goldDelta: number) => {
    setVendors(prev => prev.map(v => {
      if (v.id === vendorId) {
        return {
          ...v,
          cashBalanceDue: Math.max(0, v.cashBalanceDue + cashDelta),
          goldBalanceOwed: Math.max(0, v.goldBalanceOwed + goldDelta)
        };
      }
      return v;
    }));
  };

  // Expenses Handlers
  const handleAddExpense = (newExpense: ShopExpense) => {
    const tagged = { ...newExpense, firmId: activeProfileId };
    setExpenses(prev => [tagged, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Contra Transfer Handlers
  const handleAddTransfer = (newTransfer: CashBankTransfer) => {
    const tagged = { ...newTransfer, firmId: activeProfileId };
    setTransfers(prev => [tagged, ...prev]);
  };

  // Inventory Handlers
  const handleUpdateInventoryQty = (itemId: string, qtyDeltaOrNewValue: number) => {
    setInventory(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = qtyDeltaOrNewValue < 0 ? Math.max(0, item.quantity + qtyDeltaOrNewValue) : qtyDeltaOrNewValue;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleSaveInventoryItem = (item: JewelleryItem) => {
    const tagged = { ...item, firmId: activeProfileId };
    setInventory(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? tagged : i);
      }
      return [tagged, ...prev];
    });
  };

  const handleItemGenerated = (newItem: JewelleryItem) => {
    const tagged = { ...newItem, firmId: activeProfileId };
    setInventory(prev => [tagged, ...prev]);
  };

  const handleDeleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  // Karigar Handlers
  const handleAddJobCard = (card: KarigarJobCard) => {
    const tagged = { ...card, firmId: activeProfileId };
    setJobCards(prev => [tagged, ...prev]);
    setKarigars(prev => prev.map(k => {
      if (k.id === card.karigarId) {
        return {
          ...k,
          goldBalanceGram: card.metal === 'Gold' ? k.goldBalanceGram + card.rawMetalIssuedWeight : k.goldBalanceGram,
          silverBalanceGram: card.metal === 'Silver' ? k.silverBalanceGram + card.rawMetalIssuedWeight : k.silverBalanceGram,
          activeJobsCount: k.activeJobsCount + 1,
        };
      }
      return k;
    }));
  };

  const handleUpdateJobCard = (updatedCard: KarigarJobCard) => {
    setJobCards(prev => prev.map(c => c.id === updatedCard.id ? { ...updatedCard, firmId: activeProfileId } : c));
    if (updatedCard.status === 'Received') {
      setKarigars(prev => prev.map(k => {
        if (k.id === updatedCard.karigarId) {
          const goldRet = updatedCard.metal === 'Gold' ? (updatedCard.finishedOrnamentWeight || 0) : 0;
          return {
            ...k,
            goldBalanceGram: Math.max(0, k.goldBalanceGram - goldRet),
            activeJobsCount: Math.max(0, k.activeJobsCount - 1),
          };
        }
        return k;
      }));
    }
  };

  const handleAddKarigar = (newKg: Karigar) => {
    const tagged = { ...newKg, firmId: activeProfileId };
    setKarigars(prev => [...prev, tagged]);
  };

  // Girvi Handlers
  const handleAddGirviLoan = (newLoan: GirviLoan) => {
    const tagged = { ...newLoan, firmId: activeProfileId };
    setGirviLoans(prev => [tagged, ...prev]);
  };

  const handleUpdateGirviLoan = (updatedLoan: GirviLoan) => {
    setGirviLoans(prev => prev.map(l => l.id === updatedLoan.id ? { ...updatedLoan, firmId: activeProfileId } : l));
  };

  const handleRegisterFirmFromScreen = (newProfile: JewellerProfile, shopUpdate?: Partial<ShopDetails>) => {
    const newFirmId = newProfile.id;
    newProfile.firmId = newFirmId;

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

    // Store empty array defaults for the new firm
    localStorage.setItem(getFirmStorageKey(newFirmId, 'inventory'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'customers'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'invoices'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'vendors'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'purchases'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'expenses'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'transfers'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'karigars'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'jobcards'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'girvi'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'gemstones'), JSON.stringify([]));
    localStorage.setItem(getFirmStorageKey(newFirmId, 'shop_details'), JSON.stringify(newShopDetails));

    setProfiles(prev => [newProfile, ...prev]);
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
    localStorage.setItem('jewel_firm_confirmed', 'true');
    localStorage.setItem('jewel_active_profile', newFirmId);
  };

  const handleSelectExistingFirmFromScreen = (firmId: string) => {
    setActiveProfileId(firmId);
    setIsFirmActive(true);
    localStorage.setItem('jewel_firm_confirmed', 'true');
    localStorage.setItem('jewel_active_profile', firmId);
  };

  const handleLogout = () => {
    setIsFirmActive(false);
    setActiveProfileId('');
    localStorage.removeItem('jewel_firm_confirmed');
    localStorage.removeItem('jewel_active_profile');
    
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
    const updatedProfiles = profiles.filter(p => p.id !== firmIdToDelete);
    setProfiles(updatedProfiles);
    localStorage.setItem('jewel_profiles', JSON.stringify(updatedProfiles));

    // Clear local storage keys for this firm
    const collections = ['shop_details', 'inventory', 'customers', 'invoices', 'vendors', 'purchases', 'expenses', 'transfers', 'karigars', 'jobcards', 'girvi', 'gemstones'];
    collections.forEach(col => {
      localStorage.removeItem(getFirmStorageKey(firmIdToDelete, col));
    });

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
        onLogin={(firmProfile, shopUpdate) => {
          if (firmProfile) {
            handleRegisterFirmFromScreen(firmProfile, shopUpdate);
          }
          setIsAuthenticated(true);
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
    <div className="min-h-screen bg-stone-50 text-slate-900 font-sans flex flex-col selection:bg-amber-500 selection:text-white">
      
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
      />

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
        <main className="flex-1 min-w-0 overflow-y-auto px-3 sm:px-6 lg:px-8 py-5">
        
        {/* TAB 0: MMI Softwares Executive Dashboard [F1] */}
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
              setInventory(prev => {
                if (prev.some(i => i.id === gemItem.id)) return prev;
                return [gemItem, ...prev];
              });
              setActiveTab('pos');
            }}
            onPrintTag={(gemItem) => {
              setInventory(prev => {
                if (prev.some(i => i.id === gemItem.id)) return prev;
                return [gemItem, ...prev];
              });
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
            onViewPrintInvoice={(inv) => setPrintingInvoice(inv)}
            onDeleteInvoice={handleDeleteInvoice}
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
        onSaveShopDetails={(updated) => setShopDetails(updated)}
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
        isOpen={!!printingInvoice}
        onClose={() => setPrintingInvoice(null)}
        invoice={printingInvoice}
        shopDetails={shopDetails}
        customLogo={activeProfile?.logoUrl || shopDetails.logoUrl}
      />

    </div>
  );
}
