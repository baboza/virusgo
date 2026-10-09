"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Stethoscope, ShieldAlert, Microscope, Activity, ChevronRight, Zap, PlayCircle, GraduationCap } from "lucide-react";
import { BackgroundSVG } from "@/components/ui/BackgroundSVG";

export default function Home() {
  const container: any = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex flex-col pt-12 pb-24 px-4 sm:px-6 lg:px-8">
      {/* Dynamic Background */}
      <BackgroundSVG type="virus" />
      
      {/* Lighting Orbs */}
      <div className="absolute top-[10%] left-[20%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[30%] h-[30%] rounded-full bg-secondary/20 blur-[120px] pointer-events-none -z-10" />

      <main className="z-10 w-full max-w-7xl mx-auto flex flex-col items-center mt-12 md:mt-24">
        
        {/* Hero Section */}
        <motion.div 
          className="text-center space-y-8 max-w-4xl w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black/40 border border-primary/30 backdrop-blur-md text-sm font-black text-primary mb-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] uppercase tracking-widest"
          >
            <Activity className="w-5 h-5 animate-pulse" />
            <span>Next-Gen Veterinary Education</span>
          </motion.div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white uppercase text-glow drop-shadow-2xl">
            VET<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">VIRUS</span> QUEST
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-medium">
            The ultimate game-based learning platform. Conquer Veterinary Virology through interactive missions, clinical cases, and outbreak simulations.
          </p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {/* Student Action */}
            <Link href="/login" className="w-full sm:w-1/2 group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-2xl blur opacity-70 group-hover:opacity-100 transition duration-300 group-hover:duration-200 animate-pulse"></div>
              <button className="relative w-full glass bg-black/50 border-primary/50 text-white rounded-2xl px-8 py-5 flex items-center justify-center gap-3 overflow-hidden transition-all duration-300 group-hover:scale-105">
                <PlayCircle className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <div className="font-black text-xl uppercase tracking-wider text-glow">START QUEST</div>
                  <div className="text-xs text-slate-300 font-mono">Student Access</div>
                </div>
              </button>
            </Link>

            {/* Instructor Action */}
            <Link href="/login" className="w-full sm:w-1/2 group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-secondary to-danger rounded-2xl blur opacity-40 group-hover:opacity-80 transition duration-300"></div>
              <button className="relative w-full glass bg-black/50 border-secondary/50 text-white rounded-2xl px-8 py-5 flex items-center justify-center gap-3 transition-all duration-300 group-hover:scale-105 hover:bg-slate-900/80">
                <GraduationCap className="w-8 h-8 text-secondary" />
                <div className="text-left">
                  <div className="font-black text-xl uppercase tracking-wider text-secondary">INSTRUCTOR</div>
                  <div className="text-xs text-slate-300 font-mono">Admin Terminal</div>
                </div>
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-32 w-full px-4"
        >
          <motion.div variants={item} className="group cursor-pointer">
            <div className="p-8 glass rounded-3xl border-primary/20 h-full hover:-translate-y-2 transition-transform duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <Microscope className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-3">Lab Detective</h3>
              <p className="text-slate-400 font-medium">Interpret PCR, ELISA, and histopathology results to determine the correct diagnosis like a pro.</p>
            </div>
          </motion.div>

          <motion.div variants={item} className="group cursor-pointer">
            <div className="p-8 glass rounded-3xl border-secondary/20 h-full hover:-translate-y-2 transition-transform duration-300 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] relative">
              <div className="absolute top-0 right-0 p-3 bg-secondary/20 text-secondary text-xs font-black rounded-bl-xl rounded-tr-3xl uppercase tracking-widest">Core</div>
              <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-3">Clinical Cases</h3>
              <p className="text-slate-400 font-medium">Apply theoretical knowledge to solve real-world clinical cases and manage virus outbreaks.</p>
            </div>
          </motion.div>

          <motion.div variants={item} className="group cursor-pointer">
            <div className="p-8 glass rounded-3xl border-danger/20 h-full hover:-translate-y-2 transition-transform duration-300 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]">
              <div className="w-16 h-16 bg-danger/20 rounded-2xl flex items-center justify-center text-danger mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white uppercase tracking-wider mb-3">Multiplayer</h3>
              <p className="text-slate-400 font-medium">Challenge classmates in real-time Classroom Battles or team up to defeat Boss Viruses.</p>
            </div>
          </motion.div>
        </motion.div>
        
      </main>
    </div>
  );
}
