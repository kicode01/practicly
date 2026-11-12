import React, { forwardRef, useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { IconSearch, IconChevronDown, IconCheck, IconAlert, IconClose } from './Icons';

/**
 * Google Material Design 3 (M3) Web Component Implementations
 * High-performance, accessible, production-grade UI controls.
 */

export function SegmentedControl({ items = [], value, onValueChange, className = '' }) {
  return (
    <div className={`m3-segmented-button-row ${className}`} role="tablist">
      {items.map((item) => {
        const itemVal = typeof item === 'object' && item !== null ? item.value : item;
        const itemLabel = typeof item === 'object' && item !== null ? item.label : item;
        const isSelected = String(value) === String(itemVal);
        return (
          <button
            key={String(itemVal)}
            type="button"
            role="tab"
            aria-selected={isSelected}
            className={`m3-seg-item ${isSelected ? 'active' : ''}`}
            onClick={() => onValueChange && onValueChange(itemVal)}
          >
            {itemLabel}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked = false, onCheckedChange, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`m3-switch ${checked ? 'checked' : ''} ${className}`}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
    >
      <span className="m3-switch-thumb" />
    </button>
  );
}

export function Slider({ min = 1, max = 5, step = 0.5, value = 3, onValueChange, className = '' }) {
  return (
    <div className={`m3-slider-wrap ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="m3-slider-input"
        onChange={(e) => onValueChange && onValueChange(Number(e.target.value))}
      />
    </div>
  );
}

export const Glass = forwardRef(function Glass({ children, className = '', ...props }, ref) {
  return (
    <div ref={ref} className={`m3-surface-card ${className}`} {...props}>
      {children}
    </div>
  );
});

export function SearchField({
  value = '',
  onValueChange,
  placeholder = 'Search...',
  autoFocus = false,
  className = '',
}) {
  return (
    <div className={`m3-search-bar ${className}`}>
      <IconSearch size={16} className="m3-search-bar-icon" />
      <input
        type="search"
        className="m3-search-bar-input"
        placeholder={placeholder}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onValueChange && onValueChange(e.target.value)}
      />
    </div>
  );
}

export function Button({ children, className = '', variant = 'filled', ...props }) {
  return (
    <button type="button" className={`btn btn-${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}

/**
 * MaterialSelect (Google Material Design 3 Dropdown Menu)
 * Replaces native OS <select> with a custom, elevated Material 3 Menu.
 * Supports both `options={[{value, label}]}` and `<option>` children.
 */
export function MaterialSelect({
  value,
  onChange,
  onValueChange,
  children,
  options = [],
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  name,
  id,
  style = {},
  prefixIcon,
  align = 'auto',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState(null);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const isSmall = className.includes('select-sm');

  // Extract items from options prop OR <option> children
  const items = useMemo(() => {
    if (options && options.length > 0) {
      return options.map((opt) =>
        typeof opt === 'object' && opt !== null
          ? { value: opt.value, label: opt.label !== undefined ? opt.label : opt.value, disabled: opt.disabled }
          : { value: opt, label: String(opt) }
      );
    }
    const parsed = [];
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        parsed.push({
          value: child.props.value !== undefined ? child.props.value : child.props.children,
          label: child.props.children,
          disabled: child.props.disabled,
        });
      }
    });
    return parsed;
  }, [options, children]);

  // Compute portal menu coordinates relative to viewport so ancestors never clip it
  const updateMenuPosition = useCallback((closeIfOffscreen = false) => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    // Close during scroll if trigger has scrolled completely out of the viewport
    if (closeIfOffscreen && (rect.bottom < 0 || rect.top > window.innerHeight)) {
      setIsOpen(false);
      return;
    }

    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const margin = 8;
    const gap = 6;
    const maxAllowedW = Math.min(420, viewportW - margin * 2);
    const minW = Math.min(Math.max(rect.width, isSmall ? 180 : 220), maxAllowedW);

    const measuredRect = menuRef.current ? menuRef.current.getBoundingClientRect() : null;
    const estimatedW = measuredRect && measuredRect.width > 0
      ? Math.min(Math.max(measuredRect.width, minW), maxAllowedW)
      : Math.min(Math.max(minW, Math.min(260, maxAllowedW)), maxAllowedW);
    const estRowH = 38;
    const estimatedH = measuredRect && measuredRect.height > 0
      ? Math.min(measuredRect.height, 420)
      : Math.min(Math.max(items.length, 1) * estRowH + 16, 420);

    const spaceBelow = Math.max(0, viewportH - rect.bottom - gap - margin);
    const spaceAbove = Math.max(0, rect.top - gap - margin);
    const openUpward = spaceBelow < Math.min(estimatedH, 220) && spaceAbove > spaceBelow;
    const availableSpace = openUpward ? spaceAbove : spaceBelow;
    const maxHeight = Math.max(120, Math.min(420, availableSpace));
    const renderedH = Math.min(estimatedH, maxHeight);

    const top = openUpward
      ? Math.max(margin, rect.top - renderedH - gap)
      : Math.min(viewportH - renderedH - margin, rect.bottom + gap);

    const containerEl = containerRef.current;
    const inRightContext = Boolean(
      containerEl &&
      containerEl.closest('.panel-toolbar, .panel-actions, .page-actions, .topbar-controls, td.text-right')
    );
    const shouldAlignRight =
      align === 'right' ||
      (align !== 'left' && (inRightContext || viewportW - rect.left < estimatedW + margin));

    let left = shouldAlignRight ? rect.right - estimatedW : rect.left;
    left = Math.max(margin, Math.min(left, viewportW - estimatedW - margin));

    setMenuPosition({
      top: Math.round(top),
      left: Math.round(left),
      minWidth: Math.round(minW),
      maxWidth: Math.round(maxAllowedW),
      maxHeight: Math.round(maxHeight),
      openUpward,
    });
  }, [align, isSmall, items.length]);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }
    updateMenuPosition();
    // Re-measure right after menu renders so exact DOM dimensions refine flip & clamping
    const rafId = window.requestAnimationFrame(() => updateMenuPosition());
    return () => window.cancelAnimationFrame(rafId);
  }, [isOpen, updateMenuPosition]);

  // Keep menu anchored on ancestor/window scroll and resize (ignore scrolling inside the menu itself)
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleScroll = (e) => {
      if (menuRef.current && e.target && menuRef.current.contains(e.target)) {
        return;
      }
      updateMenuPosition(true);
    };
    const handleResize = () => updateMenuPosition();
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, updateMenuPosition]);

  // Close when clicking outside both trigger container and portaled menu
  useEffect(() => {
    function handleClickOutside(e) {
      const inTrigger = containerRef.current && containerRef.current.contains(e.target);
      const inMenu = menuRef.current && menuRef.current.contains(e.target);
      if (!inTrigger && !inMenu) {
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

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown, true);
    }
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen]);

  const selectedItem = items.find((it) => String(it.value) === String(value));
  const displayLabel = selectedItem ? selectedItem.label : (placeholder || 'Select...');

  const handleSelect = (itemVal) => {
    if (disabled) return;
    if (onValueChange) {
      onValueChange(itemVal);
    }
    if (onChange) {
      onChange({
        target: {
          value: itemVal,
          name: name || id || '',
        },
      });
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`m3-select-container ${isSmall ? 'm3-select-sm' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        className={`m3-select-trigger ${isOpen ? 'is-open' : ''}`}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        {prefixIcon && <span className="m3-select-prefix">{prefixIcon}</span>}
        <span className="m3-select-label">{displayLabel}</span>
        <IconChevronDown size={isSmall ? 15 : 18} className={`m3-select-chevron ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className={`m3-select-menu is-portal ${menuPosition?.openUpward ? 'is-open-upward' : ''}`}
          role="listbox"
          style={
            menuPosition
              ? {
                  position: 'fixed',
                  top: `${menuPosition.top}px`,
                  left: `${menuPosition.left}px`,
                  minWidth: `${menuPosition.minWidth}px`,
                  maxWidth: `${menuPosition.maxWidth}px`,
                  maxHeight: `${menuPosition.maxHeight}px`,
                  zIndex: 2600,
                }
              : {
                  position: 'fixed',
                  visibility: 'hidden',
                  top: 0,
                  left: 0,
                  zIndex: 2600,
                }
          }
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {items.length === 0 ? (
            <div className="m3-select-empty">No options available</div>
          ) : (
            items.map((it) => {
              const isSelected = String(it.value) === String(value);
              return (
                <button
                  key={String(it.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={it.disabled}
                  className={`m3-select-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => handleSelect(it.value)}
                >
                  <span className="m3-select-item-text">{it.label}</span>
                  {isSelected && <IconCheck size={16} className="m3-select-check" />}
                </button>
              );
            })
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

export const Select = MaterialSelect;

/**
 * Material Design 3 Snackbar
 * Displays brief, low-emphasis status or feedback messages anchored to the viewport.
 */
export function Snackbar({ message, type = 'success', onClose, className = '' }) {
  if (!message) return null;

  const isError = type === 'error';
  const isWarning = type === 'warning';
  const variantClass = isError
    ? 'm3-snackbar--error'
    : isWarning
      ? 'm3-snackbar--warning'
      : 'm3-snackbar--default';

  return (
    <div
      className={`m3-snackbar ${variantClass} ${className}`.trim()}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
    >
      {(isError || isWarning) && (
        <span className="m3-snackbar__icon" aria-hidden="true">
          <IconAlert size={18} />
        </span>
      )}
      <span className="m3-snackbar__label">{message}</span>
      {onClose && (
        <button
          type="button"
          className="m3-snackbar__close"
          onClick={onClose}
          aria-label="Dismiss notification"
        >
          <IconClose size={18} />
        </button>
      )}
    </div>
  );
}

export default {
  SegmentedControl,
  Switch,
  Slider,
  Glass,
  SearchField,
  Button,
  MaterialSelect,
  Select,
  Snackbar,
};
