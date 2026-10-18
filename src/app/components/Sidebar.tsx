import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { authService } from '../services/authService';
import {
  ChevronDown,
  LogOut,
  PanelLeftClose,
} from 'lucide-react';
import { getMenuItems } from '../config/menuConfig';
import { useModule } from '../context/ModuleContext';
import { useLanguage } from '../context/LanguageContext';
import { useBhattaSettings } from '../context/BhattaSettingsContext';
import chandLogo from '../../assets/chand_bricks_logo.jpg';

function SidebarUserSection({ isCollapsed }: { isCollapsed?: boolean }) {
  const navigate = useNavigate();
  const { isUrdu, t } = useLanguage();
  const user = authService.getUser();
  const [expanded, setExpanded] = useState(false);

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'MS';

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="p-3 border-t border-[#1E293B]">
      {/* User row */}
      <button
        onClick={() => !isCollapsed && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 p-3 rounded-xl bg-[#1E293B] hover:bg-[#263548] transition-colors group cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? (user?.fullName || "Profile") : undefined}
      >
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1D4ED8] to-[#D4A017] flex items-center justify-center shrink-0 border-2 border-white/10 shadow-sm">
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-sm font-semibold truncate leading-tight">{user?.fullName || (isUrdu ? 'منشی سرور' : 'Munshi Sarwar')}</p>
              <p className="text-white/80 text-[11px] truncate leading-tight">{isUrdu ? 'مینجر • بوریوالا' : (user?.email || 'Manager • Burewala')}</p>
            </div>
            <ChevronDown
              size={15}
              className={`text-white shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </>
        )}
      </button>

      {/* Logout option */}
      {expanded && !isCollapsed && (
        <div className="mt-1 rounded-xl overflow-hidden border border-[#1E293B] bg-[#0F172A]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors font-medium cursor-pointer"
          >
            <LogOut size={16} />
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { isUrdu } = useLanguage();
  const { settings } = useBhattaSettings();
  const [openMenus, setOpenMenus] = useState<string[]>(['Dashboard', 'ڈیش بورڈ']);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const user = authService.getUser();
  const { modules } = useModule();
  const dynamicMenuItems = getMenuItems(user, modules, isUrdu);

  const toggleMenu = (menuName: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenMenus((prev) =>
      prev.includes(menuName) ? [] : [menuName]
    );
  };

  return (
    <aside className={`bg-[#0F172A] min-h-screen border-r border-[#1E293B] flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} select-none shrink-0`}>
      
      {/* Brand Header / Logo */}
      <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
        <div className={`flex items-center gap-3 overflow-hidden transition-all ${isCollapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'}`}>
          <img 
            src={settings.logoUrl || chandLogo} 
            alt="Chand Bricks Logo" 
            className="w-11 h-11 rounded-xl object-cover shrink-0 bg-white p-0.5 shadow-md ring-1 ring-white/20" 
          />
          <div className="shrink-0 min-w-0">
            <h1 className="text-white font-black text-base leading-tight truncate w-36">
              {isUrdu ? (settings.businessNameUrdu || 'چاند برکس') : (settings.businessNameEnglish || 'Chand Bricks')}
            </h1>
            <p className="text-[#94A3B8] text-xs font-urdu truncate leading-tight">
              {isUrdu ? (settings.taglineUrdu || 'چاند برکس سپلائرز') : (settings.taglineEnglish || 'Suppliers ERP')}
            </p>
          </div>
        </div>

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-white hover:bg-[#1E293B] rounded-lg shrink-0 transition-colors cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          <PanelLeftClose size={20} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav
        className="flex-1 overflow-y-auto py-4 overflow-x-hidden"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <ul className="space-y-1.5 px-3">
          {dynamicMenuItems.map((item) => (
            <li key={item.path || item.name}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
                      openMenus.includes(item.name) && !isCollapsed
                        ? 'bg-[#1E293B] text-white'
                        : 'text-white hover:bg-[#1E293B]'
                    }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 text-white/90">{item.icon}</div>
                      {!isCollapsed && <span className="text-white text-sm font-medium whitespace-nowrap">{item.name}</span>}
                    </div>
                    {!isCollapsed && (
                      <ChevronDown
                        size={16}
                        className={`shrink-0 transition-transform duration-200 text-white ${
                          openMenus.includes(item.name) ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </button>

                  {openMenus.includes(item.name) && !isCollapsed && (
                    <ul className="mt-1 text-white space-y-1 ml-3 pl-3 border-l-2 border-[#1E293B]">
                      {item.submenu.map((subItem) => (
                        <li key={subItem.path}>
                          <NavLink
                            to={subItem.path}
                            className={({ isActive }) =>
                              `w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all duration-200 ${
                                isActive
                                  ? 'bg-[#1D4ED8] text-white font-medium shadow-sm'
                                  : 'text-white/80 hover:bg-[#1E293B] hover:text-white'
                              }`
                            }
                          >
                            <div className="shrink-0">{subItem.icon}</div>
                            <span className="whitespace-nowrap">{subItem.name}</span>
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <NavLink
                  to={item.path || '/'}
                  end={item.path === '/'}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-white cursor-pointer ${
                      isActive
                        ? 'bg-[#1D4ED8] text-white font-medium shadow-sm'
                        : 'hover:bg-[#1E293B] text-white/85'
                    }`
                  }
                >
                  <div className="shrink-0">{item.icon}</div>
                  {!isCollapsed && (
                    <span className="text-sm font-medium whitespace-nowrap text-white">{item.name}</span>
                  )}
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <SidebarUserSection isCollapsed={isCollapsed} />
    </aside>
  );
}
