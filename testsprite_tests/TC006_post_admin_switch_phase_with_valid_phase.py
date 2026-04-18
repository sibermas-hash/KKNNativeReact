import requests

def test_post_admin_switch_phase_with_valid_phase():
    base_url = "http://localhost:8000"
    endpoint = "/admin/dashboard/switch-phase"
    url = base_url + endpoint

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer admin_valid_token"
    }
    payload = {
        "phase": "implementation"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "new_phase" in data, "'new_phase' key not in response"
    assert data["new_phase"] == payload["phase"], f"Expected new_phase '{payload['phase']}' but got '{data['new_phase']}'"

test_post_admin_switch_phase_with_valid_phase()