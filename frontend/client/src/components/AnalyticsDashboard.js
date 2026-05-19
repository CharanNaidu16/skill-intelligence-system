import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ candidates, recommendations }) => {
  const [analytics, setAnalytics] = useState({
    totalCandidates: 0,
    avgExperience: 0,
    topSkills: [],
    domainDistribution: [],
    experienceDistribution: []
  });

  useEffect(() => {
    if (candidates && candidates.length > 0) {
      calculateAnalytics();
    }
  }, [candidates]);

  const calculateAnalytics = () => {
    const totalCandidates = candidates.length;
    
    // Calculate average experience
    const totalExperience = candidates.reduce((sum, candidate) => 
      sum + (candidate.total_experience_years || 0), 0);
    const avgExperience = (totalExperience / totalCandidates).toFixed(1);

    // Calculate top skills
    const skillCount = {};
    candidates.forEach(candidate => {
      if (candidate.technical_skills) {
        candidate.technical_skills.forEach(skill => {
          skillCount[skill.skill] = (skillCount[skill.skill] || 0) + 1;
        });
      }
    });
    const topSkills = Object.entries(skillCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([skill, count]) => ({ skill, count }));

    // Calculate domain distribution
    const domainCount = {};
    candidates.forEach(candidate => {
      if (candidate.domains) {
        candidate.domains.forEach(domain => {
          domainCount[domain] = (domainCount[domain] || 0) + 1;
        });
      }
    });
    const domainDistribution = Object.entries(domainCount)
      .sort((a, b) => b[1] - a[1])
      .map(([domain, count]) => ({ domain, count }));

    // Calculate experience distribution
    const experienceRanges = {
      '0-2 years': 0,
      '3-5 years': 0,
      '6-10 years': 0,
      '10+ years': 0
    };
    candidates.forEach(candidate => {
      const years = candidate.total_experience_years || 0;
      if (years <= 2) experienceRanges['0-2 years']++;
      else if (years <= 5) experienceRanges['3-5 years']++;
      else if (years <= 10) experienceRanges['6-10 years']++;
      else experienceRanges['10+ years']++;
    });
    const experienceDistribution = Object.entries(experienceRanges)
      .map(([range, count]) => ({ range, count }));

    setAnalytics({
      totalCandidates,
      avgExperience,
      topSkills,
      domainDistribution,
      experienceDistribution
    });
  };

  return (
    <div className="analytics-dashboard">
      <h2>Analytics Dashboard</h2>
      
      <div className="analytics-grid">
        {/* Summary Cards */}
        <div className="analytics-card summary-card">
          <h3>Summary</h3>
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-number">{analytics.totalCandidates}</span>
              <span className="stat-label">Total Candidates</span>
            </div>
            <div className="stat">
              <span className="stat-number">{analytics.avgExperience}</span>
              <span className="stat-label">Avg Experience (years)</span>
            </div>
          </div>
        </div>

        {/* Top Skills */}
        <div className="analytics-card">
          <h3>Top Skills</h3>
          <div className="skills-chart">
            {analytics.topSkills.map((item, index) => (
              <div key={index} className="skill-bar">
                <span className="skill-name">{item.skill}</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill"
                    style={{ width: `${(item.count / analytics.totalCandidates) * 100}%` }}
                  ></div>
                  <span className="skill-count">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Domain Distribution */}
        <div className="analytics-card">
          <h3>Domain Distribution</h3>
          <div className="domain-list">
            {analytics.domainDistribution.map((item, index) => (
              <div key={index} className="domain-item">
                <span className="domain-name">{item.domain}</span>
                <span className="domain-count">{item.count} candidates</span>
              </div>
            ))}
          </div>
        </div>

        {/* Experience Distribution */}
        <div className="analytics-card">
          <h3>Experience Distribution</h3>
          <div className="experience-chart">
            {analytics.experienceDistribution.map((item, index) => (
              <div key={index} className="experience-bar">
                <span className="experience-range">{item.range}</span>
                <div className="bar-container">
                  <div 
                    className="bar-fill"
                    style={{ width: `${(item.count / analytics.totalCandidates) * 100}%` }}
                  ></div>
                  <span className="experience-count">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations Analytics */}
      {recommendations && (
        <div className="analytics-card">
          <h3>Latest Recommendations</h3>
          <div className="recommendations-summary">
            <p>Found {recommendations.length} matching candidates</p>
            {recommendations.length > 0 && (
              <div className="top-match">
                <strong>Top Match:</strong> {recommendations[0].candidate_name} 
                ({recommendations[0].match_percentage}% match)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;