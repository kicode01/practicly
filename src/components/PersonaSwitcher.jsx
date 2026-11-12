import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  IconStudent,
  IconSupervisor,
  IconShieldCheck,
  IconUser,
  IconSearch,
  IconCheck,
  IconClose,
  IconChevronDown,
  IconBuilding,
  IconLink,
  IconLogOut
} from './Icons';
import usePresence from '../utils/usePresence';

export default function PersonaSwitcher({
  currentUser,
  users = [],
  onSwitchUser,
  demoPresets = [],
  onOpenSupervisorView,
  onRequestLogout,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const popoverRef = useRef(null);
  const { rendered: dialogRendered, exiting: dialogExiting } = usePresence(isOpen, 150);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Normalize user list
  const userList = useMemo(() => {
    if (users && users.length > 0) {
      return users.map((u) => ({
        username: u.username,
        display_name: (u.display_name || u.name || '').replace(/\bPUP\b/g, 'MIT'),
        role: u.role,
        identifier_code: u.identifier_code || u.username,
        unit_label: (u.unit_label || '').replace(/\bPUP\b/g, 'MIT'),
        is_active: u.is_active !== undefined ? Number(u.is_active) : 1,
      }));
    }
    return demoPresets.map((p) => ({
      username: p.username,
      display_name: (p.name || '').replace(/\bPUP\b/g, 'MIT'),
      role: p.role,
      identifier_code: p.username,
      unit_label: p.unit || (p.role === 'supervisor' ? 'Host Training Establishment' : 'Computer Engineering'),
      is_active: 1,
    }));
  }, [users, demoPresets]);

  // Legitimate internal system roles: student, adviser, supervisor, admin
  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        u.display_name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q) ||
        u.identifier_code?.toLowerCase().includes(q) ||
        u.unit_label?.toLowerCase().includes(q)
      );
    });
  }, [userList, roleFilter, search]);

  const getRoleLabel = (role) => {
    switch (role) {
      case 'student':
        return 'Student Intern';
      case 'adviser':
        return 'Faculty Adviser';
      case 'supervisor':
        return 'HTE Supervisor';
      case 'admin':
        return 'Practicum Coordinator';
      default:
        return role;
    }
  };

  const getRoleIcon = (role, size = 18) => {
    switch (role) {
      case 'student':
        return <IconStudent size={size} />;
      case 'adviser':
        return <IconSupervisor size={size} />;
      case 'supervisor':
        return <IconSupervisor size={size} />;
      case 'admin':
        return <IconShieldCheck size={size} />;
      default:
        return <IconUser size={size} />;
    }
  };

  const studentCount = userList.filter((u) => u.role === 'student').length;
  const adviserCount = userList.filter((u) => u.role === 'adviser').length;
  const supervisorCount = userList.filter((u) => u.role === 'supervisor').length;
  const adminCount = userList.filter((u) => u.role === 'admin').length;

  return (
    <div className="m3-persona-switcher-wrapper" ref={popoverRef}>
      {/* GOOGLE PROFILE TRIGGER PILL */}
      <button
        type="button"
        className={`m3-persona-trigger ${isOpen ? 'is-expanded' : ''} m3-role-${currentUser?.role || 'student'}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="Switch active user persona or preview system from other accounts"
      >
        <div className="m3-trigger-avatar">
          {getRoleIcon(currentUser?.role, 16)}
        </div>
        <div className="m3-trigger-info">
          <span className="m3-trigger-name">{currentUser?.display_name || 'Select Account'}</span>
          <span className="m3-trigger-badge">
            {getRoleLabel(currentUser?.role)}
          </span>
        </div>
        <IconChevronDown size={18} className={`m3-trigger-chevron ${isOpen ? 'is-rotated' : ''}`} />
      </button>

      {/* 3. GOOGLE MATERIAL 3 ACCOUNT SWITCHER DIALOG / MENU */}
      {dialogRendered && (
        <div
          className={`m3-account-dialog ${dialogExiting ? 'is-exiting' : ''}`}
          role="dialog"
          aria-label="Switch Active Persona"
        >
          {/* A. CURRENT ACTIVE USER HERO CARD */}
          <div className="m3-active-card">
            <div className={`m3-active-avatar m3-role-${currentUser?.role || 'student'}`}>
              {getRoleIcon(currentUser?.role, 24)}
            </div>
            <div className="m3-active-details">
              <div className="m3-active-name">{currentUser?.display_name}</div>
              <div className="m3-active-meta">
                <span className="mono">{currentUser?.identifier_code || currentUser?.username}</span>
                {currentUser?.unit_label && <span> · {currentUser.unit_label}</span>}
              </div>
              <div className="m3-active-tag-row">
                <span className={`m3-role-chip m3-role-${currentUser?.role || 'student'}`}>
                  {getRoleLabel(currentUser?.role)}
                </span>
                <span className="m3-session-status">
                  <IconCheck size={12} />
                  <span>Current Active Session</span>
                </span>
              </div>
            </div>
            {onRequestLogout && (
              <button
                type="button"
                className="m3-active-signout-btn"
                onClick={() => {
                  setIsOpen(false);
                  onRequestLogout();
                }}
                title="Sign out of current account"
              >
                <IconLogOut size={14} />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          <div className="m3-dialog-divider" />

          {/* B. SEARCH INPUT BAR */}
          <div className="m3-dialog-search">
            <IconSearch size={18} className="m3-search-icon" />
            <input
              type="text"
              className="m3-search-input"
              placeholder="Search name, role, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button
                type="button"
                className="m3-search-clear"
                onClick={() => setSearch('')}
                aria-label="Clear search"
              >
                <IconClose size={16} />
              </button>
            )}
          </div>

          {/* C. M3 FILTER CHIPS (NO SCROLLBAR) */}
          <div className="m3-filter-chip-row" role="radiogroup" aria-label="Filter roles">
            <button
              type="button"
              className={`m3-filter-chip ${roleFilter === 'all' ? 'is-active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              All ({userList.length})
            </button>
            <button
              type="button"
              className={`m3-filter-chip ${roleFilter === 'student' ? 'is-active' : ''}`}
              onClick={() => setRoleFilter('student')}
            >
              Students ({studentCount})
            </button>
            <button
              type="button"
              className={`m3-filter-chip ${roleFilter === 'adviser' ? 'is-active' : ''}`}
              onClick={() => setRoleFilter('adviser')}
            >
              Advisers ({adviserCount})
            </button>
            <button
              type="button"
              className={`m3-filter-chip ${roleFilter === 'supervisor' ? 'is-active' : ''}`}
              onClick={() => setRoleFilter('supervisor')}
            >
              Supervisors ({supervisorCount})
            </button>
            <button
              type="button"
              className={`m3-filter-chip ${roleFilter === 'admin' ? 'is-active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              Admin ({adminCount})
            </button>
          </div>

          {/* D. PERSONA LIST */}
          <div className="m3-persona-list-container">
            <div className="m3-list-section-title">
              <span>Switch Active Account</span>
              <span className="m3-list-count">{filteredUsers.length} available</span>
            </div>

            <div className="m3-persona-items-scroll">
              {filteredUsers.length === 0 ? (
                <div className="m3-persona-empty">
                  No matching accounts found for "{search}"
                </div>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = currentUser?.username === u.username;
                  return (
                    <button
                      key={u.username}
                      type="button"
                      className={`m3-persona-row ${isCurrent ? 'is-current' : ''}`}
                      onClick={() => {
                        onSwitchUser(u.username);
                        setIsOpen(false);
                      }}
                    >
                      <div className={`m3-persona-row-avatar m3-role-${u.role}`}>
                        {getRoleIcon(u.role, 18)}
                      </div>
                      <div className="m3-persona-row-body">
                        <div className="m3-persona-row-top">
                          <span className="m3-persona-row-name">{u.display_name}</span>
                          <span className={`m3-role-chip m3-role-${u.role}`}>
                            {getRoleLabel(u.role)}
                          </span>
                          {u.is_active === 0 && (
                            <span
                              className="m3-role-chip"
                              style={{
                                background: '#fef3c7',
                                color: '#92400e',
                                border: '1px solid #fde68a',
                                fontSize: '10px',
                                padding: '1px 6px',
                              }}
                            >
                              Inactive / Pending
                            </span>
                          )}
                        </div>
                        <div className="m3-persona-row-sub">
                          <span className="mono">{u.username}</span>
                          {u.unit_label && <span> · {u.unit_label}</span>}
                        </div>
                      </div>
                      {isCurrent && (
                        <div className="m3-persona-current-check" title="Currently Selected">
                          <IconCheck size={18} />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="m3-dialog-divider" />

          {/* E. HTE SUPERVISOR VERIFICATION NOTICE CARD */}
          <div className="m3-supervisor-card">
            <div className="m3-supervisor-icon-box">
              <IconBuilding size={18} />
            </div>
            <div className="m3-supervisor-info">
              <div className="m3-supervisor-title">HTE Supervisor Portal</div>
              <div className="m3-supervisor-desc">
                Supervisors verify attendance via student shareable links without requiring an account.
              </div>
            </div>
            {onOpenSupervisorView && (
              <button
                type="button"
                className="m3-supervisor-preview-btn"
                onClick={() => {
                  setIsOpen(false);
                  onOpenSupervisorView();
                }}
                title="Preview the passwordless supervisor verification screen"
              >
                <IconLink size={13} />
                <span>Preview</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
