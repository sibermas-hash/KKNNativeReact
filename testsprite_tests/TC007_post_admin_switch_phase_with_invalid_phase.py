import requests

def test_post_admin_switch_phase_with_invalid_phase():
    base_url = "http://localhost:8000"
    endpoint = "/admin/dashboard/switch-phase"
    url = base_url + endpoint
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer admin_valid_admin_token'
    }
    payload = {
        "phase": "invalid_phase_value"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected status code 422 but got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not in JSON format"

    message = resp_json.get("message") or resp_json.get("detail") or ""
    errors = resp_json.get("errors", {})
    phase_errors = errors.get("phase", []) if isinstance(errors, dict) else []

    contains_invalid_phase_msg = 'invalid phase' in message.lower()
    contains_invalid_phase_in_errors = any('invalid phase' in str(e).lower() for e in phase_errors)

    assert contains_invalid_phase_msg or contains_invalid_phase_in_errors, \
        "Response JSON does not contain 'invalid phase' message"


test_post_admin_switch_phase_with_invalid_phase()