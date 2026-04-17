import requests

def test_post_mahasiswa_pendaftaran_without_authentication():
    base_url = "http://localhost:8000"
    url = f"{base_url}/mahasiswa/pendaftaran"
    headers = {
        "Content-Type": "application/json"
    }
    payload = {
        # Minimal valid payload for registration as per typical schema, can be empty or dummy
        # Since PRD doesn't specify exact POST body schema, sending an empty dict or sample dummy
        # This test is for no auth so payload content doesn't matter strongly
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 401, f"Expected status code 401 Unauthorized but got {response.status_code}"

test_post_mahasiswa_pendaftaran_without_authentication()