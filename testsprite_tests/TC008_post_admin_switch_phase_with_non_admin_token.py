import requests
from requests.auth import HTTPBasicAuth

def test_post_admin_switch_phase_with_non_admin_token():
    base_url = "http://localhost:8000"
    switch_phase_endpoint = f"{base_url}/admin/dashboard/switch-phase"
    non_admin_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.nonadmintoken.mock"  # Mock non-admin Bearer token
    
    headers = {
        "Authorization": f"Bearer {non_admin_token}",
        "Content-Type": "application/json"
    }
    payload = {
        "phase": "implementation"
    }

    try:
        response = requests.post(switch_phase_endpoint, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 403, f"Expected 403 Forbidden, got {response.status_code}"
    # Optionally check response content for Forbidden message
    try:
        json_resp = response.json()
        assert "error" in json_resp or "message" in json_resp, "Response JSON should contain error or message field"
    except ValueError:
        # Response is not JSON: still valid, skip content check
        pass

test_post_admin_switch_phase_with_non_admin_token()