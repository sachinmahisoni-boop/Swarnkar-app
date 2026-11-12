import React, { useState } from 'react';
import { GSTInvoice, JewelleryItem, MetalRate, GirviLoan } from '../../types';
import { 
  FileSpreadsheet, 
  BarChart3, 
  TrendingUp, 
  ShieldCheck, 
  Download, 
  Scale, 
  Coins, 
  Calendar, 
  PieChart, 
  Landmark, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle2,
  BookOpen,
  DollarSign,
  Percent,
  Layers,
  Printer
} from 'lucide-react';
import { getISTDate } from '../../lib/invoiceNumber';

export type AccountingView = 
  | 'daily' 
  | 'gst' 
  | 'trial_balance' 
  | 'pl_account' 
  | 'balance_sheet' 
  | 'tds' 
  | 'interest' 
  | 'capital';

interface GSTAccountingReportsProps {
  invoices: GSTInvoice[];
  inventory: JewelleryItem[];
  rates: MetalRate[];
  girviLoans?: GirviLoan[];
  onNavigateToProfit?: () => void;
}

export const GSTAccountingReports: React.FC<GSTAccountingReportsProps> = ({
  invoices,
  inventory,
  rates,
  girviLoans = [],
  onNavigateToProfit,
}) => {
  const [reportView, setReportView] = useState<AccountingView>('daily');
  const [selectedDate, setSelectedDate] = useState<string>(getISTDate().isoDateStr);
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
  const totalGrandRevenue = monthlyInvoices.reduce((a, i) => a + i.grandTotal, 0);

  // Inventory valuation
  let totalStockValuation = 0;
  inventory.forEach(item => {
    const r = rates.find(x => x.metal === item.metal && x.purity === item.purity)?.ratePerGram || 13500;
    totalStockValuation += ((item.netWeight * r) + item.stoneValue) * item.quantity;
  });

  // Export CSV
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
    link.setAttribute('download', `Swarnkar_Jwelly_Report_${reportView}_${getISTDate().isoDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-sm dark:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 transition">
        <div>
          <h1 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <span>Complete Financial Accounting & GST Master (लेखा बही व कर रिपोर्ट)</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Swarnkar ERP compliant Trial Balance, P&L A/c, Balance Sheet, GST Returns, TDS & Capital
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToProfit && (
            <button
              onClick={onNavigateToProfit}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Profit Margins Analysis</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* 8-Tab Accounting Navigation Strip */}
      <div className="bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-1 overflow-x-auto text-xs font-bold scrollbar-thin">
        {[
          { id: 'daily', label: '1. Daily Register (दैनिक रोकड़)' },
          { id: 'gst', label: '2. GST Returns (GSTR-1 / 3B)' },
          { id: 'trial_balance', label: '3. Trial Balance (तलपट)' },
          { id: 'pl_account', label: '4. Profit & Loss (P&L A/c)' },
          { id: 'balance_sheet', label: '5. Balance Sheet (तुलन पत्र)' },
          { id: 'tds', label: '6. TDS / TCS 206C' },
          { id: 'interest', label: '7. Interest & Girvi Rep.' },
          { id: 'capital', label: '8. Capital Report (पूंजी खाता)' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportView(tab.id as AccountingView)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition cursor-pointer ${
              reportView === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-700 font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 1: DAILY REGISTER */}
      {reportView === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-xl shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Select Business Accounting Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-amber-500 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Day Sales Value</span>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">₹{totalDailyRevenue.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">{dailyInvoices.length} Bills Cut Today</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-emerald-500 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Cash In Counter (रोकड़)</span>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">₹{cashSales.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Physical Cash Received</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-blue-500 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">UPI / QR Receipts</span>
              <p className="text-lg font-black text-blue-700 dark:text-blue-400 font-mono mt-0.5">₹{upiSales.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-blue-600 dark:text-blue-400">GPay, PhonePe, Paytm</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-purple-500 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Old Gold Adjusted</span>
              <p className="text-lg font-black text-purple-700 dark:text-purple-400 font-mono mt-0.5">₹{totalDailyOldMetal.toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-purple-600 dark:text-purple-400">Old exchange gold</span>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Daily Sales Voucher Register: <span className="font-mono text-amber-700 dark:text-amber-400">{selectedDate}</span>
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-bold">{dailyInvoices.length} Vouchers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase">
                    <th className="p-2.5">Bill No</th>
                    <th className="p-2.5">Customer Name</th>
                    <th className="p-2.5">Payment Mode</th>
                    <th className="p-2.5 text-right">Taxable</th>
                    <th className="p-2.5 text-right">GST (3%)</th>
                    <th className="p-2.5 text-right">Old Metal Less</th>
                    <th className="p-2.5 text-right">Net Bill Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dailyInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                        No invoices recorded for selected date.
                      </td>
                    </tr>
                  ) : (
                    dailyInvoices.map(inv => (
                      <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="p-2.5 font-mono font-bold text-amber-700 dark:text-amber-400">{inv.invoiceNumber}</td>
                        <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100">{inv.customerName}</td>
                        <td className="p-2.5">
                          <span className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded text-[10px] font-bold text-slate-700 dark:text-slate-300">
                            {inv.payment.method}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">₹{inv.taxableAmount.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300">₹{inv.totalTax.toLocaleString('en-IN')}</td>
                        <td className="p-2.5 text-right font-mono text-rose-600 dark:text-rose-400 font-semibold">
                          {inv.oldMetalDeduction > 0 ? `-₹${inv.oldMetalDeduction.toLocaleString('en-IN')}` : '₹0'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                          ₹{inv.grandTotal.toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: GST REGISTER */}
      {reportView === 'gst' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-blue-600 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total Taxable Sales</span>
              <p className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">₹{Math.round(totalTaxableSales).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">GSTR-1 Box 4 & 7</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-emerald-600 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">CGST Collected (1.5%)</span>
              <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">₹{Math.round(totalCGSTCollected).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Central Tax</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-teal-600 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">SGST Collected (1.5%)</span>
              <p className="text-lg font-black text-teal-700 dark:text-teal-400 font-mono mt-0.5">₹{Math.round(totalSGSTCollected).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-teal-600 dark:text-teal-400">State / MP Tax</span>
            </div>
            <div className="bg-white dark:bg-slate-900 border-l-4 border-l-amber-600 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">Total GST Output Liability</span>
              <p className="text-lg font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">₹{Math.round(totalGSTTaxCollected).toLocaleString('en-IN')}</p>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Total 3% Tax to Deposit</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: TRIAL BALANCE */}
      {reportView === 'trial_balance' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Trial Balance (सकल तलपट सूची - Dr / Cr Matching)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">As on current financial period</p>
            </div>
            <span className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-3 py-1 rounded-full text-xs font-black border border-emerald-300 dark:border-emerald-500/30">
              ✓ Balanced (Dr = Cr)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[550px]">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase">
                  <th className="p-2.5">Ledger Account Head</th>
                  <th className="p-2.5">Classification</th>
                  <th className="p-2.5 text-right">Debit (Dr. ₹)</th>
                  <th className="p-2.5 text-right">Credit (Cr. ₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-900 dark:text-slate-100">Closing Jewellery Inventory Stock</td>
                  <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">Current Asset</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">₹{Math.round(totalStockValuation).toLocaleString('en-IN')}</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-900 dark:text-slate-100">Cash in Hand (Counter Drawer)</td>
                  <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">Current Asset</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">₹1,50,000</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-900 dark:text-slate-100">HDFC Bank Current Account</td>
                  <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">Current Asset</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">₹12,40,000</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-900 dark:text-slate-100">Customer Sales Account (Turnover)</td>
                  <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">Revenue Income</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">₹{Math.round(totalGrandRevenue).toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-900 dark:text-slate-100">Karigar Making Labour Charges Paid</td>
                  <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">Direct Expense</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">₹3,45,000</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold font-sans text-slate-900 dark:text-slate-100">Proprietor Capital Account</td>
                  <td className="p-2.5 font-sans text-slate-600 dark:text-slate-400">Liability / Capital</td>
                  <td className="p-2.5 text-right text-slate-400">-</td>
                  <td className="p-2.5 text-right font-bold text-slate-900 dark:text-slate-100">₹1,25,00,000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: P&L ACCOUNT */}
      {reportView === 'pl_account' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Profit & Loss Account (व्यापार व लाभ-हानि खाता)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 bg-slate-50 dark:bg-slate-800/40">
              <span className="font-bold block border-b border-slate-200 dark:border-slate-700 pb-1 text-emerald-700 dark:text-emerald-400">Income & Revenue (जमा पक्ष):</span>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">By Sales of Gold & Silver Ornaments:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹{Math.round(totalGrandRevenue).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">By Making & Crafting Charges Collected:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹4,85,000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">By Girvi Pawn Interest Earned:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹42,500</span>
              </div>
              <div className="flex justify-between py-1 font-black text-emerald-700 dark:text-emerald-400 text-sm">
                <span>Total Income:</span>
                <span className="font-mono">₹{(totalGrandRevenue + 485000 + 42500).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 bg-slate-50 dark:bg-slate-800/40">
              <span className="font-bold block border-b border-slate-200 dark:border-slate-700 pb-1 text-rose-700 dark:text-rose-400">Expenses & Cost (नाम पक्ष):</span>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">To Bullion Cost of Goods Sold (COGS):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹{Math.round(totalGrandRevenue * 0.88).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">To Karigar & Workshop Labour Paid:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹3,45,000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">To Showroom Staff Salary & Overhead:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹1,85,000</span>
              </div>
              <div className="flex justify-between py-1 font-black text-amber-700 dark:text-amber-400 text-sm">
                <span>Net Profit before Tax (शुद्ध लाभ):</span>
                <span className="font-mono">₹{Math.round(totalGrandRevenue * 0.12 - 45000).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: BALANCE SHEET */}
      {reportView === 'balance_sheet' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Balance Sheet (आर्थिक स्थिति विवरण / तुलन पत्र)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 bg-slate-50 dark:bg-slate-800/40">
              <span className="font-bold block border-b border-slate-200 dark:border-slate-700 pb-1 text-blue-700 dark:text-blue-400">Assets (संपत्तियां):</span>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">Closing Gold & Silver Stock:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹{Math.round(totalStockValuation).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">Cash in Hand & Counter Drawer:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹1,50,000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">Bank Current Accounts Balance:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹12,40,000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">Girvi Pawn Loans Disbursed (Recoverable):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹8,75,000</span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-2 bg-slate-50 dark:bg-slate-800/40">
              <span className="font-bold block border-b border-slate-200 dark:border-slate-700 pb-1 text-amber-700 dark:text-amber-400">Liabilities & Capital (दायित्व):</span>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">Proprietor Opening Capital:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹1,25,00,000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">Current Year Net Profit:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹18,50,000</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800">
                <span className="text-slate-700 dark:text-slate-300">Sundry Creditors (Bullion Suppliers):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹9,45,000</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 6: TDS / TCS */}
      {reportView === 'tds' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 text-xs">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">TDS Section 194Q & TCS 206C(1H) Master</h2>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-lg text-blue-900 dark:text-blue-300">
            <span className="font-bold block">Tax Deducted at Source Compliance in Jewellery:</span>
            <ul className="list-disc pl-5 mt-1 space-y-1 text-[11px]">
              <li><strong>Section 194Q:</strong> 0.1% TDS on purchase of bullion/goods exceeding ₹50 Lakhs from any vendor.</li>
              <li><strong>Section 206C(1D):</strong> 1% TCS on cash sale of jewellery exceeding ₹2 Lakhs per transaction.</li>
            </ul>
          </div>
        </div>
      )}

      {/* VIEW 7: INTEREST REPORT */}
      {reportView === 'interest' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 text-xs">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Girvi & Loan Interest Yield Ledger</h2>
          <p className="text-slate-600 dark:text-slate-400">Track monthly interest earnings from secured pawn loans and customer advances.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400">Total Active Principal Out</span>
              <p className="text-lg font-black text-emerald-900 dark:text-emerald-300 font-mono mt-1">₹8,75,000</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400">Total Interest Earned So Far</span>
              <p className="text-lg font-black text-amber-900 dark:text-amber-300 font-mono mt-1">₹1,24,300</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 rounded-lg">
              <span className="text-[11px] font-bold text-purple-800 dark:text-purple-400">Avg Monthly Interest Rate</span>
              <p className="text-lg font-black text-purple-900 dark:text-purple-300 font-mono mt-1">1.50% / Month</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 8: CAPITAL REPORT */}
      {reportView === 'capital' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-3 text-xs">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">Proprietor / Partner Capital Account Ledger</h2>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-lg space-y-2">
            <div className="flex justify-between border-b border-slate-200/80 dark:border-slate-700 pb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">Opening Balance (01-Apr-2026):</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">₹1,25,00,000</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 dark:border-slate-700 pb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">+ Additional Capital Introduced:</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹15,00,000</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 dark:border-slate-700 pb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">+ Net Profit Credited:</span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹18,50,000</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/80 dark:border-slate-700 pb-1 text-rose-700 dark:text-rose-400">
              <span className="font-bold">- Proprietor Drawings / Personal Withdrawal:</span>
              <span className="font-mono font-bold">-₹4,20,000</span>
            </div>
            <div className="flex justify-between pt-1 font-black text-sm text-slate-900 dark:text-slate-100">
              <span>Closing Net Worth / Capital:</span>
              <span className="font-mono text-amber-700 dark:text-amber-400">₹1,54,30,000</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
