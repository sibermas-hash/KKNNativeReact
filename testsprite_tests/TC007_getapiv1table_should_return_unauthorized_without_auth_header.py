import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_getapiv1table_should_return_unauthorized_without_auth_header():
    table = "periods"  # Using a known allowed public table from PRD such as 'periods'
    url = f"{BASE_URL}/api/v1/{table}"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"

test_getapiv1table_should_return_unauthorized_without_auth_header()