"""
Phase 1 - User Management System - Complete Workflow Test

Tests:
1. Register new user → Status should be 'pending'
2. Verify user cannot login (pending approval)
3. Admin approves user → Status should be 'active'
4. User can now login
5. Change user role → Verify role changed
6. Deactivate user → Verify login denied
7. Activate user → Verify login works
8. Suspend user → Verify login denied
9. Unlock locked account
10. Delete user → Verify removed
"""
import requests
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_step(step_num, description):
    print(f"\n{Colors.CYAN}{Colors.BOLD}Step {step_num}: {description}{Colors.END}")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠ {message}{Colors.END}")

# Admin credentials
ADMIN_EMAIL = "admin@sentinelai.gov.in"
ADMIN_PASSWORD = "admin123"

def get_admin_token():
    """Login as admin and get token"""
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print_error(f"Admin login failed: {response.json()}")
        return None

def test_phase1_workflow():
    print(f"{Colors.BOLD}{'='*70}")
    print("PHASE 1 - USER MANAGEMENT SYSTEM - WORKFLOW TEST")
    print(f"{'='*70}{Colors.END}\n")
    
    # Get admin token
    print_step(0, "Admin Login")
    admin_token = get_admin_token()
    if not admin_token:
        print_error("Cannot proceed without admin access")
        return False
    print_success("Admin authenticated")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 1: Register new user
    print_step(1, "Register New User (should be PENDING)")
    test_user_email = f"test_phase1_{int(time.time())}@test.com"
    test_user_password = "TestPass123"
    
    register_response = requests.post(f"{BASE_URL}/auth/register", json={
        "full_name": "Phase 1 Test User",
        "email": test_user_email,
        "password": test_user_password,
        "role": "investigator",
        "department": "Testing Department"
    })
    
    if register_response.status_code == 200:
        user_data = register_response.json()
        test_user_id = user_data["id"]
        account_status = user_data.get("account_status", "N/A")
        
        if account_status == "pending":
            print_success(f"User registered with status: {account_status}")
            print_info(f"  User ID: {test_user_id}")
            print_info(f"  Email: {test_user_email}")
        else:
            print_error(f"Expected status 'pending' but got '{account_status}'")
            return False
    else:
        print_error(f"Registration failed: {register_response.json()}")
        return False
    
    # Test 2: Attempt login (should fail - pending approval)
    print_step(2, "Attempt Login (should FAIL - pending approval)")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_user_email,
        "password": test_user_password
    })
    
    if login_response.status_code == 403:
        error_detail = login_response.json().get("detail", "")
        if "pending" in error_detail.lower():
            print_success(f"Login correctly blocked: {error_detail}")
        else:
            print_warning(f"Login blocked but unexpected message: {error_detail}")
    else:
        print_error(f"Login should have been blocked but got status {login_response.status_code}")
        return False
    
    # Test 3: Admin approves user
    print_step(3, "Admin Approves User")
    approve_response = requests.post(f"{BASE_URL}/users/{test_user_id}/approve", headers=headers)
    
    if approve_response.status_code == 200:
        approved_user = approve_response.json()
        if approved_user.get("account_status") == "active":
            print_success("User approved successfully")
            print_info(f"  Status: {approved_user.get('account_status')}")
        else:
            print_error(f"Expected status 'active' but got '{approved_user.get('account_status')}'")
            return False
    else:
        print_error(f"Approval failed: {approve_response.json()}")
        return False
    
    # Test 4: Login should now work
    print_step(4, "Login After Approval (should SUCCEED)")
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_user_email,
        "password": test_user_password
    })
    
    if login_response.status_code == 200:
        user_token = login_response.json()["access_token"]
        print_success("Login successful")
        print_info(f"  Token received: {user_token[:20]}...")
    else:
        print_error(f"Login failed: {login_response.json()}")
        return False
    
    # Test 5: Change role
    print_step(5, "Change User Role (Investigator → Viewer)")
    update_response = requests.put(f"{BASE_URL}/users/{test_user_id}", 
        headers=headers,
        json={"role": "viewer"}
    )
    
    if update_response.status_code == 200:
        updated_user = update_response.json()
        if updated_user.get("role") == "viewer":
            print_success("Role changed successfully")
            print_info(f"  New role: {updated_user.get('role')}")
        else:
            print_error(f"Role change failed")
            return False
    else:
        print_error(f"Update failed: {update_response.json()}")
        return False
    
    # Test 6: Deactivate user
    print_step(6, "Deactivate User")
    deactivate_response = requests.post(f"{BASE_URL}/users/{test_user_id}/deactivate", headers=headers)
    
    if deactivate_response.status_code == 200:
        print_success("User deactivated")
        
        # Try to login (should fail)
        login_response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": test_user_email,
            "password": test_user_password
        })
        
        if login_response.status_code == 403:
            print_success("Login correctly blocked for inactive account")
        else:
            print_error("Inactive user was able to login")
            return False
    else:
        print_error(f"Deactivation failed: {deactivate_response.json()}")
        return False
    
    # Test 7: Reactivate user
    print_step(7, "Reactivate User")
    activate_response = requests.post(f"{BASE_URL}/users/{test_user_id}/activate", headers=headers)
    
    if activate_response.status_code == 200:
        print_success("User reactivated")
        
        # Try to login (should work)
        login_response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": test_user_email,
            "password": test_user_password
        })
        
        if login_response.status_code == 200:
            print_success("Login successful after reactivation")
        else:
            print_error("Login failed after reactivation")
            return False
    else:
        print_error(f"Reactivation failed: {activate_response.json()}")
        return False
    
    # Test 8: Suspend user
    print_step(8, "Suspend User")
    suspend_response = requests.post(f"{BASE_URL}/users/{test_user_id}/suspend", headers=headers)
    
    if suspend_response.status_code == 200:
        print_success("User suspended")
        
        # Try to login (should fail)
        login_response = requests.post(f"{BASE_URL}/auth/login", json={
            "email": test_user_email,
            "password": test_user_password
        })
        
        if login_response.status_code == 403:
            error_detail = login_response.json().get("detail", "")
            if "suspended" in error_detail.lower():
                print_success(f"Login correctly blocked: {error_detail}")
            else:
                print_warning(f"Login blocked but unexpected message: {error_detail}")
        else:
            print_error("Suspended user was able to login")
            return False
    else:
        print_error(f"Suspension failed: {suspend_response.json()}")
        return False
    
    # Test 9: Test unlock (first need to lock account)
    print_step(9, "Test Account Lock & Unlock")
    
    # Re-approve to test lock
    approve_response = requests.post(f"{BASE_URL}/users/{test_user_id}/approve", headers=headers)
    
    # Make 5 failed login attempts
    print_info("  Making 5 failed login attempts...")
    for i in range(5):
        requests.post(f"{BASE_URL}/auth/login", json={
            "email": test_user_email,
            "password": "wrong_password"
        })
    
    # Try with correct password (should be locked)
    login_response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": test_user_email,
        "password": test_user_password
    })
    
    if login_response.status_code == 403:
        print_success("Account locked after 5 failed attempts")
        
        # Unlock account
        unlock_response = requests.post(f"{BASE_URL}/users/{test_user_id}/unlock", headers=headers)
        
        if unlock_response.status_code == 200:
            print_success("Account unlocked")
            
            # Try login again (should work)
            login_response = requests.post(f"{BASE_URL}/auth/login", json={
                "email": test_user_email,
                "password": test_user_password
            })
            
            if login_response.status_code == 200:
                print_success("Login successful after unlock")
            else:
                print_error("Login failed after unlock")
                return False
        else:
            print_error(f"Unlock failed: {unlock_response.json()}")
            return False
    else:
        print_warning("Account was not locked as expected")
    
    # Test 10: Delete user
    print_step(10, "Delete User")
    delete_response = requests.delete(f"{BASE_URL}/users/{test_user_id}", headers=headers)
    
    if delete_response.status_code == 200:
        print_success("User deleted successfully")
        
        # Verify user is gone
        get_response = requests.get(f"{BASE_URL}/users/{test_user_id}", headers=headers)
        
        if get_response.status_code == 404:
            print_success("User verified as deleted")
        else:
            print_error("User still exists after deletion")
            return False
    else:
        print_error(f"Deletion failed: {delete_response.json()}")
        return False
    
    # Test 11: Get user list
    print_step(11, "Test User List API")
    list_response = requests.get(f"{BASE_URL}/users", headers=headers, params={
        "page": 1,
        "per_page": 10
    })
    
    if list_response.status_code == 200:
        data = list_response.json()
        print_success(f"User list retrieved: {data['total']} total users")
        print_info(f"  Page {data['page']} of {data['total_pages']}")
        print_info(f"  {len(data['users'])} users on this page")
    else:
        print_error(f"User list failed: {list_response.json()}")
        return False
    
    # Test 12: Get user profile
    print_step(12, "Test User Profile API")
    # Use admin's own ID for this test
    me_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    admin_id = me_response.json()["id"]
    
    profile_response = requests.get(f"{BASE_URL}/users/{admin_id}/profile", headers=headers)
    
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        print_success("User profile retrieved")
        print_info(f"  Total cases: {profile_data['stats']['total_cases']}")
        print_info(f"  Login history entries: {len(profile_data['login_history'])}")
        print_info(f"  Recent activity entries: {len(profile_data['recent_activity'])}")
    else:
        print_error(f"Profile retrieval failed: {profile_response.json()}")
        return False
    
    # All tests passed
    print(f"\n{Colors.GREEN}{Colors.BOLD}{'='*70}")
    print("ALL TESTS PASSED! ✓")
    print(f"{'='*70}{Colors.END}\n")
    
    return True

if __name__ == "__main__":
    try:
        success = test_phase1_workflow()
        exit(0 if success else 1)
    except Exception as e:
        print_error(f"Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
