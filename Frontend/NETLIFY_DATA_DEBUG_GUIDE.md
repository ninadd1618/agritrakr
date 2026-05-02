# 🔍 Netlify Data Loading Debug Guide - AgriTrackr

## 🚨 **Problem: Data Shows on Localhost but Not on Netlify**

### **Common Causes:**
1. ❌ **CORS Issues** - Backend rejecting Netlify requests
2. ❌ **Authentication/Cookie Issues** - Login not persisting
3. ❌ **API URL Issues** - Wrong backend URL configuration
4. ❌ **Environment Variables** - Missing or incorrect
5. ❌ **Network/HTTPS Issues** - Mixed content or SSL problems

---

## 🔧 **Step-by-Step Debugging**

### **Step 1: Check Browser Console**

#### **Open Developer Tools:**
1. Go to your Netlify site
2. Press `F12` or right-click → "Inspect"
3. Check **Console** tab for errors
4. Check **Network** tab for API requests

#### **Look for These Errors:**
```javascript
// CORS Errors:
Access to fetch at 'https://agrotech-backend-436b.onrender.com/api/v1/devices' 
from origin 'https://your-app.netlify.app' has been blocked by CORS policy

// Authentication Errors:
401 Unauthorized
403 Forbidden

// Network Errors:
Failed to load resource: net::ERR_CONNECTION_REFUSED
```

### **Step 2: Verify API Requests**

#### **Network Tab Analysis:**
1. Filter by "Fetch/XHR"
2. Look for your API calls (login, devices, soil data)
3. Check **Status** codes:
   - ✅ `200` - Success
   - ❌ `401` - Not authenticated  
   - ❌ `403` - Forbidden (CORS)
   - ❌ `404` - Not found
   - ❌ `500` - Server error

#### **Check Request Headers:**
```javascript
// Should include:
Cookie: accessToken=...; refreshToken=...
Content-Type: application/json

// Should NOT include:
Origin: null (should be your Netlify URL)
```

### **Step 3: Test Backend Directly**

#### **Test Backend Health:**
```bash
# Test if backend is accessible
curl https://agrotech-backend-436b.onrender.com/healthz

# Test login endpoint
curl -X POST https://agrotech-backend-436b.onrender.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### **Step 4: Check Environment Variables**

#### **Verify Netlify Environment:**
1. Netlify Dashboard → Site Settings → Environment Variables
2. Check `VITE_API_URL` is set to: `https://agrotech-backend-436b.onrender.com`

#### **Check in Browser Console:**
```javascript
// Type in console:
console.log(import.meta.env.VITE_API_URL)
// Should show: https://agrotech-backend-436b.onrender.com
```

---

## 🛠️ **Fixes Applied**

### **1. CORS Configuration Fixed** ✅
```javascript
// Backend CORS updated to allow Netlify:
origin: [
  "https://agritrackr.netlify.app",
  "https://agrotech.netlify.app", 
  "https://*.netlify.app",  // Wildcard for any Netlify subdomain
  "http://localhost:5173"
]
```

### **2. Need Backend Redeployment** 🔄
After CORS changes, you MUST:
1. Push changes to GitHub
2. Redeploy backend on Render
3. Wait for deployment to complete

---

## 🚀 **Immediate Actions**

### **Action 1: Update Your Netlify URL**
Tell me your exact Netlify URL and I'll update the CORS:
```javascript
// Replace with your actual URL:
"https://your-app-name.netlify.app"
```

### **Action 2: Redeploy Backend**
```bash
# Backend needs redeploy after CORS changes
git add .
git commit -m "Fix CORS for Netlify deployment"
git push
# Render will auto-deploy
```

### **Action 3: Clear Browser Cache**
```bash
# Clear everything and reload:
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

---

## 🔍 **Debugging Checklist**

### **✅ Frontend Checks:**
- [ ] Environment variables set in Netlify
- [ ] API calls showing in Network tab
- [ ] No console errors
- [ ] Cookies being sent with requests

### **✅ Backend Checks:**
- [ ] Backend deployed and accessible
- [ ] CORS allows your Netlify domain
- [ ] Health endpoint working
- [ ] Login endpoint working

### **✅ Authentication Checks:**
- [ ] Can login on Netlify site
- [ ] Login persists after page refresh
- [ ] Auth cookies stored in browser
- [ ] API requests include auth cookies

---

## 🎯 **Common Scenarios & Solutions**

### **Scenario 1: CORS Error**
```
Error: Access blocked by CORS policy
```
**Solution:** Update backend CORS (already done, need redeploy)

### **Scenario 2: 401 Unauthorized**
```
Error: 401 Unauthorized on API calls
```
**Solution:** Login again, check cookie persistence

### **Scenario 3: No Network Requests**
```
No API calls in Network tab
```
**Solution:** Check environment variables, API configuration

### **Scenario 4: Backend Not Accessible**
```
Error: Connection refused
```
**Solution:** Check backend status, redeploy if needed

---

## 📊 **Expected Working State**

### **Console Should Show:**
```javascript
[API REQUEST] POST https://agrotech-backend-436b.onrender.com/api/v1/auth/login
[API RESPONSE] 200 /api/v1/auth/login
[API REQUEST] GET https://agrotech-backend-436b.onrender.com/api/v1/devices
[API RESPONSE] 200 /api/v1/devices
```

### **Network Tab Should Show:**
- ✅ Login request: Status 200
- ✅ Device requests: Status 200  
- ✅ Soil data requests: Status 200
- ✅ Cookies included in requests

### **Application Tab Should Show:**
- ✅ `accessToken` cookie
- ✅ `refreshToken` cookie
- ✅ Cookies sent to backend domain

---

## 🆘 **If Still Not Working**

### **Provide This Information:**
1. **Your exact Netlify URL**
2. **Console error messages**
3. **Network request status codes**
4. **Browser and version**

### **Quick Test Commands:**
```javascript
// Test API directly in browser console
fetch('https://agrotech-backend-436b.onrender.com/healthz')
  .then(r => r.json())
  .then(console.log)

// Test login (replace with your credentials)
fetch('https://agrotech-backend-436b.onrender.com/api/v1/auth/login', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  credentials: 'include',
  body: JSON.stringify({email:'your@email.com', password:'yourpassword'})
})
```

---

**Status: 🔧 CORS Fixed - Need Backend Redeploy + Your Netlify URL**
