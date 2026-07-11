import { useRef, useState } from 'react';
import { apiErrorMessage, uploadResume } from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import { IconFile, IconUpload } from '../components/Icons.jsx';

function UploadPage({ onUploaded }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileStates, setFileStates] = useState([]);

  const processFiles = async (fileList) => {
    const files = Array.from(fileList).filter((f) => /\.(pdf|docx|txt)$/i.test(f.name));
    const skipped = fileList.length - files.length;
    if (skipped > 0)
      toast(`${skipped} unsupported file(s) skipped — only PDF, DOCX, and TXT`, 'error');
    if (files.length === 0) return;

    setUploading(true);
    setFileStates(files.map((f) => ({ name: f.name, status: 'pending' })));

    let succeeded = 0;
    for (let i = 0; i < files.length; i++) {
      setFileStates((s) => s.map((f, idx) => (idx === i ? { ...f, status: 'processing' } : f)));
      try {
        const result = await uploadResume(files[i]);
        succeeded += 1;
        setFileStates((s) =>
          s.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'done',
                  detail: `${result.candidate.candidate_name} · ${
                    result.candidate.technical_skills?.length || 0
                  } skills ${result.created ? 'added' : 'updated'}`,
                }
              : f
          )
        );
      } catch (error) {
        setFileStates((s) =>
          s.map((f, idx) =>
            idx === i ? { ...f, status: 'error', detail: apiErrorMessage(error) } : f
          )
        );
      }
    }

    setUploading(false);
    if (succeeded > 0) {
      toast(
        succeeded === 1
          ? 'Resume processed successfully'
          : `${succeeded} of ${files.length} resumes processed`,
        'success'
      );
      onUploaded();
    } else {
      toast('All uploads failed — check the files and try again', 'error');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (!uploading) processFiles(e.dataTransfer.files);
  };

  return (
    <section className="page">
      <header className="page-header">
        <h2>Upload resumes</h2>
        <p>PDF, Word (.docx), or TXT files. The AI extracts skills, experience, and contact details automatically.</p>
      </header>

      <div
        className={`dropzone${dragging ? ' dragging' : ''}${uploading ? ' disabled' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          hidden
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <IconUpload width={28} height={28} className="dropzone-icon" />
        <p className="dropzone-title">
          {uploading ? 'Processing…' : 'Drag & drop resumes here, or click to browse'}
        </p>
        <p className="dropzone-hint">Multiple files supported for bulk upload</p>
      </div>

      {fileStates.length > 0 && (
        <ul className="upload-list">
          {fileStates.map((f) => (
            <li key={f.name} className={`upload-item upload-${f.status}`}>
              <IconFile className="upload-file-icon" />
              <div className="upload-item-body">
                <span className="upload-name">{f.name}</span>
                {f.detail && <span className="upload-detail">{f.detail}</span>}
              </div>
              <span className="upload-status">
                {f.status === 'pending' && 'Queued'}
                {f.status === 'processing' && <span className="spinner" aria-label="Processing" />}
                {f.status === 'done' && 'Done'}
                {f.status === 'error' && 'Failed'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default UploadPage;
