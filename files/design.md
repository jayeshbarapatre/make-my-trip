# TripOra Website - Design System & UI/UX Documentation

## Design System Overview

TripOra employs an immersive, scalable design system built on the **Cosmos Philosophy**—a foundational framework that guides all product design and feature development. The system prioritizes **clarity, context, continuity, and confidence** while maintaining consistency across web, mobile, and tablet experiences.

## Core Design Principles

### 1. **User-Centric Information Architecture**
- Information-led design (not image-led)
- Clear visual hierarchy using spacing, typography, and contrast
- Progressive disclosure of details (core info upfront, secondary options collapsible)
- Context-aware content prioritization

### 2. **Mobile-First Design**
- Primary design optimization for mobile devices
- Graceful degradation for low-end Android devices
- Touch-friendly interaction targets (min 44x44px)
- Responsive breakpoints: mobile, tablet, desktop
- Optimized typography for mobile readability

### 3. **Accessibility & Inclusive Design**
- WCAG 2.1 AA compliance (target standard)
- Minimum color contrast ratios (4.5:1 for body text, 3:1 for large text)
- Clear focus states and keyboard navigation
- Semantic HTML and proper ARIA labels
- Support for screen readers and assistive technologies
- Adequate font sizes (16px minimum for body text)
- Inline error handling and validation feedback

### 4. **Visual Consistency & Scalability**
- Component-based architecture
- Modular design system with reusable elements
- Atomic Design methodology (atoms → molecules → organisms)
- Naming conventions aligned with development teams
- Design-to-code collaboration workflows

### 5. **Performance & Lightweight Design**
- High-quality, optimized imagery
- Minimal animation for performance
- Fast-loading components
- Efficient use of whitespace
- Reduced cognitive load through simplification

## Design System Components

### **Typography System**

#### Font Families
- **Primary Font**: System font stack (varies by platform)
- **Fallbacks**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif
- **Display Font**: Bold sans-serif for headers
- **Body Font**: Regular/medium sans-serif for content

#### Font Sizes & Hierarchy
| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1 (Page Title)** | 28-32px | Bold (700) | 1.2 | Main page headings |
| **H2 (Section Title)** | 24px | Bold (700) | 1.3 | Section headings |
| **H3 (Subsection)** | 20px | SemiBold (600) | 1.4 | Category labels |
| **Body Large** | 16px | Regular (400) | 1.5 | Primary body text |
| **Body** | 14px | Regular (400) | 1.6 | Secondary content |
| **Small** | 12px | Regular (400) | 1.5 | Metadata, timestamps |
| **Caption** | 11px | Regular (400) | 1.4 | Helper text, hints |

#### Typography Best Practices
- Minimum font size: 12px (for captions only)
- Recommended body text: 14-16px
- Adequate line-height (1.5-1.6) for readability
- Maximum line length: 50-75 characters for optimal reading
- Font weight hierarchy for emphasis

### **Color System**

#### Primary Brand Colors
- **Primary Blue**: #1F6DB8 (action CTAs, active states)
- **Dark Blue**: #003580 (headers, emphasis)
- **Golden Yellow**: #FFD700 (ratings, highlights)
- **White**: #FFFFFF (backgrounds, cards)

#### Semantic Colors
| Color | Hex | Usage | Accessibility |
|-------|-----|-------|----------------|
| **Success Green** | #4CAF50 | Confirmation, positive actions | ✓ Tested |
| **Error Red** | #F44336 | Errors, warnings | ✓ Tested |
| **Warning Orange** | #FF9800 | Caution, alerts | ✓ Tested |
| **Info Blue** | #2196F3 | Information, hints | ✓ Tested |
| **Neutral Gray** | #757575 | Secondary text, borders | ✓ Tested |
| **Light Gray** | #F5F5F5 | Backgrounds, dividers | ✓ Tested |
| **Dark Gray** | #424242 | Primary text | ✓ Tested |

#### Light Mode
- Background: #FFFFFF
- Primary Text: #212121
- Secondary Text: #757575
- Dividers: #E0E0E0
- Hover States: #F5F5F5

#### Dark Mode
- Background: #121212
- Primary Text: #FFFFFF
- Secondary Text: #B0B0B0
- Dividers: #383838
- Hover States: #1E1E1E

### **Spacing System**

#### Base Unit: 8px
Consistent spacing scale ensures visual harmony and alignment.

| Scale | Value | Usage |
|-------|-------|-------|
| **XS** | 4px | Micro-interactions, tight spacing |
| **S** | 8px | Component padding, gap between elements |
| **M** | 16px | Container padding, section spacing |
| **L** | 24px | Major section spacing, headers |
| **XL** | 32px | Page-level spacing |
| **XXL** | 48px | Large container spacing |

#### Grid System
- 12-column grid for desktop (1200px max-width)
- 6-column grid for tablet (768px breakpoint)
- Single column for mobile (responsive)
- Gutter: 16px (8px on each side)

### **Button System**

#### Button Types
1. **Primary Button** - Main CTAs (book flight, search)
2. **Secondary Button** - Alternative actions (view details)
3. **Tertiary Button** - Low-priority actions (skip, cancel)
4. **Danger Button** - Destructive actions (delete booking)

#### Button States
| State | Style | Interaction |
|-------|-------|-------------|
| **Default** | Solid background, white text | Pointer cursor |
| **Hover** | Darker shade, subtle shadow | Slight lift effect |
| **Active/Pressed** | Darker, inset shadow | Tactile feedback |
| **Disabled** | Gray background, reduced opacity | No interaction |
| **Focus** | Visible focus ring (2px outline) | Keyboard navigation |
| **Loading** | Spinner icon, disabled state | Action in progress |

#### Button Sizing
| Size | Padding | Font | Min Height | Usage |
|------|---------|------|-----------|-------|
| **Small** | 8px 16px | 12px | 32px | Secondary actions |
| **Medium** | 12px 24px | 14px | 40px | Standard CTAs |
| **Large** | 16px 32px | 16px | 48px | Primary CTAs |

### **Card Component**

#### Structure
```
┌─────────────────────────┐
│  [Image/Icon]           │
├─────────────────────────┤
│  Title (Bold)           │
│  Subtitle/Description   │
├─────────────────────────┤
│  Price | Rating | Badge │
├─────────────────────────┤
│  [CTA Button]           │
└─────────────────────────┘
```

#### Card Variants
1. **Destination Card** - Image, title, rating, CTA
2. **Hotel Card** - Image, name, price, amenities, rating
3. **Flight Card** - Departure, arrival, price, duration, stops
4. **Search Result Card** - Comparison metrics, pricing, details
5. **Promotional Card** - Offer, discount, expiry, CTA

#### Styling
- Border radius: 8px
- Shadow: 0 2px 8px rgba(0,0,0,0.08) (normal), 0 4px 16px rgba(0,0,0,0.12) (hover)
- Padding: 16px
- Margin: 12px horizontal, 16px vertical

### **Form Components**

#### Input Fields
- Border: 1px solid #E0E0E0
- Border radius: 4px
- Padding: 12px 16px
- Font size: 14px
- Height: 40px
- Focus: 2px blue border, background highlight
- Error: Red border, error message below
- Placeholder: Light gray text

#### Form Validation
- **Real-time feedback**: Show errors as user types
- **Clear messaging**: Specific error descriptions (not generic)
- **Visual indicators**: Red border + icon + helper text
- **Success states**: Green checkmark, success message
- **Disabled states**: Grayed out, reduced opacity

#### Input Types
1. **Text Input** - Standard form fields
2. **Date Picker** - Calendar-based selection
3. **Time Picker** - Clock-based selection
4. **Dropdown/Select** - Option selection
5. **Checkbox** - Multiple selections
6. **Radio Button** - Single selection
7. **Toggle/Switch** - Binary toggle
8. **Textarea** - Multi-line text

### **Navigation System**

#### Header Navigation
- Logo placement: top-left
- Primary menu: right-aligned (flights, hotels, trains, buses, etc.)
- Secondary actions: search icon, user profile, notifications
- Mobile: hamburger menu
- Sticky header: remains visible on scroll

#### Search Bar
- Prominent placement (below header)
- Auto-complete suggestions
- Filter badge (showing active filters)
- Search history (up to 5 recent searches)
- Voice search icon (on mobile)

#### Filters & Sorting
- Horizontal filter pills (mobile)
- Expandable filter panel (tablet+)
- Presets: Recommended, Price Low-High, Price High-Low, Duration, Rating
- Applied filters badge count
- Clear all filters button

#### Breadcrumbs
- Path: Home > Flights > Search Results > Selected Flight
- Style: Gray text with separators
- Click-through to parent pages

### **Search & Filter Interface**

#### Search Inputs
- **From/To**: City autocomplete with recent selections
- **Dates**: Date range picker (check-in/check-out)
- **Passengers**: Selector for count and types
- **Travel Class**: Dropdown (economy, business, first)
- **Flexible Dates**: Toggle for +/- 3 days
- **Trip Type**: Radio buttons (one-way, round-trip, multi-city)

#### Filter Categories
1. **Price Range** - Slider with input fields
2. **Duration** - Hour range slider
3. **Departure Time** - Time range selector
4. **Amenities** - Checkbox list (WiFi, parking, breakfast, etc.)
5. **Rating** - Star rating filter (3+ stars, etc.)
6. **Stops** - Direct/1-stop/2+ stops
7. **Airlines/Hotels** - Brand selection

#### Filter UI Patterns
- **Sticky filters**: Remain visible during scroll
- **Applied badges**: Show active filters inline
- **Quick presets**: "Under 5000", "5-star ratings"
- **Filter count**: Badge showing number of applied filters
- **Clear all**: Reset button for ease of use

### **Rating & Review Component**

#### Star Rating Display
- 5-star visual (filled, half, empty stars)
- Numeric value (e.g., 4.5/5.0)
- Review count (e.g., "2,341 reviews")
- Percentage breakdown (optional)

#### Review Cards
```
┌──────────────────────────┐
│ ★★★★★ (5.0)             │
│ "Amazing experience!"    │
│ By: John D. | May 2026   │
│ Verified Booking ✓       │
└──────────────────────────┘
```

### **Modals & Dialogs**

#### Modal Structure
- Backdrop: Semi-transparent overlay (rgba(0,0,0,0.5))
- Dialog: White card, centered, max-width 500px
- Close button: Top-right corner (X icon)
- Header: Bold title
- Body: Content with spacing
- Footer: Action buttons

#### Dialog Types
1. **Confirmation** - "Are you sure?"
2. **Informational** - Display information
3. **Form Modal** - Input forms
4. **Error Modal** - Error handling
5. **Loading Modal** - Progress indicator

### **Notifications & Toast Messages**

#### Toast Notification
- Position: Bottom-right (mobile: full-width bottom)
- Duration: 4 seconds auto-dismiss
- Animated entrance/exit (fade, slide)
- Icon + message + close button
- Color-coded by type (success: green, error: red, info: blue)

#### In-Page Alert
- Top positioning (sticky)
- Dismissible (X button)
- Prominent color coding
- Icon + message + optional CTA

## Layout Patterns

### **Homepage Layout**
```
┌─────────────────────────────┐
│      Header & Logo          │
├─────────────────────────────┤
│    [Hero Search Section]    │
│  ┌─ From ─┬─ To ─┬─ Date ─┐ │
│  └─────────────────────────┘ │
├─────────────────────────────┤
│  Trending Destinations      │
│  [Card] [Card] [Card] ...   │
├─────────────────────────────┤
│  Holiday Packages           │
│  [Card] [Card] [Card] ...   │
├─────────────────────────────┤
│  Special Offers & Deals     │
│  [Banner] [Banner] ...      │
├─────────────────────────────┤
│     Footer                  │
└─────────────────────────────┘
```

### **Search Results Layout**
```
┌──────────────┬──────────────────┐
│   Filters    │  Search Results  │
│  ┌────────┐ │  ┌────────────┐  │
│  │ Price  │ │  │ Result 1   │  │
│  │ Rating │ │  ├────────────┤  │
│  │ Duration│ │  │ Result 2   │  │
│  │ Amenities│ │ ├────────────┤  │
│  │ Stops  │ │  │ Result 3   │  │
│  └────────┘ │  └────────────┘  │
└──────────────┴──────────────────┘
```

### **Booking Flow Layout**
```
Step 1: Select       Step 2: Passengers    Step 3: Review
┌──────────────┐   ┌──────────────┐    ┌──────────────┐
│ [Selected]   │ → │ [Details]    │ →  │ [Summary]    │
│              │   │              │    │              │
│ Details      │   │ Add traveler │    │ Confirm      │
│ Modification │   │              │    │ & Pay        │
└──────────────┘   └──────────────┘    └──────────────┘
```

## Responsive Design Breakpoints

| Device | Width | Columns | Approach |
|--------|-------|---------|----------|
| **Mobile** | < 480px | 1 | Single-column, stacked |
| **Tablet** | 480-768px | 6 | Two-column grid |
| **Desktop** | 768-1200px | 12 | Three+ column grid |
| **Large Desktop** | > 1200px | 12 | Max-width container |

### Mobile-Specific Optimizations
- Touch-friendly targets: 44x44px minimum
- Larger input fields: 44px height
- Full-width buttons: No horizontal scrolling
- Bottom sheet modals: Slide from bottom
- Tab navigation: Bottom tab bar (mobile convention)
- Simplified menus: Hamburger navigation

## Color Contrast Compliance

### WCAG 2.1 Standards
| Combination | Ratio | Level |
|-------------|-------|-------|
| Dark Blue (#003580) on White | 8.5:1 | AAA ✓ |
| Primary Blue (#1F6DB8) on White | 5.2:1 | AA ✓ |
| Dark Gray (#424242) on White | 6.5:1 | AA ✓ |
| Medium Gray (#757575) on White | 3.5:1 | AA (body) ✓ |
| Error Red (#F44336) on White | 3.4:1 | AA (large text) ✓ |

## Animation & Micro-interactions

### Principles
- **Purpose-driven**: Animations guide user attention and provide feedback
- **Performance**: 200-300ms duration for snappy feel
- **Subtle**: Avoid excessive motion that impacts performance
- **Accessibility**: Respect `prefers-reduced-motion` preference

### Common Animations
1. **Page Transition**: Fade in (200ms)
2. **Button Hover**: Slight lift + shadow (100ms)
3. **Loading Spinner**: Continuous rotation (1s)
4. **Toast Entrance**: Slide up + fade (300ms)
5. **Modal Open**: Fade + scale (200ms)
6. **List Item Reveal**: Stagger animation (100ms each)

### Easing Functions
- **Ease-in-out**: Standard interactions
- **Ease-out**: Entrances (feels snappy)
- **Ease-in**: Exits (feels natural)
- **Linear**: Continuous spinners/loaders

## Accessibility Guidelines

### Keyboard Navigation
- Tab order: Left-to-right, top-to-bottom
- Visible focus indicators: 2px outline, contrasting color
- Skip links: "Skip to main content"
- Focus trap in modals: Trap focus within dialog

### Screen Reader Support
- Semantic HTML: `<button>`, `<a>`, `<form>`, `<label>`
- ARIA labels: aria-label for icon buttons
- ARIA descriptions: aria-describedby for form hints
- Live regions: aria-live for dynamic updates
- Image alt text: Descriptive, concise (max 125 characters)

### Color Accessibility
- Don't rely on color alone (use icons, text)
- Sufficient contrast for colorblind users
- Test with tools: WAVE, Axe, Lighthouse

### Motion & Vestibular Disorders
- Respect `prefers-reduced-motion`: @media (prefers-reduced-motion: reduce)
- Disable auto-playing videos
- Avoid parallax scrolling
- Minimize flashing content (< 3 flashes/second)

## Design-to-Code Handoff

### Component Naming Convention
```
ComponentType_Variant_State

Examples:
- Button_Primary_Default
- Button_Primary_Hover
- Button_Primary_Disabled
- Card_Hotel_Selected
- Filter_Price_Expanded
```

### Design System Documentation
- Figma components with specs
- CSS/SCSS variable names mapped to design tokens
- Responsive behavior documented
- State variations clearly labeled
- Usage guidelines and Do's/Don'ts

### Development Integration
- Figma-to-code plugins (Storybook integration)
- CSS variable usage for theming
- Responsive design implemented via media queries
- Animation libraries: Framer Motion (React), GSAP

## Design System Maintenance

### Component Inventory
- Regularly audit component usage
- Remove deprecated components (with migration guides)
- Document new component additions
- Versioning: Semantic versioning (major.minor.patch)

### Design Review Checklist
- [ ] Follows typography hierarchy
- [ ] Uses correct color palette
- [ ] Maintains consistent spacing
- [ ] Accessible (WCAG 2.1 AA)
- [ ] Mobile-responsive
- [ ] Clear visual states
- [ ] Consistent with existing patterns

## Theming System

### Light Theme (Default)
- Primary background: #FFFFFF
- Text color: #212121
- Border color: #E0E0E0
- Hover background: #F5F5F5

### Dark Theme
- Primary background: #121212
- Text color: #FFFFFF
- Border color: #383838
- Hover background: #1E1E1E

### Theme Variables (CSS)
```css
:root {
  --color-primary: #1F6DB8;
  --color-secondary: #003580;
  --color-success: #4CAF50;
  --color-error: #F44336;
  --color-text-primary: #212121;
  --color-bg-primary: #FFFFFF;
  --spacing-unit: 8px;
  --border-radius: 4px;
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.08);
}
```

## Performance Optimization in Design

### Image Optimization
- WebP format with PNG fallback
- Responsive images: srcset and sizes attributes
- Lazy loading: images below fold
- Compression: Tinypng, Imagemin

### CSS/JS Optimization
- Minimize CSS (BEM methodology)
- Defer non-critical JS
- Code splitting for components
- Tree shaking unused styles

### Loading States
- Skeleton screens matching content shape
- Progress indicators for long operations
- Optimistic UI updates
- Streaming large lists with virtualization

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Design System Version**: Cosmos 2.1
