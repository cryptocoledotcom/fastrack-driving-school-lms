// Input Component
// Form input with validation display

import { forwardRef } from 'react';

import styles from './Input.module.css';

const Input = forwardRef(({
  label,
  type = 'text',
  name,
  value,
  placeholder,
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
  const inputClasses = [
    styles.input,
    error && styles.error,
    disabled && styles.disabled,
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={`${styles.inputWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <input
        ref={ref}
        id={name}
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
        onBlur={onBlur}
        className={inputClasses}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : helperText ? `${name}-helper` : undefined}
        {...props}
      />
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

Input.displayName = 'Input';

export default Input;