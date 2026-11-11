"""
Demo Mode Authentication
Bypasses JWT authentication for demo purposes
"""
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from src.db.models import User
from src.db.session import get_session

# Optional Bearer token (not required in demo mode)
security = HTTPBearer(auto_error=False)

async def get_current_user_demo(
    session: Session = Depends(get_session),
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> User:
    """
    Demo mode: Always returns the demo user
    No password or token required
    """
    # Look for demo user
    statement = select(User).where(User.email == "demo@carelo.de")
    demo_user = session.exec(statement).first()
    
    if not demo_user:
        # Create demo user if not exists
        demo_user = User(
            email="demo@carelo.de",
            password="demo",  # Not used in demo mode
            full_name="Demo User",
            organization="CareLo Demo"
        )
        session.add(demo_user)
        session.commit()
        session.refresh(demo_user)
    
    return demo_user

