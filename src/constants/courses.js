// Course Constants
// Defines course IDs, pricing, and payment structures

export const COURSE_IDS = {
  ONLINE: 'fastrack-online',
  BEHIND_WHEEL: 'fastrack-behind-the-wheel',
  COMPLETE: 'fastrack-complete'
};

export const COURSE_TYPES = {
  ONLINE: 'online',
  IN_PERSON: 'in-person',
  BUNDLE: 'bundle'
};

export const COURSE_PRICING = {
  [COURSE_IDS.ONLINE]: {
    total: 99.99,
    upfront: 99.99,
    remaining: 0,
    currency: 'usd',
    description: '24-hour online driving course'
  },
  [COURSE_IDS.BEHIND_WHEEL]: {
    total: 499.99,
    upfront: 499.99,
    remaining: 0,
    currency: 'usd',
    description: '8-hour in-person instruction'
  },
  [COURSE_IDS.COMPLETE]: {
    total: 549.99,
    upfront: 99.99,
    remaining: 450,
    currency: 'usd',
    description: 'Complete package (Online + Behind-the-Wheel)',
    discount: 50, // Save ~$50 vs purchasing separately ($99.99 + $499.99)
    originalPrice: 599.98
  }
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const ENROLLMENT_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled'
};

export const ACCESS_STATUS = {
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  PENDING_CERTIFICATE: 'pending_certificate'
};

// Admin configuration
export const ADMIN_CONFIG = {
  // Add admin email(s) that should be auto-enrolled in all courses
  AUTO_ENROLL_EMAILS: [
    'admin@fastrackdrivingschool.com', 'colebowersock@gmail.com', 'cole@fastrackdrive.com',
    // Add more admin emails here
  ]
};

const courseConstants = {
  COURSE_IDS,
  COURSE_TYPES,
  COURSE_PRICING,
  PAYMENT_STATUS,
  ENROLLMENT_STATUS,
  ACCESS_STATUS,
  ADMIN_CONFIG
};

export default courseConstants;