import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useVendor } from '../../context/VendorContext';
import { useSaaS } from '../../context/SaaSContext';
import {
  RiMenuLine,
  RiBellLine,
  RiSunLine,
  RiMoonLine,
  RiUserLine,
  RiSettings4Line,
  RiLogoutBoxLine,
  RiCheckLine,
  RiNotificationBadgeLine
} from 'react-icons/ri';

const PAGE_NAMES = {
  '/vendor/dashboard': 'Merchant Operations Center',
  '/vendor/hotels': 'Hotel Inventory Console',
  '/vendor/hotels/create': 'Register New Hotel Surface',
  '/vendor/flights': 'Air Router Management',
  '/vendor/flights/create': 'Schedule New Flight',
  '/vendor/buses': 'Transit Coach Dispatcher',
  '/vendor/buses/create': 'Dispatch New Route',
  '/vendor/bookings': 'Merchant Booking Ledgers',
};

const THEMES = [
  { id: 'light', label: 'Classic Light' },
  { id: 'dark', label: 'Sleek Dark' },
  { id: 'corporate', label: 'Enterprise Light' },
  { id: 'business', label: 'Stripe Deep Dark' },
  { id: 'nord', label: 'Nordic Chill' },
  { id: 'dim', label: 'Dim Night' },
  { id: 'dracula', label: 'Vampire Dark' },
  { id: 'night', label: 'Space Black' },
  { id: 'winter', label: 'Winter Ice' }
];

const VendorHeader = ({ onMenuClick }) => {
  const { vendor, logout } = useVendor();
  const { notifications } = useSaaS();
  const location = useLocation();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('daisyui-theme') || 'business');

  const profileRef = useRef(null);
  const themeRef = useRef(null);
  const notifRef = useRef(null);

  const pageName = PAGE_NAMES[location.pathname] || 'Merchant Administration';
  const isDark = ['dark', 'business', 'night', 'dim', 'dracula', 'black', 'sunset'].includes(currentTheme);

  useEffect(() => {
    const handleOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (themeRef.current && !themeRef.current.contains(e.target)) setThemeOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const applyTheme = (themeId) => {
    document.documentElement.setAttribute('data-theme', themeId);
    localStorage.setItem('daisyui-theme', themeId);
    setCurrentTheme(themeId);
    setThemeOpen(false);
  };

  const toggleDarkLight = () => {
    applyTheme(isDark ? 'light' : 'business');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/vendor/login');
  };

  // We filter notifications meant for vendors
  const merchantNotifications = notifications.filter(n => n.title.includes('Listing') || n.title.includes('Submission'));
  const unreadCount = merchantNotifications.length;

  return (
    <header className="sticky top-0 z-20 bg-base-100/90 backdrop-blur-md border-b border-base-200/50 h-16 flex items-center justify-between px-6 gap-4">
      {/* Menu controls */}
      <div className="flex items-center gap-3">
        <button
          className="btn btn-ghost btn-sm btn-circle lg:hidden text-base-content/70 hover:text-base-content"
          onClick={onMenuClick}
        >
          <RiMenuLine className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-base-content/30 hidden sm:inline">Merchant</span>
          <span className="text-base-content/30 text-xs hidden sm:inline">/</span>
          <h1 className="text-sm font-bold text-base-content tracking-tight">{pageName}</h1>
        </div>
      </div>

      {/* Action Widgets */}
      <div className="flex items-center gap-2">

        {/* Theme Quick Toggle */}
        <button
          className="btn btn-ghost btn-sm btn-circle text-base-content/65 hover:text-base-content hover:bg-base-200/50 active:scale-95"
          onClick={toggleDarkLight}
          title="Toggle Theme Mode"
        >
          {isDark ? (
            <RiSunLine className="w-4 h-4 text-warning" />
          ) : (
            <RiMoonLine className="w-4 h-4 text-secondary" />
          )}
        </button>

        {/* Theme select dropdown */}
        <div className="relative" ref={themeRef}>
          <button
            className="btn btn-ghost btn-sm gap-2 text-xs font-semibold hover:bg-base-200/50 hidden sm:flex active:scale-95"
            onClick={() => setThemeOpen(!themeOpen)}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-secondary border border-base-300 shadow-xs" />
            <span className="capitalize">{currentTheme}</span>
          </button>
          {themeOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-base-100 border border-base-200/60 rounded-2xl shadow-xl z-50 py-2 overflow-hidden animate-scale-up">
              <p className="px-4 py-1.5 text-[9px] font-bold tracking-widest uppercase text-base-content/30">Select Visual Style</p>
              <div className="max-h-64 overflow-y-auto divide-y divide-base-200/30">
                {THEMES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => applyTheme(t.id)}
                    className="flex items-center justify-between w-full px-4 py-2 text-xs font-semibold text-base-content/75 hover:bg-base-200 hover:text-base-content transition-all text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: t.id === currentTheme ? 'hsl(var(--s))' : 'hsl(var(--bc)/0.2)' }} />
                      <span>{t.label}</span>
                    </div>
                    {currentTheme === t.id && <RiCheckLine className="w-3.5 h-3.5 text-secondary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            className="btn btn-ghost btn-sm btn-circle relative text-base-content/65 hover:text-base-content hover:bg-base-200/50 active:scale-95"
            onClick={() => setNotifOpen(!notifOpen)}
          >
            <RiBellLine className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full animate-ping" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-base-100 border border-base-200/60 rounded-2xl shadow-2xl z-50 overflow-hidden animate-scale-up">
              <div className="flex items-center justify-between px-5 py-4 border-b border-base-200/50 bg-base-200/10">
                <h3 className="font-bold text-xs uppercase tracking-wider text-base-content/50">Merchant Alerts</h3>
                {unreadCount > 0 && <span className="badge badge-secondary badge-xs text-[9px] font-bold px-2 py-1.5">{unreadCount} Actionable</span>}
              </div>
              <div className="divide-y divide-base-200/50 max-h-72 overflow-y-auto">
                {merchantNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-base-content/40">
                    <RiNotificationBadgeLine className="w-8 h-8 mb-2 opacity-50 text-secondary" />
                    <p className="text-xs font-semibold">No listing updates</p>
                  </div>
                ) : (
                  merchantNotifications.map(n => (
                    <div key={n.id} className="flex gap-3 px-5 py-3.5 hover:bg-base-200/35 transition-colors">
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-secondary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-base-content leading-snug">{n.title}</p>
                        <p className="text-[10px] text-base-content/55 mt-0.5 leading-relaxed">{n.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-base-200/50 transition-all border border-transparent hover:border-base-200/50 active:scale-95"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="avatar placeholder">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-secondary to-primary text-white text-xs font-bold shadow-xs">
                <span>{vendor?.name?.charAt(0).toUpperCase() || 'V'}</span>
              </div>
            </div>
            <span className="text-xs font-bold text-base-content hidden sm:block">{vendor?.name || 'Merchant Partner'}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-base-100 border border-base-200/60 rounded-2xl shadow-xl z-50 overflow-hidden animate-scale-up">
              <div className="px-5 py-4 border-b border-base-200/50 bg-base-200/10">
                <p className="font-bold text-xs text-base-content leading-tight">{vendor?.name || 'Merchant Account'}</p>
                <p className="text-[10px] text-base-content/40 font-semibold truncate mt-0.5">{vendor?.email || 'partner@platform.com'}</p>
              </div>
              <div className="py-1">
                <button className="flex items-center gap-3 w-full px-5 py-2.5 text-xs font-bold text-base-content/65 hover:bg-base-200 hover:text-base-content transition-colors">
                  <RiUserLine className="w-4 h-4 shrink-0 text-base-content/40" /> Company Profile
                </button>
                <button className="flex items-center gap-3 w-full px-5 py-2.5 text-xs font-bold text-base-content/65 hover:bg-base-200 hover:text-base-content transition-colors">
                  <RiSettings4Line className="w-4 h-4 shrink-0 text-base-content/40" /> Portal Settings
                </button>
              </div>
              <div className="border-t border-base-200/50 py-1 bg-base-200/5">
                <button
                  className="flex items-center gap-3 w-full px-5 py-2.5 text-xs font-bold text-error/80 hover:bg-error/10 hover:text-error transition-colors"
                  onClick={handleLogout}
                >
                  <RiLogoutBoxLine className="w-4 h-4 shrink-0" /> Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default VendorHeader;
