import React, { useEffect, useRef } from 'react';
import { IconClose, IconCheckCircle } from './Icons';

/**
 * Reusable Google Material Design 3 Form Dialog container.
 * Provides accessible Escape handling, backdrop dismissal, and consistent header/body/footer framing.
 */
export default function M3FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  subtitle,
  icon: HeaderIcon,
  submitLabel = 'Save Changes',
  maxWidth = '640px',
  syncing = false,
  headerActions = null,
  children,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !syncing) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, syncing]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      onClick={syncing ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-card modal-entry-card"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="modal-header">
          <div className="modal-header-identity">
            {HeaderIcon && (
              <div className="modal-header-icon-box">
                <HeaderIcon size={18} />
              </div>
            )}
            <div>
              <div className="modal-title">{title}</div>
              {subtitle && <div className="modal-subtitle">{subtitle}</div>}
            </div>
          </div>
          {headerActions}
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            disabled={syncing}
            aria-label="Close dialog"
          >
            <IconClose size={16} />
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modal-body modal-entry-body">{children}</div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={syncing}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={syncing}
            >
              <IconCheckCircle size={14} />
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
