import React, { useState } from 'react';
import { Vendor } from '../../types';
import { X, UserPlus, Building2, Phone, MapPin, ShieldCheck } from 'lucide-react';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVendor: (vendor: Vendor) => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({ isOpen, onClose, onAddVendor }) => {
  const [firmName, setFirmName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [gstin, setGstin] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVendor: Vendor = {
      id: `ven-${Date.now()}`,
      firmName,
      contactPerson,
      phone,
      address,
      city,
      state: 'Madhya Pradesh', // Default
      gstin,
      goldBalanceOwed: 0,
      silverBalanceOwed: 0,
      cashBalanceDue: 0,
      totalPurchasesAmount: 0,
      createdAt: new Date().toISOString()
    };
    onAddVendor(newVendor);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="font-bold text-base flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-400" />
            Add New Vendor
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3 pt-4 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Firm Name *</label>
            <input type="text" value={firmName} onChange={e => setFirmName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">Contact Person</label>
              <input type="text" value={contactPerson} onChange={e => setContactPerson(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
            </div>
            <div>
              <label className="block text-slate-400 mb-1">Phone</label>
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
            </div>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Address</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">City / Village (शहर / गांव) *</label>
            <input 
              type="text" 
              list="indian-cities"
              value={city} 
              onChange={e => setCity(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" 
              placeholder="Type city or village name..."
              required 
            />
            <datalist id="indian-cities">
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
          <div>
            <label className="block text-slate-400 mb-1">GSTIN</label>
            <input type="text" value={gstin} onChange={e => setGstin(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-200" />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg font-bold">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg font-bold">Save Vendor</button>
          </div>
        </form>
      </div>
    </div>
  );
};
