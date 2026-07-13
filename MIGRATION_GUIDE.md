# Database Migration Guide

This document tracks database schema changes and how to apply them.

## Recent Changes (v1.1.0)

### New Fields Added to Booking Table
- `flightId` - Store flight reference for refunds on cancellation
- `hotelId` - Store hotel reference for refunds on cancellation

**Why**: Allows refunding inventory when bookings are cancelled

### New Indexes Added

**Flight**
- `@@index([airline])` - Faster filtering by airline
- `@@index([isActive])` - Faster active/inactive filtering

**Hotel**
- `@@index([city])` - Faster city filtering
- `@@index([isActive])` - Faster status filtering
- `@@index([vendorId])` - Faster vendor lookups

**Booking**
- `@@index([userId])` - Faster user booking queries
- `@@index([type])` - Faster type filtering
- `@@index([status])` - Faster status filtering
- `@@index([flightId])` - Link to flights
- `@@index([hotelId])` - Link to hotels
- `@@index([createdAt])` - Faster date-based queries

**User**
- `@@index([email])` - Faster email lookups
- `@@index([phone])` - Faster phone lookups
- `@@index([is_admin])` - Faster admin filtering

## How to Apply Migrations

### Development Environment
```bash
cd makemytrip-backend

# Apply pending migrations
npx prisma migrate dev

# This will:
# 1. Create new migration file
# 2. Run the migration
# 3. Regenerate Prisma Client
```

### Staging/Production Environment
```bash
# Deploy migration (without creating new migration file)
npx prisma migrate deploy

# This will:
# 1. Check for pending migrations
# 2. Apply them in order
# 3. Update schema in production DB
```

### Safe Migration Process

1. **Backup Database**
   ```bash
   # For PostgreSQL
   pg_dump -h localhost -U postgres makemytrip > backup.sql
   ```

2. **Test Locally**
   ```bash
   npx prisma migrate dev
   # Verify no errors, test app functionality
   ```

3. **Deploy to Staging**
   ```bash
   # Push changes to staging branch
   # CI/CD runs: npx prisma migrate deploy
   # Test in staging environment
   ```

4. **Deploy to Production**
   ```bash
   # Only after staging verification
   npx prisma migrate deploy
   ```

5. **Verify Migration**
   ```bash
   # Check Prisma client was regenerated
   npx prisma generate
   
   # Restart application
   npm run start
   ```

## Rollback Plan

If migration fails:

```bash
# Reset development database (CAREFUL!)
npx prisma migrate reset

# This will:
# 1. Drop all tables
# 2. Run all migrations from start
# 3. Run seed script

# For production, restore from backup:
psql -h localhost -U postgres makemytrip < backup.sql
```

## Migration History

### v1.1.0 - Add Booking References & Indexes
**Date**: June 2024
**Changes**:
- Added flightId and hotelId to Booking table
- Added performance indexes to Flight, Hotel, Booking, User tables
- Enables refund functionality on booking cancellation

**Migration File**: `prisma/migrations/add_booking_refs_and_indexes`

**Breaking Changes**: None - backward compatible

### v1.0.0 - Initial Schema
**Date**: June 2024
**Changes**: Initial database schema with all core tables

## Monitoring Post-Migration

After deploying migrations:

1. **Check Performance**
   - Query execution times should decrease with new indexes
   - Monitor CPU/memory usage

2. **Verify Data Integrity**
   - Spot-check bookings are created correctly
   - Verify cancellations refund inventory
   - Check admin operations work

3. **Monitor Logs**
   ```bash
   # Watch application logs for errors
   npm run dev 2>&1 | grep -i error
   ```

4. **Run Smoke Tests**
   - Create booking → verify flightId/hotelId stored
   - Cancel booking → verify inventory refunded
   - Search flights → verify query performance

## Common Migration Issues

### Issue: "Prisma Client is out of date"
```bash
# Solution: Regenerate Prisma Client
npx prisma generate
```

### Issue: "Unique constraint violation"
```bash
# Cause: Duplicate data in unique field
# Solution: Check data, remove duplicates, retry

# Example: Duplicate flight numbers
SELECT flightNumber, COUNT(*) 
FROM "Flight" 
GROUP BY flightNumber 
HAVING COUNT(*) > 1;
```

### Issue: "Column already exists"
```bash
# Cause: Migration file already applied
# Solution: Check migration status
npx prisma migrate status

# If stuck, reset and reapply (dev only):
npx prisma migrate reset
```

### Issue: "Migration takes too long"
```bash
# Cause: Large tables, missing indexes
# Solution: Add index before adding NOT NULL constraint

# Good order:
# 1. Add column nullable
# 2. Add index
# 3. Backfill data
# 4. Add constraint
```

## References

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Database Indexing](https://www.postgresql.org/docs/current/sql-createindex.html)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
