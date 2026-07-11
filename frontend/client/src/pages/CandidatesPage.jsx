import { useMemo, useState } from 'react';
import {
  apiErrorMessage,
  bulkDeleteCandidates,
  deleteCandidate,
  exportCandidates,
  updateCandidate,
} from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';
import CandidateCard from '../components/CandidateCard.jsx';
import ComparisonModal from '../components/ComparisonModal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ContactModal from '../components/ContactModal.jsx';
import EditCandidateModal from '../components/EditCandidateModal.jsx';
import FilterBar, { applyFilters, EMPTY_FILTERS } from '../components/FilterBar.jsx';
import { IconDownload, IconUsers } from '../components/Icons.jsx';

function CandidatesPage({ candidates, onReload, onGoUpload }) {
  const toast = useToast();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [selectedIds, setSelectedIds] = useState([]);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [contact, setContact] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // candidate | 'bulk'
  const [showComparison, setShowComparison] = useState(false);

  const filtered = useMemo(() => applyFilters(candidates, filters), [candidates, filters]);
  const selectedCandidates = candidates.filter((c) => selectedIds.includes(c.id));

  const toggleSelect = (id) =>
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const handleToggleFavorite = async (candidate) => {
    try {
      await updateCandidate(candidate.id, { is_favorite: !candidate.is_favorite });
      onReload();
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  const handleStatusChange = async (candidate, status) => {
    try {
      await updateCandidate(candidate.id, { status });
      onReload();
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  const handleSave = async (id, updates) => {
    setSaving(true);
    try {
      await updateCandidate(id, updates);
      toast('Candidate updated', 'success');
      setEditing(null);
      onReload();
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (confirmDelete === 'bulk') {
        const result = await bulkDeleteCandidates(selectedIds);
        toast(`Deleted ${result.deleted} candidate(s)`, 'success');
        setSelectedIds([]);
      } else {
        await deleteCandidate(confirmDelete.id);
        toast(`Deleted ${confirmDelete.candidate_name}`, 'success');
        setSelectedIds((ids) => ids.filter((id) => id !== confirmDelete.id));
      }
      onReload();
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportCandidates();
      const blob = new Blob([JSON.stringify(data.candidates, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `candidates_export_${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast('Export downloaded', 'success');
    } catch (error) {
      toast(apiErrorMessage(error), 'error');
    }
  };

  if (candidates.length === 0) {
    return (
      <section className="page">
        <div className="empty-state">
          <IconUsers width={32} height={32} />
          <h3>No candidates yet</h3>
          <p>Upload resumes to build your candidate database.</p>
          <button className="btn btn-primary" onClick={onGoUpload}>
            Upload resumes
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <header className="page-header page-header-row">
        <div>
          <h2>Candidates</h2>
          <p>
            Showing {filtered.length} of {candidates.length} candidates
          </p>
        </div>
        <button className="btn btn-outline" onClick={handleExport}>
          <IconDownload /> Export JSON
        </button>
      </header>

      <FilterBar filters={filters} onChange={setFilters} candidates={candidates} />

      {selectedIds.length > 0 && (
        <div className="selection-bar">
          <span>
            {selectedIds.length} selected
          </span>
          <div className="selection-actions">
            {selectedIds.length >= 2 && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowComparison(true)}>
                Compare
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete('bulk')}>
              Delete selected
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedIds(filtered.map((c) => c.id))}
            >
              Select all shown
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelectedIds([])}>
              Clear
            </button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No matches</h3>
          <p>No candidates match the current filters.</p>
          <button className="btn btn-outline" onClick={() => setFilters({ ...EMPTY_FILTERS })}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="candidates-grid">
          {filtered.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              selectable
              selected={selectedIds.includes(candidate.id)}
              onToggleSelect={toggleSelect}
              onToggleFavorite={handleToggleFavorite}
              onEdit={setEditing}
              onDelete={setConfirmDelete}
              onContact={setContact}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {editing && (
        <EditCandidateModal
          candidate={editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
          saving={saving}
        />
      )}
      {contact && <ContactModal candidate={contact} onClose={() => setContact(null)} />}
      {showComparison && (
        <ComparisonModal candidates={selectedCandidates} onClose={() => setShowComparison(false)} />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete === 'bulk' ? 'Delete selected candidates' : 'Delete candidate'}
          message={
            confirmDelete === 'bulk'
              ? `This permanently deletes ${selectedIds.length} candidate(s). This cannot be undone.`
              : `This permanently deletes ${confirmDelete.candidate_name}. This cannot be undone.`
          }
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </section>
  );
}

export default CandidatesPage;
