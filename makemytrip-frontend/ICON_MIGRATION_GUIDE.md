# Icon Migration Guide - Font Awesome, Iconoir & HugeIcons

## Overview
This project now uses **react-icons** which provides access to:
- ✓ **Font Awesome** (comprehensive icon set)
- ✓ **Iconoir** (modern outline icons)
- ✓ **HugeIcons** (stroke and rounded icons)

## Installation
Already installed via: `npm install react-icons`

## How to Use

### 1. Import the Icons Utility
```javascript
import Icons, { iconSizes, iconColors } from '../utils/icons'
```

### 2. Basic Usage - Simple Icon
```jsx
// Using default size and color
<Icons.heart size={20} color={iconColors.error} />
<Icons.star size={16} color={iconColors.warning} />
<Icons.search size={18} />
```

### 3. Usage with Dynamic State
```jsx
// Heart icon that toggles filled/outlined
const [isFavorite, setIsFavorite] = useState(false)

<button onClick={() => setIsFavorite(!isFavorite)}>
  {isFavorite ? (
    <Icons.heart size={20} color={iconColors.error} />
  ) : (
    <Icons.heartOutline size={20} color={iconColors.textMuted} />
  )}
</button>
```

### 4. Icon Sizes
```javascript
iconSizes.xs    // 12px
iconSizes.sm    // 14px
iconSizes.base  // 16px
iconSizes.lg    // 18px
iconSizes.xl    // 20px
iconSizes['2xl'] // 24px
iconSizes['3xl'] // 28px
iconSizes['4xl'] // 32px
```

### 5. Icon Colors (DaisyUI Theme)
```javascript
iconColors.primary     // hsl(var(--p))
iconColors.error       // hsl(var(--er))
iconColors.success     // hsl(var(--su))
iconColors.warning     // hsl(var(--wa))
iconColors.info        // hsl(var(--in))
iconColors.text        // hsl(var(--bc))
iconColors.textMuted   // hsl(var(--nc))
iconColors.white       // hsl(var(--b1))
```

## Available Icons in the System

### Navigation
- `Icons.chevronLeft`
- `Icons.chevronRight`
- `Icons.chevronDown`

### Interaction
- `Icons.heart` & `Icons.heartOutline`
- `Icons.star` & `Icons.starOutline`
- `Icons.check`

### Search & Filter
- `Icons.search` & `Icons.searchOutline`
- `Icons.filter` & `Icons.filterOutline`

### Location & Maps
- `Icons.mapPin` & `Icons.mapPinOutline`

### Date & Time
- `Icons.calendar` & `Icons.calendarOutline`
- `Icons.clock`

### User Account
- `Icons.user` & `Icons.userOutline`
- `Icons.logout` & `Icons.logoutOutline`

### Commerce
- `Icons.cart` & `Icons.cartOutline`
- `Icons.creditCard`

### Contact
- `Icons.phone` & `Icons.phoneOutline`
- `Icons.email` & `Icons.emailOutline`

### Security
- `Icons.lock` & `Icons.lockOutline`
- `Icons.eye`
- `Icons.eyeOff`

### Services
- `Icons.home`
- `Icons.hotel`
- `Icons.plane`
- `Icons.train`
- `Icons.bus`
- `Icons.taxi`

### Other
- `Icons.umbrella` (weather)

## Migration Examples

### Before (Hardcoded SVG)
```jsx
const I = {
  heart: (filled, c) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? (c || "#eb2226") : "none"} stroke={filled ? (c || "#eb2226") : "#666"} strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
}

// Usage
<button>{I.heart(true, '#eb2226')}</button>
```

### After (Using react-icons)
```jsx
import Icons, { iconColors } from '../utils/icons'

// Usage
<button>
  <Icons.heart size={18} color={iconColors.error} />
</button>
```

## How to Extend the Icons Utility

### Adding a New Icon
Edit `src/utils/icons.jsx`:

```javascript
// 1. Import from react-icons
import { FaNewIcon, CiNewIcon } from 'react-icons/fa'  // or 'react-icons/ci' etc

// 2. Add to Icons object
export const Icons = {
  newIcon: (props = {}) => (
    <FaNewIcon {...props} />
  ),
  newIconOutline: (props = {}) => (
    <CiNewIcon {...props} />
  ),
  // ... rest of icons
}
```

## Icon Library Prefixes in react-icons

```
fa*   = Font Awesome        (import from 'react-icons/fa')
ci*   = Iconoir            (import from 'react-icons/ci')
hi*   = HugeIcons          (import from 'react-icons/hi2')
ai*   = AntDesign icons    (import from 'react-icons/ai')
bi*   = Bootstrap icons    (import from 'react-icons/bi')
bs*   = BoxIcons           (import from 'react-icons/bs')
cg*   = Css.gg             (import from 'react-icons/cg')
fc*   = Flat Color icons   (import from 'react-icons/fc')
fi*   = Feather icons      (import from 'react-icons/fi')
gi*   = Game Icons         (import from 'react-icons/gi')
go*   = Github Octicons    (import from 'react-icons/go')
gr*   = Grommet            (import from 'react-icons/gr')
io*   = Ionicons           (import from 'react-icons/io')
im*   = icomoon            (import from 'react-icons/im')
md*   = Material Design    (import from 'react-icons/md')
pi*   = Phosphor           (import from 'react-icons/pi')
ri*   = Remix Icon         (import from 'react-icons/ri')
rx*   = Radix Icons        (import from 'react-icons/rx')
si*   = Simple Icons       (import from 'react-icons/si')
tb*   = Tabler Icons       (import from 'react-icons/tb')
ti*   = Typicons           (import from 'react-icons/ti')
vsc*  = VS Code Icons      (import from 'react-icons/vsc')
```

## Migration Checklist

- [ ] HotelListingPage.jsx - Replace hardcoded SVG icon object
- [ ] HomePage.jsx - Replace any SVG icons
- [ ] SearchResultsPage.jsx - Replace SVG icons
- [ ] BookingPage.jsx - Replace SVG icons
- [ ] AdminDashboard.jsx - Update Font Awesome references
- [ ] AdminFlights.jsx - Update icon usage
- [ ] AdminHotels.jsx - Update icon usage
- [ ] Components - Update all component icon usage
- [ ] Test all pages in browser - Verify icons display correctly
- [ ] Check responsive behavior - Icons should scale properly

## Testing
1. Open browser and navigate through the app
2. Check that all icons display correctly
3. Verify colors match the DaisyUI theme
4. Test on mobile/tablet for responsive sizing
5. Hover/interaction states should work properly

## Browser Inspector
View icon names and available options:
- Visit https://react-icons.github.io/react-icons/ for icon browser
- Font Awesome: https://fontawesome.com/icons
- Iconoir: https://iconoir.com/
- HugeIcons: https://hugeicons.com/icons/stroke-rounded
