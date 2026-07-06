"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Shield, Sword, Heart, ArrowLeft, Swords } from 'lucide-react';
import Link from 'next/link';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useLiveTracking } from '@/hooks/useLiveTracking';

// Thai Localized Data for Boss Battle
const BOSSES = [
  {
    name: "Rabies Virus (Lyssavirus)",
    maxHp: 100,
    virusType: 'rabies',
    glow: 'rgba(239, 68, 68, 0.6)',
    questions: [
      {
        q: "รูปร่างที่คลาสสิกที่สุดของไวรัสพิษสุนัขบ้า (Rabies) เมื่อดูผ่านกล้องจุลทรรศน์อิเล็กตรอนคืออะไร?",
        choices: ["รูปร่างยี่สิบหน้า (Icosahedral)", "รูปร่างคล้ายกระสุนปืน (Bullet-shaped)", "รูปร่างทรงกลม (Spherical)", "รูปร่างคล้ายเส้นด้าย (Filamentous)"],
        answer: "รูปร่างคล้ายกระสุนปืน (Bullet-shaped)",
        damage: 40
      },
      {
        q: "ข้อใดต่อไปนี้ ไม่ใช่ เส้นทางการแพร่กระจายโดยทั่วไปของโรคพิษสุนัขบ้า?",
        choices: ["โดนสัตว์ที่ติดเชื้อกัด", "สูดดมละอองฝอยในถ้ำค้างคาว", "โดนยุงกัด", "การปลูกถ่ายอวัยวะ (หายากมาก)"],
        answer: "โดนยุงกัด",
        damage: 30
      },
      {
        q: "Inclusion bodies ใดที่พบในเซลล์ประสาทและเป็นลักษณะเฉพาะเจาะจง (pathognomonic) ของโรคพิษสุนัขบ้า?",
        choices: ["Negri bodies", "Guarnieri bodies", "Cowdry Type A", "Bollinger bodies"],
        answer: "Negri bodies",
        damage: 30
      }
    ]
  },
  {
    name: "PEDV (Porcine Epidemic Diarrhea Virus)",
    maxHp: 150,
    virusType: 'corona',
    glow: 'rgba(234, 179, 8, 0.6)',
    questions: [
      { q: "PEDV จัดอยู่ในกลุ่มไวรัสชนิดใด?", choices: ["Alphacoronavirus", "Betacoronavirus", "Gammacoronavirus", "Deltacoronavirus"], answer: "Alphacoronavirus", damage: 40 },
      { q: "อาการทางคลินิกที่เด่นชัดที่สุดของ PEDV ในลูกสุกรแรกเกิดคืออะไร?", choices: ["ไอและหอบรุนแรง", "ท้องเสียเป็นน้ำรุนแรงและอาเจียน", "มีตุ่มน้ำใสตามผิวหนัง", "แท้งลูกในช่วงท้ายของการตั้งท้อง"], answer: "ท้องเสียเป็นน้ำรุนแรงและอาเจียน", damage: 40 },
      { q: "การจัดการใดมีประสิทธิภาพสูงสุดในการหยุดการระบาดของ PEDV ในระยะสั้น?", choices: ["การทำ Feedback ให้แม่สุกร", "การฉีดยาปฏิชีวนะให้ลูกสุกร", "การให้วิตามินซีผสมน้ำ", "การเพิ่มอุณหภูมิในโรงเรือน"], answer: "การทำ Feedback ให้แม่สุกร", damage: 40 },
      { q: "เซลล์เป้าหมายหลักของเชื้อ PEDV ในร่างกายสุกรคือเซลล์ใด?", choices: ["Macrophage ในปอด", "Enterocyte ในลำไส้เล็ก", "Neuron ในสมอง", "Hepatocyte ในตับ"], answer: "Enterocyte ในลำไส้เล็ก", damage: 30 }
    ]
  },
  {
    name: "FMD (Foot and Mouth Disease Virus)",
    maxHp: 200,
    virusType: 'picorna',
    glow: 'rgba(168, 85, 247, 0.6)',
    questions: [
      { q: "FMD จัดอยู่ในแฟมิลี (Family) ใด?", choices: ["Picornaviridae", "Flaviviridae", "Coronaviridae", "Paramyxoviridae"], answer: "Picornaviridae", damage: 40 },
      { q: "รอยโรคเฉพาะของโรค FMD ที่พบในโคคืออะไร?", choices: ["จุดเลือดออกที่ไต (Turkey egg kidney)", "ตุ่มน้ำใส (Vesicle) ที่ริมฝีปากและไรกีบ", "ต่อมน้ำเหลืองโตทั่วร่างกาย", "เยื่อบุตาอักเสบรุนแรง"], answer: "ตุ่มน้ำใส (Vesicle) ที่ริมฝีปากและไรกีบ", damage: 40 },
      { q: "สัตว์ชนิดใดสามารถเป็นพาหะอมโรค (Carrier) ของเชื้อ FMD ได้นานที่สุด?", choices: ["สุกร", "โค", "ควาย", "ม้า"], answer: "ควาย", damage: 40 },
      { q: "การเก็บตัวอย่างเพื่อส่งตรวจ FMD ที่ดีที่สุดคือข้อใด?", choices: ["เลือดครบส่วน", "ผนังของตุ่มน้ำใส (Epithelium) ที่เพิ่งแตก", "อุจจาระ", "น้ำเชื้อ"], answer: "ผนังของตุ่มน้ำใส (Epithelium) ที่เพิ่งแตก", damage: 40 },
      { q: "FMD Serotype ใดที่ ไม่พบ การระบาดในประเทศไทย?", choices: ["O", "A", "Asia 1", "SAT 1"], answer: "SAT 1", damage: 40 }
    ]
  }
];

const PLAYER_MAX_HP = 100;

export default function BossBattle() {
  const { appUser } = useAuth();
  const [currentBossIndex, setCurrentBossIndex] = useState(0);
  const currentBoss = BOSSES[currentBossIndex];
  
  const [questions, setQuestions] = useState(() => [...currentBoss.questions].sort(() => Math.random() - 0.5));
  const [bossHp, setBossHp] = useState(currentBoss.maxHp);
  const [playerHp, setPlayerHp] = useState(PLAYER_MAX_HP);
  const [currentQ, setCurrentQ] = useState(0);
  const [battleState, setBattleState] = useState<'idle' | 'attacking' | 'damaged' | 'victory' | 'defeat' | 'transitioning'>('idle');
  const [damageText, setDamageText] = useState<{value: number, type: 'boss' | 'player'} | null>(null);

  useLiveTracking('boss-battle', `ด่าน: ${currentBossIndex + 1}/${BOSSES.length} | เลือดบอส: ${bossHp}/${currentBoss.maxHp} | เลือดผู้เล่น: ${playerHp}/${PLAYER_MAX_HP}`);
  
  const question = questions[currentQ] || questions[questions.length - 1];

  const handleAnswer = async (choice: string) => {
    if (battleState !== 'idle') return;

    const isCorrect = choice === question.answer;

    if (isCorrect) {
      setBattleState('attacking');
      sfx.attack();
      setDamageText({ value: question.damage, type: 'boss' });
      
      setTimeout(async () => {
        const newBossHp = Math.max(0, bossHp - question.damage);
        setBossHp(newBossHp);
        setBattleState('idle');
        setDamageText(null);
        
        if (newBossHp <= 0) {
          if (currentBossIndex < BOSSES.length - 1) {
            // Transition to next boss
            setBattleState('transitioning');
            sfx.correct();
            setTimeout(() => {
              const nextBoss = BOSSES[currentBossIndex + 1];
              setCurrentBossIndex(prev => prev + 1);
              setBossHp(nextBoss.maxHp);
              setQuestions([...nextBoss.questions].sort(() => Math.random() - 0.5));
              setCurrentQ(0);
              setBattleState('idle');
            }, 3000); // 3 seconds transition
          } else {
            // Final victory
            setTimeout(() => setBattleState('victory'), 500);
            sfx.correct();
            // Award 500 EXP on complete victory
            if (appUser) {
              try {
                await updateDoc(doc(db, 'users', appUser.uid), {
                  exp: increment(500),
                });
                const { addDoc, collection } = await import('firebase/firestore');
                await addDoc(collection(db, 'users', appUser.uid, 'history'), {
                  gameId: 'boss-battle',
                  gameName: 'Boss Battle (All Stages)',
                  score: 500,
                  expEarned: 500,
                  playedAt: new Date().toISOString()
                });
              } catch (e) {
                console.error('Failed to save EXP:', e);
              }
            }
          }
        } else {
          setCurrentQ(prev => prev + 1);
        }
      }, 1000);
    } else {
      setBattleState('damaged');
      sfx.damage();
      setDamageText({ value: 20, type: 'player' });
      
      setTimeout(() => {
        setPlayerHp(prev => Math.max(0, prev - 20));
        setBattleState('idle');
        setDamageText(null);
        
        if (playerHp - 20 <= 0) {
          setTimeout(() => setBattleState('defeat'), 500);
          sfx.wrong();
        }
      }, 1000);
    }
  };

  const HealthBar = ({ hp, maxHp, color, label, isRight = false }: any) => {
    const percentage = (hp / maxHp) * 100;
    return (
      <div className={`w-full max-w-[200px] ${isRight ? 'text-right' : 'text-left'}`}>
        <div className="flex justify-between text-xs md:text-sm font-bold mb-1 px-1 text-slate-300 tracking-wider">
          <span className="uppercase">{label}</span>
          <span className="font-mono">{hp}/{maxHp}</span>
        </div>
        <div className="h-4 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
          <motion.div 
            className={`absolute top-0 bottom-0 left-0 ${color}`}
            initial={{ width: '100%' }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  };

  if (battleState === 'victory' || battleState === 'defeat' || battleState === 'transitioning') {
    const isVictory = battleState === 'victory';
    const isTransitioning = battleState === 'transitioning';
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 py-20 px-2">
        <motion.div 
          initial={{ scale: 0, rotate: -180 }} 
          animate={{ scale: 1, rotate: 0 }} 
          className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-8 border ${isVictory ? 'bg-secondary/20 text-secondary border-secondary shadow-[0_0_30px_rgba(16,185,129,0.3)]' : isTransitioning ? 'bg-orange-500/20 text-orange-500 border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.3)]' : 'bg-danger/20 text-danger border-danger shadow-[0_0_30px_rgba(239,68,68,0.3)]'}`}
        >
          {isVictory ? <Sword className="w-16 h-16" /> : isTransitioning ? <Shield className="w-16 h-16 animate-pulse" /> : <Heart className="w-16 h-16 line-through opacity-50" />}
        </motion.div>
        <h1 className={`text-4xl font-black uppercase ${isVictory ? 'text-glow-accent text-secondary' : isTransitioning ? 'text-glow text-orange-500 animate-pulse' : 'text-danger'}`}>
          {isVictory ? 'MISSION COMPLETED!' : isTransitioning ? 'WARNING: NEW THREAT DETECTED' : 'ภารกิจล้มเหลว...'}
        </h1>
        <p className="text-xl text-slate-400 font-mono">
          {isVictory ? 'คุณได้กำจัดบอสทั้งหมดสำเร็จ รับโบนัส +500 EXP!' : isTransitioning ? 'เตรียมพร้อมรับมือบอสตัวถัดไป...' : 'ระบบภูมิคุ้มกันของคุณถูกทำลาย'}
        </p>
        {!isTransitioning && (
          <div className="flex justify-center gap-4 pt-8">
            <Button onClick={() => window.location.reload()} size="lg" className="font-bold uppercase tracking-widest">
              {isVictory ? 'เล่นอีกครั้ง' : 'พยายามใหม่'}
            </Button>
            <Link href="/student/play">
              <Button variant="secondary" size="lg" className="font-bold uppercase tracking-widest">กลับสู่ฐาน</Button>
            </Link>
          </div>
        )}
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
        <div className="font-bold text-danger text-glow flex items-center gap-2">
          <Swords className="w-5 h-5 animate-pulse" /> BOSS BATTLE
        </div>
        <div className="font-black text-danger text-xl">Lvl MAX</div>
      </div>

      {/* Battle Arena */}
      <Card className="p-4 md:p-8 glass-danger relative overflow-hidden h-[350px] flex items-center justify-between bg-black/60 border-danger/40">
        <div className="scanlines" />
        
        {/* Player Sprite */}
        <div className="flex flex-col items-center relative z-10 w-1/3">
          <HealthBar hp={playerHp} maxHp={PLAYER_MAX_HP} color="bg-secondary shadow-[0_0_10px_rgba(16,185,129,0.8)]" label="Player" />
          <motion.div 
            className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-br from-secondary to-green-900 border-2 border-secondary rounded-xl mt-6 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            animate={{ 
              x: battleState === 'attacking' ? [0, 80, 0] : 0,
              opacity: battleState === 'damaged' ? [1, 0, 1, 0, 1] : 1,
              scale: battleState === 'attacking' ? [1, 1.2, 1] : 1,
              filter: battleState === 'damaged' ? ['brightness(1)', 'brightness(3) drop-shadow(0 0 20px red)', 'brightness(1)'] : 'brightness(1)'
            }}
            transition={{ duration: 0.5 }}
          >
            <Shield className="w-10 h-10 md:w-12 md:h-12 text-white" />
          </motion.div>
          {damageText?.type === 'player' && (
            <motion.div 
              initial={{ opacity: 1, y: -20, scale: 1.5 }}
              animate={{ opacity: 0, y: -60 }}
              className="absolute font-black text-3xl text-danger mt-12 drop-shadow-md text-glow"
            >
              -{damageText.value}
            </motion.div>
          )}
        </div>

        <div className="text-3xl md:text-5xl font-black text-danger italic px-4 opacity-30 animate-pulse text-glow z-10">VS</div>

        {/* Boss Sprite */}
        <div className="flex flex-col items-center relative z-10 w-1/3">
          <HealthBar hp={bossHp} maxHp={currentBoss.maxHp} color="bg-danger shadow-[0_0_10px_rgba(239,68,68,0.8)]" label="Boss" isRight />
          <motion.div 
            className="mt-2 flex items-center justify-center"
            animate={{ 
              y: battleState === 'idle' ? [0, -10, 0] : 0,
              opacity: battleState === 'attacking' ? [1, 0, 1, 0, 1] : 1,
              scale: battleState === 'attacking' ? [1, 0.9, 1] : 1,
              filter: battleState === 'attacking' ? ['brightness(1)', 'brightness(3) drop-shadow(0 0 20px white)', 'brightness(1)'] : 'brightness(1)'
            }}
            transition={{ duration: battleState === 'idle' ? 3 : 0.5, repeat: battleState === 'idle' ? Infinity : 0, ease: "easeInOut" }}
          >
            {/* Call the new SVGVirus component here */}
            <SVGVirus type={currentBoss.virusType as any} className="w-28 h-28 md:w-36 md:h-36 text-danger" glowColor={currentBoss.glow} />
          </motion.div>
          
          <div className="text-danger font-mono text-xs md:text-sm tracking-widest uppercase mt-2 opacity-90 text-center font-bold">
            {currentBoss.name}
          </div>

          {damageText?.type === 'boss' && (
            <motion.div 
              initial={{ opacity: 1, y: -20, scale: 1.5 }}
              animate={{ opacity: 0, y: -60 }}
              className="absolute font-black text-3xl text-white mt-12 drop-shadow-md text-glow"
            >
              -{damageText.value}
            </motion.div>
          )}
        </div>
      </Card>

      {/* Question Panel */}
      <Card className="p-6 md:p-8 glass border-slate-800">
        <h2 className="text-xl md:text-2xl font-bold text-white mb-6 leading-relaxed">
          {question.q}
        </h2>
        <div className="grid grid-cols-1 gap-4">
          {question.choices.map((choice) => (
            <Button
              key={choice}
              variant="ghost"
              className="border-2 border-slate-800 text-slate-300 hover:border-primary/50 hover:bg-primary/10 text-left justify-start py-4 h-auto whitespace-normal font-bold"
              onClick={() => {
                sfx.click();
                handleAnswer(choice);
              }}
              disabled={battleState !== 'idle'}
            >
              {choice}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
