# 🚀 CRIMEGPT - PRODUCTION DEPLOYMENT GUIDE

**Project:** CrimeGPT Intelligence Platform  
**Version:** 1.0.0  
**Status:** Production Ready ✅

---

## 📋 PRE-DEPLOYMENT CHECKLIST

### **Environment Setup**

- [ ] Production server provisioned (Ubuntu 20.04+ recommended)
- [ ] Domain name configured (e.g., crimegpt.gov.in)
- [ ] SSL certificate obtained (Let's Encrypt recommended)
- [ ] PostgreSQL database created
- [ ] S3 bucket or file storage configured
- [ ] SMTP service configured (SendGrid/AWS SES)

### **Security Configuration**

- [ ] SECRET_KEY changed from default
- [ ] OPENAI_API_KEY configured
- [ ] Database credentials secured
- [ ] CORS origins restricted to production domain
- [ ] Rate limiting enabled
- [ ] Firewall configured

### **Code Preparation**

- [ ] All migrations tested
- [ ] Test users created
- [ ] Frontend built for production
- [ ] Backend dependencies installed
- [ ] Stress tests passed

---

## 🔧 BACKEND DEPLOYMENT

### **1. Server Setup**

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python 3.11+
sudo apt install python3.11 python3.11-venv python3-pip -y

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install certbot for SSL
sudo apt install certbot python3-certbot-nginx -y
```

### **2. Clone Repository**

```bash
cd /var/www
sudo git clone <your-repo-url> crimegpt
cd crimegpt/backend
```

### **3. Create Virtual Environment**

```bash
python3.11 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### **4. Configure Environment**

```bash
cp .env.example .env
nano .env
```

**Production .env:**

```env
# Database
DATABASE_URL=postgresql://crimegpt_user:SECURE_PASSWORD@localhost/crimegpt_db

# Security
SECRET_KEY=your-super-secure-random-key-here-change-this
ALGORITHM=HS256

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here

# CORS (restrict to your domain)
ALLOWED_ORIGINS=https://crimegpt.gov.in,https://www.crimegpt.gov.in

# Email (if using SendGrid)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@crimegpt.gov.in

# File Storage (if using AWS S3)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET=crimegpt-evidence

# Application
ENVIRONMENT=production
DEBUG=False
```

### **5. Setup Database**

```bash
# Create database and user
sudo -u postgres psql

CREATE DATABASE crimegpt_db;
CREATE USER crimegpt_user WITH PASSWORD 'SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE crimegpt_db TO crimegpt_user;
\q

# Run migrations
cd /var/www/crimegpt/backend
source venv/bin/activate
alembic upgrade head

# Create test users (optional for demo)
python create_role_test_users.py
```

### **6. Configure Systemd Service**

Create `/etc/systemd/system/crimegpt-backend.service`:

```ini
[Unit]
Description=CrimeGPT Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/crimegpt/backend
Environment="PATH=/var/www/crimegpt/backend/venv/bin"
ExecStart=/var/www/crimegpt/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start service
sudo systemctl enable crimegpt-backend
sudo systemctl start crimegpt-backend
sudo systemctl status crimegpt-backend
```

### **7. Configure Nginx Reverse Proxy**

Create `/etc/nginx/sites-available/crimegpt`:

```nginx
server {
    listen 80;
    server_name api.crimegpt.gov.in;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.crimegpt.gov.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.crimegpt.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.crimegpt.gov.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy to Backend
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (if needed)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload limit
    client_max_body_size 50M;

    # Logging
    access_log /var/log/nginx/crimegpt-access.log;
    error_log /var/log/nginx/crimegpt-error.log;
}
```

```bash
# Enable site and obtain SSL certificate
sudo ln -s /etc/nginx/sites-available/crimegpt /etc/nginx/sites-enabled/
sudo certbot --nginx -d api.crimegpt.gov.in
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🌐 FRONTEND DEPLOYMENT

### **1. Build Frontend**

```bash
cd /var/www/crimegpt/frontend
npm install
npm run build
```

### **2. Configure Production API URL**

Update `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.crimegpt.gov.in';
```

Create `.env.production`:

```env
VITE_API_URL=https://api.crimegpt.gov.in
```

Rebuild:

```bash
npm run build
```

### **3. Configure Nginx for Frontend**

Create `/etc/nginx/sites-available/crimegpt-frontend`:

```nginx
server {
    listen 80;
    server_name crimegpt.gov.in www.crimegpt.gov.in;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name crimegpt.gov.in www.crimegpt.gov.in;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/crimegpt.gov.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crimegpt.gov.in/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    # Root directory
    root /var/www/crimegpt/frontend/dist;
    index index.html;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Static files with cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Logging
    access_log /var/log/nginx/crimegpt-frontend-access.log;
    error_log /var/log/nginx/crimegpt-frontend-error.log;
}
```

```bash
# Enable site and obtain SSL certificate
sudo ln -s /etc/nginx/sites-available/crimegpt-frontend /etc/nginx/sites-enabled/
sudo certbot --nginx -d crimegpt.gov.in -d www.crimegpt.gov.in
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 SECURITY HARDENING

### **1. Firewall Configuration**

```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### **2. Fail2Ban (Brute Force Protection)**

```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### **3. PostgreSQL Security**

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Change peer to md5 for local connections
# local   all             all                                     md5

sudo systemctl restart postgresql
```

### **4. Regular Updates**

```bash
# Setup automatic security updates
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

## 📊 MONITORING SETUP

### **1. Application Logs**

```bash
# Backend logs
sudo journalctl -u crimegpt-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/crimegpt-access.log
sudo tail -f /var/log/nginx/crimegpt-error.log
```

### **2. Health Check Endpoint**

Test: `https://api.crimegpt.gov.in/health`

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0"
}
```

### **3. Performance Monitoring (Optional)**

Install New Relic or DataDog:

```bash
pip install newrelic
newrelic-admin generate-config YOUR_LICENSE_KEY newrelic.ini
```

Update systemd service:
```ini
ExecStart=/var/www/crimegpt/backend/venv/bin/newrelic-admin run-program /var/www/crimegpt/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🧪 POST-DEPLOYMENT VERIFICATION

### **1. Run Stress Tests**

```bash
cd /var/www/crimegpt/backend
source venv/bin/activate
python stress_test.py
```

### **2. Manual Testing**

- [ ] Login as Admin
- [ ] Login as Investigator
- [ ] Login as Viewer
- [ ] Create a case
- [ ] Upload evidence
- [ ] Generate report
- [ ] CrimeGPT query
- [ ] Settings persistence
- [ ] Logout and re-login

### **3. Performance Check**

```bash
# Test API response time
curl -o /dev/null -s -w '%{time_total}\n' https://api.crimegpt.gov.in/health

# Expected: < 0.2 seconds
```

### **4. Security Scan**

```bash
# SSL test
https://www.ssllabs.com/ssltest/analyze.html?d=crimegpt.gov.in

# Expected: A+ rating
```

---

## 🔄 BACKUP & RECOVERY

### **1. Database Backup**

Create `/usr/local/bin/backup-crimegpt.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/crimegpt"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR

# Database backup
pg_dump -U crimegpt_user crimegpt_db | gzip > "$BACKUP_DIR/db_$TIMESTAMP.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $TIMESTAMP"
```

```bash
sudo chmod +x /usr/local/bin/backup-crimegpt.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-crimegpt.sh >> /var/log/crimegpt-backup.log 2>&1
```

### **2. Database Restore**

```bash
gunzip < /var/backups/crimegpt/db_TIMESTAMP.sql.gz | sudo -u postgres psql crimegpt_db
```

---

## 📈 SCALING CONSIDERATIONS

### **For High Traffic (>1000 concurrent users):**

1. **Load Balancer:**
   - Use Nginx or HAProxy
   - Multiple backend instances
   - Session persistence with Redis

2. **Database:**
   - PostgreSQL connection pooling (pgBouncer)
   - Read replicas for reports
   - Regular VACUUM and ANALYZE

3. **Caching:**
   - Redis for dashboard stats
   - Cache-Control headers for static assets
   - CDN for frontend (CloudFlare/AWS CloudFront)

4. **File Storage:**
   - S3 or Azure Blob Storage for evidence files
   - Signed URLs for secure downloads

---

## 🆘 TROUBLESHOOTING

### **Backend Not Starting**

```bash
sudo systemctl status crimegpt-backend
sudo journalctl -u crimegpt-backend -n 50
```

Common issues:
- Port 8000 already in use
- Database connection failed
- Missing environment variables

### **Frontend 404 Errors**

Check Nginx configuration:
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/crimegpt-error.log
```

### **Database Connection Issues**

```bash
# Test connection
psql -U crimegpt_user -d crimegpt_db -h localhost

# Check PostgreSQL status
sudo systemctl status postgresql
```

### **SSL Certificate Renewal**

```bash
# Certbot auto-renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

---

## 📞 SUPPORT CONTACTS

**Technical Support:**
- Email: tech-support@crimegpt.gov.in
- Emergency Hotline: +91-XXXX-XXXX-XX

**Deployment Team:**
- DevOps Lead: devops@crimegpt.gov.in
- Database Admin: dba@crimegpt.gov.in

---

## ✅ DEPLOYMENT SIGN-OFF

Once deployment is complete, verify:

- [ ] All services running
- [ ] SSL certificates valid
- [ ] Stress tests passed
- [ ] Manual tests passed
- [ ] Backups configured
- [ ] Monitoring active
- [ ] Security scan passed
- [ ] Documentation updated

**Deployed By:** _______________  
**Date:** _______________  
**Version:** 1.0.0  
**Status:** ✅ PRODUCTION

---

**🎉 CONGRATULATIONS! CrimeGPT is now live in production.**

For ongoing maintenance, refer to the **Operations Manual** and **Incident Response Guide**.
