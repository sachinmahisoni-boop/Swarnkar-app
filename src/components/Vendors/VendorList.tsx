import React, { useState } from 'react';
import { Vendor } from '../../types';
import { Building2, Plus, Search, Phone, Mail, MapPin, Scale, DollarSign, Edit3, Trash2, X, Check, ShieldCheck } from 'lucide-react';

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
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddVendor(newV);
    }

    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-medium">Registered Bullion Vendors</span>
          <p className="text-2xl font-black text-amber-300 font-mono">{vendors.length} Firms</p>
          <span className="text-[10px] text-slate-500">Wholesalers & refineries</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-medium">Cash Dues Owed to Vendors</span>
          <p className="text-2xl font-black text-rose-400 font-mono">₹{totalCashDues.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-rose-500/80">Pending purchase bills</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-medium">Fine Gold Owed (Fine Wt)</span>
          <p className="text-2xl font-black text-amber-400 font-mono">{totalGoldDues.toFixed(2)} g</p>
          <span className="text-[10px] text-amber-500/80">Barter/bullion accounts</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-1">
          <span className="text-xs text-slate-400 font-medium">Lifetime Purchase Volume</span>
          <p className="text-2xl font-black text-emerald-400 font-mono">₹{totalPurchases.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500">Inward stock total</span>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search vendor firm, person or GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 w-72 focus:outline-none focus:border-amber-500"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          + Register New Vendor (नया सप्लायर जोड़ें)
        </button>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
            No vendors found matching search. Register a new bullion vendor using the button above.
          </div>
        ) : (
          filteredVendors.map(vendor => (
            <div
              key={vendor.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-base line-clamp-1">{vendor.firmName}</h4>
                  <p className="text-xs text-amber-400 font-medium">Contact: {vendor.contactPerson}</p>
                </div>
                {vendor.gstin && (
                  <span className="bg-slate-800 text-slate-300 font-mono text-[10px] px-2 py-0.5 rounded border border-slate-700">
                    GST
                  </span>
                )}
              </div>

              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="font-mono text-slate-300 font-bold">{vendor.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="line-clamp-1">{vendor.address}, {vendor.city} ({vendor.state})</span>
                </div>
                {vendor.gstin && (
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>GSTIN: {vendor.gstin}</span>
                  </div>
                )}
              </div>

              {/* Balances Box */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Cash Balance Due:</span>
                  <span className={`font-mono font-bold text-sm ${vendor.cashBalanceDue > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    ₹{vendor.cashBalanceDue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Gold Owed:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {vendor.goldBalanceOwed.toFixed(2)} g
                  </span>
                </div>
                {vendor.silverBalanceOwed > 0 && (
                  <div className="col-span-2 pt-1 border-t border-slate-700">
                    <span className="text-slate-400 text-[10px]">Silver Owed: </span>
                    <span className="font-mono font-bold text-slate-200">{vendor.silverBalanceOwed.toFixed(2)} g</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                {onOpenNewPurchase ? (
                  <button
                    onClick={() => onOpenNewPurchase(vendor.id)}
                    className="text-amber-400 hover:underline font-bold text-[11px]"
                  >
                    + Record Purchase Bill
                  </button>
                ) : (
                  <span className="text-[10px] text-slate-500">Reg: {vendor.createdAt}</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(vendor)}
                    className="p-1.5 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                    title="Edit Vendor"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteVendor(vendor.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                {editingVendor ? 'Edit Vendor Details' : 'Register New Vendor / Wholesaler'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Firm / Company Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Zaveri Bullion Mumbai or MP Gold Refinery"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Contact Person *</label>
                  <input
                    type="text"
                    placeholder="e.g. Kantilal Soni"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mobile Number *</label>
                  <input
                    type="text"
                    placeholder="e.g. 9820011445"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">GSTIN (if applicable)</label>
                  <input
                    type="text"
                    placeholder="e.g. 23AABCS1234H1Z5"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">City / State</label>
                  <input
                    type="text"
                    placeholder="e.g. Bhopal / Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Address / Sarafa Bazar Location</label>
                <input
                  type="text"
                  placeholder="e.g. Sheikh Memon Street or Sarafa Chowk"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>

              {/* Initial Balances */}
              <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700 space-y-2">
                <span className="font-bold text-slate-300 block">Initial / Current Khata Balances</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Cash Due (₹)</label>
                    <input
                      type="number"
                      value={cashBalanceDue}
                      onChange={(e) => setCashBalanceDue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Gold Owed (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={goldBalanceOwed}
                      onChange={(e) => setGoldBalanceOwed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-amber-300 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-0.5">Silver Owed (g)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={silverBalanceOwed}
                      onChange={(e) => setSilverBalanceOwed(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
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
