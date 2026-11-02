"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  ScanSearch, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  SlidersHorizontal,
  ChevronRight,
  LogOut,
  Flame,
  Award,
  Zap,
  Box,
  Eye,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { awardDailyCappedExp, getDailyExpInfo, DailyExpInfo } from '@/lib/dailyExpCap';
import { ALL_15_CHAPTER_QUESTIONS } from '@/data/veterinaryVirologyContent';

// High-fidelity 3D WebGL Model Viewer with touch & mouse orbit controls
const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-cyan-400 font-mono text-xs gap-2">
      <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span>กำลังเรนเดอร์โมเดล 3D...</span>
    </div>
  )
});

// Viral Morphology & Taxonomic mapping for 3D Holographic Chamber
const VIRUS_MORPHOLOGY_MAP: Record<string, { label: string; envelope: string; symmetry: string; color: string }> = {
  rabies: { label: 'Rhabdoviridae', envelope: 'Enveloped (+)', symmetry: 'Bullet-shaped (Bacilliform)', color: '#f59e0b' },
  parvo: { label: 'Parvoviridae', envelope: 'Non-Enveloped (-)', symmetry: 'Icosahedral (T=1)', color: '#06b6d4' },
  corona: { label: 'Coronaviridae', envelope: 'Enveloped (+)', symmetry: 'Spherical + S Peplomers', color: '#10b981' },
  retro: { label: 'Retroviridae', envelope: 'Enveloped (+)', symmetry: 'Spherical + Tubular Core', color: '#ec4899' },
  paramyxo: { label: 'Paramyxoviridae', envelope: 'Enveloped (+)', symmetry: 'Pleomorphic Herringbone', color: '#8b5cf6' },
  arterivirus: { label: 'Arteriviridae', envelope: 'Enveloped (+)', symmetry: 'Small Spherical Envelope', color: '#3b82f6' },
  picorna: { label: 'Picornaviridae', envelope: 'Non-Enveloped (-)', symmetry: 'Small Icosahedral (T=3)', color: '#14b8a6' },
  asfar: { label: 'Asfarviridae', envelope: 'Complex Envelope (+)', symmetry: 'Large Icosahedral / Core', color: '#ef4444' },
  flavi: { label: 'Flaviviridae', envelope: 'Enveloped (+)', symmetry: 'Spherical Smooth Lattice', color: '#eab308' },
  orthomyxo: { label: 'Orthomyxoviridae', envelope: 'Enveloped (+)', symmetry: 'Pleomorphic + HA/NA Spikes', color: '#f97316' },
  birna: { label: 'Birnaviridae', envelope: 'Non-Enveloped (-)', symmetry: 'Icosahedral dsRNA', color: '#6366f1' },
  herpes: { label: 'Herpesviridae', envelope: 'Enveloped (+ Tegument)', symmetry: 'Icosahedral Core', color: '#a855f7' },
  reo: { label: 'Reoviridae', envelope: 'Non-Enveloped (-)', symmetry: 'Wheel-like (Double Capsid)', color: '#0ea5e9' },
  default: { label: 'Virion Specimen', envelope: 'Viral Morphology', symmetry: 'Standard Morphology', color: '#06b6d4' }
};

const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const formatAndShuffleQuestions = (rawQuestions: any[], limitCount: number = 15) => {
  const formatted = rawQuestions.map(q => ({
    id: q.id,
    chapter: q.chapter,
    chapterTitle: q.chapterTitle,
    question: q.q || q.question,
    choices: shuffle(q.choices || []),
    answer: q.answer,
    explanation: q.explanation,
    virusType: familyToVirusType(q.virusType || q.virusName || '')
  }));
  return shuffle(formatted).slice(0, limitCount);
};

export default function IdentificationGame() {
  const { appUser } = useAuth();

  // Round sizing options: 5 (Quick), 10 (Standard), 15 (Full Cap 150 EXP)
  const [roundSize, setRoundSize] = useState<number>(15);
  const [questions, setQuestions] = useState<any[]>(() => formatAndShuffleQuestions(ALL_15_CHAPTER_QUESTIONS, 15));

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [dailyInfo, setDailyInfo] = useState<DailyExpInfo | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [justReachedCap, setJustReachedCap] = useState(false);
  const [hasAutoAdjustedForCap, setHasAutoAdjustedForCap] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');

  useLiveTracking(
    'identification', 
    gameOver 
      ? `วิเคราะห์เสร็จสิ้น | คะแนน: ${score}` 
      : `ข้อที่: ${currentQ + 1}/${questions.length} | คะแนน: ${score}`
  );

  // Load Daily EXP info and intelligently adjust question count if full
  useEffect(() => {
    if (!appUser) return;
    getDailyExpInfo(appUser.uid, 'identification').then(info => {
      setDailyInfo(info);

      // If user has already capped out their daily 150 EXP, auto-reduce round size
      // so they don't have to answer 150 questions in practice mode
      if (!hasAutoAdjustedForCap) {
        setHasAutoAdjustedForCap(true);
        if (info.isCapped || info.remainingToday <= 0) {
          // EXP เต็มแล้ว -> ปรับลดข้อสอบเหลือ 5 ข้อ (ฝึกซ้อมด่วน)
          setRoundSize(5);
          setQuestions(formatAndShuffleQuestions(ALL_15_CHAPTER_QUESTIONS, 5));
        } else if (info.remainingToday <= 50) {
          // เหลือโควตาเล็กน้อย (≤50 EXP) -> ปรับเหลือ 5-10 ข้อ
          const target = Math.max(5, Math.ceil(info.remainingToday / 10));
          setRoundSize(target);
          setQuestions(formatAndShuffleQuestions(ALL_15_CHAPTER_QUESTIONS, target));
        } else if (info.remainingToday <= 100) {
          setRoundSize(10);
          setQuestions(formatAndShuffleQuestions(ALL_15_CHAPTER_QUESTIONS, 10));
        }
      }
    });
  }, [appUser, hasAutoAdjustedForCap]);

  // Handle changing round size manually (before answering or restarting)
  const handleChangeRoundSize = (newSize: number) => {
    if (selectedAnswer !== null && currentQ > 0) return; // Prevent changing in the middle of answering
    setRoundSize(newSize);
    setCurrentQ(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setCorrectCount(0);
    setEarnedExp(0);
    setJustReachedCap(false);
    setQuestions(formatAndShuffleQuestions(ALL_15_CHAPTER_QUESTIONS, newSize));
  };

  const handleRestart = () => {
    setCurrentQ(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setCorrectCount(0);
    setEarnedExp(0);
    setGameOver(false);
    setJustReachedCap(false);
    setQuestions(formatAndShuffleQuestions(ALL_15_CHAPTER_QUESTIONS, roundSize));
  };

  const question = questions[currentQ] || questions[0];

  const handleAnswer = async (choice: string) => {
    if (selectedAnswer !== null || !question) return;

    setSelectedAnswer(choice);
    const correct = choice === question.answer;
    setIsCorrect(correct);

    if (correct) {
      sfx.correct();
      setScore(prev => prev + 10);
      setCorrectCount(prev => prev + 1);

      if (appUser) {
        awardDailyCappedExp(
          appUser.uid, 
          'identification', 
          `Virus Identification: ${question.question.slice(0, 30)}`, 
          10, 
          10
        ).then(res => {
          setEarnedExp(prev => prev + res.awardedExp);
          
          if (res.isCapped && (!dailyInfo || !dailyInfo.isCapped)) {
            setJustReachedCap(true);
          }

          setDailyInfo(prev => prev ? {
            ...prev,
            earnedToday: prev.earnedToday + res.awardedExp,
            remainingToday: res.remainingCap,
            isCapped: res.isCapped,
          } : null);
        }).catch(console.error);
      }
    } else {
      sfx.wrong();
    }
  };

  const nextQuestion = () => {
    sfx.click();
    if (currentQ < questions.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
    } else {
      setGameOver(true);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // GAME OVER / SUMMARY SCREEN
  // ─────────────────────────────────────────────────────────────────────────────
  if (gameOver) {
    const accuracy = questions.length > 0 ? Math.round((correctCount / (currentQ + 1)) * 100) : 0;
    const isPractice = earnedExp === 0 && score > 0;

    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-16 px-4">
        <motion.div 
          initial={{ scale: 0, rotate: -20 }} 
          animate={{ scale: 1, rotate: 0 }} 
          className="w-28 h-28 mx-auto bg-primary/20 text-primary border-2 border-primary/50 rounded-3xl flex items-center justify-center shadow-[0_0_35px_rgba(59,130,246,0.35)]"
        >
          <Trophy className="w-14 h-14" />
        </motion.div>

        <div className="space-y-1">
          <span className="text-xs font-mono font-bold tracking-widest uppercase px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            Session Completed
          </span>
          <h1 className="text-3xl md:text-4xl font-black text-white text-glow mt-2">
            วิเคราะห์ตัวอย่างไวรัสเสร็จสิ้น!
          </h1>
        </div>

        {/* Score & EXP Summary Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4 max-w-lg mx-auto shadow-xl">
          <div className="grid grid-cols-3 gap-3 divide-x divide-slate-800">
            <div>
              <div className="text-[11px] font-mono text-slate-400">ตอบถูก</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {correctCount} <span className="text-xs text-slate-500">/ {currentQ + 1}</span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400">ความแม่นยำ</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{accuracy}%</div>
            </div>
            <div>
              <div className="text-[11px] font-mono text-slate-400">คะแนนรอบนี้</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{score}</div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            {earnedExp > 0 ? (
              <div className="space-y-1">
                <div className="text-sm text-slate-300 font-mono flex items-center justify-center gap-1.5">
                  <span>ได้รับโบนัส EXP:</span>
                  <span className="text-xl font-black text-primary text-glow">+{earnedExp} EXP</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  โควตารวมวันนี้: {dailyInfo?.earnedToday || earnedExp} / {dailyInfo?.cap || 150} EXP
                  {dailyInfo?.isCapped && (
                    <span className="text-emerald-400 font-bold ml-1.5">(ครบโควตาสูงสุดแล้ว!)</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-xs text-slate-300">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  โหมดฝึกซ้อม (Practice Mode)
                </div>
                <p className="text-slate-400 pt-1">
                  คุณได้รับ EXP โหมดวิเคราะห์ไวรัสครบโควตาวันนี้แล้ว (150/150 EXP) แต่ยังสามารถเล่นทบทวนความรู้ได้ไม่จำกัด
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4 max-w-md mx-auto">
          <Button 
            onClick={handleRestart} 
            size="lg" 
            className="font-bold flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/25"
          >
            <RotateCcw className="w-4 h-4 mr-2" /> เล่นรอบใหม่ (สุ่มชุดใหม่)
          </Button>
          <Link href="/student/play" className="flex-1">
            <Button variant="secondary" size="lg" className="font-bold w-full">
              กลับสู่ศูนย์รวมมินิเกม
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // MAIN GAME INTERACTION
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 pt-4 px-2">
      
      {/* 1. Header Navigation & Round Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        
        {/* Left: Back & Title */}
        <div className="flex items-center gap-3">
          <Link href="/student/play" onClick={() => sfx.click()}>
            <Button variant="ghost" size="icon" className="rounded-2xl hover:bg-slate-800 text-slate-300">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-bold">
                Clinical Diagnostic Drill
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                วิเคราะห์โครงสร้าง & พยาธิกำเนิด
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white mt-0.5 flex items-center gap-2">
              <ScanSearch className="w-5 h-5 text-cyan-400" />
              <span>ระบบวิเคราะห์ตัวอย่างไวรัส</span>
            </h1>
          </div>
        </div>

        {/* Right: Round Size Selector & Early Exit */}
        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          
          {/* Quick Round Size Pills (if user hasn't answered yet) */}
          {currentQ === 0 && selectedAnswer === null && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-mono">
              <span className="text-slate-500 text-[10px] px-2 uppercase font-bold">ชุดคำถาม:</span>
              {[5, 10, 15].map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleChangeRoundSize(size)}
                  className={`px-2.5 py-1 rounded-lg transition-all font-bold ${
                    roundSize === size
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title={`${size} ข้อต่อรอบ`}
                >
                  {size} ข้อ
                </button>
              ))}
            </div>
          )}

          {/* Early Exit / End Session Button (If at least 1 question is touched) */}
          {currentQ > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                sfx.click();
                setGameOver(true);
              }}
              className="text-xs font-mono border-slate-700 hover:bg-slate-800 text-slate-300"
              title="สรุปผลคะแนนและออกจากรอบนี้ทันที"
            >
              <LogOut className="w-3.5 h-3.5 mr-1 text-amber-400" /> สรุปและจบเกม
            </Button>
          )}

          <div className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-right">
            <span className="text-[10px] font-mono text-slate-500 block leading-tight">คะแนน</span>
            <span className="text-base font-black text-amber-300 font-mono">{score}</span>
          </div>
        </div>
      </div>

      {/* 2. Quota & Status Pill Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-xs font-mono">
        <div className="flex items-center gap-2">
          {dailyInfo?.isCapped ? (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>โควตา EXP วันนี้เต็มแล้ว (150/150) • ปรับลดเหลือ {questions.length} ข้อในโหมดฝึกซ้อม</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>โควตารายวัน: <strong>{dailyInfo?.earnedToday || 0}/150 EXP</strong> (รับได้อีก +{dailyInfo?.remainingToday ?? 150} EXP)</span>
            </span>
          )}
        </div>

        <div className="text-slate-400 text-xs">
          ข้อที่ <strong className="text-white text-sm">{currentQ + 1}</strong> จาก {questions.length} ข้อ
        </div>
      </div>

      {/* 3. Progress Bar */}
      <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden shadow-inner">
        <motion.div 
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Cap Reached Mid-Game Notification Banner */}
      <AnimatePresence>
        {justReachedCap && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/50 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">
                  🎉 ยินดีด้วย! คุณได้รับ EXP ครบเพดานโควตาวันนี้แล้ว (150/150 EXP)
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  คุณสามารถกด "สรุปผลและจบเกม" เพื่อบันทึกคะแนน หรือทำข้อที่เหลือต่อในโหมดฝึกซ้อมได้ตามต้องการ
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => {
                sfx.click();
                setGameOver(true);
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shrink-0 text-xs uppercase"
            >
              สรุปผลและจบเกม
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Question & Interactive Scanner Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-5 md:p-8 glass-neon shadow-2xl relative overflow-hidden border-slate-800 rounded-3xl">
            <div className="scanlines" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              
              {/* 3D Hologram & TEM Specimen Isolation Chamber */}
              {(() => {
                const morphInfo = VIRUS_MORPHOLOGY_MAP[question?.virusType] || VIRUS_MORPHOLOGY_MAP.default;
                return (
                  <div className="w-full md:w-[320px] shrink-0 flex flex-col items-center bg-slate-950/95 rounded-3xl border border-cyan-500/40 relative group shadow-2xl p-4 overflow-hidden">
                    {/* Sci-Fi Corner Accents */}
                    <div className="absolute top-2.5 left-2.5 w-4 h-4 border-t-2 border-l-2 border-cyan-400/80" />
                    <div className="absolute top-2.5 right-2.5 w-4 h-4 border-t-2 border-r-2 border-cyan-400/80" />
                    <div className="absolute bottom-2.5 left-2.5 w-4 h-4 border-b-2 border-l-2 border-cyan-400/80" />
                    <div className="absolute bottom-2.5 right-2.5 w-4 h-4 border-b-2 border-r-2 border-cyan-400/80" />

                    {/* Sweeping Laser Scanning Animation */}
                    <motion.div 
                      className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.9)] z-20 pointer-events-none"
                      animate={{ top: ['12%', '88%', '12%'] }}
                      transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Viewport Control Bar */}
                    <div className="w-full flex items-center justify-between pb-2 border-b border-slate-800/80 z-20 text-[10px] font-mono">
                      <span className="text-cyan-400 font-bold flex items-center gap-1.5 uppercase">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                        <span>{morphInfo.label}</span>
                      </span>

                      {/* 3D vs 2D Mode Switch */}
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/60 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            sfx.click();
                            setViewMode('3d');
                          }}
                          className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                            viewMode === '3d'
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="ดูแบบจำลอง 3D หมุน 360 องศา"
                        >
                          <Box className="w-3 h-3" />
                          <span>3D</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            sfx.click();
                            setViewMode('2d');
                          }}
                          className={`px-2 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                            viewMode === '2d'
                              ? 'bg-cyan-500 text-slate-950 shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="ดูภาพสแกนกล้องจุลทรรศน์อิเล็กตรอน (TEM)"
                        >
                          <Eye className="w-3 h-3" />
                          <span>2D TEM</span>
                        </button>
                      </div>
                    </div>

                    {/* Specimen Viewport Stage */}
                    <div className="w-full h-64 my-2 relative flex items-center justify-center">
                      {viewMode === '3d' ? (
                        <VirusViewer3D 
                          type={question.virusType as any} 
                          color={morphInfo.color}
                          interactive={true} 
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-36 h-36 flex flex-col items-center justify-center filter drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]">
                          <SVGVirus type={question.virusType as any} className="w-full h-full text-cyan-400" />
                          <span className="text-[9px] font-mono text-slate-500 mt-1">TEM NEGATIVE STAIN</span>
                        </div>
                      )}
                    </div>

                    {/* Specimen Taxonomy HUD Footer */}
                    <div className="w-full pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono z-20">
                      <span className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-800">
                        {morphInfo.envelope}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
                        {morphInfo.symmetry}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Question Text & Choice Buttons */}
              <div className="flex-1 w-full space-y-5">
                
                {question.chapter && (
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      บทที่ {question.chapter}
                    </span>
                    <span className="text-xs font-mono text-slate-400 truncate max-w-sm">
                      {question.chapterTitle}
                    </span>
                  </div>
                )}

                <h2 className="text-lg md:text-xl font-bold text-white leading-relaxed">
                  {question.question}
                </h2>

                {/* Choices 2x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {question.choices.map((choice: string, idx: number) => {
                    const isSelected = selectedAnswer === choice;
                    const isWinner = choice === question.answer;
                    
                    let btnStyle = "bg-slate-900/90 border-slate-800 text-slate-200 hover:border-cyan-500/50 hover:bg-slate-850 hover:text-white";
                    
                    if (selectedAnswer) {
                      if (isWinner) {
                        btnStyle = "bg-emerald-500/20 text-emerald-200 border-emerald-500/70 shadow-[0_0_15px_rgba(16,185,129,0.25)] font-bold";
                      } else if (isSelected && !isWinner) {
                        btnStyle = "bg-red-500/20 text-red-200 border-red-500/70 shadow-[0_0_15px_rgba(239,68,68,0.25)] line-through";
                      } else {
                        btnStyle = "opacity-35 border-slate-850 text-slate-500";
                      }
                    }

                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={selectedAnswer !== null}
                        onClick={() => handleAnswer(choice)}
                        className={`p-3.5 rounded-2xl border-2 text-left text-xs sm:text-sm font-sans transition-all duration-200 flex items-center gap-3 ${btnStyle}`}
                      >
                        <span className="w-6 h-6 rounded-xl bg-slate-950 border border-current/40 flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-snug">{choice}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Answer Feedback & Explanation Box */}
                {selectedAnswer && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-1.5 ${
                      isCorrect 
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                        : 'bg-red-950/40 border-red-500/40 text-red-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          <span className="text-white font-mono uppercase tracking-wide">
                            ถูกต้อง! {dailyInfo?.isCapped ? '(โหมดฝึกซ้อม)' : '+10 EXP'}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                          <span className="text-white font-mono uppercase tracking-wide">
                            ยังไม่ถูกต้อง
                          </span>
                        </>
                      )}
                    </div>
                    {question.explanation && (
                      <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1 pl-7">
                        <strong className="text-cyan-400 font-mono">คำอธิบาย:</strong> {question.explanation}
                      </p>
                    )}
                  </motion.div>
                )}

                {/* Next / Finish Button */}
                {selectedAnswer && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <span className="text-xs font-mono text-slate-500">
                      {currentQ + 1 < questions.length 
                        ? `เหลืออีก ${questions.length - (currentQ + 1)} ข้อในรอบนี้`
                        : 'ข้อสุดท้ายของรอบนี้'
                      }
                    </span>

                    <Button 
                      size="lg" 
                      onClick={nextQuestion} 
                      className="font-black text-xs sm:text-sm uppercase tracking-wider bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20 active:scale-95"
                    >
                      <span>{currentQ < questions.length - 1 ? 'วิเคราะห์เคสถัดไป' : 'สรุปผลการวิเคราะห์'}</span>
                      <ChevronRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </div>
                )}

              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

    </div>
  );
}
