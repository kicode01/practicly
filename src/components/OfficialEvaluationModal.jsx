import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SegmentedControl, Button, MaterialSelect } from './MaterialComponents';
import { apiFetch } from '../utils/apiClient';
import usePresence from '../utils/usePresence';
import {
  IconEvaluation,
  IconClose,
  IconCheckCircle,
  IconPrinter,
  IconDownload,
  IconShieldCheck,
  IconBuilding,
  IconStudent,
  IconSupervisor,
  IconCheck,
  IconAlert
} from './Icons';
import {
  EVALUATION_INSTRUMENTS,
  getInstrumentsForRole,
  getInterpretation,
} from '../utils/evaluationRubrics';
import SessionSignatureControl, {
  PrintableSignatoryBlock,
  useSessionSignature,
} from './SessionSignatureControl';

const SIGNATORY_ROLE_SLOTS = {
  supervisor_to_student: ['supervisor', 'adviser'],
  student_to_supervisor: ['student', 'adviser'],
  adviser_to_hte: ['adviser', 'admin'],
  student_to_adviser: ['student', 'admin'],
};

export default function OfficialEvaluationModal({
  isOpen,
  onClose,
  placements = [],
  evaluations = [],
  currentUser,
  onSuccess,
  initialInstrumentId = null,
  forcedInstrumentId = null,
  onOpenSignedEvalUpload = null,
}) {
  const userRole = currentUser?.role || 'admin';
  const userId = currentUser?.user_id || currentUser?.linked_id || userRole;
  const activeSignature = useSessionSignature(userRole, userId);

  const visibleInstruments = useMemo(() => {
    if (forcedInstrumentId) {
      const forced = EVALUATION_INSTRUMENTS.find((i) => i.id === forcedInstrumentId);
      return forced ? [forced] : getInstrumentsForRole(userRole);
    }
    return getInstrumentsForRole(userRole);
  }, [userRole, forcedInstrumentId]);

  const isBlankPrintMode = Boolean(forcedInstrumentId && userRole === 'student');

  const [selectedInstrumentId, setSelectedInstrumentId] = useState(
    () => visibleInstruments[0]?.id || 'supervisor_to_student'
  );
  const [selectedPlacementId, setSelectedPlacementId] = useState(
    placements[0]?.placement_id ? String(placements[0].placement_id) : '1'
  );
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSubmitError('');
    if (forcedInstrumentId) {
      setSelectedInstrumentId(forcedInstrumentId);
      return;
    }
    if (
      initialInstrumentId &&
      visibleInstruments.some((inst) => inst.id === initialInstrumentId)
    ) {
      setSelectedInstrumentId(initialInstrumentId);
      return;
    }
    setSelectedInstrumentId(visibleInstruments[0]?.id || 'supervisor_to_student');
  }, [isOpen, initialInstrumentId, forcedInstrumentId, visibleInstruments]);

  useEffect(() => {
    if (placements && placements.length > 0) {
      if (!placements.some((p) => String(p.placement_id) === String(selectedPlacementId))) {
        setSelectedPlacementId(String(placements[0].placement_id));
      }
    }
  }, [placements, selectedPlacementId]);

  const activePlacement = useMemo(() => {
    return (
      placements.find((p) => String(p.placement_id) === String(selectedPlacementId)) ||
      placements[0]
    );
  }, [placements, selectedPlacementId]);

  const activeInstrument = useMemo(() => {
    return (
      visibleInstruments.find((i) => i.id === selectedInstrumentId) ||
      EVALUATION_INSTRUMENTS.find((i) => i.id === selectedInstrumentId) ||
      visibleInstruments[0] ||
      EVALUATION_INSTRUMENTS[0]
    );
  }, [selectedInstrumentId, visibleInstruments]);

  const existingRecord = useMemo(() => {
    if (!activePlacement || !evaluations.length) return null;
    return (
      evaluations.find(
        (ev) =>
          String(ev.placement_id) === String(activePlacement.placement_id) &&
          ev.instrument_type === activeInstrument.id
      ) || null
    );
  }, [evaluations, activePlacement, activeInstrument]);

  // Scores state: Map of questionIndex => rating (1-5)
  const [scores, setScores] = useState({});
  const [comments, setComments] = useState('');
  const [strengths, setStrengths] = useState('');
  const [areasImprovement, setAreasImprovement] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [evaluatorName, setEvaluatorName] = useState('');
  const [dateEvaluated, setDateEvaluated] = useState(new Date().toISOString().slice(0, 10));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const printRef = useRef(null);

  // Flattened questions list
  const allItems = useMemo(() => {
    const list = [];
    activeInstrument.sections.forEach((sec, sIdx) => {
      sec.items.forEach((itemText, iIdx) => {
        list.push({
          key: `${sIdx}_${iIdx}`,
          sectionTitle: sec.title,
          text: itemText,
        });
      });
    });
    return list;
  }, [activeInstrument]);

  // Set default evaluator name and initial scores (prefill from saved submission if present)
  useEffect(() => {
    if (existingRecord) {
      setEvaluatorName(existingRecord.evaluator_name || currentUser?.display_name || 'Authorized Evaluator');
      setDateEvaluated(existingRecord.date_evaluated || new Date().toISOString().slice(0, 10));

      let parsedCriteria = null;
      if (existingRecord.criteria_scores) {
        try {
          parsedCriteria =
            typeof existingRecord.criteria_scores === 'string'
              ? JSON.parse(existingRecord.criteria_scores)
              : existingRecord.criteria_scores;
        } catch {
          parsedCriteria = null;
        }
      }
      const nextScores = {};
      const fallbackScore = Math.max(1, Math.min(5, Math.round(Number(existingRecord.rating || 5))));
      allItems.forEach((item) => {
        nextScores[item.key] =
          parsedCriteria && parsedCriteria[item.key]
            ? Number(parsedCriteria[item.key])
            : fallbackScore;
      });
      setScores(nextScores);

      if (activeInstrument.id === 'adviser_to_hte') {
        const raw = String(existingRecord.comments || '');
        const sMatch = raw.match(/Strengths:\s*([^\n]*)/i);
        const aMatch = raw.match(/Areas for Improvement:\s*([^\n]*)/i);
        const rMatch = raw.match(/Recommendations:\s*([^\n]*)/i);
        setStrengths(sMatch ? sMatch[1].trim() : raw);
        setAreasImprovement(aMatch ? aMatch[1].trim() : '');
        setRecommendations(rMatch ? rMatch[1].trim() : '');
      } else {
        setComments(existingRecord.comments || '');
      }
      return;
    }

    if (activeInstrument.id === 'supervisor_to_student') {
      setEvaluatorName(
        currentUser?.role === 'supervisor'
          ? currentUser.display_name
          : activePlacement?.company_contact_person || 'HTE Workplace Supervisor'
      );
    } else if (activeInstrument.id === 'student_to_supervisor') {
      setEvaluatorName(
        currentUser?.role === 'student'
          ? currentUser.display_name
          : activePlacement?.student_name || 'Student Intern'
      );
    } else if (activeInstrument.id === 'adviser_to_hte') {
      setEvaluatorName(
        currentUser?.role === 'adviser'
          ? currentUser.display_name
          : activePlacement?.adviser_name || 'Faculty Practicum Adviser'
      );
    } else {
      setEvaluatorName(
        currentUser?.role === 'student'
          ? currentUser.display_name
          : activePlacement?.student_name || 'Student Intern'
      );
    }

    const initialScores = {};
    allItems.forEach((item) => {
      initialScores[item.key] = isBlankPrintMode ? null : 5;
    });
    setScores(initialScores);
    setDateEvaluated(new Date().toISOString().slice(0, 10));

    if (activeInstrument.id === 'adviser_to_hte') {
      setStrengths('Comprehensive engineering workstation setup, structured technical mentor oversight, and strong compliance with safety protocols.');
      setAreasImprovement('Provide earlier notice regarding shift rotation schedules during national holidays.');
      setRecommendations('Continue accredited Host Training Establishment partnership for upcoming BS Computer Engineering cohorts.');
    } else if (isBlankPrintMode) {
      setComments('');
    } else {
      setComments('Exemplary practicum performance with outstanding initiative and technical competence.');
    }
  }, [activeInstrument, activePlacement, allItems, currentUser, existingRecord, isBlankPrintMode]);

  // Compute live weighted mean
  const computedRating = useMemo(() => {
    const values = Object.values(scores).filter((v) => v !== null && v !== undefined && Number(v) > 0);
    if (values.length === 0) return 5.0;
    const sum = values.reduce((acc, curr) => acc + Number(curr), 0);
    return parseFloat((sum / values.length).toFixed(2));
  }, [scores]);

  const interpretation = getInterpretation(computedRating);

  // Set all scores to a specific number
  const handleSetAllScores = (val) => {
    const updated = {};
    allItems.forEach((item) => {
      updated[item.key] = val;
    });
    setScores(updated);
  };

  const handleScoreChange = (key, val) => {
    setScores((prev) => ({
      ...prev,
      [key]: Number(val),
    }));
  };

  // Submit to backend
  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    if (!activePlacement || isBlankPrintMode) return;

    setIsSubmitting(true);
    let combinedComments = comments;
    if (activeInstrument.hasQualitativeBreakdown) {
      combinedComments = `Strengths: ${strengths}\nAreas for Improvement: ${areasImprovement}\nRecommendations: ${recommendations}`;
    }

    const payload = {
      placement_id: activePlacement.placement_id,
      evaluator_type: activeInstrument.evaluatorTypeDb,
      instrument_type: activeInstrument.id,
      evaluator_name: evaluatorName,
      technical_score: computedRating,
      attitude_score: computedRating,
      attendance_score: 5.0,
      rating: computedRating,
      comments: combinedComments,
      date_evaluated: dateEvaluated,
      criteria_scores: scores,
      upsert: true,
    };

    try {
      const res = await apiFetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setSubmitError('');
        if (onSuccess) {
          onSuccess(`${json.updated ? 'Updated' : 'Recorded'} ${activeInstrument.name} (Score: ${computedRating.toFixed(2)}/5.00)`);
        }
        onClose();
      } else {
        setSubmitError(json.error || 'Failed to record evaluation.');
      }
    } catch (err) {
      setSubmitError('Error saving evaluation: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const { rendered, exiting } = usePresence(isOpen, 150);

  if (!rendered) return null;

  const slotRoles = SIGNATORY_ROLE_SLOTS[activeInstrument.id] || ['supervisor', 'adviser'];

  return (
    <div className={`modal-backdrop ${exiting ? 'is-exiting' : ''}`} onClick={exiting ? undefined : onClose} role="dialog" aria-modal="true">
      <div
        className={`modal-card modal-entry-card official-eval-modal ${exiting ? 'is-exiting' : ''}`}
        style={{ maxWidth: '960px', width: '95vw', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="modal-header no-print">
          <div className="modal-header-identity">
            <div className="modal-header-icon-box">
              <IconEvaluation size={18} />
            </div>
            <div>
              <div className="modal-title">
                {isBlankPrintMode
                  ? 'Printable INST-02 HTE Supervisor Evaluation Form'
                  : userRole === 'student'
                  ? 'Student Evaluation Forms (INST-01 & INST-04)'
                  : userRole === 'adviser'
                  ? 'Faculty Adviser HTE Audit (INST-03)'
                  : userRole === 'supervisor'
                  ? 'HTE Supervisor Evaluation Form (INST-02)'
                  : 'Official OJT Evaluation Instruments & Rubrics Hub'}
              </div>
              <div className="modal-subtitle">
                {isBlankPrintMode
                  ? 'Print cleanly for your HTE Training Supervisor wet-ink signature, then upload scanned proof'
                  : userRole === 'student'
                  ? 'Evaluate your HTE training supervisor (INST-01) and faculty OJT adviser (INST-04)'
                  : userRole === 'adviser'
                  ? 'Conduct the institutional Host Training Establishment (HTE) compliance & quality audit (INST-03)'
                  : 'Institutional 360-degree evaluation forms (CHED Practicum Standards & Quality Assurance)'}
              </div>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose size={16} />
          </button>
        </div>

        {/* ROLE-SCOPED INSTRUMENT SELECTOR BAR */}
        <div
          className="no-print"
          style={{
            padding: '12px 24px',
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            className="eval-instrument-grid"
            style={{ '--eval-tab-cols': Math.max(1, visibleInstruments.length) }}
          >
            {visibleInstruments.map((inst) => {
              const active = inst.id === selectedInstrumentId;
              return (
                <button
                  key={inst.id}
                  type="button"
                  className={`eval-instrument-tab ${active ? 'active' : ''}`}
                  onClick={() => {
                    setSubmitError('');
                    setSelectedInstrumentId(inst.id);
                  }}
                >
                  <span className="eval-tab-code">
                    {inst.code}
                  </span>
                  <span className="eval-tab-title">
                    {inst.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>

          {(existingRecord || (userRole === 'student' && onOpenSignedEvalUpload && !isBlankPrintMode)) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
              <div>
                {existingRecord && !isBlankPrintMode && (
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '11px',
                      fontWeight: 600,
                      lineHeight: 1.4,
                      padding: '4px 10px',
                      borderRadius: '10px',
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#047857',
                    }}
                  >
                    Submitted on {existingRecord.date_evaluated} (Rating: {Number(existingRecord.rating).toFixed(2)}) · Saving updates existing record
                  </span>
                )}
              </div>
              {userRole === 'student' && onOpenSignedEvalUpload && !isBlankPrintMode && (
                <button
                  type="button"
                  className="btn btn-secondary btn-xs"
                  onClick={() => {
                    onClose();
                    onOpenSignedEvalUpload();
                  }}
                >
                  Upload Signed Supervisor INST-02 Scan
                </button>
              )}
            </div>
          )}
        </div>

        {submitError && (
          <div className="modal-inline-error no-print" role="alert" style={{ margin: '10px 24px 0' }}>
            <IconAlert size={16} />
            <span style={{ flex: 1 }}>{submitError}</span>
            <button
              type="button"
              className="modal-inline-error-close"
              onClick={() => setSubmitError('')}
              aria-label="Dismiss error"
            >
              <IconClose size={13} />
            </button>
          </div>
        )}

        {/* CONTROLS STRIP: PLACEMENT SELECTOR & COMPOSITE SCORE SUMMARY */}
        <div className="no-print eval-controls-strip">
          <div className="eval-placement-group">
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>Placement:</span>
            <div className="eval-placement-select-wrap">
              <MaterialSelect
                className="select-sm"
                value={selectedPlacementId}
                onChange={(e) => setSelectedPlacementId(e.target.value)}
                style={{ width: '100%' }}
              >
                {placements.map((p) => (
                  <option key={p.placement_id} value={p.placement_id}>
                    {p.student_name} — {p.company_name} ({p.student_number})
                  </option>
                ))}
              </MaterialSelect>
            </div>
          </div>

          <div className="eval-score-group">
            {!isBlankPrintMode && (
              <>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weighted Mean</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--brand)' }} className="mono tabular-nums">
                    {computedRating.toFixed(2)}{' '}
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)' }}>/ 5.00</span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--success-bg, rgba(16, 185, 129, 0.12))',
                    color: 'var(--success-fg, #059669)',
                    border: '1px solid var(--success-border, rgba(16, 185, 129, 0.25))',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {interpretation.label}
                </span>
              </>
            )}

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              title="Print official paper form formatted with signature blocks"
            >
              <IconPrinter size={13} />
              {isBlankPrintMode ? 'Print Blank INST-02' : 'Print Form'}
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE RUBRIC) */}
        <div className="modal-body modal-entry-body" style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {/* PRINTABLE OFFICIAL INSTRUMENT VIEW CONTAINER */}
          <div key={activeInstrument.id} ref={printRef} className="official-instrument-print-area view-stage">
            {/* OFFICIAL DOCUMENT HEADER */}
            <div
              style={{
                borderBottom: '2px solid var(--border-strong)',
                paddingBottom: '12px',
                marginBottom: '16px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Metropolitan Institute of Technology
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                Department of Computer Engineering · Practicum &amp; OJT Placement Unit
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  marginTop: '8px',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                  letterSpacing: '0.02em',
                }}
              >
                {activeInstrument.name}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {activeInstrument.description}
              </div>
            </div>

            {/* METADATA FORM BOX */}
            <div
              className="modal-info-grid-2"
              style={{
                padding: '12px 14px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                marginBottom: '18px',
                fontSize: '12px',
              }}
            >
              <div>
                <strong>Name of Student:</strong> {activePlacement?.student_name || 'Kian H. Balanag'}
              </div>
              <div>
                <strong>Course &amp; Section:</strong> {activePlacement?.program || 'BS Computer Engineering'} ({activePlacement?.section || 'BSCpE 4-1'})
              </div>
              <div>
                <strong>Host Training Establishment (HTE):</strong> {activePlacement?.company_name || 'Accenture Philippines'}
              </div>
              <div>
                <strong>HTE Address:</strong> {activePlacement?.company_address || 'Bonifacio Global City, Taguig City'}
              </div>
              <div>
                <strong>Evaluator Full Name:</strong> {evaluatorName}
              </div>
              <div>
                <strong>Date Evaluated:</strong> {dateEvaluated} · <strong>Academic Term:</strong> {activePlacement?.academic_term || 'AY 2026-2027 1st Sem'}
              </div>
            </div>

            {/* QUICK PRESET BUTTONS */}
            <div className="no-print eval-preset-bar">
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Rating Scale: 5 (Outstanding) · 4 (Very Satisfactory) · 3 (Satisfactory) · 2 (Fair) · 1 (Poor)
              </div>
              <div className="action-row-wrap" style={{ gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleSetAllScores(5)}
                  title="Set all criteria to 5"
                >
                  Rate All 5
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs"
                  onClick={() => handleSetAllScores(4)}
                  title="Set all criteria to 4"
                >
                  Rate All 4
                </button>
              </div>
            </div>

            {/* RUBRIC SECTIONS & CRITERIA ITEMS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeInstrument.sections.map((sec, sIdx) => (
                <div
                  key={sec.title}
                  className="official-rubric-section"
                  style={{
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var(--bg-subtle)',
                      fontWeight: 700,
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      borderBottom: '1px solid var(--border-default)',
                    }}
                  >
                    {sec.title}
                  </div>
                  <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="table table-compact official-rubric-table" style={{ width: '100%', margin: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                        <th>Performance Indicator / Criterion</th>
                        <th style={{ width: '160px', textAlign: 'center' }}>Rating (5 to 1)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sec.items.map((itemText, iIdx) => {
                        const key = `${sIdx}_${iIdx}`;
                        const currentScore = scores[key] || 5;
                        return (
                          <tr key={key}>
                            <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '11px' }}>
                              {iIdx + 1}
                            </td>
                            <td style={{ fontSize: '12px', lineHeight: 1.45 }}>{itemText}</td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: '4px' }}>
                                {[5, 4, 3, 2, 1].map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => handleScoreChange(key, val)}
                                    style={{
                                      width: '24px',
                                      height: '24px',
                                      borderRadius: '4px',
                                      border: '1px solid ' + (currentScore === val ? 'var(--brand)' : 'var(--border-default)'),
                                      background: currentScore === val ? 'var(--brand)' : 'transparent',
                                      color: currentScore === val ? '#fff' : 'var(--text-primary)',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.1s ease',
                                    }}
                                  >
                                    {val}
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
            </div>

            {/* QUALITATIVE FEEDBACK FIELDS */}
            <div style={{ marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeInstrument.hasQualitativeBreakdown ? (
                <>
                  <div className="field">
                    <label className="field-label">Strength/s</label>
                    <textarea
                      className="textarea"
                      rows={2}
                      value={strengths}
                      onChange={(e) => setStrengths(e.target.value)}
                      placeholder="Identified institutional strengths..."
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Area/s Needing Improvement</label>
                    <textarea
                      className="textarea"
                      rows={2}
                      value={areasImprovement}
                      onChange={(e) => setAreasImprovement(e.target.value)}
                      placeholder="Areas for development and refinement..."
                    />
                  </div>
                  <div className="field">
                    <label className="field-label">Recommendation/s</label>
                    <textarea
                      className="textarea"
                      rows={2}
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      placeholder="Actionable recommendations for continued partnership..."
                    />
                  </div>
                </>
              ) : (
                <div className="field">
                  <label className="field-label">{activeInstrument.commentsLabel}</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Enter descriptive evaluator remarks, commendations, or areas for growth..."
                    required
                  />
                </div>
              )}
            </div>

            {!isBlankPrintMode && currentUser && (
              <div style={{ marginTop: '16px' }}>
                <SessionSignatureControl
                  role={userRole}
                  userId={userId}
                  signerName={evaluatorName || currentUser.display_name}
                />
              </div>
            )}

            {/* OFFICIAL SIGNATURE BLOCKS (PRINT READY) */}
            <div className="cert-signatures-eval">
              {activeInstrument.signatories.map((sig, idx) => {
                const slotRole = slotRoles[idx];
                return (
                  <PrintableSignatoryBlock
                    key={idx}
                    printedName={sig.label}
                    roleLabel={sig.role}
                    signature={activeSignature}
                    matchesRole={!isBlankPrintMode && userRole === slotRole}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer no-print" style={{ padding: '12px 24px', borderTop: '1px solid var(--border-default)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {isBlankPrintMode ? 'Close' : 'Cancel'}
          </button>

          {!isBlankPrintMode && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveEvaluation}
              disabled={isSubmitting}
            >
              <IconCheckCircle size={14} />
              {isSubmitting
                ? 'Saving...'
                : existingRecord
                ? `Update ${activeInstrument.code} (${computedRating.toFixed(2)})`
                : `Submit ${activeInstrument.code} (${computedRating.toFixed(2)})`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
