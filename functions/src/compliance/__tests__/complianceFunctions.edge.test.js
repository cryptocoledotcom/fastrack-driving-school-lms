const {
    createMockFirestore,
    createMockAuth,
} = require('../../__tests__/mocks');

// Mocks
vi.mock('firebase-admin', () => {
    return {
        initializeApp: vi.fn(),
        firestore: () => ({
            collection: vi.fn(() => ({
                where: vi.fn().mockReturnThis(),
                get: vi.fn(() => Promise.resolve({ empty: true, docs: [], size: 0 })), // Default empty
                doc: vi.fn(() => ({
                    get: vi.fn(),
                    set: vi.fn(),
                    update: vi.fn()
                }))
            })),
            FieldValue: {
                serverTimestamp: () => 'SERVER_TIMESTAMP',
                arrayUnion: (val) => ['UNION', val],
                delete: () => 'DELETE'
            },
            Timestamp: {
                now: () => ({ toMillis: () => 1234567890 })
            }
        }),
        auth: () => ({})
    };
});

vi.mock('firebase-functions/v2/https', () => ({
    onCall: vi.fn((config, handler) => {
        const fn = typeof config === 'function' ? config : handler;
        fn.run = fn;
        return fn;
    })
}));

// Mock audit logger to avoid import issues
vi.mock('../../common/auditLogger', () => ({
    logAuditEvent: vi.fn(() => Promise.resolve())
}));

// Mock PDFKit
vi.mock('pdfkit', () => {
    return {
        default: vi.fn().mockImplementation(() => ({
            fontSize: vi.fn().mockReturnThis(),
            text: vi.fn().mockReturnThis(),
        }))
    };
});

const complianceFunctions = require('../complianceFunctions');
const firebaseUtils = require('../../common/firebaseUtils');
const { generateComplianceReport, sessionHeartbeat } = complianceFunctions;

describe('Compliance Functions - Edge Cases', () => {
    let mockContext;
    let mockDb;

    beforeEach(() => {
        vi.clearAllMocks();
        mockDb = createMockFirestore();

        // Setup robust Query Mock
        const queryMock = {
            where: vi.fn(),
            get: vi.fn().mockResolvedValue({
                empty: true,
                docs: [],
                size: 0
            }),
            doc: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({ exists: false }),
                set: vi.fn(),
                update: vi.fn(),
                collection: vi.fn(() => queryMock) // Recursive for subcollections
            }))
        };
        // Support chaining
        queryMock.where.mockReturnValue(queryMock);

        // Override collection to return queryMock
        // This handles: db.collection('foo').where(...).get()
        // And: db.collection('foo').doc('bar').get() (via doc prop on queryMock?? No, collection returns object with doc AND where?)

        // The mock from mocks.js has `collection` returning an object with `doc`, `add`, `where`, `get`.
        // We should replicate that structure but with return values.

        const collectionMock = {
            where: vi.fn().mockReturnThis(),
            get: vi.fn().mockResolvedValue({ empty: true, docs: [], size: 0 }),
            doc: vi.fn(() => ({
                get: vi.fn().mockResolvedValue({ exists: false, data: () => ({}) }),
                set: vi.fn(),
                update: vi.fn(),
                collection: vi.fn(() => collectionMock)
            })),
            add: vi.fn()
        };

        // Fix chaining for where()
        collectionMock.where = vi.fn().mockReturnValue(collectionMock);

        mockDb.collection = vi.fn(() => collectionMock);

        mockContext = {
            auth: { uid: 'user-123' }
        };

        global.TEST_FIREBASE_UTILS = {
            getDb: vi.fn(() => mockDb),
        };
        firebaseUtils.setDb(mockDb);
    });

    afterEach(() => {
        delete global.TEST_FIREBASE_UTILS;
        firebaseUtils.resetDb();
    });

    describe('generateComplianceReport', () => {
        it('should handle empty data gracefully for JSON format', async () => {
            // Mock empty responses are default in our mock setup at top

            const data = {
                courseId: 'course_1',
                format: 'json',
                studentId: 'user-123'
            };

            try {
                // v2 functions expect a single 'request' object containing data and auth
                const request = {
                    data,
                    auth: mockContext.auth
                };

                const result = await generateComplianceReport.run(request);

                expect(result.success).toBe(true);
                expect(result.report.userId).toBe('user-123');
                expect(result.report.totalSessions).toBe(0);
                expect(result.report.sessionData).toEqual([]);
            } catch (e) {
                console.error('TEST ERROR:', e);
                throw e;
            }
        });
    });

    describe('sessionHeartbeat', () => {
        it('should throw error if session does not exist', async () => {
            const data = {
                userId: 'user-123',
                courseId: 'course_1',
                sessionId: 'non-existent-session'
            };

            // Mock session get to return empty
            // Deep mock traversal: getDb().collection(...).doc(...).collection(...).doc(...).get()
            // Our top level mock returns default object which has .exists property undefined or functional?
            // The code calls sessionDoc.exists().
            // We need to ensure .get() returns an object with .exists() method or property.

            // Setup specific mock for deep query
            const sessionDocRef = {
                get: vi.fn().mockResolvedValue({
                    exists: () => false,
                    data: () => ({})
                })
            };

            // Override collection behavior to traverse deep
            // This is tricky with the simple mock above.
            // Let's refine the mockDb behavior for this test.

            mockDb.collection = vi.fn((colName) => {
                return {
                    doc: vi.fn(() => {
                        // users -> doc -> sessions -> doc
                        return {
                            collection: vi.fn(() => ({
                                doc: vi.fn(() => sessionDocRef)
                            })),
                            // daily_activity_logs -> doc
                            get: vi.fn().mockResolvedValue({ exists: () => false })
                        }
                    })
                };
            });

            try {
                const request = {
                    data,
                    auth: mockContext.auth
                };
                await sessionHeartbeat.run(request);
                expect(true).toBe(false);
            } catch (error) {
                expect(error.message).toMatch(/Session not found|failed/i);
            }
        });
    });
});
