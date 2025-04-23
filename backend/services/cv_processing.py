"""
CV Processing Service

This module provides functions for processing and analyzing CV data.
It handles extraction of skills, matching against job requirements,
and calculating candidate scores.
"""

import pandas as pd
import re
import json
from typing import Dict, List, Any, Optional, Union

def extract_skills(text: str) -> Dict[str, float]:
    """
    Extract skills from text and assign proficiency scores
    
    Args:
        text: Comma-separated string of skills
        
    Returns:
        Dictionary mapping skill names to proficiency scores (0-100)
    """
    if not text:
        return {}
    
    # For now, just split by commas and assign random scores in a realistic range
    skills = {}
    for skill in text.split(','):
        skill_name = skill.strip()
        if skill_name:
            # In a real implementation, we would analyze the text to determine proficiency
            # For now, we'll use a score between 70-95
            import random
            skills[skill_name] = random.randint(70, 95)
    
    return skills

def parse_experience(experience_text: str) -> List[Dict[str, str]]:
    """
    Parse experience text into structured format
    
    Args:
        experience_text: Semicolon-separated experience entries, 
                        each with format "Company|Role|Years"
        
    Returns:
        List of dictionaries with company, role, and years
    """
    if not experience_text:
        return []
    
    experience_list = []
    for exp_entry in experience_text.split(';'):
        parts = exp_entry.split('|')
        if len(parts) >= 3:
            experience_list.append({
                'company': parts[0].strip(),
                'role': parts[1].strip(), 
                'years': parts[2].strip()
            })
    
    return experience_list

def calculate_experience_score(experience: List[Dict[str, str]]) -> int:
    """
    Calculate a score based on the candidate's experience
    
    Args:
        experience: List of experience entries
        
    Returns:
        Score from 0-100
    """
    if not experience:
        return 70  # Default score for no experience
    
    # Basic calculation based on years of experience
    total_years = 0
    for exp in experience:
        try:
            # Try to parse years as a number (handles formats like "3" or "3.5")
            years_text = exp.get('years', '').replace('years', '').replace('year', '').strip()
            total_years += float(years_text)
        except (ValueError, TypeError):
            # If we can't parse it, just skip
            pass
    
    # Score based on total years, capped at 100
    # 0-2 years: 70-80, 2-5 years: 80-90, 5+ years: 90-100
    if total_years < 2:
        return min(70 + int(total_years * 5), 80)
    elif total_years < 5:
        return min(80 + int((total_years - 2) * 3), 90) 
    else:
        return min(90 + int((total_years - 5) * 2), 100)

def calculate_skill_match(candidate_skills: Dict[str, float], 
                         required_skills: List[str]) -> int:
    """
    Calculate how well the candidate's skills match the required skills
    
    Args:
        candidate_skills: Dict of skill name to proficiency score
        required_skills: List of required skill names
        
    Returns:
        A score from 0-100
    """
    if not required_skills:
        return 85  # No requirements, good match
    
    if not candidate_skills:
        return 50  # No skills, poor match
    
    # Count matches and calculate average score of matching skills
    matches = 0
    total_score = 0
    
    for skill in required_skills:
        skill_lower = skill.lower()
        for candidate_skill, score in candidate_skills.items():
            if skill_lower in candidate_skill.lower():
                matches += 1
                total_score += score
                break
    
    # Calculate percentage of required skills matched
    match_percentage = matches / len(required_skills) * 100
    
    # Calculate average score of matched skills
    avg_score = total_score / matches if matches > 0 else 60
    
    # Weighted combination: 60% match percentage, 40% average score
    final_score = int(0.6 * match_percentage + 0.4 * avg_score)
    
    # Ensure score is in the range 0-100
    return max(0, min(100, final_score))

def calculate_match_score(candidate: Dict[str, Any], 
                         position: Dict[str, Any]) -> int:
    """
    Calculate an overall match score between a candidate and a position
    
    Args:
        candidate: A candidate dict with skills and experience
        position: A position dict with title and required_skills
        
    Returns:
        A score from 0-100
    """
    # Get the required skills
    required_skills = position.get('required_skills', [])
    
    # Calculate skill match score
    skill_score = calculate_skill_match(candidate.get('skills', {}), required_skills)
    
    # Calculate experience score
    exp_score = calculate_experience_score(candidate.get('experience', []))
    
    # Weighted combination: 70% skills, 30% experience
    final_score = int(0.7 * skill_score + 0.3 * exp_score)
    
    # Ensure score is in the range 0-100
    return max(0, min(100, final_score))

def determine_status(score: int) -> str:
    """
    Determine candidate status based on match score
    
    Args:
        score: Match score from 0-100
        
    Returns:
        Status string ('shortlisted', 'review', 'pending', or 'rejected')
    """
    if score >= 90:
        return 'shortlisted'
    elif score >= 75:
        return 'review'
    elif score < 60:
        return 'rejected'
    else:
        return 'pending'

def process_cv_data(csv_data: pd.DataFrame, position_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Process CV data from a DataFrame and match against position requirements
    
    Args:
        csv_data: DataFrame containing CV data
        position_data: Dictionary with position information, including required_skills
        
    Returns:
        List of processed candidate dictionaries with scores and status
    """
    candidates = []
    
    for _, row in csv_data.iterrows():
        try:
            # Extract and process skills
            skills = extract_skills(row.get('skills', ''))
            
            # Parse experience if available
            experience = []
            if 'experience' in row and pd.notna(row['experience']):
                experience = parse_experience(row['experience'])
            
            # Create candidate record
            candidate = {
                'name': row.get('name', ''),
                'email': row.get('email', ''),
                'position': row.get('position', position_data.get('title', '')),
                'skills': skills,
                'experience': experience,
                'notes': ''
            }
            
            # Calculate match score
            score = calculate_match_score(candidate, position_data)
            candidate['score'] = score
            
            # Determine status based on score
            candidate['status'] = determine_status(score)
            
            candidates.append(candidate)
        except Exception as e:
            print(f"Error processing candidate: {e}")
    
    return candidates