import requests
import time

BASE_URL = 'http://127.0.0.1:5000'

def test_get(url, description):
    try:
        response = requests.get(url)
        print(f"{description}: {response.status_code}")
        if response.status_code != 200:
            print(f"  Error: {response.text[:200]}")
        return response.status_code == 200
    except Exception as e:
        print(f"{description}: ERROR - {e}")
        return False

def test_post(url, data, description):
    try:
        response = requests.post(url, data=data)
        print(f"{description}: {response.status_code}")
        if response.status_code not in [200, 302]:
            print(f"  Error: {response.text[:200]}")
        return response.status_code in [200, 302]
    except Exception as e:
        print(f"{description}: ERROR - {e}")
        return False

print("Starting thorough testing of the pharmacy app...")

# Test basic GET routes
tests_passed = 0
total_tests = 0

def run_test(test_func, *args):
    global tests_passed, total_tests
    total_tests += 1
    if test_func(*args):
        tests_passed += 1

run_test(test_get, f"{BASE_URL}/", "Index page")
run_test(test_get, f"{BASE_URL}/medicines", "Medicines list")
run_test(test_get, f"{BASE_URL}/customers", "Customers page")
run_test(test_get, f"{BASE_URL}/sales/new", "New sale page")

# Test admin routes (should redirect to login)
run_test(test_get, f"{BASE_URL}/admin/login", "Admin login page")
run_test(test_get, f"{BASE_URL}/admin/register", "Admin register page")
run_test(test_get, f"{BASE_URL}/reports", "Reports page (should redirect)")

# Test POST routes
run_test(test_post, f"{BASE_URL}/customers", {"name": "Test Customer", "phone": "1234567890"}, "Add customer")
run_test(test_post, f"{BASE_URL}/admin/login", {"email": "test@example.com", "password": "wrongpass"}, "Invalid admin login")

print(f"\nTests completed: {tests_passed}/{total_tests} passed")

if tests_passed == total_tests:
    print("All tests passed! The app is functioning well.")
else:
    print("Some tests failed. Check the output above for details.")
