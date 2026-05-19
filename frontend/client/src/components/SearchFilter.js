import React, { useState } from 'react';
import './SearchFilter.css';

function SearchFilter({ candidates, onFilteredResults }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [minExperience, setMinExperience] = useState(0);
  const [selectedProficiency, setSelectedProficiency] = useState('All');
  const [selectedDomain, setSelectedDomain] = useState('All');

  // Extract unique domains
  const allDomains = new Set();
  candidates.forEach(candidate => {
    candidate.domains?.forEach(domain => allDomains.add(domain));
  });
  const domains = ['All', ...Array.from(allDomains)];

  const handleSearch = () => {
    let filtered = candidates;

    // Search by skill name
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(candidate => {
        // Check if any technical skill matches
        const hasSkill = candidate.technical_skills?.some(skill =>
          skill.skill.toLowerCase().includes(searchLower)
        );
        // Or check candidate name
        const nameMatch = candidate.candidate_name.toLowerCase().includes(searchLower);
        return hasSkill || nameMatch;
      });
    }

    // Filter by experience
    if (minExperience > 0) {
      filtered = filtered.filter(candidate =>
        candidate.total_experience_years >= minExperience
      );
    }

    // Filter by proficiency
    if (selectedProficiency !== 'All') {
      filtered = filtered.filter(candidate =>
        candidate.technical_skills?.some(skill =>
          skill.proficiency === selectedProficiency
        )
      );
    }

    // Filter by domain
    if (selectedDomain !== 'All') {
      filtered = filtered.filter(candidate =>
        candidate.domains?.includes(selectedDomain)
      );
    }

    onFilteredResults(filtered);
  };

  const handleReset = () => {
    setSearchTerm('');
    setMinExperience(0);
    setSelectedProficiency('All');
    setSelectedDomain('All');
    onFilteredResults(candidates);
  };

  // Real-time search as user types
  React.useEffect(() => {
    handleSearch();
  }, [searchTerm, minExperience, selectedProficiency, selectedDomain]);

  return (
    <div className="search-filter">
      <div className="search-bar">
        <input
          type="text"
          placeholder="🔍 Search by skill or name (e.g., Python, AWS, Alice)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filters-row">
        <div className="filter-group">
          <label>Min Experience:</label>
          <select
            value={minExperience}
            onChange={(e) => setMinExperience(Number(e.target.value))}
          >
            <option value={0}>Any</option>
            <option value={2}>2+ years</option>
            <option value={5}>5+ years</option>
            <option value={10}>10+ years</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Proficiency:</label>
          <select
            value={selectedProficiency}
            onChange={(e) => setSelectedProficiency(e.target.value)}
          >
            <option value="All">All Levels</option>
            <option value="Expert">Expert</option>
            <option value="Advanced">Advanced</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Beginner">Beginner</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Domain:</label>
          <select
            value={selectedDomain}
            onChange={(e) => setSelectedDomain(e.target.value)}
          >
            {domains.map(domain => (
              <option key={domain} value={domain}>{domain}</option>
            ))}
          </select>
        </div>

        <button onClick={handleReset} className="reset-button">
          Reset Filters
        </button>
      </div>
    </div>
  );
}

export default SearchFilter;