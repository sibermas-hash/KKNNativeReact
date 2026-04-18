import requests

def test_post_mahasiswa_pendaftaran_ineligible_student():
    base_url = "http://localhost:8000"
    endpoint = "/mahasiswa/pendaftaran"
    url = base_url + endpoint

    # Bearer token for authenticated student (replace with valid token)
    bearer_token = "Bearer REPLACE_WITH_VALID_STUDENT_TOKEN"

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": bearer_token
    }

    # Payload representing an ineligible student data missing SKS, GPA, or prerequisites
    payload = {
        "student_id": "12345678",
        "kkn_period_id": 1,
        "completed_sks": 90,   # assuming minimum required is > 90, and GPA or prerequisites are invalid/missing
        "gpa": 1.8,           # assuming minimum required GPA is 2.5
        "prerequisites_met": False,
        "additional_info": "Missing required SKS, GPA too low, and prerequisites not met"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    # Validate the response status code for validation error
    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"

    # Validate response content for detailed validation errors about SKS, GPA, prerequisites
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Expected fields indicating validation errors
    expected_error_fields = ["sks", "gpa", "prerequisites"]
    error_fields_found = []

    # Check if each expected field appears in error details or messages
    errors = data.get("errors") or data.get("details") or data.get("message") or {}
    if isinstance(errors, dict):
        for field in expected_error_fields:
            if field in errors:
                error_fields_found.append(field)
    elif isinstance(errors, list):
        for error_msg in errors:
            for field in expected_error_fields:
                if field in error_msg.lower():
                    if field not in error_fields_found:
                        error_fields_found.append(field)
    elif isinstance(errors, str):
        for field in expected_error_fields:
            if field in errors.lower():
                error_fields_found.append(field)

    assert len(error_fields_found) >= 1, f"Expected validation errors on fields {expected_error_fields}, got {errors}"

test_post_mahasiswa_pendaftaran_ineligible_student()
