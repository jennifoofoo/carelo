#!/bin/bash
# Quick start script for CareLo backend

set -e

echo "🚀 Starting CareLo Backend..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
fi

# Start Docker services
echo "🐳 Starting PostgreSQL and Redis..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for database..."
sleep 5

# Run migrations
echo "📊 Running database migrations..."
alembic upgrade head

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p storage/uploads

echo ""
echo "✅ Backend is ready!"
echo ""
echo "To start the API server:"
echo "  uvicorn src.main:app --reload --port 8000"
echo ""
echo "To start the Celery worker:"
echo "  celery -A src.queue.celery_app worker --loglevel=info"
echo ""
echo "To start Celery beat (periodic tasks):"
echo "  celery -A src.queue.celery_app beat --loglevel=info"
echo ""
echo "API docs will be available at:"
echo "  http://localhost:8000/docs"

