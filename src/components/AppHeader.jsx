import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LOGO = 'https://teraforgedigitallab.com/images/logo.svg';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Home',     icon: 'dashboard' },
  { to: '/invoices',  label: 'Invoices', icon: 'description' },
  { to: '/clients',   label: 'Clients',  icon: 'group' },
  { to: '/settings',  label: 'Settings', icon: 'settings' },
];

export default function AppHeader() {
  const { currentUser, logout } = useAuth();
  const { pathname } = useLocation();

  // Determine active link: /invoices/create shares /invoices prefix etc.
  function isActive(to) {
    if (to === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(to);
  }

  if (!currentUser) {
    return (
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex justify-center md:justify-start items-center w-full px-8 py-4 max-w-screen-2xl mx-auto">
          <div className="flex items-center gap-2.5 shrink-0">
            <img
              src={LOGO}
              alt="Teraforge Digital Lab"
              className="h-8 w-auto"
              onError={e => { e.target.style.display = 'none'; }}
            />
            <span className="text-sm font-extrabold tracking-tight text-[#6C47FF] leading-none">
              Teraforge Digital Lab
            </span>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      {/* ── Desktop / Top Header ── */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm print:hidden">
        <div className="flex justify-between items-center w-full px-8 py-3 max-w-screen-2xl mx-auto">
          {/* Brand + Nav */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0">
              <img
                src={LOGO}
                alt="Teraforge Digital Lab"
                className="h-8 w-auto"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <span className="text-sm font-extrabold tracking-tight text-[#6C47FF] hidden lg:block leading-none">
                Teraforge Digital Lab
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(l => (
                <Link
                  key={l.to}
                  to={l.to}
                  className={
                    isActive(l.to)
                      ? 'text-[#6C47FF] font-bold border-b-2 border-[#6C47FF] pb-0.5 text-sm transition-colors'
                      : 'text-slate-500 hover:text-[#6C47FF] transition-colors font-semibold text-sm'
                  }
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side: icons + user */}
          <div className="flex items-center gap-2">
            <button
              title="Notifications"
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
            </button>
            <button
              title="Help"
              className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-xl">help</span>
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-outline-variant/20">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold leading-none">
                  {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-on-surface-variant">{currentUser?.email}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-sm select-none">
                {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="text-error font-semibold flex items-center gap-1 hover:bg-error-container/20 px-3 py-1.5 rounded-lg transition-colors text-sm ml-1"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl shadow-[0_-1px_0_0_rgba(0,0,0,0.06)] py-2 flex justify-around items-center z-40 print:hidden">
        {NAV_LINKS.map(l => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${isActive(l.to) ? 'text-[#6C47FF]' : 'text-slate-500'}`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={{ fontVariationSettings: isActive(l.to) ? "'FILL' 1" : "'FILL' 0" }}
            >
              {l.icon}
            </span>
            <span className={`text-[10px] ${isActive(l.to) ? 'font-bold' : 'font-medium'}`}>
              {l.label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
