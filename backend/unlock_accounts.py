"""
Account Unlock Utility
Resets failed login attempts for locked accounts
"""
from app.database.database import get_db
from app.database.models import UserDB

def unlock_all_accounts():
    """Reset failed login attempts for all users"""
    db = next(get_db())
    
    locked_users = db.query(UserDB).filter(UserDB.failed_login_attempts > 0).all()
    
    if not locked_users:
        print("✅ No locked accounts found.")
        return
    
    print(f"Found {len(locked_users)} locked account(s):")
    for user in locked_users:
        print(f"  - {user.email}: {user.failed_login_attempts} failed attempts")
        user.failed_login_attempts = 0
    
    db.commit()
    print(f"\n✅ Unlocked {len(locked_users)} account(s) successfully.")


def unlock_specific_account(email: str):
    """Reset failed login attempts for a specific user"""
    db = next(get_db())
    
    user = db.query(UserDB).filter(UserDB.email == email.lower()).first()
    
    if not user:
        print(f"❌ User not found: {email}")
        return
    
    if user.failed_login_attempts == 0:
        print(f"✅ Account {email} is not locked.")
        return
    
    print(f"Unlocking {email} (had {user.failed_login_attempts} failed attempts)...")
    user.failed_login_attempts = 0
    db.commit()
    print(f"✅ Account {email} unlocked successfully.")


def list_locked_accounts():
    """List all locked accounts"""
    db = next(get_db())
    
    locked_users = db.query(UserDB).filter(UserDB.failed_login_attempts > 0).all()
    
    if not locked_users:
        print("✅ No locked accounts.")
        return
    
    print(f"Locked accounts ({len(locked_users)}):")
    for user in locked_users:
        print(f"  - {user.email}: {user.failed_login_attempts} failed attempts (last update: {user.updated_at})")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) == 1:
        # No arguments: unlock all
        unlock_all_accounts()
    elif sys.argv[1] == "list":
        # List locked accounts
        list_locked_accounts()
    elif sys.argv[1] == "unlock":
        if len(sys.argv) < 3:
            print("Usage: python unlock_accounts.py unlock <email>")
        else:
            # Unlock specific account
            unlock_specific_account(sys.argv[2])
    else:
        print("Usage:")
        print("  python unlock_accounts.py          # Unlock all accounts")
        print("  python unlock_accounts.py list     # List locked accounts")
        print("  python unlock_accounts.py unlock <email>  # Unlock specific account")
