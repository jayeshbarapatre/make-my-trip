# DaisyUI Migration Guide

## 📋 Overview
This document guides you through migrating the MakeMyTrip UI from custom CSS to **DaisyUI with Tailwind CSS**. The migration uses the **"business"** theme, which is professional and matches your design system.

---

## ✅ Installation Complete

- ✅ Tailwind CSS installed
- ✅ DaisyUI installed
- ✅ PostCSS configured
- ✅ Tailwind config with "business" theme
- ✅ index.html set to `data-theme="business"`
- ✅ index.css updated with Tailwind directives

---

## 🎨 DaisyUI "Business" Theme

The **business** theme provides:
- **Primary**: Dark blue (#1f2937 buttons, links)
- **Secondary**: Gray tones
- **Neutral**: Professional grays
- **Base colors**: Clean whites and light grays
- **Semantic colors**: Success (green), Warning (orange), Error (red), Info (blue)

### Theme Colors Mapping
```
business theme colors:
- primary:   #1f2937 (dark gray-blue)
- secondary: #9ca3af (gray)
- accent:    #3b82f6 (blue)
- neutral:   #f3f4f6 (light gray)
- base-100:  #ffffff (white)
- base-200:  #f9fafb (light gray)
- base-300:  #f3f4f6 (lighter gray)
```

---

## 📚 DaisyUI Component Classes

### Buttons
```jsx
// Before (custom CSS)
<button className="hp-search-btn btn-primary">Search</button>

// After (DaisyUI)
<button className="btn btn-primary">Search</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-outline">Outline</button>
<button className="btn btn-sm">Small</button>
<button className="btn btn-lg">Large</button>
<button className="btn btn-wide">Wide</button>
```

### Inputs & Forms
```jsx
// Before
<input type="text" placeholder="Search..." />

// After
<input type="text" placeholder="Search..." className="input input-bordered w-full" />
<input type="text" className="input input-bordered input-primary" />
<input type="text" className="input input-sm" />
<input type="text" className="input input-lg" />
```

### Cards
```jsx
// Before
<div className="hp-offer-card">
  <div className="hp-offer-body">Content</div>
</div>

// After
<div className="card bg-base-100 shadow-md border border-base-300">
  <div className="card-body">
    <h2 className="card-title">Title</h2>
    <p>Content</p>
  </div>
</div>
```

### Navbar
```jsx
// Before
<header className="hp-nav">
  <nav className="hp-nav-inner">...</nav>
</header>

// After
<navbar className="navbar bg-base-100 shadow-md">
  <div className="navbar-start">Logo</div>
  <div className="navbar-center">Menu</div>
  <div className="navbar-end">Profile</div>
</navbar>
```

### Modals (Dropdowns, Overlays)
```jsx
// DaisyUI modal
<dialog id="my_modal" className="modal">
  <form method="dialog" className="modal-box">
    <h3>Modal Title</h3>
    <p>Modal content</p>
    <button className="btn">Close</button>
  </form>
</dialog>

// Open: document.getElementById("my_modal").showModal()
```

### Alerts
```jsx
<div className="alert alert-success">
  <span>Success message</span>
</div>

<div className="alert alert-error">
  <span>Error message</span>
</div>

<div className="alert alert-warning">
  <span>Warning message</span>
</div>
```

### Badges & Tags
```jsx
<div className="badge badge-primary">Primary</div>
<div className="badge badge-secondary">Secondary</div>
<div className="badge badge-outline">Outline</div>
<div className="badge badge-lg">Large</div>
```

### Loading Spinners
```jsx
<span className="loading loading-spinner"></span>
<span className="loading loading-spinner loading-sm"></span>
<span className="loading loading-spinner loading-lg"></span>
<span className="loading loading-ring loading-lg"></span>
```

---

## 🔄 Migration Strategy

### Phase 1: Setup (DONE ✅)
- Install packages
- Configure Tailwind & DaisyUI
- Update index.css & index.html
- Create this guide

### Phase 2: Layout Components (Pages, Header, Footer)
**Priority**: HIGH - These affect the entire layout
- App wrapper structure
- Header/Navbar
- Footer
- Hero section
- Page layouts

### Phase 3: Form Components
**Priority**: HIGH - Critical for user input
- Search form (HomePage)
- Login/Register forms
- Booking forms
- Filter forms

### Phase 4: Card Components
**Priority**: MEDIUM - Visual consistency
- Flight cards
- Hotel cards
- Offer cards
- Destination cards

### Phase 5: Interactive Components
**Priority**: MEDIUM - UX improvements
- Modals & Dropdowns
- Tabs
- Accordions
- Date pickers

### Phase 6: Utility Components
**Priority**: LOW - Final polish
- Badges
- Alerts
- Tooltips
- Loading states

---

## ⚙️ Spacing & Layout

### Tailwind Spacing Scale (use these!)
```
p-0, p-1, p-2, p-4, p-6, p-8, p-12, p-16
m-0, m-1, m-2, m-4, m-6, m-8, m-12, m-16
gap-1, gap-2, gap-4, gap-6, gap-8
```

### Your Design Token Mapping
```
--sp-xs (4px)   → p-1
--sp-s (8px)    → p-2
--sp-m (16px)   → p-4
--sp-l (24px)   → p-6
--sp-xl (32px)  → p-8
--sp-xxl (48px) → p-12
```

### Responsive Classes
```jsx
// Mobile-first (applies all screen sizes)
<div className="p-4">

// Tablet and up
<div className="md:p-6">

// Desktop and up
<div className="lg:p-8">

// Custom grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
```

---

## 🚨 Critical Rules for Safe Migration

### ❌ DO NOT
- **Don't mix custom CSS with Tailwind** - conflicts will happen
- **Don't use hardcoded colors** (#fff, #000, #1f6db8)
- **Don't use inline styles** - use Tailwind classes instead
- **Don't remove design-tokens.css yet** - reference it while converting

### ✅ DO
- **Use Tailwind color classes** - bg-base-100, text-base-content
- **Use Tailwind spacing** - p-4, m-2, gap-4
- **Use DaisyUI components** - btn, card, input, badge
- **Test on mobile** - responsive is critical
- **Convert component-by-component** - don't do everything at once

---

## 📝 Before & After Examples

### Example 1: Button Component

**Before (Custom CSS)**
```jsx
<button className="hp-offer-btn">Book Now</button>

// CSS
.hp-offer-btn {
  align-self: flex-start;
  background: #fff;
  border: 1.5px solid var(--hp-dark);
  color: var(--hp-dark);
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 800;
  transition: all .2s ease;
  cursor: pointer;
}
```

**After (DaisyUI)**
```jsx
<button className="btn btn-outline btn-sm">Book Now</button>
// OR
<button className="btn btn-secondary btn-sm">Book Now</button>
```

### Example 2: Card Component

**Before (Custom CSS)**
```jsx
<div className="hp-offer-card">
  <div className="hp-offer-img hp-offer-flight"></div>
  <div className="hp-offer-body">
    <h3>Offer Title</h3>
    <p>Description</p>
  </div>
</div>

// CSS
.hp-offer-card {
  flex: 0 0 340px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(10, 17, 40, 0.06);
  border: 1px solid rgba(226, 232, 240, 0.8);
  transition: all 0.4s;
  display: flex;
  flex-direction: column;
}
```

**After (DaisyUI)**
```jsx
<div className="card bg-base-100 shadow-lg border border-base-300 max-w-sm">
  <figure className="bg-gradient-to-r from-blue-400 to-blue-600 h-48"></figure>
  <div className="card-body">
    <h2 className="card-title text-lg">Offer Title</h2>
    <p className="text-sm text-base-content/70">Description</p>
    <div className="card-actions justify-start">
      <button className="btn btn-primary btn-sm">Book Now</button>
    </div>
  </div>
</div>
```

### Example 3: Form Input

**Before (Custom CSS)**
```jsx
<div className="hp-field">
  <small>From</small>
  <input placeholder="Enter city" />
</div>

// CSS - lots of custom styling
```

**After (DaisyUI)**
```jsx
<div className="form-control w-full">
  <label className="label">
    <span className="label-text">From</span>
  </label>
  <input 
    type="text" 
    placeholder="Enter city" 
    className="input input-bordered w-full" 
  />
</div>
```

---

## 🔧 Migration Checklist

### HomePage Component
- [ ] Hero section layout
- [ ] Search form inputs
- [ ] Trip type buttons
- [ ] Date pickers
- [ ] Traveller dropdown
- [ ] Offers carousel
- [ ] Categories grid
- [ ] Destinations section
- [ ] Footer

### Components to Convert
- [ ] Header/Navbar
- [ ] Footer
- [ ] Flight cards
- [ ] Hotel cards
- [ ] Forms
- [ ] Modals
- [ ] Loading states
- [ ] Alerts
- [ ] Auth pages
- [ ] Admin panel

---

## 🧪 Testing After Conversion

1. **Visual Test**: Compare before/after side-by-side
2. **Responsive Test**: Check mobile (< 640px), tablet (< 1024px), desktop
3. **Functionality Test**: All buttons, forms, navigation work
4. **Color Test**: All text is readable, proper contrast
5. **Performance Test**: No console errors, smooth animations

---

## 📞 Common Issues & Solutions

### Issue 1: Tailwind classes not working
**Solution**: Make sure postcss.config.js is in root, restart dev server
```bash
npm run dev
```

### Issue 2: Colors don't match theme
**Solution**: Use DaisyUI color variables, not hardcoded hex
```jsx
// ❌ Wrong
<div className="bg-[#ffffff]">

// ✅ Right
<div className="bg-base-100">
```

### Issue 3: Spacing is inconsistent
**Solution**: Use Tailwind spacing scale consistently
```jsx
// ❌ Wrong
<div style={{ padding: '20px' }}>

// ✅ Right
<div className="p-5">
```

### Issue 4: Custom CSS still applying
**Solution**: Remove old CSS files gradually, or use `!important` temporarily
```jsx
// Temporary override during migration
<div className="!bg-red-500">Force background</div>
```

---

## 🚀 Next Steps

1. **Run dev server**: `npm run dev`
2. **Check console**: No errors or warnings?
3. **Start with HomePage**: Convert one component at a time
4. **Test each change**: Visual + functional test
5. **Commit frequently**: Small, meaningful commits
6. **Remove old CSS**: After converting a component, remove its old CSS

---

## 📚 Resources

- **DaisyUI Docs**: https://daisyui.com/docs/
- **Tailwind Docs**: https://tailwindcss.com/docs/
- **DaisyUI Components**: https://daisyui.com/components/
- **Color Reference**: https://daisyui.com/docs/colors/

---

## ✨ You're Ready!

- Setup complete ✅
- Config complete ✅
- Global styles ready ✅
- Now start converting components! 🚀

---

**Remember**: Take it component-by-component. No need to rush. The migration is a marathon, not a sprint!
