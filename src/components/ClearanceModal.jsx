import React from 'react';
import { IconPrinter, IconBrandLogo } from './Icons';
import { getPlacementInstrumentStatus } from '../utils/evaluationRubrics';
import SessionSignatureControl, {
  PrintableSignatoryBlock,
  useSessionSignature,
} from './SessionSignatureControl';

export default function ClearanceModal({ report, currentUser = null, onClose }) {
  if (!report) return null;

  const userRole = currentUser?.role || 'admin';
  const userId = currentUser?.user_id || currentUser?.linked_id || userRole;
  const activeSignature = useSessionSignature(userRole, userId);

  const instStatus = getPlacementInstrumentStatus(report);
  const isEligible = instStatus.isCleared;
  const hoursMet = instStatus.hoursMet;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card dtr-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header dtr-modal-header no-print">
          <div>
            <div className="panel-title">OJT Compliance &amp; Clearance Certificate</div>
            <div className="panel-desc">
              Official institutional summary for {report.student_name}
            </div>
          </div>
          <div className="action-row-wrap">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <IconPrinter size={14} />
              Print Certificate
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="dtr-modal-body">
          {currentUser && (
            <div style={{ marginBottom: '12px' }}>
              <SessionSignatureControl
                role={userRole}
                userId={userId}
                signerName={currentUser.display_name}
              />
            </div>
          )}
          <div className="certificate-sheet">
          <div className="cert-header">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <IconBrandLogo size={54} />
            </div>
            <div className="cert-univ">Metropolitan Institute of Technology</div>
            <div className="cert-college">
              College of Engineering — Department of Computer Engineering
            </div>
            <div className="cert-doc-title">
              CERTIFICATE OF OJT COMPLIANCE &amp; CLEARANCE
            </div>
            <div style={{ marginTop: '8px' }}>
              {isEligible ? (
                <span className="status-chip success">
                  Cleared for Completion — Ref: {report.clearance_reference || `MIT-CPE-CLR-2026-000${report.placement_id}`}
                </span>
              ) : (
                <span className="status-chip warning">
                  Pending Completion of Practicum Requirements
                </span>
              )}
            </div>
          </div>

          <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#374151', marginBottom: '14px' }}>
            This certifies the On-the-Job Training (OJT) practicum record of the student listed below,
            verified through daily attendance logs and supervisor performance evaluations on file with
            the Computer Engineering Department.
          </p>

          <div className="cert-grid">
            <div>
              <div className="cert-field-label">Student Name</div>
              <div className="cert-field-value">{report.student_name}</div>
            </div>
            <div>
              <div className="cert-field-label">Student Number &amp; Section</div>
              <div className="cert-field-value mono">
                {report.student_number} · {report.section || 'BSCpE 4-1'}
              </div>
            </div>
            <div>
              <div className="cert-field-label">Host Training Establishment</div>
              <div className="cert-field-value">{report.company_name}</div>
            </div>
            <div>
              <div className="cert-field-label">Industry &amp; Supervisor</div>
              <div className="cert-field-value">
                {report.industry} · {report.company_contact_person}
              </div>
            </div>
            <div>
              <div className="cert-field-label">Faculty OJT Adviser</div>
              <div className="cert-field-value">{report.adviser_name}</div>
            </div>
            <div>
              <div className="cert-field-label">Academic Term &amp; Period</div>
              <div className="cert-field-value">
                {report.academic_term} ({report.start_date} – {report.end_date})
              </div>
            </div>
            <div>
              <div className="cert-field-label">Total Hours Rendered</div>
              <div className="cert-field-value tabular-nums">
                {Number(report.total_hours_completed).toFixed(2)} / {Number(report.required_hours).toFixed(2)} hrs (
                {report.completion_percentage}%)
              </div>
            </div>
            <div>
              <div className="cert-field-label">Evaluation Rating</div>
              <div className="cert-field-value tabular-nums">
                {report.average_rating
                  ? `${Number(report.average_rating).toFixed(2)} / 5.00 (${report.evaluation_count} evaluation/s)`
                  : 'Pending evaluation'}
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: '6px',
              background: '#f8f9fa',
              border: '1px solid #e5e7eb',
              fontSize: '12px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
              Clearance Verification Summary ({instStatus.completedCount}/4 Instruments Complete)
            </div>
            <div className="modal-info-grid-2" style={{ gap: '8px', color: '#374151' }}>
              <div>
                Practicum Hours:{' '}
                <strong>
                  {hoursMet
                    ? `Met (${Number(report.total_hours_completed).toFixed(2)} / ${Number(report.required_hours).toFixed(0)} hrs)`
                    : `Incomplete (${Number(report.hours_remaining).toFixed(2)} hrs left)`}
                </strong>
              </div>
              <div>
                INST-02 (Supervisor):{' '}
                <strong>
                  {instStatus.inst02Online
                    ? `Submitted (${report.employer_rating || 'Rated'})`
                    : instStatus.inst02Signed
                    ? 'Signed Physical Copy Uploaded'
                    : 'Pending'}
                </strong>
              </div>
              <div>
                INST-03 (Adviser HTE Audit):{' '}
                <strong>{instStatus.inst03 ? `Submitted (${report.adviser_rating || 'Audited'})` : 'Pending'}</strong>
              </div>
              <div>
                INST-01 (Student to Supervisor):{' '}
                <strong>{instStatus.inst01 ? `Submitted (${report.student_supervisor_rating || 'Done'})` : 'Pending'}</strong>
              </div>
              <div>
                INST-04 (Student to Adviser):{' '}
                <strong>{instStatus.inst04 ? `Submitted (${report.student_adviser_rating || 'Done'})` : 'Pending'}</strong>
              </div>
            </div>
          </div>

          <div className="cert-signatures">
            <PrintableSignatoryBlock
              printedName={report.company_contact_person}
              roleLabel="HTE Training Supervisor"
              signature={activeSignature}
              matchesRole={userRole === 'supervisor'}
            />
            <PrintableSignatoryBlock
              printedName={report.adviser_name}
              roleLabel="Faculty OJT Adviser"
              signature={activeSignature}
              matchesRole={userRole === 'adviser'}
            />
            <PrintableSignatoryBlock
              printedName="Department Chairperson / Coordinator"
              roleLabel="Computer Engineering Dept., MIT"
              signature={activeSignature}
              matchesRole={userRole === 'admin'}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
