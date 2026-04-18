import requests

def test_get_api_v1_periods_with_valid_token():
    base_url = "http://localhost:8000"
    endpoint = "/api/v1/periods"
    url = base_url + endpoint
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer YOUR_VALID_API_TOKEN"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        # Assert status code is 200
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

        data = response.json()
        # Assert 'periods' in response and it is a list
        assert "periods" in data, "'periods' key not found in response"
        assert isinstance(data["periods"], list), "'periods' is not a list"

        # Assert 'metadata' in response and it is a dict
        assert "metadata" in data, "'metadata' key not found in response"
        assert isinstance(data["metadata"], dict), "'metadata' is not a dict"

    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_get_api_v1_periods_with_valid_token()