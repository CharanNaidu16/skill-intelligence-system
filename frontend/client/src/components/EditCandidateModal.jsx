import { useState } from 'react';
import Modal from './Modal.jsx';
import { STATUS_OPTIONS } from './StatusBadge.jsx';

function EditCandidateModal({ candidate, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    candidate_name: candidate.candidate_name || '',
    notes: candidate.notes || '',
    status: candidate.status || 'new',
    salary_expectation: candidate.salary_expectation || '',
    total_experience_years: candidate.total_experience_years ?? 0,
    is_favorite: !!candidate.is_favorite,
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const handleSave = () => {
    onSave(candidate.id, {
      ...form,
      candidate_name: form.candidate_name.trim() || candidate.candidate_name,
      salary_expectation: form.salary_expectation.trim() || null,
      total_experience_years: Number(form.total_experience_years) || 0,
    });
  };

  return (
    <Modal
      title="Edit candidate"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="edit-name">Name</label>
          <input
            id="edit-name"
            className="input"
            type="text"
            value={form.candidate_name}
            onChange={(e) => set({ candidate_name: e.target.value })}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              className="select"
              value={form.status}
              onChange={(e) => set({ status: e.target.value })}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-exp">Experience (years)</label>
            <input
              id="edit-exp"
              className="input"
              type="number"
              min="0"
              value={form.total_experience_years}
              onChange={(e) => set({ total_experience_years: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="edit-salary">Salary expectation</label>
          <input
            id="edit-salary"
            className="input"
            type="text"
            placeholder="e.g. $80,000 – $100,000"
            value={form.salary_expectation}
            onChange={(e) => set({ salary_expectation: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-notes">Notes</label>
          <textarea
            id="edit-notes"
            className="textarea"
            rows={3}
            placeholder="Internal notes about this candidate…"
            value={form.notes}
            onChange={(e) => set({ notes: e.target.value })}
          />
        </div>

        <label className="favorites-toggle">
          <input
            type="checkbox"
            checked={form.is_favorite}
            onChange={(e) => set({ is_favorite: e.target.checked })}
          />
          Mark as favorite
        </label>
      </div>
    </Modal>
  );
}

export default EditCandidateModal;
