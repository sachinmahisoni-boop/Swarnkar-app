import React, { useState } from 'react';
import { GSTInvoice, PurchaseInvoice, ShopExpense, CashBankTransfer, GirviLoan } from '../../types';
import { Wallet, Landmark, ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Plus, History, CheckCircle2, DollarSign, Calendar, TrendingUp } from 'lucide-react';

interface CashBankDashboardProps {
  initialCash: number;
  initialBank: number;
  invoices: GSTInvoice[];
  purchases: PurchaseInvoice[];
  expenses: ShopExpense[];
  girviLoans: GirviLoan[];
  transfers: CashBankTransfer[];
  onAddTransfer: (transfer: CashBankTransfer) => void;
}

export const CashBankDashboard: React.FC<CashBankDashboardProps> = ({
  initialCash,
  initialBank,
  invoices,
  purchases,
  expenses,
  girviLoans,
  transfers,
  onAddTransfer,
}) => {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState<'DEPOSIT_TO_BANK' | 'WITHDRAW_FROM_BANK'>('DEPOSIT_TO_BANK');
  const [transferAmount, setTransferAmount] = useState<number>(25000);
  const [transferDesc, setTransferDesc] = useState('Daily cash excess deposit to SBI Kolar Road Current A/C');

  // --- 1. CASH IN HAND CALCULATIONS ---
  const salesCashIn = invoices
    .filter(i => i.payment.method === 'Cash')
    .reduce((s, i) => s + i.payment.amountPaid, 0);

  const girviCashIn = girviLoans.reduce((s, g) => s + g.interestPaidSoFar + g.principalPaid, 0);
  const girviDisbursedCash = girviLoans.reduce((s, g) => s + g.principalAmount, 0);

  const oldMetalCashOut = invoices.reduce((s, i) => s + (i.oldMetalExchange?.totalCreditAmount || 0), 0);
  
  const purchasesCashOut = purchases
    .filter(p => p.paymentMode === 'Cash')
    .reduce((s, p) => s + p.amountPaid, 0);

  const expensesCashOut = expenses
    .filter(e => e.paymentSource === 'Cash in Hand')
    .reduce((s, e) => s + e.amount, 0);

  const cashDepositedToBank = transfers
    .filter(t => t.type === 'DEPOSIT_TO_BANK')
    .reduce((s, t) => s + t.amount, 0);

  const cashWithdrawnFromBank = transfers
    .filter(t => t.type === 'WITHDRAW_FROM_BANK')
    .reduce((s, t) => s + t.amount, 0);

  const currentCashInHand = initialCash + salesCashIn + girviCashIn + cashWithdrawnFromBank - (purchasesCashOut + expensesCashOut + cashDepositedToBank);

  // --- 2. BANK BALANCE CALCULATIONS ---
  const salesDigitalIn = invoices
    .filter(i => i.payment.method !== 'Cash')
    .reduce((s, i) => s + i.payment.amountPaid, 0);

  const purchasesBankOut = purchases
    .filter(p => p.paymentMode === 'Bank Transfer' || p.paymentMode === 'UPI')
    .reduce((s, p) => s + p.amountPaid, 0);

  const expensesBankOut = expenses
    .filter(e => e.paymentSource === 'Bank Account')
    .reduce((s, e) => s + e.amount, 0);

  const currentBankBalance = initialBank + salesDigitalIn + cashDepositedToBank - (purchasesBankOut + expensesBankOut + cashWithdrawnFromBank);

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0) return;

    const newTransfer: CashBankTransfer = {
      id: `trf-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: transferType,
      amount: Number(transferAmount),
      description: transferDesc.trim() || (transferType === 'DEPOSIT_TO_BANK' ? 'Cash deposited to bank' : 'Cash withdrawn from bank')
    };

    onAddTransfer(newTransfer);
    setShowTransferModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top 2 Primary Balances Cards: Cash in Hand & Bank Deposit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Physical Cash in Hand Card (गल्ला रोकड़) */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Wallet className="w-36 h-36 text-amber-400" />
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 border border-amber-500/40 rounded-2xl text-amber-400 shadow-md">
                <Wallet className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-lg">
                  Cash in Hand (गल्ला रोकड़)
                </h3>
                <p className="text-xs text-amber-300/80">
                  Physical currency available in showroom cash drawer
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTransferType('DEPOSIT_TO_BANK');
                setTransferDesc('Excess physical cash deposited to SBI Current A/C');
                setShowTransferModal(true);
              }}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 shadow transition cursor-pointer"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              Deposit to Bank
            </button>
          </div>

          <div className="py-5">
            <span className="text-xs text-slate-400 block font-medium">Closing Cash in Hand Balance:</span>
            <div className="text-3xl sm:text-4xl font-black text-amber-300 font-mono tracking-tight mt-1">
              ₹{currentCashInHand.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Cash Inflow vs Outflow Breakdown */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <ArrowDownLeft className="w-3 h-3" /> Cash Inflows:
              </span>
              <div className="text-[11px] text-slate-300">
                Opening Cash: <span className="font-mono font-bold">₹{initialCash.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Sales Cash Receipts: <span className="font-mono font-bold text-emerald-400">+₹{salesCashIn.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Girvi Interest / Principal: <span className="font-mono text-emerald-400">+₹{girviCashIn.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-1 border-l border-slate-800 pl-3">
              <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                <ArrowUpRight className="w-3 h-3" /> Cash Outflows:
              </span>
              <div className="text-[11px] text-slate-300">
                Purchases Paid (Cash): <span className="font-mono text-rose-400">-₹{purchasesCashOut.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Expenses Paid (Cash): <span className="font-mono text-rose-400">-₹{expensesCashOut.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Deposited to Bank: <span className="font-mono text-rose-400">-₹{cashDepositedToBank.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Account Balance Card (बैंक खाता जमा) */}
        <div className="bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border-2 border-blue-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Landmark className="w-36 h-36 text-blue-400" />
          </div>

          <div className="flex items-center justify-between pb-4 border-b border-blue-500/20">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/20 border border-blue-500/40 rounded-2xl text-blue-400 shadow-md">
                <Landmark className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-100 text-lg">
                  Bank Account Balance (बैंक जमा)
                </h3>
                <p className="text-xs text-blue-300/80">
                  State Bank of India Current A/C (392023578510)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTransferType('WITHDRAW_FROM_BANK');
                setTransferDesc('Cash withdrawn from SBI Current A/C for store cash drawer');
                setShowTransferModal(true);
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow transition cursor-pointer"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              Withdraw Cash
            </button>
          </div>

          <div className="py-5">
            <span className="text-xs text-slate-400 block font-medium">Verified Bank Balance:</span>
            <div className="text-3xl sm:text-4xl font-black text-blue-300 font-mono tracking-tight mt-1">
              ₹{currentBankBalance.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Bank Inflow vs Outflow Breakdown */}
          <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs">
            <div className="space-y-1">
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                <ArrowDownLeft className="w-3 h-3" /> Bank Credits (जमा):
              </span>
              <div className="text-[11px] text-slate-300">
                Opening Bank Balance: <span className="font-mono font-bold">₹{initialBank.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                UPI / Card Sales: <span className="font-mono font-bold text-emerald-400">+₹{salesDigitalIn.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Cash Deposited: <span className="font-mono text-emerald-400">+₹{cashDepositedToBank.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="space-y-1 border-l border-slate-800 pl-3">
              <span className="text-rose-400 font-bold flex items-center gap-1 text-[11px]">
                <ArrowUpRight className="w-3 h-3" /> Bank Debits (निकासी):
              </span>
              <div className="text-[11px] text-slate-300">
                Vendor Payments (NEFT/UPI): <span className="font-mono text-rose-400">-₹{purchasesBankOut.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Online Expenses: <span className="font-mono text-rose-400">-₹{expensesBankOut.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-[11px] text-slate-300">
                Cash Withdrawn: <span className="font-mono text-rose-400">-₹{cashWithdrawnFromBank.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Contra Transfers & Money Movement Register */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
              Contra Cash & Bank Transfer Logs (रोकड़ व बैंक लेनदेन)
            </h4>
            <p className="text-xs text-slate-400">
              Record bank cash deposits or withdrawals to keep books reconciled.
            </p>
          </div>

          <button
            onClick={() => {
              setTransferType('DEPOSIT_TO_BANK');
              setShowTransferModal(true);
            }}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            + Record Cash/Bank Contra Transfer
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Transfer Action</th>
                <th className="py-3 px-4">From Account</th>
                <th className="py-3 px-4">To Account</th>
                <th className="py-3 px-4">Description / Reference</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No contra transfers logged yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono text-slate-300">{t.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        t.type === 'DEPOSIT_TO_BANK'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {t.type === 'DEPOSIT_TO_BANK' ? 'Cash Deposited to Bank' : 'Cash Withdrawn from Bank'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      {t.type === 'DEPOSIT_TO_BANK' ? 'Cash in Hand (गल्ला)' : 'SBI Current A/C'}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      {t.type === 'DEPOSIT_TO_BANK' ? 'SBI Current A/C' : 'Cash in Hand (गल्ला)'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{t.description}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-amber-300">
                      ₹{t.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Contra Cash/Bank Transfer */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                Record Cash & Bank Contra Transfer
              </h3>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Select Transfer Type *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setTransferType('DEPOSIT_TO_BANK');
                      setTransferDesc('Cash excess deposited to SBI Current A/C');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold text-xs transition ${
                      transferType === 'DEPOSIT_TO_BANK'
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Deposit to Bank (बैंक में जमा)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransferType('WITHDRAW_FROM_BANK');
                      setTransferDesc('Cash withdrawn from SBI Current A/C');
                    }}
                    className={`py-2 px-3 rounded-lg font-bold text-xs transition ${
                      transferType === 'WITHDRAW_FROM_BANK'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Withdraw Cash (बैंक से निकासी)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Transfer Amount (₹) *</label>
                <input
                  type="number"
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-300 font-mono font-black text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Description / Bank Slip No.</label>
                <input
                  type="text"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
