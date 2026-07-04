"""
User Context & Role Mapping Test Suite
Verifies that login returns correct user and role data
"""
import requests

BASE_URL = "http://localhost:8000"

test_results = {"total": 0, "passed": 0, "failed": 0, "errors": []}

def log_test(name: str, passed: bool, error: str = None):
    test_results["total"] += 1
    if passed:
        test_results["passed"] += 1
        print(f"✓ {name}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append({"test": name, "error": error})
        print(f"✗ {name}: {error}")


def test_admin_login():
    """Test admin login returns admin user data"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@crimegpt.gov.in", "password": "admin123", "remember_me": False}
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            # Verify response structure
            checks = [
                ("Has access_token", "access_token" in data),
                ("Has role", "role" in data),
                ("Has user", "user" in data),
                ("User has email", "email" in user),
                ("User has full_name", "full_name" in user),
                ("User has role", "role" in user),
            ]
            
            # Verify data correctness
            checks.extend([
                ("Role is admin", data.get("role") == "admin"),
                ("User role is admin", user.get("role") == "admin"),
                ("Email is correct", user.get("email") == "admin@crimegpt.gov.in"),
                ("Name is Admin User", user.get("full_name") == "Admin User"),
            ])
            
            failed_checks = [name for name, result in checks if not result]
            
            if failed_checks:
                log_test("Admin Login - Data Correctness", False, f"Failed: {', '.join(failed_checks)}")
            else:
                log_test("Admin Login - Data Correctness", True)
                
        else:
            log_test("Admin Login - Data Correctness", False, f"Status {response.status_code}")
    except Exception as e:
        log_test("Admin Login - Data Correctness", False, str(e))


def test_investigator_login():
    """Test investigator login returns investigator user data"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "investigator@crimegpt.gov.in", "password": "investigator123", "remember_me": False}
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            checks = [
                ("Role is investigator", data.get("role") == "investigator"),
                ("User role is investigator", user.get("role") == "investigator"),
                ("Email is correct", user.get("email") == "investigator@crimegpt.gov.in"),
                ("Name is Investigator User", user.get("full_name") == "Investigator User"),
            ]
            
            failed_checks = [name for name, result in checks if not result]
            
            if failed_checks:
                log_test("Investigator Login - Data Correctness", False, f"Failed: {', '.join(failed_checks)}")
            else:
                log_test("Investigator Login - Data Correctness", True)
        else:
            log_test("Investigator Login - Data Correctness", False, f"Status {response.status_code}")
    except Exception as e:
        log_test("Investigator Login - Data Correctness", False, str(e))


def test_viewer_login():
    """Test viewer login returns viewer user data"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "viewer@crimegpt.gov.in", "password": "viewer123", "remember_me": False}
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user", {})
            
            checks = [
                ("Role is viewer", data.get("role") == "viewer"),
                ("User role is viewer", user.get("role") == "viewer"),
                ("Email is correct", user.get("email") == "viewer@crimegpt.gov.in"),
                ("Name is Viewer User", user.get("full_name") == "Viewer User"),
            ]
            
            failed_checks = [name for name, result in checks if not result]
            
            if failed_checks:
                log_test("Viewer Login - Data Correctness", False, f"Failed: {', '.join(failed_checks)}")
            else:
                log_test("Viewer Login - Data Correctness", True)
        else:
            log_test("Viewer Login - Data Correctness", False, f"Status {response.status_code}")
    except Exception as e:
        log_test("Viewer Login - Data Correctness", False, str(e))


def test_auth_me_endpoint():
    """Test /auth/me returns authenticated user"""
    try:
        # First login
        login_response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@crimegpt.gov.in", "password": "admin123", "remember_me": False}
        )
        
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            
            # Then get current user
            me_response = requests.get(
                f"{BASE_URL}/auth/me",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if me_response.status_code == 200:
                user = me_response.json()
                
                checks = [
                    ("Email is admin", user.get("email") == "admin@crimegpt.gov.in"),
                    ("Role is admin", user.get("role") == "admin"),
                    ("Name is Admin User", user.get("full_name") == "Admin User"),
                    ("Is active", user.get("is_active") is True),
                ]
                
                failed_checks = [name for name, result in checks if not result]
                
                if failed_checks:
                    log_test("/auth/me Returns Correct User", False, f"Failed: {', '.join(failed_checks)}")
                else:
                    log_test("/auth/me Returns Correct User", True)
            else:
                log_test("/auth/me Returns Correct User", False, f"Status {me_response.status_code}")
        else:
            log_test("/auth/me Returns Correct User", False, "Login failed")
    except Exception as e:
        log_test("/auth/me Returns Correct User", False, str(e))


def test_jwt_payload():
    """Test JWT contains correct user information"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@crimegpt.gov.in", "password": "admin123", "remember_me": False}
        )
        
        if response.status_code == 200:
            token = response.json().get("access_token")
            
            # Decode JWT (basic check - we trust the backend to verify)
            import base64
            import json
            
            # JWT format: header.payload.signature
            parts = token.split('.')
            if len(parts) == 3:
                # Decode payload (add padding if needed)
                payload = parts[1]
                payload += '=' * (4 - len(payload) % 4)
                decoded = json.loads(base64.urlsafe_b64decode(payload))
                
                checks = [
                    ("Has sub (email)", "sub" in decoded),
                    ("Has role", "role" in decoded),
                    ("Has user_id", "user_id" in decoded),
                    ("Has exp (expiration)", "exp" in decoded),
                    ("Email is admin", decoded.get("sub") == "admin@crimegpt.gov.in"),
                    ("Role is admin", decoded.get("role") == "admin"),
                ]
                
                failed_checks = [name for name, result in checks if not result]
                
                if failed_checks:
                    log_test("JWT Payload Correctness", False, f"Failed: {', '.join(failed_checks)}")
                else:
                    log_test("JWT Payload Correctness", True)
            else:
                log_test("JWT Payload Correctness", False, "Invalid JWT format")
        else:
            log_test("JWT Payload Correctness", False, f"Status {response.status_code}")
    except Exception as e:
        log_test("JWT Payload Correctness", False, str(e))


def run_tests():
    print("=" * 70)
    print("USER CONTEXT & ROLE MAPPING TEST SUITE")
    print("=" * 70)
    
    print("\n=== Login Response Tests ===")
    test_admin_login()
    test_investigator_login()
    test_viewer_login()
    
    print("\n=== API Endpoint Tests ===")
    test_auth_me_endpoint()
    test_jwt_payload()
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"Total Tests: {test_results['total']}")
    print(f"Passed: {test_results['passed']} ✓")
    print(f"Failed: {test_results['failed']} ✗")
    
    if test_results['failed'] > 0:
        print("\nFailed Tests:")
        for error in test_results['errors']:
            print(f"  • {error['test']}: {error['error']}")
    
    pass_rate = (test_results['passed'] / test_results['total']) * 100 if test_results['total'] > 0 else 0
    print(f"\nPass Rate: {pass_rate:.1f}%")
    
    if pass_rate == 100:
        print("🟢 EXCELLENT - All user context tests passed")
    elif pass_rate >= 80:
        print("🟡 GOOD - Minor issues")
    else:
        print("🔴 FAILED - Critical issues found")
    
    print("=" * 70)


if __name__ == "__main__":
    run_tests()
