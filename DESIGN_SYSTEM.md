# Admin Design System - Based on Paces Theme

## Design Tokens

### Colors
```
Primary: #003580 (TripOra Blue)
Secondary: #1a73e8 (Google Blue)
Success: #28a745 (Green)
Warning: #ffc107 (Yellow/Orange)
Danger: #dc3545 (Red)
Info: #17a2b8 (Cyan)

Neutral Light:
  --bg-body: #f8f9fa
  --bg-surface: #ffffff
  --bg-hover: #f3f4f6
  --text-primary: #1a1f36
  --text-secondary: #6b7280
  --text-muted: #9ca3af
  --border: #e5e7eb

Neutral Dark:
  --bg-body: #0f1117
  --bg-surface: #1a1f36
  --bg-hover: #13161f
  --text-primary: #f3f4f6
  --text-secondary: #9ca3af
  --text-muted: #6b7280
  --border: #374151
```

### Typography
```
Font Family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif

Font Sizes:
  H1: 2.5rem (40px)
  H2: 2rem (32px)
  H3: 1.75rem (28px)
  H4: 1.5rem (24px)
  H5: 1.25rem (20px)
  H6: 1rem (16px)
  Body: 0.9375rem (15px)
  Small: 0.875rem (14px)
  Tiny: 0.8125rem (13px)

Font Weights:
  Light: 300
  Regular: 400
  Medium: 500
  Semibold: 600
  Bold: 700
```

### Spacing Scale
```
0: 0
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
5: 1.25rem (20px)
6: 1.5rem (24px)
8: 2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)
```

### Border Radius
```
Small: 0.375rem (6px)
Medium: 0.5rem (8px)
Large: 0.75rem (12px)
Extra Large: 1rem (16px)
```

### Shadows
```
Subtle: 0 2px 4px rgba(0, 0, 0, 0.08)
Small: 0 2px 8px rgba(0, 0, 0, 0.1)
Medium: 0 4px 12px rgba(0, 0, 0, 0.15)
Large: 0 8px 24px rgba(0, 0, 0, 0.2)
Extra Large: 0 12px 32px rgba(0, 0, 0, 0.25)
```

---

## Component Patterns

### Layout Structure
```
.wrapper
  ├── .app-sidebar (250px fixed width, responsive collapse on mobile)
  └── .app-main
      ├── .app-header (topbar with logo, search, notifications, user menu)
      └── .app-content
          └── .page-container
```

### Sidebar Design
- Fixed width: 250px (compressible to 70px on collapse)
- Sections: Main Menu, Operations, Management
- Items: Icon + Label (icon hidden on collapse)
- Active state: Blue background + white text
- Hover state: Light gray background
- Footer: User info + Logout button

### Header Design
- Height: 60px
- Layout: Logo | Search | Notifications | Theme Toggle | User Dropdown
- Logo: 40px height responsive
- Search: Rounded pill style, placeholder "Quick Search..."
- Notifications: Bell icon with badge count
- Theme Toggle: Sun/Moon icon
- User Dropdown: Avatar + Name + Email + Menu

### Card Component
```
.card
  - Padding: 1.5rem
  - Border: 1px solid var(--border)
  - Border Radius: 0.5rem
  - Background: var(--bg-surface)
  - Shadow: var(--shadow-sm)
  - Hover: Shadow upgrade, slight lift

.card-header
  - Display: flex
  - Justify: space-between
  - Margin: 0 0 1rem 0
  - Title: H5 weight 600

.card-body
  - Flex: 1

.card-footer
  - Border-top: 1px solid var(--border)
  - Padding-top: 1rem
```

### Table Design
```
.table
  - Width: 100%
  - Border-collapse: collapse
  - Font-size: 0.9375rem

thead
  - Background: var(--bg-hover)
  - Border-bottom: 2px solid var(--border)

th
  - Padding: 0.75rem 1rem
  - Text-align: left
  - Font-weight: 600
  - Color: var(--text-secondary)
  - Text-transform: uppercase
  - Font-size: 0.8125rem

tbody tr
  - Border-bottom: 1px solid var(--border)
  - Hover: Background var(--bg-hover)
  - Transition: 0.2s

td
  - Padding: 1rem
```

### Button Styles
```
.btn-primary
  - Background: var(--primary)
  - Color: white
  - Padding: 0.5rem 1rem
  - Border-radius: 0.5rem
  - Border: none
  - Cursor: pointer
  - Transition: all 0.3s

  &:hover
    - Background: darker primary
    - Transform: translateY(-2px)
    - Shadow: medium

  &:active
    - Transform: translateY(0)
    - Shadow: small

.btn-secondary
  - Background: transparent
  - Color: var(--primary)
  - Border: 1px solid var(--border)
  - Hover: Background var(--bg-hover)

.btn-danger
  - Background: var(--danger)
  - Color: white

.btn-sm
  - Padding: 0.375rem 0.75rem
  - Font-size: 0.875rem

.btn-lg
  - Padding: 0.75rem 1.5rem
  - Font-size: 1rem

.btn-icon
  - Width: 40px
  - Height: 40px
  - Padding: 0
  - Display: flex
  - Align-items: center
  - Justify-content: center
```

### Form Elements
```
.form-group
  - Margin-bottom: 1.5rem

label
  - Display: block
  - Margin-bottom: 0.5rem
  - Font-weight: 500
  - Font-size: 0.9375rem

input, textarea, select
  - Width: 100%
  - Padding: 0.625rem 0.75rem
  - Border: 1px solid var(--border)
  - Border-radius: 0.5rem
  - Font-size: 0.9375rem
  - Background: var(--bg-surface)
  - Color: var(--text-primary)
  - Transition: all 0.3s

  &:focus
    - Border-color: var(--primary)
    - Outline: none
    - Box-shadow: 0 0 0 3px rgba(primary, 0.1)

  &:disabled
    - Background: var(--bg-hover)
    - Cursor: not-allowed
    - Opacity: 0.6

.form-error
  - Color: var(--danger)
  - Font-size: 0.8125rem
  - Margin-top: 0.25rem

.form-success
  - Color: var(--success)
```

### Badge Component
```
.badge
  - Display: inline-block
  - Padding: 0.375rem 0.75rem
  - Border-radius: 9999px (fully rounded)
  - Font-size: 0.8125rem
  - Font-weight: 600
  - Text-transform: uppercase
  - line-height: 1;

.badge-primary
  - Background: rgba(var(--primary), 0.1)
  - Color: var(--primary)

.badge-success
  - Background: rgba(var(--success), 0.1)
  - Color: var(--success)

.badge-warning
  - Background: rgba(var(--warning), 0.1)
  - Color: var(--warning)

.badge-danger
  - Background: rgba(var(--danger), 0.1)
  - Color: var(--danger)
```

### Modal Component
```
.modal-overlay
  - Position: fixed
  - Top: 0, Left: 0, Right: 0, Bottom: 0
  - Background: rgba(0, 0, 0, 0.5)
  - Display: flex
  - Align-items: center
  - Justify-content: center
  - Z-index: 1000

.modal
  - Background: var(--bg-surface)
  - Border-radius: 0.75rem
  - Max-width: 500px
  - Width: 90%
  - Max-height: 90vh
  - Overflow-y: auto
  - Shadow: large

.modal-header
  - Padding: 1.5rem
  - Border-bottom: 1px solid var(--border)
  - Display: flex
  - Justify-content: space-between
  - Align-items: center

.modal-body
  - Padding: 1.5rem

.modal-footer
  - Padding: 1.5rem
  - Border-top: 1px solid var(--border)
  - Display: flex
  - Justify-content: flex-end
  - Gap: 0.75rem
```

### Status Indicators
```
Active: Green (#28a745)
Pending: Orange (#ffc107)
Inactive: Gray (#6b7280)
Rejected: Red (#dc3545)
```

---

## Responsive Breakpoints

```
Mobile: < 576px
Tablet: 576px - 900px
Desktop: > 900px

Sidebar:
  Mobile: Hide by default, toggle to full screen overlay
  Tablet: Collapse to icon-only (70px) or hide
  Desktop: Always visible (250px)

Grid System:
  Mobile: 1 column
  Tablet: 2 columns
  Desktop: 3-4 columns
```

---

## Component Implementation Order

1. **Layout Components**
   - AdminLayout (wrapper structure)
   - AdminSidebar (navigation)
   - AdminHeader (topbar)

2. **Basic Components**
   - Buttons (all variants and sizes)
   - Badges (all status variants)
   - Cards (with header, body, footer)

3. **Form Components**
   - Input fields
   - Dropdowns/Selects
   - Text areas
   - Date pickers
   - Form validation

4. **Data Components**
   - Tables (with styling)
   - Modals (with form)
   - Lists

5. **Page Layouts**
   - AdminDashboard
   - AdminFlights
   - AdminHotels
   - AdminBuses
   - AdminCabs
   - AdminVendors
