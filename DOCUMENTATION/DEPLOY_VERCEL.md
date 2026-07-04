# 🚀 Deploy Frontend to Vercel

This guide walks you through deploying the **CrimeGPT Frontend** (React + TypeScript + Vite) to Vercel.

---

## 📋 Prerequisites

- ✅ Vercel account (free tier works fine)
- ✅ GitHub/GitLab/Bitbucket repository containing the frontend code
- ✅ Backend API deployed and accessible (see `DEPLOY_RENDER.md`)
- ✅ Node.js 18+ installed locally

---

## 🎯 Deployment Steps

### **Step 1: Prepare Your Frontend**

Navigate to your frontend directory:
```bash
cd sentinelai
```

### **Step 2: Create `.env` File**

Copy the example environment file:
```bash
copy .env.example .env
```

Update `.env` with your production backend URL:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

**⚠️ Important:** Do NOT commit `.env` to git. It's already in `.gitignore`.

### **Step 3: Test Production Build Locally**

Build the project to ensure everything works:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

If the build succeeds with 0 errors, you're ready to deploy.

### **Step 4: Push to Git Repository**

Ensure your code is committed and pushed:
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### **Step 5: Deploy to Vercel**

#### **Option A: Deploy via Vercel Dashboard (Recommended)**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your git repository
4. Configure your project:
   - **Framework Preset:** Vite
   - **Root Directory:** `sentinelai` (if in a monorepo) or `.` (if standalone)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add Environment Variables:
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-url.onrender.com`
6. Click **"Deploy"**

#### **Option B: Deploy via Vercel CLI**

Install Vercel CLI:
```bash
npm install -g vercel
```

Login to Vercel:
```bash
vercel login
```

Deploy:
```bash
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? (Select your account)
- Link to existing project? **N**
- Project name? (Use default or custom)
- Directory? `./` (or `sentinelai` if in monorepo)
- Override settings? **N**

Add environment variables:
```bash
vercel env add VITE_API_URL production
```
Paste your backend URL when prompted.

Deploy to production:
```bash
vercel --prod
```

---

## ✅ Post-Deployment Verification

### **1. Access Your Deployed App**

Vercel will provide a URL like:
```
https://your-app.vercel.app
```

### **2. Test Core Functionality**

- ✅ Login page loads
- ✅ Registration works
- ✅ Dashboard renders correctly
- ✅ API calls connect to your backend
- ✅ CORS is configured properly

### **3. Check Browser Console**

Open DevTools → Console and verify:
- No CORS errors
- API calls use correct production URL
- No 404 errors

### **4. Verify Environment Variables**

In Vercel Dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Confirm `VITE_API_URL` is set correctly

---

## 🔧 Troubleshooting

### **Issue: CORS Error**

**Symptom:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solution:** Update backend CORS configuration in `.env`:
```env
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Then redeploy your backend on Render.

### **Issue: API Not Found (404)**

**Symptom:** All API calls return 404

**Solution:** 
1. Check `VITE_API_URL` in Vercel dashboard
2. Ensure backend is running: `https://your-backend-url.onrender.com/health`
3. Verify URL has no trailing slash

### **Issue: Environment Variables Not Working**

**Symptom:** App connects to localhost instead of production

**Solution:**
1. Environment variables in Vite must start with `VITE_`
2. Redeploy after adding environment variables:
   ```bash
   vercel --prod
   ```

### **Issue: Build Fails on Vercel**

**Symptom:** `npm run build` fails during deployment

**Solution:**
1. Check build logs in Vercel dashboard
2. Ensure TypeScript has no errors:
   ```bash
   npm run build
   ```
3. Fix any type errors before redeploying

---

## 🔄 Redeployment

Vercel automatically redeploys when you push to your main branch.

**Manual redeploy:**
```bash
vercel --prod
```

**Rollback to previous deployment:**
1. Go to Vercel Dashboard → Deployments
2. Find the stable version
3. Click "Promote to Production"

---

## 🌐 Custom Domain (Optional)

### **Add Custom Domain**

1. Go to Vercel Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain (e.g., `app.crimegpt.com`)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-30 minutes)

### **Update Backend CORS**

Update backend `.env`:
```env
ALLOWED_ORIGINS=https://app.crimegpt.com,https://your-app.vercel.app
```

Redeploy backend on Render.

---

## 📊 Performance Optimization

### **Enable Vercel Analytics**

1. Go to Vercel Dashboard → Analytics
2. Click "Enable Analytics"
3. Free tier: 100k data points/month

### **Check Lighthouse Score**

```bash
npm install -g lighthouse
lighthouse https://your-app.vercel.app --view
```

Aim for:
- ✅ Performance: 90+
- ✅ Accessibility: 90+
- ✅ Best Practices: 90+
- ✅ SEO: 90+

---

## 📝 Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ✅ Yes | `https://api.example.com` | Backend API base URL (no trailing slash) |

---

## 🔐 Security Checklist

- ✅ HTTPS enabled (automatic on Vercel)
- ✅ Environment variables configured correctly
- ✅ Backend CORS restricts to your Vercel domain
- ✅ No sensitive data in frontend code
- ✅ CSP headers configured (optional but recommended)

---

## 📞 Support

**Vercel Documentation:** https://vercel.com/docs

**Common Issues:**
- Deployment logs: Vercel Dashboard → Deployments → View Logs
- Environment variables: Settings → Environment Variables
- Custom domain: Settings → Domains

---

## ✅ Deployment Complete!

Your CrimeGPT frontend is now live on Vercel! 🎉

**Next Steps:**
1. Test the production application thoroughly
2. Configure custom domain (optional)
3. Enable Vercel Analytics
4. Monitor application performance
5. Set up CI/CD for automatic deployments

**Production URL:** `https://your-app.vercel.app`

---

**Last Updated:** Phase 5 Deployment Preparation
