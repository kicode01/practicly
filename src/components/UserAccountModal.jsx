import React from 'react';
import { IconSettings } from './Icons';
import { MaterialSelect } from './MaterialComponents';
import M3FormModal from './M3FormModal';

/**
 * Material 3 modal dialog for creating or editing a system User Account.
 */
export default function UserAccountModal({
  isOpen,
  onClose,
  onSubmit,
  userForm,
  setUserForm,
  editingUserId,
  editingUser = null,
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
      icon={IconSettings}
      title={editingUserId ? `Edit User Account #${editingUserId}` : 'Create User Account'}
      subtitle="Configure username, password, system role, and linked stakeholder record"
      submitLabel={editingUserId ? 'Save Changes' : 'Create Account'}
      maxWidth="620px"
      syncing={syncing}
    >
      <div className="field-grid-2">
        <div className="field">
          <label className="field-label" htmlFor="user-modal-username">Username</label>
          <input
            id="user-modal-username"
            type="text"
            className="input mono"
            placeholder="e.g. juan.cruz"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="user-modal-password">
            {editingUserId ? 'New Password (leave blank to keep)' : 'Password'}
          </label>
          <input
            id="user-modal-password"
            type="text"
            className="input mono"
            placeholder={editingUserId ? 'Leave blank to keep current' : 'password123'}
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
            required={!editingUserId}
          />
          {editingUserId && (
            <div
              data-testid="user-password-status"
              style={{
                marginTop: 6,
                fontSize: 12,
                lineHeight: 1.4,
                fontWeight: 500,
                color: Number(editingUser?.has_custom_password) === 1 ? '#0f7b4f' : '#5f6368',
              }}
            >
              {Number(editingUser?.has_custom_password) === 1
                ? 'Custom password saved (bcrypt-encrypted, hidden for security). Enter a new value only to change it.'
                : 'Default demo password is set (bcrypt-encrypted, hidden for security). Enter a new password to change it.'}
            </div>
          )}
        </div>
        <div className="field">
          <label className="field-label" htmlFor="user-modal-role">Role</label>
          <MaterialSelect
            id="user-modal-role"
            className="select"
            value={userForm.role}
            onChange={(e) =>
              setUserForm({ ...userForm, role: e.target.value, linked_id: '' })
            }
          >
            <option value="student">Student</option>
            <option value="supervisor">HTE Industry Supervisor</option>
            <option value="adviser">Faculty Adviser</option>
            <option value="admin">Administrator</option>
          </MaterialSelect>
        </div>

        {userForm.role === 'student' && (
          <div className="field">
            <label className="field-label" htmlFor="user-modal-student">Linked Student Record</label>
            <MaterialSelect
              id="user-modal-student"
              className="select"
              value={userForm.linked_id}
              onChange={(e) => setUserForm({ ...userForm, linked_id: e.target.value })}
            >
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.full_name} ({s.student_number})
                </option>
              ))}
            </MaterialSelect>
          </div>
        )}

        {userForm.role === 'supervisor' && (
          <div className="field">
            <label className="field-label" htmlFor="user-modal-employer">Linked Partner Company (HTE)</label>
            <MaterialSelect
              id="user-modal-employer"
              className="select"
              value={userForm.linked_id}
              onChange={(e) => setUserForm({ ...userForm, linked_id: e.target.value })}
            >
              <option value="">Select company...</option>
              {employers.map((emp) => (
                <option key={emp.employer_id} value={emp.employer_id}>
                  {emp.company_name} ({emp.contact_person})
                </option>
              ))}
            </MaterialSelect>
          </div>
        )}

        {userForm.role === 'adviser' && (
          <div className="field">
            <label className="field-label" htmlFor="user-modal-adviser">Linked Adviser Record</label>
            <MaterialSelect
              id="user-modal-adviser"
              className="select"
              value={userForm.linked_id}
              onChange={(e) => setUserForm({ ...userForm, linked_id: e.target.value })}
            >
              <option value="">Select adviser...</option>
              {advisers.map((a) => (
                <option key={a.adviser_id} value={a.adviser_id}>
                  {a.full_name} ({a.employee_number})
                </option>
              ))}
            </MaterialSelect>
          </div>
        )}

        {editingUserId && (
          <div className="field">
            <label className="field-label" htmlFor="user-modal-active">Account Status</label>
            <MaterialSelect
              id="user-modal-active"
              className="select"
              value={String(Number(userForm.is_active) === 1 ? 1 : 0)}
              onChange={(e) => setUserForm({ ...userForm, is_active: Number(e.target.value) })}
            >
              <option value="1">Active (Enabled)</option>
              <option value="0">Disabled (Locked)</option>
            </MaterialSelect>
          </div>
        )}
      </div>
    </M3FormModal>
  );
}
