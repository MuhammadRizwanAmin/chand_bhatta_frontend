import { useState, useEffect, useRef } from 'react';
import { ChevronDown, LogOut, Calendar, Globe } from 'lucide-react';
import { authService } from '../services/authService';
import { useNavigate } from 'react-router';
import { useLanguage } from '../context/LanguageContext';

export function Header() {
  const navigate = useNavigate();
  const { language, setLanguage, isUrdu, t } = useLanguage();
  const user = authService.getUser();
  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'MS';

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  const currentDate = new Date().toLocaleDateString(isUrdu ? 'ur-PK' : 'en-PK', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40 text-[#0F172A] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-3">

          {/* Left: Spacer */}
          <div />

          {/* Right: Language Switcher, Date, Branch & User Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">

            {/* Language Switcher Buttons */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold shadow-xs">
              <button
                type="button"
                onClick={() => setLanguage('ur')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  language === 'ur'
                    ? 'bg-[#1D4ED8] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
                title="اردو میں تبدیل کریں"
              >
                <span>🇵🇰</span>
                <span className="font-urdu">اردو</span>
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-xs ${
                  language === 'en'
                    ? 'bg-[#1D4ED8] text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-[#0F172A]'
                }`}
                title="Switch to English"
              >
                <span>🇬🇧</span>
                <span>English</span>
              </button>
            </div>

            {/* Current Date */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <Calendar size={13} className="text-[#1D4ED8]" />
              <span className="font-medium font-mono">{currentDate}</span>
            </div>

            {/* Branch Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs text-blue-900">
              <div className="w-5 h-5 rounded-md bg-[#1D4ED8] text-white flex items-center justify-center text-[10px] font-bold">
                B1
              </div>
              <span className="font-semibold">{t('mainYard')}</span>
            </div>

            {/* User Profile */}
            <div className="relative pl-1 sm:pl-2 border-l border-[#E2E8F0]" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 hover:bg-slate-50 rounded-xl p-1 pr-2 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#D4A017] flex items-center justify-center shrink-0 shadow-sm border-2 border-white ring-1 ring-gray-100">
                  <span className="text-white font-bold text-xs">{initials}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <span className="text-xs font-bold text-[#0F172A] block leading-tight">{user?.fullName || (isUrdu ? 'منشی سرور' : 'Munshi Sarwar')}</span>
                  <span className="text-[10px] text-slate-400 block leading-tight">{user?.role || t('munshiRole')}</span>
                </div>
                <ChevronDown size={13} className={`text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white">
                    <p className="text-xs font-bold text-white truncate">{user?.fullName || (isUrdu ? 'منشی سرور' : 'Munshi Sarwar')}</p>
                    <p className="text-[10px] text-slate-300 truncate">{user?.email || 'munshi@chandbricks.com'}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded-full uppercase tracking-wide">
                      {user?.role || (isUrdu ? 'مینجر' : 'Manager')}
                    </span>
                  </div>
                  <div className="p-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <LogOut size={14} />
                      {t('signOut')}
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
