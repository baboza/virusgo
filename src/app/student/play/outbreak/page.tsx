"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Map as MapIcon,
  Activity,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Layers,
  X,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  BookOpen,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { awardDailyCappedExp, getDailyExpInfo, DailyExpInfo } from '@/lib/dailyExpCap';
import {
  OUTBREAK_CASES,
  type OutbreakCase,
  type ScenarioStep,
  type ScenarioOption
} from './casesData';

// Re-export for compatibility
export {
  OUTBREAK_CASES,
  type OutbreakCase,
  type ScenarioStep,
  type ScenarioOption
};

const SPECIES_CATEGORIES = [
  { id: 'all', label: 'ทั้งหมด', icon: '🌐', count: 12 },
  { id: 'swine', label: 'สุกร', icon: '🐷', count: 3 },
  { id: 'poultry', label: 'สัตว์ปีก', icon: '🐔', count: 2 },
  { id: 'bovine', label: 'โค/กระบือ', icon: '🐮', count: 2 },
  { id: 'companion', label: 'สัตว์เลี้ยง', icon: '🐶🐱', count: 3 },
  { id: 'equine', label: 'ม้า', icon: '🐴', count: 1 },
  { id: 'zoonosis', label: 'Zoonosis', icon: '☣️', count: 2 },
];

export default function OutbreakSim() {
  const { appUser } = useAuth();

  // Selected outbreak case
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [step, setStep] = useState(0);
  const [farmHp, setFarmHp] = useState(80);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; type: 'good' | 'bad' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [dailyInfo, setDailyInfo] = useState<DailyExpInfo | null>(null);
  const [awardedExp, setAwardedExp] = useState<number | null>(null);

  // Modal & Filter states
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Initialize random scenario on mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * OUTBREAK_CASES.length);
    setSelectedCaseIndex(randomIndex);
  }, []);

  const currentCase = OUTBREAK_CASES[selectedCaseIndex] || OUTBREAK_CASES[0];
  const scenarioSteps = currentCase.steps;
  const currentScenario = scenarioSteps[step];
  const gameOver = step >= scenarioSteps.length || farmHp <= 0;

  // Dynamic choice shuffling: randomly shuffles options per step so good choices are never at fixed position
  const currentOptions = useMemo(() => {
    if (!currentScenario?.options) return [];
    const copy = [...currentScenario.options];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }, [selectedCaseIndex, step, currentScenario]);

  useLiveTracking(
    'outbreak',
    step >= scenarioSteps.length
      ? `จบซิมูเลชัน: ${currentCase.title} | คะแนน: ${score}`
      : `เคส: ${currentCase.title} | ขั้นที่: ${step + 1} | Farm HP: ${farmHp} | คะแนน: ${score}`
  );

  useEffect(() => {
    if (appUser) {
      getDailyExpInfo(appUser.uid, 'outbreak').then(setDailyInfo);
    }
  }, [appUser]);

  // Restart / Switch Case
  const handleRestartCase = useCallback((caseIndex?: number) => {
    sfx.click();
    let nextIndex = caseIndex !== undefined ? caseIndex : Math.floor(Math.random() * OUTBREAK_CASES.length);
    if (caseIndex === undefined && nextIndex === selectedCaseIndex && OUTBREAK_CASES.length > 1) {
      nextIndex = (nextIndex + 1) % OUTBREAK_CASES.length;
    }
    setSelectedCaseIndex(nextIndex);
    setStep(0);
    setFarmHp(80);
    setScore(0);
    setFeedback(null);
    setIsSaving(false);
    setAwardedExp(null);
    setShowCaseModal(false);
  }, [selectedCaseIndex]);

  const handleChoice = (opt: ScenarioOption) => {
    const isGood = opt.hpMod > 0;
    if (isGood) sfx.correct();
    else sfx.wrong();

    setFeedback({ text: opt.feedback, type: isGood ? 'good' : 'bad' });
    setFarmHp(prev => Math.min(100, Math.max(0, prev + opt.hpMod)));

    if (isGood) {
      setScore(prev => prev + opt.exp);
    }

    setTimeout(() => {
      setFeedback(null);
      const nextStep = opt.next - 1;
      setStep(nextStep);

      // Check if this action ends the game
      if (nextStep >= scenarioSteps.length || Math.min(100, Math.max(0, farmHp + opt.hpMod)) <= 0) {
        handleGameOver(score + (isGood ? opt.exp : 0));
      }
    }, 4000);
  };

  const handleGameOver = async (finalScore: number) => {
    if (appUser && !isSaving && finalScore > 0) {
      setIsSaving(true);
      try {
        const res = await awardDailyCappedExp(appUser.uid, 'outbreak', 'Outbreak Simulator', finalScore, finalScore);
        setAwardedExp(res.awardedExp);
        setDailyInfo(prev => prev ? {
          ...prev,
          earnedToday: prev.earnedToday + res.awardedExp,
          remainingToday: res.remainingCap,
          isCapped: res.isCapped,
        } : null);
      } catch (e) {
        console.error("Failed to save EXP:", e);
      }
    }
  };

  const filteredCases = useMemo(() => {
    if (selectedFilter === 'all') return OUTBREAK_CASES;
    return OUTBREAK_CASES.filter(c => c.speciesGroup === selectedFilter);
  }, [selectedFilter]);

  if (gameOver) {
    const isVictory = farmHp > 0;
    const isPractice = awardedExp === 0 && score > 0;
    return (
      <div className="max-w-3xl mx-auto text-center space-y-6 py-12 px-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`w-28 h-28 mx-auto rounded-full flex items-center justify-center mb-4 border-4 ${
            isVictory
              ? 'bg-secondary/20 text-secondary border-secondary shadow-[0_0_30px_rgba(16,185,129,0.3)]'
              : 'bg-danger/20 text-danger border-danger shadow-[0_0_30px_rgba(239,68,68,0.3)]'
          }`}
        >
          {isVictory ? <ShieldCheck className="w-14 h-14" /> : <AlertTriangle className="w-14 h-14" />}
        </motion.div>

        {/* Case Badge Result */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-sm font-semibold text-slate-300">
          <span>{currentCase.icon}</span>
          <span>{currentCase.category}</span>
        </div>

        <h1 className={`text-2xl sm:text-3xl md:text-4xl font-black text-glow uppercase ${isVictory ? 'text-secondary' : 'text-danger'}`}>
          {isVictory ? 'ควบคุมการระบาดสำเร็จ' : 'มาตรการล้มเหลว - โรคระบาดลุกลาม'}
        </h1>

        {awardedExp !== null && awardedExp > 0 ? (
          <div className="space-y-1">
            <p className="text-xl text-slate-300 font-mono">
              {isVictory ? `คุณจัดการวิกฤตินี้ได้อย่างยอดเยี่ยม ได้รับ +${awardedExp} EXP` : `โรคระบาดลุกลามเกินกำลัง (ได้รับ +${awardedExp} EXP)`}
            </p>
            <p className="text-xs text-slate-400 font-sans">
              โควตา EXP วันนี้: {dailyInfo?.earnedToday || awardedExp} / {dailyInfo?.cap || 150} EXP
            </p>
          </div>
        ) : isPractice ? (
          <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-cyan-500/30 max-w-lg mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase tracking-wider">
              🎮 โหมดฝึกฝน (Practice Mode)
            </span>
            <p className="text-slate-300 text-sm">
              คุณได้รับ EXP โหมดควบคุมการระบาดครบโควตาประจำวันแล้ว (150/150 EXP) แต่ยังสามารถจำลองสถานการณ์ทบทวนได้ไม่จำกัด!
            </p>
          </div>
        ) : (
          <p className="text-slate-400 text-sm">คะแนนรวม: {score} แต้ม</p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-3 pt-3">
          <Button
            onClick={() => handleRestartCase()}
            size="lg"
            className="font-bold uppercase tracking-wider bg-secondary text-black hover:bg-secondary/80 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <RefreshCw className="w-5 h-5" /> สุ่มเคสใหม่
          </Button>

          <Button
            onClick={() => setShowCaseModal(true)}
            size="lg"
            variant="outline"
            className="font-bold uppercase tracking-wider border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 flex items-center gap-2"
          >
            <Layers className="w-5 h-5" /> เลือกเคสอื่น (12 เคส)
          </Button>

          <Link href="/student/play">
            <Button variant="outline" size="lg" className="font-bold uppercase tracking-wider text-white border-slate-700 hover:bg-slate-800">
              กลับสู่ฐาน
            </Button>
          </Link>
        </div>

        {/* Case Quick Grid */}
        <div className="pt-8 border-t border-slate-800 text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
              <Layers className="w-4 h-4 text-cyan-400" /> คลังเคสจำลองสถานการณ์ระบาดวิทยา (12 เคส):
            </div>
            <button
              onClick={() => setShowCaseModal(true)}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {OUTBREAK_CASES.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => handleRestartCase(idx)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                  idx === selectedCaseIndex
                    ? 'border-secondary bg-secondary/10 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'border-slate-800 bg-slate-900/50 hover:border-cyan-500/40 hover:bg-slate-800/60 text-slate-300'
                }`}
              >
                <span className="text-2xl shrink-0">{c.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate text-white">{c.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{c.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Case Selector Modal */}
        {renderCaseModal()}
      </div>
    );
  }

  function renderCaseModal() {
    return (
      <AnimatePresence>
        {showCaseModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md"
            onClick={() => setShowCaseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-950 border border-cyan-500/30 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      เลือกเคสสอบสวนการระบาด (Outbreak Scenarios)
                    </h2>
                    <p className="text-xs text-slate-400">
                      มีทั้งหมด 12 วิกฤตการณ์ ครอบคลุมปศุสัตว์ สัตว์เลี้ยง และโรคสัตว์สู่คน (One Health)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCaseModal(false)}
                  className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Species Filter Tabs */}
              <div className="p-3 bg-slate-900/30 border-b border-slate-800/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {SPECIES_CATEGORIES.map(cat => {
                  const isActive = selectedFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        sfx.click();
                        setSelectedFilter(cat.id);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900/70 border border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-black/20 text-black' : 'bg-slate-800 text-slate-400'}`}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Cases Grid */}
              <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredCases.map((c) => {
                    const idx = OUTBREAK_CASES.findIndex(x => x.id === c.id);
                    const isCurrent = idx === selectedCaseIndex;
                    return (
                      <div
                        key={c.id}
                        onClick={() => handleRestartCase(idx)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                          isCurrent
                            ? 'border-secondary bg-secondary/10 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                            : 'border-slate-800 bg-slate-900/40 hover:border-cyan-500/50 hover:bg-slate-900/80'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-2xl">{c.icon}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-cyan-300 border border-cyan-500/30">
                                {c.animalType}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/40 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> กำลังเล่น
                                </span>
                              )}
                            </div>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                            {c.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 line-clamp-1">
                            {c.subtitle}
                          </p>
                          <p className="text-[11px] text-slate-400/80 mt-2 line-clamp-2 leading-relaxed">
                            {c.steps[0]?.text.slice(0, 110)}...
                          </p>
                        </div>

                        <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span>{c.steps.length} ขั้นตอนการจำลอง</span>
                          <span className="text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                            เริ่มเคสนี้ <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-24 pt-4 px-2">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/student/play" onClick={() => sfx.click()}>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </Link>
        <div className="font-bold text-accent text-glow-accent flex items-center gap-2 tracking-widest uppercase text-sm sm:text-base">
          <MapIcon className="w-5 h-5 animate-pulse" /> Outbreak Simulator
        </div>
        <div className="flex items-center gap-3">
          {dailyInfo && (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              {dailyInfo.isCapped ? 'โหมดฝึกซ้อม (โควตาเต็ม)' : `โควตาวันนี้: ${dailyInfo.earnedToday}/${dailyInfo.cap} EXP`}
            </span>
          )}
          <div className="font-black text-primary text-xl">{score} แต้ม</div>
        </div>
      </div>

      {/* Active Case Banner */}
      <Card className={`p-4 bg-gradient-to-r ${currentCase.color} border flex flex-wrap items-center justify-between gap-3 shadow-lg`}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-center text-2xl shadow-inner shrink-0">
            {currentCase.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-cyan-300 border border-cyan-500/30">
                {currentCase.animalType}
              </span>
              <span className="text-xs text-slate-300 font-mono">
                ขั้นตอนที่ {step + 1} / {scenarioSteps.length}
              </span>
            </div>
            <h1 className="text-base sm:text-lg font-black text-white tracking-wide mt-0.5">
              {currentCase.title}
            </h1>
            <p className="text-xs text-slate-300/80 font-mono">{currentCase.subtitle}</p>
          </div>
        </div>

        {/* Action Buttons: Choose Specific Case & Random Case */}
        <div className="flex items-center gap-2 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              sfx.click();
              setShowCaseModal(true);
            }}
            className="border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-300 gap-1.5"
          >
            <Layers className="w-3.5 h-3.5" /> เลือกเคส (12)
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRestartCase()}
            className="border-slate-700 hover:border-slate-600 hover:bg-slate-800 text-xs font-semibold text-slate-300 gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> สุ่มเคสใหม่
          </Button>
        </div>
      </Card>

      {/* Farm Health HUD */}
      <Card className="p-4 glass-neon border-primary/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className={`w-6 h-6 ${farmHp > 50 ? 'text-secondary' : 'text-danger animate-pulse'}`} />
          <span className="font-bold text-white tracking-widest uppercase text-xs sm:text-sm">
            ความมั่นคงปลอดภัยทางชีวภาพ (Biosecurity Integrity)
          </span>
        </div>
        <div className="w-1/3 sm:w-1/2 bg-slate-900 rounded-full h-4 border border-slate-700 relative overflow-hidden">
          <motion.div
            className={`absolute top-0 bottom-0 left-0 ${farmHp > 50 ? 'bg-secondary' : farmHp > 20 ? 'bg-orange-500' : 'bg-danger'}`}
            animate={{ width: `${farmHp}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="font-mono font-bold w-12 text-right text-white">{farmHp}%</div>
      </Card>

      {/* Question / Choice Container */}
      <AnimatePresence mode="wait">
        {!feedback ? (
          <motion.div
            key={`${currentCase.id}-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card className="p-6 sm:p-8 glass shadow-2xl border-slate-800 relative overflow-hidden">
              <div className="scanlines" />
              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400 mb-4 pb-2 border-b border-slate-800">
                  <span>🚨 รายงานสถานการณ์ฉุกเฉิน (INCIDENT REPORT #{step + 1} / {scenarioSteps.length})</span>
                  <span>{currentCase.animalType}</span>
                </div>

                <h2 className="text-base sm:text-lg md:text-xl font-medium text-white mb-6 leading-relaxed font-mono">
                  {">"} {currentScenario?.text}
                  <motion.span
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  >_</motion.span>
                </h2>

                <div className="space-y-3 sm:space-y-4">
                  {currentOptions.map((opt, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-3.5 sm:py-4 px-4 sm:px-6 border-2 border-slate-800 text-slate-300 hover:border-primary/50 hover:bg-primary/10 hover:text-white transition-all group"
                      onClick={() => handleChoice(opt)}
                    >
                      <span className="text-primary font-mono mr-3 group-hover:scale-110 transition-transform shrink-0 font-bold">
                        [{idx + 1}]
                      </span>
                      <span className="whitespace-normal leading-relaxed text-sm sm:text-base">
                        {opt.text}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`p-8 rounded-2xl border-2 text-center shadow-xl ${
              feedback?.type === 'good'
                ? 'bg-secondary/10 border-secondary text-secondary shadow-[0_0_30px_rgba(16,185,129,0.2)]'
                : 'bg-danger/10 border-danger text-danger shadow-[0_0_30px_rgba(239,68,68,0.2)]'
            }`}
          >
            <h3 className="text-xl sm:text-2xl font-black mb-4 uppercase tracking-widest">
              {feedback?.type === 'good' ? 'SYSTEM OPTIMAL (การตัดสินใจถูกต้อง)' : 'CRITICAL ERROR (ข้อผิดพลาดร้ายแรง)'}
            </h3>
            <p className="text-base sm:text-lg font-mono text-white/90 max-w-2xl mx-auto leading-relaxed">
              {feedback?.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Case Selector Modal */}
      {renderCaseModal()}
    </div>
  );
}
