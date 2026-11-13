import React, { useMemo, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  Ban,
  Filter,
  Info,
} from 'lucide-react';
import { GSTInvoice } from '../../types';
import { aggregateHsnSummary, HsnSummaryRow } from '../../lib/gst';
import { getISTDate } from '../../lib/invoiceNumber';

interface HSNSummaryReportProps {
  invoices: GSTInvoice[];
  initialMonth?: string;
}

type BillTypeFilter = 'GST_INVOICE' | 'ALL' | 'ESTIMATE_BILL';

function formatINR(amount: number): string {
  return amount.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const HSNSummaryReport: React.FC<HSNSummaryReportProps> = ({
  invoices,
  initialMonth = 'All',
}) => {
  const [billType, setBillType] = useState<BillTypeFilter>('GST_INVOICE');
  const [selectedMonth, setSelectedMonth] = useState<string>(initialMonth);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    const currentMonth = getISTDate().isoDateStr.slice(0, 7);
    months.add(currentMonth);
    invoices.forEach((inv) => {
      if (inv.date && inv.date.length >= 7) {
        months.add(inv.date.slice(0, 7));
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [invoices]);

  const summary = useMemo(() => {
    return aggregateHsnSummary(invoices, {
      invoiceType: billType,
      monthPrefix: selectedMonth,
    });
  }, [invoices, billType, selectedMonth]);

  const filteredRows: HsnSummaryRow[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return summary.rows;
    return summary.rows.filter(
      (row) =>
        row.hsnCode.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q) ||
        `${row.gstRate}%`.includes(q)
    );
  }, [summary.rows, searchQuery]);

  const displayTotals = useMemo(() => {
    if (!searchQuery.trim()) return summary.totals;
    return filteredRows.reduce(
      (acc, r) => ({
        totalQuantity: acc.totalQuantity + r.totalQuantity,
        totalGrossWeight: Math.round((acc.totalGrossWeight + r.totalGrossWeight) * 1000) / 1000,
        totalNetWeight: Math.round((acc.totalNetWeight + r.totalNetWeight) * 1000) / 1000,
        taxableValue: Math.round((acc.taxableValue + r.taxableValue) * 100) / 100,
        cgstAmount: Math.round((acc.cgstAmount + r.cgstAmount) * 100) / 100,
        sgstAmount: Math.round((acc.sgstAmount + r.sgstAmount) * 100) / 100,
        igstAmount: Math.round((acc.igstAmount + r.igstAmount) * 100) / 100,
        totalTax: Math.round((acc.totalTax + r.totalTax) * 100) / 100,
        totalValue: Math.round((acc.totalValue + r.totalValue) * 100) / 100,
      }),
      {
        totalQuantity: 0,
        totalGrossWeight: 0,
        totalNetWeight: 0,
        taxableValue: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        totalTax: 0,
        totalValue: 0,
      }
    );
  }, [filteredRows, searchQuery, summary.totals]);

  const handleExportHsnCsv = () => {
    const headers = [
      'HSN',
      'Description',
      'UQC',
      'Total Quantity',
      'Total Net Weight (g)',
      'Total Value',
      'Rate (%)',
      'Taxable Value',
      'Integrated Tax Amount (IGST)',
      'Central Tax Amount (CGST)',
      'State/UT Tax Amount (SGST)',
      'Total Tax Amount',
      'Invoices Count',
    ];

    const lines = [
      headers.map(escapeCsvCell).join(','),
      ...filteredRows.map((row) =>
        [
          row.hsnCode,
          row.description,
          row.uqc,
          row.totalQuantity,
          row.totalNetWeight.toFixed(3),
          row.totalValue.toFixed(2),
          row.gstRate.toFixed(2),
          row.taxableValue.toFixed(2),
          row.igstAmount.toFixed(2),
          row.cgstAmount.toFixed(2),
          row.sgstAmount.toFixed(2),
          row.totalTax.toFixed(2),
          row.invoiceCount,
        ]
          .map(escapeCsvCell)
          .join(',')
      ),
    ];

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const periodTag = selectedMonth === 'All' ? 'All_Periods' : selectedMonth;
    link.setAttribute('download', `GSTR1_Table12_HSN_Summary_${periodTag}_${getISTDate().isoDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-800/40">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <FileSpreadsheet className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
              GSTR-1 Table 12: HSN-Wise & Tax Rate Summary (HSN सारांश रिपोर्ट)
            </h2>
          </div>
          <div className="flex items-center gap-3 mt-1 text-[11px] flex-wrap">
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {summary.includedInvoicesCount} Active Invoices Grouped
            </span>
            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold">
              <Ban className="w-3.5 h-3.5 text-rose-500" />
              {summary.excludedCancelledCount} Cancelled Excluded
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bill Type Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              aria-label="Filter by invoice type"
              value={billType}
              onChange={(e) => setBillType(e.target.value as BillTypeFilter)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="GST_INVOICE" className="dark:bg-slate-900">
                GSTR-1 Tax Invoices (Pakka)
              </option>
              <option value="ALL" className="dark:bg-slate-900">
                All Active Bills (GST + Estimate)
              </option>
              <option value="ESTIMATE_BILL" className="dark:bg-slate-900">
                Estimate Bills Only (0%)
              </option>
            </select>
          </div>

          {/* Month Filter */}
          <select
            aria-label="Filter by month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="All">All Months (सभी माह)</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {month}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search HSN / Rate..."
              className="pl-7 pr-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500 w-36 sm:w-44"
            />
          </div>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportHsnCsv}
            disabled={filteredRows.length === 0}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>GSTR-1 HSN CSV</span>
          </button>
        </div>
      </div>

      {/* Mini Reconciliation Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50/40 dark:bg-slate-950/30 border-b border-slate-200 dark:border-slate-800">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            HSN / Rate Groups
          </span>
          <p className="text-base font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5">
            {filteredRows.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Taxable Value (कर योग्य)
          </span>
          <p className="text-base font-black text-blue-700 dark:text-blue-400 font-mono mt-0.5">
            ₹{formatINR(displayTotals.taxableValue)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Total GST (CGST+SGST+IGST)
          </span>
          <p className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
            ₹{formatINR(displayTotals.totalTax)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5">
          <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
            Total Supply Value
          </span>
          <p className="text-base font-black text-amber-700 dark:text-amber-400 font-mono mt-0.5">
            ₹{formatINR(displayTotals.totalValue)}
          </p>
        </div>
      </div>

      {/* HSN Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[880px]">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase">
              <th className="p-2.5">HSN Code</th>
              <th className="p-2.5">Description & UQC</th>
              <th className="p-2.5 text-right">Tax Rate</th>
              <th className="p-2.5 text-right">Qty</th>
              <th className="p-2.5 text-right">Net Wt (g)</th>
              <th className="p-2.5 text-right">Taxable Value</th>
              <th className="p-2.5 text-right">CGST</th>
              <th className="p-2.5 text-right">SGST</th>
              <th className="p-2.5 text-right">IGST</th>
              <th className="p-2.5 text-right">Total Tax</th>
              <th className="p-2.5 text-right">Total Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="text-center py-8 text-slate-500 dark:text-slate-400"
                >
                  No non-cancelled invoices found for the selected HSN filter and period.
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => (
                <tr
                  key={`${row.hsnCode}_${row.gstRate}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                >
                  <td className="p-2.5 align-top">
                    <span className="font-mono font-black text-amber-700 dark:text-amber-400 text-xs">
                      {row.hsnCode}
                    </span>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                      {row.invoiceCount} {row.invoiceCount === 1 ? 'Bill' : 'Bills'}
                    </div>
                  </td>
                  <td className="p-2.5 align-top max-w-[260px]">
                    <div className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {row.description}
                    </div>
                    <span className="inline-block mt-0.5 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                      UQC: {row.uqc}
                    </span>
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200 align-top">
                    {row.gstRate.toFixed(1)}%
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300 align-top">
                    {row.totalQuantity}
                  </td>
                  <td className="p-2.5 text-right font-mono text-slate-700 dark:text-slate-300 align-top">
                    {row.totalNetWeight.toFixed(3)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 align-top">
                    ₹{formatINR(row.taxableValue)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400 align-top">
                    ₹{formatINR(row.cgstAmount)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-teal-700 dark:text-teal-400 align-top">
                    ₹{formatINR(row.sgstAmount)}
                  </td>
                  <td className="p-2.5 text-right font-mono text-blue-700 dark:text-blue-400 align-top">
                    ₹{formatINR(row.igstAmount)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100 align-top">
                    ₹{formatINR(row.totalTax)}
                  </td>
                  <td className="p-2.5 text-right font-mono font-black text-slate-900 dark:text-slate-100 align-top">
                    ₹{formatINR(row.totalValue)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800/80 border-t-2 border-slate-300 dark:border-slate-700 font-black text-slate-900 dark:text-slate-100">
                <td className="p-2.5" colSpan={3}>
                  Total (कुल योग - GSTR-1 Table 12)
                </td>
                <td className="p-2.5 text-right font-mono">
                  {displayTotals.totalQuantity}
                </td>
                <td className="p-2.5 text-right font-mono">
                  {displayTotals.totalNetWeight.toFixed(3)}
                </td>
                <td className="p-2.5 text-right font-mono">
                  ₹{formatINR(displayTotals.taxableValue)}
                </td>
                <td className="p-2.5 text-right font-mono text-emerald-700 dark:text-emerald-400">
                  ₹{formatINR(displayTotals.cgstAmount)}
                </td>
                <td className="p-2.5 text-right font-mono text-teal-700 dark:text-teal-400">
                  ₹{formatINR(displayTotals.sgstAmount)}
                </td>
                <td className="p-2.5 text-right font-mono text-blue-700 dark:text-blue-400">
                  ₹{formatINR(displayTotals.igstAmount)}
                </td>
                <td className="p-2.5 text-right font-mono">
                  ₹{formatINR(displayTotals.totalTax)}
                </td>
                <td className="p-2.5 text-right font-mono text-amber-700 dark:text-amber-400">
                  ₹{formatINR(displayTotals.totalValue)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* CA Verification Footnote */}
      <div className="px-3.5 py-2.5 bg-amber-50/70 dark:bg-amber-950/20 border-t border-amber-200/70 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>CA Verification Note:</strong> Cancelled invoices are automatically excluded. Confirm UQC
          (<code className="font-mono">PCS-PIECES</code> vs <code className="font-mono">GMS-GRAMS</code>) and
          old-gold exchange adjustment allocation for GSTR-1 Table 12 filing with your Chartered Accountant.
        </span>
      </div>
    </div>
  );
};
