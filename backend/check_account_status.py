"""
Check if account_status column exists in users table
"""
import sys
from sqlalchemy import inspect, text
from app.database.database import engine

def check_account_status_column():
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns('users')]
    
    print("Current columns in users table:")
    for col in columns:
        print(f"  - {col}")
    
    if 'account_status' in columns:
        print("\n✓ account_status column EXISTS")
        
        # Check some sample data
        with engine.connect() as conn:
            result = conn.execute(text("SELECT id, email, account_status FROM users LIMIT 5"))
            print("\nSample data:")
            for row in result:
                print(f"  {row.email}: {row.account_status}")
        return True
    else:
        print("\n✗ account_status column DOES NOT EXIST")
        return False

if __name__ == "__main__":
    exists = check_account_status_column()
    sys.exit(0 if exists else 1)
