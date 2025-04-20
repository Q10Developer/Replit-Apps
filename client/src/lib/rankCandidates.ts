// This helper is not used directly in our app since ranking is done on the server,
// but it's included to demonstrate the ranking algorithm that could be used

interface Skill {
  name: string;
  proficiency: number;
}

interface Experience {
  company: string;
  role: string;
  years: string;
}

interface Candidate {
  id: number;
  name: string;
  email: string;
  skills: Record<string, number>;
  experience?: Array<Experience>;
  position: string;
}

interface Position {
  title: string;
  requiredSkills: string[];
  department: string;
}

/**
 * Calculates a match score between a candidate and a position
 * @param candidate The candidate to rank
 * @param position The position requirements
 * @returns A score from 0-100
 */
export function calculateMatchScore(
  candidate: Candidate,
  position: Position
): number {
  // Calculate skill match
  const skillMatchScore = calculateSkillMatch(candidate.skills, position.requiredSkills);
  
  // Calculate experience score
  const experienceScore = calculateExperienceScore(candidate.experience || []);
  
  // Calculate position relevance (boost if applying for position in their field)
  const relevanceScore = 
    candidate.position.toLowerCase().includes(position.title.toLowerCase()) ? 10 : 0;
  
  // Calculate final score (weighted)
  const finalScore = Math.min(
    Math.round(skillMatchScore * 0.7 + experienceScore * 0.2 + relevanceScore),
    100
  );
  
  return finalScore;
}

/**
 * Calculates how well the candidate's skills match the required skills
 */
function calculateSkillMatch(
  candidateSkills: Record<string, number>,
  requiredSkills: string[]
): number {
  if (requiredSkills.length === 0) return 50; // Neutral score if no requirements
  
  let totalScore = 0;
  let relevantSkillsCount = 0;
  
  // Check if candidate has the required skills
  for (const skill of requiredSkills) {
    if (candidateSkills[skill]) {
      totalScore += candidateSkills[skill];
      relevantSkillsCount++;
    }
  }
  
  // If candidate has none of the required skills, low score
  if (relevantSkillsCount === 0) return 30;
  
  // Calculate coverage percentage (how many required skills they have)
  const coveragePercentage = (relevantSkillsCount / requiredSkills.length) * 100;
  
  // Calculate average skill proficiency for matched skills
  const avgProficiency = totalScore / relevantSkillsCount;
  
  // Weighted score combining coverage and proficiency
  return (coveragePercentage * 0.6) + (avgProficiency * 0.4);
}

/**
 * Calculates a score based on candidate's experience
 */
function calculateExperienceScore(experience: Experience[]): number {
  if (experience.length === 0) return 40; // Base score for no experience
  
  // Simple scoring based on number of experiences
  // In a real app, this would analyze relevance, duration, etc.
  const experienceScore = Math.min(experience.length * 15, 100);
  
  return experienceScore;
}

/**
 * Ranks a list of candidates for a given position
 */
export function rankCandidates(
  candidates: Candidate[],
  position: Position
): Candidate[] {
  // Calculate score for each candidate
  const scoredCandidates = candidates.map(candidate => ({
    ...candidate,
    score: calculateMatchScore(candidate, position)
  }));
  
  // Sort by score (descending)
  return scoredCandidates.sort((a, b) => b.score - a.score);
}
