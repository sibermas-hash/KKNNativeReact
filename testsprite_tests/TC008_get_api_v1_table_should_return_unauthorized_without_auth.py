import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_get_api_v1_table_should_return_unauthorized_without_auth():
    table = "periods"  # Using a known allowed table name from the PRD examples
    url = f"{BASE_URL}/api/v1/{table}"
    headers = {
        # No Authorization header to test unauthorized access
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status 401 Unauthorized but got {response.status_code}"
    # Optionally check response body or error message if defined by API:
    # error_data = response.json()
    # assert "error" in error_data or "message" in error_data

test_get_api_v1_table_should_return_unauthorized_without_auth()