import React, { useState } from 'react';
import { IconRefresh } from './Icons';

const ERD_ENTITIES = [
  {
    name: 'Users',
    role: 'Authentication & Role Access',
    attrs: [
      { name: 'user_id', key: 'PK' },
      { name: 'username', key: 'UQ' },
      { name: 'password_hash', key: '' },
      { name: 'role', key: '' },
      { name: 'linked_id', key: 'FK' },
    ],
  },
  {
    name: 'Student',
    role: 'Intern Master Record',
    attrs: [
      { name: 'student_id', key: 'PK' },
      { name: 'student_number', key: 'UQ' },
      { name: 'full_name', key: '' },
      { name: 'program / year_level', key: '' },
      { name: 'email / contact_number', key: '' },
    ],
  },
  {
    name: 'Employer',
    role: 'Host Training Establishment',
    attrs: [
      { name: 'employer_id', key: 'PK' },
      { name: 'company_name', key: '' },
      { name: 'address / industry', key: '' },
      { name: 'contact_person / email', key: '' },
      { name: 'moa_status', key: '' },
    ],
  },
  {
    name: 'Adviser',
    role: 'Faculty OJT Coordinator',
    attrs: [
      { name: 'adviser_id', key: 'PK' },
      { name: 'employee_number', key: 'UQ' },
      { name: 'full_name', key: '' },
      { name: 'department', key: '' },
      { name: 'email / contact_number', key: '' },
    ],
  },
  {
    name: 'Placement',
    role: '3-Way Assignment Contract',
    attrs: [
      { name: 'placement_id', key: 'PK' },
      { name: 'student_id', key: 'FK' },
      { name: 'employer_id', key: 'FK' },
      { name: 'adviser_id', key: 'FK' },
      { name: 'required_hours / status', key: '' },
    ],
  },
  {
    name: 'TimeLog',
    role: 'Attendance Ledger (SUM)',
    attrs: [
      { name: 'log_id', key: 'PK' },
      { name: 'placement_id', key: 'FK' },
      { name: 'date / time_in / time_out', key: '' },
      { name: 'hours_rendered', key: '' },
      { name: 'task_description', key: '' },
    ],
  },
  {
    name: 'Evaluation',
    role: 'Supervisor & Adviser Ratings',
    attrs: [
      { name: 'eval_id', key: 'PK' },
      { name: 'placement_id', key: 'FK' },
      { name: 'evaluator_type', key: '' },
      { name: 'rating (1.00 - 5.00)', key: '' },
      { name: 'comments / date_evaluated', key: '' },
    ],
  },
  {
    name: 'ComplianceReport',
    role: 'Computed Clearance Summary',
    attrs: [
      { name: 'report_id', key: 'PK' },
      { name: 'placement_id', key: 'FK' },
      { name: 'total_hours_completed', key: '' },
      { name: 'requirement_met', key: '' },
      { name: 'generated_date', key: '' },
    ],
  },
];

const CARDINALITY_MATRIX = [
  {
    parent: 'Student (1)',
    child: 'Placement (N)',
    type: '1 : N',
    fk: 'student_id',
    rule: 'One student can hold multiple placement contracts across academic terms.',
  },
  {
    parent: 'Employer (1)',
    child: 'Placement (N)',
    type: '1 : N',
    fk: 'employer_id',
    rule: 'One host company can accommodate multiple student placements.',
  },
  {
    parent: 'Adviser (1)',
    child: 'Placement (N)',
    type: '1 : N',
    fk: 'adviser_id',
    rule: 'One faculty adviser supervises multiple student placements.',
  },
  {
    parent: 'Placement (1)',
    child: 'TimeLog (N)',
    type: '1 : N',
    fk: 'placement_id',
    rule: 'One placement contract aggregates multiple attendance time logs.',
  },
  {
    parent: 'Placement (1)',
    child: 'Evaluation (N)',
    type: '1 : N',
    fk: 'placement_id',
    rule: 'One placement contract receives employer and faculty adviser evaluations.',
  },
  {
    parent: 'Placement (1)',
    child: 'ComplianceReport (N)',
    type: '1 : N',
    fk: 'placement_id',
    rule: 'One placement contract generates clearance reports from aggregated hours.',
  },
];

export default function DatabaseInspectorView({
  systemInfo,
  data,
  onSyncCompliance,
  onResetDemo,
  syncing,
}) {
  const [selectedTable, setSelectedTable] = useState('Placement');
  const counts = systemInfo?.table_counts || {};

  const tableRowsMap = {
    Users: (data?.users || []).map((r) => ({
      user_id: r.user_id,
      username: r.username,
      role: r.role,
      linked_id: r.linked_id ?? 'NULL',
      display_name: r.display_name,
      is_active: r.is_active,
    })),
    Student: (data?.students || []).map((r) => ({
      student_id: r.student_id,
      student_number: r.student_number,
      full_name: r.full_name,
      section: r.section,
      email: r.email,
      contact_number: r.contact_number,
    })),
    Employer: (data?.employers || []).map((r) => ({
      employer_id: r.employer_id,
      company_name: r.company_name,
      industry: r.industry,
      contact_person: r.contact_person,
      moa_status: r.moa_status,
      moa_validity: r.moa_validity,
    })),
    Adviser: (data?.advisers || []).map((r) => ({
      adviser_id: r.adviser_id,
      employee_number: r.employee_number,
      full_name: r.full_name,
      department: r.department,
      email: r.email,
      contact_number: r.contact_number,
    })),
    Placement: (data?.placements || []).map((r) => ({
      placement_id: r.placement_id,
      student_id: `${r.student_id} (${r.student_name})`,
      employer_id: `${r.employer_id} (${r.company_name})`,
      adviser_id: `${r.adviser_id} (${r.adviser_name})`,
      required_hours: r.required_hours,
      total_hours_completed: r.total_hours_completed,
      status: r.status,
    })),
    TimeLog: (data?.timelogs || []).map((r) => ({
      log_id: r.log_id,
      placement_id: `${r.placement_id} (${r.student_name})`,
      date: r.date,
      shift: `${String(r.time_in).slice(0, 5)}-${String(r.time_out).slice(0, 5)}`,
      hours_rendered: r.hours_rendered,
      approval_status: r.approval_status,
      task_description: r.task_description,
    })),
    Evaluation: (data?.evaluations || []).map((r) => ({
      eval_id: r.eval_id,
      placement_id: `${r.placement_id} (${r.student_name})`,
      evaluator_type: r.evaluator_type,
      evaluator_name: r.evaluator_name,
      rating: r.rating,
      date_evaluated: r.date_evaluated,
    })),
    ComplianceReport: (data?.compliance_reports || []).map((r) => ({
      report_id: r.report_id,
      placement_id: `${r.placement_id} (${r.student_name})`,
      total_hours_completed: r.total_hours_completed,
      requirement_met: Number(r.requirement_met) === 1 ? '1 (ELIGIBLE)' : '0 (PENDING)',
      average_rating: r.average_rating ?? 'NULL',
      clearance_reference: r.clearance_reference ?? 'NULL',
    })),
  };

  const activeRows = tableRowsMap[selectedTable] || [];
  const activeColumns = activeRows.length > 0 ? Object.keys(activeRows[0]) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Entity-Relationship Schema (8 Core Normalized Tables)</div>
            <div className="panel-desc">
              {systemInfo?.engine || 'MySQL / MariaDB'} · Schema:{' '}
              <span className="mono">{systemInfo?.database || 'ojt_tracking_db'}</span> · Click any table card to inspect live rows
            </div>
          </div>
          <div className="action-row-wrap">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onSyncCompliance}
              disabled={syncing}
            >
              <IconRefresh size={13} />
              Run sp_sync_all_compliance_reports()
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onResetDemo}
              disabled={syncing}
            >
              Reset Seed Data
            </button>
          </div>
        </div>
        <div className="panel-body">
          <div className="erd-entity-grid">
            {ERD_ENTITIES.map((ent) => {
              const isSelected = selectedTable === ent.name;
              return (
                <div
                  key={ent.name}
                  className="erd-entity-card"
                  onClick={() => setSelectedTable(ent.name)}
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected ? '#7a1215' : undefined,
                    boxShadow: isSelected ? '0 0 0 2px rgba(122, 18, 21, 0.12)' : undefined,
                  }}
                >
                  <div
                    className="erd-entity-head"
                    style={{
                      background: isSelected ? '#fdf2f2' : undefined,
                      color: isSelected ? '#7a1215' : undefined,
                    }}
                  >
                    <span>{ent.name}</span>
                    <span className="mono" style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>
                      {counts[ent.name] ?? 0} rows
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '5px 12px',
                      background: '#fafafa',
                      borderBottom: '1px solid #f1f3f5',
                      fontSize: '11px',
                      color: '#6b7280',
                    }}
                  >
                    {ent.role}
                  </div>
                  <ul className="erd-attr-list">
                    {ent.attrs.map((a) => (
                      <li key={a.name}>
                        <span>{a.name}</span>
                        {a.key && (
                          <span className={`key-tag ${a.key === 'PK' ? 'pk' : 'fk'}`}>
                            {a.key}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* LIVE TABLE ROWS INSPECTOR */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">
              Live Table Data Browser: <span className="mono">SELECT * FROM {selectedTable};</span>
            </div>
            <div className="panel-desc">
              Showing {activeRows.length} live row(s) from MySQL table <span className="mono">{selectedTable}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {ERD_ENTITIES.map((ent) => (
              <button
                key={ent.name}
                type="button"
                className={`btn btn-sm ${selectedTable === ent.name ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedTable(ent.name)}
              >
                {ent.name} ({counts[ent.name] ?? 0})
              </button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {activeColumns.map((col) => (
                  <th key={col} className="mono">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(1, activeColumns.length)} style={{ textAlign: 'center', padding: '18px' }}>
                    Table {selectedTable} is currently empty.
                  </td>
                </tr>
              ) : (
                activeRows.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {activeColumns.map((col) => (
                      <td key={col} className="mono" style={{ fontSize: '11.5px' }}>
                        {String(row[col] ?? '')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="equal-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Relationships &amp; Cardinality Matrix</div>
              <div className="panel-desc">1:N foreign key constraints enforced in SQLite &amp; relational engine</div>
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Parent Entity</th>
                  <th>Child Entity</th>
                  <th>Cardinality</th>
                  <th>Foreign Key</th>
                  <th>Relational Rule</th>
                </tr>
              </thead>
              <tbody>
                {CARDINALITY_MATRIX.map((rel, idx) => (
                  <tr key={idx}>
                    <td className="row-title">{rel.parent}</td>
                    <td className="row-title">{rel.child}</td>
                    <td>
                      <span className="status-chip info mono">{rel.type}</span>
                    </td>
                    <td className="mono">{rel.fk}</td>
                    <td style={{ fontSize: '12px', color: '#4b5563' }}>{rel.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Aggregation &amp; Eligibility SQL Logic</div>
              <div className="panel-desc">Executed by views and triggers on TimeLog &amp; Evaluation updates</div>
            </div>
          </div>
          <div className="panel-body">
            <pre className="sql-code-block">{`-- Attendance Hour Aggregation (TimeLog Module)
SELECT
    p.placement_id,
    s.full_name AS student_name,
    e.company_name,
    p.required_hours,
    COALESCE(SUM(tl.hours_rendered), 0.00) AS total_hours_completed,
    COUNT(tl.log_id) AS total_log_days
FROM Placement p
INNER JOIN Student s ON p.student_id = s.student_id
INNER JOIN Employer e ON p.employer_id = e.employer_id
LEFT JOIN TimeLog tl
       ON p.placement_id = tl.placement_id
      AND tl.approval_status != 'flagged'
GROUP BY p.placement_id;

-- Clearance Eligibility Computation (ComplianceReport)
CASE
    WHEN COALESCE(SUM(tl.hours_rendered), 0) >= p.required_hours
     AND COUNT(DISTINCT ev.eval_id) > 0
     AND p.status != 'dropped'
    THEN 1 ELSE 0
END AS requirement_met`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
