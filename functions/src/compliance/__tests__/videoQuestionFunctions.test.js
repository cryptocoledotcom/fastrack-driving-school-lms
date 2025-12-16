const {
  createMockFirestore,
  createMockDocumentSnapshot,
} = require('../../__tests__/mocks');

vi.mock('firebase-functions', () => ({
  https: {
    onCall: vi.fn((handler) => {
      const fn = typeof handler === 'function' ? handler : handler.fn;
      fn.run = fn;
      return fn;
    }),
    HttpsError: class HttpsError extends Error {
      constructor(code, message) {
        super(message);
        this.code = code;
      }
    },
  },
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

const {
  checkVideoQuestionAnswer,
  getVideoQuestion,
  recordVideoQuestionResponse,
} = require('../videoQuestionFunctions');
const { setDb } = require('../../common/firebaseUtils');

describe('Video Question Functions', () => {
  let mockContext;
  let mockDb;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = createMockFirestore();
    setDb(mockDb);

    mockContext = {
      auth: { uid: 'user-123' },
      rawRequest: {
        ip: '127.0.0.1',
        headers: { 'user-agent': 'test-agent' },
      },
    };
  });

  describe('checkVideoQuestionAnswer', () => {
    it('should throw error if user not authenticated', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      try {
        await checkVideoQuestionAnswer.run({ data, auth: null });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('unauthenticated');
        expect(error.message).toContain('authenticated');
      }
    });

    it('should throw error if userId missing', async () => {
      const data = {
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      try {
        await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if lessonId missing', async () => {
      const data = {
        userId: 'user-123',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      try {
        await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if courseId missing', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      try {
        await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if questionId missing', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        selectedAnswer: 'A',
      };

      try {
        await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if selectedAnswer missing', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
      };

      try {
        await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if userId does not match authenticated user', async () => {
      const data = {
        userId: 'different-user',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      try {
        await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('permission-denied');
        expect(error.message).toContain('Cannot check answers for other users');
      }
    });

    it('should throw error if question not found', async () => {
      mockDb.collection = vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn(() =>
            Promise.resolve(createMockDocumentSnapshot({}, false))
          ),
        })),
      }));
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      try {
        await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('not-found');
        expect(error.message).toContain('Question not found');
      }
    });

    it('should return correct answer is true when answer matches', async () => {
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'video_post_questions') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() =>
                Promise.resolve(
                  createMockDocumentSnapshot(
                    {
                      correctAnswer: 'A',
                      question: 'What is 2+2?',
                      explanation: 'Basic math',
                    },
                    true
                  )
                )
              ),
            })),
          };
        }
        if (collName === 'audit_logs') {
          return {
            add: vi.fn(() => Promise.resolve({ id: 'audit-123' })),
          };
        }
        return {
          doc: vi.fn(),
          add: vi.fn(),
        };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      const result = await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
      expect(result.isCorrect).toBe(true);
      expect(result.correctAnswer).toBe(null);
      expect(result.question).toBe('What is 2+2?');
      expect(result.explanation).toBe('Basic math');
    });

    it('should return correct answer is false when answer does not match', async () => {
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'video_post_questions') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() =>
                Promise.resolve(
                  createMockDocumentSnapshot(
                    {
                      correctAnswer: 'A',
                      question: 'What is 2+2?',
                      explanation: 'Basic math',
                    },
                    true
                  )
                )
              ),
            })),
          };
        }
        if (collName === 'audit_logs') {
          return {
            add: vi.fn(() => Promise.resolve({ id: 'audit-123' })),
          };
        }
        return {
          doc: vi.fn(),
          add: vi.fn(),
        };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'B',
      };

      const result = await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
      expect(result.isCorrect).toBe(false);
      expect(result.correctAnswer).toBe('A');
      expect(result.question).toBe('What is 2+2?');
    });

    it('should log audit event when answer is checked', async () => {
      const addMock = vi.fn(() => Promise.resolve({ id: 'audit-123' }));
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'video_post_questions') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() =>
                Promise.resolve(
                  createMockDocumentSnapshot(
                    {
                      correctAnswer: 'A',
                      question: 'What is 2+2?',
                    },
                    true
                  )
                )
              ),
            })),
          };
        }
        if (collName === 'audit_logs') {
          return { add: addMock };
        }
        return { doc: vi.fn(), add: vi.fn() };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
      expect(addMock).toHaveBeenCalled();
      const auditEntry = addMock.mock.calls[0][0];
      expect(auditEntry.eventType).toBe('VIDEO_QUESTION_ANSWERED');
      expect(auditEntry.userId).toBe('user-123');
      expect(auditEntry.selectedAnswer).toBe('A');
      expect(auditEntry.isCorrect).toBe(true);
    });

    it('should include explanation when provided', async () => {
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'video_post_questions') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() =>
                Promise.resolve(
                  createMockDocumentSnapshot(
                    {
                      correctAnswer: 'A',
                      question: 'What is 2+2?',
                      explanation: 'The sum of two and two is four',
                    },
                    true
                  )
                )
              ),
            })),
          };
        }
        if (collName === 'audit_logs') {
          return { add: vi.fn(() => Promise.resolve()) };
        }
        return { doc: vi.fn(), add: vi.fn() };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'B',
      };

      const result = await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
      expect(result.explanation).toBe('The sum of two and two is four');
    });

    it('should not include explanation when not provided', async () => {
      mockDb.collection = vi.fn((collName) => {
        if (collName === 'video_post_questions') {
          return {
            doc: vi.fn(() => ({
              get: vi.fn(() =>
                Promise.resolve(
                  createMockDocumentSnapshot(
                    {
                      correctAnswer: 'A',
                      question: 'What is 2+2?',
                    },
                    true
                  )
                )
              ),
            })),
          };
        }
        if (collName === 'audit_logs') {
          return { add: vi.fn(() => Promise.resolve()) };
        }
        return { doc: vi.fn(), add: vi.fn() };
      });
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      const result = await checkVideoQuestionAnswer.run({ data, auth: mockContext.auth });
      expect(result.explanation).toBe(null);
    });
  });

  describe('getVideoQuestion', () => {
    it('should throw error if user not authenticated', async () => {
      const data = { lessonId: 'lesson-456' };

      try {
        await getVideoQuestion.run({ data, auth: null });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('unauthenticated');
        expect(error.message).toContain('authenticated');
      }
    });

    it('should throw error if lessonId missing', async () => {
      const data = {};

      try {
        await getVideoQuestion.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
        expect(error.message).toContain('Missing lessonId parameter');
      }
    });

    it('should return null question when no questions found', async () => {
      mockDb.collection = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(() =>
          Promise.resolve({
            empty: true,
            docs: [],
          })
        ),
      }));
      setDb(mockDb);

      const data = { lessonId: 'lesson-456' };
      const result = await getVideoQuestion.run({ data, auth: mockContext.auth });
      expect(result.question).toBe(null);
    });

    it('should return question with all fields', async () => {
      mockDb.collection = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(() =>
          Promise.resolve({
            empty: false,
            docs: [
              {
                id: 'question-1',
                data: () => ({
                  question: 'What is 2+2?',
                  answers: ['A', 'B', 'C', 'D'],
                  explanation: 'Basic math',
                  correctAnswer: 'A',
                  lessonId: 'lesson-456',
                  active: true,
                }),
              },
            ],
          })
        ),
      }));
      setDb(mockDb);

      const data = { lessonId: 'lesson-456' };
      const result = await getVideoQuestion.run({ data, auth: mockContext.auth });
      expect(result.id).toBe('question-1');
      expect(result.question).toBe('What is 2+2?');
      expect(result.answers).toEqual(['A', 'B', 'C', 'D']);
      expect(result.explanation).toBe('Basic math');
    });

    it('should not return correctAnswer in response', async () => {
      mockDb.collection = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(() =>
          Promise.resolve({
            empty: false,
            docs: [
              {
                id: 'question-1',
                data: () => ({
                  question: 'What is 2+2?',
                  answers: ['A', 'B', 'C', 'D'],
                  correctAnswer: 'A',
                  lessonId: 'lesson-456',
                  active: true,
                }),
              },
            ],
          })
        ),
      }));
      setDb(mockDb);

      const data = { lessonId: 'lesson-456' };
      const result = await getVideoQuestion.run({ data, auth: mockContext.auth });
      expect(result.correctAnswer).toBeUndefined();
    });

    it('should handle missing answers array', async () => {
      mockDb.collection = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(() =>
          Promise.resolve({
            empty: false,
            docs: [
              {
                id: 'question-1',
                data: () => ({
                  question: 'What is 2+2?',
                  lessonId: 'lesson-456',
                  active: true,
                }),
              },
            ],
          })
        ),
      }));
      setDb(mockDb);

      const data = { lessonId: 'lesson-456' };
      const result = await getVideoQuestion.run({ data, auth: mockContext.auth });
      expect(result.answers).toEqual([]);
    });

    it('should handle missing explanation', async () => {
      mockDb.collection = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(() =>
          Promise.resolve({
            empty: false,
            docs: [
              {
                id: 'question-1',
                data: () => ({
                  question: 'What is 2+2?',
                  answers: ['A', 'B', 'C', 'D'],
                  lessonId: 'lesson-456',
                  active: true,
                }),
              },
            ],
          })
        ),
      }));
      setDb(mockDb);

      const data = { lessonId: 'lesson-456' };
      const result = await getVideoQuestion.run({ data, auth: mockContext.auth });
      expect(result.explanation).toBe(null);
    });

    it('should only return first question from query', async () => {
      mockDb.collection = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(() =>
          Promise.resolve({
            empty: false,
            docs: [
              {
                id: 'question-1',
                data: () => ({
                  question: 'First question',
                  answers: ['A'],
                  lessonId: 'lesson-456',
                  active: true,
                }),
              },
              {
                id: 'question-2',
                data: () => ({
                  question: 'Second question',
                  answers: ['B'],
                  lessonId: 'lesson-456',
                  active: true,
                }),
              },
            ],
          })
        ),
      }));
      setDb(mockDb);

      const data = { lessonId: 'lesson-456' };
      const result = await getVideoQuestion.run({ data, auth: mockContext.auth });
      expect(result.question).toBe('First question');
    });

    it('should handle database errors', async () => {
      mockDb.collection = vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        get: vi.fn(() => Promise.reject(new Error('Database error'))),
      }));
      setDb(mockDb);

      const data = { lessonId: 'lesson-456' };

      try {
        await getVideoQuestion.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('internal');
        expect(error.message).toContain('Failed to get question');
      }
    });
  });

  describe('recordVideoQuestionResponse', () => {
    it('should throw error if user not authenticated', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: null });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('unauthenticated');
        expect(error.message).toContain('authenticated');
      }
    });

    it('should throw error if userId missing', async () => {
      const data = {
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
        expect(error.message).toContain('Missing required parameters');
      }
    });

    it('should throw error if lessonId missing', async () => {
      const data = {
        userId: 'user-123',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if courseId missing', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if questionId missing', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if selectedAnswer missing', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        isCorrect: true,
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if isCorrect missing', async () => {
      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('invalid-argument');
      }
    });

    it('should throw error if userId does not match authenticated user', async () => {
      const data = {
        userId: 'different-user',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('permission-denied');
        expect(error.message).toContain('Cannot record responses for other users');
      }
    });

    it('should record response with all required fields', async () => {
      const addMock = vi.fn(() =>
        Promise.resolve({ id: 'response-123' })
      );
      mockDb.collection = vi.fn(() => ({
        add: addMock,
      }));
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      const result = await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
      expect(result.id).toBe('response-123');
      expect(result.recorded).toBe(true);
      expect(addMock).toHaveBeenCalled();
      const responseData = addMock.mock.calls[0][0];
      expect(responseData.userId).toBe('user-123');
      expect(responseData.lessonId).toBe('lesson-456');
      expect(responseData.courseId).toBe('course-789');
      expect(responseData.questionId).toBe('question-1');
      expect(responseData.selectedAnswer).toBe('A');
      expect(responseData.isCorrect).toBe(true);
    });

    it('should record response when answer is incorrect', async () => {
      const addMock = vi.fn(() =>
        Promise.resolve({ id: 'response-456' })
      );
      mockDb.collection = vi.fn(() => ({
        add: addMock,
      }));
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'B',
        isCorrect: false,
      };

      const result = await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
      expect(result.recorded).toBe(true);
      const responseData = addMock.mock.calls[0][0];
      expect(responseData.isCorrect).toBe(false);
      expect(responseData.selectedAnswer).toBe('B');
    });

    it('should include timestamp in response record', async () => {
      const addMock = vi.fn(() =>
        Promise.resolve({ id: 'response-789' })
      );
      mockDb.collection = vi.fn(() => ({
        add: addMock,
      }));
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
      const responseData = addMock.mock.calls[0][0];
      expect(responseData.respondedAt).toBeDefined();
    });

    it('should include ipAddress and userAgent from request context', async () => {
      const addMock = vi.fn(() =>
        Promise.resolve({ id: 'response-999' })
      );
      mockDb.collection = vi.fn(() => ({
        add: addMock,
      }));
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      await recordVideoQuestionResponse.run({ data, auth: mockContext.auth, rawRequest: mockContext.rawRequest });
      const responseData = addMock.mock.calls[0][0];
      expect(responseData.ipAddress).toBe('127.0.0.1');
      expect(responseData.userAgent).toBe('test-agent');
    });

    it('should handle null ipAddress gracefully', async () => {
      const addMock = vi.fn(() =>
        Promise.resolve({ id: 'response-888' })
      );
      mockDb.collection = vi.fn(() => ({
        add: addMock,
      }));
      setDb(mockDb);

      const contextWithoutIp = {
        auth: { uid: 'user-123' },
        rawRequest: {
          headers: { 'user-agent': 'test-agent' },
        },
      };

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      await recordVideoQuestionResponse.run({ data, auth: contextWithoutIp.auth, rawRequest: contextWithoutIp.rawRequest });
      const responseData = addMock.mock.calls[0][0];
      expect(responseData.ipAddress).toBe(null);
      expect(responseData.userAgent).toBe('test-agent');
    });

    it('should handle database errors', async () => {
      mockDb.collection = vi.fn(() => ({
        add: vi.fn(() => Promise.reject(new Error('Database error'))),
      }));
      setDb(mockDb);

      const data = {
        userId: 'user-123',
        lessonId: 'lesson-456',
        courseId: 'course-789',
        questionId: 'question-1',
        selectedAnswer: 'A',
        isCorrect: true,
      };

      try {
        await recordVideoQuestionResponse.run({ data, auth: mockContext.auth });
        expect(true).toBe(false);
      } catch (error) {
        expect(error.code).toBe('internal');
        expect(error.message).toContain('Failed to record response');
      }
    });
  });
});
