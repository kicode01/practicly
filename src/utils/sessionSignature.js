/**
 * Privacy-First Client-Only Session Signatures
 *
 * Signatures uploaded or drawn by Students, Faculty Advisers, or Coordinators
 * are stored EXCLUSIVELY in browser `sessionStorage` (active tab memory only)
 * and are wiped automatically on sign-out or when the browser tab closes.
 * They are NEVER transmitted to any API endpoint or written to any database.
 */

const SIG_PREFIX = 'mit_ojt_session_sig_';
const SIG_EVENT = 'mit-ojt-session-signature-changed';

function buildKey(role, userId) {
  const safeRole = String(role || 'guest').toLowerCase().trim();
  const safeId = userId !== undefined && userId !== null && String(userId).trim() !== ''
    ? String(userId).trim()
    : 'default';
  return `${SIG_PREFIX}${safeRole}_${safeId}`;
}

export function getSessionSignature(role, userId) {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(buildKey(role, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.dataUrl !== 'string' || !parsed.dataUrl.startsWith('data:image/png;base64,')) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSessionSignature(role, userId, payload) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const record = {
      dataUrl: payload.dataUrl,
      signerName: payload.signerName || '',
      method: payload.method || 'upload',
      updatedAt: new Date().toISOString(),
    };
    window.sessionStorage.setItem(buildKey(role, userId), JSON.stringify(record));
    window.dispatchEvent(new CustomEvent(SIG_EVENT, { detail: { role, userId } }));
  } catch {
    // Ignore sessionStorage quota issues
  }
}

export function clearSessionSignature(role, userId) {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    window.sessionStorage.removeItem(buildKey(role, userId));
    window.dispatchEvent(new CustomEvent(SIG_EVENT, { detail: { role, userId } }));
  } catch {
    // ignore
  }
}

export function clearAllSessionSignatures() {
  if (typeof window === 'undefined' || !window.sessionStorage) return;
  try {
    const toRemove = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(SIG_PREFIX)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((k) => window.sessionStorage.removeItem(k));
    window.dispatchEvent(new CustomEvent(SIG_EVENT, { detail: { clearedAll: true } }));
  } catch {
    // ignore
  }
}

export function subscribeSessionSignature(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => callback();
  window.addEventListener(SIG_EVENT, handler);
  return () => window.removeEventListener(SIG_EVENT, handler);
}

/**
 * Loads a local signature image file (PNG/JPG/WebP) completely offline in browser,
 * strips metadata by re-encoding via HTML5 Canvas, knocks out near-white paper
 * backgrounds to alpha transparency, and trims to compact printable bounds.
 */
export function processSignatureImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file selected.'));
      return;
    }
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (file.type && !allowed.includes(file.type.toLowerCase())) {
      reject(new Error('Please choose a PNG, JPG, or WebP signature image.'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('Signature image must be 5 MB or smaller.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read selected image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file could not be decoded as an image.'));
      img.onload = () => {
        const maxW = 480;
        const maxH = 160;
        const scale = Math.min(maxW / (img.width || maxW), maxH / (img.height || maxH), 1);
        const w = Math.max(40, Math.round((img.width || maxW) * scale));
        const h = Math.max(24, Math.round((img.height || maxH) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas rendering unavailable.'));
          return;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        // Knock out bright white/gray paper background cleanly while preserving dark ink strokes
        try {
          const imgData = ctx.getImageData(0, 0, w, h);
          const data = imgData.data;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a > 0 && r > 228 && g > 228 && b > 228) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imgData, 0, 0);
        } catch {
          // If canvas pixel access fails for any reason, keep clean rasterized image
        }

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}
