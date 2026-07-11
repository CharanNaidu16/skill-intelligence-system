import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { statusLabel, STATUS_OPTIONS } from '../components/StatusBadge.jsx';
import { IconChart } from '../components/Icons.jsx';

// Chart ink (validated against the light surface): single-hue indigo for
// magnitude, hairline grid, muted axis labels.
const SERIES_BLUE = '#4f46e5';
const GRID = '#e6e7eb';
const MUTED = '#878d98';

// Reserved status colors — always paired with a visible label + count.
const STATUS_COLORS = {
  new: '#98a2b3',
  contacted: '#4f46e5',
  interviewed: '#dc8a06',
  hired: '#079455',
  rejected: '#d92d20',
};

const tooltipStyle = {
  background: '#ffffff',
  border: '1px solid #e4e6ea',
  borderRadius: 8,
  fontSize: 13,
  color: '#1b1e25',
  boxShadow: '0 6px 18px rgba(16,24,40,0.12)',
};

function StatTile({ label, value, hint }) {
  return (
    <div className="stat-tile">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

function AnalyticsPage({ candidates }) {
  const stats = useMemo(() => {
    const total = candidates.length;
    const avgExperience = total
      ? (candidates.reduce((sum, c) => sum + (c.total_experience_years || 0), 0) / total).toFixed(1)
      : '0';
    const favorites = candidates.filter((c) => c.is_favorite).length;
    const hired = candidates.filter((c) => c.status === 'hired').length;

    const skillCount = {};
    candidates.forEach((c) =>
      (c.technical_skills || []).forEach((s) => {
        skillCount[s.skill] = (skillCount[s.skill] || 0) + 1;
      })
    );
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([skill, count]) => ({ skill, count }));

    const ranges = [
      { range: '0–2 yrs', min: 0, max: 2 },
      { range: '3–5 yrs', min: 3, max: 5 },
      { range: '6–10 yrs', min: 6, max: 10 },
      { range: '10+ yrs', min: 11, max: Infinity },
    ];
    const experience = ranges.map(({ range, min, max }) => ({
      range,
      count: candidates.filter((c) => {
        const y = c.total_experience_years || 0;
        return y >= min && y <= max;
      }).length,
    }));

    const pipeline = STATUS_OPTIONS.map(({ value }) => ({
      status: value,
      count: candidates.filter((c) => (c.status || 'new') === value).length,
    }));

    return { total, avgExperience, favorites, hired, topSkills, experience, pipeline };
  }, [candidates]);

  if (candidates.length === 0) {
    return (
      <section className="page">
        <div className="empty-state">
          <IconChart width={32} height={32} />
          <h3>No data yet</h3>
          <p>Analytics appear once candidates are uploaded.</p>
        </div>
      </section>
    );
  }

  const maxPipeline = Math.max(...stats.pipeline.map((p) => p.count), 1);

  return (
    <section className="page">
      <header className="page-header">
        <h2>Analytics</h2>
        <p>Overview of the current candidate pool.</p>
      </header>

      <div className="stat-row">
        <StatTile label="Total candidates" value={stats.total} />
        <StatTile label="Avg experience" value={stats.avgExperience} hint="years" />
        <StatTile label="Favorites" value={stats.favorites} />
        <StatTile label="Hired" value={stats.hired} />
      </div>

      <div className="analytics-grid">
        <div className="panel">
          <h3 className="panel-title">Top skills</h3>
          <p className="panel-sub">Candidates holding each skill</p>
          <ResponsiveContainer width="100%" height={Math.max(stats.topSkills.length * 36, 120)}>
            <BarChart data={stats.topSkills} layout="vertical" margin={{ left: 8, right: 32 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="skill"
                width={110}
                tick={{ fill: '#4d5259', fontSize: 12.5 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(79,70,229,0.06)' }} />
              <Bar dataKey="count" name="Candidates" fill={SERIES_BLUE} barSize={18} radius={[0, 4, 4, 0]}>
                <LabelList dataKey="count" position="right" style={{ fill: MUTED, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="panel-title">Experience distribution</h3>
          <p className="panel-sub">Candidates by total years of experience</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.experience} margin={{ top: 16, right: 8, left: -16 }}>
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="range" tick={{ fill: MUTED, fontSize: 12 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: MUTED, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(79,70,229,0.06)' }} />
              <Bar dataKey="count" name="Candidates" fill={SERIES_BLUE} barSize={36} radius={[4, 4, 0, 0]}>
                <LabelList dataKey="count" position="top" style={{ fill: MUTED, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel">
          <h3 className="panel-title">Pipeline</h3>
          <p className="panel-sub">Candidates by hiring status</p>
          <div className="pipeline-list">
            {stats.pipeline.map(({ status, count }) => (
              <div key={status} className="pipeline-row">
                <span className="pipeline-label">{statusLabel(status)}</span>
                <div className="pipeline-track">
                  <div
                    className="pipeline-fill"
                    style={{
                      width: `${(count / maxPipeline) * 100}%`,
                      background: STATUS_COLORS[status],
                    }}
                  />
                </div>
                <span className="pipeline-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AnalyticsPage;
