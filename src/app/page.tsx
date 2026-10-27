"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Stethoscope, 
  Microscope, 
  Activity, 
  Zap, 
  PlayCircle, 
  GraduationCap, 
  Swords, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  Trophy, 
  BookOpen, 
  ChevronRight,
  Flame,
  CheckCircle2
} from "lucide-react";
import { BackgroundSVG } from "@/components/ui/BackgroundSVG";
import { SVGVirus } from "@/components/ui/SVGVirus";

export default function Home() {
  const containerVariants: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12
      }
    }
  };

  const itemVariants: any = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 14 } }
  };

  const gameFeatures = [
    {
      title: "Time Attack (60s Blitz)",
      desc: "ประลองความเร็วตอบคำถามไวรัสวิทยา 15 บทเรียน คำถามกระชับ อ่านเร็ว ตอบทันใน 60 วินาที",
      icon: Clock,
      color: "from-amber-500/20 to-orange-500/10",
      borderColor: "border-amber-500/30",
      textColor: "text-amber-400",
      badge: "Fast-Paced"
    },
    {
      title: "Classroom Battle & PvP",
      desc: "ประลองความรู้แบบเรียลไทม์ ชิงอันดับคะแนนสูงสุดในชั้นเรียนพร้อมกระดานคะแนนสด",
      icon: Swords,
      color: "from-rose-500/20 to-red-500/10",
      borderColor: "border-rose-500/30",
      textColor: "text-rose-400",
      badge: "Multiplayer"
    },
    {
      title: "Bio-Defense & Outbreak",
      desc: "สวมบทบาทสัตวแพทย์ควบคุมโรคระบาดในฟาร์มปศุสัตว์ วางแผนกักกันโรคและใช้วัคซีน",
      icon: ShieldAlert,
      color: "from-emerald-500/20 to-green-500/10",
      borderColor: "border-emerald-500/30",
      textColor: "text-emerald-400",
      badge: "Strategy"
    },
    {
      title: "Lab Detective & Cases",
      desc: "วินิจฉัยเคสจริงจากผลตรวจแล็บ PCR, ELISA, สเมียร์เลือด และ Inclusion bodies",
      icon: Microscope,
      color: "from-cyan-500/20 to-blue-500/10",
      borderColor: "border-cyan-500/30",
      textColor: "text-cyan-400",
      badge: "Clinical Diagnostic"
    },
    {
      title: "Viral Empire & Conquest",
      desc: "ยึดครองดินแดนไวรัสวิทยาบนแผนที่โลก พัฒนากองทัพและขยายอิทธิพลทางวิชาการ",
      icon: Trophy,
      color: "from-purple-500/20 to-indigo-500/10",
      borderColor: "border-purple-500/30",
      textColor: "text-purple-400",
      badge: "World Map"
    },
    {
      title: "Codex & 15 Curriculum Chapters",
      desc: "คลังข้อมูลไวรัสครบ 15 บทเรียน พร้อมคลังข้อสอบ 150 ข้อที่ปรับสมดุลใหม่อ่านง่าย ไม่เครียด",
      icon: BookOpen,
      color: "from-teal-500/20 to-cyan-500/10",
      borderColor: "border-teal-500/30",
      textColor: "text-teal-400",
      badge: "15 Chapters"
    }
  ];

  const statHighlights = [
    { label: "Curriculum Chapters", value: "15 บท", desc: "ครอบคลุมเนื้อหาไวรัสวิทยาครบถ้วน" },
    { label: "Balanced Questions", value: "150 ข้อ", desc: "โจทย์กระชับ ตัวเลือกสั้น ตอบทันใจ" },
    { label: "Active Game Modes", value: "9 โหมด", desc: "เล่นเดี่ยว ท้าดวล และทำภารกิจคลาส" },
    { label: "Platform Ready", value: "Mobile/PC", desc: "เล่นได้ลื่นไหลทุกอุปกรณ์" }
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden flex flex-col pt-8 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Background Graphic */}
      <BackgroundSVG type="virus" />
      
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-[8%] left-[15%] w-[45%] h-[45%] rounded-full bg-cyan-500/15 blur-[140px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute top-[40%] right-[10%] w-[35%] h-[35%] rounded-full bg-purple-500/15 blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-[10%] left-[25%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none -z-10" />

      <main className="z-10 w-full max-w-7xl mx-auto flex flex-col items-center mt-6 md:mt-14">
        
        {/* Top Floating Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-slate-900/80 border border-primary/40 backdrop-blur-xl text-xs md:text-sm font-black text-primary shadow-[0_0_25px_rgba(6,182,212,0.25)] uppercase tracking-wider mb-8"
        >
          <Activity className="w-4 h-4 text-primary animate-pulse" />
          <span>Veterinary Virology Gamified Learning Platform</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </motion.div>
        
        {/* Hero Section */}
        <motion.div 
          className="text-center space-y-6 max-w-4xl w-full"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Main Title: VETVIRUS GO */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight text-white uppercase drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]">
            VET<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">VIRUS</span>{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300 drop-shadow-[0_0_35px_rgba(16,185,129,0.5)]">
              GO
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            แพลตฟอร์มการเรียนรู้ไวรัสวิทยาสัตวแพทย์รูปแบบใหม่ เปลี่ยนตำราและสไลด์ 15 บทเรียน 
            ให้เป็นภารกิจการเล่นเกมสุดท้าทาย สนุก อ่านกระชับ ตอบทันใจ และไม่เครียด
          </p>

          {/* Quick Viral Mascot Icons */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-6 py-2"
          >
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-2 text-xs font-mono text-slate-400">
              <SVGVirus type="corona" className="w-6 h-6 text-cyan-400 animate-spin-slow" />
              <span>Coronaviridae</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-2 text-xs font-mono text-slate-400">
              <SVGVirus type="rabies" className="w-6 h-6 text-rose-400" />
              <span>Rhabdoviridae</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-2 text-xs font-mono text-slate-400">
              <SVGVirus type="parvo" className="w-6 h-6 text-emerald-400" />
              <span>Parvoviridae</span>
            </div>
          </motion.div>
          
          {/* Action CTAs */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4 w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            {/* Student Action */}
            <Link href="/login" className="w-full sm:w-1/2 group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-300 animate-pulse"></div>
              <button className="relative w-full glass bg-slate-950/80 border border-cyan-400/50 text-white rounded-2xl px-7 py-5 flex items-center justify-center gap-4 transition-all duration-300 group-hover:scale-[1.02] group-hover:bg-slate-900">
                <PlayCircle className="w-9 h-9 text-cyan-400 shrink-0" />
                <div className="text-left">
                  <div className="font-black text-xl tracking-wider text-glow flex items-center gap-1.5">
                    ENTER GAME <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs text-cyan-200/80 font-mono">สำหรับนิสิตสัตวแพทย์ (Student)</div>
                </div>
              </button>
            </Link>

            {/* Instructor Action */}
            <Link href="/login" className="w-full sm:w-1/2 group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl blur-md opacity-50 group-hover:opacity-80 transition duration-300"></div>
              <button className="relative w-full glass bg-slate-950/80 border border-purple-400/40 text-white rounded-2xl px-7 py-5 flex items-center justify-center gap-4 transition-all duration-300 group-hover:scale-[1.02] group-hover:bg-slate-900">
                <GraduationCap className="w-9 h-9 text-purple-400 shrink-0" />
                <div className="text-left">
                  <div className="font-black text-xl tracking-wider text-purple-300 flex items-center gap-1.5">
                    INSTRUCTOR <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <div className="text-xs text-purple-200/80 font-mono">ระบบอาจารย์ (Admin Terminal)</div>
                </div>
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-5xl mt-20 px-2"
        >
          {statHighlights.map((stat, idx) => (
            <div 
              key={idx} 
              className="p-5 rounded-2xl glass bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors flex flex-col items-center text-center shadow-lg"
            >
              <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-mono mb-1">
                {stat.value}
              </div>
              <div className="font-bold text-sm text-slate-200">{stat.label}</div>
              <div className="text-xs text-slate-400 mt-1">{stat.desc}</div>
            </div>
          ))}
        </motion.div>

        {/* Game Modes & Features Grid */}
        <div className="w-full mt-28">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
              FEATURED <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">MISSIONS</span> & MODES
            </h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-base">
              เลือกรูปแบบการเรียนรู้และโหมดการเล่นที่ตรงกับสไตล์คุณ เพื่อสะสม EXP อัปเลเวล และคว้าชัยชนะ
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full px-2"
          >
            {gameFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div key={idx} variants={itemVariants} className="group cursor-pointer">
                  <div className={`p-7 rounded-3xl glass bg-slate-900/70 border ${feat.borderColor} h-full flex flex-col justify-between hover:-translate-y-2 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] relative overflow-hidden`}>
                    <div className="flex items-center justify-between mb-5">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} border ${feat.borderColor} flex items-center justify-center ${feat.textColor} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-slate-800/80 border ${feat.borderColor} ${feat.textColor}`}>
                        {feat.badge}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                        {feat.title}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>Ready to Deploy</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Developer & Lead Instructor Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="w-full max-w-4xl mt-24 p-8 md:p-10 rounded-3xl glass bg-slate-900/85 border border-cyan-500/30 relative overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.12)]"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-10">
            {/* Portrait Image with Glowing Cyber Border */}
            <div className="relative group shrink-0">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-cyan-500 via-teal-400 to-emerald-400 rounded-2xl blur-md opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <div className="relative w-44 h-56 sm:w-52 sm:h-64 rounded-2xl overflow-hidden border-2 border-cyan-400/60 bg-slate-950 shadow-2xl">
                <img 
                  src="/images/lecturer-wilasinee.jpg" 
                  alt="Lecturer Wilasinee Surasa, D.V.M. - ผู้พัฒนาระบบ"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-cyan-400/50 px-3.5 py-1 rounded-full text-[11px] font-black uppercase text-cyan-300 font-mono tracking-wider shadow-md whitespace-nowrap">
                System Developer
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ผู้พัฒนาระบบ &amp; อาจารย์ผู้รับผิดชอบรายวิชา</span>
              </div>
              
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
                  Lecturer Wilasinee Surasa, D.V.M.
                </h3>
                <p className="text-sm font-semibold text-emerald-400 mt-1">
                  อาจารย์ สพ.ญ. วิลาสินี สุระสา
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Faculty of Veterinary Medicine • Department of Veterinary Virology
                </p>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed font-normal">
                ผู้ออกแบบและพัฒนาแพลตฟอร์ม <strong>VETVIRUS GO</strong> เพื่อยกระดับการเรียนการสอนวิชาไวรัสวิทยาสัตวแพทย์ 
                (Veterinary Virology) สู่รูปแบบ Game-Based Learning ที่เน้นความเข้าใจเชิงลึก ฝึกการคิดวิเคราะห์เคสทางคลินิก 
                และสร้างแรงบันดาลใจในการเรียนรู้แก่นิสิตสัตวแพทย์
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 15 Chapters Curriculum
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> 150 Balanced Question Bank
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" /> Interactive Case Studies
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="w-full max-w-5xl mt-28 p-8 md:p-12 rounded-3xl glass bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/90 border border-primary/20 text-center relative overflow-hidden"
        >
          <div className="relative z-10 space-y-4">
            <h3 className="text-2xl md:text-3xl font-black text-white uppercase">
              พร้อมออกเดินทางสู่โลก <span className="text-cyan-400">VETVIRUS GO</span> แล้วหรือยัง?
            </h3>
            <p className="text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
              ล็อกอินเข้าสู่ระบบเพื่อสร้างโปรไฟล์ เริ่มทำภารกิจ และทดสอบความรู้ในคลังคำถาม 150 ข้อใหม่ได้ทันที
            </p>
            <div className="pt-2">
              <Link href="/login">
                <button className="px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 hover:brightness-110 transition shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                  เริ่มต้นใช้งานตอนนี้
                </button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Footer info */}
        <footer className="mt-16 text-center text-xs text-slate-600 font-mono space-y-1">
          <p>© {new Date().getFullYear()} VetVirus GO — Advanced Veterinary Virology Gamified Learning Platform</p>
          <p>Department of Veterinary Virology • Designed for Next-Gen Veterinary Education</p>
        </footer>

      </main>
    </div>
  );
}
