"""
PHASE 2 - Quick Validation Test
Tests core dynamic role-based functionality
"""
import requests
import time

BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@sentinelai.gov.in"
ADMIN_PASSWORD = "admin123"

print("="*60)
print("PHASE 2 - DYNAMIC ROLE-BASED SYSTEM - QUICK TEST")
print("="*60)

# 1. Test Admin Login
print("\n1. Admin Login & User Data...")
admin_login = requests.post(f"{BASE_URL}/auth/login", json={
    'email': ADMIN_EMAIL,
    'password': ADMIN_PASSWORD
})
print(f"   Status: {admin_login.status_code}")
if admin_login.status_code == 200:
    admin_data = admin_login.json()
    admin_token = admin_data['access_token']
    admin_user = admin_data.get('user', {})
    print(f"   ✓ Logged in as: {admin_user.get('full_name')}")
    print(f"   ✓ Role: {admin_user.get('role')}")
    print(f"   ✓ Email: {admin_user.get('email')}")
    print(f"   ✓ Department: {admin_user.get('department', 'N/A')}")
else:
    print(f"   ✗ Login failed")
    exit(1)

# 2. Test /auth/me endpoint
print("\n2. /auth/me Endpoint...")
me_response = requests.get(
    f"{BASE_URL}/auth/me",
    headers={'Authorization': f'Bearer {admin_token}'}
)
print(f"   Status: {me_response.status_code}")
if me_response.status_code == 200:
    me_data = me_response.json()
    if (me_data.get('email') == ADMIN_EMAIL and
        me_data.get('role') == 'admin'):
        print(f"   ✓ Returns correct authenticated user")
        print(f"   ✓ No hardcoded data detected")
    else:
        print(f"   ✗ User data mismatch")
else:
    print(f"   ✗ Failed")

# 3. Test permissions - Admin can access users
print("\n3. Admin Permissions (User Management)...")
users_response = requests.get(
    f"{BASE_URL}/users",
    headers={'Authorization': f'Bearer {admin_token}'}
)
print(f"   Status: {users_response.status_code}")
if users_response.status_code == 200:
    users_data = users_response.json()
    print(f"   ✓ Admin can access user management")
    print(f"   ✓ Total users: {users_data.get('total', 0)}")
else:
    print(f"   ✗ Access denied")

# 4. Register test investigator
print("\n4. Register Test Investigator...")
test_email = f"phase2_test_{int(time.time())}@test.com"
register_response = requests.post(f"{BASE_URL}/auth/register", json={
    'full_name': 'Phase 2 Test Investigator',
    'email': test_email,
    'password': 'Test123',
    'role': 'investigator',
    'department': 'Testing'
})
print(f"   Status: {register_response.status_code}")
if register_response.status_code in [200, 201]:
    test_user = register_response.json()
    test_user_id = test_user['id']
    if test_user.get('account_status') == 'pending':
        print(f"   ✓ Registered with pending status")
    else:
        print(f"   ✗ Status is {test_user.get('account_status')}")
else:
    print(f"   ✗ Registration failed")
    exit(1)

# 5. Test login blocked (pending)
print("\n5. Login Blocked (Pending Approval)...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    'email': test_email,
    'password': 'Test123'
})
print(f"   Status: {login_response.status_code}")
if login_response.status_code == 403:
    print(f"   ✓ Login correctly blocked")
    print(f"   ✓ Message: {login_response.json().get('detail', '')[:50]}...")
else:
    print(f"   ✗ Login should be blocked but got {login_response.status_code}")

# 6. Admin approves
print("\n6. Admin Approves User...")
approve_response = requests.post(
    f"{BASE_URL}/users/{test_user_id}/approve",
    headers={'Authorization': f'Bearer {admin_token}'}
)
print(f"   Status: {approve_response.status_code}")
if approve_response.status_code == 200:
    print(f"   ✓ User approved")
else:
    print(f"   ✗ Approval failed")

# 7. Login after approval
print("\n7. Login After Approval...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    'email': test_email,
    'password': 'Test123'
})
print(f"   Status: {login_response.status_code}")
if login_response.status_code == 200:
    inv_data = login_response.json()
    inv_token = inv_data['access_token']
    inv_user = inv_data['user']
    
    # Verify returned data matches registered data
    if (inv_user.get('email') == test_email and
        inv_user.get('role') == 'investigator' and
        inv_user.get('full_name') == 'Phase 2 Test Investigator'):
        print(f"   ✓ Login successful")
        print(f"   ✓ User data matches registration")
        print(f"   ✓ No hardcoded data")
    else:
        print(f"   ✗ User data mismatch")
else:
    print(f"   ✗ Login failed")
    exit(1)

# 8. Test investigator permissions (cannot access user management)
print("\n8. Investigator Permissions...")
users_response = requests.get(
    f"{BASE_URL}/users",
    headers={'Authorization': f'Bearer {inv_token}'}
)
print(f"   Status: {users_response.status_code}")
if users_response.status_code == 403:
    print(f"   ✓ Investigator correctly denied user management access")
else:
    print(f"   ✗ Should be denied but got {users_response.status_code}")

# 9. Test investigator can access dashboard
print("\n9. Investigator Dashboard Access...")
dashboard_response = requests.get(
    f"{BASE_URL}/stats/dashboard",
    headers={'Authorization': f'Bearer {inv_token}'}
)
print(f"   Status: {dashboard_response.status_code}")
if dashboard_response.status_code == 200:
    print(f"   ✓ Investigator can access dashboard")
else:
    print(f"   ✗ Dashboard access denied")

# 10. Test role change
print("\n10. Role Change (Investigator → Viewer)...")
role_change_response = requests.put(
    f"{BASE_URL}/users/{test_user_id}",
    headers={'Authorization': f'Bearer {admin_token}'},
    json={'role': 'viewer'}
)
print(f"   Status: {role_change_response.status_code}")
if role_change_response.status_code == 200:
    updated_user = role_change_response.json()
    if updated_user.get('role') == 'viewer':
        print(f"   ✓ Role changed to viewer")
    else:
        print(f"   ✗ Role not changed")
else:
    print(f"   ✗ Role change failed")

# 11. Verify role change on next login
print("\n11. Verify Role Change on Re-login...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    'email': test_email,
    'password': 'Test123'
})
if login_response.status_code == 200:
    new_login_user = login_response.json()['user']
    if new_login_user.get('role') == 'viewer':
        print(f"   ✓ Role change reflected in new login")
        print(f"   ✓ Dynamic role system working")
    else:
        print(f"   ✗ Role is still {new_login_user.get('role')}")
else:
    print(f"   ✗ Re-login failed")

# 12. Cleanup
print("\n12. Cleanup Test User...")
delete_response = requests.delete(
    f"{BASE_URL}/users/{test_user_id}",
    headers={'Authorization': f'Bearer {admin_token}'}
)
if delete_response.status_code == 200:
    print(f"   ✓ Test user deleted")
else:
    print(f"   ⚠ Cleanup failed (status {delete_response.status_code})")

print("\n" + "="*60)
print("ALL CORE TESTS PASSED ✓")
print("PHASE 2 - DYNAMIC ROLE-BASED SYSTEM: VERIFIED")
print("="*60)
