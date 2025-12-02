// Lesson Types Constants
// Define different types of lessons available in the LMS

export const LESSON_TYPES = {
  VIDEO: 'video',
  READING: 'reading',
  QUIZ: 'quiz',
  TEST: 'test',
  INTERACTIVE: 'interactive',
  ASSIGNMENT: 'assignment',
  DISCUSSION: 'discussion',
  PRACTICAL: 'practical'
};

export const LESSON_TYPE_CONFIG = {
  [LESSON_TYPES.VIDEO]: {
    label: 'Video Lesson',
    icon: '🎥',
    description: 'Watch instructional videos',
    requiresCompletion: true,
    trackProgress: true,
    allowsReview: true,
    estimatedTimeMultiplier: 1.0
  },
  
  [LESSON_TYPES.READING]: {
    label: 'Reading Material',
    icon: '📖',
    description: 'Read course materials and documents',
    requiresCompletion: true,
    trackProgress: true,
    allowsReview: true,
    estimatedTimeMultiplier: 0.8
  },
  
  [LESSON_TYPES.QUIZ]: {
    label: 'Quiz',
    icon: '📝',
    description: 'Test your knowledge with quizzes',
    requiresCompletion: true,
    trackProgress: true,
    allowsReview: true,
    hasAttemptLimit: true,
    maxAttempts: 3,
    passingScore: 70,
    estimatedTimeMultiplier: 0.5
  },
  
  [LESSON_TYPES.TEST]: {
    label: 'Test',
    icon: '✍️',
    description: 'Complete comprehensive tests',
    requiresCompletion: true,
    trackProgress: true,
    allowsReview: false,
    hasAttemptLimit: true,
    maxAttempts: 2,
    passingScore: 80,
    estimatedTimeMultiplier: 1.5
  },
  
  [LESSON_TYPES.INTERACTIVE]: {
    label: 'Interactive Exercise',
    icon: '🎮',
    description: 'Engage with interactive simulations',
    requiresCompletion: true,
    trackProgress: true,
    allowsReview: true,
    estimatedTimeMultiplier: 1.2
  },
  
  [LESSON_TYPES.ASSIGNMENT]: {
    label: 'Assignment',
    icon: '📋',
    description: 'Complete and submit assignments',
    requiresCompletion: true,
    trackProgress: true,
    allowsReview: true,
    requiresSubmission: true,
    estimatedTimeMultiplier: 2.0
  },
  
  [LESSON_TYPES.DISCUSSION]: {
    label: 'Discussion',
    icon: '💬',
    description: 'Participate in course discussions',
    requiresCompletion: false,
    trackProgress: true,
    allowsReview: true,
    estimatedTimeMultiplier: 0.5
  },
  
  [LESSON_TYPES.PRACTICAL]: {
    label: 'Practical Session',
    icon: '🚗',
    description: 'Hands-on driving practice',
    requiresCompletion: true,
    trackProgress: true,
    allowsReview: false,
    requiresInstructor: true,
    estimatedTimeMultiplier: 3.0
  }
};

// Helper function to get lesson type configuration
export const getLessonTypeConfig = (type) => {
  return LESSON_TYPE_CONFIG[type] || null;
};

// Helper function to check if lesson type requires completion
export const requiresCompletion = (type) => {
  const config = getLessonTypeConfig(type);
  return config ? config.requiresCompletion : false;
};

// Helper function to check if lesson type has attempt limit
export const hasAttemptLimit = (type) => {
  const config = getLessonTypeConfig(type);
  return config ? config.hasAttemptLimit === true : false;
};

// Helper function to get max attempts for lesson type
export const getMaxAttempts = (type) => {
  const config = getLessonTypeConfig(type);
  return config && config.maxAttempts ? config.maxAttempts : Infinity;
};

// Helper function to get passing score for lesson type
export const getPassingScore = (type) => {
  const config = getLessonTypeConfig(type);
  return config && config.passingScore ? config.passingScore : 0;
};

const lessonTypes = {
  LESSON_TYPES,
  LESSON_TYPE_CONFIG,
  getLessonTypeConfig,
  requiresCompletion,
  hasAttemptLimit,
  getMaxAttempts,
  getPassingScore
};

export default lessonTypes;
