import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconAlert, IconClose, IconLogOut, IconShieldCheck, IconTrash } from './Icons';
import usePresence from '../utils/usePresence';

/**
 * Reusable Material 3 Confirmation Dialog.
 * Renders in document.body above standard modals so destructive deletes, resets,
 * document removals, and logout prompts are clear and accessible on desktop & mobile.
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to continue?',
  detail = '',
  warning = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  iconType = 'alert', // 'trash' | 'logout' | 'shield' | 'alert'
  onConfirm,
  onClose,
}) {
  const [submitting, setSubmitting] = useState(false);
  const { rendered, exiting } = usePresence(isOpen, 150);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !submitting) {
        e.stopPropagation();
        onClose && onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, submitting, onClose]);

  if (!rendered || typeof document === 'undefined') return null;

  const renderIcon = () => {
    if (iconType === 'trash') return <IconTrash size={20} />;
    if (iconType === 'logout') return <IconLogOut size={20} />;
    if (iconType === 'shield') return <IconShieldCheck size={20} />;
    return <IconAlert size={20} />;
  };

  const handleConfirmClick = async () => {
    if (!onConfirm || submitting) return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className={`modal-backdrop confirm-dialog-backdrop ${exiting ? 'is-exiting' : ''}`}
      style={{ zIndex: 2700 }}
      onClick={() => {
        if (!submitting && !exiting && onClose) onClose();
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div
        className={`modal-card confirm-dialog-card ${exiting ? 'is-exiting' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon is-${variant}`}>
            {renderIcon()}
          </div>
          <div className="confirm-dialog-heading">
            <h3 id="confirm-dialog-title" className="confirm-dialog-title">
              {title}
            </h3>
            <p className="confirm-dialog-message">{message}</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Close confirmation dialog"
            onClick={onClose}
            disabled={submitting}
          >
            <IconClose size={16} />
          </button>
        </div>

        {(detail || warning) && (
          <div className="confirm-dialog-body">
            {detail && (
              <div className="confirm-dialog-detail">
                {detail}
              </div>
            )}
            {warning && (
              <div className="confirm-dialog-warning">
                <IconAlert size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{warning}</span>
              </div>
            )}
          </div>
        )}

        <div className="confirm-dialog-footer">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            disabled={submitting}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              variant === 'danger'
                ? 'btn-danger'
                : variant === 'warning'
                ? 'btn-warning'
                : 'btn-primary'
            }`}
            onClick={handleConfirmClick}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
