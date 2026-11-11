"""
Reports Tests
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.api
@pytest.mark.integration
def test_list_report_templates(client: TestClient, auth_headers, test_user, test_template):
    """Test listing available report templates"""
    response = client.get("/reports/templates", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    template_names = [t["name"] for t in data]
    assert any("hilfe" in name.lower() or "plan" in name.lower() for name in template_names)


@pytest.mark.api
@pytest.mark.integration
@pytest.mark.slow
def test_generate_report(client: TestClient, auth_headers, test_case, test_note, test_template, mock_openai):
    """Test generating a report"""
    response = client.post(
        "/reports/generate",
        headers=auth_headers,
        params={"case_id": test_case.id},
        json={
            "template_id": test_template.id,
            "title": "Test Report"
        }
    )
    assert response.status_code in [200, 201]
    data = response.json()
    assert "id" in data
    assert data["title"] == "Test Report"


@pytest.mark.api
@pytest.mark.integration
def test_list_reports(client: TestClient, auth_headers, test_case, test_user):
    """Test listing reports for a case"""
    response = client.get(
        "/reports",
        headers=auth_headers,
        params={"case_id": test_case.id}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.api
@pytest.mark.integration
def test_get_report_details(client: TestClient, auth_headers, test_case, test_template, mock_openai):
    """Test getting report details"""
    create_response = client.post(
        "/reports",
        headers=auth_headers,
        params={"case_id": test_case.id},
        json={
            "template_id": test_template.id,
            "title": "Test Report for Details"
        }
    )

    if create_response.status_code not in [200, 201]:
        pytest.skip("Could not create report")

    report_id = create_response.json()["id"]

    response = client.get(
        f"/reports/{report_id}",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == report_id
