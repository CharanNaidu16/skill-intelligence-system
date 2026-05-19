import React, { useState } from 'react';
import './ComparisonView.css';

const ComparisonView = ({ candidates, selectedNames, onClose }) => {
  // State for expanded skills in comparison view
  const [expandedSkills, setExpandedSkills] = useState({});
  
  const toggleSkills = (candidateName) => {
    setExpandedSkills(prev => ({
      ...prev,
      [candidateName]: !prev[candidateName]
    }));
  };
  
  // Filter candidates to show only selected ones
  const selectedCandidates = candidates.filter(candidate => 
    selectedNames.includes(candidate.candidate_name)
  );

  if (!selectedCandidates || selectedCandidates.length === 0) {
    return (
      <div className="comparison-view">
        <div className="comparison-header">
          <h2>Candidate Comparison</h2>
          <button onClick={onClose} className="close-btn">×</button>
        </div>
        <p>No candidates selected for comparison.</p>
      </div>
    );
  }

  return (
    <div className="comparison-view">
      <div className="comparison-header">
        <h2>Candidate Comparison ({selectedCandidates.length} candidates)</h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>
      
      <div className="comparison-table">
        <table>
          <thead>
            <tr>
              <th>Attribute</th>
              {selectedCandidates.map((candidate, index) => (
                <th key={index}>{candidate.candidate_name || `Candidate ${index + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Total Experience</strong></td>
              {selectedCandidates.map((candidate, index) => (
                <td key={index}>{candidate.total_experience_years || 'N/A'} years</td>
              ))}
            </tr>
            <tr>
              <td><strong>Technical Skills</strong></td>
              {selectedCandidates.map((candidate, index) => {
                const candidateName = candidate.candidate_name || `Candidate ${index + 1}`;
                const isExpanded = expandedSkills[candidateName];
                const skillsToShow = isExpanded ? candidate.technical_skills : candidate.technical_skills?.slice(0, 3);
                const hasMoreSkills = candidate.technical_skills && candidate.technical_skills.length > 3;
                
                return (
                  <td key={index}>
                    {candidate.technical_skills ? (
                      <ul className="skills-list">
                        {skillsToShow.map((skill, skillIndex) => (
                          <li key={skillIndex}>
                            {skill.skill} ({skill.proficiency})
                          </li>
                        ))}
                        {hasMoreSkills && (
                          <li>
                            <button 
                              className="expand-skills-btn"
                              onClick={() => toggleSkills(candidateName)}
                            >
                              {isExpanded 
                                ? 'Show less' 
                                : `+${candidate.technical_skills.length - 3} more`
                              }
                            </button>
                          </li>
                        )}
                      </ul>
                    ) : 'N/A'}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td><strong>Domains</strong></td>
              {selectedCandidates.map((candidate, index) => (
                <td key={index}>
                  {candidate.domains ? candidate.domains.join(', ') : 'N/A'}
                </td>
              ))}
            </tr>
            <tr>
              <td><strong>Contact</strong></td>
              {selectedCandidates.map((candidate, index) => (
                <td key={index}>
                  {candidate.contact_info ? (
                    <div>
                      {candidate.contact_info.email && <div>{candidate.contact_info.email}</div>}
                      {candidate.contact_info.phone && <div>{candidate.contact_info.phone}</div>}
                    </div>
                  ) : 'N/A'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComparisonView;