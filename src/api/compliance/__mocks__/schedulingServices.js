import { vi } from 'vitest';

export const getUserBookings = vi.fn();
export const cancelBooking = vi.fn();
export const getAvailableTimeSlots = vi.fn();
export const bookTimeSlot = vi.fn();
// Add other exports if needed
export const createTimeSlot = vi.fn();
export const getTimeSlots = vi.fn();
export const updateTimeSlot = vi.fn();
export const deleteTimeSlot = vi.fn();
export const assignTimeSlot = vi.fn();
export const unassignTimeSlot = vi.fn();
export const getSlotsByAssignment = vi.fn();

const schedulingServices = {
    getUserBookings,
    cancelBooking,
    getAvailableTimeSlots,
    bookTimeSlot,
    createTimeSlot,
    getTimeSlots,
    updateTimeSlot,
    deleteTimeSlot,
    assignTimeSlot,
    unassignTimeSlot,
    getSlotsByAssignment
};

export default schedulingServices;
