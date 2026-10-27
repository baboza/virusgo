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
  Stethoscope,
  GraduationCap,
  Clock,
  Check,
  AlertCircle,
  Trophy,
  Play,
  FileText,
  Flame,
  BookMarked,
  Star,
  CheckSquare,
  Square,
  ListOrdered
} from 'lucide-react';
import Link from 'next/link';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { useAuth } from '@/contexts/AuthContext';
import dynamic from 'next/dynamic';
import { db } from '@/lib/firebase/config';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { 
  VET_VIROLOGY_15_CHAPTERS, 
  ALL_15_CHAPTER_QUESTIONS, 
  CurriculumChapter, 
  MasterQuestion,
  ChapterVirusReference
} from '@/data/veterinaryVirologyContent';

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

  // Top View Mode: 'curriculum' (15 Chapters) vs 'codex' (Virus Codex 3D)
  const [viewTab, setViewTab] = useState<'curriculum' | 'codex'>('curriculum');

  // Completed Chapters Local Tracking
  const [completedChapterIds, setCompletedChapterIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (appUser?.completedChapters && Array.isArray(appUser.completedChapters)) {
      setCompletedChapterIds(new Set(appUser.completedChapters));
    }
  }, [appUser?.completedChapters]);

  // Codex Filters & State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');
  const [selectedGenome, setSelectedGenome] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'completed' | 'uncompleted'>('All');
  const [vaccineOnly, setVaccineOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Spotlight / Random Review Virus
  const [spotlightVirus, setSpotlightVirus] = useState<Virus | null>(null);
  const [showSpotlight, setShowSpotlight] = useState<boolean>(true);

  // Curriculum State
  const [curriculumSearch, setCurriculumSearch] = useState('');
  const [curriculumFilter, setCurriculumFilter] = useState<'all' | 'completed' | 'in_progress'>('all');

  // Chapter Modal State
  const [activeChapter, setActiveChapter] = useState<CurriculumChapter | null>(null);
  const [modalTab, setModalTab] = useState<'synopsis' | 'pathogens' | 'quiz'>('synopsis');

  // Quiz Interaction State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [isSubmittingToDb, setIsSubmittingToDb] = useState<boolean>(false);
  const [quizSuccessAlert, setQuizSuccessAlert] = useState<string | null>(null);

  useEffect(() => {
    const fetchViruses = async () => {
      try {
        const data = await getViruses();
        setViruses(data);
        if (data.length > 0) {
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

  const genomeCategories = ['All', 'DNA', 'RNA'];

  // Codex Completed Lessons Set
  const completedVirusIds = useMemo(() => {
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

      const isDone = completedVirusIds.has(v.virusID);
      const matchesStatus = selectedStatus === 'All' || 
        (selectedStatus === 'completed' && isDone) ||
        (selectedStatus === 'uncompleted' && !isDone);

      return matchesSearch && matchesFamily && matchesGenome && matchesVaccine && matchesStatus;
    });
  }, [viruses, searchTerm, selectedFamily, selectedGenome, vaccineOnly, selectedStatus, completedVirusIds]);

  const completedCodexCount = useMemo(() => {
    return viruses.filter(v => completedVirusIds.has(v.virusID)).length;
  }, [viruses, completedVirusIds]);

  const codexProgressPercent = viruses.length > 0 
    ? Math.round((completedCodexCount / viruses.length) * 100) 
    : 0;

  // Curriculum Filtered Chapters
  const filteredChapters = useMemo(() => {
    return VET_VIROLOGY_15_CHAPTERS.filter(ch => {
      const q = curriculumSearch.toLowerCase().trim();
      const matchesSearch = !q ||
        ch.title.toLowerCase().includes(q) ||
        ch.titleEn.toLowerCase().includes(q) ||
        ch.chapterNumber.toLowerCase().includes(q) ||
        ch.description.toLowerCase().includes(q) ||
        ch.targetFamilies.some(f => f.toLowerCase().includes(q)) ||
        ch.featuredViruses.some(v => v.name.toLowerCase().includes(q) || v.nameEn.toLowerCase().includes(q));

      const isCompleted = completedChapterIds.has(ch.id);
      const matchesFilter = curriculumFilter === 'all' ||
        (curriculumFilter === 'completed' && isCompleted) ||
        (curriculumFilter === 'in_progress' && !isCompleted);

      return matchesSearch && matchesFilter;
    });
  }, [curriculumSearch, curriculumFilter, completedChapterIds]);

  const curriculumProgressPercent = Math.round((completedChapterIds.size / VET_VIROLOGY_15_CHAPTERS.length) * 100);

  // Active Chapter Questions
  const chapterQuestions = useMemo(() => {
    if (!activeChapter) return [];
    return ALL_15_CHAPTER_QUESTIONS.filter(q => q.chapter === activeChapter.id);
  }, [activeChapter]);

  // Open Chapter Modal
  const handleOpenChapter = (chapter: CurriculumChapter, tab: 'synopsis' | 'pathogens' | 'quiz' = 'synopsis') => {
    setActiveChapter(chapter);
    setModalTab(tab);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizSuccessAlert(null);
  };

  const handleSelectQuizAnswer = (questionId: string, choice: string) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: choice
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeChapter || chapterQuestions.length === 0) return;

    // Calculate score
    let score = 0;
    chapterQuestions.forEach(q => {
      if (quizAnswers[q.id] === q.answer) {
        score += 1;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    const isPassed = (score / chapterQuestions.length) >= 0.7; // 70% threshold (7/10)
    const isAlreadyCompleted = completedChapterIds.has(activeChapter.id);

    if (isPassed) {
      setQuizSuccessAlert(`ยินดีด้วย! คุณผ่านการทดสอบประจำ${activeChapter.chapterNumber} ด้วยคะแนน ${score}/${chapterQuestions.length} ข้อ (${Math.round((score / chapterQuestions.length) * 100)}%) ได้รับ +50 EXP!`);
      
      // Update local state immediately
      setCompletedChapterIds(prev => new Set(prev).add(activeChapter.id));

      // Save to Firebase atomically
      if (appUser?.uid && !isAlreadyCompleted) {
        setIsSubmittingToDb(true);
        try {
          await updateDoc(doc(db, 'users', appUser.uid), {
            completedChapters: arrayUnion(activeChapter.id),
            completedLessons: arrayUnion(`ch_${activeChapter.id}`),
            exp: increment(50),
            score: increment(50),
          });
        } catch (err) {
          console.error("Error saving completed chapter to Firestore:", err);
        } finally {
          setIsSubmittingToDb(false);
        }
      }
    } else {
      setQuizSuccessAlert(null);
    }
  };

  const handleRetakeQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizSuccessAlert(null);
  };

  const resetCodexFilters = () => {
    setSearchTerm('');
    setSelectedFamily('All');
    setSelectedGenome('All');
    setSelectedStatus('All');
    setVaccineOnly(false);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. Header & Dual-Mode Master Switcher */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/student"
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors shrink-0 shadow-sm"
            title="กลับแดชบอร์ดหลัก"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-widest font-bold">
                Veterinary Virology Hub
              </span>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                หลักสูตรและสารานุกรม 15 สัปดาห์
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide mt-1 flex items-center gap-2">
              <span>ศูนย์การเรียนรู้ไวรัสวิทยาสัตวแพทย์</span>
            </h1>
          </div>
        </div>

        {/* Mode Switcher Segmented Control */}
        <div className="flex items-center bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl gap-1.5 self-stretch sm:self-auto shadow-inner">
          <button
            type="button"
            onClick={() => setViewTab('curriculum')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              viewTab === 'curriculum'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 font-black scale-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>หลักสูตร 15 บทเรียน</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
              viewTab === 'curriculum' ? 'bg-slate-950/40 text-slate-950' : 'bg-slate-800 text-cyan-400'
            }`}>
              {completedChapterIds.size}/15
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab('codex')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              viewTab === 'codex'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-black scale-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Microscope className="w-4 h-4" />
            <span>สารานุกรม 3D Lab</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
              viewTab === 'codex' ? 'bg-slate-950/40 text-slate-950' : 'bg-slate-800 text-emerald-400'
            }`}>
              {completedCodexCount}/{viruses.length}
            </span>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 1: 15-CHAPTER CURRICULUM ROADMAP (DEFAULT) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewTab === 'curriculum' && (
        <div className="space-y-6">
          
          {/* Hero Curriculum Progress Banner */}
          <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 p-6 md:p-8 overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-mono font-bold">
                  <BookMarked className="w-3.5 h-3.5 text-blue-400" />
                  <span>หลักสูตรบรรยายและแบบทดสอบมาตรฐานสัตวแพทย์ 15 สัปดาห์</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Veterinary Virology Curriculum
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  เรียนรู้และทบทวนเนื้อหาไวรัสวิทยาสัตวแพทย์อย่างเป็นระบบ สรุปสาระสำคัญ High-Yield เจาะลึกรายบท 
                  พร้อมทดสอบความรู้ด้วยข้อสอบท้ายบท 10 ข้อ (+50 EXP ทุกบทที่ผ่านเกณฑ์ 70%)
                </p>
              </div>

              {/* Progress Gauges */}
              <div className="w-full lg:w-72 bg-slate-950/80 border border-blue-500/30 rounded-2xl p-4.5 space-y-3 shrink-0 shadow-lg">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">ความก้าวหน้าหลักสูตร</span>
                  <span className="text-cyan-400 font-bold">{curriculumProgressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                    initial={{ width: 0 }}
                    animate={{ width: `${curriculumProgressPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                <div className="flex justify-between items-center text-xs font-mono pt-1">
                  <span className="text-slate-400">ผ่านแล้ว:</span>
                  <span className="text-emerald-400 font-black text-sm">
                    {completedChapterIds.size} <span className="text-slate-500 text-xs font-normal">/ 15 บท</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stat Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">บทเรียนทั้งหมด</div>
                  <div className="font-bold text-white text-sm">15 บทเรียน</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">คลังข้อสอบท้ายบท</div>
                  <div className="font-bold text-purple-300 text-sm">150 ข้อสอบ</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">โบนัสรางวัล EXP</div>
                  <div className="font-bold text-amber-300 text-sm">+750 EXP รวม</div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">เกณฑ์การผ่าน</div>
                  <div className="font-bold text-emerald-300 text-sm">$\ge$ 70% (7/10)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900/60 border border-slate-800 rounded-2xl p-3.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="ค้นหาชื่อบท, รหัสสไลด์, ตระกูลไวรัส, หรือเชื้อไวรัส..."
                value={curriculumSearch}
                onChange={(e) => setCurriculumSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/70 rounded-xl pl-10 pr-9 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              {curriculumSearch && (
                <button
                  type="button"
                  onClick={() => setCurriculumSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setCurriculumFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  curriculumFilter === 'all'
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด (15)
              </button>
              <button
                type="button"
                onClick={() => setCurriculumFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
                  curriculumFilter === 'completed'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>ผ่านแล้ว ({completedChapterIds.size})</span>
              </button>
              <button
                type="button"
                onClick={() => setCurriculumFilter('in_progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  curriculumFilter === 'in_progress'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ยังไม่ผ่าน ({15 - completedChapterIds.size})
              </button>
            </div>
          </div>

          {/* 15 Chapter Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredChapters.map((chapter) => {
              const isPassed = completedChapterIds.has(chapter.id);
              const theme = getFamilyTheme(chapter.targetFamilies[0] || 'default');

              return (
                <Card
                  key={chapter.id}
                  className={`relative rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden p-5 group hover:shadow-xl ${
                    isPassed
                      ? 'bg-gradient-to-b from-slate-900/90 to-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                      : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]'
                  }`}
                >
                  {/* Decorative Chapter Watermark */}
                  <div className="absolute top-2 right-3 text-5xl font-black text-slate-800/30 font-mono select-none pointer-events-none group-hover:text-slate-700/40 transition-colors">
                    {chapter.id < 10 ? `0${chapter.id}` : chapter.id}
                  </div>

                  <div className="space-y-3.5 relative z-10">
                    
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          {chapter.chapterNumber}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                          {chapter.facultyReference}
                        </span>
                      </div>

                      {isPassed ? (
                        <span className="text-[10px] font-mono font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>ผ่านเกณฑ์ (+50 EXP)</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>พร้อมเรียน</span>
                        </span>
                      )}
                    </div>

                    {/* Titles */}
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white group-hover:text-cyan-300 transition-colors leading-snug">
                        {chapter.title}
                      </h3>
                      <div className="text-xs font-mono text-slate-400 mt-0.5 line-clamp-1">
                        {chapter.titleEn}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {chapter.description}
                    </p>

                    {/* High-Yield Highlights Preview */}
                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3 space-y-1.5 text-xs">
                      <div className="text-[10px] font-mono text-cyan-400 font-bold flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>ประเด็นสำคัญ High-Yield:</span>
                      </div>
                      {chapter.keyTakeaways.slice(0, 2).map((takeaway, idx) => (
                        <div key={idx} className="flex items-start gap-1.5 text-slate-300 text-[11px] leading-tight">
                          <span className="text-cyan-500 mt-0.5">•</span>
                          <span className="line-clamp-1">{takeaway}</span>
                        </div>
                      ))}
                    </div>

                    {/* Target Families Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {chapter.targetFamilies.map((fam, fIdx) => (
                        <span
                          key={fIdx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-950/80 border border-slate-800 text-slate-300"
                        >
                          {fam}
                        </span>
                      ))}
                    </div>

                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center gap-2 relative z-10">
                    <button
                      type="button"
                      onClick={() => handleOpenChapter(chapter, 'synopsis')}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                      <span>สรุปสาระสำคัญ</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenChapter(chapter, 'quiz')}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 ${
                        isPassed
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isPassed ? 'ทบทวนข้อสอบ' : 'ทำแบบทดสอบ'}</span>
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODE 2: VIRUS CODEX & 3D LAB (PRESERVED FULL ENCYCLOPEDIA) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {viewTab === 'codex' && (
        <div className="space-y-6">
          
          {/* Subheader & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800 p-4 rounded-3xl">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                Codex 3D Encyclopedia
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                คลังสารานุกรมและโมเดล 3D จำแนกตามสปีชีส์
              </h2>
            </div>

            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <button
                type="button"
                onClick={() => setShowSpotlight(!showSpotlight)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all flex items-center gap-1.5 ${
                  showSpotlight
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    : 'bg-slate-800/70 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>ไฮไลท์ 3D</span>
              </button>

              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewMode === 'grid' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="มุมมองการ์ด"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors ${
                    viewMode === 'table' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                  title="มุมมองตาราง"
                >
                  <TableIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 3D Spotlight Showcase */}
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
                  const isSpotlightCompleted = completedVirusIds.has(spotlightVirus.virusID);

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
                            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
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
                              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md active:scale-95"
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

          {/* Search and Multi-Category Filters */}
          <div className="space-y-3 bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-5">
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

              {(searchTerm !== '' || selectedFamily !== 'All' || selectedGenome !== 'All' || selectedStatus !== 'All' || vaccineOnly) && (
                <button
                  type="button"
                  onClick={resetCodexFilters}
                  className="px-3 py-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors flex items-center justify-center gap-1 shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>ล้างตัวกรอง</span>
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-xs">
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

            {/* Families Chips */}
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
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20 scale-105'
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

          {/* Codex Content: Grid or Table */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-400 border-t-transparent" />
              <span className="font-mono text-xs text-slate-400 uppercase tracking-widest">
                กำลังเข้าถึงฐานข้อมูลไวรัส...
              </span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {filteredViruses.map((virus, idx) => {
                const isCompleted = completedVirusIds.has(virus.virusID);
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
                        className="h-full group cursor-pointer border-slate-800/80 bg-slate-900/70 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(16,185,129,0.15)] transition-all duration-300 relative overflow-hidden flex flex-col justify-between rounded-3xl"
                      >
                        <div className="absolute top-2 right-2 opacity-5 group-hover:opacity-15 group-hover:scale-125 transition-all duration-500 text-white pointer-events-none">
                          <SVGVirus
                            type={familyToVirusType(virus.family)}
                            className="w-24 h-24"
                            glowColor={theme.hex}
                          />
                        </div>

                        <div className="p-5 flex flex-col h-full relative z-10 space-y-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
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

                          <div className="flex items-center gap-3.5 pt-1">
                            <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shrink-0 p-2 group-hover:scale-110 transition-transform shadow-inner">
                              <SVGVirus
                                type={familyToVirusType(virus.family)}
                                className="w-full h-full"
                                glowColor={theme.hex}
                              />
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-base font-black text-white group-hover:text-emerald-300 transition-colors leading-tight line-clamp-2">
                                {virus.virusName}
                              </h3>
                              {virus.genus && (
                                <div className="text-[11px] font-mono text-slate-400 truncate mt-0.5">
                                  {virus.genus}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300 flex items-center gap-1">
                              <Dna className="w-3 h-3 text-emerald-400" />
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

                          <div className="mt-auto pt-3 border-t border-slate-800/80 flex items-center justify-between text-emerald-400 font-mono text-xs font-bold group-hover:translate-x-1 transition-transform">
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
                      const isCompleted = completedVirusIds.has(virus.virusID);
                      const theme = getFamilyTheme(virus.family);

                      return (
                        <tr key={virus.virusID} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <Link 
                              href={`/student/learn/detail?id=${virus.virusID}`}
                              className="flex items-center gap-2.5 font-sans font-bold text-white hover:text-emerald-300 transition-colors"
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
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-md text-[11px] border font-bold ${theme.badge}`}>
                              {virus.family}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-300">{virus.genome}</span>
                          </td>
                          <td className="py-3 px-4 font-sans text-slate-300">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(virus.host || []).map((h, i) => (
                                <span key={i} className="text-[11px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                                  {getHostEmoji(h)} {h}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            {virus.vaccine ? (
                              <span className="text-amber-400 font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> มีวัคซีน
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
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
                          <td className="py-3 px-4 text-right">
                            <Link
                              href={`/student/learn/detail?id=${virus.virusID}`}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 font-bold transition-all inline-flex items-center gap-1 font-sans text-xs"
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

          {!loading && filteredViruses.length === 0 && (
            <div className="py-16 text-center space-y-3 bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 mx-auto flex items-center justify-center text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">ไม่พบไวรัสที่ตรงกับตัวกรอง</h3>
              <button
                type="button"
                onClick={resetCodexFilters}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>รีเซ็ตตัวกรองทั้งหมด</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. INTERACTIVE CHAPTER STUDY & MASTERY QUIZ MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeChapter && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative my-auto"
            >
              
              {/* Modal Top Header */}
              <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-4">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {activeChapter.chapterNumber}
                    </span>
                    <span className="text-xs font-mono text-slate-400 truncate">
                      {activeChapter.facultyReference}
                    </span>
                    {completedChapterIds.has(activeChapter.id) && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>ผ่านการทดสอบแล้ว</span>
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                    {activeChapter.title}
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    {activeChapter.titleEn}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveChapter(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="flex items-center border-b border-slate-800 bg-slate-950/50 px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto text-xs sm:text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setModalTab('synopsis')}
                  className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    modalTab === 'synopsis'
                      ? 'border-cyan-400 text-cyan-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>สรุปสาระสำคัญ (Synopsis & Slides)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('pathogens')}
                  className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    modalTab === 'pathogens'
                      ? 'border-cyan-400 text-cyan-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Microscope className="w-4 h-4" />
                  <span>เชื้อไวรัสเด่น ({activeChapter.featuredViruses.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('quiz')}
                  className={`py-3.5 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
                    modalTab === 'quiz'
                      ? 'border-cyan-400 text-cyan-400 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>แบบทดสอบประจำบท ({chapterQuestions.length} ข้อ)</span>
                  {completedChapterIds.has(activeChapter.id) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  )}
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="p-5 sm:p-7 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
                
                {/* ─── TAB 1: SYNOPSIS & SLIDES OUTLINE ─── */}
                {modalTab === 'synopsis' && (
                  <div className="space-y-6">
                    {/* Chapter Description */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5">
                      <div className="text-[11px] font-mono text-cyan-400 font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <BookMarked className="w-3.5 h-3.5" />
                        <span>ภาพรวมเนื้อหาการบรรยาย (Course Synopsis)</span>
                      </div>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {activeChapter.description}
                      </p>
                    </div>

                    {/* Key High-Yield Takeaways */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-black text-white">
                          ประเด็นสำคัญและข้อสอบพบบ่อย (High-Yield Takeaways)
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {activeChapter.keyTakeaways.map((takeaway, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950/80 border border-amber-500/20 hover:border-amber-500/40 rounded-2xl p-4 flex items-start gap-3 transition-colors"
                          >
                            <span className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                              {takeaway}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lecture Slides Outline */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                          <ListOrdered className="w-4 h-4" />
                        </div>
                        <h3 className="text-base font-black text-white">
                          โครงสร้างหัวข้อตามสไลด์บรรยาย (Lecture Slide Outline)
                        </h3>
                      </div>

                      <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 divide-y divide-slate-800/80">
                        {activeChapter.slideOutline.map((slideTopic, idx) => (
                          <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center gap-3">
                            <span className="text-[11px] font-mono text-cyan-400 font-bold w-12 shrink-0">
                              Part {idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm text-slate-300">
                              {slideTopic}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fast Navigation to Quiz */}
                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setModalTab('quiz')}
                        className="px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
                      >
                        <span>ไปทำแบบทดสอบประจำบท ({chapterQuestions.length} ข้อ)</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── TAB 2: FEATURED PATHOGENS & 3D ─── */}
                {modalTab === 'pathogens' && (
                  <div className="space-y-5">
                    <div className="text-xs text-slate-400 font-mono">
                      เชื้อไวรัสเป้าหมายสำคัญตามหลักสูตรสัตวแพทยศาสตร์ในบทนี้:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {activeChapter.featuredViruses.map((pathogen, idx) => {
                        const theme = getFamilyTheme(pathogen.family);
                        const matchedVirusInDb = viruses.find(v => 
                          (pathogen.virusId && v.virusID === pathogen.virusId) ||
                          v.virusName.toLowerCase().includes(pathogen.nameEn.toLowerCase()) ||
                          pathogen.nameEn.toLowerCase().includes(v.virusName.toLowerCase()) ||
                          (v.family && pathogen.family && v.family.toLowerCase() === pathogen.family.toLowerCase())
                        );

                        return (
                          <div
                            key={idx}
                            className="bg-slate-950/80 border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4.5 space-y-3 transition-colors flex flex-col justify-between"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${theme.badge}`}>
                                  {pathogen.family}
                                </span>
                                <span className="text-xs">
                                  {getHostEmoji(pathogen.host)}
                                </span>
                              </div>

                              <div>
                                <h4 className="text-sm sm:text-base font-black text-white">
                                  {pathogen.name}
                                </h4>
                                <div className="text-xs font-mono text-cyan-400">
                                  {pathogen.nameEn}
                                </div>
                              </div>

                              <div className="text-xs text-slate-300 space-y-1">
                                <div className="text-[11px] text-slate-400 font-mono">
                                  โฮสต์: <strong className="text-slate-200">{pathogen.host}</strong>
                                </div>
                                <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                                  <span className="text-amber-400 font-bold block mb-0.5">พยาธิสภาพ / อาการสำคัญ:</span>
                                  {pathogen.keyPathology}
                                </div>
                              </div>
                            </div>

                            {matchedVirusInDb && (
                              <Link
                                href={`/student/learn/detail?id=${matchedVirusInDb.virusID}`}
                                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-mono text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-800"
                              >
                                <Microscope className="w-3.5 h-3.5" />
                                <span>เปิดดูข้อมูลเชิงลึก & โมเดล 3D</span>
                                <ChevronRight className="w-3 h-3" />
                              </Link>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ─── TAB 3: CHAPTER MASTERY QUIZ ─── */}
                {modalTab === 'quiz' && (
                  <div className="space-y-6">
                    {/* Quiz Alert Banner */}
                    {quizSuccessAlert && (
                      <div className="bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4.5 flex items-center gap-3.5 text-emerald-300">
                        <Trophy className="w-8 h-8 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-black text-base text-white">ยอดเยี่ยมมาก! คุณผ่านเกณฑ์แล้ว</div>
                          <div className="text-xs mt-0.5">{quizSuccessAlert}</div>
                        </div>
                      </div>
                    )}

                    {/* Quiz Progress & Rules */}
                    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-mono text-slate-400">ความคืบหน้าการตอบ</div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          ตอบแล้ว {Object.keys(quizAnswers).length} / {chapterQuestions.length} ข้อ
                        </div>
                      </div>

                      {quizSubmitted ? (
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs font-mono text-slate-400 block">คะแนนที่ได้:</span>
                            <span className={`text-lg font-black font-mono ${
                              (quizScore / chapterQuestions.length) >= 0.7 ? 'text-emerald-400' : 'text-amber-400'
                            }`}>
                              {quizScore} / {chapterQuestions.length} ({Math.round((quizScore / chapterQuestions.length) * 100)}%)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRetakeQuiz}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                            <span>ทำใหม่อีกครั้ง</span>
                          </button>
                        </div>
                      ) : (
                        <div className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                          🎯 เกณฑ์ผ่าน: $\ge$ 70% (7/10 ข้อ) | รางวัล: +50 EXP
                        </div>
                      )}
                    </div>

                    {/* Questions List */}
                    <div className="space-y-6">
                      {chapterQuestions.map((qItem, qIdx) => {
                        const selectedChoice = quizAnswers[qItem.id];
                        const isCorrect = selectedChoice === qItem.answer;

                        return (
                          <div 
                            key={qItem.id}
                            className={`rounded-2xl border p-4 sm:p-5 space-y-4 transition-all ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'bg-emerald-950/20 border-emerald-500/40'
                                  : 'bg-red-950/20 border-red-500/40'
                                : 'bg-slate-950/60 border-slate-800'
                            }`}
                          >
                            {/* Question Header */}
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5">
                                <span className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 font-mono font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {qIdx + 1}
                                </span>
                                <div>
                                  <h4 className="text-sm sm:text-base font-bold text-white leading-relaxed">
                                    {qItem.q}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md">
                                      {qItem.virusType}
                                    </span>
                                    <span className="text-[10px] font-mono text-cyan-400">
                                      {qItem.virusName}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {quizSubmitted && (
                                <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 shrink-0 ${
                                  isCorrect 
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                }`}>
                                  {isCorrect ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>ถูกต้อง</span>
                                    </>
                                  ) : (
                                    <>
                                      <X className="w-3.5 h-3.5 text-red-400" />
                                      <span>ผิด</span>
                                    </>
                                  )}
                                </span>
                              )}
                            </div>

                            {/* Choices Radio Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                              {qItem.choices.map((choice, cIdx) => {
                                const isSelected = selectedChoice === choice;
                                const isTheRightAnswer = choice === qItem.answer;

                                let choiceStyle = 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300';
                                if (quizSubmitted) {
                                  if (isTheRightAnswer) {
                                    choiceStyle = 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold shadow-sm';
                                  } else if (isSelected && !isTheRightAnswer) {
                                    choiceStyle = 'bg-red-500/20 border-red-500/60 text-red-300 line-through';
                                  } else {
                                    choiceStyle = 'bg-slate-950/60 border-slate-800/60 text-slate-500 opacity-60';
                                  }
                                } else if (isSelected) {
                                  choiceStyle = 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-md shadow-cyan-500/10';
                                }

                                return (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    disabled={quizSubmitted}
                                    onClick={() => handleSelectQuizAnswer(qItem.id, choice)}
                                    className={`p-3 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center gap-2.5 ${choiceStyle}`}
                                  >
                                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center shrink-0 text-[10px] font-mono">
                                      {String.fromCharCode(65 + cIdx)}
                                    </span>
                                    <span className="leading-snug">{choice}</span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Explanation (Revealed when submitted) */}
                            {quizSubmitted && qItem.explanation && (
                              <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 text-xs space-y-1">
                                <div className="font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>เฉลย & คำอธิบายทางการสัตวแพทย์:</span>
                                </div>
                                <p className="text-slate-300 leading-relaxed font-sans">
                                  {qItem.explanation}
                                </p>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Submit Action Bar */}
                    {!quizSubmitted && (
                      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-xs text-slate-400 font-mono">
                          {Object.keys(quizAnswers).length < chapterQuestions.length ? (
                            <span className="text-amber-400">
                              ⚠️ ยังตอบไม่ครบทุกข้อ ({Object.keys(quizAnswers).length}/{chapterQuestions.length})
                            </span>
                          ) : (
                            <span className="text-emerald-400">
                              ✅ ตอบครบทุกข้อแล้ว พร้อมส่งตรวจ
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={handleSubmitQuiz}
                          disabled={isSubmittingToDb}
                          className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
                        >
                          <Trophy className="w-4 h-4" />
                          <span>{isSubmittingToDb ? 'กำลังบันทึกคะแนน...' : 'ตรวจคำตอบและประเมินผล'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
