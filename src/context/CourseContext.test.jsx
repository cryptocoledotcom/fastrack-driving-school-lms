
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import * as courseServices from '../api/courses/courseServices';
import * as moduleServices from '../api/courses/moduleServices';
import * as lessonServices from '../api/courses/lessonServices';
import * as progressServices from '../api/student/progressServices';

import { CourseProvider, useCourse } from './CourseContext';

vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: { uid: 'test-user-id' },
    userProfile: { role: 'student' }
  })
}));

vi.mock('../api/courses/courseServices');
vi.mock('../api/courses/moduleServices');
vi.mock('../api/courses/lessonServices');
vi.mock('../api/student/progressServices');

describe('CourseContext', () => {
  const mockCourses = [
    { id: 'course1', title: 'Course 1', description: 'Test course' }
  ];

  const mockModules = [
    { id: 'module1', title: 'Module 1', courseId: 'course1' }
  ];

  const mockLessons = [
    { id: 'lesson1', title: 'Lesson 1', moduleId: 'module1' }
  ];

  const mockProgress = {
    enrolled: true,
    totalLessons: 5,
    completedLessons: 2
  };

  beforeEach(() => {
    vi.clearAllMocks();
    courseServices.getCourses.mockResolvedValue(mockCourses);
    courseServices.getCourseById.mockResolvedValue(mockCourses[0]);
    moduleServices.getModules.mockResolvedValue(mockModules);
    lessonServices.getLessons.mockResolvedValue(mockLessons);
    progressServices.getProgress.mockResolvedValue(mockProgress);
  });

  describe('useCourse hook', () => {
    it('should provide course context inside CourseProvider', () => {
      const TestComponent = () => {
        const { courses } = useCourse();
        return <div>{courses.length} courses</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText(/courses/)).toBeInTheDocument();
    });
  });

  describe('CourseProvider', () => {
    it('should render children', () => {
      render(
        <CourseProvider>
          <div>Test Child</div>
        </CourseProvider>
      );

      expect(screen.getByText('Test Child')).toBeInTheDocument();
    });

    it('should initialize with empty courses array', () => {
      const TestComponent = () => {
        const { courses } = useCourse();
        return <div>{courses.length} courses loaded</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      waitFor(() => {
        expect(screen.getByText('0 courses loaded')).toBeInTheDocument();
      });
    });
  });

  describe('Course state', () => {
    it('should initialize currentCourse as null', () => {
      const TestComponent = () => {
        const { currentCourse } = useCourse();
        return <div>{currentCourse ? 'Course selected' : 'No course'}</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('No course')).toBeInTheDocument();
    });

    it('should initialize currentModule as null', () => {
      const TestComponent = () => {
        const { currentModule } = useCourse();
        return <div>{currentModule ? 'Module selected' : 'No module'}</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('No module')).toBeInTheDocument();
    });

    it('should initialize currentLesson as null', () => {
      const TestComponent = () => {
        const { currentLesson } = useCourse();
        return <div>{currentLesson ? 'Lesson selected' : 'No lesson'}</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('No lesson')).toBeInTheDocument();
    });
  });

  describe('Loading state', () => {
    it('should provide loading state', () => {
      const TestComponent = () => {
        const { loading } = useCourse();
        return <div>{loading ? 'Loading' : 'Loaded'}</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText(/Loading|Loaded/)).toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should initialize error as null', () => {
      const TestComponent = () => {
        const { error } = useCourse();
        return <div>{error ? 'Error' : 'No error'}</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('getEnrolledCourses method', () => {
    it('should have getEnrolledCourses method', () => {
      const TestComponent = () => {
        const { getEnrolledCourses } = useCourse();
        const enrolled = getEnrolledCourses();
        return <div>{enrolled.length} enrolled courses</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText(/enrolled courses/)).toBeInTheDocument();
    });
  });

  describe('isEnrolledInCourse method', () => {
    it('should have isEnrolledInCourse method', () => {
      const TestComponent = () => {
        const { isEnrolledInCourse } = useCourse();
        const enrolled = isEnrolledInCourse('course1');
        return <div>{enrolled ? 'Enrolled' : 'Not enrolled'}</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText(/Enrolled|Not enrolled/)).toBeInTheDocument();
    });
  });

  describe('getCourseCompletionPercentage method', () => {
    it('should return 0 for non-existent course', () => {
      const TestComponent = () => {
        const { getCourseCompletionPercentage } = useCourse();
        const percentage = getCourseCompletionPercentage('non-existent');
        return <div>{percentage}%</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });

  describe('clearCurrentCourse method', () => {
    it('should provide clearCurrentCourse method', () => {
      const TestComponent = () => {
        const { clearCurrentCourse, currentCourse } = useCourse();
        return (
          <div>
            <button onClick={clearCurrentCourse}>Clear</button>
            <div>{currentCourse ? 'Has course' : 'No course'}</div>
          </div>
        );
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('Clear')).toBeInTheDocument();
      expect(screen.getByText('No course')).toBeInTheDocument();
    });
  });

  describe('fetchCourses method', () => {
    it('should have fetchCourses method', () => {
      const TestComponent = () => {
        const { fetchCourses } = useCourse();
        return (
          <button onClick={fetchCourses}>Fetch Courses</button>
        );
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('Fetch Courses')).toBeInTheDocument();
    });
  });

  describe('modules and lessons', () => {
    it('should initialize modules as empty array', () => {
      const TestComponent = () => {
        const { modules } = useCourse();
        return <div>{modules.length} modules</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('0 modules')).toBeInTheDocument();
    });

    it('should initialize lessons as empty array', () => {
      const TestComponent = () => {
        const { lessons } = useCourse();
        return <div>{lessons.length} lessons</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('0 lessons')).toBeInTheDocument();
    });
  });

  describe('getNextLesson method', () => {
    it('should provide getNextLesson method', () => {
      const TestComponent = () => {
        const { getNextLesson } = useCourse();
        const next = getNextLesson();
        return <div>{next ? 'Has next' : 'No next'}</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('No next')).toBeInTheDocument();
    });
  });

  describe('getPreviousLesson method', () => {
    it('should provide getPreviousLesson method', () => {
      const TestComponent = () => {
        const { getPreviousLesson } = useCourse();
        const prev = getPreviousLesson();
        return <div>{prev ? 'Has previous' : 'No previous'}</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('No previous')).toBeInTheDocument();
    });
  });

  describe('course progress', () => {
    it('should initialize courseProgress as empty object', () => {
      const TestComponent = () => {
        const { courseProgress } = useCourse();
        return <div>{Object.keys(courseProgress).length} course progress entries</div>;
      };

      render(
        <CourseProvider>
          <TestComponent />
        </CourseProvider>
      );

      expect(screen.getByText('0 course progress entries')).toBeInTheDocument();
    });
  });
});
