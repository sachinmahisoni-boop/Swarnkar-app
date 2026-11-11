import React, { useState, useMemo } from 'react';
import { 
  GSTInvoice, 
  JewelleryItem, 
  MetalRate, 
  ShopExpense, 
  PurchaseInvoice, 
  ShopDetails,
  MetalType
} from '../../types';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight, 
  Download, 
  Printer, 
  Search, 
  Filter, 
  Calendar, 
  Layers, 
  Coins, 
  Sparkles, 
  Scale, 
  Building2, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronDown, 
  Info, 
  X,
  PieChart,
  Sliders,
  RefreshCw,
  Eye
} from 'lucide-react';
import { ShreemLogo } from '../ShreemLogo';

interface ProfitReportProps {
  invoices: GSTInvoice[];
  inventory: JewelleryItem[];
  rates: MetalRate[];
  expenses?: ShopExpense[];
  purchases?: PurchaseInvoice[];
  categories?: string[];
  shopDetails?: ShopDetails;
}

export const ProfitReport: React.FC<ProfitReportProps> = ({
  invoices,
  inventory,
  rates,
  expenses = [],
  purchases = [],
  categories = [],
  shopDetails
}) => {
  // Views: 'sold' (Realized from invoices) | 'inventory' (Projected from current stock) | 'all'
  const [activeView, setActiveView] = useState<'sold' | 'inventory' | 'all'>('sold');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedMarginTier, setSelectedMarginTier] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [dateRangePreset, setDateRangePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Sort State
  const [sortBy, setSortBy] = useState<'profit' | 'margin' | 'revenue' | 'cost' | 'date'>('profit');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Drilldown modal for an individual item
  const [selectedDrilldownItem, setSelectedDrilldownItem] = useState<any | null>(null);

  // Print audit modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // What-If Margin Simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simMakingChargeDelta, setSimMakingChargeDelta] = useState<number>(0); // e.g. +₹50 or -₹50 per gram
  const [simGoldRateDelta, setSimGoldRateDelta] = useState<number>(0); // e.g. +₹200 or -₹200 per gram

  // Helper: Get live rate for metal and purity
  const getRateForPurity = (metal: string, purity: string) => {
    const found = rates.find(r => r.metal === metal && r.purity === purity);
    if (found) return found.ratePerGram;
    if (metal === 'Gold') {
      const g22 = rates.find(r => r.metal === 'Gold' && r.purity === '22K');
      return g22 ? g22.ratePerGram : 13085;
    }
    if (metal === 'Silver') {
      const s925 = rates.find(r => r.metal === 'Silver' && r.purity === '925 Sterling');
      return s925 ? s925.ratePerGram : 176;
    }
    return 0;
  };

  // Helper: Compute cost price for an inventory item if not already set
  const computeItemCostPrice = (item: JewelleryItem): number => {
    if (item.costPrice && item.costPrice > 0) return item.costPrice;
    const liveRate = getRateForPurity(item.metal, item.purity);
    const purchaseRate = item.purchaseRatePerGram || (liveRate * 0.94);
    const metalCost = item.netWeight * purchaseRate;
    const makingVal = item.makingChargeType === 'per_gram'
      ? item.netWeight * (item.makingChargeRate || 0)
      : item.makingChargeType === 'percentage'
      ? (item.netWeight * liveRate * ((item.makingChargeRate || 0) / 100))
      : (item.makingChargeRate || 0);
    const makingCost = item.makingCostPerGram 
      ? item.netWeight * item.makingCostPerGram 
      : (makingVal * 0.45);
    const stoneCost = item.stoneCost || Math.round((item.stoneValue || 0) * 0.65);
    const huidCost = item.huid ? 45 : 0;
    return Math.round(metalCost + makingCost + stoneCost + huidCost);
  };

  // Helper: Compute current estimated sale price for an in-stock inventory item
  const computeItemSalePrice = (item: JewelleryItem): number => {
    const liveRate = getRateForPurity(item.metal, item.purity);
    const metalCost = item.netWeight * liveRate;
    const wastageCost = item.netWeight * ((item.wastagePercentage || 0) / 100) * liveRate;
    const makingCharge = item.makingChargeType === 'per_gram'
      ? item.netWeight * (item.makingChargeRate || 0)
      : item.makingChargeType === 'percentage'
      ? (metalCost * ((item.makingChargeRate || 0) / 100))
      : (item.makingChargeRate || 0);
    const huidFee = item.huid ? 45 : 0;
    return Math.round(metalCost + wastageCost + makingCharge + (item.stoneValue || 0) + huidFee);
  };

  // Date filtering logic for invoices
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (dateRangePreset === 'today') {
        return inv.date === todayStr;
      }
      if (dateRangePreset === 'yesterday') {
        return inv.date === yesterdayStr;
      }
      if (dateRangePreset === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(inv.date) >= weekAgo;
      }
      if (dateRangePreset === 'month') {
        const currentMonth = todayStr.substring(0, 7);
        return inv.date.startsWith(currentMonth);
      }
      if (dateRangePreset === 'custom') {
        if (customStartDate && inv.date < customStartDate) return false;
        if (customEndDate && inv.date > customEndDate) return false;
        return true;
      }
      return true; // 'all'
    });
  }, [invoices, dateRangePreset, customStartDate, customEndDate, todayStr, yesterdayStr]);

  // Extract all sold item records from filtered invoices
  const soldItemRecords = useMemo(() => {
    const list: any[] = [];
    filteredInvoices.forEach(inv => {
      inv.items.forEach((item, idx) => {
        const salePrice = item.subtotal;
        let costPrice = item.costPrice;
        if (!costPrice || costPrice <= 0) {
          const rate = item.metalRateApplied || getRateForPurity(item.metal, item.purity);
          const baseMetal = item.netWeight * (rate * 0.94);
          const baseMaking = item.makingCharge * 0.45;
          const baseStone = Math.round(item.stoneValue * 0.65);
          costPrice = Math.round(baseMetal + baseMaking + baseStone + (item.huidCharge ? 45 : 0));
        }
        const profit = salePrice - costPrice;
        const marginPct = salePrice > 0 ? Number(((profit / salePrice) * 100).toFixed(2)) : 0;
        const markupPct = costPrice > 0 ? Number(((profit / costPrice) * 100).toFixed(2)) : 0;

        list.push({
          id: `sold-${inv.id}-${idx}`,
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
          costPrice,
          salePrice,
          profitAmount: profit,
          marginPercent: marginPct,
          markupPercent: markupPct,
          date: inv.date,
          invoiceNo: inv.invoiceNumber,
          customerName: inv.customerName,
          invoiceType: inv.invoiceType,
          quantity: item.quantity || 1,
          isSold: true,
          makingCharge: item.makingCharge,
          metalCost: item.metalCost
        });
      });
    });
    return list;
  }, [filteredInvoices, rates]);

  // Extract all current inventory stock items with projected profit
  const inventoryItemRecords = useMemo(() => {
    return inventory.map(item => {
      const unitCost = computeItemCostPrice(item);
      const unitSale = computeItemSalePrice(item);
      const totalCost = unitCost * item.quantity;
      const totalSale = unitSale * item.quantity;
      const profit = totalSale - totalCost;
      const marginPct = totalSale > 0 ? Number(((profit / totalSale) * 100).toFixed(2)) : 0;
      const markupPct = totalCost > 0 ? Number(((profit / totalCost) * 100).toFixed(2)) : 0;

      return {
        id: `inv-${item.id}`,
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
        costPrice: totalCost,
        salePrice: totalSale,
        unitCostPrice: unitCost,
        unitSalePrice: unitSale,
        profitAmount: profit,
        marginPercent: marginPct,
        markupPercent: markupPct,
        date: 'In Stock',
        invoiceNo: 'Available Inventory',
        customerName: '-',
        quantity: item.quantity,
        isSold: false,
        makingChargeRate: item.makingChargeRate,
        makingChargeType: item.makingChargeType
      };
    });
  }, [inventory, rates]);

  // Combined Active Records based on activeView
  const allRecords = useMemo(() => {
    if (activeView === 'sold') return soldItemRecords;
    if (activeView === 'inventory') return inventoryItemRecords;
    return [...soldItemRecords, ...inventoryItemRecords];
  }, [activeView, soldItemRecords, inventoryItemRecords]);

  // Filtered & Sorted Items for Table
  const filteredRecords = useMemo(() => {
    let result = allRecords.filter(item => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesTag = item.tagNo.toLowerCase().includes(q);
        const matchesHuid = item.huid ? item.huid.toLowerCase().includes(q) : false;
        const matchesInv = item.invoiceNo ? item.invoiceNo.toLowerCase().includes(q) : false;
        const matchesCust = item.customerName ? item.customerName.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesTag && !matchesHuid && !matchesInv && !matchesCust) return false;
      }
      // Category
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
      // Metal
      if (selectedMetal !== 'All' && item.metal !== selectedMetal) return false;
      // Margin Tier
      if (selectedMarginTier === 'high' && item.marginPercent < 20) return false;
      if (selectedMarginTier === 'medium' && (item.marginPercent < 10 || item.marginPercent >= 20)) return false;
      if (selectedMarginTier === 'low' && item.marginPercent >= 10) return false;

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      let valA = a.profitAmount;
      let valB = b.profitAmount;
      if (sortBy === 'margin') {
        valA = a.marginPercent;
        valB = b.marginPercent;
      } else if (sortBy === 'revenue') {
        valA = a.salePrice;
        valB = b.salePrice;
      } else if (sortBy === 'cost') {
        valA = a.costPrice;
        valB = b.costPrice;
      } else if (sortBy === 'date') {
        valA = a.date;
        valB = b.date;
      }

      if (valA < valB) return sortOrder === 'desc' ? 1 : -1;
      if (valA > valB) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });

    return result;
  }, [allRecords, searchQuery, selectedCategory, selectedMetal, selectedMarginTier, sortBy, sortOrder]);

  // High-Level Summary Metrics
  const summaryMetrics = useMemo(() => {
    // Realized from filtered invoices
    const totalSalesRevenue = soldItemRecords.reduce((sum, item) => sum + item.salePrice, 0);
    const totalCOGS = soldItemRecords.reduce((sum, item) => sum + item.costPrice, 0);
    const totalGrossProfit = totalSalesRevenue - totalCOGS;
    const overallMarginPercent = totalSalesRevenue > 0 ? Number(((totalGrossProfit / totalSalesRevenue) * 100).toFixed(2)) : 0;
    const overallMarkupPercent = totalCOGS > 0 ? Number(((totalGrossProfit / totalCOGS) * 100).toFixed(2)) : 0;

    // Filtered expenses for net profit calculation
    const totalShopExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const netOperatingProfit = totalGrossProfit - totalShopExpenses;

    // In-Stock Inventory Potential Margins
    const inventoryTotalValuation = inventoryItemRecords.reduce((sum, item) => sum + item.salePrice, 0);
    const inventoryTotalCost = inventoryItemRecords.reduce((sum, item) => sum + item.costPrice, 0);
    const inventoryUnrealizedProfit = inventoryTotalValuation - inventoryTotalCost;
    const inventoryPotentialMarginPct = inventoryTotalValuation > 0 ? Number(((inventoryUnrealizedProfit / inventoryTotalValuation) * 100).toFixed(2)) : 0;

    // Top profitable item & category
    let topCategory = '-';
    let topCatProfit = -1;
    interface CategoryStat {
      profit: number;
      revenue: number;
      cost: number;
      count: number;
    }
    const catMap: Record<string, CategoryStat> = {};

    soldItemRecords.forEach(item => {
      if (!catMap[item.category]) {
        catMap[item.category] = { profit: 0, revenue: 0, cost: 0, count: 0 };
      }
      catMap[item.category].profit += item.profitAmount;
      catMap[item.category].revenue += item.salePrice;
      catMap[item.category].cost += item.costPrice;
      catMap[item.category].count += 1;
    });

    (Object.entries(catMap) as [string, CategoryStat][]).forEach(([cat, stats]) => {
      if (stats.profit > topCatProfit) {
        topCatProfit = stats.profit;
        topCategory = cat;
      }
    });

    return {
      totalSalesRevenue,
      totalCOGS,
      totalGrossProfit,
      overallMarginPercent,
      overallMarkupPercent,
      totalShopExpenses,
      netOperatingProfit,
      inventoryTotalValuation,
      inventoryTotalCost,
      inventoryUnrealizedProfit,
      inventoryPotentialMarginPct,
      topCategory,
      topCatProfit,
      soldItemsCount: soldItemRecords.length,
      categoryStats: catMap
    };
  }, [soldItemRecords, inventoryItemRecords, expenses]);

  // Category Profitability Breakdown List (for charts & visual analysis)
  const categoryBreakdownList = useMemo(() => {
    interface CategoryStat {
      profit: number;
      revenue: number;
      cost: number;
      count: number;
    }
    const list = (Object.entries(summaryMetrics.categoryStats) as [string, CategoryStat][]).map(([cat, stats]) => {
      const margin = stats.revenue > 0 ? Number(((stats.profit / stats.revenue) * 100).toFixed(1)) : 0;
      return {
        category: cat,
        revenue: stats.revenue,
        cost: stats.cost,
        profit: stats.profit,
        count: stats.count,
        margin
      };
    });
    // Sort by profit descending
    return list.sort((a, b) => b.profit - a.profit);
  }, [summaryMetrics.categoryStats]);

  // Margin Tier counts (for donut / distribution breakdown)
  const marginTiers = useMemo(() => {
    let high = 0; // > 20%
    let medium = 0; // 10% - 20%
    let low = 0; // < 10%

    soldItemRecords.forEach(i => {
      if (i.marginPercent >= 20) high++;
      else if (i.marginPercent >= 10) medium++;
      else low++;
    });

    const total = soldItemRecords.length || 1;
    return {
      high,
      medium,
      low,
      highPct: Math.round((high / total) * 100),
      mediumPct: Math.round((medium / total) * 100),
      lowPct: Math.round((low / total) * 100),
    };
  }, [soldItemRecords]);

  // Simulation Impact Calculation
  const simImpact = useMemo(() => {
    if (!showSimulator || (simMakingChargeDelta === 0 && simGoldRateDelta === 0)) {
      return null;
    }
    // Calculate simulated profit difference on sold gold items
    let simAddedProfit = 0;
    soldItemRecords.forEach(item => {
      if (item.metal === 'Gold') {
        const makingIncrease = item.netWeight * simMakingChargeDelta;
        const rateIncrease = item.netWeight * simGoldRateDelta;
        simAddedProfit += makingIncrease + rateIncrease;
      }
    });
    const newGrossProfit = summaryMetrics.totalGrossProfit + simAddedProfit;
    const newMarginPct = summaryMetrics.totalSalesRevenue > 0
      ? Number((((newGrossProfit) / (summaryMetrics.totalSalesRevenue + simAddedProfit)) * 100).toFixed(2))
      : 0;

    return {
      simAddedProfit,
      newGrossProfit,
      newMarginPct
    };
  }, [showSimulator, simMakingChargeDelta, simGoldRateDelta, soldItemRecords, summaryMetrics]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Tag No',
      'HUID',
      'Item Name',
      'Category',
      'Metal',
      'Purity',
      'Net Wt (g)',
      'Gross Wt (g)',
      'Cost Price (₹)',
      'Sale Price (₹)',
      'Gross Profit (₹)',
      'Margin %',
      'Markup %',
      'Status',
      'Invoice No',
      'Date',
      'Customer'
    ];

    const rows = filteredRecords.map(item => [
      `"${item.tagNo}"`,
      `"${item.huid || '-'}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.metal}"`,
      `"${item.purity}"`,
      item.netWeight,
      item.grossWeight,
      item.costPrice,
      item.salePrice,
      item.profitAmount,
      `${item.marginPercent}%`,
      `${item.markupPercent}%`,
      item.isSold ? 'Sold' : 'In Stock',
      `"${item.invoiceNo || '-'}"`,
      `"${item.date}"`,
      `"${item.customerName || '-'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Shreem_Mahal_Profit_Margins_${activeView}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">

      {/* Top Banner & Control Station */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-2xl relative overflow-hidden transition">
        {/* Subtle decorative gold gradient in background */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 font-serif tracking-wide flex-wrap">
                  Profit & Margin Analytics
                  <span className="text-xs font-mono font-bold bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-2 py-0.5 rounded-full">
                    मुनाफा व मार्जिन रिपोर्ट
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Itemized Cost vs Sale Price Analysis • Realized Invoices & In-Stock Inventory Margin Audits
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons: Simulator, Print & Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSimulator(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                showSimulator 
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-amber-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Simulate profit impact of making charge and gold rate tweaks"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showSimulator ? 'Close Simulator' : 'Margin Simulator'}</span>
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              title="Print Auditor Profit Summary"
            >
              <Printer className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Print Audit</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition cursor-pointer"
              title="Export complete profit margin breakdown to CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* View Mode Tabs & Date Presets */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Main View Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs self-start overflow-x-auto">
            <button
              onClick={() => setActiveView('sold')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'sold'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Realized Sales Profit ({soldItemRecords.length})</span>
            </button>
            <button
              onClick={() => setActiveView('inventory')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'inventory'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>In-Stock Potential Margin ({inventoryItemRecords.length})</span>
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeView === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Combined View</span>
            </button>
          </div>

          {/* Date Filter (Active for Sold Invoices) */}
          {activeView !== 'inventory' && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                <Calendar className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Date Filter:
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 overflow-x-auto">
                {(['all', 'today', 'yesterday', 'week', 'month', 'custom'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setDateRangePreset(preset)}
                    className={`px-2.5 py-1 rounded-lg font-medium capitalize text-[11px] transition cursor-pointer whitespace-nowrap ${
                      dateRangePreset === preset
                        ? 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 font-bold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {preset === 'all' ? 'All Time' : preset === 'week' ? 'Last 7 Days' : preset === 'month' ? 'This Month' : preset}
                  </button>
                ))}
              </div>

              {dateRangePreset === 'custom' && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-200 font-mono"
                    title="Start Date"
                  />
                  <span className="text-slate-500 text-xs">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-900 dark:text-slate-200 font-mono"
                    title="End Date"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* What-If Margin Simulator Drawer (Collapsible) */}
      {showSimulator && (
        <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/40 rounded-2xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-amber-300">
                Interactive Profit Margin Simulator (मुनाफा अनुमान कैलकुलेटर)
              </h3>
            </div>
            <button
              onClick={() => {
                setSimMakingChargeDelta(0);
                setSimGoldRateDelta(0);
              }}
              className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition"
            >
              <RefreshCw className="w-3 h-3" /> Reset Sliders
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Making Charge Adjustment:</span>
                <span className={`font-mono font-bold ${simMakingChargeDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simMakingChargeDelta >= 0 ? `+₹${simMakingChargeDelta}/g` : `-₹${Math.abs(simMakingChargeDelta)}/g`}
                </span>
              </div>
              <input
                type="range"
                min="-150"
                max="250"
                step="10"
                value={simMakingChargeDelta}
                onChange={(e) => setSimMakingChargeDelta(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>-₹150 (Discounting)</span>
                <span>Current Standard</span>
                <span>+₹250 (Premium Making)</span>
              </div>
            </div>

            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Retail Bullion Spread:</span>
                <span className={`font-mono font-bold ${simGoldRateDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simGoldRateDelta >= 0 ? `+₹${simGoldRateDelta}/g` : `-₹${Math.abs(simGoldRateDelta)}/g`}
                </span>
              </div>
              <input
                type="range"
                min="-200"
                max="400"
                step="25"
                value={simGoldRateDelta}
                onChange={(e) => setSimGoldRateDelta(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>-₹200/g</span>
                <span>Live Bhopal Market</span>
                <span>+₹400/g</span>
              </div>
            </div>
          </div>

          {simImpact && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-wrap items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-slate-200">
                  Projected Gross Profit Impact: <strong className={`font-mono ${simImpact.simAddedProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {simImpact.simAddedProfit >= 0 ? `+₹${Math.round(simImpact.simAddedProfit).toLocaleString('en-IN')}` : `-₹${Math.abs(Math.round(simImpact.simAddedProfit)).toLocaleString('en-IN')}`}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-4 text-slate-300 font-mono">
                <span>New Profit: <strong className="text-amber-300">₹{Math.round(simImpact.newGrossProfit).toLocaleString('en-IN')}</strong></span>
                <span>New Margin: <strong className="text-emerald-400">{simImpact.newMarginPct}%</strong></span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Executive Shop Performance KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Gross Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {activeView === 'inventory' ? 'Inventory Valuation' : 'Total Sales Turnover'}
            </span>
            <div className="p-1.5 bg-amber-100 dark:bg-amber-500/10 rounded-lg text-amber-700 dark:text-amber-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight">
            ₹{Math.round(activeView === 'inventory' ? summaryMetrics.inventoryTotalValuation : summaryMetrics.totalSalesRevenue).toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>{activeView === 'inventory' ? `${inventoryItemRecords.length} Stock Units` : `${summaryMetrics.soldItemsCount} Items Billed`}</span>
            <span className="text-amber-700 dark:text-amber-400 font-mono font-bold">100% Volume</span>
          </div>
        </div>

        {/* Card 2: Cost of Goods Sold (COGS) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {activeView === 'inventory' ? 'Total Acquisition Cost' : 'Cost of Goods Sold (COGS)'}
            </span>
            <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono tracking-tight">
            ₹{Math.round(activeView === 'inventory' ? summaryMetrics.inventoryTotalCost : summaryMetrics.totalCOGS).toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Wholesale metal + karigar + stone</span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              {activeView === 'inventory' 
                ? `${((summaryMetrics.inventoryTotalCost / (summaryMetrics.inventoryTotalValuation || 1)) * 100).toFixed(1)}% of value` 
                : `${((summaryMetrics.totalCOGS / (summaryMetrics.totalSalesRevenue || 1)) * 100).toFixed(1)}% of sales`}
            </span>
          </div>
        </div>

        {/* Card 3: Total Gross Profit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              {activeView === 'inventory' ? 'Unrealized Gross Margin' : 'Total Gross Profit (सकल लाभ)'}
            </span>
            <div className="p-1.5 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
            ₹{Math.round(activeView === 'inventory' ? summaryMetrics.inventoryUnrealizedProfit : summaryMetrics.totalGrossProfit).toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="text-emerald-700 dark:text-emerald-400/90 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              {activeView === 'inventory' ? `${summaryMetrics.inventoryPotentialMarginPct}% Projected` : `${summaryMetrics.overallMarginPercent}% Margin`}
            </span>
            <span className="font-mono text-slate-500 dark:text-slate-400">
              Markup: {activeView === 'inventory' 
                ? `${(((summaryMetrics.inventoryUnrealizedProfit / (summaryMetrics.inventoryTotalCost || 1))) * 100).toFixed(1)}%` 
                : `${summaryMetrics.overallMarkupPercent}%`}
            </span>
          </div>
        </div>

        {/* Card 4: Net Operating Profit (After Shop Expenses) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Net Profit (दुकान खर्च काटकर)</span>
            <div className="p-1.5 bg-blue-100 dark:bg-blue-500/10 rounded-lg text-blue-700 dark:text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono tracking-tight">
            ₹{Math.round(summaryMetrics.netOperatingProfit).toLocaleString('en-IN')}
          </p>
          <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span className="truncate">Expenses: -₹{summaryMetrics.totalShopExpenses.toLocaleString('en-IN')}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">Rent, MPEB, Staff</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Category Breakdown + Margin Tiers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart 1: Category Profitability Comparison (2 Columns) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Category-wise Profit & Revenue Breakdown
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Visual margin distribution across jewellery categories
              </p>
            </div>
            <span className="text-xs font-mono text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-500/20 font-bold">
              Top: {summaryMetrics.topCategory}
            </span>
          </div>

          <div className="space-y-3 pt-2">
            {categoryBreakdownList.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">
                No category sales recorded for the selected filter range.
              </div>
            ) : (
              categoryBreakdownList.map((catItem) => {
                const maxRevenue = Math.max(...categoryBreakdownList.map(c => c.revenue)) || 1;
                const revWidth = Math.min(100, Math.max(8, (catItem.revenue / maxRevenue) * 100));

                return (
                  <div key={catItem.category} className="space-y-1 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{catItem.category}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({catItem.count} sold)</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">Rev: ₹{catItem.revenue.toLocaleString('en-IN')}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">Profit: ₹{catItem.profit.toLocaleString('en-IN')}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/20">
                          {catItem.margin}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden flex">
                      <div 
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${revWidth}%` }}
                        title={`Revenue: ₹${catItem.revenue.toLocaleString('en-IN')}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chart 2: Margin Tiers & Profit Quality Gauge */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm dark:shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Profit Margin Quality Tiers
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Distribution of sold merchandise</p>
              </div>
            </div>

            {/* Visual Gauge Stack */}
            <div className="space-y-3 pt-2">
              {/* High Margin */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    High Margin (&gt; 20%)
                  </span>
                  <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{marginTiers.high} items ({marginTiers.highPct}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${marginTiers.highPct}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Diamonds, Gemstones, Custom Designer Bridal</span>
              </div>

              {/* Moderate Margin */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    Standard Jewellery (10% - 20%)
                  </span>
                  <span className="font-mono text-amber-700 dark:text-amber-400 font-bold">{marginTiers.medium} items ({marginTiers.mediumPct}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${marginTiers.mediumPct}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Hallmarked 22K/18K Gold & Sterling Silver</span>
              </div>

              {/* Low / Bullion Margin */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 shrink-0" />
                    Bullion & Coins (&lt; 10%)
                  </span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{marginTiers.low} items ({marginTiers.lowPct}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-400 h-full rounded-full" style={{ width: `${marginTiers.lowPct}%` }} />
                </div>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Minted 24K Bars, Coins & Pure Bullion</span>
              </div>
            </div>
          </div>

          {/* Quick Sarafa Tip */}
          <div className="p-3 bg-amber-50 dark:bg-amber-500/5 rounded-xl border border-amber-200 dark:border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-300/90 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              Tip: In Bhopal Sarafa retail, studded diamond rings and loose certified gemstones generate the highest margin percentage (~30-40%), balancing tight bullion coin trading.
            </span>
          </div>
        </div>
      </div>

      {/* Individual Item-Level Profit Margins Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-2xl space-y-3 transition">
        
        {/* Table Filter Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by Item name, Tag No, HUID, Bill No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Category, Metal & Margin Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Metal Dropdown */}
            <select
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Metals</option>
              <option value="Gold">Gold</option>
              <option value="Silver">Silver</option>
              <option value="Diamond">Diamond</option>
              <option value="Platinum">Platinum</option>
            </select>

            {/* Margin Tier */}
            <select
              value={selectedMarginTier}
              onChange={(e) => setSelectedMarginTier(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Margins</option>
              <option value="high">High Margin (&gt; 20%)</option>
              <option value="medium">Standard (10% - 20%)</option>
              <option value="low">Thin (&lt; 10%)</option>
            </select>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2 py-1 text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[10px]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-amber-700 dark:text-amber-300 font-bold focus:outline-none cursor-pointer"
              >
                <option value="profit">Profit (₹)</option>
                <option value="margin">Margin (%)</option>
                <option value="revenue">Sale Price</option>
                <option value="cost">Cost Price</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white px-1"
                title={`Sort: ${sortOrder === 'desc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'desc' ? '↓' : '↑'}
              </button>
            </div>
          </div>
        </div>

        {/* Results Count & Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[850px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950/60 text-slate-700 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-3.5">Tag & HUID</th>
                <th className="py-3 px-3.5">Item Description</th>
                <th className="py-3 px-3.5">Category & Metal</th>
                <th className="py-3 px-3.5 text-right">Net Wt</th>
                <th className="py-3 px-3.5 text-right">Cost Price (₹)</th>
                <th className="py-3 px-3.5 text-right">Sale Price (₹)</th>
                <th className="py-3 px-3.5 text-right">Gross Profit (₹)</th>
                <th className="py-3 px-3.5 text-center">Margin %</th>
                <th className="py-3 px-3.5 text-center">Status / Date</th>
                <th className="py-3 px-3.5 text-center">Breakdown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <p className="text-sm font-medium">No items found matching the selected filters.</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try resetting search query or switching between Sold and Inventory views.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isHighMargin = item.marginPercent >= 20;
                  const isMediumMargin = item.marginPercent >= 10 && item.marginPercent < 20;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition group">
                      {/* Tag & HUID */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-300 block">{item.tagNo}</span>
                        {item.huid && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" /> HUID: {item.huid}
                          </span>
                        )}
                      </td>

                      {/* Name */}
                      <td className="py-3 px-3.5 max-w-xs">
                        <span className="font-semibold text-slate-900 dark:text-slate-200 block truncate" title={item.name}>
                          {item.name}
                        </span>
                        {item.customerName && item.customerName !== '-' && (
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                            Sold to: {item.customerName}
                          </span>
                        )}
                      </td>

                      {/* Category & Metal */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="text-slate-700 dark:text-slate-300 font-medium block">{item.category}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400/80 font-mono">
                          {item.metal} {item.purity}
                        </span>
                      </td>

                      {/* Net Wt */}
                      <td className="py-3 px-3.5 text-right font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {item.netWeight > 0 ? `${item.netWeight.toFixed(2)}g` : '-'}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3.5 text-right font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        ₹{item.costPrice.toLocaleString('en-IN')}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-200 whitespace-nowrap">
                        ₹{item.salePrice.toLocaleString('en-IN')}
                      </td>

                      {/* Profit Amount */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold whitespace-nowrap">
                        <span className={item.profitAmount >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {item.profitAmount >= 0 ? `+₹${item.profitAmount.toLocaleString('en-IN')}` : `-₹${Math.abs(item.profitAmount).toLocaleString('en-IN')}`}
                        </span>
                      </td>

                      {/* Margin % */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-mono text-[11px] font-bold border ${
                          isHighMargin
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                            : isMediumMargin
                            ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                        }`}>
                          {item.marginPercent}%
                        </span>
                      </td>

                      {/* Status / Date */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium block ${
                          item.isSold ? 'bg-blue-100 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                        }`}>
                          {item.isSold ? `Billed (${item.date})` : 'In Stock Safe'}
                        </span>
                        {item.invoiceNo && item.invoiceNo !== 'Available Inventory' && (
                          <span className="text-[9px] text-slate-500 dark:text-slate-500 font-mono block mt-0.5">
                            {item.invoiceNo}
                          </span>
                        )}
                      </td>

                      {/* Drilldown action */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedDrilldownItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 text-[10px] font-medium border border-slate-300 dark:border-slate-700 transition cursor-pointer flex items-center gap-1 mx-auto"
                          title="View detailed cost & pricing breakdown"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View Cost</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 dark:text-slate-400 gap-2">
          <span>Showing {filteredRecords.length} items</span>
          <div className="flex items-center gap-4 font-mono">
            <span>Total Sales Value: <strong className="text-slate-900 dark:text-slate-200">₹{filteredRecords.reduce((s, i) => s + i.salePrice, 0).toLocaleString('en-IN')}</strong></span>
            <span>Total Profit: <strong className="text-emerald-700 dark:text-emerald-400">₹{filteredRecords.reduce((s, i) => s + i.profitAmount, 0).toLocaleString('en-IN')}</strong></span>
          </div>
        </div>
      </div>

      {/* Drilldown Cost Price Modal */}
      {selectedDrilldownItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative space-y-4 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShreemLogo size="sm" showText={false} />
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif">
                    Item Cost Price & Profit Drilldown
                  </h3>
                  <span className="text-xs text-amber-700 dark:text-amber-400 font-mono font-bold">
                    {selectedDrilldownItem.tagNo} {selectedDrilldownItem.huid ? `• HUID: ${selectedDrilldownItem.huid}` : ''}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedDrilldownItem(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Item Name:</span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{selectedDrilldownItem.name}</span>
                <div className="flex flex-wrap gap-3 text-slate-600 dark:text-slate-400 mt-1 font-mono">
                  <span>Category: <strong className="text-slate-800 dark:text-slate-300">{selectedDrilldownItem.category}</strong></span>
                  <span>Metal: <strong className="text-slate-800 dark:text-slate-300">{selectedDrilldownItem.metal} {selectedDrilldownItem.purity}</strong></span>
                  <span>Net Wt: <strong className="text-slate-800 dark:text-slate-300">{selectedDrilldownItem.netWeight}g</strong></span>
                </div>
              </div>

              {/* Cost vs Selling Side-by-Side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Acquisition Cost (COGS)</span>
                  <div className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono">
                    ₹{selectedDrilldownItem.costPrice.toLocaleString('en-IN')}
                  </div>
                  <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <li>• Raw wholesale bullion purchase</li>
                    <li>• Karigar casting & labor paid</li>
                    <li>• Wholesale gemstone cost</li>
                    {selectedDrilldownItem.huid && <li>• BIS Hallmarking fee (₹45)</li>}
                  </ul>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 block uppercase tracking-wider">Sale / Billing Value</span>
                  <div className="text-xl font-black text-amber-700 dark:text-amber-300 font-mono">
                    ₹{selectedDrilldownItem.salePrice.toLocaleString('en-IN')}
                  </div>
                  <ul className="text-[10px] text-slate-500 dark:text-slate-400 space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <li>• Retail bullion rate applied</li>
                    <li>• Wastage / touch addition</li>
                    <li>• Retail making charges collected</li>
                    <li>• Certified gemstone retail value</li>
                  </ul>
                </div>
              </div>

              {/* Profit Bottom Line */}
              <div className="p-3.5 bg-emerald-50 dark:bg-gradient-to-r dark:from-emerald-950/30 dark:via-slate-950 dark:to-slate-950 border border-emerald-300 dark:border-emerald-500/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">Net Item Profit</span>
                  <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                    ₹{selectedDrilldownItem.profitAmount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium block">Gross Margin</span>
                  <span className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
                    {selectedDrilldownItem.marginPercent}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Markup: {selectedDrilldownItem.markupPercent}%</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setSelectedDrilldownItem(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Audit Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Print Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-3">
                <ShreemLogo size="sm" showText={false} />
                <div>
                  <h2 className="text-lg font-black font-serif text-slate-900">
                    {shopDetails?.name || 'SHREEM MAHAL JEWELLERS'}
                  </h2>
                  <p className="text-xs text-slate-600">
                    {shopDetails?.address || 'Shop No 6, Ground Floor, Saideep Plaza, DK 2, Kolar, Bhopal - 462042'}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    GSTIN: {shopDetails?.gstin || '23AAMCS9202B1Z8'} • Ph: {shopDetails?.phone || '+91 9202357851'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-center py-1 border-b">
              <h3 className="text-base font-bold uppercase tracking-wider text-slate-800">
                Official Profit Margins & Cost Audit Report
              </h3>
              <p className="text-xs text-slate-500">
                Generated Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Audit Summary 4-Box */}
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-2.5 bg-slate-50 border rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Total Sales</span>
                <span className="text-sm font-black font-mono">₹{summaryMetrics.totalSalesRevenue.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Cost of Goods</span>
                <span className="text-sm font-black font-mono">₹{summaryMetrics.totalCOGS.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Gross Profit</span>
                <span className="text-sm font-black font-mono text-emerald-700">₹{summaryMetrics.totalGrossProfit.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 bg-slate-50 border rounded-lg">
                <span className="text-[10px] text-slate-500 uppercase block">Margin %</span>
                <span className="text-sm font-black font-mono text-emerald-700">{summaryMetrics.overallMarginPercent}%</span>
              </div>
            </div>

            {/* Print Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-[10px] font-bold text-slate-700 border-b">
                    <th className="p-2">Tag No</th>
                    <th className="p-2">Item Description</th>
                    <th className="p-2">Category</th>
                    <th className="p-2 text-right">Cost (₹)</th>
                    <th className="p-2 text-right">Sale (₹)</th>
                    <th className="p-2 text-right">Profit (₹)</th>
                    <th className="p-2 text-center">Margin %</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-[11px]">
                  {filteredRecords.slice(0, 15).map(item => (
                    <tr key={item.id}>
                      <td className="p-2 font-mono">{item.tagNo}</td>
                      <td className="p-2 font-medium">{item.name}</td>
                      <td className="p-2">{item.category}</td>
                      <td className="p-2 text-right font-mono">₹{item.costPrice.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-mono">₹{item.salePrice.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-right font-mono font-bold text-emerald-700">₹{item.profitAmount.toLocaleString('en-IN')}</td>
                      <td className="p-2 text-center font-mono font-bold">{item.marginPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Signatures */}
            <div className="pt-8 flex justify-between text-xs text-slate-500 border-t">
              <div className="text-center">
                <div className="h-10 border-b border-dashed border-slate-300 w-40 mb-1" />
                <span>Prepared By (Accountant)</span>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-dashed border-slate-300 w-40 mb-1" />
                <span>Authorized Signatory / Proprietor</span>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t">
              <button
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-slate-100"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
