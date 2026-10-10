"use client";

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, AlertCircle, Shield, MoreVertical, RefreshCcw, 
  Trash2, X, Gamepad2, Clock, Calendar, Target, Activity, Zap, 
  Download, Filter, ArrowUpDown, ChevronRight, Award, Heart, 
  Sparkles, Edit3, CheckCircle2, ChevronDown, BookOpen, Swords, Rocket
} from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User as AppUser } from '@/types';
import { getDailyEmpireInfo, DAILY_EMPIRE_ATTACK_LIMIT, getTodayDateString, getDailyScoutDroneInfo, DAILY_SCOUT_DRONE_LIMIT } from '@/lib/dailyExpCap';
import Link from 'next/link';

function StudentProgressContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const { appUser, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [levelFilter, setLevelFilter] = useState<'all' | 'novice' | 'advanced' | 'master'>('all');
  const [sortBy, setSortBy] = useState<'exp_desc' | 'exp_asc' | 'quota_asc' | 'quota_desc' | 'name' | 'recent'>('exp_desc');
  
  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<AppUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'pet' | 'manage'>('profile');

  // Edit Score/Level state
  const [editLevel, setEditLevel] = useState<number>(1);
  const [editExp, setEditExp] = useState<number>(0);
  const [editSuccessMsg, setEditSuccessMsg] = useState('');

  // Fetch History when student selected
  useEffect(() => {
    if (!selectedStudent) {
      setStudentHistory([]);
      setEditSuccessMsg('');
      return;
    }

    setEditLevel(selectedStudent.level || 1);
    setEditExp(selectedStudent.exp || 0);

    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const histRef = collection(db, 'users', selectedStudent.uid, 'history');
        const histSnap = await getDocs(histRef);
        const h: any[] = [];
        histSnap.forEach(d => h.push(d.data()));
        h.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
        setStudentHistory(h);
      } catch (e) {
        console.error("Error fetching history:", e);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedStudent]);

  const fetchStudents = async () => {
    if (authLoading) return;
    if (!appUser || appUser.role !== 'instructor') return;

    setRefreshing(true);
    try {
      const usersRef = collection(db, 'users');
      const qStudents = query(usersRef, where("role", "==", "student"));
      const studentsSnap = await getDocs(qStudents);
      
      let studentsList: AppUser[] = [];
      studentsSnap.forEach((d) => {
        studentsList.push({
          ...d.data(),
          uid: d.id
        } as AppUser);
      });

      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [appUser, authLoading]);

  // Handle Level & EXP update
  const handleUpdateStudentStats = async () => {
    if (!selectedStudent) return;
    setIsProcessing(true);
    setEditSuccessMsg('');
    try {
      const userRef = doc(db, 'users', selectedStudent.uid);
      await updateDoc(userRef, {
        level: Number(editLevel),
        exp: Number(editExp),
        score: Number(editExp),
      });

      setEditSuccessMsg('บันทึกการปรับคะแนนและเลเวลสำเร็จ!');
      
      // Update local state
      setSelectedStudent(prev => prev ? { ...prev, level: Number(editLevel), exp: Number(editExp), score: Number(editExp) } : null);
      setStudents(prev => prev.map(s => s.uid === selectedStudent.uid ? { ...s, level: Number(editLevel), exp: Number(editExp), score: Number(editExp) } : s));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetExp = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`ยืนยันการรีเซ็ต EXP ของ ${selectedStudent.fullname} กลับเป็น 0 หรือไม่?`)) return;
    
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', selectedStudent.uid);
      await updateDoc(userRef, {
        exp: 0,
        level: 1,
        score: 0
      });
      alert('รีเซ็ตคะแนนและเลเวลสำเร็จ!');
      setEditLevel(1);
      setEditExp(0);
      setSelectedStudent(prev => prev ? { ...prev, level: 1, exp: 0, score: 0 } : null);
      fetchStudents();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetEmpireQuota = async (studentUid: string) => {
    if (!studentUid) return;
    const target = students.find(s => s.uid === studentUid);
    const targetName = target?.fullname || 'นิสิตคนนี้';
    if (!window.confirm(`ยืนยันการรีเซ็ตโควตาการบุก Empire ของ ${targetName} กลับเป็น ${DAILY_EMPIRE_ATTACK_LIMIT}/${DAILY_EMPIRE_ATTACK_LIMIT} หรือไม่?`)) return;

    setIsProcessing(true);
    try {
      const todayDate = getTodayDateString();
      const userRef = doc(db, 'users', studentUid);
      await updateDoc(userRef, {
        dailyEmpireBattles: {
          date: todayDate,
          count: 0
        }
      });
      alert(`✅ รีเซ็ตโควตาการบุกของ ${targetName} สำเร็จ! โควตากลับเป็น ${DAILY_EMPIRE_ATTACK_LIMIT}/${DAILY_EMPIRE_ATTACK_LIMIT} แล้ว`);

      // Update local states
      setSelectedStudent(prev => prev ? {
        ...prev,
        dailyEmpireBattles: { date: todayDate, count: 0 }
      } : null);
      setStudents(prev => prev.map(s => s.uid === studentUid ? {
        ...s,
        dailyEmpireBattles: { date: todayDate, count: 0 }
      } : s));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetScoutDroneQuota = async (studentUid: string) => {
    if (!studentUid) return;
    const target = students.find(s => s.uid === studentUid);
    const targetName = target?.fullname || 'นิสิตคนนี้';
    if (!window.confirm(`ยืนยันการรีเซ็ตโควตาโดรนสอดแนมของ ${targetName} กลับเป็น ${DAILY_SCOUT_DRONE_LIMIT}/${DAILY_SCOUT_DRONE_LIMIT} หรือไม่?`)) return;

    setIsProcessing(true);
    try {
      const todayDate = getTodayDateString();
      const userRef = doc(db, 'users', studentUid);
      await updateDoc(userRef, {
        dailyScoutDrones: {
          date: todayDate,
          count: 0
        }
      });
      alert(`✅ รีเซ็ตโควตาโดรนสอดแนมของ ${targetName} สำเร็จ! โควตากลับเป็น ${DAILY_SCOUT_DRONE_LIMIT}/${DAILY_SCOUT_DRONE_LIMIT} แล้ว`);

      // Update local states
      setSelectedStudent(prev => prev ? {
        ...prev,
        dailyScoutDrones: { date: todayDate, count: 0 }
      } : null);
      setStudents(prev => prev.map(s => s.uid === studentUid ? {
        ...s,
        dailyScoutDrones: { date: todayDate, count: 0 }
      } : s));
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`⚠️ คำเตือน: ยืนยันการลบ ${selectedStudent.fullname} ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', selectedStudent.uid);
      await deleteDoc(userRef);
      alert('ลบนิสิตออกจากระบบสำเร็จ!');
      setSelectedStudent(null);
      fetchStudents();
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (students.length === 0) {
      alert("ไม่มีข้อมูลนิสิตให้ส่งออก");
      return;
    }

    const headers = ["ลำดับ", "ชื่อ-นามสกุล", "อีเมล", "เลเวล", "EXP สะสม", "คะแนนรวม", "โควตาบุก Empire คงเหลือวันนี้", "วันที่เข้าร่วม"];
    const rows = filteredAndSortedStudents.map((s, idx) => {
      const emp = getDailyEmpireInfo(s);
      return [
        idx + 1,
        `"${s.fullname.replace(/"/g, '""')}"`,
        `"${s.email}"`,
        s.level || 1,
        s.exp || 0,
        s.score || 0,
        `"${emp.remainingAttacks}/${emp.limit} (บุกไป ${emp.attacksToday} ครั้ง)"`,
        s.createdAt ? `"${new Date(s.createdAt).toLocaleDateString('th-TH')}"` : '"N/A"'
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `students_progress_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and Sort Students
  const filteredAndSortedStudents = useMemo(() => {
    let result = [...students];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        (s.fullname && s.fullname.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.studentID && s.studentID.toLowerCase().includes(q))
      );
    }

    // Level Filter
    if (levelFilter === 'novice') {
      result = result.filter(s => (s.level || 1) <= 3);
    } else if (levelFilter === 'advanced') {
      result = result.filter(s => (s.level || 1) >= 4 && (s.level || 1) <= 7);
    } else if (levelFilter === 'master') {
      result = result.filter(s => (s.level || 1) >= 8);
    }

    // Sort
    if (sortBy === 'exp_desc') {
      result.sort((a, b) => {
        const aTotal = ((a.level || 1) * 1000) + (a.exp || 0);
        const bTotal = ((b.level || 1) * 1000) + (b.exp || 0);
        return bTotal - aTotal;
      });
    } else if (sortBy === 'exp_asc') {
      result.sort((a, b) => (a.exp || 0) - (b.exp || 0));
    } else if (sortBy === 'quota_asc') {
      result.sort((a, b) => {
        const aRemaining = getDailyEmpireInfo(a).remainingAttacks;
        const bRemaining = getDailyEmpireInfo(b).remainingAttacks;
        return aRemaining - bRemaining;
      });
    } else if (sortBy === 'quota_desc') {
      result.sort((a, b) => {
        const aRemaining = getDailyEmpireInfo(a).remainingAttacks;
        const bRemaining = getDailyEmpireInfo(b).remainingAttacks;
        return bRemaining - aRemaining;
      });
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.fullname.localeCompare(b.fullname, 'th'));
    } else if (sortBy === 'recent') {
      result.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    }

    return result;
  }, [students, searchQuery, levelFilter, sortBy]);

  // Compute stats
  const totalExp = useMemo(() => students.reduce((sum, s) => sum + (s.exp || 0), 0), [students]);
  const avgLevel = useMemo(() => students.length > 0 ? (students.reduce((sum, s) => sum + (s.level || 1), 0) / students.length).toFixed(1) : '1.0', [students]);
  const highLevelCount = useMemo(() => students.filter(s => (s.level || 1) >= 5).length, [students]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="text-slate-400 font-mono tracking-widest animate-pulse uppercase text-xs">
          Querying Cadet Database...
        </div>
      </div>
    );
  }

  if (!appUser) return null;

  return (
    <div className="space-y-8 relative pb-16">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & KPI CARDS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-cyan-300">
                ข้อมูลรายชื่อนิสิต (Cadet Directory)
              </span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-primary/10 text-primary border border-primary/30">
              {students.length} นิสิต
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            ติดตามพัฒนาการ ตรวจสอบประวัติการเข้าเล่นรายบุคคล และจัดการเลเวล/EXP ของนิสิต
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchStudents}
            leftIcon={<RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />}
            className="bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
          >
            รีเฟรช
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4 text-emerald-400" />}
            className="bg-slate-900 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 hover:text-white"
          >
            ส่งออก CSV
          </Button>

          <Link href="/instructor/recalc">
            <Button
              variant="outline"
              leftIcon={<Zap className="w-4 h-4 text-amber-400" />}
              className="bg-slate-900 border-amber-500/40 text-amber-300 hover:bg-amber-500/10 hover:text-white"
            >
              ปรับคะแนนใหม่
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">นิสิตในระบบ</p>
            <p className="text-2xl font-black text-white">{students.length} <span className="text-xs font-normal text-slate-500">คน</span></p>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">เลเวลเฉลี่ย</p>
            <p className="text-2xl font-black text-white">LV.{avgLevel}</p>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">EXP รวมทั้งหมด</p>
            <p className="text-2xl font-black text-amber-400">{totalExp.toLocaleString()}</p>
          </div>
        </Card>

        <Card className="p-4 bg-slate-900/60 border-slate-800 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-mono uppercase text-slate-400">ระดับสูง (LV.5+)</p>
            <p className="text-2xl font-black text-purple-300">{highLevelCount} <span className="text-xs font-normal text-slate-500">คน</span></p>
          </div>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. SEARCH, FILTER & SORT TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-800">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors"
            placeholder="ค้นหาชื่อนิสิต, รหัสนิสิต, หรืออีเมล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Level Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <Filter className="w-3.5 h-3.5 text-primary" />
            ระดับ:
          </span>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          >
            <option value="all">ทุกระดับเลเวล</option>
            <option value="novice">ระดับเริ่มต้น (LV.1 - 3)</option>
            <option value="advanced">ระดับก้าวหน้า (LV.4 - 7)</option>
            <option value="master">ระดับเชี่ยวชาญ (LV.8+)</option>
          </select>
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400" />
            เรียง:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950/80 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-primary"
          >
            <option value="exp_desc">EXP สูงไปต่ำ</option>
            <option value="exp_asc">EXP ต่ำไปสูง</option>
            <option value="quota_asc">โควตาบุกคงเหลือ (น้อยไปมาก)</option>
            <option value="quota_desc">โควตาบุกคงเหลือ (มากไปน้อย)</option>
            <option value="name">ชื่อ ก-ฮ (A-Z)</option>
            <option value="recent">วันที่สมัครล่าสุด</option>
          </select>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN STUDENTS TABLE
      ───────────────────────────────────────────────────────────── */}
      <Card className="p-0 overflow-hidden bg-slate-900/60 border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-mono uppercase text-[11px]">
                <th className="px-5 py-3.5">นิสิต (Profile)</th>
                <th className="px-5 py-3.5 text-center">ระดับ (Level)</th>
                <th className="px-5 py-3.5">ความคืบหน้า EXP</th>
                <th className="px-5 py-3.5">สัตว์เลี้ยงคู่หู (Pet)</th>
                <th className="px-5 py-3.5 text-center">โควตาบุก Empire</th>
                <th className="px-5 py-3.5">วันที่เข้าร่วม</th>
                <th className="px-5 py-3.5 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAndSortedStudents.length > 0 ? (
                filteredAndSortedStudents.map((student, idx) => {
                  const level = student.level || 1;
                  const exp = student.exp || 0;
                  const nextLevelExp = level * 100;
                  const progressPercentage = Math.min(100, Math.max(0, (exp / nextLevelExp) * 100));
                  
                  const empireInfo = getDailyEmpireInfo(student);
                  const scoutInfo = getDailyScoutDroneInfo(student);
                  
                  return (
                    <motion.tr 
                      key={student.uid}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedStudent(student)}
                    >
                      {/* Name & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-primary/50 transition-colors overflow-hidden">
                            {student.photoURL ? (
                              <img src={student.photoURL} alt={student.fullname} className="w-full h-full object-cover" />
                            ) : (
                              <Shield className="w-4 h-4 text-primary/70" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-primary transition-colors flex items-center gap-2">
                              {student.fullname}
                              {student.studentID && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                  {student.studentID}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{student.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Level Badge */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex items-center justify-center bg-primary/10 border border-primary/30 text-primary font-mono font-bold px-2.5 py-1 rounded-lg text-xs">
                          LV.{level}
                        </div>
                      </td>

                      {/* EXP Bar */}
                      <td className="px-5 py-4 min-w-[180px]">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="text-slate-400">EXP สะสม</span>
                            <span className="text-amber-400 font-bold">{exp.toLocaleString()} / {nextLevelExp}</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-800 overflow-hidden relative">
                            <motion.div 
                              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-500 to-cyan-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercentage}%` }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Pet Status */}
                      <td className="px-5 py-4">
                        {student.pet ? (
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            <span className="font-medium text-slate-200">
                              {student.pet.nickname || student.pet.virusName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              (Stage {student.pet.stage || 1})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">- ยังไม่มี -</span>
                        )}
                      </td>

                      {/* Empire Attack Quota & Scout Drone Quota */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1.5">
                          {/* Attack Quota */}
                          <span 
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border shadow-sm ${
                              empireInfo.remainingAttacks === 0
                                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                : empireInfo.remainingAttacks <= 3
                                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
                            }`}
                            title={`โควตาบุก: เหลือ ${empireInfo.remainingAttacks}/${empireInfo.limit} ครั้ง`}
                          >
                            <Swords className="w-3 h-3 shrink-0" />
                            <span>บุก {empireInfo.remainingAttacks}/{empireInfo.limit}</span>
                          </span>

                          {/* Scout Drone Quota */}
                          <span 
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-mono font-bold border shadow-sm ${
                              scoutInfo.remainingScouts === 0
                                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                : 'bg-blue-950/60 border-blue-500/40 text-blue-300'
                            }`}
                            title={`โควตาโดรน: เหลือ ${scoutInfo.remainingScouts}/${scoutInfo.limit} ครั้ง`}
                          >
                            <Rocket className="w-3 h-3 shrink-0 text-cyan-400" />
                            <span>โดรน {scoutInfo.remainingScouts}/{scoutInfo.limit}</span>
                          </span>
                        </div>
                      </td>

                      {/* Join Date */}
                      <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString('th-TH') : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <Button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                          }}
                          variant="outline" 
                          size="sm" 
                          className="text-[11px] h-7 px-2.5 border-slate-700 hover:border-primary text-slate-300"
                        >
                          จัดการ
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 font-mono">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <AlertCircle className="w-7 h-7 text-slate-600" />
                      <span>{searchQuery ? "ไม่พบรายชื่อนิสิตที่ตรงกับเงื่อนไข" : "ยังไม่มีนิสิตในระบบ"}</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          4. STUDENT PROFILE & INSPECTION MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => { setSelectedStudent(null); setModalTab('profile'); }}
                className="absolute top-5 right-5 text-slate-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700 shrink-0">
                  {selectedStudent.photoURL ? (
                    <img src={selectedStudent.photoURL} alt={selectedStudent.fullname} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-8 h-8 text-primary/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-white">{selectedStudent.fullname}</h3>
                    {selectedStudent.studentID && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-xs">
                        ID: {selectedStudent.studentID}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">{selectedStudent.email}</p>
                  <div className="flex items-center gap-2 sm:gap-3 mt-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-lg bg-primary/20 text-primary font-mono text-xs font-bold border border-primary/30">
                      Level {selectedStudent.level || 1}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                      {selectedStudent.exp || 0} EXP
                    </span>
                    {(() => {
                      const emp = getDailyEmpireInfo(selectedStudent);
                      return (
                        <span 
                          className={`px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold border flex items-center gap-1.5 shadow-sm ${
                            emp.remainingAttacks === 0
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : emp.remainingAttacks <= 3
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                          }`}
                          title={`วันที่ ${emp.date}: โควตาเหลือ ${emp.remainingAttacks}/${emp.limit} ครั้ง (บุกไปแล้ว ${emp.attacksToday} ครั้ง)`}
                        >
                          <Swords className="w-3.5 h-3.5" />
                          โควตาบุกวันนี้: {emp.remainingAttacks}/{emp.limit}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-800 mb-6">
                <button 
                  onClick={() => setModalTab('profile')}
                  className={`px-4 py-2 font-bold text-xs tracking-wide border-b-2 transition-colors ${
                    modalTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  ประวัติการเล่น (History)
                </button>
                <button 
                  onClick={() => setModalTab('pet')}
                  className={`px-4 py-2 font-bold text-xs tracking-wide border-b-2 transition-colors ${
                    modalTab === 'pet' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  สัตว์เลี้ยง & คู่หู (Virus Pet)
                </button>
                <button 
                  onClick={() => setModalTab('manage')}
                  className={`px-4 py-2 font-bold text-xs tracking-wide border-b-2 transition-colors ${
                    modalTab === 'manage' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  ปรับคะแนน & บัญชี (Management)
                </button>
              </div>
              
              {/* Tab 1: History */}
              {modalTab === 'profile' && (
                <div className="space-y-6">
                  {historyLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                            <Gamepad2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-[11px] uppercase tracking-wider font-mono">เล่นเกมทั้งหมด</p>
                            <p className="text-xl font-black text-white">{studentHistory.length} <span className="text-xs font-normal text-slate-500">ครั้ง</span></p>
                          </div>
                        </div>
                        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-[11px] uppercase tracking-wider font-mono">EXP ที่ได้รับจากเกม</p>
                            <p className="text-xl font-black text-emerald-400">{studentHistory.reduce((sum, h) => sum + (h.expEarned || 0), 0).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>

                      {/* History List */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-widest font-mono">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          ประวัติการเล่นล่าสุด ({studentHistory.length} รายการ)
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {studentHistory.length > 0 ? (
                            studentHistory.map((h, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:bg-slate-800/40 transition-colors text-xs">
                                <div>
                                  <p className="text-white font-bold">{h.gameName || h.gameId}</p>
                                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(h.playedAt).toLocaleString('th-TH')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-amber-400 font-mono font-black">+{h.expEarned || 0} EXP</p>
                                  <p className="text-[10px] text-slate-500 font-mono">คะแนน: {h.score || 0}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-slate-500 border border-dashed border-slate-800 rounded-xl text-xs font-mono">
                              ยังไม่มีประวัติการเล่นเกมของนิสิตคนนี้
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tab 2: Virus Pet */}
              {modalTab === 'pet' && (
                <div className="space-y-4">
                  {selectedStudent.pet ? (
                    <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary text-2xl">
                          🦠
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white">
                            {selectedStudent.pet.nickname || selectedStudent.pet.virusName}
                          </h4>
                          <p className="text-xs text-slate-400 font-mono">
                            สายพันธุ์: {selectedStudent.pet.family} (Stage {selectedStudent.pet.stage || 1})
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 font-mono text-[10px]">ความหิว (Hunger)</p>
                          <p className="text-lg font-bold text-amber-400 mt-1">{selectedStudent.pet.hunger || 0}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 font-mono text-[10px]">ความสุข (Happiness)</p>
                          <p className="text-lg font-bold text-pink-400 mt-1">{selectedStudent.pet.happiness || 0}%</p>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <p className="text-slate-400 font-mono text-[10px]">พลังงาน (Energy)</p>
                          <p className="text-lg font-bold text-cyan-400 mt-1">{selectedStudent.pet.energy || 0}%</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl text-xs font-mono">
                      นิสิตยังไม่ได้ฟักไข่หรือสร้างสัตว์เลี้ยงคู่หู (No Active Pet)
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Management */}
              {modalTab === 'manage' && (
                <div className="space-y-6">
                  {/* Edit Level & EXP */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Edit3 className="w-4 h-4 text-primary" />
                      ปรับแก้เลเวลและคะแนนสะสม (Level & EXP Override)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-slate-400 font-mono block mb-1.5">เลเวล (Level)</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={editLevel}
                          onChange={(e) => setEditLevel(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 font-mono block mb-1.5">EXP สะสม (Total EXP)</label>
                        <input
                          type="number"
                          min={0}
                          value={editExp}
                          onChange={(e) => setEditExp(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    {editSuccessMsg && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{editSuccessMsg}</span>
                      </div>
                    )}

                    <Button
                      onClick={handleUpdateStudentStats}
                      disabled={isProcessing}
                      className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold"
                    >
                      {isProcessing ? 'กำลังบันทึก...' : 'บันทึกการปรับปรุงข้อมูล'}
                    </Button>
                  </div>

                  {/* Empire Attack Quota Management */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-2">
                        <Swords className="w-4 h-4 text-cyan-400" />
                        โควตาการบุกรุก Empire ประจำวัน
                      </h4>
                      {(() => {
                        const emp = getDailyEmpireInfo(selectedStudent);
                        return (
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${
                            emp.remainingAttacks === 0
                              ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                              : 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                          }`}>
                            คงเหลือ {emp.remainingAttacks} / {emp.limit} ครั้ง ({emp.date})
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      นิสิตได้รับสิทธิ์บุกรุกดินแดน/บอสสูงสุด {DAILY_EMPIRE_ATTACK_LIMIT} ครั้งต่อวัน (รีเซ็ตทุกเที่ยงคืน) หากนิสิตติดปัญหาโควตาหมดหรือต้องการรอบทดสอบพิเศษ อาจารย์สามารถกดรีเซ็ตโควตากลับเป็น {DAILY_EMPIRE_ATTACK_LIMIT}/{DAILY_EMPIRE_ATTACK_LIMIT} ได้ทันที
                    </p>
                    <Button 
                      onClick={() => handleResetEmpireQuota(selectedStudent.uid)}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs flex items-center gap-2"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      รีเซ็ตโควตาบุก Empire เป็น {DAILY_EMPIRE_ATTACK_LIMIT}/10
                    </Button>
                  </div>

                  {/* Scout Drone Quota Management */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-cyan-400" />
                        โควตาโดรนสอดแนมหมอกสงคราม (Bio-Radar)
                      </h4>
                      {(() => {
                        const sct = getDailyScoutDroneInfo(selectedStudent);
                        return (
                          <span className={`px-2.5 py-0.5 rounded-lg text-xs font-mono font-bold border ${
                            sct.remainingScouts === 0
                              ? 'bg-rose-950/60 text-rose-300 border-rose-500/40'
                              : 'bg-blue-950/60 text-blue-300 border-blue-500/40'
                          }`}>
                            คงเหลือ {sct.remainingScouts} / {sct.limit} ครั้ง ({sct.date})
                          </span>
                        );
                      })()}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      นิสิตได้รับแบตเตอรี่โดรนสอดแนมสูงสุด {DAILY_SCOUT_DRONE_LIMIT} ครั้งต่อวัน (เปิดพื้นที่ 5×5 ถาวรและรับ +25 EXP) หากนิสิตใช้โควตาหมด อาจารย์สามารถกดรีเซ็ตกลับเป็น {DAILY_SCOUT_DRONE_LIMIT}/{DAILY_SCOUT_DRONE_LIMIT} ได้ทันที
                    </p>
                    <Button 
                      onClick={() => handleResetScoutDroneQuota(selectedStudent.uid)}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-blue-500/40 text-blue-300 hover:bg-blue-500/10 text-xs flex items-center gap-2"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      รีเซ็ตโควตาโดรนสอดแนมเป็น {DAILY_SCOUT_DRONE_LIMIT}/5
                    </Button>
                  </div>

                  {/* Reset Actions */}
                  <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                      รีเซ็ตข้อมูลคะแนน
                    </h4>
                    <p className="text-xs text-slate-400">
                      รีเซ็ตเลเวลกลับเป็น 1 และคะแนน EXP เป็น 0 สำหรับการเริ่มรอบเรียนรู้ใหม่
                    </p>
                    <Button 
                      onClick={handleResetExp}
                      disabled={isProcessing}
                      variant="outline"
                      className="border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs"
                    >
                      <RefreshCcw className="w-3.5 h-3.5 mr-2" />
                      รีเซ็ต Level และ EXP เป็น 0
                    </Button>
                  </div>

                  {/* Danger Zone */}
                  <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-3">
                    <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono">
                      ลบบัญชีนิสิตออกจากระบบ (Danger Zone)
                    </h4>
                    <p className="text-xs text-slate-400">
                      ลบข้อมูลนิสิตออกจากฐานข้อมูลอย่างถาวร ข้อมูลไม่สามารถกู้คืนได้
                    </p>
                    <Button 
                      onClick={handleDeleteUser}
                      disabled={isProcessing}
                      className="bg-rose-600 hover:bg-rose-500 text-white text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" />
                      ลบนิสิตออกจากระบบ
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function StudentProgressPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="text-slate-400 font-mono text-xs">Loading...</div>
      </div>
    }>
      <StudentProgressContent />
    </Suspense>
  );
}
