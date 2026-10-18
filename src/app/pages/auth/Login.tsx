import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Eye, EyeOff, LogIn, Building2, Loader2, Phone, MapPin, Globe } from 'lucide-react';
import { authService } from '../../services/authService';
import { useModule } from '../../context/ModuleContext';
import { useLanguage } from '../../context/LanguageContext';
import chandLogo from '../../../assets/chand_bricks_logo.jpg';
import chandHorizontalLogo from '../../../assets/chand_horizontal_logo.jpg';

export function Login() {
  const navigate = useNavigate();
  const { refreshModules } = useModule();
  const { language, setLanguage, isUrdu, t } = useLanguage();
  const [email, setEmail] = useState('munshi@chandbricks.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(isUrdu ? 'براہ کرم ای میل اور پاس ورڈ درج کریں' : 'Please enter your email and password.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      await authService.login(email, password);
      await refreshModules();
      navigate('/', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || (isUrdu ? 'غلط معلومات! براہ کرم دوبارہ کوشش کریں' : 'Invalid credentials. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen flex bg-[#0F172A] overflow-hidden relative selection:bg-[#1D4ED8] selection:text-white">

      {/* Ambient background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-3xl" />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] p-8 xl:p-12 relative z-10">
        <div className="flex items-center gap-4">
          <img
            src={chandLogo}
            alt="Chand Bricks Logo"
            className="w-14 h-14 rounded-2xl object-cover bg-white p-1 shadow-xl ring-2 ring-white/20"
          />
          <div>
            <span className="text-white font-extrabold text-2xl tracking-tight block">
              {isUrdu ? 'چاند برکس سپلائرز' : 'Chand Bricks Supplierz'}
            </span>
            <span className="text-[#D4A017] font-urdu text-base font-bold">
              چاند برکس بوریوالا
            </span>
          </div>
        </div>

        <div>
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-4">
              <Building2 size={14} className="text-blue-400" />
              {isUrdu ? 'بھٹہ مینجمنٹ و سیلز ای آر پی' : 'Bhatta ERP & Sales Management'}
            </div>

            {/* Horizontal Logo Display */}
            <div className="max-w-md rounded-2xl overflow-hidden bg-white/10 p-2 border border-white/15 backdrop-blur-md shadow-2xl">
              <img
                src={chandHorizontalLogo}
                alt="Chand Bricks Official Banner"
                className="w-full h-auto rounded-xl object-contain bg-white"
              />
            </div>
          </div>

          {/* Location & Contacts Footer */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1.5 max-w-lg">
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin size={14} className="text-[#D4A017] shrink-0" />
              <span>{t('address')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Phone size={14} className="text-[#D4A017] shrink-0" />
              <span>{t('hajiPhone')}</span>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-xs">© {new Date().getFullYear()} Chand Bricks Supplierz (AMD). All rights reserved.</p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-6 lg:hidden">
            <img
              src={chandLogo}
              alt="Chand Bricks Logo"
              className="w-12 h-12 rounded-xl object-cover bg-white p-0.5 shadow-md"
            />
            <div>
              <span className="text-white font-bold text-base block">
                {isUrdu ? 'چاند برکس سپلائرز' : 'Chand Bricks Supplierz'}
              </span>
              <span className="text-[#D4A017] font-urdu text-xs">چاند برکس بوریوالا</span>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl border border-slate-200">

            {/* Header with Language Switcher */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-[#0F172A]">
                  {isUrdu ? 'لاگ ان کریں' : 'Sign In to ERP'}
                </h2>
                <p className="text-[#64748B] text-xs">
                  {isUrdu ? 'منشی پورٹل تک رسائی حاصل کریں' : 'Access default Munshi portal'}
                </p>
              </div>

              {/* Language Switcher on Login */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLanguage('ur')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${language === 'ur'
                      ? 'bg-[#1D4ED8] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-[#0F172A]'
                    }`}
                >
                  <span>🇵🇰</span>
                  <span className="font-urdu ml-1">اردو</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${language === 'en'
                      ? 'bg-[#1D4ED8] text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-[#0F172A]'
                    }`}
                >
                  <span>🇬🇧</span>
                  <span className="ml-1">ENG</span>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  {isUrdu ? 'ای میل یا صارف نام' : 'Email / Username'}
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="munshi@chandbricks.com"
                  className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  {isUrdu ? 'پاس ورڈ' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl pl-4 pr-10 py-2.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1D4ED8]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-[#1D4ED8] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                {isUrdu ? 'بھٹہ سسٹم میں داخل ہوں' : 'Enter Bhatta System'}
              </button>
            </form>
          </div>

        </div>
      </div>

    </div>
  );
}
