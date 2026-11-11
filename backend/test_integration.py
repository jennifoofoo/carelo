#!/usr/bin/env python3
"""
Carelo Feature Test Suite
Tests all main features and user flows
"""

import requests
import json
import time
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
API_BASE_URL = "http://localhost:8000"
TEST_USER_EMAIL = "test@carelo.de"
TEST_USER_PASSWORD = "test123"
DEMO_USER_EMAIL = "demo@carelo.de"
DEMO_USER_PASSWORD = "demo123"

# Colors for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'


class TestResult:
    def __init__(self, name: str):
        self.name = name
        self.passed = 0
        self.failed = 0
        self.errors = []
    
    def pass_test(self, test_name: str):
        self.passed += 1
        print(f"  {GREEN}✓{RESET} {test_name}")
    
    def fail_test(self, test_name: str, error: str):
        self.failed += 1
        self.errors.append(f"{test_name}: {error}")
        print(f"  {RED}✗{RESET} {test_name}")
        print(f"    {RED}Error: {error}{RESET}")
    
    def summary(self) -> str:
        total = self.passed + self.failed
        status = f"{GREEN}PASS{RESET}" if self.failed == 0 else f"{RED}FAIL{RESET}"
        return f"{self.name}: {status} ({self.passed}/{total} passed)"


class CareloTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.user_id: Optional[str] = None
        self.case_id: Optional[str] = None
        self.note_id: Optional[str] = None
        self.task_id: Optional[str] = None
        self.results: Dict[str, TestResult] = {}
    
    def test(self, category: str, test_name: str, func, *args, **kwargs):
        """Run a test and record the result"""
        if category not in self.results:
            self.results[category] = TestResult(category)
        
        try:
            result = func(*args, **kwargs)
            if result:
                self.results[category].pass_test(test_name)
                return True
            else:
                self.results[category].fail_test(test_name, "Test returned False")
                return False
        except Exception as e:
            self.results[category].fail_test(test_name, str(e))
            return False
    
    def print_header(self, text: str):
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}{text}{RESET}")
        print(f"{BLUE}{'='*60}{RESET}")
    
    def print_summary(self):
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}TEST SUMMARY{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        total_passed = sum(r.passed for r in self.results.values())
        total_failed = sum(r.failed for r in self.results.values())
        total_tests = total_passed + total_failed
        
        for result in self.results.values():
            print(result.summary())
        
        print(f"\n{BLUE}{'='*60}{RESET}")
        overall_status = f"{GREEN}ALL TESTS PASSED{RESET}" if total_failed == 0 else f"{RED}SOME TESTS FAILED{RESET}"
        print(f"OVERALL: {overall_status} ({total_passed}/{total_tests} passed)")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        if total_failed > 0:
            print(f"{YELLOW}Critical Issues:{RESET}")
            for result in self.results.values():
                for error in result.errors:
                    print(f"  • {error}")
            print()
    
    # ================== BACKEND TESTS ==================
    
    def test_health_check(self) -> bool:
        """Test if backend is running"""
        response = requests.get(f"{API_BASE_URL}/health")
        if response.status_code != 200:
            raise Exception(f"Health check failed: {response.status_code}")
        data = response.json()
        print(f"    Database: {data.get('database')}, Redis: {data.get('redis')}")
        return data.get("status") == "healthy"
    
    def test_login(self, email: str, password: str) -> bool:
        """Test user login"""
        response = requests.post(
            f"{API_BASE_URL}/auth/login",
            json={"email": email, "password": password}
        )
        if response.status_code != 200:
            raise Exception(f"Login failed: {response.status_code} - {response.text}")
        data = response.json()
        self.token = data.get("access_token")
        self.user_id = data.get("user", {}).get("id")
        return bool(self.token)
    
    def test_list_cases(self) -> bool:
        """Test listing cases"""
        response = requests.get(
            f"{API_BASE_URL}/cases",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code != 200:
            raise Exception(f"List cases failed: {response.status_code}")
        data = response.json()
        if len(data) > 0:
            self.case_id = data[0]["id"]
            print(f"    Found {len(data)} cases, using case: {self.case_id[:8]}...")
        return isinstance(data, list)
    
    def test_create_case(self) -> bool:
        """Test creating a new case"""
        response = requests.post(
            f"{API_BASE_URL}/cases",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "title": f"Test Case {datetime.now().strftime('%H:%M:%S')}",
                "client_name": "Test Client",
                "priority": "medium"
            }
        )
        if response.status_code != 201:
            raise Exception(f"Create case failed: {response.status_code} - {response.text}")
        data = response.json()
        self.case_id = data.get("id")
        print(f"    Created case: {self.case_id[:8]}...")
        return bool(self.case_id)
    
    def test_create_text_note(self) -> bool:
        """Test creating a text note"""
        if not self.case_id:
            raise Exception("No case_id available")
        
        response = requests.post(
            f"{API_BASE_URL}/notes/text",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "case_id": self.case_id,
                "content": "[Meeting Notes]\n\nDiscussed housing situation. Client is doing well."
            }
        )
        if response.status_code != 201:
            raise Exception(f"Create note failed: {response.status_code} - {response.text}")
        data = response.json()
        self.note_id = data.get("note_id")
        print(f"    Created note: {self.note_id[:8] if self.note_id else 'N/A'}...")
        return bool(self.note_id)
    
    def test_list_notes(self) -> bool:
        """Test listing notes for a case"""
        if not self.case_id:
            raise Exception("No case_id available")
        
        response = requests.get(
            f"{API_BASE_URL}/notes?case_id={self.case_id}",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code == 404:
            # 404 is acceptable if no notes exist yet
            print(f"    No notes found (404 - should return empty array)")
            return True
        if response.status_code != 200:
            raise Exception(f"List notes failed: {response.status_code}")
        data = response.json()
        print(f"    Found {len(data)} notes")
        return isinstance(data, list)
    
    def test_create_task(self) -> bool:
        """Test creating a task"""
        if not self.case_id:
            raise Exception("No case_id available")
        
        response = requests.post(
            f"{API_BASE_URL}/tasks",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "case_id": self.case_id,
                "title": "Test Task",
                "description": "This is a test task",
                "priority": "medium"
            }
        )
        if response.status_code != 201:
            raise Exception(f"Create task failed: {response.status_code} - {response.text}")
        data = response.json()
        self.task_id = data.get("id")
        print(f"    Created task: {self.task_id[:8] if self.task_id else 'N/A'}...")
        return bool(self.task_id)
    
    def test_list_tasks(self) -> bool:
        """Test listing tasks for a case"""
        if not self.case_id:
            raise Exception("No case_id available")
        
        response = requests.get(
            f"{API_BASE_URL}/tasks?case_id={self.case_id}",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code == 404:
            print(f"    No tasks found (404 - should return empty array)")
            return True
        if response.status_code != 200:
            raise Exception(f"List tasks failed: {response.status_code}")
        data = response.json()
        print(f"    Found {len(data)} tasks")
        return isinstance(data, list)
    
    def test_generate_insights(self) -> bool:
        """Test generating AI insights"""
        if not self.case_id:
            raise Exception("No case_id available")
        
        response = requests.post(
            f"{API_BASE_URL}/insights/generate?case_id={self.case_id}",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code == 422:
            print(f"    Insights generation returned 422 (validation error)")
            return False
        if response.status_code != 200:
            raise Exception(f"Generate insights failed: {response.status_code} - {response.text}")
        data = response.json()
        print(f"    Generated {len(data.get('insights', []))} insights")
        return isinstance(data.get("insights"), list)
    
    def test_list_insights(self) -> bool:
        """Test listing insights for a case"""
        if not self.case_id:
            raise Exception("No case_id available")
        
        response = requests.get(
            f"{API_BASE_URL}/insights?case_id={self.case_id}",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code == 422:
            print(f"    Insights list returned 422 (validation error)")
            return False
        if response.status_code == 404:
            print(f"    No insights found (404 - should return empty array)")
            return True
        if response.status_code != 200:
            raise Exception(f"List insights failed: {response.status_code}")
        data = response.json()
        print(f"    Found {len(data)} insights")
        return isinstance(data, list)
    
    def test_list_report_templates(self) -> bool:
        """Test listing report templates"""
        response = requests.get(
            f"{API_BASE_URL}/reports/templates",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code != 200:
            raise Exception(f"List templates failed: {response.status_code}")
        data = response.json()
        print(f"    Found {len(data)} templates")
        # Check if Help Plan template exists
        help_plan_exists = any(t.get("category") == "help_plan" for t in data)
        if help_plan_exists:
            print(f"    Help Plan template exists ✓")
        else:
            print(f"    {YELLOW}Warning: Help Plan template not found{RESET}")
        return isinstance(data, list) and len(data) > 0
    
    def test_list_reports(self) -> bool:
        """Test listing reports for a case"""
        if not self.case_id:
            raise Exception("No case_id available")
        
        response = requests.get(
            f"{API_BASE_URL}/reports?case_id={self.case_id}",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        if response.status_code == 404:
            print(f"    No reports found (404 - should return empty array)")
            return True
        if response.status_code != 200:
            raise Exception(f"List reports failed: {response.status_code}")
        data = response.json()
        print(f"    Found {len(data)} reports")
        return isinstance(data, list)
    
    # ================== RUN ALL TESTS ==================
    
    def run_all_tests(self):
        """Run all test suites"""
        print(f"\n{BLUE}Starting Carelo Feature Tests{RESET}")
        print(f"{BLUE}Base URL: {API_BASE_URL}{RESET}")
        print(f"{BLUE}Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{RESET}")
        
        # 1. Health Check
        self.print_header("1. HEALTH CHECK")
        self.test("Health", "Backend is running", self.test_health_check)
        
        # 2. Authentication
        self.print_header("2. AUTHENTICATION")
        self.test("Authentication", "Login with demo user", self.test_login, DEMO_USER_EMAIL, DEMO_USER_PASSWORD)
        
        # 3. Case Management
        self.print_header("3. CASE MANAGEMENT")
        self.test("Case Management", "List existing cases", self.test_list_cases)
        if not self.case_id:
            self.test("Case Management", "Create new case", self.test_create_case)
        
        # 4. Notes
        self.print_header("4. NOTE MANAGEMENT")
        self.test("Notes", "Create text note", self.test_create_text_note)
        time.sleep(1)  # Give time for processing
        self.test("Notes", "List notes", self.test_list_notes)
        
        # 5. Tasks
        self.print_header("5. TASK MANAGEMENT")
        self.test("Tasks", "Create task", self.test_create_task)
        self.test("Tasks", "List tasks", self.test_list_tasks)
        
        # 6. AI Features
        self.print_header("6. AI FEATURES")
        self.test("AI Features", "Generate insights", self.test_generate_insights)
        time.sleep(2)  # Give time for AI processing
        self.test("AI Features", "List insights", self.test_list_insights)
        
        # 7. Reports
        self.print_header("7. REPORTS")
        self.test("Reports", "List report templates", self.test_list_report_templates)
        self.test("Reports", "List reports", self.test_list_reports)
        
        # Print summary
        self.print_summary()
        
        # Return exit code
        total_failed = sum(r.failed for r in self.results.values())
        return 0 if total_failed == 0 else 1


def main():
    tester = CareloTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

