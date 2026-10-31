import React, { useState } from 'react';
import { GSTInvoice, JewelleryItem, MetalRate, GirviLoan } from '../../types';
import { FileSpreadsheet, BarChart3, TrendingUp, ShieldCheck, Download, Scale, Coins, Calendar, PieChart, Landmark, ArrowDownRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface GSTAccountingReportsProps {
  invoices: GSTInvoice[];
  inventory: JewelleryItem[];
  rates: MetalRate[];
  girviLoans?: GirviLoan[];
}

export const GSTAccountingReports: React.FC<GSTAccountingReportsProps> = ({
  invoices,
  inventory,
  rates,
  girviLoans = [],
}) => {
  const [reportView, setReportView] = useState<'daily' | 'gst'>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState('All');

  // Filter invoices for Daily view or Monthly view
  const dailyInvoices = invoices.filter(inv => inv.date === selectedDate);
  const monthlyInvoices = invoices.filter(inv => {
    if (selectedMonth === 'All') return true;
    return inv.date.startsWith(selectedMonth);
  });

  const activeInvoices = reportView === 'daily' ? dailyInvoices : monthlyInvoices;

  // Daily Ledger Breakdown
  const cashSales = dailyInvoices.filter(i => i.payment.method === 'Cash').reduce((s, i) => s + i.payment.amountPaid, 0);
  const upiSales = dailyInvoices.filter(i => i.payment.method === 'UPI/GPay').reduce((s, i) => s + i.payment.amountPaid, 0);
  const cardBankSales = dailyInvoices.filter(i => i.payment.method === 'Card' || i.payment.method === 'Bank Transfer').reduce((s, i) => s + i.payment.amountPaid, 0);
  const totalDailyRevenue = dailyInvoices.reduce((s, i) => s + i.grandTotal, 0);
  const totalDailyOldMetal = dailyInvoices.reduce((s, i) => s + i.oldMetalDeduction, 0);

  // Daily Girvi summary
  const dailyGirviDisbursed = girviLoans.filter(g => g.date === selectedDate).reduce((s, g) => s + g.principalAmount, 0);
  const dailyGirviInterestCollected = girviLoans.filter(g => g.date === selectedDate).reduce((s, g) => s + g.interestPaidSoFar, 0);

  // GST Return Metrics (GSTR-1)
  const b2bInvoices = monthlyInvoices.filter(i => !!i.customerGSTIN);
  const b2cInvoices = monthlyInvoices.filter(i => !i.customerGSTIN);

  const b2bTaxable = b2bInvoices.reduce((a, i) => a + i.taxableAmount, 0);
  const b2bTax = b2bInvoices.reduce((a, i) => a + i.totalTax, 0);

  const b2cTaxable = b2cInvoices.reduce((a, i) => a + i.taxableAmount, 0);
  const b2cTax = b2cInvoices.reduce((a, i) => a + i.totalTax, 0);

  const totalTaxableSales = monthlyInvoices.reduce((a, i) => a + i.taxableAmount, 0);
  const totalCGSTCollected = monthlyInvoices.reduce((a, i) => a + i.cgstAmount, 0);
  const totalSGSTCollected = monthlyInvoices.reduce((a, i) => a + i.sgstAmount, 0);
  const totalIGSTCollected = monthlyInvoices.reduce((a, i) => a + i.igstAmount, 0);
  const totalGSTTaxCollected = totalCGSTCollected + totalSGSTCollected + totalIGSTCollected;
  const totalOldMetalExchanged = monthlyInvoices.reduce((a, i) => a + i.oldMetalDeduction, 0);
  const totalGrandRevenue = monthlyInvoices.reduce((a, i) => a + i.grandTotal, 0);

  const handleExportCSV = () => {
    const csvContent = [
      ['Invoice Number', 'Type', 'Date', 'Customer', 'GSTIN', 'Taxable Amount', 'CGST', 'SGST', 'IGST', 'Total Tax', 'Grand Total', 'Status'].join(','),
      ...activeInvoices.map(i => [
        i.invoiceNumber,
        i.invoiceType,
        i.date,
        `"${i.customerName}"`,
        i.customerGSTIN || 'B2C',
        i.taxableAmount,
        i.cgstAmount,
        i.sgstAmount,
        i.igstAmount,
        i.totalTax,
        i.grandTotal,
        i.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Shreem_Mahal_${reportView}_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Mode Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            Daily Sales Ledger & GST Accounting Register
          </h2>
          <p className="text-xs text-slate-400">
            Shreem Mahal Jewellers ERP • Bhopal Bullion & Counter Day-End Settlement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setReportView('daily')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${reportView === 'daily' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Daily Register (दैनिक रोकड़)
            </button>
            <button
              onClick={() => setReportView('gst')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${reportView === 'gst' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              GST Sales Register (GSTR-1)
            </button>
          </div>

          {reportView === 'daily' ? (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
            />
          ) : (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Invoices</option>
              <option value="2026-10">October 2026</option>
              <option value="2026-09">September 2026</option>
              <option value="2026-08">August 2026</option>
            </select>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Daily Ledger View */}
      {reportView === 'daily' ? (
        <div className="space-y-6">
          {/* Daily 4-Card Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
              <span className="text-xs text-slate-400 font-medium block">Total Day Sales Value</span>
              <p className="text-2xl font-black text-amber-300 font-mono">₹{totalDailyRevenue.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">{dailyInvoices.length} Bills Cut Today</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
              <span className="text-xs text-slate-400 font-medium block">Cash in Drawer (रोकड़)</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">₹{cashSales.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Physical Currency Received</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
              <span className="text-xs text-slate-400 font-medium block">Digital / UPI Receipts</span>
              <p className="text-2xl font-black text-blue-400 font-mono">₹{upiSales.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Bank QR / PhonePe / GPay</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
              <span className="text-xs text-slate-400 font-medium block">Old Metal Exchanged Value</span>
              <p className="text-2xl font-black text-amber-500 font-mono">₹{totalDailyOldMetal.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500">Customer bullion adjusted</span>
            </div>
          </div>

          {/* Daily Transactions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-200">
                Daily Transactions for Date: <strong className="text-amber-300 font-mono">{selectedDate}</strong>
              </span>
              <span className="text-slate-400">Total {dailyInvoices.length} Bills</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-800/40 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-3">Bill No</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Mode</th>
                    <th className="py-2.5 px-3 text-right">Items Subtotal</th>
                    <th className="py-2.5 px-3 text-right">Old Metal Credit</th>
                    <th className="py-2.5 px-3 text-right">Tax (3%)</th>
                    <th className="py-2.5 px-3 text-right">Grand Total</th>
                    <th className="py-2.5 px-3 text-center">Payment</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {dailyInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-500">
                        No transactions registered on {selectedDate}. Use POS Billing Counter to issue invoices.
                      </td>
                    </tr>
                  ) : (
                    dailyInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-300">{inv.invoiceNumber}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-200">{inv.customerName}</td>
                        <td className="py-2.5 px-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${inv.invoiceType === 'GST_INVOICE' ? 'bg-amber-500/10 text-amber-300' : 'bg-slate-800 text-slate-400'}`}>
                            {inv.invoiceType === 'GST_INVOICE' ? 'GST' : 'Estimate'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{inv.itemsSubtotal.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-rose-400">
                          {inv.oldMetalDeduction > 0 ? `-₹${inv.oldMetalDeduction.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-400">₹{inv.totalTax.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">₹{inv.grandTotal.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="font-mono text-[11px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 border border-slate-700">
                            {inv.payment.method}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* GST GSTR-1 View */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-slate-400 text-xs">Total Taxable Sales</span>
              <p className="text-2xl font-black text-amber-300 font-mono">₹{Math.round(totalTaxableSales).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-slate-400 text-xs">Total CGST (1.5%)</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">₹{Math.round(totalCGSTCollected).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-slate-400 text-xs">Total SGST (1.5%)</span>
              <p className="text-2xl font-black text-emerald-400 font-mono">₹{Math.round(totalSGSTCollected).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
              <span className="text-slate-400 text-xs">Gross Revenue Collected</span>
              <p className="text-2xl font-black text-amber-400 font-mono">₹{Math.round(totalGrandRevenue).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-slate-100 text-sm">GSTR-1 Summary Tables (B2B & B2C)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2 text-xs">
                <span className="font-bold text-amber-300 block">Table 4: B2B Invoices (With Registered GSTIN)</span>
                <div className="flex justify-between text-slate-300">
                  <span>Count of Invoices:</span>
                  <span className="font-mono font-bold">{b2bInvoices.length}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-bold">₹{b2bTaxable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Total Tax (3%):</span>
                  <span className="font-mono">₹{b2bTax.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2 text-xs">
                <span className="font-bold text-amber-300 block">Table 7: B2C Small Invoices (Unregistered Retail Walk-in)</span>
                <div className="flex justify-between text-slate-300">
                  <span>Count of Invoices:</span>
                  <span className="font-mono font-bold">{b2cInvoices.length}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Taxable Value:</span>
                  <span className="font-mono font-bold">₹{b2cTaxable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Total Tax (3%):</span>
                  <span className="font-mono">₹{b2cTax.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
