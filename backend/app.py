from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pandas as pd
from csv import reader
from datetime import datetime
import json
from backend.services.database import Database
from backend.services.ranking import calculate_match_score, rank_candidates
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize database
db = Database()

# Initialize the database tables
def init_db():
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

# Initialize database when app starts
with app.app_context():
    init_db()

# Routes
@app.route('/api/candidates', methods=['GET'])
def get_candidates():
    candidates = db.get_all_candidates()
    return jsonify(candidates)

@app.route('/api/candidates/<int:id>', methods=['GET'])
def get_candidate(id):
    candidate = db.get_candidate_by_id(id)
    if candidate:
        return jsonify(candidate)
    return jsonify({"error": "Candidate not found"}), 404

@app.route('/api/candidates/<int:id>/status', methods=['POST'])
def update_candidate_status(id):
    data = request.json
    status = data.get('status')
    if not status:
        return jsonify({"error": "Status is required"}), 400
    
    result = db.update_candidate_status(id, status)
    if result:
        return jsonify(result)
    return jsonify({"error": "Failed to update status"}), 400

@app.route('/api/candidates/<int:id>/notes', methods=['POST'])
def update_candidate_notes(id):
    data = request.json
    notes = data.get('notes', '')
    
    result = db.update_candidate_notes(id, notes)
    if result:
        return jsonify(result)
    return jsonify({"error": "Failed to update notes"}), 400

@app.route('/api/positions', methods=['GET'])
def get_positions():
    positions = db.get_all_positions()
    return jsonify(positions)

@app.route('/api/active-positions', methods=['GET'])
def get_active_positions():
    positions = db.get_active_positions()
    return jsonify(positions)

@app.route('/api/uploads', methods=['GET'])
def get_uploads():
    uploads = db.get_all_uploads()
    return jsonify(uploads)

@app.route('/api/stats', methods=['GET'])
def get_stats():
    # Get basic statistics
    candidates = db.get_all_candidates()
    uploads = db.get_all_uploads()
    positions = db.get_active_positions()
    
    shortlisted = [c for c in candidates if c['status'] == 'shortlisted']
    
    # Calculate time saved (rough estimate: 15 minutes per CV)
    time_saved = len(candidates) * 15
    hours_saved = time_saved // 60
    
    stats = {
        "totalCVs": len(candidates),
        "shortlistedCandidates": len(shortlisted),
        "activePositions": len(positions),
        "timeSaved": f"{hours_saved} hrs",
        "lastUpload": uploads[-1]['processed_at'] if uploads else None
    }
    
    return jsonify(stats)

@app.route('/api/upload', methods=['POST'])
def upload_csv():
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
        # Read and parse CSV
        csv_content = file.read().decode('utf-8')
        csv_reader = reader(csv_content.splitlines())
        headers = next(csv_reader)
        
        # Check required headers
        required_headers = ['name', 'email', 'position', 'skills']
        if not all(header in headers for header in required_headers):
            return jsonify({"error": "CSV is missing required headers"}), 400
        
        # Create a DataFrame for easier processing
        df = pd.read_csv(pd.StringIO(csv_content))
        
        # Process each row
        successful_records = 0
        failed_records = 0
        
        # Get the position details for ranking
        position_data = db.get_position_by_title(position)
        if not position_data:
            return jsonify({"error": "Position not found"}), 400
        
        for _, row in df.iterrows():
            try:
                # Parse skills
                skills_list = row['skills'].split(',')
                skills_dict = {}
                
                # Generate skill scores (in a real system, this would be more sophisticated)
                for skill in skills_list:
                    skill = skill.strip()
                    if skill:
                        # Generate a score between 70-100 for demonstration
                        skills_dict[skill] = 70 + (hash(skill) % 30)
                
                # Parse experience if available
                experience = []
                if 'experience' in row and pd.notna(row['experience']):
                    exp_items = row['experience'].split(';')
                    for item in exp_items:
                        if '|' in item:
                            parts = item.split('|')
                            if len(parts) >= 3:
                                experience.append({
                                    "company": parts[0].strip(),
                                    "role": parts[1].strip(),
                                    "years": parts[2].strip()
                                })
                
                # Create candidate data
                candidate_data = {
                    "name": row['name'],
                    "email": row['email'],
                    "position": position,
                    "skills": skills_dict,
                    "experience": experience,
                    "status": "pending",
                    "notes": ""
                }
                
                # Calculate score
                candidate_data["score"] = calculate_match_score(
                    candidate_data, 
                    {"title": position_data["title"], "requiredSkills": position_data["required_skills"]}
                )
                
                # Save to database
                db.create_candidate(candidate_data)
                successful_records += 1
                
            except Exception as e:
                print(f"Error processing row: {e}")
                failed_records += 1
        
        # Record the upload
        upload_data = {
            "filename": file.filename,
            "position": position,
            "processed_at": datetime.now().isoformat(),
            "total_records": successful_records + failed_records,
            "successful_records": successful_records,
            "failed_records": failed_records
        }
        
        db.create_upload(upload_data)
        
        return jsonify({
            "message": "Upload successful",
            "successful_records": successful_records,
            "failed_records": failed_records
        })
        
    except Exception as e:
        print(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/exports', methods=['GET'])
def export_data():
    # Get filter parameters
    position = request.args.get('position')
    
    # Fetch candidates based on filters
    if position and position != "All Positions":
        candidates = db.get_candidates_by_position(position)
    else:
        candidates = db.get_all_candidates()
    
    # Convert to CSV
    candidates_list = []
    for candidate in candidates:
        # Prepare skills as comma-separated string
        skills_str = ",".join([f"{skill}" for skill in candidate['skills'].keys()])
        
        # Prepare experience as string if it exists
        experience_str = ""
        if candidate.get('experience'):
            experiences = []
            for exp in candidate['experience']:
                experiences.append(f"{exp['company']}|{exp['role']}|{exp['years']}")
            experience_str = ";".join(experiences)
        
        candidates_list.append({
            "Name": candidate['name'],
            "Email": candidate['email'],
            "Position": candidate['position'],
            "Skills": skills_str,
            "Experience": experience_str,
            "Score": candidate['score'],
            "Status": candidate['status']
        })
    
    # Create a DataFrame and convert to CSV
    if candidates_list:
        df = pd.DataFrame(candidates_list)
        csv_data = df.to_csv(index=False)
        
        response = app.response_class(
            response=csv_data,
            status=200,
            mimetype='text/csv'
        )
        response.headers["Content-Disposition"] = f"attachment; filename=candidates_export_{datetime.now().strftime('%Y%m%d')}.csv"
        return response
    
    return jsonify({"error": "No data to export"}), 404

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    # For the MVP, we'll return a fixed notification
    if db.get_all_candidates():
        return jsonify([{
            "id": 1,
            "message": "New candidates have been processed and ranked",
            "type": "info",
            "read": False,
            "created_at": datetime.now().isoformat()
        }])
    return jsonify([])

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))