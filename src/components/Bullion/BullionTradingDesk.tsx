import React, { useState } from 'react';
import { MetalRate } from '../../types';
import { 
  TrendingUp, 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  Scale, 
  CheckCircle2, 
  Clock, 
  Building2, 
  FileText, 
  RefreshCw 
} from 'lucide-react';

export interface BullionSauda {
  id: string;
  saudaNo: string;
  tradeType: 'BUY' | 'SELL';
  commodity: 'Gold 999 Fine' | 'Gold 995 Bullion' | 'Silver 999 Bars';
  dealerName: string;
  dealType: 'Sarafa Physical' | 'MCX Hedge' | 'Bank Bullion Delivery';
  quantityGrams: number;
  ratePerGram: number; // e.g. ₹14,225/g
  totalAmount: number;
  tradeDate: string;
  deliveryDate: string;
  badlaChargesPerGram: number; // Badla / Premium per gram
  status: 'Open / Pending' | 'Delivered & Settled' | 'Squared Off';
}

interface BullionTradingDeskProps {
  rates: MetalRate[];
}

export const BullionTradingDesk: React.FC<BullionTradingDeskProps> = ({ rates }) => {
  const goldRate = rates.find(r => r.metal === 'Gold' && r.purity === '24K')?.ratePerGram || 14225;
  const silverRate = rates.find(r => r.metal === 'Silver' && r.purity === '999 Fine')?.ratePerGram || 190.3;

  const [saudas, setSaudas] = useState<BullionSauda[]>([
    {
      id: 'sda-01',
      saudaNo: 'SDA-BPL-2026-104',
      tradeType: 'BUY',
      commodity: 'Gold 999 Fine',
      dealerName: 'A To Z Bullion, Sarafa Bazar Bhopal',
      dealType: 'Sarafa Physical',
      quantityGrams: 500.0, // 500g bar
      ratePerGram: 14200,
      totalAmount: 7100000,
      tradeDate: '2026-10-31',
      deliveryDate: '2026-11-02',
      badlaChargesPerGram: 15,
      status: 'Open / Pending'
    },
    {
      id: 'sda-02',
      saudaNo: 'SDA-BPL-2026-105',
      tradeType: 'SELL',
      commodity: 'Gold 995 Bullion',
      dealerName: 'Indore Bullion Exchange Corp',
      dealType: 'Bank Bullion Delivery',
      quantityGrams: 200.0,
      ratePerGram: 14240,
      totalAmount: 2848000,
      tradeDate: '2026-10-30',
      deliveryDate: '2026-10-31',
      badlaChargesPerGram: 10,
      status: 'Delivered & Settled'
    },
    {
      id: 'sda-03',
      saudaNo: 'SDA-BPL-2026-106',
      tradeType: 'BUY',
      commodity: 'Silver 999 Bars',
      dealerName: 'Agra Silver Syndicate (Bhopal Desk)',
      dealType: 'Sarafa Physical',
      quantityGrams: 30000, // 30 kg silver
      ratePerGram: 189.5,
      totalAmount: 5685000,
      tradeDate: '2026-10-29',
      deliveryDate: '2026-11-05',
      badlaChargesPerGram: 0.5,
      status: 'Open / Pending'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [commodity, setCommodity] = useState<BullionSauda['commodity']>('Gold 999 Fine');
  const [dealerName, setDealerName] = useState('A To Z Bullion, Bhopal');
  const [qty, setQty] = useState(100.0);
  const [saudaRate, setSaudaRate] = useState(goldRate);
  const [badla, setBadla] = useState(15);

  const handleBookSauda = (e: React.FormEvent) => {
    e.preventDefault();
    const total = Math.round(qty * saudaRate);
    const newS: BullionSauda = {
      id: `sda-${Date.now()}`,
      saudaNo: `SDA-BPL-2026-1${Math.floor(10 + Math.random() * 90)}`,
      tradeType,
      commodity,
      dealerName,
      dealType: 'Sarafa Physical',
      quantityGrams: Number(qty),
      ratePerGram: Number(saudaRate),
      totalAmount: total,
      tradeDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      badlaChargesPerGram: Number(badla),
      status: 'Open / Pending'
    };

    setSaudas([newS, ...saudas]);
    setShowModal(false);
  };

  const handleSettleSauda = (id: string) => {
    setSaudas(prev => prev.map(s => s.id === id ? { ...s, status: 'Delivered & Settled' } : s));
  };

  // MTM Unrealized Profit/Loss
  const openGoldSaudaGrams = saudas
    .filter(s => s.status === 'Open / Pending' && s.commodity.includes('Gold'))
    .reduce((s, a) => s + (a.tradeType === 'BUY' ? a.quantityGrams : -a.quantityGrams), 0);

  const openGoldAvgBuyRate = 14200;
  const goldMTMProfit = Math.round(openGoldSaudaGrams * (goldRate - openGoldAvgBuyRate));

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span>बुलियन ट्रेडिंग व सौदा डेस्क (Bullion Trading & Sauda / Badla Desk)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Live Sarafa Sauda booking, MCX hedging, pending delivery registers, and badla adjustment
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ Book Bullion Sauda (सौदा दर्ज करें)</span>
        </button>
      </div>

      {/* Top Tickers & Position */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Live Gold 24K Spot (Bhopal)</span>
          <p className="text-2xl font-black text-amber-700 font-mono mt-0.5">
            ₹{goldRate.toLocaleString('en-IN')}/g
          </p>
          <span className="text-[11px] text-slate-500">₹{(goldRate * 10).toLocaleString('en-IN')} / 10g</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Live Silver 999 Spot</span>
          <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">
            ₹{silverRate.toLocaleString('en-IN')}/g
          </p>
          <span className="text-[11px] text-slate-500">₹{(silverRate * 1000).toLocaleString('en-IN')} / 1kg</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Net Open Gold Position (लॉट शेष)</span>
          <p className="text-2xl font-black text-blue-900 font-mono mt-0.5">
            {openGoldSaudaGrams > 0 ? `+${openGoldSaudaGrams}g Long` : `${openGoldSaudaGrams}g Short`}
          </p>
          <span className="text-[11px] text-blue-700 font-medium">Delivery Pending from A to Z</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Unrealized MTM Profit (मुनाफा)</span>
          <p className={`text-2xl font-black font-mono mt-0.5 ${goldMTMProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            {goldMTMProfit >= 0 ? `+₹${goldMTMProfit.toLocaleString('en-IN')}` : `-₹${Math.abs(goldMTMProfit).toLocaleString('en-IN')}`}
          </p>
          <span className="text-[11px] text-emerald-800 font-medium">Mark-To-Market Gain</span>
        </div>
      </div>

      {/* Sauda Register Table */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm">Bullion Sauda & Badla Delivery Register</h3>
          <span className="text-xs text-slate-500 font-medium">Pending Delivery & Settlement Ledger</span>
        </div>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Sauda No</th>
                <th className="p-2.5">Type</th>
                <th className="p-2.5">Commodity</th>
                <th className="p-2.5">Dealer / Sarafa Party</th>
                <th className="p-2.5 text-right">Quantity (g)</th>
                <th className="p-2.5 text-right">Sauda Rate (₹/g)</th>
                <th className="p-2.5 text-right">Badla (₹/g)</th>
                <th className="p-2.5 text-right">Total Deal Value</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {saudas.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-bold text-slate-900">{s.saudaNo}</td>
                  <td className="p-2.5">
                    <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                      s.tradeType === 'BUY' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {s.tradeType}
                    </span>
                  </td>
                  <td className="p-2.5 font-sans font-bold text-slate-800">{s.commodity}</td>
                  <td className="p-2.5 font-sans text-slate-700 font-medium">{s.dealerName}</td>
                  <td className="p-2.5 text-right font-bold text-slate-900">{s.quantityGrams.toLocaleString()}g</td>
                  <td className="p-2.5 text-right font-bold text-blue-900">₹{s.ratePerGram.toLocaleString()}</td>
                  <td className="p-2.5 text-right text-slate-600">₹{s.badlaChargesPerGram}</td>
                  <td className="p-2.5 text-right font-black text-slate-900">₹{s.totalAmount.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-center font-sans">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === 'Open / Pending' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-sans">
                    {s.status === 'Open / Pending' && (
                      <button
                        onClick={() => handleSettleSauda(s.id)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-bold text-[11px] shadow-2xs cursor-pointer"
                      >
                        Settle & Deliver
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Sauda Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-base">नया बुलियन सौदा बुक करें (Book Bullion Trade)</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleBookSauda} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Trade Type *</label>
                  <select
                    value={tradeType}
                    onChange={(e) => setTradeType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                  >
                    <option value="BUY">BUY (आवक / खरीद)</option>
                    <option value="SELL">SELL (जावक / बिक्री)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Commodity *</label>
                  <select
                    value={commodity}
                    onChange={(e) => {
                      const comm = e.target.value as any;
                      setCommodity(comm);
                      setSaudaRate(comm.includes('Silver') ? silverRate : goldRate);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                  >
                    <option value="Gold 999 Fine">Gold 999 Fine (24K)</option>
                    <option value="Gold 995 Bullion">Gold 995 Bullion</option>
                    <option value="Silver 999 Bars">Silver 999 Bars</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Dealer / Sarafa Trader *</label>
                <input
                  type="text"
                  required
                  value={dealerName}
                  onChange={(e) => setDealerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Quantity (g) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={qty}
                    onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Sauda Rate (₹/g) *</label>
                  <input
                    type="number"
                    required
                    value={saudaRate}
                    onChange={(e) => setSaudaRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono font-black text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Badla (₹/g)</label>
                  <input
                    type="number"
                    value={badla}
                    onChange={(e) => setBadla(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 flex justify-between items-center text-xs">
                <span className="font-bold text-blue-900">Total Contract Value:</span>
                <span className="text-base font-black font-mono text-blue-950">
                  ₹{Math.round(qty * saudaRate).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg shadow-xs cursor-pointer"
                >
                  Confirm Sauda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
