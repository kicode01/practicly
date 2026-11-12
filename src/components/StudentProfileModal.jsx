import React, { useEffect, useRef } from 'react';
import {
  IconUser,
  IconStudent,
  IconClose,
  IconCheckCircle,
  IconBuilding,
  IconSupervisor,
} from './Icons';
import { MaterialSelect } from './MaterialComponents';
import usePresence from '../utils/usePresence';

/**
 * Material 3 modal dialog for editing a student's own profile/contacts
 * or registering/editing a student record as Practicum Coordinator/Admin.
 */
export default function StudentProfileModal({
  isOpen,
  onClose,
  onSubmit,
  studentForm,
  setStudentForm,
  editingStudentId,
  isStudentRole,
  assignedPlacement,
  employers = [],
  advisers = [],
  syncing = false,
}) {
  const modalRef = useRef(null);
  const { rendered, exiting } = usePresence(isOpen, 150);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !syncing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, syncing]);

  if (!rendered) return null;

  const HeaderIcon = isStudentRole ? IconUser : IconStudent;

  return (
    <div className={`modal-backdrop ${exiting ? 'is-exiting' : ''}`} onClick={syncing || exiting ? undefined : onClose} role="dialog" aria-modal="true">
      <div
        className={`modal-card modal-entry-card ${exiting ? 'is-exiting' : ''}`}
        style={{ maxWidth: '640px' }}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="modal-header">
          <div className="modal-header-identity">
            <div className="modal-header-icon-box">
              <HeaderIcon size={18} />
            </div>
            <div>
              <div className="modal-title">
                {isStudentRole
                  ? 'Edit My Student Profile'
                  : editingStudentId
                  ? `Edit Student #${editingStudentId}`
                  : 'Register New Student'}
              </div>
              <div className="modal-subtitle">
                {isStudentRole
                  ? 'Update your contact number, institutional email, or section details'
                  : editingStudentId
                  ? 'Update student academic profile and placement supervision'
                  : 'Create student record and provision login credentials'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={syncing}
            aria-label="Close dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body modal-entry-body">
            {isStudentRole ? (
              <>
                {/* Read-only academic & coordinator-managed assignment summary */}
                <div className="gws-profile-readonly-card">
                  <div className="gws-readonly-row">
                    <div className="gws-readonly-item">
                      <span className="gws-readonly-label">Student Number</span>
                      <div className="gws-readonly-val-row">
                        <span className="gws-readonly-val mono">{studentForm.student_number || 'Unassigned'}</span>
                        <span className="gws-readonly-badge">Read-only</span>
                      </div>
                    </div>
                    <div className="gws-readonly-item">
                      <span className="gws-readonly-label">Program</span>
                      <span className="gws-readonly-val">{studentForm.program || 'BS Computer Engineering'}</span>
                    </div>
                  </div>

                  {assignedPlacement ? (
                    <div className="gws-readonly-divider">
                      <div className="gws-readonly-row">
                        <div className="gws-readonly-item">
                          <span className="gws-readonly-label">
                            <IconBuilding size={12} /> Host Company (HTE)
                          </span>
                          <span className="gws-readonly-val">{assignedPlacement.company_name}</span>
                        </div>
                        <div className="gws-readonly-item">
                          <span className="gws-readonly-label">
                            <IconSupervisor size={12} /> Faculty Adviser
                          </span>
                          <span className="gws-readonly-val">{assignedPlacement.adviser_name}</span>
                        </div>
                      </div>
                      <div className="gws-readonly-note">
                        Host company and faculty adviser assignments are managed by your Practicum Coordinator.
                      </div>
                    </div>
                  ) : (
                    <div className="gws-readonly-divider">
                      <div className="gws-readonly-note">
                        Host company and faculty adviser will appear here once assigned by your Practicum Coordinator.
                      </div>
                    </div>
                  )}
                </div>

                <div className="field-grid-2">
                  <div className="field">
                    <label className="field-label" htmlFor="student-profile-full-name">Full Name</label>
                    <input
                      id="student-profile-full-name"
                      type="text"
                      className="input"
                      value={studentForm.full_name}
                      onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="student-profile-section">Section</label>
                    <input
                      id="student-profile-section"
                      type="text"
                      className="input"
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="student-profile-email">Institutional Email</label>
                    <input
                      id="student-profile-email"
                      type="email"
                      className="input"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="student-profile-contact">Contact Number</label>
                    <input
                      id="student-profile-contact"
                      type="text"
                      className="input mono"
                      value={studentForm.contact_number}
                      onChange={(e) => setStudentForm({ ...studentForm, contact_number: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {assignedPlacement && (
                  <div className="field">
                    <label className="field-label" htmlFor="student-profile-position">Internship Designation / Role</label>
                    <input
                      id="student-profile-position"
                      type="text"
                      className="input"
                      value={studentForm.position_title || ''}
                      onChange={(e) => setStudentForm({ ...studentForm, position_title: e.target.value })}
                      placeholder="e.g. Frontend & UI Systems Engineering Intern"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="field-grid-2">
                  <div className="field">
                    <label className="field-label" htmlFor="admin-student-number">Student Number</label>
                    <input
                      id="admin-student-number"
                      type="text"
                      className="input mono"
                      placeholder="2023-00255-MN-0"
                      value={studentForm.student_number}
                      onChange={(e) => setStudentForm({ ...studentForm, student_number: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="admin-student-name">Full Name (Last, First M.I.)</label>
                    <input
                      id="admin-student-name"
                      type="text"
                      className="input"
                      placeholder="Cruz, Juan Miguel A."
                      value={studentForm.full_name}
                      onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="admin-student-section">Section</label>
                    <input
                      id="admin-student-section"
                      type="text"
                      className="input"
                      value={studentForm.section}
                      onChange={(e) => setStudentForm({ ...studentForm, section: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="admin-student-email">Institutional Email</label>
                    <input
                      id="admin-student-email"
                      type="email"
                      className="input"
                      placeholder="juan.cruz@mit.edu.ph"
                      value={studentForm.email}
                      onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="field">
                    <label className="field-label" htmlFor="admin-student-contact">Contact Number</label>
                    <input
                      id="admin-student-contact"
                      type="text"
                      className="input mono"
                      placeholder="0917-555-0199"
                      value={studentForm.contact_number}
                      onChange={(e) => setStudentForm({ ...studentForm, contact_number: e.target.value })}
                      required
                    />
                  </div>
                  {!editingStudentId && (
                    <div className="field">
                      <label className="field-label" htmlFor="admin-student-username">Login Username (Optional)</label>
                      <input
                        id="admin-student-username"
                        type="text"
                        className="input mono"
                        placeholder="juan.cruz"
                        value={studentForm.username}
                        onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="gws-modal-section">
                  <div className="gws-modal-section-title">Practicum Supervision Assignment</div>
                  <div className="field-grid-2">
                    <div className="field">
                      <label className="field-label">Supervised by Faculty Adviser</label>
                      <MaterialSelect
                        value={studentForm.adviser_id || ''}
                        onChange={(e) => setStudentForm({ ...studentForm, adviser_id: e.target.value })}
                      >
                        <option value="">Assign later...</option>
                        {advisers.map((adv) => (
                          <option key={adv.adviser_id} value={adv.adviser_id}>
                            {adv.full_name} ({adv.employee_number})
                          </option>
                        ))}
                      </MaterialSelect>
                    </div>
                    <div className="field">
                      <label className="field-label">Host Company (HTE)</label>
                      <MaterialSelect
                        value={studentForm.employer_id || ''}
                        onChange={(e) => setStudentForm({ ...studentForm, employer_id: e.target.value })}
                      >
                        <option value="">Assign later...</option>
                        {employers.map((emp) => (
                          <option key={emp.employer_id} value={emp.employer_id}>
                            {emp.company_name}
                          </option>
                        ))}
                      </MaterialSelect>
                    </div>
                  </div>
                  <div className="field" style={{ marginTop: '12px' }}>
                    <label className="field-label" htmlFor="admin-student-position">Internship Designation / Role</label>
                    <input
                      id="admin-student-position"
                      type="text"
                      className="input"
                      value={studentForm.position_title || 'Computer Engineering Intern'}
                      onChange={(e) => setStudentForm({ ...studentForm, position_title: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
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
              {editingStudentId ? 'Save Changes' : 'Save Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
