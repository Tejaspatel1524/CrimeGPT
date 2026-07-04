"""
Complete Authentication Test Suite
Tests all authentication flows including edge cases
"""
import requests
import time

BASE_URL = "http://localhost:8000"

test_results = {
    "total": 0,
    "passed": 0,
    "failed": 0,
    "errors": []
}

def log_test(test_name: str, passed: bool, error: str = None):
    """Log test result"""
    test_results["total"] += 1
    if passed:
        test_results["passed"] += 1
        print(f"✓ {test_name}")
    else:
        test_results["failed"] += 1
        test_results["errors"].append({"test": test_name, "error": error})
        print(f"✗ {test_name}: {error}")


def test_valid_login(email: str, password: str, role: str):
    """Test valid login credentials"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password, "remember_me": False}
        )
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data and data.get("role") == role:
                log_test(f"Valid Login ({role})", True)
                return data["access_token"]
            else:
                log_test(f"Valid Login ({role})", False, "Missing token or incorrect role")
                return None
        else:
            log_test(f"Valid Login ({role})", False, f"Status {response.status_code}: {response.text}")
            return None
    except Exception as e:
        log_test(f"Valid Login ({role})", False, str(e))
        return None


def test_invalid_password(email: str):
    """Test login with wrong password (should return 401)"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": "wrong_password", "remember_me": False}
        )
        
        if response.status_code == 401:
            log_test(f"Invalid Password ({email})", True)
        else:
            log_test(f"Invalid Password ({email})", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_test(f"Invalid Password ({email})", False, str(e))


def test_nonexistent_user():
    """Test login with non-existent email (should return 401)"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "nonexistent@test.com", "password": "password", "remember_me": False}
        )
        
        if response.status_code == 401:
            log_test("Non-existent User", True)
        else:
            log_test("Non-existent User", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_test("Non-existent User", False, str(e))


def test_get_current_user(token: str, expected_email: str):
    """Test /auth/me endpoint with valid token"""
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("email") == expected_email:
                log_test(f"Get Current User ({expected_email})", True)
            else:
                log_test(f"Get Current User ({expected_email})", False, "Email mismatch")
        else:
            log_test(f"Get Current User ({expected_email})", False, f"Status {response.status_code}")
    except Exception as e:
        log_test(f"Get Current User ({expected_email})", False, str(e))


def test_invalid_token():
    """Test /auth/me with invalid token (should return 401)"""
    try:
        response = requests.get(
            f"{BASE_URL}/auth/me",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        
        if response.status_code == 401:
            log_test("Invalid Token", True)
        else:
            log_test("Invalid Token", False, f"Expected 401, got {response.status_code}")
    except Exception as e:
        log_test("Invalid Token", False, str(e))


def test_remember_me():
    """Test login with remember_me=true"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": "admin@crimegpt.gov.in", "password": "admin123", "remember_me": True}
        )
        
        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                log_test("Remember Me (30-day token)", True)
            else:
                log_test("Remember Me (30-day token)", False, "Missing token")
        else:
            log_test("Remember Me (30-day token)", False, f"Status {response.status_code}")
    except Exception as e:
        log_test("Remember Me (30-day token)", False, str(e))


def test_failed_login_tracking():
    """Test that failed logins are tracked (will lock account after 5 attempts)"""
    test_email = "investigator@crimegpt.gov.in"
    
    # First, unlock the account if it's locked
    from app.database.database import get_db
    from app.database.models import UserDB
    db = next(get_db())
    user = db.query(UserDB).filter(UserDB.email == test_email).first()
    if user:
        user.failed_login_attempts = 0
        db.commit()
    
    try:
        # Try 3 failed logins
        for i in range(3):
            requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": test_email, "password": "wrong_password", "remember_me": False}
            )
            time.sleep(0.1)
        
        # Check if failed attempts were tracked
        db = next(get_db())
        user = db.query(UserDB).filter(UserDB.email == test_email).first()
        
        if user and user.failed_login_attempts == 3:
            log_test("Failed Login Tracking", True)
            # Reset counter
            user.failed_login_attempts = 0
            db.commit()
        else:
            log_test("Failed Login Tracking", False, f"Expected 3 attempts, got {user.failed_login_attempts if user else 'N/A'}")
    except Exception as e:
        log_test("Failed Login Tracking", False, str(e))


def test_account_lock():
    """Test that account locks after 5 failed attempts"""
    test_email = "viewer@crimegpt.gov.in"
    
    # First, unlock and prepare
    from app.database.database import get_db
    from app.database.models import UserDB
    db = next(get_db())
    user = db.query(UserDB).filter(UserDB.email == test_email).first()
    if user:
        user.failed_login_attempts = 0
        db.commit()
    
    try:
        # Make 5 failed login attempts
        for i in range(5):
            requests.post(
                f"{BASE_URL}/auth/login",
                json={"email": test_email, "password": "wrong_password", "remember_me": False}
            )
            time.sleep(0.1)
        
        # 6th attempt should get 403 (locked)
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": test_email, "password": "viewer123", "remember_me": False}
        )
        
        if response.status_code == 403 and "locked" in response.text.lower():
            log_test("Account Lock (after 5 failed attempts)", True)
        else:
            log_test("Account Lock (after 5 failed attempts)", False, f"Expected 403 with 'locked', got {response.status_code}")
        
        # Unlock for next tests
        db = next(get_db())
        user = db.query(UserDB).filter(UserDB.email == test_email).first()
        if user:
            user.failed_login_attempts = 0
            db.commit()
    except Exception as e:
        log_test("Account Lock (after 5 failed attempts)", False, str(e))


def test_register():
    """Test user registration"""
    try:
        test_email = f"test_user_{int(time.time())}@test.com"
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "full_name": "Test User",
                "email": test_email,
                "password": "TestPassword123!",
                "role": "investigator",
                "department": "Test Department",
                "phone": "+91-9999999999"
            }
        )
        
        if response.status_code == 201:
            data = response.json()
            if data.get("email") == test_email:
                log_test("User Registration", True)
            else:
                log_test("User Registration", False, "Email mismatch in response")
        else:
            log_test("User Registration", False, f"Status {response.status_code}: {response.text}")
    except Exception as e:
        log_test("User Registration", False, str(e))


def test_duplicate_email_registration():
    """Test that duplicate email registration fails (409)"""
    try:
        response = requests.post(
            f"{BASE_URL}/auth/register",
            json={
                "full_name": "Duplicate User",
                "email": "admin@crimegpt.gov.in",  # Existing user
                "password": "Password123!",
                "role": "investigator",
                "department": "Test",
                "phone": "+91-9999999999"
            }
        )
        
        if response.status_code == 409:
            log_test("Duplicate Email Registration (should fail)", True)
        else:
            log_test("Duplicate Email Registration (should fail)", False, f"Expected 409, got {response.status_code}")
    except Exception as e:
        log_test("Duplicate Email Registration (should fail)", False, str(e))


def run_all_tests():
    """Run complete authentication test suite"""
    print("=" * 70)
    print("CrimeGPT Authentication Test Suite")
    print("=" * 70)
    
    print("\n=== Basic Authentication Tests ===")
    admin_token = test_valid_login("admin@crimegpt.gov.in", "admin123", "admin")
    investigator_token = test_valid_login("investigator@crimegpt.gov.in", "investigator123", "investigator")
    viewer_token = test_valid_login("viewer@crimegpt.gov.in", "viewer123", "viewer")
    
    test_invalid_password("admin@crimegpt.gov.in")
    test_nonexistent_user()
    
    print("\n=== Token Validation Tests ===")
    if admin_token:
        test_get_current_user(admin_token, "admin@crimegpt.gov.in")
    if investigator_token:
        test_get_current_user(investigator_token, "investigator@crimegpt.gov.in")
    if viewer_token:
        test_get_current_user(viewer_token, "viewer@crimegpt.gov.in")
    
    test_invalid_token()
    
    print("\n=== Advanced Features Tests ===")
    test_remember_me()
    
    print("\n=== Security Tests ===")
    test_failed_login_tracking()
    test_account_lock()
    
    print("\n=== Registration Tests ===")
    test_register()
    test_duplicate_email_registration()
    
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
    
    if pass_rate >= 95:
        print("🟢 EXCELLENT - Authentication system is production-ready")
    elif pass_rate >= 85:
        print("🟡 GOOD - Minor issues need attention")
    elif pass_rate >= 70:
        print("🟠 FAIR - Several issues need fixing")
    else:
        print("🔴 POOR - Critical issues found")
    
    print("=" * 70)


if __name__ == "__main__":
    run_all_tests()
