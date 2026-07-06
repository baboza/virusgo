"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Gamepad2, Clock, Users, ArrowLeft, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface LiveSession {
  id: string; // uid
  gameId: string;
  progress: string;
  updatedAt: any;
  user: {
    uid: string;
    fullname: string;
    email: string;
    photoURL: string;
    level: number;
  };
}

export default function LiveTrackingDashboard() {
  const { appUser, loading: authLoading } = useAuth();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!appUser || appUser.role !== 'instructor') return;

    const q = query(collection(db, 'live_sessions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: LiveSession[] = [];
      snapshot.forEach(doc => {
        data.push({ id: doc.id, ...doc.data() } as LiveSession);
      });
      // Sort by newest updated
      data.sort((a, b) => (b.updatedAt?.toMillis() || 0) - (a.updatedAt?.toMillis() || 0));
      setSessions(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [appUser, authLoading]);

  if (authLoading) return <div className="p-8 text-center text-white">Loading...</div>;
  if (appUser?.role !== 'instructor') return <div className="p-8 text-center text-danger">Access Denied</div>;

  return (
    <div className="space-y-6 pb-20 px-2 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/instructor" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2 text-glow">
              <Activity className="w-8 h-8 text-accent animate-pulse" /> Live Tracking
            </h1>
          </div>
          <p className="text-slate-500">ติดตามสถานะการเล่นเกมของนิสิตแบบเรียลไทม์ ข้อมูลจะอัปเดตอัตโนมัติเมื่อนิสิตมีความเคลื่อนไหว</p>
        </div>
        
        <div className="bg-slate-900/60 border border-slate-700 px-6 py-3 rounded-2xl flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-accent animate-ping" />
          <div className="font-bold text-white text-lg">{sessions.length} <span className="text-slate-400 font-normal text-sm">นิสิตออนไลน์</span></div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-slate-500 flex-col gap-4">
          <div className="w-12 h-12 border-4 border-t-accent border-slate-800 rounded-full animate-spin" />
          <p className="font-mono animate-pulse uppercase">Connecting to Live Servers...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {sessions.map((session, i) => (
              <motion.div
                key={session.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-4 glass-neon bg-slate-900/80 border-accent/30 hover:border-accent transition-all relative overflow-hidden group">
                  <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent/10 rounded-full blur-xl group-hover:bg-accent/20 transition-all" />
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 overflow-hidden relative">
                      {session.user.photoURL ? (
                        <img src={session.user.photoURL} alt={session.user.fullname} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-slate-400" />
                      )}
                      <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-accent border-2 border-slate-900" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="font-bold text-slate-200 truncate">{session.user.fullname}</p>
                      <p className="text-xs text-slate-500 font-mono">Level {session.user.level || 1}</p>
                    </div>
                  </div>

                  <div className="space-y-3 bg-black/40 rounded-xl p-3 border border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-primary uppercase tracking-widest">{session.gameId}</span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Activity className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {session.progress || 'กำลังเตรียมตัว...'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-[10px] text-slate-600 text-right font-mono flex items-center justify-end gap-1">
                    <Clock className="w-3 h-3" /> 
                    อัปเดตล่าสุด: {session.updatedAt ? new Date(session.updatedAt.toMillis()).toLocaleTimeString('th-TH') : '...'}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {sessions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center h-64 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/20">
              <ShieldAlert className="w-12 h-12 text-slate-700 mb-4" />
              <p className="text-slate-500 font-mono text-lg">ยังไม่มีนิสิตกำลังเล่นเกมในขณะนี้</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
