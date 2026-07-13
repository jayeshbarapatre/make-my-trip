# Deployment Checklist - v1.1.0

Use this checklist to prepare for deployment to production.

## Pre-Deployment (LOCAL DEV)

### Code & Database
- [ ] Pull latest changes: `git pull origin main`
- [ ] Install dependencies: `npm install` (both frontend & backend)
- [ ] Run Prisma migrations: `npx prisma migrate dev --name init`
- [ ] Seed database (optional): `npx prisma db seed`
- [ ] Verify no TS/ESLint errors: `npm run lint` (frontend)

### Environment Setup (LOCAL)
- [ ] Copy `.env.example` to `.env`
- [ ] Update DATABASE_URL for local Postgres
- [ ] Generate new JWT_SECRET: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- [ ] Test locally: `npm run dev` (frontend) + `npm run dev` (backend)

### Testing (LOCAL)
- [ ] Test user registration/login
- [ ] Test flight search and booking
- [ ] Test booking cancellation (verify refund)
- [ ] Create booking concurrently (test race condition)
- [ ] Test admin login and CRUD
- [ ] Verify no console errors

---

## Pre-Staging (GIT & SECRETS)

### Remove Secrets from Git ⚠️ CRITICAL
- [ ] Identify all env files in git history:
  ```bash
  git log --all --full-history -- makemytrip-backend/.env
  ```
- [ ] Use BFG to remove (RECOMMENDED):
  ```bash
  # Install BFG
  java -jar bfg.jar --delete-files .env repo/
  java -jar bfg.jar --delete-files .env.production repo/
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```
- [ ] Or use git filter-branch (slower):
  ```bash
  git filter-branch --tree-filter 'rm -f makemytrip-backend/.env' HEAD
  git filter-branch --tree-filter 'rm -f makemytrip-frontend/.env' HEAD
  ```
- [ ] Force push to GitHub:
  ```bash
  git push origin --force-with-lease main
  ```
- [ ] Verify env files no longer in history:
  ```bash
  git log --all --full-history -- "*.env"
  ```

### Rotate All Credentials ⚠️ CRITICAL
- [ ] **JWT_SECRET**: Generate new
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] **Database Password**: Change in PostgreSQL
  ```sql
  ALTER USER postgres WITH PASSWORD 'new_password_here';
  ```
- [ ] **Razorpay Keys**: Regenerate in dashboard (if using)
- [ ] **API Keys**: Rotate Aviationstack, RapidAPI, etc.
- [ ] **Email Credentials**: Change Gmail app password
- [ ] **Store new credentials securely** (LastPass, 1Password, Vault)

### Update Git Ignore
- [ ] Ensure .env files are in .gitignore:
  ```bash
  echo ".env" >> .gitignore
  echo ".env.local" >> .gitignore
  echo ".env.production" >> .gitignore
  git add .gitignore
  git commit -m "docs: ensure env files ignored"
  ```

---

## Staging Deployment

### Environment Configuration (STAGING)
- [ ] Set environment variables on deployment platform:
  - `NODE_ENV=staging`
  - `DATABASE_URL=<staging-db-url>`
  - `JWT_SECRET=<new-staging-secret>`
  - `CORS_ORIGIN=https://staging.yourdomain.com`
  - `RAZORPAY_KEY_ID=<staging-keys>`
  - `RAZORPAY_KEY_SECRET=<staging-secret>`
- [ ] Verify all env vars are set: `echo $DATABASE_URL` etc.

### Database (STAGING)
- [ ] Create staging database in PostgreSQL/Cloud provider
- [ ] Run migrations on staging:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Verify migrations applied:
  ```bash
  npx prisma db seed  # Optional: load test data
  ```
- [ ] Create staging admin account:
  ```bash
  curl -X POST https://staging-api.yourdomain.com/api/v1/admin/register \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Staging Admin",
      "email": "admin@staging.local",
      "password": "StagingPassword123"
    }'
  ```

### Deployment (STAGING)
- [ ] Deploy backend:
  ```bash
  # Using Render, Railway, Heroku, etc.
  git push origin main  # Triggers auto-deploy
  ```
- [ ] Deploy frontend:
  ```bash
  # Using Vercel, Netlify, etc.
  npm run build
  npm run deploy  # Or auto-deploy on git push
  ```
- [ ] Verify deployment succeeded:
  ```bash
  curl https://staging-api.yourdomain.com/health
  # Should return: {"status":"ok"}
  ```

### Smoke Tests (STAGING)
- [ ] Access staging frontend: https://staging.yourdomain.com
- [ ] Login with admin account
- [ ] Create test booking
- [ ] Verify booking in database
- [ ] Cancel booking, verify refund
- [ ] Check application logs for errors
- [ ] Verify no console errors in browser

### Performance Testing (STAGING)
- [ ] Load test bookings:
  ```bash
  # Using Apache Bench or similar
  ab -n 100 -c 10 https://staging-api.yourdomain.com/api/v1/flights/search
  ```
- [ ] Test race condition:
  ```bash
  # Make 10 concurrent booking requests for 5-seat flight
  # Should only allow 5 to succeed
  for i in {1..10}; do
    curl -X POST https://staging-api.yourdomain.com/api/v1/bookings/flights &
  done
  ```

### Monitoring (STAGING)
- [ ] Set up error monitoring (Sentry/Datadog)
- [ ] Set up performance monitoring (New Relic/Datadog)
- [ ] Set up log aggregation (CloudWatch/Loggly)
- [ ] Monitor for 24-48 hours for any issues

---

## Production Deployment

### Pre-Prod Database Backup ⚠️ CRITICAL
- [ ] Back up production database:
  ```bash
  pg_dump -h localhost -U postgres makemytrip | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz
  ```
- [ ] Store backup in secure location (S3, Google Drive, etc.)
- [ ] Test restore procedure (critical for safety)

### Environment Configuration (PROD)
- [ ] Set production environment variables:
  - `NODE_ENV=production`
  - `DATABASE_URL=<prod-db-url>`
  - `JWT_SECRET=<new-prod-secret>`
  - `CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com`
  - All API keys with production values
  - All email credentials
- [ ] Double-check all credentials are production (not staging)

### Database (PROD)
- [ ] Run migrations:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Verify migrations applied:
  ```bash
  npx prisma db shell  # Connect to check schema
  SELECT COUNT(*) FROM "Flight";  # Should return count
  ```
- [ ] Create production admin account

### Deployment (PROD)
- [ ] Deploy backend:
  ```bash
  git tag v1.1.0
  git push origin v1.1.0  # Triggers deployment
  ```
- [ ] Deploy frontend:
  ```bash
  npm run build
  npm run deploy  # Deploy to production
  ```
- [ ] Verify health checks:
  ```bash
  curl https://api.yourdomain.com/health
  curl https://yourdomain.com/  # Frontend loads
  ```

### Smoke Tests (PROD)
- [ ] Access production: https://yourdomain.com
- [ ] Create user account
- [ ] Search for flights
- [ ] Create booking
- [ ] Cancel booking
- [ ] Admin login
- [ ] Admin create flight
- [ ] Verify booking in database

### Performance Verification (PROD)
- [ ] Check application performance metrics
- [ ] Verify database query speeds
- [ ] Monitor error rates (should be <1%)
- [ ] Check page load times (<3s target)

### Security Verification (PROD)
- [ ] Verify HTTPS is enabled
- [ ] Check SSL certificate:
  ```bash
  curl -I https://yourdomain.com
  openssl s_client -connect yourdomain.com:443
  ```
- [ ] Verify CORS headers
- [ ] Verify no sensitive data in errors
- [ ] Verify rate limiting works:
  ```bash
  # Make 10 rapid login attempts
  for i in {1..10}; do curl -X POST https://api.yourdomain.com/api/v1/auth/login; done
  # After 5th, should get 429 Too Many Requests
  ```

### Monitoring (PROD)
- [ ] Enable error tracking (Sentry)
- [ ] Enable performance monitoring (New Relic)
- [ ] Enable log aggregation (CloudWatch)
- [ ] Set up alerts for errors/high latency
- [ ] Set up on-call rotation
- [ ] Monitor for 24-48 hours continuously

### Documentation (PROD)
- [ ] Update runbook with production URLs
- [ ] Document emergency procedures
- [ ] Share credentials with team securely
- [ ] Document rollback procedures

---

## Post-Deployment

### Verification (24 hours)
- [ ] Monitor error rates (target: <0.5%)
- [ ] Monitor performance (target: p95 <2s)
- [ ] Monitor database health
- [ ] Monitor server resources
- [ ] Monitor user activity (confirm real users)

### User Communication (If applicable)
- [ ] Announce new features
- [ ] Provide support contact info
- [ ] Monitor support channels for issues

### Documentation Update
- [ ] Update CHANGELOG
- [ ] Tag release in git
- [ ] Archive deployment notes

### Follow-up (1 week)
- [ ] Review error logs
- [ ] Review performance metrics
- [ ] Gather user feedback
- [ ] Plan for next release

---

## Rollback Procedure (If needed)

### Immediate Actions
- [ ] Identify the issue
- [ ] Document the problem
- [ ] Create incident report

### Rollback Steps
1. **Frontend**:
   ```bash
   # Redeploy previous stable version
   git checkout v1.0.0
   npm run build && npm run deploy
   ```

2. **Backend**:
   ```bash
   # Revert to previous version
   git revert HEAD
   git push origin main  # Triggers redeploy
   ```

3. **Database**:
   ```bash
   # Restore from backup
   psql makemytrip < backup-20240615-120000.sql
   ```

4. **Verify**:
   ```bash
   curl https://api.yourdomain.com/health
   ```

---

## Emergency Contacts

- **On-Call Engineer**: [Name] - [Phone]
- **Database Admin**: [Name] - [Phone]
- **DevOps Lead**: [Name] - [Phone]
- **Support**: [Email/Phone]

---

## Sign-Off

- [ ] **Developer**: Verified code changes
- [ ] **QA**: Verified staging environment
- [ ] **DevOps**: Verified deployment infrastructure
- [ ] **Manager**: Approved for production deployment

---

**Date**: June 2024
**Version**: 1.1.0
**Reviewed by**: [Name]
**Approved by**: [Name]
