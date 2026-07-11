import Modal from './Modal.jsx';

// Mirrors the backend scoring weights (services/recommender.py):
// 60% required skills, 10% preferred skills, 30% experience.
function buildBreakdown(rec) {
  const requiredRatio = rec.required_skills_total
    ? rec.required_skills_matched / rec.required_skills_total
    : 1;
  const preferredRatio = rec.preferred_skills_total
    ? (rec.preferred_matches?.length || 0) / rec.preferred_skills_total
    : 0;
  const experienceRatio = rec.meets_experience_requirement ? 1 : 0.5;

  return [
    {
      category: 'Required skills',
      weight: 60,
      ratio: requiredRatio,
      description: `Matched ${rec.required_skills_matched} of ${rec.required_skills_total} required skills`,
    },
    {
      category: 'Preferred skills',
      weight: 10,
      ratio: preferredRatio,
      description: `Has ${rec.preferred_matches?.length || 0} of ${rec.preferred_skills_total || 0} preferred skills`,
    },
    {
      category: 'Experience',
      weight: 30,
      ratio: experienceRatio,
      description: rec.meets_experience_requirement
        ? `${rec.experience_years} years — meets the requirement`
        : `${rec.experience_years} years — below the requirement`,
    },
  ];
}

function ExplanationModal({ recommendation, onClose }) {
  const breakdown = buildBreakdown(recommendation);

  return (
    <Modal title={`Why ${recommendation.candidate_name}?`} onClose={onClose}>
      <div className="score-summary">
        <div className="score-circle">
          <span className="score-value">{recommendation.match_percentage}%</span>
          <span className="score-label">match</span>
        </div>
        <p>{recommendation.explanation}</p>
      </div>

      <h4 className="section-title">Scoring breakdown</h4>
      <div className="breakdown-list">
        {breakdown.map((item) => (
          <div key={item.category} className="breakdown-item">
            <div className="breakdown-head">
              <span>{item.category}</span>
              <span className="text-muted">
                {(item.ratio * item.weight).toFixed(0)} / {item.weight} pts
              </span>
            </div>
            <div className="meter">
              <div className="meter-fill" style={{ width: `${item.ratio * 100}%` }} />
            </div>
            <p className="breakdown-desc">{item.description}</p>
          </div>
        ))}
      </div>

      {recommendation.required_matches?.length > 0 && (
        <>
          <h4 className="section-title">Matched required skills</h4>
          <div className="skill-tags">
            {recommendation.required_matches.map((m) => (
              <span key={m.skill} className="skill-tag skill-tag-matched">
                {m.skill}
                <em>
                  {m.proficiency}
                  {m.years ? ` · ${m.years}y` : ''}
                </em>
              </span>
            ))}
          </div>
        </>
      )}

      {recommendation.required_missing?.length > 0 && (
        <>
          <h4 className="section-title">Missing required skills</h4>
          <div className="skill-tags">
            {recommendation.required_missing.map((skill) => (
              <span key={skill} className="skill-tag skill-tag-missing">
                {skill}
              </span>
            ))}
          </div>
        </>
      )}

      {recommendation.preferred_matches?.length > 0 && (
        <>
          <h4 className="section-title">Bonus skills</h4>
          <div className="skill-tags">
            {recommendation.preferred_matches.map((m) => (
              <span key={m.skill} className="skill-tag skill-tag-bonus">
                {m.skill}
                {m.proficiency && <em>{m.proficiency}</em>}
              </span>
            ))}
          </div>
        </>
      )}

      <p className="footnote">
        Scores are based on skill and experience matching. Interview candidates to assess
        cultural fit and soft skills.
      </p>
    </Modal>
  );
}

export default ExplanationModal;
