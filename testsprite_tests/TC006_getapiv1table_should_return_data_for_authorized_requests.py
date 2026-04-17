import requests

base_url = "http://localhost:8000"
timeout = 30

# Assuming Bearer tokens; placeholders here
api_token = "valid_api_token"
admin_token = "admin_token"

allowed_tables = ["periods", "programs", "locations"]

headers_api = {"Authorization": f"Bearer {api_token}"}
headers_admin = {"Authorization": f"Bearer {admin_token}"}

def test_get_api_v1_table_should_return_data_for_authorized_requests():
    for table in allowed_tables:
        url = f"{base_url}/api/v1/{table}"
        try:
            response = requests.get(url, headers=headers_api, timeout=timeout)
        except requests.RequestException as e:
            assert False, f"Request to {url} failed with exception: {e}"

        assert response.status_code == 200, f"Expected 200 but got {response.status_code} for table '{table}'"
        try:
            data = response.json()
        except ValueError:
            assert False, f"Response content for {table} is not valid JSON"

        assert isinstance(data, (list, dict)), f"Response JSON for {table} is not list or dict as expected"
        if isinstance(data, dict):
            assert "data" in data, f"Response dict for {table} missing 'data' key"

    dashboard_url = f"{base_url}/admin/dashboard"
    try:
        dashboard_resp = requests.get(dashboard_url, headers=headers_admin, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request to admin dashboard failed with exception: {e}"

    assert dashboard_resp.status_code == 200, f"Expected 200 but got {dashboard_resp.status_code} for admin dashboard"
    try:
        dashboard_data = dashboard_resp.json()
    except ValueError:
        assert False, "Admin dashboard response is not valid JSON"

    expected_keys = ["registration_counts", "active_groups", "pending_reports"]
    for key in expected_keys:
        assert key in dashboard_data, f"Admin dashboard missing expected key '{key}'"

test_get_api_v1_table_should_return_data_for_authorized_requests()
