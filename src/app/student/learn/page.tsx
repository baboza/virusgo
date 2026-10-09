"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { getViruses } from '@/lib/firebase/virusService';
import { Virus } from '@/types';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronRight, 
  Dna, 
  ShieldCheck, 
  CheckCircle2, 
  BookOpen, 
  Sparkles, 
  RotateCcw, 
  LayoutGrid, 
  Table as TableIcon, 
  Filter, 
  ArrowUpRight, 
  Activity, 
  Microscope, 
  ArrowLeft,
  X,
  Award,
  Layers,
  HelpCircle,
  Stethoscope
} from 'lucide-react';
import Link from 'next/link';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[10px]">
      Loading 3D...
    </div>
  ),
});

// Family theme color definitions
export const getFamilyTheme = (family: string) => {
  const f = (family || '').toLowerCase();
  if (f.includes('rhabdo') || f.includes('rabies')) {
    return { text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30', hex: '#ef4444', badge: 'bg-red-500/20 text-red-300 border-red-500/40' };
  }
  if (f.includes('parvo')) {
    return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', hex: '#3b82f6', badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
  }
  if (f.includes('corona')) {
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', hex: '#10b981', badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  }
  if (f.includes('retro')) {
    return { text: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30', hex: '#a855f7', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
  }
  if (f.includes('paramyxo')) {
    return { text: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30', hex: '#f97316', badge: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
  }
  if (f.includes('arteri')) {
    return { text: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/30', hex: '#ec4899', badge: 'bg-pink-500/20 text-pink-300 border-pink-500/40' };
  }
  if (f.includes('picorna')) {
    return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', hex: '#f59e0b', badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  }
  if (f.includes('asfar')) {
    return { text: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30', hex: '#6366f1', badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' };
  }
  if (f.includes('flavi')) {
    return { text: 'text-lime-400', bg: 'bg-lime-500/10', border: 'border-lime-500/30', hex: '#84cc16', badge: 'bg-lime-500/20 text-lime-300 border-lime-500/40' };
  }
  if (f.includes('orthomyxo')) {
    return { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30', hex: '#14b8a6', badge: 'bg-teal-500/20 text-teal-300 border-teal-500/40' };
  }
  if (f.includes('herpes')) {
    return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', hex: '#f43f5e', badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
  }
  if (f.includes('birna')) {
    return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', hex: '#06b6d4', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
  }
  if (f.includes('reo')) {
    return { text: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/30', hex: '#8b5cf6', badge: 'bg-violet-500/20 text-violet-300 border-violet-500/40' };
  }
  return { text: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', hex: '#06b6d4', badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' };
};

const getHostEmoji = (host: string) => {
  const h = (host || '').toLowerCase();
  if (h.includes('canine') || h.includes('dog') || h.includes('สุนัข')) return '🐶';
  if (h.includes('feline') || h.includes('cat') || h.includes('แมว')) return '🐱';
  if (h.includes('swine') || h.includes('pig') || h.includes('porcine') || h.includes('สุกร') || h.includes('หมู')) return '🐷';
  if (h.includes('equine') || h.includes('horse') || h.includes('ม้า')) return '🐴';
  if (h.includes('avian') || h.includes('bird') || h.includes('poultry') || h.includes('ไก่') || h.includes('สัตว์ปีก')) return '🐔';
  if (h.includes('bovine') || h.includes('cattle') || h.includes('cow') || h.includes('วัว') || h.includes('โค')) return '🐮';
  if (h.includes('bat') || h.includes('ค้างคาว')) return '🦇';
  if (h.includes('human') || h.includes('คน')) return '👤';
  return '🐾';
};

export default function LearningModule() {
  const { appUser } = useAuth();
  const [viruses, setViruses] = useState<Virus[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');
  const [selectedGenome, setSelectedGenome] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'completed' | 'uncompleted'>('All');
  const [vaccineOnly, setVaccineOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Spotlight / Random Review Virus
  const [spotlightVirus, setSpotlightVirus] = useState<Virus | null>(null);
  const [showSpotlight, setShowSpotlight] = useState<boolean>(true);

  useEffect(() => {
    const fetchViruses = async () => {
      try {
        const data = await getViruses();
        setViruses(data);
        if (data.length > 0) {
          // Default spotlight to random virus
          const randomIndex = Math.floor(Math.random() * data.length);
          setSpotlightVirus(data[randomIndex]);
        }
      } catch (error) {
        console.error("Error fetching viruses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchViruses();
  }, []);

  const handleRandomizeSpotlight = () => {
    if (viruses.length === 0) return;
    const available = viruses.filter(v => v.virusID !== spotlightVirus?.virusID);
    const pool = available.length > 0 ? available : viruses;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setSpotlightVirus(pool[randomIndex]);
  };

  const families = useMemo(() => {
    const famSet = new Set(viruses.map(v => v.family).filter(Boolean));
    return ['All', ...Array.from(famSet)];
  }, [viruses]);

  // Genome types list
  const genomeCategories = ['All', 'DNA', 'RNA'];

  // Completed Lessons list
  const completedIds = useMemo(() => {
    return new Set(appUser?.completedLessons || []);
  }, [appUser?.completedLessons]);

  const filteredViruses = useMemo(() => {
    return viruses.filter(v => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        v.virusName.toLowerCase().includes(q) || 
        (v.family || '').toLowerCase().includes(q) ||
        (v.genus || '').toLowerCase().includes(q) ||
        (v.genome || '').toLowerCase().includes(q) ||
        (v.host || []).some(h => h.toLowerCase().includes(q)) ||
        (v.clinicalSigns || []).some(s => s.toLowerCase().includes(q));

      const matchesFamily = selectedFamily === 'All' || v.family === selectedFamily;

      const matchesGenome = selectedGenome === 'All' || 
        (selectedGenome === 'DNA' && v.genome.toLowerCase().includes('dna')) ||
        (selectedGenome === 'RNA' && v.genome.toLowerCase().includes('rna'));

      const matchesVaccine = !vaccineOnly || v.vaccine === true;

      const isDone = completedIds.has(v.virusID);
      const matchesStatus = selectedStatus === 'All' || 
        (selectedStatus === 'completed' && isDone) ||
        (selectedStatus === 'uncompleted' && !isDone);

      return matchesSearch && matchesFamily && matchesGenome && matchesVaccine && matchesStatus;
    });
  }, [viruses, searchTerm, selectedFamily, selectedGenome, vaccineOnly, selectedStatus, completedIds]);

  const completedCount = useMemo(() => {
    return viruses.filter(v => completedIds.has(v.virusID)).length;
  }, [viruses, completedIds]);

  const progressPercent = viruses.length > 0 
    ? Math.round((completedCount / viruses.length) * 100) 
    : 0;

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedFamily('All');
    setSelectedGenome('All');
    setSelectedStatus('All');
    setVaccineOnly(false);
  };

  const hasActiveFilters = searchTerm !== '' || selectedFamily !== 'All' || selectedGenome !== 'All' || selectedStatus !== 'All' || vaccineOnly;

  return (
    <div className="space-y-6 pb-16">
      
      {/* 1. Header & Navigation */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
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
                VetVirus Codex
              </span>
              <span className="text-xs text-slate-400 font-mono">
                ฐานข้อมูลทางการสัตวแพทย์
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide text-glow mt-1 flex items-center gap-2">
              <span>สารานุกรมไวรัสสัตวแพทย์</span>
            </h1>
          </div>
        </div>

        {/* Action Toggles */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
          <button
            type="button"
            onClick={() => setShowSpotlight(!showSpotlight)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
              showSpotlight
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>ไฮไลท์ 3D</span>
          </button>

          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'grid' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="มุมมองแบบการ์ด"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === 'table' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
              title="มุมมองแบบตารางสรุป"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Mastery & Learning Progress Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Viruses */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Microscope className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-slate-400">ไวรัสทั้งหมด</div>
            <div className="text-xl sm:text-2xl font-black text-white">{viruses.length} ชนิด</div>
          </div>
        </div>

        {/* Card 2: Learned Status */}
        <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-emerald-400/90 flex items-center gap-1">
              <span>ศึกษาแล้ว</span>
              <span className="font-bold">({progressPercent}%)</span>
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-300">
              {completedCount} <span className="text-xs text-slate-400 font-normal">/ {viruses.length}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Vaccine Available */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-slate-400">มีวัคซีนป้องกัน</div>
            <div className="text-xl sm:text-2xl font-black text-amber-300">
              {viruses.filter(v => v.vaccine).length} ชนิด
            </div>
          </div>
        </div>

        {/* Card 4: Unique Families */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-slate-400">ตระกูลไวรัส (Families)</div>
            <div className="text-xl sm:text-2xl font-black text-purple-300">
              {Math.max(0, families.length - 1)} ตระกูล
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3.5">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <span className="text-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>ความเชี่ยวชาญสารานุกรม (Codex Mastery)</span>
          </span>
          <span className="text-cyan-400 font-bold">{progressPercent}% สำเร็จ</span>
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <motion.div 
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* 3. Interactive 3D Spotlight Showcase (Expandable / Collapsible) */}
      <AnimatePresence>
        {showSpotlight && spotlightVirus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {(() => {
              const theme = getFamilyTheme(spotlightVirus.family);
              const isSpotlightCompleted = completedIds.has(spotlightVirus.virusID);

              return (
                <div 
                  className="rounded-3xl border p-5 md:p-6 relative overflow-hidden backdrop-blur-md shadow-2xl transition-all"
                  style={{
                    backgroundColor: `${theme.hex}12`,
                    borderColor: `${theme.hex}45`,
                  }}
                >
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                    
                    {/* 3D Hologram Stage */}
                    <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-2xl bg-slate-950/90 border border-slate-800/80 shrink-0 shadow-inner overflow-hidden flex items-center justify-center group">
                      <div className="absolute top-2 left-2 z-10 text-[9px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/40">
                        หมุน 3D อิสระ
                      </div>
                      <VirusViewer3D 
                        type={familyToVirusType(spotlightVirus.family)}
                        color={theme.hex}
                        interactive={true}
                        className="w-full h-full"
                      />
                    </div>

                    {/* Spotlight Content */}
                    <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${theme.badge}`}>
                          {spotlightVirus.family}
                        </span>
                        {spotlightVirus.vaccine && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400" /> มีวัคซีน
                          </span>
                        )}
                        {isSpotlightCompleted && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> ศึกษาแล้ว
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                          ไวรัสแนะนำสำหรับทบทวน (Spotlight Review)
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide mt-0.5">
                          {spotlightVirus.virusName}
                        </h2>
                        {spotlightVirus.genus && (
                          <p className="text-xs font-mono text-slate-400 mt-0.5">
                            Genus: {spotlightVirus.genus}
                          </p>
                        )}
                      </div>

                      {/* Quick Facts Preview */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 flex items-center gap-2">
                          <Dna className="w-4 h-4 text-cyan-400 shrink-0" />
                          <div className="truncate">
                            <span className="text-slate-400 font-mono text-[10px] block leading-none mb-0.5">สารพันธุกรรม</span>
                            <span className="font-bold text-slate-200 font-mono">{spotlightVirus.genome}</span>
                          </div>
                        </div>

                        <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800/80 flex items-center gap-2">
                          <span className="text-base shrink-0">🐾</span>
                          <div className="truncate">
                            <span className="text-slate-400 font-mono text-[10px] block leading-none mb-0.5">สัตว์ที่เป็นโฮสต์</span>
                            <span className="font-bold text-slate-200 truncate block">
                              {(spotlightVirus.host || []).slice(0, 3).join(', ') || '-'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-1">
                        <Link
                          href={`/student/learn/detail?id=${spotlightVirus.virusID}`}
                          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>ศึกษาข้อมูลเชิงลึก</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={handleRandomizeSpotlight}
                          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 transition-all flex items-center gap-1.5 active:scale-95"
                          title="สุ่มไวรัสอื่นเพื่อทบทวน"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                          <span>สุ่มไวรัสตัวอื่น</span>
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Search and Multi-Category Filters */}
      <div className="space-y-3 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-5">
        
        {/* Top Search Input Row */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาชื่อไวรัส, ตระกูล, จีโนม, สัตว์ที่เป็นโฮสต์, หรืออาการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl pl-10 pr-9 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Clear Filter Button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors flex items-center justify-center gap-1 shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ล้างตัวกรอง</span>
            </button>
          )}
        </div>

        {/* Secondary Filter Chips Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <span className="text-[10px] font-mono text-slate-500 px-1.5 uppercase">สถานะ:</span>
            <button
              type="button"
              onClick={() => setSelectedStatus('All')}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${
                selectedStatus === 'All' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('completed')}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors flex items-center gap-1 ${
                selectedStatus === 'completed' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>ศึกษาแล้ว</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedStatus('uncompleted')}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${
                selectedStatus === 'uncompleted' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              ยังไม่อ่าน
            </button>
          </div>

          {/* Genome Filter */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
            <span className="text-[10px] font-mono text-slate-500 px-1.5 uppercase">จีโนม:</span>
            {genomeCategories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedGenome(cat)}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-colors ${
                  selectedGenome === cat ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Vaccine Toggle */}
          <button
            type="button"
            onClick={() => setVaccineOnly(!vaccineOnly)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-mono border transition-all flex items-center gap-1.5 shrink-0 ${
              vaccineOnly
                ? 'bg-amber-950/80 border-amber-500/50 text-amber-300 font-bold'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>มีวัคซีนเท่านั้น</span>
          </button>

          <span className="text-[11px] font-mono text-slate-500 ml-auto">
            ผลลัพธ์: <strong className="text-white">{filteredViruses.length}</strong> / {viruses.length} ชนิด
          </span>
        </div>

        {/* Family Scrollable Pills */}
        <div className="pt-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
            จำแนกตามตระกูลไวรัส (Families):
          </div>
          <div className="flex flex-wrap gap-1.5">
            {families.map(family => {
              const isSelected = selectedFamily === family;
              const count = family === 'All' 
                ? viruses.length 
                : viruses.filter(v => v.family === family).length;
              const theme = getFamilyTheme(family);

              return (
                <button
                  key={family}
                  type="button"
                  onClick={() => setSelectedFamily(family)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 border ${
                    isSelected
                      ? 'bg-cyan-500 border-cyan-400 text-slate-950 font-bold shadow-md shadow-cyan-500/20 scale-105'
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {family !== 'All' && (
                    <span 
                      className="w-2 h-2 rounded-full inline-block" 
                      style={{ backgroundColor: theme.hex }}
                    />
                  )}
                  <span>{family}</span>
                  <span className={`text-[10px] px-1.5 rounded-full ${isSelected ? 'bg-slate-900/40 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* 5. Content Presentation: Grid View vs Table View */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-cyan-400 border-t-transparent" />
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
            กำลังเข้าถึงฐานข้อมูลไวรัส...
          </span>
        </div>
      ) : viewMode === 'grid' ? (
        
        /* ──── GRID VIEW ──── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredViruses.map((virus, idx) => {
            const isCompleted = completedIds.has(virus.virusID);
            const theme = getFamilyTheme(virus.family);

            return (
              <Link key={virus.virusID} href={`/student/learn/detail?id=${virus.virusID}`}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.4) }}
                  className="h-full"
                >
                  <Card 
                    className="h-full group cursor-pointer border-slate-800/80 bg-slate-900/70 hover:border-cyan-500/50 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between rounded-3xl"
                  >
                    {/* Background SVG Watermark */}
                    <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-15 group-hover:scale-125 transition-all duration-500 text-white pointer-events-none">
                      <SVGVirus
                        type={familyToVirusType(virus.family)}
                        className="w-24 h-24"
                        glowColor={theme.hex}
                      />
                    </div>

                    <div className="p-5 flex flex-col h-full relative z-10 space-y-3.5">
                      
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span 
                          className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${theme.badge}`}
                        >
                          {virus.family}
                        </span>

                        {isCompleted ? (
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>ศึกษาแล้ว</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded-full">
                            ยังไม่อ่าน
                          </span>
                        )}
                      </div>

                      {/* Virus Centerpiece Icon */}
                      <div className="flex items-center gap-3.5 pt-1">
                        <div 
                          className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0 p-2 group-hover:scale-110 transition-transform shadow-inner"
                        >
                          <SVGVirus
                            type={familyToVirusType(virus.family)}
                            className="w-full h-full"
                            glowColor={theme.hex}
                          />
                        </div>

                        <div className="min-w-0">
                          <h3 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors leading-tight line-clamp-2">
                            {virus.virusName}
                          </h3>
                          {virus.genus && (
                            <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                              {virus.genus}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tags: Genome & Vaccine */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                          <Dna className="w-3 h-3 text-cyan-400" />
                          <span>{virus.genome}</span>
                        </span>

                        {virus.vaccine ? (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-amber-950/40 border border-amber-500/30 text-amber-300 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-amber-400" />
                            <span>มีวัคซีน</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono text-slate-500 bg-slate-950 border border-slate-800">
                            ไม่มีวัคซีน
                          </span>
                        )}
                      </div>

                      {/* Primary Hosts Chips */}
                      {virus.host && virus.host.length > 0 && (
                        <div className="pt-1">
                          <div className="text-[10px] font-mono text-slate-500 mb-1">สัตว์ที่เป็นโฮสต์:</div>
                          <div className="flex flex-wrap gap-1">
                            {virus.host.slice(0, 3).map((h, i) => (
                              <span 
                                key={i} 
                                className="px-2 py-0.5 bg-slate-950/70 border border-slate-800/80 rounded-md text-[10px] text-slate-300 font-medium flex items-center gap-1"
                              >
                                <span>{getHostEmoji(h)}</span>
                                <span className="truncate max-w-[90px]">{h}</span>
                              </span>
                            ))}
                            {virus.host.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded-md text-[10px] text-slate-500 font-mono">
                                +{virus.host.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bottom Link Action */}
                      <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-cyan-400 font-mono text-xs font-bold group-hover:translate-x-1 transition-transform">
                        <span>อ่านข้อมูลเชิงลึก</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>

                    </div>
                  </Card>
                </motion.div>
              </Link>
            );
          })}
        </div>

      ) : (

        /* ──── TABLE VIEW (Quick Exam Review Matrix) ──── */
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">ไวรัส (Virus)</th>
                  <th className="py-3 px-4">ตระกูล (Family)</th>
                  <th className="py-3 px-4">จีโนม (Genome)</th>
                  <th className="py-3 px-4">โฮสต์เป้าหมาย (Hosts)</th>
                  <th className="py-3 px-4">วัคซีน (Vaccine)</th>
                  <th className="py-3 px-4 text-center">สถานะ</th>
                  <th className="py-3 px-4 text-right">แอ็กชัน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredViruses.map(virus => {
                  const isCompleted = completedIds.has(virus.virusID);
                  const theme = getFamilyTheme(virus.family);

                  return (
                    <tr 
                      key={virus.virusID}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Icon */}
                      <td className="py-3 px-4">
                        <Link 
                          href={`/student/learn/detail?id=${virus.virusID}`}
                          className="flex items-center gap-2.5 font-sans font-bold text-white hover:text-cyan-300 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 p-1">
                            <SVGVirus
                              type={familyToVirusType(virus.family)}
                              className="w-full h-full"
                              glowColor={theme.hex}
                            />
                          </div>
                          <div>
                            <div className="text-sm leading-tight">{virus.virusName}</div>
                            {virus.genus && (
                              <div className="text-[10px] text-slate-500 font-mono">{virus.genus}</div>
                            )}
                          </div>
                        </Link>
                      </td>

                      {/* Family */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] border font-bold ${theme.badge}`}>
                          {virus.family}
                        </span>
                      </td>

                      {/* Genome */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-300">{virus.genome}</span>
                      </td>

                      {/* Hosts */}
                      <td className="py-3 px-4 font-sans text-slate-300">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(virus.host || []).map((h, i) => (
                            <span key={i} className="text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                              {getHostEmoji(h)} {h}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Vaccine */}
                      <td className="py-3 px-4">
                        {virus.vaccine ? (
                          <span className="text-amber-400 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> มีวัคซีน
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> ศึกษาแล้ว
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                            ยังไม่อ่าน
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/student/learn/detail?id=${virus.virusID}`}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 font-bold transition-all inline-flex items-center gap-1 font-sans text-xs"
                        >
                          <span>อ่านข้อมูล</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredViruses.length === 0 && (
        <div className="py-16 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-white">ไม่พบไวรัสที่ตรงกับตัวกรองของคุณ</h3>
          <p className="text-xs text-slate-400 font-mono max-w-sm mx-auto">
            ลองปรับเปลี่ยนคำค้นหา หรือรีเซ็ตตัวกรองเพื่อค้นหาไวรัสทั้งหมดในฐานข้อมูล
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตตัวกรองทั้งหมด</span>
          </button>
        </div>
      )}

    </div>
  );
}
