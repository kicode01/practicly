import React from 'react';
import { IconBriefcase } from './Icons';
import { MaterialSelect } from './MaterialComponents';
import M3FormModal from './M3FormModal';

/**
 * Material 3 modal dialog for creating or editing a Student OJT Placement contract.
 */
export default function PlacementModal({
  isOpen,
  onClose,
  onSubmit,
  placementForm,
  setPlacementForm,
  editingPlacementId,
  students = [],
  employers = [],
  advisers = [],
  syncing = false,
}) {
  return (
    <M3FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      icon={IconBriefcase}
      title={editingPlacementId ? `Edit Placement Contract #${editingPlacementId}` : 'Assign Student Placement'}
      subtitle={
        editingPlacementId
          ? 'Modify student assignment, host company, adviser, or required hours'
          : 'Create an OJT deployment contract for the term'
      }
      submitLabel={editingPlacementId ? 'Save Changes' : 'Create Placement'}
      maxWidth="660px"
      syncing={syncing}
    >
      <div className="field-grid-2">
        <div className="field">
          <label className="field-label" htmlFor="placement-modal-student">Student</label>
          <MaterialSelect
            id="placement-modal-student"
            className="select"
            value={placementForm.student_id}
            onChange={(e) => setPlacementForm({ ...placementForm, student_id: e.target.value })}
          >
            <option value="">Select student...</option>
            {students.map((s) => (
              <option key={s.student_id} value={s.student_id}>
                {s.full_name} ({s.student_number})
              </option>
            ))}
          </MaterialSelect>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="placement-modal-employer">Host Company (HTE)</label>
          <MaterialSelect
            id="placement-modal-employer"
            className="select"
            value={placementForm.employer_id}
            onChange={(e) => setPlacementForm({ ...placementForm, employer_id: e.target.value })}
          >
            <option value="">Select company...</option>
            {employers.map((emp) => (
              <option key={emp.employer_id} value={emp.employer_id}>
                {emp.company_name}
              </option>
            ))}
          </MaterialSelect>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="placement-modal-adviser">Faculty Adviser</label>
          <MaterialSelect
            id="placement-modal-adviser"
            className="select"
            value={placementForm.adviser_id}
            onChange={(e) => setPlacementForm({ ...placementForm, adviser_id: e.target.value })}
          >
            <option value="">Select adviser...</option>
            {advisers.map((adv) => (
              <option key={adv.adviser_id} value={adv.adviser_id}>
                {adv.full_name}
              </option>
            ))}
          </MaterialSelect>
        </div>
        <div className="field">
          <label className="field-label" htmlFor="placement-modal-position">Position Title</label>
          <input
            id="placement-modal-position"
            type="text"
            className="input"
            value={placementForm.position_title}
            onChange={(e) => setPlacementForm({ ...placementForm, position_title: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="gws-modal-section">
        <div className="gws-modal-section-title">Practicum Schedule &amp; Requirements</div>
        <div className="field-grid-2">
          <div className="field">
            <label className="field-label" htmlFor="placement-modal-start">Start Date</label>
            <input
              id="placement-modal-start"
              type="date"
              className="input"
              value={placementForm.start_date}
              onChange={(e) => setPlacementForm({ ...placementForm, start_date: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="placement-modal-end">End Date</label>
            <input
              id="placement-modal-end"
              type="date"
              className="input"
              value={placementForm.end_date}
              onChange={(e) => setPlacementForm({ ...placementForm, end_date: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="placement-modal-hours">Required Hours</label>
            <input
              id="placement-modal-hours"
              type="number"
              className="input tabular-nums"
              value={placementForm.required_hours}
              onChange={(e) => setPlacementForm({ ...placementForm, required_hours: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="placement-modal-term">Academic Term</label>
            <input
              id="placement-modal-term"
              type="text"
              className="input"
              value={placementForm.academic_term}
              onChange={(e) => setPlacementForm({ ...placementForm, academic_term: e.target.value })}
              required
            />
          </div>
          {editingPlacementId && (
            <div className="field">
              <label className="field-label" htmlFor="placement-modal-status">Placement Status</label>
              <MaterialSelect
                id="placement-modal-status"
                className="select"
                value={placementForm.status || 'ongoing'}
                onChange={(e) => setPlacementForm({ ...placementForm, status: e.target.value })}
              >
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="dropped">Dropped</option>
              </MaterialSelect>
            </div>
          )}
        </div>
      </div>
    </M3FormModal>
  );
}
