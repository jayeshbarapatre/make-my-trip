# 🎨 DaisyUI Theme Switcher - Quick Reference Card

## 🚀 Start Theme Switching

```bash
npm run dev
# → http://localhost:5173
# → Click 🎨 button in top-right
# → Select a theme
# → Done!
```

---

## 📌 Key Files

```
src/hooks/useTheme.js           ← Theme logic
src/components/ThemeSwitcher.jsx ← UI component
tailwind.config.js              ← 32 themes enabled
DAISYUI_THEME_GUIDE.md          ← Full guide
```

---

## 💻 Use in Components

```jsx
import { useTheme } from '../hooks/useTheme'

function MyComponent() {
  const { theme, setTheme, themes } = useTheme()
  
  return (
    <div className="bg-base-100 text-base-content">
      Current: {theme}
      <button onClick={() => setTheme('dark')}>
        Dark Mode
      </button>
    </div>
  )
}
```

---

## 🎨 DaisyUI Classes (DO USE)

```jsx
// Backgrounds
className="bg-base-100"
className="bg-primary"

// Text
className="text-base-content"
className="text-primary"

// Components
className="btn btn-primary"
className="card bg-base-100"
className="input input-bordered"
```

---

## ❌ Don't Use (Hardcoded Colors)

```jsx
// ❌ WRONG
className="bg-blue-500"
className="text-red-400"
style={{ color: '#ffffff' }}

// ✅ RIGHT
className="bg-primary"
className="text-error"
className="text-base-content"
```

---

## 🎯 Available Themes

```
light, dark, cupcake, bumblebee, emerald, corporate,
synthwave, retro, cyberpunk, valentine, halloween,
garden, forest, aqua, lofi, pastel, fantasy,
wireframe, black, luxury, dracula, cmyk, autumn,
business, acid, lemonade, night, coffee, winter,
dim, nord, sunset
```

---

## 🔧 How It Works

```
User selects theme
    ↓
setTheme(name)
    ↓
document.documentElement.setAttribute('data-theme', name)
    ↓
<html data-theme="dark">
    ↓
DaisyUI CSS variables update
    ↓
ALL colors change instantly
    ↓
localStorage.setItem('daisyui-theme', name)
    ↓
Theme persists on reload
```

---

## 🧪 Test Checklist

- [ ] Page loads without errors
- [ ] 🎨 button appears
- [ ] Click 🎨 → dropdown opens
- [ ] Select theme → colors change instantly
- [ ] Reload page → theme persists
- [ ] No console errors

---

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Theme not changing | Check component uses DaisyUI classes |
| Theme resets | Check localStorage is enabled |
| 🎨 button missing | Check ThemeSwitcher is imported in App.jsx |
| Colors don't change | Replace hardcoded colors with DaisyUI classes |

---

## 📚 Component Examples

### Button
```jsx
<button className="btn btn-primary">Click me</button>
```

### Card
```jsx
<div className="card bg-base-100 shadow">
  <div className="card-body">Content</div>
</div>
```

### Input
```jsx
<input className="input input-bordered" />
```

### Alert
```jsx
<div className="alert alert-info">Message</div>
```

---

## 🎓 Learning Resources

| Resource | Purpose |
|----------|---------|
| `README_THEME_SWITCHER.md` | Overview |
| `THEME_SWITCHER_CHECKLIST.md` | Testing & troubleshooting |
| `DAISYUI_THEME_GUIDE.md` | Deep dive |
| `DAISYUI_CODE_EXAMPLES.md` | Copy-paste examples |

---

## 🔑 localStorage

```javascript
// Get saved theme
localStorage.getItem('daisyui-theme')

// Save theme
localStorage.setItem('daisyui-theme', 'dark')

// Clear theme (resets to default)
localStorage.removeItem('daisyui-theme')
```

---

## ⚡ Quick Implementation

### 1. In App.jsx
```jsx
import ThemeSwitcher from './components/ThemeSwitcher'

function AppContent() {
  return <ThemeSwitcher />
}
```

### 2. In Components
```jsx
<div className="bg-base-100 text-base-content">
  Use DaisyUI classes everywhere
</div>
```

### 3. Enjoy!
That's it! Theme switching now works globally.

---

## 🎨 Available UI Variants

```jsx
// 1. Dropdown (current)
<ThemeSwitcherDropdown />

// 2. Buttons
<ThemeSwitcherButtons />

// 3. Select
<ThemeSwitcherSelect />

// 4. Radio
<ThemeSwitcherRadios />

// 5. Grid
<ThemeSwitcherGrid />

// 6. Chips
<ThemeSwitcherChips />

// 7. FAB
<ThemeSwitcherFAB />
```

All in `ThemeSwitcherVariants.jsx`

---

## ✨ Perfect! You Have

✅ 32 beautiful themes  
✅ Instant switching  
✅ localStorage persistence  
✅ Production-ready code  
✅ Full documentation  
✅ Copy-paste examples  

**Now go build! 🚀**

---

**Print this card & keep it handy!** 📌
