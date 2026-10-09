"use client";

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  ShieldAlert, 
  Zap, 
  User as UserIcon, 
  Users as UsersIcon, 
  Globe, 
  Crown, 
  Medal, 
  Flame, 
  Sparkles, 
  Map, 
  ChevronRight,
  Shield,
  Activity,
  Award
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import Link from 'next/link';
import { Guild } from '@/types';
import { getEffectivePetStats } from '@/lib/petBalance';

export default function Leaderboard() {
  const { appUser } = useAuth();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'global' | 'solo' | 'team' | 'guild'>('global');

  const TEAM_GAMES = ['virus-battle', 'classroom-battle', 'diagnosis-duel', 'farm-defense', 'tournament', 'empire'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Students
        const q = query(collection(db, 'users'), where('role', '==', 'student'));
        const snapshot = await getDocs(q);
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // 2. Fetch History for Solo vs Team EXP breakdown
        const enrichedUsers = await Promise.all(users.map(async (u: any) => {
          let soloExp = 0;
          let teamExp = 0;
          try {
            const histRef = collection(db, 'users', u.id, 'history');
            const histSnap = await getDocs(histRef);
            histSnap.forEach(hDoc => {
              const data = hDoc.data();
              if (data.expEarned) {
                // Cap any old historical runaway EXP entry
                let earned = Number(data.expEarned || 0);
                if (earned > 250) earned = 150;

                if (TEAM_GAMES.includes(data.gameId)) {
                  teamExp += earned;
                } else {
                  soloExp += earned;
                }
              }
            });
          } catch(e) { 
            console.error("Error fetching history for user:", u.id, e); 
          }
          
          const validGlobalExp = Number(u.exp || 0);
          return {
            ...u,
            globalExp: validGlobalExp,
            soloExp: soloExp > 0 ? Math.min(soloExp, validGlobalExp) : Math.round(validGlobalExp * 0.7),
            teamExp: teamExp > 0 ? Math.min(teamExp, validGlobalExp) : Math.round(validGlobalExp * 0.3)
          };
        }));
        
        setLeaders(enrichedUsers);

        // 3. Fetch Guilds and Empire Tiles for Accurate Real-Time Sector Counts
        try {
          const [guildSnap, tilesSnap] = await Promise.all([
            getDocs(collection(db, 'guilds')),
            getDocs(collection(db, 'empire_tiles'))
          ]);

          // Build map of user -> guildId and member counts
          const userGuildMap: Record<string, string> = {};
          const guildMembersCount: Record<string, number> = {};
          users.forEach((u: any) => {
            const gId = u.guildId;
            if (gId) {
              userGuildMap[u.id] = gId;
              userGuildMap[u.uid] = gId;
              guildMembersCount[gId] = (guildMembersCount[gId] || 0) + 1;
            }
          });

          // Count tiles accurately for each guild from live empire_tiles
          const guildTilesCount: Record<string, number> = {};
          tilesSnap.forEach((tDoc) => {
            const t = tDoc.data();
            if (t.type === 'player') {
              const gId = t.guildId || (t.ownerUid ? userGuildMap[t.ownerUid] : undefined);
              if (gId) {
                guildTilesCount[gId] = (guildTilesCount[gId] || 0) + 1;
              }
            }
          });

          const gList: Guild[] = [];
          guildSnap.forEach((d) => {
            const rawGuild = d.data() as Guild;
            const realTiles = guildTilesCount[d.id] ?? (rawGuild.totalTiles || 0);
            const realMembers = guildMembersCount[d.id] ?? (rawGuild.membersCount || 1);
            
            // Sync with Firestore if outdated
            if (rawGuild.totalTiles !== realTiles || rawGuild.membersCount !== realMembers) {
              updateDoc(doc(db, 'guilds', d.id), {
                totalTiles: realTiles,
                membersCount: realMembers
              }).catch(() => {});
            }

            gList.push({
              ...rawGuild,
              id: d.id,
              totalTiles: realTiles,
              membersCount: realMembers
            });
          });

          // Sort guilds by totalTiles descending, then membersCount
          gList.sort((a, b) => (b.totalTiles || 0) - (a.totalTiles || 0) || (b.membersCount || 0) - (a.membersCount || 0));
          setGuilds(gList);
        } catch(ge) {
          console.error("Error fetching guilds and tiles:", ge);
        }

      } catch (error) {
        console.error("Error fetching leaderboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRankTitle = (exp: number) => {
    if (exp < 600) return { title: 'Rookie', subtitle: 'นิสิตฝึกหัด', color: 'text-slate-400', border: 'border-slate-500/40', bg: 'bg-slate-500/10', icon: '🔰' };
    if (exp < 2000) return { title: 'Virus Hunter', subtitle: 'นักล่าไวรัส', color: 'text-blue-400', border: 'border-blue-500/40', bg: 'bg-blue-500/10', icon: '⚔️' };
    if (exp < 5000) return { title: 'Lab Expert', subtitle: 'ผู้เชี่ยวชาญแล็บ', color: 'text-purple-400', border: 'border-purple-500/40', bg: 'bg-purple-500/10', icon: '🔬' };
    if (exp < 12000) return { title: 'Bio-Detective', subtitle: 'ยอดนักสืบชีวภาพ', color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-500/10', icon: '🕵️' };
    return { title: 'Virology Master', subtitle: 'ปรมาจารย์ไวรัส', color: 'text-yellow-400', border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', icon: '👑' };
  };

  const getSortedLeaders = () => {
    let sorted = [...leaders];
    if (activeTab === 'global') sorted.sort((a, b) => b.globalExp - a.globalExp);
    else if (activeTab === 'solo') sorted.sort((a, b) => b.soloExp - a.soloExp);
    else if (activeTab === 'team') sorted.sort((a, b) => b.teamExp - a.teamExp);
    return sorted;
  };

  const currentLeaders = getSortedLeaders();
  const topThree = currentLeaders.slice(0, 3);
  const remainingLeaders = currentLeaders.slice(3, 25);

  // Current user ranking
  const myIndex = currentLeaders.findIndex(l => l.uid === appUser?.uid || l.id === appUser?.uid);
  const myLeaderData = myIndex !== -1 ? currentLeaders[myIndex] : null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120 } }
  };

  return (
    <div className="space-y-8 pb-24 pt-4 px-2 max-w-5xl mx-auto">
      
      {/* ── HEADER ───────────────────────────────────────────────────────────── */}
      <div className="text-center relative py-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-amber-500/15 blur-[90px] -z-10 rounded-full" />
        
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3.5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-4 shadow-[0_0_30px_rgba(245,158,11,0.3)]"
        >
          <Trophy className="w-10 h-10 drop-shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
        </motion.div>

        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-wider text-glow-accent uppercase mb-2">
          Leaderboard & Hall of Fame
        </h1>
        <p className="text-amber-400 font-mono text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" /> ทำเนียบเกียรติยศยอดนักไวรัสวิทยาและพันธมิตรกิลด์
        </p>
      </div>

      {/* ── CATEGORY TABS ────────────────────────────────────────────────────── */}
      <div className="flex justify-center">
        <div className="bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/60 inline-flex flex-wrap justify-center gap-1 shadow-lg">
          {[
            { id: 'global', label: 'ทั้งหมด (Global)', icon: Globe },
            { id: 'solo', label: 'โหมดเดี่ยว (Solo)', icon: UserIcon },
            { id: 'team', label: 'โหมดทีม (Team)', icon: UsersIcon },
            { id: 'guild', label: 'พันธมิตรกิลด์ (Guilds)', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 ${
                activeTab === tab.id 
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.5)] font-black' 
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
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-400"></div>
          <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">กำลังประมวลผลคะแนนเกียรติยศ...</p>
        </div>
      ) : activeTab === 'guild' ? (
        
        /* ── GUILD LEADERBOARD VIEW ────────────────────────────────────────── */
        <motion.div
          key="guild-tab"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> อันดับพันธมิตรกิลด์ใน Virus Empire ({guilds.length} กิลด์)
            </h2>
            <Link href="/student/empire">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1">
                เข้าสู่แผนที่ Empire <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {guilds.map((g, idx) => {
              const isFirst = idx === 0;
              const isSecond = idx === 1;
              const isThird = idx === 2;

              let rankBadge = `${idx + 1}`;
              let rankStyle = "text-slate-400";
              let cardGlow = "glass border-slate-800";

              if (isFirst) {
                rankBadge = "👑 #1";
                rankStyle = "text-yellow-400 font-black text-glow-accent";
                cardGlow = "glass-neon border-yellow-500/50 shadow-[0_0_25px_rgba(234,179,8,0.2)]";
              } else if (isSecond) {
                rankBadge = "🥈 #2";
                rankStyle = "text-slate-300 font-black";
                cardGlow = "glass border-slate-400/50 shadow-md";
              } else if (isThird) {
                rankBadge = "🥉 #3";
                rankStyle = "text-amber-600 font-black";
                cardGlow = "glass border-amber-700/50 shadow-md";
              }

              return (
                <Card key={g.id} className={`p-4 sm:p-5 flex items-center justify-between transition-all hover:scale-[1.01] ${cardGlow}`}>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <div className={`text-xl sm:text-2xl font-black w-14 text-center ${rankStyle} font-mono italic shrink-0`}>
                      {rankBadge}
                    </div>

                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-lg shrink-0 border border-white/20"
                      style={{ backgroundColor: g.color || '#10b981' }}
                    >
                      {g.tag || 'GUILD'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                          {g.name}
                        </h3>
                        <span 
                          className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full text-white border border-white/20 shadow-sm"
                          style={{ backgroundColor: g.color || '#10b981' }}
                        >
                          [{g.tag}]
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-0.5">
                        <span>หัวหน้า: <strong className="text-slate-200">{g.leaderName}</strong></span>
                        <span>•</span>
                        <span>สมาชิก: <strong className="text-emerald-400">{g.membersCount || 1} คน</strong></span>
                        <span className="inline sm:hidden">•</span>
                        <span className="text-emerald-400 font-bold inline sm:hidden">
                          {g.totalTiles || 0} เซกเตอร์
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xl sm:text-3xl font-mono justify-end">
                      <span>{Number(g.totalTiles || 0).toLocaleString()}</span>
                      <Map className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-400 font-mono uppercase tracking-wider mt-0.5">
                      เซกเตอร์ที่ครอบครอง
                    </p>
                  </div>
                </Card>
              );
            })}

            {guilds.length === 0 && (
              <div className="text-center py-16 text-slate-500 font-mono glass rounded-3xl border border-slate-800">
                ยังไม่มีการก่อตั้งกิลด์ในระบบ — ก่อตั้งกิลด์แรกได้ในโหมด Virus Empire!
              </div>
            )}
          </div>
        </motion.div>

      ) : (

        /* ── STUDENT LEADERBOARD VIEW ───────────────────────────────────────── */
        <div className="space-y-8">
          
          {/* Current User Sticky Banner */}
          {myLeaderData && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900/90 to-blue-950/80 border-2 border-primary/50 shadow-[0_0_25px_rgba(59,130,246,0.25)] flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="text-2xl sm:text-3xl font-black text-primary font-mono shrink-0 px-3 py-1 bg-primary/20 rounded-xl border border-primary/40">
                  #{myIndex + 1}
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary">อันดับของคุณ</span>
                    <span className="text-xs bg-primary text-white font-bold px-2 py-0.2 rounded-full">YOU</span>
                  </div>
                  <h4 className="text-base sm:text-lg font-black text-white">{myLeaderData.fullname}</h4>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-end gap-4 sm:gap-6">
                {myLeaderData.pet && (() => {
                  const myPetCombat = getEffectivePetStats(myLeaderData.pet.stats, myLeaderData.globalExp || 0);
                  return (
                    <div className="flex items-center gap-2.5 bg-slate-950/70 border border-purple-500/40 px-3 py-1.5 rounded-xl shadow-inner">
                      <div className="w-9 h-9 rounded-lg bg-purple-950/80 border border-purple-500/40 p-1 flex items-center justify-center shrink-0">
                        <SVGVirus 
                          type={familyToVirusType(myLeaderData.pet.family || 'corona')}
                          className="w-full h-full text-purple-300"
                          glowColor={myPetCombat.rankBadgeColor}
                        />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white truncate max-w-[120px]">
                          {myLeaderData.pet.nickname || myLeaderData.pet.virusName}
                        </div>
                        <div 
                          className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border inline-block mt-0.5"
                          style={{ 
                            borderColor: `${myPetCombat.rankBadgeColor}60`,
                            backgroundColor: `${myPetCombat.rankBadgeColor}15`,
                            color: myPetCombat.rankBadgeColor 
                          }}
                        >
                          {myPetCombat.rankTitle.split(' (')[0]}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="text-center sm:text-right">
                  <div className="text-xs text-slate-400 font-mono">ยศนิสิต</div>
                  <div className="text-xs font-bold text-amber-300">
                    {getRankTitle(myLeaderData.globalExp).icon} {getRankTitle(myLeaderData.globalExp).title}
                  </div>
                </div>
                <div className="text-center sm:text-right">
                  <div className="text-xl sm:text-2xl font-black text-accent font-mono">
                    {activeTab === 'global' ? myLeaderData.globalExp : activeTab === 'solo' ? myLeaderData.soloExp : myLeaderData.teamExp} EXP
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase">
                    Level {myLeaderData.level || 1}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── TOP 3 PODIUM (PEDESTAL) ──────────────────────────────────────── */}
          {topThree.length >= 3 && (
            <div className="pt-8 pb-4">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto">
                
                {/* 2nd Place (Silver) */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-slate-400 overflow-hidden shadow-[0_0_20px_rgba(148,163,184,0.4)]">
                      {topThree[1].photoURL ? (
                        <img src={topThree[1].photoURL} alt={topThree[1].fullname} className="w-full h-full object-cover" />
                      ) : (
                        <ShieldAlert className="w-8 h-8 text-slate-400 m-auto mt-4" />
                      )}
                    </div>
                    <div className="absolute -top-3 -right-2 bg-slate-300 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border border-slate-950 shadow">
                      #2
                    </div>
                  </div>

                  <p className="font-bold text-white text-xs sm:text-sm text-center truncate w-full px-1">
                    {topThree[1].fullname}
                  </p>
                  <p className="text-[10px] sm:text-xs font-mono font-bold text-slate-300">
                    {activeTab === 'global' ? topThree[1].globalExp : activeTab === 'solo' ? topThree[1].soloExp : topThree[1].teamExp} EXP
                  </p>

                  {/* 2nd Place Pet & Pet Rank */}
                  {topThree[1].pet && (() => {
                    const pCombat = getEffectivePetStats(topThree[1].pet.stats, topThree[1].globalExp || 0);
                    return (
                      <div className="mt-1 flex flex-col items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-950/70 border border-purple-500/40 p-1 flex items-center justify-center shadow-inner relative">
                          <SVGVirus 
                            type={familyToVirusType(topThree[1].pet.family || 'corona')}
                            className="w-full h-full text-purple-300"
                            glowColor={pCombat.rankBadgeColor}
                          />
                        </div>
                        <span className="text-[10px] text-white font-bold truncate max-w-[85px] mt-0.5">
                          {topThree[1].pet.nickname || topThree[1].pet.virusName}
                        </span>
                        <span 
                          className="text-[8px] font-mono font-black px-1.5 py-0.2 rounded border mt-0.5 text-center leading-tight shadow-sm"
                          style={{ 
                            borderColor: `${pCombat.rankBadgeColor}70`,
                            backgroundColor: `${pCombat.rankBadgeColor}15`,
                            color: pCombat.rankBadgeColor 
                          }}
                        >
                          {pCombat.rankTitle.split(' (')[0]}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Pedestal Box */}
                  <div className="w-full h-24 sm:h-28 bg-gradient-to-t from-slate-900 to-slate-800/90 rounded-t-2xl border-t-2 border-x-2 border-slate-500/50 flex flex-col items-center justify-center mt-3 shadow-lg">
                    <span className="text-2xl sm:text-3xl font-black text-slate-300 font-mono">2</span>
                    <span className="text-[9px] font-mono uppercase text-slate-400 tracking-wider">SILVER</span>
                  </div>
                </motion.div>

                {/* 1st Place (Gold) - Taller */}
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center relative z-10"
                >
                  <div className="relative mb-3">
                    <Crown className="w-8 h-8 text-yellow-400 absolute -top-8 left-1/2 -translate-x-1/2 animate-bounce drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]" />
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-900 border-2 border-yellow-400 overflow-hidden shadow-[0_0_30px_rgba(234,179,8,0.5)]">
                      {topThree[0].photoURL ? (
                        <img src={topThree[0].photoURL} alt={topThree[0].fullname} className="w-full h-full object-cover" />
                      ) : (
                        <ShieldAlert className="w-10 h-10 text-yellow-400 m-auto mt-5" />
                      )}
                    </div>
                    <div className="absolute -top-3 -right-2 bg-yellow-400 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border border-slate-950 shadow">
                      #1
                    </div>
                  </div>

                  <p className="font-black text-white text-sm sm:text-base text-center truncate w-full px-1">
                    {topThree[0].fullname}
                  </p>
                  <p className="text-xs sm:text-sm font-mono font-black text-yellow-400">
                    {activeTab === 'global' ? topThree[0].globalExp : activeTab === 'solo' ? topThree[0].soloExp : topThree[0].teamExp} EXP
                  </p>

                  {/* 1st Place Pet & Pet Rank */}
                  {topThree[0].pet && (() => {
                    const pCombat = getEffectivePetStats(topThree[0].pet.stats, topThree[0].globalExp || 0);
                    return (
                      <div className="mt-1 flex flex-col items-center">
                        <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-yellow-950/70 border border-yellow-500/50 p-1 flex items-center justify-center shadow-inner relative">
                          <SVGVirus 
                            type={familyToVirusType(topThree[0].pet.family || 'corona')}
                            className="w-full h-full text-yellow-300"
                            glowColor={pCombat.rankBadgeColor}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs text-white font-bold truncate max-w-[95px] mt-0.5">
                          {topThree[0].pet.nickname || topThree[0].pet.virusName}
                        </span>
                        <span 
                          className="text-[8px] sm:text-[9px] font-mono font-black px-1.5 py-0.2 rounded border mt-0.5 text-center leading-tight shadow-sm"
                          style={{ 
                            borderColor: `${pCombat.rankBadgeColor}70`,
                            backgroundColor: `${pCombat.rankBadgeColor}15`,
                            color: pCombat.rankBadgeColor 
                          }}
                        >
                          {pCombat.rankTitle.split(' (')[0]}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Pedestal Box */}
                  <div className="w-full h-32 sm:h-36 bg-gradient-to-t from-yellow-950/60 via-slate-900 to-amber-900/60 rounded-t-2xl border-t-2 border-x-2 border-yellow-400 flex flex-col items-center justify-center mt-3 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                    <span className="text-3xl sm:text-4xl font-black text-yellow-400 font-mono">1</span>
                    <span className="text-[10px] font-mono uppercase text-yellow-300 tracking-wider">CHAMPION</span>
                  </div>
                </motion.div>

                {/* 3rd Place (Bronze) */}
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="flex flex-col items-center"
                >
                  <div className="relative mb-3">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 border-2 border-amber-700 overflow-hidden shadow-[0_0_20px_rgba(180,83,9,0.4)]">
                      {topThree[2].photoURL ? (
                        <img src={topThree[2].photoURL} alt={topThree[2].fullname} className="w-full h-full object-cover" />
                      ) : (
                        <ShieldAlert className="w-8 h-8 text-amber-600 m-auto mt-4" />
                      )}
                    </div>
                    <div className="absolute -top-3 -right-2 bg-amber-600 text-slate-950 font-black text-xs px-2 py-0.5 rounded-full border border-slate-950 shadow">
                      #3
                    </div>
                  </div>

                  <p className="font-bold text-white text-xs sm:text-sm text-center truncate w-full px-1">
                    {topThree[2].fullname}
                  </p>
                  <p className="text-[10px] sm:text-xs font-mono font-bold text-amber-500">
                    {activeTab === 'global' ? topThree[2].globalExp : activeTab === 'solo' ? topThree[2].soloExp : topThree[2].teamExp} EXP
                  </p>

                  {/* 3rd Place Pet & Pet Rank */}
                  {topThree[2].pet && (() => {
                    const pCombat = getEffectivePetStats(topThree[2].pet.stats, topThree[2].globalExp || 0);
                    return (
                      <div className="mt-1 flex flex-col items-center">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-purple-950/70 border border-purple-500/40 p-1 flex items-center justify-center shadow-inner relative">
                          <SVGVirus 
                            type={familyToVirusType(topThree[2].pet.family || 'corona')}
                            className="w-full h-full text-purple-300"
                            glowColor={pCombat.rankBadgeColor}
                          />
                        </div>
                        <span className="text-[10px] text-white font-bold truncate max-w-[85px] mt-0.5">
                          {topThree[2].pet.nickname || topThree[2].pet.virusName}
                        </span>
                        <span 
                          className="text-[8px] font-mono font-black px-1.5 py-0.2 rounded border mt-0.5 text-center leading-tight shadow-sm"
                          style={{ 
                            borderColor: `${pCombat.rankBadgeColor}70`,
                            backgroundColor: `${pCombat.rankBadgeColor}15`,
                            color: pCombat.rankBadgeColor 
                          }}
                        >
                          {pCombat.rankTitle.split(' (')[0]}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Pedestal Box */}
                  <div className="w-full h-20 sm:h-24 bg-gradient-to-t from-slate-900 to-slate-800/90 rounded-t-2xl border-t-2 border-x-2 border-amber-700/60 flex flex-col items-center justify-center mt-3 shadow-lg">
                    <span className="text-2xl sm:text-3xl font-black text-amber-600 font-mono">3</span>
                    <span className="text-[9px] font-mono uppercase text-amber-500 tracking-wider">BRONZE</span>
                  </div>
                </motion.div>

              </div>
            </div>
          )}

          {/* ── LEADERBOARD LIST TABLE ───────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {currentLeaders.map((leader, index) => {
                const isCurrentUser = appUser?.uid === leader.uid || appUser?.uid === leader.id;
                const displayExp = activeTab === 'global' ? leader.globalExp : activeTab === 'solo' ? leader.soloExp : leader.teamExp;
                const rankInfo = getRankTitle(leader.globalExp);
                
                // Rank styling
                let rankStyle = "text-slate-400";
                let CardBg = "glass border-slate-800/80 hover:border-slate-700";
                
                if (index === 0) {
                  rankStyle = "text-yellow-400 text-glow-accent";
                  CardBg = "glass-neon border-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.2)]";
                } else if (index === 1) {
                  rankStyle = "text-slate-300";
                  CardBg = "glass border-slate-400/50";
                } else if (index === 2) {
                  rankStyle = "text-amber-500";
                  CardBg = "glass border-amber-700/50";
                }

                if (isCurrentUser) {
                  CardBg += " ring-2 ring-primary bg-primary/10";
                }

                return (
                  <motion.div variants={item} key={leader.id}>
                    <Card className={`p-3.5 sm:p-5 flex items-center justify-between transition-all duration-300 hover:scale-[1.01] ${CardBg}`}>
                      
                      <div className="flex items-center gap-3 sm:gap-5 min-w-0">
                        {/* Rank Position */}
                        <div className={`text-xl sm:text-3xl font-black w-10 text-center ${rankStyle} font-mono italic shrink-0`}>
                          #{index + 1}
                        </div>
                        
                        {/* Avatar */}
                        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                          {leader.photoURL ? (
                            <img src={leader.photoURL} alt={leader.fullname} className="w-full h-full object-cover" />
                          ) : (
                            <ShieldAlert className={`w-6 h-6 ${index === 0 ? 'text-yellow-400' : 'text-slate-500'}`} />
                          )}
                        </div>

                        {/* Player Details */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide truncate">
                              {leader.fullname}
                            </h3>
                            {isCurrentUser && (
                              <span className="text-[9px] bg-primary text-white font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                คุณ
                              </span>
                            )}
                            {leader.guildName && (
                              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded-full">
                                [{leader.guildName}]
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-1">
                            <span className="text-[11px] sm:text-xs text-slate-400 font-mono">
                              LV.{leader.level || 1}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span className={`text-[11px] sm:text-xs font-bold flex items-center gap-1 ${rankInfo.color}`}>
                              <span>{rankInfo.icon}</span> {rankInfo.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Pet & EXP Score */}
                      <div className="flex items-center gap-2.5 sm:gap-6 shrink-0">
                        {leader.pet ? (
                          (() => {
                            const pCombat = getEffectivePetStats(leader.pet.stats, leader.globalExp || 0);
                            return (
                              <div className="flex items-center gap-2 bg-slate-950/70 px-2 sm:px-3 py-1.5 rounded-xl border border-purple-500/30 shadow-sm">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-950/80 border border-purple-500/40 p-1 flex items-center justify-center shrink-0 relative">
                                  <SVGVirus 
                                    type={familyToVirusType(leader.pet.family || 'corona')} 
                                    className="w-full h-full text-purple-300" 
                                    glowColor={pCombat.rankBadgeColor} 
                                  />
                                  {leader.pet.stage >= 2 && (
                                    <span className="absolute -bottom-1 -right-1 text-[7px] px-1 rounded-full bg-slate-900 border border-purple-400 font-mono text-purple-300">
                                      S{leader.pet.stage}
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 text-left hidden xs:block">
                                  <div className="text-[10px] sm:text-xs font-bold text-white truncate max-w-[85px] sm:max-w-[130px]">
                                    {leader.pet.nickname || leader.pet.virusName}
                                  </div>
                                  <div 
                                    className="text-[8px] sm:text-[9px] font-mono font-black px-1.5 py-0.2 rounded border inline-flex items-center gap-1 mt-0.5 whitespace-nowrap shadow-sm"
                                    style={{ 
                                      borderColor: `${pCombat.rankBadgeColor}70`,
                                      backgroundColor: `${pCombat.rankBadgeColor}15`,
                                      color: pCombat.rankBadgeColor 
                                    }}
                                  >
                                    <span>{pCombat.rankTitle.split(' (')[0]}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : null}

                        <div className="text-right">
                          <div className="flex items-center gap-1 text-accent font-black text-lg sm:text-2xl text-glow-accent justify-end font-mono">
                            {displayExp.toLocaleString()} <Zap className="w-4 h-4 hidden sm:block text-accent fill-accent" />
                          </div>
                          <p className="text-[9px] sm:text-[10px] text-slate-500 font-mono tracking-widest uppercase mt-0.5">
                            EXP ({activeTab})
                          </p>
                        </div>
                      </div>

                    </Card>
                  </motion.div>
                );
              })}

              {currentLeaders.length === 0 && (
                <div className="text-center text-slate-500 py-16 font-mono glass rounded-3xl border border-slate-800">
                  ยังไม่มีข้อมูลการจัดอันดับสำหรับโหมดนี้
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
