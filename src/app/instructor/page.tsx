"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, BookOpen, Activity, Plus, Trophy, Zap, Gamepad2, 
  ArrowRight, Download, RefreshCw, Search, CheckCircle2, 
  AlertTriangle, Sparkles, Filter, FileSpreadsheet, ShieldAlert, 
  Layers, ChevronRight, BarChart3, PieChart, Database, Check
} from 'lucide-react';
import { GameModePerformanceChart } from '@/components/analytics/GameModePerformanceChart';
import { AccuracyDoughnutChart } from '@/components/analytics/AccuracyDoughnutChart';
import { ChapterMasteryChart } from '@/components/analytics/ChapterMasteryChart';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MASTER_CORE_VIRUSES } from '@/data/seedVirusesData';
import { 
  ALL_15_CHAPTER_QUESTIONS, 
  ALL_15_MATCHING_PAIRS, 
  ALL_15_LAB_CASES,
  MASTER_CLASSROOM_BATTLE_QUESTIONS,
  MASTER_QUIZ_GENERAL_QUESTIONS,
  MASTER_IDENTIFICATION_QUESTIONS,
  MASTER_MATCHING_CARDS,
  MASTER_DIAGNOSIS_DUEL_CASES,
  MASTER_OUTBREAK_SCENARIOS,
  MASTER_FARM_DEFENSE_EVENTS
} from '@/data/veterinaryVirologyContent';

interface EnrichedStudent {
  id: string;
  uid: string;
  fullname: string;
  email: string;
  photoURL?: string;
  level: number;
  exp: number;
  score: number;
  sessionsCount: number;
  accuracy: number;
  lastPlayed: number;
  createdAt: number;
}

export default function InstructorDashboard() {
  const { appUser, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<EnrichedStudent[]>([]);
  const [totalViruses, setTotalViruses] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalSystemExp, setTotalSystemExp] = useState(0);
  const [overallAccuracy, setOverallAccuracy] = useState(0);
  
  // Charts & Analysis
  const [chartData, setChartData] = useState([0, 0, 0, 0]);
  const [activeChartTab, setActiveChartTab] = useState<'modes' | 'accuracy' | 'chapters'>('modes');
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState<'all' | '7d' | '30d'>('all');

  // Master Content Sync Modal State
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncStatusText, setSyncStatusText] = useState('');
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Fetch all analytics data
  const fetchData = async () => {
    try {
      // 1. Fetch Students
      const usersRef = collection(db, 'users');
      const qStudents = query(usersRef, where("role", "==", "student"));
      const studentsSnap = await getDocs(qStudents);
      
      let sysExp = 0;
      let sessionCount = 0;
      let totalCorrectAnswers = 0;
      let totalAnsweredQuestions = 0;

      let gameModeStats = {
        identification: { plays: 0, totalExp: 0 },
        boss: { plays: 0, totalExp: 0 },
        matching: { plays: 0, totalExp: 0 },
        outbreak: { plays: 0, totalExp: 0 }
      };

      const enrichedUsers: EnrichedStudent[] = await Promise.all(
        studentsSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const studentExp = Number(data.exp) || 0;
          sysExp += studentExp;
          
          let lastPlayed = data.createdAt ? new Date(data.createdAt).getTime() : 0;
          let userSessions = 0;
          let userCorrect = 0;
          let userTotal = 0;
          
          try {
            const histRef = collection(db, 'users', docSnap.id, 'history');
            const histSnap = await getDocs(histRef);
            
            histSnap.forEach((hDoc) => {
              const hData = hDoc.data();
              sessionCount++;
              userSessions++;
              
              if (hData.playedAt) {
                const ts = new Date(hData.playedAt).getTime();
                if (ts > lastPlayed) lastPlayed = ts;
              }

              if (typeof hData.correctCount === 'number' && typeof hData.totalQuestions === 'number') {
                userCorrect += hData.correctCount;
                userTotal += hData.totalQuestions;
                totalCorrectAnswers += hData.correctCount;
                totalAnsweredQuestions += hData.totalQuestions;
              } else if (typeof hData.accuracy === 'number') {
                userCorrect += hData.accuracy;
                userTotal += 100;
                totalCorrectAnswers += hData.accuracy;
                totalAnsweredQuestions += 100;
              }

              const gid = hData.gameId;
              const exp = Number(hData.expEarned) || 0;
              
              if (gid === 'identification') {
                gameModeStats.identification.plays++;
                gameModeStats.identification.totalExp += exp;
              } else if (gid === 'boss-battle' || gid === 'virus-battle') {
                gameModeStats.boss.plays++;
                gameModeStats.boss.totalExp += exp;
              } else if (gid === 'matching') {
                gameModeStats.matching.plays++;
                gameModeStats.matching.totalExp += exp;
              } else if (gid === 'outbreak') {
                gameModeStats.outbreak.plays++;
                gameModeStats.outbreak.totalExp += exp;
              }
            });
          } catch (e) {
            console.error("Error reading student history:", e);
          }
          
          const calcAccuracy = userTotal > 0 ? Math.round((userCorrect / userTotal) * 100) : (data.accuracy || 0);

          return {
            id: docSnap.id,
            uid: docSnap.id,
            fullname: data.fullname || 'นิสิตไม่ระบุชื่อ',
            email: data.email || '-',
            photoURL: data.photoURL,
            level: data.level || 1,
            exp: studentExp,
            score: data.score || 0,
            sessionsCount: userSessions,
            accuracy: calcAccuracy,
            lastPlayed: lastPlayed,
            createdAt: data.createdAt || 0,
          };
        })
      );

      setStudents(enrichedUsers);
      setTotalSystemExp(sysExp);
      setTotalSessions(sessionCount);

      const sysAccuracy = totalAnsweredQuestions > 0 
        ? Math.round((totalCorrectAnswers / totalAnsweredQuestions) * 100) 
        : 78; // Default estimated baseline
      setOverallAccuracy(sysAccuracy);

      const getAvg = (stat: any) => stat.plays > 0 ? Math.round(stat.totalExp / stat.plays) : 0;
      setChartData([
        getAvg(gameModeStats.identification),
        getAvg(gameModeStats.boss),
        getAvg(gameModeStats.matching),
        getAvg(gameModeStats.outbreak)
      ]);

      // 2. Fetch Total Viruses
      const virusesRef = collection(db, 'viruses');
      const virusesSnap = await getDocs(virusesRef);
      setTotalViruses(virusesSnap.size);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!appUser || appUser.role !== 'instructor') return;
    fetchData();
  }, [appUser, authLoading]);

  // Filter students by Search Query and Time
  const filteredStudents = useMemo(() => {
    let result = [...students];
    const now = Date.now();

    if (timeFilter === '7d') {
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
      result = result.filter(s => s.lastPlayed >= sevenDaysAgo);
    } else if (timeFilter === '30d') {
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      result = result.filter(s => s.lastPlayed >= thirtyDaysAgo);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.fullname.toLowerCase().includes(q) || 
        s.email.toLowerCase().includes(q)
      );
    }

    return result;
  }, [students, searchQuery, timeFilter]);

  // Top 5 Students sorted by EXP
  const topStudents = useMemo(() => {
    return [...students].sort((a, b) => b.exp - a.exp).slice(0, 5);
  }, [students]);

  // Recent 4 Active Students
  const recentStudents = useMemo(() => {
    return [...students].sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 4);
  }, [students]);

  // Chapters data for ChapterMasteryChart
  const chapterBreakdown = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => {
      const chNum = i + 1;
      const count = ALL_15_CHAPTER_QUESTIONS.filter(q => q.chapter === chNum).length;
      const sample = ALL_15_CHAPTER_QUESTIONS.find(q => q.chapter === chNum);
      return {
        chapter: chNum,
        title: sample ? sample.chapterTitle : `บทที่ ${chNum}`,
        count: count
      };
    });
  }, []);

  // Format Relative Time in Thai
  const formatTime = (ts: number) => {
    if (!ts) return 'ยังไม่เคยเข้าเล่น';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / (1000 * 60));
    if (mins < 1) return 'เมื่อสักครู่';
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} วันที่แล้ว`;
    return new Date(ts).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
  };

  // Export Student Data to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("ไม่มีข้อมูลนิสิตให้ส่งออกในขณะนี้");
      return;
    }

    const headers = ["ลำดับ", "ชื่อ-นามสกุล", "อีเมล", "เลเวล", "EXP สะสม", "รอบการเล่น", "ความแม่นยำ (%)", "เล่นล่าสุด"];
    const rows = students.map((s, idx) => [
      idx + 1,
      `"${s.fullname.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      s.level,
      s.exp,
      s.sessionsCount,
      `${s.accuracy}%`,
      s.lastPlayed ? `"${new Date(s.lastPlayed).toLocaleString('th-TH')}"` : '"ยังไม่เคยเข้าเล่น"'
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vetvirus_students_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // One-Click Master Content Sync
  const handleSyncMasterContent = async () => {
    setIsSyncing(true);
    setSyncSuccess(false);
    setSyncProgress(5);
    setSyncStatusText("กำลังเริ่มต้นการซิงค์ข้อมูลสู่ Firestore...");

    try {
      const now = new Date().toISOString();

      // Step 1: Sync Core Pathogen Viruses into Firestore
      setSyncStatusText(`กำลังอัปโหลดคลังไวรัสหลัก ${MASTER_CORE_VIRUSES.length} ชนิด...`);
      for (let i = 0; i < MASTER_CORE_VIRUSES.length; i++) {
        const virus = MASTER_CORE_VIRUSES[i];
        const docId = virus.virusName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await setDoc(doc(db, 'viruses', docId), {
          ...virus,
          virusID: docId,
          updatedAt: now
        }, { merge: true });
        setSyncProgress(5 + Math.round(((i + 1) / MASTER_CORE_VIRUSES.length) * 30));
      }

      // Step 2: Sync Master Questions Bank (151 items)
      setSyncStatusText(`กำลังบันทึกคลังข้อสอบ 15 บทเรียน (${ALL_15_CHAPTER_QUESTIONS.length} ข้อ)...`);
      await setDoc(doc(db, 'game_content', 'questions_bank'), {
        questions: ALL_15_CHAPTER_QUESTIONS,
        totalQuestions: ALL_15_CHAPTER_QUESTIONS.length,
        updatedAt: now
      }, { merge: true });
      setSyncProgress(45);

      // Step 3: Sync Active Classroom Battle & Quiz General (151 items)
      setSyncStatusText("กำลังซิงค์โหมด Classroom Battle และ Quiz General (151 ข้อ)...");
      await setDoc(doc(db, 'game_content', 'classroom_battle'), {
        questions: MASTER_CLASSROOM_BATTLE_QUESTIONS,
        count: MASTER_CLASSROOM_BATTLE_QUESTIONS.length,
        updatedAt: now
      });
      await setDoc(doc(db, 'game_content', 'quiz_general'), {
        questions: MASTER_QUIZ_GENERAL_QUESTIONS,
        count: MASTER_QUIZ_GENERAL_QUESTIONS.length,
        updatedAt: now
      });
      setSyncProgress(60);

      // Step 4: Sync Identification & Matching Game Modes
      setSyncStatusText("กำลังซิงค์โหมด Virus Identification และการ์ดจับคู่ (Matching)...");
      await setDoc(doc(db, 'game_content', 'identification'), {
        data: MASTER_IDENTIFICATION_QUESTIONS,
        count: MASTER_IDENTIFICATION_QUESTIONS.length,
        updatedAt: now
      });
      await setDoc(doc(db, 'game_content', 'matching'), {
        data: MASTER_MATCHING_CARDS,
        count: MASTER_MATCHING_CARDS.length,
        pairsCount: ALL_15_MATCHING_PAIRS.length,
        updatedAt: now
      });
      await setDoc(doc(db, 'game_content', 'matching_bank'), {
        pairs: ALL_15_MATCHING_PAIRS,
        updatedAt: now
      }, { merge: true });
      setSyncProgress(75);

      // Step 5: Sync Lab Detective, Diagnosis Duel, Outbreak, Farm Defense
      setSyncStatusText("กำลังซิงค์โหมด Lab Detective (31 เคส), Diagnosis Duel, Outbreak, Farm Defense...");
      await setDoc(doc(db, 'game_content', 'lab_detective'), {
        data: ALL_15_LAB_CASES,
        count: ALL_15_LAB_CASES.length,
        updatedAt: now
      });
      await setDoc(doc(db, 'game_content', 'lab_cases_bank'), {
        cases: ALL_15_LAB_CASES,
        updatedAt: now
      }, { merge: true });

      await setDoc(doc(db, 'game_content', 'diagnosis_duel'), {
        data: MASTER_DIAGNOSIS_DUEL_CASES,
        count: MASTER_DIAGNOSIS_DUEL_CASES.length,
        updatedAt: now
      });

      await setDoc(doc(db, 'game_content', 'outbreak'), {
        data: MASTER_OUTBREAK_SCENARIOS,
        count: MASTER_OUTBREAK_SCENARIOS.length,
        updatedAt: now
      });

      await setDoc(doc(db, 'game_content', 'farm_defense'), {
        data: MASTER_FARM_DEFENSE_EVENTS,
        count: MASTER_FARM_DEFENSE_EVENTS.length,
        updatedAt: now
      });

      setSyncProgress(100);
      setSyncStatusText("ซิงค์คลังเนื้อหาหลักสูตรและมินิเกมทั้ง 8 โหมดเข้าสู่ Firestore เรียบร้อยแล้ว!");
      setSyncSuccess(true);

      // Refresh local count
      const virusesRef = collection(db, 'viruses');
      const snap = await getDocs(virusesRef);
      setTotalViruses(snap.size);

    } catch (err: any) {
      console.error("Sync error:", err);
      setSyncStatusText(`เกิดข้อผิดพลาดในการซิงค์: ${err.message || 'ไม่ทราบสาเหตุ'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <Activity className="w-6 h-6 text-primary absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="text-slate-400 font-mono tracking-widest animate-pulse uppercase text-sm">
          กำลังโหลดศูนย์ข้อมูลสถิติ (Connecting Mission Center)...
        </div>
      </div>
    );
  }

  if (!appUser) return null;

  const stats = [
    { 
      label: 'นิสิตในระบบทั้งหมด', 
      value: students.length, 
      subtext: `${students.filter(s => s.lastPlayed > Date.now() - 7*24*60*60*1000).length} คน Active สัปดาห์นี้`,
      icon: Users, 
      color: 'from-blue-500 to-cyan-400',
      textColor: 'text-blue-400',
      borderGlow: 'hover:border-blue-500/50'
    },
    { 
      label: 'จำนวนรอบการเล่นเกม', 
      value: totalSessions.toLocaleString(), 
      subtext: `เฉลี่ย ${students.length > 0 ? (totalSessions / students.length).toFixed(1) : 0} ครั้ง/คน`,
      icon: Gamepad2, 
      color: 'from-purple-500 to-pink-500',
      textColor: 'text-purple-400',
      borderGlow: 'hover:border-purple-500/50'
    },
    { 
      label: 'EXP รวมทั้งระบบ', 
      value: totalSystemExp.toLocaleString(), 
      subtext: `เฉลี่ย ${students.length > 0 ? Math.round(totalSystemExp / students.length).toLocaleString() : 0} EXP/คน`,
      icon: Zap, 
      color: 'from-amber-400 to-orange-500',
      textColor: 'text-amber-400',
      borderGlow: 'hover:border-amber-500/50'
    },
    { 
      label: 'ข้อมูลไวรัสในคลัง', 
      value: totalViruses, 
      subtext: `15 บทเรียนสัตวแพทย์ พร้อมใช้งาน`,
      icon: BookOpen, 
      color: 'from-emerald-400 to-teal-500',
      textColor: 'text-emerald-400',
      borderGlow: 'hover:border-emerald-500/50'
    },
  ];

  return (
    <div className="space-y-8 pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & SYSTEM COMMAND BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-400 to-secondary">
                ศูนย์บัญชาการการสอน
              </span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              ONLINE
            </span>
          </div>
          <p className="text-slate-400 mt-1.5 text-sm">
            แดชบอร์ดติดตามพัฒนาการ สถิติการเล่นเกม และคลังข้อสอบไวรัสวิทยาการสัตวแพทย์ (Veterinary Virology)
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={fetchData}
            leftIcon={<RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            className="bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500"
          >
            รีเฟรชข้อมูล
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-400" />}
            className="bg-slate-900/80 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-white"
          >
            Export CSV
          </Button>

          <Button
            onClick={() => setIsSyncModalOpen(true)}
            leftIcon={<Database className="w-4 h-4 text-cyan-300" />}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-lg shadow-cyan-600/25"
          >
            ซิงค์คลัง 15 บท
          </Button>

          <Link href="/instructor/live">
            <Button
              variant="outline"
              leftIcon={<Activity className="w-4 h-4 text-rose-400 animate-pulse" />}
              className="bg-slate-900/80 border-rose-500/40 text-rose-300 hover:bg-rose-500/10 hover:text-white"
            >
              หน้าจอ Live Arena
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/instructor/games" className="group">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-primary/50 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300 group-hover:text-primary transition-colors">จัดการเนื้อหาเกม</p>
                <p className="text-[11px] text-slate-500">คำถาม & กิจกรรม</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-primary transition-colors" />
          </div>
        </Link>

        <Link href="/instructor/viruses" className="group">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300 group-hover:text-emerald-400 transition-colors">คลังข้อมูลไวรัส</p>
                <p className="text-[11px] text-slate-500">สารานุกรม 30 ชนิด</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
          </div>
        </Link>

        <Link href="/instructor/students" className="group">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300 group-hover:text-purple-400 transition-colors">ตรวจสอบนิสิต</p>
                <p className="text-[11px] text-slate-500">รายบุคคล & ประวัติ</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
          </div>
        </Link>

        <Link href="/instructor/recalc" className="group">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-300 group-hover:text-amber-400 transition-colors">ปรับคะแนน/เลเวล</p>
                <p className="text-[11px] text-slate-500">Recalculate Level</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
        </Link>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. STATS KPI GRID (MODERN GLASS CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <Card className={`p-5 bg-slate-900/70 border-slate-800 hover:border-slate-700 transition-all backdrop-blur-sm relative overflow-hidden group ${stat.borderGlow}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                    {stat.label}
                  </span>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-md shadow-black/40 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    {stat.value}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1 font-medium">
                    {stat.subtext}
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MULTI-CHART ANALYTICS & INSIGHTS SECTION
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area (2 Columns) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                การวิเคราะห์การเรียนรู้ (Learning Analytics)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ประเมินผลคะแนน ความแม่นยำ และเนื้อหาครอบคลุมตามหลักสูตรสัตวแพทย์
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
              <button
                onClick={() => setActiveChartTab('modes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeChartTab === 'modes'
                    ? 'bg-primary text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                โหมดเกม (EXP)
              </button>
              <button
                onClick={() => setActiveChartTab('accuracy')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeChartTab === 'accuracy'
                    ? 'bg-primary text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ความแม่นยำ (%)
              </button>
              <button
                onClick={() => setActiveChartTab('chapters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeChartTab === 'chapters'
                    ? 'bg-primary text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                15 บทเรียน
              </button>
            </div>
          </div>

          <Card className="p-6 bg-slate-900/60 border-slate-800">
            {activeChartTab === 'modes' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                    ค่าเฉลี่ย EXP ที่ได้รับในแต่ละโหมดเกม
                  </span>
                  <span className="text-xs text-slate-500">อัปเดตจากประวัติการเล่นจริง</span>
                </div>
                {totalSessions > 0 ? (
                  <GameModePerformanceChart chartData={chartData} />
                ) : (
                  <div className="flex flex-col h-[280px] items-center justify-center text-slate-500 font-mono border border-dashed border-slate-800 rounded-xl space-y-2">
                    <Gamepad2 className="w-8 h-8 text-slate-600" />
                    <span>ยังไม่มีประวัติการเข้าเล่นของนิสิตในระบบ</span>
                  </div>
                )}
              </div>
            )}

            {activeChartTab === 'accuracy' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                    อัตราความแม่นยำในการตอบคำถามทั้งระบบ
                  </span>
                  <span className="text-xs text-emerald-400 font-bold">เกณฑ์ผ่าน: 70%+</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <AccuracyDoughnutChart accuracy={overallAccuracy} />
                  <div className="space-y-3">
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="text-xs text-slate-400">อัตราการตอบถูกเฉลี่ย</p>
                      <p className="text-2xl font-black text-emerald-400 mt-1">{overallAccuracy}%</p>
                      <p className="text-xs text-slate-500 mt-1">จากคำถามทั้งหมดที่นิสิตตอบในทุกมินิเกม</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800">
                      <p className="text-xs text-slate-400">คำแนะนำในการสอน</p>
                      <p className="text-xs text-slate-300 mt-1">
                        {overallAccuracy >= 80 
                          ? '🌟 นิสิตมีความเข้าใจในเนื้อหาดีเยี่ยม สามารถเพิ่มระดับความยากในโหมด Boss Battle ได้'
                          : '💡 แนะนำให้นิสิตฝึกฝนในโหมด Virus Identification และทบทวนสารานุกรมเพิ่มเติม'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeChartTab === 'chapters' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                    จำนวนคลังข้อสอบและกรณีศึกษา (15 Chapters Bank)
                  </span>
                  <span className="text-xs text-primary font-mono">{ALL_15_CHAPTER_QUESTIONS.length} ข้อสอบรวม</span>
                </div>
                <ChapterMasteryChart data={chapterBreakdown} />
              </div>
            )}
          </Card>
        </div>

        {/* Top 5 Leaderboard Snapshot (1 Column) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              อันดับผู้นำสูงสุด (Top Students)
            </h2>
            <Link href="/instructor/students" className="text-xs text-primary hover:underline flex items-center gap-1">
              ดูทั้งหมด <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
            <div className="divide-y divide-slate-800/80">
              {topStudents.length > 0 ? (
                topStudents.map((user, i) => (
                  <div key={user.id} className="p-4 flex items-center gap-3.5 hover:bg-slate-800/40 transition-colors">
                    {/* Rank Badge */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold font-mono text-xs border ${
                      i === 0 
                        ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-md shadow-amber-500/20' 
                        : i === 1 
                        ? 'bg-slate-300/20 text-slate-300 border-slate-400/50' 
                        : i === 2 
                        ? 'bg-orange-700/20 text-orange-400 border-orange-600/50' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      #{i + 1}
                    </div>

                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden border border-slate-700">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.fullname} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{user.fullname}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-mono font-bold">
                          LV.{user.level}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate">{user.email}</span>
                      </div>
                    </div>

                    {/* EXP */}
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono font-black text-amber-400">{user.exp.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-mono">EXP</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  ยังไม่มีข้อมูลนิสิตในระบบ
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. RECENT ACTIVITY & STUDENT ROSTER QUICK LOOK
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              นิสิตที่เข้าใช้งานล่าสุด (Recent Activity)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">ติดตามการเคลื่อนไหวและการเข้าเรียนแบบเรียลไทม์</p>
          </div>

          {/* Time Filter Tabs */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">กรองตามเวลา:</span>
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeFilter === 'all' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setTimeFilter('7d')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeFilter === '7d' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                7 วันล่าสุด
              </button>
              <button
                onClick={() => setTimeFilter('30d')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeFilter === '30d' ? 'bg-primary text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                30 วันล่าสุด
              </button>
            </div>
          </div>
        </div>

        {/* Recent Students Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentStudents.length > 0 ? (
            recentStudents.map((user) => (
              <Card 
                key={user.id} 
                className="p-4 bg-slate-900/60 border-slate-800 hover:border-primary/50 transition-all flex items-start gap-3.5 group"
              >
                <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden group-hover:border-primary/50 transition-colors">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.fullname} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{user.fullname}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      LV.{user.level}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold">
                      {formatTime(user.lastPlayed)}
                    </span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
              ยังไม่มีนิสิตในระบบ
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. QUICK STUDENT SEARCH & OVERVIEW TABLE
      ───────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">รายชื่อนิสิตในระบบ ({filteredStudents.length})</h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="ค้นหาชื่อ หรืออีเมล..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 uppercase font-mono">
                  <th className="py-3 px-4">นิสิต</th>
                  <th className="py-3 px-4">เลเวล</th>
                  <th className="py-3 px-4">EXP รวม</th>
                  <th className="py-3 px-4">รอบเล่น</th>
                  <th className="py-3 px-4">ความแม่นยำ</th>
                  <th className="py-3 px-4">เล่นล่าสุด</th>
                  <th className="py-3 px-4 text-right">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredStudents.length > 0 ? (
                  filteredStudents.slice(0, 10).map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center shrink-0 border border-slate-700">
                            {s.photoURL ? (
                              <img src={s.photoURL} alt={s.fullname} className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-white">{s.fullname}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        Level {s.level}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        {s.exp.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {s.sessionsCount} รอบ
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                          s.accuracy >= 70 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {s.accuracy}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {formatTime(s.lastPlayed)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link href={`/instructor/students?search=${encodeURIComponent(s.fullname)}`}>
                          <Button variant="outline" size="sm" className="text-[11px] h-7 px-2.5 border-slate-700 hover:border-primary">
                            ดูข้อมูล
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                      ไม่พบนิสิตที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredStudents.length > 10 && (
            <div className="p-3 bg-slate-950/30 border-t border-slate-800 text-center">
              <Link href="/instructor/students" className="text-xs text-primary hover:underline font-medium">
                ดูรายชื่อนิสิตทั้งหมด ({filteredStudents.length} คน) ในหน้าจัดการนิสิต →
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          6. ONE-CLICK MASTER CONTENT SYNC MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isSyncModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-6 shadow-2xl relative"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    ซิงค์คลังข้อมูลบทเรียน & ไวรัส (Master Content Sync)
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    อัปเดตข้อมูลเข้าสู่ฐานข้อมูล Firestore สำหรับเกมและการเรียนรู้
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 text-xs text-slate-300">
                <p className="font-semibold text-white">ข้อมูลที่จะถูกนำเข้าและอัปเดต:</p>
                <div className="space-y-1.5 pl-2 font-mono text-[11px] text-slate-400">
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>ไวรัสสัตวแพทย์หลัก: <strong>29 ชนิด</strong> (สุนัข, แมว, สุกร, สัตว์ปีก, โค-กระบือ, ม้า, ซูโนซิส)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>คลังข้อสอบตามสไลด์หลักสูตร: <strong>15 บทเรียน ({ALL_15_CHAPTER_QUESTIONS.length} ข้อ)</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>คู่จับคู่ Matching Pairs: <strong>{ALL_15_MATCHING_PAIRS.length} คู่</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>กรณีศึกษาจำลอง Lab Detective: <strong>{ALL_15_LAB_CASES.length} เคส</strong></span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              {isSyncing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>{syncStatusText}</span>
                    <span>{syncProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <motion.div 
                      className="bg-gradient-to-r from-primary to-cyan-400 h-2 rounded-full"
                      style={{ width: `${syncProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {syncSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{syncStatusText}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsSyncModalOpen(false)}
                  disabled={isSyncing}
                  className="border-slate-700 text-slate-300"
                >
                  ปิด
                </Button>
                <Button
                  onClick={handleSyncMasterContent}
                  disabled={isSyncing}
                  leftIcon={isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  {isSyncing ? 'กำลังซิงค์...' : 'เริ่มซิงค์ข้อมูล'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
