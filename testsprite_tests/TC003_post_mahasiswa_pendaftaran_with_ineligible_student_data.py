import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30


def test_post_mahasiswa_pendaftaran_ineligible_student_data():
    url = f"{BASE_URL}/mahasiswa/pendaftaran"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer dummy_student_token"
    }
    # Payload with ineligible student data: missing SKS, low GPA, and failing prerequisites
    payload = {
        "nim": "1234567890",
        "name": "Ineligible Student",
        "sks_completed": 50,  # Suppose minimum required is 100
        "gpa": 1.5,           # Suppose minimum required is 2.75
        "prerequisites_met": False,
        "kkn_period_id": 1
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected status code 422, got {response.status_code}"
    try:
        response_json = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    # Validate detailed error fields presence for SKS, GPA, prerequisites
    error_fields = response_json.get("errors") or response_json.get("error") or response_json
    assert error_fields, "Expected error details in response"

    # Check that the errors contain relevant messages or keys indicating missing SKS, GPA, or prerequisite failures
    sks_error = any("sks" in key.lower() or "sks" in str(val).lower() for key, val in error_fields.items()) if isinstance(error_fields, dict) else False
    gpa_error = any("gpa" in key.lower() or "gpa" in str(val).lower() for key, val in error_fields.items()) if isinstance(error_fields, dict) else False
    prereq_error = any("prerequisite" in key.lower() or "prerequisite" in str(val).lower() for key, val in error_fields.items()) if isinstance(error_fields, dict) else False

    assert sks_error or gpa_error or prereq_error, "Error response should indicate missing SKS, GPA, or prerequisite failures"


test_post_mahasiswa_pendaftaran_ineligible_student_data()
