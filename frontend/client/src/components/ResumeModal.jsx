import { useEffect, useState } from 'react';
import { apiErrorMessage, getResumeText, resumeDownloadUrl, resumeUrl } from '../api/client.js';
import Modal from './Modal.jsx';
import { IconDownload } from './Icons.jsx';

function ResumeModal({ candidate, onClose }) {
  const isPdf = /\.pdf$/i.test(candidate.source_file || '');
  const [text, setText] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isPdf) return; // PDFs render natively in the iframe, no text needed
    let cancelled = false;
    getResumeText(candidate.id)
      .then((data) => !cancelled && setText(data.text))
      .catch((err) => !cancelled && setError(apiErrorMessage(err)));
    return () => {
      cancelled = true;
    };
  }, [candidate.id, isPdf]);

  return (
    <Modal
      title={`Resume — ${candidate.candidate_name}`}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <span className="resume-filename text-muted">{candidate.source_file}</span>
          <a className="btn btn-primary btn-sm" href={resumeDownloadUrl(candidate.id)} download>
            <IconDownload width={15} height={15} /> Download
          </a>
        </>
      }
    >
      {isPdf ? (
        <iframe className="resume-frame" src={resumeUrl(candidate.id)} title="Resume preview" />
      ) : error ? (
        <div className="banner banner-error">{error}</div>
      ) : text === null ? (
        <div className="resume-loading">
          <span className="spinner" /> Loading resume…
        </div>
      ) : (
        <pre className="resume-text">{text}</pre>
      )}
    </Modal>
  );
}

export default ResumeModal;
