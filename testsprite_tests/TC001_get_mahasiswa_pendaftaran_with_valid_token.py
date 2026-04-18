import requests

def test_get_mahasiswa_pendaftaran_with_valid_token():
    base_url = "http://localhost:8000"
    endpoint = "/mahasiswa/pendaftaran"
    url = base_url + endpoint
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer valid_student_token"
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

        json_data = response.json()
        assert isinstance(json_data, dict), "Response JSON is not a dictionary"

        # Check that eligibility info is present and eligible is boolean true or false
        assert "eligible" in json_data, "Response JSON missing 'eligible' field"
        assert isinstance(json_data["eligible"], bool), "'eligible' field is not a boolean"

    except requests.RequestException as e:
        assert False, f"Request to {url} failed: {e}"

test_get_mahasiswa_pendaftaran_with_valid_token()
