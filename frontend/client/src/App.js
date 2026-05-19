import React, { useState, useEffect } from 'react';
import { uploadResume, getCandidates, getRecommendations, updateCandidate, searchCandidates, bulkDeleteCandidates, exportCandidates } from './services/api';
import ComparisonView from './components/ComparisonView';
import SearchFilter from './components/SearchFilter';
import ExplanationModal from './components/ExplanationModal';
import ContactPage from './components/ContactPage';
import './App.css';

function App() {
const [candidates, setCandidates] = useState([]);
const [filteredCandidates, setFilteredCandidates] = useState([]);
const [recommendations, setRecommendations] = useState(null);
const [loading, setLoading] = useState(false);
const [activeTab, setActiveTab] = useState('upload');
const [uploadMessage, setUploadMessage] = useState('');
// Comparison state
const [selectedCandidates, setSelectedCandidates] = useState([]);
const [showComparison, setShowComparison] = useState(false);
// Explanation state
const [showExplanation, setShowExplanation] = useState(false);
const [selectedRecommendation, setSelectedRecommendation] = useState(null);
// Contact state
const [showContact, setShowContact] = useState(false);
const [selectedCandidate, setSelectedCandidate] = useState(null);
// Expanded skills state
const [expandedSkills, setExpandedSkills] = useState({});
// Role requirements
const [roleName, setRoleName] = useState('');
const [requiredSkills, setRequiredSkills] = useState('');
const [preferredSkills, setPreferredSkills] = useState('');
const [minExperience, setMinExperience] = useState(0);
// Job description state
const [jobDescription, setJobDescription] = useState('');
const [matchingMode, setMatchingMode] = useState('manual'); // 'manual' or 'description'
// Bulk operations
const [bulkMode, setBulkMode] = useState(false);
const [bulkSelected, setBulkSelected] = useState([]);
// Advanced search
const [searchFilters, setSearchFilters] = useState({
  skill: '',
  min_experience: '',
  max_experience: '',
  location: '',
  status: '',
  is_favorite: null
});
const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
// Edit candidate
const [editingCandidate, setEditingCandidate] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
// Bulk upload
const [bulkUploadProgress, setBulkUploadProgress] = useState({ total: 0, processed: 0, errors: [] });
const [bulkUploading, setBulkUploading] = useState(false);
useEffect(() => {
loadCandidates();
}, []);
useEffect(() => {
setFilteredCandidates(candidates);
}, [candidates]);
const loadCandidates = async () => {
try {
const data = await getCandidates();
setCandidates(data.candidates);
} catch (error) {
console.error('Error loading candidates:', error);
}
};
const handleFileUpload = async (event) => {
const files = Array.from(event.target.files);
if (!files || files.length === 0) return;

if (files.length === 1) {
  // Single file upload
  const file = files[0];
  setLoading(true);
  setUploadMessage('');
  
  try {
    const result = await uploadResume(file);
    setUploadMessage(`✅ Successfully processed resume for ${result.candidate_name}! Found ${result.technical_skills_count} technical skills.`);
    await loadCandidates();
    setTimeout(() => setActiveTab('candidates'), 1500);
  } catch (error) {
    setUploadMessage(`❌ Error: ${error.response?.data?.detail || error.message}`);
  } finally {
    setLoading(false);
  }
} else {
  // Bulk upload
  handleBulkUpload(files);
}
};

const handleBulkUpload = async (files) => {
setBulkUploading(true);
setUploadMessage('');
setBulkUploadProgress({ total: files.length, processed: 0, errors: [] });

const results = [];
const errors = [];

for (let i = 0; i < files.length; i++) {
  const file = files[i];
  
  try {
    const result = await uploadResume(file);
    results.push(result);
    setBulkUploadProgress(prev => ({ 
      ...prev, 
      processed: prev.processed + 1 
    }));
  } catch (error) {
    const errorMsg = `${file.name}: ${error.response?.data?.detail || error.message}`;
    errors.push(errorMsg);
    setBulkUploadProgress(prev => ({ 
      ...prev, 
      processed: prev.processed + 1,
      errors: [...prev.errors, errorMsg]
    }));
  }
  
  // Small delay to prevent overwhelming the server
  await new Promise(resolve => setTimeout(resolve, 100));
}

const successCount = results.length;
const errorCount = errors.length;

if (successCount > 0) {
  setUploadMessage(`✅ Successfully processed ${successCount} resume(s)! ${errorCount > 0 ? `${errorCount} failed.` : ''}`);
  await loadCandidates();
  setTimeout(() => setActiveTab('candidates'), 1500);
} else {
  setUploadMessage(`❌ All ${files.length} uploads failed. Check file formats and try again.`);
}

setBulkUploading(false);
setBulkUploadProgress({ total: 0, processed: 0, errors: [] });
};
const handleGetRecommendations = async () => {
if (matchingMode === 'manual' && (!roleName || !requiredSkills)) {
alert('Please fill in role name and required skills');
return;
}
if (matchingMode === 'description' && !jobDescription.trim()) {
alert('Please paste a job description');
return;
}

setLoading(true);
try {
  let requirements;
  
  if (matchingMode === 'description') {
    // Use job description to extract requirements
    requirements = {
      job_description: jobDescription,
      mode: 'description'
    };
  } else {
    // Use manual requirements
    requirements = {
      role_name: roleName,
      required_skills: requiredSkills.split(',').map(s => s.trim()),
      preferred_skills: preferredSkills ? preferredSkills.split(',').map(s => s.trim()) : [],
      min_experience_years: parseInt(minExperience) || 0,
      mode: 'manual'
    };
  }

  const result = await getRecommendations(requirements);
  setRecommendations(result);
  setActiveTab('results');
} catch (error) {
  alert('Error: ' + (error.response?.data?.detail || error.message));
} finally {
  setLoading(false);
}
};
const toggleCandidateSelection = (candidateName) => {
if (selectedCandidates.includes(candidateName)) {
setSelectedCandidates(selectedCandidates.filter(c => c !== candidateName));
} else {
setSelectedCandidates([...selectedCandidates, candidateName]);
}
};
const handleShowExplanation = (recommendation) => {
setSelectedRecommendation(recommendation);
setShowExplanation(true);
};
const handleShowContact = (candidate) => {
setSelectedCandidate(candidate);
setShowContact(true);
};

const toggleSkillsExpansion = (candidateName) => {
setExpandedSkills(prev => ({
  ...prev,
  [candidateName]: !prev[candidateName]
}));
};

const resetMatchingForm = () => {
setRoleName('');
setRequiredSkills('');
setPreferredSkills('');
setMinExperience(0);
setJobDescription('');
setMatchingMode('manual');
setRecommendations(null);
};

const toggleBulkMode = () => {
setBulkMode(!bulkMode);
setBulkSelected([]);
if (bulkMode) {
  setSelectedCandidates([]);
}
};

const toggleBulkSelection = (candidateName) => {
if (bulkSelected.includes(candidateName)) {
  setBulkSelected(bulkSelected.filter(name => name !== candidateName));
} else {
  setBulkSelected([...bulkSelected, candidateName]);
}
};

const handleBulkDelete = async () => {
if (bulkSelected.length === 0) {
  alert('Please select candidates to delete');
  return;
}

if (window.confirm(`Delete ${bulkSelected.length} candidates? This cannot be undone.`)) {
  try {
    await bulkDeleteCandidates(bulkSelected);
    setBulkSelected([]);
    await loadCandidates();
    alert(`Successfully deleted ${bulkSelected.length} candidates`);
  } catch (error) {
    alert('Error deleting candidates: ' + error.message);
  }
}
};

const handleExportCandidates = async () => {
try {
  const data = await exportCandidates();
  const blob = new Blob([JSON.stringify(data.candidates, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `candidates_export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
} catch (error) {
  alert('Error exporting candidates: ' + error.message);
}
};

const handleAdvancedSearch = async () => {
try {
  const data = await searchCandidates(searchFilters);
  setFilteredCandidates(data.candidates);
} catch (error) {
  console.error('Search error:', error);
}
};

const handleUpdateCandidate = async (updates) => {
if (!editingCandidate) return;

try {
  await updateCandidate(editingCandidate.candidate_name, updates);
  await loadCandidates();
  setShowEditModal(false);
  setEditingCandidate(null);
} catch (error) {
  alert('Error updating candidate: ' + error.message);
}
};

const handleEditCandidate = (candidate) => {
setEditingCandidate(candidate);
setShowEditModal(true);
};

const toggleFavorite = async (candidate) => {
try {
  await updateCandidate(candidate.candidate_name, { 
    is_favorite: !candidate.is_favorite 
  });
  await loadCandidates();
} catch (error) {
  alert('Error updating favorite status: ' + error.message);
}
};

const updateCandidateStatus = async (candidate, newStatus) => {
try {
  await updateCandidate(candidate.candidate_name, { status: newStatus });
  await loadCandidates();
} catch (error) {
  alert('Error updating status: ' + error.message);
}
};
return (
<div className="App">
<header className="App-header">
<h1>🎯 AI Skill Intelligence System</h1>
<p>AI-Powered Workforce Staffing Recommendations</p>
</header>
  <nav className="tabs">
    <button 
      className={activeTab === 'upload' ? 'active' : ''} 
      onClick={() => setActiveTab('upload')}
    >
      📄 Upload Resumes
    </button>
    <button 
      className={activeTab === 'candidates' ? 'active' : ''} 
      onClick={() => setActiveTab('candidates')}
    >
      👥 Candidates ({candidates.length})
    </button>
    <button 
      className={activeTab === 'match' ? 'active' : ''} 
      onClick={() => setActiveTab('match')}
    >
      🔍 Find Matches
    </button>
    {recommendations && (
      <button 
        className={activeTab === 'results' ? 'active' : ''} 
        onClick={() => setActiveTab('results')}
      >
        ⭐ Results
      </button>
    )}
  </nav>

  <main className="content">
    {activeTab === 'upload' && (
      <div className="section">
        <h2>Upload Resume(s)</h2>
        <div className="upload-area">
          <input 
            type="file" 
            accept=".pdf,.txt" 
            onChange={handleFileUpload}
            multiple
            disabled={loading || bulkUploading}
            id="file-input"
          />
          <label htmlFor="file-input" className="file-label">
            {loading || bulkUploading ? '⏳ Processing...' : '📁 Choose File(s)'}
          </label>
          <p className="upload-hint">Select one or multiple PDF/TXT files for bulk upload</p>
        </div>
        
        {(loading || bulkUploading) && (
          <div className="loading-spinner">
            <span>🔄</span>
            {bulkUploading ? (
              <span>Processing files... ({bulkUploadProgress.processed}/{bulkUploadProgress.total})</span>
            ) : (
              <span>Processing...</span>
            )}
          </div>
        )}
        
        {bulkUploading && bulkUploadProgress.total > 0 && (
          <div className="bulk-upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(bulkUploadProgress.processed / bulkUploadProgress.total) * 100}%` }}
              ></div>
            </div>
            <p>{bulkUploadProgress.processed} of {bulkUploadProgress.total} files processed</p>
            {bulkUploadProgress.errors.length > 0 && (
              <div className="bulk-errors">
                <details>
                  <summary>⚠️ {bulkUploadProgress.errors.length} error(s)</summary>
                  <ul>
                    {bulkUploadProgress.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </details>
              </div>
            )}
          </div>
        )}
        {uploadMessage && (
          <div className={`message ${uploadMessage.includes('✅') ? 'success' : 'error'}`}>
            {uploadMessage}
          </div>
        )}
        <p className="hint">Supported formats: PDF, TXT | AI will extract skills and contact info automatically</p>
      </div>
    )}

    {activeTab === 'candidates' && (
      <div className="section">
        <div className="candidates-header">
          <h2>All Candidates</h2>
          
          {/* Action Buttons */}
          <div className="header-actions">
            <button 
              onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              className="secondary-button"
            >
              🔍 Advanced Search
            </button>
            
            <button 
              onClick={toggleBulkMode}
              className={bulkMode ? 'secondary-button active' : 'secondary-button'}
            >
              {bulkMode ? '✓ Exit Bulk' : '📦 Bulk Actions'}
            </button>
            
            <button onClick={handleExportCandidates} className="secondary-button">
              📊 Export Data
            </button>
          </div>
        </div>

        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div className="advanced-search-panel">
            <h3>Advanced Search & Filters</h3>
            <div className="search-filters">
              <input
                type="text"
                placeholder="Search by skill (e.g., Python, React)"
                value={searchFilters.skill}
                onChange={(e) => setSearchFilters({...searchFilters, skill: e.target.value})}
              />
              <input
                type="number"
                placeholder="Min experience (years)"
                value={searchFilters.min_experience}
                onChange={(e) => setSearchFilters({...searchFilters, min_experience: e.target.value})}
              />
              <input
                type="number"
                placeholder="Max experience (years)"
                value={searchFilters.max_experience}
                onChange={(e) => setSearchFilters({...searchFilters, max_experience: e.target.value})}
              />
              <input
                type="text"
                placeholder="Location"
                value={searchFilters.location}
                onChange={(e) => setSearchFilters({...searchFilters, location: e.target.value})}
              />
              <select
                value={searchFilters.status}
                onChange={(e) => setSearchFilters({...searchFilters, status: e.target.value})}
              >
                <option value="">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interviewed">Interviewed</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
              <select
                value={searchFilters.is_favorite === null ? '' : searchFilters.is_favorite.toString()}
                onChange={(e) => setSearchFilters({...searchFilters, is_favorite: e.target.value === '' ? null : e.target.value === 'true'})}
              >
                <option value="">All Candidates</option>
                <option value="true">Favorites Only</option>
                <option value="false">Non-Favorites</option>
              </select>
              
              <div className="search-buttons">
                <button onClick={handleAdvancedSearch} className="primary-button">
                  🔍 Search
                </button>
                <button 
                  onClick={() => {
                    setSearchFilters({skill: '', min_experience: '', max_experience: '', location: '', status: '', is_favorite: null});
                    setFilteredCandidates(candidates);
                  }}
                  className="secondary-button"
                >
                  🔄 Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions Panel */}
        {bulkMode && (
          <div className="bulk-actions-panel">
            <div className="bulk-info">
              Selected: {bulkSelected.length} candidates
            </div>
            <div className="bulk-buttons">
              <button 
                onClick={handleBulkDelete}
                className="delete-button"
                disabled={bulkSelected.length === 0}
              >
                🗑️ Delete Selected
              </button>
              <button 
                onClick={() => setBulkSelected(candidates.map(c => c.candidate_name))}
                className="secondary-button"
              >
                ✅ Select All
              </button>
              <button 
                onClick={() => setBulkSelected([])}
                className="secondary-button"
              >
                ❌ Clear Selection
              </button>
            </div>
          </div>
        )}
        
        {candidates.length > 0 && !showAdvancedSearch && (
          <SearchFilter 
            candidates={candidates}
            onFilteredResults={setFilteredCandidates}
          />
        )}
        
        {candidates.length === 0 ? (
          <div className="empty-state">
            <p>📭 No candidates yet</p>
            <p>Upload some resumes to get started!</p>
            <button onClick={() => setActiveTab('upload')} className="primary-button">
              Upload Resume
            </button>
          </div>
        ) : (
          <>
            <div className="results-info">
              Showing {filteredCandidates.length} of {candidates.length} candidates
            </div>
            <div className="candidates-grid">
              {filteredCandidates.map((candidate, index) => (
                <div key={index} className={`candidate-card ${candidate.is_favorite ? 'favorite' : ''} ${candidate.status}`}>
                  <div className="card-header">
                    {bulkMode ? (
                      <input 
                        type="checkbox"
                        checked={bulkSelected.includes(candidate.candidate_name)}
                        onChange={() => toggleBulkSelection(candidate.candidate_name)}
                        className="bulk-checkbox"
                      />
                    ) : (
                      <input 
                        type="checkbox"
                        checked={selectedCandidates.includes(candidate.candidate_name)}
                        onChange={() => toggleCandidateSelection(candidate.candidate_name)}
                        className="candidate-checkbox"
                      />
                    )}
                    
                    <h3>{candidate.candidate_name}</h3>
                    
                    <div className="candidate-actions">
                      <button 
                        className={`favorite-btn ${candidate.is_favorite ? 'active' : ''}`}
                        onClick={() => toggleFavorite(candidate)}
                        title={candidate.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        {candidate.is_favorite ? '⭐' : '☆'}
                      </button>
                      
                      <button 
                        className="edit-btn"
                        onClick={() => handleEditCandidate(candidate)}
                        title="Edit candidate"
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                  
                  <div className="candidate-meta">
                    <span className={`status-badge ${candidate.status || 'new'}`}>
                      {(candidate.status || 'new').toUpperCase()}
                    </span>
                    {candidate.salary_expectation && (
                      <span className="salary-badge">💰 {candidate.salary_expectation}</span>
                    )}
                  </div>
                  
                  <p><strong>Experience:</strong> {candidate.total_experience_years} years</p>
                  <p><strong>Technical Skills:</strong> {candidate.technical_skills?.length || 0}</p>
                  {candidate.contact_info?.location && (
                    <p><strong>Location:</strong> {candidate.contact_info.location}</p>
                  )}
                  
                  {candidate.notes && (
                    <p><strong>Notes:</strong> {candidate.notes}</p>
                  )}
                  
                  <div className="skills-preview">
                    {candidate.technical_skills?.slice(0, expandedSkills[candidate.candidate_name] ? candidate.technical_skills.length : 6).map((skill, i) => (
                      <span key={i} className="skill-tag">
                        {skill.skill} <span className="proficiency">({skill.proficiency})</span>
                      </span>
                    ))}
                    {candidate.technical_skills?.length > 6 && (
                      <button 
                        className="skill-tag more clickable" 
                        onClick={() => toggleSkillsExpansion(candidate.candidate_name)}
                      >
                        {expandedSkills[candidate.candidate_name] 
                          ? 'Show less' 
                          : `+${candidate.technical_skills.length - 6} more`
                        }
                      </button>
                    )}
                  </div>
                  
                  <div className="candidate-card-actions">
                    <button 
                      className="contact-button"
                      onClick={() => handleShowContact(candidate)}
                    >
                      📞 Contact
                    </button>
                    
                    <select 
                      value={candidate.status || 'new'}
                      onChange={(e) => updateCandidateStatus(candidate, e.target.value)}
                      className="status-select"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="interviewed">Interviewed</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )}

    {activeTab === 'match' && (
      <div className="section">
        <h2>Find Matching Candidates</h2>
        {candidates.length === 0 ? (
          <div className="empty-state">
            <p>⚠️ No candidates available</p>
            <p>Please upload resumes first before defining roles</p>
            <button onClick={() => setActiveTab('upload')} className="primary-button">
              Upload Resumes
            </button>
          </div>
        ) : (
          <div className="matching-container">
            {/* Mode Selection */}
            <div className="mode-selector">
              <h3>Choose Matching Method:</h3>
              <div className="mode-tabs">
                <button 
                  className={matchingMode === 'description' ? 'mode-tab active' : 'mode-tab'}
                  onClick={() => setMatchingMode('description')}
                >
                  📝 Job Description
                </button>
                <button 
                  className={matchingMode === 'manual' ? 'mode-tab active' : 'mode-tab'}
                  onClick={() => setMatchingMode('manual')}
                >
                  ⚙️ Manual Requirements
                </button>
              </div>
            </div>

            {/* Job Description Mode */}
            {matchingMode === 'description' && (
              <div className="form">
                <div className="form-group">
                  <label>Job Description:</label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the complete job description here... 

Example:
We are looking for a Senior Full Stack Developer with 5+ years of experience.

Required Skills:
- React, Node.js, TypeScript
- AWS cloud services
- Database design (MySQL/PostgreSQL)
- RESTful API development

Preferred:
- Docker, Kubernetes
- CI/CD pipelines
- Agile methodology"
                    rows={12}
                    className="job-description-textarea"
                  />
                  <small>Our AI will automatically extract role requirements, skills, and experience from this description</small>
                </div>
              </div>
            )}

            {/* Manual Requirements Mode */}
            {matchingMode === 'manual' && (
              <div className="form">
                <div className="form-group">
                  <label>Role Name:</label>
                  <input 
                    type="text" 
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    placeholder="e.g., Senior ML Engineer"
                  />
                </div>

                <div className="form-group">
                  <label>Required Skills (comma-separated):</label>
                  <input 
                    type="text" 
                    value={requiredSkills}
                    onChange={(e) => setRequiredSkills(e.target.value)}
                    placeholder="e.g., Python, Machine Learning, AWS"
                  />
                  <small>These skills are must-haves</small>
                </div>

                <div className="form-group">
                  <label>Preferred Skills (comma-separated):</label>
                  <input 
                    type="text" 
                    value={preferredSkills}
                    onChange={(e) => setPreferredSkills(e.target.value)}
                    placeholder="e.g., Docker, Kubernetes"
                  />
                  <small>Nice to have, but not required</small>
                </div>

                <div className="form-group">
                  <label>Minimum Experience (years):</label>
                  <input 
                    type="number" 
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
            )}

            <button 
              onClick={handleGetRecommendations}
              disabled={loading}
              className="primary-button"
            >
              {loading ? '🔄 Analyzing...' : '🚀 Find Best Matches'}
            </button>
            
            <button 
              onClick={resetMatchingForm}
              className="reset-button"
              disabled={loading}
            >
              🔄 Reset Form
            </button>
          </div>
        )}
      </div>
    )}

    {activeTab === 'results' && recommendations && (
      <div className="section">
        <h2>Recommendations for: {recommendations.role_name}</h2>
        <p className="subtitle">Analyzed {recommendations.total_candidates} candidates</p>
        
        <div className="recommendations-list">
          {recommendations.recommendations.map((rec, index) => (
            <div key={index} className={`recommendation-card rank-${index + 1}`}>
              <div className="rank-badge">#{index + 1}</div>
              <h3>{rec.candidate_name}</h3>
              
              <div className="match-score">
                <div className="score-bar">
                  <div 
                    className="score-fill" 
                    style={{
                      width: `${rec.match_percentage}%`,
                      background: rec.match_percentage >= 75 ? '#4caf50' : 
                                 rec.match_percentage >= 50 ? '#ff9800' : '#f44336'
                    }}
                  ></div>
                </div>
                <span className="score-text">{rec.match_percentage}% Match</span>
              </div>

              <p className="explanation">{rec.explanation}</p>

              <div className="card-actions">
                <button 
                  className="explain-button"
                  onClick={() => handleShowExplanation(rec)}
                >
                  🔍 Why Recommended?
                </button>
                <button 
                  className="contact-button-inline"
                  onClick={() => {
                    const candidate = candidates.find(c => c.candidate_name === rec.candidate_name);
                    if (candidate) handleShowContact(candidate);
                  }}
                >
                  📞 Contact
                </button>
              </div>

              <div className="skills-breakdown">
                <div>
                  <strong>✅ Required Skills: {rec.required_skills_matched}/{rec.required_skills_total}</strong>
                  {rec.required_matches.length > 0 && (
                    <div className="matched-skills">
                      {rec.required_matches.map((skill, i) => (
                        <span key={i} className="skill-tag matched">
                          ✓ {skill.skill} - {skill.proficiency} ({skill.years}y)
                        </span>
                      ))}
                    </div>
                  )}
                  {rec.required_missing.length > 0 && (
                    <div className="missing-skills">
                      <strong>❌ Missing Required:</strong>
                      {rec.required_missing.map((skill, i) => (
                        <span key={i} className="skill-tag missing">
                          ✗ {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {rec.preferred_matches.length > 0 && (
                  <div>
                    <strong>➕ Bonus Skills:</strong>
                    <div className="matched-skills">
                      {rec.preferred_matches.map((skill, i) => (
                        <span key={i} className="skill-tag bonus">
                          + {skill.skill} ({skill.proficiency})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}

  </main>

  {/* Comparison Modal */}
  {selectedCandidates.length >= 2 && !showComparison && (
    <button 
      className="compare-button"
      onClick={() => setShowComparison(true)}
    >
      Compare {selectedCandidates.length} Candidates
    </button>
  )}

  {showComparison && (
    <ComparisonView
      candidates={candidates}
      selectedNames={selectedCandidates}
      onClose={() => setShowComparison(false)}
    />
  )}

  {/* Explanation Modal */}
  {showExplanation && selectedRecommendation && (
    <ExplanationModal
      recommendation={selectedRecommendation}
      roleRequirements={{
        role_name: recommendations.role_name
      }}
      onClose={() => setShowExplanation(false)}
    />
  )}

  {/* Contact Modal */}
  {showContact && selectedCandidate && (
    <ContactPage
      candidate={selectedCandidate}
      onClose={() => setShowContact(false)}
    />
  )}

  {/* Edit Candidate Modal */}
  {showEditModal && editingCandidate && (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Edit Candidate: {editingCandidate.candidate_name}</h2>
          <button onClick={() => setShowEditModal(false)} className="close-btn">×</button>
        </div>
        
        <div className="modal-body">
          <div className="edit-form">
            <div className="form-group">
              <label>Notes:</label>
              <textarea
                value={editingCandidate.notes || ''}
                onChange={(e) => setEditingCandidate({...editingCandidate, notes: e.target.value})}
                placeholder="Add notes about this candidate..."
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label>Status:</label>
              <select
                value={editingCandidate.status || 'new'}
                onChange={(e) => setEditingCandidate({...editingCandidate, status: e.target.value})}
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="interviewed">Interviewed</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Salary Expectation:</label>
              <input
                type="text"
                value={editingCandidate.salary_expectation || ''}
                onChange={(e) => setEditingCandidate({...editingCandidate, salary_expectation: e.target.value})}
                placeholder="e.g., $80,000 - $100,000"
              />
            </div>
            
            <div className="form-group">
              <label>Total Experience (years):</label>
              <input
                type="number"
                value={editingCandidate.total_experience_years || 0}
                onChange={(e) => setEditingCandidate({...editingCandidate, total_experience_years: parseInt(e.target.value) || 0})}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={editingCandidate.is_favorite || false}
                  onChange={(e) => setEditingCandidate({...editingCandidate, is_favorite: e.target.checked})}
                />
                Mark as Favorite
              </label>
            </div>
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={() => handleUpdateCandidate({
              notes: editingCandidate.notes,
              status: editingCandidate.status,
              salary_expectation: editingCandidate.salary_expectation,
              total_experience_years: editingCandidate.total_experience_years,
              is_favorite: editingCandidate.is_favorite
            })}
            className="primary-button"
          >
            Save Changes
          </button>
          <button onClick={() => setShowEditModal(false)} className="secondary-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )}

  <footer className="footer">
    <p>Built with Azure OpenAI GPT-4 | FastAPI | React</p>
  </footer>
</div>
);
}
export default App;