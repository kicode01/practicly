import React, { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/apiClient';
import {
  IconClose,
  IconUpload,
  IconFileText,
  IconCheckCircle,
  IconAlert,
  IconTrash,
  IconEye,
  IconShieldCheck,
  IconPrinter,
} from './Icons';
import ConfirmDialog from './ConfirmDialog';

const DOC_CONFIGS = {
  dtr: {
    modalTitleNew: 'Upload Signed Physical DTR',
    modalTitleManage: 'Manage Signed Physical DTR',
    subtitle: 'Official scanned copy signed by HTE Company Supervisor for Academic Adviser comparison',
    bannerTitle: 'Verification Requirement Prior to Faculty Endorsement',
    bannerDesc:
      "Per university practicum guidelines, your Faculty Adviser requires a scanned copy of your signed DTR (with your supervisor's wet signature or company stamp) to cross-reference with your digital time entries before endorsing hours to the Coordinator / Admin.",
    uploadEndpoint: '/api/placements/upload-signed-dtr',
    removeEndpoint: '/api/placements/remove-signed-dtr',
    removedMsg: 'Signed DTR document removed.',
    emptyErr: 'Please select a scanned PDF or image copy of your signed DTR.',
    defaultFilename: 'Signed_DTR_Document.pdf',
    badgeHint: 'Available for Adviser Audit',
    notesPlaceholder:
      'E.g., Signed by Engr. Paolo M. Sarmiento (HTE Technical Supervisor) covering Weeks 1 to 8...',
    notesHint: "Provide signatory details or shift coverage for your Faculty Adviser's reference.",
    submitLabel: 'Upload Signed DTR',
    fieldPrefix: 'signed_dtr',
  },
  eval: {
    modalTitleNew: 'Upload Signed INST-02 Evaluation',
    modalTitleManage: 'Manage Signed INST-02 Evaluation',
    subtitle: 'Scanned Trainee & School Performance Evaluation (INST-02) signed by your HTE Supervisor',
    bannerTitle: 'Supervisor Evaluation Fallback / Physical Proof (INST-02)',
    bannerDesc:
      'If your HTE Supervisor completed and signed a printed INST-02 rubric instead of submitting online via the Supervisor Portal link, upload the signed PDF or clear photo here to satisfy INST-02 for clearance.',
    uploadEndpoint: '/api/placements/upload-signed-eval',
    removeEndpoint: '/api/placements/remove-signed-eval',
    removedMsg: 'Signed INST-02 evaluation document removed.',
    emptyErr: 'Please select a scanned PDF or image copy of your signed INST-02 form.',
    defaultFilename: 'Signed_INST02_Evaluation.pdf',
    badgeHint: 'Satisfies INST-02 Supervisor Evaluation Requirement',
    notesPlaceholder:
      'E.g., Signed physical INST-02 rated 4.95/5.00 by HTE Supervisor on Oct 28...',
    notesHint: 'Include the supervisor name and evaluation date printed on the signed INST-02 form.',
    submitLabel: 'Upload Signed INST-02',
    fieldPrefix: 'signed_eval',
  },
};

export default function SignedDtrUploadModal({
  isOpen,
  onClose,
  placement,
  onSuccess,
  documentKind = 'dtr',
  onOpenBlankForm = null,
}) {
  const cfg = DOC_CONFIGS[documentKind] || DOC_CONFIGS.dtr;
  const p = cfg.fieldPrefix;

  const existingFilename = placement?.[`${p}_filename`] || '';
  const existingFile = placement?.[`${p}_file`] || '';
  const existingData = placement?.[`${p}_data`] || '';
  const existingNotes = placement?.[`${p}_notes`] || '';
  const existingUploadedAt = placement?.[`${p}_uploaded_at`] || '';

  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDataUri, setFileDataUri] = useState('');
  const [notes, setNotes] = useState(existingNotes);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedFile(null);
      setFileDataUri('');
      setNotes(existingNotes);
      setErrorMsg('');
    }
  }, [isOpen, placement?.placement_id, documentKind, existingNotes]);

  if (!isOpen || !placement) return null;

  const hasExistingDoc = Boolean(existingFilename || existingFile);

  const processFile = (file) => {
    setErrorMsg('');
    if (!file) return;

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Selected file exceeds maximum allowable size (15 MB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedFile(file);
      setFileDataUri(e.target.result);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile && !hasExistingDoc) {
      setErrorMsg(cfg.emptyErr);
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    try {
      const res = await apiFetch(cfg.uploadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: placement.placement_id,
          filename: selectedFile ? selectedFile.name : existingFilename,
          file_data: fileDataUri || existingData || '',
          notes: notes,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        if (onSuccess) onSuccess(json.message);
        onClose();
      } else {
        setErrorMsg(json.error || 'Failed to upload signed DTR document.');
      }
    } catch (err) {
      setErrorMsg('Upload error: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveExisting = () => {
    setConfirmRemoveOpen(true);
  };

  const executeRemoveExisting = async () => {
    setIsDeleting(true);
    try {
      const res = await apiFetch(cfg.removeEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: placement.placement_id,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setConfirmRemoveOpen(false);
        setSelectedFile(null);
        setFileDataUri('');
        if (onSuccess) onSuccess(cfg.removedMsg);
        onClose();
      } else {
        setErrorMsg(json.error || 'Failed to remove document.');
        setConfirmRemoveOpen(false);
      }
    } catch (err) {
      setErrorMsg('Delete error: ' + err.message);
      setConfirmRemoveOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-card modal-entry-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="modal-header">
          <div className="modal-header-identity">
            <div className="modal-header-icon-box">
              <IconFileText size={18} />
            </div>
            <div>
              <div className="modal-title">
                {hasExistingDoc ? cfg.modalTitleManage : cfg.modalTitleNew}
              </div>
              <div className="modal-subtitle">
                {cfg.subtitle}
              </div>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose size={16} />
          </button>
        </div>

        <form onSubmit={handleUploadSubmit}>
          <div className="modal-body modal-entry-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* INSTRUCTIONAL BANNER */}
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
              <IconShieldCheck size={18} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {cfg.bannerTitle}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>
                  {cfg.bannerDesc}
                </div>
                {documentKind === 'eval' && onOpenBlankForm && (
                  <div style={{ marginTop: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-xs"
                      onClick={() => {
                        onClose();
                        onOpenBlankForm();
                      }}
                    >
                      <IconPrinter size={12} />
                      Print Blank INST-02 Form for Supervisor
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PLACEMENT CONTEXT */}
            <div
              className="modal-info-grid-2"
              style={{
                padding: '10px 14px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                fontSize: '11.5px'
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Student Intern:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{placement.student_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Host Company (HTE):</span>
                <strong style={{ color: 'var(--text-primary)' }}>{placement.company_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Faculty Adviser:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{placement.adviser_name}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Logged Hours Rendered:</span>
                <strong style={{ color: 'var(--brand)' }}>{Number(placement.total_hours_completed || 0).toFixed(1)} / {Number(placement.required_hours || 300).toFixed(0)} hrs</strong>
              </div>
            </div>

            {/* EXISTING DOCUMENT STATUS IF AVAILABLE */}
            {hasExistingDoc && !selectedFile && (
              <div
                style={{
                  padding: '14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: '1 1 200px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-success-bg, rgba(16, 185, 129, 0.1))',
                      color: 'var(--color-success, #10b981)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <IconFileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {existingFilename || cfg.defaultFilename}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Uploaded on {existingUploadedAt || 'Recorded on file'} · {cfg.badgeHint}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => {
                      if (existingData) {
                        const win = window.open();
                        win.document.write('<iframe src="' + existingData + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                      } else if (existingFile) {
                        window.open(existingFile, '_blank');
                      }
                    }}
                    title="View uploaded document"
                  >
                    <IconEye size={12} />
                    View
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    style={{ color: 'var(--color-danger, #ef4444)' }}
                    onClick={handleRemoveExisting}
                    disabled={isDeleting}
                    title="Remove existing file"
                  >
                    <IconTrash size={12} />
                    Remove
                  </button>
                </div>
              </div>
            )}

            {/* DRAG AND DROP UPLOAD ZONE */}
            <div
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-default)',
                borderRadius: 'var(--radius-md)',
                padding: '24px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragActive ? 'var(--brand-subtle)' : 'var(--bg-subtle)',
                transition: 'border-color 0.15s, background-color 0.15s'
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    processFile(e.target.files[0]);
                  }
                }}
              />
              <div style={{ display: 'inline-flex', padding: '10px', background: 'var(--bg-surface)', borderRadius: '50%', marginBottom: '8px' }}>
                <IconUpload size={20} style={{ color: 'var(--brand)' }} />
              </div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {selectedFile ? selectedFile.name : hasExistingDoc ? 'Click to replace signed document' : 'Click to browse or drop file here'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Supported formats: PDF, PNG, JPG (Max 15MB)
              </div>
            </div>

            {/* ERROR MESSAGE */}
            {errorMsg && (
              <div
                style={{
                  padding: '8px 12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: 'var(--color-danger, #ef4444)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '11.5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <IconAlert size={14} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* NOTES / REMARKS */}
            <div className="field">
              <label className="field-label">Document Remarks / Notes</label>
              <textarea
                className="input"
                rows={2}
                placeholder={cfg.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span className="field-hint">
                {cfg.notesHint}
              </span>
            </div>
          </div>

          {/* FOOTER */}
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isUploading || isDeleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUploading || (!selectedFile && !notes)}
            >
              <IconCheckCircle size={14} />
              {isUploading ? 'Uploading...' : hasExistingDoc && !selectedFile ? 'Save Remarks' : cfg.submitLabel}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={confirmRemoveOpen}
        onClose={() => setConfirmRemoveOpen(false)}
        onConfirm={executeRemoveExisting}
        variant="danger"
        iconType="trash"
        title={documentKind === 'eval' ? 'Remove Signed INST-02 Copy?' : 'Remove Signed DTR Copy?'}
        message={`This removes the uploaded ${documentKind === 'eval' ? 'signed INST-02 evaluation' : 'signed physical DTR'} scan from this placement record.`}
        detail={existingFilename ? `File: ${existingFilename}` : ''}
        confirmLabel="Remove Document"
        cancelLabel="Keep File"
      />
    </div>
  );
}
