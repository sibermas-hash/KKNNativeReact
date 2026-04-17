import requests

def test_get_pendaftaran_should_return_registration_form_or_status():
    base_url = "http://localhost:8000"
    endpoint = "/pendaftaran"
    url = base_url + endpoint
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer valid_student_token"
    }
    try:
        response = requests.get(url, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 200, f"Expected status 200 but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"
    assert isinstance(data, dict), "Response JSON is not an object"
    has_form = "form" in data and isinstance(data["form"], dict)
    has_status = "registration_status" in data
    assert has_form or has_status, "Response JSON must contain 'form' or 'registration_status'"

test_get_pendaftaran_should_return_registration_form_or_status()