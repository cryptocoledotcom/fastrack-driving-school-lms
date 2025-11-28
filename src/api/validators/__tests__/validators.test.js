import {
  validateUserId,
  validateCourseId,
  validateModuleId,
  validateLessonId,
  validateEmail,
  validateSessionId,
  validateQuizAttemptData,
  validateEnrollmentData,
  validateBreakData,
  validateLessonCompletionData,
  validatePVQData,
  validatePaymentData,
  validateProgressData,
  validateLessonData,
  validateModuleData,
  validateCourseData,
  validateTimeSlotData
} from '../validators';

import { ValidationError } from '../../errors/ApiError';

describe('Validators', () => {
  describe('validateUserId', () => {
    it('should accept valid user ID', () => {
      expect(() => validateUserId('user123')).not.toThrow();
    });

    it('should reject null userId', () => {
      expect(() => validateUserId(null)).toThrow(ValidationError);
    });

    it('should reject undefined userId', () => {
      expect(() => validateUserId(undefined)).toThrow(ValidationError);
    });

    it('should reject empty string', () => {
      expect(() => validateUserId('')).toThrow(ValidationError);
    });

    it('should reject whitespace-only string', () => {
      expect(() => validateUserId('   ')).toThrow(ValidationError);
    });

    it('should reject non-string', () => {
      expect(() => validateUserId(123)).toThrow(ValidationError);
    });

    it('should reject object', () => {
      expect(() => validateUserId({})).toThrow(ValidationError);
    });
  });

  describe('validateCourseId', () => {
    it('should accept valid course ID', () => {
      expect(() => validateCourseId('course_basic_01')).not.toThrow();
    });

    it('should reject null courseId', () => {
      expect(() => validateCourseId(null)).toThrow(ValidationError);
    });

    it('should reject undefined courseId', () => {
      expect(() => validateCourseId(undefined)).toThrow(ValidationError);
    });

    it('should reject empty string', () => {
      expect(() => validateCourseId('')).toThrow(ValidationError);
    });

    it('should reject whitespace-only string', () => {
      expect(() => validateCourseId('   ')).toThrow(ValidationError);
    });

    it('should reject non-string', () => {
      expect(() => validateCourseId(456)).toThrow(ValidationError);
    });
  });

  describe('validateModuleId', () => {
    it('should accept valid module ID', () => {
      expect(() => validateModuleId('module123')).not.toThrow();
    });

    it('should reject null moduleId', () => {
      expect(() => validateModuleId(null)).toThrow(ValidationError);
    });

    it('should reject empty string', () => {
      expect(() => validateModuleId('')).toThrow(ValidationError);
    });

    it('should reject whitespace-only string', () => {
      expect(() => validateModuleId('   ')).toThrow(ValidationError);
    });
  });

  describe('validateLessonId', () => {
    it('should accept valid lesson ID', () => {
      expect(() => validateLessonId('lesson123')).not.toThrow();
    });

    it('should reject null lessonId', () => {
      expect(() => validateLessonId(null)).toThrow(ValidationError);
    });

    it('should reject empty string', () => {
      expect(() => validateLessonId('')).toThrow(ValidationError);
    });

    it('should reject whitespace-only string', () => {
      expect(() => validateLessonId('   ')).toThrow(ValidationError);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid email', () => {
      expect(() => validateEmail('user@example.com')).not.toThrow();
    });

    it('should accept email with subdomain', () => {
      expect(() => validateEmail('user@mail.example.com')).not.toThrow();
    });

    it('should accept email with numbers', () => {
      expect(() => validateEmail('user123@example.com')).not.toThrow();
    });

    it('should reject null email', () => {
      expect(() => validateEmail(null)).toThrow(ValidationError);
    });

    it('should reject undefined email', () => {
      expect(() => validateEmail(undefined)).toThrow(ValidationError);
    });

    it('should reject empty string', () => {
      expect(() => validateEmail('')).toThrow(ValidationError);
    });

    it('should reject invalid format (no @)', () => {
      expect(() => validateEmail('userexample.com')).toThrow(ValidationError);
    });

    it('should reject invalid format (no domain)', () => {
      expect(() => validateEmail('user@')).toThrow(ValidationError);
    });

    it('should reject invalid format (no local part)', () => {
      expect(() => validateEmail('@example.com')).toThrow(ValidationError);
    });

    it('should reject non-string', () => {
      expect(() => validateEmail(123)).toThrow(ValidationError);
    });
  });

  describe('validateSessionId', () => {
    it('should accept valid session ID', () => {
      expect(() => validateSessionId('session123')).not.toThrow();
    });

    it('should reject null sessionId', () => {
      expect(() => validateSessionId(null)).toThrow(ValidationError);
    });

    it('should reject empty string', () => {
      expect(() => validateSessionId('')).toThrow(ValidationError);
    });
  });

  describe('validateQuizAttemptData', () => {
    it('should accept valid quiz attempt data', () => {
      const data = {
        userId: 'user123',
        courseId: 'course123',
        quizId: 'quiz123',
        score: 85,
        passed: true
      };
      expect(() => validateQuizAttemptData(data)).not.toThrow();
    });

    it('should reject if userId missing', () => {
      const data = {
        courseId: 'course123',
        quizId: 'quiz123',
        score: 85
      };
      expect(() => validateQuizAttemptData(data)).toThrow(ValidationError);
    });

    it('should reject if courseId missing', () => {
      const data = {
        userId: 'user123',
        quizId: 'quiz123',
        score: 85
      };
      expect(() => validateQuizAttemptData(data)).toThrow(ValidationError);
    });

    it('should reject if quizId missing', () => {
      const data = {
        userId: 'user123',
        courseId: 'course123',
        score: 85
      };
      expect(() => validateQuizAttemptData(data)).toThrow(ValidationError);
    });

    it('should reject invalid score (negative)', () => {
      const data = {
        userId: 'user123',
        courseId: 'course123',
        quizId: 'quiz123',
        score: -10
      };
      expect(() => validateQuizAttemptData(data)).toThrow(ValidationError);
    });

    it('should reject invalid score (over 100)', () => {
      const data = {
        userId: 'user123',
        courseId: 'course123',
        quizId: 'quiz123',
        score: 150
      };
      expect(() => validateQuizAttemptData(data)).toThrow(ValidationError);
    });

    it('should reject non-object', () => {
      expect(() => validateQuizAttemptData('not an object')).toThrow(ValidationError);
    });

    it('should reject null', () => {
      expect(() => validateQuizAttemptData(null)).toThrow(ValidationError);
    });
  });

  describe('validateEnrollmentData', () => {
    it('should accept valid enrollment data', () => {
      expect(() => validateEnrollmentData('user123', 'course123', 'user@example.com')).not.toThrow();
    });

    it('should reject invalid userId', () => {
      expect(() => validateEnrollmentData(null, 'course123', 'user@example.com')).toThrow(ValidationError);
    });

    it('should reject invalid courseId', () => {
      expect(() => validateEnrollmentData('user123', null, 'user@example.com')).toThrow(ValidationError);
    });

    it('should reject invalid email', () => {
      expect(() => validateEnrollmentData('user123', 'course123', 'invalid-email')).toThrow(ValidationError);
    });

    it('should reject empty userId', () => {
      expect(() => validateEnrollmentData('', 'course123', 'user@example.com')).toThrow(ValidationError);
    });

    it('should reject empty courseId', () => {
      expect(() => validateEnrollmentData('user123', '', 'user@example.com')).toThrow(ValidationError);
    });
  });

  describe('validateBreakData', () => {
    it('should accept valid break data', () => {
      const breakData = {
        userId: 'user123',
        sessionId: 'session123',
        breakType: 'mandatory',
        startTime: new Date().toISOString(),
        duration: 600
      };
      expect(() => validateBreakData(breakData)).not.toThrow();
    });

    it('should reject if userId missing', () => {
      const breakData = {
        sessionId: 'session123',
        startTime: new Date().toISOString(),
        duration: 600
      };
      expect(() => validateBreakData(breakData)).toThrow(ValidationError);
    });

    it('should reject if sessionId missing', () => {
      const breakData = {
        userId: 'user123',
        startTime: new Date().toISOString(),
        duration: 600
      };
      expect(() => validateBreakData(breakData)).toThrow(ValidationError);
    });

    it('should reject invalid duration', () => {
      const breakData = {
        userId: 'user123',
        sessionId: 'session123',
        startTime: new Date().toISOString(),
        duration: -100
      };
      expect(() => validateBreakData(breakData)).toThrow(ValidationError);
    });

    it('should reject null breakData', () => {
      expect(() => validateBreakData(null)).toThrow(ValidationError);
    });
  });

  describe('validateLessonCompletionData', () => {
    it('should accept valid lesson completion data', () => {
      const data = {
        userId: 'user123',
        lessonId: 'lesson123',
        courseId: 'course123',
        completedAt: new Date().toISOString()
      };
      expect(() => validateLessonCompletionData(data)).not.toThrow();
    });

    it('should reject if userId missing', () => {
      const data = {
        lessonId: 'lesson123',
        courseId: 'course123',
        completedAt: new Date().toISOString()
      };
      expect(() => validateLessonCompletionData(data)).toThrow(ValidationError);
    });

    it('should reject if lessonId missing', () => {
      const data = {
        userId: 'user123',
        courseId: 'course123',
        completedAt: new Date().toISOString()
      };
      expect(() => validateLessonCompletionData(data)).toThrow(ValidationError);
    });

    it('should reject null', () => {
      expect(() => validateLessonCompletionData(null)).toThrow(ValidationError);
    });
  });

  describe('validatePVQData', () => {
    it('should accept valid PVQ data', () => {
      const data = {
        userId: 'user123',
        questionId: 'question123',
        answer: 'correct_answer',
        timestamp: new Date().toISOString()
      };
      expect(() => validatePVQData(data)).not.toThrow();
    });

    it('should reject if userId missing', () => {
      const data = {
        questionId: 'question123',
        answer: 'correct_answer',
        timestamp: new Date().toISOString()
      };
      expect(() => validatePVQData(data)).toThrow(ValidationError);
    });

    it('should reject if questionId missing', () => {
      const data = {
        userId: 'user123',
        answer: 'correct_answer',
        timestamp: new Date().toISOString()
      };
      expect(() => validatePVQData(data)).toThrow(ValidationError);
    });

    it('should reject if answer missing', () => {
      const data = {
        userId: 'user123',
        questionId: 'question123',
        timestamp: new Date().toISOString()
      };
      expect(() => validatePVQData(data)).toThrow(ValidationError);
    });

    it('should reject null', () => {
      expect(() => validatePVQData(null)).toThrow(ValidationError);
    });
  });

  describe('validatePaymentData', () => {
    it('should accept valid payment data', () => {
      expect(() => validatePaymentData('user123', 'course123', 9900, 'full_payment')).not.toThrow();
    });

    it('should reject invalid userId', () => {
      expect(() => validatePaymentData(null, 'course123', 9900, 'full_payment')).toThrow(ValidationError);
    });

    it('should reject invalid courseId', () => {
      expect(() => validatePaymentData('user123', null, 9900, 'full_payment')).toThrow(ValidationError);
    });

    it('should reject invalid amount (negative)', () => {
      expect(() => validatePaymentData('user123', 'course123', -100, 'full_payment')).toThrow(ValidationError);
    });

    it('should reject invalid amount (zero)', () => {
      expect(() => validatePaymentData('user123', 'course123', 0, 'full_payment')).toThrow(ValidationError);
    });

    it('should reject invalid paymentType', () => {
      expect(() => validatePaymentData('user123', 'course123', 9900, null)).toThrow(ValidationError);
    });
  });

  describe('validateProgressData', () => {
    it('should accept valid progress data', () => {
      expect(() => validateProgressData('user123', 'course123', 10)).not.toThrow();
    });

    it('should reject invalid userId', () => {
      expect(() => validateProgressData(null, 'course123', 10)).toThrow(ValidationError);
    });

    it('should reject invalid courseId', () => {
      expect(() => validateProgressData('user123', null, 10)).toThrow(ValidationError);
    });

    it('should reject invalid totalLessons (negative)', () => {
      expect(() => validateProgressData('user123', 'course123', -5)).toThrow(ValidationError);
    });

    it('should reject invalid totalLessons (zero)', () => {
      expect(() => validateProgressData('user123', 'course123', 0)).toThrow(ValidationError);
    });

    it('should reject invalid totalLessons (non-number)', () => {
      expect(() => validateProgressData('user123', 'course123', 'ten')).toThrow(ValidationError);
    });
  });

  describe('validateLessonData', () => {
    it('should accept valid lesson data', () => {
      const data = {
        courseId: 'course123',
        moduleId: 'module123',
        title: 'Lesson Title',
        order: 1
      };
      expect(() => validateLessonData(data)).not.toThrow();
    });

    it('should reject if courseId missing', () => {
      const data = {
        moduleId: 'module123',
        title: 'Lesson Title',
        order: 1
      };
      expect(() => validateLessonData(data)).toThrow(ValidationError);
    });

    it('should reject if moduleId missing', () => {
      const data = {
        courseId: 'course123',
        title: 'Lesson Title',
        order: 1
      };
      expect(() => validateLessonData(data)).toThrow(ValidationError);
    });

    it('should reject if title missing', () => {
      const data = {
        courseId: 'course123',
        moduleId: 'module123',
        order: 1
      };
      expect(() => validateLessonData(data)).toThrow(ValidationError);
    });

    it('should reject null', () => {
      expect(() => validateLessonData(null)).toThrow(ValidationError);
    });
  });

  describe('validateModuleData', () => {
    it('should accept valid module data', () => {
      const data = {
        courseId: 'course123',
        title: 'Module Title',
        order: 1
      };
      expect(() => validateModuleData(data)).not.toThrow();
    });

    it('should reject if courseId missing', () => {
      const data = {
        title: 'Module Title',
        order: 1
      };
      expect(() => validateModuleData(data)).toThrow(ValidationError);
    });

    it('should reject if title missing', () => {
      const data = {
        courseId: 'course123',
        order: 1
      };
      expect(() => validateModuleData(data)).toThrow(ValidationError);
    });

    it('should reject null', () => {
      expect(() => validateModuleData(null)).toThrow(ValidationError);
    });
  });

  describe('validateCourseData', () => {
    it('should accept valid course data', () => {
      const data = {
        title: 'Course Title',
        description: 'Course Description'
      };
      expect(() => validateCourseData(data)).not.toThrow();
    });

    it('should reject if title missing', () => {
      const data = {
        description: 'Course Description'
      };
      expect(() => validateCourseData(data)).toThrow(ValidationError);
    });

    it('should reject if description missing', () => {
      const data = {
        title: 'Course Title'
      };
      expect(() => validateCourseData(data)).toThrow(ValidationError);
    });

    it('should reject null', () => {
      expect(() => validateCourseData(null)).toThrow(ValidationError);
    });
  });

  describe('validateTimeSlotData', () => {
    it('should accept valid time slot data', () => {
      const data = {
        instructorId: 'instructor123',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      };
      expect(() => validateTimeSlotData(data)).not.toThrow();
    });

    it('should reject if instructorId missing', () => {
      const data = {
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString()
      };
      expect(() => validateTimeSlotData(data)).toThrow(ValidationError);
    });

    it('should reject if startTime missing', () => {
      const data = {
        instructorId: 'instructor123',
        endTime: new Date(Date.now() + 3600000).toISOString()
      };
      expect(() => validateTimeSlotData(data)).toThrow(ValidationError);
    });

    it('should reject if endTime missing', () => {
      const data = {
        instructorId: 'instructor123',
        startTime: new Date().toISOString()
      };
      expect(() => validateTimeSlotData(data)).toThrow(ValidationError);
    });

    it('should reject null', () => {
      expect(() => validateTimeSlotData(null)).toThrow(ValidationError);
    });
  });

  describe('Error Messages', () => {
    it('should include helpful error messages for validation failures', () => {
      try {
        validateUserId(null);
      } catch (error) {
        expect(error.message).toContain('User ID');
        expect(error.message.length > 0).toBe(true);
      }
    });

    it('should be instances of ValidationError', () => {
      expect(() => validateEmail('invalid')).toThrow(ValidationError);
      expect(() => validateCourseId(123)).toThrow(ValidationError);
      expect(() => validateQuizAttemptData(null)).toThrow(ValidationError);
    });
  });
});
