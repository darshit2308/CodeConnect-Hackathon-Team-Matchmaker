import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import Card from '../../components/Card';
import './Admin.css';

export default function Admin() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get('/admin/stats').then(res => setStats(res.data)).catch(console.error);
  }, []);

  if (!stats) return <div className="page-container p-6">Loading dashboard...</div>;

  const maxSignups = Math.max(...stats.dailySignups.map(d => d.count));
  const maxSkills = Math.max(...stats.skillDistribution.map(d => d.count));

  return (
    <div className="admin-page hide-scrollbars">
      <div className="admin-header">
        <h2>Admin Overview</h2>
        <div className="ah-actions">
          <button className="btn btn-ghost">Export CSV</button>
          <button className="btn btn-primary">Refresh Data</button>
        </div>
      </div>

      <div className="admin-grid-top">
        <Card className="stat-card">
          <div className="sc-icon text-primary bg-primary-soft">US</div>
          <div className="sc-data">
            <div className="sc-val">{stats.totalUsers}</div>
            <div className="sc-lbl">Total Users</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="sc-icon text-accent bg-accent-soft">SW</div>
          <div className="sc-data">
            <div className="sc-val">{stats.totalSwipes}</div>
            <div className="sc-lbl">Total Swipes</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="sc-icon text-success bg-success-soft">MA</div>
          <div className="sc-data">
            <div className="sc-val">{stats.matches}</div>
            <div className="sc-lbl">Successful Matches</div>
          </div>
        </Card>
        <Card className="stat-card">
          <div className="sc-icon text-warning bg-warning-soft">RT</div>
          <div className="sc-data">
            <div className="sc-val">{stats.matchRate}</div>
            <div className="sc-lbl">Match Rate</div>
          </div>
        </Card>
      </div>

      <div className="admin-grid-charts">
        <Card>
          <h3 className="mb-4">New Signups (Last 7 Days)</h3>
          <div className="chart-wrapper">
            <svg viewBox="0 0 400 200" className="a-chart">
              {/* Background grid */}
              {[40, 80, 120, 160].map(y => (
                <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="var(--border2)" strokeDasharray="4" />
              ))}
              {/* Bars */}
              {stats.dailySignups.map((d, i) => {
                const h = (d.count / maxSignups) * 160;
                const x = i * 50 + 25;
                const y = 200 - h;
                return (
                  <g key={d.day}>
                    <rect x={x} y={y} width="30" height={h} fill="var(--primary)" rx="4" className="chart-bar" />
                    <text x={x+15} y="215" textAnchor="middle" className="c-label">{d.day}</text>
                    <text x={x+15} y={y-8} textAnchor="middle" className="c-val">{d.count}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        </Card>

        <Card>
          <h3 className="mb-4">Platform Skill Distribution</h3>
          <div className="chart-wrapper">
            <svg viewBox="0 0 400 200" className="a-chart">
              {stats.skillDistribution.map((d, i) => {
                const w = (d.count / maxSkills) * 200;
                const y = i * 45 + 20;
                return (
                  <g key={d.skill}>
                    <text x="0" y={y+18} className="c-label-y">{d.skill}</text>
                    <rect x="80" y={y} width={w} height="20" fill="url(#grad1)" rx="4" className="chart-bar-horizontal" />
                    <text x={80+w+10} y={y+15} className="c-val-inline">{d.count}</text>
                  </g>
                );
              })}
              <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--primary)" />
                  <stop offset="100%" stopColor="var(--accent)" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </Card>
      </div>
    </div>
  );
}
