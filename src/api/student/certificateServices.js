import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { httpsCallable, getFunctions } from 'firebase/functions';
import { getApp } from 'firebase/app';

import { db } from '../../config/firebase';
import { executeService } from '../base/ServiceWrapper';

const CERTIFICATES_COLLECTION = 'certificates';

export const getCertificatesByUserId = async (userId) => {
  return executeService(async () => {
    const certificatesRef = collection(db, CERTIFICATES_COLLECTION);
    const q = query(
      certificatesRef,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const certificates = [];

    querySnapshot.forEach((doc) => {
      certificates.push({
        id: doc.id,
        ...doc.data()
      });
    });

    certificates.sort((a, b) => {
      const dateA = a.awardedAt?.toMillis?.() || 0;
      const dateB = b.awardedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return certificates;
  }, 'getCertificatesByUserId');
};

export const getCertificateById = async (certificateId) => {
  return executeService(async () => {
    const certificateRef = doc(db, CERTIFICATES_COLLECTION, certificateId);
    const certificateDoc = await getDoc(certificateRef);

    if (!certificateDoc.exists()) {
      throw new Error('Certificate not found');
    }

    return {
      id: certificateDoc.id,
      ...certificateDoc.data()
    };
  }, 'getCertificateById');
};

export const generateEnrollmentCertificate = async (userId, courseId, courseName) => {
  return executeService(async () => {
    const functions = getFunctions(getApp());
    const generateCertFn = httpsCallable(functions, 'generateEnrollmentCertificate');

    try {
      const result = await generateCertFn({
        userId,
        courseId,
        courseName
      });

      return result.data;
    } catch (error) {
      if (error.code === 'functions/not-found') {
        throw new Error('Certificate generation function not deployed yet. Please try again later.');
      }
      throw error;
    }
  }, 'generateEnrollmentCertificate');
};

export const getCertificatesByType = async (userId, type) => {
  return executeService(async () => {
    const certificatesRef = collection(db, CERTIFICATES_COLLECTION);
    const q = query(
      certificatesRef,
      where('userId', '==', userId),
      where('type', '==', type)
    );

    const querySnapshot = await getDocs(q);
    const certificates = [];

    querySnapshot.forEach((doc) => {
      certificates.push({
        id: doc.id,
        ...doc.data()
      });
    });

    certificates.sort((a, b) => {
      const dateA = a.awardedAt?.toMillis?.() || 0;
      const dateB = b.awardedAt?.toMillis?.() || 0;
      return dateB - dateA;
    });

    return certificates;
  }, 'getCertificatesByType');
};

export const hasEnrollmentCertificate = async (userId, courseId) => {
  return executeService(async () => {
    const certificatesRef = collection(db, CERTIFICATES_COLLECTION);
    const q = query(
      certificatesRef,
      where('userId', '==', userId),
      where('courseId', '==', courseId),
      where('type', '==', 'enrollment')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size > 0;
  }, 'hasEnrollmentCertificate');
};

export const markCertificateAsDownloaded = async (certificateId) => {
  return executeService(async () => {
    const certificateRef = doc(db, CERTIFICATES_COLLECTION, certificateId);
    await updateDoc(certificateRef, {
      lastDownloadedAt: serverTimestamp(),
      downloadCount: (await getDoc(certificateRef)).data()?.downloadCount || 0 + 1
    });
  }, 'markCertificateAsDownloaded');
};

export const generateCompletionCertificate = async (userId, courseId, courseName) => {
  return executeService(async () => {
    const functions = getFunctions(getApp());
    const generateCompCertFn = httpsCallable(functions, 'generateCompletionCertificate');

    try {
      const result = await generateCompCertFn({
        userId,
        courseId,
        courseName
      });

      return result.data;
    } catch (error) {
      if (error.code === 'functions/not-found') {
        throw new Error('Completion certificate generation function not deployed yet. Please try again later.');
      }
      throw error;
    }
  }, 'generateCompletionCertificate');
};

export const checkCompletionCertificateEligibility = async (userId) => {
  return executeService(async () => {
    const functions = getFunctions(getApp());
    const checkCompCertFn = httpsCallable(functions, 'checkCompletionCertificateEligibility');

    try {
      const result = await checkCompCertFn({
        userId
      });

      return result.data;
    } catch (error) {
      if (error.code === 'functions/not-found') {
        throw new Error('Completion certificate eligibility check function not deployed yet. Please try again later.');
      }
      throw error;
    }
  }, 'checkCompletionCertificateEligibility');
};

const certificateServices = {
  getCertificatesByUserId,
  getCertificateById,
  generateEnrollmentCertificate,
  getCertificatesByType,
  hasEnrollmentCertificate,
  markCertificateAsDownloaded,
  generateCompletionCertificate,
  checkCompletionCertificateEligibility
};

export default certificateServices;
