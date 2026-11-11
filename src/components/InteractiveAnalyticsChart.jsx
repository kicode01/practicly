import React, { useState, useMemo } from 'react';

export default function InteractiveAnalyticsChart({
  placements = [],
  timelogs = [],
  employers = [],
  onFilterCompany,
  onFilterStatus,
}) {
  const [activeMetricTab, setActiveMetricTab] = useState('velocity'); // 'velocity' | 'partners' | 'cohort'
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredPartner, setHoveredPartner] = useState(null);

  // Compute Weekly Hours Velocity from Timelogs
  const weeklyData = useMemo(() => {
    if (!timelogs || timelogs.length === 0) return [];

    // Sort logs by date
    const sorted = [...timelogs].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    if (sorted.length === 0) return [];

    // Group into 7-day buckets
    const firstDate = new Date(sorted[0].date || '2026-08-01');
    const buckets = {};

    sorted.forEach((l) => {
      const d = new Date(l.date);
      const diffDays = Math.floor((d - firstDate) / (1000 * 60 * 60 * 24));
      const weekNum = Math.max(1, Math.floor(diffDays / 7) + 1);
      const key = `W${weekNum}`;

      if (!buckets[key]) {
        buckets[key] = {
          week: `Week ${weekNum}`,
          weekNum,
          hours: 0,
          approvedHours: 0,
          logCount: 0,
          students: new Set(),
        };
      }
      const hrs = Number(l.hours_rendered) || 0;
      buckets[key].hours += hrs;
      if (l.approval_status === 'approved') {
        buckets[key].approvedHours += hrs;
      }
      buckets[key].logCount += 1;
      buckets[key].students.add(l.student_number || l.placement_id);
    });

    let cumulative = 0;
    return Object.values(buckets)
      .slice(0, 14)
      .map((b) => {
        cumulative += b.hours;
        return {
          ...b,
          cumulative: Number(cumulative.toFixed(1)),
          hours: Number(b.hours.toFixed(1)),
          activeStudents: b.students.size,
        };
      });
  }, [timelogs]);

  // Compute Employer distribution
  const partnerStats = useMemo(() => {
    const counts = {};
    placements.forEach((p) => {
      const name = p.company_name || 'Unassigned';
      if (!counts[name]) {
        counts[name] = {
          name,
          count: 0,
          totalHours: 0,
          completedCount: 0,
          industry: p.company_industry || 'Technology',
        };
      }
      counts[name].count += 1;
      const rendered = Number(p.completed_hours ?? p.total_hours_completed ?? p.hours_rendered ?? 0);
      const req = Number(p.required_hours || 300);
      counts[name].totalHours += rendered;
      if (Number(p.requirement_met) === 1 || p.status === 'completed' || rendered >= req) {
        counts[name].completedCount += 1;
      }
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count || b.totalHours - a.totalHours)
      .slice(0, 6);
  }, [placements]);

  // Status breakdown
  const statusStats = useMemo(() => {
    let cleared = 0;
    let near = 0;
    let ongoing = 0;
    placements.forEach((p) => {
      const hrs = Number(p.completed_hours ?? p.total_hours_completed ?? p.hours_rendered ?? 0);
      const req = Number(p.required_hours || 300);
      if (Number(p.requirement_met) === 1 || p.status === 'completed' || hrs >= req) cleared++;
      else if (hrs >= req * 0.66) near++;
      else ongoing++;
    });
    const total = placements.length || 1;
    return {
      cleared,
      near,
      ongoing,
      total,
      clearedPct: Math.round((cleared / total) * 100),
      nearPct: Math.round((near / total) * 100),
      ongoingPct: Math.round((ongoing / total) * 100),
    };
  }, [placements]);

  // SVG Chart Dimensions
  const chartW = 540;
  const chartH = 160;
  const padL = 36;
  const padR = 20;
  const padT = 16;
  const padB = 26;

  const maxVal = Math.max(100, ...weeklyData.map((d) => (activeMetricTab === 'cohort' ? d.cumulative : d.hours)));
  const usableW = chartW - padL - padR;
  const usableH = chartH - padT - padB;

  const points = weeklyData.map((d, i) => {
    const val = activeMetricTab === 'cohort' ? d.cumulative : d.hours;
    const x = padL + (i / Math.max(1, weeklyData.length - 1)) * usableW;
    const y = padT + (1 - val / maxVal) * usableH;
    return { ...d, x, y, val };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${chartH - padB} L ${points[0].x} ${chartH - padB} Z`
    : '';

  return (
    <div className="analytics-card">
      <div className="analytics-header">
        <div>
          <div className="analytics-title">Interactive Practicum Analytics</div>
          <div className="analytics-sub">
            Real-time cohort velocity, partner breakdown, and completion distribution
          </div>
        </div>
        <div className="analytics-tabs">
          <button
            type="button"
            className={`analytics-tab-btn ${activeMetricTab === 'velocity' ? 'active' : ''}`}
            onClick={() => {
              setActiveMetricTab('velocity');
            }}
          >
            Weekly Velocity
          </button>
          <button
            type="button"
            className={`analytics-tab-btn ${activeMetricTab === 'cohort' ? 'active' : ''}`}
            onClick={() => {
              setActiveMetricTab('cohort');
            }}
          >
            Cohort Cumulative
          </button>
          <button
            type="button"
            className={`analytics-tab-btn ${activeMetricTab === 'partners' ? 'active' : ''}`}
            onClick={() => {
              setActiveMetricTab('partners');
            }}
          >
            Top Partners
          </button>
        </div>
      </div>

      <div className="analytics-body">
        {activeMetricTab === 'partners' ? (
          <div className="partners-grid">
            {partnerStats.map((part) => (
              <div
                key={part.name}
                className={`partner-bar-item ${hoveredPartner === part.name ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredPartner(part.name)}
                onMouseLeave={() => setHoveredPartner(null)}
                onClick={() => onFilterCompany && onFilterCompany(part.name)}
                title={`Click to filter trainees at ${part.name}`}
              >
                <div className="partner-bar-top">
                  <span className="partner-name">{part.name}</span>
                  <span className="partner-count">{part.count} interns · {Math.round(part.totalHours)} hrs</span>
                </div>
                <div className="partner-bar-track">
                  <div
                    className="partner-bar-fill"
                    style={{ width: `${Math.min(100, (part.count / placements.length) * 100 * 2.8)}%` }}
                  />
                </div>
                <div className="partner-bar-footer">
                  <span className="partner-industry">{part.industry}</span>
                  <span className="partner-clearance-rate">
                    {part.completedCount}/{part.count} cleared
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="chart-wrapper">
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="velocity-svg"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = padT + pct * usableH;
                const v = Math.round((1 - pct) * maxVal);
                return (
                  <g key={pct}>
                    <line
                      x1={padL}
                      y1={y}
                      x2={chartW - padR}
                      y2={y}
                      stroke="var(--border-subtle)"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padL - 6}
                      y={y + 3}
                      fill="var(--text-faint)"
                      fontSize="9"
                      textAnchor="end"
                      fontFamily="var(--font-mono)"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}

              {/* Area & Stroke */}
              {areaD && <path d={areaD} fill="url(#areaGradient)" />}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--brand)"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points */}
              {points.map((p, idx) => {
                const isHovered = hoveredPoint?.week === p.week;
                return (
                  <g
                    key={p.week}
                    onMouseEnter={() => {
                      setHoveredPoint(p);
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={isHovered ? 5.5 : 3.2}
                      fill="#ffffff"
                      stroke="var(--brand)"
                      strokeWidth={isHovered ? 2.5 : 1.8}
                      className="chart-dot"
                    />
                    {/* Invisible larger hit target */}
                    <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {points
                .filter((_, idx) => idx % 2 === 0 || idx === points.length - 1)
                .map((p) => (
                  <text
                    key={p.week}
                    x={p.x}
                    y={chartH - 8}
                    fill="var(--text-muted)"
                    fontSize="9.5"
                    textAnchor="middle"
                    fontFamily="var(--font-sans)"
                  >
                    {p.week}
                  </text>
                ))}
            </svg>

            {/* Interactive Floating Tooltip */}
            {hoveredPoint && (
              <div
                className="chart-tooltip"
                style={{
                  left: `${(hoveredPoint.x / chartW) * 100}%`,
                  top: `${(hoveredPoint.y / chartH) * 100}%`,
                }}
              >
                <div className="tooltip-week">{hoveredPoint.week}</div>
                <div className="tooltip-value">
                  {hoveredPoint.val} {activeMetricTab === 'cohort' ? 'Total Hours' : 'Hours Logged'}
                </div>
                <div className="tooltip-sub">
                  {hoveredPoint.activeStudents} active intern{hoveredPoint.activeStudents > 1 ? 's' : ''} · {hoveredPoint.logCount} shifts
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Distribution Pills */}
        <div className="status-radial-strip">
          <div
            className="status-radial-item cleared"
            onClick={() => onFilterStatus && onFilterStatus('cleared')}
            title="Filter cleared students (>= 300 hrs)"
          >
            <div className="radial-top">
              <span className="radial-dot cleared" />
              <span className="radial-label">Cleared</span>
              <span className="radial-pct">{statusStats.clearedPct}%</span>
            </div>
            <div className="radial-bar">
              <div className="radial-bar-fill cleared" style={{ width: `${statusStats.clearedPct}%` }} />
            </div>
            <div className="radial-foot">{statusStats.cleared} of {statusStats.total} students</div>
          </div>

          <div
            className="status-radial-item near"
            onClick={() => onFilterStatus && onFilterStatus('near')}
            title="Filter students close to goal (200-299 hrs)"
          >
            <div className="radial-top">
              <span className="radial-dot near" />
              <span className="radial-label">Final Stretch</span>
              <span className="radial-pct">{statusStats.nearPct}%</span>
            </div>
            <div className="radial-bar">
              <div className="radial-bar-fill near" style={{ width: `${statusStats.nearPct}%` }} />
            </div>
            <div className="radial-foot">{statusStats.near} of {statusStats.total} students</div>
          </div>

          <div
            className="status-radial-item ongoing"
            onClick={() => onFilterStatus && onFilterStatus('ongoing')}
            title="Filter ongoing students (< 200 hrs)"
          >
            <div className="radial-top">
              <span className="radial-dot ongoing" />
              <span className="radial-label">In Training</span>
              <span className="radial-pct">{statusStats.ongoingPct}%</span>
            </div>
            <div className="radial-bar">
              <div className="radial-bar-fill ongoing" style={{ width: `${statusStats.ongoingPct}%` }} />
            </div>
            <div className="radial-foot">{statusStats.ongoing} of {statusStats.total} students</div>
          </div>
        </div>
      </div>
    </div>
  );
}
