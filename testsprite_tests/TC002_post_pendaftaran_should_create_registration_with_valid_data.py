import requests

BASE_URL = "http://localhost:8000"
BEARER_TOKEN = "your_valid_bearer_token_here"
TIMEOUT = 30

def test_post_pendaftaran_should_create_registration_with_valid_data():
    headers = {
        "Accept": "application/json",
        "Authorization": f"Bearer {BEARER_TOKEN}"
    }

    # Step 1: Access GET /pendaftaran to simulate student registration form retrieval and verify admin dashboard access
    try:
        get_pendaftaran_resp = requests.get(f"{BASE_URL}/pendaftaran", headers=headers, timeout=TIMEOUT)
        assert get_pendaftaran_resp.status_code == 200, f"Expected 200 from GET /pendaftaran but got {get_pendaftaran_resp.status_code}"
    except Exception as e:
        raise AssertionError(f"GET /pendaftaran request failed: {e}")

    try:
        get_admin_dashboard_resp = requests.get(f"{BASE_URL}/admin/dashboard", headers=headers, timeout=TIMEOUT)
        assert get_admin_dashboard_resp.status_code == 200, f"Expected 200 from GET /admin/dashboard but got {get_admin_dashboard_resp.status_code}"
    except Exception as e:
        raise AssertionError(f"GET /admin/dashboard request failed: {e}")

    # Step 2: Prepare valid registration data
    registration_payload = {
        "student_id": "STUDENT123456",  # Assume sample ID
        "registration_type": "KKN_REGULAR",
        "form_data": {
            "full_name": "Test Student",
            "period_id": 1,
            "program_study": "Informatics",
            "year_of_entry": 2020
        },
        "required_documents": {
            "transcript_pdf": "base64encodedstring==",
            "student_card_pdf": "base64encodedstring=="
        }
    }

    registration_id = None

    # Step 3: POST /pendaftaran with valid data
    try:
        post_resp = requests.post(
            f"{BASE_URL}/pendaftaran", 
            headers={**headers, "Content-Type": "application/json"}, 
            json=registration_payload, 
            timeout=TIMEOUT
        )
        assert post_resp.status_code == 201, f"Expected 201 Created but got {post_resp.status_code}"
        resp_json = post_resp.json()
        assert "registration_id" in resp_json, "Response missing 'registration_id'"
        assert "confirmation" in resp_json, "Response missing 'confirmation'"
        registration_id = resp_json["registration_id"]
        assert isinstance(registration_id, (int, str)) and registration_id, "'registration_id' must be non-empty"
        assert isinstance(resp_json["confirmation"], str) and resp_json["confirmation"], "'confirmation' must be non-empty string"
    except Exception as e:
        raise AssertionError(f"POST /pendaftaran request failed or response invalid: {e}")
    finally:
        # Cleanup: Delete created registration if possible
        if registration_id:
            try:
                del_resp = requests.delete(f"{BASE_URL}/pendaftaran/{registration_id}", headers=headers, timeout=TIMEOUT)
                if del_resp.status_code not in [200, 204, 404]:
                    raise AssertionError(f"Unexpected status code {del_resp.status_code} on cleanup DELETE /pendaftaran/{registration_id}")
            except Exception:
                pass  # Ignore cleanup errors

test_post_pendaftaran_should_create_registration_with_valid_data()
