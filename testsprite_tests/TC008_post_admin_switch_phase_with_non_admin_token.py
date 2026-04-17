import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:8000"

def test_post_admin_switch_phase_with_non_admin_token():
    """
    Verify that a non-admin user attempting to switch phases via POST /admin/dashboard/switch-phase receives a 403 Forbidden response.
    """

    # Step 1: Authenticate as non-admin user to get Bearer token (TestAutoLogin assumed; no specifics given, so simulate login)
    # Since we do not have a non-admin user credentials, we simulate by using the basic admin credentials
    # but we must get a non-admin token; the PRD does not provide details, so we assume non-admin can be a student user.
    # We'll simulate login as a non-admin with basic auth (e.g., student user) and get a bearer token if that is the flow.
    # However, no API for login token retrieval is provided, so assume the test uses a preset non-admin bearer token hardcoded here.
    # For test effectiveness, we will mock a non-admin token (placeholder).

    # Placeholder non-admin bearer token (simulate a valid token for non-admin)
    non_admin_token = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.nonadmintoken.mocked"

    url = f"{BASE_URL}/admin/dashboard/switch-phase"
    headers = {
        "Authorization": non_admin_token,
        "Content-Type": "application/json"
    }
    payload = {
        "phase": "implementation"  # valid phase assumed
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        raise AssertionError(f"Request failed: {e}")

    assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}, response: {response.text}"

test_post_admin_switch_phase_with_non_admin_token()