"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signInWithPopup, GoogleAuthProvider, signOut, deleteUser } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldAlert, 
  Lock, 
  ShieldCheck, 
  Activity, 
  GraduationCap, 
  ArrowLeft, 
  Sparkles,
  Info,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { BackgroundSVG } from '@/components/ui/BackgroundSVG';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { INSTRUCTOR_SUPER_EMAIL, validateNewUserRegistration } from '@/lib/empireConstants';

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'student' | 'instructor'>('student');
  
  const router = useRouter();
  const { appUser, loading: authLoading } = useAuth();

  // If user is already logged in with a valid Firestore profile, redirect them
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
      // Always prompt account chooser so students can switch between accounts easily
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const normalizedEmail = (user.email || '').trim().toLowerCase();
      
      // Check if user already exists in Firestore (1 Read)
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Strict validation for NEW sign-ups
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
        // Existing registered account -> allow seamless login
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
          <SVGVirus type="corona" className="w-16 h-16 text-cyan-400 animate-spin-slow relative z-10" />
        </div>
        <div className="text-cyan-400 font-mono text-sm tracking-widest uppercase animate-pulse">
          Establishing Secure Bio-Link...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between p-3 sm:p-6 md:p-8 relative overflow-x-hidden bg-slate-950">
      
      {/* Background Graphic */}
      <BackgroundSVG type="medical" />

      {/* Ambient Glows */}
      <div className="absolute top-[10%] left-[15%] w-[45%] h-[45%] rounded-full bg-cyan-500/15 blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] right-[15%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />

      {/* Top Header / Back Navigation */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับหน้าแรก</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="hidden sm:inline">AUTH NODE ONLINE</span>
        </div>
      </header>

      {/* Central Login Card */}
      <main className="w-full max-w-md mx-auto my-auto z-10 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full relative"
        >
          <div className="glass bg-slate-900/85 border border-cyan-500/30 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-2xl relative overflow-hidden">
            
            {/* Top Scanning Line Effect */}
            <motion.div 
              className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_rgba(6,182,212,1)]"
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 5, ease: "linear", repeat: Infinity }}
            />

            <div className="flex flex-col items-center text-center space-y-5">
              
              {/* Mascot / Shield Avatar */}
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-tr from-cyan-500/30 to-emerald-500/30 rounded-2xl blur-lg animate-pulse" />
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-950 border-2 border-cyan-400/60 rounded-2xl flex items-center justify-center relative z-10 shadow-[0_0_25px_rgba(6,182,212,0.4)]">
                  <SVGVirus type="corona" className="w-9 h-9 sm:w-11 sm:h-11 text-cyan-400" />
                </div>
              </div>

              {/* Title & Branding */}
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
                  VET<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">VIRUS</span> GO
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  ระบบการเรียนรู้ไวรัสวิทยาสัตวแพทย์ มมส.
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono uppercase tracking-wider">
                  Faculty of Veterinary Medicine • MSU
                </p>
              </div>

              {/* Role Toggle Selector (Student vs Instructor) */}
              <div className="w-full grid grid-cols-2 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('student')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'student'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>สำหรับนิสิต</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('instructor')}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'instructor'
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/30 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>สำหรับอาจารย์</span>
                </button>
              </div>

              {/* Dynamic Guidelines Card */}
              <AnimatePresence mode="wait">
                {activeTab === 'student' ? (
                  <motion.div 
                    key="student-guide"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="w-full rounded-2xl bg-slate-950/70 border border-cyan-500/20 p-3.5 text-left space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-cyan-300 text-[11px] uppercase tracking-wide">
                      <Info className="w-3.5 h-3.5 text-cyan-400" />
                      <span>ข้อกำหนดการเข้าสู่ระบบสำหรับนิสิต</span>
                    </div>
                    
                    <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                      <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        <span className="text-amber-400 text-xs">🔥</span>
                        <div>
                          <strong className="text-amber-300">ปี 4 (HEMORIA):</strong>
                          <div className="text-slate-400 text-[10px]">ใช้อีเมลรหัสนิสิต <code className="text-amber-200">66xxxxxxxxx@msu.ac.th</code></div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
                        <span className="text-purple-400 text-xs">👑</span>
                        <div>
                          <strong className="text-purple-300">ปี 5 (SYNAPSIA):</strong>
                          <div className="text-slate-400 text-[10px]">ใช้อีเมลรหัสนิสิต <code className="text-purple-200">65xxxxxxxxx@msu.ac.th</code></div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 leading-relaxed">
                      * บัญชีนิสิตปี 3 ที่ลงทะเบียนไว้แล้ว สามารถกดล็อกอินเข้าใช้งานต่อได้ทันที
                    </p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="instructor-guide"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="w-full rounded-2xl bg-slate-950/70 border border-purple-500/20 p-3.5 text-left space-y-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-bold text-purple-300 text-[11px] uppercase tracking-wide">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      <span>Instructor &amp; Admin Terminal</span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      อาจารย์ประจำวิชาและผู้ดูแลระบบสามารถเข้าสู่ระบบด้วยบัญชี Google ที่ได้รับสิทธิ์ ระบบจะนำทางเข้าสู่ <strong className="text-purple-300">Instructor Dashboard</strong> โดยอัตโนมัติ
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Banner */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs p-3.5 rounded-2xl w-full flex items-start gap-2.5 text-left shadow-lg shadow-rose-950/50"
                >
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    {errorTitle && <p className="font-bold text-rose-300 text-xs sm:text-sm">{errorTitle}</p>}
                    <p className="text-[11px] leading-relaxed text-rose-200/90">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Google Sign In Action */}
              <div className="w-full pt-1 space-y-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full relative group overflow-hidden rounded-2xl p-[2px] transition-transform active:scale-[0.98] cursor-pointer disabled:opacity-60"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 bg-[length:200%_auto] animate-gradient-xy opacity-80 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <div className="relative bg-slate-950/90 backdrop-blur-md text-white rounded-2xl px-5 py-3.5 sm:py-4 flex items-center justify-center gap-3 transition-all duration-300 group-hover:bg-slate-900/90 shadow-xl">
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 animate-spin text-cyan-400" />
                        <span className="font-bold text-sm text-cyan-200 font-mono">กำลังเชื่อมต่อบัญชี Google...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                          <GoogleIcon className="w-4 h-4" />
                        </div>
                        <div className="text-left">
                          <div className="font-black text-sm sm:text-base tracking-wide text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                            เข้าสู่ระบบด้วย Google <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                            Google Workspace (@msu.ac.th)
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </button>
              </div>

              {/* Encryption Security Badge */}
              <div className="w-full flex items-center justify-center gap-2 text-slate-500 font-mono text-[10px] sm:text-[11px] pt-3 border-t border-slate-800/80">
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>FIREBASE AUTH • 256-BIT ENCRYPTION</span>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] sm:text-xs text-slate-600 font-mono py-2 z-10">
        <p>VetVirus GO • Department of Veterinary Virology, Faculty of Veterinary Medicine, MSU</p>
      </footer>

    </div>
  );
}
