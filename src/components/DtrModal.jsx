import React from 'react';
import { IconPrinter, IconBrandLogo } from './Icons';

export default function DtrModal({ placement, logs = [], onClose }) {
  if (!placement) return null;

  const sortedLogs = [...logs].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const approvedHours = sortedLogs
    .filter((l) => l.approval_status !== 'flagged')
    .reduce((sum, l) => sum + Number(l.hours_rendered || 0), 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header no-print">
          <div>
            <div className="panel-title">Official OJT Daily Time Record (DTR)</div>
            <div className="panel-desc">
              Verified attendance ledger for {placement.student_name} ({placement.student_number})
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <IconPrinter size={14} />
              Print Official DTR
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

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
              ON-THE-JOB TRAINING DAILY TIME RECORD (DTR)
            </div>
          </div>

          <div className="cert-grid" style={{ marginBottom: '16px' }}>
            <div>
              <div className="cert-field-label">Student Intern</div>
              <div className="cert-field-value">
                {placement.student_name} ({placement.student_number})
              </div>
            </div>
            <div>
              <div className="cert-field-label">Program &amp; Section</div>
              <div className="cert-field-value">
                {placement.program || 'BS Computer Engineering'} · {placement.section || 'BSCpE 4-1'}
              </div>
            </div>
            <div>
              <div className="cert-field-label">Host Training Establishment (HTE)</div>
              <div className="cert-field-value">{placement.company_name}</div>
            </div>
            <div>
              <div className="cert-field-label">Designation &amp; Supervisor</div>
              <div className="cert-field-value">
                {placement.position_title} · {placement.company_contact_person}
              </div>
            </div>
            <div>
              <div className="cert-field-label">Faculty OJT Adviser</div>
              <div className="cert-field-value">{placement.adviser_name}</div>
            </div>
            <div>
              <div className="cert-field-label">Total Verified Hours</div>
              <div className="cert-field-value mono tabular-nums">
                {approvedHours.toFixed(2)} / {Number(placement.required_hours || 300).toFixed(2)} hrs (
                {placement.completion_percentage}%)
              </div>
            </div>
          </div>

          <div className="table-wrap" style={{ border: '1px solid #d1d5db', borderRadius: '6px' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th className="text-right">Hours</th>
                  <th>Status</th>
                  <th>Accomplishment / Technical Tasks</th>
                </tr>
              </thead>
              <tbody>
                {sortedLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '18px', color: '#6b7280' }}>
                      No attendance records logged for this placement yet.
                    </td>
                  </tr>
                ) : (
                  sortedLogs.map((log) => (
                    <tr key={log.log_id}>
                      <td className="mono">{log.date}</td>
                      <td className="mono">{String(log.time_in).slice(0, 5)}</td>
                      <td className="mono">{String(log.time_out).slice(0, 5)}</td>
                      <td className="text-right mono tabular-nums" style={{ fontWeight: 600 }}>
                        {Number(log.hours_rendered).toFixed(2)}
                      </td>
                      <td className="mono" style={{ fontSize: '11px' }}>
                        {log.approval_status === 'flagged'
                          ? 'FLAGGED'
                          : log.approval_status === 'pending'
                          ? 'PENDING SUPERVISOR'
                          : log.approval_status === 'supervisor_verified'
                          ? 'SUPERVISOR VERIFIED'
                          : 'ADVISER ENDORSED'}
                      </td>
                      <td>{log.task_description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="cert-signatures" style={{ marginTop: '36px' }}>
            <div>
              <div className="cert-sig-line">{placement.student_name}</div>
              <div className="cert-sig-role">Student Intern Signature</div>
            </div>
            <div>
              <div className="cert-sig-line">{placement.company_contact_person}</div>
              <div className="cert-sig-role">HTE Training Supervisor</div>
            </div>
            <div>
              <div className="cert-sig-line">{placement.adviser_name}</div>
              <div className="cert-sig-role">Faculty Practicum Adviser</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
