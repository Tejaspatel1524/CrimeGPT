"""
Create test users for all three roles: Admin, Investigator, Viewer
Phase 2: Role-Based Access Control Testing
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy.orm import Session
from app.database.database import SessionLocal
from app.database.models import UserDB
from app.models.user import UserRole
import bcrypt
import uuid
from datetime import datetime, timezone

def create_test_users():
    db: Session = SessionLocal()
    
    try:
        print("=" * 80)
        print("PHASE 2: ROLE-BASED ACCESS CONTROL")
        print("Creating Test Users for All Roles")
        print("=" * 80)
        
        # Test users configuration
        test_users = [
            {
                "full_name": "Admin User",
                "email": "admin@crimegpt.gov.in",
                "password": "admin123",
                "role": UserRole.admin,
                "department": "Administration",
                "phone": "+91-9876543210"
            },
            {
                "full_name": "Investigator User",
                "email": "investigator@crimegpt.gov.in",
                "password": "investigator123",
                "role": UserRole.investigator,
                "department": "Cyber Crime Cell",
                "phone": "+91-9876543211"
            },
            {
                "full_name": "Viewer User",
                "email": "viewer@crimegpt.gov.in",
                "password": "viewer123",
                "role": UserRole.viewer,
                "department": "Compliance",
                "phone": "+91-9876543212"
            }
        ]
        
        created_users = []
        
        for user_data in test_users:
            # Check if user already exists
            existing = db.query(UserDB).filter(UserDB.email == user_data["email"]).first()
            
            if existing:
                print(f"\n✓ User already exists: {user_data['email']} ({user_data['role'].value})")
                print(f"  ID: {existing.id}")
                print(f"  Name: {existing.full_name}")
                print(f"  Active: {bool(existing.is_active)}")
                created_users.append(existing)
                continue
            
            # Hash password
            password_hash = bcrypt.hashpw(
                user_data["password"].encode(), 
                bcrypt.gensalt()
            ).decode()
            
            # Create user
            user = UserDB(
                id=str(uuid.uuid4()),
                full_name=user_data["full_name"],
                email=user_data["email"],
                password_hash=password_hash,
                role=user_data["role"],
                department=user_data["department"],
                phone=user_data["phone"],
                is_active=1,
                failed_login_attempts=0,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            db.add(user)
            db.commit()
            db.refresh(user)
            
            print(f"\n✓ Created user: {user_data['email']}")
            print(f"  ID: {user.id}")
            print(f"  Name: {user.full_name}")
            print(f"  Role: {user.role.value}")
            print(f"  Password: {user_data['password']}")
            
            created_users.append(user)
        
        print("\n" + "=" * 80)
        print("USER CREATION COMPLETE")
        print("=" * 80)
        
        print("\n📋 TEST CREDENTIALS:")
        print("-" * 80)
        
        for user_data in test_users:
            print(f"\n{user_data['role'].value.upper()}:")
            print(f"  Email:    {user_data['email']}")
            print(f"  Password: {user_data['password']}")
        
        print("\n" + "=" * 80)
        print("TESTING CHECKLIST")
        print("=" * 80)
        
        print("\n1. ADMIN LOGIN:")
        print("   - Email: admin@crimegpt.gov.in")
        print("   - Should see:")
        print("     ✓ System statistics")
        print("     ✓ All cases")
        print("     ✓ Team Management menu")
        print("     ✓ User management actions")
        print("     ✓ Case assignment actions")
        
        print("\n2. INVESTIGATOR LOGIN:")
        print("   - Email: investigator@crimegpt.gov.in")
        print("   - Should see:")
        print("     ✓ My Cases dashboard")
        print("     ✓ Own cases only")
        print("     ✓ Create case button")
        print("     ✓ Upload evidence button")
        print("     ✓ CrimeGPT access")
        print("     ✗ No Team Management")
        print("     ✗ No user management")
        
        print("\n3. VIEWER LOGIN:")
        print("   - Email: viewer@crimegpt.gov.in")
        print("   - Should see:")
        print("     ✓ Read-only dashboard")
        print("     ✓ All cases (read-only)")
        print("     ✓ Reports (read-only)")
        print("     ✗ No create buttons")
        print("     ✗ No edit buttons")
        print("     ✗ No delete buttons")
        print("     ✗ No Team Management")
        print("     ✗ No CrimeGPT")
        
        print("\n" + "=" * 80)
        print("✓ Test users ready for Phase 2 verification")
        print("=" * 80)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_users()
