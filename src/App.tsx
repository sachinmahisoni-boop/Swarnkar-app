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
  const [shopDetails, setShopDetails] = useState<ShopDetails>(() => {
    const saved = localStorage.getItem('jewel_shop_details_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    const oldSaved = localStorage.getItem('jewel_shop_details');
    if (oldSaved) {
      try {
        const parsed = JSON.parse(oldSaved);
        return {
          ...parsed,
          address: initialShopDetails.address,
          cityStatePincode: initialShopDetails.cityStatePincode,
          phone: initialShopDetails.phone,
        };
      } catch (e) {
        // fallback
      }
    }
    return initialShopDetails;
  });

  const [profiles, setProfiles] = useState<JewellerProfile[]>(() => {
    const saved = localStorage.getItem('jewel_profiles');
    return saved ? JSON.parse(saved) : initialProfiles;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    const saved = localStorage.getItem('jewel_active_profile');
    return saved || 'prof-main';
  });

  const [selectedCity, setSelectedCity] = useState<string>(() => {
    const saved = localStorage.getItem('jewel_selected_city');
    return saved || defaultCity;
  });

  const [rates, setRates] = useState<MetalRate[]>(() => {
    const saved = localStorage.getItem('jewel_rates_v3');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return initialRates;
  });

  // Dynamic Categories State
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem('jewel_categories');
    return saved ? JSON.parse(saved) : initialCategories;
  });

  const [inventory, setInventory] = useState<JewelleryItem[]>(() => {
    const saved = localStorage.getItem('jewel_inventory');
    return saved ? JSON.parse(saved) : initialInventory;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('jewel_customers');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [invoices, setInvoices] = useState<GSTInvoice[]>(() => {
    const saved = localStorage.getItem('jewel_invoices');
    return saved ? JSON.parse(saved) : initialInvoices;
  });

  // Vendors State
  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem('jewel_vendors');
    return saved ? JSON.parse(saved) : initialVendors;
  });

  // Purchases State
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>(() => {
    const saved = localStorage.getItem('jewel_purchases');
    return saved ? JSON.parse(saved) : initialPurchases;
  });

  // Expenses State
  const [expenses, setExpenses] = useState<ShopExpense[]>(() => {
    const saved = localStorage.getItem('jewel_expenses');
    return saved ? JSON.parse(saved) : initialExpenses;
  });

  // Cash & Bank Contra Transfers
  const [transfers, setTransfers] = useState<CashBankTransfer[]>(() => {
    const saved = localStorage.getItem('jewel_transfers');
    return saved ? JSON.parse(saved) : initialTransfers;
  });

  // Karigar State
  const [karigars, setKarigars] = useState<Karigar[]>(() => {
    const saved = localStorage.getItem('jewel_karigars');
    return saved ? JSON.parse(saved) : initialKarigars;
  });

  const [jobCards, setJobCards] = useState<KarigarJobCard[]>(() => {
    const saved = localStorage.getItem('jewel_jobcards');
    return saved ? JSON.parse(saved) : initialKarigarJobCards;
  });

  // Girvi State
  const [girviLoans, setGirviLoans] = useState<GirviLoan[]>(() => {
    const saved = localStorage.getItem('jewel_girvi');
    return saved ? JSON.parse(saved) : initialGirviLoans;
  });

  // Certified Gemstones & Rates State
  const [gemstones, setGemstones] = useState<CertifiedGemstone[]>(() => {
    const saved = localStorage.getItem('jewel_gemstones_v1');
    return saved ? JSON.parse(saved) : initialGemstones;
  });

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

  // Sync to LocalStorage on state change
  useEffect(() => {
    localStorage.setItem('jewel_sidebar_collapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  useEffect(() => {
    localStorage.setItem('jewel_shop_details_v2', JSON.stringify(shopDetails));
    localStorage.setItem('jewel_shop_details', JSON.stringify(shopDetails));
  }, [shopDetails]);

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
    localStorage.setItem('jewel_rates', JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem('jewel_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('jewel_inventory', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('jewel_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('jewel_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('jewel_vendors', JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem('jewel_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('jewel_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('jewel_transfers', JSON.stringify(transfers));
  }, [transfers]);

  useEffect(() => {
    localStorage.setItem('jewel_karigars', JSON.stringify(karigars));
  }, [karigars]);

  useEffect(() => {
    localStorage.setItem('jewel_jobcards', JSON.stringify(jobCards));
  }, [jobCards]);

  useEffect(() => {
    localStorage.setItem('jewel_girvi', JSON.stringify(girviLoans));
  }, [girviLoans]);

  useEffect(() => {
    localStorage.setItem('jewel_gemstones_v1', JSON.stringify(gemstones));
  }, [gemstones]);

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
    setGemstones(prev => [newGem, ...prev]);
  };

  const handleUpdateGemstone = (updatedGem: CertifiedGemstone) => {
    setGemstones(prev => prev.map(g => g.id === updatedGem.id ? updatedGem : g));
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
    setCustomers(prev => [newCust, ...prev]);
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? updatedCust : c));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  // Sales Invoice Creation
  const handleCreateInvoice = (newInvoice: GSTInvoice) => {
    setInvoices(prev => [newInvoice, ...prev]);
    
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
    setPrintingInvoice(newInvoice);
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
    setPurchases(prev => [newPurchase, ...prev]);

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
      setInventory(prev => [...stockItemsToInsert, ...prev]);
    }
  };

  // Vendors Handlers
  const handleAddVendor = (newVendor: Vendor) => {
    setVendors(prev => [newVendor, ...prev]);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    setVendors(prev => prev.map(v => v.id === updatedVendor.id ? updatedVendor : v));
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
    setExpenses(prev => [newExpense, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // Contra Transfer Handlers
  const handleAddTransfer = (newTransfer: CashBankTransfer) => {
    setTransfers(prev => [newTransfer, ...prev]);
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
    setInventory(prev => {
      const exists = prev.some(i => i.id === item.id);
      if (exists) {
        return prev.map(i => i.id === item.id ? item : i);
      }
      return [item, ...prev];
    });
  };

  const handleItemGenerated = (newItem: JewelleryItem) => {
    setInventory(prev => [newItem, ...prev]);
  };

  const handleDeleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
  };

  // Karigar Handlers
  const handleAddJobCard = (card: KarigarJobCard) => {
    setJobCards(prev => [card, ...prev]);
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
    setJobCards(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
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
    setKarigars(prev => [...prev, newKg]);
  };

  // Girvi Handlers
  const handleAddGirviLoan = (newLoan: GirviLoan) => {
    setGirviLoans(prev => [newLoan, ...prev]);
  };

  const handleUpdateGirviLoan = (updatedLoan: GirviLoan) => {
    setGirviLoans(prev => prev.map(l => l.id === updatedLoan.id ? updatedLoan : l));
  };

  const handleRegisterFirmFromScreen = (newProfile: JewellerProfile, shopUpdate?: Partial<ShopDetails>) => {
    setProfiles(prev => [newProfile, ...prev]);
    setActiveProfileId(newProfile.id);
    if (shopUpdate) {
      setShopDetails(prev => ({
        ...prev,
        ...shopUpdate,
        logoUrl: shopUpdate.logoUrl || prev.logoUrl
      }));
    }
    setIsFirmActive(true);
    localStorage.setItem('jewel_firm_confirmed', 'true');
    localStorage.setItem('jewel_active_profile', newProfile.id);
  };

  const handleSelectExistingFirmFromScreen = (firmId: string) => {
    setActiveProfileId(firmId);
    const firm = profiles.find(p => p.id === firmId);
    if (firm) {
      setShopDetails(prev => ({
        ...prev,
        name: firm.name,
        gstin: firm.gstin || prev.gstin,
        phone: firm.phone || prev.phone,
        logoUrl: firm.logoUrl || prev.logoUrl
      }));
    }
    setIsFirmActive(true);
    localStorage.setItem('jewel_firm_confirmed', 'true');
    localStorage.setItem('jewel_active_profile', firmId);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-stone-50">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
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
