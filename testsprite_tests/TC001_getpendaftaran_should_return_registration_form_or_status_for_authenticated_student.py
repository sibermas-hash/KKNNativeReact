import requests

def test_get_pendaftaran_should_return_registration_form_or_status_for_authenticated_student():
    base_url = "http://localhost:8000"
    endpoint = "/pendaftaran"
    url = f"{base_url}{endpoint}"
    auth = ("admin", "Password#123")
    headers = {
        "Accept": "application/json"
    }
    try:
        response = requests.get(url, auth=auth, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 200, f"Expected status code 200, got {response.status_code}"

    try:
        data = response.json()
    except ValueError as e:
        assert False, f"Response is not valid JSON: {e}"

    # The API returns either a registration form or current registration status for authenticated student
    # At minimum, check the response contains keys indicating either form or status
    form_keys = {"registration_form", "fields"}
    status_keys = {"registration_status", "status"}

    if any(key in data for key in form_keys):
        # Assume form is returned
        assert isinstance(data.get("registration_form", None), (dict, type(None))) or any(k in data for k in form_keys)
    elif any(key in data for key in status_keys):
        # Assume status is returned
        assert isinstance(data.get("registration_status", ""), str) or any(k in data for k in status_keys)
    else:
        # The response should contain either registration form or status keys
        assert False, "Response JSON does not contain registration form or registration status keys"

test_get_pendaftaran_should_return_registration_form_or_status_for_authenticated_student()