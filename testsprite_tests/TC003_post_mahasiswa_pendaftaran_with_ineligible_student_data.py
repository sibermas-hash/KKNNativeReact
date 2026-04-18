import requests

def test_post_mahasiswa_pendaftaran_ineligible_student():
    base_url = "http://localhost:8000"
    endpoint = "/mahasiswa/pendaftaran"
    url = base_url + endpoint

    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": "Bearer valid_student_token"
    }

    # Example payload representing an ineligible student (missing SKS, GPA, or prerequisites)
    payload = {
        "student_id": "123456789",
        "period_id": "2026-01",
        "sks_completed": 60,  # assuming required is higher
        "gpa": 2.0,          # assuming minimum GPA is higher, e.g. 3.0
        "prerequisites_met": False,
        "additional_info": "Some missing prerequisite courses"
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=30
        )
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 422, f"Expected status 422, got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    # Check that response indicates validation errors for missing SKS, GPA, or prerequisites
    assert "errors" in resp_json, "Response JSON does not contain 'errors' field"

    errors = resp_json["errors"]
    missing_fields = {"sks_completed", "gpa", "prerequisites_met"}
    error_fields = set(errors.keys())

    # Validate that at least one validation error indicates missing or insufficient SKS, GPA, or prerequisites
    assert missing_fields.intersection(error_fields), (
        f"Validation errors do not include expected fields among {missing_fields}. Got error fields: {error_fields}"
    )

test_post_mahasiswa_pendaftaran_ineligible_student()