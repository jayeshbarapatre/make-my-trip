# MakeMyTrip Clone - Quick Reference & Step-by-Step Implementation

## 🔥 QUICK START (COPY & PASTE)

### ONE-LINE SETUP FOR FRONTEND

```bash
npm create vite@latest makemytrip-frontend -- --template react && cd makemytrip-frontend && npm install react-router-dom redux @reduxjs/toolkit react-redux axios @tanstack/react-query react-hook-form formik yup dayjs lodash classnames uuid framer-motion sass && npm install --save-dev vitest @testing-library/react eslint prettier && npm run dev
```

### ONE-LINE SETUP FOR BACKEND (Express)

```bash
mkdir makemytrip-backend && cd makemytrip-backend && npm init -y && npm install express dotenv cors uuid axios mongoose jsonwebtoken bcryptjs joi express-validator lodash helmet && npm install --save-dev nodemon eslint prettier && echo "PORT=5000\nNODE_ENV=development\nMONGODB_URI=mongodb://localhost:27017/makemytrip\nJWT_SECRET=your_secret_key" > .env && npm start
```

---

## 📊 BACKEND TECHNOLOGY COMPARISON MATRIX

### Quick Comparison Table

| Criteria | Express | Nest.js | FastAPI | Django | Go+Gin |
|----------|---------|---------|---------|--------|--------|
| **Learning Curve** | ⭐⭐ Easy | ⭐⭐⭐ Medium | ⭐⭐ Easy | ⭐⭐⭐ Medium | ⭐⭐⭐⭐ Hard |
| **Setup Time** | 5 min | 10 min | 5 min | 15 min | 20 min |
| **Performance** | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐ Great | ⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent |
| **Scalability** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐ Good | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐⭐ Excellent |
| **Dev Experience** | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐ Great | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Great | ⭐⭐⭐ Good |
| **API Documentation** | Manual | Auto-generated | Auto-generated | Manual | Manual |
| **Type Safety** | Optional | ✅ Built-in | ✅ Built-in | ✅ Built-in | ✅ Built-in |
| **Job Market** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Community Size** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Best For** | MVP | Production | AI/ML | Full-Stack | Microservices |

---

## 🎯 FRAMEWORK SELECTION GUIDE

### Choose Express.js If:
✅ It's your first backend project  
✅ You want rapid prototyping  
✅ Team knows JavaScript well  
✅ Building an MVP  
✅ Need quick time-to-market  

**Setup Time**: ~5 minutes  
**Learning Time**: 1-2 weeks  
**Production Ready**: After 2-3 months  

---

### Choose Nest.js If:
✅ Building a mid-large scale app  
✅ Team has TypeScript experience  
✅ Need enterprise structure  
✅ Planning microservices  
✅ Building in a large team  

**Setup Time**: ~10 minutes  
**Learning Time**: 2-4 weeks  
**Production Ready**: After 1-2 months  

---

### Choose FastAPI If:
✅ Need AI/ML features  
✅ Want best async performance  
✅ Team knows Python  
✅ Need data processing  
✅ Building a data-driven app  

**Setup Time**: ~5 minutes  
**Learning Time**: 1-2 weeks  
**Production Ready**: After 2-3 months  

---

### Choose Django If:
✅ Building complex systems  
✅ Need built-in admin panel  
✅ Team has Django experience  
✅ Want "batteries included" approach  
✅ Building traditional web apps  

**Setup Time**: ~15 minutes  
**Learning Time**: 2-4 weeks  
**Production Ready**: After 3-4 weeks  

---

### Choose Go+Gin If:
✅ Need ultra-high performance  
✅ Building microservices  
✅ Team has Go experience  
✅ Need single binary deployment  
✅ Handling very high traffic (100k+ concurrent)  

**Setup Time**: ~20 minutes  
**Learning Time**: 3-6 weeks  
**Production Ready**: After 1-2 months  

---

## 📦 RECOMMENDED FULL STACK COMBINATIONS

### Stack #1: MERN (JavaScript/MongoDB) - RECOMMENDED FOR YOU
```
Frontend: React 18 + Vite
Backend: Node.js + Express.js
Database: MongoDB
Cache: Redis
Auth: JWT
```
**Best For**: Startups, rapid development  
**Total Setup**: 15 minutes  
**Learning Curve**: Low  
**Production Ready**: 2-3 months  

---

### Stack #2: PERN (PostgreSQL/Express) - For Structured Data
```
Frontend: React 18 + Vite
Backend: Node.js + Express.js
Database: PostgreSQL
Cache: Redis
Auth: JWT
```
**Best For**: Financial data, structured queries  
**Total Setup**: 15 minutes  
**Learning Curve**: Low  
**Production Ready**: 2-3 months  

---

### Stack #3: MEVN (Vue alternative) - If not React
```
Frontend: Vue 3 + Vite
Backend: Node.js + Express.js
Database: MongoDB
Cache: Redis
Auth: JWT
```
**Best For**: Team preference  
**Total Setup**: 15 minutes  
**Learning Curve**: Low  
**Production Ready**: 2-3 months  

---

### Stack #4: MEAN (Angular) - Enterprise
```
Frontend: Angular 16
Backend: Node.js + Express.js / Nest.js
Database: MongoDB
Cache: Redis
Auth: JWT
```
**Best For**: Large enterprise teams  
**Total Setup**: 20 minutes  
**Learning Curve**: High  
**Production Ready**: 3-4 months  

---

### Stack #5: Python FastAPI (Modern Python)
```
Frontend: React 18 + Vite
Backend: Python + FastAPI
Database: PostgreSQL
Cache: Redis
Auth: JWT
```
**Best For**: AI/ML integration  
**Total Setup**: 10 minutes  
**Learning Curve**: Medium  
**Production Ready**: 2-3 months  

---

### Stack #6: Go + React (High Performance)
```
Frontend: React 18 + Vite
Backend: Go + Gin
Database: PostgreSQL
Cache: Redis
Auth: JWT
```
**Best For**: High-traffic applications  
**Total Setup**: 20 minutes  
**Learning Curve**: High  
**Production Ready**: 3-4 months  

---

## 🛠️ STEP-BY-STEP IMPLEMENTATION GUIDE

### Phase 1: Frontend Setup (Day 1)

#### Step 1.1: Create React Project (5 min)
```bash
npm create vite@latest makemytrip-frontend -- --template react
cd makemytrip-frontend
npm install
```

#### Step 1.2: Install Dependencies (5 min)
```bash
npm install react-router-dom redux @reduxjs/toolkit react-redux axios @tanstack/react-query react-hook-form formik yup dayjs lodash classnames uuid framer-motion sass
```

#### Step 1.3: Setup Project Structure (10 min)
```bash
mkdir -p src/{pages,components,hooks,services,store,context,utils,styles,assets,config}
mkdir -p src/components/{Common,Atoms,Molecules,Organisms,Modal}
mkdir -p src/store/{reducers,actions,selectors}
mkdir -p src/styles/{variables,mixins,components}
```

#### Step 1.4: Create Core Files (15 min)
- Copy `src/main.jsx` from DEVELOPMENT_PROMPT.md
- Copy `src/App.jsx` from DEVELOPMENT_PROMPT.md
- Create `.env.local` from `.env.example`

#### Step 1.5: Test Frontend (5 min)
```bash
npm run dev
# Should see Vite dev server running on http://localhost:3000
```

---

### Phase 2: Backend Setup (Day 2)

#### Step 2.1: Create Backend Project (5 min)
```bash
mkdir makemytrip-backend
cd makemytrip-backend
npm init -y
```

#### Step 2.2: Install Dependencies (5 min)
**Option A: Express (Recommended)**
```bash
npm install express dotenv cors uuid axios mongoose jsonwebtoken bcryptjs joi express-validator lodash helmet
npm install --save-dev nodemon eslint prettier
```

**Option B: Nest.js (Production)**
```bash
npm i -g @nestjs/cli
nest new makemytrip-backend
cd makemytrip-backend
```

**Option C: FastAPI (Python)**
```bash
pip install fastapi uvicorn sqlalchemy pydantic python-dotenv
pip install motor # for async MongoDB
```

#### Step 2.3: Create Project Structure (10 min)
```bash
# For Express
mkdir -p src/{routes,controllers,models,middleware,services,utils,config}
touch src/index.js
touch .env
touch .gitignore
```

#### Step 2.4: Setup Database (10 min)
**MongoDB (Easy)**
- Create free account: mongodb.com/cloud/atlas
- Create cluster
- Get connection string
- Add to `.env`: `MONGODB_URI=mongodb+srv://...`

**PostgreSQL (Advanced)**
- Install locally or use cloud provider
- Create database
- Add to `.env`: `DATABASE_URL=postgresql://...`

#### Step 2.5: Create .env File (5 min)
```bash
cat > .env << 'EOF'
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/makemytrip
JWT_SECRET=your_super_secret_key_here_change_in_production
RAZORPAY_KEY_ID=test_key
RAZORPAY_KEY_SECRET=test_secret
CORS_ORIGIN=http://localhost:3000
EOF
```

#### Step 2.6: Test Backend (5 min)
```bash
npm run dev
# Should see "Server running on port 5000"
```

---

### Phase 3: Database Setup (Day 3)

#### Step 3.1: Create MongoDB Connection (Express)
```javascript
// src/config/database.js
import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB connected')
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}
```

#### Step 3.2: Create User Model
```javascript
// src/models/User.js
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  phone: String,
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('User', userSchema)
```

#### Step 3.3: Create Flight Model
```javascript
// src/models/Flight.js
import mongoose from 'mongoose'

const flightSchema = new mongoose.Schema({
  airline: String,
  source: String,
  destination: String,
  departure: Date,
  arrival: Date,
  price: Number,
  seats: Number,
  duration: Number,
  stops: Number,
  createdAt: { type: Date, default: Date.now }
})

export default mongoose.model('Flight', flightSchema)
```

---

### Phase 4: API Development (Days 4-7)

#### Step 4.1: Create Auth Routes
```javascript
// src/routes/auth.js
import express from 'express'
import { register, login, logout } from '../controllers/authController.js'

const router = express.Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', logout)

export default router
```

#### Step 4.2: Create Flight Routes
```javascript
// src/routes/flights.js
import express from 'express'
import { searchFlights, getFlightDetails } from '../controllers/flightController.js'

const router = express.Router()

router.get('/search', searchFlights)
router.get('/:id', getFlightDetails)

export default router
```

#### Step 4.3: Create Booking Routes
```javascript
// src/routes/bookings.js
import express from 'express'
import { createBooking, getBooking, cancelBooking } from '../controllers/bookingController.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.post('/', authenticate, createBooking)
router.get('/:id', authenticate, getBooking)
router.delete('/:id', authenticate, cancelBooking)

export default router
```

---

### Phase 5: Frontend Integration (Days 8-10)

#### Step 5.1: Connect Frontend to Backend
```javascript
// src/config/api.config.js
export const API_CONFIG = {
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 10000,
}
```

#### Step 5.2: Create API Service
```javascript
// src/services/flightService.js
import api from './api'

export const flightService = {
  searchFlights: (criteria) => 
    api.get('/flights/search', { params: criteria }),
  
  getFlightDetails: (id) => 
    api.get(`/flights/${id}`),
}
```

#### Step 5.3: Create Redux Slice
```javascript
// src/store/reducers/searchReducer.js
import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  results: [],
  loading: false,
  error: null,
}

export const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setLoading: (state) => { state.loading = true },
    setResults: (state, action) => { 
      state.results = action.payload
      state.loading = false
    },
    setError: (state, action) => { 
      state.error = action.payload
      state.loading = false
    },
  },
})

export default searchSlice.reducer
```

---

## 📝 KEY FILES CHECKLIST

### Frontend Files to Create
- [ ] `.env.local` (from `.env.example`)
- [ ] `src/main.jsx` (entry point)
- [ ] `src/App.jsx` (root component)
- [ ] `src/pages/HomePage.jsx`
- [ ] `src/pages/SearchResultsPage.jsx`
- [ ] `src/pages/BookingPage.jsx`
- [ ] `src/components/Common/Header.jsx`
- [ ] `src/components/Common/Footer.jsx`
- [ ] `src/store/index.js` (Redux store)
- [ ] `src/services/api.js` (API client)
- [ ] `src/styles/global.scss` (global styles)
- [ ] `vite.config.js` (Vite configuration)

### Backend Files to Create
- [ ] `.env` (configuration)
- [ ] `src/index.js` (server entry)
- [ ] `src/config/database.js` (DB connection)
- [ ] `src/models/User.js`
- [ ] `src/models/Flight.js`
- [ ] `src/models/Booking.js`
- [ ] `src/routes/auth.js`
- [ ] `src/routes/flights.js`
- [ ] `src/routes/bookings.js`
- [ ] `src/controllers/authController.js`
- [ ] `src/controllers/flightController.js`
- [ ] `src/middleware/auth.js` (JWT verification)

---

## 🚀 DEPLOYMENT RECOMMENDATIONS

### Frontend Deployment
**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel login
vercel --prod
```
- Zero configuration needed
- Automatic HTTPS
- Edge caching included

**Option 2: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Option 3: AWS S3 + CloudFront**
```bash
npm run build
aws s3 cp dist s3://your-bucket --recursive
```

---

### Backend Deployment
**Option 1: Render (Recommended)**
- Connect GitHub repo
- Auto-deploy on push
- Free tier available

**Option 2: Railway**
- Similar to Render
- Good free tier
- Simple setup

**Option 3: Heroku** (Free tier removed)
- Use paid tier or alternatives

**Option 4: DigitalOcean**
- More control
- Better performance
- ~$6/month

**Option 5: AWS EC2**
- Maximum control
- Higher cost
- Scalable

---

## 📊 PROJECT TIMELINE ESTIMATE

| Phase | Task | Duration | Backend | Frontend |
|-------|------|----------|---------|----------|
| 1 | Setup & Config | 1 day | ✅ | ✅ |
| 2 | Database Design | 2 days | ✅ | - |
| 3 | Auth System | 2 days | ✅ | ✅ |
| 4 | Flight API | 3 days | ✅ | ✅ |
| 5 | Hotel API | 2 days | ✅ | ✅ |
| 6 | Booking System | 3 days | ✅ | ✅ |
| 7 | Payment Integration | 2 days | ✅ | ✅ |
| 8 | Testing & Fixes | 2 days | ✅ | ✅ |
| **Total** | **MVP Ready** | **~4 weeks** | | |

---

## 🎓 LEARNING RESOURCES

### Frontend
- React Docs: https://react.dev
- Vite Docs: https://vitejs.dev
- Redux Toolkit: https://redux-toolkit.js.org
- React Router: https://reactrouter.com

### Backend
- **Express.js**: https://expressjs.com
- **Nest.js**: https://docs.nestjs.com
- **FastAPI**: https://fastapi.tiangolo.com
- **MongoDB**: https://docs.mongodb.com

### Databases
- **MongoDB**: https://www.mongodb.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs
- **Redis**: https://redis.io/documentation

---

## 🆘 TROUBLESHOOTING

### Frontend Issues
**Problem**: Port 3000 already in use
```bash
npx kill-port 3000
npm run dev
```

**Problem**: Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

**Problem**: API not connecting
- Check backend is running (`npm run dev`)
- Verify `.env.local` has correct API URL
- Check CORS headers in backend

### Backend Issues
**Problem**: Cannot connect to MongoDB
```bash
# Test connection
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/makemytrip"
```

**Problem**: Port 5000 in use
```bash
npx kill-port 5000
npm run dev
```

**Problem**: JWT token errors
- Check JWT_SECRET in .env
- Verify token format (Bearer ...)

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Total Setup Time**: ~30 minutes
