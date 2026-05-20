import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useVendor } from '../../context/VendorContext';
import { useSaaS } from '../../context/SaaSContext';
import {
  RiDashboardLine,
  RiStoreLine,
  RiCalendarCheckLine,
  RiLogoutBoxLine,
  RiFileListLine
} from 'react-icons/ri';

const VENDOR_TYPE_LABELS = {
  hotel: 'Hotel Provider',
  flight: 'Aviation Provider',
  bus: 'Transit Coach Partner',
  multi: 'Omni-Channel Services',
};

const VendorSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { vendor, logout } = useVendor();
  const { categories } = useSaaS();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/vendor/login');
  };

  // Dynamically build listings items based on categories registered in context!
  const listingsItems = categories.map(c => ({
    path: `/vendor/${c.id === 'hotel' ? 'hotels' : c.id === 'flight' ? 'flights' : c.id === 'bus' ? 'buses' : `listing/${c.id}`}`,
    label: c.name,
    icon: c.icon
  }));

  const navSections = [
    {
      title: 'Merchant Analytics',
      items: [
        { path: '/vendor/dashboard', label: 'Console Center', Icon: RiDashboardLine },
      ]
    },
    {
      title: 'Active Inventories',
      items: listingsItems
    },
    {
      title: 'Customer Orders',
      items: [
        { path: '/vendor/bookings', label: 'My Bookings', Icon: RiCalendarCheckLine },
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-base-100 border-r border-base-200/50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-base-200/40 bg-base-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-secondary to-primary flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm shadow-secondary/20">
          V
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-base-content text-base tracking-tight">Antigravity</span>
          <span className="text-xs text-base-content/40 font-bold tracking-widest uppercase mt-0.5">Merchant Portal</span>
        </div>
        <button
          className="ml-auto btn btn-ghost btn-sm btn-circle lg:hidden text-base-content/40 hover:text-base-content"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-5 px-4 space-y-6 scrollbar-thin">
        {navSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 mb-2 text-xs font-bold tracking-widest uppercase text-base-content/40">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item, itemIdx) => {
                const IconComponent = item.Icon;
                return (
                  <li key={itemIdx}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200
                        ${isActive(item.path)
                          ? 'bg-secondary text-secondary-content shadow-sm shadow-secondary/10'
                          : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                        }`}
                    >
                      {IconComponent ? (
                        <IconComponent className="w-4.5 h-4.5 shrink-0" />
                      ) : (
                        <span className="w-4.5 h-4.5 text-sm flex items-center justify-center shrink-0">{item.icon}</span>
                      )}
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer Profile Control */}
      <div className="border-t border-base-200/50 p-4 space-y-2 bg-base-100">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-base-200/50 border border-base-200/40">
          <div className="avatar placeholder">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-secondary to-primary text-white text-sm font-bold shadow-xs flex items-center justify-center">
              <span>{vendor?.name?.charAt(0).toUpperCase() || 'V'}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-base-content truncate leading-tight">{vendor?.name || 'Merchant Partner'}</p>
            <p className="text-xs text-base-content/40 truncate font-semibold mt-0.5">
              {VENDOR_TYPE_LABELS[vendor?.vendorType] || 'Vendor'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl text-sm font-bold text-error/80 hover:bg-error/10 hover:text-error transition-all duration-200"
        >
          <RiLogoutBoxLine className="w-4.5 h-4.5 shrink-0" />
          <span>Sign out from Vendor</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      <aside
        className={`flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30 transition-transform duration-300 lg:hidden shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default VendorSidebar;
