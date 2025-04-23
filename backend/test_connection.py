"""
Simple script to test MySQL database connection.
"""

import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_mysql_connection():
    """Test the MySQL database connection."""
    try:
        # Get connection parameters from environment variables
        config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'database': os.getenv('DB_NAME', 'cv_smart_hire')
        }
        
        # Try to connect
        print(f"Attempting to connect to MySQL: {config['host']} as {config['user']}")
        conn = mysql.connector.connect(**config)
        
        if conn.is_connected():
            print("MySQL connection successful!")
            db_info = conn.get_server_info()
            print(f"MySQL server version: {db_info}")
            
            # Get cursor
            cursor = conn.cursor()
            
            # Execute a simple query
            cursor.execute("SELECT DATABASE();")
            database_name = cursor.fetchone()
            print(f"Connected to database: {database_name[0]}")
            
            # Close connection
            cursor.close()
            conn.close()
            print("MySQL connection closed.")
            return True
        else:
            print("Failed to connect to MySQL server.")
            return False
    
    except Exception as e:
        print(f"Error connecting to MySQL: {e}")
        return False

def test_postgresql_connection():
    """Test PostgreSQL connection using DATABASE_URL."""
    try:
        db_url = os.getenv('DATABASE_URL')
        if not db_url:
            print("No DATABASE_URL environment variable found for PostgreSQL")
            return False
        
        import psycopg2
        print(f"Attempting to connect to PostgreSQL using DATABASE_URL")
        conn = psycopg2.connect(db_url)
        
        if conn:
            print("PostgreSQL connection successful!")
            # Get cursor
            cursor = conn.cursor()
            
            # Execute a simple query
            cursor.execute("SELECT current_database();")
            database_name = cursor.fetchone()
            print(f"Connected to database: {database_name[0]}")
            
            # Get version
            cursor.execute("SELECT version();")
            version = cursor.fetchone()
            print(f"PostgreSQL version: {version[0]}")
            
            # Close connection
            cursor.close()
            conn.close()
            print("PostgreSQL connection closed.")
            return True
        else:
            print("Failed to connect to PostgreSQL server.")
            return False
    
    except Exception as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return False

if __name__ == "__main__":
    print("----- Testing MySQL Connection -----")
    mysql_result = test_mysql_connection()
    
    print("\n----- Testing PostgreSQL Connection -----")
    pg_result = test_postgresql_connection()
    
    print("\n----- Connection Test Results -----")
    print(f"MySQL Connection: {'SUCCESS' if mysql_result else 'FAILED'}")
    print(f"PostgreSQL Connection: {'SUCCESS' if pg_result else 'FAILED'}")
    
    if not mysql_result and not pg_result:
        print("\nUnable to connect to any database. The application will use SQLite in-memory database.")
        print("To fix this:")
        print("1. Check your .env file for correct database credentials")
        print("2. Make sure your MySQL server is running")
        print("3. Make sure DATABASE_URL is properly set for PostgreSQL")