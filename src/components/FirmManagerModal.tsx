import React, { useState, useRef } from 'react';
import { JewellerProfile, StaffInviteRecord, StaffMemberMeta, UserPermissions } from '../types';
import { ShreemLogo } from './ShreemLogo';
import {
  CASHIER_PERMISSIONS,
  FULL_PERMISSIONS,
  MANAGER_PERMISSIONS,
  MODULE_PERMISSION_META,
  capStaffPermissionsToOwner
} from '../lib/accessControl';
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
  ImagePlus,
  Store,
  Trash2,
  Users,
  UserPlus,
  Mail
} from 'lucide-react';

interface FirmManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  firms: JewellerProfile[];
  activeFirmId: string;
  onSelectFirm: (firmId: string) => void;
  onAddFirm: (firm: JewellerProfile) => void;
  onUpdateFirm?: (firm: JewellerProfile) => void;
  onDeleteFirm?: (firmId: string) => void;
  canManageStaff?: boolean;
  currentUid?: string;
  ownerPermissions?: UserPermissions;
  staffInvites?: StaffInviteRecord[];
  onInviteStaff?: (params: {
    email: string;
    displayName?: string;
    role: 'cashier' | 'manager';
    permissions: UserPermissions;
  }) => Promise<void>;
  onUpdateStaffPermissions?: (params: {
    staffUid: string;
    email: string;
    role: 'cashier' | 'manager';
    permissions: UserPermissions;
  }) => Promise<void>;
  onRemoveStaff?: (staffUid: string | undefined, email: string) => Promise<void>;
}

export const FirmManagerModal: React.FC<FirmManagerModalProps> = ({
  isOpen,
  onClose,
  firms,
  activeFirmId,
  onSelectFirm,
  onAddFirm,
  onUpdateFirm,
  onDeleteFirm,
  canManageStaff = false,
  currentUid,
  ownerPermissions = FULL_PERMISSIONS,
  staffInvites = [],
  onInviteStaff,
  onUpdateStaffPermissions,
  onRemoveStaff,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFirmId, setEditingFirmId] = useState<string | null>(null);
  const [confirmDeleteFirmId, setConfirmDeleteFirmId] = useState<string | null>(null);

  // Firm Form Fields
  const [name, setName] = useState('');
  const [counterName, setCounterName] = useState('');
  const [counterType, setCounterType] = useState<JewellerProfile['counterType']>('Main Showroom');
  const [operator, setOperator] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [logoError, setLogoError] = useState('');

  // Staff Invite / Management State
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [staffEmail, setStaffEmail] = useState('');
  const [staffDisplayName, setStaffDisplayName] = useState('');
  const [staffRole, setStaffRole] = useState<'cashier' | 'manager'>('cashier');
  const [staffPerms, setStaffPerms] = useState<UserPermissions>(() =>
    capStaffPermissionsToOwner(CASHIER_PERMISSIONS, ownerPermissions)
  );
  const [editingStaffMember, setEditingStaffMember] = useState<StaffMemberMeta | null>(null);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffFeedback, setStaffFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const activeFirm = firms.find((f) => f.id === activeFirmId);
  const isOwnerOfActiveFirm = Boolean(activeFirm && currentUid && activeFirm.ownerUid === currentUid);
  const showStaffSection = Boolean(activeFirm && (isOwnerOfActiveFirm || canManageStaff) && onInviteStaff);
  const activeStaffMembers: StaffMemberMeta[] = activeFirm?.staffMembers
    ? (Object.values(activeFirm.staffMembers) as StaffMemberMeta[])
    : [];

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
    setLogoError('');
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setLogoError('कृपया 2MB से कम साइज का लोगो चुनें (Image under 2MB).');
        return;
      }
      setLogoError('');
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
      const existing = firms.find((f) => f.id === editingFirmId);
      const updated: JewellerProfile = {
        ...existing,
        id: editingFirmId,
        code: existing?.code || 'FIRM-01',
        name: name.trim(),
        counterName: counterName.trim() || 'Main Counter',
        counterType,
        operatorName: operator.trim() || 'Firm Incharge',
        gstin: gstin.trim().toUpperCase() || 'URP',
        phone: phone.trim(),
        logoUrl: logoUrl || undefined,
        isDefault: existing?.isDefault
      };
      onUpdateFirm?.(updated);
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
        logoUrl: logoUrl || undefined
      };
      onAddFirm(newFirm);
      onSelectFirm(newFirm.id);
    }

    handleResetForm();
  };

  const handleStaffRolePreset = (role: 'cashier' | 'manager') => {
    setStaffRole(role);
    const preset = role === 'manager' ? MANAGER_PERMISSIONS : CASHIER_PERMISSIONS;
    setStaffPerms(capStaffPermissionsToOwner(preset, ownerPermissions));
  };

  const handleSubmitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onInviteStaff) return;
    setStaffSaving(true);
    setStaffFeedback(null);
    try {
      const capped = capStaffPermissionsToOwner(staffPerms, ownerPermissions);
      if (editingStaffMember && onUpdateStaffPermissions) {
        await onUpdateStaffPermissions({
          staffUid: editingStaffMember.uid,
          email: editingStaffMember.email,
          role: staffRole,
          permissions: capped
        });
        setStaffFeedback({ type: 'success', text: `${editingStaffMember.email} की स्टाफ अनुमतियाँ अपडेट हो गई।` });
        setEditingStaffMember(null);
        setShowStaffForm(false);
      } else {
        await onInviteStaff({
          email: staffEmail.trim().toLowerCase(),
          displayName: staffDisplayName.trim(),
          role: staffRole,
          permissions: capped
        });
        setStaffFeedback({
          type: 'success',
          text: `${staffEmail.trim().toLowerCase()} को स्टाफ आमंत्रण भेज दिया गया। साइन इन व अप्रूवल के बाद वे जुड़ जाएंगे।`
        });
        setStaffEmail('');
        setStaffDisplayName('');
        setShowStaffForm(false);
      }
    } catch (err: any) {
      setStaffFeedback({ type: 'error', text: err?.message || 'स्टाफ आमंत्रण सेव नहीं हो सका।' });
    } finally {
      setStaffSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100">

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 dark:text-slate-100 text-base sm:text-lg">
                फर्म, लोगो व स्टाफ प्रबंधन (Firms &amp; Team Access)
              </h3>
              <p className="text-xs text-stone-600 dark:text-slate-400">
                अपनी फर्म चुनें, नई फर्म जोड़ें, या सक्रिय फर्म के लिए स्टाफ आमंत्रित करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">

          {/* List of Firms */}
          {!showAddForm && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 dark:text-slate-400 uppercase tracking-wider">
                  पंजीकृत फर्म सूची ({firms.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleResetForm();
                    setShowAddForm(true);
                  }}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ नई फर्म जोड़ें (Add Firm)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {firms.map((f) => {
                  const isActive = f.id === activeFirmId;

                  return (
                    <div
                      key={f.id}
                      className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isActive
                          ? 'bg-amber-50/90 dark:bg-amber-950/30 border-amber-300 dark:border-amber-600/50 shadow-xs'
                          : 'bg-stone-50 dark:bg-slate-800/70 border-stone-200 dark:border-slate-700/80 hover:bg-stone-100/60 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="shrink-0 p-1.5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-700 flex items-center justify-center w-14 h-14 shadow-2xs">
                          {f.logoUrl ? (
                            <img src={f.logoUrl} alt={f.name} className="w-full h-full object-contain" />
                          ) : (
                            <ShreemLogo size="sm" showText={false} transparentBg={true} />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-stone-900 dark:text-slate-100">{f.name}</h4>
                            {isActive && (
                              <span className="bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-amber-800 dark:text-amber-400 font-semibold">{f.counterName} • {f.counterType}</p>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-600 dark:text-slate-400 pt-1">
                            <span className="flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                              संचालक: <strong className="text-stone-800 dark:text-slate-200">{f.operatorName}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                              GSTIN: <strong className="text-stone-800 dark:text-slate-200 font-mono">{f.gstin}</strong>
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-stone-400 dark:text-slate-500" />
                              {f.phone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(f)}
                          className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-700 dark:text-slate-200 border border-stone-300 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          title="फर्म व लोगो एडिट करें"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span>एडिट</span>
                        </button>

                        {firms.length > 1 && onDeleteFirm && (
                          confirmDeleteFirmId === f.id ? (
                            <div className="flex items-center gap-1 bg-rose-100 dark:bg-rose-950 px-2 py-1 rounded-xl border border-rose-300 dark:border-rose-700">
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteFirm(f.id);
                                  setConfirmDeleteFirmId(null);
                                }}
                                className="text-[10px] font-black text-rose-700 dark:text-rose-300 cursor-pointer"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteFirmId(null)}
                                className="text-[10px] font-bold text-stone-600 dark:text-slate-400 ml-1 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteFirmId(f.id)}
                              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl transition cursor-pointer"
                              title="फर्म डिलीट करें (Delete Firm)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectFirm(f.id);
                            onClose();
                          }}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold shrink-0 transition cursor-pointer ${
                            isActive
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'bg-stone-200 dark:bg-slate-700 text-stone-800 dark:text-slate-200 hover:bg-stone-300 dark:hover:bg-slate-600'
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

          {/* Add / Edit Firm Form */}
          {showAddForm && (
            <form onSubmit={handleSubmit} className="bg-stone-50 dark:bg-slate-800/80 border border-stone-200 dark:border-slate-700/80 p-5 rounded-3xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-700 pb-2">
                <h4 className="font-extrabold text-stone-900 dark:text-slate-100 text-sm flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  {editingFirmId ? 'फर्म विवरण व लोगो एडिट करें' : 'नई फर्म रजिस्टर करें (+ Register Firm)'}
                </h4>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-slate-100 text-xs font-semibold cursor-pointer"
                >
                  ← वापस सूची पर जाएं
                </button>
              </div>

              {/* Logo Upload Section */}
              <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-stone-200 dark:border-slate-700 space-y-2">
                <span className="font-bold text-stone-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                  फर्म का लोगो (Firm Logo)
                </span>
                {logoError && <p className="text-[11px] font-bold text-rose-600">{logoError}</p>}

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-slate-800 border-2 border-dashed border-stone-300 dark:border-slate-600 hover:border-amber-500 p-2 flex flex-col items-center justify-center shrink-0 cursor-pointer transition"
                    title="लोगो अपलोड करें"
                  >
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <>
                        <ImagePlus className="w-5 h-5 text-stone-400" />
                        <span className="text-[8px] font-bold text-stone-400 mt-0.5 text-center leading-tight">
                          Blank
                        </span>
                      </>
                    )}
                  </button>

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
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>लोगो अपलोड करें</span>
                      </button>

                      {logoUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoUrl('')}
                          className="p-1.5 bg-stone-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-stone-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
                          title="हटाएं"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-bold mb-1">फर्म / दुकान का नाम *</label>
                  <input
                    type="text"
                    required
                    placeholder="उदा. श्री महालक्ष्मी ज्वेलर्स"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 font-bold text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-medium mb-1">काउंटर / शाखा का नाम</label>
                  <input
                    type="text"
                    placeholder="उदा. Main Retail Counter"
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-medium mb-1">काउंटर का प्रकार</label>
                  <select
                    value={counterType}
                    onChange={(e) => setCounterType(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                  >
                    <option value="Main Showroom">Main Showroom</option>
                    <option value="Counter 2 (Silver & Gem)">Counter 2 (Silver &amp; Gem)</option>
                    <option value="Wholesale & Bullion">Wholesale &amp; Bullion</option>
                    <option value="Girvi & Karigar Desk">Girvi &amp; Karigar Desk</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-medium mb-1">संचालक / ऑपरेटर</label>
                  <input
                    type="text"
                    placeholder="उदा. सचिन सोनी"
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 dark:text-slate-300 font-medium mb-1">मोबाइल नंबर</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 font-mono text-sm focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 dark:text-slate-300 font-medium mb-1">GSTIN नंबर (15 डिजिट)</label>
                <input
                  type="text"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                  placeholder="23AAMCS9202B1Z8"
                  className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-xl px-3 py-2 text-stone-900 dark:text-slate-100 font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 dark:hover:bg-slate-600 text-stone-800 dark:text-slate-200 font-bold rounded-xl transition cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow transition cursor-pointer"
                >
                  {editingFirmId ? 'बदलाव सहेजें (Save Changes)' : 'फर्म जोड़ें (Add Firm)'}
                </button>
              </div>
            </form>
          )}

          {/* Staff & Team RBAC Section for Active Firm */}
          {showStaffSection && !showAddForm && (
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-600" />
                  <div>
                    <h4 className="text-xs font-extrabold text-stone-900 dark:text-white uppercase tracking-wider">
                      Staff &amp; Team Access — {activeFirm?.name}
                    </h4>
                    <p className="text-[11px] text-stone-500 dark:text-slate-400">
                      अपने स्टाफ को ईमेल से जोड़ें (स्टाफ की अनुमतियाँ Owner से अधिक नहीं हो सकतीं)
                    </p>
                  </div>
                </div>

                {!showStaffForm && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStaffMember(null);
                      setStaffEmail('');
                      setStaffDisplayName('');
                      handleStaffRolePreset('cashier');
                      setShowStaffForm(true);
                    }}
                    className="px-3 py-1.5 bg-stone-900 dark:bg-slate-800 hover:bg-stone-800 text-amber-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Invite Staff
                  </button>
                )}
              </div>

              {staffFeedback && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                    staffFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  <span>{staffFeedback.text}</span>
                  <button type="button" onClick={() => setStaffFeedback(null)} className="cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {showStaffForm && (
                <form
                  onSubmit={handleSubmitStaff}
                  className="bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-stone-900 dark:text-white">
                      {editingStaffMember ? `Edit Staff: ${editingStaffMember.email}` : 'Invite New Staff by Email'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStaffForm(false);
                        setEditingStaffMember(null);
                      }}
                      className="text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block font-bold text-stone-600 dark:text-slate-400 mb-1">Staff Email *</label>
                      <input
                        type="email"
                        required
                        disabled={Boolean(editingStaffMember)}
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="staff@example.com"
                        className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 dark:text-slate-400 mb-1">Staff Name</label>
                      <input
                        type="text"
                        disabled={Boolean(editingStaffMember)}
                        value={staffDisplayName}
                        onChange={(e) => setStaffDisplayName(e.target.value)}
                        placeholder="e.g. Amit Verma"
                        className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 dark:text-slate-400 mb-1">Role Preset</label>
                      <select
                        value={staffRole}
                        onChange={(e) => handleStaffRolePreset(e.target.value as 'cashier' | 'manager')}
                        className="w-full bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                      >
                        <option value="cashier">Cashier</option>
                        <option value="manager">Manager</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                    {MODULE_PERMISSION_META.map((mod) => {
                      const ownerAllows = Boolean(ownerPermissions?.[mod.key]);
                      return (
                        <label
                          key={mod.key}
                          className={`flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg border text-[11px] ${
                            !ownerAllows
                              ? 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-slate-900 border-stone-200 dark:border-slate-800'
                              : staffPerms[mod.key]
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 cursor-pointer'
                                : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-700 cursor-pointer'
                          }`}
                          title={ownerAllows ? mod.label : 'Owner account does not have this permission'}
                        >
                          <span className="truncate font-semibold">{mod.label}</span>
                          <input
                            type="checkbox"
                            disabled={!ownerAllows}
                            checked={Boolean(ownerAllows && staffPerms[mod.key])}
                            onChange={(e) =>
                              setStaffPerms((prev) => ({
                                ...prev,
                                [mod.key]: ownerAllows ? e.target.checked : false
                              }))
                            }
                            className="w-3.5 h-3.5 accent-emerald-600"
                          />
                        </label>
                      );
                    })}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={staffSaving}
                      className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl text-xs cursor-pointer"
                    >
                      {staffSaving ? 'Saving...' : editingStaffMember ? 'Update Staff Permissions' : 'Send Staff Invite'}
                    </button>
                  </div>
                </form>
              )}

              {/* Existing Staff & Pending Invites */}
              <div className="space-y-2">
                {activeStaffMembers.map((member) => (
                  <div
                    key={member.uid}
                    className="p-2.5 rounded-xl bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-900 dark:text-white flex items-center gap-2">
                        <span>{member.displayName || member.email}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {member.role} (Active)
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 dark:text-slate-400">{member.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {onUpdateStaffPermissions && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingStaffMember(member);
                            setStaffEmail(member.email);
                            setStaffDisplayName(member.displayName || '');
                            setStaffRole(member.role);
                            setStaffPerms(capStaffPermissionsToOwner(member.permissions, ownerPermissions));
                            setShowStaffForm(true);
                          }}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-600 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Edit Perms
                        </button>
                      )}
                      {onRemoveStaff && (
                        <button
                          type="button"
                          onClick={() => onRemoveStaff(member.uid, member.email)}
                          className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {staffInvites
                  .filter((inv) => inv.status === 'pending')
                  .map((inv) => (
                    <div
                      key={inv.id}
                      className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex flex-wrap items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-amber-600" />
                        <div>
                          <div className="font-bold text-stone-900 dark:text-white">
                            {inv.displayName || inv.email}{' '}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-200 text-amber-900">
                              Pending Invite ({inv.role})
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 dark:text-slate-400">{inv.email}</div>
                        </div>
                      </div>
                      {onRemoveStaff && (
                        <button
                          type="button"
                          onClick={() => onRemoveStaff(inv.acceptedUid, inv.email)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-900 text-rose-600 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}

                {activeStaffMembers.length === 0 && staffInvites.filter((i) => i.status === 'pending').length === 0 && (
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 italic">
                    अभी इस फर्म में कोई अतिरिक्त स्टाफ सदस्य नहीं जोड़ा गया है।
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
