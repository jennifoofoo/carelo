"""
Authentication Tests
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session


@pytest.mark.auth
@pytest.mark.unit
def test_register_user(client: TestClient):
    """Test user registration"""
    response = client.post(
        "/auth/register",
        json={
            "email": "newuser@carelo.de",
            "password": "password123",
            "full_name": "New User"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@carelo.de"
    assert data["user"]["full_name"] == "New User"


@pytest.mark.auth
@pytest.mark.unit
def test_register_duplicate_email(client: TestClient, auth_user):
    """Test registration with existing email fails"""
    response = client.post(
        "/auth/register",
        json={
            "email": "test@carelo.de",
            "password": "password123",
            "full_name": "Duplicate User"
        }
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"].lower()


@pytest.mark.auth
@pytest.mark.unit
def test_login_success(client: TestClient, auth_user):
    """Test successful login"""
    response = client.post(
        "/auth/login",
        json={
            "email": "test@carelo.de",
            "password": "test123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.auth
@pytest.mark.unit
def test_login_wrong_password(client: TestClient, auth_user):
    """Test login with wrong password fails"""
    response = client.post(
        "/auth/login",
        json={
            "email": "test@carelo.de",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401
    assert "incorrect" in response.json()["detail"].lower()


@pytest.mark.auth
@pytest.mark.unit
def test_login_nonexistent_user(client: TestClient):
    """Test login with non-existent user fails"""
    response = client.post(
        "/auth/login",
        json={
            "email": "nonexistent@carelo.de",
            "password": "password123"
        }
    )
    assert response.status_code == 401


@pytest.mark.auth
@pytest.mark.unit
def test_demo_mode_no_token_required(client: TestClient, test_user):
    """Test that demo mode allows access without token"""
    response = client.get("/cases")
    assert response.status_code == 200


@pytest.mark.auth
@pytest.mark.unit
def test_demo_mode_with_token(client: TestClient, test_user, auth_headers):
    """Test accessing protected endpoint with auth headers in demo mode"""
    response = client.get("/cases", headers=auth_headers)
    assert response.status_code == 200
