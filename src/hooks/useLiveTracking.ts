import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useLiveTracking(gameId: string, progress: string) {
  const { appUser } = useAuth();
  const latestSessionRef = useRef<any>(null);

  // 1. Lifecycle effect: Cleanup live session ONLY when player leaves game (unmounts)
  useEffect(() => {
    if (!appUser?.uid) return;
    const sessionRef = doc(db, 'live_sessions', appUser.uid);
    latestSessionRef.current = sessionRef;

    return () => {
      // Only delete live session doc once when user leaves the game
      deleteDoc(sessionRef).catch(() => {});
    };
  }, [appUser?.uid]);

  // 2. Progress update effect: updates document without deleting/recreating on every question
  useEffect(() => {
    if (!appUser?.uid || !latestSessionRef.current) return;

    setDoc(latestSessionRef.current, {
      gameId,
      progress,
      updatedAt: serverTimestamp(),
      user: {
        uid: appUser.uid,
        fullname: appUser.fullname || 'Unknown Student',
        email: appUser.email || '',
        photoURL: appUser.photoURL || '',
        level: appUser.level || 1
      }
    }, { merge: true }).catch((error) => {
      console.error("Failed to update live tracking", error);
    });
  }, [appUser?.uid, appUser?.fullname, appUser?.email, appUser?.photoURL, appUser?.level, gameId, progress]);
}
