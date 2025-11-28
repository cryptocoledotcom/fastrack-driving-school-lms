import { serverTimestamp } from 'firebase/firestore';

export const getTimestamps = () => ({
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const getCreatedTimestamp = () => ({
  createdAt: new Date().toISOString()
});

export const getUpdatedTimestamp = () => ({
  updatedAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString()
});

export const getFirestoreTimestamps = () => ({
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

export const getCurrentISOTimestamp = () => new Date().toISOString();

export const getCurrentTimestamp = () => Date.now();

export const createTimestampedData = (data) => ({
  ...data,
  ...getTimestamps()
});

export const updateWithTimestamp = (data) => ({
  ...data,
  ...getUpdatedTimestamp()
});
