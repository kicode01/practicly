import React from 'react';

/**
 * Google Material Symbols & Design Icons
 * Based on https://github.com/google/material-design-icons
 */

function MaterialSymbol({ name, size = 18, className = '', style = {}, fill = 0 }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: `${size}px`,
        width: `${size}px`,
        height: `${size}px`,
        lineHeight: `${size}px`,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        userSelect: 'none',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}

export function IconBrandLogo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block', flexShrink: 0 }}
      role="img"
      aria-label="Practicly Emblem"
    >
      <defs>
        <linearGradient id="practiclyBg" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0b57d0" />
          <stop offset="50%" stopColor="#1a73e8" />
          <stop offset="100%" stopColor="#0b57d0" />
        </linearGradient>
        <linearGradient id="practiclyStem" x1="18" y1="48" x2="25" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c2e7ff" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="practiclyArc" x1="22" y1="16" x2="48" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#c2e7ff" />
          <stop offset="100%" stopColor="#7cacf8" />
        </linearGradient>
        <filter id="practiclyShadow" x="0" y="0" width="64" height="64" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0b57d0" floodOpacity="0.25" />
        </filter>
      </defs>

      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#practiclyBg)" filter="url(#practiclyShadow)" />
      <rect x="4" y="4" width="56" height="56" rx="16" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

      {/* Pillar: Classroom Theory (Academic Foundation) */}
      <rect x="18" y="16" width="7" height="32" rx="3.5" fill="url(#practiclyStem)" />

      {/* Loop: Real-World Experience (Forward Trajectory Arc) */}
      <path
        d="M21.5 16H34C40.6274 16 46 21.3726 46 28C46 34.6274 40.6274 40 34 40H22"
        stroke="url(#practiclyArc)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="34" cy="28" r="3.5" fill="#ffffff" />
      <circle cx="34" cy="28" r="1.8" fill="#0b57d0" />
    </svg>
  );
}

export const IconLogo = IconBrandLogo;

export function IconDashboard({ size = 18, className = '' }) {
  return <MaterialSymbol name="dashboard" size={size} className={className} />;
}

export function IconStudent({ size = 18, className = '' }) {
  return <MaterialSymbol name="school" size={size} className={className} />;
}

export function IconBuilding({ size = 18, className = '' }) {
  return <MaterialSymbol name="domain" size={size} className={className} />;
}

export function IconBriefcase({ size = 18, className = '' }) {
  return <MaterialSymbol name="work" size={size} className={className} />;
}

export function IconClock({ size = 18, className = '' }) {
  return <MaterialSymbol name="schedule" size={size} className={className} />;
}

export function IconEvaluation({ size = 18, className = '' }) {
  return <MaterialSymbol name="rate_review" size={size} className={className} />;
}

export function IconSupervisor({ size = 18, className = '' }) {
  return <MaterialSymbol name="supervisor_account" size={size} className={className} />;
}

export function IconShieldCheck({ size = 18, className = '' }) {
  return <MaterialSymbol name="verified" size={size} className={className} fill={1} />;
}

export function IconDatabase({ size = 18, className = '' }) {
  return <MaterialSymbol name="database" size={size} className={className} />;
}

export function IconSettings({ size = 18, className = '' }) {
  return <MaterialSymbol name="settings" size={size} className={className} />;
}

export function IconPlus({ size = 16, className = '' }) {
  return <MaterialSymbol name="add" size={size} className={className} />;
}

export function IconSearch({ size = 16, className = '' }) {
  return <MaterialSymbol name="search" size={size} className={className} />;
}

export function IconCheckCircle({ size = 16, className = '' }) {
  return <MaterialSymbol name="check_circle" size={size} className={className} fill={1} />;
}

export function IconAlert({ size = 16, className = '' }) {
  return <MaterialSymbol name="warning" size={size} className={className} />;
}

export function IconTrash({ size = 15, className = '' }) {
  return <MaterialSymbol name="delete" size={size} className={className} />;
}

export function IconEdit({ size = 15, className = '' }) {
  return <MaterialSymbol name="edit" size={size} className={className} />;
}

export function IconPrinter({ size = 16, className = '' }) {
  return <MaterialSymbol name="print" size={size} className={className} />;
}

export function IconDownload({ size = 16, className = '' }) {
  return <MaterialSymbol name="download" size={size} className={className} />;
}

export function IconRefresh({ size = 16, className = '' }) {
  return <MaterialSymbol name="refresh" size={size} className={className} />;
}

export function IconLogOut({ size = 16, className = '' }) {
  return <MaterialSymbol name="logout" size={size} className={className} />;
}

export function IconKey({ size = 16, className = '' }) {
  return <MaterialSymbol name="key" size={size} className={className} />;
}

export function IconMenu({ size = 18, className = '' }) {
  return <MaterialSymbol name="menu" size={size} className={className} />;
}

export function IconClose({ size = 18, className = '' }) {
  return <MaterialSymbol name="close" size={size} className={className} />;
}

export function IconCode({ size = 16, className = '' }) {
  return <MaterialSymbol name="code" size={size} className={className} />;
}

export function IconArrowRight({ size = 15, className = '' }) {
  return <MaterialSymbol name="arrow_forward" size={size} className={className} />;
}

export function IconSun({ size = 15, className = '' }) {
  return <MaterialSymbol name="light_mode" size={size} className={className} />;
}

export function IconMoon({ size = 15, className = '' }) {
  return <MaterialSymbol name="dark_mode" size={size} className={className} />;
}

export function IconVolume({ size = 15, className = '' }) {
  return <MaterialSymbol name="volume_up" size={size} className={className} />;
}

export function IconVolumeMute({ size = 15, className = '' }) {
  return <MaterialSymbol name="volume_off" size={size} className={className} />;
}

export function IconSparkles({ size = 15, className = '' }) {
  return <MaterialSymbol name="auto_awesome" size={size} className={className} />;
}

export function IconChevronDown({ size = 15, className = '' }) {
  return <MaterialSymbol name="expand_more" size={size} className={className} />;
}

export function IconUser({ size = 16, className = '' }) {
  return <MaterialSymbol name="person" size={size} className={className} />;
}

export function IconFilter({ size = 15, className = '' }) {
  return <MaterialSymbol name="filter_list" size={size} className={className} />;
}

export function IconCheck({ size = 15, className = '' }) {
  return <MaterialSymbol name="check" size={size} className={className} />;
}

export function IconLink({ size = 15, className = '' }) {
  return <MaterialSymbol name="link" size={size} className={className} />;
}

export function IconShare({ size = 15, className = '' }) {
  return <MaterialSymbol name="share" size={size} className={className} />;
}

export function IconUpload({ size = 15, className = '' }) {
  return <MaterialSymbol name="upload_file" size={size} className={className} />;
}

export function IconFileText({ size = 15, className = '' }) {
  return <MaterialSymbol name="description" size={size} className={className} />;
}

export function IconEye({ size = 15, className = '' }) {
  return <MaterialSymbol name="visibility" size={size} className={className} />;
}

export function IconExternalLink({ size = 15, className = '' }) {
  return <MaterialSymbol name="open_in_new" size={size} className={className} />;
}
