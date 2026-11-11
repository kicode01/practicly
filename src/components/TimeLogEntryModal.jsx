import React, { useEffect, useRef } from 'react';
import { MaterialSelect } from './MaterialComponents';
import { IconClock, IconClose, IconPlus, IconCheckCircle } from './Icons';

export default function TimeLogEntryModal({
  isOpen,
  onClose,
  onSubmit,
  logForm,
  setLogForm,
  editingLogId,
  currentUser,
  placements = [],
  previewHours = 8,
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

  const applyPreset = (presetHours, label = '') => {
    if (presetHours === 8) {
      setLogForm((prev) => ({
        ...prev,
        time_in: '08:00',
        time_out: '17:00',
        break_minutes: '60',
        hours_rendered: '8.00',
        task_description: prev.task_description || 'Completed assigned engineering deliverables, testing, and documentation.'
      }));
    } else if (presetHours === 4) {
      setLogForm((prev) => ({
        ...prev,
        time_in: '08:00',
        time_out: '12:00',
        break_minutes: '0',
        hours_rendered: '4.00',
        task_description: prev.task_description || 'Half-day sprint training and technical review session.'
      }));
    } else if (presetHours === 40) {
      setLogForm((prev) => ({
        ...prev,
        time_in: '08:00',
        time_out: '17:00',
        break_minutes: '60',
        hours_rendered: '40.00',
        task_description: prev.task_description || 'Full-week practicum shift completion: development, system integration, and mentorship.'
      }));
    }
  };

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
              <IconClock size={18} />
            </div>
            <div>
              <div className="modal-title">
                {editingLogId
                  ? `Edit Attendance Entry #${editingLogId}`
                  : currentUser?.role === 'student'
                  ? 'Log Practicum Attendance'
                  : 'Record Intern Attendance Entry'}
              </div>
              <div className="modal-subtitle">
                {currentUser?.role === 'student'
                  ? 'Submit your daily shift hours for HTE supervisor verification'
                  : 'Directly credit verified practicum training hours'}
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
            {/* Student Placement Selection for Non-Students */}
            {currentUser?.role !== 'student' && (
              <div className="field">
                <label className="field-label">Student Placement</label>
                <MaterialSelect
                  value={logForm.placement_id}
                  onChange={(e) => setLogForm({ ...logForm, placement_id: e.target.value })}
                  style={{ width: '100%' }}
                >
                  {placements.map((pl) => (
                    <option key={pl.placement_id} value={pl.placement_id}>
                      {pl.student_name} — {pl.company_name} ({Number(pl.total_hours_completed || 0).toFixed(1)}/
                      {Number(pl.required_hours || 300).toFixed(0)} hrs completed)
                    </option>
                  ))}
                </MaterialSelect>
              </div>
            )}

            {/* Quick Shift Presets */}
            <div className="field">
              <label className="field-label">Quick Shift Presets</label>
              <div className="preset-chip-row">
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => applyPreset(8)}
                >
                  <IconPlus size={12} />
                  +8.0 hrs Full Day (8am-5pm)
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => applyPreset(4)}
                >
                  <IconPlus size={12} />
                  +4.0 hrs Half Day (8am-12pm)
                </button>
                <button
                  type="button"
                  className="preset-chip"
                  onClick={() => applyPreset(40)}
                >
                  <IconPlus size={12} />
                  +40.0 hrs Full Week
                </button>
              </div>
            </div>

            {/* Date & Break */}
            <div className="field-grid-2">
              <div className="field">
                <label className="field-label">Shift Date</label>
                <input
                  type="date"
                  className="input"
                  value={logForm.date}
                  onChange={(e) => setLogForm({ ...logForm, date: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Break Duration (mins)</label>
                <input
                  type="number"
                  className="input tabular-nums"
                  min="0"
                  max="180"
                  value={logForm.break_minutes}
                  onChange={(e) => setLogForm({ ...logForm, break_minutes: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Time In & Time Out */}
            <div className="field-grid-2">
              <div className="field">
                <label className="field-label">Time In</label>
                <input
                  type="time"
                  className="input tabular-nums"
                  value={logForm.time_in}
                  onChange={(e) => setLogForm({ ...logForm, time_in: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label className="field-label">Time Out</label>
                <input
                  type="time"
                  className="input tabular-nums"
                  value={logForm.time_out}
                  onChange={(e) => setLogForm({ ...logForm, time_out: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Credited Hours & Calculation Live Chip */}
            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="field-label" style={{ margin: 0 }}>Credited Hours</label>
                <span className="hours-credit-pill">
                  Auto-calculated: <strong>+{previewHours.toFixed(2)} hrs</strong>
                </span>
              </div>
              <input
                type="number"
                step="0.25"
                min="0.25"
                max="60"
                className="input tabular-nums"
                placeholder={`Leave blank for shift calculation (${previewHours.toFixed(2)} hrs)`}
                value={logForm.hours_rendered}
                onChange={(e) => setLogForm({ ...logForm, hours_rendered: e.target.value })}
              />
              <span className="field-hint">
                Leave blank to automatically use the calculated duration ({previewHours.toFixed(2)} hrs), or override directly.
              </span>
            </div>

            {/* Tasks & Accomplishments */}
            <div className="field">
              <label className="field-label">Tasks &amp; Engineering Accomplishments</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Describe your training tasks, sprint deliverables, bug fixes, or documentation completed during this shift..."
                value={logForm.task_description}
                onChange={(e) => setLogForm({ ...logForm, task_description: e.target.value })}
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
              {editingLogId ? 'Save Changes' : 'Submit Attendance Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
