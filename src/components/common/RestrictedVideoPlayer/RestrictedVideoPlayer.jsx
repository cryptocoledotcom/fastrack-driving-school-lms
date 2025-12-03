import React, { useRef, useEffect, useState } from 'react';
import styles from './RestrictedVideoPlayer.module.css';

const RestrictedVideoPlayer = ({
  src,
  onEnded,
  onTimeUpdate,
  onLoadedMetadata,
  duration
}) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [error, setError] = useState(null);

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
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

  const handleSeek = (e) => {
    e.preventDefault();
    if (videoRef.current) {
      videoRef.current.currentTime = currentTime;
    }
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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleError = () => {
      setError('Failed to load video. Please check the URL and try again.');
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('error', handleError);
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

  return (
    <div className={styles.container}>
      {error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <div className={styles.videoWrapper}>
            <video
              ref={videoRef}
              src={src}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleVideoEnded}
              onSeek={handleSeek}
              className={styles.video}
              controlsList="nodownload nofullscreen"
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
              >
                {isPlaying ? '⏸' : '▶'}
              </button>

              <div className={styles.timeDisplay}>
                <span>{formatTime(currentTime)}</span>
                <span> / </span>
                <span>{formatTime(videoDuration)}</span>
              </div>

              <div className={styles.seekWarning}>
                ⚠️ Seeking disabled (compliance requirement)
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
};

export default RestrictedVideoPlayer;
