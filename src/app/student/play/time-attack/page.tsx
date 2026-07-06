"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, ArrowLeft, Zap, CheckCircle2, XCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useLiveTracking } from '@/hooks/useLiveTracking';

// ── Question Bank ─────────────────────────────────────────────────────────────
const DEFAULT_QUESTIONS = [
  { q: "ไวรัสชนิดใดที่มีรูปร่างคล้ายกระสุนปืน (Bullet-shaped)?", choices: ["Rabies Virus", "Influenza Virus", "Parvovirus", "Rotavirus"], answer: "Rabies Virus" },
  { q: "Negri bodies เป็นลักษณะเฉพาะของโรคใด?", choices: ["Canine Distemper", "Rabies", "Feline Panleukopenia", "FIV"], answer: "Rabies" },
  { q: "เชื้อ FMD เป็นเชื้อกลุ่มใด?", choices: ["DNA Virus", "RNA Virus", "Bacteria", "Fungi"], answer: "RNA Virus" },
  { q: "สัตว์ชนิดใดไม่ติดเชื้อ FMD (โรคปากและเท้าเปื่อย)?", choices: ["โค", "สุกร", "ม้า", "แพะ"], answer: "ม้า" },
  { q: "โรค PEDV ในสุกร ทำให้เกิดอาการใดเด่นชัดที่สุด?", choices: ["ไข้สูง", "ท้องเสียรุนแรง", "ไอเรื้อรัง", "แท้งลูก"], answer: "ท้องเสียรุนแรง" },
  { q: "การส่งตรวจยืนยันเชื้อ Rabies นิยมใช้วิธีใด?", choices: ["FA Test จากสมอง", "Blood smear", "ELISA serum", "PCR อุจจาระ"], answer: "FA Test จากสมอง" },
  { q: "CPV (Canine Parvovirus) มักพบในสุนัขอายุเท่าใด?", choices: ["แรกเกิด", "1-6 เดือน", "3-5 ปี", "สุนัขแก่"], answer: "1-6 เดือน" },
  { q: "พาหะนำโรค PRRS คืออะไร?", choices: ["ยุง", "เห็บ", "สุกรป่วย", "นก"], answer: "สุกรป่วย" },
  { q: "วัคซีน ASF ในปัจจุบันมีประสิทธิภาพระดับใด?", choices: ["ป้องกันได้ 100%", "ป้องกันได้ 80%", "ป้องกันได้เฉพาะบางสายพันธุ์", "ยังไม่มีวัคซีนที่สมบูรณ์"], answer: "ยังไม่มีวัคซีนที่สมบูรณ์" },
  { q: "ข้อใดคือลักษณะทางพยาธิวิทยาของโรคไข้หัดสุนัข (CDV)?", choices: ["Encephalitis", "Pneumonia", "Hyperkeratosis (Hardpad)", "ถูกทุกข้อ"], answer: "ถูกทุกข้อ" },
  { q: "Feline Leukemia Virus (FeLV) เป็นไวรัสกลุ่มใด?", choices: ["Retrovirus", "Parvovirus", "Coronavirus", "Herpesvirus"], answer: "Retrovirus" },
  { q: "การวินิจฉัย FIV ในคลินิก นิยมตรวจหาอะไร?", choices: ["Antigen", "Antibody", "DNA", "RNA"], answer: "Antibody" },
  { q: "โรคใดในแมวที่มักเกิดจากเชื้อ Feline Coronavirus กลายพันธุ์?", choices: ["FIV", "FeLV", "FIP", "FPLV"], answer: "FIP" },
  { q: "African Horse Sickness (AHS) มีพาหะนำโรคคือสัตว์ชนิดใด?", choices: ["ริ้น (Culicoides)", "ยุง (Aedes)", "แมลงวันคอก (Stomoxys)", "เห็บ (Ticks)"], answer: "ริ้น (Culicoides)" },
  { q: "ไวรัสชนิดใดเป็นสาเหตุของโรค Orf (Contagious ecthyma) ในแกะ?", choices: ["Poxvirus", "Herpesvirus", "Papillomavirus", "Parvovirus"], answer: "Poxvirus" }
];

const TOTAL_TIME = 60;
const TIME_BONUS = 3;
const TIME_PENALTY = 5;

// Shuffle array helper
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TimeAttack() {
  const { appUser } = useAuth();

  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [questionsBank, setQuestionsBank] = useState<typeof DEFAULT_QUESTIONS>(DEFAULT_QUESTIONS);
  const [questions, setQuestions] = useState<typeof DEFAULT_QUESTIONS>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; color: string } | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useLiveTracking('time-attack', phase === 'playing' ? `ข้อที่: ${currentIndex + 1} | คะแนน: ${score} | เวลา: ${timeLeft}s` : phase === 'result' ? `จบเกม | คะแนน: ${score}` : `รอเริ่มเกม`);


  useEffect(() => {
    import('firebase/firestore').then(({ getDoc, doc }) => {
      getDoc(doc(db, 'game_content', 'quiz_general')).then((docSnap) => {
        if (docSnap.exists() && docSnap.data().questions?.length > 0) {
          const mapped = docSnap.data().questions.map((q: any) => ({
            q: q.q,
            choices: q.opts || [],
            answer: q.opts ? q.opts[q.ans] : ''
          }));
          setQuestionsBank(mapped);
        }
      }).catch(console.error);
    });
  }, []);

  const endGame = useCallback(async (finalScore: number, correct: number) => {
    setPhase('result');
    if (timerRef.current) clearInterval(timerRef.current);

    // Award EXP & Record History
    if (appUser && correct > 0) {
      try {
        const earnedExp = correct * 10;
        await updateDoc(doc(db, 'users', appUser.uid), {
          exp: increment(earnedExp),
        });
        
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'users', appUser.uid, 'history'), {
          gameId: 'time-attack',
          gameName: 'Time Attack',
          score: finalScore,
          expEarned: earnedExp,
          playedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error('Failed to update EXP and History:', e);
      }
    }
  }, [appUser]);

  // Timer countdown
  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          // Call endGame with current state
          setTotalCorrect((currentCorrect) => {
            setScore((currentScore) => {
              endGame(currentScore, currentCorrect);
              return currentScore;
            });
            return currentCorrect;
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, endGame]);

  const startGame = () => {
    setQuestions(shuffle(questionsBank));
    setCurrentIndex(0);
    setTimeLeft(TOTAL_TIME);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setTotalAnswered(0);
    setTotalCorrect(0);
    setFeedback(null);
    setIsAnswering(false);
    setPhase('playing');
  };

  const handleAnswer = useCallback((choice: string) => {
    if (isAnswering) return;
    setIsAnswering(true);

    const isCorrect = choice === questions[currentIndex]?.answer;
    const newAnswered = totalAnswered + 1;
    const newCorrect = isCorrect ? totalCorrect + 1 : totalCorrect;

    setTotalAnswered(newAnswered);

    if (isCorrect) {
      sfx.correct();
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
      setTotalCorrect(newCorrect);
      setScore(prev => prev + (10 * (newStreak >= 3 ? 2 : 1))); // double points on 3+ streak
      setTimeLeft(t => Math.min(TOTAL_TIME, t + TIME_BONUS));
      setFeedback({ text: `+${TIME_BONUS}s ✓ ${newStreak >= 3 ? '🔥 STREAK x' + newStreak : 'ถูกต้อง!'}`, color: 'text-secondary' });
    } else {
      sfx.wrong();
      setStreak(0);
      setTimeLeft(t => Math.max(1, t - TIME_PENALTY));
      setFeedback({ text: `-${TIME_PENALTY}s ✗ ผิด!`, color: 'text-danger' });
    }

    setTimeout(() => {
      setFeedback(null);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        // Out of questions, reshuffle
        setQuestions(shuffle(questionsBank));
        setCurrentIndex(0);
      } else {
        setCurrentIndex(nextIndex);
      }
      setIsAnswering(false);
    }, 600);
  }, [isAnswering, questions, currentIndex, streak, totalAnswered, totalCorrect]);

  const currentQ = questions[currentIndex];
  const timerPct = (timeLeft / TOTAL_TIME) * 100;
  const timerColor = timeLeft > 20 ? 'bg-secondary' : timeLeft > 10 ? 'bg-accent' : 'bg-danger';

  // ── INTRO SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-20 px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', duration: 0.6 }}>
          <div className="w-32 h-32 mx-auto rounded-full bg-danger/20 border-2 border-danger flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
            <Timer className="w-16 h-16 text-danger animate-pulse" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-widest uppercase mb-3" style={{ textShadow: '0 0 20px rgba(239,68,68,0.7)' }}>
            Time Attack
          </h1>
          <p className="text-danger font-mono text-sm uppercase tracking-widest mb-8">โหมดแข่งกับเวลา</p>
        </motion.div>

        <Card className="glass border-danger/30 p-8 text-left space-y-4">
          <h2 className="text-xl font-black text-white mb-6 text-center uppercase tracking-widest">กติกาการเล่น</h2>
          {[
            { icon: '⏱️', text: 'เริ่มต้นด้วยเวลา 60 วินาที' },
            { icon: '✅', text: `ตอบถูก: +${TIME_BONUS} วินาที และได้คะแนน 10 แต้ม` },
            { icon: '❌', text: `ตอบผิด: -${TIME_PENALTY} วินาที และตัดสาย Streak` },
            { icon: '🔥', text: 'ตอบถูก 3 ครั้งติด → Streak Bonus x2 คะแนน!' },
            { icon: '⚡', text: 'เกมจบเมื่อเวลาหมด ตอบให้ได้มากที่สุดก่อนหมดเวลา!' },
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-4 py-3 border-b border-slate-800 last:border-0">
              <span className="text-2xl">{rule.icon}</span>
              <p className="text-slate-200 font-medium">{rule.text}</p>
            </div>
          ))}
        </Card>

        <Button onClick={startGame} size="lg" className="px-16 py-5 text-xl font-black uppercase tracking-widest bg-danger hover:bg-red-400 text-white border-0 shadow-[0_0_30px_rgba(239,68,68,0.5)]">
          <Zap className="w-6 h-6 mr-3" /> เริ่มเกม!
        </Button>
        <div>
          <Link href="/student/play">
            <Button variant="ghost" className="font-bold text-slate-400">
              <ArrowLeft className="w-4 h-4 mr-2" /> กลับ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── RESULT SCREEN ──────────────────────────────────────────────────────────
  if (phase === 'result') {
    const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const earnedExp = totalCorrect * 10;
    const grade = accuracy >= 80 ? { label: 'S', color: 'text-yellow-400', glow: 'rgba(234,179,8,0.5)' }
      : accuracy >= 60 ? { label: 'A', color: 'text-secondary', glow: 'rgba(16,185,129,0.5)' }
      : accuracy >= 40 ? { label: 'B', color: 'text-primary', glow: 'rgba(59,130,246,0.5)' }
      : { label: 'C', color: 'text-slate-400', glow: 'rgba(148,163,184,0.5)' };

    return (
      <div className="max-w-2xl mx-auto text-center space-y-8 py-16 px-4">
        <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', duration: 0.8 }}>
          <div className={`w-36 h-36 mx-auto rounded-full border-4 flex items-center justify-center mb-4 ${grade.color} border-current`} style={{ boxShadow: `0 0 40px ${grade.glow}` }}>
            <span className={`text-7xl font-black ${grade.color}`}>{grade.label}</span>
          </div>
          <h1 className="text-4xl font-black text-white uppercase tracking-widest">หมดเวลา!</h1>
        </motion.div>

        <Card className="glass border-danger/30 p-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {[
              { label: 'คะแนนรวม', value: score, color: 'text-accent', suffix: 'pts' },
              { label: 'EXP ที่ได้รับ', value: `+${earnedExp}`, color: 'text-primary', suffix: '' },
              { label: 'ตอบถูก', value: `${totalCorrect}/${totalAnswered}`, color: 'text-secondary', suffix: '' },
              { label: 'ความแม่นยำ', value: `${accuracy}%`, color: 'text-white', suffix: '' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 + 0.3 }} className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
                <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-1">{stat.label}</p>
                <p className={`text-3xl font-black ${stat.color}`}>{stat.value}<span className="text-sm text-slate-500 ml-1">{stat.suffix}</span></p>
              </motion.div>
            ))}
          </div>

          {bestStreak >= 3 && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3">
              <span className="text-3xl">🔥</span>
              <div className="text-left">
                <p className="text-accent font-black">Best Streak: {bestStreak} ครั้ง!</p>
                <p className="text-slate-400 text-sm">คุณตอบถูกติดต่อกันถึง {bestStreak} ข้อ!</p>
              </div>
            </div>
          )}
        </Card>

        <div className="flex gap-4 justify-center">
          <Button onClick={startGame} size="lg" className="bg-danger hover:bg-red-400 text-white border-0 font-black uppercase tracking-widest shadow-[0_0_20px_rgba(239,68,68,0.3)] px-8">
            <RotateCcw className="w-5 h-5 mr-2" /> เล่นอีกครั้ง
          </Button>
          <Link href="/student/play">
            <Button variant="ghost" size="lg" className="font-black uppercase tracking-widest px-8">
              <ArrowLeft className="w-5 h-5 mr-2" /> กลับ
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ── PLAYING SCREEN ──────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-24 pt-4 px-2">
      {/* Timer Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className={`w-5 h-5 ${timeLeft <= 10 ? 'text-danger animate-pulse' : 'text-slate-400'}`} />
            <span className={`font-black text-3xl font-mono tabular-nums ${timeLeft <= 10 ? 'text-danger' : timeLeft <= 20 ? 'text-accent' : 'text-white'}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="flex items-center gap-4">
            {streak >= 3 && (
              <motion.div key={streak} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="flex items-center gap-1 text-accent font-black text-sm bg-accent/10 border border-accent/30 px-3 py-1 rounded-full">
                🔥 x{streak} STREAK
              </motion.div>
            )}
            <div className="text-right">
              <div className="text-slate-500 font-mono text-xs uppercase">คะแนน</div>
              <div className="text-white font-black text-2xl">{score}</div>
            </div>
          </div>
        </div>
        <div className="h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <motion.div
            className={`h-full ${timerColor} transition-colors duration-300`}
            animate={{ width: `${timerPct}%` }}
            transition={{ duration: 0.4, ease: 'linear' }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        {currentQ && (
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.25 }}
          >
            <Card className="glass border-orange-500/30 p-6 md:p-10 relative overflow-hidden">
              {/* Danger glow when time is low */}
              {timeLeft <= 10 && (
                <motion.div
                  className="absolute inset-0 border-2 border-danger rounded-3xl"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 0.7, repeat: Infinity }}
                />
              )}

              <div className="text-orange-400 font-mono text-xs uppercase tracking-widest mb-4">
                ข้อที่ {totalAnswered + 1} • Q{currentIndex + 1}/{questions.length}
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white leading-relaxed mb-10">
                {currentQ.q}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.choices.map((choice, idx) => (
                  <motion.button
                    key={choice}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    disabled={isAnswering}
                    onClick={() => {
                      sfx.click();
                      handleAnswer(choice);
                    }}
                    className="p-4 md:p-5 rounded-2xl border-2 border-slate-700 bg-slate-900/60 hover:border-orange-500/60 hover:bg-orange-900/20 text-slate-200 font-bold text-left transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-800 group-hover:bg-orange-900/50 border border-slate-700 flex items-center justify-center font-black text-slate-400 shrink-0 transition-colors">
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span>{choice}</span>
                  </motion.button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feedback Popup */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key="feedback"
            initial={{ opacity: 0, y: -20, scale: 1.2 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`text-center text-3xl font-black ${feedback.color} pointer-events-none`}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Row */}
      <div className="flex gap-4 text-center">
        {[
          { label: 'ตอบถูก', value: totalCorrect, icon: <CheckCircle2 className="w-4 h-4 text-secondary mx-auto mb-1" /> },
          { label: 'ตอบผิด', value: totalAnswered - totalCorrect, icon: <XCircle className="w-4 h-4 text-danger mx-auto mb-1" /> },
          { label: 'ความแม่นยำ', value: totalAnswered > 0 ? `${Math.round((totalCorrect / totalAnswered) * 100)}%` : '-', icon: <AlertTriangle className="w-4 h-4 text-accent mx-auto mb-1" /> },
        ].map((stat, i) => (
          <div key={i} className="flex-1 glass border-slate-800 rounded-2xl p-4">
            {stat.icon}
            <div className="text-2xl font-black text-white">{stat.value}</div>
            <div className="text-xs text-slate-500 font-mono uppercase mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
