// Progress Status Constants
// Define progress states for courses, modules, and lessons

export const PROGRESS_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  LOCKED: 'locked',
  FAILED: 'failed',
  PASSED: 'passed'
};

export const STATUS_CONFIG = {
  [PROGRESS_STATUS.NOT_STARTED]: {
    label: 'Not Started',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    icon: '⭕',
    description: 'Not yet started',
    order: 1
  },
  
  [PROGRESS_STATUS.LOCKED]: {
    label: 'Locked',
    color: '#9CA3AF',
    backgroundColor: '#E5E7EB',
    icon: '🔒',
    description: 'Complete prerequisites to unlock',
    order: 0
  },
  
  [PROGRESS_STATUS.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#3B82F6',
    backgroundColor: '#DBEAFE',
    icon: '▶️',
    description: 'Currently in progress',
    order: 2
  },
  
  [PROGRESS_STATUS.COMPLETED]: {
    label: 'Completed',
    color: '#10B981',
    backgroundColor: '#D1FAE5',
    icon: '✅',
    description: 'Successfully completed',
    order: 4
  },
  
  [PROGRESS_STATUS.PASSED]: {
    label: 'Passed',
    color: '#059669',
    backgroundColor: '#A7F3D0',
    icon: '🎉',
    description: 'Passed with required score',
    order: 5
  },
  
  [PROGRESS_STATUS.FAILED]: {
    label: 'Failed',
    color: '#EF4444',
    backgroundColor: '#FEE2E2',
    icon: '❌',
    description: 'Did not meet requirements',
    order: 3
  }
};

// Helper function to get status configuration
export const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || STATUS_CONFIG[PROGRESS_STATUS.NOT_STARTED];
};

// Helper function to get status label
export const getStatusLabel = (status) => {
  const config = getStatusConfig(status);
  return config.label;
};

// Helper function to get status color
export const getStatusColor = (status) => {
  const config = getStatusConfig(status);
  return config.color;
};

// Helper function to get status background color
export const getStatusBackgroundColor = (status) => {
  const config = getStatusConfig(status);
  return config.backgroundColor;
};

// Helper function to get status icon
export const getStatusIcon = (status) => {
  const config = getStatusConfig(status);
  return config.icon;
};

// Helper function to check if status is completed
export const isCompleted = (status) => {
  return status === PROGRESS_STATUS.COMPLETED || status === PROGRESS_STATUS.PASSED;
};

// Helper function to check if status is in progress
export const isInProgress = (status) => {
  return status === PROGRESS_STATUS.IN_PROGRESS;
};

// Helper function to check if status is locked
export const isLocked = (status) => {
  return status === PROGRESS_STATUS.LOCKED;
};

// Helper function to check if status is failed
export const isFailed = (status) => {
  return status === PROGRESS_STATUS.FAILED;
};

// Helper function to calculate overall progress percentage
export const calculateProgressPercentage = (completedItems, totalItems) => {
  if (totalItems === 0) return 0;
  return Math.round((completedItems / totalItems) * 100);
};

// Helper function to determine status based on percentage
export const getStatusFromPercentage = (percentage) => {
  if (percentage === 0) return PROGRESS_STATUS.NOT_STARTED;
  if (percentage === 100) return PROGRESS_STATUS.COMPLETED;
  return PROGRESS_STATUS.IN_PROGRESS;
};

export default {
  PROGRESS_STATUS,
  STATUS_CONFIG,
  getStatusConfig,
  getStatusLabel,
  getStatusColor,
  getStatusBackgroundColor,
  getStatusIcon,
  isCompleted,
  isInProgress,
  isLocked,
  isFailed,
  calculateProgressPercentage,
  getStatusFromPercentage
};