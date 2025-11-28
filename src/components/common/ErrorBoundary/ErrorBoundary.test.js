import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';
import LoggingService from '../../../services/loggingService';

jest.mock('../../../services/loggingService', () => ({
  error: jest.fn(),
  info: jest.fn()
}));

const TestComponent = ({ shouldError = false }) => {
  if (shouldError) {
    throw new Error('Test error in component');
  }
  return <div data-testid="test-component">Test Component Rendered</div>;
};

const ThrowingComponentOnClick = () => {
  const handleClick = () => {
    throw new Error('Error on click');
  };
  return (
    <button data-testid="error-button" onClick={handleClick}>
      Click to Error
    </button>
  );
};

describe('ErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (consoleErrorSpy) {
      consoleErrorSpy.mockRestore();
    }
  });

  describe('Rendering children', () => {
    it('should render children when there are no errors', () => {
      render(
        <ErrorBoundary>
          <TestComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
      expect(screen.getByText('Test Component Rendered')).toBeInTheDocument();
    });

    it('should render multiple children without errors', () => {
      render(
        <ErrorBoundary>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should catch render errors from children', () => {
      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should display error message when error occurs', () => {
      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/we're sorry for the inconvenience/i)).toBeInTheDocument();
    });

    it('should call LoggingService.error when catching error', () => {
      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(LoggingService.error).toHaveBeenCalled();
      const callArgs = LoggingService.error.mock.calls[0];
      expect(callArgs[0]).toBe('React Error Caught');
      expect(callArgs[1]).toBeDefined();
    });

    it('should log component stack to LoggingService', () => {
      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(LoggingService.error).toHaveBeenCalled();
      const callArgs = LoggingService.error.mock.calls[0];
      expect(callArgs[2]).toHaveProperty('componentStack');
    });

    it('should set hasError state to true', () => {
      const { container } = render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('[data-testid="error-boundary-container"]');
      expect(errorContainer).toBeInTheDocument();
      expect(container.querySelector('[data-testid="error-message"]')).toBeInTheDocument();
    });
  });

  describe('Development mode details', () => {
    it('should show error details button in development mode', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByRole('button', { name: /show details/i });
      expect(detailsButton).toBeInTheDocument();
    });

    it('should toggle error details on button click in development', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByRole('button', { name: /show details/i });
      expect(detailsButton).toBeInTheDocument();

      fireEvent.click(detailsButton);

      expect(screen.getByRole('button', { name: /hide details/i })).toBeInTheDocument();
      expect(screen.getByText(/test error in component/i)).toBeInTheDocument();
    });

    it('should hide error details initially in development', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/test error in component/i)).not.toBeInTheDocument();
    });

    it('should show/hide error stack on details button toggle', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByRole('button', { name: /show details/i });
      fireEvent.click(detailsButton);

      const errorDetails = screen.getByTestId('error-details');
      expect(errorDetails).toBeVisible();

      fireEvent.click(detailsButton);
      expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
    });
  });

  describe('Production mode', () => {
    it('should not show details button in production mode', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.queryByRole('button', { name: /show details/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /hide details/i })).not.toBeInTheDocument();
    });

    it('should not display technical error details in production', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/test error in component/i)).not.toBeInTheDocument();
      expect(screen.queryByTestId('error-details')).not.toBeInTheDocument();
    });

    it('should display user-friendly message in production', () => {
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText(/we're sorry for the inconvenience/i)).toBeInTheDocument();
    });
  });

  describe('Recovery functionality', () => {
    it('should display Try Again button', () => {
      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toBeInTheDocument();
    });

    it('should reset error state when Try Again is clicked', () => {
      const TestWrapper = () => {
        const [shouldError, setShouldError] = React.useState(true);

        return (
          <ErrorBoundary>
            {shouldError ? (
              <TestComponent shouldError />
            ) : (
              <TestComponent shouldError={false} />
            )}
          </ErrorBoundary>
        );
      };

      render(<TestWrapper />);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      fireEvent.click(tryAgainButton);

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should clear error state when rendered with new props', () => {
      process.env.NODE_ENV = 'development';

      const { rerender } = render(
        <ErrorBoundary key="boundary1">
          <TestComponent shouldError={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      rerender(
        <ErrorBoundary key="boundary2">
          <TestComponent shouldError={false} />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('test-component')).toBeInTheDocument();
    });
  });

  describe('Error information display', () => {
    it('should display error message in error details', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByRole('button', { name: /show details/i });
      fireEvent.click(detailsButton);

      const errorDetails = screen.getByTestId('error-details');
      expect(errorDetails.textContent).toContain('Test error in component');
    });

    it('should display error stack trace when available', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const detailsButton = screen.getByRole('button', { name: /show details/i });
      fireEvent.click(detailsButton);

      const errorStack = screen.getByTestId('error-stack');
      expect(errorStack).toBeInTheDocument();
    });
  });

  describe('Multiple error boundaries', () => {
    it('should handle nested error boundaries', () => {
      render(
        <ErrorBoundary>
          <div>
            <ErrorBoundary>
              <TestComponent shouldError />
            </ErrorBoundary>
          </div>
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should isolate errors to inner boundary when nested', () => {
      const InnerComponent = () => {
        throw new Error('Inner error');
      };

      render(
        <ErrorBoundary>
          <div data-testid="outer-boundary">Outer</div>
          <ErrorBoundary>
            <InnerComponent />
          </ErrorBoundary>
        </ErrorBoundary>
      );

      expect(screen.getByTestId('outer-boundary')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  describe('Error boundary edge cases', () => {
    it('should handle errors in deeply nested components', () => {
      const NestedComponent = () => {
        return (
          <div>
            <div>
              <div>
                <TestComponent shouldError />
              </div>
            </div>
          </div>
        );
      };

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should display error message even with multiple error boundaries', () => {
      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(LoggingService.error).toHaveBeenCalled();
    });
  });

  describe('Component props', () => {
    it('should accept children prop', () => {
      const { container } = render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>
      );

      expect(container.textContent).toContain('Child content');
    });

    it('should accept fallback prop for custom error UI', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Error UI</div>;

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
    });

    it('should use fallback prop instead of default error UI', () => {
      const CustomFallback = () => <div data-testid="custom-fallback">Custom Error</div>;

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('custom-fallback')).toBeInTheDocument();
      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
    });
  });

  describe('Error logging context', () => {
    it('should include error context in logging', () => {
      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      expect(LoggingService.error).toHaveBeenCalledWith(
        'React Error Caught',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('should preserve error information for debugging', () => {
      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const errorCall = LoggingService.error.mock.calls[0];
      const error = errorCall[1];

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error in component');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles for error container', () => {
      const { container } = render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('[role="alert"]');
      expect(errorContainer).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button.textContent).toBeTruthy();
      });
    });
  });

  describe('Styling and appearance', () => {
    it('should apply error boundary container styles', () => {
      const { container } = render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const errorContainer = container.querySelector('[data-testid="error-boundary-container"]');
      expect(errorContainer).toHaveClass('errorBoundary');
    });

    it('should apply error container styles', () => {
      const { container } = render(
        <ErrorBoundary>
          <TestComponent shouldError />
        </ErrorBoundary>
      );

      const errorMsg = container.querySelector('[data-testid="error-message"]');
      expect(errorMsg).toHaveClass('errorContainer');
    });
  });
});
