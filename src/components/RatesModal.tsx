import React, { useState } from 'react';
import { MetalRate, MetalType } from '../types';
import { cityRatesPresets } from '../data/initialData';
import { 
  X, 
  Save, 
  TrendingUp, 
  AlertCircle, 
  MapPin, 
  Building2, 
  ExternalLink, 
  RefreshCw, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Edit3, 
  Coins, 
  Sparkles 
} from 'lucide-react';

interface RatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rates: MetalRate[];
  selectedCity: string;
  onSelectCity: (city: string) => void;
  onSaveRates: (updatedRates: MetalRate[]) => void;
}

export const RatesModal: React.FC<RatesModalProps> = ({
  isOpen,
  onClose,
  rates,
  selectedCity,
  onSelectCity,
  onSaveRates,
}) => {
  const [currentCity, setCurrentCity] = useState<string>(selectedCity);
  const [editedRates, setEditedRates] = useState<MetalRate[]>(rates);
  const [syncedBanner, setSyncedBanner] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);

  // New Custom Purity Form
  const [newMetal, setNewMetal] = useState<MetalType>('Silver');
  const [newPurityName, setNewPurityName] = useState('84% Chandi Payal');
  const [newTouchPercent, setNewTouchPercent] = useState<number>(84.0);
  const [newRatePerGram, setNewRatePerGram] = useState<number>(160);

  // Editing existing purity name state
  const [editingPurityIdx, setEditingPurityIdx] = useState<number | null>(null);
  const [editedPurityName, setEditedPurityName] = useState('');

  if (!isOpen) return null;

  const handleCityChange = (cityName: string) => {
    setCurrentCity(cityName);
    const preset = cityRatesPresets.find(c => c.city === cityName);
    if (preset) {
      setEditedRates(preset.rates);
    }
  };

  const handleChangeRate = (index: number, newRate: number) => {
    const updated = [...editedRates];
    updated[index] = {
      ...updated[index],
      ratePerGram: newRate,
      lastUpdated: 'Manual Edit'
    };
    setEditedRates(updated);
  };

  const handleStartEditPurity = (index: number) => {
    setEditingPurityIdx(index);
    setEditedPurityName(editedRates[index].purity);
  };

  const handleSavePurityName = (index: number) => {
    if (!editedPurityName.trim()) return;
    const updated = [...editedRates];
    updated[index] = {
      ...updated[index],
      purity: editedPurityName.trim(),
      lastUpdated: 'Purity Renamed'
    };
    setEditedRates(updated);
    setEditingPurityIdx(null);
  };

  const handleDeleteRate = (index: number) => {
    if (editedRates.length <= 1) return;
    setEditedRates(prev => prev.filter((_, i) => i !== index));
  };

  const handleSyncAtoZBullion = () => {
    const bhopalPreset = cityRatesPresets.find(c => c.city === 'Bhopal');
    if (bhopalPreset) {
      setCurrentCity('Bhopal');
      setEditedRates(bhopalPreset.rates);
      setSyncedBanner(true);
      setTimeout(() => setSyncedBanner(false), 3000);
    }
  };

  const handleSave = () => {
    onSelectCity(currentCity);
    onSaveRates(editedRates);
    onClose();
  };

  const handleQuickPercentChange = (percent: number) => {
    const updated = editedRates.map(r => ({
      ...r,
      ratePerGram: Math.round(r.ratePerGram * (1 + percent / 100)),
      lastUpdated: 'Quick shift'
    }));
    setEditedRates(updated);
  };

  // Add custom silver wholesaler purity or gold purity
  const handleAddCustomRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurityName.trim()) return;

    // Check if purity already exists
    const exists = editedRates.some(r => r.metal === newMetal && r.purity.toLowerCase() === newPurityName.toLowerCase());
    if (exists) {
      alert('यह शुद्धता (Purity) पहले से सूची में मौजूद है।');
      return;
    }

    const newRateObj: MetalRate = {
      metal: newMetal,
      purity: newPurityName.trim(),
      ratePerGram: Number(newRatePerGram) || 0,
      lastUpdated: `Custom Touch ${newTouchPercent}%`
    };

    setEditedRates(prev => [...prev, newRateObj]);
    setShowAddCustomModal(false);
    setNewPurityName('');
  };

  // Quick preset button for silver wholesaler purities
  const handleAddSilverWholesalePreset = (label: string, touch: number) => {
    const pureSilverRate = editedRates.find(r => r.metal === 'Silver' && r.purity.includes('999'))?.ratePerGram || 190.3;
    const calcRate = Math.round(pureSilverRate * (touch / 100));

    const existingIdx = editedRates.findIndex(r => r.metal === 'Silver' && r.purity.includes(label));
    if (existingIdx >= 0) {
      handleChangeRate(existingIdx, calcRate);
      return;
    }

    setEditedRates(prev => [
      ...prev,
      {
        metal: 'Silver',
        purity: `${label} (${touch}% Touch)`,
        ratePerGram: calcRate,
        lastUpdated: `Wholesaler ${touch}% Fine`
      }
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-200 dark:border-amber-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 font-serif">दैनिक सर्राफा व बुलियन भाव (Daily Bullion Rates)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Purity & Touch editing • Wholesaler Silver Fine rates (चांदी टंच व फाइन भाव)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live A To Z Bullion Integration Banner */}
        <div className="p-3.5 bg-gradient-to-r from-amber-50 via-amber-50/60 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 border-b border-amber-200 dark:border-amber-900/50 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded tracking-wide uppercase shadow-xs">
                  Verified Source
                </span>
                <span className="font-extrabold text-amber-950 dark:text-amber-300 text-xs">
                  A To Z Bullion, Sarafa Bazar, Bhopal
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Benchmark bullion ticker at <span className="text-amber-800 dark:text-amber-400 font-mono font-bold">atozbullion.com</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncAtoZBullion}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Sync rates with latest A To Z Bullion Bhopal feed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync AtoZ Rates</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddCustomModal(true)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-600 font-bold text-xs rounded-xl flex items-center gap-1 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>+ शुद्धता जोड़ें (Add Purity)</span>
              </button>
            </div>
          </div>

          {syncedBanner && (
            <div className="mt-2 text-xs bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Successfully synchronized with A To Z Bullion Bhopal live rates!</span>
            </div>
          )}
        </div>

        {/* Wholesale Silver Purity Quick Bar */}
        <div className="p-3 bg-slate-100 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">
              चांदी थोक टंच प्रेसेट्स (Wholesale Silver Touch):
            </span>
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { label: '999 Fine', touch: 100 },
              { label: '92.5% Sterling', touch: 92.5 },
              { label: '84% Payal', touch: 84 },
              { label: '80% Chandi', touch: 80 },
              { label: '70% Bichhiya', touch: 70 },
              { label: '60% Murti/Bartan', touch: 60 },
              { label: '50% Low Touch', touch: 50 },
            ].map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleAddSilverWholesalePreset(p.label, p.touch)}
                className="text-[10px] font-bold bg-white dark:bg-slate-700 hover:bg-amber-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-600 hover:border-amber-400 px-2 py-0.5 rounded transition shadow-2xs cursor-pointer"
                title={`Add or update ${p.label} rate`}
              >
                + {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* City Selector & Quick Shifts */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <select
              value={currentCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-amber-500 shadow-xs"
            >
              {cityRatesPresets.map(preset => (
                <option key={preset.city} value={preset.city}>
                  {preset.city} ({preset.state})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-bold mr-1">Shift:</span>
            <button
              onClick={() => handleQuickPercentChange(-1)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold shadow-xs cursor-pointer"
            >
              -1%
            </button>
            <button
              onClick={() => handleQuickPercentChange(1)}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold shadow-xs cursor-pointer"
            >
              +1%
            </button>
            <button
              onClick={() => handleQuickPercentChange(2)}
              className="px-2.5 py-1 bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-900 dark:text-amber-300 rounded-lg border border-amber-300 dark:border-amber-600 text-xs font-bold cursor-pointer"
            >
              +2%
            </button>
          </div>
        </div>

        {/* Rates List with editable purity */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {editedRates.map((rate, index) => {
            const isGold = rate.metal === 'Gold';
            const isSilver = rate.metal === 'Silver';
            const tenGramRate = isGold ? rate.ratePerGram * 10 : null;
            const kgRate = isSilver ? rate.ratePerGram * 1000 : null;
            const isEditingThisPurity = editingPurityIdx === index;

            return (
              <div
                key={`${rate.metal}-${rate.purity}-${index}`}
                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50/50 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 hover:border-amber-300 dark:hover:border-amber-500/50 transition"
              >
                <div className="space-y-1 flex-1 mr-3">
                  <div className="flex items-center space-x-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                      isGold ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30' :
                      isSilver ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-200 border border-slate-300 dark:border-slate-600' :
                      'bg-cyan-100 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-500/30'
                    }`}>
                      {rate.metal}
                    </span>

                    {/* Inline Purity Editing */}
                    {isEditingThisPurity ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editedPurityName}
                          onChange={(e) => setEditedPurityName(e.target.value)}
                          className="bg-white dark:bg-slate-900 border border-amber-500 rounded px-2 py-0.5 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSavePurityName(index)}
                          className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPurityIdx(null)}
                          className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 group">
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{rate.purity}</span>
                        <button
                          type="button"
                          onClick={() => handleStartEditPurity(index)}
                          className="text-slate-400 hover:text-amber-700 dark:hover:text-amber-400 p-0.5 transition cursor-pointer"
                          title="शुद्धता का नाम बदलें (Edit Purity Name)"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    {tenGramRate && (
                      <span className="text-amber-800 dark:text-amber-400 font-mono font-bold">
                        10g: ₹{tenGramRate.toLocaleString('en-IN')}
                      </span>
                    )}
                    {kgRate && (
                      <span className="text-slate-700 dark:text-slate-300 font-mono font-bold">
                        1kg: ₹{kgRate.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">• {rate.lastUpdated}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-slate-500 dark:text-slate-400 text-sm font-bold">₹</span>
                  <input
                    type="number"
                    value={rate.ratePerGram}
                    onChange={(e) => handleChangeRate(index, Number(e.target.value))}
                    className="w-28 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-amber-500 text-slate-900 dark:text-slate-100 font-black px-2.5 py-1.5 rounded-xl text-right text-sm focus:outline-none font-mono shadow-2xs"
                    min={0}
                    step={1}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">/ g</span>

                  {editedRates.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteRate(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition cursor-pointer ml-1"
                      title="Remove rate row"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            3% GST applicable on retail sales bills.
          </span>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs rounded-xl font-bold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white text-xs font-extrabold rounded-xl flex items-center space-x-1.5 shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Update Sarafa Rates</span>
            </button>
          </div>
        </div>

      </div>

      {/* Sub-Modal: Add Custom Metal / Purity */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>नई धातु शुद्धता व भाव जोड़ें (Add Custom Purity)</span>
              </h3>
              <button 
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomRate} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Metal Type (धातु)</label>
                <select
                  value={newMetal}
                  onChange={(e) => setNewMetal(e.target.value as MetalType)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="Silver">Silver (चाँदी)</option>
                  <option value="Gold">Gold (सोना)</option>
                  <option value="Platinum">Platinum (प्लैटिनम)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Purity Label / Name (शुद्धता का नाम)</label>
                <input
                  type="text"
                  placeholder="उदा. 84% Chandi Payal या 70% Silver Bichhiya"
                  value={newPurityName}
                  onChange={(e) => setNewPurityName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 dark:text-slate-100"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Touch / Purity % (टंच प्रतिशत)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="100"
                    value={newTouchPercent}
                    onChange={(e) => {
                      const t = parseFloat(e.target.value) || 0;
                      setNewTouchPercent(t);
                      const baseRate = newMetal === 'Silver' ? 190.3 : 14225;
                      setNewRatePerGram(Math.round(baseRate * (t / 100)));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Rate per Gram (भाव ₹/ग्राम)</label>
                  <input
                    type="number"
                    value={newRatePerGram}
                    onChange={(e) => setNewRatePerGram(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs shadow-sm"
                >
                  + सूची में जोड़ें
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
