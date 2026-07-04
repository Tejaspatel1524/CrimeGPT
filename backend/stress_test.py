"""
PRODUCTION STRESS TEST SUITE
Tests authentication, API endpoints, file operations under load
"""
import requests
import time
import concurrent.futures
import json
from typing import List, Dict, Tuple

BASE_URL = "http://localhost:8000"

# Test Results Storage
test_results = {
    "total_tests": 0,
    "passed": 0,
    "failed": 0,
    "errors": [],
    "performance": {}
}

def log_result(test_name: str, passed: bool, error: str = None, duration_ms: float = None):
    """Log test result"""
    test_results["total_tests"] += 1
    if passed:
        test_results["passed"] += 1
        print(f"✓ {test_name} - PASS ({duration_ms:.0f}ms)" if duration_ms else f"✓ {test_name} - PASS")
    else:
        test_results["failed"] += 1
        test_results["errors"].append({"test": test_name, "error": error})
        print(f"✗ {test_name} - FAIL: {error}")
    
    if duration_ms:
        test_results["performance"][test_name] = duration_ms


def authenticate(email: str, password: str) -> Tuple[str, Dict]:
    """Authenticate and return token + user"""
    try:
        start = time.time()
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": email, "password": password, "remember_me": False}
        )
        duration = (time.time() - start) * 1000
        
        if response.status_code == 200:
            data = response.json()
            log_result(f"Login as {email}", True, duration_ms=duration)
            return data["access_token"], data["user"]
        else:
            log_result(f"Login as {email}", False, f"Status {response.status_code}")
            return None, None
    except Exception as e:
        log_result(f"Login as {email}", False, str(e))
        return None, None


def test_dashboard_load(token: str, role: str):
    """Test dashboard API load time"""
    headers = {"Authorization": f"Bearer {token}"}
    start = time.time()
    try:
        response = requests.get(f"{BASE_URL}/stats/dashboard", headers=headers)
        duration = (time.time() - start) * 1000
        
        if response.status_code == 200:
            log_result(f"Dashboard Load ({role})", True, duration_ms=duration)
        else:
            log_result(f"Dashboard Load ({role})", False, f"Status {response.status_code}")
    except Exception as e:
        log_result(f"Dashboard Load ({role})", False, str(e))


def test_cases_list(token: str, role: str):
    """Test cases list API"""
    headers = {"Authorization": f"Bearer {token}"}
    start = time.time()
    try:
        response = requests.get(f"{BASE_URL}/cases", headers=headers)
        duration = (time.time() - start) * 1000
        
        if response.status_code == 200:
            cases = response.json()
            log_result(f"Cases List ({role})", True, duration_ms=duration)
            return cases
        else:
            log_result(f"Cases List ({role})", False, f"Status {response.status_code}")
            return []
    except Exception as e:
        log_result(f"Cases List ({role})", False, str(e))
        return []


def test_concurrent_logins(credentials_list: List[Tuple[str, str]], concurrent: int = 5):
    """Test concurrent login requests"""
    print(f"\n=== Concurrent Login Test ({concurrent} simultaneous) ===")
    start = time.time()
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent) as executor:
        futures = [
            executor.submit(authenticate, email, password)
            for email, password in credentials_list * (concurrent // len(credentials_list) + 1)
        ][:concurrent]
        
        results = [f.result() for f in concurrent.futures.as_completed(futures)]
    
    duration = (time.time() - start) * 1000
    successful = sum(1 for token, _ in results if token is not None)
    
    log_result(
        f"Concurrent Logins ({concurrent})",
        successful == concurrent,
        f"Only {successful}/{concurrent} succeeded",
        duration_ms=duration
    )


def test_rapid_api_calls(token: str, endpoint: str, count: int = 20):
    """Test rapid sequential API calls (potential request storm)"""
    print(f"\n=== Rapid API Calls Test ({endpoint}, {count} requests) ===")
    headers = {"Authorization": f"Bearer {token}"}
    failures = 0
    start = time.time()
    
    for i in range(count):
        try:
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            if response.status_code != 200:
                failures += 1
        except Exception:
            failures += 1
    
    duration = (time.time() - start) * 1000
    avg_time = duration / count
    
    log_result(
        f"Rapid Calls {endpoint}",
        failures == 0,
        f"{failures}/{count} failed",
        duration_ms=avg_time
    )


def test_permission_enforcement(viewer_token: str, admin_token: str):
    """Test RBAC permission enforcement"""
    print(f"\n=== Permission Enforcement Test ===")
    
    # Viewer should NOT be able to create cases
    viewer_headers = {"Authorization": f"Bearer {viewer_token}"}
    try:
        response = requests.post(
            f"{BASE_URL}/cases",
            headers=viewer_headers,
            json={
                "title": "Unauthorized Case",
                "fraud_type": "UPI Fraud",
                "victim_name": "Test",
                "victim_email": "test@test.com",
                "victim_phone": "9999999999",
                "complaint_text": "Test",
                "amount_lost": 1000,
                "priority": "Medium",
                "status": "Open"
            }
        )
        
        # Should get 403 Forbidden
        if response.status_code == 403:
            log_result("Viewer Create Case (should fail)", True)
        else:
            log_result("Viewer Create Case (should fail)", False, f"Got {response.status_code}, expected 403")
    except Exception as e:
        log_result("Viewer Create Case (should fail)", False, str(e))
    
    # Admin should be able to access user management
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    try:
        response = requests.get(f"{BASE_URL}/users/stats", headers=admin_headers)
        if response.status_code == 200:
            log_result("Admin User Stats", True)
        else:
            log_result("Admin User Stats", False, f"Status {response.status_code}")
    except Exception as e:
        log_result("Admin User Stats", False, str(e))


def test_settings_persistence(token: str):
    """Test settings save and retrieve"""
    print(f"\n=== Settings Persistence Test ===")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Save preferences
    test_prefs = {
        "theme": "cyber-navy",
        "language": "hindi",
        "timezone": "Asia/Kolkata",
        "dateFormat": "dd/mm/yyyy",
        "timeFormat": "12h",
        "notifications": {
            "caseAssignment": True,
            "crimeGPT": False,
            "evidenceProcessing": True,
            "reportGeneration": False,
            "crossCaseMatch": True
        }
    }
    
    try:
        start = time.time()
        save_response = requests.put(
            f"{BASE_URL}/auth/preferences",
            headers=headers,
            json=test_prefs
        )
        save_duration = (time.time() - start) * 1000
        
        if save_response.status_code == 200:
            log_result("Save Preferences", True, duration_ms=save_duration)
            
            # Retrieve and verify
            time.sleep(0.5)  # Small delay
            start = time.time()
            get_response = requests.get(f"{BASE_URL}/auth/preferences", headers=headers)
            get_duration = (time.time() - start) * 1000
            
            if get_response.status_code == 200:
                saved_prefs = get_response.json()
                if saved_prefs.get("language") == "hindi":
                    log_result("Retrieve Preferences", True, duration_ms=get_duration)
                else:
                    log_result("Retrieve Preferences", False, "Data mismatch")
            else:
                log_result("Retrieve Preferences", False, f"Status {get_response.status_code}")
        else:
            log_result("Save Preferences", False, f"Status {save_response.status_code}")
    except Exception as e:
        log_result("Settings Persistence", False, str(e))


def run_stress_tests():
    """Main stress test orchestrator"""
    print("=" * 70)
    print("CRIMEGPT PRODUCTION STRESS TEST SUITE")
    print("=" * 70)
    
    # Test credentials
    credentials = [
        ("admin@crimegpt.gov.in", "admin123"),
        ("investigator@crimegpt.gov.in", "investigator123"),
        ("viewer@crimegpt.gov.in", "viewer123")
    ]
    
    # 1. AUTHENTICATION TESTS
    print("\n=== AUTHENTICATION STRESS TEST ===")
    tokens = {}
    users = {}
    
    for email, password in credentials:
        token, user = authenticate(email, password)
        if token and user:
            tokens[user["role"]] = token
            users[user["role"]] = user
    
    # Concurrent login test
    test_concurrent_logins(credentials, concurrent=10)
    
    if not tokens:
        print("\n✗ CRITICAL: No successful authentication. Stopping tests.")
        return
    
    # 2. DASHBOARD LOAD TESTS
    print("\n=== DASHBOARD PERFORMANCE TEST ===")
    for role, token in tokens.items():
        test_dashboard_load(token, role)
    
    # 3. CASES LIST TESTS
    print("\n=== CASES API TEST ===")
    for role, token in tokens.items():
        test_cases_list(token, role)
    
    # 4. RAPID API CALLS (Request Storm)
    if "admin" in tokens:
        test_rapid_api_calls(tokens["admin"], "/stats/dashboard", count=30)
        test_rapid_api_calls(tokens["admin"], "/cases", count=30)
    
    # 5. RBAC PERMISSION TESTS
    if "viewer" in tokens and "admin" in tokens:
        test_permission_enforcement(tokens["viewer"], tokens["admin"])
    
    # 6. SETTINGS PERSISTENCE TEST
    if "investigator" in tokens:
        test_settings_persistence(tokens["investigator"])
    
    # FINAL REPORT
    print("\n" + "=" * 70)
    print("STRESS TEST SUMMARY")
    print("=" * 70)
    print(f"Total Tests: {test_results['total_tests']}")
    print(f"Passed: {test_results['passed']} ✓")
    print(f"Failed: {test_results['failed']} ✗")
    
    if test_results['failed'] > 0:
        print("\nFailed Tests:")
        for error in test_results['errors']:
            print(f"  • {error['test']}: {error['error']}")
    
    print("\nPerformance Metrics:")
    for test, duration in test_results['performance'].items():
        if duration < 100:
            status = "🟢 Excellent"
        elif duration < 500:
            status = "🟡 Good"
        elif duration < 1000:
            status = "🟠 Fair"
        else:
            status = "🔴 Slow"
        print(f"  {test}: {duration:.0f}ms {status}")
    
    # Calculate score
    if test_results['total_tests'] > 0:
        pass_rate = (test_results['passed'] / test_results['total_tests']) * 100
        print(f"\n{'=' * 70}")
        print(f"OVERALL PASS RATE: {pass_rate:.1f}%")
        
        if pass_rate >= 95:
            print("🟢 PRODUCTION READY - EXCELLENT")
        elif pass_rate >= 85:
            print("🟡 PRODUCTION READY - MINOR ISSUES")
        elif pass_rate >= 70:
            print("🟠 NEEDS ATTENTION - SEVERAL ISSUES")
        else:
            print("🔴 NOT PRODUCTION READY - CRITICAL ISSUES")
    
    print("=" * 70)


if __name__ == "__main__":
    try:
        run_stress_tests()
    except KeyboardInterrupt:
        print("\n\nTest suite interrupted by user.")
    except Exception as e:
        print(f"\n\n✗ CRITICAL ERROR: {e}")
