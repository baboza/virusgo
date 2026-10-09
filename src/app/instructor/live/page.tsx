"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Gamepad2, Clock, Users, ArrowLeft, ShieldAlert, 
  Search, Filter, Trash2, Eye, Radio, Wifi, WifiOff, Zap, 
  Award, Trophy, ChevronRight, Play, CheckCircle2, Volume2, 
  VolumeX, RefreshCw, Copy, Check, Sparkles, ExternalLink,
  Flame, AlertTriangle, Layers, Swords, ShieldCheck, X
} from 'lucide-react';
import Link from 'next/link';
import { collection, onSnapshot, query, deleteDoc, doc, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { sfx } from '@/utils/sound';

interface LiveSession {
  id: string; // uid
  gameId: string;
  progress: string;
  updatedAt: any;
  user: {
    uid: string;
    fullname: string;
    email: string;
    photoURL?: string;
    level: number;
  };
}

interface BattleRoom {
  id: string;
  roomCode?: string;
  gameType?: string;
  status?: string;
  hostId?: string;
  hostName?: string;
  players?: any[];
  scores?: Record<string, number>;
  createdAt?: any;
}

export default function LiveTrackingDashboard() {
  const { appUser, loading: authLoading } = useAuth();
  
  // Real-time Data
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [rooms, setRooms] = useState<BattleRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'cadets' | 'rooms'>('cadets');
  
  // Controls & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'level_desc' | 'name_asc'>('newest');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Selected Cadet Modal
  const [inspectSession, setInspectSession] = useState<LiveSession | null>(null);

  // Ping tracking
  const [lastPingTime, setLastPingTime] = useState<number>(Date.now());
  const prevCountRef = useRef<number>(0);

  // 1. Subscribe to Live Sessions (Real-time WebSocket / onSnapshot)
  useEffect(() => {
    if (authLoading) return;
    if (!appUser || appUser.role !== 'instructor') return;

    const q = query(collection(db, 'live_sessions'));
    const unsubscribeSessions = onSnapshot(q, (snapshot) => {
      const data: LiveSession[] = [];
      snapshot.forEach(docSnap => {
        data.push({ id: docSnap.id, ...docSnap.data() } as LiveSession);
      });

      // Sound notification on new connection
      if (data.length > prevCountRef.current && prevCountRef.current > 0 && soundEnabled) {
        sfx.correct?.();
      }
      prevCountRef.current = data.length;

      // Sort by newest updated
      data.sort((a, b) => {
        const tA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const tB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return tB - tA;
      });

      setSessions(data);
      setLastPingTime(Date.now());
      setLoading(false);
    }, (err) => {
      console.error("Live sessions subscription error:", err);
      setLoading(false);
    });

    // 2. Subscribe to Multiplayer Battle Rooms
    const roomsQuery = query(collection(db, 'rooms'));
    const unsubscribeRooms = onSnapshot(roomsQuery, (snapshot) => {
      const roomList: BattleRoom[] = [];
      snapshot.forEach(docSnap => {
        roomList.push({ id: docSnap.id, ...docSnap.data() } as BattleRoom);
      });
      setRooms(roomList);
    }, (err) => {
      console.error("Battle rooms subscription error:", err);
    });

    return () => {
      unsubscribeSessions();
      unsubscribeRooms();
    };
  }, [appUser, authLoading, soundEnabled]);

  // Format Relative Thai Time
  const formatRelativeTime = (updatedAt: any) => {
    if (!updatedAt) return 'เพิ่งเชื่อมต่อ';
    const ms = updatedAt.toMillis ? updatedAt.toMillis() : updatedAt;
    const diffSec = Math.floor((Date.now() - ms) / 1000);
    if (diffSec < 5) return 'เมื่อสักครู่ (เรียลไทม์)';
    if (diffSec < 60) return `${diffSec} วินาทีที่แล้ว`;
    const mins = Math.floor(diffSec / 60);
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    return `${Math.floor(mins / 60)} ชม. ที่แล้ว`;
  };

  // Get Mode Badge Style
  const getGameBadge = (gameId: string) => {
    switch (gameId) {
      case 'classroom-battle':
        return { label: 'Classroom Battle', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' };
      case 'diagnosis-duel':
        return { label: 'Diagnosis Duel', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'farm-defense':
        return { label: 'Farm Defense', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'lab-detective':
        return { label: 'Lab Detective', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'identification':
        return { label: 'Virus Identification', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' };
      case 'matching':
        return { label: 'Virus Matching', color: 'bg-pink-500/10 text-pink-400 border-pink-500/30' };
      case 'outbreak':
        return { label: 'Outbreak Simulator', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'boss-battle':
      case 'virus-battle':
        return { label: 'Boss Battle', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      default:
        return { label: gameId || 'มินิเกม', color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  // Clear Stale Ghost Sessions (> 30 mins)
  const handleClearStaleSessions = async () => {
    if (!window.confirm("ยืนยันการล้างเซสชันค้างที่ไม่มีความเคลื่อนไหวเกิน 30 นาที?")) return;
    setIsCleaning(true);
    try {
      const now = Date.now();
      const thirtyMinutesAgo = now - 30 * 60 * 1000;
      let count = 0;

      for (const s of sessions) {
        const ms = s.updatedAt?.toMillis ? s.updatedAt.toMillis() : 0;
        if (ms < thirtyMinutesAgo) {
          await deleteDoc(doc(db, 'live_sessions', s.id));
          count++;
        }
      }
      alert(`ล้างเซสชันค้างสำเร็จเรียบร้อย (${count} รายการ)`);
    } catch (e: any) {
      console.error(e);
      alert("เกิดข้อผิดพลาดในการล้างเซสชัน: " + e.message);
    } finally {
      setIsCleaning(false);
    }
  };

  // Delete Individual Session
  const handleDeleteSession = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'live_sessions', uid));
      setSessions(prev => prev.filter(s => s.id !== uid));
      if (inspectSession?.id === uid) setInspectSession(null);
    } catch (e: any) {
      console.error("Delete session error:", e);
    }
  };

  // Delete Battle Room
  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm(`ยืนยันการลบ/ปิดห้องแข่งขัน ${roomId}?`)) return;
    try {
      await deleteDoc(doc(db, 'rooms', roomId));
      setRooms(prev => prev.filter(r => r.id !== roomId));
    } catch (e: any) {
      console.error("Delete room error:", e);
    }
  };

  // Copy Room PIN
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    let list = [...sessions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        (s.user?.fullname && s.user.fullname.toLowerCase().includes(q)) ||
        (s.user?.email && s.user.email.toLowerCase().includes(q)) ||
        (s.progress && s.progress.toLowerCase().includes(q)) ||
        (s.gameId && s.gameId.toLowerCase().includes(q))
      );
    }

    if (selectedGame !== 'all') {
      list = list.filter(s => s.gameId === selectedGame);
    }

    list.sort((a, b) => {
      if (sortBy === 'newest') {
        const tA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const tB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return tB - tA;
      }
      if (sortBy === 'level_desc') {
        return (b.user?.level || 1) - (a.user?.level || 1);
      }
      if (sortBy === 'name_asc') {
        return (a.user?.fullname || '').localeCompare(b.user?.fullname || '');
      }
      return 0;
    });

    return list;
  }, [sessions, searchQuery, selectedGame, sortBy]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const totalOnline = sessions.length;
    const modeCounts: Record<string, number> = {};
    let totalLevels = 0;

    sessions.forEach(s => {
      modeCounts[s.gameId] = (modeCounts[s.gameId] || 0) + 1;
      totalLevels += (s.user?.level || 1);
    });

    let topMode = '-';
    let topModeCount = 0;
    Object.entries(modeCounts).forEach(([mode, count]) => {
      if (count > topModeCount) {
        topModeCount = count;
        topMode = mode;
      }
    });

    const activeRoomsCount = rooms.filter(r => r.status !== 'finished').length;
    const avgLevel = totalOnline > 0 ? (totalLevels / totalOnline).toFixed(1) : '1.0';

    return { totalOnline, topMode, topModeCount, activeRoomsCount, avgLevel };
  }, [sessions, rooms]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
        <div className="text-slate-400 font-mono text-xs">Connecting to Mission Control...</div>
      </div>
    );
  }

  if (appUser?.role !== 'instructor') {
    return (
      <div className="p-8 text-center text-danger font-mono">
        Access Denied. เฉพาะอาจารย์ผู้สอนเท่านั้นที่สามารถเข้าถึงเรดาร์สดได้
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 px-2 md:px-0">
      {/* ─────────────────────────────────────────────────────────────
          1. RADAR HEADER & OPS CONTROLS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link href="/instructor" className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Radio className="w-8 h-8 text-cyan-400 animate-pulse" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                ศูนย์เรดาร์ติดตามการเล่นสด (Live Radar)
              </span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            ติดตามสถานะและคะแนนการเรียนรู้ของนิสิตแบบเรียลไทม์ พร้อมตรวจสอบห้องแข่งขันในชั้นเรียน
          </p>
        </div>

        {/* Global Status Pills & Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Live Ping Pulse Pill */}
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-2xl flex items-center gap-3 shadow-inner">
            <div className="relative flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="text-xs font-mono">
              <span className="text-white font-bold">{metrics.totalOnline}</span>
              <span className="text-slate-400 ml-1.5">นิสิตออนไลน์</span>
            </div>
          </div>

          {/* Sound Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`border-slate-800 text-xs px-3 ${soundEnabled ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500 bg-slate-950'}`}
            title={soundEnabled ? "เปิดเสียงเตือนเมื่อมีนิสิตเข้า" : "ปิดเสียงเตือน"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>

          {/* Clear Stale Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearStaleSessions}
            disabled={isCleaning}
            leftIcon={<Trash2 className={`w-3.5 h-3.5 text-slate-400 ${isCleaning ? 'animate-spin' : ''}`} />}
            className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
          >
            ล้างเซสชันค้าง
          </Button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. KPI METRICS (4 CARDS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Active Cadets */}
        <Card className="p-5 glass border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">นิสิตกำลังเล่น</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{metrics.totalOnline} <span className="text-sm font-normal text-slate-400">คน</span></div>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-mono">
            <Wifi className="w-3 h-3" /> สตรีมข้อมูลเรียลไทม์
          </p>
        </Card>

        {/* Metric 2: Trending Game Mode */}
        <Card className="p-5 glass border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">โหมดที่มีคนเล่นมากสุด</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-black text-white truncate capitalize">{metrics.topMode}</div>
          <p className="text-[11px] text-cyan-400 mt-1 font-mono">
            {metrics.topModeCount > 0 ? `${metrics.topModeCount} คน กำลังออนไลน์` : 'ไม่มีกิจกรรม'}
          </p>
        </Card>

        {/* Metric 3: Active Battle Rooms */}
        <Card className="p-5 glass border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">ห้องแข่งขันในชั้นเรียน</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Swords className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{metrics.activeRoomsCount} <span className="text-sm font-normal text-slate-400">ห้อง</span></div>
          <p className="text-[11px] text-purple-400 mt-1 font-mono">
            {rooms.length} ห้องในระบบทั้งหมด
          </p>
        </Card>

        {/* Metric 4: Average Level */}
        <Card className="p-5 glass border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">เลเวลเฉลี่ยผู้เล่น</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">Lv. {metrics.avgLevel}</div>
          <p className="text-[11px] text-amber-400 mt-1 font-mono">
            Cadet Experience Baseline
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TAB SWITCHER (CADETS vs BATTLE ROOMS) & FILTERS
      ───────────────────────────────────────────────────────────── */}
      <Card className="p-4 md:p-6 glass border-slate-800 space-y-4">
        {/* Top: View Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('cadets')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'cadets' 
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>นิสิตออนไลน์สด ({sessions.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'rooms' 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>ห้องแข่งขัน Battle ({rooms.length})</span>
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>อัปเดตคลื่นสัญญาณล่าสุด: {new Date(lastPingTime).toLocaleTimeString('th-TH')}</span>
          </div>
        </div>

        {/* Filters (Shown on Cadets Tab) */}
        {activeTab === 'cadets' && (
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search Box */}
            <div className="relative flex-1">
              <Input
                placeholder="ค้นหาชื่อนิสิต, อีเมล, รหัสห้อง หรือสถานะ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="bg-slate-950 border-slate-800 text-xs rounded-xl"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Game Mode */}
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">ทุกมินิเกม (All Modes)</option>
              <option value="classroom-battle">Classroom Battle</option>
              <option value="diagnosis-duel">Diagnosis Duel</option>
              <option value="farm-defense">Farm Defense</option>
              <option value="lab-detective">Lab Detective</option>
              <option value="identification">Virus Identification</option>
              <option value="matching">Virus Matching</option>
              <option value="outbreak">Outbreak Simulator</option>
              <option value="boss-battle">Boss Battle</option>
            </select>

            {/* Sort Options */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="newest">อัปเดตล่าสุด (Newest)</option>
              <option value="level_desc">เลเวลนิสิต (Level สูง → ต่ำ)</option>
              <option value="name_asc">ชื่อนิสิต (A → Z)</option>
            </select>
          </div>
        )}
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN VIEW CONTENT
      ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <div className="text-slate-400 font-mono text-xs">Connecting to Live WebSockets...</div>
        </div>
      ) : activeTab === 'cadets' ? (
        /* ──── TAB 1: LIVE CADETS ──── */
        filteredSessions.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">ยังไม่มีนิสิตกำลังเล่นเกมในเงื่อนไขนี้</h3>
            <p className="text-slate-400 text-xs max-w-sm">
              เมื่อนิสิตเริ่มเล่นเกมในระบบ ข้อมูลคะแนนและสถานะจะปรากฏบนเรดาร์นี้อัตโนมัติแบบ Real-time
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredSessions.map((session, index) => {
                const badge = getGameBadge(session.gameId);
                return (
                  <motion.div
                    key={session.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card 
                      onClick={() => setInspectSession(session)}
                      className="p-4 glass border-slate-800 bg-slate-900/80 hover:border-cyan-500/50 transition-all relative overflow-hidden group cursor-pointer flex flex-col justify-between h-full shadow-lg"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl group-hover:bg-cyan-500/10 transition-all pointer-events-none" />

                      <div className="space-y-3">
                        {/* Header: Cadet Avatar & Identity */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden relative">
                              {session.user?.photoURL ? (
                                <img src={session.user.photoURL} alt={session.user.fullname} className="w-full h-full object-cover" />
                              ) : (
                                <Users className="w-5 h-5 text-slate-400" />
                              )}
                              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="font-bold text-white text-sm truncate group-hover:text-cyan-300 transition-colors">
                                {session.user?.fullname || 'Cadet'}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono">
                                Lv. {session.user?.level || 1}
                              </p>
                            </div>
                          </div>

                          {/* Quick Inspect Button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setInspectSession(session); }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Mode Badge & Progress Box */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${badge.color}`}>
                              {badge.label}
                            </span>
                          </div>

                          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs font-mono text-slate-200">
                            <div className="flex items-start gap-2">
                              <Activity className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                              <p className="line-clamp-2 leading-relaxed">
                                {session.progress || 'กำลังเริ่มภารกิจ...'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Footer: Time & Quick Action */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {formatRelativeTime(session.updatedAt)}
                        </span>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                          className="hover:text-rose-400 transition-colors p-1"
                          title="ลบเซสชันนี้"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )
      ) : (
        /* ──── TAB 2: MULTIPLAYER BATTLE ROOMS ──── */
        rooms.length === 0 ? (
          <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-500">
              <Swords className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">ยังไม่มีห้องแข่งขันในชั้นเรียนที่เปิดอยู่</h3>
            <p className="text-slate-400 text-xs max-w-sm">
              เมื่ออาจารย์หรือนิสิตเปิดห้อง Classroom Battle หรือ Diagnosis Duel รหัส PIN และห้องจะปรากฏที่นี่
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((room) => {
              const code = room.roomCode || room.id;
              const isWaiting = room.status === 'waiting';
              const isPlaying = room.status === 'playing';
              const isFinished = room.status === 'finished';

              return (
                <Card key={room.id} className="p-5 glass border-slate-800 bg-slate-900/70 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                        โหมดเกม: {room.gameType || 'Multiplayer'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-white font-mono tracking-widest bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                          {code}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopyCode(code)}
                          className="h-8 w-8 text-slate-400 hover:text-white"
                          title="คัดลอก PIN"
                        >
                          {copiedCode === code ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
                      isWaiting 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                        : isPlaying 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {room.status || 'open'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs space-y-1.5 font-mono text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">โฮสต์ผู้สร้าง:</span>
                      <span className="font-bold text-white">{room.hostName || room.hostId || 'Anonymous'}</span>
                    </div>
                    {room.players && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">ผู้เล่นในห้อง:</span>
                        <span className="text-cyan-400 font-bold">{room.players.length} คน</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {room.id}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteRoom(room.id)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                      className="bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs"
                    >
                      ปิดห้องนี้
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. INTERACTIVE CADET INSPECT MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {inspectSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 overflow-hidden relative">
                    {inspectSession.user?.photoURL ? (
                      <img src={inspectSession.user.photoURL} alt="Cadet" className="w-full h-full object-cover" />
                    ) : (
                      <Users className="w-6 h-6 text-slate-400" />
                    )}
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {inspectSession.user?.fullname || 'Cadet'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {inspectSession.user?.email || '-'} • Level {inspectSession.user?.level || 1}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setInspectSession(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 text-xs">
                {/* Live Activity Box */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">มินิเกมที่กำลังเล่น</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold font-mono border ${getGameBadge(inspectSession.gameId).color}`}>
                      {getGameBadge(inspectSession.gameId).label}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 font-mono text-slate-200">
                    <span className="text-slate-400 block text-[10px] mb-1">สถานะสด (Telemetry Status):</span>
                    {inspectSession.progress || 'กำลังเริ่มภารกิจ...'}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 text-right">
                    อัปเดต: {formatRelativeTime(inspectSession.updatedAt)}
                  </div>
                </div>

                {/* User ID */}
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 font-mono text-slate-400 text-[11px] flex justify-between">
                  <span>Student UID:</span>
                  <span className="text-slate-200">{inspectSession.user?.uid || inspectSession.id}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteSession(inspectSession.id)}
                  leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-400" />}
                  className="bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs"
                >
                  ตัดการเชื่อมต่อ
                </Button>

                <div className="flex items-center gap-2">
                  <Link href={`/instructor/students?search=${inspectSession.user?.email || inspectSession.user?.fullname || ''}`}>
                    <Button
                      size="sm"
                      leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                    >
                      ดูโปรไฟล์นิสิต
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectSession(null)}
                    className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    ปิด
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
