import { useState } from 'react';
import { apiErrorMessage, getRecommendations } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { IconTarget } from '../components/Icons.jsx';

const JD_PLACEHOLDER = `Paste the full job description here…

Example:
We are looking for a Senior Full Stack Developer with 5+ years of experience.

Required skills:
- React, Node.js, TypeScript
- AWS cloud services
- RESTful API development

Preferred:
- Docker, Kubernetes
- CI/CD pipelines`;

function MatchPage({ hasCandidates, onResults, onGoUpload }) {
  const toast = useToast();
  const [mode, setMode] = useState('description');
  const [jobDescription, setJobDescription] = useState('');
  const [roleName, setRoleName] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async () => {
    setFormError('');
    let payload;
    if (mode === 'description') {
      if (!jobDescription.trim()) {
        setFormError('Paste a job description first.');
        return;
      }
      payload = { mode, job_description: jobDescription };
    } else {
      if (!roleName.trim() || !requiredSkills.trim()) {
        setFormError('Role name and required skills are needed.');
        return;
      }
      payload = {
        mode,
        role_name: roleName.trim(),
        required_skills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        preferred_skills: preferredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        min_experience_years: Number(minExperience) || 0,
      };
    }

    setLoading(true);
    try {
      const result = await getRecommendations(payload);
      onResults(result);
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!hasCandidates) {
    return (
      <section className="page">
        <div className="empty-state">
          <IconTarget width={32} height={32} />
          <h3>No candidates to match</h3>
          <p>Upload resumes first, then define a role to find the best matches.</p>
          <button className="btn btn-primary" onClick={onGoUpload}>
            Upload resumes
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page page-narrow">
      <header className="page-header">
        <h2>Find matching candidates</h2>
        <p>Describe the role and the engine ranks every candidate against it.</p>
      </header>

      <div className="segmented">
        <button
          className={mode === 'description' ? 'active' : ''}
          onClick={() => setMode('description')}
        >
          Job description
        </button>
        <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>
          Manual requirements
        </button>
      </div>

      {mode === 'description' ? (
        <div className="form-group">
          <label htmlFor="jd">Job description</label>
          <textarea
            id="jd"
            className="textarea"
            rows={12}
            placeholder={JD_PLACEHOLDER}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <small className="field-hint">
            The AI extracts the role, required skills, and experience automatically.
          </small>
        </div>
      ) : (
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="role">Role name</label>
            <input
              id="role"
              className="input"
              type="text"
              placeholder="e.g. Senior ML Engineer"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="req">Required skills</label>
            <input
              id="req"
              className="input"
              type="text"
              placeholder="e.g. Python, Machine Learning, AWS"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
            />
            <small className="field-hint">Comma-separated, must-have skills</small>
          </div>
          <div className="form-group">
            <label htmlFor="pref">Preferred skills</label>
            <input
              id="pref"
              className="input"
              type="text"
              placeholder="e.g. Docker, Kubernetes"
              value={preferredSkills}
              onChange={(e) => setPreferredSkills(e.target.value)}
            />
            <small className="field-hint">Comma-separated, nice-to-have</small>
          </div>
          <div className="form-group form-group-inline">
            <label htmlFor="minexp">Minimum experience (years)</label>
            <input
              id="minexp"
              className="input input-narrow"
              type="number"
              min="0"
              value={minExperience}
              onChange={(e) => setMinExperience(e.target.value)}
            />
          </div>
        </div>
      )}

      {formError && <p className="form-error">{formError}</p>}

      <div className="form-actions">
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Analyzing…' : 'Find best matches'}
        </button>
      </div>
    </section>
  );
}

export default MatchPage;
