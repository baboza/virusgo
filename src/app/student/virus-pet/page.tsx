"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Crosshair, Target, Moon, ArrowLeft, Loader2, Star, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getViruses } from '@/lib/firebase/virusService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';

import { VirusPetData } from '@/types';

export default function VirusPet() {
  const { appUser } = useAuth();
  const [pet, setPet] = useState<VirusPetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionAnim, setActionAnim] = useState<string | null>(null);
  const [sick, setSick] = useState(false);
  const [penaltyNotice, setPenaltyNotice] = useState<string | null>(null);

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
              hunger: 50,
              happiness: 50,
              energy: 100,
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
          
          // Calculate time decay
          const lastDate = new Date(petData.lastUpdate);
          const now = new Date();
          const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

          if (diffHours > 0.5) { // Decrease every 30 mins roughly
            const decay = Math.floor(diffHours * 5); // 5 points per hour
            petData.hunger = Math.max(0, petData.hunger - decay);
            petData.happiness = Math.max(0, petData.happiness - decay);
            petData.energy = Math.max(0, petData.energy - Math.floor(decay / 2));

            // Stat penalty: only if critically neglected (>12h) AND stats are low
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
            
            // Save updated decay
            await updateDoc(petRef, { pet: petData });
          }

          setPet(petData);
          checkSick(petData);
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
    if (p.hunger < 20 || p.happiness < 20 || p.energy < 10) {
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
      sfx.correct(); // Evolution sound
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

  const totalPoints = Math.floor((appUser?.exp || 0) / 100);
  const spentPoints = pet?.stats?.spentPoints || 0;
  const availablePoints = Math.max(0, totalPoints - spentPoints);

  const handleUpgradeStat = async (stat: 'str' | 'vit' | 'agi' | 'dex') => {
    if (!pet || !pet.stats || availablePoints <= 0 || !appUser) return;
    sfx.click();
    
    const newStats = { ...pet.stats, [stat]: pet.stats[stat] + 1, spentPoints: pet.stats.spentPoints + 1 };
    const newPet = { ...pet, stats: newStats };
    setPet(newPet);
    
    try {
      await updateDoc(doc(db, 'users', appUser.uid), { pet: newPet });
    } catch (e) {
      console.error("Failed to upgrade stat", e);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!pet) return (
    <div className="text-center py-20 text-slate-400">
      Failed to incubate virus. No data found.
    </div>
  );

  const getPetScale = () => {
    if (pet.stage === 1) return 'scale-[0.4] opacity-80 blur-[2px] contrast-200 sepia-[0.3]';
    if (pet.stage === 2) return 'scale-[0.7] opacity-90 sepia-[0.1]';
    return 'scale-100';
  };

  return (<div className="max-w-4xl mx-auto space-y-6 z-10 relative">
        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <Link href="/student">
            <Button variant="secondary" className="font-bold">
              <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปหน้าหลัก
            </Button>
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-black text-cyan-400 uppercase tracking-widest text-glow flex items-center gap-2">
              <Star className="text-cyan-400" />
              ห้องเพาะเลี้ยง
            </h1>
          </div>
        </div>

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 glass-neon border-purple-500/40 relative overflow-hidden text-center min-h-[450px] flex flex-col items-center justify-between shadow-[0_0_40px_rgba(168,85,247,0.15)]">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-black/60 pointer-events-none" />
        <div className="scanlines opacity-50" />
        
        {/* Name and Stage */}
        <div className="absolute top-4 w-full left-0 z-10 px-6 flex justify-between items-start">
          <div className="text-left">
            <h2 className="text-xl md:text-2xl font-black text-white text-glow-accent">{pet.virusName}</h2>
            <p className="text-[10px] md:text-xs text-purple-300 font-mono tracking-widest uppercase">{pet.family}</p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stage</div>
            <div className="text-sm md:text-base font-black text-white text-glow">
              {pet.stage === 1 ? 'Egg' : pet.stage === 2 ? 'Replicating' : 'Mature'}
            </div>
          </div>
        </div>

        {/* Pet Sprite */}
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

          {/* Background Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`w-48 h-48 rounded-full blur-3xl transition-all duration-1000 ${sick ? 'bg-red-500/20' : 'bg-purple-500/20'}`} />
          </div>

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
        </div>

        {/* Stats */}
        <div className="w-full space-y-2 z-10 bg-slate-950/40 p-4 rounded-2xl backdrop-blur-sm border border-slate-800/50">
          <StatBar icon={<Crosshair className="w-4 h-4" />} label="Hunger" value={pet.hunger} bgClass="bg-orange-500" textClass="text-orange-500" />
          <StatBar icon={<Star className="w-4 h-4" />} label="Happiness" value={pet.happiness} bgClass="bg-pink-500" textClass="text-pink-500" />
          <StatBar icon={<Zap className="w-4 h-4" />} label="Energy" value={pet.energy} bgClass="bg-blue-500" textClass="text-blue-500" />
        </div>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Button 
          onClick={() => handleAction('feed')} 
          disabled={actionAnim !== null || pet.hunger >= 100}
          className="h-20 flex flex-col gap-2 bg-slate-800 hover:bg-orange-900/50 border border-slate-700 hover:border-orange-500 text-slate-400 hover:text-orange-400 transition-all"
        >
          <Crosshair className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Infect</span>
        </Button>
        <Button 
          onClick={() => handleAction('play')} 
          disabled={actionAnim !== null || pet.energy < 10 || pet.happiness >= 100}
          className="h-20 flex flex-col gap-2 bg-slate-800 hover:bg-pink-900/50 border border-slate-700 hover:border-pink-500 text-slate-400 hover:text-pink-400 transition-all"
        >
          <Target className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Mutate</span>
        </Button>
        <Button 
          onClick={() => handleAction('sleep')} 
          disabled={actionAnim !== null || pet.energy >= 100}
          className="h-20 flex flex-col gap-2 bg-slate-800 hover:bg-blue-900/50 border border-slate-700 hover:border-blue-500 text-slate-400 hover:text-blue-400 transition-all"
        >
          <Moon className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Dormant</span>
        </Button>
      </div>

      {/* RPG Stats Allocation */}
      <Card className="mt-6 p-4 md:p-6 glass border-slate-700 backdrop-blur-md">
        <div className="flex justify-between items-center mb-4 border-b border-slate-700/50 pb-2">
          <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" /> RPG Stats
          </h3>
          <div className="text-xs font-mono">
            <span className="text-slate-400">Available Points:</span>{' '}
            <span className={`font-black text-lg ${availablePoints > 0 ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-slate-500'}`}>
              {availablePoints}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            { id: 'str', name: 'STR', color: 'text-red-400', border: 'border-red-900/50', bg: 'bg-red-900/20' },
            { id: 'vit', name: 'VIT', color: 'text-green-400', border: 'border-green-900/50', bg: 'bg-green-900/20' },
            { id: 'agi', name: 'AGI', color: 'text-blue-400', border: 'border-blue-900/50', bg: 'bg-blue-900/20' },
            { id: 'dex', name: 'DEX', color: 'text-yellow-400', border: 'border-yellow-900/50', bg: 'bg-yellow-900/20' },
          ].map(s => {
            const statVal = pet?.stats?.[s.id as 'str' | 'vit' | 'agi' | 'dex'] || 1;
            return (
              <div key={s.id} className={`p-3 rounded-xl border ${s.border} ${s.bg} flex items-center justify-between`}>
                <div>
                  <div className={`text-sm font-black uppercase ${s.color} tracking-widest`}>{s.name}</div>
                  <div className="text-2xl font-black text-white mt-1 leading-none">{statVal}</div>
                </div>
                <button
                  onClick={() => handleUpgradeStat(s.id as any)}
                  disabled={availablePoints <= 0}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-xl transition-all ${
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
          Earn points by playing mini-games (100 EXP = 1 Point)
        </div>
      </Card>
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
