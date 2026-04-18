import requests
from requests.auth import HTTPBasicAuth

def test_post_admin_switch_phase_with_non_admin_token():
    base_url = "http://localhost:8000"
    switch_phase_endpoint = f"{base_url}/admin/dashboard/switch-phase"
    # Obtain non-admin Bearer token by logging in as non-admin user.
    # Since PRD does not specify non-admin credentials or token mechanism,
    # simulate a non-admin token by authenticating as a normal student user.
    # We'll perform a login or get token for non-admin here.
    # However, no login API specified, so assume token is a dummy non-admin token.
    # For demonstration, let's assume a hardcoded non-admin Bearer token.
    # In real scenario, this token should be acquired via login endpoint.
    non_admin_token = "Bearer non_admin_dummy_token_xyz"

    headers = {
        "Authorization": non_admin_token,
        "Content-Type": "application/json"
    }
    payload = {"phase": "implementation"}

    try:
        response = requests.post(switch_phase_endpoint, headers=headers, json=payload, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 403, f"Expected 403 Forbidden but got {response.status_code}"
    # Optionally check response body for error message or structure
    try:
        data = response.json()
        # Usually error message might be in 'message' or 'error' key
        assert "forbidden" in response.text.lower() or "403" in response.text, \
            "Response does not indicate forbidden access."
    except ValueError:
        # Not JSON response is acceptable if 403 is returned
        pass

test_post_admin_switch_phase_with_non_admin_token()