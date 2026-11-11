import React, { useState, useMemo, useEffect, useRef } from 'react';
import { SegmentedControl, Button, MaterialSelect } from './MaterialComponents';
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
  IconCheck
} from './Icons';
import { EVALUATION_INSTRUMENTS, getInterpretation } from '../utils/evaluationRubrics';
import { playClickSound, playSuccessChime } from '../utils/soundEffects';

export default function OfficialEvaluationModal({
  isOpen,
  onClose,
  placements = [],
  currentUser,
  onSuccess,
  existingEvaluation = null,
}) {
  const [selectedInstrumentId, setSelectedInstrumentId] = useState('supervisor_to_student');
  const [selectedPlacementId, setSelectedPlacementId] = useState(
    placements[0]?.placement_id ? String(placements[0].placement_id) : '1'
  );

  useEffect(() => {
    if (isOpen) {
      if (currentUser?.role === 'student') {
        setSelectedInstrumentId('student_to_supervisor');
      } else if (currentUser?.role === 'adviser') {
        setSelectedInstrumentId('adviser_to_hte');
      } else if (currentUser?.role === 'supervisor') {
        setSelectedInstrumentId('supervisor_to_student');
      }
    }
  }, [isOpen, currentUser?.role]);

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
      EVALUATION_INSTRUMENTS.find((i) => i.id === selectedInstrumentId) ||
      EVALUATION_INSTRUMENTS[0]
    );
  }, [selectedInstrumentId]);

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

  // Set default evaluator name and initial scores
  useEffect(() => {
    if (activeInstrument.id === 'supervisor_to_student') {
      setEvaluatorName(
        currentUser?.role === 'supervisor'
          ? currentUser.display_name
          : activePlacement?.company_contact_person || 'Engr. Marc Danielle Sison, Lead Engineer'
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

    // Default all items to 5
    const initialScores = {};
    allItems.forEach((item) => {
      initialScores[item.key] = 5;
    });
    setScores(initialScores);

    if (activeInstrument.id === 'adviser_to_hte') {
      setStrengths('Comprehensive engineering workstation setup, structured technical mentor oversight, and strong compliance with safety protocols.');
      setAreasImprovement('Provide earlier notice regarding shift rotation schedules during national holidays.');
      setRecommendations('Continue accredited Host Training Establishment partnership for upcoming BS Computer Engineering cohorts.');
    } else {
      setComments('Exemplary practicum performance with outstanding initiative and technical competence.');
    }
  }, [activeInstrument, activePlacement, allItems, currentUser]);

  // Compute live weighted mean
  const computedRating = useMemo(() => {
    const values = Object.values(scores);
    if (values.length === 0) return 5.0;
    const sum = values.reduce((acc, curr) => acc + Number(curr), 0);
    return parseFloat((sum / values.length).toFixed(2));
  }, [scores]);

  const interpretation = getInterpretation(computedRating);

  // Set all scores to a specific number
  const handleSetAllScores = (val) => {
    playClickSound();
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
    if (!activePlacement) return;

    setIsSubmitting(true);
    playClickSound();

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
    };

    try {
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        playSuccessChime();
        if (onSuccess) onSuccess(`Recorded ${activeInstrument.name} (Score: ${computedRating.toFixed(2)}/5.00)`);
        onClose();
      } else {
        alert(json.error || 'Failed to record evaluation.');
      }
    } catch (err) {
      alert('Error saving evaluation: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    playClickSound();
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card modal-entry-card official-eval-modal"
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
              <div className="modal-title">Official OJT Evaluation Instruments &amp; Rubrics Hub</div>
              <div className="modal-subtitle">
                Institutional 360-degree evaluation forms (CHED Practicum Standards &amp; Quality Assurance)
              </div>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose size={16} />
          </button>
        </div>

        {/* 4-WAY INSTRUMENT SELECTOR BAR */}
        <div className="no-print" style={{ padding: '12px 24px 0', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', paddingBottom: '12px' }}>
            {EVALUATION_INSTRUMENTS.map((inst) => {
              const active = inst.id === selectedInstrumentId;
              return (
                <button
                  key={inst.id}
                  type="button"
                  className={`btn btn-sm ${active ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    padding: '8px 10px',
                    height: 'auto',
                    textAlign: 'left',
                  }}
                  onClick={() => {
                    playClickSound();
                    setSelectedInstrumentId(inst.id);
                  }}
                >
                  <span style={{ fontSize: '10px', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {inst.code}
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: 600, marginTop: '2px', lineHeight: 1.2 }}>
                    {inst.shortTitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTROLS STRIP: PLACEMENT SELECTOR & COMPOSITE SCORE SUMMARY */}
        <div
          className="no-print"
          style={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Placement:</span>
            <MaterialSelect
              className="select-sm"
              value={selectedPlacementId}
              onChange={(e) => setSelectedPlacementId(e.target.value)}
              style={{ flex: 1 }}
            >
              {placements.map((p) => (
                <option key={p.placement_id} value={p.placement_id}>
                  {p.student_name} — {p.company_name} ({p.student_number})
                </option>
              ))}
            </MaterialSelect>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                background: 'var(--success-bg)',
                color: 'var(--success-fg)',
                border: '1px solid var(--success-border)',
              }}
            >
              {interpretation.label}
            </span>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              title="Print official paper form formatted with signature blocks"
            >
              <IconPrinter size={13} />
              Print Form
            </button>
          </div>
        </div>

        {/* MODAL BODY (SCROLLABLE RUBRIC) */}
        <div className="modal-body modal-entry-body" style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {/* PRINTABLE OFFICIAL INSTRUMENT VIEW CONTAINER */}
          <div ref={printRef} className="official-instrument-print-area">
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
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
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
            <div
              className="no-print"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Rating Scale: 5 (Outstanding) · 4 (Very Satisfactory) · 3 (Satisfactory) · 2 (Fair) · 1 (Poor)
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
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
                  <table className="table table-compact" style={{ width: '100%', margin: 0 }}>
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

            {/* OFFICIAL SIGNATURE BLOCKS (PRINT READY) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '24px',
                marginTop: '28px',
                paddingTop: '16px',
                borderTop: '1px solid var(--border-default)',
              }}
            >
              {activeInstrument.signatories.map((sig, idx) => (
                <div key={idx} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      borderBottom: '1px solid var(--text-primary)',
                      height: '36px',
                      marginBottom: '4px',
                    }}
                  />
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {sig.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sig.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer no-print" style={{ padding: '12px 24px', borderTop: '1px solid var(--border-default)' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveEvaluation}
            disabled={isSubmitting}
          >
            <IconCheckCircle size={14} />
            {isSubmitting ? 'Recording...' : `Record ${activeInstrument.shortTitle} (${computedRating.toFixed(2)})`}
          </button>
        </div>
      </div>
    </div>
  );
}
