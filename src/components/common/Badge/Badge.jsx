// Badge Component
// Status badges (completed, in-progress, locked)

import React from 'react';
import styles from './Badge.module.css';

const Badge = ({
  children,
  variant = 'default',
  size = 'medium',
  icon,
  className = ''
}) => {
  const badgeClasses = [
    styles.badge,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={badgeClasses}>
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  );
};

export default Badge;