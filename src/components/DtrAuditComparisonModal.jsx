import React, { useState, useMemo } from 'react';
import {
  IconClose,
  IconFileText,
  IconClock,
  IconCheckCircle,
  IconAlert,
  IconShieldCheck,
  IconDownload,
  IconEye,
  IconExternalLink,
  IconEdit
} from './Icons';

export default function DtrAuditComparisonModal({
  isOpen,
  onClose,
  placement,
  timelogs = [],
  onEndorseAll,
  onUpdateApproval,
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('side_by_side'); // 'side_by_side' | 'document_only' | 'digital_only'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedLogToFlag, setSelectedLogToFlag] = useState(null);
  const [flagReason, setFlagReason] = useState('Discrepancy detected between digital shift and uploaded signed physical DTR.');

  if (!isOpen || !placement) return null;

  const placementLogs = useMemo(() => {
    return timelogs.filter((tl) => Number(tl.placement_id) === Number(placement.placement_id));
  }, [timelogs, placement]);

  const totalDigitalHours = useMemo(() => {
    return placementLogs
      .filter((tl) => tl.approval_status !== 'flagged')
      .reduce((sum, tl) => sum + Number(tl.hours_rendered || 0), 0);
  }, [placementLogs]);

  const supervisorVerifiedCount = useMemo(() => {
    return placementLogs.filter((tl) => tl.approval_status === 'supervisor_verified').length;
  }, [placementLogs]);

  const approvedCount = useMemo(() => {
    return placementLogs.filter((tl) => tl.approval_status === 'approved').length;
  }, [placementLogs]);

  const pendingSupervisorCount = useMemo(() => {
    return placementLogs.filter((tl) => tl.approval_status === 'pending').length;
  }, [placementLogs]);

  const flaggedCount = useMemo(() => {
    return placementLogs.filter((tl) => tl.approval_status === 'flagged').length;
  }, [placementLogs]);

  const hasSignedDtr = Boolean(placement.signed_dtr_filename || placement.signed_dtr_file);

  const handleEndorseVerified = async () => {
    setIsSubmitting(true);
    try {
      if (onEndorseAll) {
        await onEndorseAll(placement.placement_id);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmFlag = async () => {
    if (!selectedLogToFlag || !onUpdateApproval) return;
    setIsSubmitting(true);
    try {
      await onUpdateApproval(selectedLogToFlag, 'flagged');
      setFlagModalOpen(false);
      setSelectedLogToFlag(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card modal-entry-card"
        style={{ maxWidth: '1100px', width: '96vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div className="modal-header-identity">
            <div className="modal-header-icon-box">
              <IconShieldCheck size={18} />
            </div>
            <div>
              <div className="modal-title">
                DTR Academic Cross-Audit &amp; Comparison
              </div>
              <div className="modal-subtitle">
                Compare student's digital time records against official physical signed copy prior to final endorsement
              </div>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose size={16} />
          </button>
        </div>

        {/* METRICS & CONTEXT STRIP */}
        <div
          style={{
            padding: '12px 16px',
            background: 'var(--bg-subtle)',
            borderBottom: '1px solid var(--border-default)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            fontSize: '11.5px',
            flexShrink: 0
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Intern Name &amp; ID:</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
              {placement.student_name} ({placement.student_number})
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Host Company (HTE):</span>
            <strong style={{ color: 'var(--text-primary)', fontSize: '12px' }}>
              {placement.company_name}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Digitally Logged Hours:</span>
            <strong style={{ color: 'var(--brand)', fontSize: '12px' }}>
              {totalDigitalHours.toFixed(1)} / {Number(placement.required_hours || 300).toFixed(0)} hrs
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Physical Signed Copy:</span>
            {hasSignedDtr ? (
              <span style={{ color: 'var(--color-success, #10b981)', fontWeight: 600 }}>
                Signed DTR on File
              </span>
            ) : (
              <span style={{ color: 'var(--color-warning, #f59e0b)', fontWeight: 600 }}>
                Awaiting Student Upload
              </span>
            )}
          </div>
        </div>

        {/* VIEW MODE SELECTOR */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'side_by_side' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('side_by_side')}
            >
              Side-by-Side Audit
            </button>
            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'document_only' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('document_only')}
            >
              Signed Physical Document View
            </button>
            <button
              type="button"
              className={`btn btn-xs ${activeTab === 'digital_only' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('digital_only')}
            >
              Digital Shifts Ledger ({placementLogs.length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <span>Supervisor Verified: <strong>{supervisorVerifiedCount}</strong></span>
            <span>·</span>
            <span>Adviser Endorsed: <strong>{approvedCount}</strong></span>
            <span>·</span>
            <span>Pending Supervisor: <strong>{pendingSupervisorCount}</strong></span>
          </div>
        </div>

        {/* AUDIT BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', gap: '16px', minHeight: '380px' }}>
          {/* LEFT: DIGITAL LOGS (Shown in side_by_side or digital_only) */}
          {(activeTab === 'side_by_side' || activeTab === 'digital_only') && (
            <div
              style={{
                flex: activeTab === 'side_by_side' ? '1 1 50%' : '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                background: 'var(--bg-surface)',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Digital Daily Time Records ({placementLogs.length} shifts)
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Rendered: <strong>{totalDigitalHours.toFixed(1)} hrs</strong>
                </div>
              </div>

              {placementLogs.length === 0 ? (
                <div style={{ padding: '30px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  No digital time logs submitted by student yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {placementLogs.map((tl) => (
                    <div
                      key={tl.log_id}
                      style={{
                        padding: '10px 12px',
                        background: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {tl.date}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--brand)' }}>
                            +{Number(tl.hours_rendered).toFixed(2)} hrs
                          </span>
                          <span
                            className={`badge badge-${
                              tl.approval_status === 'approved'
                                ? 'success'
                                : tl.approval_status === 'supervisor_verified'
                                ? 'primary'
                                : tl.approval_status === 'flagged'
                                ? 'danger'
                                : 'warning'
                            }`}
                            style={{ fontSize: '10px' }}
                          >
                            {tl.approval_status === 'approved'
                              ? 'Adviser Endorsed'
                              : tl.approval_status === 'supervisor_verified'
                              ? 'Supervisor Verified'
                              : tl.approval_status === 'flagged'
                              ? 'Flagged'
                              : 'Pending Supervisor'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                        <span>In: <strong>{String(tl.time_in).slice(0, 5)}</strong></span>
                        <span>Out: <strong>{String(tl.time_out).slice(0, 5)}</strong></span>
                        <span>Break: <strong>{tl.break_minutes}m</strong></span>
                      </div>

                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {tl.task_description}
                      </div>

                      {/* INDIVIDUAL SHIFT ENDORSEMENT CONTROLS */}
                      {currentUser?.role === 'adviser' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                          {tl.approval_status !== 'approved' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              style={{ color: 'var(--color-success, #10b981)' }}
                              onClick={() => onUpdateApproval && onUpdateApproval(tl, 'approved')}
                              title="Endorse this shift to Admin"
                            >
                              <IconCheckCircle size={11} />
                              Endorse Shift
                            </button>
                          )}
                          {tl.approval_status !== 'flagged' && (
                            <button
                              type="button"
                              className="btn btn-secondary btn-xs"
                              style={{ color: 'var(--color-danger, #ef4444)' }}
                              onClick={() => {
                                setSelectedLogToFlag(tl);
                                setFlagModalOpen(true);
                              }}
                              title="Flag discrepancy with physical copy"
                            >
                              <IconAlert size={11} />
                              Flag Discrepancy
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RIGHT: SIGNED PHYSICAL DOCUMENT (Shown in side_by_side or document_only) */}
          {(activeTab === 'side_by_side' || activeTab === 'document_only') && (
            <div
              style={{
                flex: activeTab === 'side_by_side' ? '1 1 50%' : '1 1 100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                background: 'var(--bg-surface)',
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Scanned Physical DTR Document
                </div>
                {hasSignedDtr && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        if (placement.signed_dtr_data) {
                          const win = window.open();
                          win.document.write('<iframe src="' + placement.signed_dtr_data + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                        } else if (placement.signed_dtr_file) {
                          window.open(placement.signed_dtr_file, '_blank');
                        }
                      }}
                      title="Open in separate window"
                    >
                      <IconExternalLink size={12} />
                      Fullscreen
                    </button>
                  </div>
                )}
              </div>

              {!hasSignedDtr ? (
                <div
                  style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-default)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px'
                  }}
                >
                  <IconAlert size={28} style={{ color: 'var(--color-warning, #f59e0b)' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    No Signed Physical DTR Uploaded Yet
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', maxWidth: '360px', lineHeight: 1.5 }}>
                    The intern has not yet uploaded their scanned physical DTR signed by their HTE Supervisor. You may advise the student to upload their signed copy before granting full academic endorsement.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* DOCUMENT META */}
                  <div
                    style={{
                      padding: '10px 12px',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      border: '1px solid var(--border-default)'
                    }}
                  >
                    <div><strong>File:</strong> {placement.signed_dtr_filename}</div>
                    <div style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                      <strong>Uploaded:</strong> {placement.signed_dtr_uploaded_at || 'Recorded on file'}
                    </div>
                    {placement.signed_dtr_notes && (
                      <div style={{ marginTop: '4px', color: 'var(--text-secondary)' }}>
                        <strong>Student Remarks:</strong> {placement.signed_dtr_notes}
                      </div>
                    )}
                  </div>

                  {/* PREVIEW CONTAINER */}
                  <div
                    style={{
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      background: '#1e293b',
                      minHeight: '400px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {placement.signed_dtr_data && placement.signed_dtr_data.startsWith('data:image/') ? (
                      <img
                        src={placement.signed_dtr_data}
                        alt="Signed DTR Preview"
                        style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain' }}
                      />
                    ) : placement.signed_dtr_data && placement.signed_dtr_data.startsWith('data:application/pdf') ? (
                      <iframe
                        src={placement.signed_dtr_data}
                        title="Signed DTR PDF"
                        style={{ width: '100%', height: '550px', border: 'none' }}
                      />
                    ) : (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                        <IconFileText size={36} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--brand)' }} />
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                          {placement.signed_dtr_filename}
                        </div>
                        <div style={{ fontSize: '11px', marginTop: '6px' }}>
                          Physical document verified and archived in repository.
                        </div>
                        <button
                          type="button"
                          className="btn btn-secondary btn-xs"
                          style={{ marginTop: '12px' }}
                          onClick={() => {
                            if (placement.signed_dtr_file) window.open(placement.signed_dtr_file, '_blank');
                          }}
                        >
                          <IconDownload size={12} />
                          Download / Inspect File
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER & ENDORSEMENT BAR */}
        <div
          className="modal-footer"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            borderTop: '1px solid var(--border-default)',
            background: 'var(--bg-surface)'
          }}
        >
          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Status: {supervisorVerifiedCount} shifts verified by HTE Supervisor · {approvedCount} shifts endorsed by Adviser
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>

            {currentUser?.role === 'adviser' && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleEndorseVerified}
                disabled={isSubmitting || (supervisorVerifiedCount === 0 && approvedCount === placementLogs.length)}
                title="Endorse all supervisor-verified shifts directly to Practicum Coordinator / Admin"
              >
                <IconCheckCircle size={14} />
                {isSubmitting
                  ? 'Endorsing...'
                  : supervisorVerifiedCount > 0
                  ? `Endorse ${supervisorVerifiedCount} Verified Shifts to Admin`
                  : 'All Verified Shifts Endorsed'}
              </button>
            )}
          </div>
        </div>

        {/* FLAG DISCREPANCY REASON MODAL */}
        {flagModalOpen && selectedLogToFlag && (
          <div
            className="modal-backdrop"
            style={{ zIndex: 1200 }}
            onClick={() => setFlagModalOpen(false)}
          >
            <div
              className="modal-card modal-entry-card"
              style={{ maxWidth: '500px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div className="modal-header-identity">
                  <div className="modal-header-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger, #ef4444)' }}>
                    <IconAlert size={18} />
                  </div>
                  <div>
                    <div className="modal-title">Flag Shift Discrepancy</div>
                    <div className="modal-subtitle">
                      Return shift on {selectedLogToFlag.date} ({Number(selectedLogToFlag.hours_rendered).toFixed(2)} hrs) to student for correction
                    </div>
                  </div>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setFlagModalOpen(false)}>
                  <IconClose size={16} />
                </button>
              </div>

              <div className="modal-body modal-entry-body">
                <div className="field">
                  <label className="field-label">Discrepancy Note to Intern</label>
                  <textarea
                    className="input"
                    rows={3}
                    value={flagReason}
                    onChange={(e) => setFlagReason(e.target.value)}
                    placeholder="Specify the discrepancy found between the digital log and physical DTR..."
                  />
                  <span className="field-hint">
                    This note will be displayed to the student so they can edit and resubmit the shift.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setFlagModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmFlag}
                  disabled={isSubmitting}
                >
                  <IconAlert size={14} />
                  {isSubmitting ? 'Flagging...' : 'Confirm Discrepancy Flag'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
