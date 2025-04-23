"""
Script to initialize the database tables for the CV Smart Hire application.
"""

import sys
import os

# Add the parent directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from backend.services.database import Database

def main():
    print("Initializing CV Smart Hire database...")
    
    # Create database instance
    db = Database()
    
    # Create tables
    print("Creating database tables...")
    result = db.create_tables()
    
    if result:
        print("Tables created successfully!")
        
        # Check if default positions exist
        positions = db.get_all_positions()
        if not positions:
            print("Adding default positions...")
            default_positions = [
                {
                    "title": "Frontend Developer",
                    "department": "Engineering",
                    "required_skills": ["JavaScript", "React", "HTML", "CSS"],
                    "status": "active"
                },
                {
                    "title": "Backend Developer",
                    "department": "Engineering",
                    "required_skills": ["Python", "Flask", "SQL", "API"],
                    "status": "active"
                },
                {
                    "title": "Data Scientist",
                    "department": "Data",
                    "required_skills": ["Python", "SQL", "Machine Learning", "Statistics"],
                    "status": "active"
                }
            ]
            
            for position in default_positions:
                result = db.create_position(position)
                if result:
                    print(f"  - Added position: {position['title']}")
                else:
                    print(f"  - Failed to add position: {position['title']}")
            
            print("Default positions added.")
        else:
            print(f"Found {len(positions)} existing positions, skipping defaults.")
        
        # Print summary
        print("\nDatabase initialization complete!")
        print(f"Total positions: {len(db.get_all_positions())}")
        print(f"Total candidates: {len(db.get_all_candidates())}")
        print(f"Total uploads: {len(db.get_all_uploads())}")
    else:
        print("Failed to create tables!")

if __name__ == "__main__":
    main()