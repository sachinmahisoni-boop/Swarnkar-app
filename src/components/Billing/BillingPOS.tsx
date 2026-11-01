import React, { useState, useEffect } from 'react';
import { JewelleryItem, Customer, GSTInvoice, InvoiceItem, MetalRate, OldMetalExchange, PaymentMethod, JewellerProfile, InvoiceType, MetalType } from '../../types';
import { Search, Plus, Trash2, Calculator, ShoppingBag, Coins, Sparkles, Check, UserPlus, ArrowRight, ShieldCheck, Tag, Receipt, Gem, Scan, Edit3, X } from 'lucide-react';

interface BillingPOSProps {
  inventory: JewelleryItem[];
  customers: Customer[];
  rates: MetalRate[];
  activeProfile?: JewellerProfile;
  onAddCustomer: (newCust: Customer) => void;
  onCreateInvoice: (newInvoice: GSTInvoice) => void;
  onUpdateInventoryQty: (itemId: string, qtyDelta: number) => void;
}

export const BillingPOS: React.FC<BillingPOSProps> = ({
  inventory,
  customers,
  rates,
  activeProfile,
  onAddCustomer,
  onCreateInvoice,
  onUpdateInventoryQty,
}) => {
  // Billing Mode: GST Tax Invoice vs Non-GST Estimate
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('GST_INVOICE');

  // Selected Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [custSearch, setCustSearch] = useState('');
  
  // Custom New Customer Quick Add Modal State
  const [showQuickCustModal, setShowQuickCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustGSTIN, setNewCustGSTIN] = useState('');
  const [newCustAadhaar, setNewCustAadhaar] = useState('');

  // Tax Place of Supply (Default MP 23)
  const [isInterState, setIsInterState] = useState(false); // False = Intra (CGST+SGST), True = IGST
  const [placeOfSupply, setPlaceOfSupply] = useState('Madhya Pradesh (23)');

  // Items Cart
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  // Inventory Item Selector / Barcode search
  const [itemSearch, setItemSearch] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState<'All' | 'Gold' | 'Silver' | 'Gemstone' | 'Diamond'>('All');

  // Custom Item Manual Entry Drawer
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customMetal, setCustomMetal] = useState<MetalType>('Gold');
  const [customPurity, setCustomPurity] = useState('22K');
  const [customGrossWt, setCustomGrossWt] = useState<number>(10.0);
  const [customStoneWt, setCustomStoneWt] = useState<number>(0);
  const [customStoneVal, setCustomStoneVal] = useState<number>(0);
  const [customStoneType, setCustomStoneType] = useState('');
  const [customCarat, setCustomCarat] = useState<number>(0);
  const [customRatti, setCustomRatti] = useState<number>(0);
  const [customCertNo, setCustomCertNo] = useState('');
  const [customWastage, setCustomWastage] = useState<number>(2.5);
  const [customMakingType, setCustomMakingType] = useState<'per_gram' | 'flat'>('per_gram');
  const [customMakingRate, setCustomMakingRate] = useState<number>(450);
  const [customEnableHuid, setCustomEnableHuid] = useState(true);
  const [customHuidCode, setCustomHuidCode] = useState('SMJ916');

  // Old Metal Exchange
  const [enableOldExchange, setEnableOldExchange] = useState(false);
  const [oldExchange, setOldExchange] = useState<OldMetalExchange>({
    mode: 'weight_rate',
    metal: 'Gold',
    purity: '22K',
    grossWeight: 0,
    dustWastageGram: 0,
    meltPurityPercent: 91.6,
    netWeight: 0,
    ratePerGram: rates.find(r => r.metal === 'Gold' && r.purity === '22K')?.ratePerGram || 6900,
    lumpSumAmount: 0,
    totalCreditAmount: 0,
    description: ''
  });

  // Discount & Payment
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI/GPay');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [hallmarkCertified, setHallmarkCertified] = useState(true);

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || {
    id: 'guest',
    name: 'Walk-in Counter Customer',
    phone: '9999999999',
    address: 'Counter Cash Sale, Bhopal',
    gstin: ''
  };

  const getRateForPurity = (metal: string, purity: string) => {
    const r = rates.find(rate => rate.metal === metal && rate.purity === purity);
    return r ? r.ratePerGram : 0;
  };

  // Recalculate Old Metal Exchange Deduction
  useEffect(() => {
    if (enableOldExchange) {
      if (oldExchange.mode === 'lump_sum') {
        const credit = Number(oldExchange.lumpSumAmount) || 0;
        setOldExchange(prev => ({ ...prev, totalCreditAmount: credit }));
      } else {
        const netAfterLoss = Math.max(0, oldExchange.grossWeight - oldExchange.dustWastageGram);
        const effectivePureWt = netAfterLoss * (oldExchange.meltPurityPercent / 100);
        const credit = Math.round(effectivePureWt * oldExchange.ratePerGram);
        setOldExchange(prev => ({
          ...prev,
          netWeight: Number(netAfterLoss.toFixed(2)),
          totalCreditAmount: credit
        }));
      }
    } else {
      setOldExchange(prev => ({ ...prev, totalCreditAmount: 0 }));
    }
  }, [
    enableOldExchange,
    oldExchange.mode,
    oldExchange.grossWeight,
    oldExchange.dustWastageGram,
    oldExchange.meltPurityPercent,
    oldExchange.ratePerGram,
    oldExchange.lumpSumAmount
  ]);

  // Add Item from Inventory into Cart
  const handleAddItemToCart = (item: JewelleryItem) => {
    if (!item) return;
    const rate = getRateForPurity(item.metal || 'Gold', item.purity || '22K');
    const netWeight = Number(item.netWeight || item.grossWeight || 0);
    const grossWeight = Number(item.grossWeight || netWeight || 0);
    const stoneWeight = Number(item.stoneWeight || 0);
    const stoneValue = Number(item.stoneValue || 0);
    const wastagePercentage = Number(item.wastagePercentage || 0);
    const makingChargeRate = Number(item.makingChargeRate || item.makingChargePerGram || 0);

    const metalCost = netWeight * rate;
    const wastageCost = netWeight * (wastagePercentage / 100) * rate;
    const makingCharge = item.makingChargeType === 'flat'
      ? makingChargeRate
      : netWeight * makingChargeRate;
    const huidCharge = item.huid ? 45 : 0;
    const subtotal = metalCost + wastageCost + makingCharge + stoneValue + huidCharge;

    const baseMetalCost = netWeight * (item.purchaseRatePerGram || (rate * 0.94));
    const baseMakingCost = item.makingCostPerGram ? (netWeight * item.makingCostPerGram) : (makingCharge * 0.45);
    const baseStoneCost = item.stoneCost || Math.round(stoneValue * 0.65);
    const itemCostPrice = Math.round(item.costPrice || (baseMetalCost + baseMakingCost + baseStoneCost + huidCharge));
    const roundedSubtotal = Math.round(subtotal);
    const profit = Math.round(roundedSubtotal - itemCostPrice);
    const marginPct = roundedSubtotal > 0 ? Number(((profit / roundedSubtotal) * 100).toFixed(2)) : 0;

    const newItem: InvoiceItem = {
      itemId: item.id,
      tagNo: item.tagNo || `SMJ-ITEM-${Math.floor(100 + Math.random() * 900)}`,
      huid: item.huid,
      name: item.name || 'Jewellery Ornament',
      category: item.category || 'Gold Jewellery',
      metal: item.metal || 'Gold',
      purity: item.purity || '22K',
      grossWeight: grossWeight,
      netWeight: netWeight,
      stoneWeight: stoneWeight,
      stoneValue: stoneValue,
      stoneDetails: item.stoneType ? {
        type: item.stoneType,
        carat: item.stoneCarat || 0,
        ratti: Number(((item.stoneCarat || 0) * 1.1).toFixed(2)),
        certNo: item.labCertNo
      } : undefined,
      metalRateApplied: rate,
      metalCost: Math.round(metalCost),
      wastagePercentage: wastagePercentage,
      wastageCost: Math.round(wastageCost),
      makingChargeType: item.makingChargeType || 'per_gram',
      makingChargeRate: makingChargeRate,
      makingCharge: Math.round(makingCharge),
      huidCharge: huidCharge,
      subtotal: roundedSubtotal,
      costPrice: itemCostPrice,
      unitProfit: profit,
      profitMarginPercent: marginPct,
      hsnCode: item.hsnCode || (item.metal === 'Silver' ? '7106' : '7113'),
      quantity: 1
    };

    setCartItems(prev => [...prev, newItem]);
    setItemSearch('');
  };

  // Add Custom / Manual Jewellery Piece into Cart
  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = getRateForPurity(customMetal, customPurity);
    const netWeight = Math.max(0, customGrossWt - customStoneWt);
    const metalCost = netWeight * rate;
    const wastageCost = netWeight * (customWastage / 100) * rate;
    const makingCharge = customMakingType === 'per_gram'
      ? netWeight * customMakingRate
      : customMakingRate;
    const huidCharge = customEnableHuid ? 45 : 0;
    const subtotal = metalCost + wastageCost + makingCharge + customStoneVal + huidCharge;
    const roundedSubtotal = Math.round(subtotal);

    const customCostPrice = Math.round((netWeight * (rate * 0.94)) + (makingCharge * 0.45) + (customStoneVal * 0.65) + (customEnableHuid ? 45 : 0));
    const profit = Math.round(roundedSubtotal - customCostPrice);
    const marginPct = roundedSubtotal > 0 ? Number(((profit / roundedSubtotal) * 100).toFixed(2)) : 0;

    const newItem: InvoiceItem = {
      tagNo: `SMJ-MAN-${Math.floor(100 + Math.random() * 900)}`,
      huid: customEnableHuid ? customHuidCode : undefined,
      name: customName || `Handcrafted ${customPurity} ${customMetal} Jewellery`,
      category: 'Necklace',
      metal: customMetal,
      purity: customPurity,
      grossWeight: Number(customGrossWt),
      netWeight: Number(netWeight.toFixed(2)),
      stoneWeight: Number(customStoneWt),
      stoneValue: Number(customStoneVal),
      stoneDetails: customStoneType ? {
        type: customStoneType,
        carat: Number(customCarat),
        ratti: Number(customRatti),
        certNo: customCertNo
      } : undefined,
      metalRateApplied: rate,
      metalCost: Math.round(metalCost),
      wastagePercentage: Number(customWastage),
      wastageCost: Math.round(wastageCost),
      makingChargeType: customMakingType,
      makingChargeRate: Number(customMakingRate),
      makingCharge: Math.round(makingCharge),
      huidCharge: huidCharge,
      subtotal: roundedSubtotal,
      costPrice: customCostPrice,
      unitProfit: profit,
      profitMarginPercent: marginPct,
      hsnCode: customMetal === 'Silver' ? '7106' : '7113',
      quantity: 1
    };

    setCartItems(prev => [...prev, newItem]);
    setShowCustomItemModal(false);
    // Reset custom fields
    setCustomName('');
    setCustomStoneVal(0);
    setCustomStoneWt(0);
    setCustomStoneType('');
  };

  const handleRemoveFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Cart Item Edit State & Handlers
  const [editingCartIndex, setEditingCartIndex] = useState<number | null>(null);
  const [editCartForm, setEditCartForm] = useState<{
    name: string;
    grossWeight: number;
    stoneWeight: number;
    stoneValue: number;
    metalRateApplied: number;
    wastagePercentage: number;
    makingChargeType: 'per_gram' | 'flat';
    makingChargeRate: number;
    huid?: string;
    quantity: number;
  } | null>(null);

  const handleStartEditCartItem = (index: number) => {
    const item = cartItems[index];
    setEditingCartIndex(index);
    setEditCartForm({
      name: item.name,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight || 0,
      stoneValue: item.stoneValue || 0,
      metalRateApplied: item.metalRateApplied,
      wastagePercentage: item.wastagePercentage,
      makingChargeType: item.makingChargeType,
      makingChargeRate: item.makingChargeRate,
      huid: item.huid || '',
      quantity: item.quantity || 1
    });
  };

  const handleSaveEditedCartItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCartIndex === null || !editCartForm) return;

    const originalItem = cartItems[editingCartIndex];
    const netWeight = Math.max(0, editCartForm.grossWeight - editCartForm.stoneWeight);
    const metalCost = netWeight * editCartForm.metalRateApplied;
    const wastageCost = netWeight * (editCartForm.wastagePercentage / 100) * editCartForm.metalRateApplied;
    const makingCharge = editCartForm.makingChargeType === 'per_gram'
      ? netWeight * editCartForm.makingChargeRate
      : editCartForm.makingChargeRate;
    const huidCharge = editCartForm.huid ? 45 : 0;
    const qty = editCartForm.quantity || 1;
    const subtotal = Math.round((metalCost + wastageCost + makingCharge + editCartForm.stoneValue + huidCharge) * qty);

    const baseMetalCost = netWeight * (editCartForm.metalRateApplied * 0.94);
    const baseMakingCost = makingCharge * 0.45;
    const baseStoneCost = Math.round(editCartForm.stoneValue * 0.65);
    const costPrice = Math.round((baseMetalCost + baseMakingCost + baseStoneCost + huidCharge) * qty);
    const profit = Math.round(subtotal - costPrice);
    const marginPct = subtotal > 0 ? Number(((profit / subtotal) * 100).toFixed(2)) : 0;

    const updated: InvoiceItem = {
      ...originalItem,
      name: editCartForm.name,
      grossWeight: Number(editCartForm.grossWeight),
      stoneWeight: Number(editCartForm.stoneWeight),
      stoneValue: Number(editCartForm.stoneValue),
      netWeight: Number(netWeight.toFixed(2)),
      metalRateApplied: Number(editCartForm.metalRateApplied),
      metalCost: Math.round(metalCost),
      wastagePercentage: Number(editCartForm.wastagePercentage),
      wastageCost: Math.round(wastageCost),
      makingChargeType: editCartForm.makingChargeType,
      makingChargeRate: Number(editCartForm.makingChargeRate),
      makingCharge: Math.round(makingCharge),
      huid: editCartForm.huid || undefined,
      huidCharge,
      subtotal,
      costPrice,
      unitProfit: profit,
      profitMarginPercent: marginPct,
      quantity: qty
    };

    setCartItems(prev => prev.map((item, idx) => idx === editingCartIndex ? updated : item));
    setEditingCartIndex(null);
    setEditCartForm(null);
  };

  // Calculations
  const itemsSubtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const oldMetalDeduction = enableOldExchange ? oldExchange.totalCreditAmount : 0;
  const taxableAmount = Math.max(0, itemsSubtotal - oldMetalDeduction);
  const totalHuidFee = cartItems.reduce((acc, i) => acc + (i.huidCharge || 0), 0);

  // Dynamic GST calculation based on invoiceType
  const isGSTEnabled = invoiceType === 'GST_INVOICE';
  const cgstRate = isGSTEnabled ? (isInterState ? 0 : 1.5) : 0;
  const sgstRate = isGSTEnabled ? (isInterState ? 0 : 1.5) : 0;
  const igstRate = isGSTEnabled ? (isInterState ? 3.0 : 0) : 0;

  const cgstAmount = Math.round(taxableAmount * (cgstRate / 100));
  const sgstAmount = Math.round(taxableAmount * (sgstRate / 100));
  const igstAmount = Math.round(taxableAmount * (igstRate / 100));
  const totalTax = cgstAmount + sgstAmount + igstAmount;

  const grandTotal = Math.max(0, Math.round(taxableAmount + totalTax - discountAmount));

  // Sync default amount paid
  useEffect(() => {
    setAmountPaid(grandTotal);
  }, [grandTotal]);

  // Handle Quick Add Customer
  const handleQuickAddCust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddress || 'Kolar Road, Bhopal',
      city: 'Bhopal',
      state: 'Madhya Pradesh (23)',
      gstin: newCustGSTIN,
      aadhaar: newCustAadhaar,
      totalPurchases: 0,
      outstandingBalance: 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setShowQuickCustModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustGSTIN('');
  };

  // Finalize Invoice Creation
  const handleGenerateInvoice = () => {
    if (cartItems.length === 0) {
      alert("Please add at least one jewellery item to the bill.");
      return;
    }

    const prefix = isGSTEnabled ? 'SMJ-INV' : 'SMJ-EST';
    const invoiceNumber = `${prefix}-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const dueAmt = Math.max(0, grandTotal - amountPaid);

    const newInvoice: GSTInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceType,
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerPhone: selectedCustomer.phone,
      customerAddress: selectedCustomer.address,
      customerGSTIN: selectedCustomer.gstin,
      placeOfSupply,
      isInterState,
      profileId: activeProfile?.id,
      counterName: activeProfile?.counterName,
      items: cartItems,
      oldMetalExchange: enableOldExchange ? oldExchange : undefined,
      itemsSubtotal,
      oldMetalDeduction,
      taxableAmount,
      cgstRate,
      sgstRate,
      igstRate,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalTax,
      hallmarkingTotalFee: totalHuidFee,
      discountAmount,
      grandTotal,
      payment: {
        method: paymentMethod,
        amountPaid,
        dueAmount: dueAmt,
        transactionRef: paymentMethod !== 'Cash' ? `UPI-${Math.floor(10000000 + Math.random() * 90000000)}` : undefined
      },
      status: dueAmt === 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid',
      notes: notes || (isGSTEnabled ? '100% Certified BIS 916 HUID Hallmarked.' : 'Quotation / Estimate Bill.'),
      hallmarkCertified
    };

    // Deduct stock quantity
    cartItems.forEach(item => {
      if (item.itemId) {
        onUpdateInventoryQty(item.itemId, -1);
      }
    });

    onCreateInvoice(newInvoice);
    // Reset cart
    setCartItems([]);
    setDiscountAmount(0);
    setNotes('');
    setEnableOldExchange(false);
  };

  const filteredInventory = (inventory || []).filter(i => {
    if (!i) return false;
    const term = (itemSearch || '').toLowerCase().trim();
    const nameStr = (i.name || '').toLowerCase();
    const tagStr = (i.tagNo || '').toLowerCase();
    const huidStr = (i.huid || '').toLowerCase();
    const barcodeStr = (i.barcode || '').toLowerCase();
    const stoneStr = (i.stoneType || '').toLowerCase();
    const categoryStr = (i.category || '').toLowerCase();

    const matchesSearch = !term ||
      nameStr.includes(term) ||
      tagStr.includes(term) ||
      huidStr.includes(term) ||
      barcodeStr.includes(term) ||
      stoneStr.includes(term) ||
      categoryStr.includes(term);

    const matchesCategory = 
      posCategoryFilter === 'All' ? true :
      posCategoryFilter === 'Gold' ? i.metal === 'Gold' :
      posCategoryFilter === 'Silver' ? i.metal === 'Silver' :
      posCategoryFilter === 'Gemstone' ? (
        categoryStr.includes('gem') || 
        categoryStr.includes('navratna') || 
        !!i.stoneType || 
        i.metal === 'Diamond'
      ) :
      (i.metal === 'Diamond' || nameStr.includes('diamond'));

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Invoice Type Mode Toggle & Customer Select Bar */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Bill Type Selector (GST Tax Invoice vs Non-GST Estimate) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-500 font-bold uppercase tracking-wider">Bill Mode:</span>
            <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200 text-xs">
              <button
                onClick={() => setInvoiceType('GST_INVOICE')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  invoiceType === 'GST_INVOICE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                GST Tax Invoice (पक्का बिल - 3%)
              </button>
              <button
                onClick={() => setInvoiceType('ESTIMATE_BILL')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  invoiceType === 'ESTIMATE_BILL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Estimate / Kachha Receipt (कच्चा बिल - 0% Tax)
              </button>
            </div>

            {invoiceType === 'ESTIMATE_BILL' && (
              <span className="text-[11px] bg-amber-50 text-amber-800 px-2 py-1 rounded-lg border border-amber-200 font-medium">
                No GST added • Quotation Mode
              </span>
            )}
          </div>

          {/* Customer Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded-xl px-3 py-1.5 text-xs text-stone-900 font-medium focus:outline-none focus:border-amber-500 max-w-xs focus:bg-white"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>

            <button
              onClick={() => setShowQuickCustModal(true)}
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-amber-900 font-bold text-xs rounded-xl border border-stone-300 flex items-center gap-1 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-700" />
              <span>+ New Customer</span>
            </button>
          </div>
        </div>

        {/* Selected Customer Card Details */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-stone-900">{selectedCustomer.name}</span>
            <span>•</span>
            <span className="font-mono">{selectedCustomer.phone}</span>
            <span>•</span>
            <span className="truncate max-w-xs">{selectedCustomer.address}</span>
          </div>

          <div className="flex items-center gap-3">
            {isGSTEnabled && (
              <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInterState}
                  onChange={(e) => setIsInterState(e.target.checked)}
                  className="rounded accent-amber-600"
                />
                <span>Inter-state Sale (IGST 3%)</span>
              </label>
            )}

            <span className="bg-amber-50 text-amber-900 px-2.5 py-0.5 rounded-lg font-mono text-[11px] border border-amber-200/80 font-bold">
              Counter: {activeProfile?.counterName || 'Main Showroom'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Billing Workspace: Left (Item Selector & Cart) + Right (Totals & Old Exchange) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Item Selection & Current Bill Items */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Quick Item Search & Manual Item Trigger */}
          <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Scan Barcode / HUID or search stock item..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
                <Scan className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowCustomItemModal(true)}
                  className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  + Custom / Unstocked Item
                </button>
              </div>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
              <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider shrink-0 mr-1">
                Filter Stock:
              </span>
              {[
                { id: 'All', label: 'All Items (सभी आइटम)' },
                { id: 'Gold', label: 'Gold (सोना)' },
                { id: 'Silver', label: 'Silver (चांदी)' },
                { id: 'Gemstone', label: 'Gemstones & Navratna (रत्न)' },
                { id: 'Diamond', label: 'Diamonds (हीरा)' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPosCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer ${
                    posCategoryFilter === cat.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Live Search & Filter Results Dropdown */}
            {(itemSearch.trim() || posCategoryFilter !== 'All') && (
              <div className="bg-white border border-stone-200 rounded-2xl max-h-72 overflow-y-auto divide-y divide-stone-100 shadow-md">
                {filteredInventory.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-stone-500 font-medium">स्टॉक में "{itemSearch}" नाम से कोई आभूषण नहीं मिला।</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomName(itemSearch);
                        setShowCustomItemModal(true);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>➕ "{itemSearch}" को कस्टम / अनस्टॉक्ड आइटम के रूप में जोड़ें</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {filteredInventory.map(item => (
                      <div
                        key={item.id}
                        onClick={() => handleAddItemToCart(item)}
                        className="p-3 hover:bg-amber-50/50 transition cursor-pointer flex items-center justify-between text-xs text-stone-800"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-900 font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[11px] border border-amber-200">{item.tagNo}</span>
                            <span className="font-bold text-stone-900">{item.name}</span>
                            {item.huid && (
                              <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">HUID: {item.huid}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {item.purity} {item.metal} • Net: {item.netWeight.toFixed(2)}g • Qty in Stock: {item.quantity}
                          </div>
                        </div>
                        <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-xl shadow-xs">
                          + Add to Bill
                        </button>
                      </div>
                    ))}

                    {itemSearch.trim() && (
                      <div
                        onClick={() => {
                          setCustomName(itemSearch);
                          setShowCustomItemModal(true);
                        }}
                        className="p-3 bg-amber-50 hover:bg-amber-100/80 transition cursor-pointer flex items-center justify-between text-xs text-amber-900 font-bold border-t border-amber-200"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-amber-700" />
                          <span>कस्टम / अनस्टॉक्ड आइटम: "{itemSearch}" बनाएं व बिल में जोड़ें</span>
                        </div>
                        <span className="text-[11px] bg-amber-200 text-amber-950 font-black px-2.5 py-1 rounded-lg">
                          + Create Custom Item
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="bg-white border border-stone-200/90 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-600" />
                Items on Bill ({cartItems.length})
              </span>
              <span className="text-xs text-stone-500 font-medium">Click Edit to modify or Trash to remove</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-stone-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Item / HUID</th>
                    <th className="py-2.5 px-3">Purity & Rate</th>
                    <th className="py-2.5 px-3 text-right">Gross Wt</th>
                    <th className="py-2.5 px-3 text-right">Stone Wt</th>
                    <th className="py-2.5 px-3 text-right">Net Wt</th>
                    <th className="py-2.5 px-3 text-right">Making / Labor</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-stone-400">
                        <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                        No jewellery items in the bill yet. Scan a barcode or pick an item above.
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, index) => (
                      <tr key={index} className="hover:bg-amber-50/20 transition">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-stone-900 line-clamp-1">{item.name}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-stone-500 font-mono mt-0.5">
                            <span>{item.tagNo}</span>
                            {item.huid && (
                              <span className="text-emerald-700 font-bold bg-emerald-50 px-1 rounded border border-emerald-200">
                                HUID: {item.huid} (+₹45)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-bold text-amber-800 block">{item.purity}</span>
                          <span className="text-[10px] text-stone-500 font-mono">₹{item.metalRateApplied}/g</span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-stone-700">
                          {item.grossWeight.toFixed(2)}g
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-stone-500">
                          {item.stoneWeight > 0 ? (
                            <div>
                              <span>{item.stoneWeight.toFixed(2)}g</span>
                              {item.stoneValue > 0 && <span className="block text-[10px] text-amber-700 font-bold">+₹{item.stoneValue}</span>}
                            </div>
                          ) : '-'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                          {item.netWeight.toFixed(2)}g
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="text-stone-900 font-medium block">₹{item.makingCharge.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-stone-500">
                            {item.makingChargeType === 'per_gram' ? `₹${item.makingChargeRate}/g` : 'Flat'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-black text-stone-900">
                          ₹{item.subtotal.toLocaleString('en-IN')}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditCartItem(index)}
                              className="p-1 text-stone-400 hover:text-amber-700 transition cursor-pointer"
                              title="Edit item in bill (बिल में आइटम एडिट करें)"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromCart(index)}
                              className="p-1 text-stone-400 hover:text-rose-600 transition cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Old Gold & Silver Exchange Section (पुरानी सोना/चांदी वापसी) */}
          <div className="bg-amber-50/40 border border-amber-200/90 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableOldExchange}
                  onChange={(e) => setEnableOldExchange(e.target.checked)}
                  className="rounded accent-amber-600 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-700" />
                  Old Gold / Silver Buyback & Exchange (पुरानी सोना / चांदी वापसी)
                </span>
              </label>

              {enableOldExchange && (
                <div className="flex bg-stone-100 p-0.5 rounded-lg border border-stone-200 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setOldExchange(prev => ({ ...prev, mode: 'weight_rate' }))}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${oldExchange.mode === 'weight_rate' ? 'bg-amber-600 text-white shadow-2xs' : 'text-stone-600'}`}
                  >
                    Mode A: Weight & Purity %
                  </button>
                  <button
                    type="button"
                    onClick={() => setOldExchange(prev => ({ ...prev, mode: 'lump_sum' }))}
                    className={`px-2.5 py-1 rounded-md font-bold transition ${oldExchange.mode === 'lump_sum' ? 'bg-amber-600 text-white shadow-2xs' : 'text-stone-600'}`}
                  >
                    Mode B: Direct Lump-Sum ₹
                  </button>
                </div>
              )}
            </div>

            {enableOldExchange && (
              <div className="pt-2 border-t border-amber-200/60 space-y-3 text-xs">
                {oldExchange.mode === 'weight_rate' ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-stone-600 mb-1 text-[11px] font-medium">Metal</label>
                      <select
                        value={oldExchange.metal}
                        onChange={(e) => {
                          const m = e.target.value as MetalType;
                          const rate = rates.find(r => r.metal === m && r.purity.includes('22K'))?.ratePerGram || 6800;
                          setOldExchange(prev => ({ ...prev, metal: m, ratePerGram: rate }));
                        }}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-medium"
                      >
                        <option value="Gold">Old Gold</option>
                        <option value="Silver">Old Silver</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-600 mb-1 text-[11px] font-medium">Gross Weight (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={oldExchange.grossWeight || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, grossWeight: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-mono font-bold"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 mb-1 text-[11px] font-medium">Melt Loss / काट (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={oldExchange.dustWastageGram || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, dustWastageGram: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 mb-1 text-[11px] font-medium">Purity Touch (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={oldExchange.meltPurityPercent || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, meltPurityPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-stone-900 font-mono"
                        placeholder="91.6"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 mb-1 text-[11px] font-medium">Exchange Rate ₹/g</label>
                      <input
                        type="number"
                        value={oldExchange.ratePerGram || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, ratePerGram: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-amber-800 font-mono font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-600 mb-1 text-[11px] font-medium">Direct Agreed Valuation Amount (सीधा तय भाव ₹) *</label>
                      <input
                        type="number"
                        value={oldExchange.lumpSumAmount || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, lumpSumAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 45000"
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-amber-900 font-mono font-black text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 mb-1 text-[11px] font-medium">Old Ornament Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Old broken 22K chain + tops"
                        value={oldExchange.description || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-amber-100/80 border border-amber-300/80 rounded-xl text-xs">
                  <span className="text-amber-900 font-bold">Old Metal Credit To Deduct:</span>
                  <span className="font-mono font-black text-amber-950 text-base">
                    - ₹{oldExchange.totalCreditAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 cols): Bill Summary, Tax & Payment Desk */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-xs space-y-4 sticky top-[150px]">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600" />
                {isGSTEnabled ? 'Tax Invoice Summary' : 'Estimate Summary'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isGSTEnabled ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                {isGSTEnabled ? 'GST 3%' : 'Estimate 0%'}
              </span>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-stone-900">₹{itemsSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {oldMetalDeduction > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>Less: Old Metal Credit:</span>
                  <span className="font-mono font-bold">- ₹{oldMetalDeduction.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-800 font-bold pt-1 border-t border-stone-100">
                <span>Taxable Value:</span>
                <span className="font-mono font-bold">₹{taxableAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* GST Rows */}
              {isGSTEnabled ? (
                isInterState ? (
                  <div className="flex justify-between text-stone-600">
                    <span>IGST (3.0%):</span>
                    <span className="font-mono font-bold text-stone-900">₹{igstAmount.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-stone-600">
                      <span>CGST (1.5%):</span>
                      <span className="font-mono font-bold text-stone-900">₹{cgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600">
                      <span>SGST (1.5%):</span>
                      <span className="font-mono font-bold text-stone-900">₹{sgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )
              ) : (
                <div className="flex justify-between text-stone-400 italic text-[11px]">
                  <span>GST (Non-GST Estimate):</span>
                  <span>₹0.00</span>
                </div>
              )}

              {/* Discount Input */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-600">Round-off / Discount:</span>
                <div className="flex items-center gap-1 w-24">
                  <span className="text-stone-400">₹</span>
                  <input
                    type="number"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg px-2 py-0.5 text-right font-mono text-xs text-stone-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Grand Total Box */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-300 rounded-2xl flex items-center justify-between mt-3 shadow-2xs">
                <div>
                  <span className="text-xs font-extrabold text-stone-900 block">Total Amount Due</span>
                  <span className="text-[10px] text-stone-500 font-medium">Net payable by customer</span>
                </div>
                <span className="text-2xl font-black text-amber-800 font-mono">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
              <label className="block text-stone-600 font-bold">Payment Mode</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['UPI/GPay', 'Cash', 'Card', 'Bank Transfer', 'Mixed'] as PaymentMethod[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition text-center truncate cursor-pointer ${
                      paymentMethod === m
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-stone-600 mb-1 font-bold">Amount Received Now (₹)</label>
                <input
                  type="number"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-emerald-800 font-mono font-black text-base focus:bg-white"
                />
              </div>

              {amountPaid < grandTotal && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[11px] flex justify-between font-mono font-bold">
                  <span>Balance Due / Khata:</span>
                  <span>₹{(grandTotal - amountPaid).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateInvoice}
              disabled={cartItems.length === 0}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{isGSTEnabled ? 'Generate Tax Invoice [F2]' : 'Generate Estimate Receipt'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Custom / Manual Item Entry */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-base flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                  <Gem className="w-5 h-5" />
                </div>
                <span>कस्टम आभूषण या जेमस्टोन जोड़ें (Add Custom Jewellery)</span>
              </h3>
              <button 
                onClick={() => setShowCustomItemModal(false)} 
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets for fast entry */}
            <div className="mt-3 p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl">
              <span className="text-[11px] font-bold text-amber-900 block mb-1.5">
                ⚡ 1-Click Fast Jewellery Presets (त्वरित आभूषण टेम्प्लेट):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { name: '22K Bridal Haar (हार)', metal: 'Gold', purity: '22K', gross: 28.50, stone: 0, wastage: 8, making: 650 },
                  { name: '22K Mangalsutra (मंगलसूत्र)', metal: 'Gold', purity: '22K', gross: 14.20, stone: 1.5, wastage: 7, making: 600 },
                  { name: '22K Gold Chain (सोने की चेन)', metal: 'Gold', purity: '22K', gross: 11.50, stone: 0, wastage: 5, making: 450 },
                  { name: '22K Bangles / Kada (कंगन)', metal: 'Gold', purity: '22K', gross: 32.00, stone: 0, wastage: 7, making: 550 },
                  { name: '22K Ladies Ring (अंगूठी)', metal: 'Gold', purity: '22K', gross: 4.80, stone: 0.2, wastage: 6, making: 500 },
                  { name: '22K Jhumki / Tops (झुमकी)', metal: 'Gold', purity: '22K', gross: 8.50, stone: 0, wastage: 7, making: 550 },
                  { name: 'Silver Payal (चांदी पायल)', metal: 'Silver', purity: '925 Sterling', gross: 75.00, stone: 0, wastage: 0, making: 18 },
                  { name: '24K Gold Coin 999 (सिक्का)', metal: 'Gold', purity: '24K', gross: 10.00, stone: 0, wastage: 0, making: 150 },
                ].map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setCustomName(tpl.name);
                      setCustomMetal(tpl.metal as MetalType);
                      setCustomPurity(tpl.purity);
                      setCustomGrossWt(tpl.gross);
                      setCustomStoneWt(tpl.stone);
                      setCustomWastage(tpl.wastage);
                      setCustomMakingRate(tpl.making);
                    }}
                    className="text-[10px] font-bold bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 px-2 py-1 rounded-lg transition shadow-2xs"
                  >
                    + {tpl.name}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-4 mt-3 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Item Description (आभूषण का नाम) *</label>
                <input
                  type="text"
                  placeholder="उदा. 22K Traditional Bridal Haar या Certified Zambian Emerald"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white font-medium shadow-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Metal Type (धातु प्रकार) *</label>
                  <select
                    value={customMetal}
                    onChange={(e) => setCustomMetal(e.target.value as MetalType)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:border-amber-500 focus:bg-white"
                  >
                    <option value="Gold">Gold (सोना)</option>
                    <option value="Silver">Silver (चाँदी)</option>
                    <option value="Platinum">Platinum (प्लैटिनम)</option>
                    <option value="Diamond">Diamond / Gemstone (हीरा व रत्न)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Purity (शुद्धता / कैरेट) *</label>
                  <select
                    value={customPurity}
                    onChange={(e) => setCustomPurity(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:border-amber-500 focus:bg-white"
                  >
                    <option value="24K">24K Pure Gold (99.9%)</option>
                    <option value="22K">22K (916 BIS Hallmark)</option>
                    <option value="18K">18K (750 Diamond Setting)</option>
                    <option value="14K">14K Light Jewellery</option>
                    <option value="9K">9K (375 Casual Gold)</option>
                    <option value="999 Fine">Silver 999 Fine (सिक्का / सिल्ली)</option>
                    <option value="925 Sterling">Silver 925 Sterling (चांदी जेवर)</option>
                    <option value="Natural Gemstone">Natural Certified Gemstone</option>
                  </select>
                </div>
              </div>

              {/* Weight Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Gross Wt (सकल वजन g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customGrossWt}
                    onChange={(e) => setCustomGrossWt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:border-amber-500 focus:bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Stone Wt (नग वजन g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customStoneWt}
                    onChange={(e) => setCustomStoneWt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-mono focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Net Metal Wt (शुद्ध वजन)</label>
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-2 font-mono font-extrabold text-amber-900 text-sm">
                    {Math.max(0, customGrossWt - customStoneWt).toFixed(2)} g
                  </div>
                </div>
              </div>

              {/* Gemstone / Diamond Fields */}
              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 space-y-2">
                <span className="font-extrabold text-stone-800 block text-xs">रत्न / हीरा विवरण (Stones & Diamonds Info)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-stone-500 text-[11px] mb-0.5">Stone Type</label>
                    <input
                      type="text"
                      placeholder="उदा. Emerald, Ruby"
                      value={customStoneType}
                      onChange={(e) => setCustomStoneType(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 text-[11px] mb-0.5">Carat / Ratti</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Carats"
                      value={customCarat || ''}
                      onChange={(e) => {
                        const ct = parseFloat(e.target.value) || 0;
                        setCustomCarat(ct);
                        setCustomRatti(Number((ct * 1.1).toFixed(2)));
                      }}
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-500 text-[11px] mb-0.5">Stone Value (₹)</label>
                    <input
                      type="number"
                      value={customStoneVal || ''}
                      onChange={(e) => setCustomStoneVal(parseFloat(e.target.value) || 0)}
                      placeholder="₹0"
                      className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-amber-800 font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-stone-500 text-[11px] mb-0.5">Lab Certificate No. (GIA / IGI / Govt Lab)</label>
                  <input
                    type="text"
                    placeholder="उदा. IGI-5928174 or Govt-GTL-98124"
                    value={customCertNo}
                    onChange={(e) => setCustomCertNo(e.target.value)}
                    className="w-full bg-white border border-stone-200 rounded-lg px-2 py-1 text-stone-900"
                  />
                </div>
              </div>

              {/* Making charges & HUID */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Making Charge Mode</label>
                  <select
                    value={customMakingType}
                    onChange={(e) => setCustomMakingType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-1.5 text-stone-900 font-medium"
                  >
                    <option value="per_gram">₹ प्रति ग्राम (Per Gram)</option>
                    <option value="flat">एकमुश्त (Fixed Flat ₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Rate (₹)</label>
                  <input
                    type="number"
                    value={customMakingRate}
                    onChange={(e) => setCustomMakingRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-1.5 text-stone-900 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Touch / Wastage %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customWastage}
                    onChange={(e) => setCustomWastage(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-2 py-1.5 text-stone-900 font-mono"
                  />
                </div>
              </div>

              {/* HUID Hallmarking Toggle */}
              <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-2xl border border-amber-200">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customEnableHuid}
                    onChange={(e) => setCustomEnableHuid(e.target.checked)}
                    className="w-4 h-4 rounded accent-amber-600"
                  />
                  <span className="text-stone-900 font-bold flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Apply BIS 6-Digit HUID Hallmarking (+₹45)
                  </span>
                </label>

                {customEnableHuid && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold text-stone-600">HUID:</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={customHuidCode}
                      onChange={(e) => setCustomHuidCode(e.target.value.toUpperCase())}
                      className="w-24 bg-white border border-amber-300 rounded-lg px-2 py-1 text-center font-mono font-black text-amber-900 uppercase text-xs shadow-xs"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                >
                  Add into Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Quick Add Customer */}
      {showQuickCustModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-extrabold text-stone-900 text-base">नया ग्राहक जोड़ें (Quick Add Customer)</h3>
              <button 
                onClick={() => setShowQuickCustModal(false)} 
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddCust} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Customer Name (ग्राहक का नाम) *</label>
                <input
                  type="text"
                  placeholder="उदा. श्रीमती अनिता शर्मा"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-bold">Phone Number (मोबाइल नंबर) *</label>
                <input
                  type="text"
                  placeholder="उदा. 9826012345"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-bold">Address (निवास पता)</label>
                <input
                  type="text"
                  placeholder="उदा. कोलार रोड, भोपाल"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-bold">Aadhaar Card No. (आधार संख्या)</label>
                <input
                  type="text"
                  placeholder="उदा. XXXX-XXXX-4921"
                  value={newCustAadhaar}
                  onChange={(e) => setNewCustAadhaar(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowQuickCustModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Cart Item In-line Modal */}
      {editingCartIndex !== null && editCartForm && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-stone-900 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900">
                    बिल में आइटम विवरण बदलें (Edit Item in Bill)
                  </h3>
                  <p className="text-xs text-stone-500">वजन, भाव, मेकिंग चार्ज और विवरण तुरंत संशोधित करें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCartIndex(null);
                  setEditCartForm(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCartItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Item Name (आभूषण का नाम) *</label>
                <input
                  type="text"
                  required
                  value={editCartForm.name}
                  onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-stone-900 font-bold focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Gross Weight (सकल g) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={editCartForm.grossWeight || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, grossWeight: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Stone Weight (नग g)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editCartForm.stoneWeight || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, stoneWeight: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Net Weight (शुद्ध वजन)</label>
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-amber-900 font-mono font-extrabold text-sm">
                    {Math.max(0, editCartForm.grossWeight - editCartForm.stoneWeight).toFixed(3)}g
                  </div>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Metal Rate (₹/g) *</label>
                  <input
                    type="number"
                    required
                    value={editCartForm.metalRateApplied || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, metalRateApplied: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-amber-900 font-mono font-bold focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Wastage (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editCartForm.wastagePercentage || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, wastagePercentage: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Stone / Diamond Val (₹)</label>
                  <input
                    type="number"
                    value={editCartForm.stoneValue || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, stoneValue: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1 font-bold">Making Type</label>
                  <select
                    value={editCartForm.makingChargeType}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, makingChargeType: e.target.value as any }) : null)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:border-amber-500 focus:bg-white"
                  >
                    <option value="per_gram">Per Gram (₹/g)</option>
                    <option value="flat">Flat / Lumpsum (एकमुश्त)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-bold">
                    Making Rate {editCartForm.makingChargeType === 'per_gram' ? '(₹/g)' : '(₹ Flat)'} *
                  </label>
                  <input
                    type="number"
                    required
                    value={editCartForm.makingChargeRate || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, makingChargeRate: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:border-amber-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 mb-1 font-bold">HUID Code (6-digit)</label>
                  <input
                    type="text"
                    value={editCartForm.huid || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, huid: e.target.value.toUpperCase() }) : null)}
                    placeholder="उदा. SMJ916"
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-emerald-700 font-mono uppercase font-black focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between text-xs font-mono">
                <span className="text-amber-950 font-sans font-bold">New Calculated Subtotal (संशोधित कुल):</span>
                <span className="text-base font-extrabold text-amber-900">
                  ₹{Math.round(
                    (Math.max(0, editCartForm.grossWeight - editCartForm.stoneWeight) * editCartForm.metalRateApplied) +
                    (Math.max(0, editCartForm.grossWeight - editCartForm.stoneWeight) * (editCartForm.wastagePercentage / 100) * editCartForm.metalRateApplied) +
                    (editCartForm.makingChargeType === 'per_gram' ? Math.max(0, editCartForm.grossWeight - editCartForm.stoneWeight) * editCartForm.makingChargeRate : editCartForm.makingChargeRate) +
                    editCartForm.stoneValue +
                    (editCartForm.huid ? 45 : 0)
                  ).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCartIndex(null);
                    setEditCartForm(null);
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
                >
                  Update Item in Bill (बदलाव सहेजें)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
