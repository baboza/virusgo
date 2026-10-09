import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from './config';
import { Virus } from '@/types';

const COLLECTION_NAME = 'viruses';

export const getViruses = async (): Promise<Virus[]> => {
  const q = query(collection(db, COLLECTION_NAME), orderBy('virusName'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ ...doc.data(), virusID: doc.id } as Virus));
};

export const getVirus = async (id: string): Promise<Virus | null> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  const snapshot = await getDoc(docRef);
  if (snapshot.exists()) {
    return { ...snapshot.data(), virusID: snapshot.id } as Virus;
  }
  return null;
};

export const createVirus = async (virusData: Omit<Virus, 'virusID'>): Promise<string> => {
  const docRef = doc(collection(db, COLLECTION_NAME)); // auto-generate ID
  await setDoc(docRef, { ...virusData, virusID: docRef.id });
  return docRef.id;
};

export const updateVirus = async (id: string, virusData: Partial<Virus>): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await updateDoc(docRef, virusData);
};

export const deleteVirus = async (id: string): Promise<void> => {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
};
