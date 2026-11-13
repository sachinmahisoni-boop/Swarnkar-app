import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  UserPlus,
  Building2,
  Phone,
  MapPin,
  ArrowRight,
  Sparkles,
  KeyRound,
  Mail,
} from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { JewellerProfile, ShopDetails } from '../../types';
import { ensureUserAccessRecord } from '../../lib/firestoreSync';

export interface SignupMetadata {
  ownerName: string;
  firmName: string;
  phone: string;
}

interface LoginProps {
  onLogin: (
    firmProfile?: JewellerProfile,
    shopDetails?: ShopDetails,
    isDemo?: boolean,
    signupMeta?: SignupMetadata
  ) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Login State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup State
  const [ownerName, setOwnerName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [phone, setPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cityState, setCityState] = useState('');
  const [gstin, setGstin] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Offline Demo Preview Mode Only (in-memory sample fixtures, no Firebase access)
  const handleDemoQuickLogin = () => {
    onLogin(undefined, undefined, true);
  };

  // Email / Password Login Handler
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const email = loginEmail.trim();
    if (!email || !loginPassword.trim()) {
      setError('कृपया ईमेल और पासवर्ड दर्ज करें (Please enter email & password)');
      return;
    }

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, loginPassword);
      await ensureUserAccessRecord(cred.user);
      onLogin();
    } catch (err: any) {
      if (
        err?.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        err?.code === 'auth/invalid-api-key'
      ) {
        setError('Firebase API Key अमान्य है (Invalid VITE_FIREBASE_API_KEY)। कृपया Vercel या .env सेटिंग्स जांचें।');
      } else if (
        err?.code === 'auth/invalid-credential' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/user-not-found'
      ) {
        setError('गलत ईमेल या पासवर्ड। (Invalid email or password)');
      } else if (err?.code === 'auth/invalid-email') {
        setError('कृपया मान्य ईमेल पता दर्ज करें (Invalid email format)');
      } else {
        setError(err?.message || 'लॉगिन में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Auth Handler (Primary Sign-In for all users & server-verified Master Admins)
  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await ensureUserAccessRecord(cred.user);
      onLogin();
    } catch (err: any) {
      console.error(err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setError('Google साइन-इन विंडो बंद की गई। कृपया पुनः प्रयास करें।');
      } else {
        setError(err?.message || 'Google Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Email Sign-Up Handler (creates Auth account + pending users/{uid} record)
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!firmName.trim()) {
      setError('कृपया अपनी दुकान / फर्म का नाम दर्ज करें');
      return;
    }
    if (!ownerName.trim()) {
      setError('कृपया मालिक का नाम दर्ज करें');
      return;
    }
    if (!signupEmail.trim()) {
      setError('कृपया ईमेल दर्ज करें');
      return;
    }
    if (signupPassword.length < 6) {
      setError('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Password must be at least 6 characters)');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setError('पासवर्ड मैच नहीं हो रहा है (Passwords do not match)');
      return;
    }

    setLoading(true);
    const newFirmId = `firm-${Date.now()}`;

    const newProfile: JewellerProfile = {
      id: newFirmId,
      firmId: newFirmId,
      code: `FIRM-${Math.floor(100 + Math.random() * 900)}`,
      name: firmName.trim(),
      counterName: 'Main Showroom Counter',
      counterType: 'Main Showroom',
      operatorName: ownerName.trim(),
      gstin: gstin.trim().toUpperCase() || 'URP-UNREGISTERED',
      phone: phone.trim(),
      isDefault: true,
    };

    const newShopDetails: ShopDetails = {
      firmId: newFirmId,
      name: firmName.trim(),
      tagline: 'सराफा एवं आभूषण विक्रेता (Gold, Silver & Diamond)',
      address: '',
      cityStatePincode: cityState.trim(),
      phone: phone.trim(),
      email: signupEmail.trim(),
      gstin: gstin.trim().toUpperCase() || 'URP-UNREGISTERED',
      bisHallmarkRegNo: '',
      panNo: '',
      bankName: '',
      accountNo: '',
      ifscCode: '',
      terms: [
        'बिक्री पर 3% GST लागू है।',
        'हॉलमार्क आभूषण की शुद्धता की 100% गारंटी है।',
        'पुराने गहने बदलने पर नियमानुसार काट ली जाएगी।',
      ],
    };

    try {
      const cred = await createUserWithEmailAndPassword(auth, signupEmail.trim(), signupPassword);
      try {
        await updateProfile(cred.user, { displayName: ownerName.trim() });
      } catch {
        // Non-fatal profile update
      }
      await ensureUserAccessRecord(cred.user, {
        ownerName: ownerName.trim(),
        firmName: firmName.trim(),
        phone: phone.trim(),
      });
      onLogin(newProfile, newShopDetails, false, {
        ownerName: ownerName.trim(),
        firmName: firmName.trim(),
        phone: phone.trim(),
      });
    } catch (err: any) {
      if (
        err?.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.' ||
        err?.code === 'auth/invalid-api-key'
      ) {
        setError('Firebase API Key अमान्य है (Invalid VITE_FIREBASE_API_KEY)। कृपया Vercel या .env सेटिंग्स जांचें।');
      } else if (err?.code === 'auth/email-already-in-use') {
        setError('यह ईमेल पहले से रजिस्टर्ड है। कृपया Login टैब से साइन-इन करें।');
      } else if (err?.code === 'auth/weak-password') {
        setError('पासवर्ड कमजोर है। कम से कम 6 अक्षरों का मजबूत पासवर्ड रखें।');
      } else if (err?.code === 'auth/invalid-email') {
        setError('कृपया मान्य ईमेल पता दर्ज करें।');
      } else {
        setError(err?.message || 'साइन-अप में त्रुटि हुई। कृपया पुनः प्रयास करें।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-center items-center p-4 sm:p-6 font-sans selection:bg-amber-500 selection:text-white">
      <div className="w-full max-w-md bg-white border border-stone-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-stone-100 p-6 border-b border-amber-500/20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-center mb-2">
            <div className="bg-amber-500/20 p-3 rounded-2xl border border-amber-500/30 text-amber-400">
              <ShieldCheck className="w-8 h-8" />
            </div>
          </div>

          <span className="inline-block bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-amber-500/30 mb-2 font-mono tracking-wide uppercase">
            Swarnkar Jewellery ERP • स्वर्णकार ऐप
          </span>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {mode === 'login' ? 'सुरक्षित ज्वैलरी ERP लॉगिन' : 'नया खाता / फर्म रजिस्टर करें'}
          </h1>
          <p className="text-xs text-stone-300 mt-1">
            {mode === 'login'
              ? 'Sign in securely with Google or your registered email & password'
              : 'Register your shop — access activates after Master Admin approval'}
          </p>

          {/* Mode Switcher Tabs (Sign In / Sign Up) */}
          <div className="flex justify-center mt-4">
            <div className="bg-stone-950/80 p-1 rounded-2xl border border-stone-700 flex gap-1 w-full">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'login'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                लॉगिन (Sign In)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-amber-500 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                नया रजिस्ट्रेशन (Sign Up)
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="p-6 space-y-4">
            {/* Primary Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-stone-800 text-white border border-stone-700 font-extrabold py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2.5 cursor-pointer shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Google से लॉगिन करें (Continue with Google)
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-stone-400 font-bold uppercase text-[10px]">
                  अथवा ईमेल से लॉगिन करें (OR EMAIL)
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                ईमेल पता (Email Address) *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="jeweller@gmail.com"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2 text-sm text-stone-900 focus:outline-none font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                पासवर्ड (Password) *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2 text-sm text-stone-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-black py-2.5 rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? 'लॉगिन हो रहा है...' : 'लॉगिन करें (Sign In)'}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDemoQuickLogin}
              className="w-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 font-bold py-2 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              ऑफ़लाइन डेमो प्रीव्यू (Offline Demo Mode Only)
            </button>

            <div className="text-center pt-1">
              <p className="text-xs text-stone-500">
                नया अकाउंट चाहिए?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setError('');
                  }}
                  className="font-extrabold text-amber-700 hover:underline cursor-pointer"
                >
                  यहाँ साइन-अप करें (+ Create Account)
                </button>
              </p>
            </div>
          </form>
        ) : (
          /* SIGNUP FORM */
          <form onSubmit={handleSignupSubmit} className="p-6 space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                मालिक का नाम (Owner / Jeweller Name) *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="उदा. राजेश सोनी"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2 text-sm text-stone-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                दुकान / फर्म का नाम (Jewellery Shop Name) *
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-amber-600" />
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="उदा. श्री महालक्ष्मी ज्वेलर्स"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl pl-10 pr-3 py-2 text-sm text-stone-900 focus:outline-none font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">मोबाइल (Mobile)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98260XXXXX"
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-2 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">शहर (City / State)</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 absolute left-3 top-3 text-stone-400" />
                  <input
                    type="text"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="भोपाल, म.प्र."
                    className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-8 pr-2 py-2 text-xs text-stone-900 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">ईमेल (Email Address) *</label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="jeweller@gmail.com"
                className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">पासवर्ड (Password) *</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="Min 6 chars"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">कन्फर्म पासवर्ड *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-950 font-black py-2.5 rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <UserPlus className="w-4 h-4" />
              {loading ? 'साइन-अप हो रहा है...' : 'खाता बनाएं व अप्रूवल भेजें (Sign Up)'}
            </button>

            <div className="text-center pt-1">
              <p className="text-xs text-stone-500">
                पहले से अकाउंट है?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError('');
                  }}
                  className="font-extrabold text-amber-700 hover:underline cursor-pointer"
                >
                  यहाँ लॉगिन करें (Sign In)
                </button>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
