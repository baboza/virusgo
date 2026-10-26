"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ShieldAlert, Fingerprint, Lock, ShieldCheck, Activity, GraduationCap } from 'lucide-react';
import { BackgroundSVG } from '@/components/ui/BackgroundSVG';
import { INSTRUCTOR_SUPER_EMAIL, validateNewUserRegistration } from '@/lib/empireConstants';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [error, setError] = useState('');
  
  const router = useRouter();
  const { appUser, loading: authLoading } = useAuth();

  // If user is already logged in with a valid Firestore profile, redirect them to their dashboard
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
    setErrorTitle('');
    setError('');

    try {
      const provider = new GoogleAuthProvider();
      // Always prompt account chooser so students can switch from personal @gmail.com to @msu.ac.th easily
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const normalizedEmail = (user.email || '').trim().toLowerCase();
      
      // Check if user already exists in Firestore (1 Read)
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Strict validation for NEW sign-ups (Years 4 & 5 @msu.ac.th, GM never.away@gmail.com, Instructor)
        const validation = validateNewUserRegistration(normalizedEmail);

        if (!validation.allowed) {
          // Clean up transient Firebase Auth record & session immediately (0 Firestore Writes!)
          await deleteUser(user).catch(() => {});
          await signOut(auth).catch(() => {});
          setErrorTitle(validation.errorTitle);
          setError(validation.errorMessage);
          setLoading(false);
          return;
        }

        const newProfilePayload: Record<string, unknown> = {
          uid: user.uid,
          fullname: user.displayName || 'New User',
          email: normalizedEmail,
          photoURL: user.photoURL || '',
          role: validation.role,
          year: validation.year,
          continentId: validation.continentId,
          needsCohortSelection: validation.needsCohortSelection,
          score: 0,
          exp: 0,
          level: 1,
          badges: [],
          completedLessons: [],
          accuracy: 0,
          sessionsCount: 0,
          createdAt: Date.now(),
        };

        if (validation.studentID) {
          newProfilePayload.studentID = validation.studentID;
        }

        await setDoc(userDocRef, newProfilePayload);

        if (validation.role === 'instructor') {
          router.push('/instructor');
        } else {
          router.push('/student');
        }
      } else {
        // Existing registered account (including all existing Year 3 students) -> allow seamless login
        const userData = userDoc.data();
        if (userData.role === 'instructor' || normalizedEmail === INSTRUCTOR_SUPER_EMAIL) {
          router.push('/instructor');
        } else {
          router.push('/student');
        }
      }
    } catch (err: any) {
      console.error(err);
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorTitle('การยืนยันตัวตนไม่สำเร็จ');
        setError(err.message || 'Google Authentication failed');
      }
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
        <div className="glass bg-black/60 border-primary/30 p-8 sm:p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl relative overflow-hidden">
          
          {/* Scanning Line Effect */}
          <motion.div 
            className="absolute top-0 left-0 w-full h-1 bg-primary/50 shadow-[0_0_20px_rgba(6,182,212,1)]"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />

          <div className="flex flex-col items-center text-center space-y-5">
            <div className="relative">
              <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="w-20 h-20 bg-slate-900 border-2 border-primary rounded-full flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-widest text-glow mb-1.5">System Access</h1>
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                MSU Veterinary Virology Verification
              </p>
            </div>

            {/* Cohort Email Policy Notice */}
            <div className="w-full rounded-2xl bg-slate-900/85 border border-cyan-500/25 p-4 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-cyan-300">
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>เงื่อนไขการลงทะเบียนเข้าใช้งานใหม่ (`@msu.ac.th` เท่านั้น)</span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300 pl-1">
                <p>🔥 <strong className="text-amber-300">ชั้นปีที่ 4 (ทวีป HEMORIA):</strong> รหัส <code className="text-amber-200">66xxxxxxxxx@msu.ac.th</code></p>
                <p>👑 <strong className="text-purple-300">ชั้นปีที่ 5 (ทวีป SYNAPSIA):</strong> รหัส <code className="text-purple-200">65xxxxxxxxx@msu.ac.th</code></p>
              </div>
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 leading-relaxed">
                ไม่อนุญาตให้สมัครใหม่ด้วยบัญชี <span className="text-rose-400 font-semibold">@gmail.com</span> ส่วนตัว • สำหรับนิสิตชั้นปีที่ 3 ที่ลงทะเบียนไว้แล้ว สามารถเข้าใช้งานบัญชีเดิมได้ตามปกติ
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs p-4 rounded-2xl w-full flex items-start gap-3 text-left"
              >
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  {errorTitle && <p className="font-bold text-rose-300 text-sm">{errorTitle}</p>}
                  <p className="leading-relaxed">{error}</p>
                </div>
              </motion.div>
            )}

            <div className="w-full pt-2 space-y-4">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-2xl p-[2px] cursor-pointer"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_auto] animate-gradient-xy opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
                <div className="relative bg-black/80 backdrop-blur-md text-white rounded-2xl px-6 py-4 flex items-center justify-center gap-3 transition-all duration-300 group-hover:bg-transparent">
                  {loading ? (
                    <Activity className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <>
                      <Fingerprint className="w-6 h-6 text-primary group-hover:text-white transition-colors" />
                      <span className="font-black uppercase tracking-widest text-base sm:text-lg">Sign In with Google (@msu.ac.th)</span>
                    </>
                  )}
                </div>
              </button>
            </div>

            <div className="w-full flex items-center justify-center gap-2 text-slate-500 font-mono text-xs pt-4 border-t border-slate-800">
              <Lock className="w-3 h-3" />
              <span>256-BIT ENCRYPTION ACTIVE</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
