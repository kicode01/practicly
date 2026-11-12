import React, { useEffect, useRef, useState } from 'react';
import {
  clearSessionSignature,
  getSessionSignature,
  processSignatureImageFile,
  setSessionSignature,
  subscribeSessionSignature,
} from '../utils/sessionSignature';
import { IconAlert, IconCheckCircle, IconEdit, IconShieldCheck, IconTrash, IconUpload } from './Icons';

export function useSessionSignature(role, userId) {
  const [sig, setSig] = useState(() => getSessionSignature(role, userId));

  useEffect(() => {
    setSig(getSessionSignature(role, userId));
    return subscribeSessionSignature(() => {
      setSig(getSessionSignature(role, userId));
    });
  }, [role, userId]);

  return sig;
}

export function PrintableSignatoryBlock({
  printedName,
  roleLabel,
  signature,
  matchesRole = false,
}) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          height: '44px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          marginBottom: '2px',
          overflow: 'hidden',
        }}
      >
        {matchesRole && signature?.dataUrl ? (
          <img
            src={signature.dataUrl}
            alt={`${printedName || roleLabel} signature`}
            style={{
              maxHeight: '42px',
              maxWidth: '180px',
              objectFit: 'contain',
              mixBlendMode: 'multiply',
            }}
          />
        ) : null}
      </div>
      <div className="cert-sig-line" style={{ marginTop: 0 }}>
        {printedName}
      </div>
      <div className="cert-sig-role">{roleLabel}</div>
    </div>
  );
}

export default function SessionSignatureControl({
  role,
  userId,
  signerName = '',
  title = 'Local Session Print Signature (Browser Memory Only)',
}) {
  const signature = useSessionSignature(role, userId);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  const [drawOpen, setDrawOpen] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!drawOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
    setHasStroke(false);
  }, [drawOpen]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErrorMsg('');
    try {
      const dataUrl = await processSignatureImageFile(file);
      setSessionSignature(role, userId, {
        dataUrl,
        signerName,
        method: 'upload',
      });
      setDrawOpen(false);
    } catch (err) {
      setErrorMsg(err.message || 'Could not process signature image.');
    }
  };

  const getCanvasPoint = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      canvas.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore synthetic pointer capture errors
    }
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    drawingRef.current = true;
    setHasStroke(true);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const handlePointerUp = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    try {
      canvasRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore synthetic pointer release errors
    }
  };

  const handleApplyDrawnSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStroke) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSessionSignature(role, userId, {
      dataUrl,
      signerName,
      method: 'draw',
    });
    setDrawOpen(false);
    setErrorMsg('');
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    setHasStroke(false);
  };

  return (
    <div
      className="no-print session-sig-card"
      style={{
        padding: '12px 14px',
        borderRadius: 'var(--radius-md, 10px)',
        border: '1px solid var(--border-default, #e5e7eb)',
        background: 'var(--bg-subtle, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', minWidth: 0, flex: '1 1 220px' }}>
          <IconShieldCheck size={16} style={{ color: 'var(--brand, #1a73e8)', marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #111827)' }}>
                {title}
              </span>
              {signature ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    color: '#047857',
                  }}
                >
                  <IconCheckCircle size={11} />
                  Active in tab
                </span>
              ) : null}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)', marginTop: '2px', lineHeight: 1.45 }}>
              Kept strictly in this browser tab&apos;s <code style={{ fontSize: '10.5px' }}>sessionStorage</code> until sign-out or close. Never sent to the server or saved in the database.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="btn btn-secondary btn-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <IconUpload size={12} />
            Upload Signature
          </button>
          <button
            type="button"
            className={`btn btn-xs ${drawOpen ? 'btn-tonal' : 'btn-secondary'}`}
            onClick={() => setDrawOpen((v) => !v)}
          >
            <IconEdit size={12} />
            {drawOpen ? 'Close Pad' : 'Draw Signature'}
          </button>
          {signature && (
            <button
              type="button"
              className="btn btn-ghost-danger btn-xs"
              onClick={() => clearSessionSignature(role, userId)}
              title="Clear signature from this browser session"
            >
              <IconTrash size={12} />
              Clear
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11.5px',
            color: '#b91c1c',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '6px 10px',
            borderRadius: '6px',
          }}
        >
          <IconAlert size={13} />
          <span>{errorMsg}</span>
        </div>
      )}

      {signature && !drawOpen && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '8px 12px',
            borderRadius: '8px',
            background: 'var(--bg-surface, #ffffff)',
            border: '1px dashed var(--border-default, #cbd5e1)',
          }}
        >
          <span style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)' }}>
            Print preview overlay for <strong>{signerName || role}</strong>:
          </span>
          <img
            src={signature.dataUrl}
            alt="Session print signature preview"
            style={{
              height: '32px',
              maxWidth: '180px',
              objectFit: 'contain',
              background: '#ffffff',
              padding: '2px 6px',
              borderRadius: '4px',
            }}
          />
        </div>
      )}

      {drawOpen && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '10px',
            borderRadius: '8px',
            background: 'var(--bg-surface, #ffffff)',
            border: '1px solid var(--border-default, #e5e7eb)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted, #6b7280)' }}>
            Draw your signature inside the box below using mouse, trackpad, or touch:
          </div>
          <canvas
            ref={canvasRef}
            width={440}
            height={120}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '120px',
              borderRadius: '6px',
              border: '1px dashed #94a3b8',
              background: '#ffffff',
              touchAction: 'none',
              cursor: 'crosshair',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-xs" onClick={handleClearCanvas}>
              Reset Canvas
            </button>
            <button
              type="button"
              className="btn btn-primary btn-xs"
              disabled={!hasStroke}
              onClick={handleApplyDrawnSignature}
            >
              Use Signature for Print
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
