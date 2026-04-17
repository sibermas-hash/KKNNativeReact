import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_post_admin_switch_phase_with_invalid_phase():
    url = f"{BASE_URL}/admin/dashboard/switch-phase"
    invalid_payload = {"phase": "invalid_phase_value"}
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer admin-valid-token"
    }
    try:
        response = requests.post(url, json=invalid_payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    error_messages = []
    if "message" in resp_json:
        error_messages.append(resp_json["message"])
    if "errors" in resp_json:
        if isinstance(resp_json["errors"], dict):
            for v in resp_json["errors"].values():
                if isinstance(v, list):
                    error_messages.extend(v)
                else:
                    error_messages.append(str(v))
        elif isinstance(resp_json["errors"], list):
            error_messages.extend(resp_json["errors"])
        else:
            error_messages.append(str(resp_json["errors"]))
    found_invalid_phase = any("invalid phase" in msg.lower() for msg in error_messages)

    assert found_invalid_phase, f"Response JSON does not contain expected error message 'invalid phase'. Response: {resp_json}"


test_post_admin_switch_phase_with_invalid_phase()
