import requests
from requests.auth import HTTPBasicAuth

def test_post_admin_switch_phase_with_invalid_phase():
    base_url = "http://localhost:8000"
    endpoint = "/admin/dashboard/switch-phase"
    url = base_url + endpoint

    auth = HTTPBasicAuth("admin", "Password#123")
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "phase": "invalid_phase_value"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, auth=auth, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"

    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Check that the error message 'invalid phase' is in the response anywhere (either in message or detail)
    # Usually validation errors might be under "message" or "detail" or "errors"
    error_found = False
    if "message" in resp_json and "invalid phase" in resp_json["message"].lower():
        error_found = True
    elif "detail" in resp_json and isinstance(resp_json["detail"], str) and "invalid phase" in resp_json["detail"].lower():
        error_found = True
    elif "errors" in resp_json:
        # check all error messages in errors field
        errors = resp_json["errors"]
        if isinstance(errors, dict):
            for field_errors in errors.values():
                if isinstance(field_errors, list):
                    for msg in field_errors:
                        if "invalid phase" in msg.lower():
                            error_found = True
                            break
                if error_found:
                    break
        elif isinstance(errors, list):
            for err in errors:
                if isinstance(err, str) and "invalid phase" in err.lower():
                    error_found = True
                    break

    assert error_found, "Expected error message 'invalid phase' not found in response"

test_post_admin_switch_phase_with_invalid_phase()