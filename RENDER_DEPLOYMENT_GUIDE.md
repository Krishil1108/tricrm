# 🚀 Render Deployment Guide for TriCRM Backend

This guide will help you deploy your TriCRM backend application to Render, a modern cloud platform.

## 📋 Prerequisites

- [Render account](https://render.com) (free tier available)
- GitHub repository with your TriCRM code
- MongoDB Atlas database (already configured)

## 🔧 Step 1: Prepare Your Repository

Your repository should already be configured correctly, but ensure these files exist:

### ✅ Required Files:
- `backend/package.json` ✓
- `backend/server.js` ✓ 
- `backend/.env.example` ✓

## 🌐 Step 2: Create Render Web Service

### 2.1 Connect Your Repository
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account if not already connected
4. Select your repository: `Krishil1108/tricrm`

### 2.2 Configure Service Settings
Fill in the following configuration:

```yaml
# Basic Settings
Name: tricrm-backend
Region: Oregon (US West) # or closest to your users
Branch: main
Root Directory: backend

# Build & Deploy Settings
Runtime: Node
Build Command: npm install
Start Command: npm start
```

### 2.3 Advanced Settings
```yaml
# Instance Type
Plan: Starter (Free) # $0/month - 512MB RAM, 0.1 CPU
# Or Professional for production: $7/month - 512MB RAM, 0.5 CPU

# Auto Deploy
Auto-Deploy: Yes # Deploy on every push to main branch
```

## 🔐 Step 3: Configure Environment Variables

In the Render dashboard, go to **Environment** tab and add these variables:

### Required Environment Variables:

```bash
# Database Configuration
MONGODB_URI=mongodb+srv://krishtrimity11:Pops%23100@cluster0.rsr3wj5.mongodb.net/tricrm

# Server Configuration
PORT=10000
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret-key-change-this

# Email Configuration (for password reset)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=TriCRM System

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://your-frontend-domain.onrender.com
```

### 🔒 Security Notes:
- **Change JWT_SECRET**: Generate a strong random string
- **Email Setup**: Use Gmail App Password, not regular password
- **MongoDB URI**: Already configured with your Atlas credentials

## 🚀 Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Run `npm install` in the backend directory
   - Start the server with `npm start`
   - Assign you a URL like: `https://tricrm-backend.onrender.com`

## 📊 Step 5: Verify Deployment

### Check Deployment Status:
1. Monitor the **Logs** tab for deployment progress
2. Look for: `"MongoDB connected successfully"`
3. Server should start on port assigned by Render

### Test API Endpoints:
```bash
# Health check (if implemented)
GET https://tricrm-backend.onrender.com/api/health

# API documentation
GET https://tricrm-backend.onrender.com/api-docs

# Auth endpoint test
POST https://tricrm-backend.onrender.com/api/auth/login
```

## 🔧 Step 6: Custom Domain (Optional)

### Free Subdomain:
- Render provides: `https://your-service-name.onrender.com`

### Custom Domain:
1. Go to **Settings** → **Custom Domains**
2. Add your domain: `api.yourdomain.com`
3. Update DNS records as instructed by Render

## 🚨 Common Issues & Solutions

### Issue 1: Build Failures
```bash
# Check logs for missing dependencies
# Solution: Ensure all dependencies are in package.json
npm install --save missing-package
```

### Issue 2: Database Connection Errors
```bash
# Check environment variables
# Ensure MONGODB_URI is correctly formatted
# Verify MongoDB Atlas network access (allow 0.0.0.0/0)
```

### Issue 3: Port Issues
```bash
# Render assigns port automatically via process.env.PORT
# Your server.js should use:
const PORT = process.env.PORT || 5000;
```

## 📈 Performance Optimization

### 1. Enable Compression (Already Configured)
```javascript
app.use(compression()); // ✅ Already in your server.js
```

### 2. MongoDB Connection Optimization
```javascript
// Already optimized in your code:
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
```

### 3. Health Check Endpoint (Recommended)
Add to your `server.js`:
```javascript
// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 🔄 Continuous Deployment

### Automatic Deployments:
- ✅ Enabled by default
- Every push to `main` branch triggers deployment
- Takes ~2-3 minutes

### Manual Deployments:
1. Go to Render Dashboard
2. Click **"Manual Deploy"** → **"Deploy latest commit"**

## 💰 Pricing & Scaling

### Free Tier Limitations:
- ⏱️ Spins down after 15 minutes of inactivity
- 🐌 Cold start: ~30 seconds to wake up
- 💾 512MB RAM limit

### Upgrade to Starter ($7/month):
- 🚀 Always online (no sleep)
- ⚡ Instant response
- 📈 Better performance

## 🔗 Post-Deployment Checklist

- [ ] Backend deployed successfully
- [ ] Database connection working
- [ ] Environment variables configured
- [ ] API endpoints responding
- [ ] CORS configured for frontend domain
- [ ] Email functionality tested
- [ ] Logs show no errors

## 📝 Next Steps

1. **Deploy Frontend**: Deploy your React frontend to Render/Vercel/Netlify
2. **Update CORS**: Add frontend URL to CORS configuration
3. **Update Frontend API**: Point frontend to your Render backend URL
4. **Test End-to-End**: Verify complete application functionality

## 🆘 Support Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/node-version)
- [Environment Variables Guide](https://render.com/docs/environment-variables)

---

**Your backend will be available at:**
`https://tricrm-backend.onrender.com`

Remember to update this URL in your frontend configuration!