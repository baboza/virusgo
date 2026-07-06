"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { ShieldAlert, Award, Medal, Zap, Star, Target, Crown } from 'lucide-react';

const ACHIEVEMENTS = [
  {
    id: 'a1',
    title: 'Rookie',
    subtitle: 'นิสิตฝึกหัด',
    desc: 'เริ่มต้นการเดินทางในฐานะนักไวรัสวิทยา',
    icon: Star,
    color: 'text-slate-400',
    bg: 'bg-slate-400/20',
    border: 'border-slate-400/50',
    reqExp: 0
  },
  {
    id: 'a2',
    title: 'Virus Hunter',
    subtitle: 'นักล่าไวรัส',
    desc: 'สะสม EXP ถึง 500 แต้ม',
    icon: Target,
    color: 'text-blue-400',
    bg: 'bg-blue-400/20',
    border: 'border-blue-400/50',
    reqExp: 500
  },
  {
    id: 'a3',
    title: 'Lab Expert',
    subtitle: 'ผู้เชี่ยวชาญห้องแล็บ',
    desc: 'สะสม EXP ถึง 1,500 แต้ม',
    icon: Zap,
    color: 'text-purple-400',
    bg: 'bg-purple-400/20',
    border: 'border-purple-400/50',
    reqExp: 1500
  },
  {
    id: 'a4',
    title: 'Bio-Detective',
    subtitle: 'ยอดนักสืบชีวภาพ',
    desc: 'สะสม EXP ถึง 3,000 แต้ม',
    icon: ShieldAlert,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/20',
    border: 'border-emerald-400/50',
    reqExp: 3000
  },
  {
    id: 'a5',
    title: 'Virology Master',
    subtitle: 'ปรมาจารย์ด้านไวรัสวิทยา',
    desc: 'สะสม EXP ถึง 5,000 แต้ม',
    icon: Crown,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
    reqExp: 5000
  }
];

export default function ProfilePage() {
  const { appUser } = useAuth();

  if (!appUser) return null;

  const currentLevel = appUser.level || 1;
  const currentExp = appUser.exp || 0;
  const nextLevelExp = currentLevel * 100;
  const progress = (currentExp / nextLevelExp) * 100;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <div className="space-y-8 pb-24 px-2 pt-4 max-w-4xl mx-auto">
      <div className="text-center relative mb-12">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 blur-[60px] -z-10" />
        <Medal className="w-16 h-16 text-primary mx-auto mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
        <h1 className="text-4xl font-black text-white tracking-widest text-glow uppercase mb-2">
          แฟ้มประวัติส่วนตัว
        </h1>
        <p className="text-primary font-mono text-sm uppercase tracking-widest">
          CADET DOSSIER
        </p>
      </div>

      {/* ID Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="p-6 md:p-8 glass-neon relative overflow-hidden border-primary/40">
          <div className="scanlines" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center border-2 border-primary/50 shadow-[0_0_30px_rgba(59,130,246,0.4)] overflow-hidden shrink-0">
              {appUser.photoURL ? (
                <img src={appUser.photoURL} alt={appUser.fullname} className="w-full h-full object-cover" />
              ) : (
                <ShieldAlert className="w-16 h-16 text-white" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left w-full">
              <div className="text-primary font-mono text-xs tracking-widest uppercase mb-1">ID: {appUser.uid.substring(0, 8)}</div>
              <h2 className="text-3xl font-black text-white tracking-wide uppercase mb-2 text-glow">{appUser.fullname}</h2>
              <div className="text-slate-400 font-mono text-sm mb-6">{appUser.email}</div>
              
              <div className="flex items-center gap-4 mb-2">
                <div className="bg-accent text-slate-900 font-black px-4 py-1 rounded-full text-sm">
                  LEVEL {currentLevel}
                </div>
                <div className="text-primary font-bold flex items-center gap-1 font-mono">
                  {currentExp} / {nextLevelExp} EXP
                </div>
              </div>

              <div className="w-full bg-slate-900/80 rounded-full h-3 border border-primary/30 relative overflow-hidden">
                <motion.div 
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary to-blue-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Achievements System */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="pt-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <Award className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-black text-white uppercase tracking-widest text-glow-accent">เหรียญตราเกียรติยศ (Achievements)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = currentExp >= ach.reqExp;
            const Icon = ach.icon;

            return (
              <motion.div variants={item} key={ach.id}>
                <Card className={`p-4 flex items-center gap-4 transition-all duration-300 ${isUnlocked ? 'glass border-slate-700 hover:scale-[1.02]' : 'bg-black/40 border-slate-800 opacity-60 grayscale'}`}>
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center shrink-0 ${isUnlocked ? `${ach.bg} ${ach.border} border` : 'bg-slate-900 border border-slate-800'}`}>
                    <Icon className={`w-8 h-8 ${isUnlocked ? ach.color : 'text-slate-600'}`} />
                  </div>
                  <div>
                    <h3 className={`font-bold text-lg ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{ach.title} <span className="text-sm font-normal opacity-70">({ach.subtitle})</span></h3>
                    <p className={`text-sm ${isUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>{ach.desc}</p>
                    {!isUnlocked && (
                      <div className="text-xs text-danger font-mono mt-1">
                        ต้องการ {ach.reqExp} EXP เพื่อปลดล็อค
                      </div>
                    )}
                  </div>
                  {isUnlocked && (
                    <div className="ml-auto text-accent">
                      <Zap className="w-5 h-5 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
