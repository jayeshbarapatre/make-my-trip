# DaisyUI Code Examples - Copy & Paste Ready

## 🎯 Common Components

### 1. Navbar with Theme Switcher
```jsx
import ThemeSwitcher from './components/ThemeSwitcher'

export default function Navbar() {
  return (
    <div className="navbar bg-base-100 sticky top-0 z-40 shadow">
      <div className="flex-1">
        <a className="text-xl font-bold text-primary">MakeMyTrip</a>
      </div>
      <div className="flex-none gap-2">
        {/* Your nav links here */}
        <a href="/flights" className="btn btn-ghost btn-sm">Flights</a>
        <a href="/hotels" className="btn btn-ghost btn-sm">Hotels</a>
        {/* Theme Switcher */}
        <ThemeSwitcher />
      </div>
    </div>
  )
}
```

---

### 2. Hero Section
```jsx
export default function Hero() {
  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <h1 className="text-5xl font-bold text-base-content">Hello There</h1>
          <p className="py-6 text-base-content/80">
            Welcome to our amazing travel platform
          </p>
          <button className="btn btn-primary">Get Started</button>
        </div>
      </div>
    </div>
  )
}
```

---

### 3. Card Component
```jsx
export default function HotelCard({ hotel }) {
  return (
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition">
      <figure>
        <img src={hotel.image} alt={hotel.name} className="w-full h-48 object-cover" />
      </figure>
      <div className="card-body">
        <h2 className="card-title text-base-content">{hotel.name}</h2>
        <p className="text-base-content/70">{hotel.description}</p>
        <div className="card-actions justify-end">
          <button className="btn btn-primary btn-sm">Book Now</button>
        </div>
      </div>
    </div>
  )
}
```

---

### 4. Button Variants
```jsx
export default function ButtonShowcase() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {/* Primary Button */}
      <button className="btn btn-primary">Primary</button>

      {/* Secondary Button */}
      <button className="btn btn-secondary">Secondary</button>

      {/* Ghost Button */}
      <button className="btn btn-ghost">Ghost</button>

      {/* Link Button */}
      <button className="btn btn-link">Link</button>

      {/* Outlined Button */}
      <button className="btn btn-outline">Outline</button>

      {/* Error Button */}
      <button className="btn btn-error">Error</button>

      {/* Success Button */}
      <button className="btn btn-success">Success</button>

      {/* Warning Button */}
      <button className="btn btn-warning">Warning</button>

      {/* Info Button */}
      <button className="btn btn-info">Info</button>

      {/* Loading Button */}
      <button className="btn btn-primary loading">Loading</button>

      {/* Disabled Button */}
      <button className="btn" disabled>Disabled</button>

      {/* Small Button */}
      <button className="btn btn-sm">Small</button>

      {/* Large Button */}
      <button className="btn btn-lg">Large</button>
    </div>
  )
}
```

---

### 5. Form Component
```jsx
import { useState } from 'react'

export default function SearchForm() {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const handleSearch = () => {
    console.log('Search:', { from, to })
  }

  return (
    <div className="form-control w-full max-w-md mx-auto gap-4">
      <div>
        <label className="label">
          <span className="label-text font-bold">From</span>
        </label>
        <input
          type="text"
          placeholder="Departure city"
          className="input input-bordered w-full"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
      </div>

      <div>
        <label className="label">
          <span className="label-text font-bold">To</span>
        </label>
        <input
          type="text"
          placeholder="Destination city"
          className="input input-bordered w-full"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <button
        className="btn btn-primary btn-block mt-4"
        onClick={handleSearch}
      >
        Search
      </button>
    </div>
  )
}
```

---

### 6. Alert Component
```jsx
export default function AlertShowcase() {
  return (
    <div className="space-y-4 p-4">
      {/* Info Alert */}
      <div className="alert alert-info">
        <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>You have a new message. Tap to read.</span>
      </div>

      {/* Success Alert */}
      <div className="alert alert-success">
        <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Your booking is confirmed!</span>
      </div>

      {/* Warning Alert */}
      <div className="alert alert-warning">
        <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4v2m0 4v2m0-4a2 2 0 00-4 0m4 0a2 2 0 014 0m-4 0V9m4 4V9m0 4a2 2 0 00-4 0" />
        </svg>
        <span>Only 2 seats left at this price!</span>
      </div>

      {/* Error Alert */}
      <div className="alert alert-error">
        <svg className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2" />
        </svg>
        <span>Payment failed. Please try again.</span>
      </div>
    </div>
  )
}
```

---

### 7. Badge Component
```jsx
export default function BadgeShowcase() {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      <span className="badge">Default</span>
      <span className="badge badge-primary">Primary</span>
      <span className="badge badge-secondary">Secondary</span>
      <span className="badge badge-accent">Accent</span>
      <span className="badge badge-ghost">Ghost</span>
      <span className="badge badge-success">Success</span>
      <span className="badge badge-warning">Warning</span>
      <span className="badge badge-error">Error</span>
      <span className="badge badge-info">Info</span>
      <span className="badge badge-outline">Outline</span>
    </div>
  )
}
```

---

### 8. Modal Dialog
```jsx
import { useRef } from 'react'

export default function ModalExample() {
  const modalRef = useRef(null)

  const openModal = () => modalRef.current?.showModal()
  const closeModal = () => modalRef.current?.close()

  return (
    <>
      <button className="btn btn-primary" onClick={openModal}>
        Open Modal
      </button>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Modal Title</h3>
          <p className="py-4">This is a simple modal dialog.</p>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={closeModal}>Close</button>
            <button className="btn btn-primary" onClick={closeModal}>Save</button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  )
}
```

---

### 9. Dropdown Menu
```jsx
export default function DropdownExample() {
  return (
    <div className="dropdown">
      <button tabIndex={0} className="btn">
        Click me
      </button>
      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
        <li><a>Item 1</a></li>
        <li><a>Item 2</a></li>
        <li><a>Item 3</a></li>
      </ul>
    </div>
  )
}
```

---

### 10. Loading State
```jsx
import { useState } from 'react'

export default function LoadingExample() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(r => setTimeout(r, 2000))
    setIsLoading(false)
  }

  return (
    <button
      className={`btn ${isLoading ? 'btn-disabled loading' : 'btn-primary'}`}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Click to Load'}
    </button>
  )
}
```

---

## 🎨 Color Reference

### Semantic Colors
```jsx
// Primary - Main brand color
className="bg-primary"
className="text-primary"
className="btn-primary"

// Secondary - Supporting color
className="bg-secondary"
className="text-secondary"
className="btn-secondary"

// Accent - Highlight color
className="bg-accent"
className="text-accent"

// Success - Green (positive action)
className="bg-success"
className="text-success"
className="btn-success"

// Warning - Orange (caution)
className="bg-warning"
className="text-warning"
className="btn-warning"

// Error - Red (negative action)
className="bg-error"
className="text-error"
className="btn-error"

// Info - Blue (informational)
className="bg-info"
className="text-info"
className="btn-info"
```

### Base Colors
```jsx
// Background colors
className="bg-base-100"    // Main background
className="bg-base-200"    // Secondary background
className="bg-base-300"    // Tertiary background

// Text colors
className="text-base-content"      // Main text
className="text-base-content/80"   // Secondary text
className="text-base-content/60"   // Tertiary text
className="text-base-content/40"   // Faint text
```

---

## 🎯 Usage Tips

### Mix and Match
```jsx
<button className="btn btn-outline btn-error">
  Delete Item
</button>

<div className="card bg-base-100 shadow-xl border border-primary">
  <div className="card-body">...</div>
</div>

<input className="input input-bordered input-primary w-full" />
```

### Responsive Sizes
```jsx
<button className="btn btn-sm md:btn-md lg:btn-lg">
  Responsive Button
</button>

<div className="text-sm md:text-base lg:text-lg">
  Responsive Text
</div>
```

### Full Width
```jsx
<button className="btn btn-block">Full Width Button</button>
<input className="input input-bordered w-full" />
```

---

## ❌ What NOT to Do

```jsx
// ❌ WRONG - Hardcoded colors
<button className="bg-blue-500 text-white">
  Don't use this
</button>

// ✅ CORRECT - DaisyUI classes
<button className="btn btn-primary">
  Use this instead
</button>

// ❌ WRONG - Inline styles
<div style={{ backgroundColor: '#ffffff', color: '#000000' }}>
  Won't change with theme
</div>

// ✅ CORRECT - Class names
<div className="bg-base-100 text-base-content">
  Changes with theme
</div>

// ❌ WRONG - Mix of Tailwind and DaisyUI
<button className="btn btn-primary bg-blue-500">
  Don't mix them
</button>

// ✅ CORRECT - DaisyUI only
<button className="btn btn-primary">
  Pure DaisyUI
</button>
```

---

## 🚀 Performance Tips

1. **Use semantic colors** - They're optimized by DaisyUI
2. **Avoid inline styles** - Use class names instead
3. **Don't override DaisyUI** - Use it as-is
4. **Keep components small** - Easier to style consistently

---

## 📚 More Resources

- **DaisyUI Components:** https://daisyui.com/components/
- **Theme Colors:** https://daisyui.com/docs/colors/
- **Tailwind Docs:** https://tailwindcss.com/docs
- **Custom Themes:** https://daisyui.com/docs/customize/

---

Happy coding! 🎉
