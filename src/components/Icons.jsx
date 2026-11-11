import React from 'react';

/**
 * Official Google Material Design Icons (Pure Inline SVG)
 * Repository: https://github.com/google/material-design-icons
 *
 * 100% SVG-based implementation:
 * - Zero external font dependencies (eliminates broken ligature text like "school" or "supervisor_account")
 * - Zero FOUT (Flash of Unstyled Text) - renders instantly and synchronously
 * - Completely immune to offline conditions, corporate firewalls, and adblockers
 * - Perfect vertical centering and responsive scaling via currentColor
 */

function SvgIcon({ d, size = 18, className = '', style = {}, viewBox = '0 0 24 24', fill = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
      className={`m3-icon ${className}`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        ...style,
      }}
      aria-hidden="true"
    >
      {Array.isArray(d) ? (
        d.map((pathStr, idx) => <path key={idx} d={pathStr} />)
      ) : (
        <path d={d} />
      )}
    </svg>
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

// Google Material Symbol: dashboard
export function IconDashboard({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
    />
  );
}

// Google Material Symbol: school (student)
export function IconStudent({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z"
    />
  );
}

// Google Material Symbol: domain (building / company)
export function IconBuilding({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M12 7V3H2v18h20V7H12zM6 19H4v-2h2v2zm0-4H4v-2h2v2zm0-4H4V9h2v2zm0-4H4V5h2v2zm4 12H8v-2h2v2zm0-4H8v-2h2v2zm0-4H8V9h2v2zm0-4H8V5h2v2zm10 12h-8v-2h2v-2h-2v-2h2v-2h-2V9h8v10zm-2-8h-2v2h2v-2zm0 4h-2v2h2v-2z"
    />
  );
}

// Google Material Symbol: work (briefcase / placement)
export function IconBriefcase({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"
    />
  );
}

// Google Material Symbol: schedule (clock / time)
export function IconClock({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"
    />
  );
}

// Google Material Symbol: rate_review (evaluation)
export function IconEvaluation({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 14v-2.47l6.88-6.88c.2-.2.51-.2.71 0l1.77 1.77c.2.2.2.51 0 .71L8.47 14H6zm12 0h-7.5l2-2H18v2z"
    />
  );
}

// Google Material Symbol: supervisor_account (adviser / supervisor)
export function IconSupervisor({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M16.5 12c1.38 0 2.49-1.12 2.49-2.5S17.88 7 16.5 7C15.12 7 14 8.12 14 9.5s1.12 2.5 2.5 2.5zM9 11c1.66 0 2.99-1.34 2.99-3S10.66 5 9 5C7.34 5 6 6.34 6 8s1.34 3 3 3zm7.5 3c-1.83 0-5.5.92-5.5 2.75V19h11v-2.25c0-1.83-3.67-2.75-5.5-2.75zM9 13c-2.33 0-7 1.17-7 3.5V19h7v-2.25c0-.85.33-1.64.92-2.28-.31-.05-.62-.07-.92-.07z"
    />
  );
}

// Google Material Symbol: verified (admin / coordinator / verified)
export function IconShieldCheck({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="m23 12-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z"
    />
  );
}

// Google Material Symbol: database / storage
export function IconDatabase({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M12 3C7.58 3 4 4.79 4 7v10c0 2.21 3.59 4 8 4s8-1.79 8-4V7c0-2.21-3.58-4-8-4zm0 2c3.87 0 6 1.5 6 2s-2.13 2-6 2-6-1.5-6-2 2.13-2 6-2zm6 12c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V17zm0-4c0 .5-2.13 2-6 2s-6-1.5-6-2v-2.23c1.61.78 3.72 1.23 6 1.23s4.39-.45 6-1.23V13z"
    />
  );
}

// Google Material Symbol: settings
export function IconSettings({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"
    />
  );
}

// Google Material Symbol: add (plus)
export function IconPlus({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
    />
  );
}

// Google Material Symbol: search
export function IconSearch({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
    />
  );
}

// Google Material Symbol: check_circle
export function IconCheckCircle({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
    />
  );
}

// Google Material Symbol: warning (alert)
export function IconAlert({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
    />
  );
}

// Google Material Symbol: delete (trash)
export function IconTrash({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
    />
  );
}

// Google Material Symbol: edit
export function IconEdit({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
    />
  );
}

// Google Material Symbol: print
export function IconPrinter({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"
    />
  );
}

// Google Material Symbol: download
export function IconDownload({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
    />
  );
}

// Google Material Symbol: refresh
export function IconRefresh({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"
    />
  );
}

// Google Material Symbol: logout
export function IconLogOut({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="m17 7-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
    />
  );
}

// Google Material Symbol: key
export function IconKey({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M21 10h-8.35A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4h-2zm-14 4c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
    />
  );
}

// Google Material Symbol: menu
export function IconMenu({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"
    />
  );
}

// Google Material Symbol: close
export function IconClose({ size = 18, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
    />
  );
}

// Google Material Symbol: code
export function IconCode({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="m9.4 16.6-4.6-4.6L9.4 7.4 8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"
    />
  );
}

// Google Material Symbol: arrow_forward
export function IconArrowRight({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="m12 4-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"
    />
  );
}

// Google Material Symbol: light_mode
export function IconSun({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"
    />
  );
}

// Google Material Symbol: dark_mode
export function IconMoon({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"
    />
  );
}

// Google Material Symbol: volume_up
export function IconVolume({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
    />
  );
}

// Google Material Symbol: volume_off
export function IconVolumeMute({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"
    />
  );
}

// Google Material Symbol: auto_awesome (sparkles)
export function IconSparkles({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="m19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"
    />
  );
}

// Google Material Symbol: expand_more (chevron down)
export function IconChevronDown({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z"
    />
  );
}

// Google Material Symbol: chevron_left
export function IconChevronLeft({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"
    />
  );
}

// Google Material Symbol: chevron_right
export function IconChevronRight({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"
    />
  );
}

// Google Material Symbol: person (user)
export function IconUser({ size = 16, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"
    />
  );
}

// Google Material Symbol: filter_list (filter)
export function IconFilter({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"
    />
  );
}

// Google Material Symbol: check
export function IconCheck({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
    />
  );
}

// Google Material Symbol: link
export function IconLink({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"
    />
  );
}

// Google Material Symbol: share
export function IconShare({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"
    />
  );
}

// Google Material Symbol: upload_file
export function IconUpload({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zm-8-6.83 1.41 1.41L12 11.99V17h2v-5.01l1.59 1.59L17 12.17 13 8.17l-4 4z"
    />
  );
}

// Google Material Symbol: description (file text)
export function IconFileText({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
    />
  );
}

// Google Material Symbol: visibility (eye)
export function IconEye({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"
    />
  );
}

// Google Material Symbol: open_in_new (external link)
export function IconExternalLink({ size = 15, className = '' }) {
  return (
    <SvgIcon
      size={size}
      className={className}
      d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"
    />
  );
}

export default {
  IconBrandLogo,
  IconLogo,
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
  IconKey,
  IconMenu,
  IconClose,
  IconCode,
  IconArrowRight,
  IconSun,
  IconMoon,
  IconVolume,
  IconVolumeMute,
  IconSparkles,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconUser,
  IconFilter,
  IconCheck,
  IconLink,
  IconShare,
  IconUpload,
  IconFileText,
  IconEye,
  IconExternalLink,
};
