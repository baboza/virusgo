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
  Play, 
  Trophy,
  ArrowLeft,
  Sparkles,
  Zap,
  Activity,
  Heart,
  ChevronRight,
  ShieldCheck,
  Award
} from 'lucide-react';
import Link from 'next/link';

export default function StageSelect() {

  // Category 1: Clinical & Diagnostic Training (Solo)
  const clinicalModes = [
    {
      id: 'identification',
      title: 'Virus Identification',
      titleTh: 'การระบุเชื้อไวรัสทางคลินิก',
      description: 'วิเคราะห์เคสสัตว์ป่วย รอยโรคเฉพาะ (Pathognomonic signs) และระบุเชื้อไวรัสที่ก่อโรค',
      icon: ScanSearch,
      color: 'text-blue-400',
      border: 'border-blue-500/40 hover:border-blue-400',
      bg: 'bg-blue-500/10',
      badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      href: '/student/play/identification',
      exp: '+10 EXP / ข้อ (โควตา 150/วัน)',
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
      border: 'border-purple-500/40 hover:border-purple-400',
      bg: 'bg-purple-500/10',
      badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      href: '/student/play/lab-detective',
      exp: '+50 EXP / เคส (โควตา 150/วัน)',
      tag: 'วิเคราะห์ผลแล็บ',
      stage: '02'
    },
    {
      id: 'outbreak',
      title: 'Outbreak Sim',
      titleTh: 'จำลองควบคุมโรคระบาดในฟาร์ม',
      description: 'รับบทสัตวแพทย์ควบคุมโรคระบาดในฟาร์ม ตัดสินใจตามหลักระบาดวิทยา และระบบ Biosecurity',
      icon: Map,
      color: 'text-emerald-400',
      border: 'border-emerald-500/40 hover:border-emerald-400',
      bg: 'bg-emerald-500/10',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      href: '/student/play/outbreak',
      exp: 'สูงสุด +100 EXP (โควตา 150/วัน)',
      tag: 'ระบาดวิทยาฟาร์ม',
      stage: '03'
    }
  ];

  // Category 2: Speed Drills & Arcade (Solo)
  const arcadeModes = [
    {
      id: 'matching',
      title: 'Matching Game',
      titleTh: 'จับคู่ไวรัสและคุณสมบัติ',
      description: 'ฝึกความจำระยะสั้น จับคู่ชื่อไวรัส ตระกูล จีโนม และรอยโรคที่จำเพาะอย่างรวดเร็ว',
      icon: GitMerge,
      color: 'text-amber-400',
      border: 'border-amber-500/40 hover:border-amber-400',
      bg: 'bg-amber-500/10',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      href: '/student/play/matching',
      exp: '+60 EXP (โควตา 120/วัน)',
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
      border: 'border-orange-500/40 hover:border-orange-400',
      bg: 'bg-orange-500/10',
      badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
      href: '/student/play/time-attack',
      exp: 'Streak EXP (โควตา 150/วัน)',
      tag: 'แข่งกับเวลา',
      stage: '05'
    },
    {
      id: 'boss-battle',
      title: 'Boss Battle (Raid)',
      titleTh: 'ปราบบอสระบบภูมิคุ้มกัน',
      description: 'ดวลความรู้พิชิตบอสไวรัสสายพันธุ์อันตราย (FMD, ASFV, CDV) พร้อมรับ EXP ตามบอสที่ปราบ',
      icon: Swords,
      color: 'text-red-400',
      border: 'border-red-500/40 hover:border-red-400',
      bg: 'bg-red-500/10',
      badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
      href: '/student/play/boss-battle',
      exp: '+50 EXP / บอส (โควตา 150/วัน)',
      tag: 'Raid เดี่ยว',
      stage: '06'
    }
  ];

  // Category 3: Live & Multiplayer Arena
  const classroomModes = [
    {
      id: 'pvp-duel',
      title: '1v1 Virus Duel (PvP)',
      titleTh: 'สังเวียนประลองไวรัส 1 ต่อ 1',
      description: 'สร้างห้องหรือใส่รหัสห้องท้าเพื่อนดวลไวรัสแบบเรียลไทม์ ใช้สเตตัสจาก Virus Pet ยิงพลังตอบคำถามวัดแชมป์',
      icon: Swords,
      color: 'text-rose-400',
      border: 'border-rose-500/50 hover:border-rose-400',
      bg: 'bg-rose-500/10',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      href: '/student/play/pvp',
      exp: '+50 EXP / ชนะ (+15 ร่วมแข่ง)',
      tag: 'ดวลสด 1v1',
      stage: 'PVP'
    },
    {
      id: 'classroom-battle',
      title: 'Classroom Battle (Live)',
      titleTh: 'แข่งขันสดในชั้นเรียน',
      description: 'ระบบตอบคำถามสดสไตล์ Kahoot สำหรับอาจารย์และนิสิตทั้งห้องเรียน ลุ้นคะแนนขึ้นจอแบบเรียลไทม์',
      icon: Trophy,
      color: 'text-yellow-400',
      border: 'border-yellow-500/50 hover:border-yellow-400',
      bg: 'bg-yellow-500/10',
      badgeBg: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      href: '/student/play/classroom-battle',
      exp: '50 - 175 EXP (ตามอันดับ)',
      tag: 'แข่งสดทั้งห้อง',
      stage: 'LIVE'
    }
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 20 } }
  };

  const renderCardList = (modes: typeof clinicalModes) => (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {modes.map((mode) => {
        const Icon = mode.icon;

        return (
          <Link key={mode.id} href={mode.href} className="group">
            <motion.div variants={item} className="h-full">
              <div 
                className={`glass p-5 rounded-3xl h-full border ${mode.border} hover:-translate-y-1.5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between shadow-lg group-hover:shadow-[0_0_25px_rgba(255,255,255,0.08)]`}
              >
                {/* Glowing Aura on Hover */}
                <div className={`absolute -inset-6 ${mode.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10`} />

                {/* Stage Watermark Number */}
                <div className={`absolute top-3 right-4 font-black font-mono text-3xl sm:text-4xl opacity-15 italic ${mode.color}`}>
                  {mode.stage}
                </div>

                <div className="space-y-3 z-10">
                  {/* Top Header Tags */}
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${mode.badgeBg}`}>
                      {mode.tag}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {mode.exp}
                    </span>
                  </div>

                  {/* Icon & Title */}
                  <div className="flex items-center gap-3.5 pt-1">
                    <div className={`w-12 h-12 rounded-2xl ${mode.bg} ${mode.color} border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-inner`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-black text-white tracking-wide uppercase leading-tight group-hover:text-cyan-300 transition-colors">
                        {mode.title}
                      </h3>
                      <div className="text-xs text-slate-400 font-medium truncate mt-0.5">
                        {mode.titleTh}
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300/90 text-xs leading-relaxed pt-1">
                    {mode.description}
                  </p>
                </div>

                {/* Engage CTA */}
                <div className={`mt-5 w-full py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 group-hover:border-white/20 flex items-center justify-center gap-2 font-mono font-black text-xs uppercase tracking-wider ${mode.color} transition-all duration-300 shadow-sm`}>
                  <Play className="w-3.5 h-3.5 fill-current" /> 
                  <span>เข้าสู่ด่าน (Engage)</span>
                </div>

              </div>
            </motion.div>
          </Link>
        );
      })}
    </motion.div>
  );

  return (
    <div className="space-y-10 pb-24 pt-2 px-2 max-w-6xl mx-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors shrink-0"
            title="กลับหน้าหลัก"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest font-bold">
                Mission Select
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ศูนย์รวมด่านฝึกฝนสัตวแพทย์
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide text-glow mt-0.5">
              เลือกโหมดภารกิจ (Stage Select)
            </h1>
          </div>
        </div>
      </div>

      {/* Fair Play & Unlimited Practice Notice */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-blue-950/20 to-slate-900/60 border border-cyan-500/30 text-xs text-slate-300 shadow-sm">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div className="leading-relaxed">
          <span className="font-bold text-white">ระบบจำกัดโควตา EXP รายวัน (Daily Cap) & ฝึกฝนได้ไม่จำกัด:</span>{' '}
          ทุกโหมดเดี่ยวมีเพดาน EXP ต่อวันเพื่อความสมดุล หากเก็บครบโควตาแล้ว นิสิตยังสามารถเข้าเล่นเพื่อทบทวนบทเรียนได้ตลอดเวลาแบบไม่จำกัดใน <span className="font-semibold text-cyan-300">โหมดฝึกฝน</span> (โควตารีเซ็ตอัตโนมัติทุกเที่ยงคืน)
        </div>
      </div>

      {/* ── Section 1: Clinical & Diagnostic Training (Solo) ───────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-7 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"></span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>การฝึกฝนคลินิกและวินิจฉัยโรค (Clinical & Diagnostics)</span>
            </h2>
            <p className="text-xs font-mono text-slate-400">
              วิเคราะห์ประวัติสัตว์ป่วย รอยโรค และอ่านผลตรวจแล็บเสมือนจริง
            </p>
          </div>
        </div>
        {renderCardList(clinicalModes)}
      </div>

      {/* ── Section 2: Speed Drills & Arcade (Solo) ────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-7 bg-amber-400 rounded-full shadow-[0_0_8px_#f59e0b]"></span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>ท้าทายความเร็วและความแม่นยำ (Speed & Arcade Drills)</span>
            </h2>
            <p className="text-xs font-mono text-slate-400">
              ฝึกจำแนกตระกูลไวรัส ตอบเร็วคอมโบ และดวลความรู้พิชิตบอส
            </p>
          </div>
        </div>
        {renderCardList(arcadeModes)}
      </div>

      {/* ── Section 3: Live Classroom Arena (Multiplayer) ──────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-7 bg-yellow-400 rounded-full shadow-[0_0_8px_#eab308]"></span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase flex items-center gap-2">
              <span>สังเวียนแข่งขันสดในห้องเรียน (Classroom Arena)</span>
            </h2>
            <p className="text-xs font-mono text-slate-400">
              เข้าร่วมหรือสร้างห้องแข่งแบบ Kahoot พร้อมกันทั้งชั้นเรียน
            </p>
          </div>
        </div>
        {renderCardList(classroomModes)}
      </div>

      {/* ── Section 4: Strategic Campaign Modes Spotlight ──────────────────── */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>แคมเปญหลัก (Major Strategy Campaigns)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Campaign 1: Virus Empire */}
          <Link href="/student/empire">
            <div className="glass p-5 rounded-3xl border border-cyan-500/30 hover:border-cyan-400 transition-all group flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Map className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase">สงครามยึดครอง 30×30</div>
                  <h4 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                    Virus Empire (อาณาจักรไวรัส)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ร่วมมือกับกิลด์พันธมิตร ตีบอส และขยายพรมแดน 900 เซกเตอร์
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1.5 transition-transform shrink-0" />
            </div>
          </Link>

          {/* Campaign 2: Virus Pet */}
          <Link href="/student/virus-pet">
            <div className="glass p-5 rounded-3xl border border-purple-500/30 hover:border-purple-400 transition-all group flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <div className="text-xs font-mono text-purple-400 font-bold uppercase">ห้องแล็บเพาะเลี้ยง</div>
                  <h4 className="text-lg font-black text-white group-hover:text-purple-300 transition-colors">
                    Virus Pet (สัตว์เลี้ยงชีวภาพ)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    ดูแล ให้อาหาร ฝึกฝนสเตตัส (STR/VIT/AGI/DEX) เพื่อส่งลงสนามรบ
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1.5 transition-transform shrink-0" />
            </div>
          </Link>

        </div>
      </div>

    </div>
  );
}
