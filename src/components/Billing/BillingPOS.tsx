import React, { useState, useEffect } from 'react';
import { JewelleryItem, Customer, GSTInvoice, InvoiceItem, MetalRate, OldMetalExchange, PaymentMethod, JewellerProfile, InvoiceType, MetalType } from '../../types';
import { Search, Plus, Trash2, Calculator, ShoppingBag, Coins, Sparkles, Check, UserPlus, ArrowRight, ShieldCheck, Tag, Receipt, Gem, Scan } from 'lucide-react';

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
    const rate = getRateForPurity(item.metal, item.purity);
    const metalCost = item.netWeight * rate;
    const wastageCost = item.netWeight * (item.wastagePercentage / 100) * rate;
    const makingCharge = item.makingChargeType === 'per_gram'
      ? item.netWeight * item.makingChargeRate
      : item.makingChargeRate;
    const huidCharge = item.huid ? 45 : 0;
    const subtotal = metalCost + wastageCost + makingCharge + item.stoneValue + huidCharge;

    const newItem: InvoiceItem = {
      itemId: item.id,
      tagNo: item.tagNo,
      huid: item.huid,
      name: item.name,
      category: item.category,
      metal: item.metal,
      purity: item.purity,
      grossWeight: item.grossWeight,
      netWeight: item.netWeight,
      stoneWeight: item.stoneWeight,
      stoneValue: item.stoneValue,
      stoneDetails: item.stoneType ? {
        type: item.stoneType,
        carat: item.stoneCarat || 0,
        ratti: Number(((item.stoneCarat || 0) * 1.1).toFixed(2)),
        certNo: item.labCertNo
      } : undefined,
      metalRateApplied: rate,
      metalCost: Math.round(metalCost),
      wastagePercentage: item.wastagePercentage,
      wastageCost: Math.round(wastageCost),
      makingChargeType: item.makingChargeType,
      makingChargeRate: item.makingChargeRate,
      makingCharge: Math.round(makingCharge),
      huidCharge: huidCharge,
      subtotal: Math.round(subtotal),
      hsnCode: item.hsnCode || '7113',
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
      subtotal: Math.round(subtotal),
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

  const filteredInventory = inventory.filter(i =>
    i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
    i.tagNo.toLowerCase().includes(itemSearch.toLowerCase()) ||
    (i.huid && i.huid.toLowerCase().includes(itemSearch.toLowerCase())) ||
    i.barcode.toLowerCase().includes(itemSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top Invoice Type Mode Toggle & Customer Select Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Bill Type Selector (GST Tax Invoice vs Non-GST Estimate) */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Bill Mode:</span>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setInvoiceType('GST_INVOICE')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  invoiceType === 'GST_INVOICE'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                GST Tax Invoice (पक्का बिल - 3%)
              </button>
              <button
                onClick={() => setInvoiceType('ESTIMATE_BILL')}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  invoiceType === 'ESTIMATE_BILL'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                Estimate / Kachha Receipt (कच्चा बिल - 0% Tax)
              </button>
            </div>

            {invoiceType === 'ESTIMATE_BILL' && (
              <span className="text-[11px] bg-amber-500/10 text-amber-300 px-2 py-1 rounded-lg border border-amber-500/20 font-medium">
                No GST added • Quotation Mode
              </span>
            )}
          </div>

          {/* Customer Selector */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500 max-w-xs"
            >
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
              ))}
            </select>

            <button
              onClick={() => setShowQuickCustModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1 transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ New Customer</span>
            </button>
          </div>
        </div>

        {/* Selected Customer Card Details */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-200">{selectedCustomer.name}</span>
            <span>•</span>
            <span className="font-mono">{selectedCustomer.phone}</span>
            <span>•</span>
            <span>{selectedCustomer.address}</span>
          </div>

          <div className="flex items-center gap-3">
            {isGSTEnabled && (
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInterState}
                  onChange={(e) => setIsInterState(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>Inter-state Sale (IGST 3%)</span>
              </label>
            )}

            <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-700">
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  placeholder="Scan Barcode / HUID or search stock item..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <Scan className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowCustomItemModal(true)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-400" />
                  + Custom / Unstocked Item
                </button>
              </div>
            </div>

            {/* Live Search Results Dropdown */}
            {itemSearch.trim() && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-800/80">
                {filteredInventory.length === 0 ? (
                  <p className="p-3 text-xs text-slate-500 text-center">No inventory matching "{itemSearch}"</p>
                ) : (
                  filteredInventory.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleAddItemToCart(item)}
                      className="p-2.5 hover:bg-slate-800/60 transition cursor-pointer flex items-center justify-between text-xs text-slate-200"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-400 font-bold bg-slate-900 px-1 rounded">{item.tagNo}</span>
                          <span className="font-bold">{item.name}</span>
                          {item.huid && (
                            <span className="text-[10px] text-emerald-400 font-mono">HUID: {item.huid}</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {item.purity} {item.metal} • Net: {item.netWeight.toFixed(2)}g • Qty in Stock: {item.quantity}
                        </div>
                      </div>
                      <button className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg">
                        + Add to Bill
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Cart Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                Items on Bill ({cartItems.length})
              </span>
              <span className="text-xs text-slate-400">Press Delete to remove item</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/40 border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
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
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <ShoppingBag className="w-8 h-8 mx-auto text-slate-700 mb-2" />
                        No jewellery items in the bill yet. Scan a barcode or pick an item above.
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-100 line-clamp-1">{item.name}</p>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                            <span>{item.tagNo}</span>
                            {item.huid && (
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-1 rounded border border-emerald-500/20">
                                HUID: {item.huid} (+₹45)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <span className="font-bold text-amber-300 block">{item.purity}</span>
                          <span className="text-[10px] text-slate-400 font-mono">₹{item.metalRateApplied}/g</span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {item.grossWeight.toFixed(2)}g
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                          {item.stoneWeight > 0 ? (
                            <div>
                              <span>{item.stoneWeight.toFixed(2)}g</span>
                              {item.stoneValue > 0 && <span className="block text-[10px] text-amber-400 font-bold">+₹{item.stoneValue}</span>}
                            </div>
                          ) : '-'}
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                          {item.netWeight.toFixed(2)}g
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className="text-slate-200 block">₹{item.makingCharge.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-500">
                            {item.makingChargeType === 'per_gram' ? `₹${item.makingChargeRate}/g` : 'Flat'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-100">
                          ₹{item.subtotal.toLocaleString('en-IN')}
                        </td>

                        <td className="py-2.5 px-2 text-center">
                          <button
                            onClick={() => handleRemoveFromCart(index)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Old Gold & Silver Exchange Section (पुरानी सोना/चांदी वापसी) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableOldExchange}
                  onChange={(e) => setEnableOldExchange(e.target.checked)}
                  className="rounded accent-amber-500 w-4 h-4"
                />
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Old Gold / Silver Buyback & Exchange (पुरानी सोना / चांदी वापसी)
                </span>
              </label>

              {enableOldExchange && (
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setOldExchange(prev => ({ ...prev, mode: 'weight_rate' }))}
                    className={`px-2 py-0.5 rounded font-medium ${oldExchange.mode === 'weight_rate' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    Mode A: Weight & Purity %
                  </button>
                  <button
                    type="button"
                    onClick={() => setOldExchange(prev => ({ ...prev, mode: 'lump_sum' }))}
                    className={`px-2 py-0.5 rounded font-medium ${oldExchange.mode === 'lump_sum' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                  >
                    Mode B: Direct Lump-Sum ₹
                  </button>
                </div>
              )}
            </div>

            {enableOldExchange && (
              <div className="pt-2 border-t border-slate-800/80 space-y-3 text-xs">
                {oldExchange.mode === 'weight_rate' ? (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Metal</label>
                      <select
                        value={oldExchange.metal}
                        onChange={(e) => {
                          const m = e.target.value as MetalType;
                          const rate = rates.find(r => r.metal === m && r.purity.includes('22K'))?.ratePerGram || 6800;
                          setOldExchange(prev => ({ ...prev, metal: m, ratePerGram: rate }));
                        }}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200"
                      >
                        <option value="Gold">Old Gold</option>
                        <option value="Silver">Old Silver</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Gross Weight (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={oldExchange.grossWeight || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, grossWeight: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono font-bold"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Melt Loss / काट (g)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={oldExchange.dustWastageGram || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, dustWastageGram: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Purity Touch (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={oldExchange.meltPurityPercent || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, meltPurityPercent: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-100 font-mono"
                        placeholder="91.6"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Exchange Rate ₹/g</label>
                      <input
                        type="number"
                        value={oldExchange.ratePerGram || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, ratePerGram: parseFloat(e.target.value) || 0 }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-amber-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Direct Agreed Valuation Amount (सीधा तय भाव ₹) *</label>
                      <input
                        type="number"
                        value={oldExchange.lumpSumAmount || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, lumpSumAmount: parseFloat(e.target.value) || 0 }))}
                        placeholder="e.g. 45000"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-amber-300 font-mono font-bold text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1 text-[11px]">Old Ornament Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Old broken 22K chain + tops"
                        value={oldExchange.description || ''}
                        onChange={(e) => setOldExchange(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs">
                  <span className="text-amber-300 font-medium">Old Metal Credit To Deduct:</span>
                  <span className="font-mono font-black text-amber-400 text-sm">
                    - ₹{oldExchange.totalCreditAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column (4 cols): Bill Summary, Tax & Payment Desk */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 sticky top-[160px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-400" />
                {isGSTEnabled ? 'Tax Invoice Summary' : 'Estimate Summary'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isGSTEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                {isGSTEnabled ? 'GST 3%' : 'Estimate'}
              </span>
            </div>

            {/* Price Breakdown */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Items Subtotal:</span>
                <span className="font-mono font-bold text-slate-200">₹{itemsSubtotal.toLocaleString('en-IN')}</span>
              </div>

              {oldMetalDeduction > 0 && (
                <div className="flex justify-between text-rose-400">
                  <span>Less: Old Metal Credit:</span>
                  <span className="font-mono font-bold">- ₹{oldMetalDeduction.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300 pt-1 border-t border-slate-800">
                <span>Taxable Value:</span>
                <span className="font-mono font-bold">₹{taxableAmount.toLocaleString('en-IN')}</span>
              </div>

              {/* GST Rows */}
              {isGSTEnabled ? (
                isInterState ? (
                  <div className="flex justify-between text-slate-400">
                    <span>IGST (3.0%):</span>
                    <span className="font-mono font-bold text-slate-200">₹{igstAmount.toLocaleString('en-IN')}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span>CGST (1.5%):</span>
                      <span className="font-mono font-bold text-slate-200">₹{cgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>SGST (1.5%):</span>
                      <span className="font-mono font-bold text-slate-200">₹{sgstAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )
              ) : (
                <div className="flex justify-between text-slate-500 italic text-[11px]">
                  <span>GST (Non-GST Estimate):</span>
                  <span>₹0.00</span>
                </div>
              )}

              {/* Discount Input */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Round-off / Discount:</span>
                <div className="flex items-center gap-1 w-24">
                  <span className="text-slate-500">₹</span>
                  <input
                    type="number"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-right font-mono text-xs text-slate-100"
                  />
                </div>
              </div>

              {/* Grand Total */}
              <div className="p-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border border-amber-500/30 rounded-xl flex items-center justify-between mt-3">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Total Amount Due</span>
                  <span className="text-[10px] text-slate-400">Net payable by customer</span>
                </div>
                <span className="text-xl font-black text-amber-300 font-mono">
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
              <label className="block text-slate-400 font-medium">Payment Mode</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['UPI/GPay', 'Cash', 'Card', 'Bank Transfer', 'Mixed'] as PaymentMethod[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPaymentMethod(m)}
                    className={`py-1.5 px-2 rounded-lg font-bold text-[11px] transition text-center truncate ${
                      paymentMethod === m
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-slate-400 mb-1 font-medium">Amount Received Now (₹)</label>
                <input
                  type="number"
                  value={amountPaid || ''}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-emerald-400 font-mono font-bold text-sm"
                />
              </div>

              {amountPaid < grandTotal && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] flex justify-between font-mono">
                  <span>Balance Due / Khata:</span>
                  <span className="font-bold">₹{(grandTotal - amountPaid).toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>

            {/* Generate Action Button */}
            <button
              onClick={handleGenerateInvoice}
              disabled={cartItems.length === 0}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-sm rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>{isGSTEnabled ? 'Generate Tax Invoice [F2]' : 'Generate Estimate Receipt'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modal: Custom / Manual Item Entry */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Gem className="w-5 h-5 text-amber-400" />
                Add Custom Ornament or Loose Gemstone
              </h3>
              <button onClick={() => setShowCustomItemModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Item Description *</label>
                <input
                  type="text"
                  placeholder="e.g. 22K Traditional Bridal Haar or Certified Zambian Emerald"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Metal Type *</label>
                  <select
                    value={customMetal}
                    onChange={(e) => setCustomMetal(e.target.value as MetalType)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Platinum">Platinum</option>
                    <option value="Diamond">Diamond / Gemstone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Purity *</label>
                  <select
                    value={customPurity}
                    onChange={(e) => setCustomPurity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="24K">24K Pure Gold</option>
                    <option value="22K">22K (916 BIS Hallmark)</option>
                    <option value="18K">18K (750 Diamond Setting)</option>
                    <option value="14K">14K Light</option>
                    <option value="9K">9K (375 Casual Gold)</option>
                    <option value="999 Fine">Silver 999 Fine</option>
                    <option value="925 Sterling">Silver 925 Sterling</option>
                    <option value="Natural Gemstone">Natural Astrological Stone</option>
                  </select>
                </div>
              </div>

              {/* Weight Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Gross Weight (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={customGrossWt}
                    onChange={(e) => setCustomGrossWt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Stone Weight (g)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customStoneWt}
                    onChange={(e) => setCustomStoneWt(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Net Metal Wt (g)</label>
                  <div className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-amber-300">
                    {Math.max(0, customGrossWt - customStoneWt).toFixed(2)} g
                  </div>
                </div>
              </div>

              {/* Gemstone / Diamond Fields */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-2">
                <span className="font-bold text-slate-300 block">Stones / Diamonds / Gemstones Info</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-0.5">Stone Type</label>
                    <input
                      type="text"
                      placeholder="e.g. Diamond, Ruby, Emerald"
                      value={customStoneType}
                      onChange={(e) => setCustomStoneType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-0.5">Carat / Ratti</label>
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
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[11px] mb-0.5">Stone Value (₹)</label>
                    <input
                      type="number"
                      value={customStoneVal || ''}
                      onChange={(e) => setCustomStoneVal(parseFloat(e.target.value) || 0)}
                      placeholder="₹0"
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-400 font-mono font-bold"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-0.5">Lab Certificate No. (GIA / IGI / Govt Lab)</label>
                  <input
                    type="text"
                    placeholder="e.g. IGI-5928174 or Govt-GTL-98124"
                    value={customCertNo}
                    onChange={(e) => setCustomCertNo(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
                  />
                </div>
              </div>

              {/* Making charges & HUID */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Making Charge Mode</label>
                  <select
                    value={customMakingType}
                    onChange={(e) => setCustomMakingType(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-200"
                  >
                    <option value="per_gram">₹ Per Gram</option>
                    <option value="flat">Fixed Flat ₹</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Rate (₹)</label>
                  <input
                    type="number"
                    value={customMakingRate}
                    onChange={(e) => setCustomMakingRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Touch / Wastage %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={customWastage}
                    onChange={(e) => setCustomWastage(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* HUID Hallmarking Toggle */}
              <div className="flex items-center justify-between p-2.5 bg-slate-800/80 rounded-xl border border-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customEnableHuid}
                    onChange={(e) => setCustomEnableHuid(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Apply BIS 6-Digit HUID Hallmarking (+₹45)
                  </span>
                </label>

                {customEnableHuid && (
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-400">HUID:</span>
                    <input
                      type="text"
                      maxLength={6}
                      value={customHuidCode}
                      onChange={(e) => setCustomHuidCode(e.target.value.toUpperCase())}
                      className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-center font-mono font-bold text-amber-300 uppercase text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">Quick Add Customer</h3>
              <button onClick={() => setShowQuickCustModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddCust} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Customer Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Smt. Anita Sharma"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. 9826012345"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Address</label>
                <input
                  type="text"
                  placeholder="e.g. Kolar Road, Bhopal"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Aadhaar Card No.</label>
                <input
                  type="text"
                  placeholder="e.g. XXXX-XXXX-4921"
                  value={newCustAadhaar}
                  onChange={(e) => setNewCustAadhaar(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCustModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
