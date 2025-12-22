// ProgressBar Component
// Progress indicator (0-100%)

import styles from './ProgressBar.module.css';

const ProgressBar = ({
  progress = 0,
  showLabel = true,
  size = 'medium',
  color = 'primary',
  animated = false,
  className = ''
}) => {
  // Ensure progress is between 0 and 100
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  const progressBarClasses = [
    styles.progressBar,
    styles[size],
    className
  ].filter(Boolean).join(' ');

  const fillClasses = [
    styles.fill,
    styles[color],
    animated && styles.animated
  ].filter(Boolean).join(' ');

  return (
    <div className={progressBarClasses}>
      <div className={styles.track}>
        <div 
          className={fillClasses}
          style={{ width: `${normalizedProgress}%` }}
          role="progressbar"
          aria-valuenow={normalizedProgress}
          aria-valuemin="0"
          aria-valuemax="100"
        >
          {showLabel && (
            <span className={styles.label}>{normalizedProgress}%</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;