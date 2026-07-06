"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Utensils, Dna, Moon, ArrowLeft, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getViruses } from '@/lib/firebase/virusService';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';

interface VirusPetData {
  virusID: string;
  virusName: string;
  family: string;
  hunger: number; // 0-100
  happiness: number; // 0-100
  energy: number; // 0-100
  stage: number; // 1: Egg, 2: Larva, 3: Mature
  careCount: number;
  lastUpdate: string;
}

export default function VirusPet() {
  const { appUser } = useAuth();
  const [pet, setPet] = useState<VirusPetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionAnim, setActionAnim] = useState<string | null>(null);
  const [sick, setSick] = useState(false);

  useEffect(() => {
    if (!appUser) return;
    
    // Check if user is Virus Hunter (EXP >= 500)
    if ((appUser.exp || 0) < 500) {
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
              lastUpdate: new Date().toISOString()
            };
            await updateDoc(petRef, { pet: petData });
          }
        }

        if (petData) {
          // Calculate time decay
          const lastDate = new Date(petData.lastUpdate);
          const now = new Date();
          const diffHours = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60);

          if (diffHours > 0.5) { // Decrease every 30 mins roughly
            const decay = Math.floor(diffHours * 5); // 10 points per hour
            petData.hunger = Math.max(0, petData.hunger - decay);
            petData.happiness = Math.max(0, petData.happiness - decay);
            petData.energy = Math.max(0, petData.energy - Math.floor(decay / 2));
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

  return (
    <div className="max-w-md mx-auto space-y-6 pb-24 pt-4 px-2">
      <div className="flex items-center justify-between">
        <Link href="/student" onClick={() => sfx.click()}>
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="font-bold text-purple-400 text-glow flex items-center gap-2">
          <Heart className="w-5 h-5 animate-pulse" /> VIRUS PET
        </div>
        <div className="w-10"></div>
      </div>

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
              <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }} transition={{ repeat: Infinity, duration: 2 }} className="absolute top-4 right-1/4 z-20">
                <AlertCircle className="w-12 h-12 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />
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
          <StatBar icon={<Utensils className="w-4 h-4" />} label="Hunger" value={pet.hunger} bgClass="bg-orange-500" textClass="text-orange-500" />
          <StatBar icon={<Sparkles className="w-4 h-4" />} label="Happiness" value={pet.happiness} bgClass="bg-pink-500" textClass="text-pink-500" />
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
          <Utensils className="w-6 h-6" />
          <span className="text-[10px] font-black uppercase tracking-widest">Infect</span>
        </Button>
        <Button 
          onClick={() => handleAction('play')} 
          disabled={actionAnim !== null || pet.energy < 10 || pet.happiness >= 100}
          className="h-20 flex flex-col gap-2 bg-slate-800 hover:bg-pink-900/50 border border-slate-700 hover:border-pink-500 text-slate-400 hover:text-pink-400 transition-all"
        >
          <Dna className="w-6 h-6" />
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
