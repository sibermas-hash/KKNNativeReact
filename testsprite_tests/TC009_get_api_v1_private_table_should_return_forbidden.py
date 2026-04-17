import requests

def test_get_api_v1_private_table_should_return_forbidden():
    base_url = "http://localhost:8000"
    endpoint = "/api/v1/private_table"
    url = f"{base_url}{endpoint}"
    token = "valid_admin_token"  # Replace with a valid token
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {token}"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 403, f"Expected status code 403, got {response.status_code}"

test_get_api_v1_private_table_should_return_forbidden()