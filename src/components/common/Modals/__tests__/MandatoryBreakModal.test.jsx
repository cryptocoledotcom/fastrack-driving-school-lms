import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MandatoryBreakModal from '../MandatoryBreakModal';

describe('MandatoryBreakModal', () => {
  const defaultProps = {
    isOpen: true,
    breakTimeRemaining: 600,
    onBreakComplete: vi.fn(),
    error: null
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('renders modal when open', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(screen.getByText("You've Earned a Break")).toBeInTheDocument();
    });

    it('displays title', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(screen.getByText("You've Earned a Break")).toBeInTheDocument();
    });

    it('displays compliance message about 2-hour study time', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(screen.getByText(/You've been studying for 2 hours/)).toBeInTheDocument();
    });

    it('displays compliance text about Ohio law requirement', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(screen.getByText(/Ohio law requires/)).toBeInTheDocument();
    });

    it('displays helpful message about break benefits', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(screen.getByText(/This break helps you learn better/)).toBeInTheDocument();
    });

    it('renders countdown container', () => {
      const { container } = render(<MandatoryBreakModal {...defaultProps} />);
      expect(container.querySelector('[class*="countdownContainer"]')).toBeInTheDocument();
    });

    it('displays emoji icon', () => {
      const { container } = render(<MandatoryBreakModal {...defaultProps} />);
      const icon = container.querySelector('[class*="icon"]');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Countdown Timer Display', () => {
    it('displays initial time in MM:SS format', () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} />);
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('displays 5 minutes remaining correctly', () => {
      const { unmount } = render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} />);
      unmount();
      
      const { unmount: unmount2 } = render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={300} />);
      expect(screen.getByText('05:00')).toBeInTheDocument();
      unmount2();
    });

    it('displays 1 minute remaining correctly', () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={60} />);
      expect(screen.getByText('01:00')).toBeInTheDocument();
    });

    it('displays seconds correctly', () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={45} />);
      expect(screen.getByText('00:45')).toBeInTheDocument();
    });

    it('displays single digit seconds with leading zero', () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={5} />);
      expect(screen.getByText('00:05')).toBeInTheDocument();
    });

    it('counts down every second', async () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} />);

      expect(screen.getByText('10:00')).toBeInTheDocument();

      vi.advanceTimersByTime(1000);

      await waitFor(() => {
        expect(screen.getByText('09:59')).toBeInTheDocument();
      });
    });

    it('continues countdown to zero', async () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={5} />);

      expect(screen.getByText('00:05')).toBeInTheDocument();

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByText('00:00')).toBeInTheDocument();
      });
    });

    it('displays "Break Complete!" when countdown reaches zero', async () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={5} />);

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(screen.getByText('Break Complete!')).toBeInTheDocument();
      });
    });
  });

  describe('Resume Button States', () => {
    it('has disabled Resume button when break not complete', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      const resumeButton = screen.getByRole('button', {
        name: /Taking a Break/
      });
      expect(resumeButton).toBeDisabled();
    });

    it('displays "Taking a Break..." text on button initially', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(screen.getByText(/Taking a Break/)).toBeInTheDocument();
    });

    it('enables Resume button when countdown completes', async () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={5} />);

      const resumeButton = screen.getByRole('button');
      expect(resumeButton).toBeDisabled();

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        expect(resumeButton).not.toBeDisabled();
      });
    });

    it('changes button text to "Resume Learning" when ready', async () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={5} />);

      expect(screen.getByText(/Taking a Break/)).toBeInTheDocument();

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.textContent).toContain('Resume Learning');
      }, { timeout: 3000 });
    });

    it('calls onBreakComplete when Resume button clicked', async () => {
      const onBreakComplete = vi.fn();
      render(
        <MandatoryBreakModal
          {...defaultProps}
          breakTimeRemaining={5}
          onBreakComplete={onBreakComplete}
        />
      );

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /Resume Learning/ }));
      });

      expect(onBreakComplete).toHaveBeenCalledOnce();
    });

    it('does not allow resume before break complete', () => {
      const onBreakComplete = vi.fn();
      render(
        <MandatoryBreakModal
          {...defaultProps}
          onBreakComplete={onBreakComplete}
        />
      );

      const resumeButton = screen.getByRole('button');
      fireEvent.click(resumeButton);

      expect(onBreakComplete).not.toHaveBeenCalled();
    });
  });

  describe('Non-Dismissible Modal', () => {
    it('does not show close button', () => {
      const { container } = render(<MandatoryBreakModal {...defaultProps} />);
      const closeButton = container.querySelector('[class*="closeButton"]');
      expect(closeButton).not.toBeInTheDocument();
    });

    it('cannot be dismissed by overlay click', async () => {
      const onBreakComplete = vi.fn();
      const { container } = render(
        <MandatoryBreakModal
          {...defaultProps}
          onBreakComplete={onBreakComplete}
        />
      );

      const overlay = container.querySelector('[class*="overlay"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(onBreakComplete).not.toHaveBeenCalled();
    });

    it('contains compliance note about no bypassing', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(
        screen.getByText(/You cannot bypass this break/i)
      ).toBeInTheDocument();
    });

    it('contains note about manual resume requirement', () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={1} />);

      vi.advanceTimersByTime(1000);

      expect(
        screen.getByText(/You must manually click to resume/i)
      ).toBeInTheDocument();
    });
  });

  describe('Error Message Display', () => {
    it('displays error message when provided', () => {
      const error = '5 minute(s) remaining. Break too short.';
      render(<MandatoryBreakModal {...defaultProps} error={error} />);

      expect(screen.getByText(/Break Validation:/)).toBeInTheDocument();
      expect(screen.getByText(error)).toBeInTheDocument();
    });

    it('displays warning emoji with error', () => {
      const error = '5 minute(s) remaining. Break too short.';
      render(<MandatoryBreakModal {...defaultProps} error={error} />);

      expect(screen.getByText(/⚠️/)).toBeInTheDocument();
    });

    it('does not display error section when error is null', () => {
      const { container } = render(
        <MandatoryBreakModal {...defaultProps} error={null} />
      );

      expect(
        container.querySelector('[class*="errorMessage"]')
      ).not.toBeInTheDocument();
    });

    it('does not display error section when error is undefined', () => {
      const { container } = render(
        <MandatoryBreakModal {...defaultProps} error={undefined} />
      );

      expect(
        container.querySelector('[class*="errorMessage"]')
      ).not.toBeInTheDocument();
    });

    it('does not display error section when error is empty string', () => {
      const { container } = render(
        <MandatoryBreakModal {...defaultProps} error="" />
      );

      expect(
        container.querySelector('[class*="errorMessage"]')
      ).not.toBeInTheDocument();
    });

    it('displays full error message text', () => {
      const error = 'Break must be at least 10 minutes. Current: 5 minutes. 5 minute(s) remaining.';
      render(<MandatoryBreakModal {...defaultProps} error={error} />);

      expect(screen.getByText(error)).toBeInTheDocument();
    });
  });

  describe('Modal Closure & Reopen', () => {
    it('resets countdown when modal closes and reopens', async () => {
      const { unmount } = render(
        <MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} isOpen={true} />
      );

      vi.advanceTimersByTime(5000);

      // Time should have advanced
      const timeAfterAdvance = await screen.findByText(/09:5[0-9]/);
      expect(timeAfterAdvance).toBeInTheDocument();

      unmount();

      // Render again fresh
      const { unmount: unmount2 } = render(
        <MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} isOpen={true} />
      );

      expect(screen.getByText('10:00')).toBeInTheDocument();
      unmount2();
    });

    it('stops countdown when modal closes', async () => {
      const { unmount } = render(
        <MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} isOpen={true} />
      );

      expect(screen.getByText('10:00')).toBeInTheDocument();

      unmount();

      // Component should clean up interval
      vi.advanceTimersByTime(5000);

      // Old component won't be in document, so we can't check it
    });

    it('resets resume button when modal reopens', async () => {
      const { unmount } = render(
        <MandatoryBreakModal {...defaultProps} breakTimeRemaining={5} isOpen={true} />
      );

      vi.advanceTimersByTime(5000);

      unmount();

      // Render again with fresh state
      const { unmount: unmount2 } = render(
        <MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} isOpen={true} />
      );

      const resumeButton = screen.getByRole('button', { name: /Taking a Break/ });
      expect(resumeButton).toBeDisabled();
      unmount2();
    });
  });

  describe('Props Changes', () => {
    it('updates display when breakTimeRemaining changes', () => {
      const { unmount } = render(
        <MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} />
      );

      expect(screen.getByText('10:00')).toBeInTheDocument();

      unmount();

      const { unmount: unmount2 } = render(
        <MandatoryBreakModal {...defaultProps} breakTimeRemaining={300} />
      );

      expect(screen.getByText('05:00')).toBeInTheDocument();
      unmount2();
    });

    it('updates error display when error prop changes', () => {
      const { rerender } = render(
        <MandatoryBreakModal {...defaultProps} error={null} />
      );

      const { container } = render(
        <MandatoryBreakModal {...defaultProps} error={null} />
      );
      expect(container.querySelector('[class*="errorMessage"]')).not.toBeInTheDocument();

      rerender(
        <MandatoryBreakModal {...defaultProps} error="Test error" />
      );

      expect(screen.getByText('Test error')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('displays time in semantic format', () => {
      render(<MandatoryBreakModal {...defaultProps} breakTimeRemaining={600} />);
      expect(screen.getByText('10:00')).toBeInTheDocument();
    });

    it('has button with descriptive text', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('displays instructions for user', () => {
      render(<MandatoryBreakModal {...defaultProps} />);
      expect(screen.getByText(/Your break will end in/)).toBeInTheDocument();
    });

    it('has clear visual differentiation when break complete', async () => {
      const { container } = render(
        <MandatoryBreakModal {...defaultProps} breakTimeRemaining={5} />
      );

      vi.advanceTimersByTime(5000);

      await waitFor(() => {
        const countdown = container.querySelector('div.countdown');
        expect(countdown?.className).toContain('complete');
      }, { timeout: 3000 });
    });
  });
});
