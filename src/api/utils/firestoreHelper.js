import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { updateWithTimestamp } from './timestampHelper.js';

export const mergeOrCreate = async (db, collectionPath, docId, data, merge = true) => {
  const docRef = doc(db, collectionPath, docId);
  await setDoc(docRef, data, { merge });
  return { id: docId, ...data };
};

export const updateWithTimestampField = async (db, collectionPath, docId, data) => {
  const docRef = doc(db, collectionPath, docId);
  const updateData = updateWithTimestamp(data);
  await updateDoc(docRef, updateData);
  return updateData;
};

export const getDocumentSafely = async (db, collectionPath, docId) => {
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

export const checkDocumentExists = async (db, collectionPath, docId) => {
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

export const updateIfExists = async (db, collectionPath, docId, data) => {
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  await updateDoc(docRef, updateWithTimestamp(data));
  return { ...docSnap.data(), ...updateWithTimestamp(data) };
};

export const createOrUpdate = async (db, collectionPath, docId, data) => {
  const docRef = doc(db, collectionPath, docId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    await updateDoc(docRef, updateWithTimestamp(data));
    return { ...docSnap.data(), ...updateWithTimestamp(data) };
  } else {
    await setDoc(docRef, data, { merge: true });
    return { id: docId, ...data };
  }
};
