import requests
from requests.auth import HTTPBasicAuth

BASE_URL = "http://localhost:8000"
AUTH_USERNAME = "admin"
AUTH_PASSWORD = "Password#123"
TIMEOUT = 30


def test_postpendaftaran_should_create_registration_with_valid_data_and_documents():
    # Step 1: Authenticate as admin (basic auth for token retrieval if needed)
    # The PRD and instructions specify "authType":"basic token" with username/password.
    # For this test, assume we need to get a Bearer token first for authenticated endpoints.
    # If no token endpoint is given, we assume basic auth is accepted directly in headers.
    auth = HTTPBasicAuth(AUTH_USERNAME, AUTH_PASSWORD)

    headers_basic = {
        "Accept": "application/json",
    }

    # Optional: If the API requires us to get a Bearer token by login, implement here.
    # Since not specified explicitly, we'll use Basic Auth directly in the post request.

    # Prepare a complete and valid registration payload with required documents.
    # The exact schema for /pendaftaran POST is not fully defined, so we create a plausible payload.
    registration_payload = {
        "student_id": "20230001",
        "name": "Test Student",
        "program": "Computer Science",
        "kkn_period": "2026-1",
        "registration_type": "new",
        "documents": {
            "ktp": "base64-encoded-string-or-url",
            "transcript": "base64-encoded-string-or-url",
            "photo": "base64-encoded-string-or-url"
        },
        "contact_email": "student@example.com",
        "phone_number": "+62123456789",
        "address": "Jl. Example No. 10",
    }

    # Use try-finally: create registration and then delete registration to clean up.
    registration_id = None

    try:
        response = requests.post(
            f"{BASE_URL}/pendaftaran",
            json=registration_payload,
            headers=headers_basic,
            auth=auth,
            timeout=TIMEOUT,
        )
        assert response.status_code == 201, f"Expected 201, got {response.status_code}, response: {response.text}"

        response_json = response.json()
        assert "registration_id" in response_json, "Response JSON missing registration_id"
        registration_id = response_json["registration_id"]
        assert isinstance(registration_id, (int, str)) and registration_id != "", "Invalid registration_id"

        # Additional checks: confirm response contains expected confirmation fields
        # (not explicitly specified, so just basic validation)
        assert "confirmation" in response_json, "Response missing confirmation message"

        # Verify admin dashboard access with same credentials to ensure no breakage
        dash_response = requests.get(
            f"{BASE_URL}/admin/dashboard",
            headers=headers_basic,
            auth=auth,
            timeout=TIMEOUT,
        )
        assert dash_response.status_code == 200, f"Admin dashboard access failed with status {dash_response.status_code}"

        dash_json = dash_response.json()
        # Basic check for keys that indicate statistics
        assert any(
            key in dash_json for key in ["registration_counts", "active_groups", "pending_reports"]
        ), "Admin dashboard missing expected statistics keys"

    finally:
        # Cleanup: Delete created registration if applicable
        # The PRD does not specify DELETE /pendaftaran/{id} endpoint.
        # If delete endpoint is missing, skip cleanup.
        if registration_id:
            try:
                delete_resp = requests.delete(
                    f"{BASE_URL}/pendaftaran/{registration_id}",
                    headers=headers_basic,
                    auth=auth,
                    timeout=TIMEOUT,
                )
                # Allow 200 or 204 as success for delete
                assert delete_resp.status_code in [200, 204], f"Failed to delete registration with id {registration_id}"
            except Exception:
                # Log or pass if delete not supported or failed
                pass


test_postpendaftaran_should_create_registration_with_valid_data_and_documents()