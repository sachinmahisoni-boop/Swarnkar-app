import React, { useState } from 'react';
import { GirviLoan, PledgedItem, MetalType } from '../../types';
import { ShreemLogo } from '../ShreemLogo';
import { Landmark, Plus, Search, Calendar, Calculator, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Printer, X, ArrowUpRight, Scale, Share2 } from 'lucide-react';
import { getISTDate } from '../../lib/invoiceNumber';

interface GirviLedgerProps {
  loans: GirviLoan[];
  onAddLoan: (loan: GirviLoan) => void;
  onUpdateLoan: (loan: GirviLoan) => void;
}

export const GirviLedger: React.FC<GirviLedgerProps> = ({
  loans,
  onAddLoan,
  onUpdateLoan,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Overdue' | 'Redeemed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showNewLoanModal, setShowNewLoanModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showCalcModal, setShowCalcModal] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<GirviLoan | null>(null);
  const [printLoan, setPrintLoan] = useState<GirviLoan | null>(null);

  // New Loan Form State
  const [borrowerName, setBorrowerName] = useState('');
  const [borrowerPhone, setBorrowerPhone] = useState('');
  const [borrowerAddress, setBorrowerAddress] = useState('');
  const [borrowerAadhaar, setBorrowerAadhaar] = useState('');
  const [pledgedItems, setPledgedItems] = useState<PledgedItem[]>([
    {
      description: '22K Gold Chain with Locket',
      metal: 'Gold',
      purity: '22K',
      quantity: 1,
      grossWeight: 14.50,
      netWeight: 14.50,
      estimatedMarketRate: 6900,
      valuationAmount: 100050
    }
  ]);
  const [principalAmount, setPrincipalAmount] = useState<number>(65000);
  const [monthlyInterestRate, setMonthlyInterestRate] = useState<number>(1.75); // 1.75% per month
  const [tenureMonths, setTenureMonths] = useState<number>(12);
  const [vaultNotes, setVaultNotes] = useState('Packet sealed in Vault Locker No. 2');

  // Settlement Form State
  const [repayInterest, setRepayInterest] = useState<number>(0);
  const [repayPrincipal, setRepayPrincipal] = useState<number>(0);

  // Quick Calculator State
  const [calcPrincipal, setCalcPrincipal] = useState<number>(50000);
  const [calcRate, setCalcRate] = useState<number>(2.0);
  const [calcMonths, setCalcMonths] = useState<number>(6);

  // Dynamic calculations
  const calculateTotalInterestAccrued = (loan: GirviLoan) => {
    const startDate = new Date(loan.date);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const elapsedMonths = Math.max(1, diffDays / 30);
    const interest = loan.principalAmount * (loan.monthlyInterestRate / 100) * elapsedMonths;
    return Math.round(interest);
  };

  // Aggregates
  const activeLoans = loans.filter(l => l.status === 'Active' || l.status === 'Overdue');
  const totalPrincipalOut = activeLoans.reduce((sum, l) => sum + l.balanceDue, 0);
  const totalGoldWeight = activeLoans.reduce((sum, l) => sum + l.items.filter(i => i.metal === 'Gold').reduce((s, i) => s + i.netWeight, 0), 0);
  const totalSilverWeight = activeLoans.reduce((sum, l) => sum + l.items.filter(i => i.metal === 'Silver').reduce((s, i) => s + i.netWeight, 0), 0);
  const totalEstimatedInterest = activeLoans.reduce((sum, l) => sum + calculateTotalInterestAccrued(l), 0);

  // Filtered Loans
  const filteredLoans = loans.filter(loan => {
    const matchStatus = statusFilter === 'all' || loan.status === statusFilter;
    const matchSearch = loan.loanNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loan.borrowerPhone.includes(searchQuery);
    return matchStatus && matchSearch;
  });

  const handleAddItemToPledge = () => {
    setPledgedItems(prev => [
      ...prev,
      {
        description: 'Gold Ornament',
        metal: 'Gold',
        purity: '22K',
        quantity: 1,
        grossWeight: 10.0,
        netWeight: 10.0,
        estimatedMarketRate: 6900,
        valuationAmount: 69000
      }
    ]);
  };

  const handleCreateLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowerName.trim()) return;

    const totalGross = pledgedItems.reduce((s, i) => s + i.grossWeight, 0);
    const totalNet = pledgedItems.reduce((s, i) => s + i.netWeight, 0);
    const totalVal = pledgedItems.reduce((s, i) => s + i.valuationAmount, 0);

    const newLoan: GirviLoan = {
      id: `grv-${Date.now()}`,
      loanNo: `GRV-2026-${String(loans.length + 36).padStart(3, '0')}`,
      date: getISTDate().isoDateStr,
      borrowerName: borrowerName.trim(),
      borrowerPhone: borrowerPhone.trim(),
      borrowerAddress: borrowerAddress.trim(),
      borrowerAadhaar: borrowerAadhaar.trim(),
      items: pledgedItems,
      totalGrossWeight: totalGross,
      totalNetWeight: totalNet,
      totalValuation: totalVal,
      principalAmount: Number(principalAmount),
      monthlyInterestRate: Number(monthlyInterestRate),
      tenureMonths: Number(tenureMonths),
      status: 'Active',
      interestPaidSoFar: 0,
      principalPaid: 0,
      balanceDue: Number(principalAmount),
      notes: vaultNotes
    };

    onAddLoan(newLoan);
    setShowNewLoanModal(false);
    setBorrowerName('');
    setBorrowerPhone('');
    setBorrowerAddress('');
    setBorrowerAadhaar('');
  };

  const handleRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;

    const newInterestPaid = selectedLoan.interestPaidSoFar + Number(repayInterest);
    const newPrincipalPaid = selectedLoan.principalPaid + Number(repayPrincipal);
    const newBalance = Math.max(0, selectedLoan.principalAmount - newPrincipalPaid);

    const updated: GirviLoan = {
      ...selectedLoan,
      interestPaidSoFar: newInterestPaid,
      principalPaid: newPrincipalPaid,
      balanceDue: newBalance,
      status: newBalance <= 0 ? 'Redeemed' : 'Active',
      redeemedDate: newBalance <= 0 ? getISTDate().isoDateStr : undefined
    };

    onUpdateLoan(updated);
    setShowRedeemModal(false);
    setSelectedLoan(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-lg transition">
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-500/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Principal Loan Book (गिरवी)</p>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-300 font-mono">₹{totalPrincipalOut.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-amber-600 dark:text-amber-500/80 font-medium">{activeLoans.length} Active Pawn Accounts</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-lg transition">
          <div className="p-3 bg-amber-600/10 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-600/20">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Gold Pledged in Vault</p>
            <h3 className="text-xl font-black text-amber-600 dark:text-amber-300 font-mono">{totalGoldWeight.toFixed(2)} g</h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Security ornament weight</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-lg transition">
          <div className="p-3 bg-slate-100 dark:bg-slate-700/40 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-300 dark:border-slate-600/30">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Silver Pledged in Vault</p>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono">{totalSilverWeight.toFixed(2)} g</h3>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Payal / coins security</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-sm dark:shadow-lg transition">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/20">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Interest Accrued to Date</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-300 font-mono">₹{totalEstimatedInterest.toLocaleString('en-IN')}</h3>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400/80 font-medium">Monthly compounding rate</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm dark:shadow-lg transition">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs overflow-x-auto">
            {(['all', 'Active', 'Overdue', 'Redeemed'] as const).map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg font-bold transition capitalize cursor-pointer ${statusFilter === st ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                {st === 'all' ? 'All Loans (सब)' : st}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search borrower or loan no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 w-56 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCalcModal(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-amber-500" />
            Interest Calculator (ब्याज कैलक्यूलेटर)
          </button>
          <button
            onClick={() => setShowNewLoanModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + New Girvi Loan (नई गिरवी)
          </button>
        </div>
      </div>

      {/* Main Table: Girvi Register */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-xl transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Loan No & Date</th>
                <th className="py-3 px-4">Borrower Name (ग्राहक)</th>
                <th className="py-3 px-4">Pledged Ornaments (बंधक आभूषण)</th>
                <th className="py-3 px-4">Net Weight</th>
                <th className="py-3 px-4">Principal Loan</th>
                <th className="py-3 px-4">Rate % / Mo</th>
                <th className="py-3 px-4">Interest Accrued</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    No Girvi loan accounts found matching the filter.
                  </td>
                </tr>
              ) : (
                filteredLoans.map(loan => {
                  const accrued = calculateTotalInterestAccrued(loan);
                  const isClosed = loan.status === 'Redeemed';

                  return (
                    <tr key={loan.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-300 block">{loan.loanNo}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">{loan.date}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-slate-200">{loan.borrowerName}</p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{loan.borrowerPhone}</span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-700 dark:text-slate-300 line-clamp-1">
                          {loan.items.map(i => `${i.description} (${i.grossWeight}g)`).join(', ')}
                        </p>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Valuation: ₹{loan.totalValuation.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {loan.totalNetWeight.toFixed(2)} g
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400 block">
                          ₹{loan.principalAmount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Bal: ₹{loan.balanceDue.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {loan.monthlyInterestRate}% / mo
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                          ₹{isClosed ? loan.interestPaidSoFar.toLocaleString('en-IN') : accrued.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Paid: ₹{loan.interestPaidSoFar.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          loan.status === 'Redeemed'
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20'
                            : loan.status === 'Overdue'
                            ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-800 dark:text-rose-400 border border-rose-300 dark:border-rose-500/20'
                            : 'bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20'
                        }`}>
                          {loan.status === 'Redeemed' && <CheckCircle2 className="w-3 h-3" />}
                          {loan.status === 'Overdue' && <AlertTriangle className="w-3 h-3" />}
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                        {loan.status !== 'Redeemed' && (
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setRepayInterest(accrued - loan.interestPaidSoFar);
                              setRepayPrincipal(loan.balanceDue);
                              setShowRedeemModal(true);
                            }}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition shadow-sm cursor-pointer"
                            title="Settle / Redeem Pawn Loan"
                          >
                            Redeem
                          </button>
                        )}
                        <button
                          onClick={() => setPrintLoan(loan)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[11px] border border-slate-300 dark:border-slate-700 transition cursor-pointer"
                          title="Print Girvi Parcha"
                        >
                          <Printer className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: New Girvi Loan */}
      {showNewLoanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-500" /> New Girvi / Pawn Loan (गिरवी खाता)
              </h3>
              <button 
                onClick={() => setShowNewLoanModal(false)} 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLoan} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Borrower Full Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Chandra Sharma"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 9826012345"
                    value={borrowerPhone}
                    onChange={(e) => setBorrowerPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Aadhaar Card No. *</label>
                  <input
                    type="text"
                    placeholder="e.g. 7821-4920-1123"
                    value={borrowerAadhaar}
                    onChange={(e) => setBorrowerAadhaar(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Residential Address *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mandakini Colony, Kolar Road, Bhopal"
                    value={borrowerAddress}
                    onChange={(e) => setBorrowerAddress(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Pledged Ornaments Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700 dark:text-amber-300">Pledged Security Ornaments (बंधक सामान)</span>
                  <button
                    type="button"
                    onClick={handleAddItemToPledge}
                    className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold cursor-pointer"
                  >
                    + Add Item
                  </button>
                </div>

                {pledgedItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-white dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700/50">
                    <div className="col-span-5">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPledgedItems(prev => prev.map((it, i) => i === idx ? { ...it, description: val } : it));
                        }}
                        placeholder="Description (e.g. 22K Gold Chain)"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-slate-200 text-xs"
                      />
                    </div>
                    <div className="col-span-2">
                      <select
                        value={item.metal}
                        onChange={(e) => {
                          const m = e.target.value as MetalType;
                          setPledgedItems(prev => prev.map((it, i) => i === idx ? { ...it, metal: m } : it));
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-slate-200 text-xs"
                      >
                        <option value="Gold">Gold</option>
                        <option value="Silver">Silver</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        value={item.grossWeight}
                        onChange={(e) => {
                          const gw = parseFloat(e.target.value) || 0;
                          setPledgedItems(prev => prev.map((it, i) => i === idx ? { ...it, grossWeight: gw, netWeight: gw, valuationAmount: gw * it.estimatedMarketRate } : it));
                        }}
                        placeholder="Weight (g)"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-slate-200 text-xs font-mono font-bold"
                      />
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.valuationAmount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPledgedItems(prev => prev.map((it, i) => i === idx ? { ...it, valuationAmount: val } : it));
                        }}
                        placeholder="Valuation (₹)"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-amber-700 dark:text-amber-400 font-bold text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Loan Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Loan Principal (₹) *</label>
                  <input
                    type="number"
                    value={principalAmount}
                    onChange={(e) => setPrincipalAmount(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-amber-700 dark:text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Monthly Interest % *</label>
                  <input
                    type="number"
                    step="0.05"
                    value={monthlyInterestRate}
                    onChange={(e) => setMonthlyInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Tenure (Months)</label>
                  <input
                    type="number"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(parseInt(e.target.value) || 12)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Vault Locker No & Packet Details</label>
                <input
                  type="text"
                  value={vaultNotes}
                  onChange={(e) => setVaultNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewLoanModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Create Girvi Loan Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Redeem / Settlement */}
      {showRedeemModal && selectedLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Redeem Pawn Loan (बंधक छुड़ाना)</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">{selectedLoan.loanNo} • {selectedLoan.borrowerName}</p>
              </div>
              <button 
                onClick={() => setShowRedeemModal(false)} 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRedeemSubmit} className="space-y-4 mt-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Principal Balance:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹{selectedLoan.balanceDue.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Monthly Rate:</span>
                  <span className="font-mono text-amber-700 dark:text-amber-300 font-semibold">{selectedLoan.monthlyInterestRate}% / month</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-800 dark:text-slate-300 font-bold">Total Estimated Due:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                    ₹{(selectedLoan.balanceDue + Math.max(0, calculateTotalInterestAccrued(selectedLoan) - selectedLoan.interestPaidSoFar)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Interest Amount Paying (₹)</label>
                <input
                  type="number"
                  value={repayInterest}
                  onChange={(e) => setRepayInterest(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Principal Amount Paying (₹)</label>
                <input
                  type="number"
                  value={repayPrincipal}
                  onChange={(e) => setRepayPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-amber-600 dark:text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  Confirm Payment & Release Ornament
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Interactive Interest Calculator */}
      {showCalcModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Calculator className="w-5 h-5 text-amber-500" /> Girvi Interest Calculator
              </h3>
              <button 
                onClick={() => setShowCalcModal(false)} 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Principal Loan Amount (मूलधन ₹)</label>
                <input
                  type="number"
                  value={calcPrincipal}
                  onChange={(e) => setCalcPrincipal(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-amber-700 dark:text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Interest Rate (% per month)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calcRate}
                    onChange={(e) => setCalcRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Duration (Months)</label>
                  <input
                    type="number"
                    value={calcMonths}
                    onChange={(e) => setCalcMonths(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Calculator Output */}
              <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Monthly Interest:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">₹{Math.round(calcPrincipal * (calcRate / 100)).toLocaleString('en-IN')} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Interest for {calcMonths} months:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">₹{Math.round(calcPrincipal * (calcRate / 100) * calcMonths).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-amber-200 dark:border-amber-500/20 text-sm">
                  <span className="font-bold text-slate-800 dark:text-slate-200">Total Payable to Release:</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                    ₹{Math.round(calcPrincipal + (calcPrincipal * (calcRate / 100) * calcMonths)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowCalcModal(false)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Print Girvi Parcha (बंधक पत्र / रसीद) */}
      {printLoan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <ShreemLogo size="sm" showText={true} />
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-700">GIRVI RECEIPT (बंधक पत्र)</span>
                <span className="block font-mono font-black text-amber-900">{printLoan.loanNo}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Borrower: <strong>{printLoan.borrowerName}</strong></span>
                <span>Date: <strong>{printLoan.date}</strong></span>
              </div>
              <div className="flex justify-between">
                <span>Phone: <strong>{printLoan.borrowerPhone}</strong></span>
                <span>Aadhaar: <strong>{printLoan.borrowerAadhaar}</strong></span>
              </div>
              <p className="text-slate-600">Address: {printLoan.borrowerAddress}</p>

              <div className="border border-slate-300 rounded-xl overflow-hidden mt-2">
                <div className="bg-slate-100 p-2 font-bold flex justify-between">
                  <span>Pledged Ornament</span>
                  <span>Gross / Net Wt</span>
                </div>
                <div className="p-2 divide-y space-y-1">
                  {printLoan.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between pt-1">
                      <span>{it.description} ({it.purity} {it.metal})</span>
                      <span className="font-mono font-bold">{it.grossWeight.toFixed(2)}g / {it.netWeight.toFixed(2)}g</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex justify-between font-mono">
                <div>
                  <span className="text-slate-600 block text-[10px]">Principal Loan:</span>
                  <span className="font-bold text-sm text-slate-900">₹{printLoan.principalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">Monthly Interest:</span>
                  <span className="font-bold text-sm text-amber-800">{printLoan.monthlyInterestRate}% / mo</span>
                </div>
                <div>
                  <span className="text-slate-600 block text-[10px]">Tenure:</span>
                  <span className="font-bold text-sm text-slate-900">{printLoan.tenureMonths} Months</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 italic">
                * Note: Goods pledged are held safely in insurance-protected bank vault. Failure to pay interest for 12 months will result in auction as per local Sarafa laws.
              </p>
            </div>

            <div className="border-t pt-4 flex justify-between items-center text-xs">
              <div className="text-center">
                <div className="w-24 border-b border-slate-400 mb-1"></div>
                <span className="text-[10px] text-slate-500">Borrower Signature</span>
              </div>
              <div className="text-center">
                <div className="w-24 border-b border-slate-400 mb-1"></div>
                <span className="text-[10px] text-slate-500">For Shreem Mahal Jewellers</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t print:hidden">
              <button
                onClick={() => setPrintLoan(null)}
                className="px-4 py-1.5 bg-slate-200 text-slate-800 font-bold rounded-lg text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (!printLoan) return;
                  const message = `*श्रीः | SHREEM MAHAL JEWELLERS, BHOPAL*\n*GIRVI RECEIPT (गिरवी बंधक पत्र)*\n--------------------------------\nLoan No: ${printLoan.loanNo}\nCustomer: ${printLoan.borrowerName}\nPhone: ${printLoan.borrowerPhone}\nDate: ${printLoan.date}\n\n*Pledged Ornaments:*\n${printLoan.items.map(it => `• ${it.description} (${it.grossWeight}g / ${it.purity})`).join('\n')}\n\n*Loan Details:*\n• Principal Loan: ₹${printLoan.principalAmount.toLocaleString('en-IN')}\n• Monthly Interest: ${printLoan.monthlyInterestRate}% / mo\n• Balance Due: ₹${printLoan.balanceDue.toLocaleString('en-IN')}\n\nShop No 6, Ground Floor, Saideep Plaza, DK 2, Kolar, Bhopal - 462042\nMob: +91 9202357851`;
                  const cleanPhone = printLoan.borrowerPhone.replace(/[^0-9]/g, '');
                  const url = `https://wa.me/${cleanPhone.length === 10 ? '91' + cleanPhone : cleanPhone}?text=${encodeURIComponent(message)}`;
                  window.open(url, '_blank');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition"
                title="Send Girvi Parcha to Customer WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Print Parcha
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
