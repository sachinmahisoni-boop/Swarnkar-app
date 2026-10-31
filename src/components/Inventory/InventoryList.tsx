import React, { useState } from 'react';
import { JewelleryItem, MetalRate, MetalType } from '../../types';
import { Plus, Search, Filter, AlertTriangle, Coins, Edit3, Trash2, Package, Sparkles, Scale, ShieldCheck, Tag, Barcode, Wand2, Layers } from 'lucide-react';

interface InventoryListProps {
  inventory: JewelleryItem[];
  rates: MetalRate[];
  categories: string[];
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
  onAddItem,
  onEditItem,
  onDeleteItem,
  onUpdateQty,
  onSelectForBarcode,
  onOpenCategoryModal,
  onOpenQuickGenerate,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMetal, setSelectedMetal] = useState<string>('All');
  const [selectedPurity, setSelectedPurity] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'All' | 'Low' | 'Out'>('All');

  const getRateForPurity = (metal: string, purity: string) => {
    const rateObj = rates.find(r => r.metal === metal && r.purity === purity);
    return rateObj ? rateObj.ratePerGram : 0;
  };

  // Filtered inventory
  const filteredItems = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tagNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.huid && item.huid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.purity.toLowerCase().includes(searchTerm.toLowerCase());

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

  inventory.forEach(item => {
    const rate = getRateForPurity(item.metal, item.purity);
    const itemValuation = ((item.netWeight * rate) + item.stoneValue) * item.quantity;
    totalValuationINR += itemValuation;

    if (item.metal === 'Gold') {
      totalGoldWeightGrams += item.netWeight * item.quantity;
    } else if (item.metal === 'Silver') {
      totalSilverWeightGrams += item.netWeight * item.quantity;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Top Valuation Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Inventory Value */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Total Stock Valuation</span>
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-amber-300 font-mono">
            ₹{Math.round(totalValuationINR).toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500">Based on today's Bhopal bullion rates</span>
        </div>

        {/* Total Gold Weight Stock */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Total Gold Stock (Net Wt)</span>
            <Scale className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-400 font-mono">
            {totalGoldWeightGrams.toFixed(2)} g
          </p>
          <span className="text-[10px] text-slate-500">({(totalGoldWeightGrams / 10).toFixed(2)} Tolas)</span>
        </div>

        {/* Total Silver Weight Stock */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Total Silver Stock (Net Wt)</span>
            <Scale className="w-4 h-4 text-slate-300" />
          </div>
          <p className="text-xl font-black text-slate-200 font-mono">
            {totalSilverWeightGrams.toFixed(2)} g
          </p>
          <span className="text-[10px] text-slate-500">({(totalSilverWeightGrams / 1000).toFixed(2)} Kg)</span>
        </div>

        {/* Low Stock Alerts Count */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Low Stock Pieces</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl font-black text-rose-400 font-mono">
            {inventory.filter(i => i.quantity <= i.minStockAlert).length} Items
          </p>
          <span className="text-[10px] text-slate-500">Reorder alerts triggered</span>
        </div>

      </div>

      {/* Inventory Filters & Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
        
        {/* Top actions line */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search SKU, HUID, or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Manage Categories Button */}
            <button
              onClick={onOpenCategoryModal}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Add or Manage Custom Jewellery Categories"
            >
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Categories ({categories.length})</span>
            </button>

            {/* Quick Auto Generate Item Button */}
            <button
              onClick={onOpenQuickGenerate}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
              title="1-Click Auto Generate Item with SKU & HUID"
            >
              <Wand2 className="w-4 h-4" />
              <span>Auto Generate Item</span>
            </button>

            {/* Add Custom Item Button */}
            <button
              onClick={onAddItem}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Manual Add</span>
            </button>
          </div>
        </div>

        {/* Dropdown Filters Line */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
          
          {/* Metal Filter */}
          <select
            value={selectedMetal}
            onChange={e => setSelectedMetal(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="All">All Metals</option>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
            <option value="Platinum">Platinum</option>
            <option value="Diamond">Diamond</option>
          </select>

          {/* Purity Filter */}
          <select
            value={selectedPurity}
            onChange={e => setSelectedPurity(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="All">All Purities</option>
            <option value="24K">24K Pure</option>
            <option value="22K">22K 916</option>
            <option value="18K">18K 750</option>
            <option value="14K">14K 585</option>
            <option value="9K">9K 375</option>
            <option value="999 Fine">Silver 999</option>
            <option value="925 Sterling">Silver 925</option>
          </select>

          {/* Dynamic Categories Dropdown */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
          >
            <option value="All">All Categories ({categories.length})</option>
            {categories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock Level Pills */}
          <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setStockFilter('All')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                stockFilter === 'All' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockFilter('Low')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                stockFilter === 'Low' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockFilter('Out')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                stockFilter === 'Out' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Out of Stock
            </button>
          </div>

        </div>

      </div>

      {/* Stock Inventory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                <th className="p-3">Tag & HUID</th>
                <th className="p-3">Jewellery Name & Category</th>
                <th className="p-3">Metal / Purity</th>
                <th className="p-3 text-right">Gross Wt</th>
                <th className="p-3 text-right">Net Wt</th>
                <th className="p-3 text-right">Touch / Wastage</th>
                <th className="p-3 text-center">In Stock Qty</th>
                <th className="p-3 text-right">Est. Unit Val</th>
                <th className="p-3 text-center">Tag & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No jewellery items found matching search filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const rate = getRateForPurity(item.metal, item.purity);
                  const unitVal = (item.netWeight * rate) + item.stoneValue;
                  const isLowStock = item.quantity <= item.minStockAlert;

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/50 transition">
                      
                      {/* Tag SKU & HUID */}
                      <td className="p-3">
                        <span className="font-mono bg-slate-800 text-amber-300 px-2 py-0.5 rounded text-[11px] border border-slate-700 block w-max">
                          {item.tagNo}
                        </span>
                        {item.huid && (
                          <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-0.5 mt-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-500" /> {item.huid}
                          </span>
                        )}
                      </td>

                      {/* Name & Category */}
                      <td className="p-3">
                        <p className="font-bold text-slate-100 text-sm line-clamp-1">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                          {item.stoneType && (
                            <span className="text-[10px] text-amber-400">
                              {item.stoneType} ({item.stoneCarat}ct)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Metal & Purity */}
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded font-bold text-[11px] ${
                          item.metal === 'Gold' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          item.metal === 'Silver' ? 'bg-slate-200/20 text-slate-200 border border-slate-400/30' :
                          'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}>
                          {item.purity} {item.metal}
                        </span>
                      </td>

                      {/* Gross Weight */}
                      <td className="p-3 text-right font-mono text-slate-300">
                        {item.grossWeight.toFixed(2)} g
                      </td>

                      {/* Net Weight */}
                      <td className="p-3 text-right font-mono font-bold text-amber-300">
                        {item.netWeight.toFixed(2)} g
                      </td>

                      {/* Wastage */}
                      <td className="p-3 text-right font-mono text-slate-300">
                        {item.wastagePercentage}%
                      </td>

                      {/* Stock Quantity Controls */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onUpdateQty(item.id, Math.max(0, item.quantity - 1))}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center border border-slate-700"
                          >
                            -
                          </button>
                          <span className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                            item.quantity === 0 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                            isLowStock ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            'text-slate-100'
                          }`}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQty(item.id, item.quantity + 1)}
                            className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold flex items-center justify-center border border-slate-700"
                          >
                            +
                          </button>
                        </div>
                      </td>

                      {/* Estimated Value */}
                      <td className="p-3 text-right font-mono font-extrabold text-amber-400">
                        ₹{Math.round(unitVal).toLocaleString('en-IN')}
                      </td>

                      {/* Actions & Barcode Tag */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {onSelectForBarcode && (
                            <button
                              onClick={() => onSelectForBarcode(item)}
                              className="p-1.5 bg-slate-800 hover:bg-amber-500/20 text-amber-300 border border-slate-700 rounded-lg transition"
                              title="Generate Barcode / Print Thermal Tag"
                            >
                              <Barcode className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                            title="Edit Item"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete Item"
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

    </div>
  );
};
