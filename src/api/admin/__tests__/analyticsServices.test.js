import analyticsServices from '../analyticsServices';

describe('analyticsServices', () => {
  const mockUsers = [
    {
      uid: 'user1',
      email: 'student1@test.com',
      displayName: 'Student One',
      role: 'Student',
      enrollments: [
        {
          courseId: 'fastrack-online',
          status: 'active',
          paymentStatus: 'completed',
          totalAmount: 149.99,
          amountPaid: 149.99,
          amountDue: 0,
          progress: 75,
          enrollmentDate: new Date('2025-01-10'),
        },
        {
          courseId: 'fastrack-behind-the-wheel',
          status: 'pending_payment',
          paymentStatus: 'pending',
          totalAmount: 299.99,
          amountPaid: 0,
          amountDue: 299.99,
          progress: 0,
          enrollmentDate: new Date('2025-01-15'),
        },
      ],
    },
    {
      uid: 'user2',
      email: 'student2@test.com',
      displayName: 'Student Two',
      role: 'Student',
      enrollments: [
        {
          courseId: 'fastrack-complete',
          status: 'completed',
          paymentStatus: 'completed',
          totalAmount: 449.99,
          amountPaid: 449.99,
          amountDue: 0,
          progress: 100,
          enrollmentDate: new Date('2024-12-20'),
        },
      ],
    },
    {
      uid: 'user3',
      email: 'student3@test.com',
      displayName: 'Student Three',
      role: 'Student',
      enrollments: [],
    },
  ];

  describe('calculateEnrollmentMetrics', () => {
    it('should calculate total enrollments correctly', () => {
      const metrics = analyticsServices.calculateEnrollmentMetrics(mockUsers);
      expect(metrics.totalEnrollments).toBe(3);
    });

    it('should count active enrollments', () => {
      const metrics = analyticsServices.calculateEnrollmentMetrics(mockUsers);
      expect(metrics.activeEnrollments).toBe(1);
    });

    it('should count completed enrollments', () => {
      const metrics = analyticsServices.calculateEnrollmentMetrics(mockUsers);
      expect(metrics.completedEnrollments).toBe(1);
    });

    it('should count pending payment enrollments', () => {
      const metrics = analyticsServices.calculateEnrollmentMetrics(mockUsers);
      expect(metrics.pendingPaymentEnrollments).toBe(1);
    });

    it('should break down enrollments by status', () => {
      const metrics = analyticsServices.calculateEnrollmentMetrics(mockUsers);
      expect(metrics.enrollmentsByStatus.active).toBe(1);
      expect(metrics.enrollmentsByStatus.completed).toBe(1);
      expect(metrics.enrollmentsByStatus.pending_payment).toBe(1);
    });

    it('should break down enrollments by course', () => {
      const metrics = analyticsServices.calculateEnrollmentMetrics(mockUsers);
      expect(metrics.enrollmentsByCourse['fastrack-online']).toBe(1);
      expect(metrics.enrollmentsByCourse['fastrack-behind-the-wheel']).toBe(1);
      expect(metrics.enrollmentsByCourse['fastrack-complete']).toBe(1);
    });

    it('should handle empty users array', () => {
      const metrics = analyticsServices.calculateEnrollmentMetrics([]);
      expect(metrics.totalEnrollments).toBe(0);
      expect(metrics.activeEnrollments).toBe(0);
    });
  });

  describe('calculatePaymentMetrics', () => {
    it('should calculate total revenue', () => {
      const metrics = analyticsServices.calculatePaymentMetrics(mockUsers);
      expect(metrics.totalRevenue).toBe(599.98);
    });

    it('should calculate average payment amount', () => {
      const metrics = analyticsServices.calculatePaymentMetrics(mockUsers);
      expect(metrics.averagePaymentAmount).toBe(199.99);
    });

    it('should calculate total paid and due', () => {
      const metrics = analyticsServices.calculatePaymentMetrics(mockUsers);
      expect(metrics.totalPaid).toBe(599.98);
      expect(metrics.totalDue).toBe(299.99);
    });

    it('should break down revenue by payment status', () => {
      const metrics = analyticsServices.calculatePaymentMetrics(mockUsers);
      expect(metrics.revenueByStatus.completed).toBe(599.98);
      expect(metrics.revenueByStatus.pending).toBe(0);
    });

    it('should identify overdue payments', () => {
      const metrics = analyticsServices.calculatePaymentMetrics(mockUsers);
      expect(metrics.overduePayments.length).toBe(1);
      expect(metrics.overduePayments[0].amountDue).toBe(299.99);
    });

    it('should break down payment status', () => {
      const metrics = analyticsServices.calculatePaymentMetrics(mockUsers);
      expect(metrics.paymentStatusBreakdown.completed).toBe(2);
      expect(metrics.paymentStatusBreakdown.pending).toBe(1);
    });
  });

  describe('calculateStudentProgressMetrics', () => {
    it('should calculate completion rate', () => {
      const metrics = analyticsServices.calculateStudentProgressMetrics(mockUsers);
      expect(metrics.completionRate).toBeGreaterThan(0);
    });

    it('should count completed students', () => {
      const metrics = analyticsServices.calculateStudentProgressMetrics(mockUsers);
      expect(metrics.completedStudents).toBe(1);
    });

    it('should count active students', () => {
      const metrics = analyticsServices.calculateStudentProgressMetrics(mockUsers);
      expect(metrics.activeStudents).toBe(1);
    });

    it('should calculate average completion', () => {
      const metrics = analyticsServices.calculateStudentProgressMetrics(mockUsers);
      expect(metrics.averageCompletion).toBeGreaterThanOrEqual(0);
      expect(metrics.averageCompletion).toBeLessThanOrEqual(100);
    });

    it('should track student progress individually', () => {
      const metrics = analyticsServices.calculateStudentProgressMetrics(mockUsers);
      expect(metrics.studentsWithProgress.length).toBe(2);
    });
  });

  describe('calculateUserMetrics', () => {
    it('should count total users', () => {
      const metrics = analyticsServices.calculateUserMetrics(mockUsers);
      expect(metrics.totalUsers).toBe(3);
    });

    it('should count active users', () => {
      const metrics = analyticsServices.calculateUserMetrics(mockUsers);
      expect(metrics.activeUsers).toBe(2);
    });

    it('should calculate retention rate', () => {
      const metrics = analyticsServices.calculateUserMetrics(mockUsers);
      expect(metrics.retentionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.retentionRate).toBeLessThanOrEqual(100);
    });

    it('should break down users by role', () => {
      const metrics = analyticsServices.calculateUserMetrics(mockUsers);
      expect(metrics.usersByRole.Student).toBe(3);
    });
  });

  describe('generateEnrollmentTrendData', () => {
    it('should generate trend data sorted by date', () => {
      const trendData = analyticsServices.generateEnrollmentTrendData(mockUsers);
      expect(Array.isArray(trendData)).toBe(true);
      expect(trendData.length).toBeGreaterThan(0);
    });

    it('should include enrollment count in trend', () => {
      const trendData = analyticsServices.generateEnrollmentTrendData(mockUsers);
      const hasCount = trendData.every(item => item.count !== undefined);
      expect(hasCount).toBe(true);
    });

    it('should include revenue in trend', () => {
      const trendData = analyticsServices.generateEnrollmentTrendData(mockUsers);
      const hasRevenue = trendData.every(item => item.revenue !== undefined);
      expect(hasRevenue).toBe(true);
    });
  });

  describe('generateCourseDistributionData', () => {
    it('should generate course distribution', () => {
      const courseNames = {
        'fastrack-online': 'Online Course',
        'fastrack-behind-the-wheel': 'Behind-the-Wheel',
        'fastrack-complete': 'Complete Package',
      };
      const distribution = analyticsServices.generateCourseDistributionData(mockUsers, courseNames);
      expect(Array.isArray(distribution)).toBe(true);
    });

    it('should count enrollments by course', () => {
      const courseNames = {
        'fastrack-online': 'Online Course',
        'fastrack-behind-the-wheel': 'Behind-the-Wheel',
        'fastrack-complete': 'Complete Package',
      };
      const distribution = analyticsServices.generateCourseDistributionData(mockUsers, courseNames);
      const totalCount = distribution.reduce((sum, item) => sum + item.value, 0);
      expect(totalCount).toBe(3);
    });
  });

  describe('generatePaymentStatusData', () => {
    it('should generate payment status breakdown', () => {
      const statusData = analyticsServices.generatePaymentStatusData(mockUsers);
      expect(Array.isArray(statusData)).toBe(true);
      expect(statusData.length).toBeGreaterThan(0);
    });

    it('should include status names', () => {
      const statusData = analyticsServices.generatePaymentStatusData(mockUsers);
      const hasNames = statusData.every(item => item.name !== undefined);
      expect(hasNames).toBe(true);
    });

    it('should include status counts', () => {
      const statusData = analyticsServices.generatePaymentStatusData(mockUsers);
      const hasCounts = statusData.every(item => item.value !== undefined);
      expect(hasCounts).toBe(true);
    });
  });

  describe('generateRevenueByCourseSeries', () => {
    it('should generate revenue by course', () => {
      const courseNames = {
        'fastrack-online': 'Online Course',
        'fastrack-behind-the-wheel': 'Behind-the-Wheel',
        'fastrack-complete': 'Complete Package',
      };
      const revenueSeries = analyticsServices.generateRevenueByCourseSeries(mockUsers, courseNames);
      expect(Array.isArray(revenueSeries)).toBe(true);
    });

    it('should calculate revenue accurately', () => {
      const courseNames = {
        'fastrack-online': 'Online Course',
        'fastrack-behind-the-wheel': 'Behind-the-Wheel',
        'fastrack-complete': 'Complete Package',
      };
      const revenueSeries = analyticsServices.generateRevenueByCourseSeries(mockUsers, courseNames);
      const totalRevenue = revenueSeries.reduce((sum, item) => sum + item.revenue, 0);
      expect(totalRevenue).toBe(599.98);
    });
  });

  describe('edge cases', () => {
    it('should handle users with no enrollments', () => {
      const users = [
        {
          uid: 'user1',
          email: 'test@test.com',
          displayName: 'Test User',
          enrollments: [],
        },
      ];
      const metrics = analyticsServices.calculateEnrollmentMetrics(users);
      expect(metrics.totalEnrollments).toBe(0);
    });

    it('should handle empty users array', () => {
      const metrics = analyticsServices.calculateEnrollmentMetrics([]);
      expect(metrics.totalEnrollments).toBe(0);
      expect(metrics.activeEnrollments).toBe(0);
      expect(metrics.totalUsers).toBe(0);
    });

    it('should handle missing fields in enrollments', () => {
      const users = [
        {
          uid: 'user1',
          enrollments: [
            {
              courseId: 'fastrack-online',
            },
          ],
        },
      ];
      const metrics = analyticsServices.calculatePaymentMetrics(users);
      expect(metrics.totalRevenue).toBe(0);
    });
  });
});
