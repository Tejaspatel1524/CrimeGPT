"""
Create a test user for SentinelAI application
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import UserDB
from app.models.user import UserRole
import bcrypt
import uuid

# Database URL from .env
DATABASE_URL = "postgresql://postgres:CrimeGPT123@localhost:5432/crimegpt"

# Create engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

# Create test investigator user
test_user = UserDB(
    id=str(uuid.uuid4()),
    name="Inspector Rajesh Kumar",
    email="officer@cybercrime.gov.in",
    hashed_password=hash_password("officer123"),
    role=UserRole.investigator
)

# Check if user already exists
existing = db.query(UserDB).filter(UserDB.email == test_user.email).first()
if existing:
    print(f"✓ User already exists: {test_user.email}")
    print(f"  Use password: officer123")
else:
    db.add(test_user)
    db.commit()
    print(f"✓ Test user created successfully!")
    print(f"  Email: {test_user.email}")
    print(f"  Password: officer123")
    print(f"  Role: {test_user.role.value}")

db.close()
