.PHONY: help install dev db-up db-down db-migrate db-upgrade db-reset run worker beat test clean

help:
	@echo "CareLo Backend - Available commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Install dev dependencies"
	@echo "  make db-up       - Start database (Docker)"
	@echo "  make db-down     - Stop database"
	@echo "  make db-migrate  - Create a new migration"
	@echo "  make db-upgrade  - Run migrations"
	@echo "  make db-reset    - Reset database"
	@echo "  make run         - Run API server"
	@echo "  make worker      - Run Celery worker"
	@echo "  make beat        - Run Celery beat"
	@echo "  make test        - Run tests"
	@echo "  make clean       - Clean up"

install:
	pip install -r requirements.txt

dev:
	pip install -r requirements.txt
	pip install black flake8 mypy pytest

db-up:
	docker-compose up -d

db-down:
	docker-compose down

db-migrate:
	alembic revision --autogenerate -m "$(msg)"

db-upgrade:
	alembic upgrade head

db-reset:
	docker-compose down -v
	docker-compose up -d
	sleep 3
	alembic upgrade head
	python scripts/init_db.py

run:
	uvicorn src.main:app --reload --port 8000

worker:
	celery -A src.queue.celery_app worker --loglevel=info

beat:
	celery -A src.queue.celery_app beat --loglevel=info

test:
	pytest

clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +

