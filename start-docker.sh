#!/bin/bash

# CareLo Docker Startup Script
echo "🐳 Starting CareLo with Docker..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  Please edit .env and add your OPENAI_API_KEY"
    echo "Then run this script again."
    exit 1
fi

# Check if OPENAI_API_KEY is set
if ! grep -q "OPENAI_API_KEY=sk-" .env; then
    echo "⚠️  OPENAI_API_KEY not set in .env file!"
    echo "Please add your OpenAI API key to .env file"
    exit 1
fi

# Start services
echo "🚀 Starting all services..."
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check service status
echo ""
echo "📊 Service Status:"
docker compose ps

# Initialize database if needed
echo ""
echo "🗄️  Checking database..."
docker compose exec -T backend python scripts/init_db.py 2>/dev/null || echo "Database already initialized"

echo ""
echo "✅ CareLo is running!"
echo ""
echo "🌐 Access URLs:"
echo "   Frontend:  http://localhost"
echo "   Backend:   http://localhost:8000"
echo "   API Docs:  http://localhost:8000/docs"
echo ""
echo "📝 Useful commands:"
echo "   View logs:       docker compose logs -f"
echo "   Stop services:   docker compose down"
echo "   Restart:         docker compose restart"
echo ""

