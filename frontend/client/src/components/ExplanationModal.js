import React from 'react';
import './ExplanationModal.css';

function ExplanationModal({ recommendation, roleRequirements, onClose }) {
  const calculateBreakdown = () => {
    const breakdown = [];
    
    // Required skills scoring
    const requiredScore = recommendation.required_skills_matched * 10;
    const requiredMax = recommendation.required_skills_total * 10;
    breakdown.push({
      category: 'Required Skills',
      score: requiredScore,
      maxScore: requiredMax,
      percentage: requiredMax > 0 ? (requiredScore / requiredMax * 100).toFixed(1) : 0,
      description: `Matched ${recommendation.required_skills_matched} out of ${recommendation.required_skills_total} required skills`
    });

    // Preferred skills scoring
    const preferredMatched = recommendation.preferred_matches?.length || 0;
    const preferredScore = preferredMatched * 5;
    breakdown.push({
      category: 'Preferred Skills',
      score: preferredScore,
      maxScore: 50,
      percentage: (preferredScore / 50 * 100).toFixed(1),
      description: `Has ${preferredMatched} preferred/bonus skills`
    });

    // Experience scoring
    const expScore = Math.min(recommendation.experience_years * 3, 30);
    breakdown.push({
      category: 'Experience',
      score: expScore,
      maxScore: 30,
      percentage: (expScore / 30 * 100).toFixed(1),
      description: `${recommendation.experience_years} years of total experience`
    });

    return breakdown;
  };

  const breakdown = calculateBreakdown();

  return (
    <div className="explanation-modal">
      <div className="explanation-content">
        <div className="explanation-header">
          <h2>🔍 Why {recommendation.candidate_name}?</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="overall-score">
          <div className="score-circle">
            <div className="score-value">{recommendation.match_percentage}%</div>
            <div className="score-label">Overall Match</div>
          </div>
          <div className="score-summary">
            <p>{recommendation.explanation}</p>
          </div>
        </div>

        <div className="scoring-breakdown">
          <h3>📊 Scoring Breakdown</h3>
          {breakdown.map((item, index) => (
            <div key={index} className="breakdown-item">
              <div className="breakdown-header">
                <span className="category-name">{item.category}</span>
                <span className="category-score">
                  {item.score} / {item.maxScore} points
                </span>
              </div>
              <div className="breakdown-bar">
                <div 
                  className="breakdown-fill" 
                  style={{ width: `${item.percentage}%` }}
                ></div>
              </div>
              <div className="breakdown-description">{item.description}</div>
            </div>
          ))}
        </div>

        <div className="detailed-evidence">
          <h3>✅ Matched Required Skills</h3>
          {recommendation.required_matches?.length > 0 ? (
            <div className="evidence-grid">
              {recommendation.required_matches.map((match, i) => (
                <div key={i} className="evidence-card">
                  <div className="skill-name">{match.skill}</div>
                  <div className="skill-details">
                    <span className="proficiency-badge">{match.proficiency}</span>
                    <span className="years-badge">{match.years} years</span>
                  </div>
                  <div className="skill-score">+{match.score} points</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No required skills matched</p>
          )}

          {recommendation.required_missing?.length > 0 && (
            <>
              <h3>❌ Missing Required Skills</h3>
              <div className="missing-skills">
                {recommendation.required_missing.map((skill, i) => (
                  <span key={i} className="missing-tag">{skill}</span>
                ))}
              </div>
            </>
          )}

          {recommendation.preferred_matches?.length > 0 && (
            <>
              <h3>⭐ Bonus Skills</h3>
              <div className="bonus-skills">
                {recommendation.preferred_matches.map((match, i) => (
                  <div key={i} className="bonus-tag">
                    {match.skill} ({match.proficiency})
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="recommendation-footer">
          <div className="footer-note">
            <strong>Note:</strong> This recommendation is based on skill matching, 
            experience level, and proficiency analysis. Consider interviewing to 
            assess cultural fit and soft skills.
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExplanationModal;