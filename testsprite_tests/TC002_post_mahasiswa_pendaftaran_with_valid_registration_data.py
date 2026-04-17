import requests

BASE_URL = "http://localhost:8000"
BEARER_TOKEN = "your_valid_student_bearer_token_here"
TIMEOUT = 30

def test_post_mahasiswa_pendaftaran_valid_registration():
    session = requests.Session()
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }

    # Step 1: Get registration form to check eligibility and current_phase
    try:
        get_resp = session.get(f"{BASE_URL}/mahasiswa/pendaftaran", headers=headers, timeout=TIMEOUT)
        assert get_resp.status_code == 200, f"Expected 200 OK from GET /mahasiswa/pendaftaran, got {get_resp.status_code}"
        get_data = get_resp.json()
        assert "eligible" in get_data, "Response missing 'eligible' field"
        assert isinstance(get_data["eligible"], bool), "'eligible' field is not boolean"
        assert "current_phase" in get_data, "Response missing 'current_phase' field"
        assert get_data["eligible"], "Student is not eligible for registration in GET response"

        # Craft valid registration payload (example fields; adjust as needed)
        payload = {
            "student_id": "STU123456",
            "period_id": get_data.get("current_phase", "2026-01"),  # assuming period or phase usage
            "krs_approved": True,
            "gpa": 3.75,
            "prerequisites": ["SKS_complete", "no_disciplinary_action"],
            "contact_phone": "081234567890",
            "address": "Jl. Example No. 123",
            "additional_notes": "Looking forward to the program."
        }

        # Step 2: POST registration payload
        post_resp = session.post(
            f"{BASE_URL}/mahasiswa/pendaftaran",
            headers=headers,
            json=payload,
            timeout=TIMEOUT
        )

        assert post_resp.status_code == 201, f"Expected 201 Created from POST /mahasiswa/pendaftaran, got {post_resp.status_code}"
        post_data = post_resp.json()
        assert "registration_id" in post_data, "Response missing 'registration_id'"
        assert isinstance(post_data["registration_id"], (int, str)), "'registration_id' has unexpected type"
        assert "status" in post_data, "Response missing 'status'"
        assert post_data["status"] == "pending", f"Expected status 'pending', got '{post_data['status']}'"

    finally:
        # Cleanup: attempt to delete the created registration if registration_id available
        try:
            reg_id = post_data.get("registration_id") if 'post_data' in locals() else None
            if reg_id is not None:
                del_resp = session.delete(f"{BASE_URL}/mahasiswa/pendaftaran/{reg_id}", headers=headers, timeout=TIMEOUT)
                # Accept 200 OK or 204 No Content as successful deletion
                assert del_resp.status_code in (200, 204), f"Failed to delete registration {reg_id}, status {del_resp.status_code}"
        except Exception:
            # Cleanup failure should not raise test error
            pass

test_post_mahasiswa_pendaftaran_valid_registration()
