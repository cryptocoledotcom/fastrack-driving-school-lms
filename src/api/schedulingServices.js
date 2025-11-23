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
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COURSE_IDS } from '../constants/courses';

export const createTimeSlot = async (timeSlotData) => {
  try {
    const slotRef = doc(collection(db, 'timeSlots'));
    
    const slot = {
      ...timeSlotData,
      isAvailable: true,
      bookedBy: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(slotRef, slot);
    
    return {
      id: slotRef.id,
      ...slot
    };
  } catch (error) {
    console.error('Error creating time slot:', error);
    throw error;
  }
};

export const getTimeSlots = async (filters = {}) => {
  try {
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
  } catch (error) {
    console.error('Error fetching time slots:', error);
    throw error;
  }
};

export const getAvailableTimeSlots = async (startDate, endDate) => {
  try {
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
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    throw error;
  }
};

export const bookTimeSlot = async (userId, slotId, userEmail) => {
  try {
    const slotRef = doc(db, 'timeSlots', slotId);
    const slotDoc = await getDoc(slotRef);

    if (!slotDoc.exists()) {
      throw new Error('Time slot not found');
    }

    const slotData = slotDoc.data();
    const bookedBy = slotData.bookedBy || [];

    if (bookedBy.some(booking => booking.userId === userId)) {
      throw new Error('You have already booked this time slot');
    }

    const booking = {
      userId,
      userEmail,
      bookedAt: serverTimestamp()
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return {
      success: true,
      booking,
      slot: slotData
    };
  } catch (error) {
    console.error('Error booking time slot:', error);
    throw error;
  }
};

export const getUserBookings = async (userId) => {
  try {
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
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const cancelBooking = async (userId, lessonId, slotId) => {
  try {
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
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
};

export const updateTimeSlot = async (slotId, updates) => {
  try {
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
  } catch (error) {
    console.error('Error updating time slot:', error);
    throw error;
  }
};

export const deleteTimeSlot = async (slotId) => {
  try {
    const slotRef = doc(db, 'timeSlots', slotId);
    await deleteDoc(slotRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting time slot:', error);
    throw error;
  }
};

const schedulingServices = {
  createTimeSlot,
  getTimeSlots,
  getAvailableTimeSlots,
  bookTimeSlot,
  getUserBookings,
  cancelBooking,
  updateTimeSlot,
  deleteTimeSlot
};

export default schedulingServices;