import React from 'react';
import './ContactPage.css';

function ContactPage({ candidate, onClose }) {
  const contactInfo = candidate.contact_info || {};
  
  const hasContactInfo = contactInfo.email || contactInfo.phone || contactInfo.linkedin;

  const handleEmailClick = () => {
    if (contactInfo.email) {
      window.location.href = `mailto:${contactInfo.email}`;
    }
  };

  const handlePhoneClick = () => {
    if (contactInfo.phone) {
      window.location.href = `tel:${contactInfo.phone}`;
    }
  };

  const handleLinkedInClick = () => {
    if (contactInfo.linkedin) {
      window.open(contactInfo.linkedin, '_blank');
    }
  };

  return (
    <div className="contact-modal">
      <div className="contact-content">
        <div className="contact-header">
          <h2>📞 Contact {candidate.candidate_name}</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="candidate-summary">
          <div className="candidate-avatar">
            {candidate.candidate_name.charAt(0).toUpperCase()}
          </div>
          <div className="candidate-info">
            <h3>{candidate.candidate_name}</h3>
            <p className="experience">{candidate.total_experience_years} years of experience</p>
            {candidate.domains && candidate.domains.length > 0 && (
              <div className="domains">
                {candidate.domains.map((domain, i) => (
                  <span key={i} className="domain-tag">{domain}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {hasContactInfo ? (
          <div className="contact-methods">
            {contactInfo.email && (
              <div className="contact-card" onClick={handleEmailClick}>
                <div className="contact-icon">📧</div>
                <div className="contact-details">
                  <div className="contact-label">Email</div>
                  <div className="contact-value">{contactInfo.email}</div>
                </div>
                <div className="contact-action">→</div>
              </div>
            )}

            {contactInfo.phone && (
              <div className="contact-card" onClick={handlePhoneClick}>
                <div className="contact-icon">📱</div>
                <div className="contact-details">
                  <div className="contact-label">Phone</div>
                  <div className="contact-value">{contactInfo.phone}</div>
                </div>
                <div className="contact-action">→</div>
              </div>
            )}

            {contactInfo.linkedin && (
              <div className="contact-card" onClick={handleLinkedInClick}>
                <div className="contact-icon">💼</div>
                <div className="contact-details">
                  <div className="contact-label">LinkedIn</div>
                  <div className="contact-value">View Profile</div>
                </div>
                <div className="contact-action">→</div>
              </div>
            )}

            {contactInfo.location && (
              <div className="contact-card non-clickable">
                <div className="contact-icon">📍</div>
                <div className="contact-details">
                  <div className="contact-label">Location</div>
                  <div className="contact-value">{contactInfo.location}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="no-contact-info">
            <div className="no-contact-icon">ℹ️</div>
            <p>No contact information found in resume</p>
            <p className="hint">Contact details may not have been included in the uploaded resume</p>
          </div>
        )}

        <div className="skills-preview">
          <h4>Top Skills</h4>
          <div className="skills-list">
            {candidate.technical_skills?.slice(0, 8).map((skill, i) => (
              <div key={i} className="skill-item">
                <span className="skill-name">{skill.skill}</span>
                <span className="skill-level">{skill.proficiency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;