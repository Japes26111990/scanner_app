import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export const getDepartments = async () => {
  const snapshot = await getDocs(collection(db, 'departments'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getEmployees = async () => {
  const snapshot = await getDocs(collection(db, 'employees'));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};