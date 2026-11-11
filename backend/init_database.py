"""Initialize database tables on Railway."""
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

from src.db.models import SQLModel
from src.db.session import engine

def init_db():
    """Create all database tables."""
    print("📊 Creating database tables...")
    SQLModel.metadata.create_all(engine)
    print("✅ Database tables created successfully!")

if __name__ == "__main__":
    init_db()
