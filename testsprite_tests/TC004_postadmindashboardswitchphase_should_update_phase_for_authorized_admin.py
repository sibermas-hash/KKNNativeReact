import requests

BASE_URL = "http://localhost:8000"
BEARER_TOKEN = "admin_valid_token_placeholder"
TIMEOUT = 30

def test_postadmindashboardswitchphase_should_update_phase_for_authorized_admin():
    url_dashboard = f"{BASE_URL}/admin/dashboard"
    url_switch_phase = f"{BASE_URL}/admin/dashboard/switch-phase"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }

    try:
        # Verify access to admin dashboard stats (GET /admin/dashboard)
        resp_dashboard = requests.get(url_dashboard, headers=headers, timeout=TIMEOUT)
        assert resp_dashboard.status_code == 200, f"Expected 200 from GET /admin/dashboard, got {resp_dashboard.status_code}"
        dashboard_data = resp_dashboard.json()
        assert isinstance(dashboard_data, dict), "Dashboard response is not a JSON object"
        # Basic keys check (optional)
        assert "registration_counts" in dashboard_data or "active_groups" in dashboard_data or "pending_reports" in dashboard_data, "Expected dashboard statistics missing"

        # Perform phase switch (POST /admin/dashboard/switch-phase)
        # Choose a valid phase different from current one if possible
        current_phase = dashboard_data.get("current_phase") if dashboard_data else None
        # Default to "IMPLEMENTATION" if not specified or is same
        new_phase = "IMPLEMENTATION"
        if current_phase == "IMPLEMENTATION":
            new_phase = "EVALUATION"  # Try different phase to confirm update

        payload = {
            "phase": new_phase
        }

        resp_switch = requests.post(url_switch_phase, json=payload, headers=headers, timeout=TIMEOUT)
        assert resp_switch.status_code == 200, f"Expected 200 from POST /admin/dashboard/switch-phase, got {resp_switch.status_code}"

        data = resp_switch.json()
        assert "updated_phase" in data, "'updated_phase' not found in response"
        assert data["updated_phase"] == new_phase, f"Expected phase '{new_phase}', got '{data['updated_phase']}'"
        assert "audit_log_entry" in data, "'audit_log_entry' not found in response"
        assert isinstance(data["audit_log_entry"], dict), "'audit_log_entry' should be an object/dict"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

    except ValueError as e:
        assert False, f"Response JSON decoding failed: {e}"


test_postadmindashboardswitchphase_should_update_phase_for_authorized_admin()