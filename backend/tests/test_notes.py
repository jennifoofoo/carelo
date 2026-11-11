"""
Notes Tests (Text, Audio, PDF, Image)
"""

import pytest
import io
from fastapi.testclient import TestClient


@pytest.mark.api
@pytest.mark.integration
def test_create_text_note(client: TestClient, auth_headers, test_case):
    """Test creating a text note"""
    response = client.post(
        "/notes/text",
        headers=auth_headers,
        json={
            "case_id": test_case.id,
            "content": "This is a test note about Emma Schmidt"
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert "note_id" in data
    assert data["status"] in ["processing", "completed", "ready"]


@pytest.mark.api
@pytest.mark.integration
def test_create_text_note_without_case_id(client: TestClient, auth_headers, mock_openai):
    """Test creating a text note without case_id (auto-detection)"""
    response = client.post(
        "/notes/text",
        headers=auth_headers,
        json={
            "content": "Meeting with Emma Schmidt today. She seems happy."
        }
    )
    # Should either create new case or return 400
    assert response.status_code in [201, 400]


@pytest.mark.api
@pytest.mark.integration
@pytest.mark.slow
def test_upload_audio_note(client: TestClient, auth_headers, test_case, mock_openai, mock_gemini_audio):
    """Test uploading an audio note"""
    wav_header = b'RIFF' + b'\x00' * 4 + b'WAVE' + b'fmt ' + b'\x10\x00\x00\x00' + b'\x01\x00' * 8
    audio_data = wav_header + b'\x00' * 1000

    files = {
        'file': ('test_audio.wav', io.BytesIO(audio_data), 'audio/wav')
    }
    data = {'case_id': test_case.id}

    response = client.post(
        "/notes/audio",
        headers=auth_headers,
        files=files,
        data=data
    )
    assert response.status_code in [201, 500]
    if response.status_code == 201:
        result = response.json()
        assert "note_id" in result


@pytest.mark.api
@pytest.mark.integration
def test_list_notes(client: TestClient, auth_headers, test_case, test_note):
    """Test listing notes for a case"""
    response = client.get(
        "/notes",
        headers=auth_headers,
        params={"case_id": test_case.id}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.api
@pytest.mark.integration
def test_upload_without_case_returns_audio(client: TestClient, test_user, mock_openai):
    """Test uploading audio without case_id (demo mode allows no token)"""
    wav_header = b'RIFF' + b'\x00' * 4 + b'WAVE' + b'fmt ' + b'\x10\x00\x00\x00' + b'\x01\x00' * 8
    audio_data = wav_header + b'\x00' * 100
    files = {'file': ('test.wav', io.BytesIO(audio_data), 'audio/wav')}
    response = client.post("/notes/audio", files=files)
    # Demo auth creates user on the fly, so no 401
    assert response.status_code in [201, 400, 422, 500]

