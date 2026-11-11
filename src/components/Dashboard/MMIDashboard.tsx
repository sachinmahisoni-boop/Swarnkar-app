import React, { useState } from 'react';
import { GSTInvoice, JewelleryItem, MetalRate } from '../../types';
import { 
  ShoppingBag, 
  TrendingUp, 
  Receipt, 
  Tag, 
  Users, 
  FileText, 
  Clock, 
  DollarSign, 
  BarChart3, 
  Calendar,
  Percent,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';

interface MMIDashboardProps {
  invoices: GSTInvoice[];
  inventory: JewelleryItem[];
  rates: MetalRate[];
  onNavigateTab: (tab: any) => void;
}

export const MMIDashboard: React.FC<MMIDashboardProps> = ({
  invoices,
  inventory,
  rates,
  onNavigateTab,
}) => {
  const [period, setPeriod] = useState<'Annual' | 'Monthly' | 'Day'>('Monthly');
  const [selectedReportModal, setSelectedReportModal] = useState<string | null>(null);

  // Dynamic calculations based strictly on firm invoices
  const totalInvoicesCount = invoices.length;
  const totalSalesAmount = invoices.reduce((acc, i) => acc + (i.grandTotal || 0), 0);
  const totalLabourAmount = invoices.reduce((acc, i) => {
    const making = (i.items || []).reduce((s, it) => s + (it.makingCharge || 0), 0);
    return acc + making;
  }, 0);
  const totalDiscountAmount = invoices.reduce((acc, i) => acc + (i.discountAmount || 0), 0);

  // Dynamic Top Selling Categories from actual invoices
  const categoryTotals: Record<string, number> = {};
  invoices.forEach(inv => {
    inv.items?.forEach(item => {
      const cat = item.category || item.metal || 'General Jewellery';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.subtotal || 0);
    });
  });

  const topSellingCategories = Object.entries(categoryTotals)
    .map(([label, amount]) => ({
      label: `Sales of ${label.toUpperCase()}`,
      amount,
      bg: label.toLowerCase().includes('gold') ? 'bg-amber-500' : label.toLowerCase().includes('silver') ? 'bg-slate-500' : 'bg-blue-600',
      icon: 'gold'
    }))
    .slice(0, 4);

  // Top salesmen / counter performance from actual invoices
  const counterSales: Record<string, { sales: number; count: number }> = {};
  invoices.forEach(inv => {
    const counter = inv.counterName || 'Main Counter';
    if (!counterSales[counter]) counterSales[counter] = { sales: 0, count: 0 };
    counterSales[counter].sales += inv.grandTotal || 0;
    counterSales[counter].count += 1;
  });

  const salesmen = Object.entries(counterSales).map(([counter, data]) => ({
    name: counter,
    counter: 'Showroom Desk',
    sales: data.sales,
    invoices: data.count
  }));

  // MMI Right Sidebar 15 Action Buttons
  const rightSidebarButtons = [
    { id: 'supp_perf', label: 'Supp. wise Performance', tab: 'vendors' },
    { id: 'unsold_tag', label: 'Old Unsold Tag', tab: 'inventory' },
    { id: 'sale_comp', label: 'Periodic Sale Comparison', tab: 'reports' },
    { id: 'purch_plan', label: 'Purchase Planner', tab: 'purchases' },
    { id: 'salesman_perf', label: 'Salesman Performance', tab: 'payroll' },
    { id: 'exp_sum', label: 'Expenses Summary', tab: 'expenses' },
    { id: 'top10', label: 'Top 10 Report', tab: 'reports' },
    { id: 'cust_rep', label: 'Customer Report', tab: 'customers' },
    { id: 'avg_stock', label: 'Avg.Stock-Sales', tab: 'inventory' },
    { id: 'item_chart', label: 'Items Sale Chart', tab: 'reports' },
    { id: 'disc_bills', label: 'Discounted Bills', tab: 'invoices' },
    { id: 'del_log', label: 'Del/Modify Log', tab: 'reports' },
    { id: 'acc_rep', label: 'Accounting Reports', tab: 'reports' },
    { id: 'tag_rep', label: 'Tagging Reports', tab: 'barcode' },
    { id: 'master', label: 'Master Desk', tab: 'pos' },
  ];

  // Live Vouchers data from actual firm invoices
  const vouchers = invoices.map((inv) => ({
    type: inv.invoiceType === 'GST_INVOICE' ? 'SALE' : 'ESTIMATE',
    login: inv.counterName || 'Admin',
    customer: inv.customerName || 'Walk-in Customer',
    billNo: inv.invoiceNumber,
    amount: inv.grandTotal,
    narr: `${inv.items?.map(it => it.name).join(', ') || 'Jewellery Items'}`
  }));

  return (
    <div className="bg-stone-100 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-slate-100 font-sans p-1 sm:p-3 md:p-4 select-none transition-colors">
      
      {/* ERP Software Window Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-t-xl px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse"></span>
              Swarnkar Jewellery ERP • Executive Business Dashboard
            </span>
          </div>

          {/* Period Selector (Annual / Monthly / Day) */}
          <div className="flex items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400">
              <input
                type="radio"
                name="period"
                value="Annual"
                checked={period === 'Annual'}
                onChange={() => setPeriod('Annual')}
                className="accent-amber-500"
              />
              <span>Annual</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400">
              <input
                type="radio"
                name="period"
                value="Monthly"
                checked={period === 'Monthly'}
                onChange={() => setPeriod('Monthly')}
                className="accent-amber-500"
              />
              <span>Monthly</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-amber-600 dark:hover:text-amber-400">
              <input
                type="radio"
                name="period"
                value="Day"
                checked={period === 'Day'}
                onChange={() => setPeriod('Day')}
                className="accent-amber-500"
              />
              <span>Day</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2.5 py-0.5 rounded font-mono font-bold border border-amber-300 dark:border-amber-800/80">
            Live Sarafa Session: Bhopal
          </span>
          <button 
            onClick={() => onNavigateTab('pos')}
            className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-md shadow-xs text-xs flex items-center gap-1 cursor-pointer transition"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Open POS Billing [F2]</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left 82% (Dashboard Content) + Right 18% (15 Buttons Strip) */}
      <div className="bg-white dark:bg-slate-900 border-x border-b border-slate-300 dark:border-slate-800 rounded-b-xl shadow-xs p-3 grid grid-cols-1 xl:grid-cols-12 gap-3">
        
        {/* Left Column (10 of 12 cols): Metrics, Top Selling, Salesmen, Charts, Vouchers */}
        <div className="xl:col-span-10 space-y-3 min-w-0">
          
          {/* Top 4 Signature Colorful KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Card 1: Total No. of Invoices (Red) */}
            <div 
              onClick={() => onNavigateTab('invoices')}
              className="bg-gradient-to-br from-[#dc2626] to-[#b91c1c] text-white p-3.5 rounded-xl shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform group"
            >
              <div className="relative z-10">
                <span className="text-3xl font-black font-mono tracking-tight leading-none block">
                  {totalInvoicesCount}
                </span>
                <span className="text-[11px] font-bold text-red-100 uppercase tracking-wider block mt-1">
                  Total No. of Invoices
                </span>
              </div>
              <ShoppingBag className="w-16 h-16 text-white/15 absolute right-2 bottom-1 pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-white/50" />
              </div>
            </div>

            {/* Card 2: Total Sales (Blue) */}
            <div 
              onClick={() => onNavigateTab('invoices')}
              className="bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-white p-3.5 rounded-xl shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform group"
            >
              <div className="relative z-10">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none block truncate">
                  ₹{(totalSalesAmount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block mt-1">
                  Total Sales
                </span>
              </div>
              <TrendingUp className="w-16 h-16 text-white/15 absolute right-2 bottom-1 pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-white/50" />
              </div>
            </div>

            {/* Card 3: Total Labour / Making Charges (Orange) */}
            <div 
              onClick={() => onNavigateTab('reports')}
              className="bg-gradient-to-br from-[#ea580c] to-[#c2410c] text-white p-3.5 rounded-xl shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform group"
            >
              <div className="relative z-10">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none block truncate">
                  ₹{(totalLabourAmount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wider block mt-1">
                  Total Labour (मेकिंग)
                </span>
              </div>
              <BarChart3 className="w-16 h-16 text-white/15 absolute right-2 bottom-1 pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-white/50" />
              </div>
            </div>

            {/* Card 4: Total Discount (Green) */}
            <div 
              onClick={() => onNavigateTab('reports')}
              className="bg-gradient-to-br from-[#16a34a] to-[#15803d] text-white p-3.5 rounded-xl shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform group"
            >
              <div className="relative z-10">
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-none block truncate">
                  ₹{(totalDiscountAmount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-green-100 uppercase tracking-wider block mt-1">
                  Total Discount (छूट)
                </span>
              </div>
              <Percent className="w-16 h-16 text-white/15 absolute right-2 bottom-1 pointer-events-none group-hover:scale-110 transition-transform" />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-white/50" />
              </div>
            </div>
          </div>

          {/* TOP SELLING ITEM'S */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              TOP SELLING ITEM'S
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {topSellingCategories.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg p-2.5 flex items-center gap-2.5 transition shadow-2xs"
                >
                  <div className={`w-9 h-9 rounded-full ${item.bg} text-white flex items-center justify-center shrink-0 shadow-xs font-bold`}>
                    {idx === 0 && <Receipt className="w-4 h-4" />}
                    {idx === 1 && <BarChart3 className="w-4 h-4" />}
                    {idx === 2 && <ShoppingBag className="w-4 h-4" />}
                    {idx === 3 && <Tag className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block truncate uppercase">
                      {item.label}
                    </span>
                    <span className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP SALESMAN'S */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
              TOP SALESMAN'S (कर्मचारी बिक्री प्रदर्शन)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {salesmen.map((s, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 rounded-lg p-2.5 flex items-center gap-2.5 transition shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 block truncate">
                      {s.name}
                    </span>
                    <span className="text-xs font-black font-mono text-slate-900 dark:text-slate-100 block">
                      ₹{s.sales.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Split: Monthly Sales Graph (In Lakhs) + Live Voucher Register Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
            
            {/* Monthly Sales Bar Chart (In Lakhs) - 4 cols */}
            <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700/80 rounded-lg p-3 flex flex-col justify-between shadow-2xs">
              <div className="border-b border-slate-200 dark:border-slate-700 pb-1 mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Monthly Sales Bar Chart (In Lakhs)
                </span>
                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-bold">2025-26</span>
              </div>

              {/* Bar Chart Visualization */}
              <div className="relative h-44 w-full flex items-end justify-between px-2 pt-4 gap-1.5">
                {/* Y-Axis lines */}
                <div className="absolute inset-x-0 top-0 border-b border-slate-200 dark:border-slate-700/60 text-[9px] text-slate-400 font-mono">300-</div>
                <div className="absolute inset-x-0 top-1/4 border-b border-slate-200 dark:border-slate-700/60 text-[9px] text-slate-400 font-mono">250-</div>
                <div className="absolute inset-x-0 top-2/4 border-b border-slate-200 dark:border-slate-700/60 text-[9px] text-slate-400 font-mono">200-</div>
                <div className="absolute inset-x-0 top-3/4 border-b border-slate-200 dark:border-slate-700/60 text-[9px] text-slate-400 font-mono">100-</div>

                {/* Bars */}
                {[
                  { h: '20%', label: 'Dec' },
                  { h: '50%', label: 'Jan' },
                  { h: '60%', label: 'Feb' },
                  { h: '40%', label: 'Mar' },
                  { h: '45%', label: 'Apr' },
                  { h: '30%', label: 'May' },
                  { h: '85%', label: 'Jun' },
                  { h: '55%', label: 'Jul' },
                  { h: '70%', label: 'Aug' },
                  { h: '15%', label: 'Sep' }
                ].map((bar, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group relative h-full">
                    <div 
                      style={{ height: bar.h }} 
                      className="w-full bg-amber-500 rounded-t-sm group-hover:bg-amber-400 transition-colors shadow-2xs relative"
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                        {bar.h}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Month X-Axis Labels */}
              <div className="flex justify-between text-[9px] font-mono text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Dec</span>
                <span>Jan</span>
                <span>Feb</span>
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
              </div>
            </div>

            {/* Live Voucher & Sale Register Table (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-2xs">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-amber-500" />
                  Live Daily Voucher & Sales Register
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Real-time ERP Audit Trail</span>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-52 text-[11px]">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-200/80 dark:bg-slate-800 sticky top-0 border-b border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-1 px-2 border-r border-slate-300 dark:border-slate-700">V.Type</th>
                      <th className="py-1 px-2 border-r border-slate-300 dark:border-slate-700">Login</th>
                      <th className="py-1 px-2 border-r border-slate-300 dark:border-slate-700">Customer / Account</th>
                      <th className="py-1 px-2 border-r border-slate-300 dark:border-slate-700">Bill No.</th>
                      <th className="py-1 px-2 border-r border-slate-300 dark:border-slate-700 text-right">Amount (₹)</th>
                      <th className="py-1 px-2">Narr.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono">
                    {vouchers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                          No sales vouchers recorded yet for this session.
                        </td>
                      </tr>
                    ) : (
                      vouchers.map((v, i) => (
                        <tr key={i} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/60 transition">
                          <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                            <span className={`px-1 py-0.2 rounded text-[9px] ${
                              v.type === 'SALE' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold' :
                              v.type === 'ISSUE' ? 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 font-bold' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                            }`}>
                              {v.type}
                            </span>
                          </td>
                          <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">{v.login}</td>
                          <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-800 font-sans font-bold text-slate-900 dark:text-slate-100 truncate max-w-[160px]">{v.customer}</td>
                          <td className="py-1 px-2 border-r border-slate-200 dark:border-slate-800 font-bold text-amber-600 dark:text-amber-400">{v.billNo}</td>
                          <td className={`py-1 px-2 border-r border-slate-200 dark:border-slate-800 text-right font-bold ${v.amount < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}`}>
                            {v.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-1 px-2 font-sans text-slate-600 dark:text-slate-400 truncate max-w-[180px]">{v.narr}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (2 of 12 cols): Signature 15-Button Vertical Strip */}
        <div className="xl:col-span-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-lg p-2 flex flex-col gap-1.5 shadow-2xs">
          <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider text-center border-b border-slate-200 dark:border-slate-700 pb-1 block">
            SWARNKAR REPORT STRIP
          </span>

          <div className="space-y-1 overflow-y-auto max-h-[640px] pr-0.5">
            {rightSidebarButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  if (btn.tab) {
                    onNavigateTab(btn.tab);
                  } else {
                    setSelectedReportModal(btn.label);
                  }
                }}
                className="w-full text-left px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-md font-bold text-[11px] transition shadow-2xs truncate flex items-center justify-between cursor-pointer"
                title={btn.label}
              >
                <span className="truncate">{btn.label}</span>
                <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
