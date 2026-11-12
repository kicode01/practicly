import React from 'react';
import { IconBuilding } from './Icons';
import { MaterialSelect } from './MaterialComponents';
import M3FormModal from './M3FormModal';

/**
 * Material 3 modal dialog for registering or editing a Partner Company (HTE).
 */
export default function EmployerModal({
  isOpen,
  onClose,
  onSubmit,
  employerForm,
  setEmployerForm,
  editingEmployerId,
  syncing = false,
}) {
  return (
    <M3FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={onSubmit}
      icon={IconBuilding}
      title={editingEmployerId ? `Edit Partner Company #${editingEmployerId}` : 'Register Partner Company'}
      subtitle={
        editingEmployerId
          ? 'Update HTE contact details, supervisor, or MOA validity'
          : 'Add a Host Training Establishment to the departmental directory'
      }
      submitLabel={editingEmployerId ? 'Save Changes' : 'Save Partner HTE'}
      maxWidth="660px"
      syncing={syncing}
    >
      <div className="field-grid-2">
        <div className="field">
          <label className="field-label" htmlFor="employer-modal-name">Company Name</label>
          <input
            id="employer-modal-name"
            type="text"
            className="input"
            placeholder="Texas Instruments Philippines"
            value={employerForm.company_name}
            onChange={(e) => setEmployerForm({ ...employerForm, company_name: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="employer-modal-industry">Industry Sector</label>
          <input
            id="employer-modal-industry"
            type="text"
            className="input"
            value={employerForm.industry}
            onChange={(e) => setEmployerForm({ ...employerForm, industry: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="employer-modal-contact-person">Contact Person</label>
          <input
            id="employer-modal-contact-person"
            type="text"
            className="input"
            placeholder="Engr. Roberto V. Salazar"
            value={employerForm.contact_person}
            onChange={(e) => setEmployerForm({ ...employerForm, contact_person: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="employer-modal-address">Office Address</label>
          <input
            id="employer-modal-address"
            type="text"
            className="input"
            placeholder="BGC, Taguig City"
            value={employerForm.address}
            onChange={(e) => setEmployerForm({ ...employerForm, address: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="employer-modal-phone">Contact Number</label>
          <input
            id="employer-modal-phone"
            type="text"
            className="input mono"
            placeholder="(02) 8800-1000"
            value={employerForm.contact_number}
            onChange={(e) => setEmployerForm({ ...employerForm, contact_number: e.target.value })}
            required
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="employer-modal-email">Contact Email</label>
          <input
            id="employer-modal-email"
            type="email"
            className="input"
            placeholder="hr@company.com"
            value={employerForm.email}
            onChange={(e) => setEmployerForm({ ...employerForm, email: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="gws-modal-section">
        <div className="gws-modal-section-title">Memorandum of Agreement (MOA)</div>
        <div className="field-grid-2">
          <div className="field">
            <label className="field-label" htmlFor="employer-modal-moa-status">MOA Status</label>
            <MaterialSelect
              id="employer-modal-moa-status"
              className="select"
              value={employerForm.moa_status}
              onChange={(e) => setEmployerForm({ ...employerForm, moa_status: e.target.value })}
            >
              <option value="active">Active</option>
              <option value="pending_renewal">Pending Renewal</option>
              <option value="expired">Expired</option>
            </MaterialSelect>
          </div>
          <div className="field">
            <label className="field-label" htmlFor="employer-modal-moa-validity">MOA Expiry Date</label>
            <input
              id="employer-modal-moa-validity"
              type="date"
              className="input"
              value={employerForm.moa_validity}
              onChange={(e) => setEmployerForm({ ...employerForm, moa_validity: e.target.value })}
            />
          </div>
        </div>
      </div>
    </M3FormModal>
  );
}
