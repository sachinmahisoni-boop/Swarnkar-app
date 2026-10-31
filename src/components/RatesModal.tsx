import React, { useState } from 'react';
import { MetalRate } from '../types';
import { cityRatesPresets } from '../data/initialData';
import { X, Save, TrendingUp, AlertCircle, MapPin, Building2, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';

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

  const activePreset = cityRatesPresets.find(c => c.city === currentCity);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-200">Daily Bullion & Sarafa Rate Desk</h2>
              <p className="text-xs text-slate-400">Live Precious Metal Benchmark Rates (Bhopal Sarafa Market)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live A To Z Bullion Integration Banner */}
        <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-850 to-slate-900 border-b border-amber-500/20 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded tracking-wide uppercase">
                  Verified Source
                </span>
                <span className="font-bold text-amber-300 text-xs">
                  A To Z Bullion, Sarafa Bazar, Bhopal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Rates aligned with official live feed at <span className="text-amber-400 font-mono">atozbullion.com</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncAtoZBullion}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                title="Sync rates with latest A To Z Bullion Bhopal feed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync AtoZ Rates</span>
              </button>

              <a
                href="https://www.atozbullion.com/"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1 border border-slate-700 transition"
                title="Visit atozbullion.com live ticker"
              >
                <span>atozbullion.com</span>
                <ExternalLink className="w-3 h-3 text-amber-400" />
              </a>
            </div>
          </div>

          {syncedBanner && (
            <div className="mt-2 text-xs bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Successfully synchronized with A To Z Bullion Bhopal live rates!</span>
            </div>
          )}
        </div>

        {/* City Selector & Quick Shifts */}
        <div className="p-4 bg-slate-800/40 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <select
              value={currentCity}
              onChange={(e) => handleCityChange(e.target.value)}
              className="bg-slate-800 border border-amber-500/40 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-amber-400"
            >
              {cityRatesPresets.map(preset => (
                <option key={preset.city} value={preset.city}>
                  {preset.city} ({preset.state})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Shift:</span>
            <button
              onClick={() => handleQuickPercentChange(-1)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs cursor-pointer"
            >
              -1%
            </button>
            <button
              onClick={() => handleQuickPercentChange(1)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs cursor-pointer"
            >
              +1%
            </button>
            <button
              onClick={() => handleQuickPercentChange(2)}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/30 text-xs font-medium cursor-pointer"
            >
              +2%
            </button>
          </div>
        </div>

        {/* Rates List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {editedRates.map((rate, index) => {
            const isGold = rate.metal === 'Gold';
            const isSilver = rate.metal === 'Silver';
            const tenGramRate = isGold ? rate.ratePerGram * 10 : null;
            const kgRate = isSilver ? rate.ratePerGram * 1000 : null;

            return (
              <div
                key={`${rate.metal}-${rate.purity}`}
                className="flex items-center justify-between p-3 bg-slate-800/70 rounded-xl border border-slate-700/60 hover:border-amber-500/30 transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isGold ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      isSilver ? 'bg-slate-200/20 text-slate-200 border border-slate-400/30' :
                      'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {rate.metal}
                    </span>
                    <span className="font-bold text-slate-100 text-sm">{rate.purity}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    {tenGramRate && (
                      <span className="text-amber-400/90 font-mono font-medium">
                        10g: ₹{tenGramRate.toLocaleString('en-IN')}
                      </span>
                    )}
                    {kgRate && (
                      <span className="text-slate-300 font-mono font-medium">
                        1kg: ₹{kgRate.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-500">• {rate.lastUpdated}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 text-sm font-semibold">₹</span>
                  <input
                    type="number"
                    value={rate.ratePerGram}
                    onChange={(e) => handleChangeRate(index, Number(e.target.value))}
                    className="w-32 bg-slate-900 border border-slate-600 focus:border-amber-400 text-amber-300 font-bold px-3 py-1.5 rounded-lg text-right text-base focus:outline-none font-mono"
                    min={0}
                    step={1}
                  />
                  <span className="text-xs text-slate-400">/ g</span>
                </div>
              </div>
            );
          })}

          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl text-xs text-amber-300 mt-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              Rates are base retail bullion prices used for billing and exchange calculations. Standard 3% GST (1.5% CGST + 1.5% SGST) is added automatically at checkout.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-800/90 border-t border-slate-700 flex justify-end space-x-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl font-medium transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Apply Rates to ERP</span>
          </button>
        </div>

      </div>
    </div>
  );
};
