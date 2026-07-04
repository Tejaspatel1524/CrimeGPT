# 🚀 CrimeGPT - Quick Deploy Reference

**One-page deployment guide for experienced developers**

---

## 📦 What You Need

- GitHub/GitLab repo
- Neon account (database)
- Render account (backend)
- Vercel account (frontend)
- Gemini API key

---

## 🗄️ 1. Database (Neon) - 5 min

```bash
# 1. Create project at neon.tech
# 2. Copy connection string (includes ?sslmode=require)
# 3. Run migrations
cd backend
alembic upgrade head

# 4. Create admin user
python create_admin.py
```

---

## 🔧 2. Backend (Render) - 10 min

**Create Web Service:**
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Root: `backend/` (if monorepo)

**Environment Variables:**
```env
DATABASE_URL=postgresql://...?sslmode=require  # From Neon
SECRET_KEY=<openssl rand -hex 32>              # Generate this
AI_PROVIDER=gemini
GEMINI_API_KEY=<your-key>                      # From ai.google.dev
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=*                              # Update after frontend deploy
```

**Verify:**
```bash
curl https://your-app.onrender.com/health
curl https://your-app.onrender.com/docs
```

---

## 🌐 3. Frontend (Vercel) - 5 min

**Local Setup:**
```bash
cd sentinelai
cp .env.example .env
```

**Edit `.env`:**
```env
VITE_API_URL=https://your-backend.onrender.com
```

**Test Build:**
```bash
npm run build
npm run preview
```

**Deploy to Vercel:**
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Root: `sentinelai/` (if monorepo)

**Add Environment Variable:**
- Key: `VITE_API_URL`
- Value: `https://your-backend.onrender.com`

---

## 🔄 4. Final Config Update

**Update Backend CORS:**

In Render Dashboard → Environment:
```env
ALLOWED_ORIGINS=https://your-app.vercel.app
```

Redeploy backend.

---

## ✅ 5. Quick Test

1. Visit `https://your-app.vercel.app`
2. Login: `admin@sentinelai.gov.in` / `admin123`
3. Change password immediately
4. Test case creation
5. Test evidence upload

---

## 🔒 Security Checklist

- ✅ Change default admin password
- ✅ Set strong `SECRET_KEY`
- ✅ Update `ALLOWED_ORIGINS` to specific domain
- ✅ Verify HTTPS on all services
- ✅ Verify database uses SSL

---

## 💰 Cost

**Free Tier:** $0/month
- Neon: 0.5 GB storage
- Render: Sleeps after 15 min
- Vercel: 100 GB bandwidth

**Production Tier:** $27/month
- Neon Pro: $10
- Render Starter: $7 (always on)
- Render Disk: $10 (persistent files)

---

## 🚨 Common Issues

**CORS Error:**
- Update `ALLOWED_ORIGINS` in Render
- Redeploy backend

**Database Connection Failed:**
- Verify `?sslmode=require` in connection string
- Check Neon database is active

**Backend Sleeps (Free Tier):**
- First request takes ~30s to wake up
- Upgrade to Starter ($7/mo) for always-on

**File Upload Lost on Redeploy:**
- Enable Render persistent disk ($10/mo)
- Or use S3/GCS

---

## 📖 Detailed Guides

- `DEPLOYMENT_MASTER_GUIDE.md` - Complete guide
- `DEPLOY_NEON.md` - Database details
- `DEPLOY_RENDER.md` - Backend details
- `DEPLOY_VERCEL.md` - Frontend details

---

## 🎉 Done!

**Your URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend: `https://your-backend.onrender.com`
- API Docs: `https://your-backend.onrender.com/docs`

---

**Total Time:** ~20 minutes  
**Difficulty:** Easy  
**Status:** Production Ready ✅
