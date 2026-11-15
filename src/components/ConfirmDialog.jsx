import React, { useEffect, useState, useRef } from 'react';
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

  const lastPropsRef = useRef({
    title,
    message,
    detail,
    warning,
    confirmLabel,
    cancelLabel,
    variant,
    iconType,
    onConfirm,
  });

  if (isOpen && (title || message || detail || confirmLabel)) {
    lastPropsRef.current = {
      title,
      message,
      detail,
      warning,
      confirmLabel,
      cancelLabel,
      variant,
      iconType,
      onConfirm,
    };
  }

  const activeTitle = (isOpen ? title : lastPropsRef.current.title) || title || 'Confirm Action';
  const activeMessage = (isOpen ? message : lastPropsRef.current.message) || message || 'Are you sure you want to continue?';
  const activeDetail = (isOpen ? detail : lastPropsRef.current.detail) ?? detail;
  const activeWarning = (isOpen ? warning : lastPropsRef.current.warning) ?? warning;
  const activeConfirmLabel = (isOpen ? confirmLabel : lastPropsRef.current.confirmLabel) || confirmLabel || 'Confirm';
  const activeCancelLabel = (isOpen ? cancelLabel : lastPropsRef.current.cancelLabel) || cancelLabel || 'Cancel';
  const activeVariant = (isOpen ? variant : lastPropsRef.current.variant) || variant || 'danger';
  const activeIconType = (isOpen ? iconType : lastPropsRef.current.iconType) || iconType || 'alert';
  const activeOnConfirm = isOpen ? onConfirm : (lastPropsRef.current.onConfirm || onConfirm);

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
    if (activeIconType === 'trash') return <IconTrash size={24} />;
    if (activeIconType === 'logout') return <IconLogOut size={24} />;
    if (activeIconType === 'shield') return <IconShieldCheck size={24} />;
    return <IconAlert size={24} />;
  };

  const handleConfirmClick = async () => {
    if (!activeOnConfirm || submitting) return;
    setSubmitting(true);
    try {
      await activeOnConfirm();
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
      aria-describedby="confirm-dialog-message"
    >
      <div
        className={`modal-card confirm-dialog-card ${exiting ? 'is-exiting' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-dialog-header">
          <div className={`confirm-dialog-icon is-${activeVariant}`}>
            {renderIcon()}
          </div>
          <div className="confirm-dialog-heading">
            <h3 id="confirm-dialog-title" className="confirm-dialog-title">
              {activeTitle}
            </h3>
            <p id="confirm-dialog-message" className="confirm-dialog-message">{activeMessage}</p>
          </div>
        </div>

        {(activeDetail || activeWarning) && (
          <div className="confirm-dialog-body">
            {activeDetail && (
              <div className="confirm-dialog-detail">
                {activeDetail}
              </div>
            )}
            {activeWarning && (
              <div className="confirm-dialog-warning">
                <IconAlert size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{activeWarning}</span>
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
            {activeCancelLabel}
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              activeVariant === 'danger'
                ? 'btn-danger'
                : activeVariant === 'warning'
                ? 'btn-warning'
                : 'btn-primary'
            }`}
            onClick={handleConfirmClick}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : activeConfirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
