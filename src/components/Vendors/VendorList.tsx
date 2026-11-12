import React, { useState } from 'react';
import { Vendor } from '../../types';
import { Building2, Plus, Search, Phone, Mail, MapPin, Scale, DollarSign, Edit3, Trash2, X, Check, ShieldCheck } from 'lucide-react';
import { getISTDate } from '../../lib/invoiceNumber';

interface VendorListProps {
  vendors: Vendor[];
  onAddVendor: (vendor: Vendor) => void;
  onUpdateVendor: (vendor: Vendor) => void;
  onDeleteVendor: (id: string) => void;
  onOpenNewPurchase?: (vendorId: string) => void;
}

export const VendorList: React.FC<VendorListProps> = ({
  vendors,
  onAddVendor,
  onUpdateVendor,
  onDeleteVendor,
  onOpenNewPurchase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Form State
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Madhya Pradesh (23)');
  const [gstin, setGstin] = useState('');
  const [goldBalanceOwed, setGoldBalanceOwed] = useState<number>(0);
  const [silverBalanceOwed, setSilverBalanceOwed] = useState<number>(0);
  const [cashBalanceDue, setCashBalanceDue] = useState<number>(0);

  const filteredVendors = vendors.filter(v =>
    v.firmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.phone.includes(searchQuery) ||
    (v.gstin && v.gstin.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Aggregates
  const totalCashDues = vendors.reduce((s, v) => s + v.cashBalanceDue, 0);
  const totalGoldDues = vendors.reduce((s, v) => s + v.goldBalanceOwed, 0);
  const totalSilverDues = vendors.reduce((s, v) => s + v.silverBalanceOwed, 0);
  const totalPurchases = vendors.reduce((s, v) => s + v.totalPurchasesAmount, 0);

  const handleOpenAdd = () => {
    setEditingVendor(null);
    setFirmName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setCity('Bhopal');
    setState('Madhya Pradesh (23)');
    setGstin('');
    setGoldBalanceOwed(0);
    setSilverBalanceOwed(0);
    setCashBalanceDue(0);
    setShowAddModal(true);
  };

  const handleOpenEdit = (v: Vendor) => {
    setEditingVendor(v);
    setFirmName(v.firmName);
    setContactPerson(v.contactPerson);
    setPhone(v.phone);
    setEmail(v.email || '');
    setAddress(v.address);
    setCity(v.city);
    setState(v.state);
    setGstin(v.gstin || '');
    setGoldBalanceOwed(v.goldBalanceOwed);
    setSilverBalanceOwed(v.silverBalanceOwed);
    setCashBalanceDue(v.cashBalanceDue);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmName.trim() || !phone.trim()) return;

    if (editingVendor) {
      const updated: Vendor = {
        ...editingVendor,
        firmName: firmName.trim(),
        contactPerson: contactPerson.trim() || firmName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim() || 'Bhopal',
        state: state.trim() || 'Madhya Pradesh (23)',
        gstin: gstin.trim(),
        goldBalanceOwed: Number(goldBalanceOwed) || 0,
        silverBalanceOwed: Number(silverBalanceOwed) || 0,
        cashBalanceDue: Number(cashBalanceDue) || 0,
      };
      onUpdateVendor(updated);
    } else {
      const newV: Vendor = {
        id: `ven-${Date.now()}`,
        firmName: firmName.trim(),
        contactPerson: contactPerson.trim() || firmName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim() || 'Bhopal',
        state: state.trim() || 'Madhya Pradesh (23)',
        gstin: gstin.trim(),
        goldBalanceOwed: Number(goldBalanceOwed) || 0,
        silverBalanceOwed: Number(silverBalanceOwed) || 0,
        cashBalanceDue: Number(cashBalanceDue) || 0,
        totalPurchasesAmount: 0,
        createdAt: getISTDate().isoDateStr
      };
      onAddVendor(newV);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg space-y-1 transition">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Registered Bullion Vendors</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-300 font-mono">{vendors.length} Firms</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Wholesalers & refineries</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg space-y-1 transition">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Cash Dues Owed to Vendors</span>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">₹{totalCashDues.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-rose-700 dark:text-rose-400">Pending purchase bills</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg space-y-1 transition">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Fine Gold Owed (Fine Wt)</span>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{totalGoldDues.toFixed(2)} g</p>
          <span className="text-[10px] text-amber-700 dark:text-amber-400">Barter/bullion accounts</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm dark:shadow-lg space-y-1 transition">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Lifetime Purchase Volume</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹{totalPurchases.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">Inward stock total</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm dark:shadow-lg transition">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Search vendor firm, person or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          + Register New Vendor (नया सप्लायर जोड़ें)
        </button>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-500 dark:text-slate-400 shadow-sm">
            No vendors found matching search. Register a new bullion vendor using the button above.
          </div>
        ) : (
          filteredVendors.map(vendor => (
            <div
              key={vendor.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm dark:shadow-md space-y-3 hover:border-amber-400 dark:hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base truncate">{vendor.firmName}</h4>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold truncate">Contact: {vendor.contactPerson}</p>
                </div>
                {vendor.gstin && (
                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 shrink-0">
                    GST
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">{vendor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="line-clamp-1">{vendor.address}, {vendor.city} ({vendor.state})</span>
                </div>
                {vendor.gstin && (
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span>GSTIN: {vendor.gstin}</span>
                  </div>
                )}
              </div>

              {/* Balances Box */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Cash Balance Due:</span>
                  <span className={`font-mono font-bold text-sm ${vendor.cashBalanceDue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    ₹{vendor.cashBalanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Gold Owed:</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-300 text-sm">
                    {vendor.goldBalanceOwed.toFixed(2)} g
                  </span>
                </div>
                {vendor.silverBalanceOwed > 0 && (
                  <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 text-[10px]">Silver Owed: </span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{vendor.silverBalanceOwed.toFixed(2)} g</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                {onOpenNewPurchase ? (
                  <button
                    onClick={() => onOpenNewPurchase(vendor.id)}
                    className="text-amber-600 dark:text-amber-400 hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    + Record Purchase Bill
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">Reg: {vendor.createdAt}</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(vendor)}
                    className="p-1.5 text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Edit Vendor"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`क्या आप वाकई वेंडर/सप्लायर "${vendor.firmName}" को डिलीट करना चाहते हैं?`)) {
                        onDeleteVendor(vendor.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                    title="Delete Vendor"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Add / Edit Vendor */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl text-slate-900 dark:text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                {editingVendor ? 'Edit Vendor Details' : 'Register New Vendor / Wholesaler'}
              </h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Firm / Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Zaveri Bullion Mumbai or MP Gold Refinery"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Contact Person *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kantilal Soni"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 9820011445"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">GSTIN (if applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g. 23AABCS1234H1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 font-mono uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">City / Village (शहर / गांव)</label>
                  <input
                    type="text"
                    list="vendor-cities"
                    placeholder="e.g. Bhopal / Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                  <datalist id="vendor-cities">
                    <option value="Bhopal, Madhya Pradesh" />
                    <option value="Indore, Madhya Pradesh" />
                    <option value="Jabalpur, Madhya Pradesh" />
                    <option value="Gwalior, Madhya Pradesh" />
                    <option value="Ujjain, Madhya Pradesh" />
                    <option value="Mumbai, Maharashtra" />
                    <option value="Delhi, Delhi" />
                    <option value="Ahmedabad, Gujarat" />
                    <option value="Jaipur, Rajasthan" />
                    <option value="Lucknow, Uttar Pradesh" />
                    <option value="Kanpur, Uttar Pradesh" />
                    <option value="Patna, Bihar" />
                    <option value="Raipur, Chhattisgarh" />
                    <option value="Nagpur, Maharashtra" />
                    <option value="Pune, Maharashtra" />
                    <option value="Surat, Gujarat" />
                    <option value="Rajkot, Gujarat" />
                    <option value="Kota, Rajasthan" />
                    <option value="Jodhpur, Rajasthan" />
                    <option value="Bikaner, Rajasthan" />
                    <option value="Agra, Uttar Pradesh" />
                    <option value="Varanasi, Uttar Pradesh" />
                    <option value="Meerut, Uttar Pradesh" />
                    <option value="Ranchi, Jharkhand" />
                    <option value="Jamshedpur, Jharkhand" />
                    <option value="Bhubaneswar, Odisha" />
                    <option value="Cuttack, Odisha" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 mb-1 font-semibold">Address / Sarafa Bazar Location</label>
                <input
                  type="text"
                  placeholder="e.g. Sheikh Memon Street or Sarafa Chowk"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Initial Balances */}
              <div className="bg-slate-100/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">Initial / Current Khata Balances</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-0.5 font-medium">Cash Due (₹)</label>
                    <input
                      type="number"
                      value={cashBalanceDue}
                      onChange={(e) => setCashBalanceDue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-900 dark:text-slate-100 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-0.5 font-medium">Gold Owed (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goldBalanceOwed}
                      onChange={(e) => setGoldBalanceOwed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-amber-600 dark:text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 text-[10px] mb-0.5 font-medium">Silver Owed (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={silverBalanceOwed}
                      onChange={(e) => setSilverBalanceOwed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingVendor ? 'Save Changes' : 'Register Vendor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
