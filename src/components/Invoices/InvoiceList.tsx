import React, { useState } from 'react';
import { GSTInvoice } from '../../types';
import { 
  Search, 
  Printer, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Trash2, 
  DollarSign, 
  ArrowUpRight, 
  Calendar, 
  Download, 
  Share2, 
  Sparkles, 
  Filter, 
  Layers, 
  Receipt,
  User,
  Phone,
  Tag,
  CreditCard,
  X
} from 'lucide-react';
import { getISTDate } from '../../lib/invoiceNumber';

interface InvoiceListProps {
  invoices: GSTInvoice[];
  onViewPrintInvoice: (invoice: GSTInvoice) => void;
  onBatchPrintInvoices?: (invoices: GSTInvoice[]) => void;
  onDeleteInvoice: (id: string) => void;
  onCancelInvoice?: (invoice: GSTInvoice, reason: string) => Promise<void> | void;
  onUpdateInvoiceStatus: (id: string, paidAmount: number) => void;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  onViewPrintInvoice,
  onBatchPrintInvoices,
  onDeleteInvoice,
  onCancelInvoice,
  onUpdateInvoiceStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Partial' | 'Unpaid'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'GST_INVOICE' | 'ESTIMATE_BILL'>('All');
  const [dateFilter, setDateFilter] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  const [counterFilter, setCounterFilter] = useState<string>('All');
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Quick Payment Update Modal State
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<GSTInvoice | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);

  // Unique counters
  const counters = Array.from(new Set(invoices.map(i => i.counterName || 'Main Showroom Counter')));

  const todayStr = getISTDate().isoDateStr;

  // Deep Search & Filters
  const filteredInvoices = invoices.filter(inv => {
    // 1. Text Search across invoice #, customer name, phone, gstin, items, huid
    const term = searchTerm.toLowerCase().trim();
    const matchesNumber = inv.invoiceNumber.toLowerCase().includes(term);
    const matchesCustomer = inv.customerName.toLowerCase().includes(term);
    const matchesPhone = inv.customerPhone.toLowerCase().includes(term);
    const matchesGSTIN = (inv.customerGSTIN || '').toLowerCase().includes(term);
    const matchesDate = inv.date.includes(term);
    const matchesItem = inv.items.some(item => 
      item.name.toLowerCase().includes(term) ||
      item.tagNo.toLowerCase().includes(term) ||
      (item.huid && item.huid.toLowerCase().includes(term)) ||
      (item.stoneDetails && item.stoneDetails.type.toLowerCase().includes(term))
    );

    const matchesSearch = !term || (matchesNumber || matchesCustomer || matchesPhone || matchesGSTIN || matchesDate || matchesItem);

    // 2. Status Filter
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;

    // 3. Bill Type Filter (GST vs Estimate)
    const matchesType = typeFilter === 'All' || inv.invoiceType === typeFilter;

    // 4. Counter Filter
    const matchesCounter = counterFilter === 'All' || (inv.counterName || 'Main Showroom Counter') === counterFilter;

    // 5. Date Filter
    let matchesDateRange = true;
    if (dateFilter === 'Today') {
      matchesDateRange = inv.date === todayStr;
    } else if (dateFilter === 'Week') {
      const pastWeek = getISTDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).isoDateStr;
      matchesDateRange = inv.date >= pastWeek;
    } else if (dateFilter === 'Month') {
      const pastMonth = getISTDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).isoDateStr;
      matchesDateRange = inv.date >= pastMonth;
    }

    return matchesSearch && matchesStatus && matchesType && matchesCounter && matchesDateRange;
  });

  // Financial Summaries based on filtered set
  const totalSales = filteredInvoices.reduce((acc, inv) => acc + inv.grandTotal, 0);
  const totalCollected = filteredInvoices.reduce((acc, inv) => acc + inv.payment.amountPaid, 0);
  const totalOutstandingDues = filteredInvoices.reduce((acc, inv) => acc + inv.payment.dueAmount, 0);
  const totalTaxCollected = filteredInvoices.reduce((acc, inv) => acc + inv.totalTax, 0);

  // WhatsApp Share Helper
  const handleShareWhatsApp = (inv: GSTInvoice) => {
    const isGST = inv.invoiceType === 'GST_INVOICE';
    const billTitle = isGST ? 'GST Tax Invoice' : 'Estimate Bill';
    const itemsList = inv.items.map((i, idx) => `${idx + 1}. ${i.name} (${i.purity}) - ₹${i.subtotal}`).join('%0A');
    
    const text = `*Shreem Mahal Jewellers, Bhopal*%0A${billTitle} No: *${inv.invoiceNumber}*%0ADate: ${inv.date}%0ACustomer: ${inv.customerName}%0A%0A*Items:*%0A${itemsList}%0A%0AGrand Total: *₹${inv.grandTotal.toLocaleString('en-IN')}*%0AAmount Paid: ₹${inv.payment.amountPaid.toLocaleString('en-IN')}%0ADue Balance: ₹${inv.payment.dueAmount.toLocaleString('en-IN')}%0A%0AThank you for shopping with us!%0AShop No 6, Saideep Plaza, Kolar, Bhopal (M: +91 9202357851)`;
    
    const cleanPhone = inv.customerPhone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://api.whatsapp.com/send?phone=${fullPhone}&text=${text}`, '_blank');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Invoice No', 'Type', 'Date', 'Customer Name', 'Phone', 'Counter', 'Items Count', 'Gross Total', 'Tax', 'Grand Total', 'Paid', 'Due', 'Status'];
    const rows = filteredInvoices.map(inv => [
      `"${inv.invoiceNumber}"`,
      `"${inv.invoiceType}"`,
      `"${inv.date}"`,
      `"${inv.customerName}"`,
      `"${inv.customerPhone}"`,
      `"${inv.counterName || 'Main'}"`,
      inv.items.length,
      inv.taxableAmount,
      inv.totalTax,
      inv.grandTotal,
      inv.payment.amountPaid,
      inv.payment.dueAmount,
      `"${inv.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Shreem_Mahal_Bills_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenPaymentModal = (inv: GSTInvoice) => {
    setPaymentModalInvoice(inv);
    setPayingAmount(inv.payment.dueAmount);
  };

  const handleSavePayment = () => {
    if (!paymentModalInvoice) return;
    const currentPaid = paymentModalInvoice.payment.amountPaid;
    const newTotalPaid = currentPaid + Number(payingAmount);
    onUpdateInvoiceStatus(paymentModalInvoice.id, newTotalPaid);
    setPaymentModalInvoice(null);
  };

  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoiceIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedInvoiceIds.length === 0 || selectedInvoiceIds.length < filteredInvoices.length) {
      setSelectedInvoiceIds(filteredInvoices.map(i => i.id));
    } else {
      setSelectedInvoiceIds([]);
    }
  };

  const handleBatchPrint = () => {
    if (!onBatchPrintInvoices || selectedInvoiceIds.length === 0) return;
    const selectedInvoices = invoices.filter(inv => selectedInvoiceIds.includes(inv.id));
    onBatchPrintInvoices(selectedInvoices);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Financial Metrics */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-md transition">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-amber-200">
                बिक्री बिल व ग्राहक रिकॉर्ड रजिस्टर (All Generated Invoices Archive)
              </h2>
              <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">
                {invoices.length} Bills Saved
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              पुराने बिल, कच्चा पर्चा, टैक्स इनवॉइस व ग्राहक का पूरा रिकॉर्ड सर्च व री-प्रिंट करें
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedInvoiceIds.length > 0 && (
              <button
                type="button"
                onClick={handleBatchPrint}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer animate-in zoom-in-95 duration-200"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Selected ({selectedInvoiceIds.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              title="Download bills report as Excel/CSV"
            >
              <Download className="w-3.5 h-3.5 text-amber-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 4 Financial Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold">Total Invoiced Amount</span>
            <p className="text-xl font-black text-amber-600 dark:text-amber-300 font-mono">
              ₹{Math.round(totalSales).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">{filteredInvoices.length} Bills in selected view</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold">Total Received Payment</span>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              ₹{Math.round(totalCollected).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">Cleared in Cash / Bank / UPI</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold">Outstanding Dues (उधार)</span>
            <p className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono">
              ₹{Math.round(totalOutstandingDues).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">Pending customer recovery</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl space-y-1">
            <span className="text-slate-600 dark:text-slate-400 text-xs font-semibold">GST Liability (3% Tax)</span>
            <p className="text-xl font-black text-cyan-600 dark:text-cyan-300 font-mono">
              ₹{Math.round(totalTaxCollected).toLocaleString('en-IN')}
            </p>
            <span className="text-[10px] text-slate-500 dark:text-slate-400">CGST + SGST collected</span>
          </div>
        </div>
      </div>

      {/* Filter and Deep Search Desk */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-md space-y-3 transition">
        
        {/* Row 1: Deep Search Input */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:flex-1">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search by Bill #, Customer Name, Phone, HUID, Gemstone, Tag No, or Date..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-amber-500 font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick Date Range Filter */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs w-full md:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setDateFilter('All')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilter === 'All' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('Today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilter === 'Today' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('Week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilter === 'Week' ? 'bg-amber-500 text-slate-950' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => setDateFilter('Month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                dateFilter === 'Month' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Last 30 Days
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-1 border-t border-slate-800/80">
          
          {/* Bill Type */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Type:</span>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Types (सभी बिल)</option>
              <option value="GST_INVOICE">GST Tax Invoice (पक्का बिल)</option>
              <option value="ESTIMATE_BILL">Estimate Bill (कच्चा पर्चा)</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Payment:</span>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Status (सभी)</option>
              <option value="Paid">Fully Paid (पूर्ण भुगतान)</option>
              <option value="Partial">Partial Due (आंशिक बाकी)</option>
              <option value="Unpaid">Unpaid (पूरा बाकी)</option>
            </select>
          </div>

          {/* Counter Filter */}
          {counters.length > 1 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-medium">Counter:</span>
              <select
                value={counterFilter}
                onChange={e => setCounterFilter(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="All">All Counters (सभी काउंटर)</option>
                {counters.map((c, idx) => (
                  <option key={idx} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto text-[11px] text-slate-400">
            Showing <strong className="text-amber-300 font-mono">{filteredInvoices.length}</strong> of {invoices.length} bills
          </div>

        </div>

      </div>

      {/* Invoices List Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-md overflow-hidden text-slate-900 dark:text-slate-100 transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={filteredInvoices.length > 0 && selectedInvoiceIds.length === filteredInvoices.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                  />
                </th>
                <th className="p-3.5">Bill # & Type</th>
                <th className="p-3.5">Date & Counter</th>
                <th className="p-3.5">Customer Details</th>
                <th className="p-3.5">Items & HUID</th>
                <th className="p-3.5 text-right">Taxable Amt</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-right">Paid / Due</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <FileText className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600 mb-2 opacity-50" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">No invoices match your search</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try clearing filters or search term to see all generated bills.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map(inv => {
                  const isGST = inv.invoiceType === 'GST_INVOICE';
                  const isSelected = selectedInvoiceIds.includes(inv.id);

                  return (
                    <tr key={inv.id} className={`transition ${isSelected ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                      {/* Selection Checkbox */}
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectInvoice(inv.id)}
                          className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                        />
                      </td>
                      
                      {/* Invoice Number & Type */}
                      <td className="p-3.5">
                        <span className="font-mono bg-slate-100 dark:bg-slate-950 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-300 dark:border-amber-500/30 block w-fit">
                          {inv.invoiceNumber}
                        </span>
                        <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded mt-1.5 ${
                          isGST 
                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                        }`}>
                          {isGST ? 'GST Tax Invoice' : 'Estimate Bill (कच्चा)'}
                        </span>
                      </td>

                      {/* Date & Counter */}
                      <td className="p-3.5">
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-bold block">{inv.date}</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate max-w-[130px]" title={inv.counterName}>
                          {inv.counterName || 'Main Showroom'}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900 dark:text-slate-100">{inv.customerName}</p>
                        <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400">{inv.customerPhone}</p>
                        {inv.customerGSTIN && (
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 block font-semibold">
                            GSTIN: {inv.customerGSTIN}
                          </span>
                        )}
                      </td>

                      {/* Items Overview */}
                      <td className="p-3.5">
                        <span className="text-amber-600 dark:text-amber-300 font-bold block">{inv.items.length} Item(s)</span>
                        <div className="space-y-0.5 mt-0.5 max-w-xs">
                          {inv.items.slice(0, 2).map((item, iIdx) => (
                            <div key={iIdx} className="text-[10px] text-slate-300 truncate flex items-center gap-1.5">
                              <span>• {item.name}</span>
                              {item.huid && (
                                <span className="bg-emerald-950/60 text-emerald-400 font-mono text-[9px] px-1 rounded border border-emerald-500/30">
                                  {item.huid}
                                </span>
                              )}
                              {item.stoneDetails && (
                                <span className="text-amber-400 text-[9px]">
                                  ({item.stoneDetails.type})
                                </span>
                              )}
                            </div>
                          ))}
                          {inv.items.length > 2 && (
                            <span className="text-[9px] text-slate-500">
                              +{inv.items.length - 2} more item(s)...
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Taxable Amount */}
                      <td className="p-3.5 text-right font-mono text-slate-300">
                        ₹{Math.round(inv.taxableAmount).toLocaleString('en-IN')}
                        {inv.totalTax > 0 && (
                          <span className="block text-[10px] text-cyan-400 font-normal">
                            +₹{Math.round(inv.totalTax)} GST
                          </span>
                        )}
                      </td>

                      {/* Grand Total */}
                      <td className="p-3.5 text-right font-mono font-black text-amber-300 text-sm">
                        ₹{Math.round(inv.grandTotal).toLocaleString('en-IN')}
                      </td>

                      {/* Paid / Due Breakdown */}
                      <td className="p-3.5 text-right font-mono">
                        <span className="text-emerald-400 font-bold block">
                          ₹{Math.round(inv.payment.amountPaid).toLocaleString('en-IN')}
                        </span>
                        {inv.payment.dueAmount > 0 ? (
                          <span className="text-rose-400 text-[10px] block font-bold">
                            Due: ₹{Math.round(inv.payment.dueAmount).toLocaleString('en-IN')}
                          </span>
                        ) : (
                          <span className="text-emerald-500 text-[10px] block">No Due</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="p-3.5 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          inv.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          inv.status === 'Partial' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}>
                          {inv.status === 'Cancelled' ? 'Cancelled (निरस्त)' : inv.status}
                        </span>
                        {inv.status === 'Cancelled' && inv.cancelReason && (
                          <span className="block text-[9px] text-rose-400 font-mono mt-0.5 truncate max-w-[100px]" title={inv.cancelReason}>
                            {inv.cancelReason}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* View & Print Invoice */}
                          <button
                            onClick={() => onViewPrintInvoice(inv)}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Print / View Invoice"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print</span>
                          </button>

                          {/* Share on WhatsApp */}
                          <button
                            onClick={() => handleShareWhatsApp(inv)}
                            className="p-1.5 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-500/30 rounded-lg transition cursor-pointer"
                            title="Share on WhatsApp with customer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* If partial/unpaid and not cancelled, Quick Payment Receipt */}
                          {inv.status !== 'Cancelled' && inv.payment.dueAmount > 0 && (
                            <button
                              onClick={() => handleOpenPaymentModal(inv)}
                              className="p-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-400 rounded-lg transition cursor-pointer"
                              title="Clear / Receive Due Payment"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancel Invoice Button */}
                          {inv.status !== 'Cancelled' && (
                            <button
                              disabled={cancellingId === inv.id}
                              onClick={async () => {
                                const reason = prompt(`इनवॉइस ${inv.invoiceNumber} निरस्त (Cancel) करने का कारण दर्ज करें:`);
                                if (reason && reason.trim()) {
                                  if (onCancelInvoice) {
                                    setCancellingId(inv.id);
                                    try {
                                      await onCancelInvoice(inv, reason.trim());
                                    } catch {
                                      // Error already surfaced to user by parent handler
                                    } finally {
                                      setCancellingId(null);
                                    }
                                  } else {
                                    onDeleteInvoice(inv.id);
                                  }
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer disabled:opacity-50"
                              title="Cancel Invoice & Restore Stock"
                            >
                              <X className="w-3.5 h-3.5 text-rose-400" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Due Payment Settlement Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-amber-500/40 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Receive Pending Payment (बाकी भुगतान जमा करें)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Bill No:</span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-300">{paymentModalInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Customer:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">{paymentModalInvoice.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Total Bill Amount:</span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">₹{paymentModalInvoice.grandTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Paid So Far:</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{paymentModalInvoice.payment.amountPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-rose-600 dark:text-rose-400">Remaining Balance:</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">₹{paymentModalInvoice.payment.dueAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-bold">
                  Amount Received Now (₹)
                </label>
                <input
                  type="number"
                  max={paymentModalInvoice.payment.dueAmount}
                  value={payingAmount}
                  onChange={e => setPayingAmount(Math.min(paymentModalInvoice.payment.dueAmount, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-amber-700 dark:text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePayment}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                Record Payment & Clear
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
