import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_get_api_v1_periods_without_token():
    url = f"{BASE_URL}/api/v1/periods"
    try:
        response = requests.get(url, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401, got {response.status_code}"
    try:
        json_data = response.json()
    except ValueError:
        json_data = None

    # Optionally check for an error message or specific response structure indicating unauthorized
    if json_data:
        assert "error" in json_data or "message" in json_data or "detail" in json_data, "Unauthorized response missing error/message/detail field"

test_get_api_v1_periods_without_token()