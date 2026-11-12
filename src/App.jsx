import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  IconBrandLogo,
  IconDashboard,
  IconStudent,
  IconBuilding,
  IconBriefcase,
  IconClock,
  IconEvaluation,
  IconSupervisor,
  IconShieldCheck,
  IconDatabase,
  IconSettings,
  IconPlus,
  IconSearch,
  IconCheckCircle,
  IconAlert,
  IconTrash,
  IconEdit,
  IconPrinter,
  IconDownload,
  IconRefresh,
  IconLogOut,
  IconMenu,
  IconClose,
  IconUser,
  IconFilter,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconFileText,
  IconUpload,
  IconEye,
  IconEyeOff,
  IconShare,
  IconLink,
} from './components/Icons';
import ClearanceModal from './components/ClearanceModal';
import DtrModal from './components/DtrModal';
import DatabaseInspectorView from './components/DatabaseInspectorView';
// Removed CommandPaletteModal
import InteractiveAnalyticsChart from './components/InteractiveAnalyticsChart';
import LiveShiftStopwatch from './components/LiveShiftStopwatch';
import PersonaSwitcher from './components/PersonaSwitcher';
import RoleHeroBanner from './components/RoleHeroBanner';
import TimeLogEntryModal from './components/TimeLogEntryModal';
import EvaluationEntryModal from './components/EvaluationEntryModal';
import DtrTransferModal from './components/DtrTransferModal';
import OfficialEvaluationModal from './components/OfficialEvaluationModal';
import SupervisorShareModal from './components/SupervisorShareModal';
import PublicSupervisorVerifyView from './components/PublicSupervisorVerifyView';
import SignedDtrUploadModal from './components/SignedDtrUploadModal';
import DtrAuditComparisonModal from './components/DtrAuditComparisonModal';
import StudentProfileModal from './components/StudentProfileModal';
import EmployerModal from './components/EmployerModal';
import PlacementModal from './components/PlacementModal';
import AdviserModal from './components/AdviserModal';
import UserAccountModal from './components/UserAccountModal';
import SuperviseStudentModal from './components/SuperviseStudentModal';
import ConfirmDialog from './components/ConfirmDialog';
import AuthModal from './components/AuthModal';
import { SegmentedControl, Switch, MaterialSelect, Snackbar } from './components/MaterialComponents';
import WorkflowPipelineIndicator from './components/WorkflowPipelineIndicator';
import { clearAllSessionSignatures } from './utils/sessionSignature';
import { getInstrumentById, getPlacementInstrumentStatus } from './utils/evaluationRubrics';
import { apiFetch, getStoredUserSession, setVerifyContext } from './utils/apiClient';
import usePresence, { useSmoothSwitch } from './utils/usePresence';

const DEMO_PRESETS = [
  {
    username: 'kian.balanag',
    role: 'student',
    name: 'Balanag, Kian H.',
    desc: 'Student · Completed 304 / 300 hrs (Cleared)',
  },
  {
    username: 'sophia.gutierrez',
    role: 'student',
    name: 'Gutierrez, Sophia Margarete N.',
    desc: 'Student · Ongoing 284 / 300 hrs (16 hrs left)',
  },
  {
    username: 'adrian.yadao',
    role: 'student',
    name: 'Yadao, Adrian E.',
    desc: 'Student · 302.5 / 300 hrs (Awaiting Evaluation)',
  },
  {
    username: 'engr.delacruz',
    role: 'adviser',
    name: 'Engr. Arlene R. Dela Cruz',
    desc: 'Faculty Adviser · BSCpE 4-1 Coordinator',
  },
  {
    username: 'engr.santos',
    role: 'adviser',
    name: 'Engr. Marco Antonio V. Santos',
    desc: 'Faculty Adviser · Supervises Adrian & Miguel',
  },
  {
    username: 'supervisor.accenture',
    role: 'supervisor',
    name: 'Accenture HTE Supervisor',
    desc: 'Workplace Supervisor · Stage 1 DTR & INST-02',
  },
  {
    username: 'admin',
    role: 'admin',
    name: 'CpE Department Administrator',
    desc: 'Coordinator · Full Registry & Clearance Control',
  },
];

function computePreviewHours(timeIn, timeOut, breakMinutes) {
  if (!timeIn || !timeOut) return 8.0;
  const [inH, inM] = timeIn.split(':').map(Number);
  const [outH, outM] = timeOut.split(':').map(Number);
  if (Number.isNaN(inH) || Number.isNaN(outH)) return 8.0;
  const start = inH * 60 + (inM || 0);
  let end = outH * 60 + (outM || 0);
  if (end <= start) end += 24 * 60;
  const net = Math.max(0, end - start - Math.max(0, Number(breakMinutes) || 0));
  return Number((net / 60).toFixed(2));
}

function StatusChip({ variant = 'neutral', children }) {
  return <span className={`status-chip ${variant}`}>{children}</span>;
}

function scrollWorkspaceToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (typeof document !== 'undefined') {
    const mainRegion = document.querySelector('.main-Region');
    if (mainRegion) {
      mainRegion.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}

function WorkspaceSkeleton({ activeTab, role }) {
  const isSplitFormTab =
    activeTab === 'timelogs' || (activeTab === 'evaluations' && role !== 'student');
  const isAdviserGridTab = activeTab === 'adviser-monitoring';
  const isSchemaTab = activeTab === 'database-erd';
  const showMetricStrip = activeTab === 'dashboard' || isAdviserGridTab;

  return (
    <div className="skeleton-stage" aria-busy="true" aria-label="Loading practicum records">
      {/* Page Header Skeleton */}
      <div className="page-header">
        <div>
          <div className="sk-shimmer sk-title" />
          <div className="sk-shimmer sk-subtitle" />
        </div>
        <div className="page-actions">
          <div className="sk-shimmer sk-btn" />
          <div className="sk-btn-primary" />
        </div>
      </div>

      {/* KPI Metric Strip or 6-Card Adviser Grid Skeleton */}
      {showMetricStrip && (
        <div
          className={isAdviserGridTab ? 'metric-strip metric-strip-advisers' : 'metric-strip'}
        >
          {(isAdviserGridTab ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4]).map((idx) => (
            <div key={idx} className="metric-cell">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="sk-shimmer sk-metric-label" />
                {isAdviserGridTab && <div className="sk-shimmer" style={{ width: '64px', height: '18px' }} />}
              </div>
              <div
                className="sk-shimmer sk-metric-value"
                style={{ width: isAdviserGridTab ? '72%' : '42%', height: isAdviserGridTab ? '18px' : '24px' }}
              />
              <div className="sk-shimmer sk-metric-foot" />
            </div>
          ))}
        </div>
      )}

      {/* Schema / ERD Inspector Skeleton */}
      {isSchemaTab ? (
        <>
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="sk-shimmer" style={{ width: '210px', height: '14px' }} />
                <div className="sk-shimmer sk-line-sm" style={{ width: '320px' }} />
              </div>
            </div>
            <div className="panel-body">
              <div className="erd-entity-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <div key={n} className="erd-entity-card" style={{ padding: '12px' }}>
                    <div className="sk-shimmer" style={{ width: '60%', height: '14px', marginBottom: '10px' }} />
                    <div className="sk-shimmer sk-line-sm" style={{ width: '90%' }} />
                    <div className="sk-shimmer sk-line-sm" style={{ width: '82%' }} />
                    <div className="sk-shimmer sk-line-sm" style={{ width: '75%' }} />
                    <div className="sk-shimmer sk-line-sm" style={{ width: '88%' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : isSplitFormTab ? (
        /* Full-Width Table Skeleton with Inline Toolbar Filter (TimeLogs & Evaluations) */
        <>
          <div className="panel">
            <div className="panel-toolbar">
              <div className="sk-shimmer sk-search" />
              <div className="sk-shimmer sk-filter" />
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th><div className="sk-shimmer" style={{ width: '54px', height: '10px' }} /></th>
                    <th><div className="sk-shimmer" style={{ width: '120px', height: '10px' }} /></th>
                    <th><div className="sk-shimmer" style={{ width: '120px', height: '10px' }} /></th>
                    <th><div className="sk-shimmer" style={{ width: '64px', height: '10px' }} /></th>
                    <th><div className="sk-shimmer" style={{ width: '140px', height: '10px' }} /></th>
                    <th><div className="sk-shimmer" style={{ width: '80px', height: '10px' }} /></th>
                    <th className="text-right"><div className="sk-shimmer" style={{ width: '54px', height: '10px', marginLeft: 'auto' }} /></th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
                    <tr key={r} className={`sk-row-stagger-${r}`}>
                      <td><div className="sk-shimmer sk-line" style={{ width: '76px' }} /></td>
                      <td>
                        <div className="sk-shimmer sk-line" style={{ width: '140px' }} />
                        <div className="sk-shimmer sk-line-sm" style={{ width: '95px' }} />
                      </td>
                      <td>
                        <div className="sk-shimmer sk-line" style={{ width: '130px' }} />
                        <div className="sk-shimmer sk-line-sm" style={{ width: '85px' }} />
                      </td>
                      <td><div className="sk-shimmer sk-line" style={{ width: '52px' }} /></td>
                      <td>
                        <div className="sk-shimmer sk-line" style={{ width: r % 2 === 0 ? '210px' : '175px' }} />
                        <div className="sk-shimmer sk-line-sm" style={{ width: '130px' }} />
                      </td>
                      <td><div className="sk-shimmer sk-chip" /></td>
                      <td className="text-right">
                        <div className="sk-action-group">
                          <div className="sk-shimmer sk-action-pill" style={{ width: '34px' }} />
                          <div className="sk-shimmer sk-action-pill" style={{ width: '34px' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Primary Data Table Panel Skeleton */
        <div className="panel">
          <div className="panel-toolbar">
            <div className="sk-shimmer sk-search" />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="sk-shimmer sk-filter" />
            </div>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th><div className="sk-shimmer" style={{ width: '92px', height: '10px' }} /></th>
                  <th><div className="sk-shimmer" style={{ width: '120px', height: '10px' }} /></th>
                  <th><div className="sk-shimmer" style={{ width: '110px', height: '10px' }} /></th>
                  <th><div className="sk-shimmer" style={{ width: '76px', height: '10px' }} /></th>
                  <th><div className="sk-shimmer" style={{ width: '115px', height: '10px' }} /></th>
                  <th><div className="sk-shimmer" style={{ width: '72px', height: '10px' }} /></th>
                  <th className="text-right"><div className="sk-shimmer" style={{ width: '80px', height: '10px', marginLeft: 'auto' }} /></th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((r) => (
                  <tr key={r} className={`sk-row-stagger-${r}`}>
                    <td>
                      <div className="sk-shimmer sk-line" style={{ width: r % 2 === 0 ? '138px' : '156px' }} />
                      <div className="sk-shimmer sk-line-sm" style={{ width: '96px' }} />
                    </td>
                    <td>
                      <div className="sk-shimmer sk-line" style={{ width: r % 3 === 0 ? '168px' : '144px' }} />
                      <div className="sk-shimmer sk-line-sm" style={{ width: '112px' }} />
                    </td>
                    <td>
                      <div className="sk-shimmer sk-line" style={{ width: '128px' }} />
                      <div className="sk-shimmer sk-line-sm" style={{ width: '84px' }} />
                    </td>
                    <td>
                      <div className="sk-shimmer sk-line" style={{ width: '72px' }} />
                    </td>
                    <td>
                      <div className="sk-progress-wrap">
                        <div className="sk-shimmer sk-progress-bar" />
                        <div className="sk-shimmer sk-progress-pct" />
                      </div>
                    </td>
                    <td>
                      <div className="sk-shimmer sk-chip" />
                    </td>
                    <td className="text-right">
                      <div className="sk-action-group">
                        <div className="sk-shimmer sk-action-pill" />
                        <div className="sk-shimmer sk-action-pill" />
                        <div className="sk-shimmer sk-action-pill" style={{ width: '68px' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const parsed = getStoredUserSession();
    if (!parsed) return null;
    if (parsed.display_name) parsed.display_name = parsed.display_name.replace(/\bPUP\b/g, 'MIT');
    if (parsed.name) parsed.name = parsed.name.replace(/\bPUP\b/g, 'MIT');
    return parsed;
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [authScreenOpen, setAuthScreenOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [landingPreviewTab, setLandingPreviewTab] = useState('student');
  const [landingPreviewPaused, setLandingPreviewPaused] = useState(false);

  useEffect(() => {
    if (currentUser || authScreenOpen || landingPreviewPaused) return undefined;
    const roleOrder = ['student', 'supervisor', 'adviser', 'admin'];
    const timer = setTimeout(() => {
      setLandingPreviewTab((curr) => {
        const idx = roleOrder.indexOf(curr);
        return roleOrder[(idx + 1) % roleOrder.length];
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, [currentUser, authScreenOpen, landingPreviewPaused, landingPreviewTab]);
  const [registerForm, setRegisterForm] = useState({
    role: 'student',
    full_name: '',
    student_number: '',
    employee_number: '',
    section: '',
    department: '',
    email: '',
    contact_number: '',
    username: '',
    password: 'password123',
    employer_id: '',
    adviser_id: '1',
    position_title: 'Practicum Intern',
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const mobileBackdropPresence = usePresence(mobileMenuOpen, 150);
  const portalTabSwitch = useSmoothSwitch(
    currentUser ? `${currentUser.role}:${activeTab}` : 'guest',
    85
  );
  const displayedStageTab = portalTabSwitch.displayedKey.includes(':')
    ? portalTabSwitch.displayedKey.split(':')[1]
    : activeTab;

  const [data, setData] = useState({
    system_info: null,
    kpis: null,
    placements: [],
    students: [],
    employers: [],
    advisers: [],
    timelogs: [],
    evaluations: [],
    compliance_reports: [],
    users: [],
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [selectedClearanceReport, setSelectedClearanceReport] = useState(null);
  const [selectedDtrPlacement, setSelectedDtrPlacement] = useState(null);
  const [dtrTransferModalOpen, setDtrTransferModalOpen] = useState(false);
  const [officialEvalModalOpen, setOfficialEvalModalOpen] = useState(false);
  const [evalInitialInstrumentId, setEvalInitialInstrumentId] = useState(null);
  const [forcedEvalInstrumentId, setForcedEvalInstrumentId] = useState(null);
  const [supervisorShareModalOpen, setSupervisorShareModalOpen] = useState(false);
  const [signedDtrModalOpen, setSignedDtrModalOpen] = useState(false);
  const [signedEvalModalOpen, setSignedEvalModalOpen] = useState(false);
  const [signedEvalPlacement, setSignedEvalPlacement] = useState(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);
  const [auditPlacement, setAuditPlacement] = useState(null);
  const [publicSupervisorPlacementId, setPublicSupervisorPlacementId] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const v = urlParams.get('verify');
      const t = urlParams.get('token');
      if (v) {
        setVerifyContext(v, t || null);
        return v;
      }
      return null;
    } catch {
      return null;
    }
  });

  // Live Clock-In / Clock-Out Timer for Student Portal
  const [activeShift, setActiveShift] = useState(() => {
    try {
      const saved = localStorage.getItem('mit_ojt_active_shift') || localStorage.getItem('pup_ojt_active_shift');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [shiftElapsedSeconds, setShiftElapsedSeconds] = useState(0);
  // Material 3 Light Theme Standard
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    try {
      localStorage.setItem('mit_ojt_theme', 'light');
    } catch {}
  }, []);

  // Interactive Table Filter Pills & Sorting
  const [placementQuickFilter, setPlacementQuickFilter] = useState('all');
  const [timelogQuickFilter, setTimelogQuickFilter] = useState('all');
  const [evalQuickFilter, setEvalQuickFilter] = useState('all');
  const [placementSortCol, setPlacementSortCol] = useState('student_name');
  const [placementSortAsc, setPlacementSortAsc] = useState(true);

  // Dedicated Modal Dialog States
  const [timeLogModalOpen, setTimeLogModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);

  // Collapsible Navigation Drawer & Nav Groups
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('practicly_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('practicly_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Synchronize currentUser displayName if updated from server
  useEffect(() => {
    if (currentUser && data.users && data.users.length > 0) {
      const match = data.users.find((u) => u.username === currentUser.username);
      if (match) {
        const cleanName = (match.display_name || match.name || '').replace(/\bPUP\b/g, 'MIT');
        if (cleanName && cleanName !== currentUser.display_name) {
          const updated = { ...currentUser, display_name: cleanName, name: cleanName };
          setCurrentUser(updated);
          localStorage.setItem('mit_ojt_user', JSON.stringify(updated));
        }
      }
    }
  }, [data.users, currentUser]);

  // Close mobile drawer on Escape key or desktop resize
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > 960) setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Role Tab Guard: Prevents blank screens if an invalid tab is retained across role switches
  useEffect(() => {
    if (!currentUser) return;
    const allowedTabs = {
      student: new Set(['dashboard', 'timelogs', 'evaluations', 'employers']),
      adviser: new Set(['dashboard', 'timelogs', 'evaluations', 'compliance', 'employers', 'students', 'adviser-monitoring']),
      supervisor: new Set(['dashboard', 'timelogs', 'evaluations', 'employers', 'students']),
      admin: new Set(['dashboard', 'compliance', 'adviser-monitoring', 'placements', 'students', 'employers', 'timelogs', 'evaluations', 'admin', 'database-erd']),
    };
    const validSet = allowedTabs[currentUser.role] || new Set(['dashboard']);
    if (!validSet.has(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser?.role, activeTab]);

  useEffect(() => {
    if (!activeShift?.startedAt) {
      setShiftElapsedSeconds(0);
      return undefined;
    }
    const updateElapsed = () => {
      const diff = Math.max(0, Math.floor((Date.now() - activeShift.startedAt) / 1000));
      setShiftElapsedSeconds(diff);
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [activeShift]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [employerIndustryFilter, setEmployerIndustryFilter] = useState('all');
  const [timelogPlacementFilter, setTimelogPlacementFilter] = useState('all');
  const [adviserScopeOnly, setAdviserScopeOnly] = useState(true);
  const [selectedAdviserFilter, setSelectedAdviserFilter] = useState('all');

  // Admin Toggle: Allow External HTE Supervisor Portal Access (In case needed)
  const [allowSupervisorPortal, setAllowSupervisorPortal] = useState(() => {
    return localStorage.getItem('ojt_allow_supervisor_portal') === 'true';
  });
  const handleToggleSupervisorPortal = (enabled) => {
    setAllowSupervisorPortal(enabled);
    localStorage.setItem('ojt_allow_supervisor_portal', enabled ? 'true' : 'false');
    showNotice(
      enabled
        ? 'HTE Supervisor direct portal enabled'
        : 'Supervisor portal hidden (Advisers & Admins directly encode evaluations)'
    );
  };

  // TimeLog Form State (Create + Edit)
  const [editingLogId, setEditingLogId] = useState(null);
  const [logForm, setLogForm] = useState({
    placement_id: '',
    date: '2026-11-07',
    time_in: '08:00',
    time_out: '17:00',
    break_minutes: 60,
    hours_rendered: '',
    task_description: '',
    approval_status: 'approved',
  });

  // Evaluation Form State (Create + Edit)
  const [editingEvalId, setEditingEvalId] = useState(null);
  const [evalForm, setEvalForm] = useState({
    placement_id: '',
    evaluator_type: 'adviser',
    instrument_type: 'adviser_to_hte',
    evaluator_name: '',
    technical_score: '4.90',
    attitude_score: '4.95',
    attendance_score: '5.00',
    comments: '',
    date_evaluated: '2026-11-07',
  });

  // Employer / HTE Form State (Create + Edit)
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [editingEmployerId, setEditingEmployerId] = useState(null);
  const [employerForm, setEmployerForm] = useState({
    company_name: '',
    industry: 'Cloud & Enterprise Software Engineering',
    address: '',
    contact_person: '',
    contact_number: '',
    email: '',
    moa_status: 'active',
    moa_validity: '2028-12-31',
  });

  // Placement Form State (Create + Edit)
  const [showPlacementForm, setShowPlacementForm] = useState(false);
  const [editingPlacementId, setEditingPlacementId] = useState(null);
  const [placementForm, setPlacementForm] = useState({
    student_id: '',
    employer_id: '',
    adviser_id: '1',
    academic_term: 'AY 2026-2027 1st Sem',
    position_title: 'Computer Engineering Intern',
    start_date: '2026-08-03',
    end_date: '2026-11-15',
    required_hours: '300',
    status: 'ongoing',
  });

  // Student Form State (Create + Edit)
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentForm, setStudentForm] = useState({
    student_number: '',
    full_name: '',
    program: 'BS Computer Engineering',
    year_level: '4th Year',
    section: 'BSCpE 4-1',
    email: '',
    contact_number: '',
    username: '',
    employer_id: '1',
    adviser_id: '1',
    position_title: 'Computer Engineering Intern',
  });

  // Supervise Student Form State (on Faculty Supervision & Adviser Dashboard)
  const [showSuperviseForm, setShowSuperviseForm] = useState(false);
  const [superviseMode, setSuperviseMode] = useState('new'); // 'new' | 'existing'
  const [superviseForm, setSuperviseForm] = useState({
    student_id: '',
    student_number: '',
    full_name: '',
    section: 'BSCpE 4-1',
    email: '',
    contact_number: '',
    employer_id: '1',
    adviser_id: '2',
    position_title: 'Computer Engineering Intern',
    required_hours: '300',
  });

  // Adviser Form State (Create + Edit)
  const [showAdviserForm, setShowAdviserForm] = useState(false);
  const [editingAdviserId, setEditingAdviserId] = useState(null);
  const [adviserForm, setAdviserForm] = useState({
    employee_number: '',
    full_name: '',
    department: 'Computer Engineering Department',
    email: '',
    contact_number: '',
    username: '',
  });

  // User Account Form State (Create + Edit)
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    password: 'password123',
    role: 'student',
    linked_id: '',
    is_active: 1,
  });

  const dismissNotice = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToast(null);
  }, []);

  const showNotice = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast((prev) => ({ id: (prev?.id || 0) + 1, message, type }));
    toastTimerRef.current = setTimeout(() => {
      toastTimerRef.current = null;
      setToast(null);
    }, 3800);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
  }, []);

  const isFetchingRef = useRef(false);

  const fetchSystemData = useCallback(
    async (silent = false, verifyOverrideId = null) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      // Only show full skeleton on very first load; subsequent refreshes stay mounted with smooth topbar sync
      setData((prev) => {
        if (!prev.system_info && !silent) setLoading(true);
        else setSyncing(true);
        return prev;
      });

      try {
        const activeVerifyId = verifyOverrideId ?? publicSupervisorPlacementId;
        const sessionUser = getStoredUserSession();

        if (activeVerifyId) {
          const response = await apiFetch(`/api/verify/${encodeURIComponent(activeVerifyId)}`);
          const json = await parseAuthResponse(response, 'Verification portal');
          if (json.ok && json.placement) {
            setData((prev) => ({
              ...prev,
              placements: [json.placement],
              timelogs: json.timelogs || [],
              evaluations: json.evaluations || [],
              system_info: prev.system_info || { engine: 'sqlite' },
            }));
          } else {
            showNotice(json.error || 'Failed to load supervisor verification record.', 'error');
          }
        } else if (!sessionUser) {
          const response = await apiFetch('/api/public-catalog');
          const json = await parseAuthResponse(response, 'Catalog service');
          if (json.ok) {
            setData((prev) => ({
              ...prev,
              employers: json.employers || [],
              advisers: json.advisers || [],
              summary: {
                ...prev.summary,
                total_employers: json.counts?.employers ?? prev.summary?.total_employers ?? 0,
                total_advisers: json.counts?.advisers ?? prev.summary?.total_advisers ?? 0,
              },
              system_info: prev.system_info || { engine: 'sqlite' },
            }));
          } else {
            showNotice(json.error || 'Failed to load registration catalog.', 'error');
          }
        } else {
          const response = await apiFetch('/api/bootstrap');
          if (response.status === 401) {
            clearAllSessionSignatures();
            localStorage.removeItem('mit_ojt_user');
            localStorage.removeItem('pup_ojt_user');
            setCurrentUser(null);
            showNotice('Session expired or invalidated. Please sign in again.', 'error');
            return;
          }
          const json = await parseAuthResponse(response, 'Database service');
          if (json.ok) {
            setData(json);
          } else {
            showNotice(json.error || 'Failed to load database state.', 'error');
          }
        }
      } catch {
        showNotice('Cannot reach backend server on port 8000.', 'error');
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setSyncing(false);
      }
    },
    [showNotice, publicSupervisorPlacementId]
  );

  useEffect(() => {
    fetchSystemData();
  }, [fetchSystemData]);

  // Active student's own student record & placement record
  const myStudent = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') return null;
    return (
      data.students.find((s) => Number(s.student_id) === Number(currentUser.linked_id)) ||
      data.students.find((s) => s.student_number && s.student_number === currentUser.identifier_code) ||
      data.students.find((s) => s.full_name && currentUser.display_name && s.full_name.toLowerCase() === currentUser.display_name.toLowerCase()) ||
      null
    );
  }, [currentUser, data.students]);
  const myStudentRecord = myStudent;

  const myPlacement = useMemo(() => {
    if (!currentUser || currentUser.role !== 'student') return null;
    const targetStudentId = myStudent?.student_id || currentUser.linked_id;
    return (
      (targetStudentId ? data.placements.find((p) => Number(p.student_id) === Number(targetStudentId)) : null) ||
      data.placements.find((p) => p.student_number && p.student_number === currentUser.identifier_code) ||
      (myStudent ? data.placements.find((p) => p.student_name && p.student_name === myStudent.full_name) : null) ||
      null
    );
  }, [currentUser, myStudent, data.placements]);

  const myTimeLogs = useMemo(() => {
    if (!myPlacement) return [];
    return data.timelogs.filter((tl) => Number(tl.placement_id) === Number(myPlacement.placement_id));
  }, [myPlacement, data.timelogs]);

  const myEvaluations = useMemo(() => {
    if (!myPlacement) return [];
    return data.evaluations.filter((ev) => Number(ev.placement_id) === Number(myPlacement.placement_id));
  }, [myPlacement, data.evaluations]);

  // HTE Industry Supervisor Scoping
  const supervisorPlacements = useMemo(() => {
    if (!currentUser || currentUser.role !== 'supervisor') return [];
    const empId = Number(currentUser.linked_id);
    return data.placements.filter((p) => Number(p.employer_id) === empId);
  }, [currentUser, data.placements]);

  const supervisorTimeLogs = useMemo(() => {
    if (!currentUser || currentUser.role !== 'supervisor') return [];
    const pids = new Set(supervisorPlacements.map((p) => Number(p.placement_id)));
    return data.timelogs.filter((tl) => pids.has(Number(tl.placement_id)));
  }, [currentUser, supervisorPlacements, data.timelogs]);

  const supervisorPendingLogs = useMemo(() => {
    return supervisorTimeLogs.filter((tl) => tl.approval_status === 'pending');
  }, [supervisorTimeLogs]);

  const supervisorEvaluations = useMemo(() => {
    if (!currentUser || currentUser.role !== 'supervisor') return [];
    const pids = new Set(supervisorPlacements.map((p) => Number(p.placement_id)));
    return data.evaluations.filter(
      (ev) => pids.has(Number(ev.placement_id)) && ev.evaluator_type === 'employer'
    );
  }, [currentUser, supervisorPlacements, data.evaluations]);

  const adviserPendingVerifiedLogs = useMemo(() => {
    if (!currentUser || currentUser.role !== 'adviser') return [];
    return data.timelogs.filter(
      (tl) =>
        Number(tl.adviser_id) === Number(currentUser.linked_id) &&
        (tl.approval_status === 'supervisor_verified' || tl.approval_status === 'pending')
    );
  }, [currentUser, data.timelogs]);

  const auditablePlacements = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'student') {
      return myPlacement ? [myPlacement] : [];
    }
    if (currentUser.role === 'supervisor') {
      return supervisorPlacements;
    }
    if (currentUser.role === 'adviser' && adviserScopeOnly) {
      return data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id));
    }
    return data.placements;
  }, [currentUser, myPlacement, supervisorPlacements, adviserScopeOnly, data.placements]);

  const openAuditModal = (explicitPlacement = null) => {
    const pool = auditablePlacements.length > 0 ? auditablePlacements : data.placements;
    const filteredMatch =
      timelogPlacementFilter !== 'all'
        ? data.placements.find((p) => String(p.placement_id) === String(timelogPlacementFilter))
        : null;
    const firstWithUpload = pool.find((p) => Boolean(p.signed_dtr_filename || p.signed_dtr_file));
    const targetPl = explicitPlacement || filteredMatch || firstWithUpload || pool[0] || null;
    if (!targetPl) {
      showNotice('No student placement available to audit.', 'error');
      return;
    }
    setAuditPlacement(targetPl);
    setAuditModalOpen(true);
  };

  useEffect(() => {
    if (currentUser?.role === 'student' && myPlacement) {
      setLogForm((prev) => ({
        ...prev,
        placement_id: String(myPlacement.placement_id),
        approval_status: 'pending',
      }));
    } else if (currentUser?.role === 'supervisor' && supervisorPlacements.length > 0) {
      setLogForm((prev) => ({
        ...prev,
        placement_id: String(supervisorPlacements[0].placement_id),
        approval_status: 'supervisor_verified',
      }));
    } else if (data.placements.length > 0 && !logForm.placement_id) {
      const ongoing = data.placements.find((p) => p.status === 'ongoing') || data.placements[0];
      setLogForm((prev) => ({
        ...prev,
        placement_id: String(ongoing.placement_id),
      }));
    }

    if (data.placements.length > 0 && !evalForm.placement_id) {
      const pool =
        currentUser?.role === 'supervisor'
          ? supervisorPlacements
          : currentUser?.role === 'adviser'
          ? data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
          : data.placements;
      const target =
        pool.find((p) => Number(p.evaluation_count) === 0 && p.status !== 'dropped') ||
        pool[0] ||
        data.placements[0];
      if (target) {
        setEvalForm((prev) => ({
          ...prev,
          placement_id: String(target.placement_id),
          evaluator_type: currentUser?.role === 'adviser' ? 'adviser' : 'employer',
          instrument_type: currentUser?.role === 'adviser' ? 'adviser_to_hte' : 'supervisor_to_student',
          evaluator_name:
            currentUser?.role === 'supervisor'
              ? currentUser.display_name
              : currentUser?.role === 'adviser'
              ? currentUser.display_name
              : target.company_contact_person || 'HTE Supervisor',
        }));
      }
    }
  }, [currentUser, myPlacement, data.placements, evalForm.placement_id, logForm.placement_id]);

  // ===========================================================================
  // AUTHENTICATION HANDLERS
  // ===========================================================================
  const parseAuthResponse = async (res, serviceLabel) => {
    const rawText = await res.text();
    try {
      const parsed = JSON.parse(rawText);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // Non-JSON responses (e.g. HTML/404 from static-only deploy or proxy outage)
      // must surface the HTTP status instead of claiming the server is unreachable.
    }
    return {
      ok: false,
      error: `${serviceLabel} unavailable (HTTP ${res.status || 0}). Please verify the API backend is running.`,
    };
  };

  const handleLogin = async (e, presetUsername = null) => {
    if (e) e.preventDefault();
    const uname = String(presetUsername || loginUsername || '').trim();
    const isInternalSwitch = Boolean(presetUsername && currentUser?.role === 'admin');
    const pwd = presetUsername ? 'password123' : loginPassword;

    if (!uname) {
      setLoginError('Please enter your username, email, or ID number.');
      return;
    }
    if (!isInternalSwitch && !pwd) {
      setLoginError('Please enter your password.');
      return;
    }

    setAuthLoading(true);
    setLoginError('');

    try {
      const res = await apiFetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: uname,
          password: pwd,
          switch_persona: isInternalSwitch,
        }),
      });
      const json = await parseAuthResponse(res, 'Authentication service');
      if (!json.ok) {
        const errMsg = json.error || 'Invalid credentials.';
        setLoginError(errMsg);
        if (currentUser) showNotice(errMsg, 'error');
      } else {
        const cleanUser = {
          ...json.user,
          token: json.token || json.user?.token,
          display_name: (json.user.display_name || json.user.name || '').replace(/\bPUP\b/g, 'MIT'),
        };
        setCurrentUser(cleanUser);
        localStorage.setItem('mit_ojt_user', JSON.stringify(cleanUser));
        localStorage.removeItem('pup_ojt_user');
        setAuthScreenOpen(false);
        setRegSuccessMessage('');
        setActiveTab('dashboard');
        setMobileMenuOpen(false);
        setLoginPassword('');
        setShowLoginPassword(false);
        await fetchSystemData(true);
        showNotice(`Signed in as ${cleanUser.display_name}`);
      }
    } catch {
      const msg = 'Unable to connect to authentication server.';
      setLoginError(msg);
      if (currentUser) showNotice(msg, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const executeLogout = () => {
    clearAllSessionSignatures();
    setVerifyContext(null, null);
    setCurrentUser(null);
    localStorage.removeItem('mit_ojt_user');
    localStorage.removeItem('pup_ojt_user');
    setData((prev) => ({
      ...prev,
      placements: [],
      students: [],
      timelogs: [],
      evaluations: [],
      compliance_reports: [],
      users: [],
      summary: {},
    }));
    setActiveTab('dashboard');
    setMobileMenuOpen(false);
    setAuthScreenOpen(true);
    setAuthMode('login');
    setLoginError('');
    setRegSuccessMessage('');
    setLoginPassword('');
    setShowLoginPassword(false);
    setShowRegPassword(false);
    setConfirmDialog(null);
    fetchSystemData(true);
    showNotice('Signed out cleanly.');
  };

  const requestLogout = () => {
    const elapsedMins = Math.floor(shiftElapsedSeconds / 60);
    const shiftWarn = activeShift?.startedAt
      ? `You currently have a live shift timer running (${elapsedMins} min elapsed). Signing out keeps the timer stored on this browser, or you can clock out first.`
      : '';
    setConfirmDialog({
      title: 'Sign Out of Practicly?',
      message: 'Are you sure you want to close your current portal session?',
      detail: currentUser
        ? `${currentUser.display_name} (${currentUser.identifier_code || currentUser.username} · ${String(currentUser.role || '').toUpperCase()})`
        : '',
      warning: shiftWarn,
      confirmLabel: 'Sign Out',
      cancelLabel: 'Stay Signed In',
      variant: activeShift?.startedAt ? 'warning' : 'danger',
      iconType: 'logout',
      onConfirm: executeLogout,
    });
  };

  const executeApiRequest = async ({ url, method = 'DELETE', afterSuccess, fallbackError, silentRefresh = true }) => {
    setSyncing(true);
    try {
      const res = await apiFetch(url, { method });
      const json = await parseAuthResponse(res, fallbackError);
      if (json.ok) {
        if (afterSuccess) afterSuccess(json);
        showNotice(json.message || 'Operation completed.');
        setConfirmDialog(null);
        await fetchSystemData(silentRefresh);
      } else {
        showNotice(json.error || fallbackError, 'error');
      }
    } catch {
      showNotice(fallbackError, 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setLoginError('');
    setRegSuccessMessage('');
    try {
      const res = await apiFetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm),
      });
      const json = await parseAuthResponse(res, 'Registration service');
      if (!json.ok) {
        setLoginError(json.error || 'Registration failed.');
      } else if (json.pending_approval) {
        const msg =
          json.message ||
          'Faculty Adviser account request submitted. Ask your Practicum Coordinator to activate it under User Accounts before signing in.';
        setRegSuccessMessage(msg);
        setAuthMode('login');
        setLoginUsername(registerForm.username || '');
        setLoginPassword('');
        setRegisterForm((prev) => ({
          ...prev,
          full_name: '',
          student_number: '',
          employee_number: '',
          section: '',
          department: '',
          email: '',
          contact_number: '',
          username: '',
          password: 'password123',
        }));
        showNotice('Adviser account request submitted for coordinator activation.');
      } else {
        const cleanUser = {
          ...json.user,
          token: json.token || json.user?.token,
          display_name: (json.user.display_name || json.user.name || '').replace(/\bPUP\b/g, 'MIT'),
        };
        setCurrentUser(cleanUser);
        localStorage.setItem('mit_ojt_user', JSON.stringify(cleanUser));
        localStorage.removeItem('pup_ojt_user');
        setAuthScreenOpen(false);
        setActiveTab('dashboard');
        setMobileMenuOpen(false);
        await fetchSystemData(true);
        showNotice(`Welcome, ${cleanUser.display_name}! Your student portal is ready.`);
      }
    } catch {
      setLoginError('Unable to reach registration server.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleClockIn = () => {
    if (!myPlacement) {
      showNotice('Please assign or activate your HTE placement first.', 'error');
      return;
    }
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const shiftObj = {
      placement_id: myPlacement.placement_id,
      date: now.toISOString().slice(0, 10),
      time_in: `${hh}:${mm}`,
      startedAt: Date.now(),
    };
    setActiveShift(shiftObj);
    localStorage.setItem('mit_ojt_active_shift', JSON.stringify(shiftObj));
    localStorage.removeItem('pup_ojt_active_shift');
    showNotice(`Clocked in at ${hh}:${mm} for ${myPlacement.company_name}.`);
  };

  const handleClockOut = () => {
    if (!activeShift) return;
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeOut = `${hh}:${mm}` === activeShift.time_in ? '17:00' : `${hh}:${mm}`;
    setLogForm((prev) => ({
      ...prev,
      placement_id: String(activeShift.placement_id),
      date: activeShift.date,
      time_in: activeShift.time_in,
      time_out: timeOut,
      break_minutes: 60,
      hours_rendered: '',
      task_description:
        prev.task_description || 'Completed daily engineering shift tasks and deliverables.',
    }));
    setActiveShift(null);
    localStorage.removeItem('mit_ojt_active_shift');
    localStorage.removeItem('pup_ojt_active_shift');
    setActiveTab('timelogs');
    showNotice('Shift ended. Review and submit your attendance record below.');
  };

  const handleOpenClearanceCertificate = (report) => {
    setSelectedClearanceReport(report);
  };

  // ===========================================================================
  // CROSS-MODULE NAVIGATION HELPERS
  // ===========================================================================
  const jumpToEvaluatePlacement = (placement) => {
    setEditingEvalId(null);
    const defaultType = currentUser.role === 'adviser' ? 'adviser' : 'employer';
    const defaultInstrument = defaultType === 'adviser' ? 'adviser_to_hte' : 'supervisor_to_student';
    setEvalForm({
      placement_id: String(placement.placement_id),
      evaluator_type: defaultType,
      instrument_type: defaultInstrument,
      evaluator_name:
        defaultType === 'adviser'
          ? placement.adviser_name || currentUser.display_name
          : placement.company_contact_person || 'HTE Supervisor',
      technical_score: '4.90',
      attitude_score: '4.95',
      attendance_score: '5.00',
      comments: '',
      date_evaluated: new Date().toISOString().slice(0, 10),
    });
    setActiveTab('evaluations');
  };

  const jumpToPlacementLogs = (placement) => {
    setTimelogPlacementFilter(String(placement.placement_id));
    setLogForm((prev) => ({
      ...prev,
      placement_id: String(placement.placement_id),
    }));
    setActiveTab('timelogs');
  };

  const jumpToAssignStudentPlacement = (student) => {
    setEditingPlacementId(null);
    setPlacementForm({
      student_id: String(student.student_id),
      employer_id: data.employers[0] ? String(data.employers[0].employer_id) : '1',
      adviser_id: data.advisers[0] ? String(data.advisers[0].adviser_id) : '1',
      academic_term: 'AY 2026-2027 1st Sem',
      position_title: 'Computer Engineering Intern',
      start_date: '2026-08-03',
      end_date: '2026-11-15',
      required_hours: '300',
      status: 'ongoing',
    });
    setShowPlacementForm(true);
    setActiveTab('placements');
  };

  // ===========================================================================
  // TIMELOG CRUD (CREATE, EDIT, APPROVE/FLAG, DELETE, EXPORT CSV)
  // ===========================================================================
  const handleSaveTimeLog = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const computedHrs =
        logForm.hours_rendered !== ''
          ? Number(logForm.hours_rendered)
          : computePreviewHours(logForm.time_in, logForm.time_out, logForm.break_minutes);

      const targetPlacementId =
        currentUser.role === 'student' && myPlacement
          ? myPlacement.placement_id
          : logForm.placement_id;

      const url = editingLogId ? `/api/timelogs/${editingLogId}` : '/api/timelogs';
      const method = editingLogId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...logForm,
          placement_id: targetPlacementId,
          hours_rendered: computedHrs,
          approval_status: currentUser.role === 'student' ? 'pending' : (logForm.approval_status || 'approved'),
        }),
      });
      const json = await parseAuthResponse(res, 'Attendance service');
      if (json.ok) {
        showNotice(json.message);
        setEditingLogId(null);
        setTimeLogModalOpen(false);
        setLogForm((prev) => ({
          ...prev,
          date: '2026-11-07',
          time_in: '08:00',
          time_out: '17:00',
          break_minutes: 60,
          task_description: '',
          hours_rendered: '',
          approval_status: currentUser?.role === 'student' ? 'pending' : 'approved',
        }));
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to save time log.', 'error');
      }
    } catch (err) {
      showNotice(err?.message || 'Unable to reach server while saving time log.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEditTimeLog = (tl) => {
    setEditingLogId(tl.log_id);
    setTimeLogModalOpen(true);
    const tIn = String(tl.time_in).slice(0, 5);
    const tOut = String(tl.time_out).slice(0, 5);
    const brk = tl.break_minutes ?? 60;
    const autoHrs = computePreviewHours(tIn, tOut, brk);
    const isCustomOverride = Math.abs(Number(tl.hours_rendered) - autoHrs) > 0.05;
    setLogForm({
      placement_id: String(tl.placement_id),
      date: tl.date,
      time_in: tIn,
      time_out: tOut,
      break_minutes: brk,
      hours_rendered: isCustomOverride ? String(tl.hours_rendered) : '',
      task_description: tl.task_description,
      approval_status: tl.approval_status || 'approved',
    });
  };

  const handleVerifySupervisorLog = async (tl, targetStatus = 'supervisor_verified') => {
    setSyncing(true);
    try {
      const res = await apiFetch(`/api/timelogs/${tl.log_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tl,
          approval_status: targetStatus,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        if (targetStatus === 'supervisor_verified') {
          showNotice(`Log #${tl.log_id} verified by HTE Supervisor and forwarded to Faculty Adviser.`);
        } else if (targetStatus === 'flagged') {
          showNotice(`Log #${tl.log_id} flagged for intern correction.`, 'warning');
        } else {
          showNotice(json.message);
        }
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to update time log.', 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleVerifyAllSupervisorLogs = async () => {
    setSyncing(true);
    try {
      const res = await apiFetch('/api/timelogs/approve-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employer_id: currentUser.linked_id,
          target_status: 'supervisor_verified',
        }),
      });
      const json = await res.json();
      if (json.ok) {
        showNotice('All company intern logs verified and forwarded to Faculty Advisers!');
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to verify logs.', 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleApproveAllTimeLogs = async () => {
    setSyncing(true);
    try {
      const payload =
        currentUser.role === 'supervisor'
          ? { employer_id: currentUser.linked_id, target_status: 'supervisor_verified' }
          : currentUser.role === 'adviser' && adviserScopeOnly
          ? { adviser_id: currentUser.linked_id, target_status: 'approved' }
          : { target_status: 'approved' };
      const res = await apiFetch('/api/timelogs/approve-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        
        showNotice(json.message);
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to approve logs.', 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleUpdateTimeLogApproval = async (tl, newApprovalStatus) => {
    setSyncing(true);
    try {
      const res = await apiFetch(`/api/timelogs/${tl.log_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tl,
          hours_rendered: tl.hours_rendered,
          approval_status: newApprovalStatus,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        if (newApprovalStatus === 'supervisor_verified') {
          showNotice(`Log #${tl.log_id} verified by HTE Supervisor and forwarded to Faculty Adviser.`);
        } else if (newApprovalStatus === 'approved') {
          showNotice(`Log #${tl.log_id} endorsed by Faculty Adviser.`);
        } else if (newApprovalStatus === 'flagged') {
          showNotice(`Log #${tl.log_id} flagged for discrepancy review.`, 'warning');
        } else {
          showNotice(`Time log #${tl.log_id} marked as ${newApprovalStatus}.`);
        }
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to update log.', 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const requestDeleteTimeLog = (tl) => {
    if (!tl) return;
    setConfirmDialog({
      title: 'Delete Time Log Entry?',
      message: 'This attendance record will be permanently removed from the DTR ledger and hours calculation.',
      detail: `${tl.date} · ${tl.student_name || `Placement #${tl.placement_id}`} (${Number(tl.hours_rendered || 0).toFixed(2)} hrs)`,
      confirmLabel: 'Delete Entry',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () =>
        executeApiRequest({
          url: `/api/timelogs/${tl.log_id}`,
          fallbackError: 'Unable to delete time log entry.',
          afterSuccess: () => {
            if (editingLogId === tl.log_id) setEditingLogId(null);
          },
        }),
    });
  };

  const handleExportTimeLogsCsv = (logsToExport) => {
    const headers = ['Log ID', 'Date', 'Student Number', 'Student Name', 'Company', 'Time In', 'Time Out', 'Hours', 'Status', 'Accomplishment'];
    const rows = logsToExport.map((l) => [
      l.log_id,
      l.date,
      l.student_number,
      `"${l.student_name}"`,
      `"${l.company_name}"`,
      String(l.time_in).slice(0, 5),
      String(l.time_out).slice(0, 5),
      Number(l.hours_rendered).toFixed(2),
      l.approval_status || 'approved',
      `"${String(l.task_description || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `MIT_CpE_Attendance_DTR_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Exported attendance logs to CSV.');
  };

  // ===========================================================================
  // EVALUATION CRUD (CREATE, EDIT, DELETE)
  // ===========================================================================
  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const url = editingEvalId ? `/api/evaluations/${editingEvalId}` : '/api/evaluations';
      const method = editingEvalId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(evalForm),
      });
      const json = await res.json();
      if (json.ok) {
        showNotice(json.message);
        setEditingEvalId(null);
        setEvalModalOpen(false);
        setEvalForm((prev) => ({ ...prev, comments: '' }));
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to save evaluation.', 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEditEvaluation = (ev) => {
    setEditingEvalId(ev.eval_id);
    setEvalModalOpen(true);
    setEvalForm({
      placement_id: String(ev.placement_id),
      evaluator_type: ev.evaluator_type,
      instrument_type:
        ev.instrument_type ||
        (ev.evaluator_type === 'employer'
          ? 'supervisor_to_student'
          : ev.evaluator_type === 'adviser'
          ? 'adviser_to_hte'
          : 'student_to_supervisor'),
      evaluator_name: ev.evaluator_name,
      technical_score: String(ev.technical_score),
      attitude_score: String(ev.attitude_score),
      attendance_score: String(ev.attendance_score),
      comments: ev.comments,
      date_evaluated: ev.date_evaluated,
    });
  };

  const requestDeleteEvaluation = (ev) => {
    if (!ev) return;
    setConfirmDialog({
      title: 'Delete Evaluation Record?',
      message: 'This evaluation rubric score will be permanently deleted from clearance records.',
      detail: `${ev.date_evaluated || 'Evaluation'} · ${ev.student_name || `Placement #${ev.placement_id}`} (Score: ${Number(ev.rating || 0).toFixed(2)} / 5.00)`,
      confirmLabel: 'Delete Evaluation',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () =>
        executeApiRequest({
          url: `/api/evaluations/${ev.eval_id}`,
          fallbackError: 'Unable to delete evaluation record.',
          afterSuccess: () => {
            if (editingEvalId === ev.eval_id) setEditingEvalId(null);
          },
        }),
    });
  };

  // ===========================================================================
  // EMPLOYER / HTE CRUD (CREATE, EDIT, DELETE)
  // ===========================================================================
  const handleSaveEmployer = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const url = editingEmployerId ? `/api/employers/${editingEmployerId}` : '/api/employers';
      const method = editingEmployerId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employerForm),
      });
      const json = await parseAuthResponse(res, 'Partner HTE service');
      if (json.ok) {
        showNotice(json.message);
        setShowEmployerForm(false);
        setEditingEmployerId(null);
        setEmployerForm({
          company_name: '',
          industry: 'Cloud & Enterprise Software Engineering',
          address: '',
          contact_person: '',
          contact_number: '',
          email: '',
          moa_status: 'active',
          moa_validity: '2028-12-31',
        });
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to save employer record.', 'error');
      }
    } catch (err) {
      showNotice(err?.message || 'Unable to reach server while saving employer record.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEditEmployer = (emp) => {
    setEditingEmployerId(emp.employer_id);
    setEmployerForm({
      company_name: emp.company_name,
      industry: emp.industry,
      address: emp.address,
      contact_person: emp.contact_person,
      contact_number: emp.contact_number,
      email: emp.email,
      moa_status: emp.moa_status || 'active',
      moa_validity: emp.moa_validity || '2028-12-31',
    });
    setShowEmployerForm(true);
  };

  const handleUpdateEmployerMoaStatus = async (emp, newMoaStatus) => {
    setSyncing(true);
    try {
      const res = await apiFetch(`/api/employers/${emp.employer_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...emp,
          moa_status: newMoaStatus,
        }),
      });
      const json = await res.json();
      if (json.ok) {
        showNotice(`Updated ${emp.company_name} MOA status to ${newMoaStatus}.`);
        await fetchSystemData(true);
      } else {
        showNotice(json.error, 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const requestDeleteEmployer = (emp) => {
    if (!emp) return;
    setConfirmDialog({
      title: 'Delete Host Training Establishment?',
      message: 'Remove this partner company from the HTE directory.',
      detail: `${emp.company_name}${emp.industry ? ` · ${emp.industry}` : ''}`,
      warning: Number(emp.active_interns_count || 0) > 0
        ? `This company currently shows ${emp.active_interns_count} linked intern(s). Deletion may be blocked or affect placement links.`
        : '',
      confirmLabel: 'Delete HTE Partner',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () =>
        executeApiRequest({
          url: `/api/employers/${emp.employer_id}`,
          fallbackError: 'Unable to delete HTE partner.',
        }),
    });
  };

  // ===========================================================================
  // PLACEMENT CRUD (CREATE, EDIT, STATUS CHANGE, DELETE)
  // ===========================================================================
  const handleSavePlacement = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const url = editingPlacementId ? `/api/placements/${editingPlacementId}` : '/api/placements';
      const method = editingPlacementId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(placementForm),
      });
      const json = await parseAuthResponse(res, 'Placement service');
      if (json.ok) {
        showNotice(json.message);
        setShowPlacementForm(false);
        setEditingPlacementId(null);
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to save placement.', 'error');
      }
    } catch (err) {
      showNotice(err?.message || 'Unable to reach server while saving placement.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEditPlacement = (pl) => {
    setEditingPlacementId(pl.placement_id);
    setPlacementForm({
      student_id: String(pl.student_id),
      employer_id: String(pl.employer_id),
      adviser_id: String(pl.adviser_id),
      academic_term: pl.academic_term,
      position_title: pl.position_title,
      start_date: pl.start_date,
      end_date: pl.end_date,
      required_hours: String(pl.required_hours),
      status: pl.status,
    });
    setShowPlacementForm(true);
  };

  const handleUpdatePlacementStatus = async (placementId, newStatus) => {
    setSyncing(true);
    try {
      const res = await apiFetch(`/api/placements/${placementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.ok) {
        showNotice(`Placement updated to ${newStatus}.`);
        await fetchSystemData(true);
      } else {
        showNotice(json.error, 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleReassignPlacementAdviser = async (placementId, newAdviserId) => {
    setSyncing(true);
    try {
      const res = await apiFetch(`/api/placements/${placementId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adviser_id: Number(newAdviserId) }),
      });
      const json = await res.json();
      if (json.ok) {
        showNotice('Student reassigned to selected Faculty Adviser.');
        await fetchSystemData(true);
      } else {
        showNotice(json.error, 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleSaveSuperviseStudent = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const targetAdviserId =
        currentUser?.role === 'adviser'
          ? currentUser.linked_id
          : superviseForm.adviser_id || (selectedAdviserFilter !== 'all' ? selectedAdviserFilter : 1);

      if (superviseMode === 'new') {
        const res = await apiFetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_number: superviseForm.student_number,
            full_name: superviseForm.full_name,
            section: superviseForm.section,
            email: superviseForm.email,
            contact_number: superviseForm.contact_number,
            employer_id: superviseForm.employer_id || (data.employers[0]?.employer_id ?? 1),
            adviser_id: targetAdviserId,
            position_title: superviseForm.position_title,
            required_hours: superviseForm.required_hours,
          }),
        });
        const json = await res.json();
        if (json.ok) {
          showNotice(json.message);
          setShowSuperviseForm(false);
          setSuperviseForm((prev) => ({
            ...prev,
            student_number: '',
            full_name: '',
            email: '',
            contact_number: '',
          }));
          await fetchSystemData(true);
        } else {
          showNotice(json.error || 'Could not add student.', 'error');
        }
      } else {
        const res = await apiFetch('/api/placements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: superviseForm.student_id,
            employer_id: superviseForm.employer_id || (data.employers[0]?.employer_id ?? 1),
            adviser_id: targetAdviserId,
            position_title: superviseForm.position_title,
            required_hours: superviseForm.required_hours,
            academic_term: 'AY 2026-2027 1st Sem',
            start_date: '2026-08-03',
            end_date: '2026-11-15',
            status: 'ongoing',
          }),
        });
        const json = await res.json();
        if (json.ok) {
          showNotice(json.message);
          setShowSuperviseForm(false);
          await fetchSystemData(true);
        } else {
          showNotice(json.error || 'Could not assign student.', 'error');
        }
      }
    } finally {
      setSyncing(false);
    }
  };

  const requestDeletePlacement = (pl) => {
    if (!pl) return;
    setConfirmDialog({
      title: 'Delete OJT Placement?',
      message: 'Removing this placement will unlink associated attendance logs, evaluations, and clearance records.',
      detail: `${pl.student_name} → ${pl.company_name} (${Number(pl.total_hours_completed || 0).toFixed(1)} / ${Number(pl.required_hours || 300).toFixed(0)} hrs)`,
      warning: 'Ensure you no longer need this student’s DTR logs or compliance report before deleting.',
      confirmLabel: 'Delete Placement',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () =>
        executeApiRequest({
          url: `/api/placements/${pl.placement_id}`,
          fallbackError: 'Unable to delete placement.',
        }),
    });
  };

  // ===========================================================================
  // STUDENT CRUD (CREATE, EDIT, DELETE)
  // ===========================================================================
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const url = editingStudentId ? `/api/students/${editingStudentId}` : '/api/students';
      const method = editingStudentId ? 'PUT' : 'POST';
      const isStudentSelfEdit = currentUser?.role === 'student' && Boolean(editingStudentId);
      const payload = isStudentSelfEdit
        ? {
            full_name: studentForm.full_name,
            section: studentForm.section,
            email: studentForm.email,
            contact_number: studentForm.contact_number,
            position_title: studentForm.position_title,
            profile_only: true,
          }
        : studentForm;

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await parseAuthResponse(res, 'Student profile service');
      if (json.ok) {
        if (isStudentSelfEdit && Number(editingStudentId) === Number(currentUser?.linked_id)) {
          const updatedUser = {
            ...currentUser,
            display_name: studentForm.full_name || currentUser.display_name,
            name: studentForm.full_name || currentUser.name,
            unit_label: studentForm.section || currentUser.unit_label,
          };
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem('mit_ojt_user', JSON.stringify(updatedUser));
          } catch {
            // ignore
          }
        }
        showNotice(json.message);
        setShowStudentForm(false);
        setEditingStudentId(null);
        setStudentForm({
          student_number: '',
          full_name: '',
          program: 'BS Computer Engineering',
          year_level: '4th Year',
          section: 'BSCpE 4-1',
          email: '',
          contact_number: '',
          username: '',
        });
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to save student record.', 'error');
      }
    } catch (err) {
      showNotice(err?.message || 'Unable to reach server while saving student record.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEditStudent = (st) => {
    const existingPl = data.placements.find((p) => Number(p.student_id) === Number(st.student_id));
    setEditingStudentId(st.student_id);
    setStudentForm({
      student_number: st.student_number,
      full_name: st.full_name,
      program: st.program || 'BS Computer Engineering',
      year_level: st.year_level || '4th Year',
      section: st.section || 'BSCpE 4-1',
      email: st.email,
      contact_number: st.contact_number,
      username: '',
      employer_id: existingPl ? String(existingPl.employer_id) : '',
      adviser_id: existingPl ? String(existingPl.adviser_id) : '',
      position_title: existingPl ? existingPl.position_title : 'Computer Engineering Intern',
    });
    setShowStudentForm(true);
  };

  const requestDeleteStudent = (st) => {
    if (!st) return;
    setConfirmDialog({
      title: 'Delete Student Record?',
      message: 'Permanently delete this student profile and associated portal access.',
      detail: `${st.full_name} (${st.student_number} · ${st.section || 'No section'})`,
      warning: 'Linked OJT placements, DTR logs, and evaluations for this student may also be removed.',
      confirmLabel: 'Delete Student',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () =>
        executeApiRequest({
          url: `/api/students/${st.student_id}`,
          fallbackError: 'Unable to delete student record.',
        }),
    });
  };

  // ===========================================================================
  // ADVISER CRUD (CREATE, EDIT, DELETE)
  // ===========================================================================
  const handleSaveAdviser = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const url = editingAdviserId ? `/api/advisers/${editingAdviserId}` : '/api/advisers';
      const method = editingAdviserId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adviserForm),
      });
      const json = await parseAuthResponse(res, 'Faculty adviser service');
      if (json.ok) {
        showNotice(json.message);
        setShowAdviserForm(false);
        setEditingAdviserId(null);
        setAdviserForm({
          employee_number: '',
          full_name: '',
          department: 'Computer Engineering Department',
          email: '',
          contact_number: '',
          username: '',
        });
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Failed to save adviser record.', 'error');
      }
    } catch (err) {
      showNotice(err?.message || 'Unable to reach server while saving adviser record.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEditAdviser = (adv) => {
    setEditingAdviserId(adv.adviser_id);
    setAdviserForm({
      employee_number: adv.employee_number,
      full_name: adv.full_name,
      department: adv.department,
      email: adv.email,
      contact_number: adv.contact_number,
      username: '',
    });
    setShowAdviserForm(true);
  };

  const requestDeleteAdviser = (adv) => {
    if (!adv) return;
    setConfirmDialog({
      title: 'Delete Faculty Adviser?',
      message: 'Remove this faculty adviser profile from the department roster.',
      detail: `${adv.full_name} (${adv.employee_number} · ${adv.department || 'Faculty'})`,
      confirmLabel: 'Delete Adviser',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () =>
        executeApiRequest({
          url: `/api/advisers/${adv.adviser_id}`,
          fallbackError: 'Unable to delete adviser profile.',
          afterSuccess: () => {
            if (String(selectedAdviserFilter) === String(adv.adviser_id)) setSelectedAdviserFilter('all');
          },
        }),
    });
  };

  // ===========================================================================
  // USER ACCOUNTS CRUD (CREATE, EDIT, TOGGLE ACTIVE, DELETE)
  // ===========================================================================
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSyncing(true);
    try {
      const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
      const method = editingUserId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
      });
      const json = await parseAuthResponse(res, 'User account service');
      if (json.ok) {
        showNotice(json.message);
        setShowUserForm(false);
        setEditingUserId(null);
        setUserForm({
          username: '',
          password: 'password123',
          role: 'student',
          linked_id: '',
          is_active: 1,
        });
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Unable to save user account.', 'error');
      }
    } catch (err) {
      showNotice(err?.message || 'Unable to reach server while saving user account.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleStartEditUser = (u) => {
    setEditingUserId(u.user_id);
    setUserForm({
      username: u.username,
      password: '',
      role: u.role,
      linked_id: u.linked_id ? String(u.linked_id) : '',
      is_active: Number(u.is_active),
    });
    setShowUserForm(true);
  };

  const handleToggleUserActive = async (u) => {
    setSyncing(true);
    try {
      const nextActive = Number(u.is_active) === 1 ? 0 : 1;
      const res = await apiFetch(`/api/users/${u.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: nextActive }),
      });
      const json = await parseAuthResponse(res, 'User status service');
      if (json.ok) {
        showNotice(`User ${u.username} ${nextActive ? 'activated' : 'deactivated'}.`);
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Unable to update user status.', 'error');
      }
    } catch (err) {
      showNotice(err?.message || 'Unable to reach server while updating user status.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const requestDeleteUser = (u) => {
    if (!u) return;
    if (Number(u.user_id) === Number(currentUser?.user_id)) {
      showNotice('You cannot delete your currently active account.', 'error');
      return;
    }
    setConfirmDialog({
      title: 'Delete User Account?',
      message: 'This login credential will be permanently revoked and removed from the system.',
      detail: `${u.display_name} (@${u.username} · ${String(u.role || '').toUpperCase()})`,
      confirmLabel: 'Delete Account',
      variant: 'danger',
      iconType: 'trash',
      onConfirm: () =>
        executeApiRequest({
          url: `/api/users/${u.user_id}`,
          fallbackError: 'Unable to delete user account.',
        }),
    });
  };

  // ===========================================================================
  // COMPLIANCE & SYSTEM MAINTENANCE
  // ===========================================================================
  const handleSyncCompliance = async () => {
    setSyncing(true);
    try {
      const res = await apiFetch('/api/compliance/sync', { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        showNotice(json.message);
        await fetchSystemData(true);
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleEndorseClearance = async (placementId) => {
    setSyncing(true);
    try {
      const res = await apiFetch('/api/compliance/endorse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placement_id: placementId }),
      });
      const json = await res.json();
      if (json.ok) {
        showNotice(json.message);
        await fetchSystemData(true);
      } else {
        showNotice(json.error || 'Could not endorse clearance.', 'error');
      }
    } finally {
      setSyncing(false);
    }
  };

  const requestResetDemo = () => {
    setConfirmDialog({
      title: 'Reset System to Default Seed Data?',
      message: 'Restore the Practicly database back to its original demonstration state.',
      warning: 'All newly registered students, placements, time logs, evaluations, and uploaded scans created since the last seed will be erased.',
      confirmLabel: 'Reset Demo Data',
      variant: 'danger',
      iconType: 'alert',
      onConfirm: () =>
        executeApiRequest({
          url: '/api/system/reset',
          method: 'POST',
          silentRefresh: false,
          fallbackError: 'Unable to reset demo database.',
        }),
    });
  };

  const handleExportComplianceCsv = () => {
    const headers = [
      'Report ID',
      'Clearance Ref',
      'Student Number',
      'Student Name',
      'Section',
      'Host Company',
      'Adviser',
      'Hours Completed',
      'Required Hours',
      'Progress (%)',
      'Evaluations',
      'Avg Rating',
      'Eligibility',
    ];
    const rows = data.compliance_reports.map((r) => [
      r.report_id,
      r.clearance_reference || 'PENDING',
      r.student_number,
      `"${r.student_name}"`,
      r.section,
      `"${r.company_name}"`,
      `"${r.adviser_name}"`,
      Number(r.total_hours_completed).toFixed(2),
      Number(r.required_hours).toFixed(2),
      `${r.completion_percentage}%`,
      r.evaluation_count,
      r.average_rating || 'N/A',
      Number(r.requirement_met) === 1 ? 'ELIGIBLE' : 'INCOMPLETE',
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `MIT_CpE_Compliance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Compliance report exported to CSV.');
  };

  const handleExportPlacementMasterlistCsv = () => {
    const headers = [
      'Student Name (LN, GN MN)',
      'Date Started (MM/DD/YYYY)',
      'End Date (MM/DD/YYYY)',
      'No of hrs',
      'Company Name (NO abbreviation)',
      'Company Address (complete address)',
      'Contact Person / Immediate Supervisor',
      'Tel Number',
      'Mobile Number',
      'Email Address',
      'Remarks (deployed, waiting for deployment, for interview)',
    ];

    const formatMmDdYyyy = (dateStr) => {
      if (!dateStr) return '';
      const parts = String(dateStr).split('-');
      if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`;
      return dateStr;
    };

    const mapRemarks = (status) => {
      switch (String(status).toLowerCase()) {
        case 'ongoing':
        case 'active':
          return 'deployed';
        case 'pending':
          return 'waiting for deployment';
        case 'interviewing':
          return 'for interview';
        case 'completed':
          return 'completed';
        default:
          return status || 'deployed';
      }
    };

    const rows = data.placements.map((p) => [
      `"${p.student_name || ''}"`,
      formatMmDdYyyy(p.start_date),
      formatMmDdYyyy(p.end_date),
      p.required_hours || 300,
      `"${p.company_name || ''}"`,
      `"${(p.company_address || '').replace(/"/g, '""')}"`,
      `"${p.company_contact_person || ''}"`,
      `"${p.company_contact_number || ''}"`,
      `"${p.student_contact || p.company_contact_number || ''}"`,
      `"${p.company_email || ''}"`,
      `"${mapRemarks(p.status)}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `OJT_Deployment_Masterlist_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('Exported OJT Deployment Masterlist CSV successfully.');
  };

  // ===========================================================================
  // ROLE-SCOPED NAVIGATION
  // ===========================================================================
  const navGroups = useMemo(() => {
    const role = currentUser?.role || 'student';

    if (role === 'student') {
      return [
        {
          label: 'My Practicum',
          items: [
            { id: 'dashboard', label: 'My OJT Overview', icon: IconDashboard },
            {
              id: 'timelogs',
              label: 'Daily Time Record',
              icon: IconClock,
              count: myTimeLogs.length,
            },
            {
              id: 'evaluations',
              label: 'Evals & Clearance',
              icon: IconShieldCheck,
              count: myPlacement
                ? `${getPlacementInstrumentStatus(myPlacement).completedCount}/4`
                : myEvaluations.length,
            },
          ],
        },
        {
          label: 'Resources',
          items: [
            {
              id: 'employers',
              label: 'Partner Companies',
              icon: IconBuilding,
              count: data.employers.length,
            },
          ],
        },
      ];
    }

    if (role === 'supervisor') {
      const companyInternsCount = supervisorPlacements.length;
      return [
        {
          label: 'HTE Industry Portal',
          items: [
            {
              id: 'dashboard',
              label: 'Workplace Supervision',
              icon: IconDashboard,
              count: companyInternsCount,
            },
            {
              id: 'timelogs',
              label: 'DTR Verification Queue',
              icon: IconClock,
              count: supervisorPendingLogs.length > 0 ? `${supervisorPendingLogs.length} pending` : undefined,
            },
            {
              id: 'evaluations',
              label: 'Employer Evaluations',
              icon: IconEvaluation,
              count: `${supervisorEvaluations.length}/${companyInternsCount}`,
            },
          ],
        },
        {
          label: 'Company Profile',
          items: [
            {
              id: 'employers',
              label: 'Company Profile & MOA',
              icon: IconBuilding,
              count: data.employers.length,
            },
          ],
        },
      ];
    }

    if (role === 'adviser') {
      const mySupervisedCount = data.placements.filter(
        (p) => Number(p.adviser_id) === Number(currentUser?.linked_id)
      ).length;
      return [
        {
          label: 'Advisory Portal',
          items: [
            {
              id: 'dashboard',
              label: 'My Advisees',
              icon: IconSupervisor,
              count: mySupervisedCount,
            },
            {
              id: 'timelogs',
              label: 'Attendance Review',
              icon: IconClock,
            },
            {
              id: 'evaluations',
              label: 'Student Evaluations',
              icon: IconEvaluation,
            },
            {
              id: 'compliance',
              label: 'Clearance Endorsements',
              icon: IconShieldCheck,
            },
          ],
        },
        {
          label: 'Directory',
          items: [
            {
              id: 'employers',
              label: 'Partner Companies',
              icon: IconBuilding,
              count: data.employers.length,
            },
          ],
        },
      ];
    }

    return [
      {
        label: 'Overview & Monitoring',
        items: [
          { id: 'dashboard', label: 'Dashboard', icon: IconDashboard },
          {
            id: 'compliance',
            label: 'Clearance Reports',
            icon: IconShieldCheck,
            count: `${data.kpis?.eligible_for_clearance || 0}/${data.placements.length}`,
          },
          {
            id: 'adviser-monitoring',
            label: 'Faculty Supervision',
            icon: IconSupervisor,
            count: data.advisers.length,
          },
        ],
      },
      {
        label: 'Practicum Records',
        items: [
          {
            id: 'placements',
            label: 'Placements',
            icon: IconBriefcase,
            count: data.placements.length,
          },
          {
            id: 'students',
            label: 'Students',
            icon: IconStudent,
            count: data.students.length,
          },
          {
            id: 'employers',
            label: 'Partner Companies',
            icon: IconBuilding,
            count: data.employers.length,
          },
          {
            id: 'timelogs',
            label: 'Attendance Logs',
            icon: IconClock,
            count: data.timelogs.length,
          },
          {
            id: 'evaluations',
            label: 'Evaluations',
            icon: IconEvaluation,
            count: data.evaluations.length,
          },
        ],
      },
      {
        label: 'Administration',
        items: [
          {
            id: 'admin',
            label: 'User Accounts',
            icon: IconSettings,
            count: data.users.length,
          },
          {
            id: 'database-erd',
            label: 'System Schema',
            icon: IconDatabase,
          },
        ],
      },
    ];
  }, [
    currentUser,
    data,
    myTimeLogs.length,
    myEvaluations.length,
    supervisorPlacements.length,
    supervisorPendingLogs.length,
    supervisorEvaluations.length,
  ]);

  const activeNavItem = useMemo(() => {
    for (const group of navGroups) {
      const found = group.items.find((i) => i.id === activeTab);
      if (found) return found;
    }
    return navGroups[0]?.items[0] || { label: 'Overview' };
  }, [navGroups, activeTab]);

  const filteredPlacements = useMemo(() => {
    return data.placements
      .filter((p) => {
        if (currentUser?.role === 'adviser' && adviserScopeOnly) {
          if (Number(p.adviser_id) !== Number(currentUser.linked_id)) return false;
        }
        if (activeTab === 'adviser-monitoring' && selectedAdviserFilter !== 'all') {
          if (Number(p.adviser_id) !== Number(selectedAdviserFilter)) return false;
        }
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;

        const hrs = Number(p.hours_rendered || 0);
        if (placementQuickFilter === 'cleared' && hrs < 300) return false;
        if (placementQuickFilter === 'near' && (hrs < 200 || hrs >= 300)) return false;
        if (placementQuickFilter === 'ongoing' && hrs >= 200) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.student_name?.toLowerCase().includes(q) ||
          p.student_number?.toLowerCase().includes(q) ||
          p.company_name?.toLowerCase().includes(q) ||
          p.adviser_name?.toLowerCase().includes(q) ||
          p.position_title?.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        let valA = a[placementSortCol] ?? '';
        let valB = b[placementSortCol] ?? '';
        if (placementSortCol === 'hours_rendered' || placementSortCol === 'required_hours') {
          valA = Number(valA);
          valB = Number(valB);
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
        }
        if (valA < valB) return placementSortAsc ? -1 : 1;
        if (valA > valB) return placementSortAsc ? 1 : -1;
        return 0;
      });
  }, [
    data.placements,
    currentUser,
    adviserScopeOnly,
    activeTab,
    selectedAdviserFilter,
    statusFilter,
    placementQuickFilter,
    placementSortCol,
    placementSortAsc,
    searchQuery,
  ]);

  const scopedTimeLogs = useMemo(() => {
    return data.timelogs.filter((tl) => {
      if (currentUser?.role === 'student') {
        if (!myPlacement || Number(tl.placement_id) !== Number(myPlacement.placement_id)) return false;
      } else if (currentUser?.role === 'supervisor' && timelogPlacementFilter === 'all') {
        const empId = Number(currentUser.linked_id);
        const matchPlacement = data.placements.find(
          (p) => Number(p.placement_id) === Number(tl.placement_id)
        );
        if (!matchPlacement || Number(matchPlacement.employer_id) !== empId) return false;
      } else if (currentUser?.role === 'adviser' && adviserScopeOnly && timelogPlacementFilter === 'all') {
        if (Number(tl.adviser_id) !== Number(currentUser.linked_id)) return false;
      } else if (timelogPlacementFilter !== 'all') {
        if (Number(tl.placement_id) !== Number(timelogPlacementFilter)) return false;
      }
      return true;
    });
  }, [data.timelogs, data.placements, currentUser, myPlacement, adviserScopeOnly, timelogPlacementFilter]);

  const timelogCounts = useMemo(() => {
    return {
      all: scopedTimeLogs.length,
      pending: scopedTimeLogs.filter((tl) => tl.approval_status === 'pending').length,
      supervisor_verified: scopedTimeLogs.filter((tl) => tl.approval_status === 'supervisor_verified').length,
      approved: scopedTimeLogs.filter((tl) => tl.approval_status === 'approved').length,
      flagged: scopedTimeLogs.filter((tl) => tl.approval_status === 'flagged').length,
    };
  }, [scopedTimeLogs]);

  const filteredTimeLogs = useMemo(() => {
    return scopedTimeLogs.filter((tl) => {
      if (timelogQuickFilter !== 'all') {
        if (timelogQuickFilter === 'pending' && tl.approval_status !== 'pending') return false;
        if (timelogQuickFilter === 'supervisor_verified' && tl.approval_status !== 'supervisor_verified') return false;
        if (timelogQuickFilter === 'approved' && tl.approval_status !== 'approved') return false;
        if (timelogQuickFilter === 'flagged' && tl.approval_status !== 'flagged') return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        tl.student_name?.toLowerCase().includes(q) ||
        tl.company_name?.toLowerCase().includes(q) ||
        tl.task_description?.toLowerCase().includes(q) ||
        tl.date?.includes(q)
      );
    });
  }, [scopedTimeLogs, timelogQuickFilter, searchQuery]);

  const scopedEvaluations = useMemo(() => {
    return data.evaluations.filter((ev) => {
      if (currentUser?.role === 'student') {
        if (!myPlacement || Number(ev.placement_id) !== Number(myPlacement.placement_id)) return false;
      } else if (currentUser?.role === 'supervisor') {
        const pids = new Set(supervisorPlacements.map((p) => Number(p.placement_id)));
        if (!pids.has(Number(ev.placement_id)) || ev.evaluator_type !== 'employer') return false;
      } else if (currentUser?.role === 'adviser' && adviserScopeOnly) {
        const pids = new Set(
          data.placements
            .filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
            .map((p) => Number(p.placement_id))
        );
        if (!pids.has(Number(ev.placement_id))) return false;
      }
      return true;
    });
  }, [data.evaluations, data.placements, currentUser, supervisorPlacements, adviserScopeOnly, myPlacement]);

  const evalCounts = useMemo(() => {
    return {
      all: scopedEvaluations.length,
      employer: scopedEvaluations.filter((ev) => ev.evaluator_type === 'employer').length,
      adviser: scopedEvaluations.filter((ev) => ev.evaluator_type === 'adviser').length,
      student: scopedEvaluations.filter((ev) => ev.evaluator_type === 'student').length,
    };
  }, [scopedEvaluations]);

  const filteredEvaluations = useMemo(() => {
    return scopedEvaluations.filter((ev) => {
      if (evalQuickFilter !== 'all' && ev.evaluator_type !== evalQuickFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ev.student_name?.toLowerCase().includes(q) ||
        ev.company_name?.toLowerCase().includes(q) ||
        ev.evaluator_name?.toLowerCase().includes(q) ||
        ev.evaluator_type?.toLowerCase().includes(q) ||
        ev.instrument_type?.toLowerCase().includes(q) ||
        ev.comments?.toLowerCase().includes(q)
      );
    });
  }, [scopedEvaluations, evalQuickFilter, searchQuery]);

  // ===========================================================================
  // PUBLIC SUPERVISOR VERIFICATION PORTAL (NO LOGIN REQUIRED)
  // ===========================================================================
  if (publicSupervisorPlacementId) {
    if (loading) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-canvas)' }}>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <span className="spin-anim" style={{ display: 'inline-flex' }}>
              <IconBrandLogo size={42} />
            </span>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              Loading HTE Supervisor Verification Portal...
            </div>
          </div>
        </div>
      );
    }
    const targetPlacement =
      data.placements.find((p) => String(p.placement_id) === String(publicSupervisorPlacementId)) ||
      data.placements[0];
    return (
      <PublicSupervisorVerifyView
        placement={targetPlacement}
        timelogs={data.timelogs}
        evaluations={data.evaluations}
        onClose={() => {
          setVerifyContext(null, null);
          setPublicSupervisorPlacementId(null);
          try {
            window.history.replaceState({}, document.title, window.location.pathname);
          } catch {
            // ignore
          }
        }}
        onRefresh={() => fetchSystemData(false)}
      />
    );
  }

  // ===========================================================================
  // GENERALIZED INSTITUTIONAL LANDING & DEDICATED GOOGLE-STYLE AUTH PORTAL
  // ===========================================================================
  if (!currentUser) {
    const openAuthScreen = (mode = 'login', defaultRegRole = null) => {
      setAuthMode(mode);
      setLoginError('');
      setRegSuccessMessage('');
      if (defaultRegRole) {
        setRegisterForm((prev) => ({ ...prev, role: defaultRegRole }));
      }
      setAuthScreenOpen(true);
    };

    const selectPreviewRole = (role) => {
      setLandingPreviewTab(role);
    };

    const previewOrder = ['student', 'supervisor', 'adviser', 'admin'];
    const previewContentMap = {
      student: {
        tabTitle: 'Student Workspace',
        roleBadge: 'Intern',
        badgeClass: 'gws-chip-student',
        headline: 'Hours & DTR Overview',
        image: '/role-student.png',
        imageAlt: 'Illustration of a student intern tracking daily shift hours, laptop progress bar, and verified DTR uploads',
      },
      supervisor: {
        tabTitle: 'Host Supervisor Portal',
        roleBadge: 'Mentor',
        badgeClass: 'gws-chip-supervisor',
        headline: 'Trainee Attendance & Competency Review',
        image: '/role-supervisor.png',
        imageAlt: 'Illustration of a host workplace supervisor tapping a verification checkmark next to approved trainee shifts and evaluation stars',
      },
      adviser: {
        tabTitle: 'Faculty Adviser Console',
        roleBadge: 'Adviser',
        badgeClass: 'gws-chip-adviser',
        headline: 'DTR Reconciliation & Clearance',
        image: '/role-adviser.png',
        imageAlt: 'Illustration of a faculty adviser reconciling digital attendance logs against signed DTR scans and graduation clearance',
      },
      admin: {
        tabTitle: 'Coordinator Console',
        roleBadge: 'Coordinator',
        badgeClass: 'gws-chip-admin',
        headline: 'Institution Registry & Approvals',
        image: '/role-coordinator.png',
        imageAlt: 'Illustration of a practicum coordinator managing industry partner MOAs, faculty approvals, and institutional ledgers',
      },
    };
    const previewContent = previewContentMap[landingPreviewTab] || previewContentMap.student;

    return (
      <div className="auth-centered-shell">
        {/* STICKY EDITORIAL TOP BAR — GOOGLE WORKSPACE STYLE */}
        <div className="auth-topbar-wrap">
          <header className="auth-topbar">
            <div className="auth-topbar-brand">
              <IconBrandLogo size={30} />
              <span className="auth-topbar-wordmark">Practicly</span>
              <span className="auth-topbar-divider" aria-hidden="true" />
              <span className="auth-topbar-unit">
                Academic Practicum &amp; Internship Platform
              </span>
            </div>

            <nav className="auth-topbar-nav" aria-label="Landing sections">
              <a href="#landing-preview">Workspaces</a>
              <a href="#landing-workflow">Workflow</a>
            </nav>

            <div className="auth-topbar-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => openAuthScreen('login')}
              >
                Sign in
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => openAuthScreen('register', 'student')}
              >
                Get started
              </button>
            </div>
          </header>
        </div>

        {/* BAND 1: CLEAN GOOGLE WORKSPACE HERO + REAL PRODUCT WORKSPACE PREVIEW */}
        <section className="auth-hero-band" aria-label="Practicly Overview">
          <div className="auth-hero-container">
            {/* LEFT: UNDERSTATED EDITORIAL COPY + CTAs */}
            <div className="auth-hero-editorial">
              <div>
                <h1 className="auth-hero-headline">
                  Manage student practicums in one shared workspace.
                </h1>

                <p className="auth-hero-lead">
                  Built for colleges and universities across any degree program. Coordinate daily DTR logs, supervisor sign-offs, and faculty clearances from day one.
                </p>

                <div className="auth-hero-ctas">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openAuthScreen('login')}
                  >
                    Sign in
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => openAuthScreen('register', 'student')}
                  >
                    Create an account
                  </button>
                </div>

                <div className="auth-hero-suite-strip auth-desktop-showcase" aria-label="Included role workspaces">
                  <span className="auth-hero-suite-label">Includes workspaces for</span>
                  <div className="auth-hero-suite-items">
                    <span className="auth-hero-suite-item">
                      <IconStudent size={15} />
                      <span>Students</span>
                    </span>
                    <span className="auth-hero-suite-item">
                      <IconSupervisor size={15} />
                      <span>Host Supervisors</span>
                    </span>
                    <span className="auth-hero-suite-item">
                      <IconShieldCheck size={15} />
                      <span>Faculty Advisers</span>
                    </span>
                    <span className="auth-hero-suite-item">
                      <IconDashboard size={15} />
                      <span>Coordinators</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: GOOGLE WORKSPACE EDITORIAL GRAPHIC (DESKTOP/TABLET ONLY) */}
            <div className="auth-hero-showcase auth-desktop-showcase">
              <div className="auth-hero-showcase-card auth-hero-graphic-wrap">
                <img
                  src="/hero-workspace.jpg"
                  alt="Editorial illustration of a student intern clocking practicum hours with a verified DTR sheet, a host supervisor approving attendance, and a faculty adviser reviewing clearance"
                  className="auth-hero-illustration"
                />
              </div>
            </div>
          </div>
        </section>

        {/* BAND 2: INTERACTIVE WORKSPACE PREVIEW (DESKTOP/TABLET) */}
        <section id="landing-preview" className="auth-band is-tinted auth-desktop-showcase auth-anchor-section" aria-label="Interactive Product Overview">
          <div className="auth-band-inner">
            <div className="auth-section-header">
              <div>
                <h2 className="auth-section-title">Explore each workspace</h2>
              </div>
              <p className="auth-section-sub">
                Select a role to see how each participant uses Practicly.
              </p>
            </div>

            <div
              className="auth-spotlight-grid"
              onMouseEnter={() => setLandingPreviewPaused(true)}
              onMouseLeave={() => setLandingPreviewPaused(false)}
            >
              <div className="auth-preview-window">
                {previewOrder.map((roleKey) => {
                  const slide = previewContentMap[roleKey];
                  const isCurrent = landingPreviewTab === roleKey;
                  return (
                    <img
                      key={roleKey}
                      src={slide.image}
                      alt={slide.imageAlt}
                      aria-hidden={!isCurrent}
                      className={`auth-preview-illustration ${isCurrent ? 'is-active' : ''}`}
                    />
                  );
                })}
              </div>

              <div className="auth-spotlight-rail">
                <div key={landingPreviewTab} className="auth-spotlight-slideshow-meta">
                  <span className="auth-spotlight-slideshow-title">{previewContent.tabTitle}</span>
                  <span className={`gws-role-chip ${previewContent.badgeClass}`} style={{ marginBottom: 0 }}>
                    {previewContent.roleBadge}
                  </span>
                </div>

                <div className="auth-spotlight-tabs" role="tablist" aria-label="Workspace role preview">
                  {[
                    {
                      id: 'student',
                      label: 'Student Intern',
                      desc: 'Clock shifts with the live stopwatch, import attendance spreadsheets, and attach signed DTR PDFs.',
                      icon: <IconStudent size={16} />,
                    },
                    {
                      id: 'supervisor',
                      label: 'Host Supervisor',
                      desc: 'Approve logged trainee shifts and submit competency ratings via a direct verification link or mentor account.',
                      icon: <IconSupervisor size={16} />,
                    },
                    {
                      id: 'adviser',
                      label: 'Faculty Adviser',
                      desc: 'Compare digital attendance against wet-signed scans side by side, review forms, and issue final clearance.',
                      icon: <IconShieldCheck size={16} />,
                    },
                    {
                      id: 'admin',
                      label: 'Practicum Coordinator',
                      desc: 'Maintain host organization MOAs, set program hour targets, approve faculty accounts, and export reports.',
                      icon: <IconDashboard size={16} />,
                    },
                  ].map((item) => {
                    const isActive = landingPreviewTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`auth-spotlight-tab ${isActive ? 'is-active' : ''}`}
                        onClick={() => selectPreviewRole(item.id)}
                      >
                        <span className="auth-spotlight-tab-icon">{item.icon}</span>
                        <div className="auth-spotlight-tab-body">
                          <div className="auth-spotlight-tab-title">{item.label}</div>
                          <div className="auth-spotlight-tab-desc-wrap">
                            <div className="auth-spotlight-tab-desc">{item.desc}</div>
                          </div>
                        </div>
                        {isActive && (
                          <span
                            key={`bar-${item.id}`}
                            className={`auth-spotlight-progress ${landingPreviewPaused ? 'is-paused' : ''}`}
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 3: OPEN 4-STEP CHRONOLOGICAL TERM LIFECYCLE */}
        <section id="landing-workflow" className="auth-band is-white auth-desktop-showcase auth-anchor-section" aria-label="End-to-End Practicum Workflow">
          <div className="auth-band-inner">
            <div className="auth-section-header">
              <div>
                <h2 className="auth-section-title">How a practicum term runs</h2>
              </div>
              <p className="auth-section-sub">
                Every attendance record and evaluation stays connected from onboarding through final clearance.
              </p>
            </div>

            <div className="auth-timeline-grid">
              <div className="auth-timeline-step">
                <div className="auth-timeline-head">
                  <span className="auth-timeline-badge">1</span>
                  <span className="auth-timeline-line" aria-hidden="true" />
                </div>
                <div className="auth-timeline-title">Placement setup</div>
                <div className="auth-timeline-desc">
                  Pair interns with an approved partner organization, host supervisor, faculty adviser, and program hour goal.
                </div>
              </div>

              <div className="auth-timeline-step">
                <div className="auth-timeline-head">
                  <span className="auth-timeline-badge">2</span>
                  <span className="auth-timeline-line" aria-hidden="true" />
                </div>
                <div className="auth-timeline-title">Attendance &amp; DTR filing</div>
                <div className="auth-timeline-desc">
                  Record daily shifts throughout the term and attach signed physical timecards alongside digital logs.
                </div>
              </div>

              <div className="auth-timeline-step">
                <div className="auth-timeline-head">
                  <span className="auth-timeline-badge">3</span>
                  <span className="auth-timeline-line" aria-hidden="true" />
                </div>
                <div className="auth-timeline-title">Workplace verification</div>
                <div className="auth-timeline-desc">
                  Host mentors review submitted attendance shifts and file mid-term and final competency evaluations.
                </div>
              </div>

              <div className="auth-timeline-step">
                <div className="auth-timeline-head">
                  <span className="auth-timeline-badge">4</span>
                  <span className="auth-timeline-line" aria-hidden="true" />
                </div>
                <div className="auth-timeline-title">Cross-audit &amp; clearance</div>
                <div className="auth-timeline-desc">
                  Verify hours against DTR scans, complete required evaluation forms, and sign off on final completion.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* BAND 4: DESKTOP CLOSING WORKSPACE CTA / MOBILE COMPACT ROLE LIST */}
        <section id="landing-roles" className="auth-band is-tinted auth-anchor-section" aria-label="Get Started">
          <div className="auth-band-inner">
            <div className="auth-closing-cta auth-desktop-showcase">
              <h2 className="auth-section-title">Start using Practicly</h2>
              <p className="auth-closing-sub">
                Sign in to your account or register as a student intern or faculty adviser to begin.
              </p>
              <div className="auth-closing-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openAuthScreen('login')}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => openAuthScreen('register', 'student')}
                >
                  Create an account
                </button>
              </div>
            </div>

            <div className="auth-roles-band auth-mobile-only-roles">
              <div className="auth-role-card">
                <span className="auth-role-icon is-student">
                  <IconStudent size={17} />
                </span>
                <div className="auth-role-body">
                  <div className="auth-role-title">Student Interns</div>
                  <div className="auth-role-desc">
                    Track daily hours, upload signed DTRs, and complete student evaluations.
                  </div>
                </div>
              </div>

              <div className="auth-role-card">
                <span className="auth-role-icon is-supervisor">
                  <IconSupervisor size={17} />
                </span>
                <div className="auth-role-body">
                  <div className="auth-role-title">Host Supervisors</div>
                  <div className="auth-role-desc">
                    Verify trainee attendance in one click and submit mentor ratings.
                  </div>
                </div>
              </div>

              <div className="auth-role-card">
                <span className="auth-role-icon is-adviser">
                  <IconShieldCheck size={17} />
                </span>
                <div className="auth-role-body">
                  <div className="auth-role-title">Faculty Advisers</div>
                  <div className="auth-role-desc">
                    Cross-audit signed DTR scans vs logs and endorse final clearances.
                  </div>
                </div>
              </div>

              <div className="auth-role-card">
                <span className="auth-role-icon is-admin">
                  <IconDashboard size={17} />
                </span>
                <div className="auth-role-body">
                  <div className="auth-role-title">Coordinators</div>
                  <div className="auth-role-desc">
                    Manage partner MOAs, programs, user accounts, and institutional reports.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FULL-WIDTH GENERALIZED FOOTER */}
        <div className="auth-footer-wrap">
          <footer className="auth-footer">
            <div>Practicly · Institutional Internship &amp; Practicum Platform</div>
            <div style={{ textAlign: 'right' }}>Multi-School · All Academic Programs</div>
          </footer>
        </div>

        <AuthModal
          isOpen={authScreenOpen}
          onClose={() => {
            setAuthScreenOpen(false);
            setLoginError('');
            setRegSuccessMessage('');
          }}
          authMode={authMode}
          setAuthMode={setAuthMode}
          loginUsername={loginUsername}
          setLoginUsername={setLoginUsername}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          showLoginPassword={showLoginPassword}
          setShowLoginPassword={setShowLoginPassword}
          showRegPassword={showRegPassword}
          setShowRegPassword={setShowRegPassword}
          loginError={loginError}
          setLoginError={setLoginError}
          regSuccessMessage={regSuccessMessage}
          setRegSuccessMessage={setRegSuccessMessage}
          authLoading={authLoading}
          registerForm={registerForm}
          setRegisterForm={setRegisterForm}
          employers={data.employers}
          showDemoAccounts={showDemoAccounts}
          setShowDemoAccounts={setShowDemoAccounts}
          demoPresets={DEMO_PRESETS}
          onLogin={handleLogin}
          onRegister={handleRegister}
        />
      </div>
    );
  }

  const previewHours =
    logForm.hours_rendered !== ''
      ? Number(logForm.hours_rendered)
      : computePreviewHours(logForm.time_in, logForm.time_out, logForm.break_minutes);

  const previewEvalComposite = (
    (Number(evalForm.technical_score || 0) +
      Number(evalForm.attitude_score || 0) +
      Number(evalForm.attendance_score || 0)) /
    3
  ).toFixed(2);

  const isAnyModalOpen = Boolean(
    selectedClearanceReport ||
    selectedDtrPlacement ||
    officialEvalModalOpen ||
    timeLogModalOpen ||
    evalModalOpen ||
    dtrTransferModalOpen ||
    supervisorShareModalOpen ||
    signedDtrModalOpen ||
    signedEvalModalOpen ||
    auditModalOpen ||
    showStudentForm ||
    showEmployerForm ||
    showPlacementForm ||
    showAdviserForm ||
    showUserForm ||
    showSuperviseForm
  );

  return (
    <div
      className={`app-layout ${mobileMenuOpen ? 'drawer-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${isAnyModalOpen ? 'modal-open' : ''}`}
      data-role={currentUser?.role || 'student'}
    >
      {/* MOBILE BACKDROP */}
      {mobileBackdropPresence.rendered && (
        <div
          className={`sidebar-backdrop ${mobileBackdropPresence.exiting ? 'is-exiting' : ''}`}
          aria-hidden="true"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* LEFT SIDEBAR / MOBILE DRAWER */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div
            className="sidebar-brand-wrapper"
            title={sidebarCollapsed ? 'Expand sidebar' : undefined}
            onClick={
              sidebarCollapsed
                ? () => {
                    if (typeof window !== 'undefined' && window.innerWidth > 960) {
                      handleToggleSidebar();
                    }
                  }
                : undefined
            }
            style={{ cursor: sidebarCollapsed ? 'pointer' : 'default' }}
          >
            <div className="sidebar-brand-icon-wrap">
              <IconBrandLogo size={32} />
            </div>
            <div className="sidebar-brand-text">
              <div className="sidebar-title">Practicly</div>
              <div className="sidebar-subtitle">
                {currentUser.role === 'student'
                  ? 'Student Portal'
                  : currentUser.role === 'supervisor'
                  ? 'HTE Supervisor Portal'
                  : currentUser.role === 'adviser'
                  ? 'Faculty Adviser Portal'
                  : 'Coordinator Portal'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-close-btn mobile-only"
            aria-label="Close sidebar navigation"
            onClick={() => setMobileMenuOpen(false)}
          >
            <IconClose size={16} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Primary Navigation">
          {navGroups.map((group) => (
            <div key={group.label} className="sidebar-group">
              <div className="sidebar-group-header">
                <span className="sidebar-group-label">{group.label}</span>
              </div>

              <div className="sidebar-group-items">
                {group.items.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                      title={sidebarCollapsed ? `${item.label}${item.count !== undefined ? ` (${item.count})` : ''}` : undefined}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSearchQuery('');
                        scrollWorkspaceToTop();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <span className="sidebar-link-main">
                        <span className="sidebar-link-icon-wrap">
                          <IconComp size={16} />
                        </span>
                        <span className="sidebar-link-label">{item.label}</span>
                      </span>
                      {item.count !== undefined && (
                        <span className="sidebar-count">{item.count}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div
            className="sidebar-user"
            title={sidebarCollapsed ? `${currentUser.display_name} (${currentUser.identifier_code})` : undefined}
          >
            <div className="sidebar-user-avatar-wrap">
              <div className="sidebar-user-avatar">
                <span className="sidebar-user-initial">
                  {(currentUser.display_name || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name" title={currentUser.display_name}>
                {currentUser.display_name}
              </div>
              <div className="sidebar-user-meta">
                {currentUser.identifier_code} · {currentUser.unit_label}
              </div>
            </div>
            <div className="sidebar-user-signout">
              <button
                type="button"
                className="btn btn-ghost-danger"
                title="Sign out"
                onClick={requestLogout}
                style={{ padding: '6px' }}
              >
                <IconLogOut size={14} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="main-Region">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="topbar-nav-toggle"
              aria-label={sidebarCollapsed ? 'Expand navigation sidebar' : 'Collapse navigation sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => {
                if (window.innerWidth <= 960) {
                  setMobileMenuOpen((prev) => !prev);
                } else {
                  handleToggleSidebar();
                }
              }}
            >
              <IconMenu size={18} />
            </button>
            <div className="topbar-breadcrumbs">
              <span className="crumb-root">
                {currentUser.role === 'student'
                  ? 'Student Portal'
                  : currentUser.role === 'supervisor'
                  ? 'HTE Workplace Portal'
                  : currentUser.role === 'adviser'
                  ? 'Faculty Portal'
                  : 'Administration'}
              </span>
              <span className="crumb-sep">/</span>
              <span className="crumb-current">{activeNavItem.label}</span>
            </div>
          </div>

          <div className="topbar-controls">
            {/* Role Persona Switcher: Strictly Student, Adviser, Admin */}
            <PersonaSwitcher
              currentUser={currentUser}
              users={data.users}
              onSwitchUser={(username) => {
                setActiveTab('dashboard');
                handleLogin(null, username);
              }}
              demoPresets={DEMO_PRESETS}
              onRequestLogout={requestLogout}
              onOpenSupervisorView={() => {
                const targetPl = myPlacement || data.placements[0];
                if (targetPl?.placement_id) {
                  setVerifyContext(targetPl.placement_id, targetPl.verify_token || null);
                  setPublicSupervisorPlacementId(targetPl.placement_id);
                }
              }}
            />

            {/* Sleek Google M3 Refresh Icon Button */}
            <button
              type="button"
              className="topbar-icon-btn"
              title="Refresh live system data"
              aria-label="Refresh data"
              onClick={() => {
                fetchSystemData(false);
              }}
              disabled={loading || syncing}
            >
              <span className={loading || syncing ? 'spin-anim' : ''} style={{ display: 'inline-flex' }}>
                <IconRefresh size={18} />
              </span>
            </button>
          </div>
        </header>

        {(loading || syncing) && <div className="topbar-sync-bar" />}

        <main className="page-container">
          {loading ? (
            <WorkspaceSkeleton activeTab={activeTab} role={currentUser.role} />
          ) : (
            <div
              key={portalTabSwitch.displayedKey}
              className={`view-stage ${portalTabSwitch.phase === 'exiting' ? 'is-exiting' : ''}`}
            >
              {(() => {
                const activeTab = displayedStageTab;
                return (
                  <>
          {/* =================================================================
              ROLE 1: STUDENT PORTAL — AWAITING OFFICIAL HTE PLACEMENT
              ================================================================= */}
          {currentUser.role === 'student' && activeTab === 'dashboard' && !myPlacement && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Welcome, {currentUser.display_name}</h1>
                  <p className="page-subtitle">
                    {currentUser.identifier_code} · {currentUser.unit_label} — Awaiting official practicum placement assignment from your Practicum Coordinator
                  </p>
                </div>
                <div className="page-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setActiveTab('employers')}
                  >
                    <IconBuilding size={13} />
                    Browse Accredited HTEs
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Institutional Practicum Onboarding (CHED CMO 104)</div>
                    <div className="panel-desc">
                      Official company assignments and 300-hour practicum ledgers are authorized by the Practicum Coordinator and Faculty Adviser
                    </div>
                  </div>
                  <StatusChip variant="warning">Awaiting Assignment</StatusChip>
                </div>
                <div className="panel-body">
                  <div className="field-grid-3">
                    <div className="gws-onboarding-step">
                      <div className="gws-onboarding-head">
                        <span className="gws-step-badge">1</span>
                        <span className="gws-step-title">Explore Accredited HTEs</span>
                      </div>
                      <p className="gws-step-copy">
                        Review accredited Host Training Establishments with active Memorandums of Agreement (MOAs) in the partner directory.
                      </p>
                    </div>

                    <div className="gws-onboarding-step">
                      <div className="gws-onboarding-head">
                        <span className="gws-step-badge">2</span>
                        <span className="gws-step-title">Adviser Endorsement</span>
                      </div>
                      <p className="gws-step-copy">
                        Submit your training contract and parent waiver to your Faculty Practicum Adviser for institutional review.
                      </p>
                    </div>

                    <div className="gws-onboarding-step">
                      <div className="gws-onboarding-head">
                        <span className="gws-step-badge">3</span>
                        <span className="gws-step-title">Coordinator Activation</span>
                      </div>
                      <p className="gws-step-copy">
                        Upon departmental confirmation, your coordinator links your account, unlocking your Daily Time Record and Live Stopwatch.
                      </p>
                    </div>
                  </div>

                  <div className="gws-onboarding-footer">
                    <div className="gws-onboarding-meta">
                      Student ID: <strong className="mono">{currentUser.identifier_code}</strong> · Section: <strong>{currentUser.unit_label}</strong> · Program: <strong>BS Computer Engineering</strong>
                    </div>
                    <button
                      type="button"
                      className="btn btn-tonal btn-sm"
                      onClick={() => setActiveTab('employers')}
                    >
                      <IconBuilding size={14} />
                      View Available Partner Companies ({data.employers.length})
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              ROLE 1: STUDENT PORTAL — MY OJT OVERVIEW
              ================================================================= */}
          {currentUser.role === 'student' && activeTab === 'dashboard' && myPlacement && (
            <>
              <RoleHeroBanner
                currentUser={currentUser}
                placement={myPlacement}
                activeShift={activeShift}
                shiftElapsedSeconds={shiftElapsedSeconds}
                onClockIn={handleClockIn}
                onClockOut={handleClockOut}
                onOpenLogModal={() => {
                  setEditingLogId(null);
                  setLogForm({
                    placement_id: String(myPlacement.placement_id),
                    date: new Date().toISOString().slice(0, 10),
                    time_in: '08:00',
                    time_out: '17:00',
                    break_minutes: 60,
                    hours_rendered: '8.00',
                    task_description: '',
                    approval_status: 'pending',
                  });
                  setTimeLogModalOpen(true);
                }}
                onOpenDtrModal={(pl) => setSelectedDtrPlacement(pl)}
                onOpenClearanceModal={(pl) => handleOpenClearanceCertificate(pl)}
                onOpenOfficialEval={() => {
                  setForcedEvalInstrumentId(null);
                  setEvalInitialInstrumentId('student_to_supervisor');
                  setOfficialEvalModalOpen(true);
                }}
                onUploadSignedDtr={() => {
                  setSignedDtrModalOpen(true);
                }}
                onOpenDtrTransfer={() => {
                  setDtrTransferModalOpen(true);
                }}
                onShareSupervisorLink={() => {
                  setSupervisorShareModalOpen(true);
                }}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  scrollWorkspaceToTop();
                }}
              />

              <div className="gws-student-bento">
                <LiveShiftStopwatch
                  activeShift={activeShift}
                  onClockIn={handleClockIn}
                  onClockOut={handleClockOut}
                  myPlacement={myPlacement}
                  onLogQuickMilestone={(note) => {
                    setLogForm((prev) => ({
                      ...prev,
                      task_description: note,
                    }));
                    showNotice('Shift milestone note recorded.');
                  }}
                />

                <section className="gws-deployment-card">
                  <div className="gws-deployment-head">
                    <div>
                      <div className="gws-deployment-kicker">Current Deployment</div>
                      <h2 className="gws-deployment-title">{myPlacement.position_title}</h2>
                      <div className="gws-deployment-sub">{myPlacement.company_name}</div>
                    </div>
                    {Number(myPlacement.requirement_met) === 1 ? (
                      <StatusChip variant="success">
                        Cleared ({myPlacement.clearance_reference})
                      </StatusChip>
                    ) : Number(myPlacement.total_hours_completed) >= Number(myPlacement.required_hours) ? (
                      <StatusChip variant="info">Hours Met · Awaiting Eval</StatusChip>
                    ) : (
                      <StatusChip variant="warning">
                        {Number(myPlacement.hours_remaining).toFixed(1)} hrs left
                      </StatusChip>
                    )}
                  </div>

                  <div className="gws-deployment-metrics">
                    <div className="gws-mini-stat">
                      <span className="gws-mini-label">Training Period</span>
                      <span className="gws-mini-value mono">
                        {myPlacement.start_date} – {myPlacement.end_date}
                      </span>
                    </div>
                    <div className="gws-mini-stat">
                      <span className="gws-mini-label">Logged Shifts</span>
                      <span className="gws-mini-value mono">
                        {myPlacement.total_log_days} {Number(myPlacement.total_log_days) === 1 ? 'entry' : 'entries'}
                      </span>
                    </div>
                    {(() => {
                      const st = getPlacementInstrumentStatus(myPlacement);
                      return (
                        <div className="gws-mini-stat">
                          <span className="gws-mini-label">Evaluations ({st.completedCount}/4)</span>
                          <span className="gws-mini-value mono">
                            {Number(myPlacement.requirement_met) === 1
                              ? '4/4 Cleared'
                              : st.inst02Online
                              ? `INST-02: ${myPlacement.employer_rating}/5.0`
                              : st.inst02Signed
                              ? 'INST-02 Scan Ready'
                              : `${st.completedCount}/4 Completed`}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="gws-deployment-foot">
                    <span>Supervisor: <strong>{myPlacement.company_contact_person}</strong></span>
                    <span className="gws-meta-sep" aria-hidden="true">·</span>
                    <span>Adviser: <strong>{myPlacement.adviser_name}</strong></span>
                  </div>
                </section>
              </div>

              {/* UNIFIED 4-STAGE PRACTICUM VERIFICATION & CLEARANCE STEPPER */}
              <WorkflowPipelineIndicator
                currentRole="student"
                allowSupervisorPortal={allowSupervisorPortal}
                activeStage={
                  myPlacement.status === 'completed' || myPlacement.requirement_met
                    ? 4
                    : myTimeLogs.some((tl) => tl.approval_status === 'supervisor_verified') || myPlacement.signed_dtr_filename
                    ? 3
                    : myTimeLogs.some((tl) => tl.approval_status === 'pending')
                    ? 2
                    : 1
                }
                pendingSupervisorCount={
                  myTimeLogs.filter((tl) => tl.approval_status === 'pending').length
                }
                pendingAdviserCount={
                  myTimeLogs.filter((tl) => tl.approval_status === 'supervisor_verified').length
                }
                hoursCompleted={myPlacement.total_hours_completed}
                requiredHours={myPlacement.required_hours}
                isCleared={Boolean(myPlacement.requirement_met || myPlacement.status === 'completed')}
                stepsMeta={{
                  step1Sub: myPlacement.company_name,
                  step1Status: `${Number(myPlacement.total_hours_completed).toFixed(1)} / ${Number(myPlacement.required_hours).toFixed(0)} hrs (${myPlacement.total_log_days} logs)`,
                  step3Sub: Number(myPlacement.has_employer_eval)
                    ? `HTE rated ${myPlacement.employer_rating} / 5.00`
                    : `Awaiting ${myPlacement.company_contact_person}`,
                  step4Status:
                    Number(myPlacement.requirement_met) === 1
                      ? myPlacement.clearance_reference || 'Clearance Issued'
                      : 'Issued upon completion',
                }}
              />

              <div className="split-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">My Recent Attendance Logs</div>
                      <div className="panel-desc">Latest entries recorded under your placement</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-tonal btn-sm"
                      onClick={() => setActiveTab('timelogs')}
                    >
                      Manage DTR ({myTimeLogs.length})
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table className="table table-fit">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Shift</th>
                          <th className="text-right">Hours</th>
                          <th>Accomplishment / Tasks Completed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTimeLogs.slice(0, 6).map((tl) => (
                          <tr key={tl.log_id}>
                            <td className="mono">{tl.date}</td>
                            <td className="mono row-sub-inline">
                              {String(tl.time_in).slice(0, 5)}–{String(tl.time_out).slice(0, 5)}
                            </td>
                            <td className="text-right mono tabular-nums" style={{ fontWeight: 600 }}>
                              {Number(tl.hours_rendered).toFixed(2)}
                            </td>
                            <td className="row-task-cell">{tl.task_description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Trainee Profile &amp; Contacts</div>
                      <div className="panel-desc">Student identity, host company &amp; adviser</div>
                    </div>
                    {myStudent && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-xs"
                        onClick={() => {
                          handleStartEditStudent(myStudent);
                        }}
                        title="Edit your contact number, email, or section"
                      >
                        <IconEdit size={12} />
                        Edit
                      </button>
                    )}
                  </div>
                  <div className="panel-body gws-contact-list">
                    <div className="gws-contact-row">
                      <div className="gws-contact-avatar is-student">
                        {(myStudent?.full_name || currentUser.display_name || 'S').charAt(0)}
                      </div>
                      <div className="gws-contact-body">
                        <div className="kv-label">Trainee Profile</div>
                        <div className="kv-value">{myStudent?.full_name || currentUser.display_name}</div>
                        <div className="kv-sub mono">
                          {myStudent?.student_number} · {myStudent?.section}
                        </div>
                        <div className="kv-sub">
                          {myStudent?.contact_number || 'No mobile'} · {myStudent?.email}
                        </div>
                      </div>
                    </div>

                    <div className="gws-contact-row">
                      <div className="gws-contact-avatar is-company">
                        <IconBuilding size={16} />
                      </div>
                      <div className="gws-contact-body">
                        <div className="kv-label">Host Company</div>
                        <div className="kv-value">{myPlacement.company_name}</div>
                        <div className="kv-sub">{myPlacement.company_address}</div>
                      </div>
                    </div>

                    <div className="gws-contact-row">
                      <div className="gws-contact-avatar is-supervisor">
                        <IconBriefcase size={16} />
                      </div>
                      <div className="gws-contact-body">
                        <div className="kv-label">Training Supervisor</div>
                        <div className="kv-value">{myPlacement.company_contact_person}</div>
                        <div className="kv-sub">
                          {myPlacement.company_email} · {myPlacement.company_contact_number}
                        </div>
                      </div>
                    </div>

                    <div className="gws-contact-row">
                      <div className="gws-contact-avatar is-adviser">
                        <IconSupervisor size={16} />
                      </div>
                      <div className="gws-contact-body">
                        <div className="kv-label">Faculty Practicum Adviser</div>
                        <div className="kv-value">{myPlacement.adviser_name}</div>
                        <div className="kv-sub">
                          {myPlacement.adviser_department} · {myPlacement.adviser_email}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              ROLE 2: ADVISER PORTAL — MY ADVISEES
              ================================================================= */}
          {currentUser.role === 'adviser' && activeTab === 'dashboard' && (
            <>
              <RoleHeroBanner
                currentUser={currentUser}
                adviserPendingCount={adviserPendingVerifiedLogs.length}
                onApproveAllAdviser={handleApproveAllTimeLogs}
                onOpenEvalModal={() => {
                  setEditingEvalId(null);
                  const pool = data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id));
                  const targetPl = pool[0] || data.placements[0];
                  setEvalForm({
                    placement_id: String(targetPl?.placement_id || 1),
                    evaluator_type: 'adviser',
                    instrument_type: 'adviser_to_hte',
                    evaluator_name: currentUser.display_name,
                    technical_score: '5.00',
                    attitude_score: '5.00',
                    attendance_score: '5.00',
                    comments: '',
                    date_evaluated: new Date().toISOString().slice(0, 10),
                  });
                  setEvalModalOpen(true);
                }}
                onOpenOfficialEval={() => {
                  setForcedEvalInstrumentId(null);
                  setEvalInitialInstrumentId('adviser_to_hte');
                  setOfficialEvalModalOpen(true);
                }}
                onUploadSignedDtr={() => {
                  setSignedDtrModalOpen(true);
                }}
                onOpenDtrTransfer={() => {
                  setDtrTransferModalOpen(true);
                }}
                onShareSupervisorLink={() => {
                  setSupervisorShareModalOpen(true);
                }}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  scrollWorkspaceToTop();
                }}
              />

              {/* PRACTICUM VERIFICATION & CLEARANCE PIPELINE */}
              <WorkflowPipelineIndicator
                currentRole="adviser"
                allowSupervisorPortal={allowSupervisorPortal}
                activeStage={allowSupervisorPortal ? 3 : 2}
                pendingSupervisorCount={
                  data.timelogs.filter((tl) => {
                    const p = data.placements.find(
                      (pl) => Number(pl.placement_id) === Number(tl.placement_id)
                    );
                    return (
                      p &&
                      Number(p.adviser_id) === Number(currentUser.linked_id) &&
                      tl.approval_status === 'pending'
                    );
                  }).length
                }
                pendingAdviserCount={
                  data.timelogs.filter((tl) => {
                    const p = data.placements.find(
                      (pl) => Number(pl.placement_id) === Number(tl.placement_id)
                    );
                    return (
                      p &&
                      Number(p.adviser_id) === Number(currentUser.linked_id) &&
                      tl.approval_status === 'supervisor_verified'
                    );
                  }).length
                }
                hoursCompleted={data.placements
                  .filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
                  .reduce((sum, p) => sum + Number(p.total_hours_completed || 0), 0)}
                requiredHours={
                  data.placements.filter(
                    (p) => Number(p.adviser_id) === Number(currentUser.linked_id)
                  ).length * 300
                }
              />

              <div className="panel">
                <div className="panel-toolbar">
                  <div className="search-box">
                    <IconSearch size={14} />
                    <input
                      type="text"
                      placeholder="Filter advisees by name or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <MaterialSelect
                    className="select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </MaterialSelect>
                  <div className="toolbar-scope-toggle" title="Toggle between assigned advisees and all university interns">
                    <span className="scope-toggle-label">My Advisees Only</span>
                    <Switch
                      checked={adviserScopeOnly}
                      onCheckedChange={(checked) => {
                        setAdviserScopeOnly(checked);
                        showNotice(checked ? 'Filtered to your assigned advisees' : 'Displaying all departmental students');
                      }}
                    />
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="table table-fit table-overview table-adviser-overview">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Host Company</th>
                        <th className="text-right">Hours</th>
                        <th>Progress</th>
                        <th>Eval</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlacements.map((pl) => {
                        const isEligible = Number(pl.requirement_met) === 1;
                        return (
                          <tr key={pl.placement_id}>
                            <td>
                              <div className="row-title">{pl.student_name}</div>
                              <div className="row-sub mono">
                                {pl.student_number} · {pl.section}
                              </div>
                            </td>
                            <td>
                              <div className="row-title">{pl.company_name}</div>
                              <div className="row-sub">{pl.position_title}</div>
                            </td>
                            <td className="text-right mono tabular-nums">
                              <div>
                                {Number(pl.total_hours_completed).toFixed(1)} / {Number(pl.required_hours).toFixed(0)}
                              </div>
                              <div className="row-sub">
                                {pl.last_logged_date || 'No logs'}
                              </div>
                            </td>
                            <td>
                              <div className="inline-progress">
                                <div className="inline-progress-track">
                                  <div
                                    className={`inline-progress-fill ${isEligible ? 'done' : ''}`}
                                    style={{ width: `${Math.min(100, Number(pl.completion_percentage))}%` }}
                                  />
                                </div>
                                <span className="inline-progress-pct">{pl.completion_percentage}%</span>
                              </div>
                            </td>
                            <td>
                              {(() => {
                                const inst = getPlacementInstrumentStatus(pl);
                                const studentDoneCount =
                                  (inst.inst01 ? 1 : 0) + (inst.inst04 ? 1 : 0);
                                return (
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                    <StatusChip variant={inst.inst02 ? 'success' : 'neutral'}>
                                      INST-02: {inst.inst02Online ? pl.employer_rating : inst.inst02Signed ? 'Scan' : '—'}
                                    </StatusChip>
                                    <StatusChip variant={inst.inst03 ? 'success' : 'neutral'}>
                                      INST-03: {inst.inst03 ? pl.adviser_rating : '—'}
                                    </StatusChip>
                                    <StatusChip variant={studentDoneCount === 2 ? 'success' : 'neutral'}>
                                      Stud: {studentDoneCount}/2
                                    </StatusChip>
                                  </div>
                                );
                              })()}
                            </td>
                            <td>
                              {isEligible ? (
                                <StatusChip variant="success">Cleared</StatusChip>
                              ) : pl.status === 'dropped' ? (
                                <StatusChip variant="danger">Dropped</StatusChip>
                              ) : Number(pl.total_hours_completed) >= Number(pl.required_hours) ? (
                                <StatusChip variant="info">Needs Eval</StatusChip>
                              ) : (
                                <StatusChip variant="warning">Ongoing</StatusChip>
                              )}
                            </td>
                            <td className="text-right">
                              <div className="row-actions row-actions-compact">
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => jumpToPlacementLogs(pl)}
                                >
                                  Logs
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => setSelectedDtrPlacement(pl)}
                                >
                                  DTR
                                </button>
                                <button
                                  type="button"
                                  className={`btn ${pl.signed_dtr_filename ? 'btn-tonal' : 'btn-ghost'}`}
                                  onClick={() => {
                                    setAuditPlacement(pl);
                                    setAuditModalOpen(true);
                                  }}
                                  title={
                                    pl.signed_dtr_filename
                                      ? `Audit DTR (Signed physical copy on file: ${pl.signed_dtr_filename})`
                                      : 'Cross-audit digital logs against uploaded signed DTR document'
                                  }
                                >
                                  {pl.signed_dtr_filename ? 'Audit*' : 'Audit'}
                                </button>
                                {pl.signed_eval_filename && (
                                  <button
                                    type="button"
                                    className="btn btn-tonal"
                                    onClick={() => {
                                      setSignedEvalPlacement(pl);
                                      setSignedEvalModalOpen(true);
                                    }}
                                    title={`View signed physical INST-02 copy: ${pl.signed_eval_filename}`}
                                  >
                                    Scan
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  onClick={() => jumpToEvaluatePlacement(pl)}
                                >
                                  Eval
                                </button>
                                {!isEligible && (
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    style={{ color: 'var(--success-fg)', fontWeight: 600 }}
                                    onClick={() => handleEndorseClearance(pl.placement_id)}
                                    disabled={syncing}
                                  >
                                    Endorse
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-xs"
                                  onClick={() => handleOpenClearanceCertificate(pl)}
                                >
                                  Cert
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              ROLE 4: HTE SUPERVISOR PORTAL — WORKPLACE VERIFICATION & ROSTER
              ================================================================= */}
          {currentUser.role === 'supervisor' && activeTab === 'dashboard' && (
            <>
              <RoleHeroBanner
                currentUser={currentUser}
                supervisorPendingCount={supervisorPendingLogs.length}
                onOpenEvalModal={() => {
                  setEditingEvalId(null);
                  const firstPl = supervisorPlacements[0] || data.placements[0];
                  setEvalForm({
                    placement_id: String(firstPl?.placement_id || 1),
                    evaluator_type: 'employer',
                    instrument_type: 'supervisor_to_student',
                    evaluator_name: currentUser.display_name,
                    technical_score: '5.00',
                    attitude_score: '5.00',
                    attendance_score: '5.00',
                    comments: '',
                    date_evaluated: new Date().toISOString().slice(0, 10),
                  });
                  setEvalModalOpen(true);
                }}
                onOpenOfficialEval={() => {
                  setForcedEvalInstrumentId(null);
                  setEvalInitialInstrumentId('supervisor_to_student');
                  setOfficialEvalModalOpen(true);
                }}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  scrollWorkspaceToTop();
                }}
                onExportCsv={() => handleExportTimeLogsCsv(supervisorTimeLogs)}
              />

              {/* 4-STAGE PRACTICUM VERIFICATION & CLEARANCE PIPELINE */}
              <WorkflowPipelineIndicator
                currentRole="supervisor"
                allowSupervisorPortal={allowSupervisorPortal}
                activeStage={2}
                pendingSupervisorCount={supervisorPendingLogs.length}
                pendingAdviserCount={
                  supervisorTimeLogs.filter((tl) => tl.approval_status === 'supervisor_verified').length
                }
                hoursCompleted={supervisorTimeLogs.reduce((sum, tl) => sum + Number(tl.hours_rendered || 0), 0)}
                requiredHours={supervisorPlacements.length * 300}
              />

              {/* KPI METRIC STRIP */}
              <div className="metric-strip">
                <div className="metric-cell">
                  <div className="metric-head-row">
                    <span className="metric-label">Company Interns</span>
                    <span className="metric-icon-badge" aria-hidden="true">
                      <IconStudent size={15} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value mono">{supervisorPlacements.length}</span>
                    <span className="metric-unit">active</span>
                  </div>
                  <div className="metric-foot">Assigned to {currentUser.unit_label || 'your organization'}</div>
                </div>

                <div className="metric-cell">
                  <div className="metric-head-row">
                    <span className="metric-label">Total Rendered Hours</span>
                    <span className="metric-icon-badge" aria-hidden="true">
                      <IconClock size={15} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value mono">
                      {supervisorTimeLogs
                        .reduce((sum, tl) => sum + Number(tl.hours_rendered || 0), 0)
                        .toFixed(1)}
                    </span>
                    <span className="metric-unit">hrs</span>
                  </div>
                  <div className="metric-foot">Cumulative workplace training hours</div>
                </div>

                <div className={`metric-cell ${supervisorPendingLogs.length > 0 ? 'is-warning' : ''}`}>
                  <div className="metric-head-row">
                    <span className="metric-label">Pending Verification</span>
                    <span
                      className={`metric-icon-badge ${supervisorPendingLogs.length > 0 ? 'is-warning' : 'is-success'}`}
                      aria-hidden="true"
                    >
                      <IconCheckCircle size={15} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span
                      className="metric-value mono"
                      style={supervisorPendingLogs.length > 0 ? { color: 'var(--warning-fg)' } : {}}
                    >
                      {supervisorPendingLogs.length}
                    </span>
                    <span className="metric-unit">{supervisorPendingLogs.length === 1 ? 'log' : 'logs'}</span>
                  </div>
                  <div className="metric-foot">
                    {supervisorPendingLogs.length > 0
                      ? 'DTR entries awaiting supervisor sign-off'
                      : 'All submissions verified'}
                  </div>
                </div>

                <div className="metric-cell">
                  <div className="metric-head-row">
                    <span className="metric-label">Supervisor Evaluations</span>
                    <span className="metric-icon-badge is-success" aria-hidden="true">
                      <IconEvaluation size={15} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value mono">
                      {supervisorEvaluations.length}
                    </span>
                    <span className="metric-unit">of {supervisorPlacements.length} completed</span>
                  </div>
                  <div className="metric-foot">Employer performance assessments</div>
                </div>
              </div>

              {/* STAGE 1: PENDING DTR VERIFICATION QUEUE */}
              <div className="panel" style={{ marginBottom: '20px' }}>
                <div className="panel-header">
                  <div>
                    <div className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Stage 1: Daily Time Record Verification Queue</span>
                      {supervisorPendingLogs.length > 0 && (
                        <StatusChip variant="warning">{supervisorPendingLogs.length} Action Required</StatusChip>
                      )}
                    </div>
                    <div className="panel-desc">
                      Verify daily training hours and technical task descriptions before forwarding to Faculty Advisers
                    </div>
                  </div>
                  {supervisorPendingLogs.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleVerifyAllSupervisorLogs}
                      disabled={syncing}
                    >
                      <IconCheckCircle size={13} />
                      Verify All ({supervisorPendingLogs.length})
                    </button>
                  )}
                </div>

                {supervisorPendingLogs.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <IconCheckCircle size={32} style={{ color: 'var(--success-fg)', margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                      Verification Queue Clear
                    </div>
                    <div style={{ fontSize: '13px' }}>
                      All attendance logs submitted by your company interns have been verified and forwarded to their respective Faculty Advisers.
                    </div>
                  </div>
                ) : (
                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Intern</th>
                          <th>Shift</th>
                          <th className="text-right">Hours</th>
                          <th>Workplace Accomplishment</th>
                          <th>Status</th>
                          <th className="text-right">Stage 1 Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supervisorPendingLogs.map((tl) => (
                          <tr key={tl.log_id}>
                            <td className="mono">{tl.date}</td>
                            <td>
                              <div className="row-title">{tl.student_name}</div>
                              <div className="row-sub">{tl.student_number} · {tl.position_title}</div>
                            </td>
                            <td className="mono" style={{ color: 'var(--text-secondary)' }}>
                              {String(tl.time_in).slice(0, 5)}–{String(tl.time_out).slice(0, 5)}
                              {Number(tl.break_minutes) > 0 && ` (${tl.break_minutes}m brk)`}
                            </td>
                            <td className="text-right mono tabular-nums" style={{ fontWeight: 600 }}>
                              {Number(tl.hours_rendered).toFixed(2)}h
                            </td>
                            <td style={{ color: 'var(--text-primary)', maxWidth: '320px' }}>
                              {tl.task_description}
                            </td>
                            <td>
                              <StatusChip variant="warning">Awaiting Sign-off</StatusChip>
                            </td>
                            <td className="text-right">
                              <div className="row-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  style={{ color: 'var(--success-fg)', borderColor: 'var(--success-border)' }}
                                  title="Verify hours and pass to Faculty Adviser"
                                  onClick={() => handleVerifySupervisorLog(tl, 'supervisor_verified')}
                                  disabled={syncing}
                                >
                                  <IconCheckCircle size={13} />
                                  Verify &amp; Pass to Faculty
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost-danger btn-sm"
                                  title="Flag discrepancy for student correction"
                                  onClick={() => handleVerifySupervisorLog(tl, 'flagged')}
                                  disabled={syncing}
                                >
                                  <IconAlert size={13} />
                                  Flag
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* COMPANY INTERN ROSTER */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Company Intern Roster &amp; Progress Velocity</div>
                    <div className="panel-desc">
                      Current student trainees deployed at {currentUser.unit_label || 'your organization'}
                    </div>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Intern Name</th>
                        <th>Role / Designation</th>
                        <th>Academic Adviser</th>
                        <th>Hours Progress</th>
                        <th>Supervisor Eval</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisorPlacements.map((pl) => {
                        const pct = Math.min(
                          100,
                          (Number(pl.total_hours_completed) / Number(pl.required_hours || 300)) * 100
                        );
                        const myEval = data.evaluations.find(
                          (ev) =>
                            Number(ev.placement_id) === Number(pl.placement_id) &&
                            ev.evaluator_type === 'employer'
                        );
                        const internPending = data.timelogs.filter(
                          (tl) =>
                            Number(tl.placement_id) === Number(pl.placement_id) &&
                            tl.approval_status === 'pending'
                        ).length;

                        return (
                          <tr key={pl.placement_id}>
                            <td>
                              <div className="row-title">{pl.student_name}</div>
                              <div className="row-sub">{pl.student_number} · {pl.section}</div>
                            </td>
                            <td>
                              <div style={{ fontWeight: 500 }}>{pl.position_title}</div>
                              <div className="row-sub">{pl.academic_term}</div>
                            </td>
                            <td>
                              <div>{pl.adviser_name}</div>
                              <div className="row-sub">Faculty OJT Adviser</div>
                            </td>
                            <td style={{ minWidth: '160px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '3px' }}>
                                <span className="mono tabular-nums" style={{ fontWeight: 600 }}>
                                  {Number(pl.total_hours_completed).toFixed(1)} / {Number(pl.required_hours).toFixed(0)}h
                                </span>
                                <span style={{ color: 'var(--text-secondary)' }}>{pct.toFixed(0)}%</span>
                              </div>
                              <div className="progress-bar-track">
                                <div
                                  className="progress-bar-fill"
                                  style={{
                                    width: `${pct}%`,
                                    background: pct >= 100 ? 'var(--success-fg)' : 'var(--primary)',
                                  }}
                                />
                              </div>
                              {internPending > 0 && (
                                <div style={{ fontSize: '11px', color: 'var(--warning-fg)', marginTop: '3px', fontWeight: 600 }}>
                                  {internPending} log{internPending > 1 ? 's' : ''} awaiting verification
                                </div>
                              )}
                            </td>
                            <td>
                              {myEval ? (
                                <StatusChip variant="success">
                                  Rated {Number(myEval.rating).toFixed(2)}/5.00
                                </StatusChip>
                              ) : (
                                <StatusChip variant="warning">Pending Evaluation</StatusChip>
                              )}
                            </td>
                            <td className="text-right">
                              <div className="row-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setTimelogPlacementFilter(String(pl.placement_id));
                                    setActiveTab('timelogs');
                                  }}
                                >
                                  <IconClock size={13} />
                                  View Logs
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => {
                                    setEvalForm({
                                      ...evalForm,
                                      placement_id: String(pl.placement_id),
                                      evaluator_type: 'employer',
                                      evaluator_name: currentUser.display_name,
                                      date_evaluated: '2026-11-07',
                                    });
                                    setActiveTab('evaluations');
                                  }}
                                >
                                  <IconEvaluation size={13} />
                                  {myEval ? 'Edit Eval' : 'Evaluate'}
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-sm"
                                  onClick={() => setSelectedDtrPlacement(pl)}
                                >
                                  <IconPrinter size={13} />
                                  DTR
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              ROLE 3: ADMIN PORTAL — OVERVIEW DASHBOARD
              ================================================================= */}
          {currentUser.role === 'admin' && activeTab === 'dashboard' && (
            <>
              <RoleHeroBanner
                currentUser={currentUser}
                kpis={data.kpis}
                onOpenOfficialEval={() => {
                  setForcedEvalInstrumentId(null);
                  setEvalInitialInstrumentId(null);
                  setOfficialEvalModalOpen(true);
                }}
                onUploadSignedDtr={() => {
                  setSignedDtrModalOpen(true);
                }}
                onOpenDtrTransfer={() => {
                  setDtrTransferModalOpen(true);
                }}
                onShareSupervisorLink={() => {
                  setSupervisorShareModalOpen(true);
                }}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  scrollWorkspaceToTop();
                }}
              />

              <div className="metric-strip">
                <div className="metric-cell">
                  <div className="metric-head-row">
                    <span className="metric-label">Active Placements</span>
                    <span className="metric-icon-badge" aria-hidden="true">
                      <IconBriefcase size={15} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value">{data.kpis?.ongoing_placements ?? 0}</span>
                    <span className="metric-unit">of {data.kpis?.total_placements ?? 0} interns</span>
                  </div>
                  <span className="metric-foot">
                    {data.kpis?.completed_placements ?? 0} completed · {data.kpis?.dropped_placements ?? 0} dropped
                  </span>
                </div>

                <div className="metric-cell">
                  <div className="metric-head-row">
                    <span className="metric-label">Total Rendered Hours</span>
                    <span className="metric-icon-badge" aria-hidden="true">
                      <IconClock size={15} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value">
                      {Number(data.kpis?.total_hours_rendered ?? 0).toLocaleString('en-US', {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </span>
                    <span className="metric-unit">hrs</span>
                  </div>
                  <span className="metric-foot">
                    Across {data.kpis?.total_timelogs ?? 0} verified attendance entries
                  </span>
                </div>

                <div className="metric-cell">
                  <div className="metric-head-row">
                    <span className="metric-label">Cleared Students</span>
                    <span className="metric-icon-badge is-success" aria-hidden="true">
                      <IconCheckCircle size={15} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value">{data.kpis?.eligible_for_clearance ?? 0}</span>
                    <span className="metric-unit">eligible</span>
                  </div>
                  <span className="metric-foot">
                    Completed required hours &amp; evaluation
                  </span>
                </div>

                <div className="metric-cell">
                  <div className="metric-head-row">
                    <span className="metric-label">Partner HTEs</span>
                    <span className="metric-icon-badge" aria-hidden="true">
                      <IconBuilding size={15} />
                    </span>
                  </div>
                  <div className="metric-value-row">
                    <span className="metric-value">{data.kpis?.total_employers ?? 0}</span>
                    <span className="metric-unit">companies</span>
                  </div>
                  <span className="metric-foot">
                    {data.kpis?.active_moa_employers ?? 0} active MOAs · Mean {data.kpis?.average_rating ?? '4.95'}/5.00
                  </span>
                </div>
              </div>

              <InteractiveAnalyticsChart
                placements={data.placements}
                timelogs={data.timelogs}
                employers={data.employers}
                onFilterCompany={(companyName) => {
                  setSearchQuery(companyName);
                  setActiveTab('placements');
                  showNotice(`Filtered trainees for ${companyName}`);
                }}
                onFilterStatus={(statusKey) => {
                  setActiveTab('placements');
                  setPlacementQuickFilter(statusKey);
                  showNotice(`Filtered ${statusKey} trainees`);
                }}
              />

              <div className="split-grid">
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Cohort Placement Progress</div>
                      <div className="panel-desc">Real-time hour accumulation and clearance status</div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-tonal btn-sm"
                      onClick={() => setActiveTab('placements')}
                    >
                      View All ({data.placements.length})
                    </button>
                  </div>
                  <div className="table-wrap">
                    <table className="table table-fit table-overview table-admin-split">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Host Company</th>
                          <th>Progress (hrs)</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.placements.map((pl) => {
                          const isEligible = Number(pl.requirement_met) === 1;
                          return (
                            <tr key={pl.placement_id}>
                              <td>
                                <div className="row-title">{pl.student_name}</div>
                                <div className="row-sub mono">
                                  {pl.student_number} · {pl.section}
                                </div>
                              </td>
                              <td>
                                <div className="row-title">{pl.company_name}</div>
                                <div className="row-sub">{pl.position_title}</div>
                              </td>
                              <td>
                                <div className="mono tabular-nums row-hours-compact">
                                  {Number(pl.total_hours_completed).toFixed(1)} / {Number(pl.required_hours).toFixed(0)}
                                </div>
                                <div className="inline-progress" style={{ marginTop: '4px' }}>
                                  <div className="inline-progress-track">
                                    <div
                                      className={`inline-progress-fill ${
                                        pl.status === 'completed' || isEligible
                                          ? 'done'
                                          : pl.status === 'dropped'
                                          ? 'muted'
                                          : ''
                                      }`}
                                      style={{ width: `${Math.min(100, Number(pl.completion_percentage))}%` }}
                                    />
                                  </div>
                                  <span className="inline-progress-pct">{pl.completion_percentage}%</span>
                                </div>
                              </td>
                              <td>
                                <div>
                                  {isEligible ? (
                                    <StatusChip variant="success">Cleared</StatusChip>
                                  ) : pl.status === 'dropped' ? (
                                    <StatusChip variant="danger">Dropped</StatusChip>
                                  ) : Number(pl.total_hours_completed) >= Number(pl.required_hours) ? (
                                    <StatusChip variant="info">Needs Eval</StatusChip>
                                  ) : (
                                    <StatusChip variant="warning">Ongoing</StatusChip>
                                  )}
                                </div>
                                <div className="row-sub mono" style={{ marginTop: '3px' }}>
                                  {getPlacementInstrumentStatus(pl).completedCount}/4 instruments
                                  {Number(pl.evaluation_count) > 0 ? ` · Mean ${pl.average_rating}/5.0` : ''}
                                </div>
                              </td>
                              <td className="text-right">
                                <div className="row-actions row-actions-compact">
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => jumpToPlacementLogs(pl)}
                                  >
                                    Logs
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => jumpToEvaluatePlacement(pl)}
                                  >
                                    Eval
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-xs"
                                    onClick={() => handleOpenClearanceCertificate(pl)}
                                  >
                                    Cert
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Faculty Advisers</div>
                      <div className="panel-desc">Select an adviser to filter supervised students</div>
                    </div>
                  </div>
                  <div className="gws-adviser-list">
                    {data.advisers.map((adv) => {
                      const initials = (adv.full_name || 'A')
                        .replace(/^(Dr\.|Engr\.)\s+/i, '')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join('')
                        .toUpperCase();
                      const hasPendingEvals = Number(adv.pending_adviser_evals) > 0;
                      return (
                        <button
                          key={adv.adviser_id}
                          type="button"
                          className="gws-adviser-row"
                          onClick={() => {
                            setSelectedAdviserFilter(String(adv.adviser_id));
                            setActiveTab('adviser-monitoring');
                          }}
                        >
                          <div className="gws-adviser-avatar" aria-hidden="true">
                            {initials}
                          </div>
                          <div className="gws-adviser-info">
                            <div className="gws-adviser-top">
                              <span className="gws-adviser-name">{adv.full_name}</span>
                              <span className="gws-adviser-code mono">{adv.employee_number}</span>
                            </div>
                            <div className="gws-adviser-metrics">
                              <span>{adv.total_supervised} interns</span>
                              <span aria-hidden="true">·</span>
                              <span>{adv.clearance_ready_count} cleared</span>
                              <span className={`gws-pending-tag ${hasPendingEvals ? 'is-pending' : ''}`}>
                                {adv.pending_adviser_evals} pending eval
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              STUDENTS DIRECTORY (FULL CRUD + ASSIGN HTE)
              ================================================================= */}
          {activeTab === 'students' && (currentUser.role === 'admin' || currentUser.role === 'adviser') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Students</h1>
                  <p className="page-subtitle">
                    Manage Computer Engineering practicum students and placement assignments
                  </p>
                </div>
                <div className="page-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingStudentId(null);
                      setStudentForm({
                        student_number: '',
                        full_name: '',
                        program: 'BS Computer Engineering',
                        year_level: '4th Year',
                        section: 'BSCpE 4-1',
                        email: '',
                        contact_number: '',
                        username: '',
                        employer_id: String(data.employers[0]?.employer_id || 1),
                        adviser_id: String(data.advisers[0]?.adviser_id || 1),
                        position_title: 'Computer Engineering Intern',
                      });
                      setShowStudentForm(true);
                    }}
                  >
                    <IconPlus size={13} />
                    Add Student
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-toolbar">
                  <div className="search-box">
                    <IconSearch size={14} />
                    <input
                      type="text"
                      placeholder="Search students by name, number, section, or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student No.</th>
                        <th>Full Name</th>
                        <th>Program &amp; Section</th>
                        <th>Email &amp; Contact</th>
                        <th>Assigned HTE</th>
                        <th className="text-right">Rendered Hours</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.students || [])
                        .filter((st) => {
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            (st.full_name || '').toLowerCase().includes(q) ||
                            (st.student_number || '').toLowerCase().includes(q) ||
                            (st.section || '').toLowerCase().includes(q) ||
                            (st.email || '').toLowerCase().includes(q) ||
                            (st.company_name || '').toLowerCase().includes(q)
                          );
                        })
                        .map((st) => (
                          <tr
                            key={st.student_id}
                            className={Number(editingStudentId) === Number(st.student_id) ? 'is-editing' : ''}
                          >
                            <td className="mono">{st.student_number}</td>
                            <td className="row-title">{st.full_name}</td>
                            <td>
                              <div>{st.program}</div>
                              <div className="row-sub">{st.year_level} · {st.section}</div>
                            </td>
                            <td>
                              <div>{st.email}</div>
                              <div className="row-sub mono">{st.contact_number}</div>
                            </td>
                            <td>
                              {st.company_name ? (
                                <div>
                                  <div className="row-title">{st.company_name}</div>
                                  <div className="row-sub">Adviser: {st.adviser_name}</div>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => jumpToAssignStudentPlacement(st)}
                                >
                                  <IconPlus size={12} />
                                  Assign HTE
                                </button>
                              )}
                            </td>
                            <td className="text-right mono tabular-nums">
                              {st.placement_id
                                ? `${Number(st.total_hours_completed).toFixed(1)} / ${Number(st.required_hours).toFixed(0)} hrs`
                                : '—'}
                            </td>
                            <td>
                              {Number(st.requirement_met) === 1 ? (
                                <StatusChip variant="success">Cleared</StatusChip>
                              ) : st.placement_status === 'ongoing' ? (
                                <StatusChip variant="warning">Ongoing</StatusChip>
                              ) : st.placement_status === 'dropped' ? (
                                <StatusChip variant="danger">Dropped</StatusChip>
                              ) : (
                                <StatusChip variant="neutral">Unassigned</StatusChip>
                              )}
                            </td>
                            <td className="text-right">
                              <div className="row-actions">
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  title="Edit student"
                                  onClick={() => handleStartEditStudent(st)}
                                >
                                  <IconEdit size={13} />
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-ghost-danger"
                                  title="Delete student"
                                  onClick={() => requestDeleteStudent(st)}
                                >
                                  <IconTrash size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              STUDENT VIEW: MY TRAINEE PROFILE (PREVENTS BLANK SCREEN ON STUDENTS TAB)
              ================================================================= */}
          {activeTab === 'students' && currentUser.role === 'student' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">My Trainee Profile</h1>
                  <p className="page-subtitle">Your student credentials, section details, and placement progress</p>
                </div>
                <div className="page-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (myStudent) handleStartEditStudent(myStudent);
                    }}
                  >
                    <IconEdit size={13} />
                    Edit My Info
                  </button>
                </div>
              </div>
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">{myStudent?.full_name || currentUser.display_name}</div>
                    <div className="panel-desc">
                      {myStudent?.student_number} · {myStudent?.section} · {myStudent?.program || 'BS Computer Engineering'}
                    </div>
                  </div>
                  <StatusChip variant={myPlacement?.requirement_met ? 'success' : myPlacement ? 'warning' : 'neutral'}>
                    {myPlacement?.requirement_met ? 'Cleared' : myPlacement ? 'Ongoing Practicum' : 'Unassigned'}
                  </StatusChip>
                </div>
                <div className="panel-body">
                  <div className="field-grid-3">
                    <div>
                      <div className="kv-label">Institutional Email</div>
                      <div className="kv-value">{myStudent?.email || 'None'}</div>
                    </div>
                    <div>
                      <div className="kv-label">Mobile Contact</div>
                      <div className="kv-value mono">{myStudent?.contact_number || 'None'}</div>
                    </div>
                    <div>
                      <div className="kv-label">Assigned Host Company</div>
                      <div className="kv-value">{myPlacement?.company_name || 'Awaiting assignment'}</div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              SUPERVISOR VIEW: COMPANY INTERNS ROSTER (PREVENTS BLANK SCREEN ON STUDENTS TAB)
              ================================================================= */}
          {activeTab === 'students' && currentUser.role === 'supervisor' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Company Interns</h1>
                  <p className="page-subtitle">Trainees currently assigned to your Host Training Establishment</p>
                </div>
                <div className="page-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveTab('dashboard')}
                  >
                    <IconDashboard size={13} />
                    Workplace Supervision
                  </button>
                </div>
              </div>
              <div className="panel">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Designation</th>
                        <th>Adviser</th>
                        <th className="text-right">Hours Rendered</th>
                        <th>Status</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supervisorPlacements.map((pl) => (
                        <tr key={pl.placement_id}>
                          <td>
                            <div className="row-title">{pl.student_name}</div>
                            <div className="row-sub mono">{pl.student_number} · {pl.section}</div>
                          </td>
                          <td>{pl.position_title}</td>
                          <td>{pl.adviser_name}</td>
                          <td className="text-right mono tabular-nums">
                            {Number(pl.total_hours_completed || 0).toFixed(1)} / {Number(pl.required_hours || 300).toFixed(0)} hrs
                          </td>
                          <td>
                            <StatusChip variant={pl.status === 'completed' ? 'success' : 'warning'}>
                              {pl.status}
                            </StatusChip>
                          </td>
                          <td className="text-right">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setTimelogPlacementFilter(String(pl.placement_id));
                                setActiveTab('timelogs');
                              }}
                            >
                              <IconClock size={12} />
                              Verify DTR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              PARTNER COMPANIES (HTE DIRECTORY — FULL CRUD)
              ================================================================= */}
          {activeTab === 'employers' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Partner Companies (HTEs)</h1>
                  <p className="page-subtitle">
                    {currentUser.role === 'student'
                      ? 'Directory of accredited Host Training Establishments (HTEs). Official placements are assigned and endorsed by your Practicum Coordinator and Faculty Adviser.'
                      : 'Accredited Host Training Establishments and Memorandum of Agreement (MOA) validity'}
                  </p>
                </div>
                {currentUser.role === 'admin' && (
                  <div className="page-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setEditingEmployerId(null);
                        setEmployerForm({
                          company_name: '',
                          industry: 'Cloud & Enterprise Software Engineering',
                          address: '',
                          contact_person: '',
                          contact_number: '',
                          email: '',
                          moa_status: 'active',
                          moa_validity: '2028-12-31',
                        });
                        setShowEmployerForm(true);
                      }}
                    >
                      <IconPlus size={13} />
                      Add Partner HTE
                    </button>
                  </div>
                )}
              </div>

              <div className="panel">
                <div className="panel-toolbar">
                  <div className="search-box">
                    <IconSearch size={14} />
                    <input
                      type="text"
                      placeholder="Filter companies by name, industry, or location..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <MaterialSelect
                    className="select-sm"
                    value={employerIndustryFilter}
                    onChange={(e) => setEmployerIndustryFilter(e.target.value)}
                  >
                    <option value="all">All Industries</option>
                    {Array.from(new Set(data.employers.map((e) => e.industry))).map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
                  </MaterialSelect>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Company &amp; Office Address</th>
                        <th>Industry</th>
                        <th>Supervisor / Contact</th>
                        <th>MOA Status</th>
                        <th className="text-right">Interns Hosted</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data.employers || [])
                        .filter((emp) => {
                          if (employerIndustryFilter !== 'all' && emp.industry !== employerIndustryFilter)
                            return false;
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            (emp.company_name || '').toLowerCase().includes(q) ||
                            (emp.industry || '').toLowerCase().includes(q) ||
                            (emp.address || '').toLowerCase().includes(q) ||
                            (emp.contact_person || '').toLowerCase().includes(q)
                          );
                        })
                        .map((emp) => (
                          <tr
                            key={emp.employer_id}
                            className={Number(editingEmployerId) === Number(emp.employer_id) ? 'is-editing' : ''}
                          >
                            <td>
                              <div className="row-title">{emp.company_name}</div>
                              <div className="row-sub">{emp.address}</div>
                            </td>
                            <td>{emp.industry}</td>
                            <td>
                              <div className="row-title">{emp.contact_person}</div>
                              <div className="row-sub">
                                {emp.email} · {emp.contact_number}
                              </div>
                            </td>
                            <td>
                              {currentUser.role !== 'student' ? (
                                <MaterialSelect
                                  className="select-sm"
                                  value={emp.moa_status || 'active'}
                                  onChange={(e) => handleUpdateEmployerMoaStatus(emp, e.target.value)}
                                >
                                  <option value="active">MOA Active (until {emp.moa_validity})</option>
                                  <option value="pending_renewal">Renewal Pending</option>
                                  <option value="expired">MOA Expired</option>
                                </MaterialSelect>
                              ) : emp.moa_status === 'active' ? (
                                <StatusChip variant="success">Active (until {emp.moa_validity})</StatusChip>
                              ) : emp.moa_status === 'pending_renewal' ? (
                                <StatusChip variant="warning">Renewal Pending</StatusChip>
                              ) : (
                                <StatusChip variant="danger">Expired</StatusChip>
                              )}
                            </td>
                            <td className="text-right mono tabular-nums">
                              {emp.total_placements} ({emp.active_interns} active)
                            </td>
                            <td className="text-right">
                              {currentUser.role === 'student' ? (
                                Number(myPlacement?.employer_id) === Number(emp.employer_id) ? (
                                  <StatusChip variant="success">Assigned Host Company</StatusChip>
                                ) : emp.moa_status === 'active' ? (
                                  <StatusChip variant="neutral">Accredited Partner</StatusChip>
                                ) : (
                                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>MOA Inactive</span>
                                )
                              ) : currentUser.role === 'supervisor' ? (
                                <div className="row-actions" style={{ justifyContent: 'flex-end', gap: '6px' }}>
                                  {Number(currentUser.linked_id) === Number(emp.employer_id) && (
                                    <StatusChip variant="info">My Company</StatusChip>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleStartEditEmployer(emp)}
                                  >
                                    <IconEdit size={12} />
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => {
                                      setTimelogPlacementFilter('all');
                                      setActiveTab('dashboard');
                                    }}
                                  >
                                    My Interns
                                  </button>
                                </div>
                              ) : (
                                <div className="row-actions">
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    title="Assign an intern to this HTE"
                                    onClick={() => {
                                      setEditingPlacementId(null);
                                      setPlacementForm({
                                        student_id: String(data.students[0]?.student_id || ''),
                                        employer_id: String(emp.employer_id),
                                        adviser_id: String(
                                          currentUser.role === 'adviser'
                                            ? currentUser.linked_id
                                            : data.advisers[0]?.adviser_id || 1
                                        ),
                                        academic_term: 'AY 2026-2027 1st Sem',
                                        position_title: 'Computer Engineering Intern',
                                        start_date: '2026-08-03',
                                        end_date: '2026-11-15',
                                        required_hours: '300',
                                        status: 'ongoing',
                                      });
                                      if (currentUser.role === 'adviser') {
                                        setSuperviseForm((prev) => ({
                                          ...prev,
                                          employer_id: String(emp.employer_id),
                                          adviser_id: String(currentUser.linked_id || 1),
                                          student_id: String(data.students[0]?.student_id || 1),
                                        }));
                                        setShowSuperviseForm(true);
                                        setActiveTab('dashboard');
                                      } else {
                                        setShowPlacementForm(true);
                                        setActiveTab('placements');
                                      }
                                    }}
                                  >
                                    <IconPlus size={12} />
                                    Assign
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => {
                                      setStatusFilter('all');
                                      setSearchQuery(emp.company_name);
                                      setActiveTab(currentUser.role === 'adviser' ? 'dashboard' : 'placements');
                                    }}
                                  >
                                    Interns
                                  </button>
                                  {currentUser.role === 'admin' && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-ghost"
                                        onClick={() => handleStartEditEmployer(emp)}
                                      >
                                        <IconEdit size={13} />
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-ghost-danger"
                                        title="Delete HTE"
                                        onClick={() => requestDeleteEmployer(emp)}
                                      >
                                        <IconTrash size={13} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              PLACEMENTS MANAGEMENT (FULL CRUD + QUICK ACTIONS — ADMIN ONLY)
              ================================================================= */}
          {activeTab === 'placements' && currentUser.role === 'admin' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">OJT Placements</h1>
                  <p className="page-subtitle">
                    Assign students to partner companies and faculty advisers
                  </p>
                </div>
                <div className="page-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleExportPlacementMasterlistCsv}
                    title="Export institutional OJT Deployment Masterlist (Student, Company, Supervisor, Dates, Hours)"
                  >
                    <IconDownload size={13} />
                    Export Masterlist (CSV)
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingPlacementId(null);
                      setPlacementForm({
                        student_id: '',
                        employer_id: '',
                        adviser_id: '1',
                        academic_term: 'AY 2026-2027 1st Sem',
                        position_title: 'Computer Engineering Intern',
                        start_date: '2026-08-03',
                        end_date: '2026-11-15',
                        required_hours: '300',
                        status: 'ongoing',
                      });
                      setShowPlacementForm(true);
                    }}
                  >
                    <IconPlus size={13} />
                    Assign Placement
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-toolbar">
                  <div className="search-box">
                    <IconSearch size={14} />
                    <input
                      type="text"
                      placeholder="Search student, company, or adviser..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  {/* MATERIAL DESIGN 3 (M3) PLACEMENTS FILTER */}
                  <div className="table-filter-pills m3-filter-wrap">
                    <SegmentedControl
                      items={[
                        {
                          value: 'all',
                          label: (
                            <span className="seg-filter-item">
                              <span>All</span>
                              <span className="filter-pill-count">{data.placements.length}</span>
                            </span>
                          ),
                        },
                        {
                          value: 'cleared',
                          label: (
                            <span className="seg-filter-item">
                              <span>Cleared (≥300h)</span>
                              <span className="filter-pill-count">{data.placements.filter((p) => Number(p.hours_rendered) >= 300).length}</span>
                            </span>
                          ),
                        },
                        {
                          value: 'near',
                          label: (
                            <span className="seg-filter-item">
                              <span>200–299h</span>
                              <span className="filter-pill-count">{data.placements.filter((p) => Number(p.hours_rendered) >= 200 && Number(p.hours_rendered) < 300).length}</span>
                            </span>
                          ),
                        },
                        {
                          value: 'ongoing',
                          label: (
                            <span className="seg-filter-item">
                              <span>&lt;200h</span>
                              <span className="filter-pill-count">{data.placements.filter((p) => Number(p.hours_rendered) < 200).length}</span>
                            </span>
                          ),
                        },
                      ]}
                      value={placementQuickFilter}
                      onValueChange={(val) => {
                        setPlacementQuickFilter(val);
                      }}
                    />
                  </div>

                  <MaterialSelect
                    className="select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Contract Statuses</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </MaterialSelect>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th
                          className="th-sortable"
                          onClick={() => {
                            if (placementSortCol === 'student_name') {
                              setPlacementSortAsc(!placementSortAsc);
                            } else {
                              setPlacementSortCol('student_name');
                              setPlacementSortAsc(true);
                            }
                          }}
                        >
                          Student {placementSortCol === 'student_name' && <span className="th-sort-icon">{placementSortAsc ? '▲' : '▼'}</span>}
                        </th>
                        <th
                          className="th-sortable"
                          onClick={() => {
                            if (placementSortCol === 'company_name') {
                              setPlacementSortAsc(!placementSortAsc);
                            } else {
                              setPlacementSortCol('company_name');
                              setPlacementSortAsc(true);
                            }
                          }}
                        >
                          Host Company {placementSortCol === 'company_name' && <span className="th-sort-icon">{placementSortAsc ? '▲' : '▼'}</span>}
                        </th>
                        <th>Adviser</th>
                        <th>Duration</th>
                        <th
                          className="th-sortable text-right"
                          onClick={() => {
                            if (placementSortCol === 'hours_rendered') {
                              setPlacementSortAsc(!placementSortAsc);
                            } else {
                              setPlacementSortCol('hours_rendered');
                              setPlacementSortAsc(false);
                            }
                          }}
                        >
                          Hours {placementSortCol === 'hours_rendered' && <span className="th-sort-icon">{placementSortAsc ? '▲' : '▼'}</span>}
                        </th>
                        <th>Progress</th>
                        <th>Status</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlacements.map((pl) => (
                        <tr
                          key={pl.placement_id}
                          className={Number(editingPlacementId) === Number(pl.placement_id) ? 'is-editing' : ''}
                        >
                          <td>
                            <div className="row-title">{pl.student_name}</div>
                            <div className="row-sub mono">{pl.student_number}</div>
                          </td>
                          <td>
                            <div className="row-title">{pl.company_name}</div>
                            <div className="row-sub">{pl.position_title}</div>
                          </td>
                          <td>
                            <div className="row-title">{pl.adviser_name}</div>
                            <div className="row-sub mono">{pl.adviser_code}</div>
                          </td>
                          <td className="mono" style={{ fontSize: '11.5px', color: '#4b5563' }}>
                            {pl.start_date} – {pl.end_date}
                          </td>
                          <td className="text-right mono tabular-nums">
                            {Number(pl.total_hours_completed).toFixed(1)} / {Number(pl.required_hours).toFixed(0)}
                          </td>
                          <td>
                            <div className="inline-progress">
                              <div className="inline-progress-track">
                                <div
                                  className={`inline-progress-fill ${
                                    pl.status === 'completed'
                                      ? 'done'
                                      : pl.status === 'dropped'
                                      ? 'muted'
                                      : ''
                                  }`}
                                  style={{ width: `${Math.min(100, Number(pl.completion_percentage))}%` }}
                                />
                              </div>
                              <span className="inline-progress-pct">{pl.completion_percentage}%</span>
                            </div>
                          </td>
                          <td>
                            <MaterialSelect
                              className="select-sm"
                              value={pl.status}
                              onChange={(e) => handleUpdatePlacementStatus(pl.placement_id, e.target.value)}
                            >
                              <option value="ongoing">Ongoing</option>
                              <option value="completed">Completed</option>
                              <option value="dropped">Dropped</option>
                            </MaterialSelect>
                          </td>
                          <td className="text-right">
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => jumpToPlacementLogs(pl)}
                              >
                                Logs
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setSelectedDtrPlacement(pl)}
                              >
                                DTR
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => handleStartEditPlacement(pl)}
                              >
                                <IconEdit size={13} />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => handleOpenClearanceCertificate(pl)}
                              >
                                Cert
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost-danger"
                                title="Delete placement"
                                onClick={() => requestDeletePlacement(pl)}
                              >
                                <IconTrash size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              DAILY TIME RECORD (DTR) — FULL CREATE, EDIT, APPROVE/FLAG, DELETE, CSV
              ================================================================= */}
          {activeTab === 'timelogs' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {currentUser.role === 'student'
                      ? 'My Daily Time Record (DTR)'
                      : currentUser.role === 'supervisor'
                      ? 'HTE Workplace DTR & Hours Verification'
                      : currentUser.role === 'adviser'
                      ? 'Adviser Attendance Review'
                      : 'Attendance Time Logs'}
                  </h1>
                  <p className="page-subtitle">
                    {currentUser.role === 'student'
                      ? `Log your daily or weekly training hours at ${myPlacement?.company_name || 'your HTE'}`
                      : currentUser.role === 'supervisor'
                      ? `Review, verify, and endorse daily attendance hours for interns at ${currentUser.unit_label || 'your organization'}`
                      : currentUser.role === 'adviser'
                      ? 'Review supervisor-verified time logs and endorse hours for academic clearance'
                      : 'Review, edit, approve, or flag student attendance records'}
                  </p>
                </div>
                <div className="page-actions">
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingLogId(null);
                      const targetPl =
                        currentUser.role === 'student' && myPlacement
                          ? myPlacement
                          : currentUser.role === 'supervisor' && supervisorPlacements.length > 0
                          ? supervisorPlacements[0]
                          : data.placements[0];
                      setLogForm({
                        placement_id: String(targetPl?.placement_id || 1),
                        date: new Date().toISOString().slice(0, 10),
                        time_in: '08:00',
                        time_out: '17:00',
                        break_minutes: 60,
                        hours_rendered: '8.00',
                        task_description: '',
                        approval_status: currentUser?.role === 'student' ? 'pending' : 'approved',
                      });
                      setTimeLogModalOpen(true);
                    }}
                  >
                    <IconPlus size={13} />
                    {currentUser.role === 'student' ? 'Log Attendance' : 'Record Shift Entry'}
                  </button>

                  {currentUser.role === 'supervisor' && supervisorPendingLogs.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleVerifyAllSupervisorLogs}
                      disabled={syncing}
                    >
                      <IconCheckCircle size={13} />
                      Verify All Pending ({supervisorPendingLogs.length})
                    </button>
                  )}

                  {currentUser.role === 'adviser' && adviserPendingVerifiedLogs.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleApproveAllTimeLogs}
                      disabled={syncing}
                    >
                      <IconCheckCircle size={13} />
                      Endorse All ({adviserPendingVerifiedLogs.length})
                    </button>
                  )}

                  {currentUser.role === 'admin' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleApproveAllTimeLogs}
                      disabled={syncing}
                    >
                      <IconCheckCircle size={13} />
                      Approve All Pending
                    </button>
                  )}

                  {(currentUser.role === 'adviser' || currentUser.role === 'admin') && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => openAuditModal()}
                      title="Compare digital shifts with student's uploaded signed physical DTR before endorsing"
                    >
                      <IconShieldCheck size={13} />
                      Audit with Signed DTR
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setDtrTransferModalOpen(true);
                    }}
                    title="Transfer DTR from Excel or upload signed HR copy"
                  >
                    <IconDownload size={13} />
                    {currentUser.role === 'student' ? 'Excel Batch Import' : 'Batch DTR Transfer'}
                  </button>
                </div>
              </div>

              {/* UNASSIGNED STUDENT NOTICE */}
              {currentUser.role === 'student' && !myPlacement && (
                <div className="notice-banner-card is-lg">
                  <div className="notice-banner-main is-center">
                    <div className="notice-banner-icon">
                      <IconAlert size={22} />
                    </div>
                    <div className="notice-banner-copy">
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        OJT Placement Not Activated
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        To log attendance hours and submit DTR shifts, you must first register your assigned Host Training Establishment (HTE) on your dashboard.
                      </div>
                    </div>
                  </div>
                  <div className="notice-banner-actions">
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => setActiveTab('dashboard')}
                    >
                      <IconDashboard size={13} />
                      Activate Placement
                    </button>
                  </div>
                </div>
              )}

              {/* STUDENT SIGNED PHYSICAL DTR CARD */}
              {currentUser.role === 'student' && myPlacement && (
                <div
                  className={`notice-banner-card is-lg ${myPlacement?.signed_dtr_filename ? '' : 'is-highlight'}`}
                >
                  <div className="notice-banner-main">
                    <div
                      className={`notice-banner-icon ${
                        myPlacement?.signed_dtr_filename ? 'is-success' : 'is-surface'
                      }`}
                    >
                      <IconFileText size={22} />
                    </div>
                    <div className="notice-banner-copy">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Official Signed Physical DTR (Supervisor Sign-off)
                        </span>
                        <span
                          className={`badge ${myPlacement?.signed_dtr_filename ? 'badge-success' : 'badge-warning'}`}
                          style={{ fontSize: '10.5px' }}
                        >
                          {myPlacement?.signed_dtr_filename ? 'Signed Copy on File' : 'Pending Physical Upload'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                        {myPlacement?.signed_dtr_filename ? (
                          <>
                            File: <strong>{myPlacement.signed_dtr_filename}</strong> (Uploaded on {myPlacement.signed_dtr_uploaded_at || 'Recent'}) · Your Faculty Adviser will compare your digital hours against this signed document before endorsing to the Admin Registry.
                          </>
                        ) : (
                          <>
                            To credit your training hours, have your HTE supervisor sign your physical DTR copy, then upload the scanned PDF/image here. Your Faculty Adviser will cross-audit your hours against this document.
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="notice-banner-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSupervisorShareModalOpen(true);
                      }}
                    >
                      <IconLink size={13} />
                      Share Link to Supervisor
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        setSignedDtrModalOpen(true);
                      }}
                    >
                      <IconUpload size={13} />
                      {myPlacement?.signed_dtr_filename ? 'Manage Document' : 'Upload Signed DTR'}
                    </button>
                  </div>
                </div>
              )}

              {/* ADVISER CROSS-AUDIT & ENDORSEMENT BANNER */}
              {currentUser.role === 'adviser' && (
                <div className="notice-banner-card">
                  <div className="notice-banner-main is-center">
                    <div className="notice-banner-icon">
                      <IconShieldCheck size={20} />
                    </div>
                    <div className="notice-banner-copy">
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Advisory DTR Cross-Audit &amp; Academic Endorsement
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Compare your advisee&apos;s digital shifts with their uploaded signed physical copy. Endorsed shifts are credited and forwarded to the Admin Registry.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="panel">
                  <div className="panel-toolbar dtr-panel-toolbar">
                    <div className="dtr-toolbar-left">
                      <div className="search-box">
                        <IconSearch size={14} />
                        <input
                          type="text"
                          placeholder="Search date or description..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>

                      {/* MATERIAL DESIGN 3 (M3) STATUS FILTER */}
                      <SegmentedControl
                        className="dtr-status-segmented"
                        items={[
                          {
                            value: 'all',
                            label: (
                              <span className="seg-filter-item">
                                <span>All Records</span>
                                <span className="filter-pill-count">{timelogCounts.all}</span>
                              </span>
                            ),
                          },
                          {
                            value: 'pending',
                            label: (
                              <span className="seg-filter-item">
                                <span>Pending</span>
                                <span className="filter-pill-count">{timelogCounts.pending}</span>
                              </span>
                            ),
                          },
                          {
                            value: 'supervisor_verified',
                            label: (
                              <span className="seg-filter-item">
                                <span>Supervisor Verified</span>
                                <span className="filter-pill-count">{timelogCounts.supervisor_verified}</span>
                              </span>
                            ),
                          },
                          {
                            value: 'approved',
                            label: (
                              <span className="seg-filter-item">
                                <span>Adviser Endorsed</span>
                                <span className="filter-pill-count">{timelogCounts.approved}</span>
                              </span>
                            ),
                          },
                          ...(timelogCounts.flagged > 0
                            ? [
                                {
                                  value: 'flagged',
                                  label: (
                                    <span className="seg-filter-item">
                                      <span>Flagged</span>
                                      <span className="filter-pill-count">{timelogCounts.flagged}</span>
                                    </span>
                                  ),
                                },
                              ]
                            : []),
                        ]}
                        value={timelogQuickFilter}
                        onValueChange={(val) => {
                          setTimelogQuickFilter(val);
                        }}
                      />
                      {currentUser.role !== 'student' && (
                        <MaterialSelect
                          className="select-sm"
                          value={timelogPlacementFilter}
                          onChange={(e) => setTimelogPlacementFilter(e.target.value)}
                        >
                          <option value="all">
                            {currentUser.role === 'supervisor' ? 'All Company Interns' : 'All Students'}
                          </option>
                          {(currentUser.role === 'supervisor'
                            ? supervisorPlacements
                            : currentUser.role === 'adviser' && adviserScopeOnly
                            ? data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
                            : data.placements
                          ).map((pl) => (
                            <option key={pl.placement_id} value={pl.placement_id}>
                              {pl.student_name}
                            </option>
                          ))}
                        </MaterialSelect>
                      )}
                      {currentUser.role === 'adviser' && (
                        <div className="toolbar-scope-toggle" title="Toggle between assigned advisees and all university interns">
                          <span className="scope-toggle-label">My Advisees Only</span>
                          <Switch
                            checked={adviserScopeOnly}
                            onCheckedChange={(checked) => {
                              setAdviserScopeOnly(checked);
                              showNotice(checked ? 'Filtered to your assigned advisees' : 'Displaying all departmental students');
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="toolbar-actions dtr-toolbar-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          const targetPl =
                            currentUser.role === 'student'
                              ? myPlacement
                              : data.placements.find(
                                  (p) =>
                                    String(p.placement_id) ===
                                    String(
                                      timelogPlacementFilter !== 'all'
                                        ? timelogPlacementFilter
                                        : logForm.placement_id
                                    )
                                ) || data.placements[0];
                          if (targetPl) setSelectedDtrPlacement(targetPl);
                        }}
                        title="Print official CHED CMO 104 Daily Time Record"
                      >
                        <IconPrinter size={13} />
                        Print Official DTR
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleExportTimeLogsCsv(filteredTimeLogs)}
                        title="Download records as CSV spreadsheet"
                      >
                        <IconDownload size={13} />
                        Export DTR CSV
                      </button>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          {currentUser.role !== 'student' && <th>Student</th>}
                          <th>Shift</th>
                          <th className="text-right">Hours</th>
                          <th>Accomplishment</th>
                          <th>Status</th>
                          <th className="text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTimeLogs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={currentUser.role !== 'student' ? 7 : 6}
                              style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}
                            >
                              {currentUser.role === 'student'
                                ? 'No attendance entries found. Click "Log Attendance" above to record your training hours.'
                                : 'No attendance records match the selected filter.'}
                            </td>
                          </tr>
                        ) : (
                          filteredTimeLogs.map((tl) => (
                          <tr
                            key={tl.log_id}
                            className={Number(editingLogId) === Number(tl.log_id) ? 'is-editing' : ''}
                          >
                            <td className="mono">{tl.date}</td>
                            {currentUser.role !== 'student' && (
                              <td>
                                <div className="row-title">{tl.student_name}</div>
                                <div className="row-sub">{tl.company_name}</div>
                              </td>
                            )}
                            <td className="mono" style={{ color: '#4b5563' }}>
                              {String(tl.time_in).slice(0, 5)}–{String(tl.time_out).slice(0, 5)}
                            </td>
                            <td className="text-right mono tabular-nums" style={{ fontWeight: 600 }}>
                              {Number(tl.hours_rendered).toFixed(2)}
                            </td>
                            <td style={{ color: '#374151', maxWidth: '300px' }}>{tl.task_description}</td>
                            <td>
                              {currentUser.role === 'admin' ? (
                                <MaterialSelect
                                  className="select-sm"
                                  value={tl.approval_status || 'approved'}
                                  onChange={(e) => handleUpdateTimeLogApproval(tl, e.target.value)}
                                >
                                  <option value="approved">Adviser Endorsed</option>
                                  <option value="supervisor_verified">Supervisor Verified</option>
                                  <option value="pending">Pending Supervisor</option>
                                  <option value="flagged">Flagged (Excluded)</option>
                                </MaterialSelect>
                              ) : tl.approval_status === 'pending' ? (
                                currentUser.role === 'adviser' ? (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ height: '22px', padding: '0 6px', fontSize: '11px', color: 'var(--success-fg)', borderColor: 'var(--success-border)' }}
                                      onClick={() => handleUpdateTimeLogApproval(tl, 'approved')}
                                      title="Directly endorse and credit student hours"
                                    >
                                      Endorse
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost-danger btn-sm"
                                      style={{ height: '22px', padding: '0 5px', fontSize: '11px' }}
                                      onClick={() => handleUpdateTimeLogApproval(tl, 'flagged')}
                                      title="Flag discrepancy"
                                    >
                                      Flag
                                    </button>
                                  </div>
                                ) : currentUser.role === 'supervisor' ? (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ height: '22px', padding: '0 6px', fontSize: '11px', color: 'var(--success-fg)', borderColor: 'var(--success-border)' }}
                                      onClick={() => handleUpdateTimeLogApproval(tl, 'supervisor_verified')}
                                      title="Verify and submit to Faculty Adviser"
                                    >
                                      Verify
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost-danger btn-sm"
                                      style={{ height: '22px', padding: '0 5px', fontSize: '11px' }}
                                      onClick={() => handleUpdateTimeLogApproval(tl, 'flagged')}
                                      title="Flag discrepancy"
                                    >
                                      Flag
                                    </button>
                                  </div>
                                ) : (
                                  <StatusChip variant="warning">Pending Review</StatusChip>
                                )
                              ) : tl.approval_status === 'supervisor_verified' ? (
                                currentUser.role === 'adviser' ? (
                                  <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      style={{ height: '22px', padding: '0 6px', fontSize: '11px', color: 'var(--primary)', borderColor: 'var(--primary)' }}
                                      onClick={() => handleUpdateTimeLogApproval(tl, 'approved')}
                                      title="Endorse and grant academic credit"
                                    >
                                      Endorse
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost-danger btn-sm"
                                      style={{ height: '22px', padding: '0 5px', fontSize: '11px' }}
                                      onClick={() => handleUpdateTimeLogApproval(tl, 'flagged')}
                                      title="Flag discrepancy"
                                    >
                                      Flag
                                    </button>
                                  </div>
                                ) : (
                                  <StatusChip variant="info">Supervisor Verified</StatusChip>
                                )
                              ) : tl.approval_status === 'approved' ? (
                                <StatusChip variant="success">Adviser Endorsed</StatusChip>
                              ) : tl.approval_status === 'flagged' ? (
                                <StatusChip variant="danger">Discrepancy Flagged</StatusChip>
                              ) : (
                                <StatusChip variant="neutral">{tl.approval_status}</StatusChip>
                              )}
                            </td>
                            <td className="text-right">
                              <div className="row-actions">
                                {currentUser.role === 'student' && (tl.approval_status === 'approved' || tl.approval_status === 'supervisor_verified') ? (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      color: 'var(--text-muted)',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '3px',
                                      padding: '2px 6px',
                                      background: 'var(--bg-subtle)',
                                      borderRadius: 'var(--radius-pill)',
                                      border: '1px solid var(--border-default)',
                                    }}
                                    title="Attendance record has been officially signed off and locked for academic integrity."
                                  >
                                    <IconShieldCheck size={12} style={{ color: 'var(--success-fg)' }} />
                                    Locked
                                  </span>
                                ) : (
                                  <>
                                    {(currentUser.role === 'adviser' || currentUser.role === 'admin') && (() => {
                                      const rowPl = data.placements.find(
                                        (p) => Number(p.placement_id) === Number(tl.placement_id)
                                      );
                                      if (!rowPl) return null;
                                      const hasDoc = Boolean(rowPl.signed_dtr_filename || rowPl.signed_dtr_file);
                                      return (
                                        <button
                                          type="button"
                                          className={`btn ${hasDoc ? 'btn-tonal' : 'btn-ghost'}`}
                                          title={
                                            hasDoc
                                              ? `Audit signed DTR (${rowPl.signed_dtr_filename})`
                                              : `Cross-audit DTR for ${rowPl.student_name}`
                                          }
                                          onClick={() => openAuditModal(rowPl)}
                                        >
                                          <IconShieldCheck size={13} />
                                        </button>
                                      );
                                    })()}
                                    <button
                                      type="button"
                                      className="btn btn-ghost"
                                      title={tl.approval_status === 'flagged' ? 'Re-edit flagged entry' : 'Edit entry'}
                                      onClick={() => handleStartEditTimeLog(tl)}
                                    >
                                      <IconEdit size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-ghost-danger"
                                      title="Delete entry"
                                      onClick={() => requestDeleteTimeLog(tl)}
                                    >
                                      <IconTrash size={13} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
            </>
          )}

          {/* =================================================================
              EVALUATIONS — READ-ONLY FOR STUDENT, FULL CRUD FOR ADVISER/ADMIN
              ================================================================= */}
          {activeTab === 'evaluations' && (
            <>
              {currentUser.role === 'student' ? (
                <>
                  {(() => {
                    const instStatus = getPlacementInstrumentStatus(myPlacement || {});
                    return (
                      <>
                        <div className="page-header">
                          <div>
                            <h1 className="page-title">My Evaluations &amp; Clearance</h1>
                            <p className="page-subtitle">
                              Complete your Student Feedback forms (INST-01 &amp; INST-04), manage signed INST-02 copies, and track 4-instrument clearance
                            </p>
                          </div>
                          {myPlacement && (
                            <div className="page-actions">
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={() => {
                                  setForcedEvalInstrumentId(null);
                                  setEvalInitialInstrumentId('student_to_supervisor');
                                  setOfficialEvalModalOpen(true);
                                }}
                              >
                                <IconEvaluation size={13} />
                                Evaluate Supervisor / Adviser
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenClearanceCertificate(myPlacement)}
                              >
                                <IconPrinter size={13} />
                                Print Clearance Certificate
                              </button>
                            </div>
                          )}
                        </div>

                        {myPlacement && (
                          <>
                            <div className="panel" style={{ marginBottom: '16px' }}>
                              <div className="panel-header">
                                <div>
                                  <div className="panel-title">4-Instrument Practicum Evaluation Checklist</div>
                                  <div className="panel-desc">
                                    All 4 official instruments must be satisfied together with required training hours before clearance endorsement
                                  </div>
                                </div>
                                <StatusChip variant={instStatus.allInstrumentsMet ? 'success' : 'warning'}>
                                  {instStatus.completedCount} / 4 Completed
                                </StatusChip>
                              </div>
                              <div className="panel-body">
                                <div className="equal-grid">
                                  <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'space-between' }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>INST-01</span>
                                        <StatusChip variant={instStatus.inst01 ? 'success' : 'warning'}>
                                          {instStatus.inst01 ? `Submitted (${myPlacement.student_supervisor_rating}/5.0)` : 'Action Required'}
                                        </StatusChip>
                                      </div>
                                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                        Student &rarr; HTE Supervisor
                                      </div>
                                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Rate workplace mentorship &amp; training quality from your Host Company supervisor.
                                      </div>
                                    </div>
                                    <div>
                                      <button
                                        type="button"
                                        className={`btn btn-sm ${instStatus.inst01 ? 'btn-secondary' : 'btn-primary'}`}
                                        onClick={() => {
                                          setForcedEvalInstrumentId(null);
                                          setEvalInitialInstrumentId('student_to_supervisor');
                                          setOfficialEvalModalOpen(true);
                                        }}
                                      >
                                        <IconEvaluation size={13} />
                                        {instStatus.inst01 ? 'Review / Update INST-01' : 'Complete INST-01'}
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'space-between' }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>INST-02</span>
                                        <StatusChip variant={instStatus.inst02 ? 'success' : 'neutral'}>
                                          {instStatus.inst02Online
                                            ? `Online (${myPlacement.employer_rating}/5.0)`
                                            : instStatus.inst02Signed
                                            ? 'Signed Scan on File'
                                            : 'Pending Supervisor'}
                                        </StatusChip>
                                      </div>
                                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                        Supervisor &rarr; Trainee &amp; School
                                      </div>
                                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Submitted online by your supervisor via the shareable portal link, or upload a wet-ink signed scan.
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                      <button
                                        type="button"
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => {
                                          setForcedEvalInstrumentId('supervisor_to_student');
                                          setEvalInitialInstrumentId('supervisor_to_student');
                                          setOfficialEvalModalOpen(true);
                                        }}
                                      >
                                        <IconPrinter size={13} />
                                        Print Blank INST-02
                                      </button>
                                    </div>
                                  </div>

                                  <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'space-between' }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>INST-03</span>
                                        <StatusChip variant={instStatus.inst03 ? 'success' : 'neutral'}>
                                          {instStatus.inst03 ? `Completed (${myPlacement.adviser_rating}/5.0)` : 'Pending Adviser'}
                                        </StatusChip>
                                      </div>
                                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                        Faculty Adviser &rarr; HTE Quality Audit
                                      </div>
                                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Submitted by your Faculty Practicum Adviser ({myPlacement.adviser_name}) upon auditing your placement.
                                      </div>
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                      Adviser-exclusive institutional audit instrument
                                    </div>
                                  </div>

                                  <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'space-between' }}>
                                    <div>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                        <span className="mono" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>INST-04</span>
                                        <StatusChip variant={instStatus.inst04 ? 'success' : 'warning'}>
                                          {instStatus.inst04 ? `Submitted (${myPlacement.student_adviser_rating}/5.0)` : 'Action Required'}
                                        </StatusChip>
                                      </div>
                                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
                                        Student &rarr; Faculty OJT Adviser
                                      </div>
                                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Evaluate faculty supervision, monitoring responsiveness, and academic guidance.
                                      </div>
                                    </div>
                                    <div>
                                      <button
                                        type="button"
                                        className={`btn btn-sm ${instStatus.inst04 ? 'btn-secondary' : 'btn-primary'}`}
                                        onClick={() => {
                                          setForcedEvalInstrumentId(null);
                                          setEvalInitialInstrumentId('student_to_adviser');
                                          setOfficialEvalModalOpen(true);
                                        }}
                                      >
                                        <IconEvaluation size={13} />
                                        {instStatus.inst04 ? 'Review / Update INST-04' : 'Complete INST-04'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* STUDENT SIGNED PHYSICAL INST-02 CARD */}
                            <div
                              className={`notice-banner-card is-lg ${myPlacement?.signed_eval_filename ? '' : 'is-highlight'}`}
                            >
                              <div className="notice-banner-main">
                                <div
                                  className={`notice-banner-icon ${
                                    myPlacement?.signed_eval_filename ? 'is-success' : 'is-surface'
                                  }`}
                                >
                                  <IconFileText size={22} />
                                </div>
                                <div className="notice-banner-copy">
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      Signed Physical INST-02 Evaluation Copy (Paper Alternative)
                                    </span>
                                    <span
                                      className={`badge ${myPlacement?.signed_eval_filename ? 'badge-success' : 'badge-warning'}`}
                                      style={{ fontSize: '10.5px' }}
                                    >
                                      {myPlacement?.signed_eval_filename ? 'Signed Scan on File' : 'Optional Paper Fallback'}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                                    {myPlacement?.signed_eval_filename ? (
                                      <>
                                        File: <strong>{myPlacement.signed_eval_filename}</strong> (Uploaded on {myPlacement.signed_eval_uploaded_at || 'Recent'}) &middot; Accepted toward your INST-02 supervisor evaluation requirement for adviser &amp; admin clearance verification.
                                      </>
                                    ) : (
                                      <>
                                        If your HTE Supervisor prefers wet-ink signing over the shareable portal link, print the blank INST-02 form, have your supervisor sign it, and upload the PDF or photo scan here.
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="notice-banner-actions">
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => setSupervisorShareModalOpen(true)}
                                >
                                  <IconLink size={13} />
                                  Share Supervisor Portal
                                </button>
                                <button
                                  type="button"
                                  className="btn btn-primary btn-sm"
                                  onClick={() => {
                                    setSignedEvalPlacement(myPlacement);
                                    setSignedEvalModalOpen(true);
                                  }}
                                >
                                  <IconUpload size={13} />
                                  {myPlacement?.signed_eval_filename ? 'Manage Signed INST-02' : 'Upload Signed INST-02'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}

                        {myEvaluations.length === 0 ? (
                          <div className="panel">
                            <div className="panel-body" style={{ padding: '28px', textAlign: 'center', color: '#6b7280' }}>
                              No evaluation records have been submitted for your placement yet. Start by submitting your own feedback for your HTE Supervisor (INST-01) and Faculty OJT Adviser (INST-04).
                            </div>
                          </div>
                        ) : (
                          <div className="equal-grid">
                            {myEvaluations.map((ev) => {
                              const instMeta = ev.instrument_type ? getInstrumentById(ev.instrument_type) : null;
                              const isOwnStudentFeedback = ev.evaluator_type === 'student';
                              const subtitleLabel = instMeta
                                ? `${instMeta.code} · ${instMeta.shortTitle || instMeta.title}`
                                : ev.evaluator_type === 'employer'
                                ? 'INST-02 · HTE Training Supervisor Evaluation'
                                : 'INST-03 · Faculty Practicum Adviser Evaluation';
                              return (
                                <div key={ev.eval_id} className="panel">
                                  <div className="panel-header">
                                    <div>
                                      <div className="panel-title">{ev.evaluator_name}</div>
                                      <div className="panel-desc">
                                        {subtitleLabel} &middot; {ev.date_evaluated}
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <StatusChip variant="success">
                                        {Number(ev.rating).toFixed(2)} / 5.00
                                      </StatusChip>
                                      {isOwnStudentFeedback && (
                                        <button
                                          type="button"
                                          className="btn btn-ghost btn-xs"
                                          onClick={() => {
                                            setForcedEvalInstrumentId(null);
                                            setEvalInitialInstrumentId(
                                              ev.instrument_type || 'student_to_supervisor'
                                            );
                                            setOfficialEvalModalOpen(true);
                                          }}
                                          title="Update your submitted evaluation"
                                        >
                                          <IconEdit size={12} />
                                          Edit
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <div className="panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div className="field-grid-3">
                                      <div style={{ padding: '8px 10px', background: '#f8f9fa', borderRadius: '5px' }}>
                                        <div className="kv-label">{instMeta ? 'Domain I' : 'Technical'}</div>
                                        <div className="kv-value mono">{ev.technical_score} / 5.00</div>
                                      </div>
                                      <div style={{ padding: '8px 10px', background: '#f8f9fa', borderRadius: '5px' }}>
                                        <div className="kv-label">{instMeta ? 'Domain II' : 'Work Ethic'}</div>
                                        <div className="kv-value mono">{ev.attitude_score} / 5.00</div>
                                      </div>
                                      <div style={{ padding: '8px 10px', background: '#f8f9fa', borderRadius: '5px' }}>
                                        <div className="kv-label">{instMeta ? 'Domain III' : 'Attendance'}</div>
                                        <div className="kv-value mono">{ev.attendance_score} / 5.00</div>
                                      </div>
                                    </div>
                                    <div>
                                      <div className="kv-label">Evaluator Remarks</div>
                                      <p style={{ fontSize: '12.5px', color: '#374151', marginTop: '4px', lineHeight: 1.55 }}>
                                        &ldquo;{ev.comments}&rdquo;
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  <div className="page-header">
                    <div>
                      <h1 className="page-title">
                        {currentUser.role === 'adviser'
                          ? 'Faculty HTE Audits & Placement Evaluations'
                          : currentUser.role === 'supervisor'
                          ? 'Company Intern Evaluations (INST-02)'
                          : 'Student Performance Evaluations'}
                      </h1>
                      <p className="page-subtitle">
                        {currentUser.role === 'adviser'
                          ? 'Submit Institutional HTE Quality Audits (INST-03) and review trainee evaluations & uploaded signed INST-02 scans'
                          : currentUser.role === 'supervisor'
                          ? 'Evaluate assigned student trainees using the official INST-02 Trainee & School rubric'
                          : 'Full 360-degree rubric oversight across all 4 practicum evaluation instruments (INST-01 to INST-04)'}
                      </p>
                    </div>
                    <div className="page-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setForcedEvalInstrumentId(null);
                          setEvalInitialInstrumentId(
                            currentUser.role === 'adviser'
                              ? 'adviser_to_hte'
                              : currentUser.role === 'supervisor'
                              ? 'supervisor_to_student'
                              : null
                          );
                          setOfficialEvalModalOpen(true);
                        }}
                      >
                        <IconEvaluation size={13} />
                        {currentUser.role === 'adviser'
                          ? 'HTE Quality Audit Form (INST-03)'
                          : currentUser.role === 'supervisor'
                          ? 'Official INST-02 Rubric Form'
                          : 'Official 360° Rubrics & Forms'}
                      </button>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => {
                          setEditingEvalId(null);
                          const pool =
                            currentUser.role === 'supervisor'
                              ? supervisorPlacements
                              : currentUser.role === 'adviser' && adviserScopeOnly
                              ? data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
                              : data.placements;
                          const targetPl = pool[0] || data.placements[0];
                          setEvalForm({
                            placement_id: String(targetPl?.placement_id || 1),
                            evaluator_type: currentUser.role === 'supervisor' ? 'employer' : 'adviser',
                            instrument_type:
                              currentUser.role === 'supervisor' ? 'supervisor_to_student' : 'adviser_to_hte',
                            evaluator_name: currentUser.display_name,
                            technical_score: '5.00',
                            attitude_score: '5.00',
                            attendance_score: '5.00',
                            comments: '',
                            date_evaluated: new Date().toISOString().slice(0, 10),
                          });
                          setEvalModalOpen(true);
                        }}
                      >
                        <IconPlus size={13} />
                        {currentUser.role === 'adviser'
                          ? 'Quick HTE Audit (INST-03)'
                          : currentUser.role === 'supervisor'
                          ? 'Quick Intern Eval (INST-02)'
                          : 'Submit Quick Evaluation'}
                      </button>
                    </div>
                  </div>

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Submitted Evaluations</div>
                    <div className="panel-desc">All recorded 360-degree rubrics, supervisor, and adviser ratings</div>
                  </div>
                </div>
                <div className="panel-toolbar dtr-panel-toolbar">
                  <div className="dtr-toolbar-left">
                    <div className="search-box">
                      <IconSearch size={14} />
                      <input
                        type="text"
                        placeholder="Search student or evaluator..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>

                    {/* MATERIAL DESIGN 3 (M3) EVALUATION FILTER INSIDE TABLE TOOLBAR */}
                    <div className="table-filter-pills m3-filter-wrap">
                      <SegmentedControl
                        className="dtr-status-segmented"
                        items={[
                          {
                            value: 'all',
                            label: (
                              <span className="seg-filter-item">
                                <span>All Evaluations</span>
                                <span className="filter-pill-count">{evalCounts.all}</span>
                              </span>
                            ),
                          },
                          {
                            value: 'employer',
                            label: (
                              <span className="seg-filter-item">
                                <span>Supervisor Ratings</span>
                                <span className="filter-pill-count">{evalCounts.employer}</span>
                              </span>
                            ),
                          },
                          {
                            value: 'adviser',
                            label: (
                              <span className="seg-filter-item">
                                <span>Adviser Endorsements</span>
                                <span className="filter-pill-count">{evalCounts.adviser}</span>
                              </span>
                            ),
                          },
                          {
                            value: 'student',
                            label: (
                              <span className="seg-filter-item">
                                <span>Student Feedback</span>
                                <span className="filter-pill-count">{evalCounts.student}</span>
                              </span>
                            ),
                          },
                        ]}
                        value={evalQuickFilter}
                        onValueChange={(val) => {
                          setEvalQuickFilter(val);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Student</th>
                        <th>Evaluator</th>
                        <th className="text-right">Score</th>
                        <th>Remarks</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvaluations.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)' }}>
                            No evaluations match the selected filter or search query.
                          </td>
                        </tr>
                      ) : filteredEvaluations.map((ev) => (
                                <tr
                                  key={ev.eval_id}
                                  className={Number(editingEvalId) === Number(ev.eval_id) ? 'is-editing' : ''}
                                >
                                  <td className="mono">{ev.date_evaluated}</td>
                                  <td>
                                    <div className="row-title">{ev.student_name}</div>
                                    <div className="row-sub">{ev.company_name}</div>
                                  </td>
                                  <td>
                                    <div className="row-title">{ev.evaluator_name}</div>
                                    <div className="row-sub" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span>{ev.evaluator_type}</span>
                                      {ev.instrument_type && (
                                        <span
                                          style={{
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            background: 'var(--bg-surface-elevated, #f1f5f9)',
                                            border: '1px solid var(--border-default)',
                                          }}
                                        >
                                          {ev.instrument_type === 'supervisor_to_student'
                                            ? 'INST-02 · Trainee Rubric'
                                            : ev.instrument_type === 'student_to_supervisor'
                                            ? 'INST-01 · Supervisor Eval'
                                            : ev.instrument_type === 'adviser_to_hte'
                                            ? 'INST-03 · HTE Audit'
                                            : ev.instrument_type === 'student_to_adviser'
                                            ? 'INST-04 · Faculty Eval'
                                            : ev.instrument_type}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="text-right mono tabular-nums" style={{ fontWeight: 600 }}>
                                    {Number(ev.rating).toFixed(2)}
                                  </td>
                                  <td style={{ maxWidth: '280px', color: '#374151' }}>{ev.comments}</td>
                                  <td className="text-right">
                                    <div className="row-actions">
                                      <button
                                        type="button"
                                        className="btn btn-ghost"
                                        title="Open Official Rubrics & Print Form"
                                        onClick={() => {
                                          setForcedEvalInstrumentId(null);
                                          if (currentUser.role === 'admin' && ev.instrument_type) {
                                            setEvalInitialInstrumentId(ev.instrument_type);
                                          }
                                          setOfficialEvalModalOpen(true);
                                        }}
                                      >
                                        <IconPrinter size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-ghost"
                                        title="Edit evaluation"
                                        onClick={() => handleStartEditEvaluation(ev)}
                                      >
                                        <IconEdit size={13} />
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-ghost-danger"
                                        title="Delete evaluation"
                                        onClick={() => requestDeleteEvaluation(ev)}
                                      >
                                        <IconTrash size={13} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                </>
              )}
            </>
          )}

          {/* =================================================================
              FACULTY SUPERVISION (ADMIN — FULL ADVISER CRUD + FILTERING)
              ================================================================= */}
          {activeTab === 'adviser-monitoring' && currentUser.role === 'admin' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Faculty Supervision</h1>
                  <p className="page-subtitle">
                    Manage faculty OJT advisers and inspect their assigned student placements
                  </p>
                </div>
                <div className="page-actions">
                  {selectedAdviserFilter !== 'all' && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedAdviserFilter('all')}
                    >
                      Show All Advisers
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      setEditingAdviserId(null);
                      setAdviserForm({
                        employee_number: '',
                        full_name: '',
                        department: 'Computer Engineering Department',
                        email: '',
                        contact_number: '',
                        username: '',
                      });
                      setShowAdviserForm(true);
                    }}
                  >
                    <IconPlus size={13} />
                    Add Faculty Adviser
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setSuperviseForm((prev) => ({
                        ...prev,
                        adviser_id:
                          selectedAdviserFilter !== 'all'
                            ? String(selectedAdviserFilter)
                            : String(data.advisers[0]?.adviser_id || 1),
                        employer_id: String(data.employers[0]?.employer_id || 1),
                        student_id: String(data.students[0]?.student_id || 1),
                      }));
                      setShowSuperviseForm(true);
                    }}
                  >
                    <IconPlus size={13} />
                    Add Student to Supervise
                  </button>
                </div>
              </div>

              <div
                className="metric-strip metric-strip-advisers"
                style={{ '--adviser-cols': Math.min(3, Math.max(1, data.advisers.length)) }}
              >
                {data.advisers.map((adv) => {
                  const isSelected = String(selectedAdviserFilter) === String(adv.adviser_id);
                  return (
                    <div
                      key={adv.adviser_id}
                      className={`metric-cell interactive ${isSelected ? 'selected' : ''}`}
                      onClick={() =>
                        setSelectedAdviserFilter(isSelected ? 'all' : String(adv.adviser_id))
                      }
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="metric-label">{adv.employee_number}</span>
                        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            title="Add student to this adviser"
                            onClick={() => {
                              setSelectedAdviserFilter(String(adv.adviser_id));
                              setSuperviseForm((prev) => ({
                                ...prev,
                                adviser_id: String(adv.adviser_id),
                                employer_id: String(data.employers[0]?.employer_id || 1),
                                student_id: String(data.students[0]?.student_id || 1),
                              }));
                              setShowSuperviseForm(true);
                            }}
                          >
                            <IconPlus size={12} />
                            Student
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => handleStartEditAdviser(adv)}
                          >
                            <IconEdit size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn btn-ghost-danger"
                            title="Delete adviser"
                            onClick={() => requestDeleteAdviser(adv)}
                          >
                            <IconTrash size={12} />
                          </button>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '13.5px', color: '#111827', margin: '2px 0' }}>
                        {adv.full_name}
                      </div>
                      <span className="metric-foot">
                        {adv.total_supervised} supervised · {adv.clearance_ready_count} cleared ·{' '}
                        {adv.pending_adviser_evals} pending eval
                      </span>
                    </div>
                  );
                })}
              </div>

              {data.students.some((s) => !s.placement_id) && (
                <div className="panel">
                  <div className="panel-header">
                    <div>
                      <div className="panel-title">Unassigned Students Awaiting Faculty Supervision</div>
                      <div className="panel-desc">
                        The following registered BS CpE students do not have an active OJT placement or adviser yet
                      </div>
                    </div>
                  </div>
                  <div className="panel-body" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {data.students
                      .filter((s) => !s.placement_id)
                      .map((st) => (
                        <div
                          key={st.student_id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '14px',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            border: '1px solid #fde68a',
                            background: '#fffbeb',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#111827' }}>
                              {st.full_name}
                            </div>
                            <div className="mono" style={{ fontSize: '11px', color: '#6b7280' }}>
                              {st.student_number} · {st.section}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setSuperviseMode('existing');
                              setSuperviseForm((prev) => ({
                                ...prev,
                                student_id: String(st.student_id),
                                adviser_id:
                                  selectedAdviserFilter !== 'all'
                                    ? String(selectedAdviserFilter)
                                    : String(data.advisers[0]?.adviser_id || 1),
                                employer_id: String(data.employers[0]?.employer_id || 1),
                              }));
                              setShowSuperviseForm(true);
                            }}
                          >
                            <IconPlus size={12} />
                            Assign Adviser &amp; HTE
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="panel">
                <div className="panel-toolbar">
                  <div className="search-box">
                    <IconSearch size={14} />
                    <input
                      type="text"
                      placeholder="Filter supervised students by name, number, company, or adviser..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <MaterialSelect
                    className="select-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="dropped">Dropped</option>
                  </MaterialSelect>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Faculty Adviser</th>
                        <th>Student</th>
                        <th>Host Company</th>
                        <th>Last Attendance</th>
                        <th className="text-right">Hours</th>
                        <th>Completion</th>
                        <th>Evaluations</th>
                        <th>Clearance</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlacements.map((pl) => (
                        <tr key={pl.placement_id}>
                          <td>
                            <MaterialSelect
                              className="select-sm"
                              value={pl.adviser_id}
                              onChange={(e) =>
                                handleReassignPlacementAdviser(pl.placement_id, e.target.value)
                              }
                            >
                              {data.advisers.map((adv) => (
                                <option key={adv.adviser_id} value={adv.adviser_id}>
                                  {adv.full_name}
                                </option>
                              ))}
                            </MaterialSelect>
                            <div className="row-sub mono" style={{ marginTop: '2px' }}>
                              {pl.adviser_code}
                            </div>
                          </td>
                          <td>
                            <div className="row-title">{pl.student_name}</div>
                            <div className="row-sub mono">
                              {pl.student_number} · {pl.section}
                            </div>
                          </td>
                          <td>
                            <div className="row-title">{pl.company_name}</div>
                            <div className="row-sub">{pl.position_title}</div>
                          </td>
                          <td className="mono">{pl.last_logged_date || '—'}</td>
                          <td className="text-right mono tabular-nums">
                            {Number(pl.total_hours_completed).toFixed(1)} / {Number(pl.required_hours).toFixed(0)}
                          </td>
                          <td>
                            <div className="inline-progress">
                              <div className="inline-progress-track">
                                <div
                                  className={`inline-progress-fill ${
                                    Number(pl.requirement_met) === 1 ? 'done' : ''
                                  }`}
                                  style={{ width: `${Math.min(100, Number(pl.completion_percentage))}%` }}
                                />
                              </div>
                              <span className="inline-progress-pct">{pl.completion_percentage}%</span>
                            </div>
                          </td>
                          <td>
                            {(() => {
                              const inst = getPlacementInstrumentStatus(pl);
                              const studCount = (inst.inst01 ? 1 : 0) + (inst.inst04 ? 1 : 0);
                              return (
                                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                  <StatusChip variant={inst.inst02 ? 'success' : 'neutral'}>
                                    INST-02: {inst.inst02Online ? pl.employer_rating : inst.inst02Signed ? 'Scan' : '—'}
                                  </StatusChip>
                                  <StatusChip variant={inst.inst03 ? 'success' : 'neutral'}>
                                    INST-03: {inst.inst03 ? pl.adviser_rating : '—'}
                                  </StatusChip>
                                  <StatusChip variant={studCount === 2 ? 'success' : 'neutral'}>
                                    Stud: {studCount}/2
                                  </StatusChip>
                                </div>
                              );
                            })()}
                          </td>
                          <td>
                            {Number(pl.requirement_met) === 1 ? (
                              <StatusChip variant="success">Cleared</StatusChip>
                            ) : (
                              <StatusChip variant="warning">Pending</StatusChip>
                            )}
                          </td>
                          <td className="text-right">
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => jumpToPlacementLogs(pl)}
                              >
                                Logs
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => setSelectedDtrPlacement(pl)}
                              >
                                DTR
                              </button>
                              {pl.signed_eval_filename && (
                                <button
                                  type="button"
                                  className="btn btn-tonal"
                                  onClick={() => {
                                    setSignedEvalPlacement(pl);
                                    setSignedEvalModalOpen(true);
                                  }}
                                  title={`View signed physical INST-02 scan: ${pl.signed_eval_filename}`}
                                >
                                  Scan
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => jumpToEvaluatePlacement(pl)}
                              >
                                Evaluate
                              </button>
                              {Number(pl.requirement_met) !== 1 && (
                                <button
                                  type="button"
                                  className="btn btn-ghost"
                                  style={{ color: '#15803d', fontWeight: 500 }}
                                  onClick={() => handleEndorseClearance(pl.placement_id)}
                                  disabled={syncing}
                                >
                                  Endorse
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenClearanceCertificate(pl)}
                              >
                                Certificate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              CLEARANCE REPORTS (ADVISER & ADMIN)
              ================================================================= */}
          {activeTab === 'compliance' && (currentUser.role === 'admin' || currentUser.role === 'adviser') && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">
                    {currentUser.role === 'adviser' ? 'Clearance Endorsements' : 'Compliance & Clearance Reports'}
                  </h1>
                  <p className="page-subtitle">
                    Students who have completed required training hours and received performance evaluations
                  </p>
                </div>
                <div className="page-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSyncCompliance}
                    disabled={syncing}
                  >
                    <IconRefresh size={13} />
                    Recalculate
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleExportComplianceCsv}>
                    <IconDownload size={13} />
                    Export CSV
                  </button>
                  <button type="button" className="btn btn-primary btn-sm" onClick={() => window.print()}>
                    <IconPrinter size={13} />
                    Print Report
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="panel-toolbar no-print">
                  <div className="search-box">
                    <IconSearch size={14} />
                    <input
                      type="text"
                      placeholder="Filter clearance reports by student, reference code, or company..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Clearance Ref</th>
                        <th>Student</th>
                        <th>Host Company</th>
                        <th className="text-right">Rendered Hours</th>
                        <th>Hours Requirement</th>
                        <th>Evaluation</th>
                        <th>Status</th>
                        <th className="no-print text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.compliance_reports
                        .filter((cr) => {
                          if (currentUser.role === 'adviser' && adviserScopeOnly) {
                            if (Number(cr.adviser_id) !== Number(currentUser.linked_id)) return false;
                          }
                          if (!searchQuery.trim()) return true;
                          const q = searchQuery.toLowerCase();
                          return (
                            cr.student_name?.toLowerCase().includes(q) ||
                            cr.student_number?.toLowerCase().includes(q) ||
                            cr.company_name?.toLowerCase().includes(q) ||
                            cr.adviser_name?.toLowerCase().includes(q) ||
                            cr.clearance_reference?.toLowerCase().includes(q)
                          );
                        })
                        .map((cr) => {
                          const instStatus = getPlacementInstrumentStatus(cr);
                          const hoursMet = Number(cr.total_hours_completed) >= Number(cr.required_hours);
                          const evalMet = instStatus.allInstrumentsMet;
                          const isEligible = Number(cr.requirement_met) === 1;

                          return (
                            <tr key={cr.report_id}>
                              <td className="mono">
                                {cr.clearance_reference ? (
                                  <span style={{ color: '#15803d', fontWeight: 600 }}>{cr.clearance_reference}</span>
                                ) : (
                                  <span style={{ color: '#9ca3af' }}>—</span>
                                )}
                              </td>
                              <td>
                                <div className="row-title">{cr.student_name}</div>
                                <div className="row-sub mono">
                                  {cr.student_number} · {cr.section}
                                </div>
                              </td>
                              <td>
                                <div className="row-title">{cr.company_name}</div>
                                <div className="row-sub">Adviser: {cr.adviser_name}</div>
                              </td>
                              <td className="text-right mono tabular-nums">
                                {Number(cr.total_hours_completed).toFixed(2)} / {Number(cr.required_hours).toFixed(0)} hrs
                              </td>
                              <td>
                                {hoursMet ? (
                                  <StatusChip variant="success">Met ({cr.completion_percentage}%)</StatusChip>
                                ) : (
                                  <StatusChip variant="warning">
                                    {Number(cr.hours_remaining).toFixed(1)} hrs short
                                  </StatusChip>
                                )}
                              </td>
                              <td>
                                {evalMet ? (
                                  <StatusChip variant="success">
                                    4/4 Verified ({cr.average_rating}/5.0)
                                  </StatusChip>
                                ) : (
                                  <StatusChip variant={instStatus.completedCount > 0 ? 'warning' : 'neutral'}>
                                    {instStatus.completedCount}/4 Instruments
                                  </StatusChip>
                                )}
                                {cr.signed_eval_filename && (
                                  <div className="row-sub" style={{ marginTop: '3px' }}>
                                    Signed INST-02 scan on file
                                  </div>
                                )}
                              </td>
                              <td>
                                {isEligible ? (
                                  <StatusChip variant="success">Cleared</StatusChip>
                                ) : cr.placement_status === 'dropped' ? (
                                  <StatusChip variant="danger">Dropped</StatusChip>
                                ) : (
                                  <StatusChip variant="warning">Incomplete</StatusChip>
                                )}
                              </td>
                              <td className="no-print text-right">
                                <div className="row-actions">
                                  {!isEligible && (
                                    <button
                                      type="button"
                                      className="btn btn-primary btn-sm"
                                      onClick={() => handleEndorseClearance(cr.placement_id)}
                                      disabled={syncing}
                                    >
                                      <IconCheckCircle size={12} />
                                      Endorse &amp; Clear
                                    </button>
                                  )}
                                  {cr.signed_eval_filename && (
                                    <button
                                      type="button"
                                      className="btn btn-tonal btn-sm"
                                      onClick={() => {
                                        setSignedEvalPlacement(cr);
                                        setSignedEvalModalOpen(true);
                                      }}
                                      title={`View signed INST-02 scan: ${cr.signed_eval_filename}`}
                                    >
                                      Signed INST-02
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="btn btn-ghost"
                                    onClick={() => jumpToEvaluatePlacement(cr)}
                                  >
                                    Evaluate
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => handleOpenClearanceCertificate(cr)}
                                  >
                                    <IconPrinter size={13} />
                                    Certificate
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              USER ACCOUNTS (ADMIN — FULL CRUD + ACTIVE TOGGLE + IMPERSONATE)
              ================================================================= */}
          {activeTab === 'admin' && currentUser.role === 'admin' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">User Accounts</h1>
                  <p className="page-subtitle">
                    Manage authentication accounts, roles, passwords, and active status
                  </p>
                </div>
                <div className="page-actions">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={requestResetDemo}
                    disabled={syncing}
                  >
                    <IconRefresh size={13} />
                    Reset Demo Data
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setEditingUserId(null);
                      setUserForm({
                        username: '',
                        password: 'password123',
                        role: 'student',
                        linked_id: '',
                        is_active: 1,
                      });
                      setShowUserForm(true);
                    }}
                  >
                    <IconPlus size={13} />
                    Add User Account
                  </button>
                </div>
              </div>

              <div className="panel">
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Account Holder</th>
                        <th>Department / Section</th>
                        <th>Account Status</th>
                        <th>Last Login</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((u) => (
                        <tr
                          key={u.user_id}
                          className={Number(editingUserId) === Number(u.user_id) ? 'is-editing' : ''}
                        >
                          <td>
                            <div className="mono row-title">{u.username}</div>
                            <div
                              className="row-sub"
                              style={{
                                color: Number(u.has_custom_password) === 1 ? '#0f7b4f' : '#6b7280',
                              }}
                            >
                              {Number(u.has_custom_password) === 1
                                ? 'Custom password saved (encrypted)'
                                : 'Default demo password'}
                            </div>
                          </td>
                          <td>
                            <StatusChip
                              variant={
                                u.role === 'admin'
                                  ? 'danger'
                                  : u.role === 'supervisor'
                                  ? 'warning'
                                  : u.role === 'adviser'
                                  ? 'info'
                                  : 'success'
                              }
                            >
                              {u.role}
                            </StatusChip>
                          </td>
                          <td>
                            <div className="row-title">{u.display_name}</div>
                            <div className="row-sub mono">{u.identifier_code}</div>
                          </td>
                          <td>{u.unit_label}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              onClick={() => handleToggleUserActive(u)}
                            >
                              {Number(u.is_active) === 1 ? (
                                <StatusChip variant="success">Active</StatusChip>
                              ) : u.role === 'adviser' && !u.last_login ? (
                                <StatusChip variant="warning">Pending Approval</StatusChip>
                              ) : (
                                <StatusChip variant="danger">Disabled</StatusChip>
                              )}
                            </button>
                          </td>
                          <td className="mono" style={{ color: '#6b7280' }}>
                            {u.last_login || 'Never'}
                          </td>
                          <td className="text-right">
                            <div className="row-actions">
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => handleStartEditUser(u)}
                              >
                                <IconEdit size={13} />
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleLogin(null, u.username)}
                              >
                                Switch
                              </button>
                              {u.user_id !== 1 && Number(u.user_id) !== Number(currentUser?.user_id) && (
                                <button
                                  type="button"
                                  className="btn btn-ghost-danger"
                                  title="Delete user"
                                  onClick={() => requestDeleteUser(u)}
                                >
                                  <IconTrash size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* =================================================================
              SYSTEM SCHEMA (ADMIN ONLY)
              ================================================================= */}
          {activeTab === 'database-erd' && currentUser.role === 'admin' && (
            <>
              <div className="page-header">
                <div>
                  <h1 className="page-title">System Schema &amp; ERD</h1>
                  <p className="page-subtitle">
                    Relational tables, foreign key cardinality matrix, and SQL aggregation queries
                  </p>
                </div>
              </div>
              <DatabaseInspectorView
                systemInfo={data.system_info}
                data={data}
                onSyncCompliance={handleSyncCompliance}
                onResetDemo={requestResetDemo}
                syncing={syncing}
              />
            </>
          )}
                </>
                );
              })()}
            </div>
          )}
        </main>
      </div>

      {/* MOBILE BOTTOM QUICK NAVIGATION BAR (Phone viewports) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile quick navigation">
        {(() => {
          const role = currentUser.role;
          const items =
            role === 'student'
              ? [
                  { id: 'dashboard', label: 'Overview', icon: IconDashboard },
                  { id: 'timelogs', label: 'Logs', icon: IconClock },
                  { id: 'evaluations', label: 'Clearance', icon: IconShieldCheck },
                  { id: 'employers', label: 'Partners', icon: IconBuilding },
                ]
              : role === 'supervisor'
              ? [
                  { id: 'dashboard', label: 'Overview', icon: IconDashboard },
                  { id: 'timelogs', label: 'Queue', icon: IconClock },
                  { id: 'evaluations', label: 'Evals', icon: IconEvaluation },
                  { id: 'employers', label: 'Company', icon: IconBuilding },
                ]
              : role === 'adviser'
              ? [
                  { id: 'dashboard', label: 'Overview', icon: IconDashboard },
                  { id: 'timelogs', label: 'Logs', icon: IconClock },
                  { id: 'evaluations', label: 'Evals', icon: IconEvaluation },
                  { id: 'compliance', label: 'Clearance', icon: IconShieldCheck },
                ]
              : [
                  { id: 'dashboard', label: 'Overview', icon: IconDashboard },
                  { id: 'placements', label: 'Placements', icon: IconBriefcase },
                  { id: 'timelogs', label: 'Logs', icon: IconClock },
                  { id: 'compliance', label: 'Clearance', icon: IconShieldCheck },
                ];
          const hasOverflowDrawerTabs = role === 'adviser' || role === 'admin';
          return (
            <>
              {items.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id);
                      scrollWorkspaceToTop();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <IconComp size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {hasOverflowDrawerTabs && (
                <button
                  type="button"
                  className={`mobile-nav-item ${mobileMenuOpen ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen((prev) => !prev)}
                >
                  {mobileMenuOpen ? <IconClose size={18} /> : <IconMenu size={18} />}
                  <span>Menu</span>
                </button>
              )}
            </>
          );
        })()}
      </nav>

      <ClearanceModal
        report={selectedClearanceReport}
        currentUser={currentUser}
        onClose={() => setSelectedClearanceReport(null)}
      />

      <DtrModal
        placement={selectedDtrPlacement}
        logs={
          selectedDtrPlacement
            ? data.timelogs.filter(
                (tl) => Number(tl.placement_id) === Number(selectedDtrPlacement.placement_id)
              )
            : []
        }
        currentUser={currentUser}
        onClose={() => setSelectedDtrPlacement(null)}
      />

      <TimeLogEntryModal
        isOpen={timeLogModalOpen}
        onClose={() => {
          setTimeLogModalOpen(false);
          setEditingLogId(null);
        }}
        onSubmit={handleSaveTimeLog}
        logForm={logForm}
        setLogForm={setLogForm}
        editingLogId={editingLogId}
        currentUser={currentUser}
        placements={
          currentUser.role === 'supervisor'
            ? supervisorPlacements
            : currentUser.role === 'adviser' && adviserScopeOnly
            ? data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
            : data.placements
        }
        previewHours={computePreviewHours(logForm.time_in, logForm.time_out, logForm.break_minutes)}
        syncing={syncing}
      />

      <EvaluationEntryModal
        isOpen={evalModalOpen}
        onClose={() => {
          setEvalModalOpen(false);
          setEditingEvalId(null);
        }}
        onSubmit={handleSaveEvaluation}
        evalForm={evalForm}
        setEvalForm={setEvalForm}
        editingEvalId={editingEvalId}
        currentUser={currentUser}
        placements={
          currentUser.role === 'supervisor'
            ? supervisorPlacements
            : currentUser.role === 'adviser' && adviserScopeOnly
            ? data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
            : data.placements
        }
        previewComposite={previewEvalComposite}
        syncing={syncing}
      />

      <DtrTransferModal
        isOpen={dtrTransferModalOpen}
        onClose={() => setDtrTransferModalOpen(false)}
        placement={myPlacement || data.placements[0]}
        placements={
          currentUser?.role === 'adviser' && adviserScopeOnly
            ? data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
            : data.placements
        }
        currentUser={currentUser}
        timelogs={data.timelogs}
        onSuccess={(msg) => {
          showNotice(msg);
          fetchSystemData(true);
        }}
      />

      <SupervisorShareModal
        isOpen={supervisorShareModalOpen}
        onClose={() => setSupervisorShareModalOpen(false)}
        placement={myPlacement || data.placements[0]}
        onOpenSupervisorView={(p) => {
          setVerifyContext(p.placement_id, p.verify_token || null);
          setPublicSupervisorPlacementId(p.placement_id);
        }}
      />

      <SignedDtrUploadModal
        documentKind="dtr"
        isOpen={signedDtrModalOpen}
        onClose={() => setSignedDtrModalOpen(false)}
        placement={myPlacement || data.placements[0]}
        onSuccess={(msg) => {
          showNotice(msg);
          fetchSystemData(true);
        }}
      />

      <SignedDtrUploadModal
        documentKind="eval"
        isOpen={signedEvalModalOpen}
        onClose={() => {
          setSignedEvalModalOpen(false);
          setSignedEvalPlacement(null);
        }}
        placement={signedEvalPlacement || myPlacement || data.placements[0]}
        onOpenBlankForm={() => {
          setSignedEvalModalOpen(false);
          setSignedEvalPlacement(null);
          setForcedEvalInstrumentId('supervisor_to_student');
          setEvalInitialInstrumentId('supervisor_to_student');
          setOfficialEvalModalOpen(true);
        }}
        onSuccess={(msg) => {
          showNotice(msg);
          fetchSystemData(true);
        }}
      />

      <DtrAuditComparisonModal
        isOpen={auditModalOpen}
        onClose={() => {
          setAuditModalOpen(false);
          setAuditPlacement(null);
        }}
        placement={auditPlacement}
        placements={auditablePlacements}
        onSelectPlacement={(pl) => setAuditPlacement(pl)}
        timelogs={data.timelogs}
        currentUser={currentUser}
        onEndorseAll={async (placementId) => {
          try {
            const res = await apiFetch('/api/timelogs/approve-all', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                placement_id: placementId,
                target_status: 'approved',
                from_status: 'supervisor_verified',
              }),
            });
            const json = await res.json();
            if (json.ok) {
              showNotice('All supervisor-verified shifts endorsed to Practicum Coordinator / Admin!');
              await fetchSystemData(true);
              setAuditModalOpen(false);
            } else {
              showNotice(json.error || 'Failed to endorse shifts.', 'error');
            }
          } catch (err) {
            showNotice('Endorsement error: ' + err.message, 'error');
          }
        }}
        onUpdateApproval={handleUpdateTimeLogApproval}
      />

      <StudentProfileModal
        isOpen={showStudentForm}
        onClose={() => {
          setShowStudentForm(false);
          setEditingStudentId(null);
        }}
        onSubmit={handleSaveStudent}
        studentForm={studentForm}
        setStudentForm={setStudentForm}
        editingStudentId={editingStudentId}
        isStudentRole={currentUser?.role === 'student'}
        assignedPlacement={
          editingStudentId
            ? data.placements.find((p) => Number(p.student_id) === Number(editingStudentId)) || null
            : null
        }
        employers={data.employers}
        advisers={data.advisers}
        syncing={syncing}
      />

      <EmployerModal
        isOpen={showEmployerForm}
        onClose={() => {
          setShowEmployerForm(false);
          setEditingEmployerId(null);
        }}
        onSubmit={handleSaveEmployer}
        employerForm={employerForm}
        setEmployerForm={setEmployerForm}
        editingEmployerId={editingEmployerId}
        syncing={syncing}
      />

      <PlacementModal
        isOpen={showPlacementForm}
        onClose={() => {
          setShowPlacementForm(false);
          setEditingPlacementId(null);
        }}
        onSubmit={handleSavePlacement}
        placementForm={placementForm}
        setPlacementForm={setPlacementForm}
        editingPlacementId={editingPlacementId}
        students={data.students}
        employers={data.employers}
        advisers={data.advisers}
        syncing={syncing}
      />

      <AdviserModal
        isOpen={showAdviserForm}
        onClose={() => {
          setShowAdviserForm(false);
          setEditingAdviserId(null);
        }}
        onSubmit={handleSaveAdviser}
        adviserForm={adviserForm}
        setAdviserForm={setAdviserForm}
        editingAdviserId={editingAdviserId}
        syncing={syncing}
      />

      <UserAccountModal
        isOpen={showUserForm}
        onClose={() => {
          setShowUserForm(false);
          setEditingUserId(null);
        }}
        onSubmit={handleSaveUser}
        userForm={userForm}
        setUserForm={setUserForm}
        editingUserId={editingUserId}
        editingUser={
          data.users.find((u) => Number(u.user_id) === Number(editingUserId)) || null
        }
        students={data.students}
        employers={data.employers}
        advisers={data.advisers}
        syncing={syncing}
      />

      <SuperviseStudentModal
        isOpen={showSuperviseForm}
        onClose={() => setShowSuperviseForm(false)}
        onSubmit={handleSaveSuperviseStudent}
        superviseMode={superviseMode}
        setSuperviseMode={setSuperviseMode}
        superviseForm={superviseForm}
        setSuperviseForm={setSuperviseForm}
        currentUser={currentUser}
        students={data.students}
        employers={data.employers}
        advisers={data.advisers}
        syncing={syncing}
      />

      <OfficialEvaluationModal
        isOpen={officialEvalModalOpen}
        onClose={() => {
          setOfficialEvalModalOpen(false);
          setEvalInitialInstrumentId(null);
          setForcedEvalInstrumentId(null);
        }}
        placements={
          currentUser?.role === 'student' && myPlacement
            ? [myPlacement]
            : currentUser?.role === 'supervisor'
            ? supervisorPlacements
            : currentUser?.role === 'adviser' && adviserScopeOnly
            ? data.placements.filter((p) => Number(p.adviser_id) === Number(currentUser.linked_id))
            : data.placements
        }
        evaluations={data.evaluations}
        currentUser={currentUser}
        initialInstrumentId={evalInitialInstrumentId}
        forcedInstrumentId={forcedEvalInstrumentId}
        onOpenSignedEvalUpload={(pl) => {
          setOfficialEvalModalOpen(false);
          setEvalInitialInstrumentId(null);
          setForcedEvalInstrumentId(null);
          setSignedEvalPlacement(pl || myPlacement || data.placements[0]);
          setSignedEvalModalOpen(true);
        }}
        onSuccess={(msg) => {
          showNotice(msg);
          fetchSystemData(true);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        message={confirmDialog?.message}
        detail={confirmDialog?.detail}
        warning={confirmDialog?.warning}
        confirmLabel={confirmDialog?.confirmLabel}
        cancelLabel={confirmDialog?.cancelLabel}
        variant={confirmDialog?.variant || 'danger'}
        iconType={confirmDialog?.iconType || 'alert'}
        onConfirm={confirmDialog?.onConfirm}
        onClose={() => setConfirmDialog(null)}
      />

      <Snackbar message={toast?.message} type={toast?.type} onClose={dismissNotice} />
    </div>
  );
}
