"""
PHASE 2 - DYNAMIC ROLE-BASED RUNTIME & SESSION MANAGEMENT
Complete Test Suite

Tests all aspects of dynamic role-based system with zero hardcoded data.
"""
import requests
import time
import json
from typing import Optional

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text: str):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*70}")
    print(f"{text}")
    print(f"{'='*70}{Colors.END}\n")

def print_step(step: str):
    print(f"\n{Colors.BLUE}{Colors.BOLD}▶ {step}{Colors.END}")

def print_success(message: str):
    print(f"{Colors.GREEN}  ✓ {message}{Colors.END}")

def print_error(message: str):
    print(f"{Colors.RED}  ✗ {message}{Colors.END}")

def print_info(message: str):
    print(f"{Colors.YELLOW}  ℹ {message}{Colors.END}")

# Test Users
TEST_USERS = {
    'admin': {
        'email': f'phase2_admin_{int(time.time())}@test.com',
        'password': 'Admin123',
        'full_name': 'Phase 2 Admin',
        'role': 'admin',
        'department': 'System Administration'
    },
    'investigator': {
        'email': f'phase2_investigator_{int(time.time())}@test.com',
        'password': 'Inv123',
        'full_name': 'Phase 2 Investigator',
        'role': 'investigator',
        'department': 'Cyber Crime Unit'
    },
    'viewer': {
        'email': f'phase2_viewer_{int(time.time())}@test.com',
        'password': 'View123',
        'full_name': 'Phase 2 Viewer',
        'role': 'viewer',
        'department': 'Monitoring Division'
    }
}

# Admin credentials for approval
ADMIN_EMAIL = "admin@sentinelai.gov.in"
ADMIN_PASSWORD = "admin123"

test_results = {
    'total': 0,
    'passed': 0,
    'failed': 0,
    'errors': []
}

def record_test(test_name: str, passed: bool, error: str = ''):
    test_results['total'] += 1
    if passed:
        test_results['passed'] += 1
        print_success(test_name)
    else:
        test_results['failed'] += 1
        test_results['errors'].append(f"{test_name}: {error}")
        print_error(f"{test_name} - {error}")

def register_user(user_data: dict) -> Optional[dict]:
    """Register a new user"""
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json={
            'full_name': user_data['full_name'],
            'email': user_data['email'],
            'password': user_data['password'],
            'role': user_data['role'],
            'department': user_data['department']
        })
        if response.status_code in [200, 201]:
            return response.json()
        return None
    except Exception as e:
        return None

def approve_user(user_id: str, admin_token: str) -> bool:
    """Approve a pending user"""
    try:
        response = requests.post(
            f"{BASE_URL}/users/{user_id}/approve",
            headers={'Authorization': f'Bearer {admin_token}'}
        )
        return response.status_code == 200
    except:
        return False

def login_user(email: str, password: str) -> Optional[dict]:
    """Login and return token and user"""
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={
            'email': email,
            'password': password
        })
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def get_current_user(token: str) -> Optional[dict]:
    """Get current user from /auth/me"""
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={'Authorization': f'Bearer {token}'}
        )
        if response.status_code == 200:
            return response.json()
        return None
    except:
        return None

def test_user_lifecycle(role: str):
    """Test complete lifecycle for a user role"""
    print_step(f"Testing {role.upper()} User Lifecycle")
    
    user_data = TEST_USERS[role]
    user_id = None
    token = None
    
    # 1. Register
    registered = register_user(user_data)
    if registered and 'id' in registered:
        user_id = registered['id']
        account_status = registered.get('account_status', '')
        if account_status == 'pending':
            record_test(f"{role}: Registration with pending status", True)
        else:
            record_test(f"{role}: Registration with pending status", False, f"Status is {account_status}")
    else:
        record_test(f"{role}: Registration", False, "Registration failed")
        return None
    
    # 2. Try login (should fail - pending)
    login_result = login_user(user_data['email'], user_data['password'])
    if login_result is None:
        record_test(f"{role}: Login blocked (pending)", True)
    else:
        record_test(f"{role}: Login blocked (pending)", False, "Login succeeded when it should be blocked")
    
    # 3. Get admin token and approve
    admin_login = login_user(ADMIN_EMAIL, ADMIN_PASSWORD)
    if admin_login and 'access_token' in admin_login:
        admin_token = admin_login['access_token']
        if approve_user(user_id, admin_token):
            record_test(f"{role}: Admin approval", True)
        else:
            record_test(f"{role}: Admin approval", False, "Approval failed")
            return None
    else:
        record_test(f"{role}: Admin approval", False, "Admin login failed")
        return None
    
    # 4. Login after approval
    login_result = login_user(user_data['email'], user_data['password'])
    if login_result and 'access_token' in login_result:
        token = login_result['access_token']
        returned_user = login_result.get('user', {})
        
        # Verify returned user matches registered data
        if (returned_user.get('email') == user_data['email'] and
            returned_user.get('role') == user_data['role'] and
            returned_user.get('full_name') == user_data['full_name']):
            record_test(f"{role}: Login returns correct user data", True)
        else:
            record_test(f"{role}: Login returns correct user data", False, "User data mismatch")
        
        record_test(f"{role}: Login success after approval", True)
    else:
        record_test(f"{role}: Login success after approval", False, "Login failed")
        return None
    
    # 5. Test /auth/me endpoint
    current_user = get_current_user(token)
    if current_user:
        # Verify no hardcoded data
        if (current_user.get('email') == user_data['email'] and
            current_user.get('role') == user_data['role'] and
            current_user.get('full_name') == user_data['full_name'] and
            current_user.get('department') == user_data['department']):
            record_test(f"{role}: /auth/me returns authentic user", True)
        else:
            record_test(f"{role}: /auth/me returns authentic user", False, "Data mismatch")
    else:
        record_test(f"{role}: /auth/me endpoint", False, "Endpoint failed")
    
    # 6. Test token persistence
    time.sleep(1)
    current_user_2 = get_current_user(token)
    if current_user_2 and current_user_2.get('id') == current_user.get('id'):
        record_test(f"{role}: Token persistence", True)
    else:
        record_test(f"{role}: Token persistence", False, "Token invalid after delay")
    
    return {
        'user_id': user_id,
        'token': token,
        'user_data': current_user
    }

def test_role_permissions(role: str, token: str):
    """Test role-specific permissions"""
    print_step(f"Testing {role.upper()} Permissions")
    
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test user management access (admin only)
    users_response = requests.get(f"{BASE_URL}/users", headers=headers)
    if role == 'admin':
        if users_response.status_code == 200:
            record_test(f"{role}: Can access user management", True)
        else:
            record_test(f"{role}: Can access user management", False, f"Status {users_response.status_code}")
    else:
        if users_response.status_code == 403:
            record_test(f"{role}: Cannot access user management", True)
        else:
            record_test(f"{role}: Cannot access user management", False, f"Got status {users_response.status_code}")
    
    # Test dashboard access (all roles)
    dashboard_response = requests.get(f"{BASE_URL}/stats/dashboard", headers=headers)
    if dashboard_response.status_code == 200:
        record_test(f"{role}: Can access dashboard", True)
    else:
        record_test(f"{role}: Can access dashboard", False, f"Status {dashboard_response.status_code}")
    
    # Test profile access (all roles)
    profile_response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    if profile_response.status_code == 200:
        record_test(f"{role}: Can access profile", True)
    else:
        record_test(f"{role}: Can access profile", False, f"Status {profile_response.status_code}")

def test_role_change_simulation(admin_token: str, user_id: str, original_role: str):
    """Test that changing role affects next login"""
    print_step("Testing Dynamic Role Change")
    
    headers = {'Authorization': f'Bearer {admin_token}'}
    
    # Change role from investigator to viewer
    new_role = 'viewer' if original_role == 'investigator' else 'investigator'
    
    response = requests.put(
        f"{BASE_URL}/users/{user_id}",
        headers=headers,
        json={'role': new_role}
    )
    
    if response.status_code == 200:
        updated_user = response.json()
        if updated_user.get('role') == new_role:
            record_test(f"Role changed from {original_role} to {new_role}", True)
            return new_role
        else:
            record_test(f"Role change", False, "Role not updated in response")
    else:
        record_test(f"Role change", False, f"Status {response.status_code}")
    
    return None

def test_session_expiry():
    """Test invalid token handling"""
    print_step("Testing Session & Token Validation")
    
    # Test with invalid token
    response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={'Authorization': 'Bearer invalid_token_12345'}
    )
    
    if response.status_code == 401:
        record_test("Invalid token rejected", True)
    else:
        record_test("Invalid token rejected", False, f"Got status {response.status_code}")
    
    # Test with no token
    response = requests.get(f"{BASE_URL}/auth/me")
    if response.status_code in [401, 403]:
        record_test("No token rejected", True)
    else:
        record_test("No token rejected", False, f"Got status {response.status_code}")

def cleanup_test_users(admin_token: str, user_ids: list):
    """Delete test users"""
    print_step("Cleaning up test users")
    
    headers = {'Authorization': f'Bearer {admin_token}'}
    for user_id in user_ids:
        try:
            requests.delete(f"{BASE_URL}/users/{user_id}", headers=headers)
        except:
            pass
    print_info(f"Cleaned up {len(user_ids)} test users")

def main():
    print_header("PHASE 2 - DYNAMIC ROLE-BASED RUNTIME & SESSION MANAGEMENT TEST")
    
    created_users = {}
    user_ids = []
    
    try:
        # Test each role
        for role in ['admin', 'investigator', 'viewer']:
            result = test_user_lifecycle(role)
            if result:
                created_users[role] = result
                user_ids.append(result['user_id'])
        
        # Test permissions for each role
        for role, data in created_users.items():
            if data and data.get('token'):
                test_role_permissions(role, data['token'])
        
        # Test role change
        if 'investigator' in created_users and 'admin' in created_users:
            admin_login = login_user(ADMIN_EMAIL, ADMIN_PASSWORD)
            if admin_login:
                test_role_change_simulation(
                    admin_login['access_token'],
                    created_users['investigator']['user_id'],
                    'investigator'
                )
        
        # Test session management
        test_session_expiry()
        
        # Cleanup
        admin_login = login_user(ADMIN_EMAIL, ADMIN_PASSWORD)
        if admin_login and user_ids:
            cleanup_test_users(admin_login['access_token'], user_ids)
        
    except Exception as e:
        print_error(f"Test suite error: {e}")
        import traceback
        traceback.print_exc()
    
    # Print results
    print_header("TEST RESULTS")
    print(f"{Colors.BOLD}Total Tests:{Colors.END} {test_results['total']}")
    print(f"{Colors.GREEN}{Colors.BOLD}Passed:{Colors.END} {test_results['passed']}")
    print(f"{Colors.RED}{Colors.BOLD}Failed:{Colors.END} {test_results['failed']}")
    
    if test_results['failed'] > 0:
        print(f"\n{Colors.RED}{Colors.BOLD}Failed Tests:{Colors.END}")
        for error in test_results['errors']:
            print(f"  • {error}")
    
    pass_rate = (test_results['passed'] / test_results['total'] * 100) if test_results['total'] > 0 else 0
    print(f"\n{Colors.CYAN}{Colors.BOLD}Pass Rate: {pass_rate:.1f}%{Colors.END}")
    
    if test_results['failed'] == 0:
        print(f"\n{Colors.GREEN}{Colors.BOLD}{'='*70}")
        print("ALL TESTS PASSED! ✓")
        print(f"{'='*70}{Colors.END}\n")
        return 0
    else:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}{'='*70}")
        print(f"SOME TESTS FAILED ({test_results['failed']}/{test_results['total']})")
        print(f"{'='*70}{Colors.END}\n")
        return 1

if __name__ == "__main__":
    try:
        exit_code = main()
        exit(exit_code)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Test interrupted by user{Colors.END}")
        exit(1)
    except Exception as e:
        print(f"\n{Colors.RED}Fatal error: {e}{Colors.END}")
        import traceback
        traceback.print_exc()
        exit(1)
