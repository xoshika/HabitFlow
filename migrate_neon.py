import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL or not (DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgres://")):
    print("Error: DATABASE_URL is missing or not a PostgreSQL URL.")
    exit(1)

# Fix for postgres:// URLs
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print("Connecting to Neon database...")
try:
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    conn.autocommit = True
    cur = conn.cursor()

    # 1. Check current columns
    cur.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users'
    """)
    columns = [row['column_name'] for row in cur.fetchall()]
    print(f"Current columns in 'users': {columns}")

    # 2. Migration: Name Splitting
    if 'name' in columns and 'first_name' not in columns:
        print("Migrating names (splitting 'name' into first_name, middle_name, last_name)...")
        cur.execute("ALTER TABLE users ADD COLUMN first_name TEXT")
        cur.execute("ALTER TABLE users ADD COLUMN middle_name TEXT")
        cur.execute("ALTER TABLE users ADD COLUMN last_name TEXT")
        
        cur.execute("SELECT id, name FROM users")
        users = cur.fetchall()
        for user in users:
            old_name = user['name'] or ""
            parts = old_name.split(' ')
            f_name = parts[0] if len(parts) > 0 else "Unknown"
            l_name = parts[-1] if len(parts) > 1 else "User"
            m_name = " ".join(parts[1:-1]) if len(parts) > 2 else ""
            
            cur.execute(
                "UPDATE users SET first_name = %s, middle_name = %s, last_name = %s WHERE id = %s",
                (f_name, m_name, l_name, user['id'])
            )
        
        cur.execute("ALTER TABLE users ALTER COLUMN first_name SET NOT NULL")
        cur.execute("ALTER TABLE users ALTER COLUMN last_name SET NOT NULL")
        cur.execute("ALTER TABLE users DROP COLUMN name")
        print("Name migration successful!")

    # 3. Migration: Verification Columns
    if 'is_verified' not in columns:
        print("Adding 'is_verified' and 'verification_token' columns...")
        cur.execute("ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0")
        cur.execute("ALTER TABLE users ADD COLUMN verification_token TEXT")
        # Mark existing users as verified so they don't get locked out
        cur.execute("UPDATE users SET is_verified = 1")
        print("Verification columns added successfully!")

    print("\nNeon database is now up to date!")

except Exception as e:
    print(f"Migration failed: {e}")
finally:
    if 'conn' in locals():
        conn.close()
