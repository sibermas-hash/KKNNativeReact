import requests

BASE_URL = "http://localhost:8000"
TIMEOUT = 30

def test_post_mahasiswa_pendaftaran_without_authentication():
    url = f"{BASE_URL}/mahasiswa/pendaftaran"
    payload = {
        # Minimal valid payload structure typical for registration;
        # since PRD does not specify exact fields, use example placeholders
        "student_id": "123456",
        "period_id": "2026-01",
        "sks": 144,
        "gpa": 3.5,
        "prerequisites_met": True
    }
    headers = {
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"
    assert response.status_code == 401, f"Expected 401 Unauthorized, got {response.status_code}"
    # Optionally check response content for unauthorized message or structure
    try:
        data = response.json()
        assert "error" in data or "message" in data or "detail" in data
    except ValueError:
        pass

test_post_mahasiswa_pendaftaran_without_authentication()