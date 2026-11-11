#!/bin/bash
set -e

echo "🚀 Starting Carelo on Railway..."

# Parse DATABASE_URL for connection check
if [ -n "$DATABASE_URL" ]; then
  echo "⏳ Waiting for database..."
  # Extract host from DATABASE_URL (format: postgresql://user:pass@host:port/db)
  DB_HOST=$(echo $DATABASE_URL | sed -e 's/.*@\(.*\):.*/\1/')
  DB_PORT=$(echo $DATABASE_URL | sed -e 's/.*:\([0-9]*\)\/.*/\1/')
  
# Wait for database to be ready
  for i in {1..30}; do
    if pg_isready -h "$DB_HOST" -p "$DB_PORT" > /dev/null 2>&1; then
      echo "✅ Database is ready!"
      break
    fi
    echo "Database is unavailable - sleeping (attempt $i/30)"
  sleep 2
done
else
  echo "⚠️  No DATABASE_URL found, skipping database check"
fi

# Initialize database (create tables)
echo "🔧 Initializing database tables..."
cd /app/backend
python init_database.py || echo "⚠️  Database init failed"

# Run database migrations (if any exist)
echo "🔧 Running database migrations..."
python -m alembic upgrade head || echo "⚠️  Migrations failed or not configured"

# Create report templates
echo "📋 Creating report templates..."
python src/scripts/create_report_templates.py || echo "⚠️  Template creation failed"

# Start Nginx (skip for now - Railway handles routing)
echo "🌐 Skipping Nginx (Railway handles routing)..."
# nginx

# Start backend with Uvicorn
echo "🐍 Starting Uvicorn..."
cd /app/backend
exec uvicorn src.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --workers ${WORKERS:-2} \
    --log-level info

