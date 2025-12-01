import {
  assignTimeSlot,
  unassignTimeSlot,
  getSlotsByAssignment
} from '../schedulingServices';

jest.mock('firebase/firestore');
jest.mock('../../base/ServiceWrapper', () => ({
  executeService: jest.fn((fn) => fn())
}));

describe('Scheduling Services - Admin Assignment', () => {
  it('should export assignTimeSlot function', () => {
    expect(typeof assignTimeSlot).toBe('function');
  });

  it('should export unassignTimeSlot function', () => {
    expect(typeof unassignTimeSlot).toBe('function');
  });

  it('should export getSlotsByAssignment function', () => {
    expect(typeof getSlotsByAssignment).toBe('function');
  });
});
