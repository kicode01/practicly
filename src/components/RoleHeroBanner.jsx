import React from 'react';
import {
  IconStudent,
  IconBriefcase,
  IconSupervisor,
  IconShieldCheck,
  IconClock,
  IconCheckCircle,
  IconPrinter,
  IconPlus,
  IconEvaluation,
  IconDownload,
  IconBuilding,
  IconDatabase,
  IconAlert,
  IconEdit,
  IconLink,
  IconUpload,
} from './Icons';

export default function RoleHeroBanner({
  currentUser,
  placement,
  kpis,
  supervisorPendingCount = 0,
  adviserPendingCount = 0,
  onOpenLogModal,
  onOpenEvalModal,
  onOpenOfficialEval,
  onOpenDtrModal,
  onOpenClearanceModal,
  onVerifyAllSupervisor,
  onApproveAllAdviser,
  onNavigateTab,
  onExportCsv,
  onOpenDtrAudit,
  onEditProfile,
  onShareSupervisorLink,
  onUploadSignedDtr,
  onOpenDtrTransfer,
}) {
  const role = currentUser?.role;
  const formatHours = (val) => Number(val || 0).toFixed(1);

  // Student Overview Header (Google Workspace Style)
  if (role === 'student') {
    if (!placement) {
      return (
        <section className="gws-hero gws-hero-student">
          <div className="gws-hero-top">
            <div className="gws-hero-identity">
              <div className="gws-role-chip gws-chip-student">
                <IconStudent size={14} />
                <span>Student Practicum Portal</span>
              </div>
              <h1 className="gws-hero-title">Welcome, {currentUser.display_name}</h1>
              <p className="gws-hero-sub">
                Account <strong className="mono">{currentUser.identifier_code}</strong> is active. Review accredited Host Training Establishments below while awaiting coordinator placement assignment.
              </p>
            </div>
          </div>
        </section>
      );
    }

    const completed = Number(placement.total_hours_completed || 0);
    const required = Number(placement.required_hours || 300);
    const pct = Math.min(100, Math.round((completed / (required || 1)) * 100));
    const remaining = Math.max(0, required - completed);
    const isCleared = Number(placement.requirement_met) === 1 || placement.status === 'completed';

    return (
      <section className="gws-hero gws-hero-student">
        <div className="gws-hero-top">
          <div className="gws-hero-identity">
            <div className="gws-role-chip gws-chip-student">
              <IconStudent size={14} />
              <span>Practicum Intern · {placement.program || 'BS Computer Engineering'}</span>
            </div>
            <h1 className="gws-hero-title">{currentUser.display_name}</h1>
            <div className="gws-hero-meta">
              <span className="gws-meta-item">
                <IconBriefcase size={13} />
                <strong>{placement.company_name}</strong>
              </span>
              <span className="gws-meta-sep" aria-hidden="true">·</span>
              <span className="gws-meta-item">{placement.position_title}</span>
              <span className="gws-meta-sep" aria-hidden="true">·</span>
              <span className="gws-meta-item">
                Adviser: <strong>{placement.adviser_name}</strong>
              </span>
              {onEditProfile && (
                <>
                  <span className="gws-meta-sep" aria-hidden="true">·</span>
                  <button
                    type="button"
                    className="btn btn-ghost gws-inline-edit-btn"
                    onClick={onEditProfile}
                    title="Edit contact number or section"
                  >
                    <IconEdit size={12} />
                    Edit profile
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={`gws-progress-summary ${isCleared ? 'is-complete' : ''}`}>
            <div className="gws-progress-top">
              <span className="gws-progress-label">Practicum Hours</span>
              <span className={`gws-progress-pct mono ${isCleared ? 'is-complete' : ''}`}>{pct}%</span>
            </div>
            <div className="gws-progress-numbers mono">
              <strong>{formatHours(completed)}</strong>
              <span>/ {required} hrs</span>
            </div>
            <div className="gws-progress-track">
              <div
                className={`gws-progress-fill ${isCleared ? 'is-complete' : ''}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="gws-progress-foot">
              <span>
                {remaining <= 0
                  ? isCleared
                    ? 'Clearance requirement fulfilled'
                    : 'Required hours met'
                  : `${formatHours(remaining)} hrs remaining`}
              </span>
              <span>{placement.completed_instruments_count ?? placement.evaluation_count ?? 0}/4 instruments</span>
            </div>
          </div>
        </div>

        <div className="gws-hero-toolbar">
          <div className="gws-toolbar-primary">
            {onOpenLogModal && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onOpenLogModal}
              >
                <IconPlus size={15} />
                Log Attendance
              </button>
            )}
            {onUploadSignedDtr && (
              <button
                type="button"
                className="btn btn-tonal btn-sm"
                onClick={onUploadSignedDtr}
              >
                <IconUpload size={14} />
                Upload Signed DTR
              </button>
            )}
            {onShareSupervisorLink && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onShareSupervisorLink}
                title="Share passwordless verification link with your HTE supervisor"
              >
                <IconLink size={14} />
                Share Supervisor Link
              </button>
            )}
            {onOpenDtrModal && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenDtrModal(placement)}
              >
                <IconPrinter size={14} />
                Print Official DTR
              </button>
            )}
          </div>

          <div className="gws-toolbar-secondary">
            {onOpenOfficialEval && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onOpenOfficialEval()}
                title="Evaluate your HTE Supervisor (INST-01) and Faculty OJT Adviser (INST-04)"
              >
                <IconEvaluation size={14} />
                Evaluate (INST-01/04)
              </button>
            )}
            {onOpenClearanceModal && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onOpenClearanceModal(placement)}
              >
                <IconCheckCircle size={14} />
                Clearance Status
              </button>
            )}
            {onOpenDtrTransfer && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onOpenDtrTransfer}
              >
                <IconDownload size={14} />
                Excel Import
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Supervisor Overview Header
  if (role === 'supervisor') {
    return (
      <section className="gws-hero gws-hero-supervisor">
        <div className="gws-hero-top">
          <div className="gws-hero-identity">
            <div className="gws-role-chip gws-chip-adviser">
              <IconBriefcase size={14} />
              <span>Host Training Establishment · Workplace Supervisor</span>
            </div>
            <h1 className="gws-hero-title">{currentUser.display_name}</h1>
            <div className="gws-hero-meta">
              <span className="gws-meta-item">
                <IconBuilding size={13} />
                <strong>{currentUser.unit_label || 'Host Training Establishment'}</strong>
              </span>
              <span className="gws-meta-sep" aria-hidden="true">·</span>
              <span className="gws-meta-item">Department of Computer Engineering Industry Partner</span>
            </div>
          </div>

          <div className="gws-hero-stat-pair">
            <div className="gws-stat-capsule">
              <span className="gws-capsule-label">Verification Queue</span>
              <span className={`gws-capsule-val mono ${supervisorPendingCount > 0 ? 'text-amber' : 'text-emerald'}`}>
                {supervisorPendingCount} {supervisorPendingCount === 1 ? 'log' : 'logs'}
              </span>
            </div>
            <div className="gws-stat-capsule">
              <span className="gws-capsule-label">Active Stage</span>
              <span className="gws-capsule-val text-primary">Stage 2 Sign-off</span>
            </div>
          </div>
        </div>

        {supervisorPendingCount > 0 && (
          <div className="gws-alert-banner is-warning">
            <IconAlert size={16} className="gws-alert-icon text-amber" />
            <span className="gws-alert-text">
              <strong>{supervisorPendingCount} pending attendance {supervisorPendingCount === 1 ? 'log' : 'logs'}</strong> awaiting workplace verification before academic endorsement.
            </span>
            {onVerifyAllSupervisor && (
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={onVerifyAllSupervisor}
              >
                <IconCheckCircle size={13} />
                Verify All ({supervisorPendingCount})
              </button>
            )}
          </div>
        )}

        <div className="gws-hero-toolbar">
          <div className="gws-toolbar-primary">
            {onNavigateTab && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigateTab('timelogs')}
              >
                <IconClock size={14} />
                Review Intern Time Logs
              </button>
            )}
            {onOpenOfficialEval && (
              <button
                type="button"
                className="btn btn-tonal btn-sm"
                onClick={onOpenOfficialEval}
                title="Official 20-criteria trainee performance rubric"
              >
                <IconEvaluation size={14} />
                Official Trainee Rubric
              </button>
            )}
            {onOpenEvalModal && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenEvalModal}
              >
                <IconEvaluation size={14} />
                Quick Evaluation
              </button>
            )}
          </div>
          {onExportCsv && (
            <div className="gws-toolbar-secondary">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onExportCsv}
              >
                <IconDownload size={14} />
                Export Company DTR CSV
              </button>
            </div>
          )}
        </div>
      </section>
    );
  }

  // Faculty Adviser Overview Header
  if (role === 'adviser') {
    return (
      <section className="gws-hero gws-hero-adviser">
        <div className="gws-hero-top">
          <div className="gws-hero-identity">
            <div className="gws-role-chip gws-chip-adviser">
              <IconSupervisor size={14} />
              <span>Faculty Practicum Adviser · Department of Computer Engineering</span>
            </div>
            <h1 className="gws-hero-title">{currentUser.display_name}</h1>
            <div className="gws-hero-meta">
              <span className="gws-meta-item">AY 2026–2027 1st Semester · Academic Supervision</span>
            </div>
          </div>

          <div className="gws-hero-stat-pair">
            <div className="gws-stat-capsule">
              <span className="gws-capsule-label">Ready for Endorsement</span>
              <span className={`gws-capsule-val mono ${adviserPendingCount > 0 ? 'text-primary' : 'text-emerald'}`}>
                {adviserPendingCount} {adviserPendingCount === 1 ? 'log' : 'logs'}
              </span>
            </div>
            <div className="gws-stat-capsule">
              <span className="gws-capsule-label">Workflow Focus</span>
              <span className="gws-capsule-val text-primary">Stage 3 Endorsement</span>
            </div>
          </div>
        </div>

        {adviserPendingCount > 0 && (
          <div className="gws-alert-banner is-info">
            <IconCheckCircle size={16} className="gws-alert-icon text-primary" />
            <span className="gws-alert-text">
              <strong>{adviserPendingCount} time {adviserPendingCount === 1 ? 'log has' : 'logs have'} been verified by HTE supervisors</strong> and are ready for academic endorsement.
            </span>
            {onApproveAllAdviser && (
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={onApproveAllAdviser}
              >
                <IconCheckCircle size={13} />
                Endorse All ({adviserPendingCount})
              </button>
            )}
          </div>
        )}

        <div className="gws-hero-toolbar">
          <div className="gws-toolbar-primary">
            {onNavigateTab && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onNavigateTab('timelogs')}
              >
                <IconClock size={14} />
                Review Time Logs
              </button>
            )}
            {onOpenDtrAudit && (
              <button
                type="button"
                className="btn btn-tonal btn-sm"
                onClick={onOpenDtrAudit}
                title="Audit supervisor-signed DTR documents against digital system logs"
              >
                <IconShieldCheck size={14} />
                Audit Signed DTRs
              </button>
            )}
            {onOpenOfficialEval && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenOfficialEval()}
                title="Faculty Adviser -> HTE Institutional Quality Audit (INST-03)"
              >
                <IconEvaluation size={14} />
                HTE Quality Audit (INST-03)
              </button>
            )}
          </div>

          <div className="gws-toolbar-secondary">
            {onOpenEvalModal && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onOpenEvalModal}
              >
                <IconEvaluation size={14} />
                Quick Evaluation
              </button>
            )}
            {onNavigateTab && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => onNavigateTab('compliance')}
              >
                <IconCheckCircle size={14} />
                Clearance Reports
              </button>
            )}
          </div>
        </div>
      </section>
    );
  }

  // Admin / Coordinator Overview Header (Clean Command Header, KPI strip sits directly below)
  return (
    <section className="gws-hero gws-hero-admin">
      <div className="gws-hero-top">
        <div className="gws-hero-identity">
          <div className="gws-role-chip gws-chip-admin">
            <IconShieldCheck size={14} />
            <span>Practicum Coordination &amp; Administration</span>
          </div>
          <h1 className="gws-hero-title">Department Practicum Dashboard</h1>
          <div className="gws-hero-meta">
            <span className="gws-meta-item">
              Metropolitan Institute of Technology · Department of Computer Engineering
            </span>
            <span className="gws-meta-sep" aria-hidden="true">·</span>
            <span className="gws-meta-item">AY 2026–2027 1st Semester</span>
          </div>
        </div>

        <div className="gws-hero-context-badge">
          <span className="gws-context-dot" />
          <span className="mono">{kpis?.total_placements ?? 0} Placements · {kpis?.completed_placements ?? 0} Cleared</span>
        </div>
      </div>

      <div className="gws-hero-toolbar">
        <div className="gws-toolbar-primary">
          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigateTab('placements')}
            >
              <IconBriefcase size={14} />
              Manage Placements
            </button>
          )}
          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-tonal btn-sm"
              onClick={() => onNavigateTab('employers')}
            >
              <IconBuilding size={14} />
              Partner Companies
            </button>
          )}
          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('compliance')}
            >
              <IconCheckCircle size={14} />
              Clearance Audit
            </button>
          )}
          {onOpenOfficialEval && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenOfficialEval}
              title="Official 360° evaluation instruments & print forms"
            >
              <IconEvaluation size={14} />
              360° Rubrics &amp; Forms
            </button>
          )}
        </div>

        {onNavigateTab && (
          <div className="gws-toolbar-secondary">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigateTab('database-erd')}
            >
              <IconDatabase size={14} />
              Database Schema ERD
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
