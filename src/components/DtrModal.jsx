import React, { useRef, useEffect } from 'react';
import {
  IconPrinter,
  IconBrandLogo,
  IconChevronLeft,
  IconChevronRight,
  IconStudent,
} from './Icons';
import { MaterialSelect } from './MaterialComponents';
import SessionSignatureControl, {
  PrintableSignatoryBlock,
  useSessionSignature,
} from './SessionSignatureControl';
import { usePresenceValue } from '../utils/usePresence';

export default function DtrModal({
  placement: placementProp,
  placements = [],
  onSelectPlacement,
  logs = [],
  allLogs = [],
  currentUser = null,
  onClose,
}) {
  const { rendered, exiting, value: placement } = usePresenceValue(placementProp, 150);

  // Directly derive accurate logs for active placement if allLogs is provided
  const currentLogs = (placementProp && allLogs && allLogs.length > 0)
    ? allLogs.filter((tl) => Number(tl.placement_id) === Number(placementProp.placement_id))
    : logs;

  const lastLogsRef = useRef(currentLogs);
  if (placementProp) {
    lastLogsRef.current = currentLogs;
  }
  const activeLogs = placementProp ? currentLogs : lastLogsRef.current;

  const userRole = currentUser?.role || 'student';
  const userId = currentUser?.user_id || currentUser?.linked_id || userRole;
  const activeSignature = useSessionSignature(userRole, userId);

  const currentPlacementId = placement?.placement_id;
  const currentIndex = placements.findIndex(
    (p) => String(p.placement_id) === String(currentPlacementId)
  );

  const handlePrevStudent = () => {
    if (currentIndex > 0 && onSelectPlacement) {
      onSelectPlacement(placements[currentIndex - 1]);
    }
  };

  const handleNextStudent = () => {
    if (currentIndex >= 0 && currentIndex < placements.length - 1 && onSelectPlacement) {
      onSelectPlacement(placements[currentIndex + 1]);
    }
  };

  useEffect(() => {
    if (!placements || placements.length <= 1 || !onSelectPlacement) return;
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowLeft' && (e.altKey || e.metaKey)) {
        e.preventDefault();
        handlePrevStudent();
      } else if (e.key === 'ArrowRight' && (e.altKey || e.metaKey)) {
        e.preventDefault();
        handleNextStudent();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, placements, onSelectPlacement]);

  if (!rendered || !placement) return null;

  const sortedLogs = [...activeLogs].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const approvedHours = sortedLogs
    .filter((l) => l.approval_status !== 'flagged')
    .reduce((sum, l) => sum + Number(l.hours_rendered || 0), 0);

  return (
    <div
      className={`modal-backdrop ${exiting ? 'is-exiting' : ''}`}
      onClick={exiting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dtr-modal-title"
    >
      <div className={`modal-card dtr-modal-card ${exiting ? 'is-exiting' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="panel-header dtr-modal-header no-print">
          <div>
            <h2 id="dtr-modal-title" className="panel-title">Official OJT Daily Time Record (DTR)</h2>
            <div className="panel-desc">
              Verified attendance ledger for {placement.student_name} ({placement.student_number})
            </div>
          </div>
          <div className="action-row-wrap">
            <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
              <IconPrinter size={14} />
              Print Official DTR
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close dialog">
              Close
            </button>
          </div>
        </div>

        {/* Material 3 Student Intern Switcher Toolbar */}
        {placements && placements.length > 1 && onSelectPlacement && (
          <div className="dtr-student-nav-bar no-print">
            <div className="dtr-student-nav-selector">
              <span className="dtr-student-nav-label">
                <IconStudent size={15} />
                <span>Student Intern:</span>
              </span>
              <div className="dtr-student-nav-select-wrap">
                <MaterialSelect
                  className="select-sm dtr-student-select"
                  value={String(placement.placement_id)}
                  onChange={(e) => {
                    const next = placements.find((p) => String(p.placement_id) === String(e.target.value));
                    if (next) onSelectPlacement(next);
                  }}
                  style={{ width: '100%' }}
                >
                  {placements.map((p) => {
                    const hrs = Number(p.total_hours_completed || 0).toFixed(0);
                    const req = Number(p.required_hours || 300).toFixed(0);
                    const pct = p.completion_percentage != null ? p.completion_percentage : Math.round((hrs / req) * 100);
                    return (
                      <option key={p.placement_id} value={String(p.placement_id)}>
                        {p.student_name} ({p.student_number}) — {p.company_name || 'No HTE'} · {pct}% ({hrs}/{req} hrs)
                      </option>
                    );
                  })}
                </MaterialSelect>
              </div>
            </div>

            <div className="dtr-student-nav-pager">
              <span className="dtr-pager-counter">
                {currentIndex >= 0 ? `${currentIndex + 1} of ${placements.length}` : `${placements.length} students`}
              </span>
              <div className="dtr-pager-btns">
                <button
                  type="button"
                  className="dtr-pager-btn"
                  disabled={currentIndex <= 0}
                  onClick={handlePrevStudent}
                  title="Previous Student Intern (Alt+Left)"
                  aria-label="Previous Student Intern"
                >
                  <IconChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  className="dtr-pager-btn"
                  disabled={currentIndex === -1 || currentIndex >= placements.length - 1}
                  onClick={handleNextStudent}
                  title="Next Student Intern (Alt+Right)"
                  aria-label="Next Student Intern"
                >
                  <IconChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="dtr-modal-body">
          {currentUser && (
            <div style={{ marginBottom: '12px' }}>
              <SessionSignatureControl
                role={userRole}
                userId={userId}
                signerName={currentUser.display_name || placement.student_name}
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
            <table className="table" aria-label="Official Daily Time Record Entries">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Time In</th>
                  <th scope="col">Time Out</th>
                  <th scope="col" className="text-right">Hours</th>
                  <th scope="col">Status</th>
                  <th scope="col">Accomplishment / Technical Tasks</th>
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
            <PrintableSignatoryBlock
              printedName={placement.student_name}
              roleLabel="Student Intern Signature"
              signature={activeSignature}
              matchesRole={userRole === 'student'}
            />
            <PrintableSignatoryBlock
              printedName={placement.company_contact_person}
              roleLabel="HTE Training Supervisor"
              signature={activeSignature}
              matchesRole={userRole === 'supervisor'}
            />
            <PrintableSignatoryBlock
              printedName={placement.adviser_name}
              roleLabel="Faculty Practicum Adviser"
              signature={activeSignature}
              matchesRole={userRole === 'adviser'}
            />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
