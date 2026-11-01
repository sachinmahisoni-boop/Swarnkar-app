import React, { useState, useRef } from 'react';
import { JewellerProfile } from '../types';
import { ShreemLogo } from './ShreemLogo';
import { 
  Building2, 
  Plus, 
  CheckCircle2, 
  UserCheck, 
  Phone, 
  ShieldCheck, 
  X, 
  Upload, 
  RotateCcw, 
  Edit3, 
  Sparkles,
  Store
} from 'lucide-react';

interface FirmManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  firms: JewellerProfile[];
  activeFirmId: string;
  onSelectFirm: (firmId: string) => void;
  onAddFirm: (firm: JewellerProfile) => void;
  onUpdateFirm?: (firm: JewellerProfile) => void;
}

export const FirmManagerModal: React.FC<FirmManagerModalProps> = ({
  isOpen,
  onClose,
  firms,
  activeFirmId,
  onSelectFirm,
  onAddFirm,
  onUpdateFirm,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFirmId, setEditingFirmId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [counterName, setCounterName] = useState('');
  const [counterType, setCounterType] = useState<JewellerProfile['counterType']>('Main Showroom');
  const [operator, setOperator] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [logoUrl, setLogoUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleStartEdit = (f: JewellerProfile) => {
    setEditingFirmId(f.id);
    setName(f.name);
    setCounterName(f.counterName);
    setCounterType(f.counterType);
    setOperator(f.operatorName);
    setGstin(f.gstin);
    setPhone(f.phone);
    setLogoUrl(f.logoUrl || '');
    setShowAddForm(true);
  };

  const handleResetForm = () => {
    setShowAddForm(false);
    setEditingFirmId(null);
    setName('');
    setCounterName('');
    setCounterType('Main Showroom');
    setOperator('');
    setGstin('');
    setPhone('+91 ');
    setLogoUrl('');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('कृपया 2MB से कम साइज का लोगो चुनें (Image under 2MB).');
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
    if (!name.trim()) return;

    if (editingFirmId) {
      const updated: JewellerProfile = {
        id: editingFirmId,
        code: firms.find(f => f.id === editingFirmId)?.code || `FIRM-01`,
        name: name.trim(),
        counterName: counterName.trim() || 'Main Counter',
        counterType,
        operatorName: operator.trim() || 'Firm Incharge',
        gstin: gstin.trim().toUpperCase() || 'URP',
        phone: phone.trim(),
        logoUrl: logoUrl || undefined,
        isDefault: firms.find(f => f.id === editingFirmId)?.isDefault
      };
      if (onUpdateFirm) {
        onUpdateFirm(updated);
      }
    } else {
      const newFirm: JewellerProfile = {
        id: `firm-${Date.now()}`,
        code: `FIRM-0${firms.length + 1}`,
        name: name.trim(),
        counterName: counterName.trim() || 'Main Counter',
        counterType,
        operatorName: operator.trim() || 'Firm Incharge',
        gstin: gstin.trim().toUpperCase() || 'URP',
        phone: phone.trim(),
        logoUrl: logoUrl || undefined,
      };
      onAddFirm(newFirm);
      onSelectFirm(newFirm.id);
    }

    handleResetForm();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-lg">
                पंजीकृत फर्म व लोगो प्रबंधन (Firm & Logo Manager)
              </h3>
              <p className="text-xs text-stone-500">
                अपनी फर्म चुनें, नई फर्म रजिस्टर करें या लोगो व GSTIN अपडेट करें
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-stone-400 hover:text-stone-700 p-2 rounded-xl hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          
          {/* List of Firms */}
          {!showAddForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  पंजीकृत फर्म सूची ({firms.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setShowAddForm(true);
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ नई फर्म जोड़ें (Add Firm)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {firms.map(f => {
                  const isActive = f.id === activeFirmId;

                  return (
                    <div
                      key={f.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isActive
                          ? 'bg-amber-50/80 border-amber-300 shadow-sm'
                          : 'bg-stone-50 border-stone-200 hover:bg-stone-100/60'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="shrink-0 p-1.5 bg-white rounded-2xl border border-stone-200 flex items-center justify-center w-14 h-14 shadow-2xs">
                          {f.logoUrl ? (
                            <img 
                              src={f.logoUrl} 
                              alt={f.name} 
                              className="w-full h-full object-contain" 
                            />
                          ) : (
                            <ShreemLogo size="sm" showText={false} transparentBg={true} />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-stone-900">{f.name}</h4>
                            {isActive && (
                              <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3" /> सक्रिय फर्म (Active)
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-amber-800 font-medium">{f.counterName} • {f.counterType}</p>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-500 pt-1">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-stone-400" />
                              संचालक: <strong className="text-stone-700">{f.operatorName}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                              GSTIN: <strong className="text-stone-700 font-mono">{f.gstin}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-stone-400" />
                              {f.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(f)}
                          className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="फर्म व लोगो एडिट करें"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>एडिट</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectFirm(f.id);
                            onClose();
                          }}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-white shadow'
                              : 'bg-stone-200 text-stone-800 hover:bg-stone-300'
                          }`}
                        >
                          {isActive ? 'Current Firm' : 'Select Firm'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add / Edit Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-200 p-5 rounded-3xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h4 className="font-extrabold text-stone-900 text-sm flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-600" />
                  {editingFirmId ? 'फर्म विवरण व लोगो एडिट करें' : 'नई फर्म रजिस्टर करें (+ Register Firm)'}
                </h4>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-stone-500 hover:text-stone-800 text-xs font-semibold"
                >
                  ← वापस सूची पर जाएं
                </button>
              </div>

              {/* Logo Upload Section */}
              <div className="p-3.5 bg-white rounded-2xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                  फर्म का लोगो (Firm Logo)
                </span>
                <p className="text-[11px] text-stone-500">
                  यह लोगो आपके सभी बिलों व टैक्स इनवॉइस पर प्रिंट होगा। पारदर्शी (Transparent) PNG या JPG चुन सकते हैं।
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 p-2 flex items-center justify-center shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
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
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>लोगो अपलोड करें</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setLogoUrl('/assets/aistudio/Shreem_Mahal_LOGO_355a8e42.png')}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 rounded-xl flex items-center gap-1 transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>डिफ़ॉल्ट "श्रीः" लोगो रखें</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="p-1.5 bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
                          title="हटाएं"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">फर्म / दुकान का नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. श्री महालक्ष्मी ज्वेलर्स"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">काउंटर / शाखा का नाम</label>
                  <input
                    type="text"
                    placeholder="उदा. Main Retail Counter"
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">काउंटर का प्रकार</label>
                  <select
                    value={counterType}
                    onChange={(e) => setCounterType(e.target.value as any)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-sm"
                  >
                    <option value="Main Showroom">Main Showroom</option>
                    <option value="Counter 2 (Silver & Gem)">Counter 2 (Silver & Gem)</option>
                    <option value="Wholesale & Bullion">Wholesale & Bullion</option>
                    <option value="Girvi & Karigar Desk">Girvi & Karigar Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">संचालक / ऑपरेटर</label>
                  <input
                    type="text"
                    placeholder="उदा. सचिन सोनी"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">मोबाइल नंबर</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">GSTIN नंबर (15 डिजिट)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="23AAMCS9202B1Z8"
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-stone-900 font-mono font-bold text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow transition cursor-pointer"
                >
                  {editingFirmId ? 'बदलाव सहेजें (Save Changes)' : 'फर्म जोड़ें (Add Firm)'}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
