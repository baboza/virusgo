import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export function useLiveTracking(gameId: string, progress: string) {
  const { appUser } = useAuth();
  
  // Use a ref to store the latest progress so the cleanup function has access to it 
  // without triggering re-runs of the setup/teardown if we don't want to.
  // Actually, we want to update Firestore whenever `progress` changes.
  
  useEffect(() => {
    if (!appUser) return;

    const sessionRef = doc(db, 'live_sessions', appUser.uid);
    
    // Update live session in Firestore
    const updateLiveSession = async () => {
      try {
        await setDoc(sessionRef, {
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
        });
      } catch (error) {
        console.error("Failed to update live tracking", error);
      }
    };

    updateLiveSession();

    // Cleanup: Remove live session when unmounting
    return () => {
      const removeLiveSession = async () => {
        try {
          await deleteDoc(sessionRef);
        } catch (error) {
          console.error("Failed to remove live tracking", error);
        }
      };
      // We don't await this inside the return function, we just call it.
      removeLiveSession();
    };
  }, [appUser, gameId, progress]);
}
