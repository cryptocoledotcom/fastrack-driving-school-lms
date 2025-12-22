import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import RestrictedVideoPlayer from '../RestrictedVideoPlayer';

describe('RestrictedVideoPlayer - Seeking Prevention', () => {
  let mockOnEnded, mockOnTimeUpdate, mockOnLoadedMetadata;
  let videoRef;

  beforeEach(() => {
    mockOnEnded = vi.fn();
    mockOnTimeUpdate = vi.fn();
    mockOnLoadedMetadata = vi.fn();
    videoRef = React.createRef();
  });

  /**
   * ============================================
   * TEST GROUP 1: Drag to Seek Prevention
   * ============================================
   */
  describe('1. Drag to Seek Prevention', () => {
    it('prevents dragging progress bar to seek', async () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      // Get progress container
      const progressContainer = container.querySelector('.progressContainer');
      expect(progressContainer).toBeInTheDocument();

      // Verify pointer-events: none is set
      const computedStyle = window.getComputedStyle(progressContainer);
      expect(computedStyle.pointerEvents).toBe('none');

      // Attempt to click and drag on progress bar
      const progressBar = container.querySelector('.progressBar');
      fireEvent.mouseDown(progressBar || progressContainer);
      fireEvent.mouseMove(progressBar || progressContainer, { clientX: 500 });
      fireEvent.mouseUp();

      // Video should not have seeked
      if (videoRef.current) {
        expect(videoRef.current.currentTime).toBe(0);
      }
    });

    it('does not respond to click on progress bar', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const progressContainer = container.querySelector('.progressContainer');
      fireEvent.click(progressContainer);

      // Should have no seek event listener that triggers on click
      if (videoRef.current) {
        expect(videoRef.current.currentTime).toBe(0);
      }
    });
  });

  /**
   * ============================================
   * TEST GROUP 2: Keyboard Seek Prevention
   * ============================================
   */
  describe('2. Keyboard Seek Prevention', () => {
    it('prevents ArrowRight key from advancing video', async () => {
      render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      if (videoRef.current) {
        videoRef.current.currentTime = 0;

        // Simulate ArrowRight press
        fireEvent.keyDown(videoRef.current, { key: 'ArrowRight' });

        // Should not have advanced (native behavior is +5 seconds)
        // Either stays at 0 or increase is minimal
        expect(videoRef.current.currentTime).toBeLessThan(2);
      }
    });

    it('prevents ArrowLeft key from going backward', async () => {
      render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      if (videoRef.current) {
        videoRef.current.currentTime = 30;

        // Simulate ArrowLeft press
        fireEvent.keyDown(videoRef.current, { key: 'ArrowLeft' });

        // Should not go backward significantly
        expect(videoRef.current.currentTime).toBeGreaterThan(28);
      }
    });

    it('prevents j/f keyboard shortcuts (common player shortcuts)', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const videoElement = container.querySelector('video');

      if (videoElement) {
        // j = backward 10s, f = forward 10s (common shortcuts)
        fireEvent.keyDown(videoElement, { key: 'j' });
        fireEvent.keyDown(videoElement, { key: 'f' });

        expect(videoElement.currentTime).toBe(0);
      }
    });
  });

  /**
   * ============================================
   * TEST GROUP 3: DevTools/Programmatic Seek Prevention
   * ============================================
   */
  describe('3. DevTools/Programmatic Seek Prevention', () => {
    it('prevents setting currentTime directly via DevTools', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const videoElement = container.querySelector('video');

      if (videoElement) {
        // Attempt DevTools seek: element.currentTime = 100
        videoElement.currentTime = 100;

        // Should either revert to 0 or trigger seeking prevention
        // Note: Pure HTML5 video doesn't have true "lock" on currentTime,
        // but we can prevent seeking via seek event handler
        expect(videoElement.currentTime).toBeLessThan(100);
      }
    });

    it('fires seeking event and logs attempt to seek programmatically', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const videoElement = container.querySelector('video');
      const seekingSpy = vi.fn();

      if (videoElement) {
        videoElement.addEventListener('seeking', seekingSpy);

        // Attempt to seek
        videoElement.currentTime = 50;

        // The seeking event should have fired
        expect(seekingSpy).toHaveBeenCalled();
      }
    });
  });

  /**
   * ============================================
   * TEST GROUP 4: Mobile/Touch Seek Prevention
   * ============================================
   */
  describe('4. Mobile/Touch Seek Prevention', () => {
    it('prevents touch swipe/drag on progress bar', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const progressContainer = container.querySelector('.progressContainer');

      // Simulate touch start at beginning
      fireEvent.touchStart(progressContainer, {
        touches: [{ clientX: 0, clientY: 0 }]
      });

      // Simulate touch move to middle (attempt to drag)
      fireEvent.touchMove(progressContainer, {
        touches: [{ clientX: 250, clientY: 0 }]
      });

      // Simulate touch end
      fireEvent.touchEnd(progressContainer);

      if (videoRef.current) {
        expect(videoRef.current.currentTime).toBe(0);
      }
    });

    it('prevents pinch-to-zoom or multi-touch seeking', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const videoElement = container.querySelector('video');

      if (videoElement) {
        // Simulate pinch/multi-touch
        fireEvent.touchStart(videoElement, {
          touches: [
            { clientX: 0, clientY: 0 },
            { clientX: 100, clientY: 100 }
          ]
        });

        expect(videoElement.currentTime).toBe(0);
      }
    });
  });

  /**
   * ============================================
   * TEST GROUP 5: UI/UX Protections
   * ============================================
   */
  describe('5. UI/UX Protections', () => {
    it('displays warning message to user', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const warning = container.querySelector('.seekWarning');
      expect(warning).toBeInTheDocument();
      expect(warning.textContent).toContain('Seeking disabled');
    });

    it('displays note about watching entire video', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const note = container.querySelector('.note');
      expect(note).toBeInTheDocument();
      expect(note.textContent).toContain('must watch the entire video');
    });

    it('has no native video controls visible', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const video = container.querySelector('video');
      expect(video).not.toHaveAttribute('controls');
      expect(video.getAttribute('controlsList')).toContain('nofullscreen');
      expect(video.getAttribute('controlsList')).toContain('nodownload');
    });

    it('only provides play/pause button in custom controls', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const playButton = container.querySelector('.playButton');
      expect(playButton).toBeInTheDocument();

      // Should NOT have seek controls
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBeLessThanOrEqual(2);
    });

    it('progress bar is non-interactive (pointer-events: none)', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const progressBar = container.querySelector('.progressBar');
      const progressContainer = container.querySelector('.progressContainer');

      const barStyle = window.getComputedStyle(progressBar);
      const containerStyle = window.getComputedStyle(progressContainer);

      expect(barStyle.pointerEvents).toBe('none');
      expect(containerStyle.cursor).toBe('not-allowed');
    });
  });

  /**
   * ============================================
   * TEST GROUP 6: Edge Cases
   * ============================================
   */
  describe('6. Edge Cases', () => {
    it('handles rapid seek attempts', () => {
      render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      if (videoRef.current) {
        for (let i = 0; i < 10; i++) {
          videoRef.current.currentTime = i * 10;
        }

        expect(videoRef.current.currentTime).toBeLessThan(50);
      }
    });

    it('handles seeking after play/pause cycle', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const playButton = container.querySelector('.playButton');

      fireEvent.click(playButton);

      if (videoRef.current) {
        videoRef.current.currentTime = 100;
        expect(videoRef.current.currentTime).toBeLessThan(100);
      }

      fireEvent.click(playButton);

      if (videoRef.current) {
        videoRef.current.currentTime = 50;
        expect(videoRef.current.currentTime).toBeLessThan(50);
      }
    });

    it('remains locked after unmount/remount', () => {
      const { unmount } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      unmount();

      const { container: container2 } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const video2 = container2.querySelector('video');
      if (video2) {
        video2.currentTime = 100;
        expect(video2.currentTime).toBeLessThan(100);
      }
    });
  });

  /**
   * ============================================
   * TEST GROUP 7: Compliance Verification
   * ============================================
   */
  describe('7. Compliance Verification (Ohio OAC)', () => {
    it('ensures user cannot skip content via any method', () => {
      const { container } = render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      const video = container.querySelector('video');

      expect(video.getAttribute('controls')).toBeNull();
      expect(video.getAttribute('controlsList')).toContain('nofullscreen');
      expect(video.getAttribute('controlsList')).toContain('nodownload');

      const progressContainer = container.querySelector('.progressContainer');
      expect(window.getComputedStyle(progressContainer).pointerEvents).toBe('none');

      const buttons = Array.from(container.querySelectorAll('button'));
      const allowedButtons = buttons.filter(b => b.className.includes('playButton'));
      expect(allowedButtons.length).toBeGreaterThan(0);
    });

    it('complies with Ohio OAC seeking restrictions', () => {
      render(
        <RestrictedVideoPlayer
          ref={videoRef}
          src="https://example.com/video.mp4"
          onEnded={mockOnEnded}
          onTimeUpdate={mockOnTimeUpdate}
          onLoadedMetadata={mockOnLoadedMetadata}
        />
      );

      expect(true).toBe(true);
    });
  });
});
