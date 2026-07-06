"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User as FirebaseUser,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { User as AppUser } from '@/types';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: FirebaseUser | null;
  appUser: AppUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous Firestore listener when auth state changes
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);

        // --- Real-time listener: updates appUser whenever Firestore changes ---
        let isFirstSnapshot = true;
        unsubscribeSnapshot = onSnapshot(userDocRef, async (userDoc) => {
          if (userDoc.exists()) {
            let userData = userDoc.data() as AppUser;
            userData.uid = firebaseUser.uid; // Ensure UID is always present
            userData.exp = Number(userData.exp) || 0; // Force number type
            userData.level = Number(userData.level) || 1; // Force number type
            let needsUpdate = false;

            // --- ADMIN OVERRIDE (only check on first load to avoid loops) ---
            if (isFirstSnapshot) {
              if (firebaseUser.email === 'jirawat.s@msu.ac.th' && userData.role !== 'instructor') {
                userData.role = 'instructor';
                needsUpdate = true;
                console.log("Admin privileges granted to jirawat.s@msu.ac.th");
              }

              // --- UPDATE PHOTO URL from Google ---
              if (firebaseUser.photoURL && userData.photoURL !== firebaseUser.photoURL) {
                userData.photoURL = firebaseUser.photoURL;
                needsUpdate = true;
              }

              if (needsUpdate) {
                await updateDoc(userDocRef, {
                  role: userData.role,
                  photoURL: userData.photoURL || ''
                });
              }

              isFirstSnapshot = false;
            }

            // --- AUTO LEVEL UP LOGIC ---
            const expectedLevel = Math.floor(userData.exp / 100) + 1;
            if (expectedLevel > userData.level) {
              userData.level = expectedLevel;
              updateDoc(userDocRef, { level: expectedLevel }).catch(e => console.error("Auto level-up sync failed:", e));
            }

            setAppUser(userData);
          } else {
            console.warn("User document not found in Firestore.");
            setAppUser(null);
          }

          setLoading(false);
        }, (error) => {
          console.error("Error listening to user data:", error);
          setAppUser(null);
          setLoading(false);
        });
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, appUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
