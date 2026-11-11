"""Create a test user."""
import sys
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session
from src.db.session import engine
from src.db.models import User
from src.utils.jwt import hash_password

def create_user(email: str, password: str, full_name: str = None):
    """Create a new user."""
    with Session(engine) as session:
        # Check if user exists
        from sqlmodel import select
        statement = select(User).where(User.email == email)
        existing_user = session.exec(statement).first()
        
        if existing_user:
            print(f"❌ User with email {email} already exists!")
            return
        
        # Create user
        user = User(
            email=email,
            password=hash_password(password),
            full_name=full_name,
        )
        
        session.add(user)
        session.commit()
        session.refresh(user)
        
        print(f"✅ User created successfully!")
        print(f"   Email: {user.email}")
        print(f"   ID: {user.id}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python create_user.py <email> <password> [full_name]")
        sys.exit(1)
    
    email = sys.argv[1]
    password = sys.argv[2]
    full_name = sys.argv[3] if len(sys.argv) > 3 else None
    
    create_user(email, password, full_name)

