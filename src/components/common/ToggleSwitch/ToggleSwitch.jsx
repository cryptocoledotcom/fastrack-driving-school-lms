import React, { forwardRef } from 'react';
import styles from './ToggleSwitch.module.css';

export const ToggleSwitch = forwardRef(({
  label,
  name,
  checked,
  disabled = false,
  error,
  onChange,
  className = '',
  withIcons = false, // Optional: Only use true for the Dark Mode switch
  ...props
}, ref) => {
  
  const wrapperClasses = [
    styles.wrapper,
    disabled && styles.disabled,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <label className={styles.labelContainer}>
        {/* The Switch Mechanism */}
        <div className={styles.switch}>
          <input
            ref={ref}
            type="checkbox"
            name={name}
            checked={checked}
            disabled={disabled}
            onChange={onChange}
            className={styles.input}
            {...props}
          />
          <span className={`${styles.slider} ${error ? styles.hasError : ''}`}>
             {/* Optional Sun/Moon Icons for Dark Mode */}
             {withIcons && (
              <>
                <span className={`${styles.icon} ${styles.sun}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
                </span>
                <span className={`${styles.icon} ${styles.moon}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </span>
              </>
            )}
          </span>
        </div>

        {/* The Label Text (Renders to the right of the switch) */}
        {label && <span className={styles.labelText}>{label}</span>}
      </label>

      {/* Error Message */}
      {error && (
        <span className={styles.errorText}>{error}</span>
      )}
    </div>
  );
});

ToggleSwitch.displayName = 'ToggleSwitch';