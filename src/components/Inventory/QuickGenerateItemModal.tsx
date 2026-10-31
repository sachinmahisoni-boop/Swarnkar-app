import React, { useState } from 'react';
import { JewelleryItem, MetalType, MetalRate } from '../../types';
import { Sparkles, Wand2, Plus, ShieldCheck, Tag, X, Scale, RefreshCw } from 'lucide-react';

interface QuickGenerateItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  rates: MetalRate[];
  existingInventoryCount: number;
  onItemGenerated: (newItem: JewelleryItem) => void;
}

export const QuickGenerateItemModal: React.FC<QuickGenerateItemModalProps> = ({
  isOpen,
  onClose,
  categories,
  rates,
  existingInventoryCount,
  onItemGenerated,
}) => {
  const nextNum = existingInventoryCount + 9;
  const defaultTagNo = `SMJ-2026-${String(nextNum).padStart(3, '0')}`;
  const defaultHuid = `SMJ${Math.floor(100 + Math.random() * 899)}`;
  const defaultBarcode = `SMJ2026${String(nextNum).padStart(3, '0')}`;

  const [tagNo, setTagNo] = useState(defaultTagNo);
  const [huid, setHuid] = useState(defaultHuid);
  const [name, setName] = useState('');
  const [category, setCategory] = useState(categories[0] || 'Necklace');
  const [metal, setMetal] = useState<MetalType>('Gold');
  const [purity, setPurity] = useState('22K');
  const [grossWeight, setGrossWeight] = useState<number>(12.5);
  const [stoneWeight, setStoneWeight] = useState<number>(0);
  const [stoneValue, setStoneValue] = useState<number>(0);
  const [wastagePercentage, setWastagePercentage] = useState<number>(2.5);
  const [makingChargeType, setMakingChargeType] = useState<'per_gram' | 'flat'>('per_gram');
  const [makingChargeRate, setMakingChargeRate] = useState<number>(450);
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const netWeight = Math.max(0, grossWeight - stoneWeight);

  // Template Quick Picks
  const handleApplyTemplate = (templateName: string) => {
    const rndHuid = `SMJ${Math.floor(100 + Math.random() * 899)}`;
    setHuid(rndHuid);

    switch (templateName) {
      case 'gold_necklace_22k':
        setName('22K Hallmarked Antique Heritage Necklace');
        setCategory('Necklace');
        setMetal('Gold');
        setPurity('22K');
        setGrossWeight(38.50);
        setStoneWeight(2.10);
        setStoneValue(4500);
        setWastagePercentage(3.0);
        setMakingChargeType('per_gram');
        setMakingChargeRate(520);
        setQuantity(2);
        setDescription('22K 916 BIS Hallmarked bridal choker necklace.');
        break;

      case 'gold_ring_22k':
        setName('22K Classic Floral Men / Women Ring');
        setCategory('Rings');
        setMetal('Gold');
        setPurity('22K');
        setGrossWeight(4.85);
        setStoneWeight(0);
        setStoneValue(0);
        setWastagePercentage(2.0);
        setMakingChargeType('per_gram');
        setMakingChargeRate(420);
        setQuantity(4);
        setDescription('22K BIS 916 hallmarked solid daily wear ring.');
        break;

      case 'gold_chain_22k':
        setName('22K Solid Handcrafted Singapore Chain');
        setCategory('Chains');
        setMetal('Gold');
        setPurity('22K');
        setGrossWeight(16.40);
        setStoneWeight(0);
        setStoneValue(0);
        setWastagePercentage(2.0);
        setMakingChargeType('per_gram');
        setMakingChargeRate(380);
        setQuantity(3);
        setDescription('22K durable machine-finish unisex gold chain.');
        break;

      case 'silver_payal_925':
        setName('925 Sterling Heavy Traditional Bridal Payal');
        setCategory('Anklets (Payal)');
        setMetal('Silver');
        setPurity('925 Sterling');
        setGrossWeight(160.00);
        setStoneWeight(0);
        setStoneValue(0);
        setWastagePercentage(4.0);
        setMakingChargeType('per_gram');
        setMakingChargeRate(15);
        setQuantity(5);
        setDescription('Hallmarked 92.5 chandi payal with resonant ghungroo.');
        break;

      case 'gold_coin_24k':
        setName('24K (999.9) Pure Bullion Laxmi Ganesh Gold Coin 10g');
        setCategory('Coins & Bars');
        setMetal('Gold');
        setPurity('24K');
        setGrossWeight(10.00);
        setStoneWeight(0);
        setStoneValue(0);
        setWastagePercentage(0);
        setMakingChargeType('flat');
        setMakingChargeRate(650);
        setQuantity(10);
        setDescription('Tamper-proof certified Swiss-minted blister pack coin.');
        break;

      case 'diamond_ring_18k':
        setName('18K Solitaire Diamond Engagement Ring (0.75ct)');
        setCategory('Rings');
        setMetal('Gold');
        setPurity('18K');
        setGrossWeight(3.60);
        setStoneWeight(0.15);
        setStoneValue(55000);
        setWastagePercentage(0);
        setMakingChargeType('flat');
        setMakingChargeRate(4500);
        setQuantity(2);
        setDescription('IGI Certified natural diamond ring in 18K yellow band.');
        break;

      case 'gold_ring_9k':
        setName('9K Daily Wear Modern Studded Ring');
        setCategory('Rings');
        setMetal('Gold');
        setPurity('9K');
        setGrossWeight(3.20);
        setStoneWeight(0.20);
        setStoneValue(2800);
        setWastagePercentage(2.0);
        setMakingChargeType('flat');
        setMakingChargeRate(1100);
        setQuantity(6);
        setDescription('Affordable 9K hallmarked youth collection ring.');
        break;
    }
  };

  const handleRegenerateCodes = () => {
    const rnd = Math.floor(100 + Math.random() * 899);
    setTagNo(`SMJ-2026-${rnd}`);
    setHuid(`SMJ${rnd}`);
  };

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newItem: JewelleryItem = {
      id: `item-${Date.now()}`,
      tagNo,
      huid: huid.toUpperCase(),
      name: name.trim(),
      category,
      metal,
      purity,
      grossWeight: Number(grossWeight),
      netWeight: Number(netWeight.toFixed(2)),
      stoneWeight: Number(stoneWeight),
      stoneValue: Number(stoneValue),
      wastagePercentage: Number(wastagePercentage),
      makingChargeType,
      makingChargeRate: Number(makingChargeRate),
      hsnCode: metal === 'Silver' ? '7106' : '7113',
      quantity: Number(quantity) || 1,
      minStockAlert: 2,
      barcode: tagNo.replace(/[^a-zA-Z0-9]/g, ''),
      description: description.trim()
    };

    onItemGenerated(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 space-y-4 my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 rounded-xl font-bold">
              <Wand2 className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Quick Generate New Jewellery Item (ऑटो जनरेटर)
              </h3>
              <p className="text-xs text-slate-400">
                Auto-generates sequential SKU, 6-digit HUID, Barcode, and net weights instantly.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1-Click Templates Bar */}
        <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 space-y-1.5">
          <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> 1-Click Fast Templates (त्वरित टेम्प्लेट):
          </span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleApplyTemplate('gold_necklace_22k')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded-lg border border-slate-700 transition"
            >
              22K Necklace (38g)
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('gold_ring_22k')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded-lg border border-slate-700 transition"
            >
              22K Ring (4.8g)
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('gold_chain_22k')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded-lg border border-slate-700 transition"
            >
              22K Chain (16.4g)
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('silver_payal_925')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded-lg border border-slate-700 transition"
            >
              925 Silver Payal (160g)
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('gold_coin_24k')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded-lg border border-slate-700 transition"
            >
              24K Gold Coin (10g)
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('diamond_ring_18k')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded-lg border border-slate-700 transition"
            >
              18K Solitaire Ring
            </button>
            <button
              type="button"
              onClick={() => handleApplyTemplate('gold_ring_9k')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 rounded-lg border border-slate-700 transition"
            >
              9K Gold Ring (3.2g)
            </button>
          </div>
        </div>

        {/* Generator Form */}
        <form onSubmit={handleGenerateSubmit} className="space-y-4 text-xs">
          
          {/* Row 1: SKU, HUID & Regenerate */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4">
              <label className="block text-slate-400 mb-1 font-medium">Tag SKU # (Auto)</label>
              <input
                type="text"
                value={tagNo}
                onChange={(e) => setTagNo(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
                required
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-slate-400 mb-1 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 6-Digit HUID Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={huid}
                onChange={(e) => setHuid(e.target.value.toUpperCase())}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold uppercase"
                required
              />
            </div>
            <div className="sm:col-span-4 flex items-end">
              <button
                type="button"
                onClick={handleRegenerateCodes}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-roll Codes
              </button>
            </div>
          </div>

          {/* Row 2: Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-slate-400 mb-1 font-medium">Item Name / Title *</label>
              <input
                type="text"
                placeholder="e.g. 22K Hallmarked Peacock Antique Choker"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div className="sm:col-span-5">
              <label className="block text-slate-400 mb-1 font-medium">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Metal & Purity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Metal Type</label>
              <select
                value={metal}
                onChange={(e) => {
                  const m = e.target.value as MetalType;
                  setMetal(m);
                  setPurity(m === 'Silver' ? '925 Sterling' : m === 'Platinum' ? '950 Platinum' : '22K');
                }}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="Gold">Gold (सोना)</option>
                <option value="Silver">Silver (चांदी)</option>
                <option value="Platinum">Platinum (प्लैटिनम)</option>
                <option value="Diamond">Diamond (हीरा)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Purity</label>
              <select
                value={purity}
                onChange={(e) => setPurity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="24K">24K Pure Gold (999)</option>
                <option value="22K">22K Standard (916 BIS)</option>
                <option value="18K">18K Diamond Band (750)</option>
                <option value="14K">14K Light (585)</option>
                <option value="9K">9K Modern (375)</option>
                <option value="999 Fine">Silver 999 Fine</option>
                <option value="925 Sterling">Silver 925 Sterling</option>
              </select>
            </div>
          </div>

          {/* Row 4: Weights */}
          <div className="grid grid-cols-3 gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Gross Weight (g) *</label>
              <input
                type="number"
                step="0.01"
                value={grossWeight}
                onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Stone Weight (g)</label>
              <input
                type="number"
                step="0.01"
                value={stoneWeight}
                onChange={(e) => setStoneWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Net Metal Wt (g)</label>
              <div className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono font-black text-amber-300">
                {netWeight.toFixed(2)} g
              </div>
            </div>
          </div>

          {/* Row 5: Making & Qty */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Making Mode</label>
              <select
                value={makingChargeType}
                onChange={(e) => setMakingChargeType(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="per_gram">₹ Per Gram</option>
                <option value="flat">Flat ₹ Fixed</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Making Rate (₹)</label>
              <input
                type="number"
                value={makingChargeRate}
                onChange={(e) => setMakingChargeRate(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Pieces to Add *</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold"
                required
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Generate & Add to Stock Inventory
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
