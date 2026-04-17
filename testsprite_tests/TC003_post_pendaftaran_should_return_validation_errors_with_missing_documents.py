import requests

BASE_URL = "http://localhost:8000"
TOKEN = "dummy_admin_token"
TIMEOUT = 30

headers_auth = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def test_post_pendaftaran_should_return_validation_errors_with_missing_documents():
    # Step 1: Verify admin dashboard access
    dashboard_url = f"{BASE_URL}/admin/dashboard"
    try:
        dashboard_response = requests.get(dashboard_url, headers={"Authorization": f"Bearer {TOKEN}"}, timeout=TIMEOUT)
        assert dashboard_response.status_code == 200, f"Expected 200 OK from admin dashboard, got {dashboard_response.status_code}"
        dashboard_json = dashboard_response.json()
        # Basic check for dashboard keys
        assert ("registration counts" in str(dashboard_json).lower() or
                "active groups" in str(dashboard_json).lower() or
                "pending reports" in str(dashboard_json).lower())
    except requests.RequestException as e:
        assert False, f"Admin dashboard access failed: {e}"

    # Step 2: Prepare incomplete registration payload with missing required documents
    registration_url = f"{BASE_URL}/pendaftaran"
    incomplete_payload = {
        "student_id": "dummy_student_id",
        "registration_type": "regular"
    }

    try:
        response = requests.post(
            registration_url,
            headers=headers_auth,
            json=incomplete_payload,
            timeout=TIMEOUT
        )
    except requests.RequestException as e:
        assert False, f"Request to POST /pendaftaran failed: {e}"

    # Step 3: Validate response is 422 with validation_errors and detailed error messages
    assert response.status_code == 422, f"Expected HTTP 422 for missing documents, got {response.status_code}"
    try:
        resp_json = response.json()
    except ValueError:
        assert False, "Response is not JSON as expected for validation error"

    assert "validation_errors" in resp_json, "Response JSON does not contain 'validation_errors'"
    validation_errors = resp_json.get("validation_errors")
    assert isinstance(validation_errors, dict), "'validation_errors' should be a dictionary/object"

    # Check that errors mention missing documents specifically
    document_error_found = False
    for field, errors in validation_errors.items():
        if "document" in field.lower() or "file" in field.lower() or "documents" in field.lower():
            if isinstance(errors, list) and any(isinstance(e, str) and e.strip() for e in errors):
                document_error_found = True
                break
    assert document_error_found, "Validation errors do not indicate missing required documents"

test_post_pendaftaran_should_return_validation_errors_with_missing_documents()