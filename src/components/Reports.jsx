import React, { useState, useEffect } from 'react';
import { db } from '../supabaseClient';

export default function Reports({ addToast }) {
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredData, setHoveredData] = useState(null); // tooltip data

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    setLoading(true);
    const { data, error } = await db.getVolunteers();
    if (error) {
      addToast(error.message, 'error');
    } else {
      setVolunteers(data || []);
    }
    setLoading(false);
  };

  // 1. Data Aggregation: Causes distribution
  const getCausesData = () => {
    const causesCounts = {
      'Food Drives': 0,
      'Menstrual Hygiene Awareness': 0,
      'Clothing Distribution': 0,
      'Education': 0
    };

    volunteers.forEach(v => {
      if (Array.isArray(v.causes)) {
        v.causes.forEach(cause => {
          if (causesCounts[cause] !== undefined) {
            causesCounts[cause]++;
          }
        });
      }
    });

    return Object.keys(causesCounts).map(name => ({
      name,
      value: causesCounts[name]
    }));
  };

  // 2. Data Aggregation: Signups by Month (Last 6 Months: Jan - Jun 2026)
  const getMonthlyData = () => {
    // Standard months array for 2026
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const monthCounts = { Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0 };

    volunteers.forEach(v => {
      if (v.registered_at) {
        const date = new Date(v.registered_at);
        // Only count 2026 entries for standard graph
        if (date.getFullYear() === 2026) {
          const monthIndex = date.getMonth();
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const mName = monthNames[monthIndex];
          if (monthCounts[mName] !== undefined) {
            monthCounts[mName]++;
          }
        }
      }
    });

    return months.map(name => ({
      name,
      value: monthCounts[name]
    }));
  };

  // 3. Data Aggregation: Status Breakdown
  const getStatusData = () => {
    const statusCounts = { Pending: 0, Approved: 0, Active: 0, Inactive: 0 };
    volunteers.forEach(v => {
      if (statusCounts[v.status] !== undefined) {
        statusCounts[v.status]++;
      }
    });

    const total = volunteers.length || 1;
    return Object.keys(statusCounts).map(name => ({
      name,
      value: statusCounts[name],
      percentage: Math.round((statusCounts[name] / total) * 100)
    }));
  };

  const causesData = getCausesData();
  const monthlyData = getMonthlyData();
  const statusData = getStatusData();

  // Helper for Chart Rendering
  const maxCauseVal = Math.max(...causesData.map(d => d.value), 1);
  const maxMonthVal = Math.max(...monthlyData.map(d => d.value), 1);

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <div className="spinner" style={{ display: 'inline-block', width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse-soft 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: 'var(--text-muted)' }}>Aggregating NayePankh data metrics...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="dashboard-actions-header" style={{ marginBottom: '28px' }}>
        <div className="dashboard-title-group">
          <h2>Volunteer Analytics & Reports</h2>
          <p>Visual statistics detailing cause distribution, registration growth, and deployment status</p>
        </div>
      </div>

      <div className="reports-layout">
        {/* Cause Distribution Horizontal Bar Chart */}
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">Cause Distribution</h3>
              <p className="report-card-subtitle">Volunteer counts supporting each foundation focus area</p>
            </div>
          </div>

          <div className="chart-container">
            <svg className="chart-svg" viewBox="0 0 400 240">
              {/* Definitions for gradients */}
              <defs>
                <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="var(--sky-medium)" />
                  <stop offset="100%" stopColor="var(--indigo-medium)" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const xVal = 120 + p * 240;
                return (
                  <g key={idx}>
                    <line 
                      x1={xVal} y1="10" x2={xVal} y2="190" 
                      className="chart-grid-line" 
                    />
                    <text 
                      x={xVal} y="205" 
                      textAnchor="middle" 
                      className="chart-label-text"
                    >
                      {Math.round(p * maxCauseVal)}
                    </text>
                  </g>
                );
              })}

              {/* Base Axis */}
              <line x1="120" y1="10" x2="120" y2="190" className="chart-axis-line" />

              {/* Bars */}
              {causesData.map((d, idx) => {
                const yPos = 20 + idx * 45;
                const barWidth = d.value > 0 ? (d.value / maxCauseVal) * 240 : 2;
                
                return (
                  <g key={d.name}>
                    {/* Category Label */}
                    <text 
                      x="110" y={yPos + 18} 
                      textAnchor="end" 
                      className="chart-label-text"
                      style={{ fontWeight: 600 }}
                    >
                      {d.name.length > 18 ? d.name.substring(0, 16) + '..' : d.name}
                    </text>

                    {/* Bar */}
                    <rect 
                      x="120" y={yPos + 4} 
                      width={barWidth} height="22" 
                      rx="4" ry="4"
                      fill="url(#barGrad)"
                      className="chart-bar"
                      onMouseEnter={(e) => {
                        const rect = e.target.getBoundingClientRect();
                        setHoveredData({
                          name: d.name,
                          value: `${d.value} Volunteers`,
                          x: rect.left + window.scrollX + barWidth / 2,
                          y: rect.top + window.scrollY - 35
                        });
                      }}
                      onMouseLeave={() => setHoveredData(null)}
                    />

                    {/* Value Badge next to bar */}
                    {d.value > 0 && (
                      <text 
                        x={125 + barWidth} y={yPos + 19}
                        fill="var(--text-muted)"
                        fontSize="10"
                        fontWeight="600"
                      >
                        {d.value}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Monthly Registration Trends (Smooth Area Chart) */}
        <div className="report-card">
          <div className="report-card-header">
            <div>
              <h3 className="report-card-title">Registration Activity</h3>
              <p className="report-card-subtitle">Monthly volunteer sign-up volume in 2026</p>
            </div>
          </div>

          <div className="chart-container">
            <svg className="chart-svg" viewBox="0 0 400 240">
              <defs>
                <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="var(--sky-medium)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--sky-medium)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                const yVal = 180 - p * 150;
                return (
                  <g key={idx}>
                    <line 
                      x1="40" y1={yVal} x2="380" y2={yVal} 
                      className="chart-grid-line" 
                    />
                    <text 
                      x="25" y={yVal + 4} 
                      textAnchor="end" 
                      className="chart-label-text"
                    >
                      {Math.round(p * maxMonthVal)}
                    </text>
                  </g>
                );
              })}

              <line x1="40" y1="180" x2="380" y2="180" className="chart-axis-line" />

              {/* Compute coordinates for area path */}
              {(() => {
                const points = monthlyData.map((d, idx) => {
                  const x = 40 + idx * 68;
                  const y = 180 - (d.value / maxMonthVal) * 150;
                  return { x, y, name: d.name, value: d.value };
                });

                // Generate path definition string
                // M starting node, then lineTo
                let linePath = `M ${points[0].x} ${points[0].y}`;
                for (let i = 1; i < points.length; i++) {
                  linePath += ` L ${points[i].x} ${points[i].y}`;
                }

                // Generate filled area path definition
                const areaPath = `${linePath} L ${points[points.length - 1].x} 180 L ${points[0].x} 180 Z`;

                return (
                  <g>
                    {/* Gradient Area Fill */}
                    <path d={areaPath} fill="url(#areaGrad)" />

                    {/* Outer Stroke Path Line */}
                    <path 
                      d={linePath} 
                      fill="none" 
                      stroke="var(--sky-medium)" 
                      strokeWidth="3" 
                      strokeLinecap="round"
                    />

                    {/* Nodes and Labels */}
                    {points.map((pt, idx) => (
                      <g key={idx}>
                        <circle 
                          cx={pt.x} cy={pt.y} 
                          r="5" 
                          fill="var(--bg-card)" 
                          stroke="var(--indigo-medium)" 
                          strokeWidth="3"
                          style={{ cursor: 'pointer', transition: 'r 0.2s ease' }}
                          onMouseEnter={(e) => {
                            const rect = e.target.getBoundingClientRect();
                            setHoveredData({
                              name: `${pt.name} 2026`,
                              value: `${pt.value} Sign-ups`,
                              x: rect.left + window.scrollX,
                              y: rect.top + window.scrollY - 35
                            });
                          }}
                          onMouseLeave={() => setHoveredData(null)}
                        />
                        <text 
                          x={pt.x} y="195" 
                          textAnchor="middle" 
                          className="chart-label-text"
                          style={{ fontWeight: 600 }}
                        >
                          {pt.name}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
        </div>
      </div>

      {/* Pipeline Progression Breakdown Panel */}
      <div className="card" style={{ marginTop: '24px', animation: 'float-up 0.5s ease-out' }}>
        <h3 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', textAlign: 'left', marginBottom: '16px' }}>
          Pipeline Flow Breakdown
        </h3>
        
        <div className="status-progress-grid">
          {statusData.map(st => {
            // Pick color theme matching status
            let fillColor = 'var(--text-light)';
            if (st.name === 'Pending') fillColor = 'var(--amber-medium)';
            if (st.name === 'Approved') fillColor = 'var(--sky-medium)';
            if (st.name === 'Active') fillColor = '#10b981';
            if (st.name === 'Inactive') fillColor = '#6b7280';

            return (
              <div key={st.name} className="status-progress-item">
                <div className="status-progress-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`status-badge ${st.name.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                      {st.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      - Steps and onboarding queues
                    </span>
                  </div>
                  <span style={{ fontWeight: 600 }}>
                    {st.value} Volunteers ({st.percentage}%)
                  </span>
                </div>
                <div className="status-progress-bar-bg">
                  <div 
                    className="status-progress-bar-fill" 
                    style={{ 
                      width: `${st.percentage}%`, 
                      backgroundColor: fillColor 
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Tooltip Component */}
      {hoveredData && (
        <div 
          className="chart-tooltip"
          style={{ 
            display: 'block', 
            left: `${hoveredData.x}px`, 
            top: `${hoveredData.y}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div style={{ fontWeight: 700 }}>{hoveredData.name}</div>
          <div style={{ fontSize: '0.7rem', color: '#e2e8f0' }}>{hoveredData.value}</div>
        </div>
      )}
    </div>
  );
}
