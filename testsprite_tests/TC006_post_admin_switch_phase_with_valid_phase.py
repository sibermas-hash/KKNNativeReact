import requests

def test_post_admin_switch_phase_with_valid_phase():
    base_url = "http://localhost:8000"
    endpoint = "/admin/dashboard/switch-phase"
    url = base_url + endpoint

    # Use Bearer token authentication as per PRD requirements
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer admin-valid-token"
    }
    payload = {
        "phase": "implementation"  # a valid business phase per PRD examples
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
        json_response = response.json()
        # Validate that the new_phase confirmation matches the posted phase
        assert "new_phase" in json_response, "Response JSON missing 'new_phase' field"
        assert json_response["new_phase"] == payload["phase"], f"Expected new_phase '{payload['phase']}' but got '{json_response['new_phase']}'"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_admin_switch_phase_with_valid_phase()
