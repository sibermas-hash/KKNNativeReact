import requests
from requests.auth import HTTPBasicAuth

def test_get_mahasiswa_pendaftaran_with_valid_token():
    base_url = "http://localhost:8000"
    endpoint = "/mahasiswa/pendaftaran"
    url = base_url + endpoint
    timeout = 30

    # Authenticate with basic auth to get token if needed
    # PRD states "authType":"basic token" with username/password
    # We'll request the endpoint with basic auth directly since no token endpoint specified

    auth = HTTPBasicAuth('admin', 'Password#123')
    headers = {
        "Accept": "application/json",
    }

    try:
        response = requests.get(url, headers=headers, auth=auth, timeout=timeout)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Confirm 'eligible' and 'current_phase' root-level fields exist and have proper types
    assert 'eligible' in json_data, "'eligible' field not found in response"
    assert isinstance(json_data['eligible'], bool), "'eligible' field is not a boolean"

    assert 'current_phase' in json_data, "'current_phase' field not found in response"
    # current_phase type not specified, assuming string or null
    assert isinstance(json_data['current_phase'], (str, type(None))), "'current_phase' field is not string or null"

    # Additional semantic checks for eligible value could be here. PRD expects 'eligible' true on success.
    # Since this test is about retrieval, any boolean is acceptable, but preferably True for eligibility.
    # We'll just check it exists and is boolean.

test_get_mahasiswa_pendaftaran_with_valid_token()