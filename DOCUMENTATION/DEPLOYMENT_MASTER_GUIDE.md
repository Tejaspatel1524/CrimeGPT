# 🚀 CrimeGPT Production Deployment - Master Guide

Complete guide for deploying CrimeGPT to production using **Vercel** (Frontend), **Render** (Backend), and **Neon** (Database).

---

## 📋 Architecture Overview

```
┌─────────────────┐
│   User Browser  │
└────────┬────────┘
         │
         ↓
┌─────────────────────┐
│  Frontend (Vercel)  │  ← React + TypeScript + Vite
│  HTTPS/CDN/Global   │
└────────┬────────────┘
         │ HTTPS API Calls
         ↓
┌─────────────────────┐
│  Backend (Render)   │  ← FastAPI + Python
│  Web Service        │
└────────┬────────────┘
         │ PostgreSQL Connection
         ↓
┌─────────────────────┐
│  Database (Neon)    │  ← PostgreSQL 16
│  Serverless         │
└─────────────────────┘
```

---

## 🎯 Deployment Order

**IMPORTANT:** Follow this exact order to avoid configuration issues.

### **Phase 1: Database Setup** ⏱️ 10 minutes
→ See: `DEPLOY_NEON.md`

### **Phase 2: Backend Deployment** ⏱️ 15 minutes  
→ See: `DEPLOY_RENDER.md`

### **Phase 3: Frontend Deployment** ⏱️ 10 minutes
→ See: `DEPLOY_VERCEL.md`

### **Phase 4: Integration Testing** ⏱️ 15 minutes
→ See below

**Total Time:** ~50 minutes

---

## 📝 Pre-Deployment Checklist

Before you begin, ensure you have:

### **Accounts Created**
- ✅ [Neon](https://neon.tech) account (free tier)
- ✅ [Render](https://render.com) account (free tier or $7/mo starter)
- ✅ [Vercel](https://vercel.com) account (free tier)
- ✅ GitHub/GitLab account with your code

### **API Keys Ready**
- ✅ Google Gemini API key ([Get here](https://ai.google.dev/))
- ✅ Any other third-party service keys

### **Code Prepared**
- ✅ All code committed to git repository
- ✅ `.gitignore` includes `.env` files
- ✅ `requirements.txt` up to date (backend)
- ✅ `package.json` dependencies installed (frontend)

### **Local Testing Complete**
- ✅ Backend runs locally: `uvicorn app.main:app --reload`
- ✅ Frontend runs locally: `npm run dev`
- ✅ Database migrations work: `alembic upgrade head`
- ✅ All tests pass (if applicable)

---

## 🗄️ Phase 1: Database Setup (Neon)

### **Quick Steps**

1. **Create Neon Account**
   - Go to [neon.tech](https://neon.tech)
   - Sign up (free tier includes 0.5 GB storage)

2. **Create Project**
   - Click "New Project"
   - Name: `crimegpt`
   - Region: Closest to your users (e.g., US East)
   - PostgreSQL 16

3. **Copy Connection String**
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/crimegpt?sslmode=require
   ```
   
   **⚠️ Save this immediately! You'll need it for backend deployment.**

4. **Verify Connection**
   ```bash
   # Test locally first
   cd backend
   # Update .env with Neon DATABASE_URL
   python test_db_connection.py
   ```

5. **Run Migrations**
   ```bash
   alembic upgrade head
   ```

6. **Create Admin User**
   ```bash
   python create_admin.py
   ```

**✅ Phase 1 Complete** when:
- Database connection works
- All tables created
- Admin user exists

📖 **Detailed Guide:** `DEPLOY_NEON.md`

---

## 🔧 Phase 2: Backend Deployment (Render)

### **Quick Steps**

1. **Push Code to Git**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Create Render Web Service**
   - Go to [render.com](https://render.com)
   - New → Web Service
   - Connect your git repository
   - Select `backend` folder (if monorepo)

3. **Configure Build**
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** Free (for testing) or Starter ($7/mo)

4. **Add Environment Variables**
   
   | Variable | Value | Get From |
   |----------|-------|----------|
   | `DATABASE_URL` | `postgresql://...` | Neon (Phase 1) |
   | `SECRET_KEY` | Generate with `openssl rand -hex 32` | Local terminal |
   | `AI_PROVIDER` | `gemini` | - |
   | `GEMINI_API_KEY` | Your key | [Google AI Studio](https://ai.google.dev/) |
   | `GEMINI_MODEL` | `gemini-2.5-flash` | - |
   | `ALLOWED_ORIGINS` | `*` (temporary) | Update after frontend deploy |

5. **Deploy**
   - Click "Create Web Service"
   - Wait for build to complete (~3-5 minutes)
   - Copy your backend URL: `https://your-app.onrender.com`

6. **Verify Deployment**
   ```bash
   # Test health endpoint
   curl https://your-app.onrender.com/health
   
   # Visit API docs
   # https://your-app.onrender.com/docs
   ```

**✅ Phase 2 Complete** when:
- `/health` returns 200 OK
- `/docs` shows Swagger UI
- No errors in Render logs

📖 **Detailed Guide:** `DEPLOY_RENDER.md`

---

## 🌐 Phase 3: Frontend Deployment (Vercel)

### **Quick Steps**

1. **Create Frontend `.env`**
   ```bash
   cd sentinelai
   copy .env.example .env
   ```

2. **Update `.env`**
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
   
   **Replace with your actual Render URL from Phase 2**

3. **Test Production Build Locally**
   ```bash
   npm run build
   npm run preview
   ```
   
   **Must succeed with 0 TypeScript errors**

4. **Deploy to Vercel**
   
   **Option A: Vercel Dashboard (Recommended)**
   - Go to [vercel.com](https://vercel.com)
   - New Project → Import git repository
   - Framework: Vite
   - Root Directory: `sentinelai` (if monorepo) or `.`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Add Environment Variable:
     - `VITE_API_URL` = `https://your-backend-url.onrender.com`
   - Click Deploy

   **Option B: Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   # Follow prompts
   vercel env add VITE_API_URL production
   # Paste your backend URL
   vercel --prod
   ```

5. **Copy Frontend URL**
   
   Vercel provides: `https://your-app.vercel.app`

6. **Update Backend CORS**
   
   Go to Render Dashboard:
   - Your Service → Environment
   - Update `ALLOWED_ORIGINS`:
     ```
     https://your-app.vercel.app
     ```
   - Trigger Manual Deploy (to apply changes)

**✅ Phase 3 Complete** when:
- Frontend loads at Vercel URL
- Login page displays
- No CORS errors in browser console

📖 **Detailed Guide:** `DEPLOY_VERCEL.md`

---

## 🧪 Phase 4: Integration Testing

### **Test Checklist**

#### **1. Health Check** ✅
```bash
curl https://your-backend.onrender.com/health
```

Expected:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

#### **2. API Documentation** ✅

Visit: `https://your-backend.onrender.com/docs`

- Should display Swagger UI
- All endpoints listed
- Try "Authorize" button

#### **3. Frontend Load** ✅

Visit: `https://your-frontend.vercel.app`

**Check:**
- ✅ Page loads without errors
- ✅ Login form displays
- ✅ No console errors (F12 → Console)
- ✅ Network requests go to correct backend URL

#### **4. User Registration** ✅

1. Click "Register"
2. Fill form with test data:
   ```
   Name: Test User
   Email: test@example.com
   Username: testuser
   Phone: 1234567890
   Password: Test123!
   Role: Investigator
   Department: Cyber Cell
   ```
3. Submit

**Expected:** Success message or "Account pending approval"

#### **5. Admin Login** ✅

1. Login with admin credentials:
   ```
   Email: admin@sentinelai.gov.in
   Password: admin123
   ```
2. Should redirect to dashboard

**Check:**
- ✅ Dashboard loads
- ✅ Sidebar shows correct menu items
- ✅ User profile displays in top right
- ✅ No console errors

#### **6. User Approval (Admin)** ✅

1. Navigate to Administration → User Management
2. Find pending user
3. Approve the user
4. Logout

#### **7. Investigator Login** ✅

1. Login with test user credentials
2. Should redirect to investigator dashboard

**Check:**
- ✅ Different dashboard than admin
- ✅ Different sidebar menu
- ✅ Correct role-based access

#### **8. Case Management** ✅

1. Navigate to Cases
2. Click "Create Case"
3. Fill case details
4. Save

**Check:**
- ✅ Case created successfully
- ✅ Case appears in list
- ✅ Case number generated

#### **9. Evidence Upload** ✅

1. Open the created case
2. Navigate to Evidence tab
3. Upload a test file (PDF, image, etc.)

**Check:**
- ✅ File uploads successfully
- ✅ File appears in evidence list
- ✅ File can be downloaded

**⚠️ Note:** On free tier Render, uploaded files are lost on redeploy. For production, enable persistent disk or use S3.

#### **10. AI Features (CrimeGPT)** ✅

1. Navigate to CrimeGPT
2. Ask a question related to the case
3. Wait for response

**Check:**
- ✅ Message sent successfully
- ✅ AI responds (may take 5-10 seconds)
- ✅ Response displays correctly
- ✅ Conversation saved

#### **11. Report Generation** ✅

1. Open a case with evidence
2. Navigate to Reports → Investigation Report
3. Click "Generate Report"

**Check:**
- ✅ Report generates
- ✅ Export to PDF works
- ✅ Report contains case details

#### **12. Session & Logout** ✅

1. Logout from application
2. Try accessing protected route directly
3. Should redirect to login

---

## 🔍 Troubleshooting

### **Issue: CORS Error**

**Symptom:**
```
Access to XMLHttpRequest at 'https://backend.onrender.com/api' 
from origin 'https://frontend.vercel.app' has been blocked by CORS policy
```

**Solution:**
1. Update backend `ALLOWED_ORIGINS` in Render:
   ```
   https://your-frontend.vercel.app
   ```
2. Redeploy backend
3. Clear browser cache (Ctrl+Shift+Delete)
4. Test again

### **Issue: Database Connection Failed**

**Symptom:** Backend logs show `could not connect to database`

**Solution:**
1. Verify `DATABASE_URL` in Render environment variables
2. Ensure URL includes `?sslmode=require`
3. Check Neon database is active (may auto-suspend)
4. Test connection from Render Shell:
   ```bash
   python -c "from sqlalchemy import create_engine; import os; engine = create_engine(os.getenv('DATABASE_URL')); print(engine.connect())"
   ```

### **Issue: Frontend Shows Blank Page**

**Symptom:** Vercel deployment succeeds but page is blank

**Solution:**
1. Check browser console for errors
2. Verify `VITE_API_URL` is set in Vercel environment variables
3. Rebuild with correct environment variable:
   ```bash
   vercel --prod
   ```
4. Check Vercel deployment logs for build errors

### **Issue: File Upload Fails**

**Symptom:** Evidence upload returns 500 error

**Solution:**
1. Check Render logs for error details
2. Verify `UPLOAD_BASE_DIR` is set (default: `uploads`)
3. For production, consider:
   - Enable Render persistent disk
   - Or use cloud storage (S3, GCS, etc.)

### **Issue: Slow Performance on Free Tier**

**Symptom:** First request takes 30+ seconds

**Solution:**
- **Render Free Tier:** Sleeps after 15 minutes of inactivity
- **First request:** Wakes up the service (~30 seconds)
- **Options:**
  1. Upgrade to Starter plan ($7/mo) for always-on
  2. Use cron job to ping `/health` every 10 minutes
  3. Accept cold start delay for free tier

### **Issue: AI Not Responding**

**Symptom:** CrimeGPT queries timeout or error

**Solution:**
1. Verify `GEMINI_API_KEY` in Render environment variables
2. Check API key is valid: [Google AI Studio](https://ai.google.dev/)
3. Check Render logs for specific error
4. Verify API quota not exceeded

---

## 🔐 Security Hardening

### **Post-Deployment Security Checklist**

#### **1. Update Default Credentials** 🔒

Change default admin password immediately:
```bash
# Login as admin → Settings → Change Password
```

#### **2. Restrict CORS** 🔒

Update backend `ALLOWED_ORIGINS` to specific domains only:
```env
ALLOWED_ORIGINS=https://your-app.vercel.app,https://custom-domain.com
```

**Never use `*` in production!**

#### **3. Rotate Secret Key** 🔒

Generate a strong secret key:
```bash
openssl rand -hex 32
```

Update in Render environment variables.

#### **4. Enable HTTPS Only** 🔒

- ✅ Vercel: Automatic (always HTTPS)
- ✅ Render: Automatic (always HTTPS)
- ✅ Neon: Automatic (SSL required)

#### **5. Configure Security Headers** 🔒

Add to `backend/app/main.py`:
```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["your-backend.onrender.com", "*.vercel.app"]
)
```

#### **6. Rate Limiting** 🔒 (Recommended)

Install:
```bash
pip install slowapi
```

Add to `main.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/auth/login")
@limiter.limit("5/minute")
async def login(...):
    ...
```

#### **7. Environment Variables Audit** 🔒

**Never commit these to git:**
- ❌ `DATABASE_URL`
- ❌ `SECRET_KEY`
- ❌ `GEMINI_API_KEY`
- ❌ Any API keys or credentials

**Verify `.gitignore` includes:**
```gitignore
.env
.env.local
.env.production
*.env
```

#### **8. Database Backup** 🔒

Set up automated backups:
- Neon free tier: 7-day backup retention
- Consider manual exports for critical data:
  ```bash
  pg_dump "postgresql://..." > backup_$(date +%Y%m%d).sql
  ```

---

## 📊 Monitoring & Alerts

### **Set Up Monitoring**

#### **Render Monitoring**
1. Go to your service → Settings
2. Health Check Path: `/health`
3. Enable email alerts for:
   - Service down
   - High memory usage
   - High CPU usage

#### **Vercel Monitoring**
1. Enable Vercel Analytics (free tier: 100k data points/month)
2. Monitor:
   - Page load time
   - Core Web Vitals
   - Error rates

#### **Database Monitoring (Neon)**
1. Dashboard → Overview
2. Monitor:
   - Storage usage (0.5 GB limit on free tier)
   - Connection count
   - Query performance

### **Error Tracking (Optional)**

Integrate services like:
- **Sentry** (for error tracking)
- **LogRocket** (for session replay)
- **Datadog** (for full-stack monitoring)

---

## 💰 Cost Summary

### **Free Tier (Total: $0/month)**

| Service | Free Tier | Limits |
|---------|-----------|--------|
| **Neon** | $0 | 0.5 GB storage, 3 GB transfer/month |
| **Render** | $0 | 750 hours/month, sleeps after 15 min |
| **Vercel** | $0 | 100 GB bandwidth, 6000 build minutes |
| **Total** | **$0** | Good for testing and low-traffic apps |

**Limitations:**
- Backend sleeps after 15 minutes (30s cold start)
- Limited storage and bandwidth
- No persistent disk on Render

### **Production Tier (Total: $27/month)**

| Service | Plan | Cost/Month | Benefits |
|---------|------|------------|----------|
| **Neon** | Pro | $10 | 10 GB storage, no compute limits |
| **Render** | Starter | $7 | Always on, 100 GB bandwidth |
| **Render Disk** | 10 GB | $10 | Persistent file storage |
| **Vercel** | Free | $0 | Sufficient for most apps |
| **Total** | | **$27** | Production-ready |

### **Enterprise Tier (Total: $100+/month)**

- Neon Scale: $40+
- Render Standard: $25+
- Vercel Pro: $20/seat
- Additional monitoring tools

---

## 🚀 Post-Deployment Checklist

### **Immediately After Deployment**

- ✅ Change default admin password
- ✅ Test all critical user flows
- ✅ Verify CORS configured correctly
- ✅ Check all environment variables
- ✅ Enable monitoring and alerts
- ✅ Document production URLs
- ✅ Set up automated backups

### **Within First Week**

- ✅ Monitor error rates and performance
- ✅ Test under realistic load
- ✅ Create user documentation
- ✅ Set up support channels
- ✅ Plan upgrade path if needed

### **Ongoing**

- ✅ Regular database backups
- ✅ Monitor cost and usage
- ✅ Update dependencies regularly
- ✅ Review security logs
- ✅ Gather user feedback

---

## 📖 Quick Reference

### **Production URLs**

```
Frontend:  https://your-app.vercel.app
Backend:   https://your-backend.onrender.com
API Docs:  https://your-backend.onrender.com/docs
Database:  ep-xxx.region.aws.neon.tech (via backend only)
```

### **Admin Credentials**

```
Email:    admin@sentinelai.gov.in
Password: [Change immediately after deployment]
```

### **Essential Commands**

```bash
# Local testing
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev

# Production build
cd frontend && npm run build && npm run preview

# Database migrations
cd backend && alembic upgrade head

# Deploy
vercel --prod
# Render auto-deploys on git push
```

---

## 🎉 Congratulations!

Your CrimeGPT application is now live in production! 🚀

### **What You've Achieved:**

✅ **Fully functional web application**
- React frontend with TypeScript
- FastAPI backend with Python
- PostgreSQL database

✅ **Production-grade deployment**
- Global CDN (Vercel)
- Scalable backend (Render)
- Serverless database (Neon)

✅ **Enterprise features**
- Role-based access control
- User management
- Case management
- Evidence handling
- AI-powered investigation
- Report generation

✅ **Security hardened**
- HTTPS everywhere
- JWT authentication
- CORS configured
- Environment variables secured

### **Next Steps:**

1. **Announce to stakeholders** 📢
2. **Onboard first users** 👥
3. **Gather feedback** 💬
4. **Monitor performance** 📊
5. **Plan enhancements** 🚀

---

## 📞 Support & Resources

### **Platform Documentation**
- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Neon Docs](https://neon.tech/docs)

### **Detailed Deployment Guides**
- `DEPLOY_VERCEL.md` - Frontend deployment
- `DEPLOY_RENDER.md` - Backend deployment
- `DEPLOY_NEON.md` - Database setup

### **Development Guides**
- `README.md` - Project overview
- `AUTHENTICATION_SUMMARY.md` - Auth system
- `ALL_PHASES_COMPLETE_FINAL.md` - Development history

---

**Last Updated:** Phase 5 - Deployment Preparation Complete

**Status:** ✅ Production Ready

**Version:** 1.0.0
