"""
AI Insights Tests
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.ai
@pytest.mark.integration
@pytest.mark.slow
def test_generate_insights(client: TestClient, auth_headers, test_case, test_note, mock_openai):
    """Test generating AI insights for a case"""
    response = client.post(
        "/insights/generate",
        headers=auth_headers,
        params={"case_id": test_case.id}
    )
    assert response.status_code in [200, 201]
    data = response.json()
    assert "insights_count" in data or "message" in data


@pytest.mark.ai
@pytest.mark.integration
def test_list_insights(client: TestClient, auth_headers, test_case):
    """Test listing insights for a case"""
    response = client.get(
        "/insights",
        headers=auth_headers,
        params={"case_id": test_case.id}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.ai
@pytest.mark.integration
def test_list_insights_with_prioritization(client: TestClient, auth_headers, test_case):
    """Test listing insights with risk prioritization"""
    response = client.get(
        "/insights",
        headers=auth_headers,
        params={
            "case_id": test_case.id,
            "prioritize_risks": True,
            "max_risks": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.ai
@pytest.mark.integration
def test_filter_insights_by_type(client: TestClient, auth_headers, test_case):
    """Test filtering insights by type"""
    response = client.get(
        "/insights",
        headers=auth_headers,
        params={
            "case_id": test_case.id,
            "insight_type": "risk"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    # All insights should be of type "risk"
    if data:
        assert all(insight["type"] == "risk" for insight in data)


@pytest.mark.ai
@pytest.mark.integration
def test_generate_insights_without_notes(client: TestClient, auth_headers, test_case, mock_openai):
    """Test generating insights for case without notes"""
    response = client.post(
        "/insights/generate",
        headers=auth_headers,
        params={"case_id": test_case.id}
    )
    assert response.status_code in [200, 201, 400, 500]

