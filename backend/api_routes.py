"""
API routes for the CV Smart Hire application.
These routes are exposed through the Flask app and provide the main API for
the client application.
"""

from flask import Blueprint, request, jsonify
import pandas as pd
from datetime import datetime
from io import StringIO
import traceback

# Import our services
from backend.services.database import Database
from backend.services.cv_processing import process_cv_data

# Create API Blueprint
api = Blueprint('api', __name__)

# Initialize database
db = Database()

# API Routes
@api.route('/candidates', methods=['GET'])
def get_candidates():
    """Get all candidates"""
    candidates = db.get_all_candidates()
    return jsonify(candidates)

@api.route('/candidates/<int:id>', methods=['GET'])
def get_candidate(id):
    """Get a specific candidate by ID"""
    candidate = db.get_candidate_by_id(id)
    if not candidate:
        return jsonify({"error": "Candidate not found"}), 404
    return jsonify(candidate)

@api.route('/candidates/<int:id>/status', methods=['POST'])
def update_candidate_status(id):
    """Update a candidate's status"""
    data = request.json
    status = data.get('status')
    
    if not status:
        return jsonify({"error": "Status is required"}), 400
    
    # Validate status
    if status not in ['pending', 'shortlisted', 'review', 'rejected']:
        return jsonify({"error": "Invalid status value"}), 400
    
    result = db.update_candidate_status(id, status)
    if not result:
        return jsonify({"error": "Candidate not found"}), 404
    
    return jsonify(result)

@api.route('/candidates/<int:id>/notes', methods=['POST'])
def update_candidate_notes(id):
    """Update a candidate's notes"""
    data = request.json
    notes = data.get('notes', '')
    
    result = db.update_candidate_notes(id, notes)
    if not result:
        return jsonify({"error": "Candidate not found"}), 404
    
    return jsonify(result)

@api.route('/positions', methods=['GET'])
def get_positions():
    """Get all positions"""
    positions = db.get_all_positions()
    return jsonify(positions)

@api.route('/active-positions', methods=['GET'])
def get_active_positions():
    """Get all active positions"""
    positions = db.get_active_positions()
    return jsonify(positions)

@api.route('/upload', methods=['POST'])
def upload_csv():
    """Upload and process a CSV file of candidates"""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    position = request.form.get('position')
    
    if not position:
        return jsonify({"error": "Position is required"}), 400
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if not file.filename.endswith('.csv'):
        return jsonify({"error": "Only CSV files are allowed"}), 400
    
    try:
        # Read CSV content
        csv_content = file.read().decode('utf-8')
        
        # Create a DataFrame for processing
        df = pd.read_csv(StringIO(csv_content))
        
        # Check required headers
        required_headers = ['name', 'email', 'skills']
        missing_headers = [h for h in required_headers if h not in df.columns]
        if missing_headers:
            return jsonify({
                "error": f"CSV is missing required headers: {', '.join(missing_headers)}"
            }), 400
        
        # Get the position data for scoring
        position_data = db.get_position_by_title(position)
        if not position_data:
            return jsonify({"error": f"Position '{position}' not found"}), 400
        
        # Process the CSV data
        processed_candidates = process_cv_data(df, position_data)
        
        # Track processing results
        successful_records = 0
        failed_records = 0
        
        # Save candidates to database
        for candidate in processed_candidates:
            try:
                db.create_candidate(candidate)
                successful_records += 1
            except Exception as e:
                print(f"Error saving candidate: {e}")
                failed_records += 1
        
        # Record the upload
        upload_data = {
            "filename": file.filename,
            "position": position,
            "processed_at": datetime.now().isoformat(),
            "total_records": len(processed_candidates),
            "successful_records": successful_records,
            "failed_records": failed_records
        }
        
        db.create_upload(upload_data)
        
        # Create a notification
        if successful_records > 0:
            db.create_notification({
                "message": f"Processed {successful_records} candidates from {file.filename}",
                "type": "info",
                "read": False,
                "created_at": datetime.now().isoformat()
            })
        
        return jsonify({
            "success": True,
            "message": f"Processed {successful_records} candidates successfully. {failed_records} failed.",
            "totalRecords": len(processed_candidates),
            "successfulRecords": successful_records,
            "failedRecords": failed_records
        })
        
    except Exception as e:
        print(f"Error processing CSV: {e}")
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@api.route('/exports', methods=['GET'])
def export_data():
    """Export candidates data as CSV"""
    # Get filter parameters
    position = request.args.get('position')
    status = request.args.get('status')
    
    # Fetch candidates based on filters
    candidates = db.get_all_candidates()
    
    if position:
        candidates = [c for c in candidates if c['position'] == position]
    
    if status:
        candidates = [c for c in candidates if c['status'] == status]
    
    if not candidates:
        return jsonify({"error": "No candidates match the specified criteria"}), 404
    
    # Convert to DataFrame for CSV export
    export_data = []
    for candidate in candidates:
        # Format skills as a string
        skills_str = ", ".join(candidate.get('skills', {}).keys())
        
        # Format experience as a string
        experience_str = ""
        if candidate.get('experience'):
            exp_items = []
            for exp in candidate['experience']:
                exp_items.append(f"{exp.get('company')}|{exp.get('role')}|{exp.get('years')}")
            experience_str = "; ".join(exp_items)
        
        export_data.append({
            "Name": candidate.get('name'),
            "Email": candidate.get('email'),
            "Position": candidate.get('position'),
            "Skills": skills_str,
            "Experience": experience_str,
            "Score": candidate.get('score'),
            "Status": candidate.get('status'),
            "Notes": candidate.get('notes', '')
        })
    
    # Create a CSV file
    df = pd.DataFrame(export_data)
    csv_data = df.to_csv(index=False)
    
    # Return as a downloadable file
    response = jsonify({"csv": csv_data})
    response.headers["Content-Disposition"] = f"attachment; filename=candidates_export_{datetime.now().strftime('%Y%m%d')}.csv"
    response.headers["Content-Type"] = "text/csv"
    
    return response

@api.route('/stats', methods=['GET'])
def get_stats():
    """Get application statistics"""
    # Get data for statistics
    candidates = db.get_all_candidates()
    uploads = db.get_all_uploads()
    positions = db.get_active_positions()
    
    # Calculate statistics
    shortlisted = [c for c in candidates if c.get('status') == 'shortlisted']
    
    # Calculate time saved (rough estimate: 15 minutes per CV)
    time_saved = len(candidates) * 15
    hours_saved = time_saved // 60
    
    # Build statistics response
    stats = {
        "totalCVs": len(candidates),
        "shortlistedCandidates": len(shortlisted),
        "activePositions": len(positions),
        "timeSaved": f"{hours_saved} hrs",
        "lastUpload": uploads[-1].get('processed_at') if uploads else None
    }
    
    return jsonify(stats)

@api.route('/notifications', methods=['GET'])
def get_notifications():
    """Get all notifications"""
    notifications = db.get_all_notifications()
    return jsonify(notifications)