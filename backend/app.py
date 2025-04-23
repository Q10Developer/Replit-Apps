from flask import Flask
from flask_cors import CORS
import os
from datetime import datetime
from backend.services.database import Database
from backend.api_routes import api  # Import our API blueprint
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize database
db = Database()

# Initialize the database tables
def init_db():
    """Initialize the database with tables and default data"""
    db.create_tables()
    # Create default positions if they don't exist
    positions = db.get_all_positions()
    if not positions:
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
            db.create_position(position)

# Create Flask application
app = Flask(__name__)
CORS(app)

# Register API blueprint with '/api' prefix
app.register_blueprint(api, url_prefix='/api')

# Initialize database when app starts
with app.app_context():
    init_db()
    
    # Check if we need to create a sample notification
    if not db.get_all_notifications():
        db.create_notification({
            "message": "Welcome to CV Smart Hire! Upload your CVs to get started.",
            "type": "info",
            "read": False,
            "created_at": datetime.now().isoformat()
        })

if __name__ == '__main__':
    # Use the environment variable PORT or default to 5001
    # Different from Node.js server to avoid port conflicts
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)