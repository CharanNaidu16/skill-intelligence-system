import { useState } from 'react';
import ContactModal from '../components/ContactModal.jsx';
import ExplanationModal from '../components/ExplanationModal.jsx';

// Score thresholds use the reserved status colors (good / warning / critical)
const scoreColor = (pct) => (pct >= 75 ? '#079455' : pct >= 50 ? '#dc8a06' : '#d92d20');

function ResultsPage({ recommendations, candidates }) {
  const [explaining, setExplaining] = useState(null);
  const [contact, setContact] = useState(null);

  const { role_name, total_candidates, requirements, recommendations: recs } = recommendations;

  return (
    <section className="page">
      <header className="page-header">
        <h2>Matches for “{role_name}”</h2>
        <p>Ranked {total_candidates} candidate(s) against the role requirements.</p>
        {requirements?.required_skills?.length > 0 && (
          <div className="skill-tags requirements-row">
            <span className="text-muted">Required:</span>
            {requirements.required_skills.map((s) => (
              <span key={s} className="skill-tag">
                {s}
              </span>
            ))}
            {requirements.min_experience_years > 0 && (
              <span className="skill-tag">{requirements.min_experience_years}+ yrs</span>
            )}
          </div>
        )}
      </header>

      <div className="results-list">
        {recs.map((rec, index) => (
          <article key={rec.candidate_id || index} className="result-card">
            <div className="result-rank">#{index + 1}</div>
            <div className="result-body">
              <div className="result-head">
                <h3>{rec.candidate_name}</h3>
                <span className="result-score">{rec.match_percentage}% match</span>
              </div>
              <div className="meter">
                <div
                  className="meter-fill"
                  style={{
                    width: `${rec.match_percentage}%`,
                    background: scoreColor(rec.match_percentage),
                  }}
                />
              </div>
              <p className="result-explanation">{rec.explanation}</p>

              <div className="result-skills">
                <span className="result-count">
                  Required skills: {rec.required_skills_matched}/{rec.required_skills_total}
                </span>
                {rec.required_matches.map((m) => (
                  <span key={m.skill} className="skill-tag skill-tag-matched">
                    {m.skill}
                  </span>
                ))}
                {rec.required_missing.map((s) => (
                  <span key={s} className="skill-tag skill-tag-missing">
                    {s}
                  </span>
                ))}
                {rec.preferred_matches.map((m) => (
                  <span key={m.skill} className="skill-tag skill-tag-bonus">
                    +{m.skill}
                  </span>
                ))}
              </div>

              <div className="result-actions">
                <button className="btn btn-outline btn-sm" onClick={() => setExplaining(rec)}>
                  Why this ranking?
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    const candidate =
                      candidates.find((c) => c.id === rec.candidate_id) || rec.candidate;
                    if (candidate) setContact(candidate);
                  }}
                >
                  Contact
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {explaining && (
        <ExplanationModal recommendation={explaining} onClose={() => setExplaining(null)} />
      )}
      {contact && <ContactModal candidate={contact} onClose={() => setContact(null)} />}
    </section>
  );
}

export default ResultsPage;
