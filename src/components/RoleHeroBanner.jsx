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
  IconLink
} from './Icons';

export default function RoleHeroBanner({
  currentUser,
  placement,
  kpis,
  supervisorPendingCount = 0,
  adviserPendingCount = 0,
  activeShift,
  shiftElapsedSeconds = 0,
  onClockIn,
  onClockOut,
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
  onOpenDtrTransfer
}) {
  const role = currentUser?.role;

  const formatHours = (val) => Number(val || 0).toFixed(1);

  // Student POV Banner
  if (role === 'student') {
    if (!placement) {
      return (
        <div className="role-hero-banner role-hero-student">
          <div className="role-hero-main">
            <div className="role-hero-badge">
              <IconStudent size={16} />
              <span>Student Practicum Portal</span>
            </div>
            <h1 className="role-hero-title">Welcome, {currentUser.display_name}</h1>
            <p className="role-hero-sub">
              Your student account ({currentUser.identifier_code}) is active. Please await your Host Training Establishment (HTE) placement assignment from the practicum coordinator.
            </p>
          </div>
        </div>
      );
    }

    const completed = Number(placement.total_hours_completed || 0);
    const required = Number(placement.required_hours || 300);
    const pct = Math.min(100, Math.round((completed / (required || 1)) * 100));
    const remaining = Math.max(0, required - completed);

    return (
      <div className="role-hero-banner role-hero-student">
        <div className="role-hero-top-row">
          <div className="role-hero-identity">
            <div className="role-hero-badge">
              <IconStudent size={14} />
              <span>Practicum Intern · {placement.program || 'BS Computer Engineering'}</span>
            </div>
            <h1 className="role-hero-title">{currentUser.display_name}</h1>
            <div className="role-hero-meta-row">
              <span className="role-hero-meta-item">
                <IconBriefcase size={13} />
                <strong>{placement.company_name}</strong>
              </span>
              <span className="role-hero-meta-sep">·</span>
              <span className="role-hero-meta-item">{placement.position_title}</span>
              <span className="role-hero-meta-sep">·</span>
              <span className="role-hero-meta-item">
                Adviser: <strong>{placement.adviser_name}</strong>
              </span>
              {onEditProfile && (
                <>
                  <span className="role-hero-meta-sep">·</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={onEditProfile}
                    title="Edit contact number or section"
                    style={{ padding: '2px 8px', height: '22px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <IconEdit size={12} />
                    Edit Profile
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="role-hero-progress-card">
            <div className="role-hero-progress-labels">
              <span className="role-hero-progress-label">Practicum Progress</span>
              <span className="role-hero-progress-val mono">
                <strong>{formatHours(completed)}</strong> / {required} hrs ({pct}%)
              </span>
            </div>
            <div className="role-hero-progress-track">
              <div
                className="role-hero-progress-fill"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="role-hero-progress-foot">
              <span>{remaining <= 0 ? 'Clearance requirement fulfilled!' : `${formatHours(remaining)} hrs remaining`}</span>
              <span>{placement.evaluation_count || 0}/2 evaluations</span>
            </div>
          </div>
        </div>

        <div className="role-hero-actions">
          {onOpenLogModal && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onOpenLogModal}
            >
              <IconPlus size={16} />
              Log Attendance
            </button>
          )}

          {activeShift ? (
            <button
              type="button"
              className="btn btn-danger"
              onClick={onClockOut}
            >
              <IconClock size={16} />
              Clock Out ({Math.floor(shiftElapsedSeconds / 3600)}h {Math.floor((shiftElapsedSeconds % 3600) / 60)}m)
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClockIn}
            >
              <IconClock size={16} />
              Clock In Shift
            </button>
          )}

          {onShareSupervisorLink && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onShareSupervisorLink}
              title="Share verification link to your HTE company supervisor (no account required)"
            >
              <IconLink size={16} />
              Share Link to Supervisor
            </button>
          )}
        </div>

        {/* PRACTICUM ACTION HUB (ORGANIZED M3 TILES) */}
        <div className="role-hero-hub-grid">
          {/* HUB TILE 1: SUPERVISOR SIGN-OFF & UPLOAD */}
          <div className="role-hub-card">
            <div className="role-hub-card-header">
              <div className="role-hub-icon-box">
                <IconBuilding size={20} />
              </div>
              <div>
                <div className="role-hub-card-title">Supervisor Verification Hub</div>
                <div className="role-hub-card-desc">Passwordless shareable verification link &amp; physical signed proof</div>
              </div>
            </div>
            <div className="role-hub-card-actions">
              {onShareSupervisorLink && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onShareSupervisorLink}
                >
                  <IconLink size={14} />
                  Share Link
                </button>
              )}
              {onUploadSignedDtr && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onUploadSignedDtr}
                >
                  <IconUpload size={14} />
                  Upload Signed DTR
                </button>
              )}
            </div>
          </div>

          {/* HUB TILE 2: OFFICIAL DOCUMENTATION */}
          <div className="role-hub-card">
            <div className="role-hub-card-header">
              <div className="role-hub-icon-box">
                <IconFileText size={20} />
              </div>
              <div>
                <div className="role-hub-card-title">Practicum Documentation</div>
                <div className="role-hub-card-desc">Official printable attendance log &amp; institutional clearance</div>
              </div>
            </div>
            <div className="role-hub-card-actions">
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
              {onOpenClearanceModal && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenClearanceModal(placement)}
                >
                  <IconCheckCircle size={14} />
                  Clearance Status
                </button>
              )}
            </div>
          </div>

          {/* HUB TILE 3: EVALUATIONS & IMPORT */}
          <div className="role-hub-card">
            <div className="role-hub-card-header">
              <div className="role-hub-icon-box">
                <IconEvaluation size={20} />
              </div>
              <div>
                <div className="role-hub-card-title">Evaluations &amp; Import</div>
                <div className="role-hub-card-desc">Assessment rubrics &amp; batch historical attendance import</div>
              </div>
            </div>
            <div className="role-hub-card-actions">
              {onOpenOfficialEval && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenOfficialEval}
                >
                  <IconEvaluation size={14} />
                  Evaluate
                </button>
              )}
              {onOpenDtrTransfer && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={onOpenDtrTransfer}
                >
                  <IconDownload size={14} />
                  Excel Import
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Supervisor POV Banner
  if (role === 'supervisor') {
    return (
      <div className="role-hero-banner role-hero-supervisor">
        <div className="role-hero-top-row">
          <div className="role-hero-identity">
            <div className="role-hero-badge">
              <IconBriefcase size={14} />
              <span>Host Training Establishment (HTE) Workplace Supervisor</span>
            </div>
            <h1 className="role-hero-title">{currentUser.display_name}</h1>
            <div className="role-hero-meta-row">
              <span className="role-hero-meta-item">
                <IconBuilding size={13} />
                <strong>{currentUser.unit_label || 'Host Training Establishment'}</strong>
              </span>
              <span className="role-hero-meta-sep">·</span>
              <span className="role-hero-meta-item">Department of Computer Engineering Industry Partner</span>
            </div>
          </div>

          <div className="role-hero-stats-capsules">
            <div className="role-hero-stat-pill">
              <span className="stat-pill-label">Verification Queue</span>
              <span className={`stat-pill-val ${supervisorPendingCount > 0 ? 'text-amber' : 'text-emerald'} mono`}>
                {supervisorPendingCount} logs
              </span>
            </div>
            <div className="role-hero-stat-pill">
              <span className="stat-pill-label">Stage</span>
              <span className="stat-pill-val text-primary">Stage 1 Workplace Sign-off</span>
            </div>
          </div>
        </div>

        {supervisorPendingCount > 0 && (
          <div className="role-hero-alert-bar">
            <IconAlert size={14} className="text-amber" />
            <span>
              You have <strong>{supervisorPendingCount} pending attendance {supervisorPendingCount === 1 ? 'log' : 'logs'}</strong> awaiting workplace verification. Verify them to forward to the faculty adviser for academic credit.
            </span>
            {onVerifyAllSupervisor && (
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={onVerifyAllSupervisor}
              >
                <IconCheckCircle size={12} />
                Verify All ({supervisorPendingCount})
              </button>
            )}
          </div>
        )}

        <div className="role-hero-actions">
          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigateTab('timelogs')}
            >
              <IconClock size={13} />
              Review Intern Time Logs
            </button>
          )}

          {onOpenOfficialEval && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenOfficialEval}
              title="Official 20-criteria trainee performance rubric"
            >
              <IconEvaluation size={13} />
              Official Trainee Rubric
            </button>
          )}

          {onOpenEvalModal && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenEvalModal}
            >
              <IconEvaluation size={13} />
              Quick Evaluation
            </button>
          )}

          {onExportCsv && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onExportCsv}
            >
              <IconDownload size={13} />
              Export Company DTR CSV
            </button>
          )}
        </div>
      </div>
    );
  }

  // Faculty Adviser POV Banner
  if (role === 'adviser') {
    return (
      <div className="role-hero-banner role-hero-adviser">
        <div className="role-hero-top-row">
          <div className="role-hero-identity">
            <div className="role-hero-badge">
              <IconSupervisor size={14} />
              <span>Faculty Practicum Adviser · Department of Computer Engineering</span>
            </div>
            <h1 className="role-hero-title">{currentUser.display_name}</h1>
            <div className="role-hero-meta-row">
              <span className="role-hero-meta-item">
                AY 2026–2027 1st Semester · Academic Supervision
              </span>
            </div>
          </div>

          <div className="role-hero-stats-capsules">
            <div className="role-hero-stat-pill">
              <span className="stat-pill-label">Ready for Endorsement</span>
              <span className={`stat-pill-val ${adviserPendingCount > 0 ? 'text-primary' : 'text-emerald'} mono`}>
                {adviserPendingCount} logs
              </span>
            </div>
            <div className="role-hero-stat-pill">
              <span className="stat-pill-label">Workflow Stage</span>
              <span className="stat-pill-val text-primary">Stage 2 Academic Endorsement</span>
            </div>
          </div>
        </div>

        {adviserPendingCount > 0 && (
          <div className="role-hero-alert-bar">
            <IconCheckCircle size={14} className="text-primary" />
            <span>
              <strong>{adviserPendingCount} time {adviserPendingCount === 1 ? 'log has' : 'logs have'} been verified by HTE supervisors</strong> and are ready for faculty academic endorsement and hour crediting.
            </span>
            {onApproveAllAdviser && (
              <button
                type="button"
                className="btn btn-primary btn-xs"
                onClick={onApproveAllAdviser}
              >
                <IconCheckCircle size={12} />
                Endorse All ({adviserPendingCount})
              </button>
            )}
          </div>
        )}

        <div className="role-hero-actions">
          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigateTab('adviser-monitoring')}
            >
              <IconSupervisor size={13} />
              Advisee Monitoring Grid
            </button>
          )}

          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onNavigateTab('timelogs')}
            >
              <IconClock size={13} />
              Review Time Logs
            </button>
          )}

          {onOpenDtrAudit && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenDtrAudit}
              title="Audit supervisor-signed DTR documents against student system logs"
            >
              <IconShieldCheck size={13} />
              Audit Signed DTRs
            </button>
          )}

          {onOpenOfficialEval && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onOpenOfficialEval}
              title="Official 360° Rubrics (HTE compliance and trainee evaluation)"
            >
              <IconEvaluation size={13} />
              Official 360° Rubrics
            </button>
          )}

          {onOpenEvalModal && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onOpenEvalModal}
            >
              <IconEvaluation size={13} />
              Quick Evaluation
            </button>
          )}

          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigateTab('compliance')}
            >
              <IconCheckCircle size={13} />
              Clearance Reports
            </button>
          )}
        </div>
      </div>
    );
  }

  // Admin / Coordinator POV Banner
  return (
    <div className="role-hero-banner role-hero-admin">
      <div className="role-hero-top-row">
        <div className="role-hero-identity">
          <div className="role-hero-badge">
            <IconShieldCheck size={14} />
            <span>Practicum Coordination &amp; Administration</span>
          </div>
          <h1 className="role-hero-title">Department Practicum Dashboard</h1>
          <div className="role-hero-meta-row">
            <span className="role-hero-meta-item">
              Metropolitan Institute of Technology · Department of Computer Engineering
            </span>
            <span className="role-hero-meta-sep">·</span>
            <span className="role-hero-meta-item">AY 2026–2027 1st Semester</span>
          </div>
        </div>

        <div className="role-hero-stats-capsules">
          <div className="role-hero-stat-pill">
            <span className="stat-pill-label">Total Placements</span>
            <span className="stat-pill-val mono">{kpis?.total_placements ?? 0}</span>
          </div>
          <div className="role-hero-stat-pill">
            <span className="stat-pill-label">Accredited HTEs</span>
            <span className="stat-pill-val mono">{kpis?.total_employers ?? 0}</span>
          </div>
          <div className="role-hero-stat-pill">
            <span className="stat-pill-label">Completed</span>
            <span className="stat-pill-val text-emerald mono">{kpis?.completed_placements ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="role-hero-actions">
        {onNavigateTab && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => onNavigateTab('placements')}
          >
            <IconBriefcase size={13} />
            Manage Placements
          </button>
        )}

        {onNavigateTab && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab('employers')}
          >
            <IconBuilding size={13} />
            Partner Companies (HTEs)
          </button>
        )}

        {onNavigateTab && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigateTab('compliance')}
          >
            <IconCheckCircle size={13} />
            Clearance Audit
          </button>
        )}

        {onOpenOfficialEval && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenOfficialEval}
            title="Institutional 360° evaluation instruments & print forms"
          >
            <IconEvaluation size={13} />
            Official 360° Rubrics &amp; Forms
          </button>
        )}

        {onNavigateTab && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onNavigateTab('database-erd')}
          >
            <IconDatabase size={13} />
            Database Schema ERD
          </button>
        )}
      </div>
    </div>
  );
}
