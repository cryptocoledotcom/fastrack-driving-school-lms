const analyticsServices = {
  calculateEnrollmentMetrics: (users) => {
    const metrics = {
      totalUsers: users.length,
      totalEnrollments: 0,
      activeEnrollments: 0,
      completedEnrollments: 0,
      pendingPaymentEnrollments: 0,
      enrollmentsByStatus: {},
      enrollmentsByCourse: {},
    };

    users.forEach(user => {
      const enrollments = user.enrollments || [];
      metrics.totalEnrollments += enrollments.length;

      enrollments.forEach(enrollment => {
        metrics.enrollmentsByStatus[enrollment.status] = 
          (metrics.enrollmentsByStatus[enrollment.status] || 0) + 1;
        
        metrics.enrollmentsByCourse[enrollment.courseId] = 
          (metrics.enrollmentsByCourse[enrollment.courseId] || 0) + 1;

        if (enrollment.status === 'active') {
          metrics.activeEnrollments += 1;
        } else if (enrollment.status === 'completed') {
          metrics.completedEnrollments += 1;
        } else if (enrollment.status === 'pending_payment') {
          metrics.pendingPaymentEnrollments += 1;
        }
      });
    });

    return metrics;
  },

  calculatePaymentMetrics: (users) => {
    const metrics = {
      totalRevenue: 0,
      revenueByStatus: {},
      revenueByCourse: {},
      paymentStatusBreakdown: {},
      overduePayments: [],
      averagePaymentAmount: 0,
      totalPaid: 0,
      totalDue: 0,
    };

    let totalEnrollments = 0;

    users.forEach(user => {
      const enrollments = user.enrollments || [];
      
      enrollments.forEach(enrollment => {
        const { 
          paymentStatus = 'pending', 
          amountPaid = 0,
          amountDue = 0,
          courseId = 'unknown'
        } = enrollment;

        metrics.totalRevenue += amountPaid;
        metrics.totalPaid += amountPaid;
        metrics.totalDue += amountDue;
        totalEnrollments += 1;

        metrics.revenueByStatus[paymentStatus] = 
          (metrics.revenueByStatus[paymentStatus] || 0) + amountPaid;

        metrics.revenueByCourse[courseId] = 
          (metrics.revenueByCourse[courseId] || 0) + amountPaid;

        metrics.paymentStatusBreakdown[paymentStatus] = 
          (metrics.paymentStatusBreakdown[paymentStatus] || 0) + 1;

        if (paymentStatus === 'pending' && amountDue > 0) {
          metrics.overduePayments.push({
            userId: user.userId || user.uid,
            userName: user.displayName || user.email || 'Unknown',
            courseId,
            amountDue,
          });
        }
      });
    });

    metrics.averagePaymentAmount = totalEnrollments > 0 
      ? Math.round(metrics.totalRevenue / totalEnrollments * 100) / 100 
      : 0;

    return metrics;
  },

  calculateStudentProgressMetrics: (users) => {
    const metrics = {
      averageCompletion: 0,
      completionRate: 0,
      averageEngagement: 0,
      completedStudents: 0,
      activeStudents: 0,
      studentsWithProgress: [],
    };

    let totalStudentsWithEnrollments = 0;
    let totalProgress = 0;

    users.forEach(user => {
      const enrollments = user.enrollments || [];
      if (enrollments.length === 0) return;

      totalStudentsWithEnrollments += 1;
      let userProgress = 0;
      let completedCount = 0;
      let activeCount = 0;

      enrollments.forEach(enrollment => {
        userProgress += enrollment.progress || 0;
        if (enrollment.status === 'completed') {
          completedCount += 1;
        } else if (enrollment.status === 'active') {
          activeCount += 1;
        }
      });

      const avgProgress = Math.round((userProgress / enrollments.length) * 10) / 10;
      totalProgress += avgProgress;

      if (completedCount > 0) {
        metrics.completedStudents += 1;
      }
      if (activeCount > 0) {
        metrics.activeStudents += 1;
      }

      metrics.studentsWithProgress.push({
        userId: user.userId || user.uid,
        name: user.displayName || user.email || 'Unknown',
        progress: avgProgress,
        completedCourses: completedCount,
        activeCourses: activeCount,
      });
    });

    if (totalStudentsWithEnrollments > 0) {
      metrics.averageCompletion = Math.round((totalProgress / totalStudentsWithEnrollments) * 10) / 10;
      metrics.completionRate = Math.round((metrics.completedStudents / totalStudentsWithEnrollments) * 100);
      metrics.averageEngagement = metrics.averageCompletion;
    }

    return metrics;
  },

  calculateUserMetrics: (users) => {
    const metrics = {
      totalUsers: users.length,
      activeUsers: 0,
      newUsers: 0,
      retentionRate: 0,
      usersByRole: {},
      userGrowthData: [],
    };

    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

    users.forEach(user => {
      if (user.role) {
        metrics.usersByRole[user.role] = (metrics.usersByRole[user.role] || 0) + 1;
      }

      if ((user.enrollments || []).length > 0) {
        metrics.activeUsers += 1;
      }

      const createdAt = user.createdAt?.toMillis?.() || user.createdAt || 0;
      if (createdAt > thirtyDaysAgo) {
        metrics.newUsers += 1;
      }
    });

    metrics.retentionRate = metrics.totalUsers > 0 
      ? Math.round((metrics.activeUsers / metrics.totalUsers) * 100) 
      : 0;

    return metrics;
  },

  generateEnrollmentTrendData: (users) => {
    const trendMap = {};

    users.forEach(user => {
      const enrollments = user.enrollments || [];
      enrollments.forEach(enrollment => {
        const enrollmentDate = enrollment.enrollmentDate?.toDate?.() || enrollment.enrollmentDate || new Date();
        const dateStr = enrollmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        if (!trendMap[dateStr]) {
          trendMap[dateStr] = { date: dateStr, count: 0, revenue: 0 };
        }
        trendMap[dateStr].count += 1;
        trendMap[dateStr].revenue += enrollment.amountPaid || 0;
      });
    });

    return Object.values(trendMap).sort((a, b) => {
      const aDate = new Date(a.date);
      const bDate = new Date(b.date);
      return aDate - bDate;
    });
  },

  generateCourseDistributionData: (users, courseNames) => {
    const distribution = {};

    users.forEach(user => {
      const enrollments = user.enrollments || [];
      enrollments.forEach(enrollment => {
        const courseName = courseNames[enrollment.courseId] || enrollment.courseId;
        distribution[courseName] = (distribution[courseName] || 0) + 1;
      });
    });

    return Object.entries(distribution).map(([name, value]) => ({
      name,
      value,
    }));
  },

  generatePaymentStatusData: (users) => {
    const statusMap = {};

    users.forEach(user => {
      const enrollments = user.enrollments || [];
      enrollments.forEach(enrollment => {
        const status = enrollment.paymentStatus || 'pending';
        statusMap[status] = (statusMap[status] || 0) + 1;
      });
    });

    return Object.entries(statusMap).map(([name, value]) => ({
      name: name.replace('_', ' ').toUpperCase(),
      value,
    }));
  },

  generateRevenueByCourseSeries: (users, courseNames) => {
    const revenueMap = {};

    users.forEach(user => {
      const enrollments = user.enrollments || [];
      enrollments.forEach(enrollment => {
        const courseName = courseNames[enrollment.courseId] || enrollment.courseId;
        revenueMap[courseName] = (revenueMap[courseName] || 0) + (enrollment.amountPaid || 0);
      });
    });

    return Object.entries(revenueMap).map(([name, revenue]) => ({
      course: name,
      revenue: Math.round(revenue * 100) / 100,
    }));
  },
};

export default analyticsServices;
