"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Map, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useLiveTracking } from '@/hooks/useLiveTracking';

const DEFAULT_SCENARIO = [
  {
    id: 1,
    text: "สัปดาห์ที่ 1: คุณเดินทางมาถึงฟาร์มสุกรแห่งหนึ่ง พบสุกรหลายตัวมีไข้สูง ซึม และมีรอยโรคที่ผิวหนังเป็นรูปสี่เหลี่ยมขนมเปียกปูน (Diamond-shaped skin lesions) สิ่งแรกที่คุณควรทำคืออะไร?",
    options: [
      { text: "ฉีดวัคซีนให้สุกรทุกตัวทันที", hpMod: -20, exp: 0, next: 2, feedback: "การฉีดวัคซีนให้สัตว์ที่กำลังป่วยเป็นอันตราย พวกเขาต้องการการรักษาก่อน" },
      { text: "กักบริเวณสุกรป่วยและเก็บตัวอย่างส่งตรวจ", hpMod: 10, exp: 20, next: 2, feedback: "ยอดเยี่ยมมาก การกักกันโรคช่วยป้องกันการแพร่กระจายระหว่างรอผลวินิจฉัย" },
      { text: "สั่งทำลาย (Cull) สุกรทั้งฝูงทันที", hpMod: -50, exp: 0, next: 2, feedback: "รุนแรงเกินไปสำหรับการกระทำแรกโดยที่ยังไม่มีผลวินิจฉัยยืนยัน!" }
    ]
  },
  {
    id: 2,
    text: "สัปดาห์ที่ 2: ผลแล็บยืนยันว่าเป็นโรค Swine Erysipelas (ไฟลามทุ่งในสุกร) เจ้าของฟาร์มตื่นตระหนกมากเพราะกลัวว่าจะติดต่อไปสู่คน คุณจะจัดการอย่างไร?",
    options: [
      { text: "บอกให้เขาสบายใจว่าโรคนี้ไม่ติดคน", hpMod: -30, exp: 0, next: 3, feedback: "ผิด! เชื้อ Erysipelothrix rhusiopathiae สามารถติดต่อสู่คนได้ (Zoonotic)" },
      { text: "ฉีด Penicillin ให้สุกรป่วย และให้คนงานสวมถุงมือป้องกัน", hpMod: 20, exp: 20, next: 3, feedback: "ถูกต้อง! ยา Penicillin ได้ผลดีมาก และอุปกรณ์ป้องกัน (PPE) จะช่วยปกป้องคนงาน" }
    ]
  },
  {
    id: 3,
    text: "สัปดาห์ที่ 3: อาการของสุกรที่ป่วยเริ่มดีขึ้น แต่คุณพบว่ามีลูกสุกรเกิดใหม่เริ่มมีอาการท้องเสียรุนแรงเป็นน้ำ (Watery Diarrhea) และตายอย่างรวดเร็ว คุณคิดว่าเป็นโรคอะไรแทรกซ้อน?",
    options: [
      { text: "Porcine Epidemic Diarrhea (PED)", hpMod: 20, exp: 20, next: 4, feedback: "ถูกต้อง! PEDV มักทำให้เกิดอาการท้องเสียรุนแรงและมีอัตราการตายสูงในลูกสุกร" },
      { text: "Classical Swine Fever (CSF)", hpMod: -15, exp: 0, next: 4, feedback: "CSF มักมีอาการไข้สูง มีจุดเลือดออกตามตัว มากกว่าท้องเสียเฉียบพลันในลูกสุกร" },
      { text: "Foot and Mouth Disease (FMD)", hpMod: -15, exp: 0, next: 4, feedback: "FMD จะมีตุ่มน้ำใสที่จมูกและกีบเท้า ไม่ใช่ท้องเสียรุนแรง" }
    ]
  },
  {
    id: 4,
    text: "สัปดาห์ที่ 4: การระบาดของ PEDV ทำให้ลูกสุกรตายไปกว่า 50% คุณจะใช้มาตรการใดเพื่อหยุดการระบาดในระยะสั้นที่สุด?",
    options: [
      { text: "ทำ Feedback (ป้อนลำไส้สุกรป่วยให้แม่สุกรอุ้มท้อง)", hpMod: 20, exp: 20, next: 5, feedback: "ถูกต้อง! เป็นวิธีสร้างภูมิคุ้มกันหมู่แบบรวดเร็ว (Lactogenic immunity) ให้กับลูกสุกรชุดถัดไป" },
      { text: "สั่งหยุดผสมพันธุ์แม่สุกร 6 เดือน", hpMod: -20, exp: 0, next: 5, feedback: "ทำให้ฟาร์มขาดรายได้รุนแรงเกินความจำเป็น" },
      { text: "ฉีดยาปฏิชีวนะให้ลูกสุกรทุกตัว", hpMod: -15, exp: 0, next: 5, feedback: "PEDV เป็นเชื้อไวรัส ยาปฏิชีวนะไม่สามารถฆ่าไวรัสได้" }
    ]
  },
  {
    id: 5,
    text: "สัปดาห์ที่ 5: การระบาดเริ่มสงบลง คุณจะแนะนำวิธีจัดการฟาร์มระยะยาวเพื่อไม่ให้เกิดโรคระบาดซ้ำได้อย่างไร?",
    options: [
      { text: "พ่นยาฆ่าเชื้อทุกวันโดยไม่ต้องทำความสะอาดคอก", hpMod: -20, exp: 0, next: 6, feedback: "สารอินทรีย์ (ขี้หมู) จะทำให้ยาฆ่าเชื้อหมดฤทธิ์ ต้องล้างก่อนเสมอ!" },
      { text: "ใช้ระบบ All-in All-out และเพิ่ม Biosecurity", hpMod: 20, exp: 20, next: 6, feedback: "สมบูรณ์แบบ! การตัดวงจรโรคและการป้องกันเชื้อเข้าฟาร์มคือหัวใจหลัก" }
    ]
  }
];

export default function OutbreakSim() {
  const { user, appUser } = useAuth();
  
  const [scenario, setScenario] = useState<any[]>(DEFAULT_SCENARIO);
  const [step, setStep] = useState(0);
  const [farmHp, setFarmHp] = useState(80);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string, type: 'good'|'bad' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useLiveTracking('outbreak', step >= scenario.length ? `จบซิมูเลชัน | คะแนน: ${score}` : `สถานการณ์ที่: ${step + 1} | Farm HP: ${farmHp} | คะแนน: ${score}`);


  useEffect(() => {
    import('firebase/firestore').then(({ getDoc, doc }) => {
      getDoc(doc(db, 'game_content', 'outbreak')).then(docSnap => {
        if (docSnap.exists() && docSnap.data().data?.length > 0) {
          setScenario(docSnap.data().data);
        }
      }).catch(console.error);
    });
  }, []);
  
  const currentScenario = scenario[step];
  const gameOver = step >= scenario.length || farmHp <= 0;

  const handleChoice = (opt: any) => {
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
      if (nextStep >= scenario.length || Math.min(100, Math.max(0, farmHp + opt.hpMod)) <= 0) {
        handleGameOver(score + (isGood ? opt.exp : 0));
      }
    }, 4000);
  };

  const handleGameOver = async (finalScore: number) => {
    if (user && appUser && !isSaving && finalScore > 0) {
      setIsSaving(true);
      try {
        const myUid = appUser.uid || user.uid;
        await updateDoc(doc(db, 'users', myUid), {
          exp: increment(finalScore)
        });
        
        const { addDoc, collection } = await import('firebase/firestore');
        await addDoc(collection(db, 'users', myUid, 'history'), {
          gameId: 'outbreak',
          gameName: 'Outbreak Simulator',
          score: finalScore,
          expEarned: finalScore,
          playedAt: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to save EXP:", e);
      }
    }
  };

  if (gameOver) {
    const isVictory = farmHp > 0;
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-20 px-2">
        <motion.div 
          initial={{ scale: 0 }} 
          animate={{ scale: 1 }} 
          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 border border-4 ${isVictory ? 'bg-secondary/20 text-secondary border-secondary shadow-[0_0_30px_rgba(16,185,129,0.3)]' : 'bg-danger/20 text-danger border-danger shadow-[0_0_30px_rgba(239,68,68,0.3)]'}`}
        >
          {isVictory ? <ShieldCheck className="w-16 h-16" /> : <AlertTriangle className="w-16 h-16" />}
        </motion.div>
        <h1 className={`text-4xl font-black text-glow uppercase ${isVictory ? 'text-secondary' : 'text-danger'}`}>
          {isVictory ? 'ควบคุมการระบาดสำเร็จ' : 'ฟาร์มล่มสลาย'}
        </h1>
        <p className="text-xl text-slate-400 font-mono">
          {isVictory ? `คุณจัดการวิกฤตินี้ได้อย่างยอดเยี่ยม ได้รับ ${score} EXP.` : `โรคระบาดลุกลามจนควบคุมไม่ได้ (ได้รับ ${score} EXP)`}
        </p>
        <div className="flex justify-center gap-4 pt-8">
          <Button onClick={() => window.location.reload()} size="lg" className="font-bold uppercase tracking-widest bg-secondary text-black hover:bg-secondary/80">
            จำลองสถานการณ์ใหม่
          </Button>
          <Link href="/student/play">
            <Button variant="outline" size="lg" className="font-bold uppercase tracking-widest text-white border-slate-700 hover:bg-slate-800">
              กลับสู่ฐาน
            </Button>
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
            <ArrowLeft className="w-5 h-5 text-white" />
          </Button>
        </Link>
        <div className="font-bold text-accent text-glow-accent flex items-center gap-2 tracking-widest uppercase">
          <Map className="w-5 h-5 animate-pulse" /> Outbreak Simulator
        </div>
        <div className="font-black text-primary text-xl">{score} EXP</div>
      </div>

      {/* Farm Health HUD */}
      <Card className="p-4 glass-neon border-primary/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className={`w-6 h-6 ${farmHp > 50 ? 'text-secondary' : 'text-danger animate-pulse'}`} />
          <span className="font-bold text-white tracking-widest uppercase">Farm Integrity</span>
        </div>
        <div className="w-1/2 bg-slate-900 rounded-full h-4 border border-slate-700 relative overflow-hidden">
          <motion.div 
            className={`absolute top-0 bottom-0 left-0 ${farmHp > 50 ? 'bg-secondary' : farmHp > 20 ? 'bg-orange-500' : 'bg-danger'}`}
            animate={{ width: `${farmHp}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="font-mono font-bold w-12 text-right text-white">{farmHp}%</div>
      </Card>

      <AnimatePresence mode="wait">
        {!feedback ? (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -50 }}
          >
            <Card className="p-8 glass shadow-2xl border-slate-800 relative overflow-hidden">
              <div className="scanlines" />
              <div className="relative z-10">
                <h2 className="text-xl md:text-2xl font-medium text-white mb-8 leading-relaxed font-mono">
                  {">"} {currentScenario.text}
                  <motion.span 
                    animate={{ opacity: [0, 1, 0] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }}
                  >_</motion.span>
                </h2>

                <div className="space-y-4">
                  {currentScenario.options.map((opt, idx) => (
                    <Button
                      key={idx}
                      variant="ghost"
                      className="w-full justify-start text-left h-auto py-4 px-6 border-2 border-slate-800 text-slate-300 hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                      onClick={() => handleChoice(opt)}
                    >
                      <span className="text-primary mr-3 font-mono">[{idx + 1}]</span> 
                      <span className="whitespace-normal leading-relaxed">{opt.text}</span>
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
            className={`p-8 rounded-2xl border-2 text-center shadow-xl ${feedback?.type === 'good' ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-danger/10 border-danger text-danger'}`}
          >
            <h3 className="text-2xl font-black mb-4 uppercase tracking-widest">
              {feedback?.type === 'good' ? 'SYSTEM OPTIMAL' : 'CRITICAL ERROR'}
            </h3>
            <p className="text-lg font-mono text-white/90">{feedback?.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
