# Fix NPM Dependency Conflicts

## 🚨 Problem
You're getting React version conflicts when trying to install leaflet packages:
- `react-leaflet@5.0.0` requires React ^19.0.0
- `react-leaflet-draw@0.19.8` requires React ^16.3.0 || ^17.0.0
- Your project uses React ^18.2.0

## ✅ Solution

### Step 1: Clean up existing installations
Open Command Prompt in the Frontend directory:
```bash
cd E:\IndustryProjectReal\Flowmen-common\Frontend

# Remove node_modules and package-lock.json
rmdir /s /q node_modules
del package-lock.json
```

### Step 2: Install compatible versions
I've already updated your package.json with compatible versions:
- `react-leaflet@4.2.1` (compatible with React 18)
- `react-leaflet-draw@0.20.4` (compatible with React 18)

### Step 3: Install dependencies
```bash
npm install
```

### Step 4: Alternative if still fails
If you still get errors, use legacy peer deps:
```bash
npm install --legacy-peer-deps
```

## 📋 Updated Package Versions
- ✅ `react-leaflet: ^4.2.1` (React 18 compatible)
- ✅ `react-leaflet-draw: ^0.20.4` (React 18 compatible)
- ✅ `leaflet: ^1.9.4`
- ✅ `leaflet-draw: ^1.0.4`

## 🧪 Verification
After installation, verify the packages are installed:
```bash
npm list react-leaflet
npm list react-leaflet-draw
```

## 🔄 If Issues Persist
1. Clear npm cache: `npm cache clean --force`
2. Delete `.npm` folder in your user directory
3. Try installing with `--force` flag (not recommended but works)

## 🎯 Expected Result
No more dependency conflicts and leaflet packages ready to use!
