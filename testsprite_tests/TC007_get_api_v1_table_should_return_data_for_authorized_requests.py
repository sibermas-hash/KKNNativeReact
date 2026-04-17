import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_get_api_v1_table_should_return_data_for_authorized_requests():
    table = "periods"  # allowed table as per PRD example
    
    url = f"{BASE_URL}/api/v1/{table}"
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer valid_token_abc123"
    }
    params = {
        "filter": "active"
    }
    
    try:
        # Actual test for GET /api/v1/{table} authorized
        response = requests.get(url, headers=headers, params=params, timeout=TIMEOUT)
        assert response.status_code == 200, f"Expected 200 from {url} but got {response.status_code}"
        
        json_data = response.json()
        # Validate response contains expected keys: assume 'data' and 'metadata' as per typical filtered data response
        assert isinstance(json_data, dict), "Response body should be a JSON object"
        assert "data" in json_data, "'data' key missing in response"
        assert "metadata" in json_data, "'metadata' key missing in response"
        assert isinstance(json_data["data"], list), "'data' should be a list"
        assert isinstance(json_data["metadata"], dict), "'metadata' should be a dictionary"
        
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"


test_get_api_v1_table_should_return_data_for_authorized_requests()
