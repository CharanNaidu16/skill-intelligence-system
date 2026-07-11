import { useCallback, useEffect, useState } from 'react';
import { getCandidates } from './api/client.js';
import { ToastProvider } from './context/ToastContext.jsx';
import { IconLayers } from './components/Icons.jsx';
import UploadPage from './pages/UploadPage.jsx';
import CandidatesPage from './pages/CandidatesPage.jsx';
import MatchPage from './pages/MatchPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';

function AppShell() {
  const [candidates, setCandidates] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activeTab, setActiveTab] = useState('candidates');
  const [recommendations, setRecommendations] = useState(null);

  const loadCandidates = useCallback(async () => {
    try {
      const data = await getCandidates();
      setCandidates(data.candidates);
      setLoadError(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);

  const tabs = [
    { id: 'upload', label: 'Upload' },
    { id: 'candidates', label: 'Candidates', badge: loaded ? candidates.length : null },
    { id: 'match', label: 'Find matches' },
    ...(recommendations ? [{ id: 'results', label: 'Results' }] : []),
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div className="app">
      <header className="app-header">
        <div className="container header-inner">
          <div className="brand">
            <span className="brand-mark">
              <IconLayers width={18} height={18} />
            </span>
            <div>
              <h1>Skill Intelligence</h1>
              <p>AI-powered resume analysis &amp; candidate matching</p>
            </div>
          </div>
        </div>
        <nav className="container tab-nav" aria-label="Main">
          {tabs.map(({ id, label, badge }) => (
            <button
              key={id}
              className={activeTab === id ? 'tab active' : 'tab'}
              onClick={() => setActiveTab(id)}
            >
              {label}
              {badge !== null && badge !== undefined && <span className="tab-badge">{badge}</span>}
            </button>
          ))}
        </nav>
      </header>

      <main className="container app-main">
        {loadError && (
          <div className="banner banner-error">
            Could not reach the API. Make sure the backend is running, then{' '}
            <button className="link-btn" onClick={loadCandidates}>
              retry
            </button>
            .
          </div>
        )}

        {activeTab === 'upload' && <UploadPage onUploaded={loadCandidates} />}
        {activeTab === 'candidates' && (
          <CandidatesPage
            candidates={candidates}
            onReload={loadCandidates}
            onGoUpload={() => setActiveTab('upload')}
          />
        )}
        {activeTab === 'match' && (
          <MatchPage
            hasCandidates={candidates.length > 0}
            onResults={(result) => {
              setRecommendations(result);
              setActiveTab('results');
            }}
            onGoUpload={() => setActiveTab('upload')}
          />
        )}
        {activeTab === 'results' && recommendations && (
          <ResultsPage recommendations={recommendations} candidates={candidates} />
        )}
        {activeTab === 'analytics' && <AnalyticsPage candidates={candidates} />}
      </main>

      <footer className="app-footer">
        <div className="container">Skill Intelligence · FastAPI + React + LLM skill extraction</div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}
