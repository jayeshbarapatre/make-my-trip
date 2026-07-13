# Contributing Guide

Thank you for contributing to MakeMyTrip! This guide helps you contribute effectively.

## Code Style

### JavaScript/React
- Use **ESLint** for linting: `npm run lint`
- Use functional components and React hooks
- Use meaningful variable names (`userEmail` not `ue`)
- Keep functions small and focused (< 50 lines)
- Add comments only for complex logic, not obvious code

### Node.js/Backend
- Use **ES modules** (`import/export`) - never `require()`
- Use async/await for async operations
- Return consistent API response format:
  ```javascript
  { success: true, message: "...", data: {...} }
  ```
- Handle errors properly with meaningful messages
- Use Prisma for all database operations

## Git Workflow

### Branch Naming
```
feature/add-user-profile       # New feature
bugfix/fix-booking-race        # Bug fix
refactor/improve-auth          # Code improvement
docs/update-readme             # Documentation
```

### Commit Messages
```
feat: Add email verification for sign-up
fix: Resolve race condition in booking creation
refactor: Simplify hotel search filtering
docs: Update API documentation
test: Add tests for user auth flow
perf: Optimize flight search query with indexes
```

### Pull Request Process
1. Create feature branch from `main`
2. Make changes with clear commits
3. Push to GitHub
4. Open PR with description of changes
5. Ensure all tests pass
6. Get review from maintainer
7. Merge to `main`

## Testing

### Required Tests Before PR
- ✅ Verify locally with `npm run dev`
- ✅ Check no console errors
- ✅ Test core user flows
- ✅ Test on mobile viewport
- ✅ Run linter: `npm run lint`

### Test Checklist for Features
- [ ] Happy path works
- [ ] Error cases handled gracefully
- [ ] Mobile responsive
- [ ] Accessibility (keyboard navigation)
- [ ] Performance acceptable
- [ ] No console errors/warnings

## Frontend Guidelines

### Component Structure
```jsx
// 1. Imports
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Component
export default function ComponentName() {
  // 3. State/Hooks
  const [state, setState] = useState()
  const navigate = useNavigate()

  // 4. Effects
  useEffect(() => {
    // load data
  }, [])

  // 5. Handlers
  const handleClick = () => {}

  // 6. Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

### Best Practices
- Use React Query for server state
- Use Redux only for app-wide state (auth, theme)
- Lazy-load pages with `React.lazy()`
- Use Tailwind/DaisyUI for styling
- Avoid inline styles (use CSS classes)
- Memoize expensive calculations (`useMemo`)
- Debounce search inputs

## Backend Guidelines

### Controller Structure
```javascript
// 1. Validate input
// 2. Check authentication/authorization
// 3. Perform operation
// 4. Return response or error

export const createFlight = async (req, res) => {
  try {
    // Validation
    if (!req.body.airline) {
      return res.status(400).json({ message: 'Airline required' })
    }

    // Operation
    const flight = await prisma.flight.create({...})

    // Response
    res.status(201).json({ success: true, data: flight })
  } catch (err) {
    logger.error('Error:', err)
    res.status(500).json({ success: false, message: 'Operation failed' })
  }
}
```

### Database Guidelines
- Always use Prisma for queries (no raw SQL)
- Use transactions for multi-step operations:
  ```javascript
  const result = await prisma.$transaction(async (tx) => {
    // Multiple operations
  })
  ```
- Add indexes for frequently queried fields
- Validate all user input before DB operations

## Common Issues

### Frontend Console Errors
```
❌ "Cannot read property 'xxx' of undefined"
✅ Add null checks: data?.property || defaultValue

❌ Key warnings in lists
✅ Use unique, stable IDs as keys (not index)

❌ Memory leaks in useEffect
✅ Always return cleanup function
```

### Backend Errors
```
❌ "req.body is empty"
✅ Check express.json() middleware is applied

❌ Prisma type mismatch
✅ Verify schema matches operation (create vs update)

❌ Concurrent booking overselling
✅ Use transactions for atomic operations
```

## Performance Tips

### Frontend
- Split large bundles with `React.lazy()`
- Lazy-load images with native `loading="lazy"`
- Memoize components that don't need re-renders
- Use `useMemo` for expensive calculations
- Debounce search/filter inputs

### Backend
- Add database indexes for query performance
- Use pagination for large result sets
- Cache static data (cities, airlines)
- Use connection pooling for database
- Enable gzip compression

## Security Checklist

Before submitting PR, verify:
- [ ] No secrets in code (API keys, passwords)
- [ ] Input validation on all endpoints
- [ ] Authentication checks on protected routes
- [ ] Authorization (user owns resource)
- [ ] SQL injection prevention (Prisma handles)
- [ ] XSS prevention (React escaping)
- [ ] CSRF protection on state-changing ops
- [ ] Rate limiting on sensitive endpoints

## Documentation

### For New Features
- Update README.md if applicable
- Add JSDoc comments for complex functions
- Document API endpoints with request/response examples
- Update CLAUDE.md for architecture changes

### Example JSDoc
```javascript
/**
 * Fetches user bookings from the API
 * @param {string} userId - The user's unique ID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Results per page (default: 20)
 * @returns {Promise<Array>} Array of booking objects
 * @throws {Error} If API request fails
 */
export async function getUserBookings(userId, options = {}) {
  // implementation
}
```

## Need Help?

- Check `CLAUDE.md` for architecture details
- Review similar existing code
- Ask questions in GitHub issues
- Check frontend/backend tests for examples

Thank you for contributing! 🎉
