"""
Complete Authentication System Audit
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from app.database.models import UserDB
from app.models.user import UserRole
import bcrypt
import uuid
from dotenv import load_dotenv

load_dotenv()

print("=" * 80)
print("SENTINELAI AUTHENTICATION SYSTEM AUDIT")
print("=" * 80)

# 1. CHECK DATABASE CONNECTION
print("\n[1] DATABASE CONNECTION CHECK")
print("-" * 80)
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:CrimeGPT123@localhost:5432/crimegpt")
print(f"Database URL: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    connection = engine.connect()
    print("✓ Database connection: SUCCESS")
    connection.close()
except Exception as e:
    print(f"✗ Database connection: FAILED - {e}")
    sys.exit(1)

# 2. CHECK IF USERS TABLE EXISTS
print("\n[2] USERS TABLE CHECK")
print("-" * 80)
inspector = inspect(engine)
tables = inspector.get_table_names()
print(f"Available tables: {', '.join(tables)}")

if 'users' not in tables:
    print("✗ Users table does NOT exist!")
    print("  Run: alembic upgrade head")
    sys.exit(1)
else:
    print("✓ Users table exists")

# Get users table schema
columns = inspector.get_columns('users')
print(f"  Columns: {', '.join([c['name'] for c in columns])}")

# 3. LIST ALL EXISTING USERS
print("\n[3] EXISTING USERS IN DATABASE")
print("-" * 80)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

users = db.query(UserDB).all()
print(f"Total users in database: {len(users)}")

if users:
    for idx, user in enumerate(users, 1):
        print(f"\n  User #{idx}:")
        print(f"    ID: {user.id}")
        print(f"    Name: {user.name}")
        print(f"    Email: {user.email}")
        print(f"    Role: {user.role.value}")
        print(f"    Password Hash: {user.hashed_password[:50]}...")
else:
    print("  ⚠ NO USERS FOUND IN DATABASE")

# 4. VERIFY PASSWORD HASHING
print("\n[4] PASSWORD HASHING VERIFICATION")
print("-" * 80)
test_password = "admin123"
print(f"Test password: {test_password}")

try:
    hashed = bcrypt.hashpw(test_password.encode(), bcrypt.gensalt()).decode()
    print(f"✓ Hashing works: {hashed[:50]}...")
    
    # Verify the hash
    is_valid = bcrypt.checkpw(test_password.encode(), hashed.encode())
    print(f"✓ Verification works: {is_valid}")
except Exception as e:
    print(f"✗ Hashing/Verification failed: {e}")

# 5. TEST EXISTING USER PASSWORDS
if users:
    print("\n[5] TESTING EXISTING USER PASSWORD VERIFICATION")
    print("-" * 80)
    for user in users:
        print(f"\n  Testing user: {user.email}")
        test_passwords = ["officer123", "admin123", "password", "Password123"]
        for pwd in test_passwords:
            try:
                result = bcrypt.checkpw(pwd.encode(), user.hashed_password.encode())
                if result:
                    print(f"    ✓ PASSWORD FOUND: '{pwd}' works for {user.email}")
                    break
            except:
                pass
        else:
            print(f"    ✗ None of the test passwords work")

# 6. CREATE DEFAULT ADMIN USER IF MISSING
print("\n[6] DEFAULT ADMIN USER CHECK")
print("-" * 80)

admin_email = "admin@sentinelai.gov.in"
admin_password = "admin123"

existing_admin = db.query(UserDB).filter(UserDB.email == admin_email).first()

if existing_admin:
    print(f"✓ Admin user already exists: {admin_email}")
else:
    print(f"⚠ Admin user does NOT exist. Creating...")
    try:
        admin_user = UserDB(
            id=str(uuid.uuid4()),
            name="System Administrator",
            email=admin_email,
            hashed_password=bcrypt.hashpw(admin_password.encode(), bcrypt.gensalt()).decode(),
            role=UserRole.admin
        )
        db.add(admin_user)
        db.commit()
        print(f"✓ Admin user created successfully!")
        print(f"    Email: {admin_email}")
        print(f"    Password: {admin_password}")
    except Exception as e:
        print(f"✗ Failed to create admin user: {e}")

# 7. CREATE DEFAULT INVESTIGATOR USER IF MISSING
print("\n[7] DEFAULT INVESTIGATOR USER CHECK")
print("-" * 80)

officer_email = "officer@cybercrime.gov.in"
officer_password = "officer123"

existing_officer = db.query(UserDB).filter(UserDB.email == officer_email).first()

if existing_officer:
    print(f"✓ Investigator user already exists: {officer_email}")
else:
    print(f"⚠ Investigator user does NOT exist. Creating...")
    try:
        officer_user = UserDB(
            id=str(uuid.uuid4()),
            name="Inspector Rajesh Kumar",
            email=officer_email,
            hashed_password=bcrypt.hashpw(officer_password.encode(), bcrypt.gensalt()).decode(),
            role=UserRole.investigator
        )
        db.add(officer_user)
        db.commit()
        print(f"✓ Investigator user created successfully!")
        print(f"    Email: {officer_email}")
        print(f"    Password: {officer_password}")
    except Exception as e:
        print(f"✗ Failed to create investigator user: {e}")

# 8. VERIFY JWT GENERATION
print("\n[8] JWT TOKEN GENERATION TEST")
print("-" * 80)
try:
    from jose import jwt
    from datetime import datetime, timedelta, timezone
    
    SECRET_KEY = os.getenv("SECRET_KEY", "crimegpt-secret-key-change-in-production")
    ALGORITHM = "HS256"
    
    payload = {"sub": "test@example.com", "role": "admin"}
    expire = datetime.now(timezone.utc) + timedelta(minutes=30)
    payload.update({"exp": expire})
    
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
    print(f"✓ JWT generation works")
    print(f"  Token: {token[:50]}...")
    
    # Verify decoding
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print(f"✓ JWT decoding works")
    print(f"  Decoded payload: {decoded}")
except Exception as e:
    print(f"✗ JWT failed: {e}")

# FINAL SUMMARY
print("\n" + "=" * 80)
print("AUTHENTICATION AUDIT COMPLETE")
print("=" * 80)

# Get final user list
final_users = db.query(UserDB).all()
print(f"\nTotal users in database: {len(final_users)}")

if final_users:
    print("\n✓ VALID LOGIN CREDENTIALS:")
    print("-" * 80)
    for user in final_users:
        print(f"\n  Email: {user.email}")
        print(f"  Role: {user.role.value}")
        # Try to determine password
        if user.email == "admin@sentinelai.gov.in":
            print(f"  Password: admin123")
        elif user.email == "officer@cybercrime.gov.in":
            print(f"  Password: officer123")
        else:
            print(f"  Password: (unknown - test with common passwords)")

print("\n" + "=" * 80)

db.close()
