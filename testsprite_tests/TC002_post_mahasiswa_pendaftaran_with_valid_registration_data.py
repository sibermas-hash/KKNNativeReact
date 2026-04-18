import requests

def test_post_mahasiswa_pendaftaran_with_valid_registration_data():
    base_url = "http://localhost:8000"
    endpoint = "/mahasiswa/pendaftaran"
    url = base_url + endpoint
    # Use Bearer token for authentication as per PRD
    token = "valid_student_token_example"
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    payload = {
        "student_id": "123456789",
        "period_id": "2026_spring",
        "gpa": 3.5,
        "completed_sks": 140,
        "prerequisites_met": True,
        "contact_phone": "08123456789",
        "address": "Jl. Example No.1, City"
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
        response_json = response.json()

        assert "registration_id" in response_json, "Response JSON missing 'registration_id'"
        assert response_json["registration_id"], "'registration_id' is empty or null"

        assert "status" in response_json, "Response JSON missing 'status'"
        assert response_json["status"] == "pending", f"Expected status 'pending', got {response_json['status']}"
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_mahasiswa_pendaftaran_with_valid_registration_data()
