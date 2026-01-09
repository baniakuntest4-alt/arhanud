import requests
import sys
import json
from datetime import datetime

class SIPARHANUDAPITester:
    def __init__(self, base_url="https://armyhr-dashboard.preview.emergentagent.com"):
        self.base_url = base_url
        self.tokens = {}  # Store tokens for different users
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, user_role=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth token if user_role is specified
        if user_role and user_role in self.tokens:
            headers['Authorization'] = f'Bearer {self.tokens[user_role]}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                self.test_results.append({
                    "test": name,
                    "status": "PASSED",
                    "expected": expected_status,
                    "actual": response.status_code
                })
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200]
                })
                self.test_results.append({
                    "test": name,
                    "status": "FAILED",
                    "expected": expected_status,
                    "actual": response.status_code,
                    "error": response.text[:200]
                })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e)
            })
            self.test_results.append({
                "test": name,
                "status": "ERROR",
                "error": str(e)
            })
            return False, {}

    def test_login(self, username, password, role_name):
        """Test login and store token"""
        success, response = self.run_test(
            f"Login as {role_name} ({username})",
            "POST",
            "auth/login",
            200,
            data={"username": username, "password": password}
        )
        if success and 'access_token' in response:
            self.tokens[role_name] = response['access_token']
            print(f"   Token stored for {role_name}")
            return True, response
        return False, {}

    def test_dashboard_stats(self, role_name):
        """Test dashboard stats endpoint"""
        success, response = self.run_test(
            f"Dashboard Stats ({role_name})",
            "GET",
            "dashboard/stats",
            200,
            user_role=role_name
        )
        return success, response

    def test_personnel_list(self, role_name):
        """Test personnel list endpoint"""
        success, response = self.run_test(
            f"Personnel List ({role_name})",
            "GET",
            "personnel",
            200,
            user_role=role_name
        )
        return success, response

    def test_personnel_count(self, role_name):
        """Test personnel count endpoint"""
        success, response = self.run_test(
            f"Personnel Count ({role_name})",
            "GET",
            "personnel/count",
            200,
            user_role=role_name
        )
        return success, response

    def test_user_management(self, role_name):
        """Test user management endpoints (admin only)"""
        if role_name != 'admin':
            return True, {}
            
        success, response = self.run_test(
            f"Get Users List ({role_name})",
            "GET",
            "users",
            200,
            user_role=role_name
        )
        return success, response

    def test_audit_logs(self, role_name):
        """Test audit logs endpoint (admin/leader only)"""
        if role_name not in ['admin', 'leader']:
            return True, {}
            
        success, response = self.run_test(
            f"Audit Logs ({role_name})",
            "GET",
            "audit-logs",
            200,
            user_role=role_name
        )
        return success, response

    def test_mutation_requests(self, role_name):
        """Test mutation requests endpoint"""
        success, response = self.run_test(
            f"Mutation Requests ({role_name})",
            "GET",
            "mutation-requests",
            200,
            user_role=role_name
        )
        return success, response

    def test_correction_requests(self, role_name):
        """Test correction requests endpoint"""
        success, response = self.run_test(
            f"Correction Requests ({role_name})",
            "GET",
            "correction-requests",
            200,
            user_role=role_name
        )
        return success, response

    def test_reports_personnel(self, role_name):
        """Test personnel reports endpoint"""
        if role_name not in ['admin', 'staff', 'leader']:
            return True, {}
            
        success, response = self.run_test(
            f"Personnel Reports ({role_name})",
            "GET",
            "reports/personnel",
            200,
            user_role=role_name
        )
        return success, response

    def test_reports_mutations(self, role_name):
        """Test mutations reports endpoint"""
        if role_name not in ['admin', 'staff', 'leader']:
            return True, {}
            
        success, response = self.run_test(
            f"Mutations Reports ({role_name})",
            "GET",
            "reports/mutations",
            200,
            user_role=role_name
        )
        return success, response

    def test_reference_data(self):
        """Test reference data endpoints"""
        success1, _ = self.run_test(
            "Reference Pangkat List",
            "GET",
            "reference/pangkat",
            200
        )
        
        success2, _ = self.run_test(
            "Reference Satuan List",
            "GET",
            "reference/satuan",
            200
        )
        
        return success1 and success2

    def test_logout(self, role_name):
        """Test logout endpoint"""
        success, response = self.run_test(
            f"Logout ({role_name})",
            "POST",
            "auth/logout",
            200,
            user_role=role_name
        )
        return success, response

def main():
    print("🚀 Starting SIPARHANUD API Testing...")
    print("=" * 60)
    
    # Initialize tester
    tester = SIPARHANUDAPITester()
    
    # Test credentials from the review request
    test_users = [
        {"username": "admin", "password": "admin123", "role": "admin"},
        {"username": "staff1", "password": "staff123", "role": "staff"},
        {"username": "verifikator1", "password": "verif123", "role": "verifier"},
        {"username": "pimpinan", "password": "pimpin123", "role": "leader"},
        {"username": "personel1", "password": "personel123", "role": "personnel"}
    ]
    
    # Test system initialization first
    print("\n📋 Testing System Initialization...")
    tester.run_test("System Init", "POST", "init/setup", 200)
    
    # Test login for all users
    print("\n🔐 Testing Login for All Roles...")
    login_success = True
    for user in test_users:
        success, _ = tester.test_login(user["username"], user["password"], user["role"])
        if not success:
            login_success = False
            print(f"❌ Login failed for {user['role']}")
    
    if not login_success:
        print("❌ Some logins failed, stopping comprehensive tests")
        return 1
    
    # Test reference data (no auth required)
    print("\n📚 Testing Reference Data...")
    tester.test_reference_data()
    
    # Test endpoints for each role
    for user in test_users:
        role = user["role"]
        print(f"\n👤 Testing endpoints for {role.upper()} role...")
        
        # Test dashboard stats
        tester.test_dashboard_stats(role)
        
        # Test personnel endpoints
        tester.test_personnel_list(role)
        tester.test_personnel_count(role)
        
        # Test role-specific endpoints
        tester.test_user_management(role)
        tester.test_audit_logs(role)
        tester.test_mutation_requests(role)
        tester.test_correction_requests(role)
        tester.test_reports_personnel(role)
        tester.test_reports_mutations(role)
        
        # Test logout
        tester.test_logout(role)
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {len(tester.failed_tests)}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ FAILED TESTS:")
        for i, test in enumerate(tester.failed_tests[:5], 1):  # Show first 5 failures
            print(f"{i}. {test.get('test', 'Unknown')}: {test.get('error', test.get('response', 'Unknown error'))}")
    
    # Save detailed results to file
    results = {
        "timestamp": datetime.now().isoformat(),
        "summary": {
            "total_tests": tester.tests_run,
            "passed": tester.tests_passed,
            "failed": len(tester.failed_tests),
            "success_rate": (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0
        },
        "test_results": tester.test_results,
        "failed_tests": tester.failed_tests
    }
    
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())