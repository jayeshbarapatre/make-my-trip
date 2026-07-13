# Manual Actions Required

This document lists items that cannot be automated and require manual intervention.

---

## 🔴 CRITICAL - Must do before production

### 1. Rotate All Credentials
**Why**: .env file was committed to git history with real credentials
**Action**: 
- [ ] Change JWT_SECRET in `.env`
- [ ] Generate new database password
- [ ] Rotate Razorpay API keys
- [ ] Rotate Gmail/SMTP credentials
- [ ] Rotate all API keys (Aviationstack, RapidAPI, etc.)

**Command to check git history for secrets**:
```bash
git log --all -S "RAZORPAY_KEY_ID\|JWT_SECRET" --source
# This will show all commits that touched these secrets
```

**How to remove from git history** (DANGEROUS - use with caution):
```bash
# Option 1: Using BFG Repo-Cleaner
java -jar bfg.jar --delete-files .env makemytrip/
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Option 2: Git filter-branch (slower but built-in)
git filter-branch --tree-filter 'rm -f makemytrip-backend/.env' HEAD
git push origin --force --all

# After removing: force-push to GitHub
git push origin --force-with-lease main
```

### 2. Remove .env Files from Git

**Files to remove**:
- `makemytrip-backend/.env`
- `makemytrip-backend/.env.production`
- `makemytrip-frontend/.env`
- `makemytrip-frontend/.env.local`
- `makemytrip-frontend/.env.production`

**Action**:
```bash
# Remove from git (but keep locally)
git rm --cached makemytrip-backend/.env
git rm --cached makemytrip-backend/.env.production
git rm --cached makemytrip-frontend/.env
git rm --cached makemytrip-frontend/.env.local
git rm --cached makemytrip-frontend/.env.production

# Commit the removal
git commit -m "chore: remove env files from git history"

# Verify they're not tracked
git status
```

### 3. Run Database Migrations

**Action**:
```bash
cd makemytrip-backend

# For development
npx prisma migrate dev --name add_booking_refs_and_indexes

# For production
npx prisma migrate deploy
```

**What this does**:
- Adds flightId and hotelId columns to Booking table
- Adds performance indexes to Flight, Hotel, Booking, User tables
- Regenerates Prisma Client

**⚠️ WARNING**: This is a SCHEMA CHANGE. Back up production database first.

### 4. Create First Admin Account

After migrations, create the first admin:

```bash
# Option 1: Via API (recommended)
curl -X POST http://localhost:5000/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@makemytrip.local",
    "password": "SecurePassword123"
  }'

# Option 2: Directly in database (if API fails)
# Connect to PostgreSQL and run:
INSERT INTO "User" (id, name, email, phone, password, is_admin, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@makemytrip.local',
  '0000000000',
  '$2a$10$...',  -- bcrypt hash of password
  true,
  NOW(),
  NOW()
);
```

**To create bcrypt hash**:
```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('YourPassword123', 10))"
```

---

## 🟠 HIGH PRIORITY - Strongly recommended

### 5. Configure Frontend Environment Variables

**Files to update**:
- `.env.production` for production build
- `.env.staging` for staging (if applicable)

**Content** (update API_BASE_URL to your domain):
```
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### 6. Configure Backend Environment Variables

**Critical variables for production**:
```bash
# .env file
NODE_ENV=production
JWT_SECRET=<generate-new-secret>
DATABASE_URL=postgresql://user:password@host:5432/makemytrip
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Payment (if using Razorpay)
RAZORPAY_KEY_ID=<new-production-key>
RAZORPAY_KEY_SECRET=<new-production-secret>

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<app-password>

# APIs (optional)
AVIATIONSTACK_API_KEY=<your-key>
RAPIDAPI_KEY=<your-key>
```

### 7. Set Up Database Backups

**Action**: Configure automated daily backups

**For PostgreSQL on Cloud Providers**:
- **AWS RDS**: Enable automated backups (7-35 days retention)
- **Render**: Automatic backups included
- **Railway**: Configure backup retention
- **Supabase**: Automatic daily backups

**For self-hosted**:
```bash
# Daily backup script (crontab)
0 2 * * * pg_dump -h localhost -U postgres makemytrip | gzip > /backups/db-$(date +%Y%m%d).sql.gz

# Keep 30 days of backups
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

### 8. Set Up Error Monitoring

**Recommended tools**:
- **Sentry** (errors, performance monitoring)
- **LogRocket** (frontend session replay)
- **Datadog** (infrastructure + app monitoring)
- **New Relic** (APM)

**Implementation** (e.g., Sentry):
```javascript
// backend
import * as Sentry from "@sentry/node";
Sentry.init({ dsn: process.env.SENTRY_DSN });

// frontend  
import * as Sentry from "@sentry/react";
Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN });
```

### 9. Set Up Analytics

**Options**:
- Google Analytics 4
- Mixpanel
- Amplitude
- Segment

**Why**: Track user behavior, feature usage, conversion funnels

### 10. Enable HTTPS

**Action**: Install SSL certificate

**Options**:
- **Vercel** (auto HTTPS)
- **Let's Encrypt** (free, auto-renewing)
- **CloudFlare** (free, auto)

**Verify**:
```bash
curl -I https://yourdomain.com  # Should show 200 and certificate info
```

---

## 🟡 MEDIUM PRIORITY - Recommended

### 11. Add Security Headers

**File**: Create `src/middleware/securityHeaders.js`

```javascript
import helmet from 'helmet'

app.use(helmet())
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  })
)
```

**Install helmet**:
```bash
npm install helmet
```

### 12. Implement API Rate Limiting (Global)

**Extend rate limiters beyond auth**:
```javascript
// Apply to all routes
app.use(generalLimiter)

// Or specific routes
app.get('/flights', searchLimiter, getFlights)
app.post('/bookings', createLimiter, createBooking)
```

### 13. Add Logging Service

**Recommended**: Winston or Pino logger

```bash
npm install winston
```

**Usage**:
```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

### 14. Move JWT to HTTP-Only Cookies

**Current**: JWT in localStorage (vulnerable to XSS)
**Target**: HTTP-only, Secure, SameSite cookies

**Implementation** (requires backend changes):
```javascript
// Backend: Set cookie on login
res.cookie('token', jwt, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
})

// Frontend: Axios will auto-send cookie
// Remove localStorage token logic
```

### 15. Add CSRF Protection

**Install**:
```bash
npm install csurf cookie-parser
```

**Implement**:
```javascript
import csrf from 'csurf'
import cookieParser from 'cookie-parser'

app.use(cookieParser())
app.use(csrf({ cookie: true }))

// On state-changing requests
app.post('/api/action', validateCsrfToken, handler)
```

---

## 🟢 LOW PRIORITY - Nice to have

### 16. Add Comprehensive Test Suite

**Consider**: Jest + Testing Library

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

**Critical test cases**:
- User registration and login
- Concurrent booking (race condition)
- Booking cancellation and refund
- Admin CRUD operations
- Payment flow

### 17. Add Swagger/OpenAPI Documentation

```bash
npm install swagger-jsdoc swagger-ui-express
```

**Usage**: Document all endpoints with request/response examples

### 18. Implement Feature Flags

**Purpose**: Deploy code without enabling features

**Tool**: LaunchDarkly, Unleash, or Firebase Remote Config

**Benefit**: Safe rollout, A/B testing, gradual feature enablement

### 19. Set Up CI/CD Pipeline

**GitHub Actions example**:
```yaml
name: Deploy
on: [push]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm test
      - run: npm run build
      - run: deploy-to-production
```

### 20. Add Performance Monitoring

**Lighthouse CI**: Monitor Core Web Vitals

```bash
npm install @lhci/cli@~0.9.x @lhci/server@~0.9.x
```

### 21. Database Query Optimization

**Action**: Analyze slow queries
```sql
-- PostgreSQL slow query log
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 22. Cache Configuration

**Implement Redis or in-memory caching**:
```javascript
// For search results, city lists, etc.
cache.set('flights:DEL:BOM', results, 3600) // 1 hour
```

---

## Verification Checklist

After completing manual actions:

- [ ] All .env files removed from git
- [ ] Credentials rotated (new JWT_SECRET, DB password, API keys)
- [ ] Database migrations applied
- [ ] First admin account created
- [ ] Frontend .env.production configured
- [ ] Backend .env configured for production
- [ ] HTTPS certificate installed
- [ ] Database backups configured
- [ ] Error monitoring set up
- [ ] Security headers enabled
- [ ] Rate limiting tested
- [ ] Booking race condition prevented (test with concurrent requests)
- [ ] Booking cancellation refund working
- [ ] All tests passing
- [ ] Production deployment verified

---

## Support References

- [Prisma Deployment](https://www.prisma.io/docs/concepts/overview/should-you-use-prisma#deployment)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)

---

**Last Updated**: June 2024
**Status**: Ready for manual deployment
