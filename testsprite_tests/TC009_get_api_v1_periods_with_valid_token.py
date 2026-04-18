import requests

def test_get_api_v1_periods_with_valid_token():
    base_url = "http://localhost:8000"
    endpoint = "/api/v1/periods"
    url = base_url + endpoint
    # Use Bearer token for auth as per PRD
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer valid_api_token"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"
    json_data = response.json()
    assert "periods" in json_data, "Response JSON does not contain 'periods'"
    assert isinstance(json_data["periods"], list), "'periods' should be a list"
    assert "metadata" in json_data, "Response JSON does not contain 'metadata'"
    assert isinstance(json_data["metadata"], dict), "'metadata' should be a dict"


test_get_api_v1_periods_with_valid_token()
