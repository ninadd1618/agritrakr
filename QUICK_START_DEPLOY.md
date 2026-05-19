# ⚡ QUICK START DEPLOYMENT

**Status**: ✅ Application Ready for Production  
**Backend Target**: Render  
**Frontend Target**: Netlify  

---

## 🚀 QUICK DEPLOY (5 MINUTES)

### Step 1: Deploy Backend to Render (2 mins)

```bash
1. Open https://render.com
2. Sign up / Login
3. Click "New +" → "Web Service"
4. Connect GitHub → Select Repository
5. Fill in:
   - Name: agrotech-backend
   - Start Command: node BackEnd/src/server.js
6. Add Environment Variables from BackEnd/.env:
   - PORT=4000
   - NODE_ENV=production
   - MONGODB_URI=mongodb+srv://...
   - CORS_ORIGIN=* (update after frontend URL known)
   - ACCESS_TOKEN_SECRET=(copy from .env)
   - REFRESH_TOKEN_SECRET=(copy from .env)
7. Click "Deploy"
8. Wait ~2 minutes
9. Copy the Render URL (e.g., https://xyz.onrender.com)
```

### Step 2: Deploy Frontend to Netlify (3 mins)

```bash
1. Open https://netlify.com
2. Sign up / Login
3. Click "Add new site" → "Import existing project"
4. Choose GitHub → Authorize
5. Select Repository
6. Fill in:
   - Base directory: Frontend
   - Build command: npm run build
   - Publish directory: Frontend/dist
7. Click "Deploy site"
8. Go to Site Settings → Environment
9. Add: VITE_API_URL = https://xyz.onrender.com (from Step 1)
10. Trigger new deploy
11. Wait ~2 minutes
12. Copy the Netlify URL (e.g., https://app.netlify.app)
```

### Step 3: Update Backend CORS (1 min)

```bash
1. Go back to Render Dashboard
2. Find your backend service
3. Go to Environment → Edit CORS_ORIGIN
4. Change from * to: https://app.netlify.app (from Step 2)
5. Click Save
6. Redeploy service
```

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify these work:

- [ ] Visit https://app.netlify.app/ (landing page loads)
- [ ] Click "Login" button (navigate to login page)
- [ ] Click "Sign Up" button (navigate to signup page)
- [ ] Create a test account
- [ ] Login with test account
- [ ] See dashboard with sensor data
- [ ] Sidebar toggles on mobile
- [ ] Images load (farm background)

---

## 🔧 ENVIRONMENT VARIABLES

### Frontend (.env.production)
```
VITE_API_URL=https://YOUR-RENDER-URL.onrender.com
```

### Backend (.env)
```
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb+srv://flowmen:agrotech132@cluster0.1gdzdsb.mongodb.net/?appName=Cluster0
CORS_ORIGIN=https://YOUR-NETLIFY-URL.netlify.app
ACCESS_TOKEN_SECRET=951d7a8def770b694fa9f42dfcc69dec9e1625c573f93eec6de6c1f8c64007353ef76a2a767632bbbe1e083d1b379aa0edd1252b5c8e32834b1bb93361314875
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_SECRET=8a927186b704f0bbaa247ba908960bc1a22a97394e63a23ba12b69843fd2af1dd96c0bc83cf0dfb10b36f24e181a3fdd967f392b814e45acf80a3d1e108b871a
REFRESH_TOKEN_EXPIRY=30d
GOLAIN_API_KEY=your-golain-api-key
GOLAIN_ORG_ID=your-org-id
GOLAIN_API_BASE_URL=https://api.golain.com
```

---

## ⚠️ TROUBLESHOOTING

**Frontend shows blank page?**
- [ ] Check browser console (F12)
- [ ] Verify VITE_API_URL is set in Netlify
- [ ] Clear cache and hard refresh (Ctrl+Shift+R)

**Backend deploy fails?**
- [ ] Check build logs on Render
- [ ] Verify all env vars are set
- [ ] Check package.json scripts

**API calls failing?**
- [ ] Verify Render backend is running
- [ ] Check CORS_ORIGIN matches Netlify URL
- [ ] Test with Postman: POST /api/v1/auth/login

**Login not working?**
- [ ] Verify JWT token in browser Storage (F12 → Application)
- [ ] Check Render backend logs for auth errors
- [ ] Verify MongoDB connection in Render logs

---

## 📱 TESTING THE APP

### Registration Test
```
1. Go to landing page
2. Click "Sign Up"
3. Fill: Email, Password, Confirm Password
4. Submit
5. Should redirect to dashboard or login
```

### Login Test
```
1. Click "Login"
2. Enter email and password
3. Submit
4. Should redirect to dashboard
5. Should see sensor data
```

### Responsive Test
```
1. Press F12 (DevTools)
2. Click device toolbar
3. Test mobile (375px) → should see hamburger menu
4. Test tablet (768px) → should see compact sidebar
5. Test desktop (1920px) → should see full sidebar
```

---

## 🎉 DEPLOYED!

Once verified, you're done!

- ✅ Landing page live
- ✅ Users can register
- ✅ Users can login
- ✅ Dashboard accessible
- ✅ Sensor data loading
- ✅ App fully functional

---

## 📚 DETAILED DOCS

For more detailed information, see:
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Step-by-step with screenshots
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) - Complete verification
- [DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md) - What was done

---

**Estimated Total Time**: 5-10 minutes  
**Cost**: FREE (using Render free tier + Netlify free tier)  
**Status**: ✅ PRODUCTION READY
