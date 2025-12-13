import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db, getApp } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';
import { httpsCallable, getFunctions } from 'firebase/functions';

const VIDEO_QUESTIONS_COLLECTION = 'video_post_questions';
const VIDEO_QUESTION_RESPONSES_COLLECTION = 'video_question_responses';

export const getPostVideoQuestion = async (lessonId) => {
  return executeService(async () => {
    const questionsRef = collection(db, VIDEO_QUESTIONS_COLLECTION);
    const q = query(
      questionsRef,
      where('lessonId', '==', lessonId),
      where('active', '==', true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  }, 'getPostVideoQuestion');
};

export const recordVideoQuestionResponse = async (
  userId,
  lessonId,
  courseId,
  questionId,
  selectedAnswer,
  isCorrect,
  attemptNumber = 1
) => {
  return executeService(async () => {
    const responsesRef = collection(db, VIDEO_QUESTION_RESPONSES_COLLECTION);

    const response = {
      userId,
      lessonId,
      courseId,
      questionId,
      selectedAnswer,
      isCorrect,
      attemptNumber,
      respondedAt: new Date().toISOString(),
      ipAddress: null,
      deviceInfo: navigator.userAgent
    };

    const docRef = await addDoc(responsesRef, response);

    return {
      id: docRef.id,
      ...response
    };
  }, 'recordVideoQuestionResponse');
};

export const checkVideoQuestionAnswer = async (
  userId,
  lessonId,
  courseId,
  questionId,
  selectedAnswer,
  firebaseUser
) => {
  return executeService(async () => {
    if (!firebaseUser) {
      throw new Error('User must be authenticated');
    }

    await firebaseUser.getIdToken(true);
    await new Promise(resolve => setTimeout(resolve, 300));

    const functions = getFunctions(getApp());
    const checkAnswerFn = httpsCallable(functions, 'checkVideoQuestionAnswer');

    try {
      const result = await checkAnswerFn({
        userId,
        lessonId,
        courseId,
        questionId,
        selectedAnswer
      });

      return result.data;
    } catch (error) {
      if (error.code === 'functions/not-found') {
        throw new Error('Video question function not deployed yet. Please try again later.');
      }
      throw error;
    }
  }, 'checkVideoQuestionAnswer');
};

export const getVideoQuestionAttempts = async (userId, lessonId, courseId) => {
  return executeService(async () => {
    const responsesRef = collection(db, VIDEO_QUESTION_RESPONSES_COLLECTION);
    const q = query(
      responsesRef,
      where('userId', '==', userId),
      where('lessonId', '==', lessonId),
      where('courseId', '==', courseId)
    );

    const querySnapshot = await getDocs(q);
    const attempts = [];

    querySnapshot.forEach((doc) => {
      attempts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    attempts.sort(
      (a, b) => new Date(b.respondedAt) - new Date(a.respondedAt)
    );

    return attempts;
  }, 'getVideoQuestionAttempts');
};

export const hasAnsweredVideoQuestion = async (userId, lessonId, courseId) => {
  return executeService(async () => {
    const attempts = await getVideoQuestionAttempts(userId, lessonId, courseId);
    return attempts.length > 0 && attempts.some((a) => a.isCorrect);
  }, 'hasAnsweredVideoQuestion');
};

export const createVideoQuestion = async (lessonId, questionData) => {
  return executeService(async () => {
    const questionsRef = collection(db, VIDEO_QUESTIONS_COLLECTION);
    
    const questionDoc = {
      lessonId,
      question: questionData.question,
      options: questionData.options || [],
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation || '',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await addDoc(questionsRef, questionDoc);

    return {
      id: docRef.id,
      ...questionDoc
    };
  }, 'createVideoQuestion');
};

export const updateVideoQuestion = async (questionId, questionData) => {
  return executeService(async () => {
    const questionRef = doc(db, VIDEO_QUESTIONS_COLLECTION, questionId);
    
    const updateData = {
      question: questionData.question,
      options: questionData.options || [],
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation || '',
      updatedAt: new Date().toISOString()
    };

    await updateDoc(questionRef, updateData);

    return {
      id: questionId,
      ...updateData
    };
  }, 'updateVideoQuestion');
};

export const deleteVideoQuestion = async (questionId) => {
  return executeService(async () => {
    const questionRef = doc(db, VIDEO_QUESTIONS_COLLECTION, questionId);
    await deleteDoc(questionRef);
    return { id: questionId };
  }, 'deleteVideoQuestion');
};

export const getVideoQuestionByLesson = async (lessonId) => {
  return executeService(async () => {
    const questionsRef = collection(db, VIDEO_QUESTIONS_COLLECTION);
    const q = query(questionsRef, where('lessonId', '==', lessonId));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    };
  }, 'getVideoQuestionByLesson');
};

const videoQuestionServices = {
  getPostVideoQuestion,
  recordVideoQuestionResponse,
  checkVideoQuestionAnswer,
  getVideoQuestionAttempts,
  hasAnsweredVideoQuestion,
  createVideoQuestion,
  updateVideoQuestion,
  deleteVideoQuestion,
  getVideoQuestionByLesson
};

export default videoQuestionServices;
