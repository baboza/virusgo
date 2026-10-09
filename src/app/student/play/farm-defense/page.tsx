"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, Users, CheckCircle, AlertTriangle, ShieldCheck, DollarSign, Syringe, HeartPulse, Microscope, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { sfx } from '@/utils/sound';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { useLiveTracking } from '@/hooks/useLiveTracking';

const DEFAULT_EVENTS = [
  { month: 1, title: "Threat Detected", text: "ฟาร์มข้างเคียงพบสุกรมีอาการซึมและไข้สูง ความเสี่ยงการติดเชื้อเริ่มก่อตัว", risk: 20 },
  { month: 2, title: "Vector Warning", text: "ช่วงฤดูฝน พาหะนำโรคอย่างนกและหนูเพิ่มจำนวนมากในพื้นที่", risk: 40 },
  { month: 3, title: "Regional Outbreak", text: "เกิดการระบาดของ PRRS อย่างหนักในรัศมี 10 กิโลเมตรจากฟาร์มคุณ!", risk: 70 },
  { month: 4, title: "Market Crash", text: "ข่าวโรคระบาดทำให้ราคาหมูตกต่ำ (รายได้เดือนนี้ลดลงครึ่งหนึ่ง)", risk: 30 },
  { month: 5, title: "Mutated Strain", text: "เชื้อไวรัสกลายพันธุ์และแพร่กระจายทางอากาศ (Airborne) อย่างรุนแรง!", risk: 90 },
];

const ACTIONS = {
  VACCINE: { id: 'VACCINE', label: 'Vaccinate', cost: 2000, desc: 'ลดโอกาสติดเชื้ออย่างมากในเดือนนี้', icon: Syringe, color: 'text-blue-400' },
  BIOSEC: { id: 'BIOSEC', label: 'Biosecurity', cost: 1500, desc: 'ลดโอกาสติดเชื้อแบบถาวร', icon: ShieldCheck, color: 'text-emerald-400' },
  PCR: { id: 'PCR', label: 'Lab Test (PCR)', cost: 500, desc: 'ไม่มีผลป้องกัน แต่ลดอัตราตายหากติดเชื้อ', icon: Microscope, color: 'text-purple-400' },
  CULL: { id: 'CULL', label: 'Cull 10%', cost: 0, desc: 'ทำลายสุกร 10% เพื่อตัดวงจรโรคทันที', icon: Trash2, color: 'text-danger' },
  NONE: { id: 'NONE', label: 'Do Nothing', cost: 0, desc: 'เก็บเงินไว้รับความเสี่ยง', icon: AlertTriangle, color: 'text-slate-400' }
};

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function FarmDefense() {
  const { user, appUser } = useAuth();
  const myUid = appUser?.uid || user?.uid || '';
  
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [events, setEvents] = useState<any[]>(DEFAULT_EVENTS);

  const currentScore = roomData?.players?.[myUid]?.score || 0;
  useLiveTracking('farm-defense', `ห้อง: ${roomData?.roomCode || '-'} | เดือน: ${roomData?.currentMonth || 1} | หมูรอด: ${roomData?.players?.[myUid]?.pigsAlive ?? 100}%`);

  // Fetch Game Content
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'game_content', 'farm_defense'));
        if (docSnap.exists() && docSnap.data().data?.length > 0) {
          setEvents(docSnap.data().data);
        }
      } catch (e) {
        console.error("Failed to load custom events", e);
      }
    };
    fetchContent();
  }, []);

  // Sync Room
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomCode), (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data());
      } else {
        setError('Room closed.');
        setRoomCode('');
        setRoomData(null);
      }
    });
    return () => unsub();
  }, [roomCode]);

  // Handle Game Loop Automations (Host only)
  useEffect(() => {
    if (!roomData || roomData.hostId !== myUid) return;

    // Check if both players submitted action
    if (roomData.status === 'playing') {
      const p1 = roomData.players[0].uid;
      const p2 = roomData.players[1].uid;
      const fs = roomData.farmStates;
      
      if (fs[p1]?.actionReady && fs[p2]?.actionReady) {
        resolveTurn();
      }
    }

    // Check if both players clicked next month
    if (roomData.status === 'resolving') {
      const p1 = roomData.players[0].uid;
      const p2 = roomData.players[1].uid;
      const fs = roomData.farmStates;
      
      if (fs[p1]?.readyForNext && fs[p2]?.readyForNext) {
        startNextMonth();
      }
    }
  }, [roomData]);

  const handleCreateRoom = async () => {
    if (!myUid) return;
    setLoading(true);
    const code = generateRoomCode();
    try {
      await setDoc(doc(db, 'rooms', code), {
        id: code,
        gameType: 'farm-defense',
        status: 'waiting',
        hostId: myUid,
        players: [{ uid: myUid, displayName: appUser?.displayName || 'Farmer 1' }],
        createdAt: serverTimestamp()
      });
      setRoomCode(code);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myUid || !joinCode) return;
    setLoading(true);
    setError('');
    const code = joinCode.toUpperCase();
    try {
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) throw new Error('Room not found');
      
      const data = roomSnap.data();
      if (data.gameType !== 'farm-defense') throw new Error('Invalid game type');
      
      if (data.players.find((p:any) => p.uid === myUid)) {
        setRoomCode(code);
        setLoading(false);
        return;
      }

      if (data.status !== 'waiting') throw new Error('Game already started');
      if (data.players.length >= 2) throw new Error('Room is full');

      await updateDoc(roomRef, {
        players: arrayUnion({ uid: myUid, displayName: appUser?.displayName || 'Farmer 2' })
      });
      setRoomCode(code);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleStartGame = async () => {
    if (!roomData || roomData.players.length < 2) return;
    
    const initialFarmState = {
      pigs: 1000,
      money: 5000,
      biosecLevel: 1,
      actionReady: false,
      lastAction: null,
      readyForNext: false,
      lastLog: ""
    };

    await updateDoc(doc(db, 'rooms', roomCode), {
      status: 'playing',
      month: 1,
      farmStates: {
        [roomData.players[0].uid]: { ...initialFarmState },
        [roomData.players[1].uid]: { ...initialFarmState }
      }
    });
  };

  const submitAction = async (actionId: string) => {
    if (!roomData || roomData.status !== 'playing') return;
    const action = ACTIONS[actionId as keyof typeof ACTIONS];
    const myFarm = roomData.farmStates[myUid];
    
    if (myFarm.money < action.cost) {
      sfx.wrong();
      return; // Not enough money
    }

    sfx.click();
    await updateDoc(doc(db, 'rooms', roomCode), {
      [`farmStates.${myUid}.actionReady`]: true,
      [`farmStates.${myUid}.lastAction`]: actionId,
      [`farmStates.${myUid}.money`]: increment(-action.cost)
    });
  };

  const resolveTurn = async () => {
    const month = roomData.month;
    const event = events[month - 1];
    const fs = roomData.farmStates;
    const updates: any = {};
    
    const isMarketCrash = event.month === 4;

    roomData.players.forEach((p:any) => {
      const uid = p.uid;
      const farm = fs[uid];
      const action = farm.lastAction;
      
      let newPigs = farm.pigs;
      let newBiosec = farm.biosecLevel;
      let log = "";

      // Process Action
      if (action === 'CULL') {
        newPigs = Math.floor(newPigs * 0.9); // Lose 10%
        log += "Culled 10%. ";
      } else if (action === 'BIOSEC') {
        newBiosec += 1;
        log += "Biosecurity Upgraded. ";
      }

      // Process Risk
      let defense = (newBiosec * 10);
      if (action === 'VACCINE') defense += 40;
      if (action === 'PCR') defense += 10;
      
      let actualRisk = Math.max(0, event.risk - defense);
      
      // If CULL, actual risk is greatly reduced
      if (action === 'CULL') actualRisk = Math.max(0, actualRisk - 50);

      // Random factor
      const roll = Math.random() * 100;
      if (roll < actualRisk && newPigs > 0) {
        // Outbreak happened!
        const deathRate = action === 'PCR' ? 0.1 : 0.3; // PCR reduces death rate
        const deaths = Math.floor(newPigs * deathRate);
        newPigs -= deaths;
        log += `Outbreak! Lost ${deaths} pigs. `;
      } else {
        log += "Farm safe. ";
      }

      // Income
      const incomePerPig = isMarketCrash ? 0.5 : 2;
      const income = Math.floor(newPigs * incomePerPig);
      const finalMoney = farm.money + income - ACTIONS[action as keyof typeof ACTIONS].cost;

      updates[`farmStates.${uid}.pigs`] = Math.max(0, newPigs);
      updates[`farmStates.${uid}.money`] = finalMoney;
      updates[`farmStates.${uid}.biosecLevel`] = newBiosec;
      updates[`farmStates.${uid}.lastLog`] = log;
    });

    updates.status = 'resolving';
    await updateDoc(doc(db, 'rooms', roomCode), updates);
  };

  const handleNextMonth = async () => {
    sfx.click();
    await updateDoc(doc(db, 'rooms', roomCode), {
      [`farmStates.${myUid}.readyForNext`]: true
    });
  };

  const startNextMonth = async () => {
    const nextMonth = roomData.month + 1;
    if (nextMonth > 5) {
      await updateDoc(doc(db, 'rooms', roomCode), { status: 'finished' });
    } else {
      const updates: any = { status: 'playing', month: nextMonth };
      roomData.players.forEach((p:any) => {
        updates[`farmStates.${p.uid}.actionReady`] = false;
        updates[`farmStates.${p.uid}.readyForNext`] = false;
        updates[`farmStates.${p.uid}.lastAction`] = null;
      });
      await updateDoc(doc(db, 'rooms', roomCode), updates);
    }
  };

  useEffect(() => {
    if (roomData?.status === 'finished' && !isSaving) {
      const save = async () => {
        setIsSaving(true);
        const myFarm = roomData.farmStates[myUid];
        const score = Math.floor(myFarm.pigs / 10); // 1 EXP per 10 pigs saved
        if (score > 0) {
          try {
            await updateDoc(doc(db, 'users', myUid), { exp: increment(score) });
            const { addDoc, collection } = await import('firebase/firestore');
            await addDoc(collection(db, 'users', myUid, 'history'), {
              gameId: 'farm-defense',
              gameName: 'Farm Defense',
              score: myFarm.pigs,
              expEarned: score,
              playedAt: new Date().toISOString()
            });
          } catch(e){}
        }
      };
      save();
    }
  }, [roomData?.status]);


  // ================= RENDER =================

  if (!roomCode || !roomData) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 glass rounded-3xl border-2 border-emerald-500/30">
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 text-emerald-400 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-black text-emerald-400 uppercase tracking-widest text-glow">Farm Defense</h1>
          <p className="text-slate-400 font-mono mt-2">1v1 Outbreak Management</p>
        </div>

        {error && <div className="p-3 mb-6 bg-danger/20 text-danger border border-danger rounded-xl text-center text-sm font-bold">{error}</div>}

        <div className="space-y-6">
          <Button onClick={handleCreateRoom} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 uppercase tracking-widest">
            {loading ? 'Processing...' : 'Create New Room'}
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 font-bold">OR</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <input 
              type="text" 
              placeholder="ENTER 6-CHAR ROOM CODE" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-center font-black tracking-widest uppercase text-white focus:border-emerald-500 outline-none"
              maxLength={6}
            />
            <Button type="submit" disabled={loading || joinCode.length !== 6} variant="secondary" className="w-full font-black py-4 uppercase tracking-widest">
              Join Room
            </Button>
          </form>

          <Link href="/student/play" className="block text-center mt-8 text-slate-500 hover:text-white transition-colors uppercase font-bold text-sm">
            ← Back to Hub
          </Link>
        </div>
      </div>
    );
  }

  if (roomData.status === 'waiting') {
    const isHost = roomData.hostId === myUid;
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 glass rounded-3xl border-2 border-emerald-500/50 text-center">
        <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest mb-2">Room Code</h2>
        <div className="text-6xl font-black text-white tracking-[0.2em] mb-12 text-glow">{roomCode}</div>
        
        <div className="space-y-4 mb-12">
          {roomData.players.map((p:any, i:number) => (
            <div key={i} className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between border border-slate-700">
              <span className="font-bold text-lg">{p.displayName}</span>
              <span className="text-emerald-400 font-mono flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Ready</span>
            </div>
          ))}
          {roomData.players.length === 1 && (
            <div className="bg-slate-900/50 p-4 rounded-xl flex items-center justify-center border border-slate-800 border-dashed text-slate-500 animate-pulse">
              Waiting for opponent...
            </div>
          )}
        </div>

        {isHost ? (
          <Button 
            onClick={handleStartGame} 
            disabled={roomData.players.length < 2}
            className={`w-full py-4 text-xl font-black tracking-widest uppercase ${roomData.players.length === 2 ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.5)]' : 'bg-slate-700 text-slate-400'}`}
          >
            Start Defense
          </Button>
        ) : (
          <div className="text-emerald-500 font-bold animate-pulse uppercase tracking-widest">
            Waiting for host to start...
          </div>
        )}
      </div>
    );
  }

  const myFarm = roomData.farmStates[myUid];
  const oppUid = roomData.players.find((p:any) => p.uid !== myUid)?.uid;
  const oppFarm = oppUid ? roomData.farmStates[oppUid] : null;

  if (roomData.status === 'finished') {
    const myPigs = myFarm.pigs;
    const oppPigs = oppFarm?.pigs || 0;
    
    let winnerText = "It's a Tie!";
    if (myPigs > oppPigs) winnerText = "You Win! 🎉";
    else if (oppPigs > myPigs) winnerText = "Opponent Wins! 💀";

    const earnedExp = Math.floor(myPigs / 10);

    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 glass rounded-3xl border-2 border-emerald-500/50 text-center space-y-8">
        <h1 className="text-4xl font-black text-glow uppercase text-emerald-400">Simulation Finished</h1>
        <div className="text-3xl font-black text-white">{winnerText}</div>
        
        <div className="grid grid-cols-2 gap-8">
          <div className="p-6 rounded-2xl border-2 bg-emerald-500/20 border-emerald-500">
            <div className="text-xl font-bold mb-2">Your Farm</div>
            <div className="text-5xl font-black text-emerald-400">{myPigs}</div>
            <div className="text-sm font-mono text-slate-400 mt-2">Pigs Survived</div>
          </div>
          <div className="p-6 rounded-2xl border-2 bg-slate-800 border-slate-700">
            <div className="text-xl font-bold mb-2">Opponent's Farm</div>
            <div className="text-5xl font-black text-slate-400">{oppPigs}</div>
            <div className="text-sm font-mono text-slate-400 mt-2">Pigs Survived</div>
          </div>
        </div>

        <p className="text-emerald-400 font-bold text-xl">You earned {earnedExp} EXP!</p>

        <div className="flex justify-center gap-4">
          <Button onClick={() => window.location.reload()} className="bg-slate-700 text-white font-bold uppercase tracking-widest hover:bg-slate-600">
            Play Again
          </Button>
          <Link href="/student/play">
            <Button variant="outline" className="border-slate-600 text-slate-300 font-bold uppercase tracking-widest hover:bg-slate-800">
              Back to Hub
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentEvent = events[roomData.month - 1];

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-24 pt-4 px-2">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="font-bold text-emerald-400 text-glow flex items-center gap-2 uppercase tracking-widest">
          <Shield className="w-5 h-5" /> Farm Defense
        </div>
        <div className="text-xl font-black text-white uppercase tracking-widest">
          Month {roomData.month} / 5
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Opponent Farm (Mini HUD) */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-4 glass border-slate-700 opacity-80">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Opponent Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono">Pigs</span>
                <span className="font-black text-white">{oppFarm?.pigs ?? '?'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-mono">Biosecurity</span>
                <span className="font-black text-white pl-2">Lv.{oppFarm?.biosecLevel ?? '?'}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                {roomData.status === 'playing' ? (
                   <span className={`text-sm font-bold uppercase ${oppFarm?.actionReady ? 'text-emerald-400' : 'text-slate-500 animate-pulse'}`}>
                     {oppFarm?.actionReady ? 'Action Selected' : 'Thinking...'}
                   </span>
                ) : (
                   <span className={`text-sm font-bold uppercase ${oppFarm?.readyForNext ? 'text-emerald-400' : 'text-orange-400 animate-pulse'}`}>
                     {oppFarm?.readyForNext ? 'Ready' : 'Reviewing Results'}
                   </span>
                )}
              </div>
            </div>
          </Card>

          {/* Event Card */}
          <Card className="p-6 glass border-orange-500/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h2 className="text-lg font-black text-orange-400 uppercase">Alert</h2>
            </div>
            <h3 className="font-bold text-white mb-2">{currentEvent.title}</h3>
            <p className="text-sm text-slate-300 font-mono mb-4">{currentEvent.text}</p>
            <div className="w-full bg-slate-900 rounded-full h-2">
              <div className="bg-orange-500 h-2 rounded-full" style={{width: `${currentEvent.risk}%`}}></div>
            </div>
            <div className="text-right text-xs text-orange-400 font-bold mt-1">Risk Level: {currentEvent.risk}%</div>
          </Card>
        </div>

        {/* My Farm & Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* My HUD */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 glass-neon border-emerald-500/30 flex flex-col items-center justify-center">
              <HeartPulse className="w-6 h-6 text-pink-400 mb-2" />
              <span className="text-3xl font-black text-white">{myFarm.pigs}</span>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Pigs Alive</span>
            </Card>
            <Card className="p-4 glass-neon border-yellow-500/30 flex flex-col items-center justify-center">
              <DollarSign className="w-6 h-6 text-yellow-400 mb-2" />
              <span className="text-3xl font-black text-white">{myFarm.money}</span>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Budget</span>
            </Card>
            <Card className="p-4 glass-neon border-blue-500/30 flex flex-col items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-400 mb-2" />
              <span className="text-3xl font-black text-white">{myFarm.biosecLevel}</span>
              <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Biosecurity</span>
            </Card>
          </div>

          {/* Action Area */}
          <Card className="p-6 glass border-slate-700 min-h-[300px] flex flex-col">
            {roomData.status === 'playing' && !myFarm.actionReady && (
              <>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Select Monthly Action</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-grow">
                  {Object.values(ACTIONS).map((action) => (
                    <button
                      key={action.id}
                      onClick={() => submitAction(action.id)}
                      disabled={myFarm.money < action.cost}
                      className={`p-4 rounded-xl text-left border-2 transition-all flex items-start gap-4 
                        ${myFarm.money >= action.cost ? 'bg-slate-800 border-slate-700 hover:border-emerald-500 hover:bg-slate-800/80 cursor-pointer' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}
                    >
                      <div className={`p-3 rounded-lg bg-slate-900 ${action.color}`}>
                        <action.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-black text-white uppercase">{action.label}</div>
                        <div className="text-xs font-mono text-slate-400 mt-1">{action.desc}</div>
                        <div className={`text-sm font-bold mt-2 ${myFarm.money >= action.cost ? 'text-yellow-400' : 'text-danger'}`}>
                          - {action.cost} ฿
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {roomData.status === 'playing' && myFarm.actionReady && (
               <div className="flex-grow flex flex-col items-center justify-center space-y-4">
                 <CheckCircle className="w-16 h-16 text-emerald-400 animate-pulse" />
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest">Action Deployed</h2>
                 <p className="text-slate-400 font-mono">Waiting for opponent...</p>
               </div>
            )}

            {roomData.status === 'resolving' && (
               <div className="flex-grow flex flex-col items-center justify-center space-y-6">
                 <h2 className="text-2xl font-black text-white uppercase tracking-widest border-b border-slate-700 pb-4 w-full text-center">Month {roomData.month} Results</h2>
                 <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-700 w-full text-center">
                   <p className="text-lg text-slate-300 font-mono mb-4">{myFarm.lastLog}</p>
                   <div className="flex justify-center gap-8">
                      <div>
                        <div className="text-sm text-slate-500 uppercase font-bold">Pigs Remaining</div>
                        <div className="text-3xl font-black text-emerald-400">{myFarm.pigs}</div>
                      </div>
                      <div>
                        <div className="text-sm text-slate-500 uppercase font-bold">Budget Remaining</div>
                        <div className="text-3xl font-black text-yellow-400">{myFarm.money}</div>
                      </div>
                   </div>
                 </div>
                 
                 {myFarm.readyForNext ? (
                   <div className="text-emerald-500 font-bold animate-pulse uppercase">Waiting for opponent...</div>
                 ) : (
                   <Button onClick={handleNextMonth} className="w-full py-4 text-lg font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white">
                     Proceed to Next Month
                   </Button>
                 )}
               </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
