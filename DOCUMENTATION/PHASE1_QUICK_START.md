# PHASE 1 - QUICK START GUIDE

## 🚀 Servers Running

**Backend:** http://localhost:8000  
**Frontend:** http://localhost:5173  
**Status:** ✅ BOTH RUNNING

---

## 📱 ACCESS USER MANAGEMENT

### **Admin Login**
```
URL: http://localhost:5173/
Email: admin@sentinelai.gov.in
Password: admin123
```

### **Navigate to User Management**
1. After login, look at the left sidebar
2. Scroll to **ADMINISTRATION** section
3. Click **User Management**
4. You'll see: http://localhost:5173/users

---

## 🎯 QUICK FEATURE TEST

### **1. View All Users**
- See all 9 registered users
- Notice different roles, statuses, failed logins
- All data is REAL from database

### **2. Search Users**
- Type in search box: "admin" or "test" or any email
- Results filter instantly

### **3. Filter Users**
- Use dropdowns to filter by:
  - Role (Admin/Investigator/Viewer)
  - Status (Active/Inactive)
  - Account Status (Pending/Active/Suspended/Rejected)

### **4. View User Profile**
- Click three-dot menu on any user
- Click "View Profile"
- See 4 tabs: Info, Activity, Cases, Reports
- Check login history and recent activity

### **5. Test Registration Workflow**

**A. Register New User:**
1. Logout (bottom of sidebar)
2. Click "Register" on login page
3. Fill form:
   - Full Name: Test User
   - Email: test@example.com
   - Password: Test123
   - Role: Investigator
4. Click Register
5. You'll see: "Account is pending approval"

**B. Try to Login (WILL FAIL):**
6. Try to login with test@example.com / Test123
7. You'll see error: "Account is pending approval. Please wait for administrator approval."

**C. Admin Approves:**
8. Login as admin again
9. Go to User Management
10. Find the new test user (yellow "Pending Approval" badge)
11. Click three-dot menu → "Approve"
12. Badge changes to green "Active"

**D. Now User Can Login:**
13. Logout
14. Login as test@example.com / Test123
15. SUCCESS! You're now logged in as Investigator

---

## 🎮 TEST ALL ACTIONS

Login as admin and go to User Management. Find any user (NOT yourself) and test these actions:

1. **View Profile** ✓
   - Click and see full details
   
2. **Suspend** ✓
   - User gets orange "Suspended" badge
   - Try to login as that user → BLOCKED
   
3. **Activate** ✓
   - Changes back to green "Active"
   - User can login again
   
4. **Deactivate** ✓
   - User gets gray "Inactive" badge
   - User cannot login
   
5. **Unlock** ✓ (if failed logins >= 5)
   - Resets failed login count to 0
   - Removes lock indicator
   
6. **Delete** ✓
   - Permanently removes user
   - Confirmation dialog appears
   - User disappears from list

---

## 📊 UI ELEMENTS TO NOTICE

### **Role Badges:**
- 🛡️ **Red** - Admin (Shield icon)
- 👥 **Blue** - Investigator (Users icon)
- 👁️ **Gray** - Viewer (Eye icon)

### **Status Badges:**
- ⚠️ **Yellow** - Pending Approval
- ✅ **Green** - Active
- 🚫 **Orange** - Suspended
- ❌ **Red** - Rejected
- ⚪ **Gray** - Inactive

### **Failed Logins:**
- Shows number (0-5+)
- If >= 5: Shows 🔒 with "Locked" label in red

### **Table Columns:**
1. User (Avatar + Name + Email + Username)
2. Role (Badge)
3. Department
4. Status (Badge)
5. Failed Logins
6. Last Login
7. Created Date
8. Actions (Three-dot menu)

---

## 🧪 AUTOMATED TEST

Want to see the full workflow in action?

```bash
cd backend
python test_simple_workflow.py
```

This will:
1. Register a new user → Check status is 'pending'
2. Try login → Verify it's blocked
3. Admin approves → Check status becomes 'active'
4. Try login → Verify it succeeds
5. Suspend user → Verify login blocked
6. Delete user → Verify removal

**Expected Output:**
```
============================================================
PHASE 1 - SIMPLE WORKFLOW TEST
============================================================

1. Admin Login...
   ✓ Admin logged in

2. Register New User...
   ✓ User registered: test_XXX@test.com
   Account Status: pending

3. Try Login (should fail - pending approval)...
   ✓ Login blocked: Account is pending approval

4. Admin Approves User...
   ✓ User approved
   Account Status: active

5. Try Login Again (should succeed)...
   ✓ Login successful!

6. Admin Suspends User...
   ✓ User suspended

7. Try Login (should fail - suspended)...
   ✓ Login blocked: Account is suspended

8. Admin Deletes User...
   ✓ User deleted

============================================================
ALL TESTS PASSED ✓
============================================================
```

---

## 🎯 KEY FEATURES DEMONSTRATED

✅ **Pending Registration Workflow**
- New users cannot login until approved
- Clear error messages
- Visible pending status in admin panel

✅ **Real Database Integration**
- No mock data
- All users from actual database
- Live updates

✅ **Role Management**
- Different badges for different roles
- Can change roles in real-time

✅ **Account Security**
- Account lock after 5 failed attempts
- Manual unlock by admin
- Suspended accounts blocked

✅ **Professional UI**
- Enterprise-grade data table
- Search, filter, sort, pagination
- User profile modal with tabs
- Responsive actions dropdown

✅ **Complete Audit Trail**
- All actions logged
- Login history visible
- Recent activity tracked

---

## 🎉 YOU'RE ALL SET!

Phase 1 - Centralized User Management System is fully functional and ready to use.

**Next Steps:**
- Test all features manually
- Try the automated test
- Review the complete documentation in `PHASE1_USER_MANAGEMENT_COMPLETE.md`
- Verify the registration → approval → login workflow

**Servers:**
- Backend: http://localhost:8000 ✓
- Frontend: http://localhost:5173 ✓

**Admin Access:**
- Email: admin@sentinelai.gov.in
- Password: admin123

**Have fun testing! 🚀**
