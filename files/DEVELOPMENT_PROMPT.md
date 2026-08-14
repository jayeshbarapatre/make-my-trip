# TripOra Clone - Complete Development Prompt & Setup Guide

## 🚀 PART 1: FRONTEND SETUP PROMPT (React 18 + Vite)

### Quick Start Command
```bash
# Create new Vite React project
npm create vite@latest makemytrip-frontend -- --template react
cd makemytrip-frontend

# Install dependencies
npm install

# Install required packages
npm install react-router-dom redux @reduxjs/toolkit react-redux axios react-query
npm install framer-motion day.js lodash react-hook-form formik
npm install sass postcss autoprefixer
npm install --save-dev tailwindcss

# Install testing & dev tools
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm install --save-dev eslint prettier eslint-config-prettier

# Start development server
npm run dev
```

---

## 📋 DETAILED SETUP INSTRUCTIONS

### Step 1: Project Initialization

```bash
# Create project with specific Vite template
npm create vite@latest makemytrip-frontend -- --template react

# Navigate to project
cd makemytrip-frontend

# Install core dependencies
npm install
```

### Step 2: Install Essential Packages

#### State Management & Data Fetching
```bash
npm install redux @reduxjs/toolkit react-redux
npm install react-query @tanstack/react-query
npm install reselect
```

#### Routing & Navigation
```bash
npm install react-router-dom
npm install react-router-hash-link
```

#### HTTP & API
```bash
npm install axios
npm install dotenv
```

#### Forms & Validation
```bash
npm install react-hook-form formik yup
npm install @hookform/resolvers
```

#### Date & Time
```bash
npm install dayjs
npm install react-day-picker
```

#### Utilities
```bash
npm install lodash
npm install classnames
npm install uuid
```

#### Animation & Motion
```bash
npm install framer-motion
npm install react-spring
```

#### UI Components (Optional)
```bash
npm install @radix-ui/react-dialog
npm install @radix-ui/react-dropdown-menu
npm install @radix-ui/react-tabs
```

#### Styling
```bash
npm install sass
npm install tailwindcss postcss autoprefixer
npm install styled-components
```

#### Payment (Client-Side)
```bash
npm install razorpay
npm install @stripe/react-stripe-js @stripe/js
```

#### Analytics
```bash
npm install react-ga4
npm install @segment/analytics-next
```

### Step 3: Development Tools Setup

```bash
# Install dev dependencies
npm install --save-dev vite @vitejs/plugin-react
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npm install --save-dev eslint prettier
npm install --save-dev eslint-config-prettier eslint-plugin-react
npm install --save-dev autoprefixer postcss

# Optional: Bundle analyzer
npm install --save-dev vite-plugin-visualizer

# Optional: Environment variables
npm install --save-dev dotenv-cli
```

### Step 4: Configure Vite (vite.config.js)

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'vite-plugin-visualizer'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@store': path.resolve(__dirname, './src/store'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
    }
  },

  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },

  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux': ['redux', '@reduxjs/toolkit', 'react-redux'],
          'api': ['axios', 'react-query']
        }
      }
    }
  }
})
```

### Step 5: Configure ESLint & Prettier

#### .eslintrc.json
```json
{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "prettier"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["react"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "no-unused-vars": "warn"
  }
}
```

#### .prettierrc
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Step 6: Configure Tailwind CSS (Optional)

```bash
# Generate config files
npx tailwindcss init -p
```

#### tailwind.config.js
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#1F6DB8',
        secondary: '#003580',
        success: '#4CAF50',
        error: '#F44336',
        warning: '#FF9800',
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
```

#### postcss.config.js
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Step 7: Environment Variables Setup

#### .env.example
```bash
VITE_API_URL=http://localhost:5000/api
VITE_API_TIMEOUT=10000
VITE_APP_NAME=TripOra Clone
VITE_APP_VERSION=1.0.0

# Auth
VITE_JWT_STORAGE_KEY=authToken
VITE_REFRESH_TOKEN_KEY=refreshToken

# Payment
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key

# Analytics
VITE_GA_MEASUREMENT_ID=your_ga_id
VITE_SENTRY_DSN=your_sentry_dsn

# Feature Flags
VITE_ENABLE_DARK_MODE=true
VITE_ENABLE_ANALYTICS=true
```

#### Create .env.local (copy from .env.example)
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### Step 8: Updated package.json Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext js,jsx",
    "lint:fix": "eslint src --ext js,jsx --fix",
    "format": "prettier --write \"src/**/*.{js,jsx,json,css,scss}\"",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "analyze": "vite-plugin-visualizer",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🏗️ PART 2: PROJECT STRUCTURE SETUP

### Complete Directory Structure with Commands

```bash
# Create directory structure
mkdir -p src/{pages,components/{Common,Atoms,Molecules,Organisms,Modal},hooks,services,store/{reducers,actions,selectors},context,utils,styles/{variables,mixins,components},assets/{images,fonts,icons},config,tests/{components,pages,services,utils}}

# Create all necessary files
touch src/index.jsx
touch src/App.jsx
touch src/main.jsx
touch src/config/api.config.js
touch src/config/auth.config.js
touch src/config/features.config.js
```

### Scaffolding Commands (Create Key Files)

```bash
# Create API configuration
cat > src/config/api.config.js << 'EOF'
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL,
  timeout: import.meta.env.VITE_API_TIMEOUT,
  endpoints: {
    flights: '/v1/flights',
    hotels: '/v1/hotels',
    bookings: '/v1/bookings',
    users: '/v1/users',
    auth: '/v1/auth',
    payments: '/v1/payments',
  }
};
EOF

# Create Redux store
mkdir -p src/store/reducers src/store/actions src/store/selectors
```

---

## 🎯 PART 3: INITIAL SETUP FILES

### src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import App from './App'
import store from './store'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      cacheTime: 1000 * 60 * 10,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
)
```

### src/App.jsx
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import Header from '@components/Common/Header'
import Footer from '@components/Common/Footer'
import LoadingSpinner from '@components/Atoms/LoadingSpinner'

// Lazy load pages
const HomePage = lazy(() => import('@pages/HomePage'))
const SearchResultsPage = lazy(() => import('@pages/SearchResultsPage'))
const BookingPage = lazy(() => import('@pages/BookingPage'))
const ConfirmationPage = lazy(() => import('@pages/ConfirmationPage'))
const ProfilePage = lazy(() => import('@pages/UserProfilePage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Header />
        <Suspense fallback={<LoadingSpinner />}>
          <main className="app-main">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/booking/:flightId" element={<BookingPage />} />
              <Route path="/confirmation/:bookingId" element={<ConfirmationPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </Suspense>
        <Footer />
      </div>
    </BrowserRouter>
  )
}

export default App
```

### src/services/api.js
```javascript
import axios from 'axios'
import { API_CONFIG } from '@config/api.config'
import store from '@store'
import { logout } from '@store/actions/authActions'

const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      store.dispatch(logout())
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### src/store/index.js
```javascript
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './reducers/authReducer'
import searchReducer from './reducers/searchReducer'
import bookingReducer from './reducers/bookingReducer'
import uiReducer from './reducers/uiReducer'

const store = configureStore({
  reducer: {
    auth: authReducer,
    search: searchReducer,
    booking: bookingReducer,
    ui: uiReducer,
  },
})

export default store
```

### src/styles/global.scss
```scss
@import './variables/colors';
@import './variables/typography';
@import './variables/spacing';
@import './mixins/responsive';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: $body-font;
  background-color: $bg-primary;
  color: $text-primary;
  line-height: 1.6;
}

// Global classes
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  
  @include tablet {
    padding: 0 16px;
  }
  
  @include mobile {
    padding: 0 12px;
  }
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-main {
  flex: 1;
  padding: 24px 0;
}
```

---

## 📦 COMPLETE INSTALLATION COMMAND (Copy & Paste)

```bash
# 1. Create project
npm create vite@latest makemytrip-frontend -- --template react
cd makemytrip-frontend

# 2. Install all dependencies in one command
npm install react-router-dom redux @reduxjs/toolkit react-redux axios @tanstack/react-query react-hook-form formik yup dayjs lodash classnames uuid framer-motion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs sass styled-components razorpay @stripe/react-stripe-js @stripe/js react-ga4 @segment/analytics-next --legacy-peer-deps

# 3. Install dev dependencies
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom eslint prettier eslint-config-prettier eslint-plugin-react autoprefixer postcss vite-plugin-visualizer dotenv-cli tailwindcss

# 4. Initialize Tailwind (optional)
npx tailwindcss init -p

# 5. Start development
npm run dev
```

---

# 🛠️ PART 4: BACKEND RECOMMENDATIONS & TECHNOLOGY CHOICES

## Backend Framework Options Comparison

### Option 1: Node.js + Express (Recommended for First-Time)
**Best For**: Rapid development, JavaScript across full stack, most online tutorials

```bash
npm init -y
npm install express dotenv cors uuid axios redis
npm install --save-dev nodemon
```

**Pros:**
✅ Full-stack JavaScript (same language as frontend)  
✅ Fastest to develop  
✅ Large ecosystem & libraries  
✅ Easy to learn if you know JavaScript  
✅ Excellent for MVP/prototypes  
✅ Good async/await support for APIs  

**Cons:**
❌ Not ideal for CPU-intensive tasks  
❌ Less structured than frameworks  
❌ Requires discipline for project structure  

**Best Use Case**: Startups, MVPs, API-focused projects

---

### Option 2: Node.js + Nest.js (Recommended for Production)
**Best For**: Large projects, scalability, enterprise-grade applications

```bash
npm i -g @nestjs/cli
nest new makemytrip-backend
```

**Pros:**
✅ Enterprise-grade architecture  
✅ Built-in TypeScript support  
✅ Dependency injection (DI)  
✅ Modular structure by default  
✅ Great for microservices  
✅ Strong validation & serialization  
✅ Excellent testing support  

**Cons:**
❌ Steeper learning curve  
❌ More boilerplate code  
❌ Slower to prototype vs Express  

**Best Use Case**: Medium-large projects, microservices, scalable systems

---

### Option 3: Python + FastAPI (Recommended for ML/Data)
**Best For**: If you need ML, data processing, async excellence

```bash
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv
```

**Pros:**
✅ Excellent async performance  
✅ Built-in API documentation (Swagger)  
✅ Great for AI/ML integration  
✅ Very Pythonic, readable code  
✅ Strong validation (Pydantic)  
✅ Fast development  

**Cons:**
❌ Different language from frontend  
❌ Smaller ecosystem than Node  
❌ Fewer developers know Python  

**Best Use Case**: AI-powered features, data-heavy applications, academic/research projects

---

### Option 4: Python + Django (For Robustness)
**Best For**: Large, feature-rich applications with built-in admin panel

```bash
pip install django djangorestframework django-cors-headers python-dotenv
django-admin startproject makemytrip
```

**Pros:**
✅ "Batteries included" framework  
✅ Built-in admin panel  
✅ ORM is excellent (Django ORM)  
✅ Great for rapid development  
✅ Excellent security by default  
✅ Large mature ecosystem  

**Cons:**
❌ Heavyweight (can be overkill for APIs)  
❌ Slightly slower than FastAPI  
❌ Monolithic structure  

**Best Use Case**: Traditional web apps, complex systems with admin panels

---

### Option 5: Go + Gin (For Performance)
**Best For**: High-performance APIs, microservices, deployment simplicity

```bash
go mod init makemytrip-backend
go get -u github.com/gin-gonic/gin
```

**Pros:**
✅ Ultra-fast performance  
✅ Built-in concurrency (goroutines)  
✅ Single binary deployment  
✅ Excellent for microservices  
✅ Memory efficient  
✅ Great for high-traffic systems  

**Cons:**
❌ Steeper learning curve  
❌ Smaller ecosystem than Node/Python  
❌ Not ideal for rapid prototyping  

**Best Use Case**: High-performance APIs, microservices, cloud-native apps

---

## 🎯 RECOMMENDED TECH STACKS FOR MAKEMYTRIP CLONE

### **BEST RECOMMENDATION: Node.js + Express (MERN Stack)**

#### Why?
- ✅ Same JavaScript ecosystem (React + Node)
- ✅ Fastest to develop
- ✅ Good for real-time features (WebSockets)
- ✅ Excellent for MVPs
- ✅ Large community support

#### Tech Stack:
```
Frontend: React 18 + Vite
Backend: Node.js + Express.js
Database: MongoDB + MongoDB Atlas
Cache: Redis
Auth: JWT + bcrypt
Payment: Razorpay SDK
```

---

### **SECOND RECOMMENDATION: Node.js + Nest.js (Production-Ready)**

#### Why?
- ✅ Enterprise-grade structure
- ✅ Scalable architecture
- ✅ Full TypeScript support
- ✅ Built-in testing framework
- ✅ Perfect for large teams

#### Tech Stack:
```
Frontend: React 18 + Vite + TypeScript
Backend: Node.js + Nest.js + TypeScript
Database: PostgreSQL (relational) + Redis
Auth: JWT + bcrypt
Payment: Razorpay SDK
Message Queue: Bull/RabbitMQ
```

---

### **THIRD RECOMMENDATION: Python + FastAPI (AI-Ready)**

#### Why?
- ✅ Excellent async performance
- ✅ Great for ML integration (future)
- ✅ Built-in API docs
- ✅ Strong validation
- ✅ Modern Python framework

#### Tech Stack:
```
Frontend: React 18 + Vite
Backend: Python + FastAPI
Database: PostgreSQL + Redis
Auth: JWT + passlib
Payment: Razorpay Python SDK
ML: scikit-learn / TensorFlow (for recommendations)
```

---

## 📋 DETAILED BACKEND SETUP (Node.js + Express)

### Initial Backend Setup

```bash
# Create backend directory
mkdir makemytrip-backend
cd makemytrip-backend

# Initialize Node project
npm init -y

# Install core dependencies
npm install express dotenv cors uuid axios redis

# Install database
npm install mongoose

# Install auth
npm install jsonwebtoken bcryptjs

# Install validation
npm install joi express-validator

# Install utilities
npm install lodash helmet rate-limiter-flexible

# Install dev dependencies
npm install --save-dev nodemon eslint prettier

# Create folder structure
mkdir -p src/{routes,controllers,models,middleware,services,utils,config}
```

### Backend package.json Template

```json
{
  "name": "makemytrip-backend",
  "version": "1.0.0",
  "description": "TripOra Clone Backend",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "lint": "eslint src"
  },
  "dependencies": {
    "express": "^4.18.2",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5",
    "mongoose": "^7.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "joi": "^17.9.1",
    "express-validator": "^7.0.0",
    "axios": "^1.4.0",
    "redis": "^4.6.6",
    "uuid": "^9.0.0",
    "lodash": "^4.17.21",
    "helmet": "^7.0.0",
    "rate-limiter-flexible": "^2.4.1"
  },
  "devDependencies": {
    "nodemon": "^2.0.20",
    "eslint": "^8.40.0",
    "prettier": "^2.8.8"
  }
}
```

### Backend src/index.js (Express Server)

```javascript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const app = express()

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB error:', err))

// Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/flights', flightRoutes)
app.use('/api/v1/hotels', hotelRoutes)
app.use('/api/v1/bookings', bookingRoutes)
app.use('/api/v1/users', userRoutes)

// Error handling
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: err.message })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
```

### Backend .env Template

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/makemytrip

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=24h

# Redis
REDIS_URL=redis://localhost:6379

# Payment
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# External APIs
GDS_API_KEY=amadeus_api_key
STRIPE_SECRET_KEY=stripe_secret_key

# CORS
CORS_ORIGIN=http://localhost:3000
```

---

## 🚀 FINAL RECOMMENDATION SUMMARY

| Framework | Best For | Difficulty | Speed | Scalability |
|-----------|----------|-----------|-------|-------------|
| **Express.js** | MVP, Startups | Easy | Very Fast | Medium |
| **Nest.js** | Enterprise, Teams | Medium | Fast | Excellent |
| **FastAPI** | AI Features, Data | Easy | Very Fast | Good |
| **Django** | Complex Systems | Medium | Medium | Good |
| **Go + Gin** | High Performance | Hard | Ultra Fast | Excellent |

### **🎯 I RECOMMEND FOR YOUR MAKEMYTRIP PROJECT:**

```
FRONTEND: React 18 + Vite ✅
BACKEND: Node.js + Express.js (Simple) or Nest.js (Production)
DATABASE: MongoDB (simple) or PostgreSQL (production)
CACHE: Redis
AUTH: JWT + bcrypt
PAYMENT: Razorpay
```

### Why?
1. **JavaScript Full-Stack**: Same language everywhere
2. **Fast Development**: Perfect for learning
3. **Scalable**: Can grow to production
4. **Excellent Community**: Tons of tutorials
5. **Free Tools**: MongoDB Atlas, Redis Cloud free tier

---

## Next Steps

1. **Frontend**: Run `npm create vite@latest` + follow part 1 instructions
2. **Backend**: Run `npm init` + follow Express/Nest.js setup
3. **Database**: Create MongoDB Atlas free account
4. **Connect**: Update API URLs in frontend `.env`
5. **Deploy**: Use Vercel (frontend) + Render/Railway (backend)

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Difficulty Level**: Beginner to Intermediate
