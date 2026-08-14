# TripOra Website - Architecture Documentation (Frontend/Website Only)

## Website Architecture Overview

TripOra's website is built as a modern, responsive Single Page Application (SPA) with a component-driven architecture optimized for real-time search, booking flows, and personalized user experiences. The frontend uses React with a custom design system (Cosmos) and communicates with backend APIs through a well-defined REST/GraphQL interface.

---

## Website Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │          HTML / CSS / JavaScript (React JSX)             │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │           Page Routes & Navigation                 │  │  │
│  │  │  - Homepage  - Flight Search  - Hotel Search       │  │  │
│  │  │  - Results   - Booking Flow   - User Account       │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│                 COMPONENT LAYER (Cosmos Design System)         │
│                                                                 │
│  ┌───────────────┐  ┌─────────────┐  ┌──────────────┐         │
│  │ Common        │  │ Search      │  │ Booking      │         │
│  │ Components    │  │ Components  │  │ Components   │         │
│  │               │  │             │  │              │         │
│  │ - Buttons     │  │ - Date      │  │ - Summary    │         │
│  │ - Cards       │  │   Picker    │  │ - Payment    │         │
│  │ - Forms       │  │ - Location  │  │ - Confirmation│        │
│  │ - Headers     │  │   Autocomplete│ │ - Review     │         │
│  │ - Modals      │  │ - Filters   │  │             │         │
│  │ - Alerts      │  │ - Results   │  │             │         │
│  │ - Spinners    │  │   List      │  │             │         │
│  │ - Tooltips    │  │ - Sorting   │  │             │         │
│  │ - Tabs        │  │             │  │             │         │
│  │ - Ratings     │  │             │  │             │         │
│  └───────────────┘  └─────────────┘  └──────────────┘         │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│              STATE MANAGEMENT & DATA FLOW                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redux Store / Context API                               │  │
│  │  ├─ App State (theme, locale, auth status)              │  │
│  │  ├─ User State (profile, bookings, preferences)         │  │
│  │  ├─ Search State (criteria, filters, results)           │  │
│  │  ├─ Cart State (selected items, pricing)                │  │
│  │  └─ UI State (loading, errors, notifications)           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Local Storage / Session Storage                          │  │
│  │  ├─ Cached search history (JSON)                         │  │
│  │  ├─ User preferences (theme, language)                   │  │
│  │  ├─ Recent searches (last 5)                             │  │
│  │  ├─ Cart items (temporary)                               │  │
│  │  └─ Auth tokens (secure)                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│              API CLIENT & DATA FETCHING LAYER                   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  HTTP Client (Axios / Fetch API)                         │  │
│  │  ├─ REST endpoints (v1/flights, v1/hotels, etc.)        │  │
│  │  ├─ GraphQL queries (Apollo Client)                     │  │
│  │  ├─ Request/Response interceptors                        │  │
│  │  ├─ Error handling & retry logic                         │  │
│  │  ├─ Request timeout management                           │  │
│  │  └─ JWT token management & refresh                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Service Layers (API Abstraction)                        │  │
│  │  ├─ FlightService (search, details, availability)       │  │
│  │  ├─ HotelService (search, availability, reservation)    │  │
│  │  ├─ BookingService (create, modify, cancel)             │  │
│  │  ├─ PaymentService (process, status check)              │  │
│  │  ├─ UserService (profile, preferences, history)         │  │
│  │  └─ AuthService (login, logout, refresh token)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│           CLIENT-SIDE CACHING & OPTIMIZATION                    │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Browser Cache (Service Worker)                          │  │
│  │  ├─ Static assets (HTML, CSS, JS)                        │  │
│  │  ├─ Images & media                                       │  │
│  │  ├─ API responses (with versioning)                      │  │
│  │  └─ Offline support (PWA)                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Memory Cache (In-Memory)                                │  │
│  │  ├─ Recent search results (1 hour)                       │  │
│  │  ├─ User preferences                                     │  │
│  │  ├─ Popular destinations                                 │  │
│  │  └─ Autocomplete suggestions                             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  IndexedDB / WebSQL (Large Data)                         │  │
│  │  ├─ Search history (JSON)                                │  │
│  │  ├─ Booking history                                      │  │
│  │  └─ User preferences (complex objects)                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
┌─────────────────────────┼──────────────────────────────────────┐
│         EXTERNAL CLIENT-SIDE INTEGRATIONS                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Payment SDKs (Client-Side)                              │  │
│  │  ├─ Razorpay SDK (payment form, tokenization)            │  │
│  │  ├─ Stripe.js (card element, 3D Secure)                 │  │
│  │  └─ PayPal SDK (wallet integration)                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Analytics & Tracking                                    │  │
│  │  ├─ Google Analytics (page views, events)                │  │
│  │  ├─ Mixpanel (user behavior, funnels)                    │  │
│  │  ├─ Firebase Analytics                                   │  │
│  │  └─ Hotjar (session replay, heatmaps)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Third-Party Libraries                                   │  │
│  │  ├─ Moment.js / Day.js (date handling)                   │  │
│  │  ├─ Lodash (utility functions)                           │  │
│  │  ├─ Axios (HTTP client)                                  │  │
│  │  ├─ Framer Motion (animations)                           │  │
│  │  ├─ React Query (server state)                           │  │
│  │  └─ Formik / React Hook Form (form handling)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                    HTTP/HTTPS API CALLS
                          │
                    (Backend Services)
```

---

## Frontend Technology Stack

### Core Framework & Language
- **Framework**: React (v16+) with Hooks
- **Language**: JavaScript (ES6+) / TypeScript (optional)
- **Build Tool**: Webpack 5 with Babel
- **Package Manager**: npm / Yarn
- **Node.js Runtime**: v14+ (for development)

### State Management
- **Redux**: Global state (user, auth, app settings)
  - Redux Thunk: Async actions
  - Redux DevTools: Debugging
- **Context API**: Light state (theme, locale, UI state)
- **React Query**: Server state management
  - Caching, auto-refetch, background updates
  - Automatic deduplication of requests

### Component Development
- **Component Architecture**: Atomic Design pattern
  - Atoms: Button, Input, Label, Icon
  - Molecules: SearchBar, FilterPanel, Card
  - Organisms: Header, SearchForm, ResultsList
  - Templates: Page layouts
  - Pages: Full-page components

### Styling & CSS
- **CSS Preprocessor**: SCSS/SASS
  - Nested selectors
  - Mixins for responsive design
  - Variables for theming
- **CSS Modules**: Scoped styling to prevent conflicts
- **CSS-in-JS**: Styled Components (optional)
  - Dynamic styling based on props/state
  - Automatic vendor prefixing
- **Utility Framework**: Tailwind CSS (optional, supplementary)
  - Rapid development
  - Responsive utilities
  - Theme customization

### Styling Architecture
```
project/
├── styles/
│   ├── variables/
│   │   ├── _colors.scss
│   │   ├── _typography.scss
│   │   ├── _spacing.scss
│   │   └── _shadows.scss
│   ├── mixins/
│   │   ├── _responsive.scss
│   │   ├── _flexbox.scss
│   │   └── _effects.scss
│   ├── components/
│   │   ├── _buttons.scss
│   │   ├── _cards.scss
│   │   ├── _forms.scss
│   │   └── _modals.scss
│   └── global.scss
├── components/
│   └── Button/
│       ├── Button.jsx
│       └── Button.module.scss
```

### Routing
- **Router**: React Router v6+
  - Nested routes
  - Lazy code-splitting
  - URL parameter management
  - Navigation guards (authentication checks)

### Form Handling
- **Form Library**: React Hook Form / Formik
  - Field validation (real-time, blur)
  - Error message display
  - Form state management
  - Multi-step form support

### Date & Time
- **Date Library**: Day.js / Moment.js
  - Date range selection
  - Format conversion
  - Timezone handling
  - Relative date formatting (e.g., "2 days from now")

### HTTP Client
- **Client**: Axios / Fetch API
  - Interceptors for JWT token injection
  - Error handling & retry logic
  - Request/response transformation
  - Timeout management
  - Base URL configuration

- **GraphQL Client**: Apollo Client (if GraphQL is used)
  - Query caching
  - Automatic deduplication
  - Local state management
  - DevTools integration

### Animation & Motion
- **Animation Library**: Framer Motion / React Spring
  - Page transitions
  - Modal animations
  - Card entrance/exit animations
  - Micro-interactions (hover, focus)
  - Skeleton loading screens

### Accessibility
- **Testing**: axe-core / pa11y
  - WCAG 2.1 compliance checking
  - Automated accessibility audits
- **Libraries**:
  - Reach UI (accessible components)
  - React-ARIA (accessibility hooks)
- **Standards**: ARIA labels, semantic HTML, keyboard navigation

### Type Safety (Optional)
- **Language**: TypeScript
  - Type definitions for props, state
  - Function parameter types
  - API response types
  - Improved IDE autocomplete

---

## Directory Structure

```
makemytrip-website/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json (PWA)
│
├── src/
│   ├── index.jsx
│   ├── App.jsx
│   │
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── SearchResultsPage.jsx
│   │   ├── BookingPage.jsx
│   │   ├── ConfirmationPage.jsx
│   │   ├── UserProfilePage.jsx
│   │   ├── MyBookingsPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── components/
│   │   ├── Common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Navigation.jsx
│   │   │   └── Sidebar.jsx
│   │   │
│   │   ├── Atoms/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Label.jsx
│   │   │   ├── Icon.jsx
│   │   │   └── Badge.jsx
│   │   │
│   │   ├── Molecules/
│   │   │   ├── SearchBar.jsx
│   │   │   ├── FilterPanel.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── RatingStars.jsx
│   │   │   └── Pagination.jsx
│   │   │
│   │   ├── Organisms/
│   │   │   ├── SearchForm.jsx
│   │   │   ├── ResultsList.jsx
│   │   │   ├── BookingFlow.jsx
│   │   │   ├── PaymentForm.jsx
│   │   │   └── ReviewOrder.jsx
│   │   │
│   │   └── Modal/
│   │       ├── Modal.jsx
│   │       └── ConfirmDialog.jsx
│   │
│   ├── hooks/
│   │   ├── useSearch.js
│   │   ├── useBooking.js
│   │   ├── useAuth.js
│   │   ├── useFetch.js
│   │   ├── useLocalStorage.js
│   │   └── useDebounce.js
│   │
│   ├── services/
│   │   ├── api.js (Axios instance)
│   │   ├── flightService.js
│   │   ├── hotelService.js
│   │   ├── bookingService.js
│   │   ├── paymentService.js
│   │   ├── authService.js
│   │   └── storageService.js
│   │
│   ├── store/
│   │   ├── index.js (Redux store)
│   │   ├── reducers/
│   │   │   ├── authReducer.js
│   │   │   ├── searchReducer.js
│   │   │   ├── bookingReducer.js
│   │   │   └── uiReducer.js
│   │   ├── actions/
│   │   │   ├── authActions.js
│   │   │   ├── searchActions.js
│   │   │   └── bookingActions.js
│   │   └── selectors/
│   │       ├── authSelector.js
│   │       └── searchSelector.js
│   │
│   ├── context/
│   │   ├── ThemeContext.jsx
│   │   ├── LocaleContext.jsx
│   │   └── NotificationContext.jsx
│   │
│   ├── utils/
│   │   ├── constants.js (API endpoints, enums)
│   │   ├── validators.js (form validation)
│   │   ├── formatters.js (date, price formatting)
│   │   ├── helpers.js (utility functions)
│   │   └── errorHandler.js (error processing)
│   │
│   ├── styles/
│   │   ├── variables/
│   │   │   ├── _colors.scss
│   │   │   ├── _typography.scss
│   │   │   ├── _spacing.scss
│   │   │   └── _shadows.scss
│   │   ├── mixins/
│   │   │   ├── _responsive.scss
│   │   │   ├── _flexbox.scss
│   │   │   └── _reset.scss
│   │   ├── components/
│   │   │   ├── _buttons.scss
│   │   │   ├── _cards.scss
│   │   │   ├── _forms.scss
│   │   │   └── _modals.scss
│   │   └── global.scss
│   │
│   ├── assets/
│   │   ├── images/
│   │   │   ├── destinations/
│   │   │   ├── hotels/
│   │   │   └── icons/
│   │   └── fonts/
│   │
│   └── config/
│       ├── api.config.js
│       ├── auth.config.js
│       └── features.config.js
│
├── tests/
│   ├── components/
│   │   └── Button.test.js
│   ├── pages/
│   │   └── HomePage.test.js
│   ├── services/
│   │   └── flightService.test.js
│   └── utils/
│       └── validators.test.js
│
├── public/
│   ├── index.html
│   └── service-worker.js
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── webpack.config.js
├── package.json
└── README.md
```

---

## Component Architecture (Example: Flight Search)

### FlightSearch Component Structure
```
<FlightSearchPage>
  ├─ <SearchForm>
  │   ├─ <LocationInput> (From)
  │   │   ├─ <Autocomplete>
  │   │   └─ <RecentSearches>
  │   ├─ <LocationInput> (To)
  │   ├─ <DateRangePicker>
  │   │   └─ <Calendar>
  │   ├─ <PassengerSelector>
  │   ├─ <ClassSelector>
  │   └─ <SearchButton>
  │
  ├─ <SearchResults>
  │   ├─ <FilterPanel>
  │   │   ├─ <PriceRangeSlider>
  │   │   ├─ <RatingFilter>
  │   │   ├─ <DepartureTimeFilter>
  │   │   └─ <AirlineFilter>
  │   │
  │   └─ <ResultsList>
  │       ├─ <SortDropdown>
  │       ├─ <FlightCard> (mapped)
  │       │   ├─ <AirlineInfo>
  │       │   ├─ <TimingInfo>
  │       │   ├─ <PriceInfo>
  │       │   └─ <SelectButton>
  │       └─ <InfiniteScroll>
  │           └─ <LoadingSpinner>
```

### Data Flow in FlightSearch
```
User Input (From, To, Date)
    ↓
SearchForm collects input
    ↓
onClick "Search"
    ↓
Dispatch Redux Action: fetchFlights()
    ↓
HTTP Request: GET /v1/flights/search
    ↓
API Response received
    ↓
Update Redux State: searchResults
    ↓
ResultsList Component re-renders
    ↓
Display 50 flights with filters
```

---

## State Management Patterns

### Redux State Shape
```javascript
{
  auth: {
    isAuthenticated: boolean,
    user: { id, name, email, preferences },
    token: string,
    loading: boolean,
    error: string | null
  },
  
  search: {
    criteria: {
      from: string,
      to: string,
      departDate: Date,
      returnDate: Date | null,
      passengers: number,
      class: string
    },
    results: [
      {
        id: string,
        source: string,
        destination: string,
        departure: Date,
        price: number,
        airline: string,
        seats: number,
        rating: number
      }
    ],
    filters: {
      priceRange: [min, max],
      rating: number,
      airlines: string[],
      stops: string[]
    },
    loading: boolean,
    error: string | null
  },
  
  booking: {
    selectedFlight: object,
    passengers: array,
    cart: {
      subtotal: number,
      taxes: number,
      total: number
    },
    loading: boolean,
    error: string | null
  },
  
  ui: {
    theme: 'light' | 'dark',
    locale: 'en' | 'hi',
    notifications: array,
    modals: { [key]: boolean }
  }
}
```

### Custom Hooks Pattern
```javascript
// useSearch.js
const useSearch = () => {
  const dispatch = useDispatch();
  const { criteria, results, loading } = useSelector(state => state.search);
  
  const handleSearch = useCallback((searchCriteria) => {
    dispatch(fetchFlights(searchCriteria));
  }, [dispatch]);
  
  const handleFilter = useCallback((filters) => {
    dispatch(applyFilters(filters));
  }, [dispatch]);
  
  return { criteria, results, loading, handleSearch, handleFilter };
};

// Usage in component
const MyComponent = () => {
  const { results, loading, handleSearch } = useSearch();
  // ...
};
```

---

## Client-Side Caching Strategy

### Browser Cache Layers
```
1. Browser Disk Cache (Service Worker)
   ├─ Static assets (index.js, styles.css)
   ├─ Images (lazy-loaded)
   ├─ API responses (v1/flights/popular - 1 hour TTL)
   └─ Manifest files (PWA)

2. Browser Memory (Redux Store)
   ├─ Current search results
   ├─ User profile
   ├─ Recent bookings
   └─ App preferences

3. LocalStorage (Persistent)
   ├─ User theme preference
   ├─ Language/locale setting
   ├─ Recent searches (last 5)
   ├─ Auth token
   └─ Cart items (JSON)

4. SessionStorage (Tab-Specific)
   ├─ Current search criteria
   ├─ Temporary cart state
   └─ Page navigation history

5. IndexedDB (Large Data)
   ├─ Search history (50+ entries)
   ├─ Booking history
   └─ Cached API responses (with versioning)
```

### Cache Invalidation
```javascript
// Example: Invalidate flight search cache after 30 minutes
const FlightSearch = () => {
  const [cacheTime, setCacheTime] = useState(Date.now());
  
  const isCacheExpired = () => {
    return Date.now() - cacheTime > 30 * 60 * 1000; // 30 minutes
  };
  
  const handleSearch = () => {
    if (isCacheExpired()) {
      // Fresh search
      dispatch(fetchFlights(criteria));
      setCacheTime(Date.now());
    } else {
      // Use cached results
      return cachedResults;
    }
  };
};
```

---

## API Integration & HTTP Patterns

### Axios Instance Configuration
```javascript
// api.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  response => response.data,
  error => {
    if (error.response?.status === 401) {
      // Handle token refresh
      refreshToken();
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Service Layer Pattern
```javascript
// flightService.js
import api from './api';

const flightService = {
  searchFlights: (criteria) => {
    return api.get('/v1/flights/search', { params: criteria });
  },
  
  getFlightDetails: (flightId) => {
    return api.get(`/v1/flights/${flightId}`);
  },
  
  checkAvailability: (flightId, seats) => {
    return api.post(`/v1/flights/${flightId}/check-availability`, { seats });
  }
};

export default flightService;
```

### Component Integration
```javascript
// SearchResults.jsx
const SearchResults = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleSearch = async (criteria) => {
    setLoading(true);
    try {
      const data = await flightService.searchFlights(criteria);
      setFlights(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {loading && <Spinner />}
      {error && <ErrorAlert message={error} />}
      {flights.map(flight => <FlightCard key={flight.id} flight={flight} />)}
    </div>
  );
};
```

---

## Performance Optimization Techniques

### Code Splitting & Lazy Loading
```javascript
// App.jsx
import React, { Suspense, lazy } from 'react';

const HomePage = lazy(() => import('./pages/HomePage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

const App = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/booking" element={<BookingPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  </Suspense>
);
```

### Image Optimization
```javascript
// ResponsiveImage.jsx
const ResponsiveImage = ({ src, alt }) => (
  <picture>
    <source srcSet={`${src}-large.webp`} media="(min-width: 1024px)" type="image/webp" />
    <source srcSet={`${src}-medium.webp`} media="(min-width: 768px)" type="image/webp" />
    <source srcSet={`${src}-small.webp`} type="image/webp" />
    <img 
      src={`${src}.jpg`} 
      alt={alt} 
      loading="lazy"
      decoding="async"
    />
  </picture>
);
```

### Memoization & Performance
```javascript
// FlightCard.jsx
const FlightCard = React.memo(({ flight, onSelect }) => {
  const memoizedPrice = useMemo(() => calculatePrice(flight), [flight]);
  
  return (
    <div>
      <h3>{flight.airline}</h3>
      <p>₹{memoizedPrice}</p>
      <Button onClick={onSelect}>Select</Button>
    </div>
  );
});
```

### Virtual Scrolling (Large Lists)
```javascript
// ResultsList.jsx
import { FixedSizeList as List } from 'react-window';

const ResultsList = ({ flights }) => (
  <List
    height={600}
    itemCount={flights.length}
    itemSize={120}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <FlightCard flight={flights[index]} />
      </div>
    )}
  </List>
);
```

---

## Testing Strategy

### Unit Tests
```javascript
// Button.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

test('renders button and handles click', () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  
  const button = screen.getByRole('button', { name: /click me/i });
  fireEvent.click(button);
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Component Tests
```javascript
// SearchForm.test.js
test('submits search with criteria', async () => {
  render(<SearchForm onSearch={mockHandler} />);
  
  fireEvent.change(screen.getByLabelText(/from/i), { target: { value: 'DEL' } });
  fireEvent.change(screen.getByLabelText(/to/i), { target: { value: 'BOM' } });
  fireEvent.click(screen.getByRole('button', { name: /search/i }));
  
  expect(mockHandler).toHaveBeenCalledWith({
    from: 'DEL',
    to: 'BOM'
  });
});
```

---

## Build & Deployment

### Build Configuration (Webpack)
```javascript
// webpack.config.js
module.exports = {
  mode: 'production',
  entry: './src/index.jsx',
  output: {
    filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /node_modules/,
          name: 'vendors',
          priority: 10
        }
      }
    }
  },
  module: {
    rules: [
      { test: /\.jsx?$/, use: 'babel-loader' },
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] }
    ]
  }
};
```

### Build Artifacts
- **Output**: `/dist` directory
  - `index.html` (entry point)
  - `main.[hash].js` (main bundle)
  - `vendors.[hash].js` (vendor dependencies)
  - `styles.[hash].css` (global styles)
  - Images, fonts, other assets

### Deployment Options
- **Static Hosting**: AWS S3 + CloudFront, Netlify, Vercel
- **CI/CD**: GitHub Actions, GitLab CI, Jenkins
- **Environment Variables**: `.env.production`, `.env.staging`, `.env.development`

---

## Key Frontend Features

### 1. Real-Time Search
- Debounced input (300ms delay)
- Autocomplete suggestions
- Recent search history
- Quick filters

### 2. Responsive Design
- Mobile-first approach
- Breakpoints: 480px (mobile), 768px (tablet), 1024px (desktop)
- Flexible layouts, touch-friendly interactions

### 3. Session Management
- JWT token storage
- Auto-refresh on token expiry
- Logout on 401 error
- Session timeout (30 minutes)

### 4. Form Validation
- Real-time validation as user types
- Error messages below fields
- Disabled submit until valid
- Field-level and form-level validation

### 5. Notifications
- Toast messages (success, error, info)
- Inline form errors
- Loading states (spinners, skeleton screens)
- Confirmation dialogs

### 6. Analytics Tracking
- Page views
- Click events (CTA buttons)
- Search actions
- Booking completion
- Error events

---

**Document Version**: 1.0  
**Last Updated**: May 2026  
**Architecture Pattern**: React SPA with Redux State Management
