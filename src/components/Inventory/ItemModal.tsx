import React, { useState, useEffect } from 'react';
import { JewelleryItem, MetalType, ItemCategory } from '../../types';
import { X, Save, Coins, Scale, Sparkles, ShieldCheck, Tag, Gem } from 'lucide-react';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItem?: JewelleryItem | null;
  onSaveItem: (item: JewelleryItem) => void;
  categories?: string[];
}

export const ItemModal: React.FC<ItemModalProps> = ({
  isOpen,
  onClose,
  initialItem,
  onSaveItem,
  categories = [],
}) => {
  const [formData, setFormData] = useState<Partial<JewelleryItem>>({
    tagNo: `SMJ-2026-${Math.floor(100 + Math.random() * 900)}`,
    huid: 'SMJ916',
    name: '',
    category: 'Necklace',
    metal: 'Gold',
    purity: '22K',
    grossWeight: 10.0,
    netWeight: 10.0,
    stoneWeight: 0,
    stoneValue: 0,
    stoneType: '',
    stoneCarat: 0,
    labCertNo: '',
    wastagePercentage: 2.5,
    makingChargeType: 'per_gram',
    makingChargeRate: 450,
    hsnCode: '7113',
    quantity: 1,
    minStockAlert: 2,
    barcode: `SMJ2026${Math.floor(100 + Math.random() * 900)}`,
    description: ''
  });

  useEffect(() => {
    if (initialItem) {
      setFormData(initialItem);
    } else {
      const rnd = Math.floor(100 + Math.random() * 900);
      setFormData({
        tagNo: `SMJ-2026-${rnd}`,
        huid: 'SMJ' + Math.floor(100 + Math.random() * 899),
        name: '',
        category: 'Necklace',
        metal: 'Gold',
        purity: '22K',
        grossWeight: 10.0,
        netWeight: 10.0,
        stoneWeight: 0,
        stoneValue: 0,
        stoneType: '',
        stoneCarat: 0,
        labCertNo: '',
        wastagePercentage: 2.5,
        makingChargeType: 'per_gram',
        makingChargeRate: 450,
        hsnCode: '7113',
        quantity: 1,
        minStockAlert: 2,
        barcode: `SMJ2026${rnd}`,
        description: ''
      });
    }
  }, [initialItem, isOpen]);

  if (!isOpen) return null;

  // Auto-recalculate Net Weight when Gross or Stone Weight changes
  const handleGrossChange = (val: number) => {
    const gross = val;
    const stone = formData.stoneWeight || 0;
    setFormData(prev => ({
      ...prev,
      grossWeight: gross,
      netWeight: Math.max(0, parseFloat((gross - stone).toFixed(2)))
    }));
  };

  const handleStoneWeightChange = (val: number) => {
    const stone = val;
    const gross = formData.grossWeight || 0;
    setFormData(prev => ({
      ...prev,
      stoneWeight: stone,
      netWeight: Math.max(0, parseFloat((gross - stone).toFixed(2)))
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.tagNo) return;

    const savedItem: JewelleryItem = {
      id: initialItem ? initialItem.id : `item-${Date.now()}`,
      tagNo: formData.tagNo || `SMJ-${Date.now()}`,
      huid: formData.huid?.toUpperCase(),
      name: formData.name || 'Untitled Jewellery',
      category: (formData.category as ItemCategory) || 'Necklace',
      metal: (formData.metal as MetalType) || 'Gold',
      purity: formData.purity || '22K',
      grossWeight: Number(formData.grossWeight) || 0,
      netWeight: Number(formData.netWeight) || 0,
      stoneWeight: Number(formData.stoneWeight) || 0,
      stoneValue: Number(formData.stoneValue) || 0,
      stoneType: formData.stoneType,
      stoneCarat: Number(formData.stoneCarat) || 0,
      labCertNo: formData.labCertNo,
      wastagePercentage: Number(formData.wastagePercentage) || 0,
      makingChargeType: formData.makingChargeType || 'per_gram',
      makingChargeRate: Number(formData.makingChargeRate) || 0,
      hsnCode: formData.hsnCode || '7113',
      quantity: Number(formData.quantity) || 1,
      minStockAlert: Number(formData.minStockAlert) || 2,
      barcode: formData.barcode || formData.tagNo || 'BARCODE',
      description: formData.description || ''
    };

    onSaveItem(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {initialItem ? 'Edit Jewellery Piece' : 'Add New Jewellery Stock Piece'}
              </h2>
              <p className="text-xs text-slate-400">
                Track metal purity, 6-digit HUID, weight, making charges, and barcode
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          
          {/* Row 1: Tag SKU, HUID & Item Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-slate-400 mb-1 font-medium">Tag SKU # *</label>
              <input
                type="text"
                required
                value={formData.tagNo}
                onChange={e => setFormData({ ...formData, tagNo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                HUID (6-Digit)
              </label>
              <input
                type="text"
                maxLength={6}
                value={formData.huid || ''}
                onChange={e => setFormData({ ...formData, huid: e.target.value.toUpperCase() })}
                placeholder="SMJ916"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-slate-400 mb-1 font-medium">Jewellery Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Traditional Antique Bridal Choker Necklace"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Category, Metal & Purity */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ItemCategory })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {categories.length > 0 ? (
                  categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Necklace">Necklace (हार / चोकर)</option>
                    <option value="Rings">Rings (अंगूठी)</option>
                    <option value="Bangles">Bangles (कंगन / चूड़ी)</option>
                    <option value="Earrings">Earrings (झुमके / टॉप्स)</option>
                    <option value="Chains">Chains (चेन)</option>
                    <option value="Bracelets">Bracelets (ब्रेसलेट)</option>
                    <option value="Mangalsutra">Mangalsutra (मंगलसूत्र)</option>
                    <option value="Anklets (Payal)">Anklets / Payal (पायल)</option>
                    <option value="Coins & Bars">Coins & Bars (सिक्के / बिस्कुट)</option>
                    <option value="Loose Gemstone">Loose Gemstone (रत्न)</option>
                    <option value="Pendants">Pendants (लॉकेट)</option>
                    <option value="Nath / Nose Pin">Nath / Nose Pin (नथ)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Metal Type *</label>
              <select
                value={formData.metal}
                onChange={e => {
                  const m = e.target.value as MetalType;
                  setFormData({
                    ...formData,
                    metal: m,
                    purity: m === 'Silver' ? '925 Sterling' : m === 'Platinum' ? '950 Platinum' : '22K'
                  });
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="Gold">Gold (सोना)</option>
                <option value="Silver">Silver (चांदी)</option>
                <option value="Platinum">Platinum (प्लैटिनम)</option>
                <option value="Diamond">Diamond / Gemstone</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Purity *</label>
              <select
                value={formData.purity}
                onChange={e => setFormData({ ...formData, purity: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                <option value="24K">24K Pure Gold (999)</option>
                <option value="22K">22K Standard (916 BIS)</option>
                <option value="18K">18K Diamond Setting (750)</option>
                <option value="14K">14K Light (585)</option>
                <option value="9K">9K Modern Casual (375)</option>
                <option value="999 Fine">Silver 999 Fine</option>
                <option value="925 Sterling">Silver 925 Sterling</option>
                <option value="Natural Gemstone">Natural Astrological Stone</option>
              </select>
            </div>
          </div>

          {/* Row 3: Weight Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Gross Weight (grams) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.grossWeight}
                onChange={e => handleGrossChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Stone / Diamond Wt (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.stoneWeight}
                onChange={e => handleStoneWeightChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Net Metal Weight (g) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.netWeight}
                onChange={e => setFormData({ ...formData, netWeight: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 4: Loose Gemstones / Diamonds Details */}
          <div className="bg-slate-800/30 p-3 rounded-xl border border-slate-800/80 space-y-2">
            <span className="font-bold text-amber-300 text-xs flex items-center gap-1">
              <Gem className="w-3.5 h-3.5" /> Gemstones / Diamonds Information
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">Stone Type</label>
                <input
                  type="text"
                  placeholder="e.g. Diamond VVS-EF, Emerald"
                  value={formData.stoneType || ''}
                  onChange={e => setFormData({ ...formData, stoneType: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">Carat / Ratti</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.stoneCarat || ''}
                  onChange={e => setFormData({ ...formData, stoneCarat: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">Stone Valuation (₹)</label>
                <input
                  type="number"
                  value={formData.stoneValue || ''}
                  onChange={e => setFormData({ ...formData, stoneValue: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-amber-300 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Wastage, Making & Stock Alert */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Touch / Wastage (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.wastagePercentage}
                onChange={e => setFormData({ ...formData, wastagePercentage: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Making Charge Mode</label>
              <select
                value={formData.makingChargeType}
                onChange={e => setFormData({ ...formData, makingChargeType: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-slate-100"
              >
                <option value="per_gram">₹ Per Gram</option>
                <option value="flat">Fixed Flat ₹</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Making Rate (₹)</label>
              <input
                type="number"
                value={formData.makingChargeRate}
                onChange={e => setFormData({ ...formData, makingChargeRate: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-medium">Stock Qty (Pieces) *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialItem ? 'Save Changes' : 'Add to Inventory'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
