import Modal from './Modal.jsx';
import { IconLinkedIn, IconMail, IconMapPin, IconPhone } from './Icons.jsx';

function ContactModal({ candidate, onClose }) {
  const info = candidate.contact_info || {};
  const hasContact = info.email || info.phone || info.linkedin;

  return (
    <Modal title={`Contact ${candidate.candidate_name}`} onClose={onClose}>
      <div className="contact-summary">
        <div className="avatar">{(candidate.candidate_name || '?').charAt(0).toUpperCase()}</div>
        <div>
          <h3>{candidate.candidate_name}</h3>
          <p className="text-muted">{candidate.total_experience_years ?? 0} years of experience</p>
          {(candidate.domains || []).length > 0 && (
            <div className="skill-tags">
              {candidate.domains.map((d) => (
                <span key={d} className="skill-tag">
                  {d}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {hasContact ? (
        <div className="contact-list">
          {info.email && (
            <a className="contact-row" href={`mailto:${info.email}`}>
              <IconMail /> <span>{info.email}</span>
            </a>
          )}
          {info.phone && (
            <a className="contact-row" href={`tel:${info.phone}`}>
              <IconPhone /> <span>{info.phone}</span>
            </a>
          )}
          {info.linkedin && (
            <a className="contact-row" href={info.linkedin} target="_blank" rel="noreferrer">
              <IconLinkedIn /> <span>LinkedIn profile</span>
            </a>
          )}
          {info.location && (
            <div className="contact-row contact-row-static">
              <IconMapPin /> <span>{info.location}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="empty-note">
          No contact information was found in this resume.
        </div>
      )}

      {(candidate.technical_skills || []).length > 0 && (
        <div className="contact-skills">
          <h4>Top skills</h4>
          <div className="skill-tags">
            {candidate.technical_skills.slice(0, 8).map((skill) => (
              <span key={skill.skill} className="skill-tag">
                {skill.skill}
                {skill.proficiency && <em>{skill.proficiency}</em>}
              </span>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

export default ContactModal;
