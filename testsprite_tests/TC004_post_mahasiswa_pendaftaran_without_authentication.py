import requests

def test_post_mahasiswa_pendaftaran_without_authentication():
    base_url = "http://localhost:8000"
    url = f"{base_url}/mahasiswa/pendaftaran"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        "nim": "12345678",
        "name": "Test Student",
        "period_id": 1,
        "gpa": 3.5,
        "sks": 145,
        "prerequisites_met": True
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        assert response.status_code == 401, f"Expected 401 Unauthorized but got {response.status_code}"
    except requests.exceptions.RequestException as e:
        assert False, f"Request failed: {e}"

test_post_mahasiswa_pendaftaran_without_authentication()