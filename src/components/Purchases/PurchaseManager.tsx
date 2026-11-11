import React, { useState } from 'react';
import { PurchaseInvoice, PurchaseItem, Vendor, MetalRate, JewelleryItem, MetalType } from '../../types';
import { Truck, Plus, Search, Calendar, Scale, Coins, ShieldCheck, CheckCircle2, DollarSign, X, PackagePlus, Eye, Printer, Building2, ArrowDownRight, UserPlus } from 'lucide-react';
import { AddVendorModal } from '../Vendors/AddVendorModal';
import { VendorList } from '../Vendors/VendorList';

interface PurchaseManagerProps {
  purchases: PurchaseInvoice[];
  vendors: Vendor[];
  categories: string[];
  rates: MetalRate[];
  onAddPurchase: (purchase: PurchaseInvoice, stockItemsToInsert: JewelleryItem[]) => void;
  onUpdateVendorBalance: (vendorId: string, cashDelta: number, goldDelta: number) => void;
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
}

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({
  purchases,
  vendors,
  categories,
  rates,
  onAddPurchase,
  onUpdateVendorBalance,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'bills' | 'supplierReport' | 'vendors'>('bills');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState<string>('all');
  
  // Modal State
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [showAddVendorModal, setShowAddVendorModal] = useState(false);
  const [selectedPurchaseDetails, setSelectedPurchaseDetails] = useState<PurchaseInvoice | null>(null);

  // New Purchase Form State
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [purchaseBillNo, setPurchaseBillNo] = useState(`PUR-2026-${String(purchases.length + 18).padStart(4, '0')}`);
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PurchaseInvoice['paymentMode']>('Bank Transfer');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Purchase Items State
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      name: '22K Hallmarked Gold Bangles Lot',
      category: 'Bangles',
      metal: 'Gold',
      purity: '22K',
      grossWeight: 45.0,
      netWeight: 45.0,
      ratePerGram: rates.find(r => r.metal === 'Gold' && r.purity === '22K')?.ratePerGram || 6850,
      makingCharge: 180,
      stoneWeight: 0,
      stoneValue: 0,
      totalAmount: 316350,
      hsnCode: '7113',
      quantity: 3,
      huid: 'ZVR' + Math.floor(100 + Math.random() * 899),
      addToStock: true
    }
  ]);

  // Aggregates
  const totalPurchaseValue = purchases.reduce((s, p) => s + p.grandTotal, 0);
  const totalGoldGramsInward = purchases.reduce((s, p) => s + p.items.filter(i => i.metal === 'Gold').reduce((sum, it) => sum + it.netWeight, 0), 0);
  const totalSilverGramsInward = purchases.reduce((s, p) => s + p.items.filter(i => i.metal === 'Silver').reduce((sum, it) => sum + it.netWeight, 0), 0);
  const totalPendingVendorDues = purchases.reduce((s, p) => s + p.balanceDue, 0);

  // Calculations for current form
  const formSubtotal = items.reduce((s, i) => s + i.totalAmount, 0);
  const formGstAmount = Math.round(formSubtotal * 0.03); // 3% GST
  const formGrandTotal = formSubtotal + formGstAmount;
  const formTotalGross = items.reduce((s, i) => s + i.grossWeight, 0);
  const formTotalNet = items.reduce((s, i) => s + i.netWeight, 0);

  const handleAddItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        name: 'New Inward Jewellery Piece',
        category: categories[0] || 'Necklace',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 10.0,
        netWeight: 10.0,
        ratePerGram: rates.find(r => r.metal === 'Gold' && r.purity === '22K')?.ratePerGram || 6850,
        makingCharge: 200,
        stoneWeight: 0,
        stoneValue: 0,
        totalAmount: 70500,
        hsnCode: '7113',
        quantity: 1,
        huid: 'SMJ' + Math.floor(100 + Math.random() * 899),
        addToStock: true
      }
    ]);
  };

  const handleRemoveItemRow = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleItemFieldChange = (idx: number, field: keyof PurchaseItem, value: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i === idx) {
        const updated = { ...item, [field]: value };
        if (field === 'grossWeight' || field === 'stoneWeight') {
          updated.netWeight = Math.max(0, updated.grossWeight - updated.stoneWeight);
        }
        // Recalculate amount
        const metalCost = updated.netWeight * updated.ratePerGram;
        const makingCost = updated.netWeight * updated.makingCharge;
        updated.totalAmount = Math.round(metalCost + makingCost + updated.stoneValue);
        return updated;
      }
      return item;
    }));
  };

  const handleCreatePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const balanceDue = Math.max(0, formGrandTotal - Number(amountPaid));

    // Construct Purchase Invoice
    const newPurchase: PurchaseInvoice = {
      id: `pur-${Date.now()}`,
      purchaseBillNo,
      vendorId: vendor.id,
      vendorName: vendor.contactPerson,
      vendorFirm: vendor.firmName,
      vendorGSTIN: vendor.gstin,
      date: purchaseDate,
      items,
      totalGrossWeight: Number(formTotalGross.toFixed(2)),
      totalNetWeight: Number(formTotalNet.toFixed(2)),
      subtotal: formSubtotal,
      gstRate: 3.0,
      gstAmount: formGstAmount,
      grandTotal: formGrandTotal,
      paymentMode,
      amountPaid: Number(amountPaid),
      balanceDue,
      fineGoldEquivalent: Number((formTotalNet * 0.916).toFixed(2)),
      notes
    };

    // Prepare stock inventory items for pieces marked addToStock: true
    const stockItemsToInsert: JewelleryItem[] = items
      .filter(it => it.addToStock)
      .map((it, idx) => ({
        id: `item-${Date.now()}-${idx}`,
        tagNo: `SMJ-INW-${Math.floor(1000 + Math.random() * 9000)}`,
        huid: it.huid || `SMJ${Math.floor(100 + Math.random() * 899)}`,
        name: it.name,
        category: it.category,
        metal: it.metal,
        purity: it.purity,
        grossWeight: it.grossWeight,
        netWeight: it.netWeight,
        stoneWeight: it.stoneWeight,
        stoneValue: it.stoneValue,
        wastagePercentage: 2.5,
        makingChargeType: 'per_gram',
        makingChargeRate: it.makingCharge * 1.5, // Standard markup for showroom retail
        hsnCode: it.hsnCode,
        quantity: it.quantity,
        minStockAlert: 2,
        barcode: `SMJ${Date.now().toString().slice(-6)}${idx}`,
        description: `Inward shipment from ${vendor.firmName} (Bill: ${purchaseBillNo})`
      }));

    onAddPurchase(newPurchase, stockItemsToInsert);
    setShowNewPurchaseModal(false);
  };

  // Filtered Purchases
  const filteredPurchases = purchases.filter(p => {
    const matchVendor = selectedVendorFilter === 'all' || p.vendorId === selectedVendorFilter;
    const matchSearch = p.purchaseBillNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.vendorFirm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.items.some(it => it.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchVendor && matchSearch;
  });

  // "Kitna Maal Kisse Aaya" Aggregation by Vendor
  const vendorSupplySummary = vendors.map(v => {
    const vPurchases = purchases.filter(p => p.vendorId === v.id);
    const goldGrams = vPurchases.reduce((s, p) => s + p.items.filter(i => i.metal === 'Gold').reduce((sum, it) => sum + it.netWeight, 0), 0);
    const silverGrams = vPurchases.reduce((s, p) => s + p.items.filter(i => i.metal === 'Silver').reduce((sum, it) => sum + it.netWeight, 0), 0);
    const totalAmount = vPurchases.reduce((s, p) => s + p.grandTotal, 0);
    const totalPaid = vPurchases.reduce((s, p) => s + p.amountPaid, 0);
    const totalDue = vPurchases.reduce((s, p) => s + p.balanceDue, 0);

    return {
      vendor: v,
      billsCount: vPurchases.length,
      goldGrams,
      silverGrams,
      totalAmount,
      totalPaid,
      totalDue
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs dark:shadow-lg space-y-1 text-slate-900 dark:text-slate-100">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Inward Purchases (खरीद)</span>
          <p className="text-2xl font-black text-amber-800 dark:text-amber-300 font-mono">₹{totalPurchaseValue.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{purchases.length} Inward Purchase Bills</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs dark:shadow-lg space-y-1 text-slate-900 dark:text-slate-100">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Gold Inward (सोने की आवक)</span>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono">{totalGoldGramsInward.toFixed(2)} g</p>
          <span className="text-[10px] text-amber-800/80 dark:text-amber-500/80 font-medium">({(totalGoldGramsInward / 10).toFixed(2)} Tolas)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs dark:shadow-lg space-y-1 text-slate-900 dark:text-slate-100">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Silver Inward (चांदी की आवक)</span>
          <p className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">{totalSilverGramsInward.toFixed(2)} g</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">({(totalSilverGramsInward / 1000).toFixed(2)} Kg)</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-xs dark:shadow-lg space-y-1 text-slate-900 dark:text-slate-100">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Vendor Purchase Dues (उधार)</span>
          <p className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">₹{totalPendingVendorDues.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">To be settled with suppliers</span>
        </div>
      </div>

      {/* Control Bar: Subtabs & New Purchase Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs dark:shadow-lg">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Subtab Switcher */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => setActiveSubTab('bills')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeSubTab === 'bills' ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              Purchase Bills (खरीद बिल रजिस्टर)
            </button>
            <button
              onClick={() => setActiveSubTab('supplierReport')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeSubTab === 'supplierReport' ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              Vendor Supply Summary (आवक रिपोर्ट)
            </button>
            <button
              onClick={() => setActiveSubTab('vendors')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${activeSubTab === 'vendors' ? 'bg-amber-600 dark:bg-amber-500 text-white dark:text-slate-950 shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
            >
              Manage Vendors (सप्लायर लिस्ट)
            </button>
          </div>

          {activeSubTab === 'bills' && (
            <>
              <select
                value={selectedVendorFilter}
                onChange={(e) => setSelectedVendorFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Bullion Vendors</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.firmName}</option>
                ))}
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search bill no, item or vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-48 sm:w-56 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAddVendorModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-amber-900 dark:text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            + Add New Vendor (सप्लायर जोड़ें)
          </button>
          <button
            onClick={() => {
              setPurchaseBillNo(`PUR-2026-${String(purchases.length + 18).padStart(4, '0')}`);
              setShowNewPurchaseModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 dark:from-amber-500 dark:to-amber-600 dark:hover:from-amber-400 dark:hover:to-amber-500 text-white dark:text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
          >
            <PackagePlus className="w-4 h-4" />
            + Record Inward Purchase (नई खरीद दर्ज करें)
          </button>
        </div>
      </div>

      {/* Main Content: Bills Register OR Vendor Supply Report */}
      {activeSubTab === 'bills' ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs dark:shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Bill No & Date</th>
                  <th className="py-3 px-4">Vendor Firm (सप्लायर)</th>
                  <th className="py-3 px-4">Supplied Items</th>
                  <th className="py-3 px-4 text-right">Net Weight</th>
                  <th className="py-3 px-4 text-right">Subtotal</th>
                  <th className="py-3 px-4 text-right">GST (3%)</th>
                  <th className="py-3 px-4 text-right">Bill Total</th>
                  <th className="py-3 px-4 text-center">Paid / Due</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No purchase bills found matching current filter.
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map(pur => (
                    <tr key={pur.id} className="hover:bg-amber-50/30 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-amber-800 dark:text-amber-300 block">{pur.purchaseBillNo}</span>
                        <span className="text-[10px] text-slate-500">{pur.date}</span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-slate-200">{pur.vendorFirm}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{pur.vendorName}</span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-800 dark:text-slate-300 line-clamp-1">
                          {pur.items.map(i => `${i.name} (${i.purity})`).join(', ')}
                        </p>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono font-semibold">
                          {pur.items.length} item lots
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {pur.totalNetWeight.toFixed(2)} g
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-800 dark:text-slate-300">
                        ₹{pur.subtotal.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                        ₹{pur.gstAmount.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-800 dark:text-amber-300">
                        ₹{pur.grandTotal.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="font-mono text-[11px]">
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold block">Paid: ₹{pur.amountPaid.toLocaleString('en-IN')}</span>
                          {pur.balanceDue > 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 text-[10px] font-bold">Due: ₹{pur.balanceDue.toLocaleString('en-IN')}</span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Fully Settled</span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedPurchaseDetails(pur)}
                          className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition"
                          title="View Bill Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeSubTab === 'supplierReport' ? (
        /* Tab B: "Kitna Maal Kisse Aaya" Vendor Supply Report */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
          <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-400" />
                Vendor Supply & Inward Bullion Ledger (किससे कितना माल आया)
              </h3>
              <p className="text-xs text-slate-400">
                Detailed audit of gold and silver grams supplied by each wholesaler.
              </p>
            </div>
            <span className="text-xs text-amber-400 font-mono font-bold">
              Total Inward Gold: {totalGoldGramsInward.toFixed(2)} g | Silver: {totalSilverGramsInward.toFixed(2)} g
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier Firm Name</th>
                  <th className="py-3 px-4">Contact & Location</th>
                  <th className="py-3 px-4 text-center">Bills Count</th>
                  <th className="py-3 px-4 text-right">Gold Supplied (Net g)</th>
                  <th className="py-3 px-4 text-right">Silver Supplied (Net g)</th>
                  <th className="py-3 px-4 text-right">Total Invoiced (₹)</th>
                  <th className="py-3 px-4 text-right">Total Paid (₹)</th>
                  <th className="py-3 px-4 text-right">Current Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {vendorSupplySummary.map((sum, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-100 block">{sum.vendor.firmName}</span>
                      <span className="text-[10px] text-slate-500 font-mono">GSTIN: {sum.vendor.gstin || 'Unregistered'}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <div>{sum.vendor.contactPerson}</div>
                      <span className="text-[10px] text-slate-500">{sum.vendor.city} ({sum.vendor.phone})</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                      {sum.billsCount} Bills
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                      {sum.goldGrams > 0 ? `${sum.goldGrams.toFixed(2)} g` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">
                      {sum.silverGrams > 0 ? `${sum.silverGrams.toFixed(2)} g` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                      ₹{sum.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                      ₹{sum.totalPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={sum.totalDue > 0 ? 'text-rose-400' : 'text-slate-500'}>
                        ₹{sum.totalDue.toLocaleString('en-IN')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab C: Manage Vendors */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5">
           <VendorList 
            vendors={vendors}
            onAddVendor={onAddVendor}
            onUpdateVendor={onUpdateVendor}
            onDeleteVendor={onDeleteVendor}
            onOpenNewPurchase={(vId) => {
              setVendorId(vId);
              setPurchaseBillNo(`PUR-2026-${String(purchases.length + 18).padStart(4, '0')}`);
              setShowNewPurchaseModal(true);
            }}
          />
        </div>
      )}

      {/* Modal: Record Inward Purchase Bill */}
      {showNewPurchaseModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full p-6 shadow-2xl text-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                Record Inward Stock Purchase (खरीद व आवक प्रविष्टि)
              </h3>
              <button onClick={() => setShowNewPurchaseModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-400 font-medium">Select Vendor (थोक सप्लायर) *</label>
                    <button
                      type="button"
                      onClick={() => setShowAddVendorModal(true)}
                      className="text-[10px] text-amber-400 font-bold hover:text-amber-300 flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" /> Add New Vendor
                    </button>
                  </div>
                  <select
                    value={vendorId}
                    onChange={(e) => setVendorId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-amber-500"
                    required
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.firmName} ({v.city})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Purchase Bill No. *</label>
                  <input
                    type="text"
                    value={purchaseBillNo}
                    onChange={(e) => setPurchaseBillNo(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Purchase Date *</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              {/* Purchase Items Entry Table */}
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                    <PackagePlus className="w-4 h-4" /> Purchased Jewellery Lots & Bullion
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-xs text-amber-400 hover:underline font-bold flex items-center gap-1"
                  >
                    + Add Another Item Lot
                  </button>
                </div>

                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-slate-900 p-3 rounded-xl border border-slate-700 space-y-2">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-5">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Item Description</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemFieldChange(idx, 'name', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                            required
                          />
                        </div>

                        <div className="col-span-3">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Category</label>
                          <select
                            value={item.category}
                            onChange={(e) => handleItemFieldChange(idx, 'category', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                          >
                            {categories.map((c, i) => (
                              <option key={i} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>

                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-400 mb-0.5">Purity</label>
                          <select
                            value={item.purity}
                            onChange={(e) => handleItemFieldChange(idx, 'purity', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
                          >
                            <option value="24K">24K Gold</option>
                            <option value="22K">22K Gold</option>
                            <option value="18K">18K Gold</option>
                            <option value="14K">14K Gold</option>
                            <option value="9K">9K Gold</option>
                            <option value="999 Fine">Silver 999</option>
                            <option value="925 Sterling">Silver 925</option>
                          </select>
                        </div>

                        <div className="col-span-2 flex items-end justify-end">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItemRow(idx)}
                              className="text-rose-400 hover:text-rose-300 p-1 text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Weight, Rate, Making & Add-to-Stock Checkbox */}
                      <div className="grid grid-cols-12 gap-2 text-[11px] items-center">
                        <div className="col-span-2">
                          <label className="block text-slate-400 text-[10px]">Gross Wt (g)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.grossWeight}
                            onChange={(e) => handleItemFieldChange(idx, 'grossWeight', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-slate-400 text-[10px]">Net Wt (g)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.netWeight}
                            onChange={(e) => handleItemFieldChange(idx, 'netWeight', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono font-bold"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-slate-400 text-[10px]">Purchase Rate ₹/g</label>
                          <input
                            type="number"
                            value={item.ratePerGram}
                            onChange={(e) => handleItemFieldChange(idx, 'ratePerGram', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-slate-400 text-[10px]">Making ₹/g</label>
                          <input
                            type="number"
                            value={item.makingCharge}
                            onChange={(e) => handleItemFieldChange(idx, 'makingCharge', parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-100 font-mono"
                          />
                        </div>

                        <div className="col-span-2">
                          <label className="block text-slate-400 text-[10px]">Item Lot Total</label>
                          <div className="font-mono font-bold text-amber-300 py-1">
                            ₹{item.totalAmount.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <div className="col-span-2 flex items-center gap-1.5 pt-3">
                          <label className="flex items-center gap-1 text-[11px] text-emerald-400 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.addToStock}
                              onChange={(e) => handleItemFieldChange(idx, 'addToStock', e.target.checked)}
                              className="rounded accent-emerald-500"
                            />
                            <span>Add to Stock</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Details & Settlement */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  >
                    <option value="Bank Transfer">Bank Transfer (SBI NEFT/RTGS)</option>
                    <option value="Cash">Cash in Hand (गल्ला नकद)</option>
                    <option value="UPI">Current Account UPI</option>
                    <option value="Credit / Udhar">Credit / Udhar (बाकी खाता)</option>
                    <option value="Metal Barter">Metal Barter (सोना/चांदी बदलना)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Amount Paid Now (₹)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Balance Owed to Vendor</label>
                  <div className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-rose-400">
                    ₹{Math.max(0, formGrandTotal - amountPaid).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Totals Summary */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-xs">Total Net Metal Wt: </span>
                  <strong className="text-amber-300 font-mono">{formTotalNet.toFixed(2)} g</strong>
                  <span className="text-slate-400 text-xs ml-3">Subtotal: </span>
                  <strong className="text-slate-200 font-mono">₹{formSubtotal.toLocaleString('en-IN')}</strong>
                  <span className="text-slate-400 text-xs ml-3">GST 3%: </span>
                  <strong className="text-slate-200 font-mono">₹{formGstAmount.toLocaleString('en-IN')}</strong>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Grand Total:</span>
                  <span className="text-xl font-black text-amber-300 font-mono">
                    ₹{formGrandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewPurchaseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  Confirm Inward Purchase & Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View Purchase Bill Details */}
      {selectedPurchaseDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">{selectedPurchaseDetails.purchaseBillNo}</h3>
                <p className="text-amber-400">{selectedPurchaseDetails.vendorFirm} • {selectedPurchaseDetails.date}</p>
              </div>
              <button onClick={() => setSelectedPurchaseDetails(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800">
                {selectedPurchaseDetails.items.map((it, i) => (
                  <div key={i} className="p-3 bg-slate-850 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-200 block">{it.name}</span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {it.purity} • Net: {it.netWeight}g @ ₹{it.ratePerGram}/g
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-300">
                      ₹{it.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700 space-y-1 font-mono">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>₹{selectedPurchaseDetails.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>GST (3%):</span>
                  <span>₹{selectedPurchaseDetails.gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-amber-300 font-bold text-sm pt-1 border-t border-slate-700">
                  <span>Grand Total:</span>
                  <span>₹{selectedPurchaseDetails.grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 pt-1">
                  <span>Paid ({selectedPurchaseDetails.paymentMode}):</span>
                  <span>₹{selectedPurchaseDetails.amountPaid.toLocaleString('en-IN')}</span>
                </div>
                {selectedPurchaseDetails.balanceDue > 0 && (
                  <div className="flex justify-between text-rose-400 font-bold">
                    <span>Balance Due:</span>
                    <span>₹{selectedPurchaseDetails.balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedPurchaseDetails(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

        <AddVendorModal
          isOpen={showAddVendorModal}
          onClose={() => setShowAddVendorModal(false)}
          onAddVendor={onAddVendor}
        />

    </div>
  );
};
