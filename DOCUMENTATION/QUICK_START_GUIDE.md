# SentinelAI - Quick Start Guide 🚀

## 📋 What's New

Your SentinelAI application now has a **complete multi-user authentication system** with real database-backed user profiles!

---

## 🎯 Quick Test (2 Minutes)

### 1. Start Backend
```bash
cd "c:\Users\HP\OneDrive\Desktop\gpt backend\backend"
python -m uvicorn app.main:app --reload
```
✅ Backend running at: `http://localhost:8000`

### 2. Start Frontend
```bash
cd "c:\Users\HP\Desktop\sentinelai"
npm run dev
```
✅ Frontend running at: `http://localhost:5173`

### 3. Register Your Account
- Navigate to: `http://localhost:5173/register`
- Fill in your details:
  - **Full Name**: Your name
  - **Email**: your.email@example.com
  - **Username**: your.username
  - **Phone**: 9876543210
  - **Password**: SecurePass123
  - **Role**: Investigator
  - **Department**: Cyber Crime Cell
- Click **Create Account**

### 4. Login
- You'll be redirected to `/login`
- Enter your email and password
- ✅ You're now logged in!

### 5. Verify It Works
- ✅ Check top-right corner → Your name and photo appear
- ✅ Click **Create New Case** → You're auto-assigned
- ✅ Open any case → Add a note → Your name appears
- ✅ Click your avatar → Settings / Logout menu

---

## 🎨 What Changed

### Before (Demo Mode):
- ❌ Fake login (hardcoded officer@cybercrime.gov.in)
- ❌ Mock user "Inspector Rajesh Kumar" everywhere
- ❌ Hardcoded officer dropdown lists
- ❌ No real authentication
- ❌ No session persistence

### After (Production Ready):
- ✅ Real registration and login
- ✅ Your actual profile everywhere
- ✅ Auto-assigned to cases you create
- ✅ JWT authentication with session persistence
- ✅ Secure password hashing (bcrypt)
- ✅ Failed login protection (5 attempts max)
- ✅ Remember me functionality
- ✅ Profile photos and user metadata

---

## 🔑 Key Features

### 1. User Registration
**Endpoint**: `POST /auth/register`
```json
{
  "full_name": "Officer Name",
  "email": "officer@example.com",
  "username": "officer.name",
  "phone": "9876543210",
  "password": "SecurePass123",
  "role": "investigator",
  "department": "Cyber Crime Cell"
}
```

### 2. User Login
**Endpoint**: `POST /auth/login`
```json
{
  "email": "officer@example.com",
  "password": "SecurePass123",
  "remember_me": false
}
```
**Returns**: JWT token + user profile

### 3. Session Persistence
- Token stored in `localStorage`
- Automatically attached to all API requests
- Session survives page refresh
- 8 hours expiry (30 days with remember me)

### 4. Case Ownership
- Cases auto-assigned to creator
- Owner displayed in cases list
- Shows "Unassigned" if no owner
- Officer notes use your name

### 5. Security
- ✅ Passwords hashed with bcrypt
- ✅ Failed login tracking
- ✅ Account lock after 5 failed attempts
- ✅ JWT token validation
- ✅ Protected routes require authentication

---

## 📁 Project Structure

### Backend Files:
```
backend/
├── app/
│   ├── api/
│   │   ├── auth.py              ← 7 auth endpoints
│   │   └── cases.py             ← Owner assignment
│   ├── database/
│   │   └── models.py            ← User model with auth fields
│   ├── schemas/
│   │   ├── user.py              ← UserPublic, RegisterRequest
│   │   └── case.py              ← OwnerInfo included
│   ├── services/
│   │   ├── auth_service.py      ← Password hashing, JWT, etc.
│   │   └── case_service.py      ← Owner relationship loading
│   └── models/
│       └── user.py              ← UserRole enum
└── alembic/versions/
    ├── add_enterprise_auth_fields.py   ← Migration 1
    └── add_username_phone_to_users.py  ← Migration 2
```

### Frontend Files:
```
sentinelai/src/
├── contexts/
│   └── AuthContext.tsx          ← Global user state
├── services/
│   └── authApi.ts               ← Auth API integration
├── components/layout/
│   └── Header.tsx               ← Real user display
└── pages/
    ├── RegisterPage.tsx         ← User registration
    ├── LoginPage.tsx            ← User login
    ├── CreateCasePage.tsx       ← Auto-assign current user
    ├── CasesPage.tsx            ← Show real officers
    └── CaseDetailPage.tsx       ← Use logged-in user for notes
```

---

## 🛠️ API Endpoints

### Authentication:
```
POST   /auth/register          Register new user
POST   /auth/login             Login and get JWT
GET    /auth/me                Get current user
PUT    /auth/profile           Update profile
POST   /auth/change-password   Change password
POST   /auth/forgot-password   Request reset (placeholder)
POST   /auth/reset-password    Reset with token (placeholder)
```

### Cases:
```
GET    /cases                  List cases (with owner info)
POST   /cases                  Create case (auto-assigned to you)
GET    /cases/{id}             Get case details (with owner)
POST   /cases/{id}/notes       Add note (uses your name)
```

---

## 🔐 User Roles

### Admin
- Full system access
- User management (future)
- All case operations

### Investigator (Default)
- Create and manage cases
- Add evidence and notes
- Generate reports

### Viewer
- Read-only access
- View cases and reports
- No editing permissions

---

## 🧪 Testing Checklist

### ✅ Registration Flow
1. Go to `/register`
2. Fill all fields
3. Submit → User created in database
4. Check users table → New entry exists

### ✅ Login Flow
1. Go to `/login`
2. Enter credentials
3. Submit → JWT token received
4. Check localStorage → Token stored
5. Check header → Your name appears

### ✅ Session Persistence
1. Login
2. Refresh page
3. ✅ Still logged in
4. ✅ Header still shows your name

### ✅ Case Creation
1. Click "Create New Case"
2. Fill case details
3. Submit
4. ✅ Case auto-assigned to you
5. Check cases table → owner_id = your user ID

### ✅ Officer Notes
1. Open any case
2. Click "Investigation Notes" tab
3. Add a note
4. ✅ Note shows your name as author
5. ✅ Timeline event created

### ✅ Logout
1. Click avatar dropdown
2. Click "Logout"
3. ✅ Redirected to login
4. ✅ localStorage cleared
5. ✅ Can't access protected routes

### ✅ Failed Login Protection
1. Try wrong password 6 times
2. ✅ Account locked
3. Check users table → failed_login_attempts = 5
4. ✅ Cannot login anymore

---

## 🚨 Troubleshooting

### Issue: "401 Unauthorized" errors
**Solution**: Token expired or invalid
```javascript
// In browser console:
localStorage.removeItem('sentinelai_token');
localStorage.removeItem('sentinelai_user');
// Then login again
```

### Issue: Profile photo not showing
**Cause**: profile_photo field is null
**Solution**: Upload photo via Settings (when implemented)

### Issue: Case not assigned to me
**Cause**: Not logged in or token missing
**Solution**: 
1. Check Authorization header in Network tab
2. Verify token in localStorage
3. Re-login if needed

### Issue: Database migration errors
**Solution**:
```bash
cd backend
python -m alembic upgrade head
```

---

## 📚 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@localhost/sentinelai
SECRET_KEY=your-secret-key-change-in-production
GEMINI_API_KEY=your-gemini-api-key
```

⚠️ **IMPORTANT**: Change `SECRET_KEY` in production!

### Frontend
No environment variables needed for development.

---

## 🎓 Learning Resources

### Understanding JWT
- Token stored in localStorage
- Sent as `Authorization: Bearer <token>`
- Contains: user_id, email, role, expiry
- Validated on every protected endpoint

### Understanding Bcrypt
- Password → Hash (one-way)
- Stored: `$2b$12$...` (60 chars)
- Verify: `bcrypt.checkpw(plain, hash)`
- Never store plain passwords

### Understanding SQLAlchemy Relationships
```python
# User has many cases
user.cases  → List[CaseDB]

# Case belongs to one user
case.owner  → UserDB

# Eager loading (joinedload)
cases = db.query(CaseDB).options(joinedload(CaseDB.owner)).all()
```

---

## 🚀 Next Steps (Optional)

### 1. Profile Page
- Display full user statistics
- Cases assigned, closed, reports generated
- Upload profile photo
- Edit profile inline

### 2. Settings Page
- Edit name, email, username, phone
- Change password with confirmation
- Update department
- Delete account

### 3. Audit Logging
- Track login/logout events
- Log failed login attempts
- Record password changes
- Store in separate audit table

### 4. Email Service
- Configure SMTP
- Send password reset emails
- Account verification emails
- Notification emails

### 5. Role-Based Access Control
- Implement permission checks
- Admin panel for user management
- Viewer restrictions
- Investigator capabilities

---

## ✅ Success Indicators

You'll know everything is working when:
- ✅ Register page creates real database users
- ✅ Login page issues JWT tokens
- ✅ Header shows your actual name and photo
- ✅ Cases auto-assign to you
- ✅ Officer notes show your name
- ✅ Session persists after refresh
- ✅ Logout clears everything
- ✅ Failed logins are tracked

---

## 📞 Support

### Check Logs:
**Backend**:
```bash
# Server console shows all API requests
uvicorn app.main:app --reload
```

**Frontend**:
```javascript
// Browser console
console.log('Token:', localStorage.getItem('sentinelai_token'));
console.log('User:', localStorage.getItem('sentinelai_user'));
```

### Database Check:
```bash
# PostgreSQL
psql -U your_user -d sentinelai

# Check users
SELECT id, full_name, email, username, role, is_active FROM users;

# Check cases with owners
SELECT c.case_id, c.title, u.full_name as owner 
FROM cases c 
LEFT JOIN users u ON c.owner_id = u.id;
```

---

**Version**: 1.0  
**Last Updated**: July 2, 2026  
**Status**: Production Ready ✅

**Happy Investigating! 🕵️‍♂️**
