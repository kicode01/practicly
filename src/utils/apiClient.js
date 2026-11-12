const AUTH_STORAGE_KEY = 'mit_ojt_user';

let memoryVerifyContext = null;

export function getStoredUserSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      localStorage.getItem(AUTH_STORAGE_KEY) ||
      localStorage.getItem('pup_ojt_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.token) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function getAuthToken() {
  return getStoredUserSession()?.token || '';
}

export function setVerifyContext(placementId, token) {
  if (placementId && token) {
    memoryVerifyContext = {
      placementId: String(placementId),
      token: String(token),
    };
  } else {
    memoryVerifyContext = null;
  }
}

export function getVerifyContext() {
  if (memoryVerifyContext?.placementId && memoryVerifyContext?.token) {
    return memoryVerifyContext;
  }
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams(window.location.search);
      const pathMatch = window.location.pathname.match(/^\/verify\/([^/]+)\/?$/i);
      const pid = (pathMatch ? decodeURIComponent(pathMatch[1]) : null) || params.get('verify');
      const tok = params.get('token');
      if (pid && tok) {
        return { placementId: pid, token: tok };
      }
    } catch {
      // ignore URL parsing issues
    }
  }
  return null;
}

export function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const verifyCtx = getVerifyContext();
  if (verifyCtx) {
    if (!headers.has('X-Verify-Placement')) {
      headers.set('X-Verify-Placement', verifyCtx.placementId);
    }
    if (!headers.has('X-Verify-Token')) {
      headers.set('X-Verify-Token', verifyCtx.token);
    }
  }
  return fetch(url, {
    ...options,
    cache: 'no-store',
    headers,
  });
}
