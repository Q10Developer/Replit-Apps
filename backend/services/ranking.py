"""
Ranking service for candidate evaluation.
This module contains functions to calculate match scores and rank candidates.
"""

def calculate_match_score(candidate, position):
    """
    Calculates a match score between a candidate and a position
    
    Args:
        candidate: A candidate dict with skills and experience
        position: A position dict with title and required_skills
        
    Returns:
        A score from 0-100
    """
    # Calculate skill match
    skill_match_score = calculate_skill_match(candidate.get('skills', {}), position.get('requiredSkills', []))
    
    # Calculate experience score
    experience_score = calculate_experience_score(candidate.get('experience', []))
    
    # Calculate position relevance (boost if applying for position in their field)
    relevance_score = 0
    if 'position' in candidate and position.get('title', ''):
        if candidate['position'].lower() == position['title'].lower():
            relevance_score = 10
    
    # Calculate final score (weighted)
    final_score = min(
        round(skill_match_score * 0.7 + experience_score * 0.2 + relevance_score),
        100
    )
    
    return final_score

def calculate_skill_match(candidate_skills, required_skills):
    """
    Calculates how well the candidate's skills match the required skills
    
    Args:
        candidate_skills: Dict of skill name to proficiency score
        required_skills: List of required skill names
        
    Returns:
        A score from 0-100
    """
    if not required_skills:
        return 50  # Neutral score if no requirements
    
    total_score = 0
    relevant_skills_count = 0
    
    # Check if candidate has the required skills
    for skill in required_skills:
        if skill in candidate_skills:
            total_score += candidate_skills[skill]
            relevant_skills_count += 1
    
    # If candidate has none of the required skills, low score
    if relevant_skills_count == 0:
        return 30
    
    # Calculate coverage percentage (how many required skills they have)
    coverage_percentage = (relevant_skills_count / len(required_skills)) * 100
    
    # Calculate average skill proficiency for matched skills
    avg_proficiency = total_score / relevant_skills_count
    
    # Weighted score combining coverage and proficiency
    return (coverage_percentage * 0.6) + (avg_proficiency * 0.4)

def calculate_experience_score(experience):
    """
    Calculates a score based on candidate's experience
    
    Args:
        experience: List of experience items (each with company, role, years)
        
    Returns:
        A score from 0-100
    """
    if not experience:
        return 40  # Base score for no experience
    
    # Simple scoring based on number of experiences
    # In a real app, this would analyze relevance, duration, etc.
    experience_score = min(len(experience) * 15, 100)
    
    return experience_score

def rank_candidates(candidates, position):
    """
    Ranks a list of candidates for a given position
    
    Args:
        candidates: List of candidate objects
        position: Position object with requirements
        
    Returns:
        Sorted list of candidates with scores
    """
    # Calculate score for each candidate
    scored_candidates = []
    for candidate in candidates:
        # Skip if already has a score
        if 'score' not in candidate:
            score = calculate_match_score(candidate, position)
            candidate['score'] = score
        scored_candidates.append(candidate)
    
    # Sort by score (descending)
    return sorted(scored_candidates, key=lambda x: x.get('score', 0), reverse=True)