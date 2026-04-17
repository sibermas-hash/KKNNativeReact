import requests

BASE_URL = "http://localhost:8000"
ADMIN_TOKEN = "admin-token-placeholder"
TIMEOUT = 30

def test_post_admin_dashboard_switch_phase_should_update_phase_for_admin():
    headers = {
        'Authorization': f'Bearer {ADMIN_TOKEN}',
        'Content-Type': 'application/json'
    }
    
    # Step 1: Verify GET /admin/dashboard returns 200 and correct admin dashboard access
    try:
        dashboard_resp = requests.get(f"{BASE_URL}/admin/dashboard", headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"GET /admin/dashboard request failed: {e}"
    assert dashboard_resp.status_code == 200, f"Expected status code 200, got {dashboard_resp.status_code}"
    dashboard_json = dashboard_resp.json()
    assert isinstance(dashboard_json, dict), "Dashboard response is not a JSON object"
    
    # Step 2: POST /admin/dashboard/switch-phase to switch phase
    payload = {"phase": "IMPLEMENTATION"}
    try:
        switch_resp = requests.post(f"{BASE_URL}/admin/dashboard/switch-phase", 
                                    headers=headers,
                                    json=payload,
                                    timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"POST /admin/dashboard/switch-phase request failed: {e}"
    
    assert switch_resp.status_code == 200, f"Expected status code 200, got {switch_resp.status_code}"
    switch_json = switch_resp.json()
    assert "updated_phase" in switch_json, "'updated_phase' not present in response"
    assert switch_json["updated_phase"] == "IMPLEMENTATION", f"Expected updated_phase to be 'IMPLEMENTATION', got {switch_json['updated_phase']}"
    assert "audit_log_entry" in switch_json, "'audit_log_entry' not present in response"
    assert isinstance(switch_json["audit_log_entry"], dict) or isinstance(switch_json["audit_log_entry"], list), "'audit_log_entry' should be dict or list"

test_post_admin_dashboard_switch_phase_should_update_phase_for_admin()
