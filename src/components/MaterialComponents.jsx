import React, { forwardRef, useState, useEffect, useRef, useMemo } from 'react';
import { IconSearch, IconChevronDown, IconCheck } from './Icons';

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
  const [alignRight, setAlignRight] = useState(false);
  const containerRef = useRef(null);

  // Auto-detect right alignment when opening
  useEffect(() => {
    if (isOpen && containerRef.current) {
      if (align === 'right') {
        setAlignRight(true);
      } else if (align === 'left') {
        setAlignRight(false);
      } else {
        const rect = containerRef.current.getBoundingClientRect();
        // If container is within 340px of right screen edge or in the right half of the page
        const isNearRight = window.innerWidth - rect.left < 340 || rect.right > window.innerWidth - 120;
        setAlignRight(isNearRight);
      }
    }
  }, [isOpen, align]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
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
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

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

  const isSmall = className.includes('select-sm');

  return (
    <div
      ref={containerRef}
      className={`m3-select-container ${isSmall ? 'm3-select-sm' : ''} ${disabled ? 'is-disabled' : ''} ${className}`}
      style={{ position: 'relative', display: 'inline-block', ...style }}
    >
      <button
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

      {isOpen && (
        <div className={`m3-select-menu ${alignRight ? 'is-align-right' : ''}`} role="listbox">
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
        </div>
      )}
    </div>
  );
}

export const Select = MaterialSelect;

export default {
  SegmentedControl,
  Switch,
  Slider,
  Glass,
  SearchField,
  Button,
  MaterialSelect,
  Select,
};
