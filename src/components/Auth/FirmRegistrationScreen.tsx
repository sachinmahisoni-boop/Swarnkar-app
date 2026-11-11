import React, { useState, useRef } from 'react';
import { JewellerProfile, ShopDetails } from '../../types';
import { ShreemLogo } from '../ShreemLogo';
import { 
  Building2, 
  Store, 
  UserCheck, 
  Phone, 
  ShieldCheck, 
  MapPin, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  PlusCircle,
  RotateCcw
} from 'lucide-react';

interface FirmRegistrationScreenProps {
  existingFirms: JewellerProfile[];
  onRegisterFirm: (firm: JewellerProfile, shopDetails?: Partial<ShopDetails>) => void;
  onSelectExistingFirm: (firmId: string) => void;
}

export const FirmRegistrationScreen: React.FC<FirmRegistrationScreenProps> = ({
  existingFirms,
  onRegisterFirm,
  onSelectExistingFirm,
}) => {
  const [viewMode, setViewMode] = useState<'register' | 'select'>(
    existingFirms.length > 0 ? 'select' : 'register'
  );

  React.useEffect(() => {
    if (existingFirms.length === 0) {
      setViewMode('register');
    }
  }, [existingFirms.length]);

  // Form State
  const [firmName, setFirmName] = useState('');
  const [tagline, setTagline] = useState('सराफा एवं आभूषण विक्रेता (Gold, Silver & Diamond)');
  const [counterName, setCounterName] = useState('Main Showroom Counter');
  const [counterType, setCounterType] = useState<JewellerProfile['counterType']>('Main Showroom');
  const [operatorName, setOperatorName] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [cityStatePincode, setCityStatePincode] = useState('');
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('कृपया 2MB से कम साइज का लोगो चुनें (Please select image under 2MB).');
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
    if (!firmName.trim()) {
      alert('कृपया फर्म / दुकान का नाम दर्ज करें');
      return;
    }

    const newFirmId = `firm-${Date.now()}`;
    const newProfile: JewellerProfile = {
      id: newFirmId,
      firmId: newFirmId,
      code: `FIRM-0${existingFirms.length + 1}`,
      name: firmName.trim(),
      counterName: counterName.trim() || 'Main Showroom',
      counterType,
      operatorName: operatorName.trim() || 'Firm Owner',
      gstin: gstin.trim().toUpperCase() || 'URP-UNREGISTERED',
      phone: phone.trim(),
      logoUrl: logoUrl || undefined,
      isDefault: true,
    };

    const shopDetailsUpdate: ShopDetails = {
      firmId: newFirmId,
      name: firmName.trim(),
      tagline: tagline.trim() || 'सराफा एवं आभूषण विक्रेता',
      address: address.trim(),
      cityStatePincode: cityStatePincode.trim(),
      phone: phone.trim(),
      email: '',
      gstin: gstin.trim().toUpperCase(),
      bisHallmarkRegNo: '',
      panNo: '',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      terms: [
        'बिक्री पर 3% GST लागू है।',
        'हॉलमार्क आभूषण की शुद्धता की 100% गारंटी है।',
        'पुराने गहने बदलने पर नियमानुसार काट ली जाएगी।'
      ],
      logoUrl: logoUrl || undefined,
    };

    onRegisterFirm(newProfile, shopDetailsUpdate);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-amber-500 selection:text-white">
      {/* Container Card */}
      <div className="w-full max-w-3xl bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 p-6 sm:p-8 border-b border-amber-500/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex justify-center mb-3">
            <ShreemLogo size="lg" showText={false} customLogo={logoUrl} transparentBg={true} />
          </div>

          <span className="inline-block bg-amber-500/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 mb-2 font-mono tracking-wide uppercase">
            Jeweller ERP Setup • फर्म पंजीकरण
          </span>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            स्वागतम्! ERP शुरू करने के लिए अपनी फर्म चुनें या रजिस्टर करें
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-xl mx-auto">
            Please register your Jewellery Firm or select an existing branch. All billing, stock records, invoices, and accounting menus will load customized for this firm.
          </p>

          {/* Toggle Tab between Register New & Select Existing */}
          {existingFirms.length > 0 && (
            <div className="flex justify-center mt-5">
              <div className="bg-stone-950/80 p-1 rounded-2xl border border-stone-700 flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('select')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'select'
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  पंजीकृत फर्म चुनें ({existingFirms.length})
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('register')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'register'
                      ? 'bg-amber-500 text-stone-950 shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  + नई फर्म रजिस्टर करें
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Form Body: SELECT EXISTING FIRM */}
        {viewMode === 'select' && existingFirms.length > 0 && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="text-center mb-2">
              <h2 className="text-base font-bold text-stone-800">
                पहले से पंजीकृत फर्म चुनें (Select Registered Firm)
              </h2>
              <p className="text-xs text-stone-500">
                जिस फर्म के साथ काम करना चाहते हैं, उसे चुनकर सीधे ERP में प्रवेश करें
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-1">
              {existingFirms.map(firm => (
                <div
                  key={firm.id}
                  onClick={() => onSelectExistingFirm(firm.id)}
                  className="p-4 rounded-2xl border border-stone-200 hover:border-amber-500 bg-stone-50 hover:bg-amber-50/50 transition cursor-pointer flex items-center gap-3.5 group shadow-xs hover:shadow-md"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                    {firm.logoUrl ? (
                      <img src={firm.logoUrl} alt={firm.name} className="w-full h-full object-contain" />
                    ) : (
                      <ShreemLogo size="sm" showText={false} transparentBg={true} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-stone-900 group-hover:text-amber-700 truncate">
                        {firm.name}
                      </h3>
                    </div>
                    <p className="text-xs text-stone-500 truncate">{firm.counterName}</p>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 font-mono mt-1">
                      <span>GST: {firm.gstin || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-stone-200 group-hover:bg-amber-500 group-hover:text-stone-950 flex items-center justify-center text-stone-600 transition shrink-0">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-stone-200 flex justify-center">
              <button
                type="button"
                onClick={() => setViewMode('register')}
                className="px-5 py-2.5 bg-stone-800 hover:bg-stone-900 text-amber-300 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>नई फर्म या शाखा रजिस्टर करें (+ Register Another Firm)</span>
              </button>
            </div>
          </div>
        )}

        {/* Form Body: REGISTER NEW FIRM */}
        {viewMode === 'register' && (
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
            
            {/* Logo Section */}
            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
              <span className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-600" />
                फर्म / दुकान का लोगो (Firm Brand Logo)
              </span>
              <p className="text-[11px] text-stone-500">
                यह लोगो आपके सभी बिलों (GST Tax Invoices, Estimates), HUID बारकोड टैग्स व मुख्य स्क्रीन पर प्रदर्शित होगा।
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <div className="w-20 h-20 rounded-2xl bg-white border border-amber-300 p-2 flex items-center justify-center shrink-0 shadow-sm">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Firm Logo" className="w-full h-full object-contain" />
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
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>नया लोगो अपलोड करें (Upload Logo)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setLogoUrl('/assets/aistudio/Shreem_Mahal_LOGO_355a8e42.png')}
                      className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>गोल्डन "श्रीः" लोगो रखें</span>
                    </button>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="p-2 bg-stone-100 hover:bg-rose-100 text-stone-500 hover:text-rose-600 rounded-xl transition cursor-pointer"
                        title="हटाएं"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-400 block">
                    Supports PNG with transparent background, JPG, SVG, WebP.
                  </span>
                </div>
              </div>
            </div>

            {/* Firm Basic Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-stone-200 pb-1.5">
                <Building2 className="w-4 h-4 text-amber-600" /> फर्म का विवरण व संपर्क जानकारी (Firm Details)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    फर्म / दुकान का नाम (Firm / Store Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder="उदा. श्री महालक्ष्मी ज्वेलर्स / आपकी फर्म का नाम"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 font-bold text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    टैगलाइन / उप-शीर्षक (Tagline / Business Nature)
                  </label>
                  <input
                    type="text"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    placeholder="सराफा एवं आभूषण विक्रेता (Gold & Diamond)"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    काउंटर / शाखा का नाम (Counter / Branch Name)
                  </label>
                  <input
                    type="text"
                    value={counterName}
                    onChange={(e) => setCounterName(e.target.value)}
                    placeholder="Main Showroom / Counter 1"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    काउंटर का प्रकार (Counter Type)
                  </label>
                  <select
                    value={counterType}
                    onChange={(e) => setCounterType(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  >
                    <option value="Main Showroom">Main Showroom (मुख्य शोरूम)</option>
                    <option value="Counter 2 (Silver & Gem)">Counter 2 (Silver & Gemstones)</option>
                    <option value="Wholesale & Bullion">Wholesale & Bullion (थोक व बुलियन)</option>
                    <option value="Girvi & Karigar Desk">Girvi & Karigar Desk (गिरवी व कारीगर)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                    संचालक / ऑपरेटर का नाम (Owner / Operator)
                  </label>
                  <input
                    type="text"
                    value={operatorName}
                    onChange={(e) => setOperatorName(e.target.value)}
                    placeholder="उदा. सचिन सोनी"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    मोबाइल नंबर (Mobile / WhatsApp No.) *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9202357851"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 font-mono text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                    GSTIN नंबर (15 Digit GSTIN - यदि उपलब्ध हो)
                  </label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    placeholder="उदा. 23AAMCS9202B1Z8"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 font-mono font-bold text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-medium mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-500" />
                    शहर, राज्य व पिनकोड (City, State, Pincode)
                  </label>
                  <input
                    type="text"
                    list="cities"
                    value={cityStatePincode}
                    onChange={(e) => setCityStatePincode(e.target.value)}
                    placeholder="Bhopal, Madhya Pradesh - 462042"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
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
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  दुकान का पूरा पता (Shop Street Address)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="दुकान नं., बाजार का नाम, मुख्य मार्ग"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 text-stone-900 text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              {existingFirms.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setViewMode('select')}
                  className="text-stone-500 hover:text-stone-800 text-xs font-semibold cursor-pointer"
                >
                  ← वापस पुरानी फर्म सूची पर जाएं
                </button>
              ) : <div />}

              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-sm rounded-2xl shadow-xl flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>फर्म रजिस्टर करें व ERP प्रारंभ करें (Register & Open ERP)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
