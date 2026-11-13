import React, { useState, useEffect } from 'react';
import {
  Clock,
  Ban,
  LogOut,
  RefreshCw,
  Building2,
  Phone,
  User,
  Mail,
  CheckCircle2,
  KeyRound,
  Save,
  MessageCircle,
} from 'lucide-react';
import { AppUserAccessRecord, PublicSupportConfig } from '../../types';
import { updateUserProfileFields } from '../../lib/firestoreSync';

interface ApprovalGateScreenProps {
  userAccess: AppUserAccessRecord | null;
  userEmail?: string | null;
  userUid: string;
  supportConfig?: PublicSupportConfig | null;
  permissionError?: string | null;
  databaseId?: string;
  onRefresh: () => void;
  onLogout: () => void;
}

export const ApprovalGateScreen: React.FC<ApprovalGateScreenProps> = ({
  userAccess,
  userEmail,
  userUid,
  supportConfig,
  permissionError,
  databaseId,
  onRefresh,
  onLogout,
}) => {
  const status = userAccess?.status || 'pending';
  const [displayName, setDisplayName] = useState(userAccess?.displayName || '');
  const [firmName, setFirmName] = useState(userAccess?.firmName || '');
  const [phone, setPhone] = useState(userAccess?.phone || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (userAccess) {
      setDisplayName((prev) => prev || userAccess.displayName || '');
      setFirmName((prev) => prev || userAccess.firmName || '');
      setPhone((prev) => prev || userAccess.phone || '');
    }
  }, [userAccess]);

  const handleUpdateRequestInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMsg('');
    setErrorMsg('');
    try {
      await updateUserProfileFields(userUid, {
        displayName: displayName.trim(),
        firmName: firmName.trim(),
        phone: phone.trim(),
      });
      setSavedMsg('आपका विवरण Master Admin को भेज दिया गया है।');
    } catch (err: any) {
      setErrorMsg(err?.message || 'विवरण सेव करने में त्रुटि हुई।');
    } finally {
      setSaving(false);
    }
  };

  const isSuspended = status === 'suspended';

  const rawSupportPhone = (supportConfig?.supportPhone || '').trim();
  const digitsOnly = rawSupportPhone.replace(/[^0-9]/g, '');
  const waPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
  const waMessage = encodeURIComponent(
    `नमस्ते एडमिन, कृपया मेरे Swarnkar ERP खाते को Approve करें।\nEmail: ${userAccess?.email || userEmail || ''}\nUID: ${userUid}\nShop: ${firmName || userAccess?.firmName || ''}`
  );
  const whatsAppUrl = waPhone ? `https://wa.me/${waPhone}?text=${waMessage}` : '';
  const supportEmail = (supportConfig?.supportEmail || '').trim();

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div
          className={`p-6 text-center border-b ${
            isSuspended
              ? 'bg-gradient-to-r from-rose-950 via-stone-900 to-rose-950 border-rose-500/30 text-white'
              : 'bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 border-amber-500/30 text-white'
          }`}
        >
          <div className="flex justify-center mb-3">
            <div
              className={`p-3.5 rounded-2xl border ${
                isSuspended
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}
            >
              {isSuspended ? <Ban className="w-8 h-8" /> : <Clock className="w-8 h-8 animate-pulse" />}
            </div>
          </div>

          <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/10 border border-white/20 mb-2">
            Swarnkar ERP • Access Control Gate
          </span>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            {isSuspended
              ? 'Account Suspended, Contact Admin'
              : 'Approval Pending — Contact Admin'}
          </h1>

          <p className="text-xs text-stone-300 mt-1.5 max-w-md mx-auto">
            {isSuspended
              ? 'आपका खाता अस्थायी रूप से रोका गया है। पुनः सक्रिय करने के लिए एडमिन से संपर्क करें।'
              : 'सुरक्षा कारणों से नया खाता केवल Master Admin की अनुमति (Approve) के बाद ही चालू होता है।'}
          </p>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {permissionError && (
            <div className="bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-2xl p-4 text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
              <div className="font-black text-rose-800 dark:text-rose-300">
                Firestore Security Rules Publish Required
              </div>
              <p className="leading-relaxed">
                Database <code className="font-mono font-bold bg-rose-100 dark:bg-rose-900/60 px-1.5 py-0.5 rounded">{databaseId || '(default)'}</code> returned <span className="font-bold">Missing or insufficient permissions</span> while checking <code className="font-mono">users/{'{uid}'}</code>.
                Please publish the updated <code className="font-mono font-bold">firestore.rules</code> file in <strong>Firebase Console → Firestore Database → Rules</strong> for this database, then click <strong>Refresh</strong> below.
              </p>
            </div>
          )}

          {/* Account Summary Box */}
          <div className="bg-stone-50 dark:bg-slate-800/70 border border-stone-200 dark:border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-stone-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                Registered Email:
              </span>
              <span className="font-bold text-stone-900 dark:text-slate-100 truncate">
                {userAccess?.email || userEmail || 'N/A'}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-stone-500 dark:text-slate-400 flex items-center gap-1.5 font-semibold">
                <KeyRound className="w-3.5 h-3.5 text-stone-500" />
                User ID (UID):
              </span>
              <span className="font-mono text-[11px] bg-stone-200/80 dark:bg-slate-700 px-2 py-0.5 rounded font-bold text-stone-800 dark:text-slate-200 truncate max-w-[220px]">
                {userUid}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-500 dark:text-slate-400 font-semibold">Current Status:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  isSuspended
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {status}
              </span>
            </div>

            {userAccess?.adminNotes && (
              <div className="pt-2 border-t border-stone-200 dark:border-slate-700 text-[11px] text-rose-700 dark:text-rose-300 font-semibold">
                Admin Note: {userAccess.adminNotes}
              </div>
            )}
          </div>

          {/* Contact Admin Card (WhatsApp / Phone / Email) */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/70 rounded-2xl p-4 space-y-2.5">
            <div className="text-xs font-extrabold text-emerald-900 dark:text-emerald-300 flex items-center justify-between">
              <span>{supportConfig?.supportName || 'Master Admin Support Desk'}</span>
              {rawSupportPhone && <span className="font-mono">{rawSupportPhone}</span>}
            </div>

            {whatsAppUrl || rawSupportPhone || supportEmail ? (
              <div className="flex flex-wrap gap-2">
                {whatsAppUrl && (
                  <a
                    href={whatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 min-w-[140px] py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp Admin
                  </a>
                )}
                {rawSupportPhone && (
                  <a
                    href={`tel:${rawSupportPhone}`}
                    className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-stone-100 text-stone-800 dark:text-slate-100 border border-stone-300 dark:border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    Call
                  </a>
                )}
                {supportEmail && (
                  <a
                    href={`mailto:${supportEmail}?subject=${encodeURIComponent('Swarnkar ERP Approval Request')}`}
                    className="py-2 px-3 bg-white dark:bg-slate-800 hover:bg-stone-100 text-stone-800 dark:text-slate-100 border border-stone-300 dark:border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-amber-600" />
                    Email
                  </a>
                )}
              </div>
            ) : (
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                शीघ्र स्वीकृति के लिए अपने सिस्टम एडमिन को ऊपर दिया गया Registered Email या UID भेजें।
              </p>
            )}
          </div>

          {/* Pending User Info Form */}
          {status === 'pending' && (
            <form onSubmit={handleUpdateRequestInfo} className="space-y-3">
              <div className="text-xs font-extrabold text-stone-800 dark:text-slate-200">
                अपनी दुकान का विवरण दर्ज/अपडेट करें (ताकि Master Admin आपको पहचानकर Approve कर सकें):
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                    आपका नाम (Name)
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="अपना नाम लिखें"
                      className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                    मोबाइल नंबर (Phone)
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="98260XXXXX"
                      className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-stone-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-600 dark:text-slate-400 mb-1">
                  दुकान / फर्म का नाम (Jewellery Shop Name)
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 absolute left-3 top-2.5 text-amber-600" />
                  <input
                    type="text"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="उदा. श्री महालक्ष्मी ज्वेलर्स"
                    className="w-full bg-stone-50 dark:bg-slate-800 border border-stone-300 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-stone-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {savedMsg && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{savedMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-stone-950 font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'सेव हो रहा है...' : 'प्रोफ़ाइल विवरण सेव करें (Save Request Details)'}
              </button>
            </form>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onRefresh}
              className="py-2.5 px-3 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              स्थिति जांचें (Refresh)
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="py-2.5 px-3 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              लॉगआउट (Logout)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
