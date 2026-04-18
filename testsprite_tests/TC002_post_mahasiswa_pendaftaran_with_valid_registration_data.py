import requests

def test_post_mahasiswa_pendaftaran_with_valid_registration_data():
    base_url = "http://localhost:8000"
    endpoint = "/mahasiswa/pendaftaran"
    url = base_url + endpoint
    token = "valid_student_token_here"  # Replace this with a valid Bearer token for the student
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    # A valid registration payload example
    payload = {
        "period_id": 1,
        "program_study": "Computer Science",
        "gpa": 3.75,
        "sks_completed": 110,
        "prerequisites_met": True
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
    
    assert response.status_code == 201, f"Expected 201 Created but got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    assert "registration_id" in data, "Response JSON missing 'registration_id'"
    assert "status" in data, "Response JSON missing 'status'"
    assert data["status"].lower() == "pending", f"Expected status 'pending' but got '{data['status']}'"

test_post_mahasiswa_pendaftaran_with_valid_registration_data()
