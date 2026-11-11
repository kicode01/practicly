import React from 'react';
import {
  IconClock,
  IconBuilding,
  IconSupervisor,
  IconShieldCheck,
  IconCheckCircle,
} from './Icons';

/**
 * WorkflowPipelineIndicator
 * Visualizes the 4-stage practicum verification & clearance lifecycle:
 * [Stage 1: Workplace Attendance] -> [Stage 2: HTE Supervisor Verification] -> [Stage 3: Faculty Adviser Endorsement] -> [Stage 4: Department Clearance]
 */
export default function WorkflowPipelineIndicator({
  currentRole = 'student',
  activeStage = 2,
  pendingSupervisorCount = 0,
  pendingAdviserCount = 0,
  hoursCompleted = 0,
  requiredHours = 300,
  isCleared = false,
  compact = false,
}) {
  const stages = [
    {
      stage: 1,
      name: '1. Student DTR Input',
      subtext: 'Daily logs & task submission',
      icon: IconClock,
      statusLabel: `${Number(hoursCompleted).toFixed(1)} / ${Number(requiredHours).toFixed(0)} hrs`,
      roleLabel: 'Student',
      isCurrentRole: currentRole === 'student',
    },
    {
      stage: 2,
      name: '2. Supervisor Link Verification',
      subtext: 'Zero-login link verification',
      icon: IconBuilding,
      statusLabel:
        pendingSupervisorCount > 0
          ? `${pendingSupervisorCount} Pending Review`
          : 'Supervisor Verified',
      roleLabel: 'HTE Supervisor (via Link)',
      isCurrentRole: false,
      hasAlert: pendingSupervisorCount > 0,
    },
    {
      stage: 3,
      name: '3. Signed Proof & Adviser Audit',
      subtext: 'Upload signed DTR & cross-audit',
      icon: IconSupervisor,
      statusLabel:
        pendingAdviserCount > 0
          ? `${pendingAdviserCount} Awaiting Audit`
          : 'Adviser Endorsed',
      roleLabel: 'Faculty Adviser',
      isCurrentRole: currentRole === 'adviser',
      hasAlert: pendingAdviserCount > 0,
    },
    {
      stage: 4,
      name: '4. Admin Clearance',
      subtext: 'CHED CMO 104 final certificate',
      icon: IconShieldCheck,
      statusLabel: isCleared ? 'Clearance Issued' : 'Final Clearance',
      roleLabel: 'Admin / Coordinator',
      isCurrentRole: currentRole === 'admin',
    },
  ];

  return (
    <div className={`pipeline-indicator-panel ${compact ? 'is-compact' : ''}`}>
      <div className="pipeline-header">
        <div className="pipeline-title-row">
          <span className="pipeline-badge">Practicum Lifecycle</span>
          <span className="pipeline-title">4-Stage Verification &amp; Clearance Pipeline</span>
        </div>
        <div className="pipeline-role-hint">
          Active Role:{' '}
          <span className="pipeline-active-role">
            {currentRole === 'adviser'
              ? 'Stage 3 · Faculty OJT Adviser (Audit & Endorsement)'
              : currentRole === 'student'
              ? 'Stage 1 · Student Intern (Logs & Signed Upload)'
              : 'Stage 4 · Practicum Coordinator & Dean (Final Clearance)'}
          </span>
        </div>
      </div>

      <div className="pipeline-stepper" role="list">
        {stages.map((st, idx) => {
          const IconComp = st.icon;
          const isDone = activeStage > st.stage || (st.stage === 4 && isCleared);
          const isCurrent = activeStage === st.stage && !(st.stage === 4 && isCleared);
          const isRoleFocus = st.isCurrentRole;

          return (
            <React.Fragment key={st.stage}>
              <div
                role="listitem"
                className={`pipeline-step ${isDone ? 'is-done' : ''} ${
                  isCurrent ? 'is-current' : ''
                } ${isRoleFocus ? 'is-role-focus' : ''}`}
              >
                <div className="pipeline-step-node">
                  {isDone ? (
                    <IconCheckCircle size={16} />
                  ) : (
                    <IconComp size={16} />
                  )}
                  <span className="pipeline-node-number">{st.stage}</span>
                </div>

                <div className="pipeline-step-content">
                  <div className="pipeline-step-role-tag">{st.roleLabel}</div>
                  <div className="pipeline-step-name">{st.name}</div>
                  <div className="pipeline-step-sub">{st.subtext}</div>
                  <div
                    className={`pipeline-step-status ${
                      st.hasAlert ? 'has-alert' : isDone ? 'is-done' : ''
                    }`}
                  >
                    {st.statusLabel}
                  </div>
                </div>
              </div>

              {idx < stages.length - 1 && (
                <div
                  className={`pipeline-connector ${
                    activeStage > st.stage ? 'is-connected' : ''
                  }`}
                  aria-hidden="true"
                >
                  <div className="pipeline-connector-line" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
