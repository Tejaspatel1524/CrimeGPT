"""
Fix database to add 'viewer' role to UserRole enum
"""
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env file")
    exit(1)

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    print("Adding 'viewer' role to UserRole enum...")
    
    # Check if viewer already exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1 FROM pg_enum 
            WHERE enumlabel = 'viewer' 
            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'userrole')
        );
    """)
    
    exists = cursor.fetchone()[0]
    
    if exists:
        print("✓ 'viewer' role already exists in database")
    else:
        cursor.execute("ALTER TYPE userrole ADD VALUE 'viewer'")
        conn.commit()
        print("✓ 'viewer' role added successfully")
    
    cursor.close()
    conn.close()
    
    print("\nDatabase updated. You can now create viewer users.")
    
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
