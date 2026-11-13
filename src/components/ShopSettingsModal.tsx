import React, { useState, useRef, useEffect } from 'react';
import { InvoiceTemplateLayout, ShopDetails } from '../types';
import { ShreemLogo } from './ShreemLogo';
import { 
  X, 
  Save, 
  Store, 
  Building2, 
  CreditCard, 
  FileText, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw, 
  Sparkles,
  Printer,
  Receipt,
  CheckCircle2
} from 'lucide-react';

interface ShopSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopDetails: ShopDetails;
  onSaveShopDetails: (updated: ShopDetails) => void;
}

export const ShopSettingsModal: React.FC<ShopSettingsModalProps> = ({
  isOpen,
  onClose,
  shopDetails,
  onSaveShopDetails,
}) => {
  const [formData, setFormData] = useState<ShopDetails>(shopDetails);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        ...shopDetails,
        defaultInvoiceLayout: shopDetails.defaultInvoiceLayout || 'A4',
      });
    }
  }, [shopDetails, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof ShopDetails, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
          handleChange('logoUrl', event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveShopDetails(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl border border-amber-200 dark:border-amber-500/30">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 font-serif">ज्वेलरी शोरूम व ब्रांड सेटिंग्स (Store & Brand Settings)</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Shop metadata, custom logo, GSTIN, BIS Hallmark and invoice credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Shop Logo Upload & Customization */}
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/40 space-y-2.5">
            <span className="font-extrabold text-amber-950 dark:text-amber-300 text-xs flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Shop Logo & Brand Identity (दुकान का मुख्य लोगो)
            </span>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Customize the logo printed on Tax Invoices, Estimates, Thermal HUID Tags, and top header. Supports PNG with transparent background.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-600 p-2 flex items-center justify-center shrink-0 shadow-sm">
                {formData.logoUrl ? (
                  <img 
                    src={formData.logoUrl} 
                    alt="Store Logo Preview" 
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
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Logo (नया लोगो अपलोड करें)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '/assets/aistudio/Shreem_Mahal_LOGO_355a8e42.png')}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-600 rounded-xl flex items-center gap-1.5 font-bold transition cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Default Golden "श्रीः" Logo</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('logoUrl', '')}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl transition cursor-pointer"
                      title="Reset to default logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                  Supports PNG, JPG, WebP & SVG with transparent backgrounds.
                </span>
              </div>
            </div>
          </div>

          {/* Shop Basic Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Shop Profile & Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Store Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tagline / Subheading</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => handleChange('tagline', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">City, State, Pincode *</label>
                <input
                  type="text"
                  list="cities"
                  value={formData.cityStatePincode}
                  onChange={e => handleChange('cityStatePincode', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                  placeholder="Type city or select from list..."
                  required
                />
                <datalist id="cities">
                  <option value="Bhopal, Madhya Pradesh" />
                  <option value="Indore, Madhya Pradesh" />
                  <option value="Mumbai, Maharashtra" />
                  <option value="Delhi, Delhi" />
                  <option value="Bangalore, Karnataka" />
                  <option value="Jaipur, Rajasthan" />
                  <option value="Ahmedabad, Gujarat" />
                  <option value="Lucknow, Uttar Pradesh" />
                  <option value="Patna, Bihar" />
                  <option value="Chandigarh, Punjab/Haryana" />
                  <option value="Hyderabad, Telangana" />
                  <option value="Chennai, Tamil Nadu" />
                  <option value="Kolkata, West Bengal" />
                  <option value="Raipur, Chhattisgarh" />
                  <option value="Ranchi, Jharkhand" />
                  <option value="Dehradun, Uttarakhand" />
                  <option value="Bhubaneswar, Odisha" />
                  <option value="Thiruvananthapuram, Kerala" />
                  <option value="Guwahati, Assam" />
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number(s)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Tax & Registration Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Tax & Certification Compliance
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-700 dark:text-amber-400 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">BIS Hallmark Reg No.</label>
                <input
                  type="text"
                  value={formData.bisHallmarkRegNo}
                  onChange={e => handleChange('bisHallmarkRegNo', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Income Tax PAN</label>
                <input
                  type="text"
                  value={formData.panNo}
                  onChange={e => handleChange('panNo', e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Bank Details for Invoice QR / RTGS */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Shop Bank Account (Printed on Bills)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name & Branch</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={e => handleChange('bankName', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNo}
                  onChange={e => handleChange('accountNo', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Invoice Templates Default Layout Selector */}
          <div className="space-y-3" data-testid="invoice-templates-section">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-extrabold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Invoice Templates (बिल प्रिंट टेम्पलेट)
              </h3>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Default layout for billing prints
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(
                [
                  {
                    id: 'A4' as InvoiceTemplateLayout,
                    title: 'A4 Portrait',
                    hindi: 'पूर्ण पेज बिल (210×297mm)',
                    desc: 'Full official GST Tax Invoice with complete hallmark & bank details.',
                    icon: FileText,
                  },
                  {
                    id: 'A5' as InvoiceTemplateLayout,
                    title: 'A5 Half-Page',
                    hindi: 'हाफ पेज बिल (148×210mm)',
                    desc: 'Compact half-sheet layout ideal for regular jewellery counter bills.',
                    icon: FileText,
                  },
                  {
                    id: 'POS_80MM' as InvoiceTemplateLayout,
                    title: '80mm Thermal Receipt',
                    hindi: 'थर्मल रसीद (3" रोल)',
                    desc: 'Continuous thermal receipt format for quick POS counters & estimates.',
                    icon: Receipt,
                  },
                ]
              ).map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = (formData.defaultInvoiceLayout || 'A4') === tpl.id;
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleChange('defaultInvoiceLayout', tpl.id)}
                    aria-pressed={isSelected}
                    className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/25 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`p-2 rounded-xl ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                          <CheckCircle2 className="w-3 h-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-xs text-slate-900 dark:text-white">{tpl.title}</div>
                      <div className="text-[11px] font-bold text-amber-800 dark:text-amber-400">{tpl.hindi}</div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">{tpl.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings & Logo</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
