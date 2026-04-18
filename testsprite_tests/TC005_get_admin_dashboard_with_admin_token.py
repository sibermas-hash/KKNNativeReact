import requests

def test_get_admin_dashboard_with_admin_token():
    base_url = "http://localhost:8000"
    endpoint = f"{base_url}/admin"
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer admin_valid_token"
    }
    try:
        response = requests.get(endpoint, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 200, f"Expected 200 OK but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert isinstance(data, dict), "Response JSON is not a dictionary"
    assert "dashboard_statistics" in data or any(k.startswith("dashboard") for k in data.keys()), "Missing dashboard statistics in response"
    assert "current_phase" in data, "Missing current_phase field in response"
    assert data["current_phase"] is not None, "current_phase field is None"

test_get_admin_dashboard_with_admin_token()