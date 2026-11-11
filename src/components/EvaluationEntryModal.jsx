import React, { useEffect, useRef } from 'react';
import { Slider, MaterialSelect } from './MaterialComponents';
import { IconEvaluation, IconClose, IconCheckCircle, IconPlus } from './Icons';

export default function EvaluationEntryModal({
  isOpen,
  onClose,
  onSubmit,
  evalForm,
  setEvalForm,
  editingEvalId,
  currentUser,
  placements = [],
  previewComposite = '5.00',
  syncing = false
}) {
  const modalRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const applyScorePreset = (tech, att, punct, comments) => {
    setEvalForm((prev) => ({
      ...prev,
      technical_score: tech.toFixed(2),
      attitude_score: att.toFixed(2),
      attendance_score: punct.toFixed(2),
      comments: prev.comments || comments
    }));
  };

  const compositeNum = Number(previewComposite) || 0;
  const ratingBadgeClass =
    compositeNum >= 4.75
      ? 'rating-pill-outstanding'
      : compositeNum >= 4.0
      ? 'rating-pill-good'
      : compositeNum >= 3.0
      ? 'rating-pill-satisfactory'
      : 'rating-pill-poor';

  const ratingLabel =
    compositeNum >= 4.75
      ? 'Passed with Highest Distinction'
      : compositeNum >= 4.0
      ? 'Passed with High Honors'
      : compositeNum >= 3.0
      ? 'Passed Practicum Standards'
      : 'Needs Improvement / Retraining Required';

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-card modal-entry-card"
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="modal-header">
          <div className="modal-header-identity">
            <div className="modal-header-icon-box">
              <IconEvaluation size={18} />
            </div>
            <div>
              <div className="modal-title">
                {editingEvalId ? `Edit Evaluation #${editingEvalId}` : 'Submit Performance Evaluation'}
              </div>
              <div className="modal-subtitle">
                {evalForm.evaluator_type === 'employer'
                  ? 'Record Host Training Establishment (HTE) workplace evaluation from company rubric or letter'
                  : 'Faculty Adviser academic practicum assessment & endorsement'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body modal-entry-body">
            {/* Student Placement Selection */}
            <div className="field">
              <label className="field-label">Student Placement</label>
              <MaterialSelect
                value={evalForm.placement_id}
                onChange={(e) => {
                  const pid = e.target.value;
                  const pl = placements.find((p) => String(p.placement_id) === String(pid));
                  setEvalForm({
                    ...evalForm,
                    placement_id: pid,
                    evaluator_name:
                      evalForm.evaluator_type === 'employer'
                        ? pl?.company_contact_person || 'HTE Supervisor'
                        : pl?.adviser_name || 'Faculty Adviser',
                  });
                }}
                style={{ width: '100%' }}
              >
                {placements.map((pl) => (
                  <option key={pl.placement_id} value={pl.placement_id}>
                    {pl.student_name} — {pl.company_name} ({Number(pl.total_hours_completed || 0).toFixed(1)}/
                    {Number(pl.required_hours || 300).toFixed(0)} hrs · {pl.evaluation_count || 0}/2 evals)
                  </option>
                ))}
              </MaterialSelect>
            </div>

            {/* Evaluator Role & Date */}
            <div className="field-grid-2">
              <div className="field">
                <label className="field-label">Evaluator Role</label>
                <MaterialSelect
                  value={evalForm.evaluator_type}
                  onChange={(e) => {
                    const etype = e.target.value;
                    const pl = placements.find((p) => String(p.placement_id) === String(evalForm.placement_id));
                    setEvalForm({
                      ...evalForm,
                      evaluator_type: etype,
                      evaluator_name:
                        etype === 'employer'
                          ? currentUser?.role === 'supervisor'
                            ? currentUser.display_name
                            : pl?.company_contact_person || 'HTE Supervisor'
                          : currentUser?.role === 'adviser'
                          ? currentUser.display_name
                          : pl?.adviser_name || 'Faculty Adviser',
                    });
                  }}
                  style={{ width: '100%' }}
                >
                  <option value="employer">Employer / HTE Supervisor Rating (Encoded from Signed Form)</option>
                  <option value="adviser">Faculty Adviser Academic Endorsement</option>
                </MaterialSelect>
              </div>

              <div className="field">
                <label className="field-label">Date Evaluated</label>
                <input
                  type="date"
                  className="input"
                  value={evalForm.date_evaluated}
                  onChange={(e) => setEvalForm({ ...evalForm, date_evaluated: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Evaluator Name */}
            <div className="field">
              <label className="field-label">Evaluator Full Name &amp; Title</label>
              <input
                type="text"
                className="input"
                placeholder="e.g. Engr. Maria Santos, Technical Lead"
                value={evalForm.evaluator_name}
                onChange={(e) => setEvalForm({ ...evalForm, evaluator_name: e.target.value })}
                required
              />
            </div>

            {/* Rubric Score Presets */}
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="field-label" style={{ margin: 0 }}>Score Presets (1.00 – 5.00)</label>
                <span className="field-hint">Rubric: 40% Tech · 30% Ethic · 30% Attendance</span>
              </div>
              <div className="preset-chip-row">
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() =>
                    applyScorePreset(
                      5.0,
                      5.0,
                      5.0,
                      'Consistently exceeded engineering expectations across all assigned sprint deliverables with zero supervision.'
                    )
                  }
                >
                  <IconPlus size={12} />
                  5.00 Outstanding
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() =>
                    applyScorePreset(
                      4.85,
                      4.9,
                      4.95,
                      'Demonstrated strong technical competence, high reliability, and excellent team collaboration.'
                    )
                  }
                >
                  <IconPlus size={12} />
                  4.90 Very Good
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() =>
                    applyScorePreset(
                      4.5,
                      4.5,
                      4.5,
                      'Satisfactorily met department practicum requirements and delivered assigned OJT tasks on schedule.'
                    )
                  }
                >
                  <IconPlus size={12} />
                  4.50 Satisfactory
                </button>
              </div>
            </div>

            {/* Scores: Technical, Attitude, Attendance with interactive sliders & inputs */}
            <div className="score-rubric-card">
              <div className="score-rubric-row">
                <div className="score-rubric-info">
                  <span className="score-rubric-title">Technical Competence (40%)</span>
                  <span className="score-rubric-desc">Code quality, debugging, architectural understanding, sprint tasks</span>
                </div>
                <div className="score-rubric-controls">
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <Slider
                      min={1}
                      max={5}
                      step={0.05}
                      value={parseFloat(evalForm.technical_score) || 1}
                      onValueChange={(val) => setEvalForm((prev) => ({ ...prev, technical_score: val.toFixed(2) }))}
                    />
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    max="5"
                    className="input score-input mono tabular-nums"
                    value={evalForm.technical_score}
                    onChange={(e) => setEvalForm({ ...evalForm, technical_score: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="score-rubric-row">
                <div className="score-rubric-info">
                  <span className="score-rubric-title">Work Ethic &amp; Attitude (30%)</span>
                  <span className="score-rubric-desc">Professional conduct, responsiveness, initiative, adaptability</span>
                </div>
                <div className="score-rubric-controls">
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <Slider
                      min={1}
                      max={5}
                      step={0.05}
                      value={parseFloat(evalForm.attitude_score) || 1}
                      onValueChange={(val) => setEvalForm((prev) => ({ ...prev, attitude_score: val.toFixed(2) }))}
                    />
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    max="5"
                    className="input score-input mono tabular-nums"
                    value={evalForm.attitude_score}
                    onChange={(e) => setEvalForm({ ...evalForm, attitude_score: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="score-rubric-row">
                <div className="score-rubric-info">
                  <span className="score-rubric-title">Attendance &amp; Punctuality (30%)</span>
                  <span className="score-rubric-desc">DTR regularity, standup attendance, deadline compliance</span>
                </div>
                <div className="score-rubric-controls">
                  <div style={{ flex: 1, minWidth: '140px' }}>
                    <Slider
                      min={1}
                      max={5}
                      step={0.05}
                      value={parseFloat(evalForm.attendance_score) || 1}
                      onValueChange={(val) => setEvalForm((prev) => ({ ...prev, attendance_score: val.toFixed(2) }))}
                    />
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min="1"
                    max="5"
                    className="input score-input mono tabular-nums"
                    value={evalForm.attendance_score}
                    onChange={(e) => setEvalForm({ ...evalForm, attendance_score: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Composite Score Live Callout */}
              <div className="score-composite-banner">
                <div>
                  <div className="score-composite-label">Weighted Composite Rating</div>
                  <div className="score-composite-status">{ratingLabel}</div>
                </div>
                <div className={`score-composite-value mono ${ratingBadgeClass}`}>
                  {previewComposite} / 5.00
                </div>
              </div>
            </div>

            {/* Remarks & Qualitative Comments */}
            <div className="field">
              <label className="field-label">Qualitative Remarks &amp; Recommendations</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Detail the intern's strengths, engineering competencies, areas for improvement, and overall readiness for industry employment..."
                value={evalForm.comments}
                onChange={(e) => setEvalForm({ ...evalForm, comments: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={syncing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={syncing}
            >
              <IconCheckCircle size={14} />
              {editingEvalId ? 'Save Changes' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
