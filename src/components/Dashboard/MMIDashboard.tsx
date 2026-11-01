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
    <div className="bg-[#f0f2f5] min-h-screen text-slate-800 font-sans p-2 sm:p-4 select-none">
      
      {/* MMI Software Window Header */}
      <div className="bg-white border border-slate-300 rounded-t-xl px-4 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block animate-pulse"></span>
              Swarnka Jewellery ERP • Executive Business Dashboard
            </span>
          </div>

          {/* Period Selector (Annual / Monthly / Day) */}
          <div className="flex items-center gap-4 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-700">
              <input
                type="radio"
                name="period"
                value="Annual"
                checked={period === 'Annual'}
                onChange={() => setPeriod('Annual')}
                className="accent-blue-600"
              />
              <span>Annual</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-700">
              <input
                type="radio"
                name="period"
                value="Monthly"
                checked={period === 'Monthly'}
                onChange={() => setPeriod('Monthly')}
                className="accent-blue-600"
              />
              <span>Monthly</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-blue-700">
              <input
                type="radio"
                name="period"
                value="Day"
                checked={period === 'Day'}
                onChange={() => setPeriod('Day')}
                className="accent-blue-600"
              />
              <span>Day</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-mono font-bold border border-amber-300">
            Live Sarafa Session: Bhopal
          </span>
          <button 
            onClick={() => onNavigateTab('pos')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-md shadow-xs text-xs flex items-center gap-1 cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Open POS Billing [F2]</span>
          </button>
        </div>
      </div>

      {/* Main Workspace: Left 82% (Dashboard Content) + Right 18% (15 MMI Buttons Strip) */}
      <div className="bg-white border-x border-b border-slate-300 rounded-b-xl shadow-sm p-3 grid grid-cols-1 xl:grid-cols-12 gap-3">
        
        {/* Left Column (10 of 12 cols): Metrics, Top Selling, Salesmen, Charts, Vouchers */}
        <div className="xl:col-span-10 space-y-3">
          
          {/* Top 4 MMI Signature Colorful KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {/* Card 1: Total No. of Invoices (Red) */}
            <div className="bg-gradient-to-br from-[#ea4335] to-[#d93025] text-white p-3.5 rounded-lg shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px]">
              <div className="relative z-10">
                <span className="text-3xl font-black font-mono tracking-tight leading-none block">
                  {totalInvoicesCount}
                </span>
                <span className="text-[11px] font-bold text-red-100 uppercase tracking-wider block mt-1">
                  Total No. of Invoices
                </span>
              </div>
              <ShoppingBag className="w-16 h-16 text-white/15 absolute right-2 bottom-1 pointer-events-none" />
            </div>

            {/* Card 2: Total Sales (Blue) */}
            <div className="bg-gradient-to-br from-[#4285f4] to-[#1a73e8] text-white p-3.5 rounded-lg shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px]">
              <div className="relative z-10">
                <span className="text-3xl font-black font-mono tracking-tight leading-none block">
                  ₹{(totalSalesAmount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block mt-1">
                  Total Sales
                </span>
              </div>
              <TrendingUp className="w-16 h-16 text-white/15 absolute right-2 bottom-1 pointer-events-none" />
            </div>

            {/* Card 3: Total Labour / Making Charges (Orange) */}
            <div className="bg-gradient-to-br from-[#fa7b17] to-[#e8710a] text-white p-3.5 rounded-lg shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px]">
              <div className="relative z-10">
                <span className="text-3xl font-black font-mono tracking-tight leading-none block">
                  ₹{(totalLabourAmount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-orange-100 uppercase tracking-wider block mt-1">
                  Total Labour (मेकिंग)
                </span>
              </div>
              <BarChart3 className="w-16 h-16 text-white/15 absolute right-2 bottom-1 pointer-events-none" />
            </div>

            {/* Card 4: Total Discount (Green) */}
            <div className="bg-gradient-to-br from-[#34a853] to-[#1e8e3e] text-white p-3.5 rounded-lg shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px]">
              <div className="relative z-10">
                <span className="text-3xl font-black font-mono tracking-tight leading-none block">
                  ₹{(totalDiscountAmount).toLocaleString('en-IN')}
                </span>
                <span className="text-[11px] font-bold text-green-100 uppercase tracking-wider block mt-1">
                  Total Discount (छूट)
                </span>
              </div>
              <Percent className="w-16 h-16 text-white/15 absolute right-2 bottom-1 pointer-events-none" />
            </div>
          </div>

          {/* TOP SELLING ITEM'S */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
              TOP SELLING ITEM'S
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {topSellingCategories.map((item, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 flex items-center gap-2.5 transition shadow-2xs"
                >
                  <div className={`w-9 h-9 rounded-full ${item.bg} text-white flex items-center justify-center shrink-0 shadow-xs font-bold`}>
                    {idx === 0 && <Receipt className="w-4 h-4" />}
                    {idx === 1 && <BarChart3 className="w-4 h-4" />}
                    {idx === 2 && <ShoppingBag className="w-4 h-4" />}
                    {idx === 3 && <Tag className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-600 block truncate uppercase">
                      {item.label}
                    </span>
                    <span className="text-xs font-black font-mono text-slate-900 block">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TOP SALESMAN'S */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 block">
              TOP SALESMAN'S (कर्मचारी बिक्री प्रदर्शन)
            </span>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {salesmen.map((s, idx) => (
                <div 
                  key={idx}
                  className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 flex items-center gap-2.5 transition shadow-2xs"
                >
                  <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-extrabold text-slate-800 block truncate">
                      {s.name}
                    </span>
                    <span className="text-xs font-black font-mono text-slate-900 block">
                      ₹{s.sales.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Split: Monthly Sales Graph (In Lakhs) + Live Voucher Register Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
            
            {/* Monthly Sales Graph (In Lakhs) - 4 cols */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-300 rounded-lg p-3 flex flex-col justify-between shadow-2xs">
              <div className="border-b border-slate-200 pb-1 mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Monthly Sales Graph (In Lakhs)
                </span>
                <span className="text-[10px] font-mono text-blue-700 font-bold">2025-26</span>
              </div>

              {/* Graphical Line Visualization matching MMI Screenshot */}
              <div className="relative h-44 w-full flex items-end justify-between px-2 pt-4">
                {/* Y-Axis lines */}
                <div className="absolute inset-x-0 top-0 border-b border-slate-200/60 text-[9px] text-slate-400 font-mono">300-</div>
                <div className="absolute inset-x-0 top-1/4 border-b border-slate-200/60 text-[9px] text-slate-400 font-mono">250-</div>
                <div className="absolute inset-x-0 top-2/4 border-b border-slate-200/60 text-[9px] text-slate-400 font-mono">200-</div>
                <div className="absolute inset-x-0 top-3/4 border-b border-slate-200/60 text-[9px] text-slate-400 font-mono">100-</div>

                {/* SVG Trend Line */}
                <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <polyline
                    fill="none"
                    stroke="#1e40af"
                    strokeWidth="2.5"
                    points="5,80 15,50 25,40 35,60 45,55 55,70 65,15 75,45 85,30 95,85"
                  />
                  {/* Data Points */}
                  {[
                    [5, 80], [15, 50], [25, 40], [35, 60], [45, 55],
                    [55, 70], [65, 15], [75, 45], [85, 30], [95, 85]
                  ].map(([x, y], i) => (
                    <circle key={i} cx={x} cy={y} r="3" fill="#1e40af" stroke="#ffffff" strokeWidth="1.5" />
                  ))}
                </svg>
              </div>

              {/* Month X-Axis Labels */}
              <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-2 border-t border-slate-200">
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
            <div className="lg:col-span-8 bg-white border border-slate-300 rounded-lg overflow-hidden flex flex-col shadow-2xs">
              <div className="p-2 bg-slate-100 border-b border-slate-300 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Live Daily Voucher & Sales Register
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Real-time ERP Audit Trail</span>
              </div>

              <div className="overflow-x-auto overflow-y-auto max-h-52 text-[11px]">
                <table className="w-full border-collapse text-left">
                  <thead className="bg-slate-200/80 sticky top-0 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="py-1 px-2 border-r border-slate-300">V.Type</th>
                      <th className="py-1 px-2 border-r border-slate-300">Login</th>
                      <th className="py-1 px-2 border-r border-slate-300">Customer / Account</th>
                      <th className="py-1 px-2 border-r border-slate-300">Bill No.</th>
                      <th className="py-1 px-2 border-r border-slate-300 text-right">Amount (₹)</th>
                      <th className="py-1 px-2">Narr.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {vouchers.map((v, i) => (
                      <tr key={i} className="hover:bg-blue-50/60 transition">
                        <td className="py-1 px-2 border-r border-slate-200 font-bold text-slate-800 text-[10px]">
                          <span className={`px-1 py-0.2 rounded text-[9px] ${
                            v.type === 'SALE' ? 'bg-emerald-100 text-emerald-800 font-bold' :
                            v.type === 'ISSUE' ? 'bg-purple-100 text-purple-800 font-bold' :
                            'bg-slate-100 text-slate-700 font-medium'
                          }`}>
                            {v.type}
                          </span>
                        </td>
                        <td className="py-1 px-2 border-r border-slate-200 text-slate-600">{v.login}</td>
                        <td className="py-1 px-2 border-r border-slate-200 font-sans font-bold text-slate-900 truncate max-w-[160px]">{v.customer}</td>
                        <td className="py-1 px-2 border-r border-slate-200 font-bold text-blue-800">{v.billNo}</td>
                        <td className={`py-1 px-2 border-r border-slate-200 text-right font-bold ${v.amount < 0 ? 'text-rose-700' : 'text-slate-900'}`}>
                          {v.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-2 font-sans text-slate-600 truncate max-w-[180px]">{v.narr}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

        {/* Right Column (2 of 12 cols): Signature MMI 15-Button Vertical Strip */}
        <div className="xl:col-span-2 bg-[#dbeef8]/40 border border-sky-200 rounded-lg p-2 flex flex-col gap-1.5 shadow-2xs">
          <span className="text-[10px] font-black text-sky-950 uppercase tracking-wider text-center border-b border-sky-300/60 pb-1 block">
            MMI REPORT STRIP
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
                className="w-full text-left px-2.5 py-1.5 bg-[#dbe8f5] hover:bg-[#c8ddf0] active:bg-[#b0cde8] text-[#1b3a57] border border-[#a8c8e6] rounded-md font-bold text-[11px] transition shadow-2xs truncate flex items-center justify-between cursor-pointer"
                title={btn.label}
              >
                <span className="truncate">{btn.label}</span>
                <ChevronRight className="w-3 h-3 text-[#3a6d9b] shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
