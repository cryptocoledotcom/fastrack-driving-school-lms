// TextArea Component
// Multi-line text input with validation display

import React, { forwardRef } from 'react';
import styles from './TextArea.module.css';

const TextArea = forwardRef(({
    label,
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
    rows = 4,
    className = '',
    ...props
}, ref) => {
    const textareaClasses = [
        styles.textarea,
        error && styles.error,
        disabled && styles.disabled,
        fullWidth && styles.fullWidth,
        className
    ].filter(Boolean).join(' ');

    return (
        <div className={`${styles.textareaWrapper} ${fullWidth ? styles.fullWidth : ''}`}>
            {label && (
                <label htmlFor={name} className={styles.label}>
                    {label}
                    {required && <span className={styles.required}>*</span>}
                </label>
            )}
            <textarea
                ref={ref}
                id={name}
                name={name}
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={onChange}
                onBlur={onBlur}
                rows={rows}
                className={textareaClasses}
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

TextArea.displayName = 'TextArea';

export default TextArea;
