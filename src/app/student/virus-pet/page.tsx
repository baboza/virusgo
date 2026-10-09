"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Crosshair, Target, Moon, ArrowLeft, Loader2, Star, 
  ShieldAlert, Box, Heart, Swords, Clock, Sparkles, BookOpen, 
  Edit3, Check, Stethoscope, ChevronRight, HelpCircle
} from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useAuth } from '@/contexts/AuthContext';
import { getViruses, getVirus } from '@/lib/firebase/virusService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import { VirusPetData, Virus } from '@/types';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-xs">Loading 3D...</div>
});

// Fallback questions for Emergency Ward Recovery
const RECOVERY_QUESTIONS = [
  {
    q: "โครงสร้างใดของไวรัสที่ทำหน้าที่จับกับ receptor บนผิวเซลล์โฮสต์?",
    choices: ["Capsid / Envelope glycoprotein", "Nucleic acid", "Matrix protein", "Lipid bilayer"],
    ans: 0,
    hint: "ไกลโคโปรตีนบนเปลือกหุ้มมีบทบาทสำคัญในการ attachment"
  },
  {
    q: "Negri bodies เป็นลักษณะทางพยาธิสภาพเฉพาะ (Pathognomonic lesion) ของไวรัสชนิดใด?",
    choices: ["Canine Distemper Virus", "Rabies Virus", "Feline Panleukopenia", "Canine Parvovirus"],
    ans: 1,
    hint: "พบในเซลล์สมอง เช่น Purkinje cells และ Pyramidal cells"
  },
  {
    q: "ไวรัสชนิดใดต่อไปนี้มีสารพันธุกรรมเป็น Single-stranded DNA (ssDNA)?",
    choices: ["Parvovirus", "Coronavirus", "Retrovirus", "Herpesvirus"],
    ans: 0,
    hint: "เป็นไวรัสขนาดเล็กมาก ไม่มีเปลือกหุ้ม ทนทานต่อสิ่งแวดล้อมสูง"
  },
  {
    q: "ไวรัสโรคพิษสุนัขบ้า (Rabies virus) จัดอยู่ในตระกูล (Family) ใด?",
    choices: ["Rhabdoviridae", "Flaviviridae", "Picornaviridae", "Paramyxoviridae"],
    ans: 0,
    hint: "มีรูปทรงกระสุนปืน (Bullet-shaped)"
  },
  {
    q: "โรค Feline Infectious Peritonitis (FIP) เกิดจากการกลายพันธุ์ของเชื้อไวรัสใด?",
    choices: ["Feline Panleukopenia Virus", "Feline Coronavirus (FCoV)", "Feline Calicivirus", "FeLV"],
    ans: 1,
    hint: "Enteric Coronavirus กลายพันธุ์เข้าติดเชื้อใน Macrophages"
  }
];

export default function VirusPet() {
  const { appUser } = useAuth();
  const [pet, setPet] = useState<VirusPetData | null>(null);
  const [virusInfo, setVirusInfo] = useState<Virus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionAnim, setActionAnim] = useState<string | null>(null);
  const [sick, setSick] = useState(false);
  const [penaltyNotice, setPenaltyNotice] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(true);

  // Nickname Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState<'stats' | 'dossier' | 'ward'>('stats');

  // Emergency Recovery Ward State
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [wardResult, setWardResult] = useState<'correct' | 'wrong' | null>(null);
  const [treating, setTreating] = useState(false);

  useEffect(() => {
    if (!appUser) return;
    
    // Check if user is Virus Hunter (EXP >= 1000)
    if ((appUser.exp || 0) < 1000) {
      window.location.href = '/student';
      return;
    }

    const loadPet = async () => {
      try {
        const petRef = doc(db, 'users', appUser.uid);
        const userDoc = await getDoc(petRef);
        
        let petData = userDoc.data()?.pet as VirusPetData | undefined;

        if (!petData) {
          // Initialize random pet
          const viruses = await getViruses();
          if (viruses.length > 0) {
            const randomVirus = viruses[Math.floor(Math.random() * viruses.length)];
            petData = {
              virusID: randomVirus.virusID,
              virusName: randomVirus.virusName,
              family: randomVirus.family,
              nickname: randomVirus.virusName,
              hunger: 50,
              happiness: 50,
              energy: 100,
              currentHp: 120,
              maxHp: 120,
              isInjured: false,
              stage: 1,
              careCount: 0,
              lastUpdate: new Date().toISOString(),
              stats: { str: 1, vit: 1, agi: 1, dex: 1, spentPoints: 0 }
            };
            await updateDoc(petRef, { pet: petData });
          }
        }

        if (petData) {
          // Initialize stats if missing (for existing players)
          if (!petData.stats) {
            petData.stats = { str: 1, vit: 1, agi: 1, dex: 1, spentPoints: 0 };
          }
          if (petData.currentHp === undefined) {
            const calculatedMaxHp = 100 + (petData.stats.vit * 20);
            petData.currentHp = calculatedMaxHp;
            petData.maxHp = calculatedMaxHp;
          }
          if (!petData.nickname) {
            petData.nickname = petData.virusName;
          }
          
          // Calculate time decay
          const lastDate = new Date(petData.lastUpdate);
          const now = new Date();
          const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

          if (diffHours > 0.5) {
            const decay = Math.floor(diffHours * 5);
            petData.hunger = Math.max(0, petData.hunger - decay);
            petData.happiness = Math.max(0, petData.happiness - decay);
            petData.energy = Math.max(0, petData.energy - Math.floor(decay / 2));

            // Stat penalty if critically neglected (>12h)
            if (petData.hunger < 20 || petData.happiness < 20 || petData.energy < 10) {
              const penaltyCount = Math.min(Math.floor(diffHours / 12), 2);
              if (penaltyCount > 0 && petData.stats) {
                type StatKey = 'str' | 'vit' | 'agi' | 'dex';
                const keys: StatKey[] = ['str', 'vit', 'agi', 'dex'];
                const lost: string[] = [];
                for (let i = 0; i < penaltyCount; i++) {
                  const k = keys[Math.floor(Math.random() * 4)];
                  if (petData.stats[k] > 1) {
                    petData.stats[k]--;
                    lost.push(k.toUpperCase());
                  }
                }
                if (lost.length > 0) {
                  setPenaltyNotice(`⚠️ สัตว์เลี้ยงขาดการดูแล! ค่า ${lost.join(', ')} ลดลง`);
                }
              }
            }

            petData.lastUpdate = now.toISOString();
            await updateDoc(petRef, { pet: petData });
          }

          setPet(petData);
          setNicknameInput(petData.nickname || petData.virusName);
          checkSick(petData);

          // Fetch virus details for Virology Dossier
          if (petData.virusID) {
            const vData = await getVirus(petData.virusID);
            if (vData) setVirusInfo(vData);
          }
        }
      } catch (e) {
        console.error("Failed to load pet", e);
      } finally {
        setLoading(false);
      }
    };

    loadPet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appUser]);

  const checkSick = (p: VirusPetData) => {
    if (p.hunger < 20 || p.happiness < 20 || p.energy < 10 || p.isInjured) {
      setSick(true);
    } else {
      setSick(false);
    }
  };

  const handleAction = async (type: 'feed' | 'play' | 'sleep') => {
    if (!pet || !appUser) return;
    
    sfx.click();
    setActionAnim(type);
    
    const newPet = { ...pet };
    if (type === 'feed') {
      newPet.hunger = Math.min(100, newPet.hunger + 30);
    } else if (type === 'play') {
      newPet.happiness = Math.min(100, newPet.happiness + 30);
      newPet.energy = Math.max(0, newPet.energy - 10);
    } else if (type === 'sleep') {
      newPet.energy = Math.min(100, newPet.energy + 40);
    }

    newPet.careCount += 1;
    
    // Growth logic
    if (newPet.stage === 1 && newPet.careCount >= 5) {
      newPet.stage = 2;
      sfx.correct();
    } else if (newPet.stage === 2 && newPet.careCount >= 15) {
      newPet.stage = 3;
      sfx.correct();
    }

    newPet.lastUpdate = new Date().toISOString();
    
    setPet(newPet);
    checkSick(newPet);

    try {
      await updateDoc(doc(db, 'users', appUser.uid), { pet: newPet });
    } catch (e) {
      console.error("Failed to save action", e);
    }

    setTimeout(() => {
      setActionAnim(null);
    }, 1500);
  };

  // Nickname Save Handler
  const handleSaveNickname = async () => {
    if (!pet || !appUser || !nicknameInput.trim()) return;
    setSavingName(true);
    try {
      const trimmed = nicknameInput.trim().slice(0, 20);
      const updatedPet = { ...pet, nickname: trimmed };
      await updateDoc(doc(db, 'users', appUser.uid), {
        'pet.nickname': trimmed,
      });
      setPet(updatedPet);
      setIsEditingName(false);
      sfx.correct();
    } catch (err) {
      console.error("Failed to update nickname:", err);
    } finally {
      setSavingName(false);
    }
  };

  // Stat Calculations
  const str = pet?.stats?.str || 1;
  const vit = pet?.stats?.vit || 1;
  const agi = pet?.stats?.agi || 1;
  const dex = pet?.stats?.dex || 1;

  const maxHp = 100 + (vit * 20);
  const atkDmg = 20 + (str * 10);
  const quizTime = 15 + (agi * 2);
  const critRate = Math.min(75, dex * 5);
  const combatPower = Math.floor((maxHp * 1.2) + (atkDmg * 2.5) + (critRate * 10) + (quizTime * 5));

  const totalPoints = Math.floor((appUser?.exp || 0) / 100);
  const spentPoints = pet?.stats?.spentPoints || 0;
  const availablePoints = Math.max(0, totalPoints - spentPoints);

  const handleUpgradeStat = async (stat: 'str' | 'vit' | 'agi' | 'dex') => {
    if (!pet || !pet.stats || availablePoints <= 0 || !appUser) return;
    sfx.click();
    
    const newStats = { ...pet.stats, [stat]: pet.stats[stat] + 1, spentPoints: pet.stats.spentPoints + 1 };
    const newMaxHp = 100 + (newStats.vit * 20);
    const newPet = { 
      ...pet, 
      stats: newStats, 
      maxHp: newMaxHp,
      currentHp: pet.currentHp ? Math.min(newMaxHp, pet.currentHp + 20) : newMaxHp 
    };
    setPet(newPet);
    
    try {
      await updateDoc(doc(db, 'users', appUser.uid), { pet: newPet });
    } catch (e) {
      console.error("Failed to upgrade stat", e);
    }
  };

  // Emergency Recovery Ward Quiz Handler
  const handleAnswerRecovery = async (choiceIdx: number) => {
    if (!pet || !appUser || treating) return;
    setSelectedChoice(choiceIdx);
    setTreating(true);

    const currentQ = RECOVERY_QUESTIONS[quizIdx % RECOVERY_QUESTIONS.length];
    const isCorrect = choiceIdx === currentQ.ans;

    if (isCorrect) {
      sfx.correct();
      setWardResult('correct');
      // Full HP recovery & remove injury
      const updatedPet: VirusPetData = {
        ...pet,
        currentHp: maxHp,
        isInjured: false,
        energy: Math.min(100, pet.energy + 50),
        hunger: Math.min(100, pet.hunger + 30),
      };
      setPet(updatedPet);
      checkSick(updatedPet);
      await updateDoc(doc(db, 'users', appUser.uid), {
        'pet.currentHp': maxHp,
        'pet.isInjured': false,
        'pet.energy': updatedPet.energy,
        'pet.hunger': updatedPet.hunger,
      });
    } else {
      sfx.wrong();
      setWardResult('wrong');
      // Partial HP recovery (50%)
      const partialHp = Math.floor(maxHp * 0.5);
      const updatedPet: VirusPetData = {
        ...pet,
        currentHp: partialHp,
        isInjured: false,
      };
      setPet(updatedPet);
      checkSick(updatedPet);
      await updateDoc(doc(db, 'users', appUser.uid), {
        'pet.currentHp': partialHp,
        'pet.isInjured': false,
      });
    }

    setTimeout(() => {
      setSelectedChoice(null);
      setWardResult(null);
      setTreating(false);
      setQuizIdx((prev) => (prev + 1) % RECOVERY_QUESTIONS.length);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="text-center py-20 text-slate-400">
        Failed to incubate virus. No data found.
      </div>
    );
  }

  const getPetScale = () => {
    if (pet.stage === 1) return 'scale-[0.4] opacity-80 blur-[2px] contrast-200 sepia-[0.3]';
    if (pet.stage === 2) return 'scale-[0.7] opacity-90 sepia-[0.1]';
    return 'scale-100';
  };

  const isInjuredFromBattle = pet.isInjured || (pet.currentHp !== undefined && pet.currentHp <= 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 z-10 relative pb-10">
      
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-900/80 p-4 rounded-2xl border border-slate-800 gap-3 backdrop-blur-md">
        <Link href="/student">
          <Button variant="secondary" className="font-bold">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้าหลัก
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/student/empire">
            <Button className="font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center gap-2 active:scale-95">
              <Swords className="w-4 h-4" />
              <span>นำไวรัสออกรบ (Empire)</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Injury Banner Alert */}
      {isInjuredFromBattle && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-950/80 border-2 border-red-500/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_25px_rgba(239,68,68,0.3)] animate-pulse"
        >
          <div className="flex items-center gap-3 text-red-200">
            <ShieldAlert className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <div className="font-black text-base text-red-100">🚨 ไวรัสของคุณบาดเจ็บสาหัสจากการรบใน Empire!</div>
              <div className="text-xs text-red-300">พลังชีวิตเหลือ 0 ไม่สามารถออกรบได้ กรุณาไปที่ &quot;คลินิกฟื้นฟู&quot; ด้านล่างเพื่อทำการรักษา</div>
            </div>
          </div>
          <Button 
            onClick={() => setActiveTab('ward')}
            className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase px-4 py-2 shrink-0 shadow-lg"
          >
            💉 รักษาด่วน
          </Button>
        </motion.div>
      )}

      {/* Neglect Penalty Notice */}
      <AnimatePresence>
        {penaltyNotice && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-red-900/30 border border-red-500/50 p-4 rounded-xl flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.2)]"
          >
            <div className="flex items-center gap-3 text-red-200">
              <ShieldAlert className="w-6 h-6 text-red-400 shrink-0" />
              <span className="font-bold text-sm">{penaltyNotice}</span>
            </div>
            <Button variant="secondary" onClick={() => setPenaltyNotice(null)} className="h-8 text-xs font-bold bg-slate-800 hover:bg-slate-700 shrink-0 ml-4">
              รับทราบ
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main Pet Display & Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Column: Pet Glass Chamber */}
        <Card className="p-6 glass-neon border-purple-500/40 relative overflow-hidden text-center min-h-[460px] flex flex-col items-center justify-between shadow-[0_0_40px_rgba(168,85,247,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-black/60 pointer-events-none" />
          <div className="scanlines opacity-50" />
          
          {/* Pet Name, Nickname & Stage */}
          <div className="absolute top-4 w-full left-0 z-10 px-6 flex justify-between items-start">
            <div className="text-left max-w-[65%]">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    maxLength={20}
                    placeholder="ตั้งชื่อเล่น..."
                    className="bg-slate-900/90 border border-purple-500 rounded-lg px-2.5 py-1 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-400 w-36 sm:w-44"
                  />
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={handleSaveNickname}
                    className="p-1 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    title="บันทึกชื่อ"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNicknameInput(pet.nickname || pet.virusName);
                    }}
                    className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                    title="ยกเลิก"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-black text-white text-glow-accent truncate">
                    {pet.nickname || pet.virusName}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded-md text-purple-400 hover:text-white hover:bg-purple-900/40 transition-colors"
                    title="เปลี่ยนชื่อเล่น"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <p className="text-[10px] md:text-xs text-purple-300 font-mono tracking-widest uppercase">
                {pet.virusName} ({pet.family})
              </p>
            </div>
            
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stage</div>
              <div className="text-sm md:text-base font-black text-white text-glow">
                {pet.stage === 1 ? 'Egg' : pet.stage === 2 ? 'Replicating' : 'Mature'}
              </div>
              <button
                type="button"
                onClick={() => setIs3DMode(!is3DMode)}
                className="mt-2 text-[10px] font-mono tracking-wider px-2 py-0.5 rounded border border-purple-500/40 bg-purple-950/40 text-purple-300 hover:bg-purple-800/40 hover:text-white transition-all flex items-center gap-1 ml-auto"
              >
                <Box className="w-3 h-3 text-cyan-400" />
                {is3DMode ? 'MODE: 3D' : 'MODE: 2D'}
              </button>
            </div>
          </div>

          {/* Pet Sprite / 3D Viewer */}
          <div className="relative z-10 flex-1 flex items-center justify-center w-full my-8">
            <AnimatePresence>
              {actionAnim === 'feed' && (
                <motion.div initial={{ y: -50, opacity: 0, scale: 0.5 }} animate={{ y: -20, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl z-20 drop-shadow-lg">🍔</motion.div>
              )}
              {actionAnim === 'play' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 180 }} exit={{ opacity: 0 }} className="absolute -top-4 left-1/2 -translate-x-1/2 text-5xl text-yellow-400 z-20 drop-shadow-lg">✨</motion.div>
              )}
              {actionAnim === 'sleep' && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 20, opacity: 1, y: -20 }} exit={{ opacity: 0 }} className="absolute -top-4 right-1/4 text-4xl z-20 drop-shadow-lg">💤</motion.div>
              )}
              {sick && !actionAnim && (
                <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-4 right-1/4 z-20 text-4xl">
                  ⚠️
                </motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className={`w-48 h-48 rounded-full blur-3xl transition-all duration-1000 ${sick ? 'bg-red-500/20' : 'bg-purple-500/20'}`} />
            </div>

            {is3DMode ? (
              <div className="w-full h-56 relative z-10">
                <VirusViewer3D 
                  type={familyToVirusType(pet.family)} 
                  color={sick ? '#ef4444' : '#a855f7'}
                  isSick={sick}
                  interactive={true}
                />
              </div>
            ) : (
              <motion.div
                className={`transition-all duration-1000 origin-center ${getPetScale()} ${sick ? 'grayscale-[0.8] brightness-50 contrast-125 hue-rotate-180' : ''}`}
                animate={{ 
                  y: sick ? [0, 5, 0] : actionAnim === 'play' ? [0, -30, 0] : [0, -10, 0],
                  scale: actionAnim === 'feed' ? [1, 1.1, 1] : 1,
                  rotate: sick ? [-5, 5, -5] : [0, 0, 0]
                }}
                transition={{ 
                  duration: sick ? 2 : actionAnim ? 0.5 : 3, 
                  repeat: actionAnim ? 0 : Infinity,
                  ease: "easeInOut"
                }}
              >
                <SVGVirus 
                  type={familyToVirusType(pet.family)} 
                  className="w-48 h-48 text-purple-400 drop-shadow-[0_0_25px_rgba(168,85,247,0.4)]" 
                  glowColor={sick ? 'rgba(239,68,68,0.6)' : 'rgba(168,85,247,0.6)'} 
                />
              </motion.div>
            )}
          </div>

          {/* Care Stats (Hunger, Happiness, Energy) */}
          <div className="w-full space-y-2 z-10 bg-slate-950/50 p-4 rounded-2xl backdrop-blur-sm border border-slate-800/60">
            <StatBar icon={<Crosshair className="w-4 h-4" />} label="Hunger" value={pet.hunger} bgClass="bg-orange-500" textClass="text-orange-500" />
            <StatBar icon={<Star className="w-4 h-4" />} label="Happiness" value={pet.happiness} bgClass="bg-pink-500" textClass="text-pink-500" />
            <StatBar icon={<Zap className="w-4 h-4" />} label="Energy" value={pet.energy} bgClass="bg-blue-500" textClass="text-blue-500" />
          </div>
        </Card>

        {/* Right Column: Actions & Combat Power Summary */}
        <div className="space-y-4 flex flex-col justify-between">
          
          {/* Action Care Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <Button 
              onClick={() => handleAction('feed')} 
              disabled={actionAnim !== null || pet.hunger >= 100}
              className="h-20 flex flex-col gap-1.5 bg-slate-800 hover:bg-orange-900/50 border border-slate-700 hover:border-orange-500 text-slate-300 hover:text-orange-300 transition-all shadow-md active:scale-95"
            >
              <Crosshair className="w-5 h-5 text-orange-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Infect (ให้อาหาร)</span>
            </Button>
            <Button 
              onClick={() => handleAction('play')} 
              disabled={actionAnim !== null || pet.energy < 10 || pet.happiness >= 100}
              className="h-20 flex flex-col gap-1.5 bg-slate-800 hover:bg-pink-900/50 border border-slate-700 hover:border-pink-500 text-slate-300 hover:text-pink-300 transition-all shadow-md active:scale-95"
            >
              <Target className="w-5 h-5 text-pink-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Mutate (เล่น)</span>
            </Button>
            <Button 
              onClick={() => handleAction('sleep')} 
              disabled={actionAnim !== null || pet.energy >= 100}
              className="h-20 flex flex-col gap-1.5 bg-slate-800 hover:bg-blue-900/50 border border-slate-700 hover:border-blue-500 text-slate-300 hover:text-blue-300 transition-all shadow-md active:scale-95"
            >
              <Moon className="w-5 h-5 text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest">Dormant (พักผ่อน)</span>
            </Button>
          </div>

          {/* Combat Power (CP) & Battle Stats Preview Panel */}
          <Card className="p-5 glass border-cyan-500/40 bg-slate-900/70 shadow-[0_0_25px_rgba(6,182,212,0.15)] relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  พลังรบต่อสู้ (Empire Battle Power)
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono block">COMBAT POWER</span>
                <span className="text-xl font-black text-cyan-300 font-mono text-glow">
                  CP {combatPower}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Max HP */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-red-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-red-300 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400 fill-current" /> พลังชีวิต (HP)
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {pet.currentHp !== undefined ? pet.currentHp : maxHp} / {maxHp}
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">100+(VIT×20)</span>
              </div>

              {/* ATK */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-orange-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-orange-300 flex items-center gap-1">
                    <Swords className="w-3 h-3 text-orange-400" /> พลังโจมตี (ATK)
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {atkDmg} DMG
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">20+(STR×10)</span>
              </div>

              {/* Quiz Time */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-blue-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-blue-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" /> เวลาทำข้อสอบ
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {quizTime} วินาที
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">15s+(AGI×2s)</span>
              </div>

              {/* Crit Chance */}
              <div className="bg-slate-950/60 p-3 rounded-xl border border-yellow-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-mono text-yellow-300 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-400" /> อัตราคริติคอล
                  </div>
                  <div className="text-base font-black text-white mt-0.5">
                    {critRate}% (x2 DMG)
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-mono">DEX×5%</span>
              </div>
            </div>

            {/* Quick Action to Empire */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                นำค่าพลังไปใช้ยึดป้อมฟาร์มและชิงสมบัติใน Empire
              </span>
              <Link href="/student/empire">
                <Button size="sm" className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs">
                  สู่สมรภูมิ ⚔️
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      {/* 3. Interactive Tabs: RPG Stats / Virology Dossier / Recovery Ward */}
      <div className="space-y-4">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'stats'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Star className="w-4 h-4 text-yellow-400" />
            <span>อัปแต้มสเตตัส (RPG Stats)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dossier')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
              activeTab === 'dossier'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>บันทึกวิจัยชีววิทยา (Virology Dossier)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ward')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 relative ${
              activeTab === 'ward'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            <span>คลินิกฟื้นฟูฉุกเฉิน (Bio-Ward)</span>
            {isInjuredFromBattle && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
        </div>

        {/* Tab 1: RPG Stats Allocation */}
        {activeTab === 'stats' && (
          <Card className="p-4 md:p-6 glass border-slate-700 backdrop-blur-md">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" /> จัดสรรแต้มสถานะ (Stat Allocation)
              </h3>
              <div className="text-xs font-mono">
                <span className="text-slate-400">Available Points:</span>{' '}
                <span className={`font-black text-lg ${availablePoints > 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-slate-500'}`}>
                  {availablePoints}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { id: 'str', name: 'STR', desc: '+10 โจมตี', color: 'text-red-400', border: 'border-red-900/50', bg: 'bg-red-900/20' },
                { id: 'vit', name: 'VIT', desc: '+20 HP สูงสุด', color: 'text-green-400', border: 'border-green-900/50', bg: 'bg-green-900/20' },
                { id: 'agi', name: 'AGI', desc: '+2s เวลาตอบ', color: 'text-blue-400', border: 'border-blue-900/50', bg: 'bg-blue-900/20' },
                { id: 'dex', name: 'DEX', desc: '+5% คริติคอล', color: 'text-yellow-400', border: 'border-yellow-900/50', bg: 'bg-yellow-900/20' },
              ].map(s => {
                const statVal = pet?.stats?.[s.id as 'str' | 'vit' | 'agi' | 'dex'] || 1;
                return (
                  <div key={s.id} className={`p-3 rounded-xl border ${s.border} ${s.bg} flex items-center justify-between`}>
                    <div>
                      <div className={`text-sm font-black uppercase ${s.color} tracking-widest`}>{s.name}</div>
                      <div className="text-2xl font-black text-white mt-0.5 leading-none">{statVal}</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">{s.desc}</div>
                    </div>
                    <button
                      onClick={() => handleUpgradeStat(s.id as any)}
                      disabled={availablePoints <= 0}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center font-black text-lg transition-all ${
                        availablePoints > 0 
                          ? 'bg-slate-800 text-white hover:bg-slate-700 hover:scale-105 active:scale-95 border border-slate-600' 
                          : 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      +
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-4 text-[10px] text-slate-500 uppercase tracking-widest">
              ได้แต้มจากการสะสม EXP ในมินิเกมและอาณาจักร (ทุกๆ 100 EXP = 1 Stat Point)
            </div>
          </Card>
        )}

        {/* Tab 2: Virology Research Dossier */}
        {activeTab === 'dossier' && (
          <Card className="p-5 md:p-6 glass border-purple-500/30 bg-slate-900/80">
            <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-3">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <h3 className="text-base font-black text-white">
                บันทึกชีววิทยา: {pet.virusName} ({pet.family})
              </h3>
            </div>

            {virusInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div>
                    <span className="text-purple-300 font-bold block mb-0.5">🧬 สารพันธุกรรม & โครงสร้าง (Genome):</span>
                    <span className="text-slate-300 font-mono">{virusInfo.genome || 'ssRNA / dsDNA'}</span>
                  </div>
                  <div>
                    <span className="text-purple-300 font-bold block mb-0.5">🐾 โฮสต์สำคัญ (Hosts):</span>
                    <span className="text-slate-300">
                      {Array.isArray(virusInfo.host) ? virusInfo.host.join(', ') : virusInfo.host || 'สุนัข, แมว, โค, สุกร'}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-300 font-bold block mb-0.5">🔄 การติดต่อ (Transmission):</span>
                    <span className="text-slate-300">
                      {Array.isArray(virusInfo.transmission) ? virusInfo.transmission.join(', ') : virusInfo.transmission || 'ละอองฝอย, น้ำลาย, การสัมผัสโดยตรง'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2.5">
                  <div>
                    <span className="text-purple-300 font-bold block mb-0.5">⚠️ อาการเด่นทางคลินิก (Clinical Signs):</span>
                    <span className="text-slate-300 leading-relaxed">
                      {Array.isArray(virusInfo.clinicalSigns) ? virusInfo.clinicalSigns.join(', ') : virusInfo.clinicalSigns || 'มีไข้, อ่อนแรง, อาการทางระบบทางเดินหายใจหรือทางเดินอาหาร'}
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-300 font-bold block mb-0.5">🔬 การวินิจฉัย & ป้องกัน:</span>
                    <span className="text-slate-300 leading-relaxed">
                      {virusInfo.treatment || 'รักษาตามอาการ ร่วมกับการให้วัคซีนป้องกันและตรวจทางห้องปฏิบัติการ'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-slate-400 text-xs py-4 text-center">
                กำลังซิงค์ข้อมูลชีววิทยาจากคลังข้อสอบชีววิทยาของระบบ...
              </div>
            )}
          </Card>
        )}

        {/* Tab 3: Emergency Ward & Injury Recovery */}
        {activeTab === 'ward' && (
          <Card className="p-5 md:p-6 glass border-emerald-500/30 bg-slate-900/80 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-black text-white">คลินิกฟื้นฟูฉุกเฉิน (Emergency Bio-Ward)</h3>
                  <p className="text-[11px] text-slate-400">ตอบคำถามไวรัสวิทยา 1 ข้อเพื่อฟื้นฟูพลังชีวิตและรักษาอาการบาดเจ็บ</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">STATUS</span>
                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${isInjuredFromBattle ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'}`}>
                  {isInjuredFromBattle ? '🚨 บาดเจ็บสาหัส' : '💚 สภาพร่างกายปกติ'}
                </span>
              </div>
            </div>

            {/* Quiz Card for Recovery */}
            {(() => {
              const currentQ = RECOVERY_QUESTIONS[quizIdx % RECOVERY_QUESTIONS.length];
              return (
                <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5" />
                      คำถามทางสัตวแพทย์เพื่อการรักษา ({quizIdx + 1}/{RECOVERY_QUESTIONS.length})
                    </span>
                    <span className="text-emerald-400 font-bold">ตอบถูก: ฟื้นฟู HP 100% เต็มทันที!</span>
                  </div>

                  <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
                    {currentQ.q}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentQ.choices.map((choice, i) => {
                      const isChosen = selectedChoice === i;
                      const isCorrectChoice = i === currentQ.ans;
                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={treating}
                          onClick={() => handleAnswerRecovery(i)}
                          className={`p-3 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all ${
                            isChosen
                              ? isCorrectChoice
                                ? 'bg-emerald-500/30 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                                : 'bg-red-500/30 border-red-400 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                              : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-cyan-500 hover:text-white'
                          }`}
                        >
                          <span className="font-mono text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                          <span>{choice}</span>
                        </button>
                      );
                    })}
                  </div>

                  {wardResult && (
                    <div className={`p-3 rounded-xl text-center font-black text-sm animate-in fade-in ${
                      wardResult === 'correct' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' 
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    }`}>
                      {wardResult === 'correct' 
                        ? '🎉 ถูกต้อง! ทำหัตถการสำเร็จ ไวรัสฟื้นฟู HP เต็ม 100% พร้อมออกรบ!' 
                        : '⚠️ ยังไม่ถูกต้อง! ได้รับการพยาบาลเบื้องต้น (ฟื้นฟู HP 50%)'}
                    </div>
                  )}
                </div>
              );
            })()}
          </Card>
        )}
      </div>

    </div>
  );
}

function StatBar({ icon, label, value, bgClass, textClass }: { icon: React.ReactNode, label: string, value: number, bgClass: string, textClass: string }) {
  return (
    <div className="w-full flex items-center gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bgClass} bg-opacity-10 border border-slate-700/50 ${textClass}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-[10px] font-black text-slate-400 mb-1 tracking-widest">
          <span className="uppercase">{label}</span>
          <span>{value}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <motion.div 
            className={`h-full ${bgClass}`}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
