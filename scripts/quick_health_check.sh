#!/bin/bash
# Quick test script for CareLo - runs essential tests only

echo "🧪 Quick Test Suite for CareLo"
echo "================================"
echo ""

# Check if backend is running
echo "📡 Checking Backend..."
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running on http://localhost:8000"
    echo "   Please start the backend first:"
    echo "   cd backend && source venv/bin/activate && python -m uvicorn src.main:app --reload"
    exit 1
fi

# Check if frontend is running
echo ""
echo "🌐 Checking Frontend..."
if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "✅ Frontend is running"
else
    echo "⚠️  Frontend is not running on http://localhost:8080"
    echo "   This is optional for backend tests"
fi

# Run Python test script
echo ""
echo "🚀 Running comprehensive tests..."
echo ""

cd "$(dirname "$0")"
python3 test_all_functionality.py --skip-frontend

