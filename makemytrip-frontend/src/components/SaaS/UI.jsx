import React from 'react';
import { RiLoader4Line } from 'react-icons/ri';

/**
 * Premium SaaS Button with interactive hover effects and loading state
 */
export const SaaSButton = ({
  children,
  variant = 'primary', // primary | secondary | accent | neutral | ghost | error | success | warning | info
  size = 'md', // xs | sm | md | lg
  outline = false,
  loading = false,
  disabled = false,
  className = '',
  icon: Icon = null,
  iconRight = false,
  ...props
}) => {
  const baseClass = 'btn font-semibold tracking-wide transition-all duration-200 active:scale-95 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    neutral: 'btn-neutral',
    ghost: 'btn-ghost',
    error: 'btn-error text-white',
    success: 'btn-success text-white',
    warning: 'btn-warning text-white',
    info: 'btn-info text-white'
  };

  const sizeClasses = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg'
  };

  const outlineClass = outline ? 'btn-outline' : '';
  const loadingClass = loading ? 'pointer-events-none opacity-80' : '';

  return (
    <button
      className={`${baseClass} ${variantClasses[variant] || 'btn-primary'} ${sizeClasses[size] || 'btn-md'} ${outlineClass} ${loadingClass} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <RiLoader4Line className="w-4 h-4 animate-spin" />
      ) : Icon && !iconRight ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      
      <span>{children}</span>

      {Icon && iconRight && !loading && (
        <Icon className="w-4 h-4 shrink-0" />
      )}
    </button>
  );
};

/**
 * Modern SaaS Form Input
 */
export const SaaSInput = ({
  label,
  helperText,
  errorText,
  icon: Icon = null,
  rightIcon: RightIcon = null,
  onRightIconClick = null,
  className = '',
  containerClassName = '',
  size = 'md', // sm | md | lg
  ...props
}) => {
  const sizeClasses = {
    sm: 'input-sm',
    md: 'input-md',
    lg: 'input-lg'
  };

  const inputSizeClass = sizeClasses[size] || 'input-md';
  const hasError = !!errorText;

  return (
    <div className={`form-control w-full ${containerClassName}`}>
      {label && (
        <label className="label py-1">
          <span className="label-text text-sm font-medium text-base-content/85">{label}</span>
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 text-base-content/40 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`input input-bordered w-full transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 ${Icon ? 'pl-10' : ''} ${RightIcon ? 'pr-10' : ''} ${inputSizeClass} ${hasError ? 'input-error' : ''} ${className}`}
          {...props}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className={`absolute right-3 text-base-content/40 hover:text-base-content transition-colors ${onRightIconClick ? 'cursor-pointer' : 'pointer-events-none'}`}
          >
            <RightIcon className="w-4 h-4" />
          </button>
        )}
      </div>
      {errorText ? (
        <label className="label py-1">
          <span className="label-text-alt text-xs text-error font-medium">{errorText}</span>
        </label>
      ) : helperText ? (
        <label className="label py-1">
          <span className="label-text-alt text-xs text-base-content/50">{helperText}</span>
        </label>
      ) : null}
    </div>
  );
};

/**
 * Modern SaaS Select Dropdown
 */
export const SaaSSelect = ({
  label,
  options = [], // Array of { value, label } or strings
  helperText,
  errorText,
  className = '',
  containerClassName = '',
  size = 'md', // sm | md | lg
  placeholder = 'Select an option',
  ...props
}) => {
  const sizeClasses = {
    sm: 'select-sm',
    md: 'select-md',
    lg: 'select-lg'
  };

  const selectSizeClass = sizeClasses[size] || 'select-md';
  const hasError = !!errorText;

  return (
    <div className={`form-control w-full ${containerClassName}`}>
      {label && (
        <label className="label py-1">
          <span className="label-text text-sm font-medium text-base-content/85">{label}</span>
        </label>
      )}
      <select
        className={`select select-bordered w-full transition-all duration-200 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 ${selectSizeClass} ${hasError ? 'select-error' : ''} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt, idx) => {
          const value = typeof opt === 'object' ? opt.value : opt;
          const labelText = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={idx} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
      {errorText ? (
        <label className="label py-1">
          <span className="label-text-alt text-xs text-error font-medium">{errorText}</span>
        </label>
      ) : helperText ? (
        <label className="label py-1">
          <span className="label-text-alt text-xs text-base-content/50">{helperText}</span>
        </label>
      ) : null}
    </div>
  );
};

/**
 * Reusable Premium SaaS Card Component
 */
export const SaaSCard = ({
  children,
  title,
  subtitle,
  actions,
  className = '',
  bodyClassName = '',
  glass = false,
  hover = true,
  ...props
}) => {
  const cardClass = `card bg-base-100 border border-base-200/60 shadow-sm transition-all duration-300 ${
    hover ? 'hover:shadow-md hover:border-base-300/80' : ''
  } ${glass ? 'backdrop-blur bg-base-100/80' : ''} ${className}`;

  return (
    <div className={cardClass} {...props}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-5 border-b border-base-200/50">
          <div>
            {title && <h3 className="font-bold text-base text-base-content tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-base-content/50 mt-1 font-medium">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      <div className={`card-body p-6 ${bodyClassName}`}>
        {children}
      </div>
    </div>
  );
};

/**
 * Premium Responsive SaaS Table Component
 */
export const SaaSTable = ({
  headers = [], // Array of strings or objects { key, label, className, align }
  rows = [], // Array of row objects or arrays
  renderRow, // Function to render a custom row: (row, index) => JSX
  loading = false,
  emptyState, // JSX to show when rows are empty
  className = '',
  containerClassName = '',
}) => {
  return (
    <div className={`card bg-base-100 border border-base-200/60 shadow-sm overflow-hidden ${containerClassName}`}>
      <div className="overflow-x-auto w-full">
        <table className={`table table-md w-full ${className}`}>
          <thead>
            <tr className="text-xs text-base-content/40 uppercase tracking-widest bg-base-200/40 border-b border-base-200/60">
              {headers.map((h, idx) => {
                const label = typeof h === 'object' ? h.label : h;
                const align = typeof h === 'object' && h.align ? `text-${h.align}` : '';
                const hClass = typeof h === 'object' && h.className ? h.className : '';
                return (
                  <th key={idx} className={`${align} ${hClass} font-semibold py-3.5`}>
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(3)].map((_, i) => (
                <tr key={i} className="animate-pulse border-b border-base-200/50">
                  {headers.map((_, hIdx) => (
                    <td key={hIdx} className="py-4">
                      <div className="skeleton h-4 w-5/6 rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="py-12 text-center">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center py-6 text-base-content/40">
                      <p className="font-semibold text-sm">No items found</p>
                      <p className="text-xs mt-1">There are no records available in this list.</p>
                    </div>
                  )}
                </td>
              </tr>
            ) : (
              rows.map((row, rIdx) => {
                if (renderRow) return renderRow(row, rIdx);
                
                return (
                  <tr key={rIdx} className="hover:bg-base-200/30 transition-colors border-b border-base-200/50">
                    {headers.map((h, hIdx) => {
                      const key = typeof h === 'object' ? h.key : h;
                      const val = row[key] !== undefined ? row[key] : row[hIdx];
                      const align = typeof h === 'object' && h.align ? `text-${h.align}` : '';
                      const cellClass = typeof h === 'object' && h.className ? h.className : '';
                      return (
                        <td key={hIdx} className={`${align} ${cellClass} py-3.5 text-sm`}>
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Reusable generic Status Badge
 */
export const SaaSBadge = ({ status }) => {
  const cleaned = (status || '').toUpperCase().trim();

  // Draft | Pending Approval | Approved | Rejected
  const configs = {
    DRAFT: 'badge-neutral bg-base-300 text-base-content/80',
    PENDING_APPROVAL: 'badge-warning bg-warning/10 border-warning/20 text-warning',
    PENDING: 'badge-warning bg-warning/10 border-warning/20 text-warning',
    APPROVED: 'badge-success bg-success/10 border-success/20 text-success',
    ACTIVE: 'badge-success bg-success/10 border-success/20 text-success',
    REJECTED: 'badge-error bg-error/10 border-error/20 text-error',
    INACTIVE: 'badge-neutral bg-base-300 text-base-content/60',
  };

  const labels = {
    DRAFT: 'Draft',
    PENDING_APPROVAL: 'Pending Review',
    PENDING: 'Pending',
    APPROVED: 'Approved',
    ACTIVE: 'Active',
    REJECTED: 'Rejected',
    INACTIVE: 'Inactive',
  };

  const badgeClass = configs[cleaned] || 'badge-ghost';
  const label = labels[cleaned] || status;

  return (
    <span className={`badge badge-sm border font-semibold px-2.5 py-2.5 gap-1 shrink-0 ${badgeClass}`}>
      {label}
    </span>
  );
};

/**
 * Clean overlay SaaS Modal
 */
export const SaaSModal = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  maxWidth = 'max-w-md', // max-w-sm | max-w-md | max-w-lg | max-w-xl | max-w-2xl
  disabled = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className={`bg-base-100 rounded-2xl border border-base-200/50 shadow-2xl w-full ${maxWidth} overflow-hidden transform scale-95 animate-scale-up`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200/50">
          <h3 className="font-bold text-base text-base-content">{title}</h3>
          <button
            className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content"
            onClick={onClose}
            disabled={disabled}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        {/* Footer */}
        {actions && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 bg-base-200/20 border-t border-base-200/50">
            {actions}
          </div>
        )}
      </div>
      <div className="fixed inset-0 -z-10 cursor-pointer" onClick={disabled ? undefined : onClose} />
    </div>
  );
};

/**
 * Premium Toast Notifications alert UI
 */
export const SaaSAlert = ({
  message,
  type = 'info', // success | error | warning | info
  onClose,
}) => {
  const alertClasses = {
    success: 'alert-success text-white',
    error: 'alert-error text-white',
    warning: 'alert-warning text-white',
    info: 'alert-info text-white'
  };

  return (
    <div className={`alert ${alertClasses[type]} shadow-lg flex items-center justify-between py-3 px-4 rounded-xl`}>
      <span className="text-sm font-medium">{message}</span>
      {onClose && (
        <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
          ✕
        </button>
      )}
    </div>
  );
};

/**
 * Premium Tab list selector
 */
export const SaaSTabs = ({
  tabs = [], // Array of { id, label, icon: Icon }
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`tabs tabs-boxed bg-base-200/60 p-1 rounded-xl flex gap-1 ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`tab flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
              isActive
                ? 'bg-base-100 text-primary shadow-xs font-bold'
                : 'text-base-content/50 hover:text-base-content hover:bg-base-300/40'
            }`}
          >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

/**
 * Premium Skeleton Loader for listings & stats
 */
export const SaaSLoader = ({ type = 'list' }) => {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card bg-base-100 border border-base-200/60 shadow-sm p-5 space-y-3">
            <div className="skeleton h-3 w-20 rounded" />
            <div className="skeleton h-8 w-14 rounded" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="skeleton h-10 w-48 rounded" />
      <div className="card bg-base-100 border border-base-200/60 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="skeleton h-8 w-64 rounded" />
          <div className="skeleton h-8 w-24 rounded" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
};
