"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, Variants } from 'framer-motion';
import { 
  ScanSearch, 
  GitMerge, 
  Map as MapIcon, 
  Microscope, 
  Timer, 
  Swords, 
  Play, 
  Trophy,
  ArrowLeft,
  Sparkles,
  Zap,
  Heart,
  ChevronRight,
  ShieldCheck,
  Award,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { DAILY_EXP_CAPS, getTodayDateString } from '@/lib/dailyExpCap';

// Dynamic 3D Ambient Particle Background
const AmbientBioCanvas3D = dynamic(
  () => import('@/components/ui/AmbientBioCanvas3D'),
  { ssr: false }
);

interface GameMode {
  id: string;
  title: string;
  titleTh: string;
  description: string;
  icon: any;
  color: string;
  glowColor: string;
  border: string;
  bg: string;
  badgeBg: string;
  href: string;
  capKey: string;
  exp: string;
  tag: string;
  stage: string;
  isLive?: boolean;
}

export default function StageSelect() {
  const { user } = useAuth();
  const [dailyExpRecord, setDailyExpRecord] = useState<Record<string, number>>({});
  const [loadingExp, setLoadingExp] = useState(true);

  // Fetch student's daily game EXP record
  useEffect(() => {
    let isMounted = true;
    async function fetchDailyExp() {
      if (!user) {
        setLoadingExp(false);
        return;
      }
      try {
        const today = getTodayDateString();
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists() && isMounted) {
          const data = userSnap.data();
          if (data.dailyGameExp && data.dailyGameExp.date === today) {
            setDailyExpRecord(data.dailyGameExp);
          }
        }
      } catch (err) {
        console.error("Failed to load daily game exp:", err);
      } finally {
        if (isMounted) setLoadingExp(false);
      }
    }

    fetchDailyExp();
    return () => { isMounted = false; };
  }, [user]);

  // ── Category 1: Clinical & Diagnostic Training (Solo) ──────────────────────
  const clinicalModes: GameMode[] = [
    {
      id: 'identification',
      title: 'Virus Identification',
      titleTh: 'การระบุเชื้อไวรัสทางคลินิก',
      description: 'วิเคราะห์เคสสัตว์ป่วย รอยโรคเฉพาะ (Pathognomonic signs) และระบุเชื้อไวรัสที่ก่อโรค',
      icon: ScanSearch,
      color: 'text-cyan-400',
      glowColor: 'group-hover:border-cyan-500/60 group-hover:shadow-[0_0_30px_rgba(6,182,212,0.18)]',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-500/10 text-cyan-400',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40',
      href: '/student/play/identification',
      capKey: 'identification',
      exp: '+10 EXP / ข้อ',
      tag: 'เคสคลินิก',
      stage: '01'
    },
    {
      id: 'lab-detective',
      title: 'Lab Detective',
      titleTh: 'นักสืบห้องปฏิบัติการ',
      description: 'แปลผลตรวจทางห้องปฏิบัติการ (ELISA, PCR, Inclusion bodies) และจำแนกโรคติดเชื้อ',
      icon: Microscope,
      color: 'text-purple-400',
      glowColor: 'group-hover:border-purple-500/60 group-hover:shadow-[0_0_30px_rgba(168,85,247,0.18)]',
      border: 'border-purple-500/30',
      bg: 'bg-purple-500/10 text-purple-400',
      badgeBg: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
      href: '/student/play/lab-detective',
      capKey: 'lab-detective',
      exp: '+50 EXP / เคส',
      tag: 'วิเคราะห์ผลแล็บ',
      stage: '02'
    },
    {
      id: 'outbreak',
      title: 'Outbreak Sim',
      titleTh: 'จำลองควบคุมโรคระบาดในฟาร์ม',
      description: 'รับบทสัตวแพทย์ควบคุมโรคระบาดในฟาร์ม ตัดสินใจตามหลักระบาดวิทยา และระบบ Biosecurity',
      icon: MapIcon,
      color: 'text-emerald-400',
      glowColor: 'group-hover:border-emerald-500/60 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.18)]',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-500/10 text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
      href: '/student/play/outbreak',
      capKey: 'outbreak',
      exp: 'สูงสุด +100 EXP',
      tag: 'ระบาดวิทยาฟาร์ม',
      stage: '03'
    }
  ];

  // ── Category 2: Speed Drills & Arcade (Solo) ────────────────────────────────
  const arcadeModes: GameMode[] = [
    {
      id: 'matching',
      title: 'Matching Game',
      titleTh: 'จับคู่ไวรัสและคุณสมบัติ',
      description: 'ฝึกความจำระยะสั้น จับคู่ชื่อไวรัส ตระกูล จีโนม และรอยโรคที่จำเพาะอย่างรวดเร็ว',
      icon: GitMerge,
      color: 'text-amber-400',
      glowColor: 'group-hover:border-amber-500/60 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.18)]',
      border: 'border-amber-500/30',
      bg: 'bg-amber-500/10 text-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
      href: '/student/play/matching',
      capKey: 'matching',
      exp: '+60 EXP / รอบ',
      tag: 'ทบทวนความจำ',
      stage: '04'
    },
    {
      id: 'time-attack',
      title: 'Time Attack (60s)',
      titleTh: 'ท้าทายคอมโบ 60 วินาที',
      description: 'ทดสอบความเร็วและความแม่นยำ ทำคอมโบตอบคำถามให้ได้มากที่สุดเพื่อขึ้นสู่ Leaderboard',
      icon: Timer,
      color: 'text-orange-400',
      glowColor: 'group-hover:border-orange-500/60 group-hover:shadow-[0_0_30px_rgba(249,115,22,0.18)]',
      border: 'border-orange-500/30',
      bg: 'bg-orange-500/10 text-orange-400',
      badgeBg: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
      href: '/student/play/time-attack',
      capKey: 'time-attack',
      exp: 'Streak Combo EXP',
      tag: 'แข่งกับเวลา',
      stage: '05'
    },
    {
      id: 'boss-battle',
      title: 'Boss Battle (Raid)',
      titleTh: 'ปราบบอสระบบภูมิคุ้มกัน',
      description: 'ดวลความรู้พิชิตบอสไวรัสสายพันธุ์อันตราย (FMD, ASFV, CDV) พร้อมรับ EXP ตามบอสที่ปราบ',
      icon: Swords,
      color: 'text-rose-400',
      glowColor: 'group-hover:border-rose-500/60 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.18)]',
      border: 'border-rose-500/30',
      bg: 'bg-rose-500/10 text-rose-400',
      badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      href: '/student/play/boss-battle',
      capKey: 'boss-battle',
      exp: '+50 EXP / บอส',
      tag: 'Solo Raid',
      stage: '06'
    }
  ];

  // ── Category 3: Live & Multiplayer Arena ───────────────────────────────────
  const classroomModes: GameMode[] = [
    {
      id: 'pvp-duel',
      title: '1v1 Virus Duel (PvP)',
      titleTh: 'สังเวียนประลองไวรัส 1 ต่อ 1',
      description: 'สร้างห้องหรือใส่รหัสห้องท้าเพื่อนดวลไวรัสแบบเรียลไทม์ ใช้สเตตัสจาก Virus Pet ยิงพลังตอบคำถามวัดแชมป์',
      icon: Swords,
      color: 'text-rose-400',
      glowColor: 'group-hover:border-rose-500/60 group-hover:shadow-[0_0_30px_rgba(244,63,94,0.18)]',
      border: 'border-rose-500/40',
      bg: 'bg-rose-500/10 text-rose-400',
      badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
      href: '/student/play/pvp',
      capKey: 'pvp',
      exp: '+50 EXP / ชนะ',
      tag: 'ดวลสด 1v1',
      stage: 'PVP',
      isLive: true
    },
    {
      id: 'classroom-battle',
      title: 'Classroom Battle (Live)',
      titleTh: 'แข่งขันสดในชั้นเรียน',
      description: 'ระบบตอบคำถามสดสไตล์ Kahoot สำหรับอาจารย์และนิสิตทั้งห้องเรียน ลุ้นคะแนนขึ้นจอแบบเรียลไทม์',
      icon: Trophy,
      color: 'text-yellow-400',
      glowColor: 'group-hover:border-yellow-500/60 group-hover:shadow-[0_0_30px_rgba(234,179,8,0.18)]',
      border: 'border-yellow-500/40',
      bg: 'bg-yellow-500/10 text-yellow-400',
      badgeBg: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/40',
      href: '/student/play/classroom-battle',
      capKey: 'classroom-battle',
      exp: '50 - 175 EXP',
      tag: 'แข่งสดทั้งห้อง',
      stage: 'LIVE',
      isLive: true
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  // Reusable Mode Card Renderer
  const renderCardList = (modes: GameMode[], isTwoCol = false) => (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={`grid grid-cols-1 ${isTwoCol ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-5`}
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const capLimit = DAILY_EXP_CAPS[mode.capKey] || 150;
        const earnedToday = dailyExpRecord[mode.capKey] || 0;
        const isCapped = earnedToday >= capLimit;
        const progressPercent = Math.min(100, Math.round((earnedToday / capLimit) * 100));

        return (
          <Link 
            key={mode.id} 
            href={mode.href} 
            className="group block h-full focus:outline-none"
            onMouseEnter={() => sfx.hover()}
            onClick={() => sfx.click()}
          >
            <motion.div variants={itemVariants} className="h-full">
              <div 
                className={`relative h-full rounded-3xl p-6 bg-slate-900/70 backdrop-blur-xl border border-slate-800/90 ${mode.glowColor} transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg hover:-translate-y-1.5`}
              >
                {/* Subtle Ambient Hover Glow */}
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-white/5 rounded-full blur-3xl group-hover:scale-150 transition-transform pointer-events-none" />

                {/* Top Header: Badge, Stage Watermark, Live Indicator */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${mode.badgeBg}`}>
                        {mode.tag}
                      </span>
                      {mode.isLive && (
                        <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                          LIVE
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-black text-2xl tracking-wider text-slate-700/80 group-hover:text-slate-600 transition-colors">
                      {mode.stage}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${mode.bg} border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 shadow-inner`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase leading-tight group-hover:text-cyan-300 transition-colors">
                        {mode.title}
                      </h3>
                      <div className="text-xs text-slate-400 font-medium truncate mt-0.5">
                        {mode.titleTh}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300/80 text-xs leading-relaxed mt-3 min-h-[36px]">
                    {mode.description}
                  </p>
                </div>

                {/* Bottom Section: Daily EXP Tracker & Engage CTA */}
                <div className="mt-5 space-y-3 pt-3 border-t border-slate-800/80">
                  
                  {/* EXP Info & Mini Progress Pill */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>{mode.exp}</span>
                      </span>
                      <span className={isCapped ? "text-emerald-400 font-bold" : "text-slate-300"}>
                        {loadingExp ? (
                          <span className="text-slate-500">โควตา {capLimit}/วัน</span>
                        ) : isCapped ? (
                          '✓ เก็บครบวันนี้แล้ว'
                        ) : (
                          `${earnedToday} / ${capLimit} EXP`
                        )}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCapped ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Engage Action Button */}
                  <div className={`w-full py-2.5 rounded-xl bg-slate-950/70 border border-slate-800 group-hover:border-white/20 group-hover:bg-slate-900/90 flex items-center justify-center gap-2 font-mono font-black text-xs uppercase tracking-wider ${mode.color} transition-all duration-300 shadow-sm`}>
                    <Play className="w-3.5 h-3.5 fill-current" /> 
                    <span>เข้าสู่ด่าน (Engage)</span>
                  </div>

                </div>

              </div>
            </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );

  return (
    <div className="relative min-h-screen space-y-10 pb-28 pt-2 px-2 sm:px-4 max-w-6xl mx-auto">
      
      {/* 3D Bio-Capsid Ambient Background */}
      <AmbientBioCanvas3D />

      {/* Top Header HUD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 pt-2">
        <div className="flex items-center gap-3.5">
          <Link
            href="/student"
            onClick={() => sfx.click()}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-400 transition-all shrink-0 shadow-md group"
            title="กลับหน้าหลัก Dashboard"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest font-bold">
                Mission Select
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                ศูนย์รวมด่านจำลองสัตวแพทย์ (8 โหมด)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide mt-1">
              เลือกโหมดภารกิจ (Stage Select)
            </h1>
          </div>
        </div>

        {/* Quick System Badge */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">Daily Cap Engine:</span>
            <span className="text-emerald-400 font-bold">Active</span>
          </div>
        </div>
      </div>

      {/* Fair Play & Unlimited Practice Notification Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900/60 border border-cyan-500/25 p-4 shadow-sm backdrop-blur-md">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed min-w-0">
            <span className="font-bold text-white">ระบบจำกัดโควตา EXP รายวัน (Daily Cap) & ฝึกฝนได้ไม่จำกัด:</span>{' '}
            ทุกโหมดมีเพดาน EXP ต่อวันเพื่อความสมดุล หากเก็บครบโควตาแล้ว นิสิตยังสามารถเข้าเล่นเพื่อทบทวนบทเรียนได้ตลอดเวลาแบบไม่จำกัดใน <span className="font-semibold text-cyan-300">โหมดฝึกฝนอิสระ</span> (โควตารีเซ็ตอัตโนมัติทุกเที่ยงคืน)
          </div>
        </div>
      </div>

      {/* ── Section 1: Clinical & Diagnostic Training (Solo) ───────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-7 bg-cyan-400 rounded-full shadow-[0_0_10px_#22d3ee]"></span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>การฝึกฝนคลินิกและวินิจฉัยโรค (Clinical & Diagnostics)</span>
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              วิเคราะห์ประวัติสัตว์ป่วย รอยโรค และอ่านผลตรวจแล็บเสมือนจริง (3 ด่าน)
            </p>
          </div>
        </div>
        {renderCardList(clinicalModes)}
      </section>

      {/* ── Section 2: Speed Drills & Arcade (Solo) ────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-7 bg-amber-400 rounded-full shadow-[0_0_10px_#f59e0b]"></span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>ท้าทายความเร็วและความแม่นยำ (Speed & Arcade Drills)</span>
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              ฝึกจำแนกตระกูลไวรัส ตอบเร็วคอมโบ และดวลความรู้พิชิตบอส (3 ด่าน)
            </p>
          </div>
        </div>
        {renderCardList(arcadeModes)}
      </section>

      {/* ── Section 3: Live Classroom Arena (Multiplayer) ──────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-7 bg-rose-400 rounded-full shadow-[0_0_10px_#fb7185]"></span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>สังเวียนแข่งขันสดในห้องเรียน (Classroom Arena & PvP)</span>
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              ท้าดวลเพื่อน 1v1 และห้องแข่งขันตอบคำถามสไตล์ Kahoot พร้อมกันทั้งชั้นเรียน (2 ด่าน)
            </p>
          </div>
        </div>
        {renderCardList(classroomModes, true)}
      </section>

      {/* ── Section 4: Strategic Campaign Spotlight ────────────────────────── */}
      <section className="pt-6 border-t border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>แคมเปญหลักระดับมหากาพย์ (Strategic Campaigns)</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Persistent Systems</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Campaign 1: Virus Empire */}
          <Link href="/student/empire" onClick={() => sfx.click()}>
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-cyan-500/30 hover:border-cyan-400 transition-all group flex items-center justify-between shadow-lg hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
                  <MapIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    สงครามยึดครอง 30×30 • 900 เซกเตอร์
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                    Virus Empire (อาณาจักรไวรัส)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ร่วมมือกับกิลด์พันธมิตร ตีบอส และขยายพรมแดนป้องกันเชื้อโรค
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1.5 transition-transform shrink-0" />
            </div>
          </Link>

          {/* Campaign 2: Virus Pet */}
          <Link href="/student/virus-pet" onClick={() => sfx.click()}>
            <div className="p-5 rounded-3xl bg-slate-900/70 border border-purple-500/30 hover:border-purple-400 transition-all group flex items-center justify-between shadow-lg hover:shadow-[0_0_25px_rgba(168,85,247,0.15)] backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 animate-pulse text-purple-400" />
                </div>
                <div>
                  <div className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                    ห้องแล็บเพาะเลี้ยงสัตว์เลี้ยง 3D
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                    Virus Pet (สัตว์เลี้ยงชีวภาพ)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ดูแล ให้อาหาร ฝึกฝนสเตตัส (STR/VIT/AGI/DEX) เพื่อส่งลงสนามรบ PvP
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1.5 transition-transform shrink-0" />
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
}
