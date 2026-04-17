import requests

def test_get_api_v1_periods_without_token():
    url = "http://localhost:8000/api/v1/periods"
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
        # Optionally check if response indicates unauthorized access
        json_data = response.json()
        assert "message" in json_data or "error" in json_data, "Response JSON should include error message"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_v1_periods_without_token()