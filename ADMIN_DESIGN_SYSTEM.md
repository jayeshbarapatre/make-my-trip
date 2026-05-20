# Admin Dashboard Design System

## Overview
The admin dashboard has been redesigned with a modern, professional design system called "MMT Admin Design" - inspired by light, airy enterprise applications with a steel-blue accent color scheme.

## Design Tokens

### Color Palette
- **Accent Color**: `#3461E0` (Steel Blue) - Primary action color and highlights
- **Accent Soft**: `#E8EDFD` - Light blue background for hover/active states
- **Accent Ink**: `#1a1f36` - Deep navy for strong text
- **Surface**: `#FAFBFD` - Primary background color
- **Surface2**: `#f5f7fb` - Secondary background for sections
- **Border**: `#DDE2EB` - Subtle divider lines
- **Ink**: `#1a1f36` - Primary text
- **Ink Muted**: `#6b7280` - Secondary text
- **Ink Light**: `#9ca3af` - Tertiary text

### Typography

#### Fonts
- **Headlines**: `Fraunces` (Serif) - Large, prominent headings with personality
- **Body**: `Inter` (Sans-serif) - Clean, readable body text
- **Code/Data**: `JetBrains Mono` (Monospace) - Technical data and code blocks

#### Font Hierarchy
- **H1**: 28px, weight 700, Fraunces - Page titles and main headings
- **H2/H3**: 18px, weight 600, Fraunces - Section headers
- **Body**: 14px, weight 400, Inter - Standard text
- **Small**: 12px, weight 500, Inter - Secondary information
- **Labels**: 10px, weight 600, Inter - Form labels and badges

### Shadows
- **Shadow SM**: `0 2px 4px rgba(0, 0, 0, 0.05)` - Subtle elevation
- **Shadow MD**: `0 4px 12px rgba(0, 0, 0, 0.08)` - Medium elevation
- **Shadow LG**: `0 8px 24px rgba(0, 0, 0, 0.12)` - Strong elevation
- **Shadow XL**: `0 12px 32px rgba(0, 0, 0, 0.15)` - Maximum elevation

### Spacing
- Gap/Padding base unit: 4px
- Multipliers: 2, 4, 6, 8, 12, 16, 20, 24, 28, 32px

## Components Redesigned

### AdminLayout
- **Width**: 248px sidebar (fixed)
- **Features**:
  - Responsive drawer on mobile
  - Clean, professional branding
  - Sticky header with controls
  - Consistent padding and spacing

### AdminSidebar
- **Active State**: Soft blue background (`var(--accentSoft)`) with accent text color
- **Hover State**: Same as active for visual consistency
- **Logo Badge**: Gradient from accent color with white text
- **User Card**: Accent color gradient avatar
- **Logout Button**: Soft blue background with hover state fill

### AdminHeader
- **Sticky**: Remains visible when scrolling
- **Components**:
  - Mobile menu toggle
  - Page title with Fraunces font
  - Language selector with flags
  - Notifications bell with badge
  - Theme toggle (light/dark)
  - Admin dropdown menu with profile
- **Shadows**: Uses shadow-sm for subtle elevation

### AdminDashboard
- **Greeting Banner**:
  - Gradient background from accent color
  - Atmospheric background circles for visual interest
  - Dynamic greeting based on time of day
  - Current date display
  - Z-index management for layering

- **KPI Cards** (4-column responsive grid):
  - Title with uppercase styling
  - Icon with colored background
  - Large value in Fraunces serif font
  - Trend indicator (up/down)
  - Hover elevation effect
  - Dark/light mode support

- **Charts**:
  - Area charts for revenue trends
  - Bar charts for visitor data
  - Color coordination with theme
  - Interactive tooltips
  - Responsive sizing

- **Tables**:
  - Clean, minimal design
  - Hover states for interactivity
  - Status badges
  - Action buttons
  - Search and filter support

## Usage in JSX

### Using Design Tokens
```jsx
// CSS Variables
style={{
  background: 'var(--bg-surface)',
  color: 'var(--text-primary)',
  border: '1px solid var(--border)',
  boxShadow: 'var(--shadow-sm)',
  borderRadius: '8px',
  padding: '16px'
}}

// Or in Tailwind (if applicable)
className="bg-base-100 text-base-content border border-base-300"
```

### Typography
```jsx
// Headlines
<h1 style={{ fontFamily: "'Fraunces', serif", fontSize: '28px', fontWeight: '700' }}>
  Title
</h1>

// Body text
<p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
  Description
</p>

// Code/data
<code style={{ fontFamily: "'JetBrains Mono', monospace" }}>
  data
</code>
```

## Dark Mode Support
The design system includes built-in dark mode support:
- Accent colors adjust (lighter blue `#5B7EFF`)
- Backgrounds darken appropriately
- Text colors invert for readability
- Shadows adjust opacity
- Borders remain visible

Apply via: `data-theme="dark"` attribute

## Responsive Breakpoints
- **Mobile**: < 768px - Single column, stacked layout
- **Tablet**: 768px - 1024px - Two columns
- **Desktop**: > 1024px - Full grid layout

## Files Modified
1. `src/components/Admin/AdminLayout.css` - Core design tokens
2. `src/components/Admin/AdminSidebar.css` - Sidebar styling
3. `src/components/Admin/AdminHeader.css` - Header styling
4. `src/pages/AdminDashboard.jsx` - Greeting banner, KPI cards
5. `src/pages/AdminDashboard.css` - Dashboard component styles

## Future Enhancements
1. Create reusable component library (StatCard, StatPill, ActionBtn)
2. Implement theme switcher UI (5 accent color options)
3. Add animation library integration
4. Extend to other admin pages (AdminFlights, AdminHotels, etc.)
5. Create style guide/Storybook documentation
