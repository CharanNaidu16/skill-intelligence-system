export const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

export function statusLabel(status) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || 'New';
}

function StatusBadge({ status = 'new' }) {
  return (
    <span className={`status-badge status-${status}`}>
      <span className="status-dot" />
      {statusLabel(status)}
    </span>
  );
}

export default StatusBadge;
