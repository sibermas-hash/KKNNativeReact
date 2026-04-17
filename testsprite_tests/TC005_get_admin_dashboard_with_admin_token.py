import requests

def test_get_admin_dashboard_with_admin_token():
    base_url = "http://localhost:8000"
    endpoint = "/admin"
    url = base_url + endpoint
    timeout = 30

    # Use Bearer token for admin authentication
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer admin_token_example"
    }

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    # Validate status code
    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate presence of 'current_phase' field at root level
    assert 'current_phase' in data, "'current_phase' field is missing in response JSON"


test_get_admin_dashboard_with_admin_token()