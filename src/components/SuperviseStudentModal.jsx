import React from 'react';
import { IconStudent } from './Icons';
import { MaterialSelect, SegmentedControl } from './MaterialComponents';
import M3FormModal from './M3FormModal';

/**
 * Material 3 modal dialog for registering a new trainee or assigning/transferring
 * an existing student under a Faculty Adviser and Host Company (shared by Adviser & Admin).
 */
export default function SuperviseStudentModal({
  isOpen,
  onClose,
  onSubmit,
  superviseMode,
  setSuperviseMode,
  superviseForm,
  setSuperviseForm,
  currentUser,
  students = [],
  employers = [],
  advisers = [],
  syncing = false,
}) {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <M3FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      icon={IconStudent}
      title={
        isAdmin
          ? 'Add or Assign Student to Faculty Supervision'
          : 'Add or Assign Student to My Supervision'
      }
      subtitle={
        isAdmin
          ? 'Register a new student or assign/transfer an existing student to a Faculty OJT Adviser'
          : `Register a new BS CpE intern or assign an existing student under ${currentUser?.display_name || 'your supervision'}`
      }
      submitLabel={
        superviseMode === 'new'
          ? 'Register & Supervise Student'
          : isAdmin
          ? 'Assign Student to Adviser'
          : 'Assign to My Supervision'
      }
      maxWidth="660px"
      syncing={syncing}
    >
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <SegmentedControl
          value={superviseMode}
          onValueChange={setSuperviseMode}
          items={[
            { value: 'new', label: 'Register New Student' },
            { value: 'existing', label: 'Assign Existing Student' },
          ]}
        />
      </div>

      {isAdmin && (
        <div className="field">
          <label className="field-label" htmlFor="supervise-modal-adviser">Assigned Faculty Adviser</label>
          <MaterialSelect
            id="supervise-modal-adviser"
            className="select"
            value={superviseForm.adviser_id}
            onChange={(e) => setSuperviseForm({ ...superviseForm, adviser_id: e.target.value })}
          >
            {advisers.map((adv) => (
              <option key={adv.adviser_id} value={adv.adviser_id}>
                {adv.full_name} ({adv.employee_number})
              </option>
            ))}
          </MaterialSelect>
        </div>
      )}

      {superviseMode === 'new' ? (
        <div className="field-grid-2">
          <div className="field">
            <label className="field-label" htmlFor="supervise-modal-number">Student Number</label>
            <input
              id="supervise-modal-number"
              type="text"
              className="input mono"
              placeholder="2023-00315-MN-0"
              value={superviseForm.student_number}
              onChange={(e) => setSuperviseForm({ ...superviseForm, student_number: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="supervise-modal-fullname">Full Name (Last, First M.I.)</label>
            <input
              id="supervise-modal-fullname"
              type="text"
              className="input"
              placeholder="Navarro, Bea Katrina L."
              value={superviseForm.full_name}
              onChange={(e) => setSuperviseForm({ ...superviseForm, full_name: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="supervise-modal-section">Section</label>
            <input
              id="supervise-modal-section"
              type="text"
              className="input"
              value={superviseForm.section}
              onChange={(e) => setSuperviseForm({ ...superviseForm, section: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="supervise-modal-email">Institutional Email</label>
            <input
              id="supervise-modal-email"
              type="email"
              className="input"
              placeholder="bea.navarro@mit.edu.ph"
              value={superviseForm.email}
              onChange={(e) => setSuperviseForm({ ...superviseForm, email: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="supervise-modal-hte">Host Company (HTE)</label>
            <MaterialSelect
              id="supervise-modal-hte"
              className="select"
              value={superviseForm.employer_id}
              onChange={(e) => setSuperviseForm({ ...superviseForm, employer_id: e.target.value })}
            >
              {employers.map((emp) => (
                <option key={emp.employer_id} value={emp.employer_id}>
                  {emp.company_name}
                </option>
              ))}
            </MaterialSelect>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="supervise-modal-role">Internship Designation</label>
            <input
              id="supervise-modal-role"
              type="text"
              className="input"
              value={superviseForm.position_title}
              onChange={(e) => setSuperviseForm({ ...superviseForm, position_title: e.target.value })}
              required
            />
          </div>
        </div>
      ) : (
        <div className="field-grid-2">
          <div className="field" style={{ gridColumn: '1 / -1' }}>
            <label className="field-label" htmlFor="supervise-modal-existing-student">Select Student</label>
            <MaterialSelect
              id="supervise-modal-existing-student"
              className="select"
              value={superviseForm.student_id}
              onChange={(e) => setSuperviseForm({ ...superviseForm, student_id: e.target.value })}
            >
              <option value="">Choose student...</option>
              {students.map((st) => (
                <option key={st.student_id} value={st.student_id}>
                  {st.full_name} ({st.student_number}){' '}
                  {st.adviser_name ? `— Currently: ${st.adviser_name}` : '— Unassigned'}
                </option>
              ))}
            </MaterialSelect>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="supervise-modal-existing-hte">Host Company (HTE)</label>
            <MaterialSelect
              id="supervise-modal-existing-hte"
              className="select"
              value={superviseForm.employer_id}
              onChange={(e) => setSuperviseForm({ ...superviseForm, employer_id: e.target.value })}
            >
              {employers.map((emp) => (
                <option key={emp.employer_id} value={emp.employer_id}>
                  {emp.company_name}
                </option>
              ))}
            </MaterialSelect>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="supervise-modal-existing-role">Internship Designation</label>
            <input
              id="supervise-modal-existing-role"
              type="text"
              className="input"
              value={superviseForm.position_title}
              onChange={(e) => setSuperviseForm({ ...superviseForm, position_title: e.target.value })}
              required
            />
          </div>
        </div>
      )}
    </M3FormModal>
  );
}
