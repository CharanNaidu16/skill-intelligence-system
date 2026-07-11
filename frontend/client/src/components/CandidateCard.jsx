import { useState } from 'react';
import StatusBadge, { STATUS_OPTIONS } from './StatusBadge.jsx';
import ResumeModal from './ResumeModal.jsx';
import { IconFile, IconMapPin, IconPencil, IconStar, IconTrash } from './Icons.jsx';

const PREVIEW_COUNT = 6;

function CandidateCard({
  candidate,
  selectable,
  selected,
  onToggleSelect,
  onToggleFavorite,
  onEdit,
  onDelete,
  onContact,
  onStatusChange,
}) {
  const [expanded, setExpanded] = useState(false);
  const [viewingResume, setViewingResume] = useState(false);
  const skills = candidate.technical_skills || [];
  const visibleSkills = expanded ? skills : skills.slice(0, PREVIEW_COUNT);
  const location = candidate.contact_info?.location;

  return (
    <article className={`candidate-card${candidate.is_favorite ? ' is-favorite' : ''}`}>
      <div className="card-top">
        <label className="checkbox-wrap" title="Select for comparison / bulk actions">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(candidate.id)}
            disabled={!selectable && !selected}
          />
        </label>
        <div className="card-identity">
          <h3>{candidate.candidate_name}</h3>
          {location && (
            <span className="card-location">
              <IconMapPin width={13} height={13} /> {location}
            </span>
          )}
        </div>
        <div className="card-actions">
          <button
            className={`icon-btn favorite-btn${candidate.is_favorite ? ' active' : ''}`}
            onClick={() => onToggleFavorite(candidate)}
            title={candidate.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <IconStar filled={candidate.is_favorite} />
          </button>
          <button className="icon-btn" onClick={() => onEdit(candidate)} title="Edit candidate">
            <IconPencil />
          </button>
          <button
            className="icon-btn icon-btn-danger"
            onClick={() => onDelete(candidate)}
            title="Delete candidate"
          >
            <IconTrash />
          </button>
        </div>
      </div>

      <div className="card-meta">
        <StatusBadge status={candidate.status} />
        <span className="meta-item">{candidate.total_experience_years ?? 0} yrs experience</span>
        <span className="meta-item">{skills.length} skills</span>
        {candidate.salary_expectation && (
          <span className="meta-item">{candidate.salary_expectation}</span>
        )}
      </div>

      {skills.length > 0 && (
        <div className="skill-tags">
          {visibleSkills.map((skill) => (
            <span key={skill.skill} className="skill-tag" title={skill.context || ''}>
              {skill.skill}
              {skill.proficiency && <em>{skill.proficiency}</em>}
            </span>
          ))}
          {skills.length > PREVIEW_COUNT && (
            <button className="skill-tag skill-tag-more" onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show less' : `+${skills.length - PREVIEW_COUNT} more`}
            </button>
          )}
        </div>
      )}

      {candidate.notes && <p className="card-notes">{candidate.notes}</p>}

      <div className="card-footer">
        <div className="card-footer-actions">
          <button className="btn btn-outline btn-sm" onClick={() => onContact(candidate)}>
            Contact
          </button>
          {candidate.source_file && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setViewingResume(true)}
              title="View the original resume"
            >
              <IconFile width={14} height={14} /> Resume
            </button>
          )}
        </div>
        <select
          className="select select-sm"
          value={candidate.status || 'new'}
          onChange={(e) => onStatusChange(candidate, e.target.value)}
          aria-label="Pipeline status"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {viewingResume && (
        <ResumeModal candidate={candidate} onClose={() => setViewingResume(false)} />
      )}
    </article>
  );
}

export default CandidateCard;
