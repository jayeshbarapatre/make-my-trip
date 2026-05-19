# DaisyUI Quick Reference

## 🎨 Colors (Business Theme)

| Use Case | Tailwind Class | Color |
|----------|----------------|-------|
| Primary Action | `text-primary` `bg-primary` | Dark Blue |
| Secondary Action | `text-secondary` `bg-secondary` | Gray |
| Success | `text-success` `bg-success` | Green |
| Error | `text-error` `bg-error` | Red |
| Warning | `text-warning` `bg-warning` | Orange |
| Info | `text-info` `bg-info` | Blue |
| Text (Default) | `text-base-content` | Dark Gray |
| Text (Muted) | `text-base-content/60` | Medium Gray |
| Background | `bg-base-100` | White |
| Background (Alt) | `bg-base-200` | Light Gray |

---

## 🔘 Buttons

```jsx
<button className="btn">Default</button>
<button className="btn btn-primary">Primary</button>
<button className="btn btn-secondary">Secondary</button>
<button className="btn btn-success">Success</button>
<button className="btn btn-error">Error</button>
<button className="btn btn-warning">Warning</button>
<button className="btn btn-info">Info</button>
<button className="btn btn-outline">Outline</button>
<button className="btn btn-ghost">Ghost</button>
<button className="btn btn-disabled" disabled>Disabled</button>
<button className="btn btn-sm">Small</button>
<button className="btn btn-lg">Large</button>
<button className="btn btn-wide">Wide</button>
<button className="btn btn-block">Full Width</button>
<button className="btn btn-circle">Circle</button>
<button className="btn btn-group">Group</button>
<button className="btn loading">Loading</button>
```

---

## ⌨️ Inputs & Forms

```jsx
// Text Input
<input type="text" placeholder="..." className="input input-bordered w-full" />
<input type="text" className="input input-bordered input-primary" />
<input type="text" className="input input-bordered input-lg" />
<input type="text" className="input input-bordered input-sm" />
<input type="text" className="input input-bordered" disabled />

// Form Control (Wrapper)
<div className="form-control w-full">
  <label className="label">
    <span className="label-text">Label</span>
  </label>
  <input type="text" className="input input-bordered w-full" />
  <label className="label">
    <span className="label-text-alt">Helper text</span>
  </label>
</div>

// Select
<select className="select select-bordered w-full">
  <option>Option 1</option>
</select>

// Checkbox
<input type="checkbox" className="checkbox" />
<input type="checkbox" className="checkbox checkbox-primary" />

// Radio
<input type="radio" name="radio" className="radio" />
<input type="radio" name="radio" className="radio radio-primary" />

// Textarea
<textarea className="textarea textarea-bordered"></textarea>
```

---

## 🎴 Cards

```jsx
<div className="card bg-base-100 shadow-md">
  <figure>Image</figure>
  <div className="card-body">
    <h2 className="card-title">Title</h2>
    <p>Content</p>
    <div className="card-actions justify-end">
      <button className="btn btn-primary">Action</button>
    </div>
  </div>
</div>

// Compact
<div className="card card-compact bg-base-100 shadow-md">
  ...
</div>

// Side by side
<div className="card card-side bg-base-100 shadow-md">
  <figure><img src="..." /></figure>
  <div className="card-body">...</div>
</div>
```

---

## 📊 Layout & Spacing

```jsx
// Padding
<div className="p-4">All sides</div>
<div className="px-4 py-2">Horizontal & Vertical</div>
<div className="pt-4 pb-2">Top & Bottom</div>

// Margin
<div className="m-4">All sides</div>
<div className="mx-4 my-2">Horizontal & Vertical</div>

// Gap (in Flexbox/Grid)
<div className="flex gap-4">Items</div>
<div className="grid grid-cols-2 gap-4">Items</div>

// Width/Height
<div className="w-full">Full width</div>
<div className="w-1/2">Half width</div>
<div className="w-screen">Screen width</div>
<div className="h-96">Fixed height</div>
<div className="h-full">Full height</div>
```

---

## 📱 Responsive Design

```jsx
// Breakpoints
<div className="text-sm md:text-base lg:text-lg">
  Small on mobile, medium on tablet, large on desktop
</div>

// Grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// Hide/Show
<div className="hidden md:block">Hidden on mobile</div>
<div className="md:hidden">Hidden on tablet+</div>
```

---

## 🗺️ Navbar

```jsx
<div className="navbar bg-base-100 shadow-md">
  <div className="navbar-start">
    <a className="btn btn-ghost normal-case text-xl">Logo</a>
  </div>
  <div className="navbar-center hidden lg:flex">
    <ul className="menu menu-horizontal px-1">
      <li><a>Link 1</a></li>
      <li><a>Link 2</a></li>
    </ul>
  </div>
  <div className="navbar-end">
    <button className="btn btn-primary">Login</button>
  </div>
</div>
```

---

## 🏷️ Badges

```jsx
<div className="badge">Default</div>
<div className="badge badge-primary">Primary</div>
<div className="badge badge-secondary">Secondary</div>
<div className="badge badge-success">Success</div>
<div className="badge badge-error">Error</div>
<div className="badge badge-warning">Warning</div>
<div className="badge badge-info">Info</div>
<div className="badge badge-outline">Outline</div>
<div className="badge badge-lg">Large</div>
```

---

## ⚠️ Alerts

```jsx
<div className="alert">
  <span>Generic alert</span>
</div>

<div className="alert alert-success">
  <span>Success!</span>
</div>

<div className="alert alert-error">
  <span>Error!</span>
</div>

<div className="alert alert-warning">
  <span>Warning!</span>
</div>

<div className="alert alert-info">
  <span>Info</span>
</div>
```

---

## ⏳ Loading

```jsx
<span className="loading loading-spinner"></span>
<span className="loading loading-ring"></span>
<span className="loading loading-dots"></span>
<span className="loading loading-bars"></span>
<span className="loading loading-spinner loading-sm"></span>
<span className="loading loading-spinner loading-md"></span>
<span className="loading loading-spinner loading-lg"></span>
```

---

## 📋 Tabs

```jsx
<div className="tabs">
  <input type="radio" name="my_tabs" className="tab" label="Tab 1" />
  <input type="radio" name="my_tabs" className="tab" label="Tab 2" />
  <div className="tab-content">Content 1</div>
  <div className="tab-content">Content 2</div>
</div>
```

---

## 🎪 Modal

```jsx
<dialog id="my_modal" className="modal">
  <form method="dialog" className="modal-box">
    <h3 className="font-bold text-lg">Modal Title</h3>
    <p className="py-4">Modal content</p>
    <div className="modal-action">
      <button className="btn">Close</button>
    </div>
  </form>
</dialog>

<button 
  onClick={() => document.getElementById("my_modal").showModal()}
  className="btn"
>
  Open Modal
</button>
```

---

## 🔗 Links & Text

```jsx
// Links
<a href="#" className="link link-primary">Primary Link</a>
<a href="#" className="link link-secondary">Secondary Link</a>
<a href="#" className="link link-hover">Hover Link</a>

// Text Variants
<p className="text-base-content">Default text</p>
<p className="text-base-content/75">75% opacity</p>
<p className="text-base-content/50">50% opacity</p>
<p className="font-bold">Bold</p>
<p className="font-semibold">Semibold</p>
<p className="italic">Italic</p>
<p className="underline">Underline</p>
<p className="line-through">Strikethrough</p>
```

---

## 📦 Common Patterns

### Hero Section
```jsx
<div className="hero min-h-screen bg-base-200">
  <div className="hero-content text-center">
    <div className="max-w-md">
      <h1 className="text-5xl font-bold">Hello</h1>
      <p className="py-6">Description</p>
      <button className="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>
```

### Grid of Cards
```jsx
<div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  <div className="card bg-base-100 shadow-md">
    ...
  </div>
</div>
```

### Form Section
```jsx
<div className="form-control gap-4">
  <input type="text" placeholder="Name" className="input input-bordered" />
  <input type="email" placeholder="Email" className="input input-bordered" />
  <button className="btn btn-primary">Submit</button>
</div>
```

---

## 🎓 Most Used Classes

```
bg-base-100       bg-base-200       bg-primary
text-base-content text-primary      text-secondary
btn               btn-primary       btn-secondary
input             input-bordered    input-primary
card              card-body         card-title
p-4               px-4              py-4
m-4               mx-4              my-4
gap-4             w-full            h-full
flex              grid              grid-cols-2
rounded           rounded-lg        rounded-full
shadow            shadow-lg         shadow-md
```

---

## 💡 Pro Tips

1. **Mobile-first**: Write classes without prefix (mobile), then add `md:`, `lg:` for larger screens
2. **Use semantic classes**: `btn-primary` instead of `bg-blue-500`
3. **Consistency**: Pick one spacing scale and stick to it
4. **Color**: Use theme colors (`text-primary`) not hardcoded colors
5. **Responsive**: Always test on mobile!

---

**Need help?** Check the full guide: `DAISYUI_MIGRATION.md`
