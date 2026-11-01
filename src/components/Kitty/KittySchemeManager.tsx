import React, { useState } from 'react';
import { Customer } from '../../types';
import { 
  Coins, 
  Plus, 
  Calendar, 
  Award, 
  CheckCircle2, 
  User, 
  Sparkles, 
  Receipt, 
  Gift, 
  FileText 
} from 'lucide-react';

export interface KittyAccount {
  id: string;
  schemeNo: string;
  customerName: string;
  phone: string;
  monthlyAmount: number; // e.g. ₹5,000 / month
  tenureMonths: number; // typically 11 months + 1 month bonus by jeweller
  monthsPaid: number;
  totalPaidAmount: number;
  startDate: string;
  bonusAmount: number; // Free 12th month contribution by jeweller
  maturityValue: number; // e.g. ₹60,000 total gold redemption value
  status: 'Active' | 'Lucky Draw Winner' | 'Matured & Redeemed';
}

interface KittySchemeManagerProps {
  customers: Customer[];
}

export const KittySchemeManager: React.FC<KittySchemeManagerProps> = ({ customers }) => {
  const [kitties, setKitties] = useState<KittyAccount[]>([
    {
      id: 'kit-01',
      schemeNo: 'SWARNA-2026-001',
      customerName: 'Smt. Sunita Sharma',
      phone: '9826012345',
      monthlyAmount: 5000,
      tenureMonths: 11,
      monthsPaid: 8,
      totalPaidAmount: 40000,
      startDate: '2026-03-10',
      bonusAmount: 5000,
      maturityValue: 60000,
      status: 'Active'
    },
    {
      id: 'kit-02',
      schemeNo: 'SWARNA-2026-002',
      customerName: 'Smt. Kavita Chouhan',
      phone: '9179043210',
      monthlyAmount: 10000,
      tenureMonths: 11,
      monthsPaid: 11,
      totalPaidAmount: 110000,
      startDate: '2025-11-01',
      bonusAmount: 10000,
      maturityValue: 120000,
      status: 'Lucky Draw Winner'
    },
    {
      id: 'kit-03',
      schemeNo: 'SWARNA-2026-003',
      customerName: 'Shri Rajeshwar Rao',
      phone: '9425098765',
      monthlyAmount: 2000,
      tenureMonths: 11,
      monthsPaid: 5,
      totalPaidAmount: 10000,
      startDate: '2026-06-15',
      bonusAmount: 2000,
      maturityValue: 24000,
      status: 'Active'
    }
  ]);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newMonthlyAmt, setNewMonthlyAmt] = useState(5000);

  const handleAddKitty = (e: React.FormEvent) => {
    e.preventDefault();
    const bonus = Number(newMonthlyAmt);
    const maturity = (Number(newMonthlyAmt) * 11) + bonus;

    const newK: KittyAccount = {
      id: `kit-${Date.now()}`,
      schemeNo: `SWARNA-2026-00${kitties.length + 1}`,
      customerName: newCustName,
      phone: newCustPhone,
      monthlyAmount: Number(newMonthlyAmt),
      tenureMonths: 11,
      monthsPaid: 1,
      totalPaidAmount: Number(newMonthlyAmt),
      startDate: new Date().toISOString().split('T')[0],
      bonusAmount: bonus,
      maturityValue: maturity,
      status: 'Active'
    };

    setKitties([newK, ...kitties]);
    setShowNewModal(false);
    setNewCustName('');
    setNewCustPhone('');
  };

  const handlePayInstallment = (id: string) => {
    setKitties(prev => prev.map(k => {
      if (k.id !== id) return k;
      const newMonths = Math.min(k.tenureMonths, k.monthsPaid + 1);
      const newTotal = newMonths * k.monthlyAmount;
      return {
        ...k,
        monthsPaid: newMonths,
        totalPaidAmount: newTotal,
        status: newMonths === k.tenureMonths ? 'Matured & Redeemed' : k.status
      };
    }));
  };

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-600" />
            <span>स्वर्ण बचत योजना व किट्टी (Gold Kitty Scheme & Installments)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            11+1 Monthly Gold Savings Scheme with lucky draw feeding and maturity bonus redemption
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ New Kitty Member</span>
        </button>
      </div>

      {/* Scheme KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Active Kitty Accounts</span>
          <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">{kitties.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Monthly Installment Run</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Total Collected Deposit</span>
          <p className="text-2xl font-black text-blue-900 font-mono mt-0.5">
            ₹{kitties.reduce((s, k) => s + k.totalPaidAmount, 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-500">Held in Trust for Gold Delivery</span>
        </div>

        <div className="bg-white border border-slate-300 rounded-xl p-3.5 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase">Maturity Gold Bonus Value</span>
          <p className="text-2xl font-black text-amber-700 font-mono mt-0.5">
            ₹{kitties.reduce((s, k) => s + k.maturityValue, 0).toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-amber-800 font-bold">12th Month Free by Jeweller</span>
        </div>
      </div>

      {/* Members Grid */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3">
        <h3 className="font-extrabold text-slate-900 text-sm">Kitty Accounts & Passbook</h3>

        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-2.5">Passbook No</th>
                <th className="p-2.5">Member Name</th>
                <th className="p-2.5">Phone</th>
                <th className="p-2.5 text-right">Monthly Installment</th>
                <th className="p-2.5 text-center">Progress (Months)</th>
                <th className="p-2.5 text-right">Total Deposited</th>
                <th className="p-2.5 text-right">Maturity Value</th>
                <th className="p-2.5 text-center">Status</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kitties.map((k) => (
                <tr key={k.id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold text-amber-900">{k.schemeNo}</td>
                  <td className="p-2.5 font-bold text-slate-900">{k.customerName}</td>
                  <td className="p-2.5 font-mono text-slate-600">{k.phone}</td>
                  <td className="p-2.5 text-right font-mono font-bold">₹{k.monthlyAmount.toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-center">
                    <span className="font-mono font-bold text-blue-900">{k.monthsPaid} / {k.tenureMonths}</span>
                    <div className="w-24 bg-slate-200 rounded-full h-1.5 mx-auto mt-1">
                      <div 
                        className="bg-amber-600 h-1.5 rounded-full" 
                        style={{ width: `${(k.monthsPaid / k.tenureMonths) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-emerald-800">
                    ₹{k.totalPaidAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-amber-900">
                    ₹{k.maturityValue.toLocaleString('en-IN')}
                  </td>
                  <td className="p-2.5 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      k.status === 'Lucky Draw Winner' ? 'bg-purple-100 text-purple-900 border border-purple-300' :
                      k.status === 'Matured & Redeemed' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                      'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {k.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-right">
                    {k.monthsPaid < k.tenureMonths && (
                      <button
                        onClick={() => handlePayInstallment(k.id)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] shadow-2xs cursor-pointer"
                      >
                        + Pay Month
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Kitty Member Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <h3 className="font-extrabold text-slate-900 text-base">नया किट्टी / स्वर्ण योजना खाता (New Gold Scheme)</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddKitty} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. श्रीमती अनिता शर्मा"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="98260XXXXX"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Monthly Installment (₹ प्रति माह) *</label>
                <select
                  value={newMonthlyAmt}
                  onChange={(e) => setNewMonthlyAmt(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold font-mono"
                >
                  <option value={1000}>₹1,000 / माह (Maturity ₹12,000)</option>
                  <option value={2000}>₹2,000 / माह (Maturity ₹24,000)</option>
                  <option value={5000}>₹5,000 / माह (Maturity ₹60,000)</option>
                  <option value={10000}>₹10,000 / माह (Maturity ₹1,20,000)</option>
                  <option value={25000}>₹25,000 / माह (Maturity ₹3,00,000)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <span className="font-extrabold block text-xs">योजना विवरण (11+1 Bonus):</span>
                <p className="text-[11px]">
                  ग्राहक 11 माह तक किस्त जमा करेंगे। 12वीं माह की किस्त (₹{newMonthlyAmt.toLocaleString('en-IN')}) दुकान की तरफ से बोनस होगी।
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold rounded-lg shadow-xs cursor-pointer"
                >
                  Create Passbook
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
