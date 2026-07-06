"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  Crosshair, 
  Zap, 
  Target,
  Award,
  ChevronRight,
  Database,
  Star,
  Crown,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ── Achievement definitions (Aligned with Leaderboard) ────────────────────
const ACHIEVEMENTS = [
  {
    id: 'a1',
    title: 'Rookie',
    subtitle: 'นิสิตฝึกหัด',
    desc: 'เริ่มต้นการเดินทางในฐานะนักไวรัสวิทยา',
    icon: Star,
    color: 'text-slate-400',
    glow: 'rgba(148,163,184,0.5)',
    bg: 'bg-slate-400/20',
    border: 'border-slate-400/50',
    reqExp: 0,
    emoji: '🔰'
  },
  {
    id: 'a2',
    title: 'Virus Hunter',
    subtitle: 'นักล่าไวรัส',
    desc: 'สะสม EXP ถึง 500 แต้ม',
    icon: Crosshair,
    color: 'text-blue-400',
    glow: 'rgba(96,165,250,0.5)',
    bg: 'bg-blue-400/20',
    border: 'border-blue-400/50',
    reqExp: 500,
    emoji: '⚔️'
  },
  {
    id: 'a3',
    title: 'Lab Expert',
    subtitle: 'ผู้เชี่ยวชาญห้องแล็บ',
    desc: 'สะสม EXP ถึง 1,500 แต้ม',
    icon: Database,
    color: 'text-purple-400',
    glow: 'rgba(192,132,252,0.5)',
    bg: 'bg-purple-400/20',
    border: 'border-purple-400/50',
    reqExp: 1500,
    emoji: '🔬'
  },
  {
    id: 'a4',
    title: 'Bio-Detective',
    subtitle: 'ยอดนักสืบชีวภาพ',
    desc: 'สะสม EXP ถึง 3,000 แต้ม',
    icon: Target,
    color: 'text-emerald-400',
    glow: 'rgba(52,211,153,0.5)',
    bg: 'bg-emerald-400/20',
    border: 'border-emerald-400/50',
    reqExp: 3000,
    emoji: '🕵️'
  },
  {
    id: 'a5',
    title: 'Virology Master',
    subtitle: 'ปรมาจารย์ด้านไวรัสวิทยา',
    desc: 'สะสม EXP ถึง 5,000 แต้ม',
    icon: Crown,
    color: 'text-yellow-400',
    glow: 'rgba(234,179,8,0.5)',
    bg: 'bg-yellow-400/20',
    border: 'border-yellow-400/50',
    reqExp: 5000,
    emoji: '👑'
  },
];

export default function PlayerHub() {
  const { appUser } = useAuth();
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    if (appUser) {
      const fetchHistory = async () => {
        try {
          const snap = await getDocs(collection(db, 'users', appUser.uid, 'history'));
          const data = snap.docs.map(doc => doc.data());
          setHistory(data);
        } catch (e) {
          console.error("Error fetching history", e);
        }
      };
      fetchHistory();
    }
  }, [appUser]);

  if (!appUser) return null;

  const currentLevel = appUser.level || 1;
  const currentExp = appUser.exp || 0;
  // Make nextLevelExp scale nicely
  const nextLevelExp = currentLevel * 200; 
  const progress = Math.min((currentExp / nextLevelExp) * 100, 100);

  // Find the highest unlocked achievement (current rank)
  const unlockedAchs = ACHIEVEMENTS.filter(a => currentExp >= a.reqExp);
  const currentRank = unlockedAchs[unlockedAchs.length - 1] ?? ACHIEVEMENTS[0];
  const nextRank = ACHIEVEMENTS.find(a => currentExp < a.reqExp);

  // Compute stats from history
  const hasPlayedBoss = history.some(h => h.gameId === 'boss-battle' || h.gameId === 'virus-battle');
  const uniqueGamesPlayed = new Set(history.map(h => h.gameId)).size;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 px-2">
      {/* HUD Header */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-neon p-6 rounded-3xl border-primary/40 relative overflow-hidden"
      >
        <div className="scanlines" />
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          
          {/* Avatar */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center border-2 border-primary/50 shadow-[0_0_20px_rgba(59,130,246,0.4)] overflow-hidden">
              {appUser.photoURL
                ? <img src={appUser.photoURL} alt={appUser.fullname} className="w-full h-full object-cover" />
                : <ShieldAlert className="w-12 h-12 text-white" />
              }
            </div>
            <div className="absolute -bottom-3 -right-3 bg-accent text-slate-900 font-black px-3 py-1 rounded-full border-2 border-slate-900 shadow-lg text-sm">
              Lvl {currentLevel}
            </div>
          </div>

          {/* Player Stats */}
          <div className="flex-1 text-center md:text-left w-full">
            <h1 className="text-3xl font-black text-white text-glow tracking-wide mb-1 uppercase">
              {appUser.fullname}
            </h1>
            {/* Current Rank Badge */}
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-4 border ${currentRank.bg} ${currentRank.color} ${currentRank.border}`}>
              <span>{currentRank.emoji}</span>
              <span>{currentRank.title}</span>
              <span className="opacity-60 hidden md:inline">/ {currentRank.subtitle}</span>
            </div>

            {/* EXP Bar */}
            <div className="w-full bg-slate-900/80 rounded-full h-4 border border-primary/30 relative overflow-hidden">
              <motion.div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary to-blue-400"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                {currentExp} / {nextLevelExp} EXP
              </div>
            </div>
            {nextRank && (
              <p className="text-[10px] text-slate-500 font-mono mt-1 text-right">
                อีก {nextRank.reqExp - currentExp} EXP → {nextRank.title} ({nextRank.subtitle})
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Achievements Row ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-accent" /> เหรียญตรายศ (Rank Badges)
          </h2>
          <Link href="/student/profile" className="text-xs text-primary hover:text-blue-300 font-bold transition-colors flex items-center gap-1">
            ดูทั้งหมด <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = currentExp >= ach.reqExp;
            const isCurrent = ach.id === currentRank.id;
            const Icon = ach.icon;

            return (
              <motion.div
                key={ach.id}
                whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all duration-300 ${
                  isUnlocked
                    ? `${ach.bg} ${ach.border} shadow-lg`
                    : 'bg-slate-900/40 border-slate-800 opacity-40 grayscale'
                } ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-slate-950' : ''}`}
                style={isCurrent ? { ringColor: ach.glow } : {}}
              >
                {/* Current badge pulse */}
                {isCurrent && (
                  <motion.div
                    className={`absolute inset-0 rounded-2xl ${ach.border} border-2 opacity-60`}
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUnlocked ? ach.bg : 'bg-slate-800'}`}
                  style={isUnlocked ? { boxShadow: `0 0 12px ${ach.glow}` } : {}}
                >
                  {isUnlocked
                    ? <Icon className={`w-6 h-6 ${ach.color}`} />
                    : <Lock className="w-5 h-5 text-slate-600" />
                  }
                </div>

                <div>
                  <p className={`text-[10px] font-black leading-tight ${isUnlocked ? ach.color : 'text-slate-600'}`}>
                    {ach.title}
                  </p>
                  <p className="text-[9px] text-slate-500 leading-tight mt-0.5">{ach.subtitle}</p>
                </div>

                {isCurrent && (
                  <span className="absolute -top-2 -right-2 text-[9px] bg-accent text-slate-900 font-black px-1.5 py-0.5 rounded-full leading-none z-10">
                    ยศปัจจุบัน
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Quick Actions ─────────────────────────────────────────────── */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Missions */}
        <motion.div variants={item} className="md:col-span-2">
          <Link href="/student/play">
            <div className="glass p-6 rounded-3xl h-full border-secondary/30 hover:border-secondary transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-secondary/20 transition-all" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Zap className="w-8 h-8 text-secondary group-hover:scale-110 transition-transform" />
                  <h2 className="text-2xl font-bold text-white tracking-wide">เข้าสู่สนามรบ</h2>
                </div>
                <p className="text-slate-400 text-sm">ปฏิบัติภารกิจมินิเกมทั้ง 11 โหมด เพื่อเก็บคะแนนและอัปยศของคุณ</p>
              </div>
              <div className="mt-8 flex justify-end">
                <div className="text-secondary font-bold flex items-center gap-1 group-hover:translate-x-2 transition-transform">
                  เริ่มปฏิบัติการ <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Codex */}
        <motion.div variants={item}>
          <Link href="/student/learn">
            <div className="glass p-6 rounded-3xl h-full border-accent/30 hover:border-accent transition-all group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[180px]">
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-accent/20 transition-all" />
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Database className="w-6 h-6 text-accent group-hover:scale-110 transition-transform" />
                  <h2 className="text-xl font-bold text-white tracking-wide">Codex</h2>
                </div>
                <p className="text-slate-400 text-sm">เข้าถึงฐานข้อมูลไวรัสส่วนกลาง</p>
              </div>
              <div className="mt-8 flex justify-end">
                <div className="text-accent font-bold flex items-center gap-1 group-hover:translate-x-2 transition-transform text-sm">
                  เข้าถึง <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      </motion.div>

      {/* ── Active Quests ─────────────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="glass-neon p-6 rounded-3xl">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            ภารกิจและความคืบหน้า (Active Quests)
          </h2>
          <div className="space-y-3">
            {[
              {
                title: "ก้าวแรกสู่สนามรบ",
                desc: "เข้าสู่ระบบ VetVirus OS ครั้งแรก",
                exp: "+10 EXP",
                done: true,
                icon: "🚀"
              },
              {
                title: "ปะทะบอส (First Blood)",
                desc: "ผ่านบททดสอบ Boss Battle อย่างน้อย 1 ครั้ง",
                exp: "+50 EXP",
                done: hasPlayedBoss,
                icon: "⚔️"
              },
              {
                title: "ผู้รอบรู้ (Scholar)",
                desc: `อ่านข้อมูลไวรัสใน Codex สะสม 3 ชนิด (อ่านแล้ว: ${appUser.completedLessons?.length || 0} ชนิด)`,
                exp: "+30 EXP",
                done: (appUser.completedLessons?.length || 0) >= 3,
                icon: "📖"
              },
              {
                title: "นักสู้ครอบจักรวาล (All-Rounder)",
                desc: `ลองเล่นเกมให้ครบ 3 โหมดที่ต่างกัน (เล่นแล้ว: ${uniqueGamesPlayed} โหมด)`,
                exp: "+100 EXP",
                done: uniqueGamesPlayed >= 3,
                icon: "🎮"
              },
              {
                title: "ยกระดับ (Level Up)",
                desc: `เลื่อนระดับให้ถึง Level 5 (ปัจจุบัน: Level ${currentLevel})`,
                exp: "+200 EXP",
                done: currentLevel >= 5,
                icon: "⭐"
              },
            ].map((quest, i) => (
              <div key={i} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                quest.done
                  ? 'bg-secondary/10 border-secondary/30'
                  : 'bg-black/40 border-slate-700 hover:border-slate-600'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl shrink-0">{quest.icon}</span>
                  <div>
                    <h4 className={`font-bold text-sm ${quest.done ? 'text-secondary line-through opacity-70' : 'text-slate-200'}`}>
                      {quest.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{quest.desc}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  {quest.done
                    ? <span className="text-secondary text-xl font-bold">✓ สำเร็จ</span>
                    : <span className="font-black text-sm text-accent font-mono">{quest.exp}</span>
                  }
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between text-xs text-slate-500 font-mono">
            <span>สำเร็จแล้ว: {[true, hasPlayedBoss, (appUser.completedLessons?.length || 0) >= 3, uniqueGamesPlayed >= 3, currentLevel >= 5].filter(Boolean).length}/5</span>
            <span>EXP สะสมรวม: {currentExp}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
