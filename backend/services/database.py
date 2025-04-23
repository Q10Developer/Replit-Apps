import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Database:
    def __init__(self):
        # Handle the case where we have a DATABASE_URL (like on Replit)
        db_url = os.getenv('DATABASE_URL')
        if db_url:
            # For PostgreSQL in Replit
            self.use_postgres = True
            self.db_url = db_url
        else:
            # MySQL configuration if no PostgreSQL URL is available
            self.config = {
                'host': os.getenv('DB_HOST', 'localhost'),
                'user': os.getenv('DB_USER', 'root'),
                'password': os.getenv('DB_PASSWORD', ''),
                'database': os.getenv('DB_NAME', 'cv_smart_hire')
            }
            self.use_postgres = False
        
        # Create connection
        self.create_connection()
    
    def create_connection(self):
        """Create a database connection."""
        try:
            if self.use_postgres:
                import psycopg2
                import psycopg2.extras
                self.conn = psycopg2.connect(self.db_url)
                self.cursor = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
                return True
            else:
                # MySQL connection - only used if PostgreSQL is not available
                try:
                    import mysql.connector
                    self.conn = mysql.connector.connect(**self.config)
                    self.cursor = self.conn.cursor(dictionary=True)
                    return True
                except ImportError:
                    print("MySQL connector not available, falling back to SQLite")
                    raise Exception("MySQL connector not available")
        except Exception as e:
            print(f"Error connecting to database: {e}")
            # If all else fails, create an in-memory SQLite database as fallback
            import sqlite3
            self.conn = sqlite3.connect(':memory:')
            self.conn.row_factory = sqlite3.Row
            self.cursor = self.conn.cursor()
            self.use_postgres = False
            self.use_sqlite = True
            print("Using SQLite in-memory database as fallback")
            return False
    
    def create_tables(self):
        """Create the necessary tables if they don't exist."""
        try:
            # Create candidates table
            if self.use_postgres:
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS candidates (
                        id SERIAL PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        position VARCHAR(255) NOT NULL,
                        skills JSONB,
                        experience JSONB,
                        score INTEGER,
                        status VARCHAR(50) DEFAULT 'pending',
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create positions table
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS positions (
                        id SERIAL PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        department VARCHAR(255),
                        required_skills JSONB,
                        status VARCHAR(50) DEFAULT 'active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create uploads table
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS uploads (
                        id SERIAL PRIMARY KEY,
                        filename VARCHAR(255) NOT NULL,
                        position VARCHAR(255) NOT NULL,
                        processed_at TIMESTAMP,
                        total_records INTEGER,
                        successful_records INTEGER,
                        failed_records INTEGER
                    )
                """)
                
                # Create notifications table
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id SERIAL PRIMARY KEY,
                        message TEXT NOT NULL,
                        type VARCHAR(50) DEFAULT 'info',
                        read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            elif hasattr(self, 'use_sqlite') and self.use_sqlite:
                # SQLite version
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS candidates (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        email TEXT NOT NULL,
                        position TEXT NOT NULL,
                        skills TEXT,
                        experience TEXT,
                        score INTEGER,
                        status TEXT DEFAULT 'pending',
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS positions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT NOT NULL,
                        department TEXT,
                        required_skills TEXT,
                        status TEXT DEFAULT 'active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS uploads (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        filename TEXT NOT NULL,
                        position TEXT NOT NULL,
                        processed_at TIMESTAMP,
                        total_records INTEGER,
                        successful_records INTEGER,
                        failed_records INTEGER
                    )
                """)
                
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        message TEXT NOT NULL,
                        type TEXT DEFAULT 'info',
                        read BOOLEAN DEFAULT 0,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            else:
                # MySQL version
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS candidates (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        position VARCHAR(255) NOT NULL,
                        skills JSON,
                        experience JSON,
                        score INT,
                        status VARCHAR(50) DEFAULT 'pending',
                        notes TEXT,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS positions (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(255) NOT NULL,
                        department VARCHAR(255),
                        required_skills JSON,
                        status VARCHAR(50) DEFAULT 'active',
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS uploads (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        filename VARCHAR(255) NOT NULL,
                        position VARCHAR(255) NOT NULL,
                        processed_at TIMESTAMP,
                        total_records INT,
                        successful_records INT,
                        failed_records INT
                    )
                """)
                
                self.cursor.execute("""
                    CREATE TABLE IF NOT EXISTS notifications (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        message TEXT NOT NULL,
                        type VARCHAR(50) DEFAULT 'info',
                        `read` BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
            
            self.conn.commit()
            return True
        except Exception as e:
            print(f"Error creating tables: {e}")
            return False
    
    # Helper function to handle JSON fields
    def _handle_json_fields(self, data, is_insert=True):
        """Convert dictionary fields to JSON strings for database storage."""
        result = data.copy()
        
        # Fields that need JSON conversion
        json_fields = ['skills', 'experience', 'required_skills']
        
        for field in json_fields:
            if field in result and result[field] is not None:
                if isinstance(result[field], (dict, list)):
                    result[field] = json.dumps(result[field])
        
        return result
    
    # Helper function to convert database rows back to Python objects
    def _convert_from_db_row(self, row):
        """Convert row from database to Python object with parsed JSON fields."""
        if not row:
            return None
        
        result = dict(row)
        
        # Fields that need JSON parsing
        json_fields = ['skills', 'experience', 'required_skills']
        
        for field in json_fields:
            if field in result and result[field]:
                try:
                    if isinstance(result[field], str):
                        result[field] = json.loads(result[field])
                except:
                    result[field] = {}
        
        return result
    
    # Candidate operations
    def get_all_candidates(self):
        """Get all candidates from the database."""
        try:
            self.cursor.execute("SELECT * FROM candidates ORDER BY score DESC")
            rows = self.cursor.fetchall()
            return [self._convert_from_db_row(row) for row in rows]
        except Exception as e:
            print(f"Error getting candidates: {e}")
            return []
    
    def get_candidate_by_id(self, id):
        """Get a candidate by ID."""
        try:
            self.cursor.execute("SELECT * FROM candidates WHERE id = %s", (id,))
            row = self.cursor.fetchone()
            return self._convert_from_db_row(row)
        except Exception as e:
            print(f"Error getting candidate: {e}")
            return None
    
    def get_candidates_by_position(self, position):
        """Get candidates by position."""
        try:
            self.cursor.execute("SELECT * FROM candidates WHERE position = %s ORDER BY score DESC", (position,))
            rows = self.cursor.fetchall()
            return [self._convert_from_db_row(row) for row in rows]
        except Exception as e:
            print(f"Error getting candidates by position: {e}")
            return []
    
    def get_candidates_by_status(self, status):
        """Get candidates by status."""
        try:
            self.cursor.execute("SELECT * FROM candidates WHERE status = %s ORDER BY score DESC", (status,))
            rows = self.cursor.fetchall()
            return [self._convert_from_db_row(row) for row in rows]
        except Exception as e:
            print(f"Error getting candidates by status: {e}")
            return []
    
    def create_candidate(self, candidate):
        """Create a new candidate."""
        try:
            # Format data for database
            data = self._handle_json_fields(candidate)
            
            # Build SQL statement
            fields = ", ".join(data.keys())
            placeholders = ", ".join(["%s"] * len(data))
            
            query = f"INSERT INTO candidates ({fields}) VALUES ({placeholders})"
            
            # Execute the query
            self.cursor.execute(query, tuple(data.values()))
            self.conn.commit()
            
            # Get the inserted ID
            candidate_id = self.cursor.lastrowid
            
            # Return the created candidate
            return self.get_candidate_by_id(candidate_id)
        except Exception as e:
            print(f"Error creating candidate: {e}")
            return None
    
    def update_candidate_status(self, id, status):
        """Update a candidate's status."""
        try:
            self.cursor.execute("UPDATE candidates SET status = %s WHERE id = %s", (status, id))
            self.conn.commit()
            return self.get_candidate_by_id(id)
        except Exception as e:
            print(f"Error updating candidate status: {e}")
            return None
    
    def update_candidate_notes(self, id, notes):
        """Update a candidate's notes."""
        try:
            self.cursor.execute("UPDATE candidates SET notes = %s WHERE id = %s", (notes, id))
            self.conn.commit()
            return self.get_candidate_by_id(id)
        except Exception as e:
            print(f"Error updating candidate notes: {e}")
            return None
    
    # Position operations
    def get_all_positions(self):
        """Get all positions."""
        try:
            self.cursor.execute("SELECT * FROM positions")
            rows = self.cursor.fetchall()
            return [self._convert_from_db_row(row) for row in rows]
        except Exception as e:
            print(f"Error getting positions: {e}")
            return []
    
    def get_active_positions(self):
        """Get active positions."""
        try:
            self.cursor.execute("SELECT * FROM positions WHERE status = 'active'")
            rows = self.cursor.fetchall()
            return [self._convert_from_db_row(row) for row in rows]
        except Exception as e:
            print(f"Error getting active positions: {e}")
            return []
    
    def get_position_by_id(self, id):
        """Get a position by ID."""
        try:
            self.cursor.execute("SELECT * FROM positions WHERE id = %s", (id,))
            row = self.cursor.fetchone()
            return self._convert_from_db_row(row)
        except Exception as e:
            print(f"Error getting position: {e}")
            return None
    
    def get_position_by_title(self, title):
        """Get a position by title."""
        try:
            self.cursor.execute("SELECT * FROM positions WHERE title = %s", (title,))
            row = self.cursor.fetchone()
            return self._convert_from_db_row(row)
        except Exception as e:
            print(f"Error getting position by title: {e}")
            return None
    
    def create_position(self, position):
        """Create a new position."""
        try:
            # Format data for database
            data = self._handle_json_fields(position)
            
            # Build SQL statement
            fields = ", ".join(data.keys())
            placeholders = ", ".join(["%s"] * len(data))
            
            query = f"INSERT INTO positions ({fields}) VALUES ({placeholders})"
            
            # Execute the query
            self.cursor.execute(query, tuple(data.values()))
            self.conn.commit()
            
            # Get the inserted ID
            position_id = self.cursor.lastrowid
            
            # Return the created position
            return self.get_position_by_id(position_id)
        except Exception as e:
            print(f"Error creating position: {e}")
            return None
    
    # Upload operations
    def get_all_uploads(self):
        """Get all uploads."""
        try:
            self.cursor.execute("SELECT * FROM uploads ORDER BY processed_at DESC")
            rows = self.cursor.fetchall()
            return [self._convert_from_db_row(row) for row in rows]
        except Exception as e:
            print(f"Error getting uploads: {e}")
            return []
    
    def create_upload(self, upload):
        """Create a new upload record."""
        try:
            # Format data for database
            data = self._handle_json_fields(upload)
            
            # Build SQL statement
            fields = ", ".join(data.keys())
            placeholders = ", ".join(["%s"] * len(data))
            
            query = f"INSERT INTO uploads ({fields}) VALUES ({placeholders})"
            
            # Execute the query
            self.cursor.execute(query, tuple(data.values()))
            self.conn.commit()
            
            return True
        except Exception as e:
            print(f"Error creating upload: {e}")
            return False
    
    # Notification operations
    def get_all_notifications(self):
        """Get all notifications."""
        try:
            self.cursor.execute("SELECT * FROM notifications ORDER BY created_at DESC")
            rows = self.cursor.fetchall()
            return [self._convert_from_db_row(row) for row in rows]
        except Exception as e:
            print(f"Error getting notifications: {e}")
            return []
    
    def create_notification(self, notification):
        """Create a new notification."""
        try:
            # Format data for database
            data = self._handle_json_fields(notification)
            
            # Build SQL statement
            fields = ", ".join(data.keys())
            placeholders = ", ".join(["%s"] * len(data))
            
            query = f"INSERT INTO notifications ({fields}) VALUES ({placeholders})"
            
            # Execute the query
            self.cursor.execute(query, tuple(data.values()))
            self.conn.commit()
            
            return True
        except Exception as e:
            print(f"Error creating notification: {e}")
            return False