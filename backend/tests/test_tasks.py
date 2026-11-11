"""
Tasks Tests
"""

import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta


@pytest.mark.api
@pytest.mark.integration
def test_create_task(client: TestClient, auth_headers, test_case):
    """Test creating a task"""
    due_date = (datetime.now() + timedelta(days=7)).isoformat()

    response = client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "case_id": test_case.id,
            "title": "Follow-up meeting",
            "description": "Schedule follow-up with family",
            "priority": "high",
            "due_date": due_date
        }
    )
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Follow-up meeting"
    assert data["priority"] == "high"
    assert "id" in data


@pytest.mark.api
@pytest.mark.integration
def test_list_tasks(client: TestClient, auth_headers, test_case):
    """Test listing tasks for a case"""
    client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "case_id": test_case.id,
            "title": "Test Task",
            "priority": "medium"
        }
    )

    response = client.get(
        "/tasks",
        headers=auth_headers,
        params={"case_id": test_case.id}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.api
@pytest.mark.integration
def test_update_task(client: TestClient, auth_headers, test_case):
    """Test updating a task"""
    create_response = client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "case_id": test_case.id,
            "title": "Task to Update",
            "priority": "low"
        }
    )
    task_id = create_response.json()["id"]

    response = client.patch(
        f"/tasks/{task_id}",
        headers=auth_headers,
        json={
            "status": "completed",
            "priority": "high"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["priority"] == "high"


@pytest.mark.api
@pytest.mark.integration
def test_delete_task(client: TestClient, auth_headers, test_case):
    """Test deleting a task"""
    create_response = client.post(
        "/tasks",
        headers=auth_headers,
        json={
            "case_id": test_case.id,
            "title": "Task to Delete",
            "priority": "low"
        }
    )
    task_id = create_response.json()["id"]

    response = client.delete(
        f"/tasks/{task_id}",
        headers=auth_headers
    )
    assert response.status_code == 204

    get_response = client.get(
        "/tasks",
        headers=auth_headers,
        params={"case_id": test_case.id}
    )
    tasks = get_response.json()
    assert not any(task["id"] == task_id for task in tasks)


@pytest.mark.api
@pytest.mark.integration
def test_create_multiple_tasks(client: TestClient, auth_headers, test_case):
    """Test creating multiple tasks for a case"""
    for title in ["Task A", "Task B", "Task C"]:
        client.post(
            "/tasks",
            headers=auth_headers,
            json={"case_id": test_case.id, "title": title, "priority": "medium"}
        )

    response = client.get(
        "/tasks",
        headers=auth_headers,
        params={"case_id": test_case.id}
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 3
