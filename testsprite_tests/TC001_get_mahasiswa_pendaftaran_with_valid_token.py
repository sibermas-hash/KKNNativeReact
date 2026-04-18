import requests

def test_get_mahasiswa_pendaftaran_with_valid_token():
    base_url = "http://localhost:8000"
    endpoint = "/mahasiswa/pendaftaran"
    url = base_url + endpoint
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer valid_student_token"
    }
    timeout = 30

    try:
        response = requests.get(url, headers=headers, timeout=timeout)
        # Assert status code 200
        assert response.status_code == 200, f"Expected status code 200 but got {response.status_code}"

        json_data = response.json()
        # eligibility info presence and type check
        assert "eligible" in json_data, "Response JSON missing 'eligible' field"
        assert isinstance(json_data["eligible"], bool), "'eligible' field should be boolean"

    except requests.RequestException as e:
        assert False, f"HTTP request failed: {e}"

test_get_mahasiswa_pendaftaran_with_valid_token()