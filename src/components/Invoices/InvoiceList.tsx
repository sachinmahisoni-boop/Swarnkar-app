import React, { useState } from 'react';
import { GSTInvoice } from '../../types';
import { Search, Printer, FileText, CheckCircle2, Clock, AlertCircle, Eye, Trash2, DollarSign, ArrowUpRight } from 'lucide-react';

interface InvoiceListProps {
  invoices: GSTInvoice[];
  onViewPrintInvoice: (invoice: GSTInvoice) => void;
  onDeleteInvoice: (id: string) => void;
  onUpdateInvoiceStatus: (id: string, paidAmount: number) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onViewPrintInvoice,
  onDeleteInvoice,
  onUpdateInvoiceStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = 
      inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.date.includes(searchTerm);

    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Financial Summaries
  const totalSales = invoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.payment.amountPaid, 0);
  const totalOutstandingDues = invoices.reduce((acc, inv) => acc + inv.payment.dueAmount, 0);
  const totalTaxCollected = invoices.reduce((acc, inv) => acc + inv.totalTax, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Financial Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-slate-400 text-xs">Total Invoiced Sales</span>
          <p className="text-xl font-black text-amber-300">₹{Math.round(totalSales).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500">{invoices.length} Tax Invoices generated</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-slate-400 text-xs">Total Payments Received</span>
          <p className="text-xl font-black text-emerald-400">₹{Math.round(totalCollected).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500">Collected via Cash, UPI, Cards</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-slate-400 text-xs">Customer Dues Pending</span>
          <p className="text-xl font-black text-rose-400">₹{Math.round(totalOutstandingDues).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500">Outstanding ledger balance</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm space-y-1">
          <span className="text-slate-400 text-xs">GST Tax Liability (3%)</span>
          <p className="text-xl font-black text-cyan-300">₹{Math.round(totalTaxCollected).toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500">CGST + SGST + IGST Collected</span>
        </div>

      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search invoice #, customer name, phone, date..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs w-full md:w-auto">
          <button
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              statusFilter === 'All' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Invoices
          </button>
          <button
            onClick={() => setStatusFilter('Paid')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              statusFilter === 'Paid' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Paid Fully
          </button>
          <button
            onClick={() => setStatusFilter('Partial')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              statusFilter === 'Partial' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Partial Due
          </button>
          <button
            onClick={() => setStatusFilter('Unpaid')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              statusFilter === 'Unpaid' ? 'bg-rose-500 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unpaid Dues
          </button>
        </div>

      </div>

      {/* Invoices List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm overflow-hidden text-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800/80 text-slate-300 font-semibold border-b border-slate-800">
                <th className="p-3.5">Invoice # & Date</th>
                <th className="p-3.5">Customer Details</th>
                <th className="p-3.5">Jewellery Items</th>
                <th className="p-3.5 text-right">Taxable Amt</th>
                <th className="p-3.5 text-right">GST Tax</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-right">Paid Amt</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10 text-slate-500">
                    No sales invoices found matching search.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-800/50 transition">
                    
                    {/* Invoice Number & Date */}
                    <td className="p-3.5">
                      <span className="font-mono bg-slate-800 text-amber-300 px-2 py-1 rounded text-[11px] font-bold border border-slate-700">
                        {inv.invoiceNumber}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">{inv.date}</p>
                    </td>

                    {/* Customer */}
                    <td className="p-3.5">
                      <p className="font-bold text-slate-200">{inv.customerName}</p>
                      <p className="text-[10px] text-slate-400">{inv.customerPhone}</p>
                    </td>

                    {/* Items Overview */}
                    <td className="p-3.5">
                      <span className="text-slate-300 font-medium">{inv.items.length} Item(s)</span>
                      <p className="text-[10px] text-slate-400 truncate max-w-xs">
                        {inv.items.map(i => i.name).join(', ')}
                      </p>
                    </td>

                    {/* Taxable Amount */}
                    <td className="p-3.5 text-right font-mono text-slate-300">
                      ₹{Math.round(inv.taxableAmount).toLocaleString('en-IN')}
                    </td>

                    {/* Total Tax */}
                    <td className="p-3.5 text-right font-mono text-cyan-300">
                      ₹{Math.round(inv.totalTax).toLocaleString('en-IN')}
                    </td>

                    {/* Grand Total */}
                    <td className="p-3.5 text-right font-mono font-black text-amber-300 text-sm">
                      ₹{Math.round(inv.grandTotal).toLocaleString('en-IN')}
                    </td>

                    {/* Paid */}
                    <td className="p-3.5 text-right font-mono text-emerald-400 font-bold">
                      ₹{Math.round(inv.payment.amountPaid).toLocaleString('en-IN')}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        inv.status === 'Partial' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {inv.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        
                        {/* View & Print Official Invoice */}
                        <button
                          onClick={() => onViewPrintInvoice(inv)}
                          className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="Print Official GST Tax Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>

                        {/* Delete Invoice */}
                        <button
                          onClick={() => onDeleteInvoice(inv.id)}
                          className="p-1 text-slate-400 hover:text-rose-400 p-1.5 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Delete Invoice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
