"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Clock, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle, 
  ArrowLeft, 
  ArrowRight, 
  RotateCcw, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles, 
  Microscope, 
  FileText, 
  Check, 
  ChevronRight, 
  Volume2, 
  Eye, 
  EyeOff, 
  Strikethrough, 
  Scissors, 
  BarChart3, 
  BookOpen, 
  Lock, 
  Layers, 
  Share2 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { sfx } from '@/utils/sound';
import { awardDailyCappedExp } from '@/lib/dailyExpCap';
import { 
  VCAExamQuestion, 
  VCACategory, 
  VCA_CATEGORIES_CONFIG, 
  generateVCAExam 
} from '@/data/vcaQuestionBank';

// Dynamic 3D Model Components (Zero SSR)
const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), { ssr: false });
const AnimalHologram3D = dynamic(() => import('@/components/ui/AnimalHologram3D'), { ssr: false });
const AmbientBioCanvas3D = dynamic(() => import('@/components/ui/AmbientBioCanvas3D'), { ssr: false });

// ── Strict Trial Whitelist ────────────────────────────────────────────────────
const WHITELISTED_EMAILS = [
  'never.away@gmail.com',
  'wilasinee.c@msu.ac.th'
];

type ExamStage = 'intro' | 'active' | 'result';

export default function VCAPracticePage() {
  const { user, appUser, loading: authLoading } = useAuth();

  // Authentication & Whitelist Verification
  const currentUserEmail = useMemo(() => {
    return (appUser?.email || user?.email || '').trim().toLowerCase();
  }, [appUser?.email, user?.email]);

  const isAuthorized = useMemo(() => {
    if (!currentUserEmail) return false;
    return WHITELISTED_EMAILS.includes(currentUserEmail);
  }, [currentUserEmail]);

  // Exam States
  const [examStage, setExamStage] = useState<ExamStage>('intro');
  const [questions, setQuestions] = useState<VCAExamQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [eliminatedChoices, setEliminatedChoices] = useState<Record<number, Set<string>>>({});
  const [lifelinesRemaining, setLifelinesRemaining] = useState<number>(3); // 3x 50:50 lifelines per round
  const [usedLifelines, setUsedLifelines] = useState<Set<number>>(new Set());

  // Timer States
  const EXAM_DURATION_SECONDS = 25 * 60; // 25 Minutes (1 min / question)
  const [timeLeft, setTimeLeft] = useState<number>(EXAM_DURATION_SECONDS);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isUntimed, setIsUntimed] = useState<boolean>(false);
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);

  // Modal & Drawer States
  const [show3DHintModal, setShow3DHintModal] = useState<boolean>(false);
  const [active3DTab, setActive3DTab] = useState<'virion' | 'animal'>('virion');
  const [showSubmitConfirmModal, setShowSubmitConfirmModal] = useState<boolean>(false);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'flagged'>('all');

  // Score & EXP States
  const [awardedExp, setAwardedExp] = useState<number>(0);
  const [hasSavedExp, setHasSavedExp] = useState<boolean>(false);

  // Initialize Exam
  const handleStartExam = useCallback(() => {
    sfx.click();
    const newExam = generateVCAExam(25);
    setQuestions(newExam);
    setCurrentIndex(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setEliminatedChoices({});
    setLifelinesRemaining(3);
    setUsedLifelines(new Set());
    setTimeLeft(EXAM_DURATION_SECONDS);
    setTimeSpentSeconds(0);
    setExamStage('active');
    setIsTimerRunning(true);
    setHasSavedExp(false);
  }, []);

  // Timer countdown hook
  useEffect(() => {
    if (examStage !== 'active' || isUntimed || !isTimerRunning) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
      setTimeSpentSeconds(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [examStage, isUntimed, isTimerRunning]);

  // Current Question
  const currentQ = questions[currentIndex];

  // Choice Selection
  const handleSelectChoice = (choice: string) => {
    sfx.click();
    setUserAnswers(prev => ({
      ...prev,
      [currentIndex]: choice
    }));
  };

  // Clear Answer
  const handleClearAnswer = () => {
    sfx.click();
    setUserAnswers(prev => {
      const copy = { ...prev };
      delete copy[currentIndex];
      return copy;
    });
  };

  // Flag for Review Toggle
  const handleToggleFlag = () => {
    sfx.click();
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(currentIndex)) {
        next.delete(currentIndex);
      } else {
        next.add(currentIndex);
      }
      return next;
    });
  };

  // Eliminate Choice Toggle (Strikethrough)
  const handleToggleElimination = (e: React.MouseEvent, choice: string) => {
    e.stopPropagation();
    sfx.click();
    setEliminatedChoices(prev => {
      const currentElim = new Set(prev[currentIndex] || []);
      if (currentElim.has(choice)) {
        currentElim.delete(choice);
      } else {
        currentElim.add(choice);
      }
      return {
        ...prev,
        [currentIndex]: currentElim
      };
    });
  };

  // 50:50 Lifeline Usage
  const handleUse5050 = () => {
    if (lifelinesRemaining <= 0 || usedLifelines.has(currentIndex) || !currentQ) return;
    sfx.click();
    
    // Pick 2 wrong choices to eliminate
    const wrongChoices = currentQ.choices.filter(c => c !== currentQ.correctAnswer);
    const shuffledWrong = [...wrongChoices].sort(() => 0.5 - Math.random());
    const toEliminate = shuffledWrong.slice(0, 2);

    setEliminatedChoices(prev => ({
      ...prev,
      [currentIndex]: new Set([...(prev[currentIndex] || []), ...toEliminate])
    }));
    setUsedLifelines(prev => new Set(prev).add(currentIndex));
    setLifelinesRemaining(prev => Math.max(0, prev - 1));
  };

  // Submit Exam
  const handleSubmitExam = useCallback(async () => {
    sfx.correct();
    setIsTimerRunning(false);
    setShowSubmitConfirmModal(false);
    setExamStage('result');

    // Calculate score
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount += 1;
      }
    });

    // Award daily capped EXP (10 EXP per correct answer, max 250)
    if (appUser?.uid && !hasSavedExp) {
      try {
        const intended = correctCount * 10;
        const res = await awardDailyCappedExp(
          appUser.uid,
          'vca-practice',
          'VCA Board Simulator',
          correctCount,
          intended
        );
        setAwardedExp(res.awardedExp);
        setHasSavedExp(true);
      } catch (err) {
        console.error("Failed to award VCA practice EXP:", err);
      }
    }
  }, [appUser?.uid, hasSavedExp, questions, userAnswers]);

  // Format MM:SS
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
  };

  // Computed Exam Results
  const examResults = useMemo(() => {
    if (examStage !== 'result' || questions.length === 0) return null;

    let totalScore = 0;
    const categoryStats: Record<VCACategory, { total: number; correct: number }> = {
      swine: { total: 0, correct: 0 },
      poultry: { total: 0, correct: 0 },
      bovine: { total: 0, correct: 0 },
      companion: { total: 0, correct: 0 },
      equine_zoonosis: { total: 0, correct: 0 },
      diagnostic_basic: { total: 0, correct: 0 }
    };

    questions.forEach((q, idx) => {
      const isCorrect = userAnswers[idx] === q.correctAnswer;
      if (isCorrect) totalScore += 1;
      if (categoryStats[q.category]) {
        categoryStats[q.category].total += 1;
        if (isCorrect) categoryStats[q.category].correct += 1;
      }
    });

    const percent = Math.round((totalScore / questions.length) * 100);
    const isPassed = percent >= 60; // 60% Passing mark

    return {
      totalScore,
      totalQuestions: questions.length,
      percent,
      isPassed,
      categoryStats
    };
  }, [examStage, questions, userAnswers]);

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 font-mono text-sm animate-pulse">
            กำลังตรวจสอบสิทธิ์การเข้าถึงข้อสอบมาตรฐาน ศรว.ส. (VCA CBT)...
          </p>
        </div>
      </div>
    );
  }

  // ── Access Denied Screen (Strict Trial Whitelist) ───────────────────────────
  if (!isAuthorized) {
    return (
      <div className="relative min-h-screen py-16 px-4 flex items-center justify-center">
        <AmbientBioCanvas3D />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-xl w-full bg-slate-900/90 backdrop-blur-2xl border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl overflow-hidden"
        >
          {/* Subtle Red Warning Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-inner">
              <Lock className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <ShieldAlert className="w-3.5 h-3.5" />
                โหมดทดลองเฉพาะผู้ได้รับอนุญาต (Private Access)
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                VCA National Board Simulator
              </h1>
              <p className="text-sm font-thai text-slate-300 leading-relaxed">
                ระบบจำลองการสอบวัดความรู้เพื่อขอรับใบอนุญาตเป็นผู้ประกอบวิชาชีพการสัตวแพทย์ (ศรว.ส.) อยู่ระหว่างช่วงทดสอบเฉพาะผู้ประเมินหลักสูตรและอาจารย์ผู้สอน
              </p>
            </div>

            {/* Current Account HUD */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-left space-y-2">
              <div className="text-xs font-mono text-slate-400 flex items-center justify-between">
                <span>บัญชีปัจจุบันของคุณ:</span>
                <span className="text-rose-400 font-bold">Unauthorized</span>
              </div>
              <div className="font-mono text-sm text-cyan-300 font-bold truncate">
                {currentUserEmail || 'ยังไม่ได้เข้าสู่ระบบ (Guest)'}
              </div>
              <div className="text-[11px] text-slate-400">
                *หากท่านเป็นอาจารย์ผู้ประเมิน กรุณาเข้าสู่ระบบด้วยอีเมลที่ได้รับการอนุมัติ เช่น <code className="text-slate-300">wilasinee.c@msu.ac.th</code> หรือ <code className="text-slate-300">never.away@gmail.com</code>
              </div>
            </div>

            {/* Back Button */}
            <div className="pt-2">
              <Link
                href="/student/play"
                onClick={() => sfx.click()}
                className="inline-flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all shadow-md group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span>กลับสู่ศูนย์รวมด่านจำลอง (Stage Select)</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Authorized View: State Machine (Intro / Active Exam / Results) ──────────
  return (
    <div className="relative min-h-screen text-slate-100 pb-24 pt-4 px-3 sm:px-6 max-w-6xl mx-auto">
      <AmbientBioCanvas3D />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. INTRO SCREEN                                                     */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {examStage === 'intro' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <Link
              href="/student/play"
              onClick={() => sfx.click()}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all text-xs font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่ Play Menu</span>
            </Link>
            <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>สิทธิ์เข้าใช้งาน: {currentUserEmail}</span>
            </div>
          </div>

          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-blue-950/40 to-slate-900/90 border border-cyan-500/30 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                VCA National Board CBT Simulator
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                ระบบจำลองการสอบวัดความรู้ ศรว.ส. สัตวแพทยสภา
              </h1>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-thai">
                ฝึกฝนข้อสอบจริงตามพิมพ์เขียว (Blueprint) มาตรฐานสัตวแพทยสภา: เคสคลินิกสัตว์ป่วย (Clinical Vignettes), การแปลผลตรวจทางห้องปฏิบัติการ, และภาพโมเดลสามมิติเสมือนจริง 25 ข้อ พร้อมการจับเวลาและวิเคราะห์สมรรถนะรายหมวดวิชา
              </p>

              {/* Blueprint Category Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                {Object.values(VCA_CATEGORIES_CONFIG).map(cat => (
                  <div key={cat.key} className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/90 flex flex-col justify-between">
                    <span className="text-[11px] font-bold text-slate-300 truncate">{cat.nameTh}</span>
                    <span className={`text-[10px] font-mono mt-1 ${cat.textColor}`}>
                      {cat.targetCount} ข้อ ({cat.nameEn})
                    </span>
                  </div>
                ))}
              </div>

              {/* Mode Options & Launch Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <button
                  onClick={handleStartExam}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base tracking-wide uppercase transition-all shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] flex items-center justify-center gap-3 active:scale-95"
                >
                  <Award className="w-5 h-5" />
                  <span>เริ่มทำข้อสอบมาตรฐาน (25 ข้อ • 25 นาที)</span>
                </button>

                <label className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 cursor-pointer text-xs font-mono text-slate-300 hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={isUntimed}
                    onChange={(e) => setIsUntimed(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-0"
                  />
                  <span>โหมดฝึกทำแบบไม่จับเวลา (Untimed Practice)</span>
                </label>
              </div>

            </div>
          </div>

          {/* Exam CBT Rules & Tools Guide */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-2">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">มาตรฐานเวลา CBT</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-thai">
                เวลาเฉลี่ย 1 นาทีต่อข้อ (25:00 นาที) ช่วยฝึกการบริหารเวลาและรับมือกับความกดดันในห้องสอบจริง
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Strikethrough className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">เครื่องมือช่วยวิเคราะห์</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-thai">
                ระบบตัดตัวเลือกที่ไม่มั่นใจ (Strikethrough), ปักธงทบทวน (Flag for Review), และตัวช่วยตัด 50:50 สำหรับการเรียนรู้
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 backdrop-blur-md space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Microscope className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">กล้องส่องตัวอย่าง 3D</h3>
              <p className="text-xs text-slate-400 leading-relaxed font-thai">
                เปิดตรวจสอบโครงสร้างอนุภาคไวรัส 3D Capsid หรือสัตว์ป่วย 3D ได้แบบอินเตอร์แอคทีฟระหว่างทำข้อสอบ
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. ACTIVE CBT EXAM INTERFACE                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {examStage === 'active' && currentQ && (
        <div className="space-y-5">
          {/* Top CBT HUD Navigation */}
          <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
            {/* Left: Title & Question Counter */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                VCA
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                  สัตวแพทยสภา • CBT Simulator
                </div>
                <div className="text-base font-black text-white flex items-center gap-2">
                  <span>ข้อที่ {currentIndex + 1} จาก {questions.length}</span>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {Math.round(((Object.keys(userAnswers).length) / questions.length) * 100)}% เสร็จสิ้น
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Countdown Timer */}
            {!isUntimed ? (
              <div className={`px-4 py-2 rounded-2xl border flex items-center gap-2.5 font-mono text-sm font-bold shadow-inner ${
                timeLeft <= 60 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse' 
                  : timeLeft <= 300 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                    : 'bg-slate-950/80 text-cyan-300 border-cyan-500/30'
              }`}>
                <Clock className="w-4 h-4" />
                <span>เวลาคงเหลือ: {formatTime(timeLeft)}</span>
              </div>
            ) : (
              <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-slate-400 font-mono text-xs">
                โหมดไม่จับเวลา (Untimed)
              </div>
            )}

            {/* Right: Quick Action Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleFlag}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
                  flaggedQuestions.has(currentIndex)
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                }`}
                title="ปักธงข้อนี้เพื่อกลับมาทบทวนภายหลัง"
              >
                <Flag className={`w-3.5 h-3.5 ${flaggedQuestions.has(currentIndex) ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{flaggedQuestions.has(currentIndex) ? 'ปักธงแล้ว' : 'ปักธงทบทวน'}</span>
              </button>

              <button
                onClick={() => setShowSubmitConfirmModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs font-mono transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>ส่งข้อสอบ</span>
              </button>
            </div>
          </div>

          {/* Question Palette Grid (1-25) */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2.5 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Question Palette (ผังกระดาษคำตอบ)</span>
              </span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  ตอบแล้ว ({Object.keys(userAnswers).length})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  ปักธง ({flaggedQuestions.size})
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                  ยังไม่ตอบ ({questions.length - Object.keys(userAnswers).length})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-25 gap-1.5">
              {questions.map((_, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = userAnswers[idx] !== undefined;
                const isFlagged = flaggedQuestions.has(idx);

                let btnStyle = "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600";
                if (isCurrent) {
                  btnStyle = "bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-2 ring-cyan-500/40 font-black";
                } else if (isFlagged) {
                  btnStyle = "bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold";
                } else if (isAnswered) {
                  btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      sfx.click();
                      setCurrentIndex(idx);
                    }}
                    className={`relative h-9 rounded-xl border text-xs font-mono transition-all flex items-center justify-center ${btnStyle}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Question Card */}
          <div className="relative rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
            
            {/* Badges Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${VCA_CATEGORIES_CONFIG[currentQ.category].bgColor} ${VCA_CATEGORIES_CONFIG[currentQ.category].borderColor} ${VCA_CATEGORIES_CONFIG[currentQ.category].textColor}`}>
                  {currentQ.categoryLabel}
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {currentQ.species}
                </span>
                <span className="text-xs font-mono text-slate-500 hidden sm:inline">
                  {currentQ.chapterTitle}
                </span>
              </div>

              {/* 3D Specimen Clue & 50:50 Lifeline Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUse5050}
                  disabled={lifelinesRemaining <= 0 || usedLifelines.has(currentIndex)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${
                    usedLifelines.has(currentIndex)
                      ? 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                      : lifelinesRemaining > 0
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/40 hover:bg-purple-500/20 active:scale-95'
                        : 'bg-slate-800/40 text-slate-600 border-slate-800 cursor-not-allowed'
                  }`}
                  title="ตัด 2 ตัวเลือกที่ไม่ถูกต้องออก (เหลือสิทธิ์ 3 ครั้งต่อรอบ)"
                >
                  <Scissors className="w-3.5 h-3.5" />
                  <span>ตัด 50:50 ({lifelinesRemaining})</span>
                </button>

                <button
                  onClick={() => {
                    sfx.click();
                    setShow3DHintModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                >
                  <Microscope className="w-3.5 h-3.5" />
                  <span>ส่องตัวอย่าง 3D</span>
                </button>
              </div>
            </div>

            {/* Case Vignette / Clinical Presentation (if present) */}
            {currentQ.vignette && (
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                <div className="text-xs font-mono font-bold text-amber-400 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>ประวัติและอาการทางคลินิก (Clinical Vignette):</span>
                </div>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-thai whitespace-pre-line">
                  {currentQ.vignette}
                </p>
              </div>
            )}

            {/* Laboratory Diagnostic Results (if present) */}
            {currentQ.laboratoryResults && (
              <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-1.5">
                <div className="text-xs font-mono font-bold text-cyan-300 flex items-center gap-2">
                  <Microscope className="w-4 h-4" />
                  <span>ผลตรวจทางห้องปฏิบัติการ (Laboratory Findings):</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 font-thai leading-relaxed">
                  {currentQ.laboratoryResults}
                </p>
              </div>
            )}

            {/* Main Question Stem */}
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-white leading-relaxed font-thai">
                {currentQ.question}
              </h2>
            </div>

            {/* Choices List (A, B, C, D) */}
            <div className="space-y-3 pt-2">
              {currentQ.choices.map((choice, cIdx) => {
                const choiceLetters = ['A', 'B', 'C', 'D'];
                const letter = choiceLetters[cIdx] || `${cIdx + 1}`;
                const isSelected = userAnswers[currentIndex] === choice;
                const isEliminated = (eliminatedChoices[currentIndex] || new Set()).has(choice);

                return (
                  <div
                    key={cIdx}
                    onClick={() => {
                      if (!isEliminated) {
                        handleSelectChoice(choice);
                      }
                    }}
                    className={`relative p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 group ${
                      isEliminated
                        ? 'opacity-40 bg-slate-950/40 border-slate-900 line-through text-slate-500'
                        : isSelected
                          ? 'bg-cyan-500/15 border-cyan-400/80 text-white shadow-[0_0_20px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/40'
                          : 'bg-slate-950/60 border-slate-800/90 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl font-mono text-xs font-bold flex items-center justify-center shrink-0 border transition-all ${
                        isSelected 
                          ? 'bg-cyan-400 text-slate-950 border-cyan-300 font-black' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 group-hover:border-slate-700'
                      }`}>
                        {letter}
                      </div>
                      <span className={`text-sm sm:text-base font-thai leading-snug break-words ${isSelected ? 'font-bold text-white' : ''}`}>
                        {choice}
                      </span>
                    </div>

                    {/* Strikethrough Elimination Toggle Button */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleElimination(e, choice)}
                      className={`p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors shrink-0 ${
                        isEliminated ? 'text-rose-400 bg-rose-500/10' : ''
                      }`}
                      title={isEliminated ? 'ยกเลิกการขีดฆ่าตัวเลือก' : 'ขีดฆ่าตัวเลือกนี้ (ตัดตัวเลือก)'}
                    >
                      <Strikethrough className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sfx.click();
                    setCurrentIndex(prev => Math.max(0, prev - 1));
                  }}
                  disabled={currentIndex === 0}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>ก่อนหน้า</span>
                </button>

                {userAnswers[currentIndex] && (
                  <button
                    onClick={handleClearAnswer}
                    className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-400 text-xs font-mono transition-colors"
                  >
                    ล้างคำตอบ
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <button
                    onClick={() => {
                      sfx.click();
                      setCurrentIndex(prev => Math.min(questions.length - 1, prev + 1));
                    }}
                    className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <span>ถัดไป</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowSubmitConfirmModal(true)}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>ส่งข้อสอบ (Finish)</span>
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* 3D SPECIMEN & VIRION HINT MODAL                               */}
          {/* ───────────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {show3DHintModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative max-w-2xl w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Microscope className="w-5 h-5 text-cyan-400" />
                      <h3 className="text-base font-bold text-white">
                        ห้องวิเคราะห์ตัวอย่างสามมิติ (3D Clinical Specimen Clue)
                      </h3>
                    </div>
                    <button
                      onClick={() => setShow3DHintModal(false)}
                      className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tab Selector: Virion Capsid vs Host Animal */}
                  <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                    <button
                      onClick={() => setActive3DTab('virion')}
                      className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                        active3DTab === 'virion' 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      โครงสร้างอนุภาคไวรัส 3D (Virion Capsid)
                    </button>
                    <button
                      onClick={() => setActive3DTab('animal')}
                      className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                        active3DTab === 'animal' 
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      สปีชีส์สัตว์ป่วย 3D (Host Specimen)
                    </button>
                  </div>

                  {/* 3D Canvas Container */}
                  <div className="relative h-64 rounded-2xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
                    {active3DTab === 'virion' ? (
                      <VirusViewer3D 
                        type={currentQ.hint3D.virionType} 
                        className="w-full h-full"
                        interactive={true}
                        showScanGrid={true}
                      />
                    ) : (
                      <AnimalHologram3D 
                        speciesGroup={currentQ.hint3D.animalKind} 
                        className="w-full h-full"
                        interactive={true}
                      />
                    )}
                    <div className="absolute bottom-2 right-2 text-[10px] font-mono text-cyan-400/80 bg-slate-900/80 px-2 py-0.5 rounded border border-cyan-500/20 pointer-events-none">
                      หมุน 360° / ซูมเข้า-ออกได้
                    </div>
                  </div>

                  {/* Diagnostic Tip */}
                  <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-thai text-cyan-200">
                    <span className="font-bold text-cyan-300">💡 คำใบ้ทางสัณฐานวิทยา: </span>
                    {currentQ.hint3D.clue}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setShow3DHintModal(false)}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md"
                    >
                      กลับไปทำข้อสอบ
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* SUBMIT CONFIRMATION MODAL                                     */}
          {/* ───────────────────────────────────────────────────────────── */}
          <AnimatePresence>
            {showSubmitConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-xl font-black text-white">
                      ยืนยันส่งกระดาษคำตอบ?
                    </h3>
                    <p className="text-xs text-slate-400 font-thai">
                      ตรวจสอบสถานะข้อสอบก่อนการประเมินคะแนนมาตรฐาน
                    </p>
                  </div>

                  {/* Stats Breakdown */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-slate-900">
                      <div className="text-slate-400">ตอบแล้ว</div>
                      <div className="text-emerald-400 font-bold text-sm mt-0.5">
                        {Object.keys(userAnswers).length}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900">
                      <div className="text-slate-400">ยังไม่ตอบ</div>
                      <div className={`font-bold text-sm mt-0.5 ${
                        questions.length - Object.keys(userAnswers).length > 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}>
                        {questions.length - Object.keys(userAnswers).length}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-900">
                      <div className="text-slate-400">ปักธง</div>
                      <div className="text-amber-400 font-bold text-sm mt-0.5">
                        {flaggedQuestions.size}
                      </div>
                    </div>
                  </div>

                  {questions.length - Object.keys(userAnswers).length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-thai flex items-center gap-2 text-left">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>ท่านยังมีข้อที่ไม่ได้ตอบอีก {questions.length - Object.keys(userAnswers).length} ข้อ หากส่งตอนนี้ข้อเหล่านั้นจะได้ 0 คะแนน</span>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => setShowSubmitConfirmModal(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs font-mono transition-all"
                    >
                      กลับไปทำต่อ
                    </button>
                    <button
                      onClick={handleSubmitExam}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs font-mono transition-all shadow-md active:scale-95"
                    >
                      ยืนยันส่งข้อสอบ
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. POST-EXAM RESULTS & COMPETENCY RADAR DASHBOARD                   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {examStage === 'result' && examResults && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Top Result Banner */}
          <div className={`relative overflow-hidden rounded-3xl p-6 sm:p-10 border shadow-2xl backdrop-blur-xl ${
            examResults.isPassed 
              ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40' 
              : 'bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40'
          }`}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-3 text-center md:text-left">
                <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                  examResults.isPassed 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {examResults.isPassed ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>ผ่านเกณฑ์ประเมินมาตรฐาน ศรว.ส. (PASSED)</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>ยังไม่ผ่านเกณฑ์มาตรฐาน (เกณฑ์ผ่าน 60%)</span>
                    </>
                  )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-white">
                  ผลการสอบจำลองมาตรฐาน ศรว.ส.
                </h1>
                <p className="text-sm text-slate-300 font-thai max-w-xl">
                  {examResults.isPassed 
                    ? 'ยินดีด้วย! ท่านมีความรู้ความเข้าใจในหลักวิชาการสัตวแพทย์และโรคติดเชื้อไวรัสในเกณฑ์ดี พร้อมสำหรับการสอบใบประกอบวิชาชีพ' 
                    : 'แนะนำให้ทบทวนข้อที่ตอบผิดและเจาะลึกหมวดวิชาที่มีคะแนนต่ำกว่าเกณฑ์เพื่อเสริมความมั่นใจในการสอบจริง'}
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-400 pt-1">
                  <span>⏱ เวลาที่ใช้: {formatTime(timeSpentSeconds)}</span>
                  <span>•</span>
                  <span>🎁 EXP ที่ได้รับ: +{awardedExp} EXP</span>
                </div>
              </div>

              {/* Big Score Gauge */}
              <div className="text-center p-6 rounded-3xl bg-slate-950/80 border border-slate-800 shrink-0 w-52 shadow-inner">
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Total Score
                </div>
                <div className="text-5xl font-black text-white my-1">
                  {examResults.percent}%
                </div>
                <div className="text-xs font-mono font-bold text-cyan-400">
                  {examResults.totalScore} / {examResults.totalQuestions} ข้อ
                </div>
                <div className="text-[10px] text-slate-500 mt-2 font-mono">
                  เกณฑ์ผ่านขั้นต่ำ 60% (15 ข้อ)
                </div>
              </div>
            </div>
          </div>

          {/* Competency Breakdown Across 6 Domains */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">
                  การวิเคราะห์สมรรถนะรายหมวดวิชา (Competency Breakdown)
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Thai Veterinary Council Blueprint
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(examResults.categoryStats).map(([catKey, stat]) => {
                const meta = VCA_CATEGORIES_CONFIG[catKey as VCACategory];
                const catPercent = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
                const isCatPassed = catPercent >= 60;

                return (
                  <div key={catKey} className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-white">{meta.nameTh}</h4>
                        <div className="text-[11px] font-mono text-slate-400">{meta.nameEn}</div>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                        isCatPassed ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                      }`}>
                        {catPercent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isCatPassed ? 'bg-emerald-400' : 'bg-rose-400'}`}
                        style={{ width: `${catPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>คะแนน: {stat.correct} / {stat.total} ข้อ</span>
                      <span className={isCatPassed ? 'text-emerald-400' : 'text-rose-400'}>
                        {isCatPassed ? 'ผ่านเกณฑ์' : 'ควรทบทวน'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">
                  เฉลยละเอียดและคำอธิบายทางสัตวแพทย์ (Item Review)
                </h2>
              </div>

              {/* Filter Tabs */}
              <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reviewFilter === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ทั้งหมด ({questions.length})
                </button>
                <button
                  onClick={() => setReviewFilter('wrong')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reviewFilter === 'wrong' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  เฉพาะที่ผิด ({questions.length - examResults.totalScore})
                </button>
                <button
                  onClick={() => setReviewFilter('flagged')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    reviewFilter === 'flagged' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ที่ปักธงไว้ ({flaggedQuestions.size})
                </button>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const isCorrect = userAnswers[idx] === q.correctAnswer;
                const isFlagged = flaggedQuestions.has(idx);

                if (reviewFilter === 'wrong' && isCorrect) return null;
                if (reviewFilter === 'flagged' && !isFlagged) return null;

                return (
                  <div
                    key={q.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      isCorrect 
                        ? 'bg-slate-950/60 border-slate-800' 
                        : 'bg-rose-950/15 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`w-7 h-7 rounded-xl font-mono text-xs font-black flex items-center justify-center ${
                          isCorrect ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
                          {q.categoryLabel}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {q.species}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isFlagged && (
                          <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Flag className="w-3 h-3 fill-amber-400" />
                            ปักธง
                          </span>
                        )}
                        <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                          isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {isCorrect ? 'ถูกต้อง (+10 EXP)' : 'ตอบผิด (0 คะแนน)'}
                        </span>
                      </div>
                    </div>

                    {/* Vignette & Question */}
                    {q.vignette && (
                      <p className="text-xs text-slate-400 font-thai bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                        {q.vignette}
                      </p>
                    )}

                    <h4 className="text-sm sm:text-base font-bold text-white font-thai">
                      {q.question}
                    </h4>

                    {/* Answers Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-thai pt-1">
                      <div className={`p-3 rounded-xl border ${
                        isCorrect 
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' 
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                      }`}>
                        <div className="font-mono font-bold text-[10px] uppercase text-slate-400 mb-1">
                          คำตอบของคุณ:
                        </div>
                        <div>{userAnswers[idx] || 'ไม่ได้เลือกคำตอบ (Unanswered)'}</div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                        <div className="font-mono font-bold text-[10px] uppercase text-emerald-400 mb-1">
                          คำตอบที่ถูกต้อง:
                        </div>
                        <div className="font-bold text-emerald-300">{q.correctAnswer}</div>
                      </div>
                    </div>

                    {/* Official Rationale & Clinical Pearl */}
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800/90 space-y-2 text-xs font-thai leading-relaxed">
                      <div className="font-bold text-cyan-300 flex items-center gap-1.5 font-mono">
                        <FileText className="w-3.5 h-3.5" />
                        <span>คำอธิบายทางสัตวแพทย์ (Official Rationale):</span>
                      </div>
                      <p className="text-slate-300">{q.explanation}</p>
                      {q.highYieldPearl && (
                        <div className="pt-1.5 border-t border-slate-800 text-amber-300/90 font-medium">
                          ⭐ {q.highYieldPearl}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleStartExam}
              className="px-8 py-3.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm font-mono flex items-center gap-2 transition-all shadow-lg active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ทำข้อสอบชุดใหม่ (New 25-Question Exam)</span>
            </button>

            <Link
              href="/student/play"
              onClick={() => sfx.click()}
              className="px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm font-mono flex items-center gap-2 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับสู่ศูนย์รวมด่านจำลอง</span>
            </Link>
          </div>

        </motion.div>
      )}

    </div>
  );
}
