import React from 'react';
import { IconCheckCircle } from './Icons';

/**
 * WorkflowPipelineIndicator
 * Unified Material Design 3 4-stage verification & clearance stepper.
 * Eliminates duplicate checklists by embedding stage-specific telemetry cleanly.
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
  stepsMeta = null,
}) {
  const stages = [
    {
      stage: 1,
      name: 'Attendance & DTR Input',
      subtext: stepsMeta?.step1Sub || 'Daily logs & task submissions',
      statusLabel: stepsMeta?.step1Status || `${Number(hoursCompleted).toFixed(1)} / ${Number(requiredHours).toFixed(0)} hrs`,
      roleLabel: 'Step 1 · Student',
      isCurrentRole: currentRole === 'student',
      isComplete: Number(hoursCompleted) >= Number(requiredHours || 300) || activeStage > 1,
    },
    {
      stage: 2,
      name: 'Supervisor Verification',
      subtext: stepsMeta?.step2Sub || 'Zero-login HTE verification',
      statusLabel:
        stepsMeta?.step2Status ||
        (pendingSupervisorCount > 0
          ? `${pendingSupervisorCount} Pending Review`
          : 'Supervisor Verified'),
      roleLabel: 'Step 2 · HTE Supervisor',
      isCurrentRole: currentRole === 'supervisor',
      hasAlert: pendingSupervisorCount > 0,
      isComplete: pendingSupervisorCount === 0 && (activeStage > 2 || isCleared),
    },
    {
      stage: 3,
      name: 'Adviser Audit & Eval',
      subtext: stepsMeta?.step3Sub || 'Signed DTR audit & rubric',
      statusLabel:
        stepsMeta?.step3Status ||
        (pendingAdviserCount > 0
          ? `${pendingAdviserCount} Awaiting Audit`
          : 'Adviser Endorsed'),
      roleLabel: 'Step 3 · Faculty Adviser',
      isCurrentRole: currentRole === 'adviser',
      hasAlert: pendingAdviserCount > 0,
      isComplete: activeStage > 3 || isCleared,
    },
    {
      stage: 4,
      name: 'OJT Clearance Certificate',
      subtext: stepsMeta?.step4Sub || 'CHED CMO 104 final sign-off',
      statusLabel: stepsMeta?.step4Status || (isCleared ? 'Clearance Issued' : 'Pending Final Review'),
      roleLabel: 'Step 4 · Coordinator',
      isCurrentRole: currentRole === 'admin',
      isComplete: isCleared,
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
          Your Focus:{' '}
          <span className="pipeline-active-role">
            {currentRole === 'adviser'
              ? 'Stage 3 · Faculty OJT Adviser Audit & Endorsement'
              : currentRole === 'supervisor'
              ? 'Stage 2 · HTE Workplace DTR Verification'
              : currentRole === 'student'
              ? 'Stage 1 · Student Intern Logs & Signed Proof'
              : 'Stage 4 · Practicum Coordinator Final Clearance'}
          </span>
        </div>
      </div>

      <div className="pipeline-stepper" role="list">
        {stages.map((st, idx) => {
          const isDone = st.isComplete || activeStage > st.stage || (st.stage === 4 && isCleared);
          const isCurrent = activeStage === st.stage && !isDone;
          const isRoleFocus = st.isCurrentRole;

          return (
            <React.Fragment key={st.stage}>
              <div
                role="listitem"
                className={`pipeline-step ${isDone ? 'is-done' : ''} ${
                  isCurrent ? 'is-current' : ''
                } ${isRoleFocus ? 'is-role-focus' : ''}`}
              >
                <div className="pipeline-step-node" aria-hidden="true">
                  {isDone ? <IconCheckCircle size={16} /> : <span>{st.stage}</span>}
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
                  className={`pipeline-connector ${isDone ? 'is-connected' : ''}`}
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
