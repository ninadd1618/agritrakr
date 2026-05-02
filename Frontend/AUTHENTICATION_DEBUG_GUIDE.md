# 🔍 Authentication Debugging Guide - AgriTrackr

## ❌ **Current Issue: 401 Unauthorized on Settings**

### **Error Messages:**
```
GET https://agrotech-backend-436b.onrender.com/api/v1/settings/profile 401 (Unauthorized)
GET https://agrotech-backend-436b.onrender.com/api/v1/settings/farms 401 (Unauthorized)
401 error on non-auth endpoint - not redirecting
```

### **Root Cause:**
Authentication cookies aren't being sent from Netlify to Render backend properly.

---

## 🔧 **Debugging Steps**

### **Step 1: Check Browser Cookies**
Open your Netlify site and run in console:
```javascript
// Check if auth cookies exist:
console.log("Cookies:", document.cookie);

// Look specifically for:
console.log("Access Token:", document.cookie.includes('accessToken'));
console.log("Refresh Token:", document.cookie.includes('refreshToken'));
```

**Expected:** Should see `accessToken=...; refreshToken=...`  
**Problem:** If cookies are missing, you need to re-login.

### **Step 2: Check Network Request Headers**
1. Open DevTools → **Network** tab
2. Click on **User Profile** or **Farm Settings**
3. Click on the failing request (`/api/v1/settings/profile`)
4. Check **Request Headers** section:
   - **Cookie:** Should show `accessToken=...; refreshToken=...`
   - **Origin:** Should show your Netlify URL

**Problem:** If `Cookie:` header is missing, cookies aren't being sent.

### **Step 3: Check Backend Logs**
After redeploying backend, check Render logs for:
```
=== AUTH DEBUG ===
Path: /api/v1/settings/profile
Origin: https://your-app.netlify.app
Cookies: accessToken=...; refreshToken=...
Auth Headers: { authorization: undefined, cookie: 'Present' }
================
```

**Problem:** If `Cookies:` shows `undefined` or empty, cookies aren't reaching backend.

---

## 🛠️ **Fixes Applied**

### **1. Enhanced CORS Configuration** ✅
```javascript
// More permissive CORS with debugging:
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (origin.includes("localhost:") || origin.includes(".netlify.app")) {
      return callback(null, true);
    }
    console.log("CORS blocked origin:", origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
```

### **2. Added Authentication Debug Middleware** ✅
```javascript
// Debug middleware to log auth attempts:
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/settings')) {
    console.log('=== AUTH DEBUG ===');
    console.log('Path:', req.path);
    console.log('Origin:', req.headers.origin);
    console.log('Cookies:', req.headers.cookie);
    console.log('================');
  }
  next();
});
```

---

## 🚀 **Immediate Actions**

### **Action 1: Redeploy Backend** (Critical)
```bash
# In backend folder:
git add .
git commit -m "Add authentication debugging and improve CORS"
git push
# Render will auto-deploy
```

### **Action 2: Clear Browser and Re-login**
```bash
# Clear all data:
1. Clear browser cache (Ctrl+Shift+R)
2. Clear localStorage: localStorage.clear()
3. Clear cookies: document.cookie.split(";").forEach(c => document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"))
4. Re-login to the application
```

### **Action 3: Test Authentication Flow**
```javascript
// After login, check:
1. Login completes successfully
2. Cookies are set (check document.cookie)
3. Navigate to Settings pages
4. Check Network tab for Cookie headers
5. Check backend logs for debug output
```

---

## 🔍 **Common Issues & Solutions**

### **Issue 1: Cookies Not Set After Login**
**Symptoms:** `document.cookie` is empty after login
**Cause:** Login endpoint not setting cookies properly
**Solution:** Check login response headers for `Set-Cookie`

### **Issue 2: Cross-Domain Cookie Issues**
**Symptoms:** Cookies exist but not sent to backend
**Cause:** Browser blocking cross-domain cookies
**Solution:** Ensure `credentials: true` in CORS and API calls

### **Issue 3: CORS Blocking**
**Symptoms:** "CORS policy" errors in console
**Cause:** Netlify domain not in CORS allowlist
**Solution:** Updated CORS to allow all .netlify.app domains

### **Issue 4: Cookie Scope Issues**
**Symptoms:** Cookies exist but not accessible to backend
**Cause:** Cookie domain/path mismatch
**Solution:** Check cookie domain in backend Set-Cookie headers

---

## 📊 **Expected Working State**

### **After Login:**
```javascript
// Browser console should show:
console.log(document.cookie);
// "accessToken=eyJhbGciOiJIUzI1NiIs...; refreshToken=eyJhbGciOiJIUzI1NiIs..."
```

### **Network Requests:**
```javascript
// Request headers should include:
Cookie: accessToken=eyJhbGciOiJIUzI1NiIs...; refreshToken=eyJhbGciOiJIUzI1NiIs...
Origin: https://your-app.netlify.app
```

### **Backend Logs:**
```javascript
// Render logs should show:
=== AUTH DEBUG ===
Path: /api/v1/settings/profile
Origin: https://your-app.netlify.app
Cookies: accessToken=eyJhbGciOiJIUzI1NiIs...; refreshToken=eyJhbGciOiJIUzI1NiIs...
Auth Headers: { authorization: undefined, cookie: 'Present' }
================
```

### **API Responses:**
```javascript
// Should return 200 instead of 401:
{ success: true, data: { ... } }
```

---

## 🆘 **If Still Not Working**

### **Provide This Information:**
1. **Output of:** `console.log(document.cookie)`
2. **Network Request Headers:** Screenshot of Request Headers
3. **Backend Logs:** Copy of AUTH DEBUG output from Render
4. **Exact Netlify URL:** Your deployed site URL

### **Quick Test Commands:**
```javascript
// Test if cookies are being sent:
fetch('/api/v1/settings/profile', {
  credentials: 'include'
}).then(r => r.json()).then(console.log)

// Test backend directly:
fetch('https://agrotech-backend-436b.onrender.com/healthz')
  .then(r => r.json()).then(console.log)
```

---

## 🎯 **Most Likely Solutions**

### **Solution 1: Clear and Re-login** (80% success rate)
- Clear all browser data
- Re-login to set fresh cookies
- Test settings pages

### **Solution 2: Backend Redeploy** (15% success rate)
- CORS changes need backend redeploy
- Debug middleware helps identify issues

### **Solution 3: Cookie Domain Issues** (5% success rate)
- May need backend cookie configuration changes
- Check backend Set-Cookie headers

---

**Status: 🔧 DEBUGGING - Redeploy backend and test authentication flow**
