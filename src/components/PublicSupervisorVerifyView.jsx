import React, { useState, useMemo, useEffect } from 'react';
import { apiFetch } from '../utils/apiClient';
import {
  IconBriefcase,
  IconClock,
  IconCheckCircle,
  IconShieldCheck,
  IconAlert,
  IconPrinter,
  IconBrandLogo,
  IconEdit,
  IconClose,
  IconEvaluation,
} from './Icons';
import { getInstrumentById, getInterpretation } from '../utils/evaluationRubrics';
import SessionSignatureControl, {
  PrintableSignatoryBlock,
  useSessionSignature,
} from './SessionSignatureControl';
import { usePresenceValue, useSmoothSwitch } from '../utils/usePresence';

export default function PublicSupervisorVerifyView({
  placement,
  timelogs = [],
  evaluations = [],
  onClose,
  onRefresh,
}) {
  const [portalTab, setPortalTab] = useState('dtr');
  const portalTabSwitch = useSmoothSwitch(portalTab, 85);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [actionError, setActionError] = useState('');
  const [flagModalOpen, setFlagModalOpen] = useState(false);
  const [selectedLogToFlag, setSelectedLogToFlag] = useState(null);
  const [flagReason, setFlagReason] = useState('Please verify and correct the recorded shift hours.');
  const flagModalPresence = usePresenceValue(
    flagModalOpen && selectedLogToFlag ? selectedLogToFlag : null,
    150
  );

  const inst02 = useMemo(() => getInstrumentById('supervisor_to_student'), []);
  const supervisorSig = useSessionSignature('supervisor', placement?.placement_id || 'portal');

  const existingInst02 = useMemo(() => {
    if (!placement) return null;
    return (
      evaluations.find(
        (ev) =>
          Number(ev.placement_id) === Number(placement.placement_id) &&
          (ev.instrument_type === 'supervisor_to_student' || ev.evaluator_type === 'employer')
      ) || null
    );
  }, [evaluations, placement]);

  const inst02Items = useMemo(() => {
    const list = [];
    inst02.sections.forEach((sec, sIdx) => {
      sec.items.forEach((text, iIdx) => {
        list.push({ key: `${sIdx}_${iIdx}`, sectionTitle: sec.title, text });
      });
    });
    return list;
  }, [inst02]);

  const [evalScores, setEvalScores] = useState({});
  const [evaluatorName, setEvaluatorName] = useState('');
  const [dateEvaluated, setDateEvaluated] = useState(new Date().toISOString().slice(0, 10));
  const [evalComments, setEvalComments] = useState('');
  const [evalSaving, setEvalSaving] = useState(false);
  const [evalSavedNotice, setEvalSavedNotice] = useState('');

  useEffect(() => {
    if (!placement) return;
    if (existingInst02) {
      setEvaluatorName(existingInst02.evaluator_name || placement.company_contact_person || 'HTE Supervisor');
      setDateEvaluated(existingInst02.date_evaluated || new Date().toISOString().slice(0, 10));
      setEvalComments(existingInst02.comments || '');
      let parsed = null;
      if (existingInst02.criteria_scores) {
        try {
          parsed =
            typeof existingInst02.criteria_scores === 'string'
              ? JSON.parse(existingInst02.criteria_scores)
              : existingInst02.criteria_scores;
        } catch {
          parsed = null;
        }
      }
      const next = {};
      const fallback = Math.max(1, Math.min(5, Math.round(Number(existingInst02.rating || 5))));
      inst02Items.forEach((it) => {
        next[it.key] = parsed && parsed[it.key] ? Number(parsed[it.key]) : fallback;
      });
      setEvalScores(next);
    } else {
      setEvaluatorName(placement.company_contact_person || 'HTE Workplace Supervisor');
      setDateEvaluated(new Date().toISOString().slice(0, 10));
      setEvalComments('');
      const next = {};
      inst02Items.forEach((it) => {
        next[it.key] = 5;
      });
      setEvalScores(next);
    }
  }, [placement, existingInst02, inst02Items]);

  const evalComposite = useMemo(() => {
    const vals = Object.values(evalScores).filter((v) => Number(v) > 0);
    if (vals.length === 0) return 5.0;
    return parseFloat((vals.reduce((a, b) => a + Number(b), 0) / vals.length).toFixed(2));
  }, [evalScores]);

  const evalInterp = getInterpretation(evalComposite);

  const handleSaveInst02 = async (e) => {
    e.preventDefault();
    if (!placement) return;
    setEvalSaving(true);
    setEvalSavedNotice('');
    try {
      const res = await apiFetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: placement.placement_id,
          instrument_type: 'supervisor_to_student',
          evaluator_type: 'employer',
          evaluator_name: evaluatorName || placement.company_contact_person || 'HTE Supervisor',
          technical_score: evalComposite,
          attitude_score: evalComposite,
          attendance_score: 5.0,
          rating: evalComposite,
          comments:
            evalComments.trim() ||
            'Submitted online via HTE Supervisor Verification Portal (INST-02).',
          date_evaluated: dateEvaluated,
          criteria_scores: evalScores,
          upsert: true,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setActionError('');
        setEvalSavedNotice(
          `INST-02 evaluation ${json.updated ? 'updated' : 'submitted'} successfully (${evalComposite.toFixed(2)} / 5.00).`
        );
        if (onRefresh) onRefresh();
      } else {
        setActionError(json.error || 'Failed to save supervisor evaluation.');
      }
    } catch (err) {
      setActionError('Failed to submit INST-02 evaluation: ' + err.message);
    } finally {
      setEvalSaving(false);
    }
  };

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
      const res = await apiFetch('/api/timelogs/approve-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: placement.placement_id,
          target_status: 'supervisor_verified',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        setActionError('');
        setVerificationSuccess(true);
        if (onRefresh) onRefresh();
      } else {
        setActionError(json.error || 'Failed to submit supervisor verification.');
      }
    } catch (err) {
      setActionError('Error verifying logs: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Flag single log for student correction
  const handleConfirmFlag = async () => {
    if (!selectedLogToFlag) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/api/timelogs/${selectedLogToFlag.log_id}`, {
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
        setActionError('');
        setFlagModalOpen(false);
        setSelectedLogToFlag(null);
        if (onRefresh) onRefresh();
      } else {
        setActionError(json.error || 'Failed to flag log entry.');
      }
    } catch (err) {
      setActionError('Error flagging log entry: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!placement) {
    return (
      <div
        className="public-verify-shell"
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            width: '100%',
            textAlign: 'center',
            background: '#ffffff',
            borderRadius: '24px',
            padding: '36px 28px',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <IconAlert size={40} style={{ color: 'var(--amber, #d97706)', margin: '0 auto 14px', display: 'block' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0' }}>
            Placement Verification Link Not Found
          </h2>
          <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
            The requested student placement reference could not be located or has expired.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            style={{ marginTop: '20px' }}
            onClick={onClose}
          >
            Go to Practicly Main Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-verify-shell">
      <div className="public-verify-container">
        {/* PUBLIC VERIFICATION HEADER */}
        <header className="public-verify-header">
          <div className="public-verify-header-brand">
            <IconBrandLogo size={36} />
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Host Training Establishment (HTE) Attendance Verification Portal
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Verified Host Workplace Portal · Any Academic Institution
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm no-print"
              onClick={onClose}
              title="Return to main university portal"
            >
              Exit
            </button>
          </div>
        </header>

        {/* READ-ONLY PREVIEW NOTICE WHEN NO SIGNED TOKEN OR AUTH */}
        {placement.can_submit === false && (
          <div
            className="no-print"
            style={{
              padding: '12px 16px',
              marginBottom: '14px',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12.5px',
              color: 'var(--text-secondary)',
            }}
          >
            <IconAlert size={16} style={{ color: 'var(--warning-fg)', flexShrink: 0 }} />
            <span>
              <strong>Read-Only Preview:</strong> Verification actions require a valid signed verification link token from the trainee or Faculty Adviser (or an active HTE Supervisor / Adviser login).
            </span>
          </div>
        )}

        {/* INLINE ERROR BANNER */}
        {actionError && (
          <div className="modal-inline-error no-print" role="alert">
            <IconAlert size={16} />
            <span style={{ flex: 1 }}>{actionError}</span>
            <button
              type="button"
              className="modal-inline-error-close"
              onClick={() => setActionError('')}
              aria-label="Dismiss error"
            >
              <IconClose size={13} />
            </button>
          </div>
        )}

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
        <div className="public-verify-summary-grid">
          <div className="public-verify-summary-item">
            <div className="public-verify-summary-label">Student Trainee</div>
            <div className="public-verify-summary-val">{placement.student_name}</div>
            <div className="public-verify-summary-sub mono">
              ID: {placement.student_number}
            </div>
            <div className="public-verify-summary-sub">
              {placement.program || 'BS Computer Engineering'}
            </div>
          </div>

          <div className="public-verify-summary-item">
            <div className="public-verify-summary-label">Host Training Establishment</div>
            <div className="public-verify-summary-val">{placement.company_name}</div>
            <div className="public-verify-summary-sub">
              Designation: <strong>{placement.position_title}</strong>
            </div>
            <div className="public-verify-summary-sub">
              Signatory: {placement.company_contact_person || 'HTE Supervisor / HR Mentor'}
            </div>
          </div>

          <div className="public-verify-summary-item">
            <div className="public-verify-summary-label">Faculty Academic Adviser</div>
            <div className="public-verify-summary-val">{placement.adviser_name}</div>
            <div className="public-verify-summary-sub">
              {placement.academic_term || 'AY 2026-2027 1st Sem'}
            </div>
            <div className="public-verify-summary-sub">
              Required: {Number(placement.required_hours || 300).toFixed(0)} Hours
            </div>
          </div>

          <div className="public-verify-summary-item is-highlight">
            <div className="public-verify-summary-label">Rendered Hours</div>
            <div className="public-verify-summary-metric mono">
              {totalHours.toFixed(2)}h
            </div>
            <div className="public-verify-summary-sub">
              {placementLogs.length} {placementLogs.length === 1 ? 'shift' : 'shifts'} ({pendingCount} pending review)
            </div>
          </div>
        </div>

        {/* PORTAL SECTION TABS: DTR vs INST-02 EVALUATION */}
        <div
          className="no-print"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            marginBottom: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div className="action-row-wrap">
            <button
              type="button"
              className={`btn btn-sm ${portalTab === 'dtr' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPortalTab('dtr')}
            >
              <IconClock size={14} />
              DTR Shift Verification ({pendingCount > 0 ? `${pendingCount} Pending` : `${placementLogs.length} Logged`})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${portalTab === 'eval' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setPortalTab('eval')}
            >
              <IconEvaluation size={14} />
              INST-02: Trainee &amp; School Evaluation (
              {existingInst02
                ? `Submitted ${Number(existingInst02.rating).toFixed(2)}`
                : placement.signed_eval_filename
                ? 'Signed Scan on File'
                : 'Pending'}
              )
            </button>
          </div>
          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
            Option: Submit INST-02 directly online or print &amp; sign physically for the trainee to upload.
          </span>
        </div>

        <div
          key={portalTabSwitch.displayedKey}
          className={`view-stage ${portalTabSwitch.phase === 'exiting' ? 'is-exiting' : ''}`}
        >
        {portalTabSwitch.displayedKey === 'dtr' && (
          <>
        {/* ACTION TOOLBAR FOR SUPERVISOR */}
        <div className="public-verify-actionbar">
          <div className="public-verify-action-info">
            <div className="public-verify-action-title">
              Supervisor Verification Action
            </div>
            <div className="public-verify-action-sub">
              Review the student's logged daily shifts below and confirm if hours and tasks match company records.
            </div>
          </div>

          <div className="no-print public-verify-action-buttons">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
              title="Print official attendance log sheet"
            >
              <IconPrinter size={14} />
              Print Summary
            </button>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleVerifyAll}
              disabled={placement.can_submit === false || isSubmitting || pendingCount === 0}
            >
              <IconShieldCheck size={14} />
              {isSubmitting
                ? 'Submitting...'
                : pendingCount === 0
                ? 'All Shifts Verified'
                : `Verify All (${pendingCount} ${pendingCount === 1 ? 'Shift' : 'Shifts'})`}
            </button>
          </div>
        </div>

        {/* ATTENDANCE SHIFT RECORDS TABLE */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">
                Daily Time Record (DTR) Shift Logs ({placementLogs.length})
              </div>
              <div className="panel-desc">
                Click &lsquo;Flag&rsquo; on any row if hours or task description requires correction by the student.
              </div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table table-fit">
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
                            className="m3-inline-action m3-inline-action-danger"
                            disabled={placement.can_submit === false}
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
          </>
        )}

        {portalTabSwitch.displayedKey === 'eval' && (
          <form onSubmit={handleSaveInst02} className="panel" style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {evalSavedNotice && (
              <div className="public-verify-alert is-success" style={{ marginBottom: 0 }}>
                <IconCheckCircle size={18} />
                <div>
                  <strong>INST-02 Evaluation Recorded:</strong> {evalSavedNotice}
                </div>
              </div>
            )}

            {placement.signed_eval_filename && !existingInst02 && (
              <div className="public-verify-alert is-warning" style={{ marginBottom: 0 }}>
                <IconCheckCircle size={16} />
                <div>
                  A signed physical INST-02 copy (<strong>{placement.signed_eval_filename}</strong>) was already uploaded by the trainee. You may also record itemized digital scores below.
                </div>
              </div>
            )}

            <div className="public-verify-eval-head">
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  {inst02.code} · Official HTE Supervisor Instrument
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '4px 0', color: 'var(--text-primary)' }}>
                  {inst02.name}
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  {inst02.description}
                </p>
              </div>
              <div className="public-verify-eval-score">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Composite Score</div>
                  <div className="mono tabular-nums" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--brand)' }}>
                    {evalComposite.toFixed(2)} <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ 5.00</span>
                  </div>
                </div>
                <span className="status-chip success">{evalInterp.label}</span>
              </div>
            </div>

            <div className="field-grid-2">
              <div className="field">
                <label className="field-label">Evaluator / Immediate Supervisor Name</label>
                <input
                  type="text"
                  className="input"
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Date Evaluated</label>
                <input
                  type="date"
                  className="input"
                  value={dateEvaluated}
                  onChange={(e) => setDateEvaluated(e.target.value)}
                  required
                />
              </div>
            </div>

            {inst02.sections.map((section, sIdx) => (
              <div key={sIdx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', padding: '6px 10px', background: 'var(--bg-subtle)', borderRadius: '6px' }}>
                  {section.title}
                </div>
                <div className="table-wrap">
                  <table className="table official-rubric-table">
                    <thead>
                      <tr>
                        <th style={{ width: '40px' }}>#</th>
                        <th>Performance Indicator</th>
                        <th className="text-right" style={{ width: '220px' }}>Rating (1 Low – 5 High)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.items.map((itemText, iIdx) => {
                        const key = `${sIdx}_${iIdx}`;
                        const val = Number(evalScores[key] || 5);
                        return (
                          <tr key={key}>
                            <td className="mono">{iIdx + 1}</td>
                            <td style={{ fontSize: '12.5px', lineHeight: 1.45 }}>{itemText}</td>
                            <td className="text-right">
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <button
                                    key={num}
                                    type="button"
                                    className={`btn btn-xs ${val === num ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ minWidth: '30px', justifyContent: 'center' }}
                                    onClick={() => setEvalScores((prev) => ({ ...prev, [key]: num }))}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            <div className="field">
              <label className="field-label">{inst02.commentsLabel}</label>
              <textarea
                className="input"
                rows={3}
                value={evalComments}
                onChange={(e) => setEvalComments(e.target.value)}
                placeholder="Share trainee technical strengths, work ethic observations, or curriculum recommendations for MIT CpE..."
              />
            </div>

            <SessionSignatureControl
              role="supervisor"
              userId={placement?.placement_id || 'portal'}
              signerName={evaluatorName || placement.company_contact_person}
              title="Optional Print Signature (Browser Tab Only)"
            />

            <div className="cert-signatures" style={{ marginTop: '8px' }}>
              <PrintableSignatoryBlock
                printedName={evaluatorName || placement.company_contact_person}
                roleLabel="Immediate HTE Supervisor"
                signature={supervisorSig}
                matchesRole={true}
              />
              <PrintableSignatoryBlock
                printedName={placement.adviser_name}
                roleLabel="Noted by: Faculty Practicum Adviser"
                signature={null}
                matchesRole={false}
              />
            </div>

            <div className="no-print action-row-wrap" style={{ justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--border-default)' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => window.print()}>
                <IconPrinter size={14} />
                Print Copy for Filing
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={placement.can_submit === false || evalSaving}>
                <IconCheckCircle size={14} />
                {evalSaving
                  ? 'Submitting...'
                  : existingInst02
                  ? `Update INST-02 Evaluation (${evalComposite.toFixed(2)})`
                  : `Submit INST-02 Evaluation (${evalComposite.toFixed(2)})`}
              </button>
            </div>
          </form>
        )}
        </div>

        {/* FOOTER */}
        <footer style={{ textAlign: 'center', padding: '16px 0', fontSize: '11.5px', color: 'var(--text-muted)' }}>
          Metropolitan Institute of Technology · Commission on Higher Education (CHED) CMO 104 Series of 2017 Practicum Standard
        </footer>
      </div>

      {/* FLAG / REVISION MODAL */}
      {flagModalPresence.rendered && flagModalPresence.value && (
        <div
          className={`modal-backdrop ${flagModalPresence.exiting ? 'is-exiting' : ''}`}
          onClick={flagModalPresence.exiting ? undefined : () => setFlagModalOpen(false)}
        >
          <div
            className={`modal-card modal-entry-card ${flagModalPresence.exiting ? 'is-exiting' : ''}`}
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title">Request DTR Correction from Student</div>
              <button type="button" className="modal-close-btn" onClick={() => setFlagModalOpen(false)}>
                <IconClose size={16} />
              </button>
            </div>
            <div className="modal-body modal-entry-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                Specify why this entry ({flagModalPresence.value.date} — {flagModalPresence.value.hours_rendered}h) is flagged. The student will be prompted to re-edit it in their portal.
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
