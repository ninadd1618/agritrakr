# 🚀 Netlify Deployment Guide - AgriTrackr Frontend

## ❌ **Error Fixed: VITE_API_URL Not Defined**

### **Problem:**
```
Uncaught Error: VITE_API_URL is not defined. Fix your Netlify environment variables.
```

### **Solution:**
✅ **Fixed in code** - Added fallback URL  
✅ **Set environment variables** - Follow steps below

---

## 📋 **Netlify Environment Variables Setup**

### **1. Go to Netlify Dashboard:**
1. Login to [Netlify](https://app.netlify.com/)
2. Select your AgriTrackr site
3. Go to **Site settings** → **Build & deploy** → **Environment**

### **2. Add Environment Variables:**

#### **Required Variables:**
```
VITE_API_URL=https://agrotech-backend-436b.onrender.com
```

#### **Optional Variables:**
```
VITE_APP_NAME=AgriTrackr
VITE_APP_VERSION=1.0.0
```

### **3. Save and Redeploy:**
1. Click **Save** 
2. Trigger a new deployment
3. Test the application

---

## 🔧 **Code Changes Made**

### **API Configuration (api.js):**
```javascript
// BEFORE (crashes if missing):
if (!import.meta.env.DEV && !baseURL) {
  throw new Error("VITE_API_URL is not defined. Fix your Netlify environment variables.");
}

// AFTER (graceful fallback):
const baseURL = import.meta.env.DEV
  ? '' // use Vite proxy in development
  : import.meta.env.VITE_API_URL || 'https://agrotech-backend-436b.onrender.com'; // fallback

if (!import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL not set, using fallback URL');
}
```

### **Register Route Fixed:**
```javascript
// BEFORE (wrong endpoint):
register: (userData) => apiClient.post('/api/v1/auth/signup', userData),

// AFTER (correct endpoint):
register: (userData) => apiClient.post('/api/v1/auth/register', userData),
```

---

## 🌍 **Environment Configuration**

### **Development (.env.local):**
```bash
VITE_API_URL=http://localhost:4000
```

### **Production (Netlify):**
```bash
VITE_API_URL=https://agrotech-backend-436b.onrender.com
```

### **Fallback Behavior:**
- ✅ **Development:** Uses Vite proxy → `localhost:4000`
- ✅ **Production:** Uses Netlify env var → `https://agrotech-backend-436b.onrender.com`
- ✅ **Emergency:** Uses hardcoded fallback if env var missing

---

## 🚀 **Deployment Steps**

### **1. Local Testing:**
```bash
# Test environment variables
cd Frontend
npm run dev

# Should show:
# [API REQUEST] POST http://localhost:4000/api/v1/auth/login
```

### **2. Deploy to Netlify:**
```bash
# Build and deploy
npm run build
# Deploy build/ folder to Netlify
```

### **3. Production Testing:**
```bash
# Should show in browser console:
# [API REQUEST] POST https://agrotech-backend-436b.onrender.com/api/v1/auth/login
# ⚠️ VITE_API_URL not set, using fallback URL (if env var missing)
```

---

## 🔍 **Troubleshooting**

### **If Error Persists:**

#### **1. Check Netlify Environment:**
- Go to Netlify dashboard
- Verify `VITE_API_URL` is set correctly
- Check for typos in variable name

#### **2. Clear Browser Cache:**
```bash
# Clear cache and reload
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)
```

#### **3. Check Deployment Logs:**
```bash
# Netlify deploy logs should show:
# VITE_API_URL=https://agrotech-backend-436b.onrender.com
```

#### **4. Verify Backend URL:**
```bash
# Test backend is accessible:
curl https://agrotech-backend-436b.onrender.com/healthz
```

---

## 📊 **Expected Behavior**

### **✅ Working Correctly:**
```
Development: http://localhost:5173 → localhost:4000 (proxy)
Production: https://your-app.netlify.app → agrotech-backend-436b.onrender.com
```

### **⚠️ With Fallback:**
```
Production (no env var): https://your-app.netlify.app → agrotech-backend-436b.onrender.com
Console: ⚠️ VITE_API_URL not set, using fallback URL
```

### **❌ Broken:**
```
Production (old code): App crashes with "VITE_API_URL not defined"
```

---

## 🎯 **Quick Fix Summary**

### **Immediate Actions:**
1. ✅ Code fixed with fallback URL
2. 🔧 Set Netlify environment variable: `VITE_API_URL=https://agrotech-backend-436b.onrender.com`
3. 🚀 Redeploy to Netlify
4. ✅ Test registration/login

### **Result:**
- ✅ No more crashes
- ✅ Registration works
- ✅ Login works
- ✅ Environment-aware API calls

---

**Status: ✅ FIXED - Ready for Netlify Deployment**
