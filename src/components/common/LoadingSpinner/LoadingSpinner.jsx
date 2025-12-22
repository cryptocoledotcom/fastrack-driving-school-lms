// LoadingSpinner Component
// Loading indicator with size variants

import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  fullScreen = false,
  text = '',
  className = ''
}) => {
  const spinnerClasses = [
    styles.spinner,
    styles[size],
    styles[color],
    className
  ].filter(Boolean).join(' ');

  const content = (
    <div className={styles.spinnerContainer}>
      <div className={spinnerClasses}></div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.fullScreen}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;