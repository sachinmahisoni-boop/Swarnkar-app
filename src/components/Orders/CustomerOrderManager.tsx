import React, { useState } from 'react';
import { Customer, JewelleryItem, MetalRate } from '../../types';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Phone, 
  FileText, 
  RotateCcw, 
  Printer, 
  Send, 
  MessageCircle, 
  Scale, 
  Tag, 
  Check, 
  X, 
  Edit3 
} from 'lucide-react';
import { getISTDate } from '../../lib/invoiceNumber';

export interface CustomerOrder {
  id: string;
  orderNo: string;
  orderDate: string;
  deliveryDate: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  itemDescription: string;
  metal: 'Gold' | 'Silver' | 'Platinum' | 'Diamond';
  purity: string;
  approxGrossWeight: number;
  rateBookedPerGram: number; // भाव बंधाना (Rate Locked)
  advanceAmountPaid: number;
  advanceGoldGivenWeight: number; // e.g. 10g old gold given in advance
  estimatedTotalAmount: number;
  assignedKarigarName?: string;
  status: 'Booked' | 'In Karigar Workshop' | 'Ready for Delivery' | 'Delivered' | 'Cancelled';
  notes?: string;
}

export interface ApprovalSaleItem {
  id: string;
  voucherNo: string;
  issueDate: string;
  returnDueDate: string;
  customerName: string;
  customerPhone: string;
  items: {
    tagNo: string;
    name: string;
    metal: string;
    purity: string;
    grossWeight: number;
    estimatedValue: number;
    status: 'With Customer' | 'Purchased & Billed' | 'Returned to Stock';
  }[];
  depositAmount: number;
  status: 'Open' | 'Fully Returned' | 'Partially Billed' | 'Settled';
  notes?: string;
}

interface CustomerOrderManagerProps {
  customers: Customer[];
  inventory: JewelleryItem[];
  rates: MetalRate[];
  onBillApprovedItem?: (item: any) => void;
}

export const CustomerOrderManager: React.FC<CustomerOrderManagerProps> = ({
  customers,
  inventory,
  rates,
  onBillApprovedItem,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'approval'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Customer Orders state
  const [orders, setOrders] = useState<CustomerOrder[]>([
    {
      id: 'ord-01',
      orderNo: 'ORD-2026-081',
      orderDate: '2026-10-25',
      deliveryDate: '2026-11-10',
      customerId: 'cust-01',
      customerName: 'Smt. Sunita Sharma',
      customerPhone: '9826012345',
      itemDescription: 'Traditional 22K Rajputi Aad Haar with Meenakari & Pearls',
      metal: 'Gold',
      purity: '22K',
      approxGrossWeight: 65.50,
      rateBookedPerGram: 13050,
      advanceAmountPaid: 200000,
      advanceGoldGivenWeight: 20.00,
      estimatedTotalAmount: 854775,
      assignedKarigarName: 'Gopal Soni (Bengali Karigar)',
      status: 'In Karigar Workshop',
      notes: 'Rate locked on 25-Oct at ₹13,050/g. Requires antique polish finish.'
    },
    {
      id: 'ord-02',
      orderNo: 'ORD-2026-082',
      orderDate: '2026-10-28',
      deliveryDate: '2026-11-04',
      customerId: 'cust-02',
      customerName: 'Shri Rajeshwar Rao',
      customerPhone: '9425098765',
      itemDescription: '18K Diamond Solitaire Men Ring (0.75 ct VVS-EF)',
      metal: 'Diamond',
      purity: '18K',
      approxGrossWeight: 8.20,
      rateBookedPerGram: 10800,
      advanceAmountPaid: 50000,
      advanceGoldGivenWeight: 0,
      estimatedTotalAmount: 185000,
      assignedKarigarName: 'Diamond Micro Setting Unit',
      status: 'Ready for Delivery',
      notes: 'IGI Certificate included. Ready in vault.'
    }
  ]);

  // Approval Sales (Uchhanti) State
  const [approvalList, setApprovalList] = useState<ApprovalSaleItem[]>([
    {
      id: 'appr-01',
      voucherNo: 'UCH-2026-019',
      issueDate: '2026-10-30',
      returnDueDate: '2026-11-02',
      customerName: 'Smt. Kavita Chouhan',
      customerPhone: '9179043210',
      depositAmount: 15000,
      status: 'Open',
      notes: 'Bridal family selection. Taken 3 haar sets for home trial.',
      items: [
        {
          tagNo: 'SMJ-2026-001',
          name: 'Royal Kundan Gold Necklace 22K',
          metal: 'Gold',
          purity: '22K',
          grossWeight: 45.85,
          estimatedValue: 593176,
          status: 'With Customer'
        },
        {
          tagNo: 'SMJ-2026-004',
          name: 'Traditional Temple Lakshmi Choker 22K',
          metal: 'Gold',
          purity: '22K',
          grossWeight: 38.20,
          estimatedValue: 495000,
          status: 'With Customer'
        }
      ]
    }
  ]);

  // Form Modals
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showNewApprovalModal, setShowNewApprovalModal] = useState(false);

  // New Order Form Fields
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMetal, setNewMetal] = useState<'Gold' | 'Silver' | 'Platinum' | 'Diamond'>('Gold');
  const [newPurity, setNewPurity] = useState('22K');
  const [newWeight, setNewWeight] = useState(25.0);
  const [newRateLock, setNewRateLock] = useState(13085);
  const [newAdvanceCash, setNewAdvanceCash] = useState(50000);
  const [newAdvanceGold, setNewAdvanceGold] = useState(0);
  const [newDeliveryDate, setNewDeliveryDate] = useState('');
  const [newKarigar, setNewKarigar] = useState('Gopal Soni (Bengali Karigar)');

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const estTotal = Math.round(newWeight * newRateLock * 1.12);
    const newOrd: CustomerOrder = {
      id: `ord-${Date.now()}`,
      orderNo: `ORD-2026-0${Math.floor(83 + Math.random() * 90)}`,
      orderDate: getISTDate().isoDateStr,
      deliveryDate: newDeliveryDate || getISTDate(new Date(Date.now() + 10 * 86400000)).isoDateStr,
      customerId: `cust-${Date.now()}`,
      customerName: newCustName,
      customerPhone: newCustPhone,
      itemDescription: newDesc,
      metal: newMetal,
      purity: newPurity,
      approxGrossWeight: Number(newWeight),
      rateBookedPerGram: Number(newRateLock),
      advanceAmountPaid: Number(newAdvanceCash),
      advanceGoldGivenWeight: Number(newAdvanceGold),
      estimatedTotalAmount: estTotal,
      assignedKarigarName: newKarigar,
      status: 'Booked',
      notes: `Rate booked at ₹${newRateLock}/g. Adv Cash ₹${newAdvanceCash}, Adv Gold ${newAdvanceGold}g`
    };

    setOrders([newOrd, ...orders]);
    setShowNewOrderModal(false);
    // Reset
    setNewCustName('');
    setNewCustPhone('');
    setNewDesc('');
  };

  const handleSendReadySMS = (order: CustomerOrder) => {
    const text = `प्रिय ${order.customerName} जी, आपका आभूषण आर्डर ${order.orderNo} (${order.itemDescription}) तैयार हो गया है। कृपया दुकान पर पधारकर डिलीवरी प्राप्त करें। - Shreem Mahal Jewellers, Bhopal (9202357851)`;
    window.open(`https://wa.me/91${order.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleMarkItemReturned = (approvalId: string, tagNo: string) => {
    setApprovalList(prev => prev.map(app => {
      if (app.id !== approvalId) return app;
      const updatedItems = app.items.map(it => it.tagNo === tagNo ? { ...it, status: 'Returned to Stock' as const } : it);
      const allReturned = updatedItems.every(i => i.status === 'Returned to Stock');
      return {
        ...app,
        items: updatedItems,
        status: allReturned ? 'Fully Returned' : 'Partially Billed'
      };
    }));
  };

  return (
    <div className="space-y-4 text-slate-800">
      
      {/* Top Header & Mode Switcher */}
      <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span>ग्राहक आर्डर व उछन्ती बिक्री (Customer Orders & Approval Sales)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Maintain custom wedding orders with gold rate locking and home approval (उछन्ती) memos
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'orders' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span>Custom Orders ({orders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('approval')}
              className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'approval' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <span>Approval / Uchhanti ({approvalList.length})</span>
            </button>
          </div>

          {activeTab === 'orders' ? (
            <button
              onClick={() => setShowNewOrderModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Book New Order</span>
            </button>
          ) : (
            <button
              onClick={() => setShowNewApprovalModal(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Issue Approval Memo</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'orders' ? (
        <div className="space-y-3">
          
          {/* Order Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {orders.map((ord) => (
              <div 
                key={ord.id}
                className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3 hover:border-blue-400 transition"
              >
                <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-blue-900 text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {ord.orderNo}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{ord.customerName}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {ord.customerPhone}
                    </span>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    ord.status === 'Ready for Delivery' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    ord.status === 'In Karigar Workshop' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {ord.status}
                  </span>
                </div>

                {/* Details */}
                <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <p className="font-extrabold text-slate-900">{ord.itemDescription}</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                    <div>धातु व शुद्धता: <strong>{ord.purity} {ord.metal}</strong></div>
                    <div>अनुमानित वजन: <strong>{ord.approxGrossWeight}g</strong></div>
                    <div>भाव बांधा (Locked Rate): <strong className="text-blue-900 font-mono">₹{ord.rateBookedPerGram}/g</strong></div>
                    <div>अनुमानित बिल: <strong className="font-mono text-slate-900">₹{ord.estimatedTotalAmount.toLocaleString('en-IN')}</strong></div>
                    <div>जमा नकदी (Adv Cash): <strong className="text-emerald-700 font-mono">₹{ord.advanceAmountPaid.toLocaleString('en-IN')}</strong></div>
                    <div>जमा पुराना सोना: <strong className="text-amber-800 font-mono">{ord.advanceGoldGivenWeight}g</strong></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>डिलीवरी तारीख: <strong className="text-slate-800">{ord.deliveryDate}</strong></span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleSendReadySMS(ord)}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      title="Send WhatsApp Ready Notification"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                    {ord.status === 'Ready for Delivery' && (
                      <button
                        onClick={() => {
                          alert(`Order ${ord.orderNo} delivered and forwarded to final billing!`);
                          setOrders(prev => prev.map(o => o.id === ord.id ? { ...o, status: 'Delivered' } : o));
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>Deliver & Bill</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="space-y-3">
          
          {/* Approval Memo List */}
          {approvalList.map((appr) => (
            <div 
              key={appr.id}
              className="bg-white border border-slate-300 rounded-xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300 text-xs">
                    {appr.voucherNo}
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 text-sm">{appr.customerName}</span>
                    <span className="text-xs text-slate-500 ml-2 font-mono">{appr.customerPhone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs">
                  <span>जारी दिनांक: <strong>{appr.issueDate}</strong></span>
                  <span>वापसी देय: <strong className="text-rose-700">{appr.returnDueDate}</strong></span>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    appr.status === 'Open' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  }`}>
                    {appr.status}
                  </span>
                </div>
              </div>

              {/* Items Table in Approval */}
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse border border-slate-200 rounded-lg">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                    <tr>
                      <th className="p-2 border-b border-slate-200">Tag No</th>
                      <th className="p-2 border-b border-slate-200">Item Description</th>
                      <th className="p-2 border-b border-slate-200">Purity</th>
                      <th className="p-2 border-b border-slate-200 text-right">Gross Wt</th>
                      <th className="p-2 border-b border-slate-200 text-right">Estimated Value</th>
                      <th className="p-2 border-b border-slate-200 text-center">Status</th>
                      <th className="p-2 border-b border-slate-200 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appr.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono font-bold text-amber-900">{it.tagNo}</td>
                        <td className="p-2 font-bold text-slate-800">{it.name}</td>
                        <td className="p-2 font-semibold text-slate-700">{it.purity}</td>
                        <td className="p-2 text-right font-mono">{it.grossWeight}g</td>
                        <td className="p-2 text-right font-mono font-bold">₹{it.estimatedValue.toLocaleString('en-IN')}</td>
                        <td className="p-2 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            it.status === 'With Customer' ? 'bg-amber-100 text-amber-900' :
                            it.status === 'Returned to Stock' ? 'bg-slate-100 text-slate-600' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {it.status}
                          </span>
                        </td>
                        <td className="p-2 text-right">
                          {it.status === 'With Customer' && (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleMarkItemReturned(appr.id, it.tagNo)}
                                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold rounded cursor-pointer"
                              >
                                Return
                              </button>
                              <button
                                onClick={() => {
                                  alert(`Item ${it.tagNo} confirmed for purchase! Redirecting to bill.`);
                                  if (onBillApprovedItem) onBillApprovedItem(it);
                                }}
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded cursor-pointer"
                              >
                                Bill Now
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

        </div>
      )}

      {/* New Order Modal */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-300 rounded-2xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">नया आभूषण आर्डर बुक करें (Book Customer Order)</h3>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. श्रीमती अनिता सोनी"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="98260XXXXX"
                    value={newCustPhone}
                    onChange={(e) => setNewCustPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Ornament Description *</label>
                <input
                  type="text"
                  required
                  placeholder="उदा. 22K Traditional Bridal Choker Set with Antique Polish"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Metal</label>
                  <select
                    value={newMetal}
                    onChange={(e) => setNewMetal(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-bold"
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Diamond">Diamond</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Purity</label>
                  <select
                    value={newPurity}
                    onChange={(e) => setNewPurity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-bold"
                  >
                    <option value="22K">22K 916</option>
                    <option value="18K">18K 750</option>
                    <option value="24K">24K</option>
                    <option value="925 Sterling">Silver 925</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Weight (g)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 bg-blue-50/70 p-2.5 rounded-xl border border-blue-200">
                <div>
                  <label className="block text-blue-900 font-bold mb-1">Rate Lock (भाव बंधाना ₹/g) *</label>
                  <input
                    type="number"
                    value={newRateLock}
                    onChange={(e) => setNewRateLock(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 font-mono font-black text-blue-900"
                  />
                </div>
                <div>
                  <label className="block text-blue-900 font-bold mb-1">Advance Cash (₹)</label>
                  <input
                    type="number"
                    value={newAdvanceCash}
                    onChange={(e) => setNewAdvanceCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-blue-300 rounded-lg px-2.5 py-1.5 font-mono font-black text-emerald-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Adv Old Gold (g)</label>
                  <input
                    type="number"
                    value={newAdvanceGold}
                    onChange={(e) => setNewAdvanceGold(parseFloat(e.target.value) || 0)}
                    placeholder="0g"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Promised Delivery Date</label>
                  <input
                    type="date"
                    value={newDeliveryDate}
                    onChange={(e) => setNewDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg shadow-sm cursor-pointer"
                >
                  Save & Print Order Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
