import React, { useState } from 'react';
import { JewelleryItem, MetalRate } from '../../types';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  Coins, 
  Edit3, 
  Trash2, 
  Package, 
  Sparkles, 
  Scale, 
  ShieldCheck, 
  Tag, 
  Barcode, 
  Wand2, 
  Layers,
  Layers2,
  Gem,
  CircleDot,
  Boxes,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export type StockMaintainMode = 
  | 'tag_wise' 
  | 'pc_wise' 
  | 'batch_wise' 
  | 'loose_stock' 
  | 'dia_wt_wise' 
  | 'stn_wt_wise' 
  | 'carat_wise';

interface InventoryListProps {
  inventory: JewelleryItem[];
  rates: MetalRate[];
  categories: string[];
  shopName?: string;
  onAddItem: () => void;
  onEditItem: (item: JewelleryItem) => void;
  onDeleteItem: (id: string) => void;
  onUpdateQty: (id: string, newQty: number) => void;
  onSelectForBarcode?: (item: JewelleryItem) => void;
  onOpenCategoryModal: () => void;
  onOpenQuickGenerate: () => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  inventory,
  rates,
  categories,
  shopName = 'Swarnkar Jewellery ERP',
  onAddItem,
  onEditItem,
  onDeleteItem,
  onUpdateQty,
  onSelectForBarcode,
  onOpenCategoryModal,
  onOpenQuickGenerate,
}) => {
  const [maintainMode, setMaintainMode] = useState<StockMaintainMode>('tag_wise');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedPurity, setSelectedPurity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Out'>('All');

  const getRateForPurity = (metal: string, purity: string) => {
    const rateObj = rates.find(r => r.metal === metal && r.purity === purity);
    return rateObj ? rateObj.ratePerGram : 0;
  };

  // Safe search and filters
  const filteredItems = inventory.filter(item => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.name || '').toLowerCase().includes(term) ||
      (item.tagNo || '').toLowerCase().includes(term) ||
      (item.barcode || '').toLowerCase().includes(term) ||
      (item.huid && item.huid.toLowerCase().includes(term)) ||
      (item.purity || '').toLowerCase().includes(term) ||
      (item.category || '').toLowerCase().includes(term);

    const matchesMetal = selectedMetal === 'All' || item.metal === selectedMetal;
    const matchesPurity = selectedPurity === 'All' || item.purity === selectedPurity;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    const matchesStock = 
      stockFilter === 'All' ? true :
      stockFilter === 'Low' ? item.quantity <= item.minStockAlert && item.quantity > 0 :
      item.quantity === 0;

    return matchesSearch && matchesMetal && matchesPurity && matchesCategory && matchesStock;
  });

  // Calculate Total Inventory Valuation & Weights
  let totalGoldWeightGrams = 0;
  let totalSilverWeightGrams = 0;
  let totalValuationINR = 0;
  let totalDiamondCarats = 0;
  let totalStoneGrams = 0;
  let totalPieces = 0;

  inventory.forEach(item => {
    const rate = getRateForPurity(item.metal, item.purity);
    const itemValuation = ((item.netWeight * rate) + item.stoneValue) * item.quantity;
    totalValuationINR += itemValuation;
    totalPieces += item.quantity;

    if (item.metal === 'Gold') {
      totalGoldWeightGrams += item.netWeight * item.quantity;
    } else if (item.metal === 'Silver') {
      totalSilverWeightGrams += item.netWeight * item.quantity;
    }

    if (item.stoneType && item.stoneType.toLowerCase().includes('dia')) {
      totalDiamondCarats += (item.stoneCarat || 0) * item.quantity;
    }
    const stoneG = (item.grossWeight - item.netWeight);
    if (stoneG > 0) {
      totalStoneGrams += stoneG * item.quantity;
    }
  });

  // Carat Wise Grouping
  const caratGroups = ['24K', '22K', '20K', '18K', '14K', '9K', '999 Fine', '925 Sterling'].map(pur => {
    const items = inventory.filter(i => i.purity === pur);
    const grossWt = items.reduce((acc, i) => acc + (i.grossWeight * i.quantity), 0);
    const netWt = items.reduce((acc, i) => acc + (i.netWeight * i.quantity), 0);
    const pcs = items.reduce((acc, i) => acc + i.quantity, 0);
    let purityFactor = 0.916;
    if (pur === '24K' || pur === '999 Fine') purityFactor = 0.999;
    else if (pur === '22K') purityFactor = 0.916;
    else if (pur === '20K') purityFactor = 0.833;
    else if (pur === '18K') purityFactor = 0.750;
    else if (pur === '14K') purityFactor = 0.585;
    else if (pur === '925 Sterling') purityFactor = 0.925;
    const fineGold = netWt * purityFactor;
    return { purity: pur, itemsCount: items.length, pcs, grossWt, netWt, fineGold };
  }).filter(g => g.pcs > 0);

  // Batch Wise Mock grouping
  const batchGroups = [
    { batchNo: 'BATCH-2026-DIWALI-A', supplier: 'Zaveri Bazaar Gems', itemsCount: 6, totalGross: 84.50, totalNet: 81.20, fineGold: 74.38, status: 'In Stock' },
    { batchNo: 'BATCH-2026-WEDDING-B', supplier: 'Surat Diamond Craft', itemsCount: 4, totalGross: 42.15, totalNet: 39.80, fineGold: 29.85, status: 'In Stock' },
    { batchNo: 'BATCH-2026-CHAINS-C', supplier: 'Rajkot Gold Castings', itemsCount: 12, totalGross: 145.20, totalNet: 144.90, fineGold: 132.73, status: 'Verified' },
  ];

  return (
    <div className="space-y-4">
      
      {/* Top Windows-style Header Strip */}
      <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            <h1 className="text-base font-black text-slate-800 tracking-tight flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              <span>{shopName} • Stock Maintenance & Inventory Register</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete inventory tracking (Pc wise, Batch wise, Tag wise, Loose stock, Dia wt, Stn wt, Carat wise)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenCategoryModal}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 border border-slate-300 transition cursor-pointer"
            title="Manage Custom Categories"
          >
            <Layers className="w-4 h-4 text-amber-600" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            onClick={onOpenQuickGenerate}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            title="1-Click Auto Generate Item with SKU & HUID"
          >
            <Wand2 className="w-4 h-4" />
            <span>Auto Tag Generator</span>
          </button>

          <button
            onClick={onAddItem}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Add New Item (मैनुअल)</span>
          </button>
        </div>
      </div>

      {/* Swarnkar 4-KPI High-Contrast Summary Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Total Value */}
        <div className="bg-white border-l-4 border-l-amber-500 border border-slate-300 p-3 rounded-lg shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stock Value</div>
          <div className="text-lg font-black text-slate-900 font-mono mt-0.5">
            ₹{Math.round(totalValuationINR).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-amber-700 font-semibold">{totalPieces} Pieces in store</div>
        </div>

        {/* Gold Net Weight */}
        <div className="bg-white border-l-4 border-l-amber-600 border border-slate-300 p-3 rounded-lg shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gold Stock (Net)</div>
          <div className="text-lg font-black text-amber-700 font-mono mt-0.5">
            {totalGoldWeightGrams.toFixed(2)} g
          </div>
          <div className="text-[10px] text-slate-500">{(totalGoldWeightGrams / 10).toFixed(2)} Tola</div>
        </div>

        {/* Silver Net Weight */}
        <div className="bg-white border-l-4 border-l-slate-400 border border-slate-300 p-3 rounded-lg shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Silver Stock</div>
          <div className="text-lg font-black text-slate-700 font-mono mt-0.5">
            {totalSilverWeightGrams.toFixed(2)} g
          </div>
          <div className="text-[10px] text-slate-500">{(totalSilverWeightGrams / 1000).toFixed(2)} Kg</div>
        </div>

        {/* Diamond Carats */}
        <div className="bg-white border-l-4 border-l-blue-500 border border-slate-300 p-3 rounded-lg shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Diamond Wt</div>
          <div className="text-lg font-black text-blue-700 font-mono mt-0.5">
            {totalDiamondCarats.toFixed(2)} ct
          </div>
          <div className="text-[10px] text-blue-600 font-semibold">Certified Diamonds</div>
        </div>

        {/* Stone / Kundan / Meena Wt */}
        <div className="bg-white border-l-4 border-l-purple-500 border border-slate-300 p-3 rounded-lg shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stone Wt (Loss)</div>
          <div className="text-lg font-black text-purple-700 font-mono mt-0.5">
            {totalStoneGrams.toFixed(2)} g
          </div>
          <div className="text-[10px] text-purple-600 font-semibold">Deducted from Gold</div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white border-l-4 border-l-rose-500 border border-slate-300 p-3 rounded-lg shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Low Stock Alert</div>
          <div className="text-lg font-black text-rose-600 font-mono mt-0.5">
            {inventory.filter(i => i.quantity <= i.minStockAlert).length} Items
          </div>
          <div className="text-[10px] text-rose-500 font-semibold">Reorder required</div>
        </div>
      </div>

      {/* Swarnkar 7-Mode Stock Maintenance Sub-Tabs */}
      <div className="bg-slate-200 p-1 rounded-xl border border-slate-300 flex items-center gap-1 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setMaintainMode('tag_wise')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            maintainMode === 'tag_wise' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-3.5 h-3.5 text-amber-600" />
          <span>1. Tag Wise (टैग अनुसार)</span>
        </button>

        <button
          onClick={() => setMaintainMode('pc_wise')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            maintainMode === 'pc_wise' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-blue-600" />
          <span>2. Pc Wise (नग अनुसार)</span>
        </button>

        <button
          onClick={() => setMaintainMode('batch_wise')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            maintainMode === 'batch_wise' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>3. Batch Wise (लॉट / बैच)</span>
        </button>

        <button
          onClick={() => setMaintainMode('loose_stock')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            maintainMode === 'loose_stock' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Scale className="w-3.5 h-3.5 text-amber-700" />
          <span>4. Loose Stock (खुला / लगड़ी माल)</span>
        </button>

        <button
          onClick={() => setMaintainMode('dia_wt_wise')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            maintainMode === 'dia_wt_wise' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Gem className="w-3.5 h-3.5 text-cyan-600" />
          <span>5. Dia Wt Wise (हीरा वजन)</span>
        </button>

        <button
          onClick={() => setMaintainMode('stn_wt_wise')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            maintainMode === 'stn_wt_wise' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CircleDot className="w-3.5 h-3.5 text-purple-600" />
          <span>6. Stn Wt Wise (स्टोन लेस)</span>
        </button>

        <button
          onClick={() => setMaintainMode('carat_wise')}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition cursor-pointer ${
            maintainMode === 'carat_wise' 
              ? 'bg-white text-slate-900 shadow-sm border border-slate-300 font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>7. Carat Wise (शुद्धता / फाइन)</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-300 rounded-xl p-3 shadow-sm flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2" />
          <input
            type="text"
            placeholder="Search SKU, Tag, HUID, Name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
          />
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedMetal}
            onChange={e => setSelectedMetal(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
          >
            <option value="All">All Metals</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Platinum">Platinum</option>
            <option value="Diamond">Diamond</option>
          </select>

          <select
            value={selectedPurity}
            onChange={e => setSelectedPurity(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
          >
            <option value="All">All Purities</option>
            <option value="24K">24K Pure</option>
            <option value="22K">22K 916</option>
            <option value="18K">18K 750</option>
            <option value="14K">14K 585</option>
            <option value="999 Fine">Silver 999</option>
            <option value="925 Sterling">Silver 925</option>
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
          >
            <option value="All">All Categories</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-300 text-xs">
            <button
              onClick={() => setStockFilter('All')}
              className={`px-2 py-1 rounded font-bold transition ${
                stockFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('Low')}
              className={`px-2 py-1 rounded font-bold transition ${
                stockFilter === 'Low' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-600'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('Out')}
              className={`px-2 py-1 rounded font-bold transition ${
                stockFilter === 'Out' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              Out of Stock
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: TAG WISE & PC WISE TABLE */}
      {(maintainMode === 'tag_wise' || maintainMode === 'pc_wise') && (
        <div className="bg-white border border-slate-300 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px] uppercase tracking-wider">
                  <th className="p-2.5">Tag / SKU</th>
                  <th className="p-2.5">HUID / Purity</th>
                  <th className="p-2.5">Ornament Name & Category</th>
                  <th className="p-2.5 text-right">Gross Wt</th>
                  <th className="p-2.5 text-right">Less / Stn</th>
                  <th className="p-2.5 text-right">Net Wt</th>
                  <th className="p-2.5 text-right">Wastage %</th>
                  <th className="p-2.5 text-center">In Stock (Pcs)</th>
                  <th className="p-2.5 text-right">Rate / Val</th>
                  <th className="p-2.5 text-center">Action & Barcode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-12 text-slate-500 font-medium">
                      No stock items found matching your filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const rate = getRateForPurity(item.metal, item.purity);
                    const unitVal = (item.netWeight * rate) + item.stoneValue;
                    const stoneWt = item.grossWeight - item.netWeight;

                    return (
                      <tr key={item.id} className="hover:bg-amber-50/50 transition">
                        {/* Tag */}
                        <td className="p-2.5 font-mono font-bold text-slate-900">
                          <span className="bg-slate-100 border border-slate-300 px-2 py-0.5 rounded text-[11px]">
                            {item.tagNo}
                          </span>
                        </td>

                        {/* HUID & Purity */}
                        <td className="p-2.5">
                          <span className="font-bold text-amber-700 block">
                            {item.purity} {item.metal}
                          </span>
                          {item.huid ? (
                            <span className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" /> {item.huid}
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Non-HUID</span>
                          )}
                        </td>

                        {/* Name & Category */}
                        <td className="p-2.5">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-500">{item.category}</div>
                        </td>

                        {/* Gross Weight */}
                        <td className="p-2.5 text-right font-mono text-slate-700">
                          {item.grossWeight.toFixed(2)} g
                        </td>

                        {/* Stone Less */}
                        <td className="p-2.5 text-right font-mono text-purple-700 font-semibold">
                          {stoneWt > 0 ? `-${stoneWt.toFixed(2)} g` : '0.00'}
                        </td>

                        {/* Net Weight */}
                        <td className="p-2.5 text-right font-mono font-black text-amber-800 text-sm">
                          {item.netWeight.toFixed(2)} g
                        </td>

                        {/* Wastage */}
                        <td className="p-2.5 text-right font-mono text-slate-600">
                          {item.wastagePercentage}%
                        </td>

                        {/* Quantity with quick update */}
                        <td className="p-2.5 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5">
                            <button
                              onClick={() => onUpdateQty(item.id, Math.max(0, item.quantity - 1))}
                              className="text-slate-600 hover:text-slate-900 font-black px-1"
                              title="Decrease"
                            >
                              -
                            </button>
                            <span className={`font-mono font-bold text-xs px-1 ${
                              item.quantity <= item.minStockAlert ? 'text-rose-600 font-black' : 'text-slate-900'
                            }`}>
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                              className="text-slate-600 hover:text-slate-900 font-black px-1"
                              title="Increase"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        {/* Unit Valuation */}
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          ₹{Math.round(unitVal).toLocaleString('en-IN')}
                        </td>

                        {/* Actions */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {onSelectForBarcode && (
                              <button
                                onClick={() => onSelectForBarcode(item)}
                                className="p-1 hover:bg-amber-100 text-amber-700 rounded transition"
                                title="Print Tag & Barcode"
                              >
                                <Barcode className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => onEditItem(item)}
                              className="p-1 hover:bg-blue-100 text-blue-700 rounded transition"
                              title="Edit Item"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1 hover:bg-rose-100 text-rose-700 rounded transition"
                              title="Delete Item"
                            >
                              <Trash2 className="w-4 h-4" />
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
      )}

      {/* VIEW 3: BATCH WISE STOCK */}
      {maintainMode === 'batch_wise' && (
        <div className="space-y-3">
          <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Layers2 className="w-4 h-4 text-emerald-600" />
              <span>Batch & Lot Stock Master (थोक लॉट व इनवर्ड बैच ब्यौरा)</span>
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px] uppercase">
                    <th className="p-2.5">Batch / Lot No</th>
                    <th className="p-2.5">Manufacturer / Supplier</th>
                    <th className="p-2.5 text-center">Items Count</th>
                    <th className="p-2.5 text-right">Total Gross Wt</th>
                    <th className="p-2.5 text-right">Total Net Wt</th>
                    <th className="p-2.5 text-right">Pure Fine Gold</th>
                    <th className="p-2.5 text-center">Verification Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {batchGroups.map((b, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-emerald-800">{b.batchNo}</td>
                      <td className="p-2.5 font-medium text-slate-900">{b.supplier}</td>
                      <td className="p-2.5 text-center font-bold text-slate-800">{b.itemsCount} Pcs</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">{b.totalGross.toFixed(2)} g</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{b.totalNet.toFixed(2)} g</td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-700">{b.fineGold.toFixed(2)} g</td>
                      <td className="p-2.5 text-center">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: LOOSE STOCK (खुला / लगड़ी माल) */}
      {maintainMode === 'loose_stock' && (
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-700" />
            <span>Loose Metal Stock Register (अनटैग्ड सोना, लगड़ी, ढलाई माल व गलाया हुआ स्क्रैप)</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-xs font-bold text-amber-900">24K 999 Bullion Biscuits</div>
              <div className="text-xl font-black text-amber-800 font-mono mt-1">150.00 g</div>
              <div className="text-[11px] text-amber-700 mt-1">15 Tolas in Vault Safe</div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div className="text-xs font-bold text-slate-900">Old Gold Scrap for Melting</div>
              <div className="text-xl font-black text-slate-800 font-mono mt-1">64.35 g</div>
              <div className="text-[11px] text-slate-600 mt-1">Estimated 82% Touch (52.76 g Fine)</div>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs font-bold text-blue-900">Loose Castings & Findings</div>
              <div className="text-xl font-black text-blue-800 font-mono mt-1">38.20 g</div>
              <div className="text-[11px] text-blue-700 mt-1">Hooks, clasps, jump rings & balls</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: DIA WT WISE */}
      {maintainMode === 'dia_wt_wise' && (
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Gem className="w-4 h-4 text-cyan-600" />
            <span>Diamond Weight & Clarity Register (सर्टिफाइड डायमंड स्टॉक ब्यौरा)</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px] uppercase">
                  <th className="p-2.5">Tag No</th>
                  <th className="p-2.5">Ornament Name</th>
                  <th className="p-2.5 text-center">Cut / Clarity / Color</th>
                  <th className="p-2.5 text-right">Diamond Carats</th>
                  <th className="p-2.5 text-right">Metal Net Wt</th>
                  <th className="p-2.5 text-right">Diamond Value</th>
                  <th className="p-2.5 text-center">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventory.filter(i => (i.stoneType || '').toLowerCase().includes('dia')).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-2.5 font-mono font-bold text-cyan-800">{item.tagNo}</td>
                    <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                    <td className="p-2.5 text-center">
                      <span className="bg-cyan-50 border border-cyan-200 text-cyan-800 px-2 py-0.5 rounded font-bold text-[10px]">
                        Round Brilliant / VVS-EF
                      </span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-black text-cyan-700">{item.stoneCarat || 0.45} ct</td>
                    <td className="p-2.5 text-right font-mono text-slate-700">{item.netWeight.toFixed(2)} g</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{(item.stoneValue || 28500).toLocaleString('en-IN')}</td>
                    <td className="p-2.5 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                        IGI Certified
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 6: STN WT WISE (स्टोन लेस ब्यौरा) */}
      {maintainMode === 'stn_wt_wise' && (
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CircleDot className="w-4 h-4 text-purple-600" />
            <span>Stone Weight & Deduction Register (पोल्की, कुंदन, मीना व नगीना लेस हिसाब)</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px] uppercase">
                  <th className="p-2.5">Tag No</th>
                  <th className="p-2.5">Ornament Name</th>
                  <th className="p-2.5 text-right">Gross Wt</th>
                  <th className="p-2.5 text-right">Stone / Enamel Wt</th>
                  <th className="p-2.5 text-right">Pure Net Gold</th>
                  <th className="p-2.5 text-right">Stone Type</th>
                  <th className="p-2.5 text-right">Stone Billing Val</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {inventory.map((item, idx) => {
                  const stoneLoss = item.grossWeight - item.netWeight;
                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-mono font-bold text-purple-800">{item.tagNo}</td>
                      <td className="p-2.5 font-bold text-slate-900">{item.name}</td>
                      <td className="p-2.5 text-right font-mono text-slate-600">{item.grossWeight.toFixed(2)} g</td>
                      <td className="p-2.5 text-right font-mono font-black text-rose-600">
                        {stoneLoss > 0 ? `-${stoneLoss.toFixed(2)} g` : '0.00 g'}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-amber-800">{item.netWeight.toFixed(2)} g</td>
                      <td className="p-2.5 text-right text-slate-600">{item.stoneType || 'CZ & Beads'}</td>
                      <td className="p-2.5 text-right font-mono text-slate-900">₹{item.stoneValue.toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 7: CARAT WISE SUMMARY */}
      {maintainMode === 'carat_wise' && (
        <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>Carat-Wise Stock Summary & Fine Gold Conversion (कैरेट अनुसार स्टॉक व फाइन गोल्ड)</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-[11px] uppercase">
                  <th className="p-2.5">Purity / Carat</th>
                  <th className="p-2.5 text-center">No. of SKUs</th>
                  <th className="p-2.5 text-center">Total Pcs</th>
                  <th className="p-2.5 text-right">Total Gross Wt</th>
                  <th className="p-2.5 text-right">Total Net Wt</th>
                  <th className="p-2.5 text-right">Fine Gold Equiv (99.9%)</th>
                  <th className="p-2.5 text-right">Approx Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {caratGroups.map((g, idx) => {
                  const rate = getRateForPurity('Gold', g.purity) || 13500;
                  const approxVal = g.netWt * rate;
                  return (
                    <tr key={idx} className="hover:bg-amber-50/50">
                      <td className="p-2.5 font-bold text-amber-800 text-sm">{g.purity} Gold</td>
                      <td className="p-2.5 text-center font-bold text-slate-700">{g.itemsCount}</td>
                      <td className="p-2.5 text-center font-bold text-slate-900">{g.pcs} Pcs</td>
                      <td className="p-2.5 text-right font-mono text-slate-700">{g.grossWt.toFixed(2)} g</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">{g.netWt.toFixed(2)} g</td>
                      <td className="p-2.5 text-right font-mono font-black text-amber-700 text-sm">{g.fineGold.toFixed(2)} g</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-900">₹{Math.round(approxVal).toLocaleString('en-IN')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
