import requests
from requests.auth import HTTPBasicAuth

def test_get_admin_dashboard_should_return_statistics_for_admin():
    base_url = "http://localhost:8000"
    endpoint = "/admin/dashboard"
    url = base_url + endpoint

    auth = HTTPBasicAuth('admin', 'Password#123')
    headers = {
        "Accept": "application/json"
    }

    try:
        response = requests.get(url, headers=headers, auth=auth, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Verify expected keys in the dashboard statistics
    expected_keys = ['registration_counts', 'active_groups', 'pending_reports']
    missing_keys = [key for key in expected_keys if key not in data]
    assert not missing_keys, f"Missing keys in response JSON: {missing_keys}"

    # Check that the values for the keys are of expected type (counts likely int or dict)
    assert isinstance(data['registration_counts'], (int, dict)), "'registration_counts' should be int or dict"
    assert isinstance(data['active_groups'], (int, dict)), "'active_groups' should be int or dict"
    assert isinstance(data['pending_reports'], (int, dict)), "'pending_reports' should be int or dict"

test_get_admin_dashboard_should_return_statistics_for_admin()