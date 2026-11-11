"""
Case Management Tests
"""

import pytest
from fastapi.testclient import TestClient


@pytest.mark.api
@pytest.mark.integration
def test_create_case(client: TestClient, auth_headers, test_user):
    """Test creating a new case"""
    response = client.post(
        "/cases",
        headers=auth_headers,
        json={
            "client_name": "Max Mustermann",
            "priority": "high",
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["client_name"] == "Max Mustermann"
    assert data["priority"] == "high"
    assert data["status"] == "active"
    assert "id" in data


@pytest.mark.api
@pytest.mark.integration
def test_list_cases(client: TestClient, auth_headers, test_case):
    """Test listing all cases"""
    response = client.get("/cases", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert any(case["client_name"] == "Emma Schmidt" for case in data)


@pytest.mark.api
@pytest.mark.integration
def test_get_case_details(client: TestClient, auth_headers, test_case):
    """Test getting case details"""
    response = client.get(f"/cases/{test_case.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == test_case.id
    assert data["client_name"] == "Emma Schmidt"


@pytest.mark.api
@pytest.mark.integration
def test_update_case(client: TestClient, auth_headers, test_case):
    """Test updating a case"""
    response = client.patch(
        f"/cases/{test_case.id}",
        headers=auth_headers,
        json={"status": "closed"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "closed"


@pytest.mark.api
@pytest.mark.integration
def test_search_cases(client: TestClient, auth_headers, test_case):
    """Test searching cases by name"""
    response = client.get(
        "/cases",
        headers=auth_headers,
        params={"search": "Emma"}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert any("Emma" in case["client_name"] for case in data)


@pytest.mark.api
@pytest.mark.integration
def test_get_nonexistent_case(client: TestClient, auth_headers, test_user):
    """Test getting non-existent case returns 404"""
    response = client.get("/cases/nonexistent-id", headers=auth_headers)
    assert response.status_code == 404
