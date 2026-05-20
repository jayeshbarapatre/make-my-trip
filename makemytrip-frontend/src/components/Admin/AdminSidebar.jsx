import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { useSaaS } from '../../context/SaaSContext';
import {
  RiDashboardLine,
  RiStoreLine,
  RiCheckboxCircleLine,
  RiLayoutGridLine,
  RiCalendarCheckLine,
  RiGroupLine,
  RiLogoutBoxLine,
  RiSettings4Line,
  RiShieldUserLine
} from 'react-icons/ri';

const AdminSidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAdmin();
  const { categories } = useSaaS();

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Modern SaaS Navigation Sections
  const navSections = [
    {
      title: 'Platform Control',
      items: [
        { path: '/admin/dashboard', label: 'Dashboard', Icon: RiDashboardLine },
        { path: '/admin/vendors', label: 'Vendor Partners', Icon: RiStoreLine },
        { path: '/admin/users', label: 'User Directory', Icon: RiGroupLine },
      ]
    },
    {
      title: 'Listing Management',
      items: [
        { path: '/admin/approvals', label: 'Pending Approvals', Icon: RiCheckboxCircleLine, badge: 'Review' },
        // Dynamic listings route links
        { path: '/admin/hotels', label: 'Hotels Listing', Icon: () => <span>🏨</span> },
        { path: '/admin/flights', label: 'Flights Listing', Icon: () => <span>✈️</span> },
        { path: '/admin/buses', label: 'Buses Listing', Icon: () => <span>🚌</span> },
      ]
    },
    {
      title: 'System Settings',
      items: [
        { path: '/admin/bookings', label: 'System Bookings', Icon: RiCalendarCheckLine },
      ]
    }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-base-100 border-r border-base-200/50">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-base-200/40 bg-base-100">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white font-bold text-base shrink-0 shadow-sm shadow-primary/20">
          A
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-base-content text-base tracking-tight">Antigravity</span>
          <span className="text-xs text-base-content/40 font-bold tracking-widest uppercase mt-0.5">Admin Platform</span>
        </div>
        {/* Mobile Close Button */}
        <button
          className="ml-auto btn btn-ghost btn-sm btn-circle lg:hidden text-base-content/40 hover:text-base-content"
          onClick={onClose}
        >
          ✕
        </button>
      </div>

      {/* Dynamic Category Mini-Bar */}
      <div className="px-6 py-3 bg-base-200/30 border-b border-base-200/30">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-base-content/40 mb-2">
          <span>Active Categories</span>
          <span className="badge badge-sm badge-primary font-bold">{categories.length}</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((c) => (
            <div 
              key={c.id} 
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-base-200 border border-base-300/40 text-sm shrink-0 cursor-default" 
              title={c.name}
            >
              {c.icon}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Links */}
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
                          ? 'bg-primary text-primary-content shadow-sm shadow-primary/10'
                          : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                        }`}
                    >
                      {typeof IconComponent === 'function' ? (
                        <IconComponent className="w-4.5 h-4.5 shrink-0" />
                      ) : (
                        <IconComponent className="w-4.5 h-4.5 shrink-0" />
                      )}
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className={`badge badge-sm text-xs font-bold py-1.5 px-2 border ${
                          isActive(item.path) ? 'bg-primary-content text-primary border-primary-content' : 'badge-warning bg-warning/10 text-warning border-warning/15'
                        }`}>
                          {item.badge}
                        </span>
                      )}
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent text-white text-sm font-bold shadow-xs flex items-center justify-center">
              <span>{admin?.name?.charAt(0).toUpperCase() || 'A'}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-base-content truncate leading-tight">{admin?.name || 'Administrator'}</p>
            <p className="text-xs text-base-content/40 truncate font-semibold mt-0.5">{admin?.email || 'admin@antigravity.io'}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-xl text-sm font-bold text-error/80 hover:bg-error/10 hover:text-error transition-all duration-200"
        >
          <RiLogoutBoxLine className="w-4.5 h-4.5 shrink-0" />
          <span>Sign out from Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30 shadow-xs">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay drawer */}
      <aside
        className={`flex flex-col fixed left-0 top-0 bottom-0 w-64 z-30 transition-transform duration-300 lg:hidden shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default AdminSidebar;
