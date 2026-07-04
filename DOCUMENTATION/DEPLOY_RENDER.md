# 🚀 Deploy Backend to Render

This guide walks you through deploying the **CrimeGPT Backend** (FastAPI + Python) to Render.

---

## 📋 Prerequisites

- ✅ Render account (free tier works for testing)
- ✅ GitHub/GitLab repository containing the backend code
- ✅ PostgreSQL database ready (see `DEPLOY_NEON.md`)
- ✅ Python 3.11+ installed locally
- ✅ Gemini API key for AI features

---

## 🎯 Deployment Steps

### **Step 1: Prepare Your Backend**

Navigate to your backend directory:
```bash
cd backend
```

### **Step 2: Create `requirements.txt`**

Ensure all dependencies are listed:
```bash
pip freeze > requirements.txt
```

Verify essential packages are included:
- `fastapi`
- `uvicorn[standard]`
- `sqlalchemy`
- `psycopg2-binary` (for PostgreSQL)
- `python-jose[cryptography]`
- `passlib[bcrypt]`
- `python-multipart`
- `python-dotenv`
- `alembic`

### **Step 3: Create `render.yaml` (Optional but Recommended)**

Create a `render.yaml` file in the backend root:

```yaml
services:
  - type: web
    name: crimegpt-backend
    env: python
    region: oregon
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        sync: false
      - key: SECRET_KEY
        generateValue: true
      - key: AI_PROVIDER
        value: gemini
      - key: GEMINI_API_KEY
        sync: false
      - key: GEMINI_MODEL
        value: gemini-2.5-flash
      - key: ALLOWED_ORIGINS
        sync: false
```

### **Step 4: Push to Git Repository**

Commit and push your backend code:
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### **Step 5: Deploy to Render**

#### **Create New Web Service**

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your git repository
4. Configure your service:

**Basic Settings:**
- **Name:** `crimegpt-backend`
- **Region:** Oregon (or closest to your users)
- **Branch:** `main`
- **Root Directory:** `backend` (if in monorepo) or leave empty
- **Runtime:** Python 3
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

**Instance Type:**
- Free tier: Good for testing, sleeps after 15 minutes of inactivity
- Starter ($7/mo): Always on, better performance

#### **Configure Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

Add the following variables:

| Key | Value | Notes |
|-----|-------|-------|
| `DATABASE_URL` | `postgresql://user:pass@host/db?sslmode=require` | Get from Neon (see DEPLOY_NEON.md) |
| `SECRET_KEY` | Generate a strong random string | Use: `openssl rand -hex 32` |
| `AI_PROVIDER` | `gemini` | |
| `GEMINI_API_KEY` | Your Gemini API key | Get from Google AI Studio |
| `GEMINI_MODEL` | `gemini-2.5-flash` | |
| `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Your frontend URL |
| `PYTHON_VERSION` | `3.11.0` | (optional) |

**⚠️ Important:** 
- Ensure `DATABASE_URL` includes `?sslmode=require` for Neon
- Use commas to separate multiple origins: `https://app1.com,https://app2.com`

### **Step 6: Deploy**

Click **"Create Web Service"**

Render will:
1. Clone your repository
2. Install dependencies
3. Start your FastAPI application
4. Provide a public URL: `https://your-app.onrender.com`

---

## ✅ Post-Deployment Verification

### **1. Check Health Endpoint**

```bash
curl https://your-app.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### **2. Access API Documentation**

Visit: `https://your-app.onrender.com/docs`

You should see the Swagger UI with all endpoints.

### **3. Test Authentication**

```bash
curl -X POST https://your-app.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sentinelai.gov.in",
    "password": "admin123"
  }'
```

### **4. Check Logs**

In Render Dashboard:
1. Go to your service
2. Click **"Logs"** tab
3. Verify no startup errors

### **5. Run Database Migrations**

Connect to Render Shell:
1. Go to your service in Render Dashboard
2. Click **"Shell"** tab
3. Run migrations:
```bash
alembic upgrade head
```

---

## 🔧 Troubleshooting

### **Issue: Database Connection Failed**

**Symptom:** `sqlalchemy.exc.OperationalError: could not connect to server`

**Solution:**
1. Verify `DATABASE_URL` in environment variables
2. Ensure URL includes `?sslmode=require` for Neon
3. Check Neon database is active (may have auto-paused on free tier)

### **Issue: Module Not Found**

**Symptom:** `ModuleNotFoundError: No module named 'fastapi'`

**Solution:**
1. Verify `requirements.txt` includes all dependencies
2. Check build logs for installation errors
3. Try manual deploy:
   ```bash
   pip install -r requirements.txt
   ```

### **Issue: CORS Error**

**Symptom:** Frontend cannot connect to backend

**Solution:**
1. Verify `ALLOWED_ORIGINS` environment variable
2. Ensure frontend URL matches exactly (no trailing slash)
3. Redeploy after updating environment variables

### **Issue: Application Crashes on Startup**

**Symptom:** Service shows "Deploying..." forever or crashes

**Solution:**
1. Check logs in Render Dashboard
2. Verify start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Ensure `app/main.py` exists and has `app = FastAPI()`

### **Issue: Free Tier Sleeps**

**Symptom:** First request takes 30+ seconds

**Solution:**
1. Free tier sleeps after 15 minutes of inactivity
2. Upgrade to Starter plan ($7/mo) for always-on service
3. Use a cron job to ping `/health` every 10 minutes (keeps it awake)

---

## 🔄 Redeployment

### **Automatic Redeployment**

Render automatically redeploys when you push to your main branch.

### **Manual Redeployment**

1. Go to Render Dashboard → Your Service
2. Click **"Manual Deploy"** → **"Clear build cache & deploy"**

### **Rollback**

1. Go to **"Events"** tab
2. Find the last stable deployment
3. Click **"Rollback to this deploy"**

---

## 🌐 Custom Domain (Optional)

### **Add Custom Domain**

1. Go to Render Dashboard → Your Service → Settings
2. Scroll to **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain (e.g., `api.crimegpt.com`)
5. Add CNAME record to your DNS:
   - **Type:** CNAME
   - **Name:** `api` (or your subdomain)
   - **Value:** `your-app.onrender.com`
6. Wait for SSL certificate provisioning (automatic)

### **Update Frontend**

Update frontend `.env`:
```env
VITE_API_URL=https://api.crimegpt.com
```

Redeploy frontend on Vercel.

---

## 📊 Performance Optimization

### **Enable Persistent Disk (Paid Plan)**

For file uploads:
1. Go to Settings → Disks
2. Add persistent disk
3. Mount path: `/app/uploads`
4. Update environment variable: `UPLOAD_BASE_DIR=/app/uploads`

### **Database Connection Pool**

In `database.py`, optimize pool size:
```python
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10
)
```

### **Enable Compression**

Add middleware in `main.py`:
```python
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

---

## 📝 Environment Variables Reference

| Variable | Required | Example | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | `postgresql://user:pass@host/db?sslmode=require` | PostgreSQL connection string |
| `SECRET_KEY` | ✅ Yes | `abc123...` | JWT signing key (use `openssl rand -hex 32`) |
| `AI_PROVIDER` | ✅ Yes | `gemini` | AI service provider |
| `GEMINI_API_KEY` | ✅ Yes | `AIza...` | Gemini API key |
| `GEMINI_MODEL` | ❌ No | `gemini-2.5-flash` | Gemini model version |
| `ALLOWED_ORIGINS` | ✅ Yes | `https://app.vercel.app` | Frontend CORS origins |
| `UPLOAD_BASE_DIR` | ❌ No | `/app/uploads` | File upload directory |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ❌ No | `30` | JWT expiration time |

---

## 🔐 Security Checklist

- ✅ HTTPS enabled (automatic on Render)
- ✅ Strong `SECRET_KEY` generated
- ✅ Database connection uses SSL (`sslmode=require`)
- ✅ CORS restricted to specific origins
- ✅ Environment variables stored securely
- ✅ No secrets in code or git repository
- ✅ API rate limiting configured (optional but recommended)

---

## 🚨 Monitoring & Alerts

### **Set Up Alerts**

1. Go to Render Dashboard → Your Service → Settings
2. Scroll to **"Health Check Path"**
3. Set to `/health`
4. Configure email alerts for:
   - Service down
   - High memory usage
   - High CPU usage

### **View Metrics**

1. Go to **"Metrics"** tab
2. Monitor:
   - Request rate
   - Response time
   - Memory usage
   - CPU usage

---

## 💰 Cost Optimization

### **Free Tier Limits**

- ✅ 750 hours/month (enough for 1 service running 24/7)
- ✅ Sleeps after 15 minutes of inactivity
- ✅ 100 GB bandwidth/month
- ❌ No persistent disk
- ❌ Slower cold starts (30+ seconds)

### **Starter Plan ($7/mo)**

- ✅ Always on (no sleep)
- ✅ 100 GB bandwidth
- ✅ Faster performance
- ✅ 10 GB persistent disk (optional +$1/mo per GB)

---

## 📞 Support

**Render Documentation:** https://render.com/docs

**Common Issues:**
- Build logs: Dashboard → Logs → Build
- Runtime logs: Dashboard → Logs → Runtime
- Shell access: Dashboard → Shell
- Environment variables: Dashboard → Environment

---

## ✅ Deployment Complete!

Your CrimeGPT backend is now live on Render! 🎉

**Next Steps:**
1. Test all API endpoints
2. Run database migrations
3. Create admin user if needed
4. Configure custom domain (optional)
5. Set up monitoring and alerts
6. Update frontend `VITE_API_URL` to point to this backend

**Production API URL:** `https://your-app.onrender.com`

**API Documentation:** `https://your-app.onrender.com/docs`

---

**Last Updated:** Phase 5 Deployment Preparation
