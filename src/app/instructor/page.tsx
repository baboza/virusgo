"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Users, BookOpen, Activity, Plus, Trophy, Zap, Gamepad2, ArrowRight } from 'lucide-react';
import { GameModePerformanceChart } from '@/components/analytics/GameModePerformanceChart';
import { AccuracyDoughnutChart } from '@/components/analytics/AccuracyDoughnutChart';
import Link from 'next/link';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function InstructorDashboard() {
  const { appUser, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalViruses, setTotalViruses] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalSystemExp, setTotalSystemExp] = useState(0);
  
  const [topStudents, setTopStudents] = useState<any[]>([]);
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [chartData, setChartData] = useState([0, 0, 0, 0]);

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;
      if (!appUser || appUser.role !== 'instructor') return;

      try {
        // Fetch Students
        const usersRef = collection(db, 'users');
        const qStudents = query(usersRef, where("role", "==", "student"));
        const studentsSnap = await getDocs(qStudents);
        
        let studentsList: any[] = [];
        let sysExp = 0;

        // Analytics trackers
        let gameModeStats = {
          identification: { plays: 0, totalExp: 0 },
          boss: { plays: 0, totalExp: 0 },
          matching: { plays: 0, totalExp: 0 },
          outbreak: { plays: 0, totalExp: 0 }
        };
        let sessionCount = 0;

        // Fetch history for ALL students to get real comprehensive data
        const enrichedUsers = await Promise.all(studentsSnap.docs.map(async (doc) => {
          const data = doc.data();
          sysExp += data.exp || 0;
          
          let lastPlayed = data.createdAt;
          
          try {
            const histRef = collection(db, 'users', doc.id, 'history');
            const histSnap = await getDocs(histRef);
            
            histSnap.forEach(hDoc => {
              const hData = hDoc.data();
              sessionCount++;
              
              if (hData.playedAt) {
                const ts = new Date(hData.playedAt).getTime();
                if (ts > lastPlayed) lastPlayed = ts;
              }

              // Categorize for chart
              const gid = hData.gameId;
              const exp = hData.expEarned || 0;
              
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
          } catch(e) {}
          
          return {
            ...data,
            id: doc.id,
            lastPlayed
          } as any;
        }));

        setTotalStudents(enrichedUsers.length);
        setTotalSystemExp(sysExp);
        setTotalSessions(sessionCount);

        // Sort Top Students (Leaderboard snapshot)
        const sortedByExp = [...enrichedUsers].sort((a, b) => (b.exp || 0) - (a.exp || 0));
        setTopStudents(sortedByExp.slice(0, 5));

        // Sort Recent Activity (By Last Played)
        const sortedByRecent = [...enrichedUsers].sort((a, b) => b.lastPlayed - a.lastPlayed);
        setRecentStudents(sortedByRecent.slice(0, 4));

        // Calculate Averages for Chart [ID, Boss, Matching, Outbreak]
        const getAvg = (stat: any) => stat.plays > 0 ? Math.round(stat.totalExp / stat.plays) : 0;
        setChartData([
          getAvg(gameModeStats.identification),
          getAvg(gameModeStats.boss),
          getAvg(gameModeStats.matching),
          getAvg(gameModeStats.outbreak)
        ]);

        // Fetch Total Viruses
        const virusesRef = collection(db, 'viruses');
        const virusesSnap = await getDocs(virusesRef);
        setTotalViruses(virusesSnap.size);

      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [appUser, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="text-slate-400 font-mono tracking-widest animate-pulse uppercase">Syncing Real-time Data...</div>
      </div>
    );
  }

  if (!appUser) return null;

  const stats = [
    { label: 'นิสิตในระบบทั้งหมด', value: totalStudents, icon: Users, color: 'text-primary' },
    { label: 'จำนวนครั้งการเข้าเล่นเกม', value: totalSessions, icon: Gamepad2, color: 'text-secondary' },
    { label: 'EXP สะสมรวมทั้งระบบ', value: totalSystemExp.toLocaleString(), icon: Zap, color: 'text-accent' },
    { label: 'ข้อมูลไวรัสในคลัง', value: totalViruses, icon: BookOpen, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white text-glow">
            ศูนย์บัญชาการ (Overview Dashboard)
          </h1>
          <p className="text-slate-500 mt-2">ติดตามความคืบหน้าแบบ Real-time วิเคราะห์สถิติและการเรียนรู้ของนิสิตทั้งระบบ</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <Link href="/instructor/live">
            <Button variant="outline" leftIcon={<Activity className="w-4 h-4 text-accent animate-pulse" />} className="w-full sm:w-auto bg-slate-900 border-accent/50 text-slate-300 hover:border-accent hover:text-white transition-all">
              ดูหน้าจอ Live
            </Button>
          </Link>
          <Link href="/instructor/viruses">
            <Button variant="outline" leftIcon={<BookOpen className="w-4 h-4" />} className="w-full sm:w-auto bg-slate-900 border-slate-700 text-slate-300">
              จัดการคลังไวรัส
            </Button>
          </Link>
          <Link href="/instructor/games">
            <Button leftIcon={<Plus className="w-4 h-4" />} className="w-full sm:w-auto">
              จัดการเนื้อหาเกม
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className={`p-4 md:p-6 flex flex-col items-center justify-center text-center h-full glass-neon bg-slate-900/60 shadow-[0_0_15px_rgba(0,0,0,0.5)] border-t-2`} style={{ borderTopColor: 'currentColor', color: stat.color }}>
                <Icon className={`w-8 h-8 mb-3 drop-shadow-md`} />
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-wide">{stat.value}</h3>
                <p className="text-xs md:text-sm text-slate-400 font-medium mt-1">{stat.label}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Analytics Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Bar Chart: Game Mode Performance */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            EXP เฉลี่ยที่ได้รับต่อเกม (Game Mode Performance)
          </h2>
          <Card className="p-6 glass border-slate-700 bg-slate-900/40">
            {totalSessions > 0 ? (
              <GameModePerformanceChart chartData={chartData} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-slate-500 font-mono border border-dashed border-slate-700 rounded-xl">
                ยังไม่มีข้อมูลการเล่นเกมของนิสิต
              </div>
            )}
          </Card>
        </div>

        {/* Top 5 Leaderboard Snapshot */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              ผู้นำอันดับต้นๆ (Top Players)
            </h2>
            <Link href="/instructor/students" className="text-xs text-primary hover:text-white transition-colors">
              ดูทั้งหมด
            </Link>
          </div>
          <Card className="p-0 overflow-hidden border-slate-700 bg-slate-900/40 h-[calc(100%-2.5rem)]">
            <div className="divide-y divide-slate-800">
              {topStudents.length > 0 ? topStudents.map((user, i) => (
                <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 font-bold font-mono text-sm
                    ${i === 0 ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.3)]' : 
                      i === 1 ? 'bg-slate-400/20 text-slate-300 border-slate-400' : 
                      i === 2 ? 'bg-amber-700/20 text-amber-600 border-amber-700' : 
                      'bg-slate-800 text-slate-500 border-slate-700'}
                  `}>
                    #{i + 1}
                  </div>
                  <div className="flex-1 truncate">
                    <p className="text-sm font-bold text-slate-200 truncate">{user.fullname}</p>
                    <p className="text-xs font-medium text-slate-400">Level {user.level || 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-accent">{user.exp || 0}</p>
                    <p className="text-[10px] text-slate-500">EXP</p>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-slate-500 font-mono border-dashed border border-slate-700 m-4 rounded-xl">
                  ยังไม่มีข้อมูลผู้เล่น
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            นิสิตที่เข้าใช้งานล่าสุด (Recent Active)
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentStudents.length > 0 ? recentStudents.map((user) => (
            <Card key={user.id} className="p-4 glass border-slate-700 bg-slate-900/40 hover:border-primary/50 transition-colors flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border-2 border-primary/30 overflow-hidden">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.fullname} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-6 h-6 text-primary" />
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-200 truncate">{user.fullname}</p>
                <p className="text-xs font-mono text-slate-400 truncate">{user.email}</p>
                <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-widest">
                  ล่าสุด: {user.lastPlayed ? new Date(user.lastPlayed).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'ยังไม่เคยเข้าเล่น'}
                </p>
              </div>
            </Card>
          )) : (
            <div className="col-span-full p-8 text-center text-slate-500 font-mono border-dashed border border-slate-700 rounded-xl">
              ยังไม่มีนิสิตในระบบ
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
