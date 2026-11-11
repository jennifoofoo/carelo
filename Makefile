.PHONY: help build up down restart logs status clean init dev prod

help:
	@echo "CareLo Docker Commands"
	@echo ""
	@echo "  make build      - Build all Docker images"
	@echo "  make up         - Start all services"
	@echo "  make down       - Stop all services"
	@echo "  make restart    - Restart all services"
	@echo "  make logs       - View logs (all services)"
	@echo "  make status     - Show service status"
	@echo "  make clean      - Stop and remove all containers, volumes"
	@echo "  make init       - Initialize database"
	@echo "  make dev        - Start in development mode"
	@echo "  make prod       - Start in production mode"
	@echo ""

build:
	@echo "🔨 Building Docker images..."
	docker compose build

up:
	@echo "🚀 Starting all services..."
	docker compose up -d
	@echo "✅ Services started!"
	@make status

down:
	@echo "🛑 Stopping all services..."
	docker compose down

restart:
	@echo "🔄 Restarting services..."
	docker compose restart

logs:
	@echo "📋 Showing logs (Ctrl+C to exit)..."
	docker compose logs -f

status:
	@echo "📊 Service Status:"
	@docker compose ps

clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker compose down -v
	@echo "✅ Cleanup complete!"

init:
	@echo "🗄️  Initializing database..."
	docker compose exec backend python scripts/init_db.py
	@echo "✅ Database initialized!"

dev:
	@echo "🔧 Starting development environment..."
	docker compose -f docker-compose.dev.yml up -d
	@echo "✅ Development environment started!"
	@echo "   Backend: http://localhost:8000"
	@echo "   Frontend: http://localhost:8080 (run 'npm run dev' separately)"

prod:
	@echo "🚀 Starting production environment..."
	docker compose up -d --build
	@echo "✅ Production environment started!"
	@echo "   Frontend: http://localhost"
	@echo "   Backend: http://localhost:8000"

