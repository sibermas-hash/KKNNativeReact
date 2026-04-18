import requests

def test_post_admin_switch_phase_with_valid_phase():
    base_url = "http://localhost:8000"
    endpoint = "/admin/dashboard/switch-phase"
    url = base_url + endpoint
    headers = {
        "Authorization": "Bearer admin_token_123",
        "Content-Type": "application/json"
    }
    payload = {
        "phase": "implementation"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"
        json_resp = response.json()
        assert "new_phase" in json_resp, "Response missing 'new_phase' field"
        assert json_resp["new_phase"] == payload["phase"], f"Expected new_phase '{payload['phase']}', got '{json_resp['new_phase']}'"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_admin_switch_phase_with_valid_phase()