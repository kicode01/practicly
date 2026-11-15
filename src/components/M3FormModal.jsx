import React, { useEffect, useRef } from 'react';
import { IconClose } from './Icons';
import usePresence from '../utils/usePresence';

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
  const { rendered, exiting } = usePresence(isOpen, 150);

  const lastPropsRef = useRef({ title, subtitle, submitLabel, icon: HeaderIcon });
  if (isOpen) {
    lastPropsRef.current = { title, subtitle, submitLabel, icon: HeaderIcon };
  }
  const activeTitle = isOpen ? title : (lastPropsRef.current.title || title);
  const activeSubtitle = isOpen ? subtitle : (lastPropsRef.current.subtitle || subtitle);
  const activeSubmitLabel = isOpen ? submitLabel : (lastPropsRef.current.submitLabel || submitLabel);
  const ActiveIcon = isOpen ? HeaderIcon : (lastPropsRef.current.icon || HeaderIcon);

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

  if (!rendered) return null;

  return (
    <div
      className={`modal-backdrop ${exiting ? 'is-exiting' : ''}`}
      onClick={syncing || exiting ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="m3-modal-title"
      aria-describedby={activeSubtitle ? 'm3-modal-subtitle' : undefined}
    >
      <div
        className={`modal-card modal-entry-card ${exiting ? 'is-exiting' : ''}`}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        <div className="modal-header">
          <div className="modal-header-identity">
            {ActiveIcon && (
              <div className="modal-header-icon-box" aria-hidden="true">
                <ActiveIcon size={18} />
              </div>
            )}
            <div>
              <h2 id="m3-modal-title" className="modal-title">{activeTitle}</h2>
              {activeSubtitle && <p id="m3-modal-subtitle" className="modal-subtitle">{activeSubtitle}</p>}
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
              {activeSubmitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
