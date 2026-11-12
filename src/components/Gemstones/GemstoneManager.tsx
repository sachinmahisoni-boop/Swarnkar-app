import React, { useState } from 'react';
import { 
  CertifiedGemstone, 
  GemstoneRate, 
  JewelleryItem, 
  GSTInvoice, 
  Customer,
  InvoiceItem
} from '../../types';
import { getISTDate } from '../../lib/invoiceNumber';
import { 
  Sparkles, 
  Gem, 
  Plus, 
  Search, 
  Filter, 
  Calculator, 
  Tag, 
  FileCheck2, 
  CheckCircle2, 
  ExternalLink, 
  Printer, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  ShoppingBag, 
  Scale, 
  Info, 
  TrendingUp,
  Award,
  Layers,
  X,
  Save,
  Check
} from 'lucide-react';

interface GemstoneManagerProps {
  gemstones: CertifiedGemstone[];
  gemstoneRates: GemstoneRate[];
  onAddGemstone: (newGem: CertifiedGemstone) => void;
  onUpdateGemstone: (updatedGem: CertifiedGemstone) => void;
  onDeleteGemstone: (id: string) => void;
  onUpdateGemstoneRates: (updatedRates: GemstoneRate[]) => void;
  onSellInPOS: (gemItem: JewelleryItem) => void;
  onPrintTag: (gemItem: JewelleryItem) => void;
}

// Navratna 9 Sacred Planetary Reference Data
const navratnaGuide = [
  {
    gem: 'Yellow Sapphire',
    hindi: 'पुखराज (बृहस्पति / गुरु)',
    planet: 'Jupiter (गुरु)',
    color: 'Canary Golden Yellow',
    finger: 'Index Finger (तर्जनी)',
    metal: '22K/18K Gold or Panchdhatu',
    day: 'Thursday Morning (गुरुवार)',
    mantra: 'ॐ बृं बृहस्पतये नमः',
    benefits: 'Wisdom, Knowledge, Wealth & Happy Married Life'
  },
  {
    gem: 'Emerald',
    hindi: 'पन्ना (बुध)',
    planet: 'Mercury (बुध)',
    color: 'Deep Lush Green',
    finger: 'Little Finger (कनिष्ठिका)',
    metal: 'Gold or Silver',
    day: 'Wednesday Morning (बुधवार)',
    mantra: 'ॐ बुं बुधाय नमः',
    benefits: 'Business acumen, sharp intellect, speech & commerce'
  },
  {
    gem: 'Ruby',
    hindi: 'माणिक्य (सूर्य)',
    planet: 'Sun (सूर्य)',
    color: 'Pigeon Blood Red',
    finger: 'Ring Finger (अनामिका)',
    metal: '22K Gold or Copper',
    day: 'Sunday Morning (रविवार)',
    mantra: 'ॐ घृणिः सूर्याय नमः',
    benefits: 'Leadership, administrative power, fame & vitality'
  },
  {
    gem: 'Blue Sapphire',
    hindi: 'नीलम (शनि)',
    planet: 'Saturn (शनि)',
    color: 'Cornflower / Royal Blue',
    finger: 'Middle Finger (मध्यमा)',
    metal: 'Silver, White Gold or Panchdhatu',
    day: 'Saturday Evening (शनिवार)',
    mantra: 'ॐ शं शनैश्चराय नमः',
    benefits: 'Instant fortune, career protection & deep focus'
  },
  {
    gem: 'Pearl',
    hindi: 'सच्चा मोती (चन्द्र)',
    planet: 'Moon (चन्द्र)',
    color: 'Lustrous Silvery White',
    finger: 'Little Finger (कनिष्ठिका)',
    metal: 'Pure 925 Silver',
    day: 'Monday Evening (सोमवार)',
    mantra: 'ॐ सों सोमाय नमः',
    benefits: 'Mental peace, emotional stability & memory power'
  },
  {
    gem: 'Red Coral',
    hindi: 'लाल मूँगा (मंगल)',
    planet: 'Mars (मंगल)',
    color: 'Deep Ox-Blood Red',
    finger: 'Ring Finger (अनामिका)',
    metal: 'Gold, Silver or Copper',
    day: 'Tuesday Morning (मंगलवार)',
    mantra: 'ॐ अं अंगारकाय नमः',
    benefits: 'Counters Manglik dosha, courage, energy & physical health'
  },
  {
    gem: 'Hessonite',
    hindi: 'गोमेद (राहु)',
    planet: 'Rahu (राहु)',
    color: 'Deep Honey / Cow-Urine',
    finger: 'Middle Finger (मध्यमा)',
    metal: 'Silver or Panchdhatu',
    day: 'Saturday Night (शनिवार)',
    mantra: 'ॐ रां राहवे नमः',
    benefits: 'Protects from sudden confusion, litigation & speculation wins'
  },
  {
    gem: 'Cats Eye',
    hindi: 'लहसुनिया (केतु)',
    planet: 'Ketu (केतु)',
    color: 'Greenish Yellow Chatoyant',
    finger: 'Middle or Ring Finger',
    metal: 'Silver or Panchdhatu',
    day: 'Tuesday / Thursday',
    mantra: 'ॐ कें केतवे नमः',
    benefits: 'Spiritual liberation, protection from hidden enemies'
  },
  {
    gem: 'Diamond',
    hindi: 'हीरा (शुक्र)',
    planet: 'Venus (शुक्र)',
    color: 'Sparkling Colorless',
    finger: 'Middle or Little Finger',
    metal: '18K White Gold or Platinum',
    day: 'Friday Morning (शुक्रवार)',
    mantra: 'ॐ शुं शुक्राय नमः',
    benefits: 'Luxury, creative arts, glamour, wealth & charisma'
  }
];

export const GemstoneManager: React.FC<GemstoneManagerProps> = ({
  gemstones,
  gemstoneRates,
  onAddGemstone,
  onUpdateGemstone,
  onDeleteGemstone,
  onUpdateGemstoneRates,
  onSellInPOS,
  onPrintTag
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGemType, setSelectedGemType] = useState<string>('All');
  const [selectedLab, setSelectedLab] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'In Stock' | 'Sold'>('In Stock');

  // Modals & Panels
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGem, setEditingGem] = useState<CertifiedGemstone | null>(null);
  const [showRateCardModal, setShowRateCardModal] = useState(false);
  const [activeGuideGem, setActiveGuideGem] = useState<string | null>(null);

  // Interactive Calculator State
  const [calcRatti, setCalcRatti] = useState<number>(5.25);
  const [calcCarat, setCalcCarat] = useState<number>(4.77);
  const [calcSelectedRateId, setCalcSelectedRateId] = useState<string>(gemstoneRates[0]?.id || '');
  const [calcPricingMode, setCalcPricingMode] = useState<'ratti' | 'carat'>('ratti');
  const [calcCustomRate, setCalcCustomRate] = useState<number>(gemstoneRates[0]?.ratePerRatti || 7500);
  const [calcMountingOption, setCalcMountingOption] = useState<'loose' | 'gold_ring' | 'silver_ring' | 'panchdhatu'>('loose');
  const [calcCertFee, setCalcCertFee] = useState<number>(450);

  // Filtered gemstones
  const filteredGems = gemstones.filter(g => {
    const matchesSearch = 
      g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.tagNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.labCertNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.gemType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedGemType === 'All' || g.gemType === selectedGemType;
    const matchesLab = selectedLab === 'All' || g.labName.includes(selectedLab);
    const matchesStatus = statusFilter === 'All' || g.stockStatus === statusFilter;

    return matchesSearch && matchesType && matchesLab && matchesStatus;
  });

  // Summary Metrics
  const inStockGems = gemstones.filter(g => g.stockStatus === 'In Stock');
  const totalStockValuation = inStockGems.reduce((sum, g) => sum + g.sellingPrice, 0);
  const totalCostValuation = inStockGems.reduce((sum, g) => sum + g.costPrice, 0);
  const totalRattiWeight = inStockGems.reduce((sum, g) => sum + g.ratti, 0);
  const totalCaratWeight = inStockGems.reduce((sum, g) => sum + g.carat, 0);
  const totalProfitPotential = totalStockValuation - totalCostValuation;

  // Sync Carat / Ratti in calculator
  const handleRattiChange = (val: number) => {
    const r = Math.max(0, val);
    setCalcRatti(r);
    setCalcCarat(parseFloat((r * 0.91).toFixed(2)));
  };

  const handleCaratChange = (val: number) => {
    const c = Math.max(0, val);
    setCalcCarat(c);
    setCalcRatti(parseFloat((c / 0.91).toFixed(2)));
  };

  const handleRateSelectionChange = (rateId: string) => {
    setCalcSelectedRateId(rateId);
    const selected = gemstoneRates.find(r => r.id === rateId);
    if (selected) {
      if (calcPricingMode === 'ratti') {
        setCalcCustomRate(selected.ratePerRatti);
      } else {
        setCalcCustomRate(selected.ratePerCarat);
      }
    }
  };

  // Calculator Pricing logic
  const gemBasePrice = calcPricingMode === 'ratti'
    ? Math.round(calcRatti * calcCustomRate)
    : Math.round(calcCarat * calcCustomRate);

  const mountingCharge = 
    calcMountingOption === 'gold_ring' ? 14500 : // 22K Gold ring setting
    calcMountingOption === 'silver_ring' ? 1200 : // 925 Sterling ring
    calcMountingOption === 'panchdhatu' ? 1800 : 0; // Panchdhatu astrological ring

  const calculatedTotal = gemBasePrice + mountingCharge + calcCertFee;

  // Convert Certified Gemstone to JewelleryItem format for POS Billing & Barcode
  const convertToJewelleryItem = (gem: CertifiedGemstone): JewelleryItem => {
    return {
      id: gem.id,
      tagNo: gem.tagNo,
      name: gem.name,
      category: 'Loose Gemstone',
      metal: 'Diamond', // standard gemstone tax category
      purity: 'Natural Astrological Stone',
      grossWeight: gem.gramWeight,
      netWeight: gem.gramWeight,
      stoneWeight: gem.gramWeight,
      stoneValue: gem.sellingPrice,
      stoneType: `${gem.name} (${gem.origin})`,
      stoneCarat: gem.carat,
      ratti: gem.ratti,
      gemOrigin: gem.origin,
      gemCut: gem.cutShape,
      gemColor: gem.color,
      gemTreatment: gem.treatment,
      gemLab: gem.labName,
      labCertNo: gem.labCertNo,
      wastagePercentage: 0,
      makingChargeType: 'flat',
      makingChargeRate: 0,
      costPrice: gem.costPrice,
      stoneCost: gem.costPrice,
      hsnCode: '7103', // HSN 7103 for precious and semi-precious gemstones
      quantity: 1,
      minStockAlert: 1,
      barcode: gem.tagNo.replace(/-/g, ''),
      description: `${gem.hindiName} - ${gem.origin}, ${gem.ratti} Ratti / ${gem.carat} Ct, Lab Report: ${gem.labCertNo}`
    };
  };

  // Direct Send from Calculator to POS
  const handleSendCalcToPOS = () => {
    const selectedRate = gemstoneRates.find(r => r.id === calcSelectedRateId);
    const gemName = selectedRate ? selectedRate.name : 'Astrological Gemstone';
    const rnd = Math.floor(100 + Math.random() * 900);
    
    const customItem: JewelleryItem = {
      id: `gem-calc-${Date.now()}`,
      tagNo: `SMJ-GEM-${rnd}`,
      name: `Certified ${gemName} (${calcRatti} Ratti / ${calcCarat} Ct)`,
      category: 'Loose Gemstone',
      metal: 'Diamond',
      purity: 'Natural Astrological Stone',
      grossWeight: parseFloat((calcCarat * 0.2).toFixed(3)),
      netWeight: parseFloat((calcCarat * 0.2).toFixed(3)),
      stoneWeight: parseFloat((calcCarat * 0.2).toFixed(3)),
      stoneValue: calculatedTotal,
      stoneType: gemName,
      stoneCarat: calcCarat,
      ratti: calcRatti,
      labCertNo: 'GTL-VERIFIED',
      wastagePercentage: 0,
      makingChargeType: 'flat',
      makingChargeRate: mountingCharge,
      costPrice: Math.round(gemBasePrice * 0.65 + mountingCharge * 0.6),
      hsnCode: '7103',
      quantity: 1,
      minStockAlert: 1,
      barcode: `GEM${rnd}`,
      description: `Astrological gem with setting: ${calcMountingOption}`
    };

    onSellInPOS(customItem);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Module Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-amber-200 tracking-wide font-serif">
                  रत्न व नवरत्न डेस्क (Gemstones & Navratna Hub)
                </h1>
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider">
                  Lab Certified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Authentic Certified Navratna, Astrological Ratti/Carat Valuation, GTL/IGI Lab Certificates & sarafa market rates.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setShowRateCardModal(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>रत्न दैनिक भाव (Rate Card)</span>
            </button>

            <button
              onClick={() => {
                setEditingGem(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Certified Gem (नया रत्न)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Loose Gemstone Valuation */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Gemstone Inventory Value</span>
            <Gem className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl font-black text-amber-300 font-mono">
            ₹{totalStockValuation.toLocaleString('en-IN')}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>{inStockGems.length} Certified Stones</span>
            <span className="text-emerald-400 font-bold">+₹{totalProfitPotential.toLocaleString('en-IN')} Margin</span>
          </div>
        </div>

        {/* Total Ratti Weight in Stock */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Total Weight (रत्ती)</span>
            <Scale className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-black text-cyan-300 font-mono">
            {totalRattiWeight.toFixed(2)} Ratti
          </p>
          <span className="text-[10px] text-slate-500">
            Equivalent to {totalCaratWeight.toFixed(2)} Carats
          </span>
        </div>

        {/* Total Carats & Grams */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Physical Gram Weight</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-black text-purple-300 font-mono">
            {(totalCaratWeight * 0.2).toFixed(2)} g
          </p>
          <span className="text-[10px] text-slate-500">
            {totalCaratWeight.toFixed(2)} Total Carats (1ct = 200mg)
          </span>
        </div>

        {/* 100% Lab Tested & Certified */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span>Certification Status</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-black text-emerald-300 font-mono">
            100% Verified
          </p>
          <span className="text-[10px] text-slate-500">
            Govt GTL, IGI, GIA & IGL Reports
          </span>
        </div>

      </div>

      {/* Interactive Section 1: Astrological Navratna Guide & Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-sm flex items-center gap-1.5">
              <Award className="w-4 h-4" /> नवरत्न व नवग्रह परिचय (9 Sacred Astrological Gemstones Guide)
            </span>
          </div>
          <span className="text-xs text-slate-400">Click any gemstone for wear guidelines & instant stock filter</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {navratnaGuide.map((item, idx) => {
            const isFilterActive = selectedGemType === item.gem;
            const isGuideActive = activeGuideGem === item.gem;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedGemType(selectedGemType === item.gem ? 'All' : item.gem);
                  setActiveGuideGem(item.gem);
                }}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  isFilterActive
                    ? 'bg-amber-500/20 border-amber-500 text-amber-200 shadow-md ring-1 ring-amber-500'
                    : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600 text-slate-300'
                }`}
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-400 block font-mono">
                    #{idx + 1} {item.planet.split(' ')[0]}
                  </span>
                  <p className="text-xs font-bold text-slate-100 truncate mt-0.5">
                    {item.gem}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {item.hindi.split(' ')[0]}
                  </p>
                </div>
                <div className="mt-2 text-[9px] text-slate-500 border-t border-slate-700/50 pt-1">
                  <span>{item.day.split(' ')[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Guide Detail Drawer */}
        {activeGuideGem && (() => {
          const guide = navratnaGuide.find(g => g.gem === activeGuideGem);
          if (!guide) return null;
          return (
            <div className="p-3.5 bg-slate-850 border border-amber-500/20 rounded-xl text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-slate-300">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-300 text-sm">{guide.gem} ({guide.hindi})</span>
                  <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">Ruling: {guide.planet}</span>
                </div>
                <p className="text-slate-400">
                  <strong className="text-slate-300">Auspicious Finger:</strong> {guide.finger} • <strong className="text-slate-300">Auspicious Day:</strong> {guide.day} • <strong className="text-slate-300">Recommended Metal:</strong> {guide.metal}
                </p>
                <p className="text-[11px] text-amber-400/90 font-mono">
                  Mantra: {guide.mantra} | Benefits: {guide.benefits}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const matchRate = gemstoneRates.find(r => r.gemType === guide.gem);
                    if (matchRate) {
                      setCalcSelectedRateId(matchRate.id);
                      setCalcCustomRate(matchRate.ratePerRatti);
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold transition"
                >
                  Load in Estimator ↓
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGuideGem(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Interactive Section 2: Real-time Ratti ⇄ Carat ⇄ Gram Price Estimator */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-amber-500/20 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100">
                रत्ती ⇄ कैरेट कैलकुलेटर व ग्राहक कोटेशन (Ratti ⇄ Carat Live Estimator)
              </h2>
              <p className="text-xs text-slate-400">
                Standard Sarafa scale: 1 Ratti = 0.91 Carat | 1 Carat = 200mg (0.20g)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Mode:</span>
            <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setCalcPricingMode('ratti');
                  const r = gemstoneRates.find(rate => rate.id === calcSelectedRateId);
                  if (r) setCalcCustomRate(r.ratePerRatti);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                  calcPricingMode === 'ratti'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ₹ / रत्ती (Per Ratti)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalcPricingMode('carat');
                  const r = gemstoneRates.find(rate => rate.id === calcSelectedRateId);
                  if (r) setCalcCustomRate(r.ratePerCarat);
                }}
                className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
                  calcPricingMode === 'carat'
                    ? 'bg-amber-500 text-slate-950 shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                ₹ / कैरेट (Per Carat)
              </button>
            </div>
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          
          {/* 1. Gem Selection */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300">Select Gemstone (रत्न)</label>
            <select
              value={calcSelectedRateId}
              onChange={e => handleRateSelectionChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            >
              {gemstoneRates.map(r => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.grade})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Weight in Ratti */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <label className="font-bold text-amber-300">Ratti Weight (रत्ती)</label>
              <span className="text-[10px] text-slate-400">Sarafa Standard</span>
            </div>
            <input
              type="number"
              step="0.05"
              min="0.1"
              value={calcRatti}
              onChange={e => handleRattiChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* 3. Weight in Carats */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <label className="font-bold text-cyan-300">Carat Weight (कैरेट)</label>
              <span className="text-[10px] text-slate-400">{(calcCarat * 0.2).toFixed(3)}g</span>
            </div>
            <input
              type="number"
              step="0.05"
              min="0.1"
              value={calcCarat}
              onChange={e => handleCaratChange(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-cyan-300 font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* 4. Rate per unit */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300">
              Rate ₹ ({calcPricingMode === 'ratti' ? 'per Ratti' : 'per Carat'})
            </label>
            <input
              type="number"
              step="50"
              value={calcCustomRate}
              onChange={e => setCalcCustomRate(parseFloat(e.target.value) || 0)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* 5. Ring / Pendant Setting Option */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-300">Ring/Pendant Setting</label>
            <select
              value={calcMountingOption}
              onChange={e => setCalcMountingOption(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
            >
              <option value="loose">Loose Stone Only (रत्न मात्र)</option>
              <option value="gold_ring">22K Gold Handcrafted Ring (+₹14,500)</option>
              <option value="silver_ring">925 Sterling Silver Ring (+₹1,200)</option>
              <option value="panchdhatu">Panchdhatu Astrological Ring (+₹1,800)</option>
            </select>
          </div>

        </div>

        {/* Calculation Result Bar with 1-Click Action */}
        <div className="p-3.5 bg-slate-800/80 rounded-xl border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Gem Base Price:</span>
              <strong className="text-slate-200">₹{gemBasePrice.toLocaleString('en-IN')}</strong>
            </div>
            {mountingCharge > 0 && (
              <div>
                <span className="text-slate-400 block text-[10px]">Mounting / Metal:</span>
                <strong className="text-amber-400">+₹{mountingCharge.toLocaleString('en-IN')}</strong>
              </div>
            )}
            <div>
              <span className="text-slate-400 block text-[10px]">Lab Certificate:</span>
              <strong className="text-emerald-400">+₹{calcCertFee.toLocaleString('en-IN')}</strong>
            </div>
            <div className="pl-2 border-l border-slate-700">
              <span className="text-amber-400 font-bold block text-[10px] uppercase">Total Estimate:</span>
              <strong className="text-base font-black text-amber-300">₹{calculatedTotal.toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendCalcToPOS}
              className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Bill in POS (F2 बिल में जोड़ें)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar for Certified Gemstones Inventory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search stone, tag, GTL cert no, or origin..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Gem Type Filter */}
          <select
            value={selectedGemType}
            onChange={e => setSelectedGemType(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Gemstones (सभी रत्न)</option>
            <option value="Yellow Sapphire">Pukhraj / Yellow Sapphire</option>
            <option value="Emerald">Panna / Emerald</option>
            <option value="Ruby">Manik / Ruby</option>
            <option value="Blue Sapphire">Neelam / Blue Sapphire</option>
            <option value="Pearl">Moti / Pearl</option>
            <option value="Coral">Moonga / Red Coral</option>
            <option value="Hessonite">Gomed / Hessonite</option>
            <option value="Cats Eye">Lehsunia / Cats Eye</option>
            <option value="Diamond">Solitaire Diamond</option>
            <option value="Opal">Opal / Australian</option>
          </select>

          {/* Lab Filter */}
          <select
            value={selectedLab}
            onChange={e => setSelectedLab(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Certifying Labs</option>
            <option value="GTL">GTL Jaipur (Govt)</option>
            <option value="IGI">IGI International</option>
            <option value="GIA">GIA</option>
            <option value="IGL">IGL Lab</option>
          </select>

          {/* Stock status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="In Stock">In Stock Only</option>
            <option value="All">All (Including Sold)</option>
            <option value="Sold">Sold Pieces</option>
          </select>
        </div>

      </div>

      {/* Gemstones Inventory Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGems.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
            <Gem className="w-10 h-10 mx-auto text-slate-600 mb-2 opacity-50" />
            <p className="text-sm font-bold text-slate-300">No gemstones found matching criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try resetting the filter or add a new certified gemstone piece.</p>
          </div>
        ) : (
          filteredGems.map(gem => {
            const jewelleryEquiv = convertToJewelleryItem(gem);
            const profit = gem.sellingPrice - gem.costPrice;
            const marginPct = ((profit / gem.sellingPrice) * 100).toFixed(1);

            return (
              <div 
                key={gem.id}
                className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between transition group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-amber-400">{gem.tagNo}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          gem.stockStatus === 'In Stock'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-700 text-slate-400'
                        }`}>
                          {gem.stockStatus}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-amber-200 transition mt-1 leading-snug">
                        {gem.name}
                      </h3>
                      <p className="text-xs text-amber-400/80 font-medium">{gem.hindiName}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Selling Price</span>
                      <span className="font-mono font-black text-amber-300 text-base">₹{gem.sellingPrice.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] text-emerald-400 font-mono block">+{marginPct}% Margin</span>
                    </div>
                  </div>

                  {/* Gemstone Specs Badges */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Weight:</span>
                      <strong className="text-amber-300 font-mono">{gem.ratti} Ratti</strong>
                      <span className="text-slate-400 font-mono text-[10px] block">({gem.carat} Ct / {gem.gramWeight}g)</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Origin:</span>
                      <strong className="text-slate-200 truncate block">{gem.origin}</strong>
                      <span className="text-slate-400 text-[10px] block truncate">{gem.treatment}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Cut & Shape:</span>
                      <strong className="text-slate-200 truncate block">{gem.cutShape}</strong>
                      <span className="text-slate-400 text-[10px] block">{gem.color}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Ruling Planet:</span>
                      <strong className="text-amber-400/90 truncate block">{gem.planet}</strong>
                      <span className="text-slate-400 text-[10px] block font-mono">₹{gem.ratePerRatti}/ratti</span>
                    </div>
                  </div>

                  {/* Lab Certificate Banner */}
                  <div className="mt-2.5 p-2 bg-gradient-to-r from-emerald-950/30 to-slate-800/80 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="font-bold text-emerald-300 text-[11px] block">{gem.labName} Certified</span>
                        <span className="text-[10px] font-mono text-slate-400">Report #{gem.labCertNo}</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      100% Genuine
                    </span>
                  </div>

                  {gem.description && (
                    <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 italic">
                      "{gem.description}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onPrintTag(jewelleryEquiv)}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg text-xs transition cursor-pointer"
                      title="Print Barcode & Certificate Tag"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGem(gem);
                        setShowAddModal(true);
                      }}
                      className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 rounded-lg text-xs transition cursor-pointer"
                      title="Edit Gemstone Details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteGemstone(gem.id)}
                      className="p-1.5 bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 rounded-lg text-xs transition cursor-pointer"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSellInPOS(jewelleryEquiv)}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Bill in POS (F2)</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Gemstone Live Rate Card Manager */}
      {showRateCardModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-3xl w-full p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-amber-200">रत्न व नवरत्न दैनिक बाजार भाव (Gemstone Rate Card)</h3>
                  <p className="text-xs text-slate-400">Live prevailing rates per Ratti and per Carat in Bhopal Sarafa</p>
                </div>
              </div>
              <button
                onClick={() => setShowRateCardModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-800 border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                      <th className="p-2.5">Gemstone (रत्न)</th>
                      <th className="p-2.5">Planet</th>
                      <th className="p-2.5">Grade</th>
                      <th className="p-2.5 text-right">Rate / Ratti (₹)</th>
                      <th className="p-2.5 text-right">Rate / Carat (₹)</th>
                      <th className="p-2.5">Last Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {gemstoneRates.map((r, idx) => (
                      <tr key={r.id} className="hover:bg-slate-850">
                        <td className="p-2.5 font-bold text-slate-100">
                          {r.name}
                          <span className="block text-[10px] text-amber-400/80 font-normal">{r.hindiName}</span>
                        </td>
                        <td className="p-2.5 text-slate-400">{r.planet}</td>
                        <td className="p-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            r.grade.includes('सर्वोत्तम')
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {r.grade}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-amber-300">
                          ₹{r.ratePerRatti.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-cyan-300">
                          ₹{r.ratePerCarat.toLocaleString('en-IN')}
                        </td>
                        <td className="p-2.5 text-[10px] text-slate-500">{r.lastUpdated}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowRateCardModal(false)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition"
              >
                Close Rate Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Add or Edit Certified Gemstone */}
      {showAddModal && (
        <GemstoneFormModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingGem(null);
          }}
          gemRates={gemstoneRates}
          initialGem={editingGem}
          onSave={(gem) => {
            if (editingGem) {
              onUpdateGemstone(gem);
            } else {
              onAddGemstone(gem);
            }
            setShowAddModal(false);
            setEditingGem(null);
          }}
        />
      )}

    </div>
  );
};

// Sub-modal for adding / editing a certified gemstone piece
interface GemstoneFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  gemRates: GemstoneRate[];
  initialGem?: CertifiedGemstone | null;
  onSave: (gem: CertifiedGemstone) => void;
}

const GemstoneFormModal: React.FC<GemstoneFormModalProps> = ({
  isOpen,
  onClose,
  gemRates,
  initialGem,
  onSave
}) => {
  const [formData, setFormData] = useState<Partial<CertifiedGemstone>>(() => {
    if (initialGem) return initialGem;
    const rnd = Math.floor(100 + Math.random() * 900);
    return {
      id: `gem-${Date.now()}`,
      tagNo: `SMJ-GEM-${rnd}`,
      name: 'Certified Natural Ceylon Pukhraj (Yellow Sapphire)',
      hindiName: 'सर्टिफाइड सीलोन पुखराज',
      gemType: 'Yellow Sapphire',
      planet: 'बृहस्पति (गुरु)',
      carat: 4.77,
      ratti: 5.25,
      gramWeight: 0.954,
      color: 'Vivid Canary Golden Yellow',
      cutShape: 'Oval Mixed Cut',
      clarity: 'Eye Clean (VVS1)',
      origin: 'Ratnapura, Sri Lanka (Ceylon)',
      treatment: 'Natural Unheated & Untreated (सर्वोत्तम)',
      labName: 'GTL Jaipur',
      labCertNo: `GTL-2026-${rnd}1`,
      ratePerRatti: 7500,
      ratePerCarat: 8250,
      sellingPrice: 39375,
      costPrice: 25500,
      stockStatus: 'In Stock',
      dateAdded: getISTDate().isoDateStr,
      description: 'Astrological quality unheated natural gemstone with Govt Gemological Lab certificate.'
    };
  });

  const handleRattiChange = (val: number) => {
    const r = val;
    const c = parseFloat((r * 0.91).toFixed(2));
    const g = parseFloat((c * 0.2).toFixed(3));
    const rate = formData.ratePerRatti || 7500;
    const sp = Math.round(r * rate);
    const cp = Math.round(sp * 0.65);
    setFormData(prev => ({
      ...prev,
      ratti: r,
      carat: c,
      gramWeight: g,
      sellingPrice: sp,
      costPrice: prev.costPrice || cp
    }));
  };

  const handleCaratChange = (val: number) => {
    const c = val;
    const r = parseFloat((c / 0.91).toFixed(2));
    const g = parseFloat((c * 0.2).toFixed(3));
    const rate = formData.ratePerCarat || 8250;
    const sp = Math.round(c * rate);
    const cp = Math.round(sp * 0.65);
    setFormData(prev => ({
      ...prev,
      carat: c,
      ratti: r,
      gramWeight: g,
      sellingPrice: sp,
      costPrice: prev.costPrice || cp
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.tagNo) return;

    const savedGem: CertifiedGemstone = {
      id: formData.id || `gem-${Date.now()}`,
      tagNo: formData.tagNo || `SMJ-GEM-${Math.floor(100 + Math.random() * 900)}`,
      name: formData.name || 'Certified Gemstone',
      hindiName: formData.hindiName || 'रत्न',
      gemType: formData.gemType || 'Yellow Sapphire',
      planet: formData.planet || 'गुरु',
      carat: Number(formData.carat) || 1,
      ratti: Number(formData.ratti) || 1.1,
      gramWeight: Number(formData.gramWeight) || 0.2,
      color: formData.color || 'Natural',
      cutShape: formData.cutShape || 'Oval Mixed Cut',
      clarity: formData.clarity || 'Eye Clean',
      origin: formData.origin || 'Ceylon',
      treatment: formData.treatment || 'Natural Untreated',
      labName: formData.labName || 'GTL Jaipur',
      labCertNo: formData.labCertNo || 'GTL-VERIFIED',
      ratePerRatti: Number(formData.ratePerRatti) || 5000,
      ratePerCarat: Number(formData.ratePerCarat) || 5500,
      sellingPrice: Number(formData.sellingPrice) || 10000,
      costPrice: Number(formData.costPrice) || 6500,
      stockStatus: formData.stockStatus || 'In Stock',
      dateAdded: formData.dateAdded || getISTDate().isoDateStr,
      description: formData.description || ''
    };

    onSave(savedGem);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 my-8">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-amber-200">
                {initialGem ? 'Edit Certified Gemstone' : 'Add New Certified Gemstone (नया रत्न)'}
              </h3>
              <p className="text-xs text-slate-400">Record certified stone with carat, ratti, lab report & valuation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
          
          {/* Row 1: Tag & Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Tag No *</label>
              <input
                type="text"
                required
                value={formData.tagNo}
                onChange={e => setFormData({ ...formData, tagNo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-400 mb-1 font-medium">Gemstone Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold"
              />
            </div>
          </div>

          {/* Row 2: Hindi name & Gem Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Hindi Name</label>
              <input
                type="text"
                value={formData.hindiName}
                onChange={e => setFormData({ ...formData, hindiName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Gem Type</label>
              <select
                value={formData.gemType}
                onChange={e => setFormData({ ...formData, gemType: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="Yellow Sapphire">Yellow Sapphire (पुखराज)</option>
                <option value="Emerald">Emerald (पन्ना)</option>
                <option value="Ruby">Ruby (माणिक्य)</option>
                <option value="Blue Sapphire">Blue Sapphire (नीलम)</option>
                <option value="Pearl">Pearl (मोती)</option>
                <option value="Coral">Red Coral (मूँगा)</option>
                <option value="Hessonite">Hessonite (गोमेद)</option>
                <option value="Cats Eye">Cats Eye (लहसुनिया)</option>
                <option value="Diamond">Natural Diamond (हीरा)</option>
                <option value="Opal">Opal (ओपल)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Ruling Planet</label>
              <input
                type="text"
                value={formData.planet}
                onChange={e => setFormData({ ...formData, planet: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          {/* Row 3: Weight Breakdown (Ratti, Carat, Grams) */}
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-amber-400 mb-1 font-bold">Ratti Weight (रत्ती) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.ratti}
                onChange={e => handleRattiChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-cyan-400 mb-1 font-bold">Carat Weight (कैरेट) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.carat}
                onChange={e => handleCaratChange(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Weight in Grams</label>
              <input
                type="number"
                step="0.001"
                readOnly
                value={formData.gramWeight}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-xl px-3 py-2 text-slate-400 font-mono"
              />
            </div>
          </div>

          {/* Row 4: Lab & Certificate No */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Testing Lab *</label>
              <select
                value={formData.labName}
                onChange={e => setFormData({ ...formData, labName: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              >
                <option value="GTL Jaipur">GTL Jaipur (Govt Recognized)</option>
                <option value="IGI International">IGI International</option>
                <option value="GIA">GIA</option>
                <option value="IGL Lab">IGL Lab</option>
                <option value="Govt Lab">Govt Assay Lab</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Lab Certificate / Report # *</label>
              <input
                type="text"
                required
                value={formData.labCertNo}
                onChange={e => setFormData({ ...formData, labCertNo: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Origin</label>
              <input
                type="text"
                value={formData.origin}
                onChange={e => setFormData({ ...formData, origin: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          {/* Row 5: Cut, Color, Treatment */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cut & Shape</label>
              <input
                type="text"
                value={formData.cutShape}
                onChange={e => setFormData({ ...formData, cutShape: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Color</label>
              <input
                type="text"
                value={formData.color}
                onChange={e => setFormData({ ...formData, color: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Treatment</label>
              <input
                type="text"
                value={formData.treatment}
                onChange={e => setFormData({ ...formData, treatment: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
              />
            </div>
          </div>

          {/* Row 6: Rates & Pricing */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Rate / Ratti (₹)</label>
              <input
                type="number"
                value={formData.ratePerRatti}
                onChange={e => setFormData({ ...formData, ratePerRatti: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Cost Price (₹) *</label>
              <input
                type="number"
                required
                value={formData.costPrice}
                onChange={e => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Selling Price (₹) *</label>
              <input
                type="number"
                required
                value={formData.sellingPrice}
                onChange={e => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-medium">Stock Status</label>
              <select
                value={formData.stockStatus}
                onChange={e => setFormData({ ...formData, stockStatus: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold"
              >
                <option value="In Stock">In Stock</option>
                <option value="Sold">Sold</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Astrological Notes & Verification Details</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Unheated natural sattvik Jupiter gemstone with clear silk..."
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition"
            >
              Save Certified Gemstone
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
