import requests

def test_getapiv1private_table_should_return_forbidden_for_disallowed_tables():
    base_url = "http://localhost:8000"
    endpoint = "/api/v1/private_table"
    url = base_url + endpoint
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer admin_token"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
        # Assert status code is 403 Forbidden
        assert response.status_code == 403, f"Expected status 403 but got {response.status_code}"
        # Optionally check error message or error code inside response JSON if provided
        try:
            json_resp = response.json()
            # check if error key exist and contains expected error description
            assert "error" in json_resp or "message" in json_resp, "Response JSON missing 'error' or 'message' field"
        except ValueError:
            # response not JSON, which might be unexpected but pass if status 403 is correct
            pass
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_getapiv1private_table_should_return_forbidden_for_disallowed_tables()