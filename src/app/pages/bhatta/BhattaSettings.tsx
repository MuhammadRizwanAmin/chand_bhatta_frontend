import React, { useState, useRef } from 'react';
import { useBhattaSettings } from '../../context/BhattaSettingsContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  Settings,
  Building2,
  MapPin,
  Phone,
  Upload,
  RotateCcw,
  Save,
  CheckCircle2,
  ShieldCheck,
  User,
  Image as ImageIcon,
  Sparkles,
  FileText
} from 'lucide-react';

export function BhattaSettings() {
  const { settings, updateSettings, updateLogo, updateBannerLogo, resetSettings } = useBhattaSettings();
  const { isUrdu } = useLanguage();

  const [form, setForm] = useState({ ...settings });
  const [successMessage, setSuccessMessage] = useState('');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(form);
    setSuccessMessage(isUrdu ? 'سیٹنگز اور کاروباری تفصیلات کامیابی سے اپ ڈیٹ ہو گئیں!' : 'Settings updated successfully across all modules!');
    setTimeout(() => setSuccessMessage(''), 4000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(isUrdu ? 'تصویر کا سائز 2MB سے کم ہونا چاہیے' : 'Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          updateLogo(base64);
          setForm(prev => ({ ...prev, logoUrl: base64 }));
          setSuccessMessage(isUrdu ? 'نیا لوگو کامیابی سے اپلوڈ ہو گیا!' : 'New logo uploaded successfully!');
          setTimeout(() => setSuccessMessage(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert(isUrdu ? 'تصویر کا سائز 3MB سے کم ہونا چاہیے' : 'Banner size must be less than 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        if (base64) {
          updateBannerLogo(base64);
          setForm(prev => ({ ...prev, bannerLogoUrl: base64 }));
          setSuccessMessage(isUrdu ? 'نیا بینر لوگو کامیابی سے اپلوڈ ہو گیا!' : 'Banner logo uploaded successfully!');
          setTimeout(() => setSuccessMessage(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    if (window.confirm(isUrdu ? 'کیا آپ تمام تفصیلات اور لوگو اصل حالت پر لانا چاہتے ہیں؟' : 'Reset all settings and logos to default?')) {
      resetSettings();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Settings size={14} />
            {isUrdu ? 'کاروباری پروفائل و ای آر پی سیٹنگز' : 'Bhatta ERP Profile & Master Settings'}
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            {isUrdu ? 'بھٹہ سیٹنگز و برانڈنگ' : 'Bhatta Settings & Profile Branding'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isUrdu
              ? 'یہاں کی گئی تمام تر تبدیلیاں (لوگو، ایڈریس، نام، فون نمبرز) بلز، رسید، ہیڈر اور تمام ماڈیولز میں خود بخود تبدیل ہو جائیں گی۔'
              : 'All changes made here (Logo, Address, Name, Phone numbers) will automatically reflect across bills, receipts, headers and PDFs.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw size={14} />
            {isUrdu ? 'ڈیفالٹ پر ری سیٹ کریں' : 'Reset to Default'}
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs transition-all">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: LOGOS & BRANDING */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-800 font-bold text-base">
            <ImageIcon className="text-[#1D4ED8]" size={20} />
            {isUrdu ? 'لوگو اور برانڈنگ تصاویر' : 'Logo & Official Identity Assets'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Circular / Main Logo */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  {isUrdu ? 'مین لوگو (Main Logo)' : 'Main Brand Logo'}
                </span>
                <p className="text-[11px] text-slate-500 mb-4">
                  {isUrdu ? 'یہ لوگو بل رسید، پی ڈی ایف، ہیڈر اور سائیڈ بار پر ظاہر ہوتا ہے۔' : 'Displayed on bills, receipts, PDFs, header and sidebar.'}
                </p>

                <div className="flex items-center gap-4 mb-4">
                  <div className="relative group">
                    <img
                      src={form.logoUrl}
                      alt="Current Logo"
                      className="w-20 h-20 rounded-2xl object-cover bg-white p-1 border-2 border-blue-200 shadow-md ring-2 ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      <Upload size={14} />
                      {isUrdu ? 'نیا لوگو اپلوڈ کریں' : 'Upload New Logo'}
                    </button>
                    <p className="text-[10px] text-slate-500">PNG, JPG or WebP (Max 2MB)</p>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Banner / Horizontal Logo */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                  {isUrdu ? 'افیشل بینر لوگو (Horizontal Banner)' : 'Horizontal Banner Logo'}
                </span>
                <p className="text-[11px] text-slate-500 mb-4">
                  {isUrdu ? 'لاگ ان اسکرین اور بڑے بینرز پر استعمال ہوتا ہے۔' : 'Used on login screen and official headers.'}
                </p>

                <div className="space-y-3 mb-4">
                  <div className="h-20 w-full max-w-sm rounded-xl overflow-hidden bg-white p-1 border border-slate-300 shadow-xs flex items-center justify-center">
                    <img
                      src={form.bannerLogoUrl}
                      alt="Banner Logo"
                      className="h-full w-auto object-contain"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Upload size={14} />
                    {isUrdu ? 'نیا بینر منتخب کریں' : 'Change Banner Logo'}
                  </button>
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: BUSINESS NAME & CONTACTS */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-800 font-bold text-base">
            <Building2 className="text-[#1D4ED8]" size={20} />
            {isUrdu ? 'کاروبار کا نام اور رابطے کی تفصیلات' : 'Business Identity & Contact Numbers'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'کاروبار کا نام (اردو میں)' : 'Business Name (Urdu)'} *
              </label>
              <input
                type="text"
                required
                value={form.businessNameUrdu}
                onChange={e => setForm({ ...form, businessNameUrdu: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-urdu focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'کاروبار کا نام (انگریزی میں)' : 'Business Name (English)'} *
              </label>
              <input
                type="text"
                required
                value={form.businessNameEnglish}
                onChange={e => setForm({ ...form, businessNameEnglish: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'ٹیگ لائن / برانڈ سلوگن (اردو)' : 'Tagline (Urdu)'}
              </label>
              <input
                type="text"
                value={form.taglineUrdu}
                onChange={e => setForm({ ...form, taglineUrdu: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-urdu focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'ٹیگ لائن (انگریزی)' : 'Tagline (English)'}
              </label>
              <input
                type="text"
                value={form.taglineEnglish}
                onChange={e => setForm({ ...form, taglineEnglish: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'بھٹہ کا مکمل پتہ (اردو میں جو بل پر آئے گا)' : 'Full Bhatta Address (Printed on Bill - Urdu)'} *
              </label>
              <input
                type="text"
                required
                value={form.addressUrdu}
                onChange={e => setForm({ ...form, addressUrdu: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-urdu focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'بھٹہ پتہ (انگریزی میں)' : 'Bhatta Address (English)'}
              </label>
              <input
                type="text"
                value={form.addressEnglish}
                onChange={e => setForm({ ...form, addressEnglish: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Phone size={13} className="text-[#1D4ED8]" />
                {isUrdu ? 'سیٹھ حاجی ناصر فون نمبرز' : 'Haji Nasir Phone(s)'} *
              </label>
              <input
                type="text"
                required
                value={form.hajiPhone}
                onChange={e => setForm({ ...form, hajiPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Phone size={13} className="text-[#1D4ED8]" />
                {isUrdu ? 'منشی سرور فون نمبرز' : 'Munshi Sarwar Phone(s)'} *
              </label>
              <input
                type="text"
                required
                value={form.munshiPhone}
                onChange={e => setForm({ ...form, munshiPhone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'ملکیت و شراکت داران (بل کی فوٹر لائن)' : 'Proprietorship / Partners Footer Line'}
              </label>
              <input
                type="text"
                value={form.proprietors}
                onChange={e => setForm({ ...form, proprietors: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-urdu focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: MANAGER / MUNSHI PROFILE */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2 text-slate-800 font-bold text-base">
            <User className="text-[#1D4ED8]" size={20} />
            {isUrdu ? 'مینیجر / منشی پروفائل معلومات' : 'Manager / Munshi ERP Profile'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'منشی / مینیجر کا نام' : 'Manager Full Name'}
              </label>
              <input
                type="text"
                value={form.managerName}
                onChange={e => setForm({ ...form, managerName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'لاگ ان ای میل' : 'Login Email'}
              </label>
              <input
                type="email"
                value={form.managerEmail}
                onChange={e => setForm({ ...form, managerEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {isUrdu ? 'این ٹی این / رجسٹریشن نمبر' : 'NTN / Registration #'}
              </label>
              <input
                type="text"
                value={form.ntnNumber}
                onChange={e => setForm({ ...form, ntnNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-[#1D4ED8] focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[#1D4ED8] hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Save size={16} />
            {isUrdu ? 'سیٹنگز محفوظ کریں (Save All Changes)' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
