import React, { useState, useRef } from 'react';
import { JewellerProfile } from '../types';
import { ShreemLogo } from './ShreemLogo';
import { 
  Store, 
  Plus, 
  CheckCircle2, 
  UserCheck, 
  Phone, 
  ShieldCheck, 
  X, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw, 
  Edit3, 
  Check, 
  Sparkles 
} from 'lucide-react';

interface ProfilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: JewellerProfile[];
  activeProfileId: string;
  onSelectProfile: (profileId: string) => void;
  onAddProfile: (profile: JewellerProfile) => void;
  onUpdateProfile?: (profile: JewellerProfile) => void;
}

export const ProfilesModal: React.FC<ProfilesModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onAddProfile,
  onUpdateProfile,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [counterName, setCounterName] = useState('');
  const [counterType, setCounterType] = useState<JewellerProfile['counterType']>('Main Showroom');
  const [operator, setOperator] = useState('');
  const [gstin, setGstin] = useState('23AAMCS9202B1Z8');
  const [phone, setPhone] = useState('+91 9202357851');
  const [logoUrl, setLogoUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleStartEdit = (p: JewellerProfile) => {
    setEditingProfileId(p.id);
    setName(p.name);
    setCounterName(p.counterName);
    setCounterType(p.counterType);
    setOperator(p.operatorName);
    setGstin(p.gstin);
    setPhone(p.phone);
    setLogoUrl(p.logoUrl || '');
    setShowAddForm(true);
  };

  const handleResetForm = () => {
    setShowAddForm(false);
    setEditingProfileId(null);
    setName('');
    setCounterName('');
    setCounterType('Main Showroom');
    setOperator('');
    setGstin('23AAMCS9202B1Z8');
    setPhone('+91 9202357851');
    setLogoUrl('');
  };

  // Handle Logo Upload from Local Device (PNG, JPG, SVG, WebP)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Please choose an image file under 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !counterName.trim()) return;

    if (editingProfileId) {
      // Update existing profile
      const updated: JewellerProfile = {
        id: editingProfileId,
        code: profiles.find(p => p.id === editingProfileId)?.code || `SMJ-CTR-01`,
        name: name.trim(),
        counterName: counterName.trim(),
        counterType,
        operatorName: operator.trim() || 'Counter Incharge',
        gstin: gstin.trim(),
        phone: phone.trim(),
        logoUrl: logoUrl || undefined,
        isDefault: profiles.find(p => p.id === editingProfileId)?.isDefault
      };
      if (onUpdateProfile) {
        onUpdateProfile(updated);
      }
    } else {
      // Create new profile
      const newProf: JewellerProfile = {
        id: `prof-${Date.now()}`,
        code: `SMJ-CTR-0${profiles.length + 1}`,
        name: name.trim(),
        counterName: counterName.trim(),
        counterType,
        operatorName: operator.trim() || 'Counter Incharge',
        gstin: gstin.trim(),
        phone: phone.trim(),
        logoUrl: logoUrl || undefined,
      };
      onAddProfile(newProf);
      onSelectProfile(newProf.id);
    }

    handleResetForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <ShreemLogo size="sm" showText={false} />
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Jeweller Profiles & Custom Logo Settings
              </h3>
              <p className="text-xs text-slate-400">
                हर प्रोफाइल व काउंटर के लिए अलग लोगो, GSTIN व ऑपरेटर सेट करें
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          
          {/* List of Profiles */}
          {!showAddForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Configured Counters & Profiles ({profiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setShowAddForm(true);
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Profile (नया प्रोफाइल)</span>
                </button>
              </div>

              {profiles.map(p => {
                const isActive = p.id === activeProfileId;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg text-slate-100'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Profile Logo Preview */}
                      <div className="shrink-0 p-1 bg-slate-950/80 rounded-xl border border-amber-500/30 flex items-center justify-center w-12 h-12">
                        {p.logoUrl ? (
                          <img 
                            src={p.logoUrl} 
                            alt={p.name} 
                            className="w-10 h-10 object-contain drop-shadow" 
                          />
                        ) : (
                          <ShreemLogo size="sm" showText={false} transparentBg={true} />
                        )}
                      </div>

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
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(p)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Edit profile & logo"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit / Logo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          onSelectProfile(p.id);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                        }`}
                      >
                        {isActive ? 'Current' : 'Select'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add / Edit Profile Form with Dedicated Logo Upload */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-700 pb-2">
                <h4 className="font-bold text-amber-300 text-sm flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-400" />
                  {editingProfileId ? 'Edit Profile & Custom Logo' : 'Create Branch / Counter Profile with Logo'}
                </h4>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-slate-400 hover:text-slate-200 text-xs"
                >
                  Back to List
                </button>
              </div>

              {/* Logo Upload Section */}
              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-amber-500/30 space-y-2">
                <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4" /> Profile Logo (काउंटर का लोगो जोड़ें)
                </span>
                <p className="text-[11px] text-slate-400">
                  Upload your shop / brand logo (PNG with transparent background, JPG or SVG). This will appear on all bills, tags, and receipts generated by this counter.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* Logo Preview */}
                  <div className="w-20 h-20 rounded-xl bg-slate-950 border border-amber-500/40 p-2 flex items-center justify-center shrink-0 shadow-inner">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Profile Logo Preview" 
                        className="w-full h-full object-contain drop-shadow" 
                      />
                    ) : (
                      <ShreemLogo size="sm" showText={false} transparentBg={true} />
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1.5 shadow transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Logo (नया लोगो अपलोड करें)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLogoUrl('/assets/aistudio/Shreem_Mahal_LOGO_355a8e42.png')}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Use Official "श्रीः" Logo</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-lg transition cursor-pointer"
                          title="Reset to default"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <span className="text-[10px] text-slate-500 block">
                      Recommended: Transparent PNG (500x500px). Supports background-removed logos.
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Branch / Store Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Shreem Mahal Jewellers - Main"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Counter Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Gold & Diamond Retail Counter"
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Counter Type</label>
                  <select
                    value={counterType}
                    onChange={(e) => setCounterType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  >
                    <option value="Main Showroom">Main Showroom</option>
                    <option value="Counter 2 (Silver & Gem)">Counter 2 (Silver & Gem)</option>
                    <option value="Wholesale & Bullion">Wholesale & Bullion</option>
                    <option value="Girvi & Karigar Desk">Girvi & Karigar Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Operator / Cashier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Sachin Soni"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Mobile / Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">GSTIN (15-digit)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow transition cursor-pointer"
                >
                  {editingProfileId ? 'Save Profile & Logo' : 'Create Profile'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
