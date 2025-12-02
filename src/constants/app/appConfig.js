// Application Configuration Constants
// Global configuration settings for the LMS

export const APP_CONFIG = {
  // Session Management
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
  IDLE_TIMEOUT: 15 * 60 * 1000, // 15 minutes in milliseconds
  
  // Time Tracking
  MAX_DAILY_HOURS: 8, // Maximum hours per day for learning
  MIN_SESSION_DURATION: 5 * 60, // Minimum 5 minutes per session (in seconds)
  MAX_SESSION_DURATION: 4 * 60 * 60, // Maximum 4 hours per session (in seconds)
  
  // Break Intervals
  BREAK_INTERVALS: {
    SHORT_BREAK: 5 * 60, // 5 minutes
    MEDIUM_BREAK: 15 * 60, // 15 minutes
    LONG_BREAK: 30 * 60 // 30 minutes
  },
  
  // Recommended break after continuous learning
  RECOMMENDED_BREAK_AFTER: 50 * 60, // 50 minutes of continuous learning
  
  // Pagination
  ITEMS_PER_PAGE: 10,
  COURSES_PER_PAGE: 12,
  LESSONS_PER_PAGE: 20,
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/ogg'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  
  // Quiz Configuration
  QUIZ_TIME_LIMIT: 30 * 60, // 30 minutes per quiz
  PASSING_SCORE: 70, // 70% to pass
  MAX_QUIZ_ATTEMPTS: 3,
  
  // Progress Tracking
  LESSON_COMPLETION_THRESHOLD: 90, // 90% of video watched to mark as complete
  AUTO_SAVE_INTERVAL: 30 * 1000, // Auto-save progress every 30 seconds
  
  // Notifications
  NOTIFICATION_DURATION: 5000, // 5 seconds
  MAX_NOTIFICATIONS: 5,
  
  // Cache
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  
  // API
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  
  // UI
  ANIMATION_DURATION: 300, // milliseconds
  DEBOUNCE_DELAY: 500, // milliseconds for search inputs
  
  // Course Requirements
  MIN_COURSE_MODULES: 1,
  MIN_LESSONS_PER_MODULE: 1,
  
  // Certificate
  CERTIFICATE_VALIDITY_YEARS: 5
};

export default APP_CONFIG;
