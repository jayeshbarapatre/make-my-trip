/**
 * TabIcon — Proper SVG icons for each service tab.
 * Replaces the emoji icons with crisp, professional line-art SVGs.
 */
const ICONS = {
  flights: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M33 14.5L22 10.5L20 3L17 3L17.5 10.5L10 8L9 5.5L7 5.5L7.5 10.5L4 10.5L4 13.5L7.5 14L7 19L9 19L10 16.5L17.5 18.5L17 27L13 30.5L13 33L18 31.5L23 33L23 30.5L19 27L18.5 18.5L26 16.5L27 19L29 19L28.5 14L32 13.5L33 14.5Z"
        fill="currentColor" fillOpacity="0.15" />
      <path d="M32 14L20.5 9.8L18.5 2.5L16 2.5L16.8 9.8L9 7.5L8.3 5L6 5L6.5 9.8L3 9.8L3 13L6.5 13.5L6 18.5L8.3 18.5L9 16L16.8 18.3L16 27.5L12 31L12 33L18 31.5L24 33L24 31L20 27.5L19.2 18.3L27 16L27.7 18.5L30 18.5L29.5 13.5L32 13L32 14Z"
        stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  ),

  hotels: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="10" width="28" height="22" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M4 10L18 3L32 10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="14" y="20" width="8" height="12" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="7" y="15" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
      <rect x="24" y="15" width="5" height="5" rx="0.8" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),

  villas: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 17L18 5L33 17" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x="5" y="16" width="26" height="17" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="14" y="22" width="8" height="11" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="28" cy="10" r="3" stroke="currentColor" strokeWidth="1.2" />
      <path d="M28 7V4M25.5 8.5L23 7M30.5 8.5L33 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),

  holidays: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="8" y="10" width="20" height="23" rx="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <path d="M13 10V7C13 5.9 13.9 5 15 5H21C22.1 5 23 5.9 23 7V10" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 5V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="17" x2="24" y2="17" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="21" x2="24" y2="21" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="25" x2="19" y2="25" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),

  trains: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="4" width="22" height="22" rx="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <line x1="7" y1="16" x2="29" y2="16" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="12" cy="22" r="2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="24" cy="22" r="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 28L8 32M26 28L28 32" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="8" y1="32" x2="28" y2="32" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="12" y1="10" x2="12" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <line x1="24" y1="10" x2="24" y2="14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),

  buses: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="7" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <line x1="4" y1="14" x2="32" y2="14" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="29" r="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="26" cy="29" r="3" stroke="currentColor" strokeWidth="1.4" />
      <line x1="4" y1="27" x2="7" y2="27" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="29" y1="27" x2="32" y2="27" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="8" y="17" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="20" y="17" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),

  cabs: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 22L9 12H27L31 22" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 12L13 6H23L26 12" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="3" y="22" width="30" height="9" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="10" cy="31" r="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="26" cy="31" r="3" stroke="currentColor" strokeWidth="1.4" />
      <line x1="3" y1="27" x2="7" y2="27" stroke="currentColor" strokeWidth="1.2" />
      <line x1="29" y1="27" x2="33" y2="27" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  ),

  tours: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="14" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.08" />
      <circle cx="18" cy="18" r="5" stroke="currentColor" strokeWidth="1.3" />
      <line x1="18" y1="4" x2="18" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="18" y1="26" x2="18" y2="32" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="4" y1="18" x2="10" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="26" y1="18" x2="32" y2="18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),

  visa: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="30" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <rect x="3" y="13" width="30" height="5" fill="currentColor" fillOpacity="0.2" />
      <rect x="6" y="21" width="10" height="2" rx="1" fill="currentColor" />
      <rect x="6" y="24" width="6" height="1.5" rx="0.75" fill="currentColor" fillOpacity="0.5" />
      <rect x="22" y="20" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="currentColor" fillOpacity="0.1" />
      <path d="M22 23H30" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),

  cruise: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 24L10 14H26L30 24H6Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" strokeLinejoin="round" />
      <path d="M18 14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M18 6L27 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M3 27C6 29 9 30 12 29C15 28 18 29 21 30C24 31 27 30 33 27" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 31C6 33 9 34 12 33C15 32 18 33 21 34C24 35 27 34 33 31" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),

  forex: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="8" width="30" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" />
      <circle cx="18" cy="18" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M18 13V12M18 24V23" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M15 16.5C15.5 15 17 15 18 15C19.5 15 20.5 16 20.5 17.2C20.5 18.4 18 18.8 18 20.2C18 21 18.5 21.5 19.5 21.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),

  insurance: (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 4L5 9V18C5 25.2 10.8 31.8 18 33C25.2 31.8 31 25.2 31 18V9L18 4Z"
        stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.1" strokeLinejoin="round" />
      <path d="M12 18L16 22L24 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
}

export function TabIcon({ id, size = 28 }) {
  const icon = ICONS[id] || ICONS['flights']
  return (
    <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'currentColor' }}>
      {icon}
    </span>
  )
}

export default TabIcon
