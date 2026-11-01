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
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden text-stone-900 max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 bg-stone-50 border-b border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl border border-amber-200">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-stone-900 font-serif">ज्वेलरी शोरूम व ब्रांड सेटिंग्स (Store & Brand Settings)</h2>
              <p className="text-xs text-stone-500">Shop metadata, custom logo, GSTIN, BIS Hallmark and invoice credentials</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-xl hover:bg-stone-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-5 overflow-y-auto flex-1 text-xs">
          
          {/* Shop Logo Upload & Customization */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-2.5">
            <span className="font-extrabold text-amber-950 text-xs flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-amber-600" />
              Shop Logo & Brand Identity (दुकान का मुख्य लोगो)
            </span>
            <p className="text-[11px] text-stone-600">
              Customize the logo printed on Tax Invoices, Estimates, Thermal HUID Tags, and top header. Supports PNG with transparent background.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <div className="w-20 h-20 rounded-2xl bg-white border border-amber-300 p-2 flex items-center justify-center shrink-0 shadow-sm">
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
                    className="px-3 py-1.5 bg-white hover:bg-stone-50 text-amber-900 border border-amber-300 rounded-xl flex items-center gap-1.5 font-bold transition cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Default Golden "श्रीः" Logo</span>
                  </button>

                  {formData.logoUrl && (
                    <button
                      type="button"
                      onClick={() => handleChange('logoUrl', '')}
                      className="p-1.5 bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
                      title="Reset to default logo"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <span className="text-[10px] text-stone-500 block">
                  Supports PNG, JPG, WebP & SVG with transparent backgrounds.
                </span>
              </div>
            </div>
          </div>

          {/* Shop Basic Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-4 h-4 text-amber-600" /> Shop Profile & Address
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Store Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-bold focus:outline-none focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Tagline / Subheading</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={e => handleChange('tagline', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Street Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">City, State, Pincode *</label>
                <input
                  type="text"
                  list="cities"
                  value={formData.cityStatePincode}
                  onChange={e => handleChange('cityStatePincode', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
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
                <label className="block text-xs font-bold text-stone-700 mb-1">Phone Number(s)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 font-mono font-medium focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Tax & Registration Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-amber-600" /> Tax & Certification Compliance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={e => handleChange('gstin', e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-amber-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">BIS Hallmark Reg No.</label>
                <input
                  type="text"
                  value={formData.bisHallmarkRegNo}
                  onChange={e => handleChange('bisHallmarkRegNo', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-emerald-700 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Income Tax PAN</label>
                <input
                  type="text"
                  value={formData.panNo}
                  onChange={e => handleChange('panNo', e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          <hr className="border-stone-200" />

          {/* Bank Details for Invoice QR / RTGS */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-amber-600" /> Shop Bank Account (Printed on Bills)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Bank Name & Branch</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={e => handleChange('bankName', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">Account Number</label>
                <input
                  type="text"
                  value={formData.accountNo}
                  onChange={e => handleChange('accountNo', e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={e => handleChange('ifscCode', e.target.value.toUpperCase())}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-mono font-bold text-stone-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-stone-200 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
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
