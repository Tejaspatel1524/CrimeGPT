"""
Test User Management API endpoints
"""
from app.database.models import UserDB
from app.database.database import get_db

def test_database_schema():
    print("Testing database schema...")
    db = next(get_db())
    
    # Get first user
    user = db.query(UserDB).first()
    
    if not user:
        print("✗ No users in database")
        return False
    
    print(f"✓ Found user: {user.email}")
    
    # Check for account_status field
    if hasattr(user, 'account_status'):
        print(f"✓ account_status field exists: {user.account_status}")
    else:
        print("✗ account_status field missing")
        return False
    
    # Check for failed_login_attempts field
    if hasattr(user, 'failed_login_attempts'):
        print(f"✓ failed_login_attempts field exists: {user.failed_login_attempts}")
    else:
        print("✗ failed_login_attempts field missing")
        return False
    
    # Check all users
    all_users = db.query(UserDB).all()
    print(f"\n✓ Total users in database: {len(all_users)}")
    print("\nUsers:")
    for u in all_users:
        print(f"  - {u.email} | Role: {u.role.value} | Status: {u.account_status} | Active: {bool(u.is_active)}")
    
    return True

if __name__ == "__main__":
    success = test_database_schema()
    exit(0 if success else 1)
