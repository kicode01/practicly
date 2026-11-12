import React, { useState } from 'react';
import { IconRefresh } from './Icons';

const ERD_ENTITIES = [
  {
    name: 'Users',
    role: 'Authentication & RBAC Access',
    attrs: [
      { name: 'user_id', key: 'PK' },
      { name: 'username', key: 'UK' },
      { name: 'password_hash', key: '' },
      { name: 'role (student | adviser | admin | supervisor)', key: '' },
      { name: 'linked_id (polymorphic ref)', key: 'FK*' },
      { name: 'is_active / last_login', key: '' },
    ],
  },
  {
    name: 'Student',
    role: 'Intern Master Record',
    attrs: [
      { name: 'student_id', key: 'PK' },
      { name: 'student_number', key: 'UK' },
      { name: 'full_name', key: '' },
      { name: 'program / year_level / section', key: '' },
      { name: 'email', key: 'UK' },
      { name: 'contact_number / created_at', key: '' },
    ],
  },
  {
    name: 'Employer',
    role: 'Host Training Establishment (HTE)',
    attrs: [
      { name: 'employer_id', key: 'PK' },
      { name: 'company_name', key: '' },
      { name: 'address / industry', key: '' },
      { name: 'contact_person / contact_number', key: '' },
      { name: 'email', key: '' },
      { name: 'moa_status / moa_validity', key: '' },
    ],
  },
  {
    name: 'Adviser',
    role: 'Faculty OJT Coordinator',
    attrs: [
      { name: 'adviser_id', key: 'PK' },
      { name: 'employee_number', key: 'UK' },
      { name: 'full_name', key: '' },
      { name: 'department', key: '' },
      { name: 'email / contact_number', key: '' },
    ],
  },
  {
    name: 'Placement',
    role: 'Core 3-Way Junction & Signed Scans',
    attrs: [
      { name: 'placement_id', key: 'PK' },
      { name: 'student_id', key: 'FK' },
      { name: 'employer_id', key: 'FK' },
      { name: 'adviser_id', key: 'FK' },
      { name: 'academic_term / position_title', key: '' },
      { name: 'start_date / end_date / required_hours / status', key: '' },
      { name: 'signed_dtr_* / signed_eval_* (scan metadata + data)', key: '' },
    ],
  },
  {
    name: 'TimeLog',
    role: 'Attendance Ledger (UNIQUE per date)',
    attrs: [
      { name: 'log_id', key: 'PK' },
      { name: 'placement_id', key: 'FK' },
      { name: 'date (UNIQUE with placement_id)', key: 'UK' },
      { name: 'time_in / time_out / break_minutes', key: '' },
      { name: 'hours_rendered', key: '' },
      { name: 'approval_status (pending | supervisor_verified | approved | flagged)', key: '' },
      { name: 'task_description', key: '' },
    ],
  },
  {
    name: 'Evaluation',
    role: '4-Instrument 360° Rubric Ratings',
    attrs: [
      { name: 'eval_id', key: 'PK' },
      { name: 'placement_id', key: 'FK' },
      { name: 'instrument_type (INST-01..04)', key: '' },
      { name: 'evaluator_type / evaluator_name', key: '' },
      { name: 'technical_score / attitude_score / attendance_score', key: '' },
      { name: 'rating (1.00 - 5.00)', key: '' },
      { name: 'criteria_scores (JSON) / comments / date_evaluated', key: '' },
    ],
  },
  {
    name: 'ComplianceReport',
    role: '1:1 Aggregated Clearance Summary',
    attrs: [
      { name: 'report_id', key: 'PK' },
      { name: 'placement_id', key: 'FK/UK' },
      { name: 'total_hours_completed / requirement_met', key: '' },
      { name: 'has_employer_eval / has_adviser_eval', key: '' },
      { name: 'has_student_supervisor_eval / has_student_adviser_eval', key: '' },
      { name: 'average_rating / clearance_reference / generated_date', key: '' },
    ],
  },
];

const CARDINALITY_MATRIX = [
  {
    parent: 'Student (1)',
    child: 'Placement (N)',
    type: '1 : N',
    fk: 'student_id',
    rule: 'One student can hold multiple placement contracts across academic terms (CASCADE).',
  },
  {
    parent: 'Employer (1)',
    child: 'Placement (N)',
    type: '1 : N',
    fk: 'employer_id',
    rule: 'One host company can accommodate multiple student placements (CASCADE).',
  },
  {
    parent: 'Adviser (1)',
    child: 'Placement (N)',
    type: '1 : N',
    fk: 'adviser_id',
    rule: 'One faculty adviser supervises multiple student placements (CASCADE).',
  },
  {
    parent: 'Placement (1)',
    child: 'TimeLog (N)',
    type: '1 : N',
    fk: 'placement_id',
    rule: 'One placement aggregates daily shift records with UNIQUE (placement_id, date) & approval_status.',
  },
  {
    parent: 'Placement (1)',
    child: 'Evaluation (N)',
    type: '1 : N',
    fk: 'placement_id',
    rule: 'One placement stores INST-01 through INST-04 ratings, subscores, and JSON rubric scores.',
  },
  {
    parent: 'Placement (1)',
    child: 'ComplianceReport (1)',
    type: '1 : 1',
    fk: 'placement_id (UNIQUE)',
    rule: 'Strict 1:1 clearance record auto-synced by triggers & Database::syncCompliance().',
  },
  {
    parent: 'Users (Auth)',
    child: 'Student / Adviser / Employer',
    type: 'Polymorphic',
    fk: 'role + linked_id',
    rule: 'Logical RBAC link resolving Student, Adviser/Admin, or HTE Supervisor identity; AppSecret signs tokens.',
  },
];

function getKeyTagClass(key) {
  if (key.includes('PK')) return 'pk';
  if (key.includes('FK')) return 'fk';
  return 'uk';
}

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
      last_login: r.last_login ?? 'Never',
    })),
    Student: (data?.students || []).map((r) => ({
      student_id: r.student_id,
      student_number: r.student_number,
      full_name: r.full_name,
      program: r.program,
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
      moa_validity: r.moa_validity ?? 'NULL',
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
      position_title: r.position_title,
      required_hours: r.required_hours,
      total_hours_completed: r.total_hours_completed,
      signed_dtr: r.signed_dtr_filename || 'None',
      signed_eval: r.signed_eval_filename || 'None',
      status: r.status,
    })),
    TimeLog: (data?.timelogs || []).map((r) => ({
      log_id: r.log_id,
      placement_id: `${r.placement_id} (${r.student_name})`,
      date: r.date,
      shift: `${String(r.time_in).slice(0, 5)}-${String(r.time_out).slice(0, 5)} (${r.break_minutes ?? 60}m break)`,
      hours_rendered: r.hours_rendered,
      approval_status: r.approval_status,
      task_description: r.task_description,
    })),
    Evaluation: (data?.evaluations || []).map((r) => ({
      eval_id: r.eval_id,
      placement_id: `${r.placement_id} (${r.student_name})`,
      instrument_type: r.instrument_type || 'supervisor_to_student',
      evaluator_type: r.evaluator_type,
      evaluator_name: r.evaluator_name,
      rating: r.rating,
      date_evaluated: r.date_evaluated,
    })),
    ComplianceReport: (data?.compliance_reports || []).map((r) => ({
      report_id: r.report_id,
      placement_id: `${r.placement_id} (${r.student_name})`,
      total_hours_completed: r.total_hours_completed,
      instruments: `${Number(r.has_employer_eval || 0) + Number(r.has_adviser_eval || 0) + Number(r.has_student_supervisor_eval || 0) + Number(r.has_student_adviser_eval || 0)}/4`,
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
            <div className="panel-title">Entity-Relationship Schema (8 Core Entities + Runtime Token Key Store)</div>
            <div className="panel-desc">
              {systemInfo?.engine || 'SQLite 3'} · Database:{' '}
              <span className="mono">{systemInfo?.database || 'ojt_tracking.db'}</span> · Click any entity card to inspect live rows
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
              Sync All Compliance Reports
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
                  className={`erd-entity-card ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => setSelectedTable(ent.name)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="erd-entity-head">
                    <span>{ent.name}</span>
                    <span className="mono" style={{ fontSize: '11px', opacity: 0.78, fontWeight: 500 }}>
                      {counts[ent.name] ?? 0} rows
                    </span>
                  </div>
                  <div
                    style={{
                      padding: '5px 12px',
                      background: 'var(--bg-subtle)',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    {ent.role}
                  </div>
                  <ul className="erd-attr-list">
                    {ent.attrs.map((a) => (
                      <li key={a.name}>
                        <span>{a.name}</span>
                        {a.key && (
                          <span className={`key-tag ${getKeyTagClass(a.key)}`}>
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

          <div className="erd-runtime-strip">
            <div>
              <strong>Auxiliary Table:</strong> <span className="mono">AppSecret (id PK, secret TEXT)</span> — persists the runtime HMAC-SHA256 key for stateless signed session tokens.
            </div>
            <div>
              <strong>SQL Objects:</strong> <span className="mono">3 views</span> (<span className="mono">vw_placement_progress</span>, <span className="mono">vw_employer_analytics</span>, <span className="mono">vw_adviser_monitoring</span>) &middot; <span className="mono">8 triggers</span>
            </div>
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
              Showing {activeRows.length} live row(s) from {systemInfo?.engine || 'SQLite'} table <span className="mono">{selectedTable}</span>
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
              <div className="panel-desc">Enforced foreign keys, 1:1 clearance uniqueness, and RBAC lookup links</div>
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
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{rel.rule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Aggregation &amp; 4-Instrument Clearance SQL Logic</div>
              <div className="panel-desc">Executed by SQLite triggers and Database::syncCompliance()</div>
            </div>
          </div>
          <div className="panel-body">
            <pre className="sql-code-block">{`-- Non-Flagged Attendance Hour Aggregation (TimeLog)
SELECT p.placement_id, p.required_hours,
       COALESCE(SUM(tl.hours_rendered), 0.00) AS total_hours_completed
FROM Placement p
LEFT JOIN TimeLog tl
       ON p.placement_id = tl.placement_id
      AND tl.approval_status != 'flagged'
GROUP BY p.placement_id;

-- 4-Instrument Clearance Eligibility (ComplianceReport)
CASE
    WHEN total_hours >= p.required_hours
     AND p.status != 'dropped'
     AND (has_inst02_supervisor_eval = 1 OR has_signed_eval_scan = 1)
     AND has_inst03_adviser_eval = 1
     AND has_inst01_student_supervisor = 1
     AND has_inst04_student_adviser = 1
    THEN 1 ELSE 0
END AS requirement_met`}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
