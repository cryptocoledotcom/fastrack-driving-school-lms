import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { COURSE_IDS } from '../../constants/courses';
import { executeService } from '../base/ServiceWrapper';
import { ValidationError, SchedulingError } from '../errors/ApiError';
import { validateUserId, validateTimeSlotData } from '../validators/validators';
import { getFirestoreTimestamps } from '../utils/timestampHelper.js';

export const createTimeSlot = async (timeSlotData) => {
  return executeService(async () => {
    validateTimeSlotData(timeSlotData);
    
    const slotRef = doc(collection(db, 'timeSlots'));
    
    const slot = {
      ...timeSlotData,
      isAvailable: true,
      bookedBy: [],
      ...getFirestoreTimestamps()
    };

    await setDoc(slotRef, slot);
    
    return {
      id: slotRef.id,
      ...slot
    };
  }, 'createTimeSlot');
};

export const getTimeSlots = async (filters = {}) => {
  return executeService(async () => {
    if (typeof filters !== 'object' || filters === null) {
      throw new ValidationError('Filters must be an object');
    }
    
    const slotsRef = collection(db, 'timeSlots');
    
    let q = slotsRef;
    if (filters.date) {
      q = query(slotsRef, where('date', '==', filters.date));
    }
    if (filters.isAvailable !== undefined) {
      q = query(slotsRef, where('isAvailable', '==', filters.isAvailable));
    }

    const querySnapshot = await getDocs(q);
    const slots = [];

    querySnapshot.forEach(doc => {
      slots.push({
        id: doc.id,
        ...doc.data(),
        bookedBy: doc.data().bookedBy || []
      });
    });

    return slots.sort((a, b) => {
      const timeA = new Date(`${a.date} ${a.startTime}`);
      const timeB = new Date(`${b.date} ${b.startTime}`);
      return timeA - timeB;
    });
  }, 'getTimeSlots');
};

export const getAvailableTimeSlots = async (startDate, endDate) => {
  return executeService(async () => {
    if (!(startDate instanceof Date)) {
      throw new ValidationError('Start date must be a Date object');
    }
    if (!(endDate instanceof Date)) {
      throw new ValidationError('End date must be a Date object');
    }
    
    const slotsRef = collection(db, 'timeSlots');
    const q = query(
      slotsRef,
      where('isAvailable', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const slots = [];

    querySnapshot.forEach(doc => {
      const slotData = doc.data();
      const slotDate = new Date(slotData.date);
      
      if (slotDate >= startDate && slotDate <= endDate) {
        slots.push({
          id: doc.id,
          ...slotData
        });
      }
    });

    return slots.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.startTime}`);
      const dateB = new Date(`${b.date} ${b.startTime}`);
      return dateA - dateB;
    });
  }, 'getAvailableTimeSlots');
};

export const bookTimeSlot = async (userId, slotId, userEmail) => {
  return executeService(async () => {
    validateUserId(userId);
    if (!slotId || typeof slotId !== 'string') {
      throw new ValidationError('Slot ID is required');
    }
    if (!userEmail || typeof userEmail !== 'string' || !userEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      throw new ValidationError('User email must be valid format');
    }
    
    const slotRef = doc(db, 'timeSlots', slotId);
    const slotDoc = await getDoc(slotRef);

    if (!slotDoc.exists()) {
      throw new SchedulingError('Time slot not found');
    }

    const slotData = slotDoc.data();
    const bookedBy = slotData.bookedBy || [];

    if (bookedBy.some(booking => booking.userId === userId)) {
      throw new SchedulingError('You have already booked this time slot');
    }

    const booking = {
      userId,
      userEmail,
      bookedAt: new Date().toISOString()
    };

    bookedBy.push(booking);

    const isAvailable = bookedBy.length < (slotData.capacity || 1);

    await updateDoc(slotRef, {
      bookedBy,
      isAvailable,
      updatedAt: serverTimestamp()
    });

    const lessonRef = doc(collection(db, 'users', userId, 'lessons'));
    
    await setDoc(lessonRef, {
      userId,
      slotId,
      date: slotData.date,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      location: slotData.location || 'TBD',
      instructor: slotData.instructor || 'TBD',
      status: 'scheduled',
      courseId: COURSE_IDS.BEHIND_WHEEL,
      ...getFirestoreTimestamps()
    });

    return {
      success: true,
      booking,
      slot: slotData
    };
  }, 'bookTimeSlot');
};

export const assignTimeSlot = async (slotId, userId) => {
  return executeService(async () => {
    if (!slotId || typeof slotId !== 'string') {
      throw new ValidationError('Slot ID is required');
    }
    validateUserId(userId);
    
    const slotRef = doc(db, 'timeSlots', slotId);
    const slotDoc = await getDoc(slotRef);

    if (!slotDoc.exists()) {
      throw new SchedulingError('Time slot not found');
    }

    const slotData = slotDoc.data();

    if (slotData.assignedTo && slotData.assignedTo === userId) {
      throw new SchedulingError('This slot is already assigned to this user');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      throw new ValidationError('User not found');
    }
    const userData = userDoc.data();

    const lessonRef = doc(collection(db, 'users', userId, 'lessons'));
    
    await setDoc(lessonRef, {
      userId,
      slotId,
      date: slotData.date,
      startTime: slotData.startTime,
      endTime: slotData.endTime,
      location: slotData.location || 'TBD',
      instructor: slotData.instructor || 'TBD',
      status: 'assigned',
      courseId: COURSE_IDS.BEHIND_WHEEL,
      assignedAt: new Date().toISOString(),
      ...getFirestoreTimestamps()
    });

    await updateDoc(slotRef, {
      assignedTo: userId,
      assignedToEmail: userData.email,
      assignedAt: serverTimestamp(),
      isAvailable: false,
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      slotId,
      userId,
      slot: slotData
    };
  }, 'assignTimeSlot');
};

export const unassignTimeSlot = async (slotId, userId) => {
  return executeService(async () => {
    if (!slotId || typeof slotId !== 'string') {
      throw new ValidationError('Slot ID is required');
    }
    validateUserId(userId);
    
    const slotRef = doc(db, 'timeSlots', slotId);
    const slotDoc = await getDoc(slotRef);

    if (!slotDoc.exists()) {
      throw new SchedulingError('Time slot not found');
    }

    const slotData = slotDoc.data();
    if (slotData.assignedTo !== userId) {
      throw new SchedulingError('This slot is not assigned to this user');
    }

    const lessonsRef = collection(db, 'users', userId, 'lessons');
    const q = query(lessonsRef, where('slotId', '==', slotId));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const lessonDoc = querySnapshot.docs[0];
      await deleteDoc(lessonDoc.ref);
    }

    await updateDoc(slotRef, {
      assignedTo: null,
      assignedToEmail: null,
      assignedAt: null,
      isAvailable: true,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  }, 'unassignTimeSlot');
};

export const getSlotsByAssignment = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    
    const slotsRef = collection(db, 'timeSlots');
    const q = query(slotsRef, where('assignedTo', '==', userId));
    const querySnapshot = await getDocs(q);
    
    const slots = [];
    querySnapshot.forEach(docSnap => {
      slots.push({
        id: docSnap.id,
        ...docSnap.data()
      });
    });

    return slots.sort((a, b) => {
      const timeA = new Date(`${a.date} ${a.startTime}`);
      const timeB = new Date(`${b.date} ${b.startTime}`);
      return timeA - timeB;
    });
  }, 'getSlotsByAssignment');
};

export const getUserBookings = async (userId) => {
  return executeService(async () => {
    validateUserId(userId);
    
    const lessonsRef = collection(db, 'users', userId, 'lessons');
    const querySnapshot = await getDocs(lessonsRef);
    
    const bookings = [];
    querySnapshot.forEach(doc => {
      bookings.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return bookings.sort((a, b) => {
      const timeA = new Date(`${a.date} ${a.startTime}`);
      const timeB = new Date(`${b.date} ${b.startTime}`);
      return timeA - timeB;
    });
  }, 'getUserBookings');
};

export const cancelBooking = async (userId, lessonId, slotId) => {
  return executeService(async () => {
    validateUserId(userId);
    if (!lessonId || typeof lessonId !== 'string') {
      throw new ValidationError('Lesson ID is required');
    }
    if (!slotId || typeof slotId !== 'string') {
      throw new ValidationError('Slot ID is required');
    }
    
    const lessonRef = doc(db, 'users', userId, 'lessons', lessonId);
    await deleteDoc(lessonRef);

    const slotRef = doc(db, 'timeSlots', slotId);
    const slotDoc = await getDoc(slotRef);

    if (slotDoc.exists()) {
      const slotData = slotDoc.data();
      const bookedBy = (slotData.bookedBy || []).filter(b => b.userId !== userId);

      await updateDoc(slotRef, {
        bookedBy,
        isAvailable: true,
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  }, 'cancelBooking');
};

export const updateTimeSlot = async (slotId, updates) => {
  return executeService(async () => {
    if (!slotId || typeof slotId !== 'string') {
      throw new ValidationError('Slot ID is required');
    }
    if (typeof updates !== 'object' || !updates) {
      throw new ValidationError('Updates must be a valid object');
    }
    
    const slotRef = doc(db, 'timeSlots', slotId);
    
    await updateDoc(slotRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });

    const slotDoc = await getDoc(slotRef);
    return {
      id: slotDoc.id,
      ...slotDoc.data()
    };
  }, 'updateTimeSlot');
};

export const deleteTimeSlot = async (slotId) => {
  return executeService(async () => {
    if (!slotId || typeof slotId !== 'string') {
      throw new ValidationError('Slot ID is required');
    }
    
    const slotRef = doc(db, 'timeSlots', slotId);
    await deleteDoc(slotRef);
    return { success: true };
  }, 'deleteTimeSlot');
};

const schedulingServices = {
  createTimeSlot,
  getTimeSlots,
  getAvailableTimeSlots,
  bookTimeSlot,
  getUserBookings,
  cancelBooking,
  updateTimeSlot,
  deleteTimeSlot,
  assignTimeSlot,
  unassignTimeSlot,
  getSlotsByAssignment
};

export default schedulingServices;
