# Dynamic Hotel Image System — Implementation Guide

## Overview
Hotel images are now dynamically managed through a backend API. The system:
- Stores image URLs in the database (PostgreSQL)
- Serves images via REST API endpoints
- Fetches on-demand without caching issues
- Falls back to defaults if images unavailable

---

## Backend API Endpoints

### Get Hotel Images
**Endpoint:** `GET /admin/hotels/:id/images`
- **Auth:** None required (public)
- **Response:**
```json
{
  "data": {
    "hotelId": "uuid",
    "hotelName": "Hotel Name",
    "images": ["url1", "url2", "url3", ...]
  }
}
```

### Update Hotel Images (Admin Only)
**Endpoint:** `PUT /admin/hotels/:id/images`
- **Auth:** Admin JWT required
- **Body:**
```json
{
  "imageUrls": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg",
    "..."
  ]
}
```
- **Response:**
```json
{
  "message": "Hotel images updated successfully",
  "data": {
    "hotel": {
      "id": "uuid",
      "name": "Hotel Name",
      "images": ["url1", "url2", ...]
    }
  }
}
```

---

## Frontend Implementation

### 1. Hook up Image Fetching
Images are fetched in `HotelDetailsPage.jsx` via the `getHotelImages` service:

```javascript
useEffect(() => {
  if (hotel?.id) {
    const fetchImages = async () => {
      setImagesLoading(true)
      try {
        const res = await getHotelImages(hotel.id)
        if (res.data?.images?.length) {
          setImages(res.data.images)
        }
      } catch (err) {
        // Fallback to hotel.images from DB
      } finally {
        setImagesLoading(false)
      }
    }
    fetchImages()
  }
}, [hotel?.id])
```

### 2. No Caching Issues
- **Query Parameter Busting:** API responses include fresh data every request
- **Cache Control:** Backend serves with `no-cache` headers by default
- **Fallback Strategy:** If API fails, uses `hotel.images` from hotel details response

### 3. Swiper Gallery Integration
Images flow directly to Swiper sliders:
```jsx
{images.map((imgUrl, idx) => (
  <SwiperSlide key={idx}>
    <img src={imgUrl} alt={`${hotel.name} - ${idx + 1}`} className="hd-slide-image" />
  </SwiperSlide>
))}
```

---

## How to Update Images

### Option 1: Admin Dashboard (via Admin API)
1. Log in as admin
2. Navigate to Hotels → Edit Hotel
3. Update images array via `PUT /admin/hotels/:id/images`

### Option 2: Direct Database Update
Using Prisma Client or direct SQL:
```sql
UPDATE "Hotel" SET images = '["url1", "url2", "url3"]' WHERE id = 'hotel-id';
```

### Option 3: Seed Script
Update `makemytrip-backend/scripts/seedHotels.js`:
```javascript
const hotel = await prisma.hotel.create({
  data: {
    name: "Hotel Name",
    city: "City",
    images: [
      "https://your-domain.com/image1.jpg",
      "https://your-domain.com/image2.jpg",
      "..."
    ],
    // ... other fields
  }
})
```

---

## Image URL Format Requirements

- **Protocol:** Must be `https://` (not http)
- **Querystring:** Include optimization params for CDNs:
  ```
  ?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop
  ```
- **Dimensions:** Recommended 1200×600px (landscape)
- **Format:** JPG, PNG, WebP supported
- **Limit:** No hard limit, but 16-20 images per hotel recommended

---

## Example Image URLs (Pexels/Unsplash)

```javascript
const imageUrls = [
  "https://images.pexels.com/photos/3939618/pexels-photo-3939618.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop",
  "https://images.pexels.com/photos/3050309/pexels-photo-3050309.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop",
  "https://images.unsplash.com/photo-hotel-room?auto=format&fit=crop&w=1200&h=600&q=80",
];
```

---

## Fallback Behavior

**When images are unavailable:**
1. Check API response (`GET /admin/hotels/:id/images`)
2. If empty, fallback to `hotel.images` from DB
3. If still empty, use hardcoded `defaultImages` (last resort)

**Flow:**
```
API Images (fresh) 
  → Database Images (from hotel details)
    → Hardcoded Defaults (Pexels)
```

---

## Testing the System

### 1. Verify API Endpoint
```bash
curl http://localhost:5000/admin/hotels/hotel-id/images
```

### 2. Update Images via API
```bash
curl -X PUT http://localhost:5000/admin/hotels/hotel-id/images \
  -H "Authorization: Bearer admin_token" \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrls": [
      "https://example.com/img1.jpg",
      "https://example.com/img2.jpg"
    ]
  }'
```

### 3. Frontend Testing
1. Open HotelDetailsPage
2. Check Network tab → `/admin/hotels/:id/images` call
3. Verify images load from API response
4. Refresh page → images persist (not re-uploaded, just re-fetched)

---

## Performance Tips

1. **Use CDN URLs** — Pexels, Unsplash, Cloudinary (auto-optimized)
2. **Compress Images** — Use `?auto=compress` in query string
3. **Right Dimensions** — 1200×600px is sweet spot (loads fast)
4. **Lazy Load Thumbnails** — Swiper handles this automatically
5. **Cache at CDN Level** — Images served from CDN, not your backend

---

## Migration from Hardcoded to Dynamic Images

**Before:**
```javascript
const defaultImages = [...]; // Hardcoded 16 images
const images = hotel?.images?.length ? hotel.images : defaultImages;
```

**After:**
```javascript
const [images, setImages] = useState(defaultImages)
useEffect(() => {
  // Fetch fresh images from API
  const res = await getHotelImages(hotel.id)
  setImages(res.data.images)
}, [hotel?.id])
```

---

## Files Modified

| File | Changes |
|------|---------|
| `makemytrip-backend/src/controllers/hotelAdminController.js` | Added `updateHotelImages`, `getHotelImages` |
| `makemytrip-backend/src/routes/adminRoutes.js` | Added `/hotels/:id/images` routes |
| `makemytrip-frontend/src/services/hotelService.js` | Added `getHotelImages`, `updateHotelImages` |
| `makemytrip-frontend/src/pages/HotelDetailsPage.jsx` | Fetch images from API instead of hardcoded |

---

## Future Enhancements

- [ ] Image upload endpoint with file storage (S3/CloudStorage)
- [ ] Image reordering API (drag-drop in admin)
- [ ] Image validation (dimensions, format, file size)
- [ ] Automatic image optimization pipeline
- [ ] Multi-language image labels/captions
