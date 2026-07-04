# 🗄️ Deploy Database to Neon PostgreSQL

This guide walks you through setting up a **PostgreSQL database on Neon** for CrimeGPT.

---

## 📋 What is Neon?

**Neon** is a serverless PostgreSQL database service that offers:
- ✅ Generous free tier (0.5 GB storage, 3 GB data transfer)
- ✅ Automatic scaling
- ✅ Instant branching for development
- ✅ Built-in connection pooling
- ✅ SSL/TLS encryption
- ✅ Compatible with standard PostgreSQL tools

**Free Tier Limits:**
- 1 project
- 10 branches
- 0.5 GB storage per branch
- 3 GB data transfer/month
- Compute auto-suspends after 5 minutes of inactivity

---

## 🎯 Setup Steps

### **Step 1: Create Neon Account**

1. Go to [neon.tech](https://neon.tech)
2. Sign up with GitHub, Google, or email
3. Verify your email address

### **Step 2: Create a New Project**

1. Click **"New Project"**
2. Configure your project:
   - **Project Name:** `crimegpt` (or your preferred name)
   - **Region:** US East (Ohio) or closest to your users
   - **PostgreSQL Version:** 16 (latest)
   - **Compute Size:** 0.25 vCPU, 1 GB RAM (free tier)
3. Click **"Create Project"**

### **Step 3: Get Connection String**

After creating the project, Neon displays your connection details.

**Connection String Format:**
```
postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require
```

**Example:**
```
postgresql://crimegpt_owner:AbCd1234XyZ@ep-cool-hill-12345.us-east-2.aws.neon.tech/crimegpt?sslmode=require
```

**⚠️ Important Notes:**
- ✅ Connection string includes `?sslmode=require` (mandatory for Neon)
- ✅ Password is auto-generated (copy it immediately)
- ✅ Endpoint format: `ep-xxx-xxx-xxxxx.region.aws.neon.tech`
- ✅ Default database name matches project name

### **Step 4: Save Connection Details**

Copy the following information:

| Field | Example | Your Value |
|-------|---------|------------|
| **Host** | `ep-cool-hill-12345.us-east-2.aws.neon.tech` | |
| **Database** | `crimegpt` | |
| **User** | `crimegpt_owner` | |
| **Password** | `AbCd1234XyZ` | |
| **Port** | `5432` | |
| **Connection String** | `postgresql://...` | |

---

## 🔧 Configure Backend

### **Step 1: Update Backend `.env`**

Navigate to your backend directory and update `.env`:

```bash
cd backend
```

Edit `.env`:
```env
DATABASE_URL=postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require
SECRET_KEY=your-secret-key-here
AI_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key-here
GEMINI_MODEL=gemini-2.5-flash
ALLOWED_ORIGINS=http://localhost:5173
```

Replace `[user]`, `[password]`, `[endpoint]`, and `[database]` with your Neon details.

### **Step 2: Test Connection Locally**

Create a test script `test_db_connection.py`:

```python
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"✅ Database connected successfully!")
        print(f"PostgreSQL version: {version}")
except Exception as e:
    print(f"❌ Database connection failed: {e}")
```

Run the test:
```bash
python test_db_connection.py
```

Expected output:
```
✅ Database connected successfully!
PostgreSQL version: PostgreSQL 16.x on x86_64-pc-linux-gnu...
```

---

## 🚀 Run Database Migrations

### **Step 1: Initialize Alembic (if not already done)**

If `alembic/` folder doesn't exist:
```bash
alembic init alembic
```

### **Step 2: Configure Alembic**

Edit `alembic/env.py`:

```python
import os
from dotenv import load_dotenv

load_dotenv()

# Import your Base model
from app.database.models import Base
target_metadata = Base.metadata

# Set database URL from environment
config.set_main_option("sqlalchemy.url", 
    os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/crimegpt"))
```

### **Step 3: Create Initial Migration**

Generate migration from models:
```bash
alembic revision --autogenerate -m "Initial migration"
```

### **Step 4: Apply Migrations**

Apply all migrations to Neon database:
```bash
alembic upgrade head
```

Expected output:
```
INFO  [alembic.runtime.migration] Running upgrade -> abc123, Initial migration
```

### **Step 5: Verify Tables**

Check that tables were created:

```python
# verify_tables.py
import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
inspector = inspect(engine)

tables = inspector.get_table_names()
print(f"✅ Found {len(tables)} tables:")
for table in tables:
    print(f"  - {table}")
```

Run:
```bash
python verify_tables.py
```

Expected output:
```
✅ Found 8 tables:
  - users
  - cases
  - evidence
  - entities
  - notes
  - audit_logs
  - user_preferences
  - alembic_version
```

---

## 👤 Create Admin User

### **Option A: Using Python Script**

Create `create_admin.py`:

```python
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

from app.database.models import UserDB

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

admin = UserDB(
    user_id="admin-001",
    full_name="System Administrator",
    email="admin@sentinelai.gov.in",
    username="admin",
    phone="0000000000",
    hashed_password=pwd_context.hash("admin123"),
    role="admin",
    department="Administration",
    account_status="active"
)

try:
    db.add(admin)
    db.commit()
    print("✅ Admin user created successfully!")
    print(f"Email: {admin.email}")
    print(f"Password: admin123")
except Exception as e:
    db.rollback()
    print(f"❌ Error: {e}")
finally:
    db.close()
```

Run:
```bash
python create_admin.py
```

### **Option B: Using Neon SQL Editor**

1. Go to Neon Dashboard → Your Project → SQL Editor
2. Run this SQL:

```sql
-- Note: You'll need to hash the password separately
INSERT INTO users (
    user_id,
    full_name,
    email,
    username,
    phone,
    hashed_password,
    role,
    department,
    account_status,
    created_at
) VALUES (
    'admin-001',
    'System Administrator',
    'admin@sentinelai.gov.in',
    'admin',
    '0000000000',
    '$2b$12$[bcrypt-hash-here]',  -- Use Python script for this
    'admin',
    'Administration',
    'active',
    NOW()
);
```

---

## 🔍 Monitor Database

### **Neon Dashboard Features**

1. **Overview Tab:**
   - Storage usage
   - Compute time
   - Data transfer
   - Connection count

2. **SQL Editor Tab:**
   - Run SQL queries directly
   - View table data
   - Manage schema

3. **Branches Tab:**
   - Create development branches
   - Test migrations safely
   - Merge changes

4. **Settings Tab:**
   - Connection pooling
   - Auto-suspend settings
   - Delete protection

### **Query Active Connections**

In SQL Editor:
```sql
SELECT 
    datname,
    usename,
    application_name,
    state,
    query_start
FROM pg_stat_activity
WHERE datname = 'crimegpt';
```

### **Check Table Sizes**

```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🔄 Backup & Restore

### **Create Backup**

```bash
pg_dump "postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require" > backup.sql
```

### **Restore from Backup**

```bash
psql "postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require" < backup.sql
```

### **Automated Backups**

Neon automatically creates:
- ✅ Daily backups (retained for 7 days on free tier)
- ✅ Point-in-time recovery (paid plans)

---

## 🌿 Development Branches

### **Why Use Branches?**

Branches let you:
- Test migrations safely
- Develop features in isolation
- Run CI/CD tests without affecting production

### **Create a Branch**

1. Go to Neon Dashboard → Branches
2. Click **"Create Branch"**
3. Configure:
   - **Branch Name:** `development`
   - **Parent:** `main`
   - **Type:** Copy latest data
4. Click **"Create"**

### **Use Branch in Development**

Update local `.env`:
```env
DATABASE_URL=postgresql://[user]:[password]@[branch-endpoint]/[database]?sslmode=require
```

### **Merge Branch (Manual)**

1. Test thoroughly on branch
2. Apply same migrations to `main` branch
3. Delete branch when done

---

## 🔧 Troubleshooting

### **Issue: Connection Timeout**

**Symptom:** `could not connect to server: Connection timed out`

**Solution:**
1. Check if database is active (may auto-suspend on free tier)
2. First connection after suspend takes 1-2 seconds
3. Verify `?sslmode=require` is in connection string

### **Issue: Password Authentication Failed**

**Symptom:** `FATAL: password authentication failed for user`

**Solution:**
1. Reset password in Neon Dashboard → Settings → Reset Password
2. Update `DATABASE_URL` with new password
3. Ensure no special characters are URL-encoded

### **Issue: SSL Required**

**Symptom:** `SSL connection is required`

**Solution:**
Add `?sslmode=require` to connection string:
```
postgresql://user:pass@host/db?sslmode=require
```

### **Issue: Connection Pool Exhausted**

**Symptom:** `remaining connection slots are reserved`

**Solution:**
1. Enable connection pooling in `database.py`:
   ```python
   engine = create_engine(
       DATABASE_URL,
       pool_pre_ping=True,
       pool_size=5,
       max_overflow=10,
       pool_recycle=3600
   )
   ```
2. Use Neon's built-in connection pooler (Settings → Connection Pooling)

---

## 💡 Best Practices

### **Security**

- ✅ Never commit `DATABASE_URL` to git
- ✅ Use strong passwords (Neon auto-generates)
- ✅ Always use `sslmode=require`
- ✅ Restrict IP access if possible (paid plans)
- ✅ Rotate passwords regularly

### **Performance**

- ✅ Use connection pooling
- ✅ Create indexes on frequently queried columns
- ✅ Use prepared statements (SQLAlchemy does this)
- ✅ Monitor query performance in Neon Dashboard

### **Cost Optimization**

- ✅ Free tier auto-suspends compute after 5 minutes
- ✅ Use branches for development/testing
- ✅ Monitor storage usage (0.5 GB limit on free tier)
- ✅ Clean up old data periodically

---

## 📊 Monitoring Queries

### **Slow Query Log**

In SQL Editor:
```sql
SELECT
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### **Table Statistics**

```sql
SELECT
    schemaname,
    tablename,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables;
```

---

## 🚀 Production Checklist

- ✅ Database created on Neon
- ✅ Connection string saved securely
- ✅ Backend `.env` updated
- ✅ Connection tested locally
- ✅ Migrations applied successfully
- ✅ Tables created and verified
- ✅ Admin user created
- ✅ Indexes created on key columns
- ✅ Backups configured
- ✅ Monitoring enabled

---

## 📞 Support

**Neon Documentation:** https://neon.tech/docs/introduction

**Community:**
- Discord: https://discord.gg/neon
- GitHub: https://github.com/neondatabase/neon

---

## ✅ Database Setup Complete!

Your CrimeGPT database is now live on Neon PostgreSQL! 🎉

**Next Steps:**
1. Update backend environment variables
2. Deploy backend to Render (see `DEPLOY_RENDER.md`)
3. Test API endpoints
4. Create initial admin user
5. Monitor database performance

**Connection String:** (Keep this secure!)
```
postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require
```

---

**Last Updated:** Phase 5 Deployment Preparation
