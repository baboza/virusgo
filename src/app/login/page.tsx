"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, Activity } from 'lucide-react';
import { BackgroundSVG } from '@/components/ui/BackgroundSVG';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { appUser, user: firebaseUser, loading: authLoading } = useAuth();

  // If user is already logged in, redirect them to their dashboard
  useEffect(() => {
    if (!authLoading && appUser) {
      if (appUser.role === 'instructor') {
        router.push('/instructor');
      } else {
        router.push('/student');
      }
    }
  }, [appUser, authLoading, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      // If user doesn't exist, create a new account automatically
      if (!userDoc.exists()) {
        const isSuperAdmin = user.email === 'jirawat.s@msu.ac.th';
        const assignedRole = isSuperAdmin ? 'instructor' : 'student';

        await setDoc(userDocRef, {
          uid: user.uid,
          fullname: user.displayName || 'New User',
          email: user.email,
          photoURL: user.photoURL || '',
          role: assignedRole,
          score: 0,
          exp: 0,
          level: 1,
          badges: [],
          completedLessons: [],
          accuracy: 0,
          createdAt: Date.now()
        });

        if (assignedRole === 'instructor') {
          router.push('/instructor');
        } else {
          router.push('/student');
        }
      } else {
        const userData = userDoc.data();
        if (userData.role === 'instructor' || user.email === 'jirawat.s@msu.ac.th') {
          router.push('/instructor');
        } else {
          router.push('/student');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Authentication failed');
      setLoading(false);
    }
  };

  if (authLoading || appUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Activity className="w-16 h-16 text-primary animate-pulse mb-4" />
        <div className="text-primary font-mono tracking-widest uppercase animate-pulse">Establishing Secure Connection...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-slate-950">
      
      <BackgroundSVG type="medical" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass bg-black/60 border-primary/30 p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl relative overflow-hidden">
          
          {/* Scanning Line Effect */}
          <motion.div 
            className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(6,182,212,1)]"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="w-24 h-24 bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <ShieldCheck className="w-12 h-12 text-primary" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-widest text-glow mb-2">System Access</h1>
              <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">
                Identity verification required
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-danger/10 border border-danger/50 text-danger text-sm font-bold p-4 rounded-xl w-full flex items-start gap-3 text-left"
              >
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="w-full pt-4 space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-2xl p-[2px]"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-xy opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
                <div className="relative bg-black/80 backdrop-blur-md text-white rounded-2xl px-6 py-4 flex items-center justify-center gap-3 transition-all duration-300 group-hover:bg-transparent">
                  {loading ? (
                    <Activity className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Fingerprint className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                      <span className="font-black uppercase tracking-widest text-lg">Scan Credentials</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            <div className="w-full flex items-center justify-center gap-2 text-slate-500 font-mono text-xs pt-6 border-t border-slate-800">
              <Lock className="w-3 h-3" />
              <span>256-BIT ENCRYPTION ACTIVE</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
