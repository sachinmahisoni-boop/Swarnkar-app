import React, { useState, useEffect } from 'react';
import { JewelleryItem, MetalType, ItemCategory } from '../../types';
import { X, Save, Coins, Scale, Sparkles, ShieldCheck, Tag, Gem, Edit3, Check, Plus, Trash2 } from 'lucide-react';

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

  // Dynamic Purity List state stored in localStorage
  const [customPurities, setCustomPurities] = useState<string[]>(() => {
    const saved = localStorage.getItem('swarnka_custom_purities');
    return saved ? JSON.parse(saved) : ['24K', '22K', '20K', '18K', '14K', '9K', '99.9 Fine Silver', '92.5 Sterling Silver', '84.0% Chandi Payal', '80.0% Solid Silver', '70.0% Bichhiya Touch'];
  });

  const [showPurityListModal, setShowPurityListModal] = useState(false);
  const [newPurityInput, setNewPurityInput] = useState('');
  const [editingPurityIdx, setEditingPurityIdx] = useState<number | null>(null);
  const [editedPurityVal, setEditedPurityVal] = useState('');

  // Wholesaler Silver Mode: Fine Metal + Labour separated
  const [isWholesaleSilverMode, setIsWholesaleSilverMode] = useState(false);
  const [silverLabourPerGram, setSilverLabourPerGram] = useState<number>(18);
  const [fineSilverRate, setFineSilverRate] = useState<number>(190.3);

  useEffect(() => {
    localStorage.setItem('swarnka_custom_purities', JSON.stringify(customPurities));
  }, [customPurities]);

  useEffect(() => {
    if (initialItem) {
      setFormData(initialItem);
      const isSilver = initialItem.metal === 'Silver';
      setIsWholesaleSilverMode(isSilver && (initialItem.description || '').includes('Wholesale Silver'));
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
      setIsWholesaleSilverMode(false);
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

  // Add new purity to list
  const handleAddPurityToList = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newPurityInput.trim();
    if (!trimmed) return;
    if (customPurities.includes(trimmed)) {
      alert('यह शुद्धता सूची में पहले से मौजूद है।');
      return;
    }
    const updated = [...customPurities, trimmed];
    setCustomPurities(updated);
    setNewPurityInput('');
    setFormData(prev => ({ ...prev, purity: trimmed }));
  };

  const handleDeletePurityFromList = (purityStr: string) => {
    if (customPurities.length <= 1) return;
    const updated = customPurities.filter(p => p !== purityStr);
    setCustomPurities(updated);
    if (formData.purity === purityStr) {
      setFormData(prev => ({ ...prev, purity: updated[0] }));
    }
  };

  const handleSaveRenamedPurity = (idx: number) => {
    const trimmed = editedPurityVal.trim();
    if (!trimmed) return;
    const oldVal = customPurities[idx];
    const updated = [...customPurities];
    updated[idx] = trimmed;
    setCustomPurities(updated);
    if (formData.purity === oldVal) {
      setFormData(prev => ({ ...prev, purity: trimmed }));
    }
    setEditingPurityIdx(null);
  };

  // Wholesale Silver Calculations
  const netWt = formData.netWeight || 0;
  let derivedTouch = 91.6;
  const purityStr = (formData.purity || '').toLowerCase();
  if (purityStr.includes('99')) derivedTouch = 99.9;
  else if (purityStr.includes('92')) derivedTouch = 92.5;
  else if (purityStr.includes('84')) derivedTouch = 84.0;
  else if (purityStr.includes('80')) derivedTouch = 80.0;
  else if (purityStr.includes('70')) derivedTouch = 70.0;
  else if (purityStr.includes('60')) derivedTouch = 60.0;
  else if (purityStr.includes('50')) derivedTouch = 50.0;
  else if (purityStr.includes('24')) derivedTouch = 99.9;
  else if (purityStr.includes('22')) derivedTouch = 91.6;
  else if (purityStr.includes('18')) derivedTouch = 75.0;
  else if (purityStr.includes('14')) derivedTouch = 58.5;

  const fineSilverWeight = Number((netWt * (derivedTouch / 100)).toFixed(2));
  const fineSilverCost = Math.round(fineSilverWeight * fineSilverRate);
  const silverLabourTotal = Math.round(netWt * silverLabourPerGram);
  const totalWholesaleSilverCost = fineSilverCost + silverLabourTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.tagNo) return;

    let desc = formData.description || '';
    if (isWholesaleSilverMode) {
      desc = `Wholesale Silver: Touch ${derivedTouch}%, Fine Wt ${fineSilverWeight}g (₹${fineSilverCost}), Labour @ ₹${silverLabourPerGram}/g (₹${silverLabourTotal}). ${desc}`.trim();
    }

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
      makingChargeRate: isWholesaleSilverMode ? silverLabourPerGram : (Number(formData.makingChargeRate) || 0),
      hsnCode: formData.metal === 'Silver' ? '7106' : '7113',
      quantity: Number(formData.quantity) || 1,
      minStockAlert: Number(formData.minStockAlert) || 2,
      barcode: formData.barcode || formData.tagNo || 'BARCODE',
      description: desc
    };

    onSaveItem(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-stone-900 my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center space-x-2.5">
            <span className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl border border-amber-200">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-stone-900">
                {initialItem ? 'Edit Jewellery Item' : 'Add New Jewellery Stock Piece'}
              </h2>
              <p className="text-xs text-stone-500">
                Swarnka Jewellery ERP • Dynamic Purity Master & Wholesale Silver Calculator
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          
          {/* Row 1: Tag SKU, HUID & Item Name */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <label className="block text-stone-600 mb-1 font-bold">Tag No / SKU *</label>
              <input
                type="text"
                required
                value={formData.tagNo}
                onChange={e => setFormData({ ...formData, tagNo: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-stone-600 mb-1 font-bold">BIS HUID (6-Digit)</label>
              <input
                type="text"
                maxLength={6}
                placeholder="e.g. AB1234"
                value={formData.huid}
                onChange={e => setFormData({ ...formData, huid: e.target.value.toUpperCase() })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-emerald-800 font-mono font-bold uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="sm:col-span-6">
              <label className="block text-stone-600 mb-1 font-bold">Jewellery Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Traditional Antique Bridal Choker Necklace या Silver Payal"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Row 2: Category, Metal & Dynamic Purity Selector with Edit List button */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as ItemCategory })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
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
                    <option value="Mangalsutra">Mangalsutra (मंगलसूत्र)</option>
                    <option value="Anklets (Payal)">Anklets / Payal (पायल)</option>
                    <option value="Bichhiya">Bichhiya (बिछिया)</option>
                    <option value="Coins & Bars">Coins & Bars (सिक्के / सिल्ली)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-stone-600 mb-1 font-bold">Metal Type *</label>
              <select
                value={formData.metal}
                onChange={e => {
                  const m = e.target.value as MetalType;
                  setFormData({
                    ...formData,
                    metal: m,
                    purity: m === 'Silver' ? '84.0% Chandi Payal' : m === 'Platinum' ? '950 Platinum' : '22K'
                  });
                  if (m === 'Silver') setIsWholesaleSilverMode(true);
                }}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
              >
                <option value="Gold">Gold (सोना)</option>
                <option value="Silver">Silver (चांदी)</option>
                <option value="Platinum">Platinum (प्लैटिनम)</option>
                <option value="Diamond">Diamond / Gemstone</option>
              </select>
            </div>

            {/* EDITABLE PURITY LIST SECTION */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-stone-600 font-bold">Purity / Fineness (शुद्धता) *</label>
                <button
                  type="button"
                  onClick={() => setShowPurityListModal(true)}
                  className="text-[10px] text-amber-700 hover:underline font-extrabold flex items-center gap-0.5 cursor-pointer bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200"
                  title="Add, rename, or delete purity standards"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit Purity List</span>
                </button>
              </div>

              <select
                value={formData.purity}
                onChange={e => setFormData({ ...formData, purity: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-black focus:outline-none focus:border-amber-500 shadow-2xs"
              >
                {customPurities.map((pur, i) => (
                  <option key={i} value={pur}>{pur}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Weight Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-stone-50 p-3 rounded-2xl border border-stone-200">
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Gross Weight (grams) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.grossWeight}
                onChange={e => handleGrossChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-600 mb-1 font-bold">Stone / Diamond Wt (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.stoneWeight}
                onChange={e => handleStoneWeightChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-600 mb-1 font-bold">Net Metal Weight (g) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.netWeight}
                onChange={e => setFormData({ ...formData, netWeight: parseFloat(e.target.value) || 0 })}
                className="w-full bg-amber-50 border border-amber-300 rounded-xl px-3 py-2 text-amber-900 font-mono font-black text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* SPECIAL: WHOLESALER SILVER MODE (फाइन का पैसा अलग + लेबर अलग) */}
          {formData.metal === 'Silver' && (
            <div className="p-3.5 bg-gradient-to-r from-slate-50 to-amber-50 border-2 border-dashed border-amber-300 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isWholesaleSilverMode}
                    onChange={e => setIsWholesaleSilverMode(e.target.checked)}
                    className="w-4 h-4 accent-amber-600 rounded"
                  />
                  <span className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-700" />
                    Wholesale Silver Calculation (चांदी थोक: फाइन का पैसा अलग + लेबर अलग)
                  </span>
                </label>
                <span className="text-[10px] bg-amber-200 text-amber-950 font-black px-2 py-0.5 rounded">
                  Touch: {derivedTouch}%
                </span>
              </div>

              {isWholesaleSilverMode && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-amber-200 text-xs">
                  <div>
                    <span className="text-stone-500 text-[10px] block font-bold">1. Fine Silver Weight</span>
                    <span className="font-mono font-black text-amber-800 text-sm">{fineSilverWeight} g</span>
                    <span className="text-[10px] text-stone-500 block">({netWt}g × {derivedTouch}%)</span>
                  </div>

                  <div>
                    <span className="text-stone-500 text-[10px] block font-bold">2. Fine Silver Cost</span>
                    <span className="font-mono font-black text-slate-900 text-sm">₹{fineSilverCost.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-stone-500 block">(@ ₹{fineSilverRate}/g)</span>
                  </div>

                  <div>
                    <label className="text-stone-500 text-[10px] block font-bold">3. Labour Rate (मजदूरी)</label>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-stone-500 font-bold">₹</span>
                      <input
                        type="number"
                        value={silverLabourPerGram}
                        onChange={e => setSilverLabourPerGram(parseFloat(e.target.value) || 0)}
                        className="w-16 bg-white border border-stone-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold"
                      />
                      <span className="text-[10px] text-stone-500">/g</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                      = ₹{silverLabourTotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-amber-300">
                    <span className="text-stone-500 text-[10px] block font-bold">Total Wholesaler Cost</span>
                    <span className="font-mono font-black text-amber-900 text-base">
                      ₹{totalWholesaleSilverCost.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-stone-500 block">Fine + Labour Separated</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Row 4: Wastage & Making Charges */}
          {!isWholesaleSilverMode && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-stone-600 mb-1 font-bold">Wastage % (वेस्टेज / टंच)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.wastagePercentage}
                  onChange={e => setFormData({ ...formData, wastagePercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-bold">Making Charge Type</label>
                <select
                  value={formData.makingChargeType}
                  onChange={e => setFormData({ ...formData, makingChargeType: e.target.value as 'per_gram' | 'flat' })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="per_gram">Per Gram (₹ / ग्राम)</option>
                  <option value="flat">Flat Piece (एकमुश्त ₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-600 mb-1 font-bold">
                  {formData.makingChargeType === 'per_gram' ? 'Making Rate (₹ / g)' : 'Flat Making Rate (₹)'}
                </label>
                <input
                  type="number"
                  value={formData.makingChargeRate}
                  onChange={e => setFormData({ ...formData, makingChargeRate: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          )}

          {/* Row 5: Quantity & Alert */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Quantity in Stock (नग संख्या)</label>
              <input
                type="number"
                min="0"
                value={formData.quantity}
                onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-stone-600 mb-1 font-bold">Reorder Alert Level</label>
              <input
                type="number"
                min="1"
                value={formData.minStockAlert}
                onChange={e => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 1 })}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs rounded-xl flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{initialItem ? 'Save Changes' : 'Save to Stock Inventory'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* SUB-MODAL: EDIT PURITY LIST */}
      {showPurityListModal && (
        <div className="fixed inset-0 z-60 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-stone-300 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Edit Purity Standards List (शुद्धता सूची प्रबंधित करें)</span>
              </h3>
              <button onClick={() => setShowPurityListModal(false)} className="text-stone-400 hover:text-stone-700">
                ✕
              </button>
            </div>

            {/* Add new purity input */}
            <form onSubmit={handleAddPurityToList} className="flex gap-2">
              <input
                type="text"
                placeholder="उदा. 18K, 22K, 99.9, 92.5, 84%"
                value={newPurityInput}
                onChange={e => setNewPurityInput(e.target.value)}
                className="flex-1 bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold focus:outline-none focus:border-amber-500"
                required
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </form>

            {/* List of Purities */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {customPurities.map((pur, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200">
                  {editingPurityIdx === idx ? (
                    <div className="flex items-center gap-1.5 flex-1 mr-2">
                      <input
                        type="text"
                        value={editedPurityVal}
                        onChange={e => setEditedPurityVal(e.target.value)}
                        className="bg-white border border-amber-500 rounded px-2 py-1 text-xs font-bold text-stone-900 flex-1"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRenamedPurity(idx)}
                        className="px-2 py-1 bg-emerald-600 text-white font-bold rounded text-[11px]"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPurityIdx(null)}
                        className="px-2 py-1 bg-stone-300 text-stone-700 font-bold rounded text-[11px]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="font-extrabold text-stone-900 font-mono text-sm">{pur}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPurityIdx(idx);
                            setEditedPurityVal(pur);
                          }}
                          className="p-1 text-stone-500 hover:text-amber-700 transition"
                          title="Rename purity"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {customPurities.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeletePurityFromList(pur)}
                            className="p-1 text-stone-400 hover:text-rose-600 transition"
                            title="Delete purity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPurityListModal(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
