import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_get_api_v1_periods_without_token():
    url = f"{BASE_URL}/api/v1/periods"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    # Optionally check response content for unauthorized message
    try:
        data = response.json()
        assert "error" in data or "message" in data or "detail" in data or data == {}
    except ValueError:
        # Response is not JSON, which is also acceptable for 401
        pass

test_get_api_v1_periods_without_token()