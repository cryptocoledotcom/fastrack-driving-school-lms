import React from 'react';

import LoggingService from '../../../services/loggingService';

import styles from './ErrorBoundary.module.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });

    LoggingService.error(
      'React Error Caught',
      error,
      { componentStack: errorInfo.componentStack }
    );
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    });
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className={styles.errorBoundary}
          data-testid="error-boundary-container"
          role="alert"
        >
          <div className={styles.errorContainer} data-testid="error-message">
            <h1>Something went wrong</h1>
            <p>
              We're sorry for the inconvenience. The error has been logged and our team will be
              notified.
            </p>

            {import.meta.env.DEV && (
              <>
                <button
                  onClick={this.toggleDetails}
                  className={styles.detailsButton}
                  type="button"
                >
                  {this.state.showDetails ? 'Hide Details' : 'Show Details'}
                </button>

                {this.state.showDetails && (
                  <div className={styles.errorDetails} data-testid="error-details">
                    <h3>Error Details</h3>
                    <pre data-testid="error-message-detail">
                      {this.state.error?.toString()}
                    </pre>
                    <h3>Component Stack</h3>
                    <pre data-testid="error-stack">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </>
            )}

            <button
              onClick={this.handleReset}
              className={styles.resetButton}
              type="button"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.defaultProps = {
  fallback: null
};

export default ErrorBoundary;
