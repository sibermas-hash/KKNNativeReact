import requests

def test_get_admin_dashboard_with_admin_token():
    base_url = "http://localhost:8000"
    endpoint = "/admin"
    url = base_url + endpoint
    token = "admin_token_example"  # Replace with a valid admin bearer token
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }
    timeout = 30
    try:
        response = requests.get(url, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"
    assert isinstance(data, dict), "Response JSON is not an object"
    assert "current_phase" in data, "Response JSON does not contain 'current_phase' field"

test_get_admin_dashboard_with_admin_token()