import React, { useState, useEffect } from 'react';
import { JewelleryItem, Customer, GSTInvoice, InvoiceItem, MetalRate, OldMetalExchange, PaymentMethod, JewellerProfile, InvoiceType, MetalType } from '../../types';
import { Search, Plus, Trash2, Calculator, ShoppingBag, Coins, Sparkles, Check, UserPlus, ArrowRight, ShieldCheck, Tag, Receipt, Gem, Scan, Edit3, X, AlertTriangle } from 'lucide-react';
import { calculateItemSubtotal, calculateOldMetalValue, getHsnAndGstRate, roundPaise, allocateBillDiscount } from '../../lib/pricing';
import { calculateTaxBreakdown, isInterStateSupply, checkComplianceWarnings, validateGstin } from '../../lib/gst';
import { checkStockAvailability } from '../../lib/stock';
import { getISTDate } from '../../lib/invoiceNumber';

interface BillingPOSProps {
  inventory: JewelleryItem[];
  customers: Customer[];
  rates: MetalRate[];
  activeProfile?: JewellerProfile;
  onAddCustomer: (newCust: Customer) => void;
  onCreateInvoice: (invoiceDraft: Omit<GSTInvoice, 'id' | 'invoiceNumber'>, prefix?: string) => Promise<GSTInvoice | void> | void;
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

  // Customer Selection: Walk-in Cash Customer or Registered Customer
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('walkin');
  
  // Custom New Customer Quick Add Modal State
  const [showQuickCustModal, setShowQuickCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustGSTIN, setNewCustGSTIN] = useState('');
  const [newCustAadhaar, setNewCustAadhaar] = useState('');
  const [newCustPAN, setNewCustPAN] = useState('');

  // Tax Place of Supply (Auto-detected from shop and customer GSTIN / State)
  const [isInterState, setIsInterState] = useState(false);
  const [manualInterStateOverride, setManualInterStateOverride] = useState(false);
  const [placeOfSupply, setPlaceOfSupply] = useState('Madhya Pradesh (23)');

  // Items Cart
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);

  // Inventory Item Selector / Barcode search
  const [itemSearch, setItemSearch] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState<'All' | 'Gold' | 'Silver' | 'Artificial' | 'Gemstone' | 'Diamond'>('All');

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
  const [customMakingType, setCustomMakingType] = useState<'per_gram' | 'flat' | 'percentage'>('per_gram');
  const [customMakingRate, setCustomMakingRate] = useState<number>(450);
  const [customEnableHuid, setCustomEnableHuid] = useState(true);
  const [customHuidCode, setCustomHuidCode] = useState('SMJ916');

  // Old Metal Exchange
  const [enableOldExchange, setEnableOldExchange] = useState(false);
  const [oldExchangeMode, setOldExchangeMode] = useState<'after_tax' | 'pre_tax'>('after_tax'); // TODO(CA): Confirm default GST old gold mode
  const [oldExchangeSellerKYC, setOldExchangeSellerKYC] = useState({
    sellerName: '',
    sellerPhone: '',
    sellerAadhaar: ''
  });
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
  const [transactionRef, setTransactionRef] = useState<string>(''); // Optional manual payment ref
  const [notes, setNotes] = useState('');
  const [customerPANInput, setCustomerPANInput] = useState('');
  const [hallmarkCertified, setHallmarkCertified] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Selected Customer Resolution
  const selectedCustomer: Customer = selectedCustomerId === 'walkin' ? {
    id: 'walkin',
    name: 'Walk-in / Cash Customer',
    phone: '9999999999',
    address: 'Counter Cash Sale, Bhopal, MP',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    gstin: '',
    pan: customerPANInput,
    totalPurchases: 0,
    outstandingBalance: 0,
    createdAt: getISTDate().isoDateStr
  } : (customers.find(c => c.id === selectedCustomerId) || {
    id: selectedCustomerId,
    name: 'Walk-in / Cash Customer',
    phone: '9999999999',
    address: 'Counter Cash Sale, Bhopal, MP',
    city: 'Bhopal',
    state: 'Madhya Pradesh',
    gstin: '',
    pan: customerPANInput,
    totalPurchases: 0,
    outstandingBalance: 0,
    createdAt: getISTDate().isoDateStr
  });

  // Auto-detect Inter-state vs Intra-state supply
  useEffect(() => {
    if (!manualInterStateOverride) {
      const shopState = activeProfile?.gstin || '23';
      const custState = selectedCustomer.gstin || selectedCustomer.state || 'Madhya Pradesh';
      const detectedInterState = isInterStateSupply(shopState, custState);
      setIsInterState(detectedInterState);
      setPlaceOfSupply(detectedInterState ? (selectedCustomer.state || 'Out of State') : 'Madhya Pradesh (23)');
    }
  }, [selectedCustomerId, selectedCustomer.gstin, selectedCustomer.state, activeProfile?.gstin, manualInterStateOverride]);

  const getRateForPurity = (metal: string, purity: string) => {
    const r = rates.find(rate => rate.metal === metal && rate.purity === purity);
    return r ? r.ratePerGram : (metal === 'Artificial' ? 0 : 7000);
  };

  // Recalculate Old Metal Exchange Deduction using pure calculateOldMetalValue
  useEffect(() => {
    if (enableOldExchange) {
      const credit = calculateOldMetalValue(oldExchange);
      setOldExchange(prev => ({ ...prev, totalCreditAmount: credit }));
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

    // Check if stock is available
    const existingInCart = cartItems.find(c => c.itemId === item.id);
    const qtyInCart = existingInCart ? existingInCart.quantity : 0;
    if (item.quantity <= qtyInCart) {
      alert(`स्टॉक समाप्त या अपर्याप्त है। उपलब्ध: ${item.quantity}, कार्ट में: ${qtyInCart}`);
      return;
    }

    const rate = getRateForPurity(item.metal || 'Gold', item.purity || '22K');
    const netWeight = Number(item.netWeight || item.grossWeight || 0);
    const grossWeight = Number(item.grossWeight || netWeight || 0);
    const stoneWeight = Number(item.stoneWeight || 0);
    const stoneValue = Number(item.stoneValue || 0);
    const wastagePercentage = Number(item.wastagePercentage || 0);
    const makingChargeRate = Number(item.makingChargeRate || item.makingChargePerGram || 0);

    const subCalc = calculateItemSubtotal(
      netWeight,
      rate,
      wastagePercentage,
      item.makingChargeType || 'per_gram',
      makingChargeRate,
      stoneValue,
      item.huid ? 45 : 0,
      1
    );

    const hsnGstInfo = getHsnAndGstRate(item.metal, item.category);

    const baseMetalCost = netWeight * (item.purchaseRatePerGram || (rate * 0.94));
    const baseMakingCost = item.makingCostPerGram ? (netWeight * item.makingCostPerGram) : (subCalc.makingCharge * 0.45);
    const baseStoneCost = item.stoneCost || roundPaise(stoneValue * 0.65);
    const itemCostPrice = roundPaise(item.costPrice || (baseMetalCost + baseMakingCost + baseStoneCost + subCalc.huidCharge));
    const isCostEst = item.isCostEstimated || !item.costPrice;

    const unitProfit = roundPaise(subCalc.subtotal - itemCostPrice);
    const marginPct = subCalc.subtotal > 0 ? roundPaise((unitProfit / subCalc.subtotal) * 100) : 0;

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
      metalCost: subCalc.metalCost,
      wastagePercentage: wastagePercentage,
      wastageCost: subCalc.wastageCost,
      makingChargeType: item.makingChargeType || 'per_gram',
      makingChargeRate: makingChargeRate,
      makingCharge: subCalc.makingCharge,
      huidCharge: subCalc.huidCharge,
      subtotal: subCalc.subtotal,
      costPrice: itemCostPrice,
      isCostEstimated: isCostEst,
      unitProfit: unitProfit,
      profitMarginPercent: marginPct,
      hsnCode: item.hsnCode || hsnGstInfo.hsnCode,
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

    const subCalc = calculateItemSubtotal(
      netWeight,
      rate,
      customWastage,
      customMakingType,
      customMakingRate,
      customStoneVal,
      customEnableHuid ? 45 : 0,
      1
    );

    const hsnGstInfo = getHsnAndGstRate(customMetal, 'Custom');

    const customCostPrice = roundPaise((netWeight * (rate * 0.94)) + (subCalc.makingCharge * 0.45) + (customStoneVal * 0.65) + subCalc.huidCharge);
    const unitProfit = roundPaise(subCalc.subtotal - customCostPrice);
    const marginPct = subCalc.subtotal > 0 ? roundPaise((unitProfit / subCalc.subtotal) * 100) : 0;

    const newItem: InvoiceItem = {
      tagNo: `SMJ-MAN-${Math.floor(100 + Math.random() * 900)}`,
      huid: customEnableHuid ? customHuidCode : undefined,
      name: customName || `Handcrafted ${customPurity} ${customMetal} Jewellery`,
      category: 'Jewellery',
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
      metalCost: subCalc.metalCost,
      wastagePercentage: Number(customWastage),
      wastageCost: subCalc.wastageCost,
      makingChargeType: customMakingType,
      makingChargeRate: Number(customMakingRate),
      makingCharge: subCalc.makingCharge,
      huidCharge: subCalc.huidCharge,
      subtotal: subCalc.subtotal,
      costPrice: customCostPrice,
      isCostEstimated: true,
      unitProfit: unitProfit,
      profitMarginPercent: marginPct,
      hsnCode: hsnGstInfo.hsnCode,
      quantity: 1
    };

    setCartItems(prev => [...prev, newItem]);
    setShowCustomItemModal(false);
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
    makingChargeType: 'per_gram' | 'flat' | 'percentage';
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
    const qty = Math.max(1, editCartForm.quantity || 1);
    const netWeight = Math.max(0, editCartForm.grossWeight - editCartForm.stoneWeight);

    const subCalc = calculateItemSubtotal(
      netWeight,
      editCartForm.metalRateApplied,
      editCartForm.wastagePercentage,
      editCartForm.makingChargeType,
      editCartForm.makingChargeRate,
      editCartForm.stoneValue,
      editCartForm.huid ? 45 : 0,
      qty
    );

    const baseMetalCost = netWeight * (editCartForm.metalRateApplied * 0.94);
    const baseMakingCost = subCalc.makingCharge * 0.45;
    const baseStoneCost = roundPaise(editCartForm.stoneValue * 0.65);
    const costPrice = roundPaise((baseMetalCost + baseMakingCost + baseStoneCost + subCalc.huidCharge) * qty);
    const unitProfit = roundPaise(subCalc.subtotal - costPrice);
    const marginPct = subCalc.subtotal > 0 ? roundPaise((unitProfit / subCalc.subtotal) * 100) : 0;

    const updated: InvoiceItem = {
      ...originalItem,
      name: editCartForm.name,
      grossWeight: Number(editCartForm.grossWeight),
      stoneWeight: Number(editCartForm.stoneWeight),
      stoneValue: Number(editCartForm.stoneValue),
      netWeight: Number(netWeight.toFixed(2)),
      metalRateApplied: Number(editCartForm.metalRateApplied),
      metalCost: subCalc.metalCost,
      wastagePercentage: Number(editCartForm.wastagePercentage),
      wastageCost: subCalc.wastageCost,
      makingChargeType: editCartForm.makingChargeType,
      makingChargeRate: Number(editCartForm.makingChargeRate),
      makingCharge: subCalc.makingCharge,
      huid: editCartForm.huid || undefined,
      huidCharge: subCalc.huidCharge,
      subtotal: subCalc.subtotal,
      costPrice,
      unitProfit,
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

  // Proportional discount allocation
  const allocatedDiscounts = allocateBillDiscount(
    cartItems.map(i => ({ grossSubtotal: i.subtotal, itemDiscount: 0 })),
    discountAmount
  );

  // Taxable value calculations (Old Gold Mode: After Tax vs Pre-Tax)
  // TODO(CA): Confirm Old Gold GST deduction mode (Default: GST on FULL new jewellery value, Old Gold as after-tax credit)
  const preTaxOldGoldDeduction = (enableOldExchange && oldExchangeMode === 'pre_tax') ? oldMetalDeduction : 0;
  const taxableAmount = Math.max(0, itemsSubtotal - discountAmount - preTaxOldGoldDeduction);
  const totalHuidFee = cartItems.reduce((acc, i) => acc + (i.huidCharge || 0), 0);

  // Dynamic GST calculation based on invoiceType
  const isGSTEnabled = invoiceType === 'GST_INVOICE';
  const taxBreakdown = calculateTaxBreakdown(taxableAmount, isInterState, isGSTEnabled ? 3.0 : 0);

  const afterTaxOldGoldCredit = (enableOldExchange && oldExchangeMode === 'after_tax') ? oldMetalDeduction : 0;
  const grandTotal = Math.max(0, roundPaise(taxableAmount + taxBreakdown.totalTax - afterTaxOldGoldCredit));

  // Compliance warning check
  const cashPaidAmount = paymentMethod === 'Cash' ? amountPaid : 0;
  const compliance = checkComplianceWarnings(grandTotal, cashPaidAmount, selectedCustomer.pan || customerPANInput);

  // Sync default amount paid
  useEffect(() => {
    setAmountPaid(grandTotal);
  }, [grandTotal]);

  // Handle Quick Add Customer
  const handleQuickAddCust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;

    if (newCustGSTIN && !validateGstin(newCustGSTIN)) {
      alert('कृपया सही 15-अंकीय GSTIN संख्या दर्ज करें।');
      return;
    }

    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: newCustName,
      phone: newCustPhone,
      address: newCustAddress || 'Kolar Road, Bhopal',
      city: 'Bhopal',
      state: 'Madhya Pradesh (23)',
      gstin: newCustGSTIN.toUpperCase(),
      aadhaar: newCustAadhaar,
      pan: newCustPAN.toUpperCase(),
      totalPurchases: 0,
      outstandingBalance: 0,
      createdAt: getISTDate().isoDateStr
    };

    onAddCustomer(newCust);
    setSelectedCustomerId(newCust.id);
    setShowQuickCustModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustGSTIN('');
    setNewCustPAN('');
  };

  // Finalize Invoice Creation
  const handleGenerateInvoice = async () => {
    if (cartItems.length === 0) {
      alert("कृपया बिल में कम से कम एक आभूषण आइटम जोड़ें।");
      return;
    }

    // Verify stock availability
    const stockCheck = checkStockAvailability(cartItems, inventory);
    if (!stockCheck.canFulfill) {
      const msgs = stockCheck.issues.map(i => i.error).join('\n');
      alert(`स्टॉक में कमी:\n${msgs}`);
      return;
    }

    if (compliance.panMissing) {
      alert(compliance.message || '₹2 लाख से अधिक के बिल हेतु PAN नंबर आवश्यक है।');
      return;
    }

    if (amountPaid > grandTotal) {
      alert(`प्राप्त राशि (₹${amountPaid}) कुल बिल राशि (₹${grandTotal}) से अधिक नहीं हो सकती।`);
      return;
    }

    setIsSubmitting(true);

    try {
      const prefix = isGSTEnabled ? 'SMJ' : 'EST';
      const dueAmt = Math.max(0, roundPaise(grandTotal - amountPaid));

      const invoiceDraft: Omit<GSTInvoice, 'id' | 'invoiceNumber'> = {
        invoiceType,
        date: getISTDate().isoDateStr,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerPhone: selectedCustomer.phone,
        customerAddress: selectedCustomer.address,
        customerGSTIN: selectedCustomer.gstin,
        customerPAN: selectedCustomer.pan || customerPANInput,
        placeOfSupply,
        isInterState,
        profileId: activeProfile?.id,
        counterName: activeProfile?.counterName,
        items: cartItems,
        oldMetalExchange: enableOldExchange ? oldExchange : undefined,
        itemsSubtotal,
        oldMetalDeduction,
        taxableAmount,
        cgstRate: taxBreakdown.cgstRate,
        sgstRate: taxBreakdown.sgstRate,
        igstRate: taxBreakdown.igstRate,
        cgstAmount: taxBreakdown.cgstAmount,
        sgstAmount: taxBreakdown.sgstAmount,
        igstAmount: taxBreakdown.igstAmount,
        totalTax: taxBreakdown.totalTax,
        hallmarkingTotalFee: totalHuidFee,
        discountAmount,
        grandTotal,
        payment: {
          method: paymentMethod,
          amountPaid,
          dueAmount: dueAmt,
          transactionRef: transactionRef.trim() || undefined
        },
        status: dueAmt === 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid',
        notes: notes || (isGSTEnabled ? '100% Certified BIS 916 HUID Hallmarked.' : 'Quotation / Estimate Bill.'),
        hallmarkCertified
      };

      await onCreateInvoice(invoiceDraft, prefix);

      // Reset POS cart
      setCartItems([]);
      setDiscountAmount(0);
      setNotes('');
      setTransactionRef('');
      setEnableOldExchange(false);
      setCustomerPANInput('');
    } catch (err: any) {
      console.error(err);
      alert(`इनवॉइस बनाने में त्रुटि: ${err.message || String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
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
      posCategoryFilter === 'Artificial' ? i.metal === 'Artificial' :
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
    <div className="space-y-6 font-sans">
      
      {/* Top Invoice Type Mode Toggle & Customer Select Bar */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Bill Type Selector (GST Tax Invoice vs Non-GST Estimate) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-stone-500 dark:text-slate-400 font-bold uppercase tracking-wider">Bill Mode:</span>
            <div className="flex bg-stone-100 dark:bg-slate-800 p-1 rounded-xl border border-stone-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setInvoiceType('GST_INVOICE')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  invoiceType === 'GST_INVOICE'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                GST Tax Invoice (पक्का बिल - 3%)
              </button>
              <button
                type="button"
                onClick={() => setInvoiceType('ESTIMATE_BILL')}
                className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  invoiceType === 'ESTIMATE_BILL'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Estimate / Kachha Receipt (कच्चा बिल - 0% Tax)
              </button>
            </div>

            {invoiceType === 'ESTIMATE_BILL' && (
              <span className="text-[11px] bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-lg border border-amber-200/80 dark:border-amber-800/60 font-medium">
                No GST added • Quotation Mode
              </span>
            )}
          </div>

          {/* Customer Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500 max-w-xs"
            >
              <option value="walkin">🛒 Walk-in / Cash Customer (नगद ग्राहक)</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowQuickCustModal(true)}
              className="px-3 py-1.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-300 font-bold text-xs rounded-xl border border-stone-300 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>+ New Customer</span>
            </button>
          </div>
        </div>

        {/* Selected Customer Card Details */}
        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-stone-600 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-bold text-stone-900 dark:text-slate-100">{selectedCustomer.name}</span>
            <span>•</span>
            <span className="font-mono">{selectedCustomer.phone}</span>
            <span>•</span>
            <span className="truncate max-w-xs">{selectedCustomer.address}</span>
            {selectedCustomer.gstin && (
              <>
                <span>•</span>
                <span className="font-mono font-bold text-amber-800 dark:text-amber-400">GST: {selectedCustomer.gstin}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isGSTEnabled && (
              <label className="flex items-center gap-1.5 text-xs text-stone-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInterState}
                  onChange={(e) => {
                    setManualInterStateOverride(true);
                    setIsInterState(e.target.checked);
                  }}
                  className="rounded accent-amber-600"
                />
                <span>Inter-state Sale (IGST 3%)</span>
              </label>
            )}

            <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded-lg font-mono text-[11px] border border-amber-200/80 dark:border-amber-800/60 font-bold">
              Counter: {activeProfile?.counterName || 'Main Showroom'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Billing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (8 cols): Item Selection & Cart */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Quick Item Search & Manual Item Trigger */}
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Scan Barcode / HUID or search stock item..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-stone-900 dark:text-slate-100 placeholder-stone-400 focus:outline-none focus:border-amber-500 transition"
                />
                <Scan className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(true)}
                  className="px-3.5 py-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800/60 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                  + Custom / Unstocked Item
                </button>
              </div>
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
              <span className="text-[11px] text-stone-400 dark:text-slate-500 font-bold uppercase tracking-wider shrink-0 mr-1">
                Filter Stock:
              </span>
              {[
                { id: 'All', label: 'All Items (सभी आइटम)' },
                { id: 'Gold', label: 'Gold (सोना)' },
                { id: 'Silver', label: 'Silver (चांदी)' },
                { id: 'Artificial', label: 'Artificial (इमिटेशन जेवर)' },
                { id: 'Gemstone', label: 'Gemstones (रत्न)' },
                { id: 'Diamond', label: 'Diamonds (हीरा)' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setPosCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition cursor-pointer ${
                    posCategoryFilter === cat.id
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700 border border-stone-200 dark:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Live Search & Filter Results Dropdown */}
            {(itemSearch.trim() || posCategoryFilter !== 'All') && (
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl max-h-72 overflow-y-auto divide-y divide-stone-100 dark:divide-slate-800 shadow-md">
                {filteredInventory.length === 0 ? (
                  <div className="p-4 text-center space-y-2">
                    <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">स्टॉक में "{itemSearch}" नाम से कोई आभूषण नहीं मिला।</p>
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
                        className="p-3 hover:bg-amber-50/50 dark:hover:bg-slate-800/80 transition cursor-pointer flex items-center justify-between text-xs text-stone-800 dark:text-slate-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Tag className="w-5 h-5 text-stone-300 dark:text-slate-600" />
                            )}
                          </div>
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-amber-900 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.5 rounded text-[11px] border border-amber-200 dark:border-amber-800">{item.tagNo}</span>
                              <span className="font-bold text-stone-900 dark:text-slate-100 truncate">{item.name}</span>
                              {item.huid && (
                                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">HUID: {item.huid}</span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 dark:text-slate-400">
                              {item.purity} {item.metal} • Net: {item.netWeight.toFixed(2)}g • Stock: <strong className={item.quantity > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>{item.quantity}</strong>
                            </div>
                          </div>
                        </div>
                        <button type="button" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-xl shadow-xs">
                          + Add
                        </button>
                      </div>
                    ))}

                    {itemSearch.trim() && (
                      <div
                        onClick={() => {
                          setCustomName(itemSearch);
                          setShowCustomItemModal(true);
                        }}
                        className="p-3 bg-amber-50 dark:bg-slate-800 hover:bg-amber-100/80 transition cursor-pointer flex items-center justify-between text-xs text-amber-900 dark:text-amber-300 font-bold border-t border-amber-200 dark:border-slate-700"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                          <span>कस्टम / अनस्टॉक्ड आइटम: "{itemSearch}" बनाएं व बिल में जोड़ें</span>
                        </div>
                        <span className="text-[11px] bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-black px-2.5 py-1 rounded-lg">
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
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 bg-stone-50 dark:bg-slate-800/80 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 dark:text-slate-100 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Items on Bill ({cartItems.length})
              </span>
              <span className="text-xs text-stone-500 dark:text-slate-400 font-medium">Click Edit to modify or Trash to remove</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 dark:bg-slate-800/50 border-b border-stone-200 dark:border-slate-800 text-stone-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10">Img</th>
                    <th className="py-2.5 px-3">Item / HUID / HSN</th>
                    <th className="py-2.5 px-3">Purity & Rate</th>
                    <th className="py-2.5 px-3 text-right">Gross Wt</th>
                    <th className="py-2.5 px-3 text-right">Net Wt</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Making / Labor</th>
                    <th className="py-2.5 px-3 text-right">Subtotal</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-stone-400 dark:text-slate-500">
                        <ShoppingBag className="w-8 h-8 mx-auto text-stone-300 dark:text-slate-600 mb-2" />
                        No jewellery items in the bill yet. Scan a barcode or pick an item above.
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, index) => {
                      const invItem = inventory.find(i => i.id === item.itemId);
                      return (
                      <tr key={index} className="hover:bg-amber-50/20 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3">
                          <div className="w-10 h-10 rounded border border-stone-100 dark:border-slate-700 bg-stone-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                            {invItem?.image ? (
                              <img src={invItem.image} alt={item.name} className="w-full h-full object-cover" />
                            ) : (
                              <Tag className="w-4 h-4 text-stone-300 dark:text-slate-600" />
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-stone-900 dark:text-slate-100 line-clamp-1">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-stone-500 dark:text-slate-400 font-mono mt-0.5">
                            <span>{item.tagNo}</span>
                            <span>•</span>
                            <span>HSN: {item.hsnCode}</span>
                            {item.huid && (
                              <span className="text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1 rounded border border-emerald-200 dark:border-emerald-800">
                                HUID: {item.huid} (+₹45)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-bold text-amber-800 dark:text-amber-400 block">{item.purity} {item.metal}</span>
                          <span className="text-[10px] text-stone-500 dark:text-slate-400 font-mono">₹{item.metalRateApplied}/g</span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-stone-700 dark:text-slate-300">
                          {item.grossWeight.toFixed(2)}g
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700 dark:text-amber-400">
                          {item.netWeight.toFixed(2)}g
                        </td>

                        <td className="py-2.5 px-3 text-center font-mono font-bold text-stone-900 dark:text-slate-100">
                          {item.quantity || 1}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="text-stone-900 dark:text-slate-100 font-medium block">₹{item.makingCharge.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-stone-500 dark:text-slate-400 font-semibold">
                            {item.makingChargeType === 'per_gram' ? `₹${item.makingChargeRate}/g` : item.makingChargeType === 'percentage' ? `${item.makingChargeRate}%` : 'Flat'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-black text-stone-900 dark:text-slate-100">
                          ₹{item.subtotal.toLocaleString('en-IN')}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleStartEditCartItem(index)}
                              className="p-1 text-stone-400 hover:text-amber-700 dark:hover:text-amber-400 transition cursor-pointer"
                              title="Edit item in bill"
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
                    );
                  })
                )}
              </tbody>
              </table>
            </div>
          </div>

          {/* Old Gold & Silver Exchange Section */}
          <div className="bg-amber-50/40 dark:bg-slate-900 border border-amber-200/90 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableOldExchange}
                  onChange={(e) => setEnableOldExchange(e.target.checked)}
                  className="rounded accent-amber-600 w-4 h-4 cursor-pointer"
                />
                <span className="font-bold text-amber-950 dark:text-amber-300 text-xs flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  Old Gold / Silver Buyback & Exchange (पुरानी सोना / चांदी वापसी)
                </span>
              </label>

              {enableOldExchange && (
                <div className="flex items-center gap-2">
                  <div className="flex bg-stone-100 dark:bg-slate-800 p-0.5 rounded-lg border border-stone-200 dark:border-slate-700 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setOldExchangeMode('after_tax')}
                      className={`px-2 py-0.5 rounded font-bold transition ${oldExchangeMode === 'after_tax' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-stone-600 dark:text-slate-300'}`}
                      title="GST charged on full new jewellery value; old gold subtracted after tax"
                    >
                      Standard GST (After Tax Credit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setOldExchangeMode('pre_tax')}
                      className={`px-2 py-0.5 rounded font-bold transition ${oldExchangeMode === 'pre_tax' ? 'bg-amber-600 text-white shadow-2xs' : 'text-stone-600 dark:text-slate-300'}`}
                      title="Old gold subtracted before GST calculation"
                    >
                      Pre-Tax Mode
                    </button>
                  </div>
                </div>
              )}
            </div>

            {enableOldExchange && (
              <div className="pt-2 border-t border-amber-200/60 dark:border-slate-800 space-y-3 text-xs">
                {/* Seller KYC Note */}
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-stone-200 dark:border-slate-700 space-y-2">
                  <span className="font-bold text-stone-800 dark:text-slate-200 text-[11px] block">
                    विक्रेता की जानकारी / Seller KYC Note (Walk-in Customer ID Proof)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="विक्रेता नाम (Seller Name)"
                      value={oldExchangeSellerKYC.sellerName}
                      onChange={(e) => setOldExchangeSellerKYC(prev => ({ ...prev, sellerName: e.target.value }))}
                      className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="मोबाइल (Mobile No)"
                      value={oldExchangeSellerKYC.sellerPhone}
                      onChange={(e) => setOldExchangeSellerKYC(prev => ({ ...prev, sellerPhone: e.target.value }))}
                      className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Aadhaar / Voter ID No"
                      value={oldExchangeSellerKYC.sellerAadhaar}
                      onChange={(e) => setOldExchangeSellerKYC(prev => ({ ...prev, sellerAadhaar: e.target.value }))}
                      className="bg-stone-50 dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs"
                    />
                  </div>
                </div>

                {oldExchange.mode === 'weight_rate' ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-stone-600 dark:text-slate-400 mb-1 text-[11px] font-medium">Metal</label>
                      <select
                        value={oldExchange.metal}
                        onChange={(e) => {
                          const m = e.target.value as MetalType;
                          const rate = rates.find(r => r.metal === m && r.purity.includes('22K'))?.ratePerGram || 6800;
                          setOldExchange(prev => ({ ...prev, metal: m, ratePerGram: rate }));
                        }}
                        className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-stone-900 dark:text-slate-100 font-medium"
                      >
                        <option value="Gold">Old Gold</option>
                        <option value="Silver">Old Silver</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-stone-600 dark:text-slate-400 mb-1 text-[11px] font-medium">Gross Weight (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={oldExchange.grossWeight || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, grossWeight: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-stone-900 dark:text-slate-100 font-mono font-bold"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 dark:text-slate-400 mb-1 text-[11px] font-medium">Melt Loss / काट (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={oldExchange.dustWastageGram || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, dustWastageGram: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-stone-900 dark:text-slate-100 font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 dark:text-slate-400 mb-1 text-[11px] font-medium">Purity Touch (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={oldExchange.meltPurityPercent || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, meltPurityPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-stone-900 dark:text-slate-100 font-mono"
                        placeholder="91.6"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 dark:text-slate-400 mb-1 text-[11px] font-medium">Exchange Rate ₹/g</label>
                      <input
                        type="number"
                        value={oldExchange.ratePerGram || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, ratePerGram: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-amber-800 dark:text-amber-400 font-mono font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-stone-600 dark:text-slate-400 mb-1 text-[11px] font-medium">Direct Agreed Valuation Amount (सीधा तय भाव ₹) *</label>
                      <input
                        type="number"
                        value={oldExchange.lumpSumAmount || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, lumpSumAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 45000"
                        className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-amber-900 dark:text-amber-300 font-mono font-black text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 dark:text-slate-400 mb-1 text-[11px] font-medium">Old Ornament Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Old broken 22K chain + tops"
                        value={oldExchange.description || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-3 bg-amber-100/80 dark:bg-slate-800 border border-amber-300/80 dark:border-slate-700 rounded-xl text-xs">
                  <span className="text-amber-900 dark:text-amber-300 font-bold">Old Metal Credit To Deduct:</span>
                  <span className="font-mono font-black text-amber-950 dark:text-amber-200 text-base">
                    - ₹{oldExchange.totalCreditAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 cols): Bill Summary, Tax & Payment Desk */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 sticky top-[150px]">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-stone-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                {isGSTEnabled ? 'Tax Invoice Summary' : 'Estimate Summary'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isGSTEnabled ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'}`}>
                {isGSTEnabled ? 'GST 3%' : 'Estimate 0%'}
              </span>
            </div>

            {/* Compliance Warning */}
            {compliance.message && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-[11px] font-bold text-rose-800 dark:text-rose-300 flex items-start gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{compliance.message}</span>
              </div>
            )}

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-stone-600 dark:text-slate-400">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-stone-900 dark:text-slate-100">₹{itemsSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                  <span>Less: Discount Before Tax:</span>
                  <span className="font-mono">- ₹{discountAmount.toLocaleString('en-IN')}</span>
                </div>
              )}

              {preTaxOldGoldDeduction > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                  <span>Less: Old Gold Pre-Tax Credit:</span>
                  <span className="font-mono font-bold">- ₹{preTaxOldGoldDeduction.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-stone-800 dark:text-slate-200 font-bold pt-1 border-t border-stone-100 dark:border-slate-800">
                <span>Taxable Value:</span>
                <span className="font-mono font-bold">₹{taxableAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* GST Rows */}
              {isGSTEnabled ? (
                isInterState ? (
                  <div className="flex justify-between text-stone-600 dark:text-slate-400">
                    <span>IGST (3.0%):</span>
                    <span className="font-mono font-bold text-stone-900 dark:text-slate-100">₹{taxBreakdown.igstAmount.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-stone-600 dark:text-slate-400">
                      <span>CGST (1.5%):</span>
                      <span className="font-mono font-bold text-stone-900 dark:text-slate-100">₹{taxBreakdown.cgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-stone-600 dark:text-slate-400">
                      <span>SGST (1.5%):</span>
                      <span className="font-mono font-bold text-stone-900 dark:text-slate-100">₹{taxBreakdown.sgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )
              ) : (
                <div className="flex justify-between text-stone-400 italic text-[11px]">
                  <span>GST (Non-GST Estimate):</span>
                  <span>₹0.00</span>
                </div>
              )}

              {afterTaxOldGoldCredit > 0 && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-bold pt-1 border-t border-stone-100 dark:border-slate-800">
                  <span>Less: Old Gold Credit (After Tax):</span>
                  <span className="font-mono">- ₹{afterTaxOldGoldCredit.toLocaleString('en-IN')}</span>
                </div>
              )}

              {/* Discount Input */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-stone-600 dark:text-slate-400">Round-off / Discount (₹):</span>
                <div className="flex items-center gap-1 w-28">
                  <input
                    type="number"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-lg px-2 py-1 text-right font-mono text-xs text-stone-900 dark:text-slate-100 focus:bg-white"
                  />
                </div>
              </div>

              {/* Customer PAN Input if Required */}
              {grandTotal > 200000 && (
                <div className="pt-2">
                  <label className="block text-rose-700 dark:text-rose-400 font-bold mb-1">
                    Customer PAN No (Mandatory for &gt; ₹2 Lakhs) *
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. ABCDE1234F"
                    value={customerPANInput}
                    onChange={(e) => setCustomerPANInput(e.target.value.toUpperCase())}
                    className="w-full bg-rose-50 dark:bg-slate-800 border border-rose-300 dark:border-rose-700 rounded-xl px-3 py-1.5 font-mono uppercase font-bold text-xs"
                  />
                </div>
              )}

              {/* Grand Total Box */}
              <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-300 dark:border-amber-700 rounded-2xl flex items-center justify-between mt-3 shadow-2xs">
                <div>
                  <span className="text-xs font-extrabold text-stone-900 dark:text-slate-100 block">Total Amount Due</span>
                  <span className="text-[10px] text-stone-500 dark:text-slate-400 font-medium">Net payable by customer</span>
                </div>
                <span className="text-2xl font-black text-amber-800 dark:text-amber-400 font-mono">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-slate-800 text-xs">
              <label className="block text-stone-600 dark:text-slate-400 font-bold">Payment Mode</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['UPI/GPay', 'Cash', 'Card', 'Bank Transfer', 'Mixed'] as PaymentMethod[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 px-2 rounded-xl font-bold text-[11px] transition text-center truncate cursor-pointer ${
                      paymentMethod === m
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 hover:bg-stone-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {paymentMethod !== 'Cash' && (
                <div className="pt-1">
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Transaction Reference / UTR (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Ref No (no fake auto-ref)"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              )}

              <div className="pt-2">
                <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Amount Received Now (₹)</label>
                <input
                  type="number"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl px-3 py-2 text-emerald-800 dark:text-emerald-400 font-mono font-black text-base focus:bg-white"
                />
              </div>

              {amountPaid < grandTotal && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 rounded-xl text-rose-800 dark:text-rose-300 text-[11px] flex justify-between font-mono font-bold">
                  <span>Balance Due / Khata:</span>
                  <span>₹{(grandTotal - amountPaid).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              type="button"
              onClick={handleGenerateInvoice}
              disabled={cartItems.length === 0 || isSubmitting}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{isSubmitting ? 'प्रक्रिया जारी है...' : (isGSTEnabled ? 'Generate Tax Invoice [F2]' : 'Generate Estimate Receipt')}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Custom / Manual Item Entry */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
              <h3 className="font-extrabold text-stone-900 dark:text-slate-100 text-base flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-lg">
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

            <form onSubmit={handleAddCustomItem} className="space-y-4 mt-3 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Item Description (आभूषण का नाम) *</label>
                <input
                  type="text"
                  placeholder="उदा. 22K Traditional Bridal Haar या Artificial Necklace"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-stone-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Metal Type (धातु प्रकार) *</label>
                  <select
                    value={customMetal}
                    onChange={(e) => setCustomMetal(e.target.value as MetalType)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 font-semibold focus:border-amber-500"
                  >
                    <option value="Gold">Gold (सोना)</option>
                    <option value="Silver">Silver (चाँदी)</option>
                    <option value="Artificial">Artificial / Imitation (इमिटेशन जेवर)</option>
                    <option value="Platinum">Platinum (प्लैटिनम)</option>
                    <option value="Diamond">Diamond / Gemstone (हीरा व रत्न)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Purity (शुद्धता / कैरेट) *</label>
                  <select
                    value={customPurity}
                    onChange={(e) => setCustomPurity(e.target.value)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 font-bold focus:border-amber-500"
                  >
                    <option value="24K">24K Pure Gold (99.9%)</option>
                    <option value="22K">22K (916 BIS Hallmark)</option>
                    <option value="18K">18K (750 Diamond Setting)</option>
                    <option value="14K">14K Light Jewellery</option>
                    <option value="Standard">Standard / Imitation Grade</option>
                    <option value="999 Fine">Silver 999 Fine (सिक्का)</option>
                    <option value="925 Sterling">Silver 925 Sterling (चांदी जेवर)</option>
                  </select>
                </div>
              </div>

              {/* Weight Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Gross Wt (सकल वजन g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customGrossWt}
                    onChange={(e) => setCustomGrossWt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 font-mono font-bold focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Stone Wt (नग वजन g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customStoneWt}
                    onChange={(e) => setCustomStoneWt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 text-stone-800 dark:text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Net Metal Wt</label>
                  <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 font-mono font-extrabold text-amber-900 dark:text-amber-300 text-sm">
                    {Math.max(0, customGrossWt - customStoneWt).toFixed(2)} g
                  </div>
                </div>
              </div>

              {/* Making charges & HUID */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Making Charge Mode</label>
                  <select
                    value={customMakingType}
                    onChange={(e) => setCustomMakingType(e.target.value as any)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-stone-900 dark:text-slate-100 font-medium"
                  >
                    <option value="per_gram">₹ प्रति ग्राम (Per Gram)</option>
                    <option value="percentage">% प्रतिशत (Percentage %)</option>
                    <option value="flat">एकमुश्त (Fixed Flat ₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Making Rate</label>
                  <input
                    type="number"
                    step={customMakingType === 'percentage' ? '0.1' : '1'}
                    value={customMakingRate}
                    onChange={(e) => setCustomMakingRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-stone-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Wastage %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customWastage}
                    onChange={(e) => setCustomWastage(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-2 py-1.5 text-stone-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="px-4 py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
              <h3 className="font-extrabold text-base">नया ग्राहक जोड़ें (Quick Add Customer)</h3>
              <button 
                onClick={() => setShowQuickCustModal(false)} 
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddCust} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Customer Name (ग्राहक का नाम) *</label>
                <input
                  type="text"
                  placeholder="उदा. श्रीमती अनिता शर्मा"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Phone Number (मोबाइल नंबर) *</label>
                <input
                  type="text"
                  placeholder="उदा. 9826012345"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">GSTIN Number</label>
                  <input
                    type="text"
                    placeholder="23AAAAA0000A1Z5"
                    value={newCustGSTIN}
                    onChange={(e) => setNewCustGSTIN(e.target.value.toUpperCase())}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    value={newCustPAN}
                    onChange={(e) => setNewCustPAN(e.target.value.toUpperCase())}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Address (निवास पता)</label>
                <input
                  type="text"
                  placeholder="उदा. कोलार रोड, भोपाल"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowQuickCustModal(false)}
                  className="px-4 py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-stone-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white font-extrabold rounded-xl shadow-md transition cursor-pointer"
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
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-stone-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-stone-900 dark:text-slate-100">
                    बिल में आइटम विवरण बदलें (Edit Item in Bill)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-slate-400">वजन, मात्रा, भाव व मेकिंग चार्ज संशोधित करें</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingCartIndex(null);
                  setEditCartForm(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCartItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Item Name (आभूषण का नाम) *</label>
                <input
                  type="text"
                  required
                  value={editCartForm.name}
                  onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, name: e.target.value }) : null)}
                  className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3.5 py-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Gross Wt (g) *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={editCartForm.grossWeight || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, grossWeight: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Stone Wt (g)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={editCartForm.stoneWeight || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, stoneWeight: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editCartForm.quantity || 1}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, quantity: Math.max(1, parseInt(e.target.value) || 1) }) : null)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-stone-600 dark:text-slate-400 mb-1 font-bold">Rate (₹/g) *</label>
                  <input
                    type="number"
                    required
                    value={editCartForm.metalRateApplied || ''}
                    onChange={(e) => setEditCartForm(prev => prev ? ({ ...prev, metalRateApplied: parseFloat(e.target.value) || 0 }) : null)}
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-amber-800 dark:text-amber-400"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCartIndex(null);
                    setEditCartForm(null);
                  }}
                  className="px-4 py-2 bg-stone-100 dark:bg-slate-800 text-stone-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl shadow-md transition cursor-pointer"
                >
                  Update Item in Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
