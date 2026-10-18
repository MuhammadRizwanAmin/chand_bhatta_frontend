import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ConfirmProvider } from './ConfirmProvider';
import { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

export function Layout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const { dir, isUrdu } = useLanguage();

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return (
    <ConfirmProvider>
      <div className={`flex h-screen bg-[#F8FAFC] ${isUrdu ? 'font-urdu' : ''}`} dir={dir}>
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main ref={mainRef} className="flex-1 overflow-y-auto px-4 pt-1">
            <Outlet />
          </main>
        </div>
      </div>
    </ConfirmProvider>
  );
}
