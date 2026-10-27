"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Crosshair, Target, Moon, ArrowLeft, Loader2, Star, 
  ShieldAlert, Box, Heart, Swords, Clock, Sparkles, BookOpen, 
  Edit3, Check, Stethoscope, ChevronRight, HelpCircle,
  Shield, Crown, Layers, Plus, Castle, Landmark, FlaskConical,
  Award, ShieldCheck, Flame, Compass, Coins, Info, Lock
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
import { getEffectivePetStats, MAX_PET_STAT_POINTS, MAX_PER_STAT } from '@/lib/petBalance';
import { 
  BIO_ARTIFACTS, 
  VIRUS_UNIT_TEMPLATES, 
  getDefaultHeroArmy, 
  ensureViableArmy,
  EquipmentItem 
} from '@/lib/heroArmy';
import { ALL_15_CHAPTER_QUESTIONS } from '@/data/veterinaryVirologyContent';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => <div className="w-full h-full flex items-center justify-center text-amber-500/70 font-mono text-xs">🏛️ Loading 3D Bio-Sanctuary...</div>
});

export default function VirusPet() {
  const { appUser } = useAuth();
  const [pet, setPet] = useState<VirusPetData | null>(null);
  const [virusInfo, setVirusInfo] = useState<Virus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionAnim, setActionAnim] = useState<string | null>(null);
  const [is3DMode, setIs3DMode] = useState(true);

  // Nickname Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // HoMM Town Facility Tab State
  const [activeFacility, setActiveFacility] = useState<'hall' | 'dwellings' | 'forge' | 'infirmary' | 'archive'>('hall');

  // Emergency Recovery Ward State (Infirmary)
  const [wardQIndex, setWardQIndex] = useState(0);
  const [selectedWardChoice, setSelectedWardChoice] = useState<string | null>(null);
  const [wardResult, setWardResult] = useState<'correct' | 'wrong' | null>(null);
  const [treating, setTreating] = useState(false);

  // Dynamic 150-Question Bank for Veterinary Triage
  const wardQuestions = useMemo(() => {
    if (ALL_15_CHAPTER_QUESTIONS && ALL_15_CHAPTER_QUESTIONS.length > 0) {
      return [...ALL_15_CHAPTER_QUESTIONS].sort(() => Math.random() - 0.5);
    }
    return [
      {
        q: "โครงสร้างใดของไวรัสที่ทำหน้าที่จับกับ receptor บนผิวเซลล์โฮสต์?",
        choices: ["Capsid / Envelope glycoprotein", "Nucleic acid", "Matrix protein", "Lipid bilayer"],
        answer: "Capsid / Envelope glycoprotein",
        explanation: "ไกลโคโปรตีนบนเปลือกหุ้มมีบทบาทสำคัญในการ attachment"
      },
      {
        q: "Negri bodies เป็นลักษณะทางพยาธิสภาพเฉพาะ (Pathognomonic lesion) ของไวรัสชนิดใด?",
        choices: ["Canine Distemper Virus", "Rabies Virus", "Feline Panleukopenia", "Canine Parvovirus"],
        answer: "Rabies Virus",
        explanation: "พบในเซลล์สมอง เช่น Purkinje cells และ Pyramidal cells"
      }
    ];
  }, []);

  // 1. Initial Load & Setup
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
              hunger: 60,
              happiness: 60,
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
          // Initialize stats if missing
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
          
          // Time decay for care stats (Hunger, Happiness, Energy)
          // NOTE: We NEVER deduct permanent STR/VIT/AGI/DEX stats! (Preserving student morale)
          const lastDate = new Date(petData.lastUpdate || Date.now());
          const now = new Date();
          const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

          if (diffHours > 0.5) {
            const decay = Math.floor(diffHours * 4);
            petData.hunger = Math.max(0, (petData.hunger || 50) - decay);
            petData.happiness = Math.max(0, (petData.happiness || 50) - decay);
            petData.energy = Math.max(0, (petData.energy || 50) - Math.floor(decay / 2));
            petData.lastUpdate = now.toISOString();
            await updateDoc(petRef, { pet: petData });
          }

          // Anti-softlock & passive barracks regeneration verification
          const viableArmy = ensureViableArmy(petData.hero, petData.family);
          if (viableArmy.wasModified) {
            petData.hero = viableArmy.army;
            updateDoc(petRef, { 'pet.hero': viableArmy.army }).catch(console.error);
          }

          setPet(petData);
          setNicknameInput(petData.nickname || petData.virusName);

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

  // 2. Stat Calculations Aligned 100% with HoMM Empire System
  const combatStats = useMemo(() => {
    return getEffectivePetStats(pet?.stats, appUser?.exp || 0);
  }, [pet?.stats, appUser?.exp]);

  const str = combatStats.str;
  const vit = combatStats.vit;
  const agi = combatStats.agi;
  const dex = combatStats.dex;
  const maxHp = combatStats.maxHp;
  const combatPower = combatStats.combatPower;

  // Town Morale System (Positive Reinforcement instead of punishing permanent stat drops)
  const townMorale = useMemo(() => {
    if (!pet) return { status: 'normal', label: '⚖️ ขวัญกำลังใจปกติ (100% พลังรบ)', bonusAtk: 0, bonusExp: 0 };
    const avg = ((pet.hunger || 0) + (pet.happiness || 0) + (pet.energy || 0)) / 3;
    if (avg >= 70) {
      return { 
        status: 'high', 
        label: '✨ ขวัญกำลังใจทัพเปี่ยมล้น (+10% ATK & +10% EXP)', 
        bonusAtk: 10, 
        bonusExp: 10 
      };
    }
    if (avg < 25) {
      return { 
        status: 'dormant', 
        label: '💤 ไวรัสเข้าสู่ระยะจำศีล (พลังงานต่ำ เพาะเลี้ยงเพื่อปลุกพลัง)', 
        bonusAtk: 0, 
        bonusExp: 0 
      };
    }
    return { 
      status: 'normal', 
      label: '⚖️ ขวัญกำลังใจปกติ (100% พลังรบ)', 
      bonusAtk: 0, 
      bonusExp: 0 
    };
  }, [pet]);

  // Hero Army & Viable Troops
  const heroArmy = useMemo(() => {
    return ensureViableArmy(pet?.hero, pet?.family).army;
  }, [pet?.hero, pet?.family]);

  // Real-time Countdown to Next Passive Virion Generation (every 30 mins)
  const [secondsUntilNextRegen, setSecondsUntilNextRegen] = useState<number>(1800);

  useEffect(() => {
    const calcRemaining = () => {
      const lastStr = heroArmy.lastPassiveRegen || heroArmy.lastReplicated;
      const lastTime = lastStr ? new Date(lastStr).getTime() : Date.now();
      const elapsedMs = Math.max(0, Date.now() - lastTime);
      const intervalMs = 30 * 60 * 1000;
      const remainingMs = intervalMs - (elapsedMs % intervalMs);
      return Math.max(0, Math.floor(remainingMs / 1000));
    };

    setSecondsUntilNextRegen(calcRemaining());
    const interval = setInterval(() => {
      const rem = calcRemaining();
      setSecondsUntilNextRegen(rem);
      if (rem <= 1 && pet && appUser) {
        // Trigger live passive top-up
        const viableRes = ensureViableArmy(pet.hero, pet.family);
        if (viableRes.wasModified) {
          setPet(prev => prev ? { ...prev, hero: viableRes.army } : prev);
          updateDoc(doc(db, 'users', appUser.uid), {
            'pet.hero': viableRes.army,
          }).catch(console.error);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [heroArmy.lastPassiveRegen, heroArmy.lastReplicated, pet, appUser]);

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Care Governance Actions (Feed / Mutate / Sleep)
  const handleAction = async (type: 'feed' | 'play' | 'sleep') => {
    if (!pet || !appUser) return;
    
    sfx.click();
    setActionAnim(type);
    
    const newPet = { ...pet };
    if (type === 'feed') {
      newPet.hunger = Math.min(100, (newPet.hunger || 0) + 30);
    } else if (type === 'play') {
      newPet.happiness = Math.min(100, (newPet.happiness || 0) + 30);
      newPet.energy = Math.max(0, (newPet.energy || 0) - 10);
    } else if (type === 'sleep') {
      newPet.energy = Math.min(100, (newPet.energy || 0) + 40);
    }

    newPet.careCount = (newPet.careCount || 0) + 1;
    
    // Evolution Growth logic
    if (newPet.stage === 1 && newPet.careCount >= 5) {
      newPet.stage = 2;
      sfx.levelUp();
    } else if (newPet.stage === 2 && newPet.careCount >= 15) {
      newPet.stage = 3;
      sfx.levelUp();
    }

    newPet.lastUpdate = new Date().toISOString();
    setPet(newPet);

    try {
      await updateDoc(doc(db, 'users', appUser.uid), { pet: newPet });
    } catch (e) {
      console.error("Failed to save action", e);
    }

    setTimeout(() => {
      setActionAnim(null);
    }, 1500);
  };

  // Upgrade Hero RPG Stat
  const handleUpgradeStat = async (stat: 'str' | 'vit' | 'agi' | 'dex') => {
    if (!pet || !pet.stats || !appUser) return;
    if (combatStats.availablePoints <= 0) return;
    if (combatStats.isMaxed) {
      alert(`⚠️ สัตว์เลี้ยงสะสมแต้มสเตตัสครบเพดานสูงสุดแล้ว (${MAX_PET_STAT_POINTS} แต้ม) EXP ส่วนเกินจะเพิ่มยศเกียรติยศแทน!`);
      return;
    }
    const currentVal = pet.stats[stat] || 1;
    if (currentVal >= MAX_PER_STAT) {
      alert(`⚠️ ค่า ${stat.toUpperCase()} ถึงขีดจำกัดสูงสุดแล้ว (${MAX_PER_STAT}) กรุณาเลือกอัปค่าอื่น`);
      return;
    }

    sfx.click();
    
    const newStats = { 
      ...pet.stats, 
      [stat]: currentVal + 1, 
      spentPoints: (pet.stats.spentPoints || 0) + 1 
    };
    const newEffective = getEffectivePetStats(newStats, appUser?.exp || 0);
    const newMaxHp = newEffective.maxHp;
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

  // Bio-Artifacts Equipment Handler (HoMM Blacksmith / Forge)
  const handleToggleEquip = async (item: EquipmentItem) => {
    if (!pet || !appUser) return;

    const userExp = Number(appUser.exp || 0);
    const requiredExp = item.requiredExp || 0;
    if (userExp < requiredExp) {
      alert(`🔒 อุปกรณ์นี้ต้องการเกียรติยศ ${requiredExp.toLocaleString()} EXP ขึ้นไปเพื่อปลดล็อก (ปัจจุบันคุณมี ${userExp.toLocaleString()} EXP)`);
      return;
    }

    sfx.click();

    const currentEquip = { ...(pet.hero?.equipment || heroArmy.equipment || {}) };
    const currentEquippedInSlot = currentEquip[item.slot];

    if (currentEquippedInSlot === item.id) {
      delete currentEquip[item.slot];
    } else {
      currentEquip[item.slot] = item.id;
    }

    const updatedHero = {
      ...(pet.hero || heroArmy),
      equipment: currentEquip,
    };
    const updatedPet: VirusPetData = {
      ...pet,
      hero: updatedHero,
    };
    setPet(updatedPet);

    try {
      await updateDoc(doc(db, 'users', appUser.uid), {
        'pet.hero': updatedHero,
      });
      sfx.levelUp();
    } catch (e) {
      console.error('Failed to update equipment:', e);
    }
  };

  // Army Recruitment with EXP
  const handleReplicateTroops = async (templateKey: string) => {
    if (!pet || !appUser) return;
    const template = VIRUS_UNIT_TEMPLATES[templateKey];
    if (!template) return;

    const userExp = Number(appUser.exp || 0);
    if (userExp < template.replicateCostExp) {
      alert(`⚠️ EXP ไม่เพียงพอ! การเพาะเลี้ยงขยายพันธุ์ "${template.virusName}" ต้องการ ${template.replicateCostExp} EXP (คุณมี ${userExp} EXP)`);
      return;
    }

    sfx.click();
    const currentStacks = [...(pet.hero?.stacks || heroArmy.stacks || [])];
    const stackIdx = currentStacks.findIndex(s => s.family === template.family || s.virusId === template.virusId);

    if (stackIdx >= 0) {
      currentStacks[stackIdx] = {
        ...currentStacks[stackIdx],
        count: currentStacks[stackIdx].count + template.replicateBatch,
      };
    } else {
      currentStacks.push({
        id: `stack_${currentStacks.length + 1}`,
        virusId: template.virusId,
        virusName: template.virusName,
        family: template.family,
        tier: template.tier,
        count: template.replicateBatch,
        baseHp: template.baseHp,
        baseAtk: template.baseAtk,
      });
    }

    const updatedHero = {
      ...(pet.hero || heroArmy),
      stacks: currentStacks.slice(0, 3),
      lastReplicated: new Date().toISOString(),
    };
    const updatedPet: VirusPetData = {
      ...pet,
      hero: updatedHero,
    };
    setPet(updatedPet);

    try {
      await updateDoc(doc(db, 'users', appUser.uid), {
        'pet.hero': updatedHero,
        exp: userExp - template.replicateCostExp,
      });
      sfx.victory();
    } catch (e) {
      console.error('Failed to replicate troops:', e);
    }
  };

  // Emergency Infirmary & Bio-Ward Quiz (Veterinary Triage)
  const handleAnswerRecovery = async (choiceText: string) => {
    if (!pet || !appUser || treating) return;
    setSelectedWardChoice(choiceText);
    setTreating(true);

    const currentQ = wardQuestions[wardQIndex % wardQuestions.length];
    const isCorrect = choiceText === currentQ.answer;

    if (isCorrect) {
      sfx.correct();
      setWardResult('correct');
      // Full HP recovery & clear injury
      const updatedPet: VirusPetData = {
        ...pet,
        currentHp: maxHp,
        isInjured: false,
        energy: Math.min(100, (pet.energy || 50) + 50),
        hunger: Math.min(100, (pet.hunger || 50) + 30),
      };
      setPet(updatedPet);
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
      await updateDoc(doc(db, 'users', appUser.uid), {
        'pet.currentHp': partialHp,
        'pet.isInjured': false,
      });
    }

    setTimeout(() => {
      setSelectedWardChoice(null);
      setWardResult(null);
      setTreating(false);
      setWardQIndex((prev) => (prev + 1) % wardQuestions.length);
    }, 2500);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[60vh] gap-3">
        <Castle className="w-12 h-12 text-amber-400 animate-bounce" />
        <span className="text-amber-300 font-mono text-sm tracking-widest font-black uppercase">
          กำลังเข้าสู่มหานครชีวภาพ (Entering Citadel)...
        </span>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="text-center py-20 text-slate-400 font-mono">
        Failed to enter Viropolis Citadel. No pet record found.
      </div>
    );
  }

  const isInjuredFromBattle = pet.isInjured || (pet.currentHp !== undefined && pet.currentHp <= 0);

  return (
    <div className="max-w-5xl mx-auto space-y-5 z-10 relative pb-12">
      
      {/* ── 1. HoMM GRAND CASTLE HEADER & BANNER ──────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border-2 border-amber-500/40 bg-gradient-to-b from-slate-950 via-slate-900 to-amber-950/30 p-4 sm:p-6 shadow-[0_0_35px_rgba(245,158,11,0.15)] backdrop-blur-md">
        
        {/* Top Gold Filigree Corner Accents */}
        <div className="absolute top-2 left-2 text-amber-500/40 text-xs font-mono select-none pointer-events-none">❖ ────── ❖</div>
        <div className="absolute top-2 right-2 text-amber-500/40 text-xs font-mono select-none pointer-events-none">❖ ────── ❖</div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          
          {/* Town Name & Title */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Castle className="w-5 h-5" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400/90 font-mono">
                VIROPOLIS CITADEL • มหานครชีวภาพ
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 mt-1">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    maxLength={20}
                    placeholder="ตั้งชื่อเมือง..."
                    className="bg-slate-950 border-2 border-amber-500 rounded-xl px-3 py-1 text-base font-black text-white focus:outline-none focus:ring-2 focus:ring-amber-400 w-44"
                  />
                  <button
                    type="button"
                    disabled={savingName}
                    onClick={handleSaveNickname}
                    className="p-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingName(false);
                      setNicknameInput(pet.nickname || pet.virusName);
                    }}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-amber-100 drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)] tracking-wide">
                    {pet.nickname || pet.virusName}
                  </h1>
                  <button
                    type="button"
                    onClick={() => setIsEditingName(true)}
                    className="p-1 rounded-lg text-amber-400/70 hover:text-white hover:bg-amber-500/20 transition-colors cursor-pointer"
                    title="เปลี่ยนชื่อปราสาท"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="text-amber-300 font-bold capitalize">{pet.family} Citadel</span>
              <span>•</span>
              <span className="text-slate-300">
                {pet.stage === 1 ? '🐣 ขั้นที่ 1: หอเพาะเลี้ยงปฐมภูมิ (Incubator Hamlet)' : pet.stage === 2 ? '⚡ ขั้นที่ 2: ป้อมปราการเพิ่มจำนวน (Replicating Stronghold)' : '👑 ขั้นที่ 3: มหานครชีวภาพขั้นสูงสุด (Apex Citadel)'}
              </span>
            </div>
          </div>

          {/* Treasury, Morale & Empire Quick Launch */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 self-stretch md:self-auto justify-between md:justify-end">
            
            {/* EXP Treasury Pill */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/80 border border-amber-500/40 flex items-center gap-2 shadow-inner">
              <Coins className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <span className="text-[9px] text-slate-400 font-mono block leading-none">คลังสมบัติ (EXP)</span>
                <span className="text-sm font-black text-amber-300 font-mono">
                  {Number(appUser?.exp || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Combat Power Pill */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-slate-950/80 border border-cyan-500/40 flex items-center gap-2 shadow-inner">
              <Swords className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-[9px] text-slate-400 font-mono block leading-none">พลังรบ (CP)</span>
                <span className="text-sm font-black text-cyan-300 font-mono">
                  CP {combatPower}
                </span>
              </div>
            </div>

            {/* March to Empire Button */}
            <Link href="/student/empire">
              <Button className="font-black bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 hover:from-amber-500 hover:to-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.3)] active:scale-95 border border-amber-400/50 rounded-2xl text-xs py-2 px-4 cursor-pointer">
                <Swords className="w-4 h-4 mr-1.5" />
                <span>ยกทัพออกศึก (Empire Map)</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Town Morale & Emergency Alerts Ribbon */}
        <div className="mt-4 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-amber-400/80 font-bold">ธงขวัญกำลังใจทัพ:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
              townMorale.status === 'high' 
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                : townMorale.status === 'dormant'
                ? 'bg-slate-800 text-slate-400 border-slate-700'
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            }`}>
              {townMorale.label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">สถานพยาบาล:</span>
            <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[11px] ${
              isInjuredFromBattle 
                ? 'bg-red-950/80 text-red-300 border-red-500/60 animate-bounce'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
            }`}>
              {isInjuredFromBattle ? '🚨 บาดเจ็บสาหัสจากการรบ' : '💚 ไวรัสสุขภาพสมบูรณ์'}
            </span>
          </div>
        </div>
      </div>

      {/* Injury Alert Callout */}
      {isInjuredFromBattle && (
        <div className="bg-red-950/90 border-2 border-red-500/80 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_25px_rgba(239,68,68,0.35)] animate-pulse">
          <div className="flex items-center gap-3 text-red-200">
            <ShieldAlert className="w-8 h-8 text-red-400 shrink-0" />
            <div>
              <div className="font-black text-base text-red-100">🚨 ไวรัสของคุณบาดเจ็บสาหัสจากการทำศึกใน Empire!</div>
              <div className="text-xs text-red-300 mt-0.5">พลังชีวิตเหลือ 0 ไม่สามารถออกรบได้ กรุณาไปที่ &quot;สถานพยาบาล (Bio-Infirmary)&quot; ด้านล่างเพื่อทำการรักษา</div>
            </div>
          </div>
          <Button 
            onClick={() => setActiveFacility('infirmary')}
            className="bg-red-600 hover:bg-red-500 text-white font-black text-xs uppercase px-4 py-2 shrink-0 shadow-lg rounded-xl cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 mr-1.5" /> รักษาด่วนในคลินิก
          </Button>
        </div>
      )}

      {/* ── 2. CENTRAL BIO-SANCTUARY & TOWN GOVERNANCE CHAMBER ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left: Central Altar / Virus Sanctuary (7 Cols) */}
        <Card className="lg:col-span-7 p-6 rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 relative overflow-hidden flex flex-col justify-between shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 z-10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-black text-xs uppercase tracking-wider text-amber-200 font-mono">
                วิหารใจกลางปราสาท (Central Bio-Sanctuary)
              </span>
            </div>
            
            <button
              type="button"
              onClick={() => setIs3DMode(!is3DMode)}
              className="text-[10px] font-mono tracking-wider px-2.5 py-1 rounded-xl border border-amber-500/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/40 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
            >
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>{is3DMode ? 'MODE: 3D HOLOGRAM' : 'MODE: 2D SPRITE'}</span>
            </button>
          </div>

          {/* Central 3D / 2D Model Display */}
          <div className="relative flex-1 flex items-center justify-center my-4 min-h-[260px]">
            <AnimatePresence>
              {actionAnim === 'feed' && (
                <motion.div initial={{ y: -40, opacity: 0, scale: 0.5 }} animate={{ y: -10, opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute top-2 left-1/2 -translate-x-1/2 text-5xl z-20 drop-shadow-lg">🧪</motion.div>
              )}
              {actionAnim === 'play' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: 180 }} exit={{ opacity: 0 }} className="absolute top-2 left-1/2 -translate-x-1/2 text-5xl text-yellow-400 z-20 drop-shadow-lg">⚡</motion.div>
              )}
              {actionAnim === 'sleep' && (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 20, opacity: 1, y: -20 }} exit={{ opacity: 0 }} className="absolute top-2 right-1/4 text-4xl z-20 drop-shadow-lg">💤</motion.div>
              )}
            </AnimatePresence>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 rounded-full blur-3xl bg-amber-500/15" />
            </div>

            {is3DMode ? (
              <div className="w-full h-64 relative z-10">
                <VirusViewer3D 
                  type={familyToVirusType(pet.family)} 
                  color={isInjuredFromBattle ? '#ef4444' : '#d97706'}
                  isSick={isInjuredFromBattle}
                  interactive={true}
                />
              </div>
            ) : (
              <motion.div
                className={`transition-all duration-700 origin-center ${isInjuredFromBattle ? 'grayscale-[0.8] brightness-50' : ''}`}
                animate={{ 
                  y: isInjuredFromBattle ? [0, 5, 0] : [0, -10, 0],
                  scale: actionAnim === 'feed' ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              >
                <SVGVirus 
                  type={familyToVirusType(pet.family)} 
                  className="w-48 h-48 text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.4)]" 
                  glowColor={isInjuredFromBattle ? 'rgba(239,68,68,0.6)' : 'rgba(245,158,11,0.6)'} 
                />
              </motion.div>
            )}
          </div>

          {/* Care Resources Bars (HoMM Resource Trays) */}
          <div className="space-y-2.5 z-10 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <ResourceBar 
              icon={<Crosshair className="w-4 h-4 text-orange-400" />} 
              label="สารอาหารเพาะเชื้อ (Culture Nutrients)" 
              value={pet.hunger || 50} 
              barColor="bg-orange-500" 
            />
            <ResourceBar 
              icon={<Zap className="w-4 h-4 text-pink-400" />} 
              label="ความไวต่อการกลายพันธุ์ (Mutation Affinity)" 
              value={pet.happiness || 50} 
              barColor="bg-pink-500" 
            />
            <ResourceBar 
              icon={<Flame className="w-4 h-4 text-blue-400" />} 
              label="พลังงานสังเคราะห์ ATP (Cellular Energy)" 
              value={pet.energy || 50} 
              barColor="bg-blue-500" 
            />
          </div>
        </Card>

        {/* Right: Town Governance Commands & Battle Attributes (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          
          {/* Town Governance Commands (Care Actions) */}
          <Card className="p-4 rounded-3xl border border-amber-500/30 bg-slate-900/80 space-y-3">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 font-mono flex items-center gap-1.5">
              <Landmark className="w-4 h-4 text-amber-400" /> บัญชาการการเพาะเลี้ยง (Citadel Governance)
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              <button 
                type="button"
                onClick={() => handleAction('feed')} 
                disabled={actionAnim !== null || (pet.hunger || 0) >= 100}
                className="py-3 px-2 rounded-2xl bg-slate-950 hover:bg-orange-950/50 border border-slate-800 hover:border-orange-500 text-slate-300 hover:text-orange-300 transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Crosshair className="w-5 h-5 text-orange-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-center">เพาะเลี้ยง (+30)</span>
              </button>

              <button 
                type="button"
                onClick={() => handleAction('play')} 
                disabled={actionAnim !== null || (pet.energy || 0) < 10 || (pet.happiness || 0) >= 100}
                className="py-3 px-2 rounded-2xl bg-slate-950 hover:bg-pink-950/50 border border-slate-800 hover:border-pink-500 text-slate-300 hover:text-pink-300 transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Target className="w-5 h-5 text-pink-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-center">กลายพันธุ์ (+30)</span>
              </button>

              <button 
                type="button"
                onClick={() => handleAction('sleep')} 
                disabled={actionAnim !== null || (pet.energy || 0) >= 100}
                className="py-3 px-2 rounded-2xl bg-slate-950 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-blue-300 transition-all flex flex-col items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Moon className="w-5 h-5 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-center">จำศีล (+40)</span>
              </button>
            </div>
          </Card>

          {/* HoMM Empire Battle Attributes Summary */}
          <Card className="p-5 rounded-3xl border border-cyan-500/40 bg-slate-900/80 shadow-md space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 font-mono flex items-center gap-1.5">
                <Swords className="w-4 h-4 text-cyan-400" /> สเตตัสการรบชีวภาพ (Empire Modifiers)
              </span>
              <span className="text-[10px] font-mono text-slate-400">HoMM Active Rules</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              
              {/* Max HP */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-red-500/30">
                <div className="text-[10px] font-mono text-red-300 flex items-center gap-1">
                  <Heart className="w-3 h-3 text-red-400 fill-current" /> พลังชีวิต (HP)
                </div>
                <div className="text-base font-black text-white mt-0.5">
                  {pet.currentHp !== undefined ? pet.currentHp : maxHp} / {maxHp}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">100 + (VIT×20)</div>
              </div>

              {/* Army ATK Boost */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-orange-500/30">
                <div className="text-[10px] font-mono text-orange-300 flex items-center gap-1">
                  <Swords className="w-3 h-3 text-orange-400" /> บัฟโจมตีกองทัพ
                </div>
                <div className="text-base font-black text-white mt-0.5">
                  +{combatStats.armyAtkBonusPercent}% ATK
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">+5% ต่องแต้ม STR</div>
              </div>

              {/* Turn Quiz Time */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-blue-500/30">
                <div className="text-[10px] font-mono text-blue-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-400" /> เวลาตอบข้อสอบ
                </div>
                <div className="text-base font-black text-white mt-0.5">
                  {combatStats.quizTime} วินาที
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">15s + (AGI÷3) [Max 18s]</div>
              </div>

              {/* Crit Chance */}
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-yellow-500/30">
                <div className="text-[10px] font-mono text-yellow-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-yellow-400" /> คริติคอลชีวะ
                </div>
                <div className="text-base font-black text-white mt-0.5">
                  {combatStats.critRate}% <span className="text-[10px] text-amber-400">(x1.5 DMG)</span>
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">DEX×4% [Max 40%]</div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── 3. HoMM TOWN DISTRICT SELECTOR (FACILITY TABS) ────────────────── */}
      <div className="p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl bg-slate-950/90 border-2 border-amber-500/30 shadow-[0_0_25px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2">
          
          <FacilityTabBtn
            icon={<Landmark className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="ศาลากลาง"
            subLabel="Town Hall (RPG)"
            isActive={activeFacility === 'hall'}
            badge={combatStats.availablePoints > 0 ? `+${combatStats.availablePoints}` : undefined}
            onClick={() => {
              sfx.click();
              setActiveFacility('hall');
            }}
          />

          <FacilityTabBtn
            icon={<Castle className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="ค่ายทหาร"
            subLabel="Dwellings (3 Stacks)"
            isActive={activeFacility === 'dwellings'}
            onClick={() => {
              sfx.click();
              setActiveFacility('dwellings');
            }}
          />

          <FacilityTabBtn
            icon={<Shield className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="โรงหล่อ"
            subLabel="Forge (อุปกรณ์ชีวะ)"
            isActive={activeFacility === 'forge'}
            onClick={() => {
              sfx.click();
              setActiveFacility('forge');
            }}
          />

          <FacilityTabBtn
            icon={<Stethoscope className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="สถานพยาบาล"
            subLabel="Infirmary (ฟื้นฟู HP)"
            isActive={activeFacility === 'infirmary'}
            isAlert={isInjuredFromBattle}
            onClick={() => {
              sfx.click();
              setActiveFacility('infirmary');
            }}
          />

          <FacilityTabBtn
            icon={<BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />}
            label="หอจดหมายเหตุ"
            subLabel="Archive (ตำราไวรัส)"
            isActive={activeFacility === 'archive'}
            onClick={() => {
              sfx.click();
              setActiveFacility('archive');
            }}
          />
        </div>
      </div>

      {/* ── 4. FACILITY CHAMBER VIEWS ───────────────────────────────────────── */}

      {/* Facility 1: ศาลากลาง & จัดสรรแต้ม RPG Stats (Town Hall) */}
      {activeFacility === 'hall' && (
        <Card className="p-5 md:p-6 rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-xl space-y-5 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-amber-100 uppercase tracking-wide">
                  ศาลากลาง & หอเกียรติยศจอมทัพ (Hero Hall of Fame)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                จัดสรรแต้มสถานะเพื่อเสริมความแกร่งให้แก่จอมทัพและกองกำลังไวรัสในเครือ
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1 rounded-xl border border-amber-500/40 bg-amber-950/40 text-amber-300 font-mono text-xs font-bold">
                {combatStats.rankTitle}
              </div>
              <div className="text-xs font-mono">
                <span className="text-slate-400">แต้มคงเหลือ:</span>{' '}
                <span className={`font-black text-lg ${combatStats.availablePoints > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>
                  {combatStats.availablePoints}
                </span>
              </div>
            </div>
          </div>

          {/* 4 Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* STR */}
            <StatCard 
              name="STR (ความรุนแรงของเชื้อ)"
              code="STR"
              val={str}
              desc="+5% ATK ให้กองทัพทั้งหมด"
              effect={`เพิ่มพลังทำลายล้างของทัพ +${str * 5}%`}
              isMax={str >= MAX_PER_STAT}
              canUpgrade={combatStats.availablePoints > 0 && str < MAX_PER_STAT}
              accentColor="red"
              onUpgrade={() => handleUpgradeStat('str')}
            />

            {/* VIT */}
            <StatCard 
              name="VIT (ความทนทานแคปซิด)"
              code="VIT"
              val={vit}
              desc="+20 Max HP สัตว์เลี้ยง"
              effect={`พลังชีวิตสูงสุด ${100 + (vit * 20)} HP`}
              isMax={vit >= MAX_PER_STAT}
              canUpgrade={combatStats.availablePoints > 0 && vit < MAX_PER_STAT}
              accentColor="emerald"
              onUpgrade={() => handleUpgradeStat('vit')}
            />

            {/* AGI */}
            <StatCard 
              name="AGI (การแทรกซึมเซลล์)"
              code="AGI"
              val={agi}
              desc="+1s เวลาตอบข้อสอบในสมรภูมิ"
              effect={`เวลาคิดต่อเทิร์น ${combatStats.quizTime}s (Max 18s)`}
              isMax={agi >= MAX_PER_STAT}
              canUpgrade={combatStats.availablePoints > 0 && agi < MAX_PER_STAT}
              accentColor="blue"
              onUpgrade={() => handleUpgradeStat('agi')}
            />

            {/* DEX */}
            <StatCard 
              name="DEX (ความแม่นยำกลายพันธุ์)"
              code="DEX"
              val={dex}
              desc="+4% โอกาสคริติคอลชีวะ"
              effect={`โอกาสติดคริติคอล ${combatStats.critRate}% (Max 40%)`}
              isMax={dex >= MAX_PER_STAT}
              canUpgrade={combatStats.availablePoints > 0 && dex < MAX_PER_STAT}
              accentColor="amber"
              onUpgrade={() => handleUpgradeStat('dex')}
            />
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono text-slate-400 text-center">
            💡 ทุกๆ 100 EXP ที่ได้จากการตอบคำถามในระบบจะมอบ 1 แต้มสเตตัส (สะสมได้สูงสุด {MAX_PET_STAT_POINTS} แต้ม เพื่อรักษาสมดุลในห้องเรียน)
          </div>
        </Card>
      )}

      {/* Facility 2: ค่ายทหารชีวภาพ & โรงบ่มเชื้อ (Bio-Barracks & Dwellings) */}
      {activeFacility === 'dwellings' && (
        <Card className="p-5 md:p-6 rounded-3xl border-2 border-rose-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-xl space-y-5 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Castle className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-black text-rose-100 uppercase tracking-wide">
                  ค่ายทหารชีวภาพ & โรงบ่มเชื้อ (Creature Dwellings & Bio-Incubator)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                บัญชาการกองกำลัง 3 ฝูงอนุภาค (Stacks) ยิ่งมีอนุภาคมาก พลังโจมตีและ HP ของกองทัพยิ่งสูง
              </p>
            </div>

            {/* Passive Regeneration Countdown Banner */}
            <div className="px-3.5 py-1.5 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 flex items-center gap-2 font-mono text-xs">
              <FlaskConical className="w-4 h-4 text-emerald-400 animate-pulse" />
              <div>
                <span className="text-[9px] text-emerald-400/80 block leading-none">โรงบ่มเชื้อผลิตฟรี</span>
                <span className="font-bold text-white">รอบถัดไป: {formatTimer(secondsUntilNextRegen)}</span>
              </div>
            </div>
          </div>

          {/* Passive Barracks Explanation Box */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-slate-300">
                <strong className="text-emerald-300 font-bold">ระบบฟื้นฟูอัตโนมัติ (Passive Bio-Incubator):</strong> ไวรัสจะเพิ่มจำนวนขึ้นเองทุก 30 นาที (+10 Parvo, +3 Corona, +1 Rabies) จนเต็มเพดานเริ่มต้น (60/20/4) แม้ไม่ได้ออนไลน์!
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono shrink-0">
              ⚡ ไม่ล็อกเอาต์ถาวร
            </span>
          </div>

          {/* 3 Stacks Creature Dwellings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(heroArmy.stacks || []).map((stack, idx) => {
              const templateKey = stack.family === 'parvo' ? 'parvo' : stack.family === 'rabies' ? 'rabies' : 'corona';
              const template = VIRUS_UNIT_TEMPLATES[templateKey];
              const totalHp = stack.count * stack.baseHp;
              const totalAtk = stack.count * stack.baseAtk;
              const tierLabel = stack.tier === 1 ? 'Tier 1: Swarm (ฝูง)' : stack.tier === 2 ? 'Tier 2: Core (แกนหลัก)' : 'Tier 3: Elite (หัวกะทิ)';
              const tierColor = stack.tier === 1 ? 'border-emerald-500/40 text-emerald-300 bg-emerald-950/40' : stack.tier === 2 ? 'border-cyan-500/40 text-cyan-300 bg-cyan-950/40' : 'border-purple-500/40 text-purple-300 bg-purple-950/40';
              const canReplicate = template && Number(appUser?.exp || 0) >= template.replicateCostExp;

              return (
                <div
                  key={stack.id || idx}
                  className="bg-slate-950/90 rounded-2xl border-2 border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  <div>
                    {/* Tier Tag & Mascot */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${tierColor}`}>
                          {tierLabel}
                        </span>
                        <h4 className="font-black text-white text-sm mt-1.5">{stack.virusName}</h4>
                        <span className="text-[10px] text-slate-400 font-mono capitalize">({stack.family})</span>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shrink-0">
                        <SVGVirus type={familyToVirusType(stack.family)} className="w-full h-full" />
                      </div>
                    </div>

                    {/* Troop Stack Size */}
                    <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 mb-3 space-y-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] font-mono text-slate-400">ขนาดกองกำลัง (Stack)</span>
                        <span className="text-xl font-black text-rose-400 font-mono">
                          {stack.count.toLocaleString()} <span className="text-xs text-slate-300">virions</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[10px] font-mono">
                        <div className="text-red-400 flex items-center justify-between">
                          <span>Total HP:</span>
                          <span className="font-bold text-white">{totalHp.toLocaleString()}</span>
                        </div>
                        <div className="text-orange-400 flex items-center justify-between">
                          <span>Total ATK:</span>
                          <span className="font-bold text-white">{totalAtk.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="text-[9px] text-slate-500 font-mono text-center">
                        (อนุภาคละ {stack.baseHp} HP / {stack.baseAtk} ATK)
                      </div>
                    </div>
                  </div>

                  {/* Recruitment Action Button */}
                  {template && (
                    <Button
                      onClick={() => handleReplicateTroops(templateKey)}
                      disabled={!canReplicate}
                      className={`w-full py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${
                        canReplicate
                          ? 'bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 hover:from-rose-500 hover:to-amber-500 text-white shadow-md active:scale-95'
                          : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เกณฑ์ทัพ +{template.replicateBatch} ({template.replicateCostExp} EXP)</span>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Facility 3: โรงหล่อสิ่งประดิษฐ์ชีวภาพ (Artifact Forge & Vault) */}
      {activeFacility === 'forge' && (
        <Card className="p-5 md:p-6 rounded-3xl border-2 border-amber-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-xl space-y-5 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-amber-100 uppercase tracking-wide">
                  โรงหล่อ & คลังสิ่งประดิษฐ์ชีวะ (Artifact Forge & Vault)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ติดตั้งอุปกรณ์ชีวภาพ 4 ช่อง (ศีรษะ, อาวุธ, เกราะ, คัมภีร์) เพื่อเพิ่มบัฟมหาศาลให้กับกองทัพ
              </p>
            </div>

            <div className="text-xs font-mono text-slate-400 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-amber-500/30">
              EXP สะสม: <strong className="text-amber-300">{Number(appUser?.exp || 0).toLocaleString()}</strong>
            </div>
          </div>

          {/* 4 Bio-Artifact Slots Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(BIO_ARTIFACTS).map((item) => {
              const isEquipped = (pet?.hero?.equipment || heroArmy.equipment)?.[item.slot] === item.id;
              const isUnlocked = Number(appUser?.exp || 0) >= (item.requiredExp || 0);

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                    isEquipped
                      ? 'bg-amber-950/30 border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50'
                      : isUnlocked
                      ? 'bg-slate-950/80 border-slate-700 hover:border-slate-600'
                      : 'bg-slate-950/40 border-slate-800 opacity-60'
                  }`}
                >
                  <div>
                    {/* Header Slot & Icon */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl p-1 rounded-xl bg-slate-900 border border-slate-800">{item.icon}</span>
                        <div>
                          <h5 className="font-black text-xs text-white">{item.name}</h5>
                          <span className="text-[9px] font-mono uppercase text-amber-400/80">
                            Slot: {item.slot}
                          </span>
                        </div>
                      </div>
                      
                      {isEquipped ? (
                        <span className="text-[9px] font-black text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                          สวมใส่อยู่
                        </span>
                      ) : !isUnlocked ? (
                        <span className="text-[9px] font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> ล็อก
                        </span>
                      ) : null}
                    </div>

                    <p className="text-[11px] text-amber-200/90 font-medium my-2.5 leading-relaxed">
                      {item.bonusText}
                    </p>
                  </div>

                  <div>
                    {!isUnlocked ? (
                      <div className="text-[10px] text-amber-400/80 font-mono text-center py-2 bg-slate-900/60 rounded-xl border border-slate-800">
                        🔒 ปลดล็อกที่ {item.requiredExp?.toLocaleString()} EXP
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleToggleEquip(item)}
                        className={`w-full text-[11px] font-black uppercase tracking-wider h-8 rounded-xl cursor-pointer ${
                          isEquipped
                            ? 'bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 hover:bg-amber-600 hover:text-white text-slate-200 border border-slate-700'
                        }`}
                      >
                        {isEquipped ? 'ถอดอุปกรณ์' : 'สวมใส่ใช้งาน'}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Facility 4: สถานพยาบาลฉุกเฉิน (Bio-Infirmary & Ward) */}
      {activeFacility === 'infirmary' && (
        <Card className="p-5 md:p-6 rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-xl space-y-5 animate-in fade-in duration-200">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-black text-emerald-100 uppercase tracking-wide">
                  สถานพยาบาลฉุกเฉิน & คัดกรองเคสสัตวแพทย์ (Bio-Infirmary Triage)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ตอบคำถามทางไวรัสวิทยาสัตวแพทย์เพื่อรักษาอาการบาดเจ็บจากการรบและฟื้นฟู HP 100% เต็มทันที
              </p>
            </div>

            <div className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold ${
              isInjuredFromBattle 
                ? 'bg-red-950/80 text-red-300 border-red-500/60 animate-bounce' 
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/40'
            }`}>
              {isInjuredFromBattle ? '🚨 ผู้ป่วยวิกฤต: บาดเจ็บจากการรบ' : '💚 สถานะปกติ: ไวรัสแข็งแรง'}
            </div>
          </div>

          {/* Dynamic 150-Question Triage Card */}
          {(() => {
            const currentQ = wardQuestions[wardQIndex % wardQuestions.length];
            return (
              <div className="bg-slate-950/90 p-5 rounded-2xl border-2 border-slate-800 space-y-4 shadow-lg">
                <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
                  <span className="flex items-center gap-1.5 font-bold">
                    <HelpCircle className="w-4 h-4 text-cyan-400" />
                    เคสตรวจวินิจฉัย ({wardQIndex + 1}/{wardQuestions.length})
                  </span>
                  <span className="text-emerald-400 font-bold">✨ วินิจฉัยถูกต้อง: ฟื้นฟู HP เต็ม 100%!</span>
                </div>

                <div className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  {currentQ.q}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQ.choices.map((choice, i) => {
                    const isChosen = selectedWardChoice === choice;
                    const isCorrect = choice === currentQ.answer;

                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={treating}
                        onClick={() => handleAnswerRecovery(choice)}
                        className={`p-3.5 rounded-xl border text-xs sm:text-sm font-bold text-left transition-all cursor-pointer ${
                          isChosen
                            ? isCorrect
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
                  <div className={`p-3.5 rounded-xl text-center font-black text-sm animate-in fade-in duration-200 ${
                    wardResult === 'correct' 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' 
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                  }`}>
                    {wardResult === 'correct' 
                      ? '🎉 วินิจฉัยถูกต้อง! หัตถการสำเร็จ ไวรัสฟื้นฟู HP 100% เต็ม พร้อมลงสนามรบ Empire ทันที!' 
                      : '⚠️ วินิจฉัยยังไม่แม่นยำ ได้รับการพยาบาลเบื้องต้น (ฟื้นฟู HP 50%)'}
                  </div>
                )}
              </div>
            );
          })()}
        </Card>
      )}

      {/* Facility 5: หอจดหมายเหตุชีววิทยา (Virology Archive & Mage Guild) */}
      {activeFacility === 'archive' && (
        <Card className="p-5 md:p-6 rounded-3xl border-2 border-purple-500/30 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 shadow-xl space-y-4 animate-in fade-in duration-200">
          
          <div className="flex items-center gap-2 mb-2 border-b border-slate-800 pb-3">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-black text-white">
              หอจดหมายเหตุชีววิทยา: {pet.virusName} ({pet.family})
            </h3>
          </div>

          {virusInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div>
                  <span className="text-purple-300 font-bold block mb-0.5">🧬 สารพันธุกรรม & สัณฐานวิทยา (Genome):</span>
                  <span className="text-slate-300 font-mono">{virusInfo.genome || 'ssRNA / dsDNA'}</span>
                </div>
                <div>
                  <span className="text-purple-300 font-bold block mb-0.5">🐾 โฮสต์สำคัญทางสัตวแพทย์ (Hosts):</span>
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

              <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
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
            <div className="text-slate-400 text-xs py-6 text-center font-mono">
              กำลังซิงค์บันทึกชีววิทยาไวรัสวิทยาจากคลังข้อสอบส่วนกลาง...
            </div>
          )}
        </Card>
      )}

    </div>
  );
}

// ── HoMM Town Facility Tab Button ───────────────────────────────────────────
function FacilityTabBtn({ 
  icon, 
  label, 
  subLabel, 
  isActive, 
  badge, 
  isAlert, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  subLabel: string; 
  isActive: boolean; 
  badge?: string; 
  isAlert?: boolean; 
  onClick: () => void; 
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-2 sm:p-2.5 rounded-xl sm:rounded-2xl text-left transition-all relative cursor-pointer border flex flex-col justify-between min-h-[58px] sm:min-h-[64px] ${
        isActive
          ? 'bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-950 border-amber-400 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/60'
          : 'bg-slate-900/80 border-slate-800/90 text-slate-400 hover:text-slate-100 hover:bg-slate-850 hover:border-amber-500/40'
      }`}
    >
      <div className="flex items-start gap-2">
        <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className={`text-xs sm:text-[13px] font-black tracking-wide truncate ${isActive ? 'text-amber-100' : 'text-slate-200'}`}>
            {label}
          </div>
          <div className="text-[10px] font-mono text-slate-400 truncate leading-tight mt-0.5">
            {subLabel}
          </div>
        </div>
      </div>

      {/* Active Gold Indicator Notch */}
      {isActive && (
        <div className="w-6 h-1 rounded-full bg-amber-400 mx-auto mt-1 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
      )}

      {badge && (
        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] font-mono animate-pulse shadow-md">
          {badge}
        </span>
      )}

      {isAlert && (
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute -top-1 -right-1" />
      )}
    </button>
  );
}

// ── Resource Meter Bar (HoMM Style) ──────────────────────────────────────────
function ResourceBar({ 
  icon, 
  label, 
  value, 
  barColor 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number; 
  barColor: string; 
}) {
  return (
    <div className="w-full flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex justify-between text-[10px] font-black text-slate-300 mb-1 font-mono">
          <span>{label}</span>
          <span className="text-white">{value}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <motion.div 
            className={`h-full ${barColor}`}
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Stat Card for Town Hall ──────────────────────────────────────────────────
function StatCard({
  name,
  code,
  val,
  desc,
  effect,
  isMax,
  canUpgrade,
  accentColor,
  onUpgrade,
}: {
  name: string;
  code: string;
  val: number;
  desc: string;
  effect: string;
  isMax: boolean;
  canUpgrade: boolean;
  accentColor: 'red' | 'emerald' | 'blue' | 'amber';
  onUpgrade: () => void;
}) {
  const colorMap = {
    red: { text: 'text-red-400', border: 'border-red-500/30', bg: 'bg-red-950/20' },
    emerald: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/20' },
    blue: { text: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-950/20' },
    amber: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20' },
  }[accentColor];

  return (
    <div className={`p-4 rounded-2xl border-2 ${colorMap.border} ${colorMap.bg} flex flex-col justify-between shadow-md`}>
      <div>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-black uppercase tracking-wider ${colorMap.text}`}>
            {name}
          </span>
          <span className="text-[10px] font-mono text-slate-500 font-bold">{code}</span>
        </div>

        <div className="text-3xl font-black text-white mt-1 leading-none flex items-baseline gap-1.5">
          <span>{val}</span>
          {isMax ? (
            <span className="text-[10px] text-amber-400 font-mono font-bold">MAX ({MAX_PER_STAT})</span>
          ) : (
            <span className="text-[10px] text-slate-500 font-mono">/ {MAX_PER_STAT}</span>
          )}
        </div>

        <div className="text-[11px] text-slate-300 font-mono mt-2 font-medium">{desc}</div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{effect}</div>
      </div>

      <button
        type="button"
        onClick={onUpgrade}
        disabled={!canUpgrade}
        title={isMax ? 'เต็มขีดจำกัดแล้ว' : canUpgrade ? 'จัดสรรแต้ม (+1)' : 'ไม่มีแต้มสะสม'}
        className={`w-full mt-3 py-2 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1 ${
          isMax
            ? 'bg-amber-950/60 text-amber-400/60 border border-amber-900/50 cursor-not-allowed'
            : canUpgrade
            ? 'bg-slate-800 text-white hover:bg-amber-600 hover:text-white border border-slate-600 hover:scale-[1.02] active:scale-95 shadow-md' 
            : 'bg-slate-900 text-slate-700 border border-slate-800 cursor-not-allowed'
        }`}
      >
        {isMax ? 'ถึงขีดจำกัดแล้ว (MAX)' : canUpgrade ? '+ อัปเกรด (+1 แต้ม)' : 'ไม่มีแต้ม'}
      </button>
    </div>
  );
}
