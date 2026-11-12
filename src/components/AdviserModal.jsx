import React from 'react';
import { IconSupervisor } from './Icons';
import M3FormModal from './M3FormModal';

/**
 * Material 3 modal dialog for registering or editing a Faculty OJT Adviser.
 */
export default function AdviserModal({
  isOpen,
  onClose,
  onSubmit,
  adviserForm,
  setAdviserForm,
  editingAdviserId,
  syncing = false,
}) {
  return (
    <M3FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      icon={IconSupervisor}
      title={editingAdviserId ? `Edit Faculty Adviser #${editingAdviserId}` : 'Register Faculty OJT Adviser'}
      subtitle={
        editingAdviserId
          ? 'Update faculty coordinator profile'
          : 'Creates adviser record and provisions login account'
      }
      submitLabel={editingAdviserId ? 'Save Changes' : 'Save Adviser'}
      maxWidth="640px"
      syncing={syncing}
    >
      <div className="field-grid-2">
        <div className="field">
          <label className="field-label" htmlFor="adviser-modal-code">Employee Code</label>
          <input
            id="adviser-modal-code"
            type="text"
            className="input mono"
            placeholder="MIT-COE-0082"
            value={adviserForm.employee_number}
            onChange={(e) => setAdviserForm({ ...adviserForm, employee_number: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="adviser-modal-name">Full Name &amp; Title</label>
          <input
            id="adviser-modal-name"
            type="text"
            className="input"
            placeholder="Engr. Ramon C. Mendoza, MSc"
            value={adviserForm.full_name}
            onChange={(e) => setAdviserForm({ ...adviserForm, full_name: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="adviser-modal-department">Department</label>
          <input
            id="adviser-modal-department"
            type="text"
            className="input"
            value={adviserForm.department}
            onChange={(e) => setAdviserForm({ ...adviserForm, department: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="adviser-modal-email">Faculty Email</label>
          <input
            id="adviser-modal-email"
            type="email"
            className="input"
            placeholder="rcmendoza@mit.edu.ph"
            value={adviserForm.email}
            onChange={(e) => setAdviserForm({ ...adviserForm, email: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="adviser-modal-contact">Contact Number</label>
          <input
            id="adviser-modal-contact"
            type="text"
            className="input mono"
            placeholder="0917-800-1122"
            value={adviserForm.contact_number}
            onChange={(e) => setAdviserForm({ ...adviserForm, contact_number: e.target.value })}
            required
          />
        </div>
        {!editingAdviserId && (
          <div className="field">
            <label className="field-label" htmlFor="adviser-modal-username">Login Username (Optional)</label>
            <input
              id="adviser-modal-username"
              type="text"
              className="input mono"
              placeholder="engr.mendoza"
              value={adviserForm.username}
              onChange={(e) => setAdviserForm({ ...adviserForm, username: e.target.value })}
            />
          </div>
        )}
      </div>
    </M3FormModal>
  );
}
