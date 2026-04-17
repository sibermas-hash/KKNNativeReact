import requests
from requests.auth import HTTPBasicAuth

def test_postadmindashboardswitchphase_should_forbid_non_admin_users():
    base_url = "http://localhost:8000"
    endpoint = "/admin/dashboard/switch-phase"
    url = base_url + endpoint

    # Credentials for a non-admin user (simulate student or non-admin)
    non_admin_username = "student"
    non_admin_password = "studentPass#123"  # Assuming this user exists and is non-admin

    # Payload to try switching the phase
    payload = {"phase": "IMPLEMENTATION"}

    try:
        # Perform the POST request with basic auth for non-admin user
        response = requests.post(
            url,
            json=payload,
            auth=HTTPBasicAuth(non_admin_username, non_admin_password),
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate the response is 403 Forbidden
    assert response.status_code == 403, f"Expected status code 403, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate error field in response
    assert isinstance(data, dict), "Response JSON is not an object"
    assert "error" in data, "'error' field not present in response"
    assert data["error"] == "INSUFFICIENT_ROLE", f"Expected error 'INSUFFICIENT_ROLE', got {data['error']}"

test_postadmindashboardswitchphase_should_forbid_non_admin_users()