"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ShieldAlert, Zap, User as UserIcon, Users as UsersIcon, Globe } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';

export default function Leaderboard() {
  const { appUser } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'solo' | 'team'>('global');

  const TEAM_GAMES = ['virus-battle', 'classroom-battle', 'diagnosis-duel', 'farm-defense', 'tournament'];

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Fetch history for each user to calculate solo and team exp
        const enrichedUsers = await Promise.all(users.map(async (u: any) => {
          let soloExp = 0;
          let teamExp = 0;
          try {
            const histRef = collection(db, 'users', u.id, 'history');
            const histSnap = await getDocs(histRef);
            histSnap.forEach(hDoc => {
              const data = hDoc.data();
              if (data.expEarned) {
                if (TEAM_GAMES.includes(data.gameId)) {
                  teamExp += data.expEarned;
                } else {
                  soloExp += data.expEarned;
                }
              }
            });
          } catch(e) { console.error(e); }
          
          return {
            ...u,
            globalExp: u.exp || 0,
            soloExp,
            teamExp
          };
        }));
        
        setLeaders(enrichedUsers);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  const getRankTitle = (exp: number) => {
    if (exp < 500) return { title: 'Rookie', color: 'text-slate-400', icon: '🔰' };
    if (exp < 1500) return { title: 'Virus Hunter', color: 'text-blue-400', icon: '⚔️' };
    if (exp < 3000) return { title: 'Lab Expert', color: 'text-purple-400', icon: '🔬' };
    if (exp < 5000) return { title: 'Bio-Detective', color: 'text-emerald-400', icon: '🕵️' };
    return { title: 'Virology Master', color: 'text-yellow-400', icon: '👑' };
  };

  const getSortedLeaders = () => {
    let sorted = [...leaders];
    if (activeTab === 'global') sorted.sort((a, b) => b.globalExp - a.globalExp);
    else if (activeTab === 'solo') sorted.sort((a, b) => b.soloExp - a.soloExp);
    else if (activeTab === 'team') sorted.sort((a, b) => b.teamExp - a.teamExp);
    return sorted.slice(0, 20); // Top 20
  };

  const currentLeaders = getSortedLeaders();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -50 },
    show: { opacity: 1, x: 0, transition: { type: "spring" } }
  };

  return (
    <div className="space-y-8 pb-24 pt-4 px-2 max-w-4xl mx-auto">
      <div className="text-center relative mb-8">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/20 blur-[60px] -z-10" />
        <Trophy className="w-16 h-16 text-accent mx-auto mb-4 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
        <h1 className="text-4xl font-black text-white tracking-widest text-glow-accent uppercase mb-2">
          Global Rankings
        </h1>
        <p className="text-accent font-mono text-sm uppercase tracking-widest">
          Hall of Fame
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-8">
        <div className="bg-slate-900/50 p-1 rounded-2xl border border-slate-700/50 inline-flex">
          {[
            { id: 'global', label: 'Global', icon: Globe },
            { id: 'solo', label: 'Solo Mode', icon: UserIcon },
            { id: 'team', label: 'Team Mode', icon: UsersIcon }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-accent text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.4)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {currentLeaders.map((leader, index) => {
              const isCurrentUser = appUser?.uid === leader.uid;
              const displayExp = activeTab === 'global' ? leader.globalExp : activeTab === 'solo' ? leader.soloExp : leader.teamExp;
              const rankInfo = getRankTitle(leader.globalExp); // Rank is always calculated from global EXP
              
              // Rank styling
              let rankStyle = "text-slate-400";
              let CardBg = "glass border-slate-800";
              if (index === 0) {
                rankStyle = "text-yellow-400 text-glow-accent";
                CardBg = "glass-neon border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]";
              } else if (index === 1) {
                rankStyle = "text-slate-300";
                CardBg = "glass border-slate-400/50";
              } else if (index === 2) {
                rankStyle = "text-amber-600";
                CardBg = "glass border-amber-700/50";
              }

              if (isCurrentUser) {
                CardBg += " ring-2 ring-primary bg-primary/10";
              }

              return (
                <motion.div variants={item} key={leader.id}>
                  <Card className={`p-4 md:p-6 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] ${CardBg}`}>
                    <div className="flex items-center gap-4 md:gap-6">
                      <div className={`text-2xl md:text-4xl font-black w-10 text-center ${rankStyle} font-mono italic`}>
                        #{index + 1}
                      </div>
                      
                      <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                        {leader.photoURL ? (
                          <img src={leader.photoURL} alt={leader.fullname} className="w-full h-full object-cover" />
                        ) : (
                          <ShieldAlert className={`w-6 h-6 md:w-8 md:h-8 ${index === 0 ? 'text-yellow-400' : 'text-slate-500'}`} />
                        )}
                      </div>

                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-white tracking-wide flex items-center gap-2">
                          {leader.fullname}
                          {isCurrentUser && (
                            <span className="text-[10px] bg-primary text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                              คุณ
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1">
                          <p className="text-xs md:text-sm text-slate-400 font-mono">
                            Level {leader.level || 1}
                          </p>
                          <span className="hidden md:inline text-slate-600">•</span>
                          <p className={`text-xs md:text-sm font-bold flex items-center gap-1 ${rankInfo.color}`}>
                            {rankInfo.icon} {rankInfo.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 md:gap-8">
                      {leader.pet && (
                        <div className="flex flex-col items-center justify-center bg-purple-900/20 px-2 py-1 md:px-3 md:py-1.5 rounded-xl border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                          <SVGVirus 
                            type={familyToVirusType(leader.pet.family)} 
                            className={`w-6 h-6 md:w-8 md:h-8 text-purple-400 ${leader.pet.stage === 1 ? 'opacity-80 scale-75 blur-[1px]' : ''}`} 
                            glowColor="rgba(168,85,247,0.5)" 
                          />
                          <span className="text-[7px] md:text-[9px] text-purple-300 font-bold mt-0.5 uppercase tracking-widest truncate max-w-[60px] md:max-w-[80px]">
                            {leader.pet.virusName}
                          </span>
                        </div>
                      )}

                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-accent font-black text-xl md:text-2xl text-glow-accent justify-end">
                          {displayExp} <Zap className="w-5 h-5 hidden md:block" />
                        </div>
                        <p className="text-[10px] md:text-xs text-slate-500 font-mono tracking-widest uppercase mt-1">
                          EXP ({activeTab})
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}

            {currentLeaders.length === 0 && (
              <div className="text-center text-slate-500 py-12 font-mono bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                ยังไม่มีข้อมูลการจัดอันดับ
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
