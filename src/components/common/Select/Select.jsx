// Select Component
// Dropdown select component

import React, { forwardRef } from 'react';
import styles from './Select.module.css';

const Select = forwardRef(({
  label,
  name,
  value,
  options = [],
  placeholder = 'Select an option',
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  onChange,
  onBlur,
  className = '',
  ...props
}, ref) => {
  const selectClasses = [
    styles.select,
    error && styles.error,
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.selectWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={name}
        name={name}
        value={value}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        className={selectClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option, index) => (
          <option 
            key={option.value ? option.value : `option-${index}`} 
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <span id={`${name}-error`} className={styles.errorText}>
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${name}-helper`} className={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;