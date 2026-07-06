"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Microscope, ArrowLeft, CheckCircle2, XCircle, FileText, Activity, AlertTriangle, Fingerprint } from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useLiveTracking } from '@/hooks/useLiveTracking';

// Mock Case Studies (In a real app, this comes from Firestore)
const DEFAULT_CASES = [
  {
    id: "c1",
    title: "เคสที่ 01: หมูไอเป็นเลือด",
    species: "สุกร (Porcine)",
    history: "ฟาร์มสุกรขุนพบลูกสุกรมีอาการไอ หายใจลำบาก หูม่วงคล้ำ อัตราการตายสูงถึง 20% ในคอกอนุบาล",
    symptoms: ["ไข้สูง (41°C)", "หูและหน้าท้องมีสีม่วงคล้ำ (Cyanosis)", "แท้งในแม่สุกรช่วงท้ายของการตั้งท้อง", "ลูกสุกรแคระแกร็น"],
    laboratoryResults: "ผลตรวจทางซีรั่มวิทยาพบระดับ Antibody ต่อไวรัสสูงมากในกลุ่มสุกรป่วย ผ่าซากพบปอดอักเสบแบบ Interstitial pneumonia และต่อมน้ำเหลืองขยายใหญ่",
    choices: [
      "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV)",
      "African Swine Fever Virus (ASFV)",
      "Classical Swine Fever Virus (CSFV)",
      "Foot and Mouth Disease Virus (FMDV)"
    ],
    answer: "Porcine Reproductive and Respiratory Syndrome Virus (PRRSV)",
    explanation: "อาการหูม่วง (Blue ear disease), ปัญหาการสืบพันธุ์ในแม่สุกร (แท้ง) และปัญหาทางเดินหายใจในลูกสุกร ร่วมกับ Interstitial pneumonia เป็นลักษณะสำคัญของโรค PRRS"
  },
  {
    id: "c2",
    title: "เคสที่ 02: สุนัขระบบประสาทล้มเหลว",
    species: "สุนัข (Canine)",
    history: "สุนัขอายุ 3 เดือน พันธุ์พุดเดิ้ล ไม่เคยทำวัคซีน มีประวัติซึม เบื่ออาหาร และท้องเสียเป็นเลือดเมื่อ 2 สัปดาห์ก่อน ปัจจุบันมีอาการกระตุก",
    symptoms: ["กล้ามเนื้อกระตุก (Myoclonus)", "ขี้ตาเกรอะกรังสีเขียว", "ฝ่าเท้าหนาตัว (Hard pad disease)", "ชัก"],
    laboratoryResults: "ตรวจพบ Inclusion bodies ใน Cytoplasm และ Nucleus ของเซลล์เยื่อบุทางเดินหายใจ",
    choices: [
      "Canine Parvovirus (CPV)",
      "Rabies Virus",
      "Canine Distemper Virus (CDV)",
      "Canine Coronavirus"
    ],
    answer: "Canine Distemper Virus (CDV)",
    explanation: "อาการทางระบบหายใจ ทางเดินอาหาร ตามด้วยอาการทางระบบประสาท (Myoclonus) และ Hard pad disease เป็น Pathognomonic signs ของโรคไข้หัดสุนัข (Canine Distemper)"
  }
];

export default function LabDetective() {
  const { appUser } = useAuth();
  const [cases, setCases] = useState<any[]>(DEFAULT_CASES);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [earnedExp, setEarnedExp] = useState(0);

  useLiveTracking('lab-detective', `เคสที่: ${currentCaseIndex + 1} | EXP: ${earnedExp}`);


  useEffect(() => {
    import('firebase/firestore').then(({ getDoc, doc }) => {
      getDoc(doc(db, 'game_content', 'lab_detective')).then(docSnap => {
        if (docSnap.exists() && docSnap.data().data?.length > 0) {
          setCases(docSnap.data().data);
        }
      }).catch(console.error);
    });
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
      setEarnedExp(prev => prev + 50);
      
      // Update Firebase if user is logged in
      if (appUser) {
        try {
          const userRef = doc(db, 'users', appUser.uid);
          await updateDoc(userRef, {
            exp: increment(50)
          });
        } catch (error) {
          console.error("Failed to update EXP:", error);
        }
      }
    } else {
      sfx.wrong();
    }
  };

  const handleNext = () => {
    if (currentCaseIndex < CASE_STUDIES.length - 1) {
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
            <p className="text-purple-400 font-mono text-sm uppercase tracking-widest mt-1">
              Lab Detective • Case {currentCaseIndex + 1}/{CASE_STUDIES.length}
            </p>
          </div>
        </div>
        
        <div className="glass px-6 py-2 rounded-full border-purple-500/30 flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="text-slate-400 font-mono text-sm uppercase">Earned EXP:</div>
          <div className="text-purple-400 font-black text-xl text-glow">+{earnedExp}</div>
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
                  {currentCase.symptoms.map((sym, i) => (
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
              {currentCase.choices.map((choice, idx) => {
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
