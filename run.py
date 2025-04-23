"""
Main entry point for the CV Smart Hire application.
This script starts the Flask backend on port 5001 to avoid conflicts with the Node.js server.
"""

from backend.app import app

if __name__ == '__main__':
    # Start the Flask application on a different port to avoid conflict with Node.js
    app.run(host='0.0.0.0', port=5001, debug=True)