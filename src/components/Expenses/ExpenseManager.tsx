import React, { useState } from 'react';
import { ShopExpense, ExpenseCategory } from '../../types';
import { ReceiptText, Plus, Search, Calendar, DollarSign, Wallet, Building2, Trash2, X, PieChart, Sparkles } from 'lucide-react';

interface ExpenseManagerProps {
  expenses: ShopExpense[];
  onAddExpense: (expense: ShopExpense) => void;
  onDeleteExpense: (id: string) => void;
}

export const ExpenseManager: React.FC<ExpenseManagerProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sourceFilter, setSourceFilter] = useState<'All' | 'Cash in Hand' | 'Bank Account'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [voucherNo, setVoucherNo] = useState(`EXP-2026-${String(expenses.length + 45).padStart(4, '0')}`);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Tea & Refreshment (चाय-नाश्ता)');
  const [amount, setAmount] = useState<number>(500);
  const [paymentSource, setPaymentSource] = useState<'Cash in Hand' | 'Bank Account'>('Cash in Hand');
  const [paidTo, setPaidTo] = useState('');
  const [notes, setNotes] = useState('');

  const expenseCategories: ExpenseCategory[] = [
    'Staff Salary',
    'Shop Rent',
    'Electricity & AC',
    'Tea & Refreshment (चाय-नाश्ता)',
    'Polish, Chhilai & Tools',
    'Hallmarking & Testing Fees',
    'Freight, Courier & Security',
    'Marketing & Printing',
    'Office & Misc Maintenance'
  ];

  // Aggregates
  const totalExpenseAmount = expenses.reduce((s, e) => s + e.amount, 0);
  const totalCashExpenses = expenses.filter(e => e.paymentSource === 'Cash in Hand').reduce((s, e) => s + e.amount, 0);
  const totalBankExpenses = expenses.filter(e => e.paymentSource === 'Bank Account').reduce((s, e) => s + e.amount, 0);

  const filteredExpenses = expenses.filter(e => {
    const matchCat = categoryFilter === 'All' || e.category === categoryFilter;
    const matchSource = sourceFilter === 'All' || e.paymentSource === sourceFilter;
    const matchSearch = e.voucherNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSource && matchSearch;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    const newExp: ShopExpense = {
      id: `exp-${Date.now()}`,
      voucherNo,
      date,
      category,
      amount: Number(amount),
      paymentSource,
      paidTo: paidTo.trim() || 'General Expense',
      notes: notes.trim()
    };

    onAddExpense(newExp);
    setShowAddModal(false);
    // Reset
    setAmount(500);
    setPaidTo('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg space-y-1 transition">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Total Shop Expenses</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">₹{totalExpenseAmount.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">{expenses.length} Expense Vouchers</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg space-y-1 transition">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Paid from Cash Drawer (रोकड़)</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-300 font-mono">₹{totalCashExpenses.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-amber-600 dark:text-amber-500/80 font-medium">Physical cash disbursed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg space-y-1 transition">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Paid from Bank A/C (ऑनलाइन)</span>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-300 font-mono">₹{totalBankExpenses.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-blue-600 dark:text-blue-400/80 font-medium">SBI NetBanking / UPI</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg flex items-center justify-between transition">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Daily Quick Record</span>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Chai, buffing, staff salary or bills</p>
          </div>
          <button
            onClick={() => {
              setVoucherNo(`EXP-2026-${String(expenses.length + 45).padStart(4, '0')}`);
              setShowAddModal(true);
            }}
            className="p-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl shadow-md transition cursor-pointer"
            title="Add Expense"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Control Bar: Filters & Action Button */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm dark:shadow-lg transition">
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Expense Heads (सभी खर्चे)</option>
            {expenseCategories.map((c, i) => (
              <option key={i} value={c}>{c}</option>
            ))}
          </select>

          {/* Payment Source Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-300 dark:border-slate-800 text-xs overflow-x-auto">
            {(['All', 'Cash in Hand', 'Bank Account'] as const).map(src => (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${sourceFilter === src ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                {src === 'All' ? 'All Sources' : src === 'Cash in Hand' ? 'Cash (गल्ला)' : 'Bank (बैंक)'}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="text"
              placeholder="Search paid to, voucher or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 w-56 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <button
          onClick={() => {
            setVoucherNo(`EXP-2026-${String(expenses.length + 45).padStart(4, '0')}`);
            setShowAddModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Enter Shop Expense (दुकान खर्चा दर्ज करें)
        </button>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Voucher No & Date</th>
                <th className="py-3 px-4">Expense Head / Category</th>
                <th className="py-3 px-4">Paid To (व्यक्ति / फर्म)</th>
                <th className="py-3 px-4">Payment Source</th>
                <th className="py-3 px-4">Description / Notes</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No expense vouchers found matching filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block">{exp.voucherNo}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">{exp.date}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900 dark:text-slate-200 block">{exp.category}</span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {exp.paidTo}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        exp.paymentSource === 'Cash in Hand'
                          ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20'
                          : 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-500/20'
                      }`}>
                        {exp.paymentSource === 'Cash in Hand' ? <Wallet className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
                        {exp.paymentSource}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                      {exp.notes || '-'}
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Delete voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Expense Voucher */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <ReceiptText className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                Record Shop Expense (दुकान खर्चा)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Voucher No.</label>
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-amber-700 dark:text-amber-300 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Expense Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                >
                  {expenseCategories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-rose-600 dark:text-rose-400 font-mono font-black text-sm focus:outline-none focus:border-rose-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Paid From *</label>
                  <select
                    value={paymentSource}
                    onChange={(e) => setPaymentSource(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-200 font-medium"
                  >
                    <option value="Cash in Hand">Cash in Hand (गल्ला रोकड़)</option>
                    <option value="Bank Account">Bank A/C (SBI Current)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Paid To (Receiver Name / Vendor) *</label>
                <input
                  type="text"
                  placeholder="e.g. Pandit Ji Chai, Electrician or Staff Name"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Description / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. July electricity bill or Ultrasonic polishing kit"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition cursor-pointer"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
