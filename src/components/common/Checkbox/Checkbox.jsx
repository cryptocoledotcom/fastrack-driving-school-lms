// Checkbox Component
// Checkbox with label

import { forwardRef } from 'react';

import styles from './Checkbox.module.css';

const Checkbox = forwardRef(({
  label,
  name,
  checked,
  disabled = false,
  error,
  onChange,
  className = '',
  ...props
}, ref) => {
  const checkboxClasses = [
    styles.checkbox,
    error && styles.error,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={styles.checkboxWrapper}>
      <label className={styles.checkboxLabel}>
        <input
          ref={ref}
          type="checkbox"
          name={name}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className={checkboxClasses}
          {...props}
        />
        <span className={styles.checkmark}></span>
        {label && <span className={styles.labelText}>{label}</span>}
      </label>
      {error && (
        <span className={styles.errorText}>{error}</span>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;