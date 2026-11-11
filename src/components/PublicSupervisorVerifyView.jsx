import React, { useState, useMemo } from 'react';
import {
  IconBriefcase,
  IconClock,
  IconCheckCircle,
  IconShieldCheck,
  IconAlert,
  IconPrinter,
  IconBrandLogo,
  IconEdit,
  IconClose
} from './Icons';

export default function PublicSupervisorVerifyView({
  placement,
  timelogs = [],
  onClose,
  onRefresh
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedLogToFlag, setSelectedLogToFlag] = useState(null);
  const [flagReason, setFlagReason] = useState('Please verify and correct the recorded shift hours.');

  const placementLogs = useMemo(() => {
    if (!placement) return [];
    return timelogs.filter((tl) => Number(tl.placement_id) === Number(placement.placement_id));
  }, [timelogs, placement]);

  const totalHours = useMemo(() => {
    return placementLogs
      .filter((tl) => tl.approval_status !== 'flagged')
      .reduce((sum, tl) => sum + Number(tl.hours_rendered || 0), 0);
  }, [placementLogs]);

  const pendingCount = useMemo(() => {
    return placementLogs.filter((tl) => tl.approval_status === 'pending').length;
  }, [placementLogs]);

  const verifiedCount = useMemo(() => {
    return placementLogs.filter((tl) => tl.approval_status === 'supervisor_verified' || tl.approval_status === 'approved').length;
  }, [placementLogs]);

  // One-click Verify All
  const handleVerifyAll = async () => {
    if (!placement) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/timelogs/approve-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: placement.placement_id,
          target_status: 'supervisor_verified',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setVerificationSuccess(true);
        if (onRefresh) onRefresh();
      } else {
        alert(json.error || 'Failed to submit supervisor verification.');
      }
    } catch (err) {
      alert('Error verifying logs: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flag single log for student correction
  const handleConfirmFlag = async () => {
    if (!selectedLogToFlag) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/timelogs/${selectedLogToFlag.log_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedLogToFlag,
          approval_status: 'flagged',
          task_description: `[SUPERVISOR REVISION REQUEST]: ${flagReason} — ${selectedLogToFlag.task_description || ''}`,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setFlagModalOpen(false);
        setSelectedLogToFlag(null);
        if (onRefresh) onRefresh();
      } else {
        alert(json.error || 'Failed to flag log entry.');
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!placement) {
    return (
      <div className="login-backdrop" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="auth-card" style={{ maxWidth: '480px', textAlign: 'center' }}>
          <IconAlert size={36} style={{ color: 'var(--amber)', margin: '0 auto 12px' }} />
          <h2>Placement Verification Link Not Found</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            The requested student placement reference could not be located or has expired.
          </p>
          <button type="button" className="btn btn-primary" style={{ marginTop: '16px' }} onClick={onClose}>
            Go to Practicly Main Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-canvas)', color: 'var(--text-primary)', padding: '24px 16px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* PUBLIC VERIFICATION HEADER */}
        <header
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: 'var(--shadow-sm)',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <IconBrandLogo size={36} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Host Training Establishment (HTE) Attendance Verification Portal
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Metropolitan Institute of Technology · Department of Computer Engineering
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--brand)',
                background: 'var(--brand-subtle)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-pill)',
                border: '1px solid var(--border-default)',
              }}
            >
              Public Access · No Login Required
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={onClose}
              title="Return to main university portal"
            >
              Exit View
            </button>
          </div>
        </header>

        {/* SUCCESS BANNER */}
        {verificationSuccess && (
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--success-bg)',
              border: '1px solid var(--success-border)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <IconCheckCircle size={22} style={{ color: 'var(--success-fg)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--success-fg)' }}>
                Workplace Attendance Verified &amp; Signed Off!
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--success-fg)', marginTop: '4px', lineHeight: 1.5 }}>
                All pending shift entries have been marked as <strong>Supervisor Verified</strong>. The student ({placement.student_name}) has been notified to attach the physical signed copy so that Faculty Adviser <strong>{placement.adviser_name}</strong> can finalize academic endorsement and university clearance.
              </div>
            </div>
          </div>
        )}

        {/* TRAINEE OVERVIEW CARD */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            boxShadow: 'var(--shadow-sm)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Student Trainee
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {placement.student_name}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }} className="mono">
              Student ID: {placement.student_number}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {placement.program || 'BS Computer Engineering'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Host Training Establishment (HTE)
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {placement.company_name}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Designation: <strong>{placement.position_title}</strong>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Signatory: {placement.company_contact_person || 'HTE Supervisor / HR Mentor'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Faculty Academic Adviser
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {placement.adviser_name}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {placement.academic_term || 'AY 2026-2027 1st Sem'}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Required Minimum: {Number(placement.required_hours || 300).toFixed(0)} Hours
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Rendered Practicum Hours
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--brand)', marginTop: '2px' }} className="mono">
              {totalHours.toFixed(2)}h
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              {placementLogs.length} total shifts ({pendingCount} pending verification)
            </div>
          </div>
        </div>

        {/* ACTION TOOLBAR FOR SUPERVISOR */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Supervisor Verification Action
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Review the student's logged daily shifts below and click verify if hours and tasks match company records.
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
              title="Print official attendance log sheet"
            >
              <IconPrinter size={13} />
              Print Summary
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={handleVerifyAll}
              disabled={isSubmitting || pendingCount === 0}
            >
              <IconShieldCheck size={14} />
              {isSubmitting
                ? 'Submitting...'
                : pendingCount === 0
                ? 'All Shifts Verified'
                : `Verify & Confirm All ${pendingCount} Shifts`}
            </button>
          </div>
        </div>

        {/* ATTENDANCE SHIFT RECORDS TABLE */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Daily Time Record (DTR) Shift Logs ({placementLogs.length} Entries)
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Click 'Flag' on any row if hours or task description needs correction by the student.
            </span>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Break</th>
                  <th className="text-right">Net Hours</th>
                  <th>Task Description &amp; Deliverables</th>
                  <th>Status</th>
                  <th className="text-right no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {placementLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No attendance shift logs recorded yet by the student.
                    </td>
                  </tr>
                ) : (
                  placementLogs.map((tl) => (
                    <tr key={tl.log_id}>
                      <td className="mono" style={{ fontWeight: 600 }}>{tl.date}</td>
                      <td className="mono">{tl.time_in}</td>
                      <td className="mono">{tl.time_out}</td>
                      <td className="mono">{tl.break_minutes || 60}m</td>
                      <td className="text-right mono tabular-nums" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                        {Number(tl.hours_rendered).toFixed(2)}h
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '320px' }}>{tl.task_description}</td>
                      <td>
                        {tl.approval_status === 'approved' ? (
                          <span className="badge badge-success">Adviser Endorsed</span>
                        ) : tl.approval_status === 'supervisor_verified' ? (
                          <span className="badge badge-info">Supervisor Verified</span>
                        ) : tl.approval_status === 'flagged' ? (
                          <span className="badge badge-warning">Needs Correction</span>
                        ) : (
                          <span className="badge badge-neutral">Pending Sign-off</span>
                        )}
                      </td>
                      <td className="text-right no-print">
                        {tl.approval_status !== 'flagged' && (
                          <button
                            type="button"
                            className="btn btn-ghost-danger btn-xs"
                            onClick={() => {
                              setSelectedLogToFlag(tl);
                              setFlagModalOpen(true);
                            }}
                            title="Flag if incorrect so student can re-edit"
                          >
                            <IconAlert size={12} />
                            Flag
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <footer style={{ textAlign: 'center', padding: '16px 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          Metropolitan Institute of Technology · Commission on Higher Education (CHED) CMO 104 Series of 2017 Practicum Standard
        </footer>
      </div>

      {/* FLAG / REVISION MODAL */}
      {flagModalOpen && selectedLogToFlag && (
        <div className="modal-backdrop" onClick={() => setFlagModalOpen(false)}>
          <div className="modal-card modal-entry-card" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Request DTR Correction from Student</div>
              <button type="button" className="modal-close-btn" onClick={() => setFlagModalOpen(false)}>
                <IconClose size={16} />
              </button>
            </div>
            <div className="modal-body modal-entry-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Specify why this entry ({selectedLogToFlag.date} — {selectedLogToFlag.hours_rendered}h) is flagged. The student will be prompted to re-edit it in their portal.
              </p>
              <div className="field">
                <label className="field-label">Correction Note / Reason</label>
                <textarea
                  className="input"
                  style={{ minHeight: '80px', fontSize: '12px' }}
                  value={flagReason}
                  onChange={(e) => setFlagReason(e.target.value)}
                  placeholder="e.g. Please verify time in, lunch break exceeded 1 hour, etc."
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setFlagModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={handleConfirmFlag} disabled={isSubmitting}>
                  Confirm &amp; Notify Student to Re-edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
