#!/bin/bash
# Quick Deployment Script for Carelo Production

set -e

echo "🚀 Carelo Production Deployment"
echo "================================"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📝 Please copy env.production.example to .env and configure it:"
    echo "   cp env.production.example .env"
    echo "   nano .env"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running!"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose not found!"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Build images
echo "🔨 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 10

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head || echo "⚠️  Migration failed or already up to date"

# Check service status
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Check logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   2. Visit: http://localhost (or your domain)"
echo "   3. Create admin user: docker-compose -f docker-compose.prod.yml exec backend python scripts/create_user.py"
echo ""



