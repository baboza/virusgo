"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
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
  Lock,
  Heart,
  Map,
  BookOpen,
  Swords,
  Microscope,
  Clock,
  Sparkles,
  Users,
  Shield,
  Activity,
  Flame,
  CheckCircle2
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
    desc: 'สะสม EXP ถึง 600 แต้ม',
    icon: Crosshair,
    color: 'text-blue-400',
    glow: 'rgba(96,165,250,0.5)',
    bg: 'bg-blue-400/20',
    border: 'border-blue-400/50',
    reqExp: 600,
    emoji: '⚔️'
  },
  {
    id: 'a3',
    title: 'Lab Expert',
    subtitle: 'ผู้เชี่ยวชาญห้องแล็บ',
    desc: 'สะสม EXP ถึง 2,000 แต้ม',
    icon: Database,
    color: 'text-purple-400',
    glow: 'rgba(192,132,252,0.5)',
    bg: 'bg-purple-400/20',
    border: 'border-purple-400/50',
    reqExp: 2000,
    emoji: '🔬'
  },
  {
    id: 'a4',
    title: 'Bio-Detective',
    subtitle: 'ยอดนักสืบชีวภาพ',
    desc: 'สะสม EXP ถึง 5,000 แต้ม',
    icon: Target,
    color: 'text-emerald-400',
    glow: 'rgba(52,211,153,0.5)',
    bg: 'bg-emerald-400/20',
    border: 'border-emerald-400/50',
    reqExp: 5000,
    emoji: '🕵️'
  },
  {
    id: 'a5',
    title: 'Virology Master',
    subtitle: 'ปรมาจารย์ด้านไวรัสวิทยา',
    desc: 'สะสม EXP ถึง 12,000 แต้ม',
    icon: Crown,
    color: 'text-yellow-400',
    glow: 'rgba(234,179,8,0.5)',
    bg: 'bg-yellow-400/20',
    border: 'border-yellow-400/50',
    reqExp: 12000,
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
          // Sort newest first
          data.sort((a: any, b: any) => {
            const timeA = new Date(a.playedAt || 0).getTime();
            const timeB = new Date(b.playedAt || 0).getTime();
            return timeB - timeA;
          });
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
  const currentLevelBaseExp = Math.pow(currentLevel - 1, 2) * 40;
  const nextLevelExp = Math.pow(currentLevel, 2) * 40;
  const levelExpSpan = Math.max(1, nextLevelExp - currentLevelBaseExp);
  const progress = Math.min(
    Math.max(0, ((currentExp - currentLevelBaseExp) / levelExpSpan) * 100),
    100
  );

  // Current and Next Ranks
  const unlockedAchs = ACHIEVEMENTS.filter(a => currentExp >= a.reqExp);
  const currentRank = unlockedAchs[unlockedAchs.length - 1] ?? ACHIEVEMENTS[0];
  const nextRank = ACHIEVEMENTS.find(a => currentExp < a.reqExp);

  // Stats
  const hasPlayedBoss = history.some(h => h.gameId === 'boss-battle' || h.gameId === 'virus-battle');
  const uniqueGamesPlayed = new Set(history.map(h => h.gameId)).size;
  const completedLessonsCount = appUser.completedLessons?.length || 0;
  const isEmpireUnlocked = currentExp >= 1000;
  const isPetUnlocked = currentExp >= 1000;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 px-2 pb-16">
      
      {/* ── 1. HUD COMMAND HEADER ──────────────────────────────────────────────── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-neon p-6 md:p-8 rounded-3xl border-primary/40 relative overflow-hidden shadow-[0_0_40px_rgba(59,130,246,0.15)]"
      >
        <div className="scanlines" />
        
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
          
          {/* Avatar & Player Profile */}
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left w-full lg:w-auto">
            <div className="relative group shrink-0">
              <div 
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-primary via-blue-900 to-slate-900 flex items-center justify-center border-2 border-primary/60 shadow-[0_0_25px_rgba(59,130,246,0.5)] overflow-hidden"
              >
                {appUser.photoURL
                  ? <img src={appUser.photoURL} alt={appUser.fullname} className="w-full h-full object-cover" />
                  : <ShieldAlert className="w-12 h-12 text-blue-300" />
                }
              </div>
              <div className="absolute -bottom-2 -right-2 bg-accent text-slate-950 font-black px-3 py-0.5 rounded-full border-2 border-slate-900 shadow-lg text-xs font-mono">
                LV.{currentLevel}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-white text-glow tracking-wide uppercase">
                  {appUser.fullname}
                </h1>
                {appUser.studentID && (
                  <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700">
                    ID: {appUser.studentID}
                  </span>
                )}
              </div>

              {/* Ranks & Guild Tags */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${currentRank.bg} ${currentRank.color} ${currentRank.border}`}>
                  <span>{currentRank.emoji}</span>
                  <span>{currentRank.title}</span>
                  <span className="opacity-70 text-[11px]">({currentRank.subtitle})</span>
                </div>

                {appUser.guildName ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                    <Users className="w-3.5 h-3.5" />
                    <span>กิลด์: {appUser.guildName}</span>
                  </div>
                ) : (
                  <Link href="/student/empire" className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800/70 text-slate-400 border border-slate-700 hover:border-slate-500 transition-colors">
                    <Users className="w-3 h-3 text-slate-500" />
                    <span>ยังไม่มีกิลด์ (ค้นหาใน Empire)</span>
                  </Link>
                )}
              </div>

              {/* Pet Quick Info */}
              {appUser.pet && (
                <p className="text-xs text-purple-300 flex items-center justify-center sm:justify-start gap-1.5 pt-1">
                  <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400 animate-pulse" />
                  <span>Pet: <strong>{appUser.pet.virusName}</strong> (ขั้นที่ {appUser.pet.stage || 1})</span>
                </p>
              )}
            </div>
          </div>

          {/* EXP Progress Gauge */}
          <div className="w-full lg:w-80 bg-slate-900/80 p-4 rounded-2xl border border-primary/20 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-mono text-slate-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-accent" /> ระดับประสบการณ์ (EXP)
              </span>
              <span className="font-mono font-bold text-accent">
                {currentExp} / {nextLevelExp} EXP
              </span>
            </div>

            <div className="w-full bg-slate-950 rounded-full h-3 border border-slate-800 relative overflow-hidden">
              <motion.div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-primary via-cyan-400 to-accent rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-500 font-mono">
              <span>ความคืบหน้า: {Math.round(progress)}%</span>
              {nextRank ? (
                <span>อีก {nextRank.reqExp - currentExp} EXP → {nextRank.title}</span>
              ) : (
                <span className="text-yellow-400 font-bold">MAX RANK ACHIEVED</span>
              )}
            </div>
          </div>

        </div>

        {/* Quick Operational Stats Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-800/80 relative z-10">
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/70 text-center">
            <div className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">บทเรียนที่อ่านแล้ว</div>
            <div className="text-xl font-black text-cyan-400 font-mono">{completedLessonsCount} / 15 <span className="text-xs text-slate-500">บท</span></div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/70 text-center">
            <div className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">ภารกิจที่เล่นแล้ว</div>
            <div className="text-xl font-black text-purple-400 font-mono">{history.length} <span className="text-xs text-slate-500">ครั้ง</span></div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/70 text-center">
            <div className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">โหมดที่ทดสอบ</div>
            <div className="text-xl font-black text-emerald-400 font-mono">{uniqueGamesPlayed} / 6 <span className="text-xs text-slate-500">โหมด</span></div>
          </div>
          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/70 text-center">
            <div className="text-slate-400 text-[10px] font-mono uppercase tracking-wider mb-0.5">สถานะอาณาจักร</div>
            <div className="text-xl font-black text-amber-400 font-mono">
              {isEmpireUnlocked ? 'Active' : 'Locked'}
            </div>
          </div>
        </div>

      </motion.div>


      {/* ── 2. FEATURED CURRICULUM BANNER ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Link href="/student/learn">
          <div className="p-5 md:p-6 rounded-3xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-slate-900/90 border border-blue-500/40 hover:border-blue-400 transition-all duration-300 relative overflow-hidden group cursor-pointer shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <div className="absolute top-0 right-0 w-80 h-full bg-blue-500/10 blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
            
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-400/50 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                      Curriculum Hub
                    </span>
                    <span className="text-xs text-slate-400">ครบทั้ง 15 บทเรียนสัตวแพทย์</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white group-hover:text-blue-300 transition-colors">
                    หลักสูตรไวรัสวิทยาสัตวแพทย์ (Veterinary Virology 15 Chapters)
                  </h3>
                  <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                    อ่านสรุปสาระสำคัญ, อาการเด่นทางคลินิก (Pathognomonic signs), ดาวน์โหลดสไลด์ประกอบการสอน และดูโมเดล 3D
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <Button className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl border border-blue-400/50 shadow-[0_0_15px_rgba(59,130,246,0.4)] flex items-center gap-2">
                  เข้าสู่คลังความรู้ <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>


      {/* ── 3. FOUR CORE OPERATIONS CARDS ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent" /> ฐานปฏิบัติการหลัก (Operational Hub)
          </h2>
          <span className="text-xs text-slate-500 font-mono">Select your destination</span>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {/* Card 1: Play Center */}
          <motion.div variants={item}>
            <Link href="/student/play">
              <div className="glass p-6 rounded-3xl h-full border-blue-500/30 hover:border-blue-400 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px] hover:shadow-[0_0_25px_rgba(59,130,246,0.25)]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-blue-500/20 transition-all" />
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                      <Crosshair className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      6 มินิเกม
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-blue-300 transition-colors">
                    Game Simulation
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    วินิจฉัยเคสคลินิก, นักสืบแล็บ, จับคู่คุณสมบัติ, สปีดควิซ 60s, ปะทะบอส และแข่งสดในห้องเรียน
                  </p>
                </div>

                <div className="pt-6 flex items-center justify-between text-xs font-bold text-blue-400 border-t border-slate-800/80 mt-4">
                  <span className="font-mono text-slate-400">+10-100 EXP / ข้อ</span>
                  <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                    เข้าสู่สนามทดสอบ <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card 2: Codex & Learn */}
          <motion.div variants={item}>
            <Link href="/student/learn">
              <div className="glass p-6 rounded-3xl h-full border-cyan-500/30 hover:border-cyan-400 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px] hover:shadow-[0_0_25px_rgba(6,182,212,0.25)]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-cyan-500/20 transition-all" />
                
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                      <Database className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      15 บทเรียน
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-cyan-300 transition-colors">
                    Virology Codex
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    คลังข้อมูลอนุกรมวิธานไวรัสสัตวแพทย์ทุกแฟมิลี กลไกการเกิดโรค โมเดล 3D และดาวน์โหลดสไลด์
                  </p>
                </div>

                <div className="pt-6 flex items-center justify-between text-xs font-bold text-cyan-400 border-t border-slate-800/80 mt-4">
                  <span className="font-mono text-slate-400">{completedLessonsCount}/15 ผ่านแล้ว</span>
                  <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                    อ่านตำราและสไลด์ <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Card 3: Virus Pet */}
          <motion.div variants={item}>
            {isPetUnlocked ? (
              <Link href="/student/virus-pet">
                <div className="glass p-6 rounded-3xl h-full border-purple-500/30 hover:border-purple-400 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px] hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-purple-500/20 transition-all" />
                  
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                        <Heart className="w-6 h-6 animate-pulse" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        3D Lab
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white group-hover:text-purple-300 transition-colors">
                      Virus Pet
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      เพาะเลี้ยงและวิวัฒนาการไวรัสส่วนตัวของคุณ ตรวจสอบสัณฐานวิทยา 3D ให้อาหาร และสังเคราะห์สารพันธุกรรม
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-between text-xs font-bold text-purple-400 border-t border-slate-800/80 mt-4">
                    <span className="font-mono text-slate-400">
                      {appUser.pet ? appUser.pet.virusName : 'พร้อมฟักตัว'}
                    </span>
                    <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                      เข้าห้องแล็บ 3D <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="glass p-6 rounded-3xl h-full border-slate-800 bg-slate-900/40 opacity-70 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Lock className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                      1,000 EXP
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-400">
                    Virus Pet
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    ห้องเพาะเลี้ยงไวรัส 3 มิติ ต้องการ 1,000 EXP เพื่อปลดล็อกระบบเพาะเลี้ยง
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 font-mono flex items-center justify-between">
                  <span>ขาดอีก {1000 - currentExp} EXP</span>
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            )}
          </motion.div>

          {/* Card 4: Empire & Guilds */}
          <motion.div variants={item}>
            {isEmpireUnlocked ? (
              <Link href="/student/empire">
                <div className="glass p-6 rounded-3xl h-full border-emerald-500/30 hover:border-emerald-400 transition-all duration-300 group cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[220px] hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 group-hover:bg-emerald-500/20 transition-all" />
                  
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                        <Map className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Guild Wars
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition-colors">
                      Virus Empire
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      แผนที่ Hexagon ขยายอาณาเขต สร้างหรือเข้าร่วมกิลด์ วาง Pet 3D เฝ้าเซกเตอร์ และชิงความเป็นหนึ่ง
                    </p>
                  </div>

                  <div className="pt-6 flex items-center justify-between text-xs font-bold text-emerald-400 border-t border-slate-800/80 mt-4">
                    <span className="font-mono text-slate-400">
                      {appUser.guildName ? `[${appUser.guildName}]` : 'สำรวจแผนที่'}
                    </span>
                    <div className="flex items-center gap-1 group-hover:translate-x-1.5 transition-transform">
                      เข้าสู่สงคราม <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="glass p-6 rounded-3xl h-full border-slate-800 bg-slate-900/40 opacity-70 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      <Lock className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700">
                      1,000 EXP
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-400">
                    Virus Empire
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                    สงครามยึดครองอาณาเขตและระบบกิลด์ ต้องการ 1,000 EXP เพื่อปลดล็อก
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-800 text-xs text-slate-500 font-mono flex items-center justify-between">
                  <span>ขาดอีก {1000 - currentExp} EXP</span>
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>


      {/* ── 4. RANK BADGES PROGRESSION ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Award className="w-4 h-4 text-accent" /> เหรียญตรายศ (Rank Progression)
          </h2>
          <Link href="/student/leaderboard" className="text-xs text-primary hover:text-blue-300 font-bold transition-colors flex items-center gap-1">
            ดูตารางจัดอันดับ <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {ACHIEVEMENTS.map((ach) => {
            const isUnlocked = currentExp >= ach.reqExp;
            const isCurrent = ach.id === currentRank.id;
            const Icon = ach.icon;

            return (
              <motion.div
                key={ach.id}
                whileHover={{ scale: isUnlocked ? 1.03 : 1 }}
                className={`relative flex flex-col items-center gap-2 p-3.5 rounded-2xl border text-center transition-all duration-300 ${
                  isUnlocked
                    ? `${ach.bg} ${ach.border} shadow-lg`
                    : 'bg-slate-900/40 border-slate-800 opacity-40 grayscale'
                } ${isCurrent ? 'ring-2 ring-accent ring-offset-2 ring-offset-slate-950' : ''}`}
              >
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-accent opacity-60 pointer-events-none"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}

                <div 
                  className={`w-11 h-11 rounded-xl flex items-center justify-center ${isUnlocked ? ach.bg : 'bg-slate-800'}`}
                  style={isUnlocked ? { boxShadow: `0 0 14px ${ach.glow}` } : {}}
                >
                  {isUnlocked
                    ? <Icon className={`w-6 h-6 ${ach.color}`} />
                    : <Lock className="w-5 h-5 text-slate-600" />
                  }
                </div>

                <div>
                  <p className={`text-xs font-black leading-tight ${isUnlocked ? ach.color : 'text-slate-600'}`}>
                    {ach.title}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{ach.subtitle}</p>
                  <p className="text-[9px] font-mono text-slate-600 mt-1">{ach.reqExp.toLocaleString()} EXP</p>
                </div>

                {isCurrent && (
                  <span className="absolute -top-2.5 -right-2 text-[9px] bg-accent text-slate-950 font-black px-2 py-0.5 rounded-full leading-none z-10 shadow-md">
                    ยศปัจจุบัน
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>


      {/* ── 5. ACTIVE QUESTS & RECENT LOGS ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Active Quests (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" /> ภารกิจและความก้าวหน้า (Active Objectives)
            </h2>
          </div>

          <div className="glass-neon p-6 rounded-3xl space-y-3 border-slate-800">
            {[
              {
                title: "ก้าวแรกสู่วงการไวรัสวิทยา",
                desc: "เข้าสู่ระบบและสร้างตัวละครใน VetVirus OS",
                exp: "+10 EXP",
                done: true,
                icon: "🚀"
              },
              {
                title: "ผู้รอบรู้ 15 บทเรียน (Curriculum Scholar)",
                desc: `อ่านข้อมูลไวรัสใน Codex และสไลด์สะสมอย่างน้อย 3 บท (อ่านแล้ว: ${completedLessonsCount}/3 บท)`,
                exp: "+50 EXP",
                done: completedLessonsCount >= 3,
                icon: "📖"
              },
              {
                title: "ปราบปรามบอสตัวแรก (Boss Slayer)",
                desc: "พิชิตไวรัสในโหมด Boss Battle อย่างน้อย 1 ครั้ง",
                exp: "+50 EXP",
                done: hasPlayedBoss,
                icon: "⚔️"
              },
              {
                title: "นักทดสอบรอบทิศ (All-Round Specialist)",
                desc: `ลองฝึกเล่นเกมใน Play Center ให้ครบ 3 โหมดที่ต่างกัน (ทดสอบแล้ว: ${uniqueGamesPlayed}/3 โหมด)`,
                exp: "+100 EXP",
                done: uniqueGamesPlayed >= 3,
                icon: "🎮"
              },
              {
                title: "ขุนศึกไวรัส (Empire Ready)",
                desc: `สะสม EXP ครบ 1,000 เพื่อปลดล็อกห้องเพาะเลี้ยง Pet 3D และสงคราม Empire (ปัจจุบัน: ${currentExp} EXP)`,
                exp: "+200 EXP",
                done: currentExp >= 1000,
                icon: "🏰"
              },
            ].map((quest, i) => (
              <div 
                key={i} 
                className={`p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                  quest.done
                    ? 'bg-secondary/10 border-secondary/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl shrink-0">{quest.icon}</span>
                  <div>
                    <h4 className={`font-bold text-sm ${quest.done ? 'text-secondary line-through opacity-80' : 'text-slate-200'}`}>
                      {quest.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{quest.desc}</p>
                  </div>
                </div>
                <div className="shrink-0">
                  {quest.done ? (
                    <span className="text-secondary text-xs font-black px-2.5 py-1 rounded-full bg-secondary/20 border border-secondary/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> สำเร็จ
                    </span>
                  ) : (
                    <span className="font-mono font-black text-xs text-accent bg-accent/10 px-2.5 py-1 rounded-full border border-accent/30">
                      {quest.exp}
                    </span>
                  )}
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500 font-mono">
              <span>สำเร็จแล้ว: {[true, completedLessonsCount >= 3, hasPlayedBoss, uniqueGamesPlayed >= 3, currentExp >= 1000].filter(Boolean).length}/5 ภารกิจ</span>
              <span>EXP รวม: {currentExp.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Recent Battle History (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" /> บันทึกการเล่นล่าสุด (History)
            </h2>
          </div>

          <div className="glass p-5 rounded-3xl space-y-3 border-slate-800 min-h-[300px]">
            {history.length > 0 ? (
              <div className="space-y-2.5">
                {history.slice(0, 5).map((h, i) => (
                  <div key={i} className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-bold text-xs text-white">
                        {h.gameName || h.gameId || 'Operation'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {h.playedAt ? new Date(h.playedAt).toLocaleDateString('th-TH', { hour: '2-digit', minute: '2-digit' }) : 'เมื่อเร็วๆ นี้'}
                      </p>
                    </div>
                    <div className="text-right">
                      {h.score !== undefined && (
                        <p className="text-xs font-mono font-bold text-accent">
                          {h.score} pts
                        </p>
                      )}
                      {h.expEarned && (
                        <p className="text-[10px] font-mono font-bold text-primary">
                          +{h.expEarned} EXP
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <Microscope className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-mono">ยังไม่มีประวัติการปฏิบัติการ</p>
                <Link href="/student/play">
                  <Button size="sm" className="bg-primary/20 text-primary border border-primary/40 text-xs font-bold mt-2">
                    เริ่มเล่นเกมแรกเลย
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
