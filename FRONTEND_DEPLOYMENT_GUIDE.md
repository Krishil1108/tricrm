# 🚀 Frontend Deployment Guide - TriCRM React App

This guide covers multiple deployment options for your TriCRM React frontend application.

## 📋 Prerequisites

- ✅ Backend deployed at: `https://trimity-crm-backend.onrender.com`
- ✅ Frontend configured with environment variables
- ✅ GitHub repository: `Krishil1108/tricrm`

---

## 🟢 Option 1: Render (Recommended)

### Step 1: Create New Static Site
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository: `Krishil1108/tricrm`

### Step 2: Configure Build Settings
```yaml
# Basic Settings
Name: tricrm-frontend
Branch: main
Root Directory: frontend

# Build Settings
Build Command: npm ci && npm run build
Publish Directory: build

# Advanced Settings
Node Version: 18 (or latest LTS)
```

### Step 3: Environment Variables
Add in Render dashboard:
```
REACT_APP_API_BASE_URL=https://trimity-crm-backend.onrender.com/api
```

### Step 4: Deploy
- Click **"Create Static Site"**
- Render will build and deploy automatically
- Your frontend will be available at: `https://tricrm-frontend.onrender.com`

---

## 🔵 Option 2: Vercel (Alternative)

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Deploy via Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import from GitHub: `Krishil1108/tricrm`

### Step 3: Configure Project
```yaml
# Build Settings
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build
Output Directory: build
Install Command: npm ci
```

### Step 4: Environment Variables
```
REACT_APP_API_BASE_URL=https://trimity-crm-backend.onrender.com/api
```

### Step 5: Deploy
- Click **"Deploy"**
- Available at: `https://tricrm-frontend.vercel.app`

---

## 🟠 Option 3: Netlify

### Step 1: Connect Repository
1. Go to [Netlify](https://netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose GitHub and select: `Krishil1108/tricrm`

### Step 2: Build Configuration
```yaml
# Build Settings
Base directory: frontend
Build command: npm run build
Publish directory: frontend/build
```

### Step 3: Environment Variables
Go to **Site Settings** → **Environment Variables**:
```
REACT_APP_API_BASE_URL=https://trimity-crm-backend.onrender.com/api
```

### Step 4: Deploy
- Click **"Deploy site"**
- Available at: `https://tricrm-frontend.netlify.app`

---

## 🔧 Build Configuration Files

### Create `frontend/netlify.toml` (For Netlify)
```toml
[build]
  base = "frontend"
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Create `frontend/vercel.json` (For Vercel)
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/build",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🛠️ Manual Build & Deploy

### Local Build Test
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Test locally (optional)
npx serve -s build
```

### Deploy to Any Static Host
After building, upload the `build` folder contents to:
- **GitHub Pages**
- **Firebase Hosting** 
- **AWS S3 + CloudFront**
- **Azure Static Web Apps**

---

## 🔐 CORS Configuration

Update your backend CORS settings to include your frontend domain:

```javascript
// In backend/server.js
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'https://tricrm-frontend.onrender.com',
    'https://tricrm-frontend.vercel.app',
    'https://tricrm-frontend.netlify.app'
    // Add your actual domain here
  ],
  credentials: true
};

app.use(cors(corsOptions));
```

---

## 📊 Performance Optimization

### 1. Build Optimization
```json
// In package.json, add:
"scripts": {
  "build": "react-scripts build && npm run optimize",
  "optimize": "npx workbox-cli generateSW"
}
```

### 2. Environment-Specific Builds
```bash
# Development build
npm run start

# Production build
npm run build

# Production preview
npx serve -s build -l 3000
```

---

## 🔍 Troubleshooting

### Issue 1: Build Failures
```bash
# Clear cache and rebuild
npm ci --cache /tmp/empty-cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue 2: API Connection Issues
- ✅ Verify `REACT_APP_API_BASE_URL` is set correctly
- ✅ Check backend CORS settings
- ✅ Test API endpoint manually: `https://trimity-crm-backend.onrender.com/api/health`

### Issue 3: Routing Issues (404 on refresh)
Add redirects configuration for SPA routing (see config files above).

### Issue 4: Environment Variables Not Working
- ✅ Ensure variables start with `REACT_APP_`
- ✅ Restart build after adding variables
- ✅ Check deployment platform environment settings

---

## 🚀 Recommended Deployment Flow

### 1. **Choose Render** (Free tier, reliable)
- Easy setup with GitHub integration
- Automatic deployments on push
- Built-in SSL certificates
- Good performance for React apps

### 2. **Configure Custom Domain** (Optional)
```yaml
# In Render dashboard
Custom Domain: app.yourdomain.com
# Follow DNS setup instructions
```

### 3. **Enable Auto-Deploy**
- ✅ Auto-deploy on `main` branch pushes
- ✅ Preview deployments for pull requests
- ✅ Build logs and monitoring

---

## 🎯 Post-Deployment Checklist

- [ ] Frontend deployed successfully
- [ ] Environment variables configured
- [ ] Backend API connection working
- [ ] Authentication flow working
- [ ] All pages loading correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)

---

## 🔄 Continuous Deployment

### Automatic Deployments
- ✅ Push to `main` branch → Auto-deploy
- ✅ Pull requests → Preview deployments
- ✅ Build status notifications

### Manual Deployments
```bash
# Via platform dashboards
# Render: Click "Manual Deploy"
# Vercel: Click "Redeploy" 
# Netlify: Click "Trigger deploy"
```

---

## 📱 Frontend URLs

After deployment, update your backend `.env`:
```
FRONTEND_URL=https://tricrm-frontend.onrender.com
```

**Your TriCRM application will be live at:**
- **Render**: `https://tricrm-frontend.onrender.com`
- **Vercel**: `https://tricrm-frontend.vercel.app`  
- **Netlify**: `https://tricrm-frontend.netlify.app`

---

## 🆘 Support Resources

- [React Deployment Docs](https://create-react-app.dev/docs/deployment/)
- [Render Static Sites](https://render.com/docs/static-sites)
- [Vercel React Guide](https://vercel.com/guides/deploying-react-with-vercel)
- [Netlify React Deployment](https://docs.netlify.com/frameworks/react/)

**Recommendation: Start with Render for its simplicity and reliability!** 🚀