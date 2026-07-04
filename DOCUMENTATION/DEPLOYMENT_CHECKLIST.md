# SentinelAI - Production Deployment Checklist

**Version**: 1.0.0  
**Last Updated**: July 3, 2026  
**Status**: Ready for Deployment

---

## Pre-Deployment Checklist

### ✅ Code Quality (ALL COMPLETE)
- [x] All critical bugs fixed (3/3)
- [x] TypeScript build succeeds (0 errors)
- [x] Python syntax check passes (0 errors)
- [x] No console errors in browser
- [x] No React warnings
- [x] Code reviewed and approved

### ✅ Features Verified (ALL COMPLETE)
- [x] Authentication (Register, Login, Logout)
- [x] Account locking & unlock working
- [x] Dashboard loads correctly (all roles)
- [x] Cases CRUD working
- [x] Evidence upload working
- [x] Reports generation working
- [x] CrimeGPT chat working
- [x] Team Management working
- [x] Profile page working
- [x] Settings page working
- [x] RBAC enforced everywhere

### ⏳ Environment Configuration (REQUIRED)
- [ ] Production `.env` file created
- [ ] SECRET_KEY changed from default
- [ ] DATABASE_URL configured for production
- [ ] GOOGLE_API_KEY configured
- [ ] SMTP settings configured (if email enabled)
- [ ] CORS origins set to production domain
- [ ] Frontend VITE_API_BASE_URL set to production API

### ⏳ Infrastructure (REQUIRED)
- [ ] Production server provisioned
- [ ] PostgreSQL database created
- [ ] SSL/HTTPS certificates obtained
- [ ] Domain name configured
- [ ] Firewall rules configured
- [ ] Backup storage configured

### ⏳ Security (REQUIRED)
- [ ] SECRET_KEY is strong and unique
- [ ] Database credentials are secure
- [ ] HTTPS enforced (no HTTP)
- [ ] CORS restricted to production domain
- [ ] Rate limiting enabled
- [ ] Security headers configured

### 📋 Documentation (ALL COMPLETE)
- [x] Stability Bug Fix Report created
- [x] Production Deployment Guide created
- [x] Sprint Completion Summary created
- [x] Quick Reference Guide created
- [x] Executive Summary created
- [x] This deployment checklist created

---

## Deployment Steps

### Phase 1: Backend Deployment

#### Step 1.1: Prepare Environment
- [ ] SSH into production server
- [ ] Create application directory
- [ ] Install Python 3.11+
- [ ] Install PostgreSQL client
- [ ] Install system dependencies

```bash
sudo apt update
sudo apt install python3.11 python3-pip postgresql-client nginx
```

#### Step 1.2: Deploy Backend Code
- [ ] Clone/copy backend code to server
- [ ] Create virtual environment
- [ ] Install Python dependencies
- [ ] Copy production `.env` file

```bash
cd /opt/sentinelai/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Step 1.3: Database Setup
- [ ] Create production database
- [ ] Configure database user/password
- [ ] Run migrations
- [ ] Create admin user

```bash
# Create database
sudo -u postgres createdb sentinelai_prod
sudo -u postgres createuser sentinelai_user
sudo -u postgres psql -c "ALTER USER sentinelai_user WITH PASSWORD 'secure_password';"

# Run migrations
alembic upgrade head

# Create admin user
python create_admin_user.py
```

#### Step 1.4: Start Backend Service
- [ ] Test backend manually
- [ ] Create systemd service file
- [ ] Enable and start service
- [ ] Verify service is running

```bash
# Test
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Create service
sudo nano /etc/systemd/system/sentinelai.service

# Enable
sudo systemctl enable sentinelai
sudo systemctl start sentinelai
sudo systemctl status sentinelai
```

#### Step 1.5: Verify Backend
- [ ] Health check returns 200
- [ ] Swagger UI accessible
- [ ] Can login with admin user
- [ ] API endpoints responding

```bash
curl http://localhost:8000/health
curl http://localhost:8000/docs
```

---

### Phase 2: Frontend Deployment

#### Step 2.1: Build Frontend
- [ ] Update frontend `.env` for production
- [ ] Run production build
- [ ] Verify build output

```bash
cd sentinelai
npm run build
# Check dist/ folder
```

#### Step 2.2: Deploy to Nginx
- [ ] Copy build files to web server
- [ ] Configure Nginx
- [ ] Test Nginx configuration
- [ ] Restart Nginx

```bash
# Copy files
sudo mkdir -p /var/www/sentinelai
sudo cp -r dist/* /var/www/sentinelai/

# Configure Nginx
sudo nano /etc/nginx/sites-available/sentinelai

# Test & restart
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 2.3: Configure SSL
- [ ] Obtain SSL certificate (Let's Encrypt)
- [ ] Configure HTTPS in Nginx
- [ ] Set up HTTP to HTTPS redirect
- [ ] Test SSL configuration

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d sentinelai.gov.in

# Auto-renewal
sudo certbot renew --dry-run
```

#### Step 2.4: Verify Frontend
- [ ] Frontend loads in browser
- [ ] HTTPS working (green lock)
- [ ] All assets loading
- [ ] No console errors
- [ ] API calls working

```
Visit: https://sentinelai.gov.in
```

---

### Phase 3: Integration Testing

#### Test 3.1: Authentication Flow
- [ ] Register new user
- [ ] Login with new user
- [ ] JWT token received
- [ ] Protected routes work
- [ ] Logout works
- [ ] Session persists (remember me)

#### Test 3.2: Case Management
- [ ] Create new case
- [ ] View case details
- [ ] Edit case
- [ ] Archive case
- [ ] Unarchive case
- [ ] Delete case

#### Test 3.3: Evidence & Reports
- [ ] Upload evidence file
- [ ] Run OCR analysis
- [ ] View extracted text
- [ ] Generate fraud report
- [ ] View report
- [ ] Download report

#### Test 3.4: Team Management (Admin)
- [ ] View all users
- [ ] Create new user
- [ ] Edit user
- [ ] Deactivate user
- [ ] Activate user
- [ ] Reset user password
- [ ] Unlock locked account

#### Test 3.5: Dashboard
- [ ] Admin dashboard loads
- [ ] Investigator dashboard loads
- [ ] Viewer dashboard loads
- [ ] Statistics are correct
- [ ] No infinite loop (check Network tab)
- [ ] < 5 API requests total

#### Test 3.6: Profile & Settings
- [ ] View profile page
- [ ] Update profile
- [ ] Upload profile photo
- [ ] Change password
- [ ] View statistics

---

### Phase 4: Post-Deployment

#### Step 4.1: Monitoring Setup
- [ ] Configure Sentry for error tracking
- [ ] Set up UptimeRobot for uptime monitoring
- [ ] Configure log aggregation
- [ ] Set up alerts for errors
- [ ] Create monitoring dashboard

#### Step 4.2: Backup Configuration
- [ ] Set up automated database backups
- [ ] Configure evidence file backups
- [ ] Test restore procedure
- [ ] Set retention policy (30 days)
- [ ] Verify backups are running

```bash
# Cron job for daily backups
0 2 * * * /opt/scripts/backup_sentinelai.sh
```

#### Step 4.3: Performance Baseline
- [ ] Measure average response time
- [ ] Check database query performance
- [ ] Monitor memory usage
- [ ] Check disk space
- [ ] Record baseline metrics

#### Step 4.4: Documentation Update
- [ ] Update deployment guide with actual values
- [ ] Document production URLs
- [ ] Record admin credentials (secure vault)
- [ ] Create runbook for common issues
- [ ] Share access with team

---

## Post-Launch Monitoring (First Week)

### Daily Checks
- [ ] Day 1: Check uptime, errors, performance
- [ ] Day 2: Review error logs, user feedback
- [ ] Day 3: Check backup success, disk space
- [ ] Day 4: Monitor API response times
- [ ] Day 5: Review security logs
- [ ] Day 6: Check user registration/login stats
- [ ] Day 7: Week 1 review meeting

### Metrics to Track
- [ ] Uptime percentage
- [ ] Average response time
- [ ] Error rate
- [ ] Active users
- [ ] Cases created
- [ ] Reports generated
- [ ] Support tickets

---

## Rollback Plan (If Needed)

### Step R1: Stop Current Deployment
```bash
sudo systemctl stop sentinelai
sudo systemctl stop nginx
```

### Step R2: Restore Previous Version
```bash
# Restore backend
cd /opt/sentinelai/backend
git checkout previous-release-tag

# Restore frontend
sudo rm -rf /var/www/sentinelai/*
sudo cp -r /backups/frontend-previous/* /var/www/sentinelai/
```

### Step R3: Restore Database
```bash
# Stop application
sudo systemctl stop sentinelai

# Restore from backup
gunzip /backups/sentinelai/latest.sql.gz
psql -U sentinelai sentinelai_prod < /backups/sentinelai/latest.sql
```

### Step R4: Restart Services
```bash
sudo systemctl start sentinelai
sudo systemctl start nginx
```

### Step R5: Verify Rollback
- [ ] Health check passing
- [ ] Frontend loading
- [ ] Users can login
- [ ] Basic operations working

---

## Success Criteria

### ✅ Deployment Successful If:
- [ ] All infrastructure provisioned
- [ ] Backend service running
- [ ] Frontend accessible via HTTPS
- [ ] All 18 features tested and working
- [ ] No critical errors in logs
- [ ] Monitoring and backups configured
- [ ] Team has access and documentation

### ⚠️ Rollback If:
- [ ] Critical features not working
- [ ] Security vulnerabilities discovered
- [ ] Database migration fails
- [ ] Uptime < 95% in first 24 hours
- [ ] Critical bugs discovered

---

## Team Responsibilities

### DevOps Engineer
- [ ] Server provisioning
- [ ] Service configuration
- [ ] SSL setup
- [ ] Monitoring setup
- [ ] Backup configuration

### Backend Developer
- [ ] Code deployment
- [ ] Database migrations
- [ ] API testing
- [ ] Bug fixes (if needed)

### Frontend Developer
- [ ] Build creation
- [ ] Asset deployment
- [ ] Browser testing
- [ ] UI bug fixes (if needed)

### QA Engineer
- [ ] Integration testing
- [ ] Feature verification
- [ ] User acceptance testing
- [ ] Performance testing

### Product Owner
- [ ] Go/no-go decision
- [ ] Stakeholder communication
- [ ] Launch announcement
- [ ] User training

---

## Communication Plan

### Before Deployment
- [ ] Notify stakeholders of deployment date
- [ ] Schedule deployment window (off-hours recommended)
- [ ] Prepare rollback plan
- [ ] Assign team roles

### During Deployment
- [ ] Create deployment war room (Slack/Teams channel)
- [ ] Real-time status updates
- [ ] Checkpoint confirmations
- [ ] Issue tracking

### After Deployment
- [ ] Send "Deployment Complete" announcement
- [ ] Share production URLs
- [ ] Provide quick start guide
- [ ] Schedule training session
- [ ] Gather initial feedback

---

## Final Sign-Off

### Pre-Deployment Approval

**Development Lead**: _______________  Date: ___________  
**QA Lead**: _______________  Date: ___________  
**DevOps Lead**: _______________  Date: ___________  
**Product Owner**: _______________  Date: ___________  
**CTO/Technical Director**: _______________  Date: ___________  

### Post-Deployment Confirmation

**Deployment Completed By**: _______________  Date: ___________  
**Verified By**: _______________  Date: ___________  
**Production URL**: _______________  
**Deployment Duration**: _______________ hours  
**Issues Encountered**: _______________  
**Rollback Required**: [ ] Yes [ ] No

---

## Quick Links

- **API Docs**: https://api.sentinelai.gov.in/docs
- **Frontend**: https://sentinelai.gov.in
- **Monitoring**: [Your monitoring dashboard URL]
- **Logs**: [Your log aggregation URL]
- **Backups**: [Your backup storage location]

---

**Document Status**: Ready for Use  
**Created**: July 3, 2026  
**Version**: 1.0.0  
**Next Review**: After first deployment
