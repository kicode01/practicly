import { useEffect, useRef, useState } from 'react';

/**
 * Keeps an overlay, modal, dropdown, drawer, or snackbar mounted during its
 * CSS fade-out transition so exit animations always play before unmounting.
 */
export function usePresence(isOpen, exitMs = 150) {
  const [rendered, setRendered] = useState(Boolean(isOpen));
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      setExiting(false);
      return undefined;
    }
    if (!rendered) return undefined;
    setExiting(true);
    const timer = window.setTimeout(() => {
      setRendered(false);
      setExiting(false);
    }, exitMs);
    return () => window.clearTimeout(timer);
  }, [isOpen, exitMs, rendered]);

  return { rendered, exiting };
}

/**
 * Presence helper for overlays controlled by an object/string prop (e.g. report,
 * placement, or toast message). Retains the previous value while fading out.
 */
export function usePresenceValue(value, exitMs = 150) {
  const hasValue = Boolean(value);
  const { rendered, exiting } = usePresence(hasValue, exitMs);
  const retainedRef = useRef(value);

  if (value) {
    retainedRef.current = value;
  }

  useEffect(() => {
    if (!hasValue && !rendered) {
      retainedRef.current = null;
    }
  }, [hasValue, rendered]);

  const activeValue = value || (rendered ? retainedRef.current : null);
  return {
    rendered: rendered && Boolean(activeValue),
    exiting,
    value: activeValue,
  };
}

/**
 * Coordinates a smooth fade-out -> swap -> fade-in transition when switching
 * between pages, roles, tabs, or auth modes.
 */
export function useSmoothSwitch(targetKey, exitMs = 90) {
  const [displayedKey, setDisplayedKey] = useState(targetKey);
  const [phase, setPhase] = useState('entering');

  useEffect(() => {
    if (targetKey === displayedKey) return undefined;
    setPhase('exiting');
    const timer = window.setTimeout(() => {
      setDisplayedKey(targetKey);
      setPhase('entering');
    }, exitMs);
    return () => window.clearTimeout(timer);
  }, [targetKey, displayedKey, exitMs]);

  return { displayedKey, phase };
}

export default usePresence;
