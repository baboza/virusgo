"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ScanSearch, 
  GitMerge, 
  Map, 
  Microscope, 
  Timer, 
  Swords, 
  Lock,
  Play,
  Users,
  Stethoscope,
  Shield,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

export default function StageSelect() {
  const gameModes = [
    {
      id: 'identification',
      title: 'Virus Identification',
      description: 'Identify viruses based on clinical signs. Earn +10 EXP.',
      icon: ScanSearch,
      color: 'text-blue-500',
      border: 'border-blue-500',
      bg: 'bg-blue-500/10',
      href: '/student/play/identification',
      unlocked: true,
      stage: '01'
    },
    {
      id: 'boss-battle',
      title: 'Boss Battle',
      description: 'Face off against deadly viruses in epic combat.',
      icon: Swords,
      color: 'text-danger',
      border: 'border-danger',
      bg: 'bg-danger/10',
      href: '/student/play/boss-battle',
      unlocked: true,
      stage: '02'
    },
    {
      id: 'matching',
      title: 'Matching Game',
      description: 'Drag and drop to match virus data.',
      icon: GitMerge,
      color: 'text-secondary',
      border: 'border-secondary',
      bg: 'bg-secondary/10',
      href: '/student/play/matching',
      unlocked: true,
      stage: '03'
    },
    {
      id: 'outbreak',
      title: 'Outbreak Sim',
      description: 'Manage a virtual farm outbreak.',
      icon: Map,
      color: 'text-accent',
      border: 'border-accent',
      bg: 'bg-accent/10',
      href: '/student/play/outbreak',
      unlocked: true,
      stage: '04'
    },
    {
      id: 'lab-detective',
      title: 'Lab Detective',
      description: 'Interpret ELISA and PCR results.',
      icon: Microscope,
      color: 'text-purple-500',
      border: 'border-purple-500',
      bg: 'bg-purple-500/10',
      href: '/student/play/lab-detective',
      unlocked: true,
      stage: '05'
    },
    {
      id: 'time-attack',
      title: 'Time Attack',
      description: '60-second rapid fire challenge!',
      icon: Timer,
      color: 'text-orange-500',
      border: 'border-orange-500',
      bg: 'bg-orange-500/10',
      href: '/student/play/time-attack',
      unlocked: true,
      stage: '06'
    },
    {
      id: 'virus-battle-coop',
      title: 'Virus Battle (Co-op)',
      description: 'Team up with a friend to defeat a boss virus!',
      icon: Users, // Using Users icon
      color: 'text-pink-500',
      border: 'border-pink-500',
      bg: 'bg-pink-500/10',
      href: '/student/play/virus-battle',
      unlocked: true,
      stage: '07'
    },
    {
      id: 'diagnosis-duel',
      title: 'Diagnosis Duel (1v1)',
      description: 'Compete in real-time veterinary case studies.',
      icon: Stethoscope,
      color: 'text-cyan-400',
      border: 'border-cyan-400',
      bg: 'bg-cyan-400/10',
      href: '/student/play/diagnosis-duel',
      unlocked: true,
      stage: '08'
    },
    {
      id: 'farm-defense',
      title: 'Farm Defense (1v1)',
      description: 'Manage budget and animals to survive an outbreak.',
      icon: Shield,
      color: 'text-emerald-400',
      border: 'border-emerald-400',
      bg: 'bg-emerald-400/10',
      href: '/student/play/farm-defense',
      unlocked: true,
      stage: '09'
    },
    {
      id: 'classroom-battle',
      title: 'Classroom Battle',
      description: 'Kahoot-style live veterinary quiz. Compete with your class!',
      icon: Trophy,
      color: 'text-yellow-400',
      border: 'border-yellow-400',
      bg: 'bg-yellow-400/10',
      href: '/student/play/classroom-battle',
      unlocked: true,
      stage: '10'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1, transition: { type: "spring" } }
  };

  const coopIds = ['virus-battle-coop', 'diagnosis-duel', 'farm-defense', 'classroom-battle'];
  const soloModes = gameModes.filter(m => !coopIds.includes(m.id));
  const coopModes = gameModes.filter(m => coopIds.includes(m.id));

  const renderModes = (modes: typeof gameModes) => (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        
        if (!mode.unlocked) {
          return (
            <motion.div variants={item} key={mode.id} className="h-full">
              <div className="glass p-6 rounded-3xl h-full border-slate-800 opacity-50 relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute top-4 left-4 text-slate-700 font-black text-4xl opacity-30 italic">
                  {mode.stage}
                </div>
                <Lock className="w-12 h-12 text-slate-600 mb-4" />
                <h3 className="text-xl font-bold text-slate-500 mb-2 uppercase">{mode.title}</h3>
                <div className="text-xs text-slate-600 font-mono">LOCKED</div>
              </div>
            </motion.div>
          );
        }

        return (
          <Link key={mode.id} href={mode.href}>
            <motion.div variants={item} className="h-full">
              <div className={`glass p-6 rounded-3xl h-full border-b-4 border-r-4 ${mode.border} hover:-translate-y-2 hover:-translate-x-2 transition-all duration-300 relative overflow-hidden flex flex-col group cursor-pointer`}>
                
                {/* Glowing background on hover */}
                <div className={`absolute -inset-4 ${mode.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />
                
                <div className={`absolute top-4 left-4 font-black text-4xl opacity-20 italic ${mode.color}`}>
                  {mode.stage}
                </div>

                <div className="flex-1 flex flex-col items-center text-center pt-8 z-10">
                  <div className={`w-16 h-16 rounded-2xl ${mode.bg} ${mode.color} flex items-center justify-center mb-6 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-black text-white tracking-wide uppercase mb-2 text-glow">
                    {mode.title}
                  </h3>
                  
                  <p className="text-slate-400 text-sm font-medium">
                    {mode.description}
                  </p>
                </div>

                <div className={`mt-6 w-full py-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-center gap-2 font-black tracking-widest text-sm uppercase ${mode.color} opacity-0 group-hover:opacity-100 transition-all duration-300`}>
                  <Play className="w-4 h-4" /> ENGAGE
                </div>
              </div>
            </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );

  return (
    <div className="space-y-12 pb-24 pt-4 px-2">
      <div className="text-center max-w-2xl mx-auto mb-12 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-primary/20 blur-[50px] -z-10" />
        <h1 className="text-4xl font-black text-white tracking-widest text-glow uppercase mb-2">
          Select Stage
        </h1>
        <p className="text-primary font-mono text-sm uppercase tracking-widest">
          Choose your next mission
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-300 tracking-widest uppercase flex items-center gap-3">
          <span className="w-2 h-8 bg-slate-600 rounded-full"></span>
          Solo Missions
        </h2>
        {renderModes(soloModes)}
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center gap-3">
          <span className="w-2 h-8 bg-secondary rounded-full"></span>
          Team Missions
        </h2>
        {renderModes(coopModes)}
      </div>
    </div>
  );
}
