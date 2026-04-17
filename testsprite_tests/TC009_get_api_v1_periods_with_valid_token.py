import requests

def test_get_api_v1_periods_with_valid_token():
    base_url = "http://localhost:8000"
    endpoint = "/api/v1/periods"
    url = base_url + endpoint
    api_token = "valid_api_token_here"
    headers = {"Authorization": f"Bearer {api_token}"}
    timeout = 30

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=timeout
        )
    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

    assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

    try:
        json_data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Check presence of periods list and metadata according to PRD
    assert 'periods' in json_data or 'data' in json_data, "Response JSON missing periods data"
    assert 'meta' in json_data, "Response JSON missing meta field"
    
    # Validate meta contents
    meta = json_data.get('meta', {})
    assert isinstance(meta, dict), "meta field should be a dict"
    assert 'project' in meta and isinstance(meta['project'], str), "'project' missing or invalid in meta"
    assert 'date' in meta and isinstance(meta['date'], str), "'date' missing or invalid in meta"
    assert 'prepared_by' in meta and isinstance(meta['prepared_by'], str), "'prepared_by' missing or invalid in meta"

test_get_api_v1_periods_with_valid_token()