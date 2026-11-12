export const PORTAL_TAB_IDS = [
  'dashboard',
  'timelogs',
  'evaluations',
  'compliance',
  'adviser-monitoring',
  'placements',
  'students',
  'employers',
  'admin',
  'database-erd',
];

export const PORTAL_TAB_SET = new Set(PORTAL_TAB_IDS);

export const ROUTE_ALIASES = {
  '/overview': 'dashboard',
  '/dtr': 'timelogs',
  '/time-logs': 'timelogs',
  '/clearance': 'evaluations',
  '/clearance-reports': 'compliance',
  '/advisers': 'adviser-monitoring',
  '/faculty-supervision': 'adviser-monitoring',
  '/companies': 'employers',
  '/partners': 'employers',
  '/users': 'admin',
  '/user-accounts': 'admin',
  '/schema': 'database-erd',
  '/erd': 'database-erd',
  '/system-schema': 'database-erd',
};

export const ALLOWED_TABS_BY_ROLE = {
  student: new Set(['dashboard', 'timelogs', 'evaluations', 'employers']),
  adviser: new Set([
    'dashboard',
    'timelogs',
    'evaluations',
    'compliance',
    'employers',
    'students',
    'adviser-monitoring',
  ]),
  supervisor: new Set(['dashboard', 'timelogs', 'evaluations', 'employers', 'students']),
  admin: new Set(PORTAL_TAB_IDS),
};

export const TAB_TITLES = {
  dashboard: 'Dashboard',
  timelogs: 'Daily Time Record',
  evaluations: 'Evaluations & Clearance',
  compliance: 'Clearance Reports',
  'adviser-monitoring': 'Faculty Supervision',
  placements: 'Placements',
  students: 'Students',
  employers: 'Partner Companies',
  admin: 'User Accounts',
  'database-erd': 'System Schema & ERD',
};

export function isTabAllowedForRole(role, tabId) {
  const allowed = ALLOWED_TABS_BY_ROLE[role] || new Set(['dashboard']);
  return allowed.has(tabId);
}

export function normalizePathname(rawPathname) {
  if (!rawPathname) return '/';
  let clean = rawPathname.trim();
  if (!clean.startsWith('/')) clean = '/' + clean;
  if (clean.length > 1 && clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

export function getTabPath(tabId) {
  return `/${PORTAL_TAB_SET.has(tabId) ? tabId : 'dashboard'}`;
}

export function getVerifyPath(placementId, token = null) {
  const base = `/verify/${encodeURIComponent(String(placementId))}`;
  return token ? `${base}?token=${encodeURIComponent(String(token))}` : base;
}

export function parseAppLocation(loc = typeof window !== 'undefined' ? window.location : null) {
  if (!loc) return { kind: 'landing' };

  const pathname = normalizePathname(loc.pathname || '/').toLowerCase();
  const params = new URLSearchParams(loc.search || '');

  // 1. Supervisor verification links: /verify/:id?token=... OR /?verify=:id&token=...
  const verifyMatch = pathname.match(/^\/verify\/([^/]+)$/);
  const queryVerifyId = params.get('verify');
  if (verifyMatch) {
    const pid = decodeURIComponent(verifyMatch[1]);
    return {
      kind: 'verify',
      placementId: pid,
      token: params.get('token') || null,
      canonicalUrl: getVerifyPath(pid, params.get('token') || null),
    };
  }
  if (queryVerifyId) {
    return {
      kind: 'verify',
      placementId: queryVerifyId,
      token: params.get('token') || null,
      canonicalUrl: getVerifyPath(queryVerifyId, params.get('token') || null),
    };
  }

  // 2. Landing root
  if (pathname === '/' || pathname === '/index.html') {
    return { kind: 'landing', canonicalUrl: '/' };
  }

  // 3. Auth routes
  if (pathname === '/login' || pathname === '/signin') {
    const rawNext = params.get('next');
    const cleanNext = rawNext ? rawNext.replace(/^\//, '').toLowerCase() : null;
    return {
      kind: 'auth',
      mode: 'login',
      nextTab: cleanNext && PORTAL_TAB_SET.has(cleanNext) ? cleanNext : null,
      canonicalUrl: '/login',
    };
  }
  if (pathname === '/register' || pathname === '/signup') {
    return {
      kind: 'auth',
      mode: 'register',
      nextTab: null,
      canonicalUrl: '/register',
    };
  }

  // 4. Portal routes & friendly aliases
  const slug = pathname.slice(1);
  if (PORTAL_TAB_SET.has(slug)) {
    return {
      kind: 'tab',
      tab: slug,
      canonicalUrl: getTabPath(slug),
      wasAlias: false,
    };
  }
  if (Object.prototype.hasOwnProperty.call(ROUTE_ALIASES, pathname)) {
    const targetTab = ROUTE_ALIASES[pathname];
    return {
      kind: 'tab',
      tab: targetTab,
      canonicalUrl: getTabPath(targetTab),
      wasAlias: true,
    };
  }

  // 5. Unknown / 404 route
  return {
    kind: 'not_found',
    pathname,
    canonicalUrl: '/',
  };
}

export function syncBrowserUrl(targetUrl, { replace = false } = {}) {
  if (typeof window === 'undefined' || !window.history) return;
  try {
    const current = window.location.pathname + window.location.search;
    if (current === targetUrl) return;
    if (replace) {
      window.history.replaceState({}, document.title, targetUrl);
    } else {
      window.history.pushState({}, document.title, targetUrl);
    }
  } catch {
    // Ignore restricted history API errors
  }
}
