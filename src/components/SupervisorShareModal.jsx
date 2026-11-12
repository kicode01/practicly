import React, { useState } from 'react';
import {
  IconClose,
  IconLink,
  IconCheckCircle,
  IconShieldCheck,
  IconSupervisor,
  IconClock,
  IconBriefcase
} from './Icons';
import usePresence from '../utils/usePresence';

export default function SupervisorShareModal({
  isOpen,
  onClose,
  placement,
  onOpenSupervisorView
}) {
  const [copied, setCopied] = useState(false);
  const { rendered, exiting } = usePresence(isOpen && Boolean(placement), 150);

  if (!rendered || !placement) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:8000';
  const verifyTokenParam = placement.verify_token ? `&token=${encodeURIComponent(placement.verify_token)}` : '';
  const verifyUrl = `${origin}/?verify=${placement.placement_id}${verifyTokenParam}`;

  const handleCopy = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(verifyUrl);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className={`modal-backdrop ${exiting ? 'is-exiting' : ''}`} onClick={exiting ? undefined : onClose} role="dialog" aria-modal="true">
      <div className={`modal-card modal-entry-card ${exiting ? 'is-exiting' : ''}`} style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-header-identity">
            <div className="modal-header-icon-box">
              <IconLink size={18} />
            </div>
            <div>
              <div className="modal-title">Share DTR Verification Link to Supervisor</div>
              <div className="modal-subtitle">
                Generate a zero-friction, passwordless verification link for your HTE Supervisor
              </div>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose size={16} />
          </button>
        </div>

        <div className="modal-body modal-entry-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* NOTICE BANNER */}
          <div
            style={{
              padding: '12px 16px',
              background: 'var(--brand-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start'
            }}
          >
            <IconSupervisor size={18} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                No Supervisor Account Required
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>
                Your company supervisor does not need to create or log in to a university account. Simply send them this secure link via Email, Viber, or Slack. They can review your entered hours and confirm attendance with one click.
              </div>
            </div>
          </div>

          {/* TARGET INFO */}
          <div
            className="modal-info-grid-2"
            style={{
              padding: '12px 14px',
              background: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              fontSize: '11.5px'
            }}
          >
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>HTE Partner Company:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{placement.company_name}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Company Supervisor / Signatory:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{placement.company_contact_person || 'HTE HR / Technical Supervisor'}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Student Intern:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{placement.student_name} ({placement.student_number})</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Faculty Adviser:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{placement.adviser_name}</strong>
            </div>
          </div>

          {/* GENERATED LINK BOX */}
          <div className="field">
            <label className="field-label">Shareable Supervisor Verification URL</label>
            <div className="form-inline-pair">
              <input
                type="text"
                readOnly
                value={verifyUrl}
                className="input mono"
                style={{ fontSize: '11.5px', flex: 1, background: 'var(--bg-subtle)' }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={`btn ${copied ? 'btn-success' : 'btn-primary'}`}
                onClick={handleCopy}
                style={{ minWidth: '110px' }}
              >
                {copied ? <IconCheckCircle size={14} /> : <IconLink size={14} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <span className="field-hint">Anyone with this link can view your rendered shifts and submit verification.</span>
          </div>

          {/* WORKFLOW PIPELINE EXPLAINER */}
          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
              How the 4-Stage Verification Workflow Operates:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11.5px', color: 'var(--text-muted)' }}>
              <div><strong>1. Student Input:</strong> Student logs shifts or transfers batch records from Excel (Status: Pending).</div>
              <div><strong>2. Supervisor Link:</strong> Supervisor reviews hours via this link and clicks Verify (Status: Supervisor Verified).</div>
              <div><strong>3. Signed DTR Proof:</strong> Student uploads physical signed copy from company HR for academic cross-audit.</div>
              <div><strong>4. Faculty Adviser &amp; Admin:</strong> Adviser verifies consistency and endorses; Admin issues final clearance.</div>
            </div>
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              onClose();
              if (onOpenSupervisorView) onOpenSupervisorView(placement);
            }}
            title="Test the exact screen the supervisor will see without logging out"
          >
            <IconSupervisor size={13} />
            Open Supervisor Verification View (Demo / Test)
          </button>

          <button type="button" className="btn btn-primary btn-sm" onClick={onClose} style={{ minWidth: '80px' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
