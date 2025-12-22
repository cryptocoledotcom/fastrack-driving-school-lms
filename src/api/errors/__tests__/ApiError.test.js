import {
  ApiError,
  ValidationError,
  NotFoundError,
  AuthError,
  PermissionError,
  ComplianceError,
  EnrollmentError,
  PaymentError,
  QuizError,
  ProgressError,
  LessonError,
  ModuleError,
  CourseError,
  PVQError,
  SchedulingError
} from '../ApiError';

describe('ApiError', () => {
  describe('Base ApiError Class', () => {
    it('should create an error with code, message, and originalError', () => {
      const error = new ApiError('TEST_ERROR', 'Test message');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.message).toBe('Test message');
      expect(error.originalError).toBeNull();
      expect(error.timestamp).toBeDefined();
    });

    it('should have a valid ISO timestamp', () => {
      const error = new ApiError('TEST_ERROR', 'Test message');
      const date = new Date(error.timestamp);
      
      expect(date).toBeInstanceOf(Date);
      expect(!isNaN(date.getTime())).toBe(true);
    });

    it('should include originalError when provided', () => {
      const originalError = new Error('Original error');
      const error = new ApiError('TEST_ERROR', 'Test message', originalError);
      
      expect(error.originalError).toBe(originalError);
      expect(error.originalError.message).toBe('Original error');
    });

    it('should convert to JSON with correct structure', () => {
      const error = new ApiError('TEST_ERROR', 'Test message');
      const json = error.toJSON();
      
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('code', 'TEST_ERROR');
      expect(json.error).toHaveProperty('message', 'Test message');
      expect(json.error).toHaveProperty('timestamp');
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new ApiError('TEST_ERROR', 'Test message');
      }).toThrow(ApiError);
    });

    it('should have correct error name', () => {
      const error = new ApiError('TEST_ERROR', 'Test message');
      expect(error.name).toBe('Error');
    });
  });

  describe('ValidationError', () => {
    it('should create with message and fields', () => {
      const error = new ValidationError('Invalid input', ['email', 'password']);
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.message).toBe('Invalid input');
      expect(error.fields).toEqual(['email', 'password']);
    });

    it('should default fields to empty array', () => {
      const error = new ValidationError('Invalid input');
      
      expect(error.fields).toEqual([]);
    });

    it('should be throwable', () => {
      expect(() => {
        throw new ValidationError('Invalid input');
      }).toThrow(ValidationError);
    });
  });

  describe('NotFoundError', () => {
    it('should create with resource and id', () => {
      const error = new NotFoundError('Course', 'course123');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.resource).toBe('Course');
      expect(error.id).toBe('course123');
      expect(error.message).toContain('Course');
      expect(error.message).toContain('course123');
    });

    it('should format message correctly', () => {
      const error = new NotFoundError('Enrollment', 'enroll456');
      
      expect(error.message).toBe('Enrollment with id enroll456 not found');
    });
  });

  describe('AuthError', () => {
    it('should create with default message', () => {
      const error = new AuthError();
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('AUTH_ERROR');
      expect(error.message).toBe('Authentication required');
    });

    it('should create with custom message', () => {
      const error = new AuthError('User not authenticated');
      
      expect(error.message).toBe('User not authenticated');
    });
  });

  describe('PermissionError', () => {
    it('should create with default message', () => {
      const error = new PermissionError();
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('PERMISSION_ERROR');
      expect(error.message).toBe('Permission denied');
    });

    it('should create with custom message', () => {
      const error = new PermissionError('User does not have admin access');
      
      expect(error.message).toBe('User does not have admin access');
    });
  });

  describe('ComplianceError', () => {
    it('should create with message and details', () => {
      const details = { requirement: '24-hour minimum', current: 2 };
      const error = new ComplianceError('Compliance check failed', details);
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('COMPLIANCE_ERROR');
      expect(error.message).toBe('Compliance check failed');
      expect(error.details).toEqual(details);
    });

    it('should default details to empty object', () => {
      const error = new ComplianceError('Compliance check failed');
      
      expect(error.details).toEqual({});
    });
  });

  describe('EnrollmentError', () => {
    it('should create with message and enrollment', () => {
      const enrollment = { userId: 'user123', courseId: 'course456' };
      const error = new EnrollmentError('Enrollment failed', enrollment);
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('ENROLLMENT_ERROR');
      expect(error.enrollment).toEqual(enrollment);
    });

    it('should allow null enrollment', () => {
      const error = new EnrollmentError('Enrollment failed');
      
      expect(error.enrollment).toBeNull();
    });
  });

  describe('PaymentError', () => {
    it('should create with message and paymentId', () => {
      const error = new PaymentError('Payment failed', 'payment789');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('PAYMENT_ERROR');
      expect(error.paymentId).toBe('payment789');
    });

    it('should allow null paymentId', () => {
      const error = new PaymentError('Payment failed');
      
      expect(error.paymentId).toBeNull();
    });
  });

  describe('QuizError', () => {
    it('should create with message and quizId', () => {
      const error = new QuizError('Quiz submission failed', 'quiz123');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('QUIZ_ERROR');
      expect(error.quizId).toBe('quiz123');
    });

    it('should allow null quizId', () => {
      const error = new QuizError('Quiz submission failed');
      
      expect(error.quizId).toBeNull();
    });
  });

  describe('ProgressError', () => {
    it('should create with message and courseId', () => {
      const error = new ProgressError('Progress update failed', 'course123');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('PROGRESS_ERROR');
      expect(error.courseId).toBe('course123');
    });

    it('should allow null courseId', () => {
      const error = new ProgressError('Progress update failed');
      
      expect(error.courseId).toBeNull();
    });
  });

  describe('LessonError', () => {
    it('should create with message and lessonId', () => {
      const error = new LessonError('Lesson load failed', 'lesson123');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('LESSON_ERROR');
      expect(error.lessonId).toBe('lesson123');
    });

    it('should allow null lessonId', () => {
      const error = new LessonError('Lesson load failed');
      
      expect(error.lessonId).toBeNull();
    });
  });

  describe('ModuleError', () => {
    it('should create with message and moduleId', () => {
      const error = new ModuleError('Module load failed', 'module123');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('MODULE_ERROR');
      expect(error.moduleId).toBe('module123');
    });

    it('should allow null moduleId', () => {
      const error = new ModuleError('Module load failed');
      
      expect(error.moduleId).toBeNull();
    });
  });

  describe('CourseError', () => {
    it('should create with message and courseId', () => {
      const error = new CourseError('Course load failed', 'course123');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('COURSE_ERROR');
      expect(error.courseId).toBe('course123');
    });

    it('should allow null courseId', () => {
      const error = new CourseError('Course load failed');
      
      expect(error.courseId).toBeNull();
    });
  });

  describe('PVQError', () => {
    it('should create with message and questionId', () => {
      const error = new PVQError('PVQ validation failed', 'question123');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('PVQ_ERROR');
      expect(error.questionId).toBe('question123');
    });

    it('should allow null questionId', () => {
      const error = new PVQError('PVQ validation failed');
      
      expect(error.questionId).toBeNull();
    });
  });

  describe('SchedulingError', () => {
    it('should create with message and slotId', () => {
      const error = new SchedulingError('Scheduling failed', 'slot123');
      
      expect(error).toBeInstanceOf(ApiError);
      expect(error.code).toBe('SCHEDULING_ERROR');
      expect(error.slotId).toBe('slot123');
    });

    it('should allow null slotId', () => {
      const error = new SchedulingError('Scheduling failed');
      
      expect(error.slotId).toBeNull();
    });
  });

  describe('Error Inheritance Chain', () => {
    it('should all inherit from ApiError', () => {
      expect(new ValidationError('test')).toBeInstanceOf(ApiError);
      expect(new NotFoundError('resource', 'id')).toBeInstanceOf(ApiError);
      expect(new AuthError()).toBeInstanceOf(ApiError);
      expect(new PermissionError()).toBeInstanceOf(ApiError);
      expect(new ComplianceError('test')).toBeInstanceOf(ApiError);
      expect(new EnrollmentError('test')).toBeInstanceOf(ApiError);
      expect(new PaymentError('test')).toBeInstanceOf(ApiError);
      expect(new QuizError('test')).toBeInstanceOf(ApiError);
      expect(new ProgressError('test')).toBeInstanceOf(ApiError);
      expect(new LessonError('test')).toBeInstanceOf(ApiError);
      expect(new ModuleError('test')).toBeInstanceOf(ApiError);
      expect(new CourseError('test')).toBeInstanceOf(ApiError);
      expect(new PVQError('test')).toBeInstanceOf(ApiError);
      expect(new SchedulingError('test')).toBeInstanceOf(ApiError);
    });

    it('should all be instanceof Error', () => {
      expect(new ApiError('TEST', 'msg')).toBeInstanceOf(Error);
      expect(new ValidationError('test')).toBeInstanceOf(Error);
      expect(new NotFoundError('resource', 'id')).toBeInstanceOf(Error);
      expect(new AuthError()).toBeInstanceOf(Error);
    });
  });

  describe('JSON Serialization', () => {
    it('should serialize all error types to JSON', () => {
      const errors = [
        new ValidationError('Invalid'),
        new NotFoundError('Course', 'id123'),
        new AuthError('Custom message'),
        new ComplianceError('Failed', { key: 'value' }),
        new PaymentError('Failed', 'payment123')
      ];

      errors.forEach(error => {
        const json = error.toJSON();
        expect(json).toHaveProperty('error');
        expect(json.error).toHaveProperty('code');
        expect(json.error).toHaveProperty('message');
        expect(json.error).toHaveProperty('timestamp');
      });
    });
  });
});
