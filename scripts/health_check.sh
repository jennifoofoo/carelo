#!/bin/bash
# Comprehensive API Test Script for Tasks and Insights

CASE_ID="${1:-4c52a04f-cad7-49ce-8556-faf3579162ee}"
BASE_URL="http://localhost:8000"

echo "🧪 Testing CareLo API Endpoints"
echo "Case ID: $CASE_ID"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name=$1
    local method=$2
    local url=$3
    local data=$4
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" -H "Content-Type: application/json" -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ OK (${http_code})${NC}"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "$body" | jq '.' 2>/dev/null | head -5 || echo "$body" | head -3
        fi
        return 0
    else
        echo -e "${RED}❌ FAILED (${http_code})${NC}"
        echo "$body" | head -3
        return 1
    fi
}

# Test Tasks API
echo "📋 TASKS API"
echo "------------"
test_endpoint "List Tasks" "GET" "$BASE_URL/tasks?case_id=$CASE_ID"

TASK_DATA="{\"case_id\": \"$CASE_ID\", \"title\": \"API Test Task\", \"description\": \"Created via API test\", \"priority\": \"medium\", \"due_date\": \"2024-12-15T00:00:00Z\"}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/tasks" -H "Content-Type: application/json" -d "$TASK_DATA")
TASK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id' 2>/dev/null)

if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
    test_endpoint "Create Task" "POST" "$BASE_URL/tasks" "$TASK_DATA"
    echo "Created Task ID: $TASK_ID"
    
    UPDATE_DATA="{\"title\": \"Updated API Test Task\", \"status\": \"in_progress\"}"
    test_endpoint "Update Task" "PATCH" "$BASE_URL/tasks/$TASK_ID" "$UPDATE_DATA"
    
    test_endpoint "Get Task" "GET" "$BASE_URL/tasks/$TASK_ID"
    
    # Don't delete in test, keep for manual verification
    # test_endpoint "Delete Task" "DELETE" "$BASE_URL/tasks/$TASK_ID"
else
    echo -e "${RED}❌ Failed to create task for update test${NC}"
fi

echo ""
echo "🔍 INSIGHTS API"
echo "---------------"
test_endpoint "List Insights" "GET" "$BASE_URL/insights?case_id=$CASE_ID"

test_endpoint "Generate Insights" "POST" "$BASE_URL/insights/generate?case_id=$CASE_ID"

# Get first insight ID if available
INSIGHT_ID=$(curl -s "$BASE_URL/insights?case_id=$CASE_ID" | jq -r '.[0].id' 2>/dev/null)
if [ -n "$INSIGHT_ID" ] && [ "$INSIGHT_ID" != "null" ]; then
    echo "Found Insight ID: $INSIGHT_ID"
    test_endpoint "Mark Insight as Read" "PATCH" "$BASE_URL/insights/$INSIGHT_ID/read"
else
    echo -e "${YELLOW}⚠️  No insights found to test mark-as-read${NC}"
fi

echo ""
echo "=================================="
echo "✅ API Testing Complete"


