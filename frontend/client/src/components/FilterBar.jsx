import { IconSearch } from './Icons.jsx';
import { STATUS_OPTIONS } from './StatusBadge.jsx';

export const EMPTY_FILTERS = {
  query: '',
  minExperience: 0,
  proficiency: 'All',
  domain: 'All',
  status: 'All',
  favoritesOnly: false,
};

export function applyFilters(candidates, filters) {
  const query = filters.query.trim().toLowerCase();
  return candidates.filter((candidate) => {
    if (query) {
      const nameMatch = (candidate.candidate_name || '').toLowerCase().includes(query);
      const skillMatch = (candidate.technical_skills || []).some((s) =>
        (s.skill || '').toLowerCase().includes(query)
      );
      if (!nameMatch && !skillMatch) return false;
    }
    if (filters.minExperience > 0 && (candidate.total_experience_years || 0) < filters.minExperience) {
      return false;
    }
    if (
      filters.proficiency !== 'All' &&
      !(candidate.technical_skills || []).some((s) => s.proficiency === filters.proficiency)
    ) {
      return false;
    }
    if (filters.domain !== 'All' && !(candidate.domains || []).includes(filters.domain)) {
      return false;
    }
    if (filters.status !== 'All' && (candidate.status || 'new') !== filters.status) {
      return false;
    }
    if (filters.favoritesOnly && !candidate.is_favorite) {
      return false;
    }
    return true;
  });
}

function FilterBar({ filters, onChange, candidates }) {
  const domains = ['All', ...new Set(candidates.flatMap((c) => c.domains || []))];
  const set = (patch) => onChange({ ...filters, ...patch });
  const isDirty = JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="filter-bar">
      <div className="filter-search">
        <IconSearch className="search-icon" />
        <input
          type="text"
          className="input"
          placeholder="Search by name or skill…"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
        />
      </div>

      <select
        className="select"
        value={filters.minExperience}
        onChange={(e) => set({ minExperience: Number(e.target.value) })}
        aria-label="Minimum experience"
      >
        <option value={0}>Any experience</option>
        <option value={2}>2+ years</option>
        <option value={5}>5+ years</option>
        <option value={10}>10+ years</option>
      </select>

      <select
        className="select"
        value={filters.proficiency}
        onChange={(e) => set({ proficiency: e.target.value })}
        aria-label="Proficiency"
      >
        <option value="All">Any proficiency</option>
        <option value="Expert">Expert</option>
        <option value="Advanced">Advanced</option>
        <option value="Intermediate">Intermediate</option>
        <option value="Beginner">Beginner</option>
      </select>

      {domains.length > 1 && (
        <select
          className="select"
          value={filters.domain}
          onChange={(e) => set({ domain: e.target.value })}
          aria-label="Domain"
        >
          {domains.map((d) => (
            <option key={d} value={d}>
              {d === 'All' ? 'All domains' : d}
            </option>
          ))}
        </select>
      )}

      <select
        className="select"
        value={filters.status}
        onChange={(e) => set({ status: e.target.value })}
        aria-label="Status"
      >
        <option value="All">All statuses</option>
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <label className="favorites-toggle">
        <input
          type="checkbox"
          checked={filters.favoritesOnly}
          onChange={(e) => set({ favoritesOnly: e.target.checked })}
        />
        Favorites
      </label>

      {isDirty && (
        <button className="btn btn-ghost btn-sm" onClick={() => onChange({ ...EMPTY_FILTERS })}>
          Clear
        </button>
      )}
    </div>
  );
}

export default FilterBar;
