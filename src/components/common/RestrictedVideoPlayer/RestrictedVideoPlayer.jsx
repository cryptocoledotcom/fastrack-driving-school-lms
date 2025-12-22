import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

import styles from './RestrictedVideoPlayer.module.css';

const RestrictedVideoPlayer = forwardRef(({
  src,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  _duration
}, ref) => {
  const videoRef = useRef(null);
  const lastValidTimeRef = useRef(0);

  useImperativeHandle(ref, () => videoRef.current);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [error, setError] = useState(null);
  const [isBuffering, setIsBuffering] = useState(false);
  const [networkError, setNetworkError] = useState(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            if (error.name !== 'AbortError') {
              console.error('Play error:', error);
            }
          });
        }
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleRetry = () => {
    setError(null);
    setNetworkError(null);
    setIsBuffering(false);
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Retry play error:', err);
        }
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdate?.({
        currentTime: videoRef.current.currentTime,
        duration: videoRef.current.duration,
        percentWatched: (videoRef.current.currentTime / videoRef.current.duration) * 100
      });
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      onLoadedMetadata?.({
        duration: videoRef.current.duration
      });
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    onEnded?.();
  };



  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => {
      setIsPlaying(true);
      setNetworkError(null);
    };
    const handlePause = () => setIsPlaying(false);
    const handleError = (e) => {
      console.error('Video load error:', e);
      const networkMsg = 'Network error: Unable to load video. Check your connection and try again.';
      setNetworkError(networkMsg);
      setError(networkMsg);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);
    const handleLoadedData = () => {
      setIsBuffering(false);
      setNetworkError(null);
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('loadeddata', handleLoadedData);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('loadeddata', handleLoadedData);
    };
  }, []);

  useEffect(() => {
    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('contextmenu', handleContextMenu);
      return () => {
        videoElement.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, []);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleSeeking = (e) => {
      e.preventDefault();
      videoElement.currentTime = lastValidTimeRef.current;
    };

    const handleKeyDown = (e) => {
      const seekKeys = ['ArrowLeft', 'ArrowRight', 'j', 'f', 'l'];
      if (seekKeys.includes(e.key)) {
        e.preventDefault();
        return false;
      }
    };

    const handleProgress = (_e) => {
      lastValidTimeRef.current = videoElement.currentTime;
    };

    videoElement.addEventListener('seeking', handleSeeking);
    videoElement.addEventListener('timeupdate', handleProgress);
    videoElement.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      videoElement.removeEventListener('seeking', handleSeeking);
      videoElement.removeEventListener('timeupdate', handleProgress);
      videoElement.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className={styles.container}>
      {error ? (
        <div className={styles.error}>
          <div className={styles.errorContent}>
            <div className={styles.errorIcon}>⚠️</div>
            <div className={styles.errorMessage}>{error}</div>
            {networkError && (
              <button
                className={styles.retryButton}
                onClick={handleRetry}
                aria-label="Retry loading video"
              >
                🔄 Retry
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className={styles.videoWrapper}>
            {isBuffering && (
              <div className={styles.bufferingOverlay}>
                <div className={styles.spinner} />
                <div className={styles.bufferingText}>Buffering...</div>
              </div>
            )}
            <video
              ref={videoRef}
              src={src}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
              className={styles.video}
              controlsList="nodownload nofullscreen"
              crossOrigin="anonymous"
              controls={false}
            />
          </div>

          <div className={styles.customControls}>
            <div className={styles.progressContainer}>
              <div
                className={styles.progressBar}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className={styles.controlsBottom}>
              <button
                className={styles.playButton}
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pause' : 'Play'}
                disabled={isBuffering}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div className={styles.timeDisplay}>
                <span>{formatTime(currentTime)}</span>
                <span> / </span>
                <span>{formatTime(videoDuration)}</span>
              </div>

              <div className={styles.seekWarning}>
                {isBuffering ? '⏳ Buffering...' : '⚠️ Seeking disabled (compliance requirement)'}
              </div>
            </div>
          </div>

          <div className={styles.note}>
            Note: You must watch the entire video to proceed. Seeking is disabled to ensure content compliance.
          </div>
        </>
      )}
    </div>
  );
});

RestrictedVideoPlayer.displayName = 'RestrictedVideoPlayer';

export default RestrictedVideoPlayer;
