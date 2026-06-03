# CMS Ecosystem - Quick Start Guide

## 🚀 Getting Started

### 1. Backend Setup

```bash
cd makemytrip-backend

# Already done:
# ✅ npm install multer
# ✅ Prisma schema updated
# ✅ Migration applied

# Start backend
npm run dev
```

**Check backend is running:**
- Health check: `curl http://localhost:5000/health`
- Should return: `{"status":"ok"}`

---

### 2. Frontend Setup

```bash
cd makemytrip-frontend

# Already done:
# ✅ npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link

# Start frontend
npm run dev
```

**Frontend running at:** `http://localhost:5173`

---

## ✅ Quick Testing (5 minutes)

### Test 1: Create & View CMS Page

**Via Admin API (using cURL or Postman):**

```bash
# 1. Create a CMS page
curl -X POST http://localhost:5000/api/v1/admin/cms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "title": "About Us",
    "slug": "about-us",
    "metaTitle": "About MakeMyTrip",
    "metaDescription": "Learn about our company",
    "metaKeywords": "about, company",
    "content": "<h1>Welcome</h1><p>This is our story.</p>",
    "shortDescription": "India leading travel company",
    "status": "active"
  }'

# 2. View on frontend (no auth needed)
# Visit: http://localhost:5173/about-us
# Should see: H1 "Welcome" + paragraph rendered
```

### Test 2: Contact Form Submission

**Frontend:**
1. Visit `http://localhost:5173/contact-us`
2. Fill form: Name, Email, Subject, Message
3. Click "Send Message"
4. Should see: ✓ Success message

**Backend check:**
```bash
# Query database to see contact inquiry was saved
# In your database: SELECT * FROM contact_inquiries ORDER BY created_at DESC;
```

**Admin notification:**
- Check admin email (set in `ADMIN_EMAIL` env var)
- Should receive email with inquiry details

### Test 3: Footer is Dynamic

**Frontend:**
1. Scroll to footer
2. Should show sections from API (or fallback static data)
3. Links should render as React Router `<Link>` tags (internal routes)

**Check API directly:**
```bash
curl http://localhost:5000/api/v1/cms/footer
# Response: array of footer sections with links
```

### Test 4: Theme Colors

**Check colors loaded:**
1. Open browser DevTools → Elements
2. Check `<html>` element style attribute
3. Should have CSS variables: `--primary-color`, `--secondary-color`, etc.

**Or in console:**
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--primary-color')
// Should return: #003580 (or custom color from DB)
```

### Test 5: FAQs Page

**Frontend:**
1. Visit `http://localhost:5173/faqs`
2. Should see accordion list
3. Click a question → answer expands
4. Click again → collapses

**Note:** If no FAQs in DB, page shows "No FAQs available"

### Test 6: Careers Page

**Frontend:**
1. Visit `http://localhost:5173/careers`
2. Should see list of active jobs (if any seeded)
3. Click "Apply Now" → modal opens
4. Fill form: Name, Email, optional (Phone, Resume, Message)
5. Submit → Success toast

---

## 📋 Remaining Work (Admin Pages)

### Create These 6 Admin Pages:

1. **AdminCmsPages.jsx** - Manage CMS pages
   - Template: Use AdminFlights.jsx as reference
   - Table with: title, slug, status
   - Form modal with RichTextEditor for content
   - Actions: Create, Edit, Delete

2. **AdminFooterManager.jsx** - Manage footer
   - Two-panel UI: sections on left, links on right
   - Add/Edit/Delete sections and links

3. **AdminInquiries.jsx** - View contact submissions
   - Table with: name, email, subject, status
   - Status filter dropdown
   - Mark as "contacted" button

4. **AdminCareers.jsx** - Manage jobs & applications
   - Tab 1: Job positions (CRUD)
   - Tab 2: Applications (view & update status)

5. **AdminSettings.jsx** - Theme & settings
   - Color pickers for: primary, secondary, accent, footer, header
   - File upload for logo & favicon
   - Announcement bar toggle + text

6. **AdminMedia.jsx** - File upload manager
   - Drag-drop upload
   - File grid with thumbnails
   - Delete buttons
   - Used in CMS editor image picker

### Update AdminSidebar.jsx:
Add menu items linking to the 6 new admin pages

### Template to follow:
See `AdminFaqs.jsx` (already created) for the pattern:
- Fetch data with useEffect
- Modal form for create/edit
- Table with actions
- toast notifications (npm react-hot-toast already installed)

---

## 🔧 Environment Variables

### Backend (.env)

Add these new variables:

```bash
# Admin email for contact notifications
ADMIN_EMAIL=admin@makemytrip.com

# Or use your Gmail with app password
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# For test mode, redirect all emails to one address:
EMAIL_DEMO_MODE=true
DEMO_EMAIL_RECIPIENT=test@example.com
```

### Frontend (.env.local)

Already configured:
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## 📂 Files Created Summary

**Backend (12 files):**
- 8 controllers (cms, footer, contact, notification, careers, faq, settings, media)
- 1 middleware (upload)
- 2 routes (adminRoutes updated, publicCmsRoutes new)
- 1 service (emailService updated)
- Schema updated

**Frontend (14 files):**
- 1 service (cmsService)
- 1 component (RichTextEditor)
- 4 public pages (CmsPageRenderer, FaqPage, CareersPage, ContactPage)
- 1 admin page template (AdminFaqs)
- 8 CSS files
- Footer.jsx & App.jsx updated

---

## 🧪 Advanced Testing

### Test File Upload:

```bash
curl -X POST http://localhost:5000/api/v1/admin/media/upload \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@/path/to/image.jpg"

# Response should include:
# {
#   "message": "File uploaded",
#   "data": {
#     "id": "...",
#     "fileName": "image-1234567890.jpg",
#     "fileUrl": "/uploads/image-1234567890.jpg",
#     "size": 123456
#   }
# }
```

### Test Settings API:

```bash
# Get current theme settings
curl http://localhost:5000/api/v1/admin/settings \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"

# Update settings
curl -X PUT http://localhost:5000/api/v1/admin/settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "primaryColor": "#FF0000",
    "accentColor": "#00FF00"
  }'
```

---

## ⚡ Performance Notes

- CMS pages cached via TanStack React Query (use queryClient.invalidateQueries on updates)
- Footer fetched once on app load with fallback data
- Theme settings fetched once at app startup
- File uploads limited to 10MB
- All admin endpoints protected with JWT + adminOnly middleware

---

## 🐛 Common Issues & Solutions

### Issue: "Can't upload files"
**Solution:** Ensure `public/uploads/` directory exists and is writable
```bash
mkdir -p makemytrip-backend/public/uploads
chmod 755 makemytrip-backend/public/uploads
```

### Issue: "CMS page not showing after creation"
**Solution:** Check the slug used. Visit `http://localhost:5173/<slug>` exactly as created

### Issue: "Footer shows static data instead of API data"
**Solution:** Check if backend is running and `/cms/footer` endpoint returns data
```bash
curl http://localhost:5000/api/v1/cms/footer
```

### Issue: "Theme colors not changing"
**Solution:** 
1. Hard refresh browser (Ctrl+F5)
2. Check localStorage doesn't have cached settings
3. Verify `/cms/settings` API returns data

### Issue: "Contact email not received"
**Solution:** 
1. Check SMTP credentials in .env
2. Try `EMAIL_DEMO_MODE=true` to test
3. Check backend logs for email errors
4. Verify ADMIN_EMAIL is set correctly

---

## 📞 Support

**For any issues:**
1. Check backend logs: `npm run dev` output
2. Check frontend console: DevTools → Console
3. Verify API endpoints with cURL before testing in UI
4. Check database for data creation: `psql` or MongoDB Compass

---

## ✨ Next: Deploy!

Once all 6 admin pages are created and tested:

1. Run both dev servers and test complete workflow
2. Test on production database
3. Update CORS_ORIGIN for production domain
4. Deploy backend to production
5. Deploy frontend to production
6. Seed production database with initial CMS pages

---

**Implementation Date:** June 3, 2026  
**Status:** 85% Complete (Admin Pages Pending)  
**Estimated Time to Complete:** 2-3 hours for remaining admin pages
