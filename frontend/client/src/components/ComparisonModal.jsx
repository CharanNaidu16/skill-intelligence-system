import { useState } from 'react';
import Modal from './Modal.jsx';
import StatusBadge from './StatusBadge.jsx';

const PREVIEW_COUNT = 5;

function ComparisonModal({ candidates, onClose }) {
  const [expanded, setExpanded] = useState({});

  return (
    <Modal title={`Compare candidates (${candidates.length})`} onClose={onClose} size="lg">
      <div className="table-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th>Attribute</th>
              {candidates.map((c) => (
                <th key={c.id}>{c.candidate_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Status</td>
              {candidates.map((c) => (
                <td key={c.id}>
                  <StatusBadge status={c.status} />
                </td>
              ))}
            </tr>
            <tr>
              <td>Experience</td>
              {candidates.map((c) => (
                <td key={c.id}>{c.total_experience_years ?? 0} years</td>
              ))}
            </tr>
            <tr>
              <td>Technical skills</td>
              {candidates.map((c) => {
                const skills = c.technical_skills || [];
                const isOpen = expanded[c.id];
                const shown = isOpen ? skills : skills.slice(0, PREVIEW_COUNT);
                return (
                  <td key={c.id}>
                    <ul className="compare-skills">
                      {shown.map((s) => (
                        <li key={s.skill}>
                          {s.skill}
                          {s.proficiency && <span className="text-muted"> · {s.proficiency}</span>}
                        </li>
                      ))}
                    </ul>
                    {skills.length > PREVIEW_COUNT && (
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setExpanded((e) => ({ ...e, [c.id]: !isOpen }))}
                      >
                        {isOpen ? 'Show less' : `+${skills.length - PREVIEW_COUNT} more`}
                      </button>
                    )}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td>Domains</td>
              {candidates.map((c) => (
                <td key={c.id}>{(c.domains || []).join(', ') || '—'}</td>
              ))}
            </tr>
            <tr>
              <td>Salary expectation</td>
              {candidates.map((c) => (
                <td key={c.id}>{c.salary_expectation || '—'}</td>
              ))}
            </tr>
            <tr>
              <td>Contact</td>
              {candidates.map((c) => (
                <td key={c.id}>
                  {c.contact_info?.email && <div>{c.contact_info.email}</div>}
                  {c.contact_info?.phone && <div>{c.contact_info.phone}</div>}
                  {!c.contact_info?.email && !c.contact_info?.phone && '—'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default ComparisonModal;
