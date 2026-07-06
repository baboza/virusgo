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

const DEFAULT_QUESTIONS = [
  {
    id: 1,
    question: "ลูกสุนัขวัย 3 เดือน มาด้วยอาการท้องเสียเป็นเลือดอย่างรุนแรง อาเจียน และซึม ผลเลือดพบภาวะเม็ดเลือดขาวต่ำอย่างรุนแรง (Severe leukopenia) ไวรัสชนิดใดที่เป็นสาเหตุที่เป็นไปได้มากที่สุด?",
    choices: ["Canine Distemper Virus", "Canine Parvovirus", "Rabies Virus", "Canine Adenovirus-1"],
    answer: "Canine Parvovirus",
    explanation: "Canine Parvovirus มุ่งเป้าทำลายเซลล์ที่มีการแบ่งตัวอย่างรวดเร็ว เช่น เซลล์เยื่อบุลำไส้ (ทำให้ท้องเสียเป็นเลือด) และเซลล์ไขกระดูก (ทำให้เม็ดเลือดขาวต่ำ)",
    virusType: 'parvo'
  },
  {
    id: 2,
    question: "ไวรัสชนิดนี้มีเปลือกหุ้ม (Enveloped) รูปร่างคล้ายกระสุนปืน (Bullet-shaped) และทำให้เกิดภาวะสมองอักเสบถึงแก่ชีวิตในสัตว์เลี้ยงลูกด้วยนมเกือบทุกชนิด",
    choices: ["Rabies Virus", "Feline Leukemia Virus", "Equine Infectious Anemia", "Bovine Viral Diarrhea Virus"],
    answer: "Rabies Virus",
    explanation: "โรคพิษสุนัขบ้าเกิดจาก Rhabdovirus ซึ่งมีลักษณะเด่นคือรูปร่างคล้ายกระสุนปืนเมื่อดูผ่านกล้องจุลทรรศน์อิเล็กตรอน",
    virusType: 'rabies'
  },
  {
    id: 3,
    question: "สุกรในฟาร์มมีอาการไข้สูง ซึม และมีรอยโรคที่ผิวหนังเป็นรูปสี่เหลี่ยมขนมเปียกปูน (Diamond-shaped skin lesions) เชื้อก่อโรคนี้คืออะไร?",
    choices: ["African Swine Fever Virus", "Classical Swine Fever Virus", "Swine Erysipelas (Bacteria)", "Porcine Circovirus"],
    answer: "Swine Erysipelas (Bacteria)",
    explanation: "แม้ชื่อเกมจะเป็นไวรัส แต่ Erysipelothrix rhusiopathiae เป็นแบคทีเรียที่ทำให้เกิดรอยโรคสี่เหลี่ยมขนมเปียกปูนที่จำเพาะมาก (Pathognomonic sign)",
    virusType: 'bacteria'
  },
  {
    id: 4,
    question: "แมวอายุ 5 ปี มีอาการซึม เบื่ออาหาร เหงือกซีด และตรวจพบก้อนเนื้องอกที่ช่องอก (Mediastinal lymphoma) เชื้อไวรัสชนิดใดมีความสัมพันธ์กับอาการเหล่านี้มากที่สุด?",
    choices: ["Feline Immunodeficiency Virus (FIV)", "Feline Infectious Peritonitis (FIP)", "Feline Leukemia Virus (FeLV)", "Feline Panleukopenia Virus (FPV)"],
    answer: "Feline Leukemia Virus (FeLV)",
    explanation: "FeLV เป็น Retrovirus ที่สามารถแทรกจีโนมเข้าไปในเซลล์โฮสต์และเหนี่ยวนำให้เกิดมะเร็ง เช่น Lymphoma ได้บ่อยในแมว",
    virusType: 'felv'
  },
  {
    id: 5,
    question: "โรค 구제역 หรือ Foot and Mouth Disease (FMD) มักไม่พบการติดเชื้อในสัตว์ชนิดใดต่อไปนี้?",
    choices: ["สุกร", "โค-กระบือ", "แพะ-แกะ", "ม้า"],
    answer: "ม้า",
    explanation: "FMD เป็นโรคที่ติดเฉพาะในสัตว์กีบคู่ (Artiodactyla) เท่านั้น ม้าเป็นสัตว์กีบเดี่ยวจึงไม่ติดโรคนี้",
    virusType: 'fmd'
  }
];

const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

export default function IdentificationGame() {
  const { appUser } = useAuth();
  const [questions, setQuestions] = useState<any[]>(() => shuffle(DEFAULT_QUESTIONS));
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useLiveTracking('identification', gameOver ? `วิเคราะห์เสร็จสิ้น | คะแนน: ${score}` : `ข้อที่: ${currentQ + 1} | คะแนน: ${score}`);


  React.useEffect(() => {
    import('firebase/firestore').then(({ getDoc, doc }) => {
      getDoc(doc(db, 'game_content', 'identification')).then(docSnap => {
        if (docSnap.exists() && docSnap.data().data?.length > 0) {
          setQuestions(shuffle(docSnap.data().data));
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

      // Save EXP to Firestore immediately
      if (appUser) {
        try {
          const userRef = doc(db, 'users', appUser.uid);
          await updateDoc(userRef, {
            exp: increment(10),
          });
        } catch (e) {
          console.error('Failed to save EXP:', e);
        }
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

  useEffect(() => {
    if (gameOver && appUser && score > 0) {
      const saveHistory = async () => {
        try {
          const { addDoc, collection } = await import('firebase/firestore');
          await addDoc(collection(db, 'users', appUser.uid, 'history'), {
            gameId: 'identification',
            gameName: 'Virus Identification',
            score: score,
            expEarned: score,
            playedAt: new Date().toISOString()
          });
        } catch (e) {
          console.error(e);
        }
      };
      saveHistory();
    }
  }, [gameOver]);

  if (gameOver) {
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
        <p className="text-xl text-slate-400 font-mono">คุณได้รับ {score} EXP จากการวิเคราะห์ตัวอย่าง</p>
        <div className="flex justify-center gap-4 pt-8">
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
      <div className="flex items-center justify-between">
        <Link href="/student/play" onClick={() => sfx.click()}>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="font-bold text-primary text-glow flex items-center gap-2">
          <ScanSearch className="w-5 h-5" /> ระบบวิเคราะห์ไวรัส
        </div>
        <div className="font-black text-accent text-xl">{score} EXP</div>
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
