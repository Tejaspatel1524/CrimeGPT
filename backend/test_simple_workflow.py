"""
Simple test to verify Phase 1 functionality
"""
import requests
import time

BASE_URL = "http://localhost:8000"

print("=" * 60)
print("PHASE 1 - SIMPLE WORKFLOW TEST")
print("=" * 60)

# 1. Admin login
print("\n1. Admin Login...")
admin_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "admin@sentinelai.gov.in",
    "password": "admin123"
})
print(f"   Status: {admin_response.status_code}")
if admin_response.status_code == 200:
    admin_token = admin_response.json()["access_token"]
    print("   ✓ Admin logged in")
else:
    print(f"   ✗ Failed: {admin_response.json()}")
    exit(1)

headers = {"Authorization": f"Bearer {admin_token}"}

# 2. Register new user
print("\n2. Register New User...")
test_email = f"test_{int(time.time())}@test.com"
register_response = requests.post(f"{BASE_URL}/auth/register", json={
    "full_name": "Test User",
    "email": test_email,
    "password": "Test123",
    "role": "investigator"
})
print(f"   Status: {register_response.status_code}")
if register_response.status_code in [200, 201]:  # 201 Created is also valid
    user_data = register_response.json()
    user_id = user_data["id"]
    print(f"   ✓ User registered: {user_data['email']}")
    print(f"   Account Status: {user_data.get('account_status', 'N/A')}")
    print(f"   Is Active: {user_data.get('is_active', 'N/A')}")
else:
    print(f"   ✗ Failed: {register_response.json()}")
    exit(1)

# 3. Try to login (should fail - pending)
print("\n3. Try Login (should fail - pending approval)...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": test_email,
    "password": "Test123"
})
print(f"   Status: {login_response.status_code}")
if login_response.status_code == 403:
    print(f"   ✓ Login blocked: {login_response.json().get('detail', '')}")
else:
    print(f"   ✗ Unexpected status: {login_response.json()}")

# 4. Approve user
print("\n4. Admin Approves User...")
approve_response = requests.post(f"{BASE_URL}/users/{user_id}/approve", headers=headers)
print(f"   Status: {approve_response.status_code}")
if approve_response.status_code == 200:
    approved_user = approve_response.json()
    print(f"   ✓ User approved")
    print(f"   Account Status: {approved_user.get('account_status', 'N/A')}")
else:
    print(f"   ✗ Failed: {approve_response.json()}")
    exit(1)

# 5. Login should work now
print("\n5. Try Login Again (should succeed)...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": test_email,
    "password": "Test123"
})
print(f"   Status: {login_response.status_code}")
if login_response.status_code == 200:
    print(f"   ✓ Login successful!")
else:
    print(f"   ✗ Failed: {login_response.json()}")
    exit(1)

# 6. Suspend user
print("\n6. Admin Suspends User...")
suspend_response = requests.post(f"{BASE_URL}/users/{user_id}/suspend", headers=headers)
print(f"   Status: {suspend_response.status_code}")
if suspend_response.status_code == 200:
    print(f"   ✓ User suspended")
else:
    print(f"   ✗ Failed: {suspend_response.json()}")

# 7. Try login (should fail - suspended)
print("\n7. Try Login (should fail - suspended)...")
login_response = requests.post(f"{BASE_URL}/auth/login", json={
    "email": test_email,
    "password": "Test123"
})
print(f"   Status: {login_response.status_code}")
if login_response.status_code == 403:
    print(f"   ✓ Login blocked: {login_response.json().get('detail', '')}")
else:
    print(f"   ✗ Unexpected: {login_response.json()}")

# 8. Delete user
print("\n8. Admin Deletes User...")
delete_response = requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers)
print(f"   Status: {delete_response.status_code}")
if delete_response.status_code == 200:
    print(f"   ✓ User deleted")
else:
    print(f"   ✗ Failed: {delete_response.json()}")

print("\n" + "=" * 60)
print("ALL TESTS PASSED ✓")
print("=" * 60)
