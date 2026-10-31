import React, { useState, useRef } from 'react';
import { ShopDetails } from '../types';
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
  Sparkles 
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
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden text-slate-100 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Jewellery Store & Brand Settings</h2>
              <p className="text-xs text-slate-400">Shop metadata, custom logo, GSTIN, BIS Hallmark and invoice credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Shop Logo Upload & Customization */}
          <div className="p-4 bg-slate-850 rounded-2xl border border-amber-500/30 space-y-2.5">
            <span className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              Shop Logo & Brand Identity (दुकान का मुख्य लोगो)
            </span>
            <p className="text-[11px] text-slate-400">
              Customize the logo printed on Tax Invoices, Estimates, Thermal HUID Tags, and top header. Supports PNG with transparent background.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-amber-500/40 p-2 flex items-center justify-center shrink-0 shadow-inner">
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
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 shadow transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload New Logo (नया लोगो अपलोड करें)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('logoUrl', '/assets/aistudio/Shreem_Mahal_LOGO_355a8e42.png')}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Default Golden "श्रीः" Logo</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('logoUrl', '')}
                      className="p-1.5 bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded-xl transition cursor-pointer"
                      title="Reset to default logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-slate-500 block">
                  Supports PNG, JPG, WebP & SVG with transparent backgrounds.
                </span>
              </div>
            </div>
          </div>

          {/* Shop Basic Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4" /> Shop Profile & Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Store Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-bold focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Tagline / Subheading</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => handleChange('tagline', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City, State, Pincode</label>
                <input
                  type="text"
                  value={formData.cityStatePincode}
                  onChange={e => handleChange('cityStatePincode', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number(s)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Tax & Registration Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Tax & Certification Compliance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">BIS Hallmark Reg No.</label>
                <input
                  type="text"
                  value={formData.bisHallmarkRegNo}
                  onChange={e => handleChange('bisHallmarkRegNo', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-emerald-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Income Tax PAN</label>
                <input
                  type="text"
                  value={formData.panNo}
                  onChange={e => handleChange('panNo', e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-800" />

          {/* Bank Details for Invoice QR / RTGS */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" /> Shop Bank Account (Printed on Bills)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Bank Name & Branch</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={e => handleChange('bankName', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNo}
                  onChange={e => handleChange('accountNo', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition cursor-pointer"
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
