// CoursePlayerPage Component
// Full-featured course player with time tracking and progress

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTimer } from '../../context/TimerContext';
import { TimerProvider } from '../../context/TimerContext';
import useComplianceHeartbeat from '../../hooks/useComplianceHeartbeat';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import ProgressBar from '../../components/common/ProgressBar/ProgressBar';
import Badge from '../../components/common/Badge/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import ErrorMessage from '../../components/common/ErrorMessage/ErrorMessage';
import PVQModal from '../../components/common/Modals/PVQModal';
import RestrictedVideoPlayer from '../../components/common/RestrictedVideoPlayer/RestrictedVideoPlayer';
import PostVideoQuestionModal from '../../components/common/Modals/PostVideoQuestionModal';
import Quiz from '../../components/common/Quiz/Quiz';
import { getCourseById } from '../../api/courses/courseServices';
import { getModules } from '../../api/courses/moduleServices';
import { getLessons } from '../../api/courses/lessonServices';
import { initializeProgress, getProgress, markLessonCompleteWithCompliance, updateLessonProgress } from '../../api/student/progressServices';
import { getPostVideoQuestion, recordVideoQuestionResponse, checkVideoQuestionAnswer } from '../../api/student/videoQuestionServices';
import { createQuizAttempt, submitQuizAttempt } from '../../api/courses/quizServices';
import { generateEnrollmentCertificate, hasEnrollmentCertificate } from '../../api/student/certificateServices';
import { LESSON_TYPES } from '../../constants/lessonTypes';
import OHIO_COMPLIANCE from '../../constants/compliance';
import styles from './CoursePlayerPage.module.css';

const CoursePlayerPageContent = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    startTimer,
    stopTimer,
    pauseTimer,
    sessionTerminatedByUser,

    isActive,
    isLockedOut,
    isBreakMandatory,
    getFormattedSessionTime,
    updateVideoProgress,
    trackLessonAccess,
    showPVQModal,
    currentPVQQuestion,
    pvqSubmitting,
    pvqError,
    handlePVQSubmit,
    closePVQModal,
    currentSessionId,
    sessionTime
  } = useTimer();

  // State
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showBreakModal, setShowBreakModal] = useState(false);

  // Video tracking
  const videoRef = useRef(null);
  const progressSaveInterval = useRef(null);

  // Post-video question tracking
  const [postVideoQuestion, setPostVideoQuestion] = useState(null);
  const [showPostVideoQuestion, setShowPostVideoQuestion] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [checkingAnswer, setCheckingAnswer] = useState(false);
  const [videoQuestionError, setVideoQuestionError] = useState(null);

  // Quiz tracking
  const [quizAttemptId, setQuizAttemptId] = useState(null);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizError, setQuizError] = useState(null);

  // Enrollment certificate tracking
  const [showCertificateNotification, setShowCertificateNotification] = useState(false);
  const [generatingCertificate, setGeneratingCertificate] = useState(false);

  // Compliance heartbeat hook - sends server-side heartbeat every 60 seconds
  useComplianceHeartbeat({
    userId: user?.uid,
    courseId,
    sessionId: currentSessionId,
    enabled: isActive && !!user && !!courseId,
    onLimitReached: () => {
      setError('You have reached the 4-hour daily limit. Please try again tomorrow.');
      stopTimer();
    },
    onIdleTimeout: () => {
      setError('Your session has ended due to 15 minutes of inactivity. Please log in again to continue.');
      stopTimer();
      navigate('/login');
    },
    onHeartbeatError: (error) => {
      console.error('Compliance heartbeat error:', error);
    }
  });

  // Check for daily lockout and show error
  useEffect(() => {
    if (isLockedOut) {
      setError('You have reached the 4-hour daily limit. Please try again tomorrow.');
      stopTimer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLockedOut]);

  // Show break modal when mandatory break is needed
  useEffect(() => {
    if (isBreakMandatory && isActive) {
      setShowBreakModal(true);
      pauseTimer();
    }
  }, [isBreakMandatory, isActive, pauseTimer]);

  useEffect(() => {
    if (sessionTerminatedByUser) {
      navigate('/dashboard');
    }
  }, [sessionTerminatedByUser, navigate]);

  useEffect(() => {
    loadCourseData();
    startTimer();

    return () => {
      stopTimer();
      if (progressSaveInterval.current) {
        clearInterval(progressSaveInterval.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    if (currentLesson) {
      // Auto-save progress every 30 seconds
      progressSaveInterval.current = setInterval(() => {
        saveCurrentProgress();
      }, 30000);

      return () => {
        if (progressSaveInterval.current) {
          clearInterval(progressSaveInterval.current);
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLesson]);

  const checkEnrollmentCertificateEligibility = useCallback(async () => {
    if (!user?.uid || !courseId) return;

    try {
      const hasUserCertificate = await hasEnrollmentCertificate(user.uid, courseId);
      if (hasUserCertificate) return;

      const cumulativeMinutes = progress?.cumulativeMinutes || 0;
      const unit1Complete = progress?.unit1_complete || false;
      const unit2Complete = progress?.unit2_complete || false;

      if (cumulativeMinutes >= 120 && unit1Complete && unit2Complete) {
        setShowCertificateNotification(true);
      }
    } catch (err) {
      console.error('Error checking certificate eligibility:', err);
    }
  }, [user?.uid, courseId, progress]);

  useEffect(() => {
    if (progress) {
      checkEnrollmentCertificateEligibility();
    }
  }, [progress?.cumulativeMinutes, progress?.unit1_complete, progress?.unit2_complete, checkEnrollmentCertificateEligibility, progress]);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load course
      const courseData = await getCourseById(courseId);
      setCourse(courseData);

      // Load modules
      let modulesData = await getModules(courseId);

      // Sort modules based on course's moduleOrder if it exists
      if (courseData?.moduleOrder && Array.isArray(courseData.moduleOrder)) {
        modulesData = modulesData.sort((a, b) => {
          const indexA = courseData.moduleOrder.indexOf(a.id);
          const indexB = courseData.moduleOrder.indexOf(b.id);
          return indexA - indexB;
        });
      }

      setModules(modulesData);

      // Calculate total lessons for all modules
      let totalLessons = 0;
      for (const module of modulesData) {
        const moduleLessons = await getLessons(courseId, module.id);
        totalLessons += moduleLessons.length;
      }

      // Initialize progress on first access
      await initializeProgress(user.uid, courseId, totalLessons);

      // Load progress
      const progressData = await getProgress(user.uid, courseId);
      setProgress(progressData);

      // Load first module and lesson
      if (modulesData.length > 0) {
        const firstModule = modulesData[0];
        setCurrentModule(firstModule);
        await loadLessons(firstModule.id);
      }

    } catch (err) {
      console.error('Error loading course:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const loadLessons = async (moduleId) => {
    try {
      let lessonsData = await getLessons(courseId, moduleId);

      // Sort lessons based on module's lessonOrder if it exists
      const module = modules.find(m => m.id === moduleId);
      if (module?.lessonOrder && Array.isArray(module.lessonOrder)) {
        lessonsData = lessonsData.sort((a, b) => {
          const indexA = module.lessonOrder.indexOf(a.id);
          const indexB = module.lessonOrder.indexOf(b.id);
          return indexA - indexB;
        });
      }

      setLessons(lessonsData);

      if (lessonsData.length > 0 && !currentLesson) {
        setCurrentLesson(lessonsData[0]);
      }
    } catch (err) {
      console.error('Error loading lessons:', err);
    }
  };

  const saveCurrentProgress = async () => {
    if (!currentLesson || !user) return;

    try {
      const progressData = {
        lastAccessedAt: new Date().toISOString(),
        currentLessonId: currentLesson.id,
        currentModuleId: currentModule.id
      };

      // If video, save current time
      if (currentLesson.type === LESSON_TYPES.VIDEO && videoRef.current) {
        progressData.videoProgress = {
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
          percentWatched: (videoRef.current.currentTime / videoRef.current.duration) * 100
        };
      }

      await updateLessonProgress(user.uid, courseId, currentLesson.id, progressData);
    } catch (err) {
      console.error('Error saving progress:', err);
    }
  };

  const handleLessonComplete = async () => {
    if (!currentLesson || !user) return;

    try {
      await markLessonCompleteWithCompliance(
        user.uid,
        courseId,
        currentLesson.id,
        {
          sessionId: currentSessionId,
          lessonTitle: currentLesson.title,
          moduleId: currentModule.id,
          moduleTitle: currentModule.title,
          sessionTime,
          videoProgress: currentLesson.type === LESSON_TYPES.VIDEO && videoRef.current
            ? {
              currentTime: videoRef.current.currentTime,
              duration: videoRef.current.duration,
              percentWatched: (videoRef.current.currentTime / videoRef.current.duration) * 100
            }
            : null
        }
      );

      // Reload progress
      const updatedProgress = await getProgress(user.uid, courseId);
      setProgress(updatedProgress);

      // Move to next lesson
      const currentIndex = lessons.findIndex(l => l.id === currentLesson.id);
      if (currentIndex < lessons.length - 1) {
        setCurrentLesson(lessons[currentIndex + 1]);
      } else {
        // Move to next module
        const moduleIndex = modules.findIndex(m => m.id === currentModule.id);
        if (moduleIndex < modules.length - 1) {
          const nextModule = modules[moduleIndex + 1];
          setCurrentModule(nextModule);
          await loadLessons(nextModule.id);
        }
      }
    } catch (err) {
      console.error('Error marking lesson complete:', err);
      setError('Failed to mark lesson as complete');
    }
  };

  const handleModuleSelect = async (module) => {
    setCurrentModule(module);
    await loadLessons(module.id);
    setCurrentLesson(null);
  };

  const handleLessonSelect = (lesson) => {
    saveCurrentProgress();
    trackLessonAccess(lesson.id);
    setCurrentLesson(lesson);
  };

  const isLessonCompleted = (lessonId) => {
    return progress?.lessonProgress?.[lessonId]?.completed || false;
  };

  const getModuleProgress = (moduleId) => {
    const moduleLessons = lessons.filter(l => l.moduleId === moduleId);
    if (moduleLessons.length === 0) return 0;

    const completedCount = moduleLessons.filter(l => isLessonCompleted(l.id)).length;
    return Math.round((completedCount / moduleLessons.length) * 100);
  };

  const loadPostVideoQuestion = async (lesson) => {
    try {
      setVideoQuestionError(null);
      const question = await getPostVideoQuestion(lesson.id);
      if (question) {
        setPostVideoQuestion(question);
      }
    } catch (err) {
      console.error('Error loading post-video question:', err);
      setVideoQuestionError('Failed to load comprehension question');
    }
  };

  const handleVideoEnded = async () => {
    if (currentLesson && videoDuration > OHIO_COMPLIANCE.VIDEO_REQUIREMENTS.MIN_VIDEO_LENGTH_SECONDS_FOR_QUESTIONS) {
      await loadPostVideoQuestion(currentLesson);
      setShowPostVideoQuestion(true);
    } else {
      await handleLessonComplete();
    }
  };

  const handlePostVideoAnswerSubmit = async (selectedAnswer) => {
    if (!postVideoQuestion || !currentLesson) return;

    setCheckingAnswer(true);
    try {
      const result = await checkVideoQuestionAnswer(
        user.uid,
        currentLesson.id,
        courseId,
        postVideoQuestion.id,
        selectedAnswer
      );

      await recordVideoQuestionResponse(
        user.uid,
        currentLesson.id,
        courseId,
        postVideoQuestion.id,
        selectedAnswer,
        result.isCorrect,
        1
      );

      return result;
    } catch (err) {
      console.error('Error checking video question answer:', err);
      setVideoQuestionError(err.message || 'Failed to submit answer');
      throw err;
    } finally {
      setCheckingAnswer(false);
    }
  };

  const handlePostVideoQuestionComplete = async () => {
    setShowPostVideoQuestion(false);
    setPostVideoQuestion(null);
    setVideoDuration(0);
    setVideoQuestionError(null);
    await handleLessonComplete();
  };

  const handleQuizStart = async () => {
    try {
      setQuizError(null);
      const attemptId = await createQuizAttempt(user.uid, courseId, {
        quizId: currentLesson.id,
        quizTitle: currentLesson.title,
        isFinalExam: false,
        sessionId: currentSessionId,
        ipAddress: null,
        deviceInfo: navigator.userAgent
      });
      setQuizAttemptId(attemptId);
    } catch (err) {
      console.error('Error starting quiz:', err);
      setQuizError(err.message || 'Failed to start quiz');
    }
  };

  const handleQuizSubmit = async (submissionData) => {
    if (!quizAttemptId) {
      setQuizError('Quiz session not initialized');
      return;
    }

    setQuizSubmitting(true);
    try {
      const result = await submitQuizAttempt(quizAttemptId, {
        answers: submissionData.selectedAnswers,
        totalQuestions: submissionData.totalQuestions,
        correctAnswers: Object.entries(submissionData.selectedAnswers).filter(
          ([qId, answer]) => {
            const question = currentLesson.questions?.find(q => q.id === qId);
            return question && question.correctAnswer === answer;
          }
        ).length,
        timeSpent: submissionData.timeSpent || 0
      });

      return result;
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setQuizError(err.message || 'Failed to submit quiz');
      throw err;
    } finally {
      setQuizSubmitting(false);
    }
  };

  const handleGenerateEnrollmentCertificate = async () => {
    if (!user?.uid || !courseId || !course) return;

    setGeneratingCertificate(true);
    try {
      await generateEnrollmentCertificate(user.uid, courseId, course.title);
      setShowCertificateNotification(false);
      navigate('/certificates');
    } catch (err) {
      console.error('Error generating certificate:', err);
      alert('Failed to generate certificate. Please try again.');
    } finally {
      setGeneratingCertificate(false);
    }
  };

  const renderLessonContent = () => {
    if (!currentLesson) {
      return (
        <div className={styles.emptyState}>
          <p>Select a lesson to begin</p>
        </div>
      );
    }

    switch (currentLesson.type) {
      case LESSON_TYPES.VIDEO:
        return (
          <div className={styles.videoContainer}>
            <RestrictedVideoPlayer
              ref={videoRef}
              src={currentLesson.videoUrl}
              onEnded={handleVideoEnded}
              onTimeUpdate={(progress) => {
                updateVideoProgress(
                  progress.currentTime,
                  progress.duration,
                  progress.percentWatched
                );
              }}
              onLoadedMetadata={(meta) => {
                setVideoDuration(meta.duration);
              }}
            />
            {videoDuration > OHIO_COMPLIANCE.VIDEO_REQUIREMENTS.MIN_VIDEO_LENGTH_SECONDS_FOR_QUESTIONS && (
              <div className={styles.videoNote}>
                <p>⚠️ After this video, you'll need to answer a comprehension question to proceed.</p>
              </div>
            )}
          </div>
        );

      case LESSON_TYPES.READING:
        return (
          <div className={styles.readingContent}>
            <div dangerouslySetInnerHTML={{ __html: currentLesson.content }} />
          </div>
        );

      case LESSON_TYPES.QUIZ:
        if (!quizAttemptId) {
          return (
            <div className={styles.quizContent}>
              <div className={styles.quizInitial}>
                <h3>{currentLesson.title}</h3>
                {currentLesson.description && <p>{currentLesson.description}</p>}
                <div className={styles.quizInfo}>
                  <p className={styles.quizInfoItem}>
                    <strong>Questions:</strong> {currentLesson.questions?.length || 0}
                  </p>
                  <p className={styles.quizInfoItem}>
                    <strong>Passing Score:</strong> {currentLesson.passingScore || 70}%
                  </p>
                  <p className={styles.warningNote}>
                    ⚠️ <strong>Important:</strong> Once you start the quiz, correct answers will only be shown after you submit.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleQuizStart}
                  disabled={quizSubmitting}
                  size="large"
                >
                  Start Quiz
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div className={styles.quizContent}>
            <Quiz
              quiz={currentLesson}
              onSubmit={handleQuizSubmit}
              loading={quizSubmitting}
              error={quizError}
              onCancel={() => setQuizAttemptId(null)}
            />
          </div>
        );

      default:
        return (
          <div className={styles.defaultContent}>
            <p>{currentLesson.description}</p>
          </div>
        );
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading course..." />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <ErrorMessage message={error} />
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className={styles.coursePlayer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Button variant="ghost" size="small" onClick={() => navigate(-1)}>
            ← Back
          </Button>
          <h1 className={styles.courseTitle}>{course?.title}</h1>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.timer}>
            ⏱️ {getFormattedSessionTime()}
          </div>

        </div>
      </div>

      {showCertificateNotification && (
        <div className={styles.certificateNotification}>
          <div className={styles.notificationContent}>
            <div className={styles.notificationIcon}>🎉</div>
            <div className={styles.notificationText}>
              <h3>Enrollment Certificate Earned!</h3>
              <p>You've completed 2 hours of instruction and finished Units 1-2. Claim your enrollment certificate now!</p>
            </div>
            <div className={styles.notificationActions}>
              <Button
                variant="primary"
                onClick={handleGenerateEnrollmentCertificate}
                loading={generatingCertificate}
              >
                Claim Certificate
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCertificateNotification(false)}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.playerContainer}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} ${!sidebarOpen ? styles.sidebarCollapsed : ''}`}>
          <div className={styles.sidebarContent}>
            <div className={styles.sidebarHeader}>
              <h3>Course Content</h3>
              <ProgressBar progress={progress?.overallProgress || 0} size="small" />
            </div>
            <div className={styles.modulesList}>
              {modules.map((module) => (
                <Card key={module.id} className={styles.moduleCard}>
                  <div className={styles.moduleHeader} onClick={() => handleModuleSelect(module)}>
                    <h4>{module.title}</h4>
                    <ProgressBar progress={getModuleProgress(module.id)} size="small" />
                  </div>
                  {currentModule?.id === module.id && (
                    <div className={styles.lessonsList}>
                      {lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className={`${styles.lessonItem} ${currentLesson?.id === lesson.id ? styles.activeLesson : ''}`}
                          onClick={() => handleLessonSelect(lesson)}
                        >
                          <span className={styles.lessonIcon}>{isLessonCompleted(lesson.id) ? '✅' : '⭕'}</span>
                          <span className={styles.lessonName}>{lesson.title}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Collapse Handle */}
        <div className={styles.collapseHandle} onClick={() => setSidebarOpen(!sidebarOpen)}>
          <div className={styles.collapseIcon}>
            {sidebarOpen ? '‹' : '›'}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {currentLesson && (
            <div className={styles.lessonHeader}>
              <div>
                <h2 className={styles.lessonTitle}>{currentLesson.title}</h2>
                <p className={styles.lessonDescription}>{currentLesson.description}</p>
              </div>
              <Badge variant={isLessonCompleted(currentLesson.id) ? 'completed' : 'inProgress'}>
                {isLessonCompleted(currentLesson.id) ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
          )}

          <div className={styles.contentArea}>
            {renderLessonContent()}
          </div>

          {currentLesson && !isLessonCompleted(currentLesson.id) && (
            <div className={styles.lessonActions}>
              <Button variant="primary" onClick={handleLessonComplete}>
                Mark as Complete
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mandatory Break Modal */}
      {showBreakModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <Card style={{
            maxWidth: '500px',
            width: '90%',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <h2>⏸️ Mandatory Break Required</h2>
            <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
              You've been studying for 2 hours. State law requires a 10-minute break.
            </p>
            <p style={{ color: '#666', marginBottom: '2rem' }}>
              Please take a break and return ready to continue learning.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                setShowBreakModal(false);
              }}
            >
              I'm Taking a Break
            </Button>
          </Card>
        </div>
      )}

      {/* PVQ Modal */}
      <PVQModal
        isOpen={showPVQModal}
        onClose={closePVQModal}
        pvqQuestion={currentPVQQuestion}
        onSubmit={handlePVQSubmit}
        isSubmitting={pvqSubmitting}
        error={pvqError}
      />

      {/* Post-Video Question Modal */}
      <PostVideoQuestionModal
        isOpen={showPostVideoQuestion}
        question={postVideoQuestion}
        onAnswerSubmit={handlePostVideoAnswerSubmit}
        onComplete={handlePostVideoQuestionComplete}
        loading={checkingAnswer}
        error={videoQuestionError}
      />
    </div>
  );
};

// Wrapper component with TimerProvider
const CoursePlayerPage = () => {
  const { courseId } = useParams();
  const [ipAddress, setIpAddress] = useState('');

  // Fetch IP address from backend or API
  useEffect(() => {
    const fetchIpAddress = async () => {
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        setIpAddress(data.ip);
      } catch (err) {
        console.error('Error fetching IP address:', err);
        setIpAddress('unknown');
      }
    };

    fetchIpAddress();
  }, []);

  return (
    <TimerProvider courseId={courseId} lessonId={null} ipAddress={ipAddress}>
      <CoursePlayerPageContent />
    </TimerProvider>
  );
};

export default CoursePlayerPage;