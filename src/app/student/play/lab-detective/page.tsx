"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Microscope, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Activity, 
  AlertTriangle, 
  Fingerprint,
  Box,
  Eye,
  Layers,
  Sparkles,
  Dna
} from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { awardDailyCappedExp, getDailyExpInfo, DailyExpInfo } from '@/lib/dailyExpCap';
import { familyToVirusType, SVGVirus } from '@/components/ui/SVGVirus';
import { ALL_15_LAB_CASES } from '@/data/veterinaryVirologyContent';

// Dynamic 3D Specimen & Host Viewers
const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-purple-400 font-mono text-xs gap-2">
      <div className="w-7 h-7 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] tracking-widest uppercase">LOADING 3D VIRION...</span>
    </div>
  )
});

const AnimalHologram3D = dynamic(() => import('@/components/ui/AnimalHologram3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-cyan-400 font-mono text-xs gap-2">
      <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] tracking-widest uppercase">LOADING 3D PATIENT...</span>
    </div>
  )
});

const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const formatAndShuffleCases = (rawCases: any[]) => {
  return rawCases.map(c => ({
    ...c,
    choices: shuffle(c.choices || [])
  }));
};

const DEFAULT_CASES = formatAndShuffleCases(ALL_15_LAB_CASES);

export default function LabDetective() {
  const { appUser } = useAuth();
  const [cases, setCases] = useState<any[]>(DEFAULT_CASES);

  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [earnedExp, setEarnedExp] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [dailyInfo, setDailyInfo] = useState<DailyExpInfo | null>(null);
  const [labViewMode, setLabViewMode] = useState<'virus3d' | 'animal3d' | 'tem'>('virus3d');

  useLiveTracking('lab-detective', `เคสที่: ${currentCaseIndex + 1} | EXP: ${earnedExp}`);

  useEffect(() => {
    if (appUser) {
      getDailyExpInfo(appUser.uid, 'lab-detective').then(setDailyInfo);
    }
  }, [appUser]);

  // Cases are pre-bundled from ALL_15_LAB_CASES (0ms delay, 0 Firestore reads)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const cached = sessionStorage.getItem('virusgo_lab_detective_cases');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCases(formatAndShuffleCases(parsed));
        }
      } catch (_) {}
    }
  }, []);

  const currentCase = cases[currentCaseIndex];

  const handleAnswer = async (choice: string) => {
    if (selectedAnswer) return; // Prevent multiple clicks

    setSelectedAnswer(choice);
    const correct = choice === currentCase.answer;
    setIsCorrect(correct);
    setShowExplanation(true);

    if (correct) {
      sfx.correct();
      if (appUser) {
        try {
          const res = await awardDailyCappedExp(appUser.uid, 'lab-detective', 'Lab Detective: ' + currentCase.title, 50, 50);
          setEarnedExp(prev => prev + res.awardedExp);
          setDailyInfo(prev => prev ? {
            ...prev,
            earnedToday: prev.earnedToday + res.awardedExp,
            remainingToday: res.remainingCap,
            isCapped: res.isCapped,
          } : null);
        } catch (error) {
          console.error("Failed to update EXP:", error);
        }
      }
    } else {
      sfx.wrong();
    }
  };

  const handleNext = () => {
    if (currentCaseIndex < cases.length - 1) {
      setCurrentCaseIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setShowExplanation(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 pt-4 px-2">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/student/play" onClick={() => sfx.click()}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest text-glow uppercase flex items-center gap-3">
              <Microscope className="w-8 h-8 text-purple-400" />
              นักสืบห้องแล็บ
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-purple-400 font-mono text-sm uppercase tracking-widest">
                Lab Detective • Case {currentCaseIndex + 1}/{cases.length}
              </p>
              {cases.length > 1 && (
                <select
                  value={currentCaseIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setCurrentCaseIndex(idx);
                    setSelectedAnswer(null);
                    setIsCorrect(null);
                    setShowExplanation(false);
                  }}
                  className="bg-slate-900 border border-purple-500/30 text-purple-300 text-xs rounded-lg px-2 py-1 outline-none focus:border-purple-400"
                >
                  {cases.map((c, i) => (
                    <option key={`${c.id || 'case'}-${i}`} value={i} className="bg-slate-900 text-white">
                      เคสที่ {i + 1}: {c.title.replace(/เคสที่ \d+:\s*/, '').slice(0, 32)}...
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          {dailyInfo && (
            <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              {dailyInfo.isCapped ? 'โหมดฝึกซ้อม (โควตาเต็ม)' : `โควตาวันนี้: ${dailyInfo.earnedToday}/${dailyInfo.cap} EXP`}
            </span>
          )}
          <div className="glass px-6 py-2 rounded-full border-purple-500/30 flex items-center gap-3">
            <div className="text-slate-400 font-mono text-sm uppercase">Earned EXP:</div>
            <div className="text-purple-400 font-black text-xl text-glow">+{earnedExp}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Case File */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="glass border-purple-500/30 p-0 overflow-hidden relative">
            <div className="bg-purple-900/40 p-4 border-b border-purple-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-purple-300 font-mono text-sm font-bold uppercase tracking-widest">
                <FileText className="w-4 h-4" />
                Confidential Case File
              </div>
              <div className="text-xs text-slate-500 font-mono border border-slate-700 px-2 py-1 rounded bg-black/50">
                CLASSIFIED
              </div>
            </div>
            
            <div className="p-6 md:p-8 space-y-8">
              <div>
                <h2 className="text-3xl font-black text-white mb-2">{currentCase.title}</h2>
                <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-sm font-bold border border-slate-700">
                  <Fingerprint className="w-4 h-4 text-purple-400" />
                  สปีชีส์: {currentCase.species}
                </div>
              </div>

              {/* 3D Virtual Virology Specimen & Patient Chamber */}
              {(() => {
                const virusType = familyToVirusType(currentCase.answer || currentCase.title);
                return (
                  <div className="w-full bg-slate-950/95 rounded-2xl border border-purple-500/40 relative shadow-2xl p-4 overflow-hidden">
                    {/* Corner Reticles */}
                    <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5 border-t-2 border-l-2 border-purple-400/80" />
                    <div className="absolute top-2.5 right-2.5 w-3.5 h-3.5 border-t-2 border-r-2 border-purple-400/80" />
                    <div className="absolute bottom-2.5 left-2.5 w-3.5 h-3.5 border-b-2 border-l-2 border-purple-400/80" />
                    <div className="absolute bottom-2.5 right-2.5 w-3.5 h-3.5 border-b-2 border-r-2 border-purple-400/80" />

                    {/* Sweeping Laser Scan Line */}
                    <motion.div 
                      className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-purple-500 via-cyan-400 to-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.9)] z-20 pointer-events-none"
                      animate={{ top: ['8%', '92%', '8%'] }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                    />

                    {/* Mode Switcher Bar */}
                    <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80 z-20 text-[10px] font-mono">
                      <div className="flex items-center gap-1.5 text-purple-300 font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping inline-block" />
                        <span>LAB SPECIMEN #{currentCaseIndex + 1}</span>
                      </div>

                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/60 p-0.5 rounded-lg">
                        <button
                          type="button"
                          onClick={() => {
                            sfx.click();
                            setLabViewMode('virus3d');
                          }}
                          className={`px-2.5 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                            labViewMode === 'virus3d'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="ดูแบบจำลอง 3D ไวรัสเป้าหมาย"
                        >
                          <Box className="w-3 h-3" />
                          <span>ไวรัส 3D</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sfx.click();
                            setLabViewMode('animal3d');
                          }}
                          className={`px-2.5 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                            labViewMode === 'animal3d'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="ดูโฮโลแกรม 3D สัตว์ป่วยและระบบเป้าหมาย"
                        >
                          <Activity className="w-3 h-3" />
                          <span>สัตว์ป่วย 3D</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            sfx.click();
                            setLabViewMode('tem');
                          }}
                          className={`px-2.5 py-0.5 rounded font-bold transition-all flex items-center gap-1 ${
                            labViewMode === 'tem'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'text-slate-400 hover:text-white'
                          }`}
                          title="ดูภาพสแกนกล้องจุลทรรศน์อิเล็กตรอน (TEM)"
                        >
                          <Eye className="w-3 h-3" />
                          <span>2D TEM</span>
                        </button>
                      </div>
                    </div>

                    {/* Viewport Stage */}
                    <div className="w-full h-56 sm:h-64 my-2 relative flex items-center justify-center">
                      {labViewMode === 'virus3d' ? (
                        <VirusViewer3D 
                          type={virusType} 
                          color="#a855f7" 
                          interactive={true} 
                          className="w-full h-full"
                        />
                      ) : labViewMode === 'animal3d' ? (
                        <AnimalHologram3D 
                          speciesGroup={currentCase.species}
                          animalType={currentCase.species}
                          caseId={currentCase.id}
                          farmHp={isCorrect === false ? 35 : 80}
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="w-36 h-36 flex flex-col items-center justify-center filter drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                          <SVGVirus type={virusType} className="w-full h-full text-purple-400" />
                          <span className="text-[9px] font-mono text-purple-300 mt-1">TEM NEGATIVE CONTRAST</span>
                        </div>
                      )}
                    </div>

                    {/* Specimen Telemetry Footer */}
                    <div className="w-full pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono z-20">
                      <span className="text-slate-400 flex items-center gap-1">
                        <span>สถานะ:</span>
                        <strong className={isCorrect === true ? 'text-emerald-400' : isCorrect === false ? 'text-rose-400' : 'text-purple-300'}>
                          {isCorrect === true ? 'ยืนยันเชื้อแล้ว (CONFIRMED)' : isCorrect === false ? 'วินิจฉัยผิดพลาด (MISIDENTIFIED)' : 'กำลังตรวจสอบ (UNDER INVESTIGATION)'}
                        </strong>
                      </span>
                      <span className="text-purple-300 bg-purple-950/60 px-2.5 py-0.5 rounded border border-purple-800/40 font-bold">
                        {currentCase.species}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-sm border-b border-purple-500/20 pb-2">
                  <AlertTriangle className="w-4 h-4" /> ประวัติการป่วย (History)
                </div>
                <p className="text-slate-200 leading-relaxed pl-6 border-l-2 border-slate-800">
                  {currentCase.history}
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-sm border-b border-purple-500/20 pb-2">
                  <Activity className="w-4 h-4" /> อาการทางคลินิก (Clinical Signs)
                </div>
                <ul className="list-disc list-inside text-slate-200 leading-relaxed pl-6 space-y-1 border-l-2 border-slate-800">
                  {currentCase.symptoms.map((sym: string, i: number) => (
                    <li key={i}>{sym}</li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3 bg-blue-900/10 p-4 rounded-xl border border-blue-500/20">
                <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-sm">
                  <Microscope className="w-4 h-4" /> ผลตรวจทางห้องปฏิบัติการ (Lab Results)
                </div>
                <p className="text-slate-200 leading-relaxed font-mono text-sm">
                  {currentCase.laboratoryResults}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Choices & Result */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass border-purple-500/30 p-6 space-y-6">
            <h3 className="text-lg font-black text-white uppercase tracking-widest text-center border-b border-slate-800 pb-4">
              Diagnostic Options
            </h3>
            
            <div className="space-y-3">
              {currentCase.choices.map((choice: string, idx: number) => {
                const isSelected = selectedAnswer === choice;
                const isCorrectChoice = choice === currentCase.answer;
                
                let btnStyle = "border-slate-700 bg-slate-900/50 hover:border-purple-500/50 hover:bg-purple-900/20 text-slate-200";
                
                if (showExplanation) {
                  if (isCorrectChoice) {
                    btnStyle = "border-secondary bg-secondary/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                  } else if (isSelected) {
                    btnStyle = "border-danger bg-danger/20 text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                  } else {
                    btnStyle = "border-slate-800 bg-slate-900/30 text-slate-500 opacity-50";
                  }
                }

                return (
                  <Button
                    key={idx}
                    variant="ghost"
                    className={`w-full text-left justify-start py-4 px-6 h-auto whitespace-normal border-2 transition-all duration-300 font-bold ${btnStyle}`}
                    onClick={() => handleAnswer(choice)}
                    disabled={showExplanation}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black shrink-0 ${showExplanation && isCorrectChoice ? 'bg-secondary text-white' : showExplanation && isSelected ? 'bg-danger text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="flex-1">{choice}</span>
                      {showExplanation && isCorrectChoice && <CheckCircle2 className="w-5 h-5 text-secondary shrink-0" />}
                      {showExplanation && isSelected && !isCorrectChoice && <XCircle className="w-5 h-5 text-danger shrink-0" />}
                    </div>
                  </Button>
                );
              })}
            </div>

            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  className={`rounded-xl p-4 md:p-6 border ${isCorrect ? 'bg-secondary/10 border-secondary/30' : 'bg-danger/10 border-danger/30'}`}
                >
                  <h4 className={`font-black text-lg mb-2 flex items-center gap-2 ${isCorrect ? 'text-secondary' : 'text-danger'}`}>
                    {isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    {isCorrect ? 'การวินิจฉัยถูกต้อง!' : 'การวินิจฉัยผิดพลาด!'}
                  </h4>
                  <p className="text-slate-200 text-sm leading-relaxed mb-6">
                    {currentCase.explanation}
                  </p>
                  
                  {currentCaseIndex < cases.length - 1 ? (
                    <Button onClick={handleNext} className="w-full font-bold uppercase tracking-widest bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/30 border-0">
                      แฟ้มถัดไป (Next Case)
                    </Button>
                  ) : (
                    <Button onClick={async () => {
                      if (appUser && !isSaving) {
                        setIsSaving(true);
                        try {
                          const { addDoc, collection } = await import('firebase/firestore');
                          await addDoc(collection(db, 'users', appUser.uid, 'history'), {
                            gameId: 'lab-detective',
                            gameName: 'Lab Detective',
                            score: earnedExp,
                            expEarned: earnedExp,
                            playedAt: new Date().toISOString()
                          });
                          window.location.href = '/student/play';
                        } catch (e) {
                          console.error(e);
                          window.location.href = '/student/play';
                        }
                      } else {
                        window.location.href = '/student/play';
                      }
                    }} disabled={isSaving} variant="secondary" className="w-full font-bold uppercase tracking-widest">
                      {isSaving ? "Saving..." : "จบภารกิจ (Finish)"}
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </div>
  );
}
