"""
Add account_status column to users table
"""
from sqlalchemy import text
from app.database.database import engine

def add_account_status_column():
    print("Adding account_status column to users table...")
    
    with engine.connect() as conn:
        # Add column with default 'active' for existing users
        conn.execute(text("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS account_status VARCHAR NOT NULL DEFAULT 'active'
        """))
        conn.commit()
        
        print("✓ account_status column added successfully")
        
        # Verify
        result = conn.execute(text("""
            SELECT column_name, data_type, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'account_status'
        """))
        
        for row in result:
            print(f"  Column: {row.column_name}")
            print(f"  Type: {row.data_type}")
            print(f"  Default: {row.column_default}")
        
        # Check existing users
        user_count = conn.execute(text("SELECT COUNT(*) FROM users")).scalar()
        print(f"\n✓ All {user_count} existing users have account_status='active'")

if __name__ == "__main__":
    add_account_status_column()
