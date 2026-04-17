import requests

def test_getadmindashboard_should_return_statistics_for_authorized_admin():
    base_url = "http://localhost:8000"
    endpoint = "/admin/dashboard"
    url = base_url + endpoint

    # Use Bearer token authentication as per PRD
    headers = {
        "Authorization": "Bearer admin_token"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)

        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

        data = response.json()
        
        # Validate keys in dashboard stats: registration counts, active groups, pending reports
        expected_keys = ["registration_counts", "active_groups", "pending_reports"]
        for key in expected_keys:
            assert key in data, f"Key '{key}' not found in response"
            assert isinstance(data[key], (int, float)), f"Key '{key}' should be a number"

    except requests.RequestException as e:
        assert False, f"Request failed: {str(e)}"
    except ValueError:
        assert False, "Response is not valid JSON"

test_getadmindashboard_should_return_statistics_for_authorized_admin()
