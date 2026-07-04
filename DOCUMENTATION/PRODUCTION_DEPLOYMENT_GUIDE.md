# SentinelAI - Production Deployment Guide

**Version**: 1.0.0  
**Last Updated**: July 3, 2026  
**Status**: Production-Ready ✅

---

## Pre-Deployment Checklist

### 1. Environment Configuration

#### Backend `.env` File:
```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/sentinelai_prod

# Security
SECRET_KEY=<GENERATE_STRONG_KEY_HERE>  # MUST CHANGE FROM DEFAULT!
ALGORITHM=HS256

# API Keys
GOOGLE_API_KEY=<YOUR_GEMINI_API_KEY>

# Email (Optional - for password reset)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=<YOUR_SENDGRID_API_KEY>
EMAIL_FROM=noreply@sentinelai.gov.in

# Environment
ENVIRONMENT=production
DEBUG=false
```

#### Frontend `.env`:
```env
VITE_API_BASE_URL=https://api.sentinelai.gov.in
VITE_APP_ENV=production
```

### 2. Security Hardening

✅ **Required Actions**:
```bash
# Generate strong SECRET_KEY (Python)
python -c "import secrets; print(secrets.token_urlsafe(64))"

# Update CORS origins in main.py
allow_origins=["https://sentinelai.gov.in"]  # Remove "*"

# Enable HTTPS only
# Set secure cookie flags in production
```

### 3. Database Setup

```bash
# Run migrations
cd backend
alembic upgrade head

# Create admin user
python create_admin_user.py
```

### 4. Build Frontend

```bash
cd sentinelai
npm run build
# Output: dist/ folder ready for deployment
```

---

## Deployment Options

### Option 1: Docker Deployment (Recommended)

#### Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: sentinelai_prod
      POSTGRES_USER: sentinelai
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - sentinelai_network

  backend:
    build: ./backend
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
    environment:
      DATABASE_URL: postgresql://sentinelai:${DB_PASSWORD}@postgres:5432/sentinelai_prod
      SECRET_KEY: ${SECRET_KEY}
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
    depends_on:
      - postgres
    networks:
      - sentinelai_network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./sentinelai/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend
    networks:
      - sentinelai_network

volumes:
  postgres_data:

networks:
  sentinelai_network:
```

#### Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Option 2: Manual Deployment

#### Backend (Ubuntu/Debian):
```bash
# Install dependencies
sudo apt update
sudo apt install python3.11 python3-pip nginx postgresql

# Setup backend
cd backend
pip install -r requirements.txt
alembic upgrade head

# Run with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

#### Frontend (Nginx):
```bash
# Copy build to nginx
sudo cp -r sentinelai/dist/* /var/www/sentinelai/

# Configure nginx
sudo nano /etc/nginx/sites-available/sentinelai
```

**Nginx Config**:
```nginx
server {
    listen 80;
    server_name sentinelai.gov.in;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name sentinelai.gov.in;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # Frontend
    location / {
        root /var/www/sentinelai;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## Post-Deployment Verification

### 1. Health Checks

```bash
# Backend health
curl https://api.sentinelai.gov.in/health
# Expected: {"status":"ok"}

# Frontend
curl https://sentinelai.gov.in
# Expected: HTML content

# Database connectivity
curl https://api.sentinelai.gov.in/docs
# Expected: Swagger UI
```

### 2. Authentication Test

```bash
# Register test user
curl -X POST https://api.sentinelai.gov.in/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test Officer",
    "email": "test@example.com",
    "password": "TestPass123!",
    "role": "investigator"
  }'

# Login
curl -X POST https://api.sentinelai.gov.in/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!"
  }'
```

### 3. Performance Test

```bash
# Test response times
ab -n 1000 -c 10 https://sentinelai.gov.in/
# Target: < 500ms average

# Test API
ab -n 100 -c 5 https://api.sentinelai.gov.in/health
# Target: < 100ms average
```

---

## Monitoring Setup

### 1. Application Monitoring

**Recommended**: Sentry for error tracking

```python
# backend/app/main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastAPIIntegration

if os.getenv("ENVIRONMENT") == "production":
    sentry_sdk.init(
        dsn="YOUR_SENTRY_DSN",
        integrations=[FastAPIIntegration()],
        traces_sample_rate=0.1,
    )
```

### 2. Log Management

```python
# backend/app/main.py
import logging
from logging.handlers import RotatingFileHandler

if os.getenv("ENVIRONMENT") == "production":
    handler = RotatingFileHandler(
        'logs/sentinelai.log',
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    logging.basicConfig(
        handlers=[handler],
        level=logging.INFO,
        format='%(asctime)s %(levelname)s: %(message)s'
    )
```

### 3. Uptime Monitoring

**Recommended**: UptimeRobot or Pingdom

```
Monitor URLs:
- https://sentinelai.gov.in (frontend)
- https://api.sentinelai.gov.in/health (backend)

Check interval: 5 minutes
Alert on: 2 consecutive failures
```

---

## Backup Strategy

### Database Backups

```bash
# Daily automated backup script
#!/bin/bash
BACKUP_DIR=/backups/sentinelai
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="sentinelai_prod_$DATE.sql"

pg_dump -U sentinelai sentinelai_prod > "$BACKUP_DIR/$FILENAME"
gzip "$BACKUP_DIR/$FILENAME"

# Keep last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/$FILENAME.gz" s3://sentinelai-backups/
```

**Cron Job**:
```bash
# Run daily at 2 AM
0 2 * * * /opt/scripts/backup_sentinelai.sh
```

### File Backups

```bash
# Evidence files
rsync -av /var/sentinelai/evidence/ /backups/evidence/
```

---

## Scaling Recommendations

### Current Capacity:
- **Users**: 100-500 concurrent
- **Cases**: 10,000+
- **Evidence**: 100GB+

### Horizontal Scaling:

```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 4  # Scale backend instances
      
  postgres:
    # Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
    # Enable read replicas
```

### Performance Optimization:

1. **Redis Cache**:
```python
# Cache dashboard statistics
from redis import Redis
cache = Redis(host='localhost', port=6379, decode_responses=True)

@router.get("/stats/dashboard")
def dashboard_stats(db: Session = Depends(get_db)):
    cached = cache.get("dashboard_stats")
    if cached:
        return json.loads(cached)
    
    stats = compute_stats(db)
    cache.setex("dashboard_stats", 300, json.dumps(stats))  # 5 min TTL
    return stats
```

2. **CDN for Static Assets**:
- Use CloudFlare or AWS CloudFront
- Serve `dist/assets/*` from CDN

3. **Database Indexing**:
```sql
-- Already present, but verify in production:
CREATE INDEX idx_cases_owner_id ON cases(owner_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_archived ON cases(archived);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

---

## Security Best Practices

### 1. API Rate Limiting

```python
# backend/app/main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(429, _rate_limit_exceeded_handler)

# Apply to sensitive endpoints
@router.post("/auth/login")
@limiter.limit("5/minute")
def login(...):
    ...
```

### 2. Security Headers

```python
# backend/app/main.py
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["sentinelai.gov.in"])
app.add_middleware(HTTPSRedirectMiddleware)

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000"
    return response
```

### 3. Database Connection Pooling

```python
# backend/app/database/database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

---

## Troubleshooting

### Issue: High CPU Usage

**Solution**:
```bash
# Check backend processes
ps aux | grep uvicorn

# Monitor resource usage
htop

# Scale backend instances
docker-compose up -d --scale backend=4
```

### Issue: Slow Database Queries

**Solution**:
```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000;  -- Log queries > 1s

-- Analyze slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_cases_created_at ON cases(created_at);
```

### Issue: JWT Token Expiry Issues

**Solution**:
```python
# Increase token expiry in production
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
ACCESS_TOKEN_EXPIRE_REMEMBER = 60 * 24 * 90  # 90 days
```

---

## Rollback Procedure

### If deployment fails:

```bash
# 1. Rollback database migrations
alembic downgrade -1

# 2. Restore previous Docker images
docker-compose -f docker-compose.prod.yml down
docker pull sentinelai/backend:previous-tag
docker pull sentinelai/frontend:previous-tag
docker-compose -f docker-compose.prod.yml up -d

# 3. Restore database from backup
gunzip /backups/sentinelai/sentinelai_prod_YYYYMMDD.sql.gz
psql -U sentinelai sentinelai_prod < /backups/sentinelai/sentinelai_prod_YYYYMMDD.sql
```

---

## Support & Maintenance

### Regular Maintenance Tasks:

**Weekly**:
- [ ] Review error logs
- [ ] Check disk space
- [ ] Verify backups
- [ ] Review security alerts

**Monthly**:
- [ ] Update dependencies (security patches)
- [ ] Review performance metrics
- [ ] Test disaster recovery
- [ ] Audit user accounts

**Quarterly**:
- [ ] Security audit
- [ ] Load testing
- [ ] Review access logs
- [ ] Update documentation

---

## Contact & Escalation

**Emergency Contacts**:
- System Administrator: admin@sentinelai.gov.in
- Database Team: dba@sentinelai.gov.in
- Security Team: security@sentinelai.gov.in

**Escalation Path**:
1. Level 1: DevOps Team (response time: 15 min)
2. Level 2: Tech Lead (response time: 30 min)
3. Level 3: CTO (response time: 1 hour)

---

**Document Version**: 1.0.0  
**Last Reviewed**: July 3, 2026  
**Next Review**: October 3, 2026
