// Card Component
// Reusable card container component

import React from 'react';
import styles from './Card.module.css';

const Card = ({
  children,
  variant = 'default',
  padding = 'medium',
  hoverable = false,
  clickable = false,
  onClick,
  className = '',
  ...props
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    hoverable && styles.hoverable,
    clickable && styles.clickable,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClasses}
      onClick={clickable ? onClick : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;