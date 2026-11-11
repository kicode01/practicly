import React, { useState, useRef } from 'react';
import {
  IconClose,
  IconUpload,
  IconFileText,
  IconCheckCircle,
  IconAlert,
  IconTrash,
  IconEye,
  IconShieldCheck
} from './Icons';

export default function SignedDtrUploadModal({
  isOpen,
  onClose,
  placement,
  onSuccess
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDataUri, setFileDataUri] = useState('');
  const [notes, setNotes] = useState(placement?.signed_dtr_notes || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen || !placement) return null;

  const hasExistingDoc = Boolean(placement.signed_dtr_filename || placement.signed_dtr_file);

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
      setErrorMsg('Please select a scanned PDF or image copy of your signed DTR.');
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/placements/upload-signed-dtr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: placement.placement_id,
          filename: selectedFile ? selectedFile.name : placement.signed_dtr_filename,
          file_data: fileDataUri || placement.signed_dtr_data || '',
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

  const handleRemoveExisting = async () => {
    if (!window.confirm('Are you sure you want to remove the current signed DTR document?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/placements/remove-signed-dtr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placement_id: placement.placement_id,
        }),
      });

      const json = await res.json();
      if (json.ok) {
        setSelectedFile(null);
        setFileDataUri('');
        if (onSuccess) onSuccess('Signed DTR document removed.');
        onClose();
      } else {
        setErrorMsg(json.error || 'Failed to remove document.');
      }
    } catch (err) {
      setErrorMsg('Delete error: ' + err.message);
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
                {hasExistingDoc ? 'Manage Signed Physical DTR' : 'Upload Signed Physical DTR'}
              </div>
              <div className="modal-subtitle">
                Official scanned copy signed by HTE Company Supervisor for Academic Adviser comparison
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
              <div>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Verification Requirement Prior to Faculty Endorsement
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>
                  Per university practicum guidelines, your Faculty Adviser requires a scanned copy of your signed DTR (with your supervisor's wet signature or company stamp) to cross-reference with your digital time entries before endorsing hours to the Coordinator / Admin.
                </div>
              </div>
            </div>

            {/* PLACEMENT CONTEXT */}
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--bg-subtle)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-default)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
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
                  gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                      {placement.signed_dtr_filename || 'Signed_DTR_Document.pdf'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Uploaded on {placement.signed_dtr_uploaded_at || 'Recorded on file'} · Available for Adviser Audit
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-xs"
                    onClick={() => {
                      if (placement.signed_dtr_data) {
                        const win = window.open();
                        win.document.write('<iframe src="' + placement.signed_dtr_data + '" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>');
                      } else if (placement.signed_dtr_file) {
                        window.open(placement.signed_dtr_file, '_blank');
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
                placeholder="E.g., Signed by Engr. Juan Dela Cruz (HTE Technical Supervisor) covering Weeks 1 to 8..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <span className="field-hint">
                Provide signatory details or shift coverage for your Faculty Adviser's reference.
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
              {isUploading ? 'Uploading...' : hasExistingDoc && !selectedFile ? 'Save Remarks' : 'Upload Signed DTR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
