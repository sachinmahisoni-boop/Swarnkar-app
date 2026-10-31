import React, { useState } from 'react';
import { JewellerProfile } from '../types';
import { ShreemLogo } from './ShreemLogo';
import { Store, Plus, CheckCircle2, UserCheck, Phone, ShieldCheck, X } from 'lucide-react';

interface ProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: JewellerProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onAddProfile: (profile: JewellerProfile) => void;
}

export const ProfilesModal: React.FC<ProfilesModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCounterName, setNewCounterName] = useState('');
  const [newCounterType, setNewCounterType] = useState<JewellerProfile['counterType']>('Main Showroom');
  const [newOperator, setNewOperator] = useState('');
  const [newGstin, setNewGstin] = useState('23AAMCS9202B1Z8');
  const [newPhone, setNewPhone] = useState('+91 9202357851');

  if (!isOpen) return null;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCounterName.trim()) return;

    const newProf: JewellerProfile = {
      id: `prof-${Date.now()}`,
      code: `SMJ-CTR-0${profiles.length + 1}`,
      name: newName.trim(),
      counterName: newCounterName.trim(),
      counterType: newCounterType,
      operatorName: newOperator.trim() || 'Counter Incharge',
      gstin: newGstin.trim(),
      phone: newPhone.trim(),
    };

    onAddProfile(newProf);
    onSelectProfile(newProf.id);
    setShowAddForm(false);
    setNewName('');
    setNewCounterName('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ShreemLogo size="sm" showText={false} />
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Multiple Jeweller Profiles & Branch Counters
              </h3>
              <p className="text-xs text-slate-400">
                Switch billing desks, branch outlets or register dedicated counter operators.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profiles List */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {profiles.map(p => {
            const isActive = p.id === activeProfileId;

            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectProfile(p.id);
                  onClose();
                }}
                className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-amber-500/10 border-amber-500/60 shadow-lg text-slate-100'
                    : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold bg-slate-950 px-2 py-0.5 rounded text-amber-400 border border-amber-500/30">
                      {p.code}
                    </span>
                    <h4 className="font-bold text-sm text-slate-100">{p.name}</h4>
                    {isActive && (
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Active Counter
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-amber-200/90 font-medium">{p.counterName}</p>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      Operator: <strong className="text-slate-300">{p.operatorName}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                      GSTIN: <strong className="text-slate-300">{p.gstin}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {p.phone}
                    </span>
                  </div>
                </div>

                <button
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {isActive ? 'Current' : 'Select'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Add New Profile Form / Button */}
        {showAddForm ? (
          <form onSubmit={handleAddSubmit} className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl space-y-3 text-xs mt-3">
            <h4 className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-400" /> Create Branch / Counter Profile
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Branch / Store Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Shreem Mahal - New Market Branch"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Counter Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Bridal Diamond Counter"
                  value={newCounterName}
                  onChange={(e) => setNewCounterName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Counter Type</label>
                <select
                  value={newCounterType}
                  onChange={(e) => setNewCounterType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-200"
                >
                  <option value="Main Showroom">Main Showroom</option>
                  <option value="Counter 2 (Silver & Gem)">Counter 2 (Silver & Gem)</option>
                  <option value="Wholesale & Bullion">Wholesale & Bullion</option>
                  <option value="Girvi & Karigar Desk">Girvi & Karigar Desk</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Operator / Cashier</label>
                <input
                  type="text"
                  placeholder="e.g. Rakesh Soni"
                  value={newOperator}
                  onChange={(e) => setNewOperator(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={newGstin}
                  onChange={(e) => setNewGstin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-700 text-slate-300 font-bold rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg"
              >
                Save & Activate Counter
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-2 flex justify-between items-center border-t border-slate-800">
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Another Counter / Branch
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
