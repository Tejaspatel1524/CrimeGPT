"""
Phase 3: Complete Feature Audit & Testing
Tests every existing feature to ensure full functionality
"""
import requests
import json
import time
from datetime import datetime
import sys
import io

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

BASE_URL = "http://localhost:8000"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_section(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_test(name, status, message=""):
    # Use simple ASCII symbols for Windows compatibility
    symbol = f"{Colors.GREEN}[PASS]{Colors.END}" if status else f"{Colors.RED}[FAIL]{Colors.END}"
    print(f"{symbol} {name}")
    if message:
        print(f"   {Colors.YELLOW}{message}{Colors.END}")

def test_authentication():
    """Test all authentication features"""
    print_section("AUTHENTICATION TESTS")
    
    tests_passed = 0
    tests_total = 0
    
    # Test 1: Register new user
    tests_total += 1
    try:
        register_data = {
            "full_name": "Test Phase3 User",
            "email": f"phase3test_{int(time.time())}@test.com",
            "password": "TestPass123!",
            "role": "investigator",
            "department": "Testing"
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 201:
            print_test("Register new user", True)
            tests_passed += 1
            test_user_email = register_data["email"]
        else:
            print_test("Register new user", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Register new user", False, str(e))
    
    # Test 2: Login with pending account (should fail)
    tests_total += 1
    try:
        login_data = {"email": test_user_email, "password": "TestPass123!", "remember_me": False}
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 403:
            print_test("Login blocked (pending account)", True)
            tests_passed += 1
        else:
            print_test("Login blocked (pending account)", False, f"Expected 403, got {response.status_code}")
    except Exception as e:
        print_test("Login blocked (pending account)", False, str(e))
    
    # Test 3: Admin login
    tests_total += 1
    try:
        admin_login = {"email": "admin@sentinelai.gov.in", "password": "admin123", "remember_me": False}
        response = requests.post(f"{BASE_URL}/auth/login", json=admin_login)
        if response.status_code == 200:
            admin_token = response.json()["access_token"]
            print_test("Admin login", True)
            tests_passed += 1
        else:
            print_test("Admin login", False, f"Status: {response.status_code}")
            return tests_passed, tests_total
    except Exception as e:
        print_test("Admin login", False, str(e))
        return tests_passed, tests_total
    
    # Test 4: Get current user (/auth/me)
    tests_total += 1
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user = response.json()
            print_test("/auth/me endpoint", True, f"User: {user['full_name']}")
            tests_passed += 1
        else:
            print_test("/auth/me endpoint", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("/auth/me endpoint", False, str(e))
    
    # Test 5: Get user stats
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/auth/stats", headers=headers)
        if response.status_code == 200:
            print_test("Get user stats", True)
            tests_passed += 1
        else:
            print_test("Get user stats", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Get user stats", False, str(e))
    
    # Test 6: Get user activity
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/auth/activity", headers=headers)
        if response.status_code == 200:
            print_test("Get user activity", True)
            tests_passed += 1
        else:
            print_test("Get user activity", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Get user activity", False, str(e))
    
    # Test 7: Get user preferences
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/auth/preferences", headers=headers)
        if response.status_code == 200:
            print_test("Get user preferences", True)
            tests_passed += 1
        else:
            print_test("Get user preferences", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Get user preferences", False, str(e))
    
    # Test 8: Update user preferences
    tests_total += 1
    try:
        prefs = {
            "theme": "cyber-navy",
            "language": "english",
            "notifications": {"caseAssignment": True}
        }
        response = requests.put(f"{BASE_URL}/auth/preferences", json=prefs, headers=headers)
        if response.status_code == 200:
            print_test("Update user preferences", True)
            tests_passed += 1
        else:
            print_test("Update user preferences", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Update user preferences", False, str(e))
    
    # Test 9: Forgot password
    tests_total += 1
    try:
        response = requests.post(f"{BASE_URL}/auth/forgot-password", json={"email": "admin@sentinelai.gov.in"})
        if response.status_code == 200:
            print_test("Forgot password endpoint", True)
            tests_passed += 1
        else:
            print_test("Forgot password endpoint", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Forgot password endpoint", False, str(e))
    
    return tests_passed, tests_total, admin_token


def test_user_management(admin_token):
    """Test user management features"""
    print_section("USER MANAGEMENT TESTS")
    
    tests_passed = 0
    tests_total = 0
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 1: List all users
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/users", headers=headers)
        if response.status_code == 200:
            users = response.json()
            print_test("List all users", True, f"Found {len(users)} users")
            tests_passed += 1
        else:
            print_test("List all users", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("List all users", False, str(e))
    
    # Test 2: Get user stats summary
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/users/stats/overview", headers=headers)
        if response.status_code == 200:
            print_test("Get user stats summary", True)
            tests_passed += 1
        else:
            print_test("Get user stats summary", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Get user stats summary", False, str(e))
    
    # Test 3: Search users
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/users?search=admin", headers=headers)
        if response.status_code == 200:
            print_test("Search users", True)
            tests_passed += 1
        else:
            print_test("Search users", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Search users", False, str(e))
    
    # Test 4: Filter users by role
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/users?role=admin", headers=headers)
        if response.status_code == 200:
            print_test("Filter users by role", True)
            tests_passed += 1
        else:
            print_test("Filter users by role", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Filter users by role", False, str(e))
    
    return tests_passed, tests_total


def test_cases(admin_token):
    """Test case management features"""
    print_section("CASE MANAGEMENT TESTS")
    
    tests_passed = 0
    tests_total = 0
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 1: List all cases
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/cases", headers=headers)
        if response.status_code == 200:
            cases = response.json()
            print_test("List all cases", True, f"Found {len(cases)} cases")
            tests_passed += 1
            if len(cases) > 0:
                test_case_id = cases[0]["case_id"]
            else:
                test_case_id = None
        else:
            print_test("List all cases", False, f"Status: {response.status_code}")
            test_case_id = None
    except Exception as e:
        print_test("List all cases", False, str(e))
        test_case_id = None
    
    # Test 2: Get case by ID (if exists)
    if test_case_id:
        tests_total += 1
        try:
            response = requests.get(f"{BASE_URL}/cases/{test_case_id}", headers=headers)
            if response.status_code == 200:
                print_test("Get case by ID", True)
                tests_passed += 1
            else:
                print_test("Get case by ID", False, f"Status: {response.status_code}")
        except Exception as e:
            print_test("Get case by ID", False, str(e))
    
    # Test 3: Search cases
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/cases?search=fraud", headers=headers)
        if response.status_code == 200:
            print_test("Search cases", True)
            tests_passed += 1
        else:
            print_test("Search cases", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Search cases", False, str(e))
    
    # Test 4: Filter cases by status
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/cases?status=open", headers=headers)
        if response.status_code == 200:
            print_test("Filter cases by status", True)
            tests_passed += 1
        else:
            print_test("Filter cases by status", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Filter cases by status", False, str(e))
    
    # Test 5: Filter cases by priority
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/cases?priority=high", headers=headers)
        if response.status_code == 200:
            print_test("Filter cases by priority", True)
            tests_passed += 1
        else:
            print_test("Filter cases by priority", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Filter cases by priority", False, str(e))
    
    return tests_passed, tests_total


def test_evidence(admin_token):
    """Test evidence management"""
    print_section("EVIDENCE TESTS")
    
    tests_passed = 0
    tests_total = 0
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get a case first
    try:
        response = requests.get(f"{BASE_URL}/cases", headers=headers)
        if response.status_code == 200 and len(response.json()) > 0:
            test_case_id = response.json()[0]["case_id"]
        else:
            print_test("Cannot test evidence - no cases available", False)
            return 0, 0
    except:
        print_test("Cannot test evidence - API error", False)
        return 0, 0
    
    # Test 1: List evidence for case
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/evidence/case/{test_case_id}", headers=headers)
        if response.status_code == 200:
            evidence_list = response.json()
            print_test("List evidence for case", True, f"Found {len(evidence_list)} items")
            tests_passed += 1
        else:
            print_test("List evidence for case", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("List evidence for case", False, str(e))
    
    return tests_passed, tests_total


def test_reports(admin_token):
    """Test report generation"""
    print_section("REPORT TESTS")
    
    tests_passed = 0
    tests_total = 0
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 1: List reports
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/reports", headers=headers)
        if response.status_code == 200:
            reports = response.json()
            print_test("List reports", True, f"Found {len(reports)} reports")
            tests_passed += 1
        else:
            print_test("List reports", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("List reports", False, str(e))
    
    return tests_passed, tests_total


def test_stats(admin_token):
    """Test statistics endpoints"""
    print_section("STATISTICS TESTS")
    
    tests_passed = 0
    tests_total = 0
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Test 1: Dashboard stats
    tests_total += 1
    try:
        response = requests.get(f"{BASE_URL}/stats/dashboard", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print_test("Dashboard statistics", True)
            tests_passed += 1
        else:
            print_test("Dashboard statistics", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Dashboard statistics", False, str(e))
    
    return tests_passed, tests_total


def test_health():
    """Test health endpoint"""
    print_section("HEALTH CHECK")
    
    tests_passed = 0
    tests_total = 1
    
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print_test("Health check endpoint", True)
            tests_passed += 1
        else:
            print_test("Health check endpoint", False, f"Status: {response.status_code}")
    except Exception as e:
        print_test("Health check endpoint", False, str(e))
    
    return tests_passed, tests_total


def main():
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    print("PHASE 3: COMPLETE FEATURE AUDIT")
    print(f"Testing all existing features for functionality")
    print(f"{'='*60}{Colors.END}\n")
    
    total_passed = 0
    total_tests = 0
    
    # Health check first
    passed, total = test_health()
    total_passed += passed
    total_tests += total
    
    # Authentication tests
    try:
        passed, total, admin_token = test_authentication()
        total_passed += passed
        total_tests += total
    except Exception as e:
        print(f"{Colors.RED}Authentication tests failed: {e}{Colors.END}")
        admin_token = None
    
    if not admin_token:
        print(f"\n{Colors.RED}Cannot continue without admin token{Colors.END}")
        return
    
    # User management tests
    passed, total = test_user_management(admin_token)
    total_passed += passed
    total_tests += total
    
    # Case management tests
    passed, total = test_cases(admin_token)
    total_passed += passed
    total_tests += total
    
    # Evidence tests
    passed, total = test_evidence(admin_token)
    total_passed += passed
    total_tests += total
    
    # Report tests
    passed, total = test_reports(admin_token)
    total_passed += passed
    total_tests += total
    
    # Statistics tests
    passed, total = test_stats(admin_token)
    total_passed += passed
    total_tests += total
    
    # Final summary
    print_section("FINAL RESULTS")
    pass_rate = (total_passed / total_tests * 100) if total_tests > 0 else 0
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {Colors.GREEN}{total_passed}{Colors.END}")
    print(f"Failed: {Colors.RED}{total_tests - total_passed}{Colors.END}")
    print(f"Pass Rate: {Colors.GREEN if pass_rate >= 90 else Colors.YELLOW if pass_rate >= 70 else Colors.RED}{pass_rate:.1f}%{Colors.END}")
    
    if pass_rate == 100:
        print(f"\n{Colors.GREEN}{Colors.BOLD}[SUCCESS] ALL TESTS PASSED - SYSTEM FULLY FUNCTIONAL{Colors.END}")
    elif pass_rate >= 90:
        print(f"\n{Colors.YELLOW}{Colors.BOLD}[WARNING] MINOR ISSUES DETECTED{Colors.END}")
    else:
        print(f"\n{Colors.RED}{Colors.BOLD}[ERROR] SIGNIFICANT ISSUES FOUND - REQUIRES FIXES{Colors.END}")


if __name__ == "__main__":
    main()
