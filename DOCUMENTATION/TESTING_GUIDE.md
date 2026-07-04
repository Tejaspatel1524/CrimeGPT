# 🧪 CrimeGPT - Complete Testing Guide

**All 4 Phases Complete** ✅  
**Servers Running:** Frontend + Backend  
**Ready for Testing**

---

## 🌐 ACCESS THE APPLICATION

**Frontend:** http://localhost:5174  
**Backend API:** http://localhost:8000  
**API Docs:** http://localhost:8000/docs

---

## 👥 TEST CREDENTIALS

### **Admin Account (Full Control)**
- **Email:** admin@crimegpt.gov.in
- **Password:** admin123
- **Access:** Everything (user management, all cases, settings)

### **Investigator Account (Case Management)**
- **Email:** investigator@crimegpt.gov.in
- **Password:** investigator123
- **Access:** Create cases, upload evidence, reports, CrimeGPT

### **Viewer Account (Read-Only)**
- **Email:** viewer@crimegpt.gov.in
- **Password:** viewer123
- **Access:** View cases and reports only (no create/edit)

---

## ✅ PHASE 1 TESTING - Mock Replacement

### **Test Profile Activity (Real Audit Logs):**
1. Login as any user
2. Go to **Profile** page (top-right avatar → Profile)
3. Scroll to **Recent Activity** section
4. ✅ **Expected:** Real login activities from database (not hardcoded)
5. ✅ **Verify:** Shows "Logged In" with timestamps

### **Test Settings Persistence:**
1. Go to **Settings** page
2. Change any preference:
   - Theme: Switch to different theme
   - Language: Change to Hindi
   - Timezone: Change to Asia/Kolkata
   - Notifications: Toggle any switch
3. Click **Save Preferences** or **Save Notification Settings**
4. ✅ **Expected:** Success message appears
5. **Logout** and **Login** again
6. Go to **Settings**
7. ✅ **Expected:** All changes are persisted (theme, language, toggles)

---

## ✅ PHASE 2 TESTING - Role-Based Access Control

### **Test Admin Experience:**
1. Login as **admin@crimegpt.gov.in**
2. ✅ **Dashboard:** Shows system-wide stats (all users, all cases)
3. ✅ **Sidebar:** Shows "Users" menu item
4. Click **Users** (in sidebar)
5. ✅ **Expected:** User management page with list of all users
6. ✅ **Verify:** Can see all users, deactivate/reactivate
7. Go to **Cases**
8. ✅ **Expected:** See ALL cases in system
9. ✅ **Verify:** "New Case" button visible

### **Test Investigator Experience:**
1. **Logout** and login as **investigator@crimegpt.gov.in**
2. ✅ **Dashboard:** Shows personal stats (my cases only)
3. ✅ **Sidebar:** NO "Users" menu item (hidden, not disabled)
4. ✅ **Expected:** Quick actions show "Register Case", "Upload Evidence", "Query CrimeGPT"
5. Go to **Cases**
6. ✅ **Expected:** See only assigned cases
7. ✅ **Verify:** "New Case" button visible (can create cases)
8. Try creating a case
9. ✅ **Expected:** Form opens and submission works

### **Test Viewer Experience:**
1. **Logout** and login as **viewer@crimegpt.gov.in**
2. ✅ **Dashboard:** Shows read-only stats
3. ✅ **Sidebar:** NO "Users" menu item
4. ✅ **Expected:** NO quick actions for create/upload
5. Go to **Cases**
6. ✅ **Expected:** Can view cases list
7. ✅ **Verify:** NO "New Case" button (completely hidden)
8. Click on any case to view details
9. ✅ **Expected:** Can view but cannot edit
10. Try accessing `/users` directly in URL
11. ✅ **Expected:** Backend returns 403 Forbidden error

### **Verify Permission Enforcement:**
1. As **Viewer**, try to:
   - Create case: ❌ Button hidden
   - Edit case: ❌ Edit button hidden
   - Upload evidence: ❌ No upload option
   - Access users page: ❌ 403 error
2. ✅ **Expected:** All unauthorized actions blocked

---

## ✅ PHASE 3 TESTING - Settings Functionality

### **Test Account Settings:**
1. Login as any user
2. Go to **Settings** → **Account** tab
3. **Change Full Name:**
   - Update name
   - Click **Save Changes**
   - ✅ **Expected:** Success message
   - ✅ **Verify:** Name updates in top-right corner immediately
4. **Change Phone:**
   - Update phone number
   - Click **Save Changes**
   - ✅ **Expected:** Success message
5. **Test Validation:**
   - Try entering invalid email format
   - ✅ **Expected:** Validation error shows
   - Try name with < 2 characters
   - ✅ **Expected:** Validation error shows

### **Test Security Settings:**
1. Go to **Settings** → **Security** tab
2. Click **Change Password**
3. Enter:
   - Current password
   - New password (min 8 chars, must have uppercase, lowercase, number, special char)
   - Confirm password
4. Click **Change Password**
5. ✅ **Expected:** Success message
6. **Test Validation:**
   - Try weak password (e.g., "1234")
   - ✅ **Expected:** Validation error shows
   - Try wrong current password
   - ✅ **Expected:** "Current password is incorrect" error

### **Test Preferences:**
1. Go to **Settings** → **Preferences** tab
2. Change each setting:
   - ✅ Theme: Switch between themes
   - ✅ Language: Change language
   - ✅ Timezone: Change timezone
   - ✅ Date Format: Switch format
   - ✅ Time Format: 12h/24h
3. Click **Save Preferences**
4. ✅ **Expected:** Success message
5. **Logout and Login**
6. ✅ **Verify:** All preferences persisted

### **Test Notifications:**
1. Go to **Settings** → **Notifications** tab
2. Toggle each notification:
   - ✅ Case Assignment
   - ✅ CrimeGPT Responses
   - ✅ Evidence Processing
   - ✅ Report Generation
   - ✅ Cross-Case Match
3. Click **Save Notification Settings**
4. ✅ **Expected:** Success message
5. **Logout and Login**
6. Return to Notifications tab
7. ✅ **Verify:** All toggle states persisted

---

## ✅ PHASE 4 TESTING - Complete System

### **Test Case Management:**
1. Login as **Investigator**
2. Go to **Cases** → Click **New Case**
3. Fill in case details:
   - Title: "Test Fraud Case"
   - Category: "UPI Fraud"
   - Victim details
   - Amount lost: 50000
   - Complaint text: (describe fraud)
4. Click **Register Case**
5. ✅ **Expected:** Case created, redirected to case detail
6. ✅ **Verify:** Case number assigned, timeline shows registration event

### **Test Evidence Upload:**
1. In case detail page, go to **Evidence** tab
2. Click **Upload Evidence**
3. Select an image file
4. ✅ **Expected:** File uploads successfully
5. ✅ **Verify:** Evidence appears in evidence list with filename, size, upload time
6. Click **Analyze** on evidence
7. ✅ **Expected:** OCR analysis runs (may take a few seconds)
8. Click **View Analysis**
9. ✅ **Expected:** Shows extracted text and entities

### **Test CrimeGPT:**
1. Go to **CrimeGPT** page (sidebar)
2. Select a case from dropdown
3. Type a question: "What type of fraud is this?"
4. Click Send
5. ✅ **Expected:** AI response appears (uses OpenAI)
6. ✅ **Verify:** Response is relevant to case details
7. **Ask follow-up question**
8. ✅ **Expected:** Context maintained in conversation

### **Test Reports:**
1. Go to **Reports** page
2. Click **Generate Report**
3. Select a case
4. Click **Generate**
5. ✅ **Expected:** Report generates (may take a few seconds)
6. ✅ **Verify:** Report appears in list
7. Click **View** on report
8. ✅ **Expected:** Full report with fraud analysis, risk score, entities, recommendations

### **Test Dashboard Analytics:**
1. Go to **Dashboard**
2. ✅ **Verify for Admin:**
   - System-wide case count
   - User statistics
   - All case activities
3. ✅ **Verify for Investigator:**
   - Personal case count
   - Cases assigned to me
   - My closure rate
   - High priority cases
4. ✅ **Verify for Viewer:**
   - Read-only system statistics
   - No personal stats
   - No quick actions

### **Test Archive Feature:**
1. Login as **Admin** or **Investigator**
2. Go to **Cases**
3. Click **⋮** (menu) on any case
4. Click **Archive**
5. ✅ **Expected:** Confirmation modal appears
6. Confirm archive
7. ✅ **Expected:** Case removed from active list
8. Toggle **Show Archived** at top
9. ✅ **Expected:** Archived cases appear
10. Click **Unarchive**
11. ✅ **Expected:** Case returns to active list

---

## 🔒 SECURITY TESTING

### **Test Failed Login Protection:**
1. **Logout**
2. Try logging in with **wrong password** 5 times
3. ✅ **Expected:** Account locked after 5 failed attempts
4. ✅ **Error Message:** "Account locked due to 5 failed login attempts. Try again in 30 minutes"
5. **Wait 30 minutes** OR manually reset in database
6. ✅ **Expected:** Can login again after 30 minutes

### **Test Unauthorized Access:**
1. Login as **Viewer**
2. Try accessing: `http://localhost:5174/users` directly
3. ✅ **Expected:** Either redirected or shows error
4. Try API call: `http://localhost:8000/users` (using browser dev tools)
5. ✅ **Expected:** 403 Forbidden response

### **Test Token Expiration:**
1. Login as any user
2. Token expires in **8 hours** (or 30 days with "Remember Me")
3. After expiration:
4. ✅ **Expected:** Automatic redirect to login
5. ✅ **Expected:** Session cleared

---

## 🚀 PERFORMANCE TESTING

### **Test Page Load Times:**
1. Open browser DevTools (F12) → Network tab
2. Navigate to different pages:
   - ✅ **Dashboard:** Should load in < 1 second
   - ✅ **Cases List:** Should load in < 1 second
   - ✅ **Case Detail:** Should load in < 2 seconds
   - ✅ **Settings:** Should load instantly

### **Test API Response Times:**
1. In DevTools → Network tab, filter by "Fetch/XHR"
2. Check API call durations:
   - ✅ **Login:** < 200ms
   - ✅ **Dashboard stats:** < 300ms
   - ✅ **Cases list:** < 300ms
   - ✅ **Settings save:** < 200ms

---

## 🐛 EDGE CASE TESTING

### **Test Empty States:**
1. Login as a **new user** (create via Register)
2. Go to Dashboard
3. ✅ **Expected:** Shows "No cases assigned" or 0 counts (no errors)

### **Test Network Errors:**
1. **Stop backend** (for testing)
2. Try any action (e.g., load dashboard)
3. ✅ **Expected:** User-friendly error message
4. ✅ **Verify:** No blank page, no crash

### **Test Long Text:**
1. Create case with very long complaint text (5000+ characters)
2. ✅ **Expected:** Handles gracefully, no UI break

### **Test Special Characters:**
1. Enter special characters in fields: `<script>alert('xss')</script>`
2. ✅ **Expected:** Sanitized properly, no XSS execution

---

## ✅ FINAL VERIFICATION CHECKLIST

### **All Features Working:**
- [ ] Login/Logout works for all 3 roles
- [ ] Dashboard shows role-specific data
- [ ] Cases CRUD operations work
- [ ] Evidence upload and analysis works
- [ ] CrimeGPT responds correctly
- [ ] Reports generate successfully
- [ ] Settings persist across sessions
- [ ] All permissions enforced correctly
- [ ] Archive/unarchive works
- [ ] Profile shows real activity logs
- [ ] No console errors in browser
- [ ] No 500 errors from backend

### **Performance:**
- [ ] Pages load in < 2 seconds
- [ ] API calls respond in < 500ms
- [ ] No UI lag or freezing
- [ ] Smooth navigation between pages

### **Security:**
- [ ] Unauthorized actions blocked
- [ ] Permissions enforced backend
- [ ] Password validation works
- [ ] Failed login tracking works
- [ ] JWT tokens secure

### **Stability:**
- [ ] No crashes or blank pages
- [ ] Error messages user-friendly
- [ ] Network errors handled gracefully
- [ ] Empty states displayed properly

---

## 📊 EXPECTED RESULTS

After testing all above scenarios:

✅ **All features functional**  
✅ **No blocking bugs**  
✅ **Performance acceptable**  
✅ **Security enforced**  
✅ **UI responsive**  
✅ **Data persists correctly**

**If any test fails, check:**
1. Backend logs (terminal 7)
2. Frontend console (F12 → Console)
3. Network errors (F12 → Network)

---

## 🎉 TESTING COMPLETE

Once all tests pass:

✅ **System is production-ready**  
✅ **All 4 phases verified functional**  
✅ **Ready for deployment**

**Next:** Review `DEPLOYMENT_GUIDE.md` for production launch.

---

**Servers Running:**
- Frontend: http://localhost:5174
- Backend: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Happy Testing! 🚀**
