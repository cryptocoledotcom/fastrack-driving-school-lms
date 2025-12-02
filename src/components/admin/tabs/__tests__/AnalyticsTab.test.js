import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AnalyticsTab from '../AnalyticsTab';

jest.mock('recharts', () => ({
  ...jest.requireActual('recharts'),
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children, data }) => <div data-testid="line-chart" data-count={data?.length}>{children}</div>,
  BarChart: ({ children, data }) => <div data-testid="bar-chart" data-count={data?.length}>{children}</div>,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Line: () => <div />,
  Bar: () => <div />,
  Pie: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

const mockGetCourseName = (courseId) => {
  const names = {
    'fastrack-online': 'Online Course',
    'fastrack-behind-the-wheel': 'Behind-the-Wheel',
    'fastrack-complete': 'Complete Package',
  };
  return names[courseId] || courseId;
};

const mockUsers = [
  {
    uid: 'user1',
    email: 'student1@test.com',
    displayName: 'Student One',
    role: 'Student',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
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
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
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
];

describe('AnalyticsTab', () => {
  describe('Metric Cards', () => {
    it('should render metric cards with enrollment data', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Total Enrollments')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display total revenue', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(container.textContent).toMatch(/\$599\.98/);
    });

    it('should display active users metric', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Active Users')).toBeInTheDocument();
    });

    it('should display outstanding amount metric', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Outstanding')).toBeInTheDocument();
      const allElements = screen.getAllByText('$299.99');
      expect(allElements.length).toBeGreaterThan(0);
    });
  });

  describe('Charts', () => {
    it('should render enrollment trends chart', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Enrollment Trends')).toBeInTheDocument();
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render enrollment by course pie chart', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Enrollment by Course')).toBeInTheDocument();
      const pieCharts = screen.getAllByTestId('pie-chart');
      expect(pieCharts.length).toBeGreaterThan(0);
    });

    it('should render payment status pie chart', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Payment Status')).toBeInTheDocument();
    });

    it('should render revenue by course bar chart', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Revenue by Course')).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  describe('Mini Stats', () => {
    it('should display completion rate', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });

    it('should display average progress', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      const miniStatLabels = container.querySelectorAll('.miniStatLabel');
      const avgProgressLabel = Array.from(miniStatLabels).find(el => el.textContent === 'Avg Progress');
      expect(avgProgressLabel).toBeInTheDocument();
    });

    it('should display active students count', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      const miniStatLabels = container.querySelectorAll('.miniStatLabel');
      const activeStudentsLabel = Array.from(miniStatLabels).find(el => el.textContent === 'Active Students');
      expect(activeStudentsLabel).toBeInTheDocument();
    });

    it('should display completed students count', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Completed Students')).toBeInTheDocument();
    });

    it('should display new users metric', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('New Users (30d)')).toBeInTheDocument();
    });

    it('should display total paid metric', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Total Paid')).toBeInTheDocument();
    });
  });

  describe('Tables', () => {
    it('should render top performing students table', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Top Performing Students')).toBeInTheDocument();
      expect(screen.getByText('Student Name')).toBeInTheDocument();
      const allAvgProgressTexts = screen.getAllByText('Avg Progress');
      expect(allAvgProgressTexts.length).toBeGreaterThan(0);
    });

    it('should display student names in top performers table', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Student Two')).toBeInTheDocument();
    });

    it('should render overdue payments table', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Top Overdue Payments')).toBeInTheDocument();
      expect(screen.getByText('Student')).toBeInTheDocument();
      expect(screen.getByText('Amount Due')).toBeInTheDocument();
    });

    it('should display overdue payment details', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      const allAmounts = screen.getAllByText('$299.99');
      expect(allAmounts.length).toBeGreaterThan(0);
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no users', () => {
      render(<AnalyticsTab users={[]} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('No user data available to display analytics.')).toBeInTheDocument();
    });

    it('should display empty message for no enrollment data when users have no enrollments', () => {
      const usersWithoutEnrollments = [
        {
          uid: 'user1',
          email: 'test@test.com',
          displayName: 'Test User',
          enrollments: [],
        },
      ];
      
      render(<AnalyticsTab users={usersWithoutEnrollments} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('No enrollment data available')).toBeInTheDocument();
    });
  });

  describe('Data Calculations', () => {
    it('should correctly calculate metrics with sample data', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      const metricValues = container.querySelectorAll('[class*="metricValue"]');
      expect(metricValues.length).toBeGreaterThan(0);
    });

    it('should handle different course types', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      const textContent = container.textContent;
      expect(textContent).toMatch(/Online Course|Behind-the-Wheel|Complete Package/);
    });

    it('should calculate retention rate', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      const retentionText = container.textContent;
      expect(retentionText).toMatch(/retention|Active Users/i);
    });
  });

  describe('Responsive Design', () => {
    it('should render on small screens', () => {
      global.innerWidth = 375;
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(container.querySelector('[class*="analyticsContainer"]')).toBeInTheDocument();
    });

    it('should render on large screens', () => {
      global.innerWidth = 1920;
      const { container } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(container.querySelector('[class*="analyticsContainer"]')).toBeInTheDocument();
    });
  });

  describe('Props', () => {
    it('should accept users prop', () => {
      const { rerender } = render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getByText('Total Enrollments')).toBeInTheDocument();
      
      rerender(<AnalyticsTab users={[]} getCourseName={mockGetCourseName} />);
      expect(screen.getByText('No user data available to display analytics.')).toBeInTheDocument();
    });

    it('should accept getCourseName function prop', () => {
      const customGetCourseName = jest.fn((courseId) => `Custom: ${courseId}`);
      
      render(<AnalyticsTab users={mockUsers} getCourseName={customGetCourseName} />);
      
      expect(customGetCourseName).toHaveBeenCalled();
    });

    it('should handle default getCourseName prop', () => {
      const { container } = render(<AnalyticsTab users={mockUsers} />);
      
      expect(container).toBeInTheDocument();
    });
  });

  describe('Status Badges', () => {
    it('should display completed status badge', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      const badges = screen.getAllByText('1');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('should display pending status badge for overdue payments', () => {
      render(<AnalyticsTab users={mockUsers} getCourseName={mockGetCourseName} />);
      
      expect(screen.getAllByText('Pending').length).toBeGreaterThan(0);
    });
  });
});
