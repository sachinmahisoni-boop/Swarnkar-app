import React, { useState } from 'react';
import { Customer, GSTInvoice, ShopDetails } from '../../types';
import { Users, Search, Plus, Phone, Mail, MapPin, Copy, Check, DollarSign, Send, FileText, Trash2, Edit3 } from 'lucide-react';
import { getISTDate } from '../../lib/invoiceNumber';

interface CustomerListProps {
  customers: Customer[];
  invoices: GSTInvoice[];
  shopDetails: ShopDetails;
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  invoices,
  shopDetails,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCustForLedger, setSelectedCustForLedger] = useState<Customer | null>(null);
  const [copiedReminderId, setCopiedReminderId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: 'Bhopal',
    state: 'Madhya Pradesh (23)',
    gstin: ''
  });

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm) ||
    (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalDuesAcrossCustomers = customers.reduce((acc, c) => acc + c.outstandingBalance, 0);

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (formData.id) {
      onUpdateCustomer(formData as Customer);
    } else {
      const newCust: Customer = {
        id: `cust-${Date.now()}`,
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        address: formData.address || '',
        city: formData.city || 'Bhopal',
        state: formData.state || 'Madhya Pradesh (23)',
        gstin: formData.gstin || '',
        totalPurchases: 0,
        outstandingBalance: 0,
        createdAt: getISTDate().isoDateStr
      };
      onAddCustomer(newCust);
    }

    setShowAddModal(false);
    setFormData({ name: '', phone: '', email: '', address: '', city: 'Bhopal', state: 'Madhya Pradesh (23)', gstin: '' });
  };

  // Generate Copyable WhatsApp / SMS Reminder Draft
  const handleCopyReminderStatement = (customer: Customer) => {
    const custInvoices = invoices.filter(inv => inv.customerId === customer.id);
    const text = `
*JEWELLERY BILLING STATEMENT & DUE REMINDER*
Store: *${shopDetails.name}*
Contact: ${shopDetails.phone}

Dear ${customer.name},
Thank you for your valued patronage.

*Outstanding Balance:* ₹${customer.outstandingBalance.toLocaleString('en-IN')}

*Bank Account Details for Payment:*
Bank: ${shopDetails.bankName}
Account No: ${shopDetails.accountNo}
IFSC Code: ${shopDetails.ifscCode}
UPI/GPay: ${shopDetails.phone}

For any queries regarding your invoices, please feel free to call us.
    `.trim();

    navigator.clipboard.writeText(text);
    setCopiedReminderId(customer.id);
    setTimeout(() => setCopiedReminderId(null), 2500);
  };

  return (
    <div className="space-y-6">
      
      {/* Customer Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-md transition">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Registered Customers</span>
          <p className="text-xl font-black text-amber-600 dark:text-amber-300 mt-0.5">{customers.length} Clients</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-md transition">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Total Customer Ledger Purchases</span>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
            ₹{Math.round(customers.reduce((a, c) => a + c.totalPurchases, 0)).toLocaleString('en-IN')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-md transition">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Total Pending Dues Receivable</span>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">
            ₹{Math.round(totalDuesAcrossCustomers).toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm dark:shadow-md flex flex-col md:flex-row gap-3 items-center justify-between transition">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customer name, phone, GSTIN..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
          />
        </div>

        <button
          onClick={() => {
            setFormData({ name: '', phone: '', email: '', address: '', city: 'Mumbai', state: 'Maharashtra', gstin: '' });
            setShowAddModal(true);
          }}
          className="w-full md:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-md overflow-hidden text-slate-900 dark:text-slate-100 transition">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <th className="p-3.5">Customer Name & GSTIN</th>
                <th className="p-3.5">Contact Details</th>
                <th className="p-3.5">City / Address</th>
                <th className="p-3.5 text-right">Lifetime Purchases</th>
                <th className="p-3.5 text-right">Outstanding Dues</th>
                <th className="p-3.5 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 dark:text-slate-400">
                    No customers found matching search.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    
                    <td className="p-3.5">
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">{cust.name}</p>
                      {cust.gstin ? (
                        <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-amber-200 dark:border-slate-700 font-bold">
                          GSTIN: {cust.gstin}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Retail Consumer</span>
                      )}
                    </td>

                    <td className="p-3.5 space-y-0.5">
                      <p className="font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1 font-semibold">
                        <Phone className="w-3 h-3 text-amber-500" /> {cust.phone}
                      </p>
                      {cust.email && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400" /> {cust.email}
                        </p>
                      )}
                    </td>

                    <td className="p-3.5 text-slate-700 dark:text-slate-300">
                      <p className="truncate max-w-xs">{cust.address || `${cust.city}, ${cust.state}`}</p>
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{Math.round(cust.totalPurchases).toLocaleString('en-IN')}
                    </td>

                    <td className="p-3.5 text-right font-mono font-black text-rose-600 dark:text-rose-400">
                      {cust.outstandingBalance > 0 ? (
                        <span>₹{Math.round(cust.outstandingBalance).toLocaleString('en-IN')}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[10px]">No Dues</span>
                      )}
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Copy Due Reminder Statement */}
                        {cust.outstandingBalance > 0 && (
                          <button
                            onClick={() => handleCopyReminderStatement(cust)}
                            className="px-2.5 py-1 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            title="Copy Due Payment Reminder"
                          >
                            {copiedReminderId === cust.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy Statement</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setFormData(cust);
                            setShowAddModal(true);
                          }}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Edit Customer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDeleteCustomer(cust.id)}
                          className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5 text-slate-900 dark:text-slate-100 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-amber-300">
              {formData.id ? 'Edit Customer Details' : 'Add New Customer'}
            </h3>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mobile Phone Number *</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Street Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={e => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">GSTIN (If B2B Registered Business)</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => setFormData(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-amber-600 dark:text-amber-300 font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
