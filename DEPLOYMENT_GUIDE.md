# 🚀 AgriTrackr Deployment Guide

## Backend Deployment (Render)

### Prerequisites
- Render account (free tier available)
- GitHub repository with backend code

### Render Backend Deployment Steps

1. **Create a New Service on Render**
   - Go to https://render.com/dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the branch (main/develop)

2. **Configure Service Settings**
   - **Name**: `agrotech-backend` (or your preferred name)
   - **Region**: Select closest to your users
   - **Runtime**: Node.js
   - **Build Command**: `npm install && npm run build` (if applicable)
   - **Start Command**: `node BackEnd/src/server.js` or `npm start`
   - **Environment**: Select appropriate tier (free/paid)

3. **Set Environment Variables on Render**
   - In the Render dashboard, go to Environment
   - Add the following variables from `BackEnd/.env`:
   ```
   PORT=4000
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://flowmen:agrotech132@cluster0.1gdzdsb.mongodb.net/?appName=Cluster0
   CORS_ORIGIN=https://your-netlify-domain.netlify.app
   ACCESS_TOKEN_SECRET=(copy from .env)
   ACCESS_TOKEN_EXPIRY=7d
   REFRESH_TOKEN_SECRET=(copy from .env)
   REFRESH_TOKEN_EXPIRY=30d
   GOLAIN_API_KEY=your-golain-api-key
   GOLAIN_ORG_ID=your-org-id
   GOLAIN_API_BASE_URL=https://api.golain.com
   API_URL=https://agrotech-backend-436b.onrender.com/api/v1/soil/data
   DEVICE_SECRET_KEY=(copy from .env)
   ```

4. **Deploy**
   - Click "Deploy"
   - Monitor build logs
   - Once deployed, note the Render URL (e.g., `https://agrotech-backend-xxxxx.onrender.com`)

---

## Frontend Deployment (Netlify)

### Prerequisites
- Netlify account (free tier available)
- GitHub repository with frontend code
- Backend URL from Render deployment

### Netlify Frontend Deployment Steps

1. **Connect Repository to Netlify**
   - Go to https://netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select GitHub and authorize
   - Choose the repository

2. **Configure Build Settings**
   - **Base directory**: `Frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `Frontend/dist`

3. **Set Environment Variables in Netlify**
   - In Site Settings → Build & Deploy → Environment
   - Add environment variable:
   ```
   VITE_API_URL=https://agrotech-backend-xxxxx.onrender.com
   ```
   - Replace `xxxxx` with your actual Render backend URL

4. **Update Backend CORS**
   - Update the backend's CORS_ORIGIN to allow your Netlify URL
   - Redeploy backend with updated CORS setting:
   ```
   CORS_ORIGIN=https://your-site-name.netlify.app
   ```

5. **Deploy**
   - Netlify will automatically trigger builds on GitHub pushes
   - Check deployment status in Netlify dashboard
   - Once deployed, note the Netlify URL (e.g., `https://agritrackr.netlify.app`)

---

## Post-Deployment Verification

### Backend (Render)
- [ ] Test health check endpoint: `GET https://agrotech-backend-xxxxx.onrender.com/`
- [ ] Test API auth endpoint: `POST https://agrotech-backend-xxxxx.onrender.com/api/v1/auth/login`
- [ ] Verify MongoDB connection
- [ ] Check logs for errors

### Frontend (Netlify)
- [ ] Visit landing page: `https://your-site.netlify.app/`
- [ ] Test login flow
- [ ] Test signup flow
- [ ] Verify API calls reach backend
- [ ] Check browser console for errors
- [ ] Test mobile responsiveness

### End-to-End Testing
- [ ] Register new user
- [ ] Login with credentials
- [ ] Access dashboard
- [ ] Verify sensor data loads
- [ ] Test all main features

---

## Environment Variables Summary

### Frontend (.env / .env.production)
```
VITE_API_URL=https://agrotech-backend-xxxxx.onrender.com
```

### Backend (.env)
```
PORT=4000
NODE_ENV=production
MONGODB_URI=mongodb+srv://flowmen:agrotech132@cluster0.1gdzdsb.mongodb.net/?appName=Cluster0
CORS_ORIGIN=https://your-netlify-domain.netlify.app
ACCESS_TOKEN_SECRET=951d7a8def770b694fa9f42dfcc69dec9e1625c573f93eec6de6c1f8c64007353ef76a2a767632bbbe1e083d1b379aa0edd1252b5c8e32834b1bb93361314875
ACCESS_TOKEN_EXPIRY=7d
REFRESH_TOKEN_SECRET=8a927186b704f0bbaa247ba908960bc1a22a97394e63a23ba12b69843fd2af1dd96c0bc83cf0dfb10b36f24e181a3fdd967f392b814e45acf80a3d1e108b871a
REFRESH_TOKEN_EXPIRY=30d
```

---

## Troubleshooting

### Backend Won't Deploy
- Check build logs on Render
- Verify Node.js version compatibility
- Check package.json scripts
- Ensure all dependencies are installed

### Frontend Shows Blank Page
- Check browser console for errors
- Verify VITE_API_URL is correctly set
- Clear browser cache and rebuild
- Check netlify.toml configuration

### API Calls Failing
- Verify backend CORS settings match frontend URL
- Check network tab in browser DevTools
- Verify backend is running and accessible
- Check API endpoint URLs in code

### Login Issues
- Verify JWT tokens are being stored
- Check Redux state management
- Verify API credentials are correct
- Check browser local storage for tokens

---

## Useful Netlify.toml Configuration

The project includes `netlify.toml` with:
- SPA routing configuration (redirects)
- API proxy rules
- Build environment variables
- Multiple deployment contexts (production, preview, branch)

---

## Continuous Deployment

### GitHub Push → Auto Deploy
1. Push to main branch
2. GitHub triggers Netlify/Render builds
3. Automatic deployment on success
4. Rollback available if needed

### Manual Redeploy
- **Netlify**: Click "Trigger Deploy" in UI
- **Render**: Redeploy from dashboard

---

## Performance Optimization

### Frontend
- Tree-shaking enabled in Vite build
- Code splitting via rollupOptions
- Console logs removed in production
- Assets minified with Terser

### Backend
- Environment-based logging
- MongoDB connection pooling
- JWT token caching available

---

## Security Checklist

- [ ] All secrets stored as environment variables (not in code)
- [ ] CORS properly configured for allowed domains
- [ ] JWT tokens have expiration times
- [ ] HTTPS enabled on both services
- [ ] MongoDB Atlas IP whitelist configured
- [ ] No console.log in production (handled by Terser)
- [ ] API keys not exposed in frontend code

---

## Additional Resources

- **Render Docs**: https://render.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **Vite Build Guide**: https://vitejs.dev/guide/build
- **React Router**: https://reactrouter.com
- **Redux Persist**: https://github.com/rt2zz/redux-persist

---

**Last Updated**: May 19, 2026
**Status**: Ready for Production Deployment
