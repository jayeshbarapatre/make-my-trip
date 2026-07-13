# API Response Format Guide

All APIs must use consistent response formats for predictable client handling.

## Standard Success Response

### Format
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

### Example - Single Resource
```json
{
  "success": true,
  "message": "Flight retrieved successfully",
  "data": {
    "id": "flight-123",
    "airline": "IndiGo",
    "price": 5000,
    "seatsAvailable": 50
  }
}
```

### Example - List with Pagination
```json
{
  "success": true,
  "message": "Flights retrieved successfully",
  "data": [
    { "id": "flight-1", "airline": "IndiGo", "price": 5000 },
    { "id": "flight-2", "airline": "Air India", "price": 6000 }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Standard Error Response

### Format
```json
{
  "success": false,
  "message": "Human-readable error message",
  "errors": {}
}
```

**Note**: `errors` object is ONLY included in development mode

### Example - Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Password must be at least 8 characters"
  }
}
```

### Example - 404 Not Found
```json
{
  "success": false,
  "message": "Flight not found"
}
```

### Example - 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthorized: Please login"
}
```

### Example - 500 Server Error
```json
{
  "success": false,
  "message": "An error occurred processing your request"
}
```

**Production**: Error details are NOT sent to client
**Development**: Full error details included for debugging

---

## HTTP Status Codes

### Success (2xx)
- **200 OK** - Successful GET, PUT, DELETE
- **201 Created** - Successful POST creating a resource
- **202 Accepted** - Request accepted, processing async
- **204 No Content** - Successful DELETE with no response body

### Client Errors (4xx)
- **400 Bad Request** - Invalid input, validation failed
- **401 Unauthorized** - Missing or invalid authentication
- **403 Forbidden** - Authenticated but not authorized
- **404 Not Found** - Resource doesn't exist
- **409 Conflict** - Duplicate entry (e.g., email already registered)
- **422 Unprocessable Entity** - Request well-formed but semantic error
- **429 Too Many Requests** - Rate limit exceeded

### Server Errors (5xx)
- **500 Internal Server Error** - Unexpected server error
- **503 Service Unavailable** - Server temporarily unavailable

---

## Response Type Guidelines

### GET Requests
```javascript
// Single resource
GET /api/v1/flights/:id
→ 200 { success: true, data: {...} }

// List of resources
GET /api/v1/flights
→ 200 { success: true, data: [...], pagination: {...} }

// Not found
→ 404 { success: false, message: 'Flight not found' }
```

### POST Requests
```javascript
// Create resource
POST /api/v1/flights
→ 201 { success: true, message: 'Flight created', data: {...} }

// Validation error
→ 400 { success: false, message: 'Validation failed', errors: {...} }

// Duplicate entry
→ 409 { success: false, message: 'Flight number already exists' }
```

### PUT Requests
```javascript
// Update resource
PUT /api/v1/flights/:id
→ 200 { success: true, message: 'Flight updated', data: {...} }

// Not found
→ 404 { success: false, message: 'Flight not found' }
```

### DELETE Requests
```javascript
// Delete resource (with data)
DELETE /api/v1/flights/:id
→ 200 { success: true, message: 'Flight deleted', data: {...} }

// Delete resource (no content)
→ 204 (empty body)

// Not found
→ 404 { success: false, message: 'Flight not found' }
```

---

## Field Definitions

### Success Response Fields
- **success** (boolean, required) - Always `true`
- **message** (string, required) - User-friendly operation message
- **data** (object/array, required) - Response payload (can be empty `{}`)
- **pagination** (object, optional) - Only when returning lists
  - **page** (number) - Current page (1-indexed)
  - **limit** (number) - Items per page
  - **total** (number) - Total items available
  - **pages** (number) - Total pages

### Error Response Fields
- **success** (boolean, required) - Always `false`
- **message** (string, required) - User-friendly error message
- **errors** (object, optional) - Validation errors (dev mode only)
  - Key: field name (string)
  - Value: error message (string)

---

## Message Guidelines

### Success Messages
- Generic: "Success" (for simple operations)
- Specific: "Flight created successfully"
- Action-based: "Email sent to user"

### Error Messages
- Clear: "Invalid email format" (not "Error 400")
- Actionable: "Password must be at least 8 characters"
- User-friendly: "Email already registered" (not "Duplicate key violation")
- Consistent: Use same message for same error

---

## Data Format Guidelines

### Dates
```json
{
  "departureDate": "2024-06-15",
  "departureTime": "10:30",
  "bookingDate": "2024-06-01T09:00:00Z"
}
```

### Prices
```json
{
  "price": 5000,
  "currency": "INR",
  "pricePerNight": 3500,
  "totalAmount": 21000
}
```

### Null Values
```json
{
  "middleName": null,
  "returnDate": null,
  "notes": null
}
```

**Don't use**: `""`, `"null"`, or omit the field

### Booleans
```json
{
  "isActive": true,
  "isVerified": false,
  "bookEntireHotel": true
}
```

---

## Pagination Guidelines

### When to Include
- All list endpoints
- When results can exceed 100 items
- Always default to page=1, limit=20

### Format
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

### Query Parameters
```
GET /api/v1/flights?page=2&limit=50
GET /api/v1/hotels?page=1&limit=100&sort=price&order=asc
```

---

## Error Handling Examples

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Invalid email format",
    "password": "Must be at least 8 characters",
    "confirmPassword": "Passwords do not match"
  }
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Unauthorized: Invalid token"
}
```

### Authorization Error (403)
```json
{
  "success": false,
  "message": "Forbidden: You can only view your own bookings"
}
```

### Rate Limiting Error (429)
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again in 15 minutes."
}
```

---

## Implementation Checklist

When creating an endpoint, ensure:

- [ ] Response uses `{ success: true/false, message, data, pagination? }`
- [ ] Correct HTTP status code used
- [ ] Error messages are user-friendly
- [ ] Validation errors returned as object keyed by field name
- [ ] Paginated lists include pagination metadata
- [ ] No raw error stack traces sent to client
- [ ] Development mode includes additional error details
- [ ] All dates in ISO format (YYYY-MM-DD)
- [ ] All prices are numbers (not strings)
- [ ] Null values explicitly set (not omitted)
- [ ] List endpoints default to page=1, limit=20
- [ ] Single resources return unwrapped data object
- [ ] List responses return array in `data` field

---

## Using Response Utilities

### Backend
```javascript
import { sendSuccess, sendError } from '../utils/apiResponse'

// Success response
sendSuccess(res, flight, 'Flight retrieved')
sendSuccess(res, flights, 'Flights retrieved', 200, pagination)

// Error response
sendError(res, 'Flight not found', 404)
sendError(res, 'Validation failed', 400, errors)
```

### Frontend
```javascript
const { data, success, message, pagination } = await api.get('/flights')

if (success) {
  console.log(data)        // Actual data
  console.log(pagination)  // Page info
} else {
  console.error(message)   // Error message for user
}
```

---

## Testing Response Format

```javascript
describe('Flight API Response Format', () => {
  it('should return properly formatted success response', async () => {
    const response = await api.get('/flights')

    expect(response).toHaveProperty('success', true)
    expect(response).toHaveProperty('message')
    expect(response).toHaveProperty('data')
    expect(Array.isArray(response.data)).toBe(true)
  })

  it('should include pagination in list responses', async () => {
    const response = await api.get('/flights')

    expect(response.pagination).toBeDefined()
    expect(response.pagination).toHaveProperty('page')
    expect(response.pagination).toHaveProperty('total')
  })

  it('should return properly formatted error response', async () => {
    const response = await api.get('/flights/invalid-id')

    expect(response.status).toBe(404)
    expect(response.data).toHaveProperty('success', false)
    expect(response.data).toHaveProperty('message')
  })
})
```

---

## Common Mistakes to Avoid

❌ **Don't**: `{ status: 'ok', payload: {...} }`
✅ **Do**: `{ success: true, data: {...} }`

❌ **Don't**: `{ errors: "Email is invalid" }`
✅ **Do**: `{ errors: { email: "Email is invalid" } }`

❌ **Don't**: Return stack traces to client
✅ **Do**: Return "An error occurred" in production

❌ **Don't**: Omit fields
✅ **Do**: Set `null` if field is absent

❌ **Don't**: `{ price: "5000" }`
✅ **Do**: `{ price: 5000 }`

---

**All API endpoints MUST follow this format. No exceptions.**
