# Color Hardcoding Issues & Replacement Map

## Issue Summary
- **638 hex colors** in CSS files
- **100+ hex colors** in JSX files  
- **Wrong Tailwind colors** in some components

## Most Common Colors to Replace

### Grayscale (Neutrals)
| Old Color | Replacement | DaisyUI Variable | Usage |
|-----------|-------------|------------------|-------|
| #ffffff | `bg-base-100` | `hsl(var(--b1))` | White backgrounds |
| #f8fafc | `bg-base-200` | `hsl(var(--b2))` | Secondary bg |
| #f1f5f9 | `border-base-300` | `hsl(var(--b3))` | Light borders |
| #000000 | `text-base-content` | `hsl(var(--bc))` | Black text |
| #0f172a | `text-base-content` | `hsl(var(--bc))` | Dark text |
| #333333 | `text-base-content` | `hsl(var(--bc))` | Text |
| #666666 | `text-base-content/60` | `hsl(var(--bc) / 0.6)` | Muted text |

### Semantic Colors (Success/Error/Warning)
| Old Color | Replacement | DaisyUI Variable | Usage |
|-----------|-------------|------------------|-------|
| #15803d (green) | `bg-success` | `hsl(var(--su))` | Success badge |
| #dcfce7 (light green) | `bg-success/10` | `hsl(var(--su) / 0.1)` | Success bg |
| #10b981 (green) | `text-success` | `hsl(var(--su))` | Success text |
| #b91c1c (red) | `bg-error` | `hsl(var(--er))` | Error badge |
| #fee2e2 (light red) | `bg-error/10` | `hsl(var(--er) / 0.1)` | Error bg |
| #dc2626 (red) | `text-error` | `hsl(var(--er))` | Error text |
| #ea580c (orange) | `text-warning` | `hsl(var(--wa))` | Warning text |

### Primary/Secondary Colors
| Old Color | Replacement | DaisyUI Variable | Usage |
|-----------|-------------|------------------|-------|
| #0284c7 | `bg-primary` | `hsl(var(--p))` | Primary action |
| #4f46e5 | `text-primary` | `hsl(var(--pc))` | Primary text |
| #3b82f6 | `bg-primary` | `hsl(var(--p))` | Blue backgrounds |

### Special Colors
| Old Color | Replacement | Notes |
|-----------|-------------|-------|
| #94a3b8 | `text-base-content/50` | Muted secondary text |
| #cbd5e1 | `border-base-300` | Light borders |
| #475569 | `text-base-content/60` | Dark muted text |
| #334155 | `text-base-content` | Dark text |

## Files to Fix (Priority Order)

### CRITICAL (High Visibility)
1. **BookingCard.jsx** - 40+ color references
2. **SearchResults/FlightCard.jsx** - 30+ colors
3. **SearchResults/HotelCard.jsx** - 25+ colors
4. **SearchResults/BusCard.jsx** - 20+ colors
5. **SearchResults/CabCard.jsx** - 15+ colors

### HIGH (Visible on Most Pages)
6. **Common/Header.jsx** - 10+ colors
7. **Atoms/FlightLoader.jsx** - SVG colors
8. **Organisms/HeroSearch.jsx** - Hero section
9. **App.jsx** - RouteLoader colors

### MEDIUM (CSS Files)
10. **Hero.css** - 100+ colors
11. **Sections.css** - 80+ colors
12. **FlightResults.css** - 60+ colors
13. **LoginPage.css** - 50+ colors
14. **InnerPages.css** - 40+ colors

## Replacement Strategy

### For Inline Styles
```jsx
// BEFORE
style={{ backgroundColor: '#ffffff', color: '#000000' }}

// AFTER
style={{ backgroundColor: 'hsl(var(--b1))', color: 'hsl(var(--bc))' }}
```

### For CSS Classes
```jsx
// BEFORE
className="bg-white text-black border border-gray-300"

// AFTER
className="bg-base-100 text-base-content border border-base-300"
```

### For CSS Files
```css
/* BEFORE */
.button { background-color: #ffffff; color: #000000; }

/* AFTER */
.button { background-color: hsl(var(--b1)); color: hsl(var(--bc)); }
```

## Progress Tracking

- [ ] BookingCard.jsx
- [ ] SearchResults/FlightCard.jsx
- [ ] SearchResults/HotelCard.jsx
- [ ] SearchResults/BusCard.jsx
- [ ] SearchResults/CabCard.jsx
- [ ] Common/Header.jsx
- [ ] Atoms/FlightLoader.jsx
- [ ] Organisms/HeroSearch.jsx
- [ ] App.jsx
- [ ] CSS files (bulk)

