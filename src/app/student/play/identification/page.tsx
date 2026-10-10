"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Trophy, ScanSearch } from 'lucide-react';
import Link from 'next/link';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { awardDailyCappedExp, getDailyExpInfo, DailyExpInfo } from '@/lib/dailyExpCap';

import { ALL_15_CHAPTER_QUESTIONS } from '@/data/veterinaryVirologyContent';

const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

const formatAndShuffleQuestions = (rawQuestions: any[]) => {
  return shuffle(
    rawQuestions.map(q => ({
      id: q.id,
      chapter: q.chapter,
      chapterTitle: q.chapterTitle,
      question: q.q || q.question,
      choices: shuffle(q.choices || []),
      answer: q.answer,
      explanation: q.explanation,
      virusType: q.virusType
    }))
  );
};

export default function IdentificationGame() {
  const { appUser } = useAuth();
  const [questions, setQuestions] = useState<any[]>(() => formatAndShuffleQuestions(ALL_15_CHAPTER_QUESTIONS));

  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [earnedExp, setEarnedExp] = useState(0);
  const [dailyInfo, setDailyInfo] = useState<DailyExpInfo | null>(null);
  const [gameOver, setGameOver] = useState(false);

  useLiveTracking('identification', gameOver ? `วิเคราะห์เสร็จสิ้น | คะแนน: ${score}` : `ข้อที่: ${currentQ + 1} | คะแนน: ${score}`);

  useEffect(() => {
    if (appUser) {
      getDailyExpInfo(appUser.uid, 'identification').then(setDailyInfo);
    }
  }, [appUser]);


  React.useEffect(() => {
    import('firebase/firestore').then(({ getDoc, doc }) => {
      getDoc(doc(db, 'game_content', 'identification')).then(docSnap => {
        if (docSnap.exists() && docSnap.data().data?.length > 0) {
          setQuestions(formatAndShuffleQuestions(docSnap.data().data));
        }
      }).catch(console.error);
    });
  }, []);

  const question = questions[currentQ];

  const handleAnswer = async (choice: string) => {
    if (selectedAnswer !== null) return;

    setSelectedAnswer(choice);
    const correct = choice === question.answer;
    setIsCorrect(correct);

    if (correct) {
      sfx.correct();
      setScore(prev => prev + 10);

      if (appUser) {
        awardDailyCappedExp(appUser.uid, 'identification', `Virus Identification: ${question.question.slice(0, 30)}`, 10, 10).then(res => {
          setEarnedExp(prev => prev + res.awardedExp);
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

  if (gameOver) {
    const isPractice = earnedExp === 0 && score > 0;
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-20 px-2">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className="w-32 h-32 mx-auto bg-primary/20 text-primary border border-primary rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(59,130,246,0.3)]"
        >
          <Trophy className="w-16 h-16" />
        </motion.div>
        <h1 className="text-4xl font-black text-glow uppercase">ฝึกฝนสำเร็จ!</h1>
        
        {earnedExp > 0 ? (
          <div className="space-y-1">
            <p className="text-xl text-slate-300 font-mono">
              การวิเคราะห์ตัวอย่างเสร็จสิ้น ได้รับ <span className="text-primary font-black">+{earnedExp} EXP</span>
            </p>
            <p className="text-xs text-slate-400 font-sans">
              โควตา EXP วันนี้: {dailyInfo?.earnedToday || earnedExp} / {dailyInfo?.cap || 150} EXP
            </p>
          </div>
        ) : (
          <div className="space-y-2 bg-slate-900/60 p-4 rounded-2xl border border-cyan-500/30 max-w-lg mx-auto">
            <span className="inline-block px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-bold uppercase tracking-wider">
              🎮 โหมดฝึกฝน (Practice Mode)
            </span>
            <p className="text-slate-300 text-sm">
              คุณได้รับ EXP โหมดวิเคราะห์ไวรัสครบโควตาประจำวันแล้ว (150/150 EXP) แต่ยังสามารถเล่นทบทวนความรู้ได้ไม่จำกัด!
            </p>
          </div>
        )}

        <div className="flex justify-center gap-4 pt-6">
          <Button onClick={() => window.location.reload()} size="lg" className="font-bold">วินิจฉัยอีกครั้ง</Button>
          <Link href="/student/play">
            <Button variant="secondary" size="lg" className="font-bold">กลับสู่ศูนย์บัญชาการ</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 pt-4 px-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/student/play" onClick={() => sfx.click()}>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="font-bold text-primary text-glow flex items-center gap-2">
          <ScanSearch className="w-5 h-5" /> ระบบวิเคราะห์ไวรัส
        </div>
        <div className="flex items-center gap-3">
          {dailyInfo && (
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
              {dailyInfo.isCapped ? 'โหมดฝึกซ้อม (โควตาเต็ม)' : `โควตาวันนี้: ${dailyInfo.earnedToday}/${dailyInfo.cap} EXP`}
            </span>
          )}
          <div className="font-black text-accent text-xl">{score} แต้ม</div>
        </div>
      </div>

      <div className="w-full bg-slate-900 rounded-full h-2 border border-primary/30 relative overflow-hidden">
        <motion.div 
          className="absolute top-0 bottom-0 left-0 bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQ}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="p-4 md:p-8 glass-neon shadow-2xl relative overflow-hidden border-primary/30">
            <div className="scanlines" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
              
              {/* Image/Scanner Area */}
              <div className="w-full md:w-1/3 flex flex-col items-center justify-center p-6 bg-black/40 rounded-2xl border border-primary/20 relative group">
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/50" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/50" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/50" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/50" />
                
                {/* Scanner line animation */}
                <motion.div 
                  className="absolute left-0 right-0 h-0.5 bg-primary/50 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-20"
                  animate={{ top: ['10%', '90%', '10%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                />

                <SVGVirus type={question.virusType as any} className="w-32 h-32 text-primary" />
                <div className="mt-4 text-xs font-mono text-primary/70 tracking-widest uppercase">SCANNING...</div>
              </div>

              {/* Question & Choices */}
              <div className="flex-1 w-full">
                {question.chapter && (
                  <div className="mb-2">
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      บทที่ {question.chapter}: {question.chapterTitle}
                    </span>
                  </div>
                )}
                <h2 className="text-xl md:text-2xl font-bold text-white mb-8 leading-relaxed">
                  {question.question}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {question.choices.map((choice) => {
                    const isSelected = selectedAnswer === choice;
                    const isWinner = choice === question.answer;
                    
                    let btnClass = "border-slate-800 text-slate-300 hover:border-primary/50 hover:bg-primary/10 text-left h-auto py-4 px-6 justify-start text-sm md:text-base whitespace-normal font-bold";
                    
                    if (selectedAnswer) {
                      if (isWinner) {
                        btnClass = "bg-secondary/20 text-secondary border-secondary shadow-[0_0_15px_rgba(16,185,129,0.3)]";
                      } else if (isSelected && !isWinner) {
                        btnClass = "bg-danger/20 text-danger border-danger shadow-[0_0_15px_rgba(239,68,68,0.3)]";
                      } else {
                        btnClass = "opacity-30 border-slate-800";
                      }
                    }

                    return (
                      <Button
                        key={choice}
                        variant="ghost"
                        className={`border-2 transition-all duration-300 ${btnClass}`}
                        onClick={() => handleAnswer(choice)}
                        disabled={selectedAnswer !== null}
                      >
                        {choice}
                      </Button>
                    );
                  })}
                </div>

                {selectedAnswer && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className={`p-4 rounded-xl flex gap-4 ${isCorrect ? 'bg-secondary/10 border border-secondary/30 text-secondary' : 'bg-danger/10 border border-danger/30 text-danger'}`}
                  >
                    {isCorrect ? <CheckCircle className="w-6 h-6 shrink-0 mt-1" /> : <XCircle className="w-6 h-6 shrink-0 mt-1" />}
                    <div>
                      <h4 className="font-bold text-lg mb-1 uppercase">{isCorrect ? 'ถูกต้อง! +10 EXP' : 'ผิดพลาด!'}</h4>
                      <p className={`text-sm ${isCorrect ? 'text-secondary/80' : 'text-danger/80'}`}>{question.explanation}</p>
                    </div>
                  </motion.div>
                )}

                {selectedAnswer && (
                  <div className="flex justify-end mt-8">
                    <Button size="lg" onClick={nextQuestion} className="font-bold uppercase tracking-wider">
                      {currentQ < questions.length - 1 ? 'วิเคราะห์เคสถัดไป' : 'เสร็จสิ้นการวิเคราะห์'}
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
