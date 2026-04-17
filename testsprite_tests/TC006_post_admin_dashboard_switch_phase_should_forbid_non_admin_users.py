import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_admin_dashboard_switch_phase_should_forbid_non_admin_users():
    # Non-admin user credentials (simulate non-admin by using student registration token)
    # Step 1: Authenticate as a student user to obtain non-admin token
    # Use a dummy student credential for demonstration; in real scenario, this should be replaced with actual student user credentials.
    student_auth = HTTPBasicAuth('student_user', 'student_password')

    # First, let's try to authenticate and get a token for the non-admin user
    # Assuming authentication is done via a login endpoint that returns a Bearer token
    login_url = f"{BASE_URL}/login"
    login_payload = {
        "username": "student_user",
        "password": "student_password"
    }

    # We attempt login to get Bearer token for non-admin
    # If /login is not specified in PRD, we can try directly a non-admin token variable for demonstration
    # Since no student login API is specified, assume token is known or simulate token header with a placeholder
    
    # For the purpose of this test, we'll assume a hardcoded non-admin Bearer token:
    non_admin_token = "non_admin_dummy_token"

    headers = {
        "Authorization": f"Bearer {non_admin_token}",
        "Content-Type": "application/json"
    }

    switch_phase_url = f"{BASE_URL}/admin/dashboard/switch-phase"
    payload = {
        "phase": "IMPLEMENTATION"
    }

    response = requests.post(switch_phase_url, json=payload, headers=headers, timeout=TIMEOUT)
    
    assert response.status_code == 403, f"Expected status code 403 but got {response.status_code}"
    
    try:
        json_data = response.json()
    except Exception:
        json_data = {}

    assert "error" in json_data, "Response JSON must contain 'error' field."
    assert json_data.get("error") == "INSUFFICIENT_ROLE", f"Expected error 'INSUFFICIENT_ROLE' but got '{json_data.get('error')}'"

test_post_admin_dashboard_switch_phase_should_forbid_non_admin_users()