"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, increment, serverTimestamp } from 'firebase/firestore';
import { useLiveTracking } from '@/hooks/useLiveTracking';
import { db } from '@/lib/firebase/config';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';
import Link from 'next/link';
import { ArrowLeft, Users, ShieldAlert, Zap, Trophy, Skull } from 'lucide-react';

// --- Types ---
interface PlayerState {
  uid: string;
  displayName: string;
  photoURL: string;
  hp: number;
  damageDealt: number;
}

interface Room {
  roomId: string;
  hostId: string;
  status: 'waiting' | 'playing' | 'finished';
  bossHp: number;
  maxBossHp: number;
  players: Record<string, PlayerState>;
}

// --- Hardcoded Questions for Demo ---
const DEFAULT_QUESTIONS = [
  { q: "ไวรัสพิษสุนัขบ้า (Rabies) ติดต่อผ่านทางใดมากที่สุด?", choices: ["Saliva", "Blood", "Urine", "Air"], answer: "Saliva" },
  { q: "รูปร่างของเชื้อ Rabies virus ลักษณะคล้ายอะไร?", choices: ["กระสุนปืน", "มงกุฎ", "ทรงกลม", "แท่งยาว"], answer: "กระสุนปืน" }
];

const MAX_PLAYER_HP = 100;
const MAX_BOSS_HP = 300;

export default function VirusBattle() {
  const { appUser, user } = useAuth();
  
  // Game States
  const [roomId, setRoomId] = useState<string>('');
  const [joinCode, setJoinCode] = useState<string>('');
  const [roomData, setRoomData] = useState<Room | null>(null);
  const [error, setError] = useState<string>('');
  const [questions, setQuestions] = useState<typeof DEFAULT_QUESTIONS>(DEFAULT_QUESTIONS);
  const [currentQ, setCurrentQ] = useState(0);

  const myUid = appUser?.uid || user?.uid || '';
  useLiveTracking('virus-battle', `ห้อง: ${roomData?.id || '-'} | สถานะ: ${roomData?.status || 'waiting'} | เลือดบอส: ${roomData?.bossHp ?? '-'}/${roomData?.maxBossHp ?? '-'}`);


  useEffect(() => {
    const fetchQ = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'game_content', 'quiz_general'));
        if (docSnap.exists() && docSnap.data().questions?.length > 0) {
          const mapped = docSnap.data().questions.map((q: any) => ({
            q: q.q,
            choices: q.opts || [],
            answer: q.opts ? q.opts[q.ans] : ''
          }));
          setQuestions(mapped);
        }
      } catch (e) {
        console.error("Failed to load custom questions", e);
      }
    };
    fetchQ();
  }, []);
  const [myDamageText, setMyDamageText] = useState<{val: number, type: 'damage'|'heal'|'hit'} | null>(null);
  
  useEffect(() => {
    // Shuffle questions once on mount
    QUESTIONS.sort(() => Math.random() - 0.5);
  }, []);

  // Subscribe to Room
  useEffect(() => {
    if (!roomId) return;
    
    const unsubscribe = onSnapshot(doc(db, 'rooms', roomId), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Room;
        setRoomData(data);
        
        // Handle Game Over Check
        if (data.status === 'playing') {
          const allDead = Object.values(data.players).every(p => p.hp <= 0);
          if (data.bossHp <= 0 || allDead) {
            // End the game
            if (data.hostId === user?.uid) {
              updateDoc(doc(db, 'rooms', roomId), { status: 'finished' });
            }
          }
        }
      } else {
        setError('Room not found or closed.');
        setRoomId('');
        setRoomData(null);
      }
    });

    return () => unsubscribe();
  }, [roomId, user?.uid]);

  if (!appUser || !user) return null;

  // --- Actions ---
  const createRoom = async () => {
    sfx.click();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newRoom: Room = {
      roomId: code,
      hostId: user.uid,
      status: 'waiting',
      bossHp: MAX_BOSS_HP,
      maxBossHp: MAX_BOSS_HP,
      players: {
        [user.uid]: {
          uid: user.uid,
          displayName: appUser.fullname,
          photoURL: appUser.photoURL || '',
          hp: MAX_PLAYER_HP,
          damageDealt: 0
        }
      }
    };
    
    await setDoc(doc(db, 'rooms', code), newRoom);
    setRoomId(code);
  };

  const joinRoom = async () => {
    sfx.click();
    setError('');
    const code = joinCode.toUpperCase();
    if (!code) return;
    
    const roomRef = doc(db, 'rooms', code);
    const snap = await getDoc(roomRef);
    
    if (snap.exists()) {
      const data = snap.data() as Room;
      if (data.status !== 'waiting') {
        setError('Game has already started or finished.');
        return;
      }
      if (Object.keys(data.players).length >= 2) {
        setError('Room is full.');
        return;
      }
      
      // Join
      await updateDoc(roomRef, {
        [`players.${user.uid}`]: {
          uid: user.uid,
          displayName: appUser.fullname,
          photoURL: appUser.photoURL || '',
          hp: MAX_PLAYER_HP,
          damageDealt: 0
        }
      });
      setRoomId(code);
    } else {
      setError('Invalid Room Code.');
    }
  };

  const startGame = async () => {
    sfx.click();
    await updateDoc(doc(db, 'rooms', roomId), { status: 'playing' });
  };

  const leaveRoom = async () => {
    sfx.click();
    setRoomId('');
    setRoomData(null);
  };

  const handleAnswer = async (choice: string) => {
    if (!roomData || roomData.status !== 'playing') return;
    
    const myPlayer = roomData.players[user.uid];
    if (!myPlayer || myPlayer.hp <= 0) return; // Dead

    const question = questions[currentQ % questions.length];
    const isCorrect = choice === question.answer;

    if (isCorrect) {
      sfx.attack();
      setMyDamageText({ val: 20, type: 'damage' });
      await updateDoc(doc(db, 'rooms', roomId), {
        bossHp: increment(-20),
        [`players.${user.uid}.damageDealt`]: increment(20)
      });
    } else {
      sfx.damage();
      setMyDamageText({ val: -15, type: 'hit' });
      await updateDoc(doc(db, 'rooms', roomId), {
        [`players.${user.uid}.hp`]: increment(-15)
      });
    }

    setTimeout(() => setMyDamageText(null), 800);
    setCurrentQ(q => q + 1);
  };

  const giveRewards = async () => {
    sfx.click();
    if (roomData && roomData.bossHp <= 0) {
      await updateDoc(doc(db, 'users', user.uid), { exp: increment(100) });
      const { addDoc, collection } = await import('firebase/firestore');
      await addDoc(collection(db, 'users', user.uid, 'history'), {
        gameId: 'virus-battle',
        gameName: 'Boss Battle (Co-op)',
        score: roomData.players[user.uid]?.damageDealt || 0,
        expEarned: 100,
        playedAt: new Date().toISOString()
      });
    }
    setRoomId('');
    setRoomData(null);
  };

  // --- Renderers ---
  if (!roomId || !roomData) {
    return (
      <div className="space-y-6 pt-4 px-2 md:px-0">
        <div className="flex items-center gap-4">
          <Link href="/student/play">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Button>
          </Link>
          <h1 className="text-3xl font-black text-white text-glow flex items-center gap-3">
            <Users className="w-8 h-8 text-secondary" />
            Virus Battle <span className="text-sm font-bold bg-secondary/20 text-secondary px-2 py-1 rounded-md">Co-op</span>
          </h1>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <Card className="p-8 flex flex-col items-center text-center glass border-secondary/30">
            <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Create Room</h2>
            <p className="text-slate-400 text-sm mb-6">สร้างห้องเพื่อชวนเพื่อนมาช่วยกันต่อสู้กับบอสไวรัส</p>
            <Button onClick={createRoom} className="w-full bg-secondary hover:bg-secondary/80 text-black font-black">
              สร้างห้องใหม่
            </Button>
          </Card>

          <Card className="p-8 flex flex-col items-center text-center glass border-primary/30">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <Zap className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Join Room</h2>
            <p className="text-slate-400 text-sm mb-6">กรอกรหัสห้อง 6 หลักเพื่อเข้าร่วมทีม</p>
            <div className="flex gap-2 w-full">
              <Input 
                value={joinCode} 
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Ex. AB12CD"
                maxLength={6}
                className="text-center font-mono font-bold tracking-widest uppercase"
              />
              <Button onClick={joinRoom} className="bg-primary hover:bg-blue-600 font-bold shrink-0">
                Join
              </Button>
            </div>
            {error && <p className="text-red-400 text-sm mt-2 font-bold">{error}</p>}
          </Card>
        </div>
      </div>
    );
  }

  const isHost = roomData.hostId === user.uid;
  const playersList = Object.values(roomData.players);

  // --- LOBBY WAITING ---
  if (roomData.status === 'waiting') {
    return (
      <div className="space-y-6 pt-4 px-2 md:px-0 flex flex-col items-center">
        <h1 className="text-3xl font-black text-white text-glow mb-4">Waiting Room</h1>
        
        <Card className="p-8 w-full max-w-md text-center glass border-primary/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-24 h-24" />
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-2">Room Code</p>
          <div className="text-5xl font-black text-primary font-mono tracking-widest mb-8 text-glow">
            {roomData.roomId}
          </div>

          <div className="space-y-4 mb-8">
            {playersList.map((p, i) => (
              <div key={p.uid} className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-700">
                <div className="w-12 h-12 rounded-full bg-slate-800 overflow-hidden border-2 border-primary">
                  {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-700" />}
                </div>
                <div className="text-left">
                  <p className="font-bold text-white">{p.displayName}</p>
                  <p className="text-xs text-primary">{p.uid === roomData.hostId ? 'Host' : 'Guest'}</p>
                </div>
              </div>
            ))}
            {playersList.length < 2 && (
              <div className="flex items-center gap-4 bg-slate-900/50 p-3 rounded-xl border border-dashed border-slate-700 opacity-50">
                <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-600 flex items-center justify-center">
                  <span className="animate-pulse">...</span>
                </div>
                <p className="font-bold text-slate-400">Waiting for Player 2...</p>
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button onClick={leaveRoom} variant="outline" className="flex-1 border-danger text-danger hover:bg-danger/10">
              Leave
            </Button>
            {isHost && (
              <Button 
                onClick={startGame} 
                disabled={playersList.length < 2} 
                className={`flex-1 font-black ${playersList.length === 2 ? 'bg-secondary text-black hover:bg-secondary/80' : 'bg-slate-700 text-slate-500'}`}
              >
                START GAME
              </Button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // --- PLAYING ---
  const myPlayer = roomData.players[user.uid];
  const question = QUESTIONS[currentQ % QUESTIONS.length];

  return (
    <div className="pt-2 px-2 md:px-0 max-w-4xl mx-auto flex flex-col min-h-[85vh]">
      {/* Header Info */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-primary font-mono font-bold">ROOM: {roomData.roomId}</div>
        <div className="text-danger font-black flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> BOSS BATTLE
        </div>
      </div>

      {/* Battlefield */}
      <div className="relative glass-neon p-6 rounded-3xl mb-6 flex-1 flex flex-col justify-between overflow-hidden border-danger/30">
        <div className="absolute inset-0 bg-danger/5 animate-pulse-slow pointer-events-none" />
        
        {/* Boss Section */}
        <div className="flex flex-col items-center mt-4 relative z-10">
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="relative"
          >
            <SVGVirus type="rabies" className="w-32 h-32 text-danger drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]" glowColor="rgba(239,68,68,0.8)" />
            {roomData.status === 'playing' && myDamageText?.type === 'damage' && (
              <motion.div 
                initial={{ opacity: 1, y: 0, scale: 1 }}
                animate={{ opacity: 0, y: -50, scale: 1.5 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl font-black text-yellow-400 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] z-50 pointer-events-none"
              >
                -{myDamageText.val}
              </motion.div>
            )}
          </motion.div>

          <div className="mt-6 w-full max-w-md text-center">
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest text-glow-danger">Rabies Virus</h2>
            <div className="w-full bg-slate-900/80 rounded-full h-4 border border-danger/30 relative overflow-hidden">
              <motion.div 
                className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-red-600 to-danger"
                animate={{ width: `${Math.max(0, (roomData.bossHp / roomData.maxBossHp) * 100)}%` }}
                transition={{ duration: 0.3 }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow-md">
                {Math.max(0, roomData.bossHp)} / {roomData.maxBossHp} HP
              </div>
            </div>
          </div>
        </div>

        {/* Players Section */}
        <div className="grid grid-cols-2 gap-4 mt-12 relative z-10">
          {playersList.map(p => {
            const isMe = p.uid === user.uid;
            const isDead = p.hp <= 0;
            return (
              <div key={p.uid} className={`bg-slate-900/60 p-4 rounded-2xl border ${isMe ? 'border-secondary/50' : 'border-slate-700'} relative`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-slate-800 border-2 ${isDead ? 'border-danger grayscale' : (isMe ? 'border-secondary' : 'border-slate-500')} overflow-hidden shrink-0 relative`}>
                    {p.photoURL ? <img src={p.photoURL} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-700" />}
                    {isDead && <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center"><Skull className="w-6 h-6 text-white" /></div>}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white text-sm truncate">{p.displayName} {isMe && '(You)'}</p>
                    <p className="text-[10px] text-slate-400">DMG: <span className="text-yellow-400 font-mono font-bold">{p.damageDealt}</span></p>
                  </div>
                </div>

                {/* Player HP */}
                <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-700 relative overflow-hidden">
                  <motion.div 
                    className={`absolute top-0 bottom-0 left-0 ${isMe ? 'bg-secondary' : 'bg-primary'}`}
                    animate={{ width: `${Math.max(0, (p.hp / MAX_PLAYER_HP) * 100)}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                {isMe && myDamageText?.type === 'hit' && (
                  <motion.div 
                    initial={{ opacity: 1, y: -20, scale: 1 }}
                    animate={{ opacity: 0, y: -50, scale: 1.2 }}
                    className="absolute top-0 right-4 text-xl font-black text-danger drop-shadow-md z-50 pointer-events-none"
                  >
                    {myDamageText.val}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Controller / Questions */}
      {roomData.status === 'playing' && (
        <Card className="p-6 glass border-t border-slate-700 shrink-0">
          {myPlayer?.hp <= 0 ? (
            <div className="text-center py-6">
              <Skull className="w-12 h-12 text-danger mx-auto mb-2 opacity-50" />
              <h3 className="text-xl font-black text-danger uppercase tracking-widest mb-1">YOU DIED</h3>
              <p className="text-slate-400 text-sm">รอเพื่อนร่วมทีมจัดการบอส...</p>
            </div>
          ) : (
            <>
              <h3 className="text-lg font-bold text-white mb-4 leading-snug">{question.q}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.choices.map((choice, i) => (
                  <Button
                    key={i}
                    onClick={() => handleAnswer(choice)}
                    variant="outline"
                    className="h-auto py-3 px-4 justify-start text-left hover:bg-secondary/20 hover:text-white hover:border-secondary transition-all"
                  >
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold mr-3 shrink-0">
                      {['A','B','C','D'][i]}
                    </span>
                    <span className="text-sm font-medium whitespace-normal">{choice}</span>
                  </Button>
                ))}
              </div>
            </>
          )}
        </Card>
      )}

      {/* Finished State Overlay */}
      <AnimatePresence>
        {roomData.status === 'finished' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
              className="glass p-8 rounded-3xl max-w-md w-full text-center border-t border-secondary"
            >
              <Trophy className={`w-20 h-20 mx-auto mb-4 ${roomData.bossHp <= 0 ? 'text-yellow-400' : 'text-slate-600'}`} />
              <h2 className={`text-4xl font-black mb-2 text-glow uppercase tracking-widest ${roomData.bossHp <= 0 ? 'text-secondary' : 'text-danger'}`}>
                {roomData.bossHp <= 0 ? 'VICTORY!' : 'DEFEAT'}
              </h2>
              <p className="text-slate-400 mb-6">
                {roomData.bossHp <= 0 ? 'ทีมของคุณกำจัดไวรัสสำเร็จ!' : 'ทีมของคุณถูกไวรัสทำลายล้าง'}
              </p>

              <div className="space-y-3 mb-8 text-left bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                <h4 className="font-bold text-white mb-2 text-sm uppercase">Damage Report</h4>
                {playersList.sort((a,b) => b.damageDealt - a.damageDealt).map((p, idx) => (
                  <div key={p.uid} className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-medium">
                      {idx === 0 && <span className="text-yellow-400 mr-2">👑</span>}
                      {p.displayName}
                    </span>
                    <span className="font-mono text-secondary font-bold">{p.damageDealt} DMG</span>
                  </div>
                ))}
              </div>

              <Button onClick={giveRewards} className="w-full bg-secondary hover:bg-secondary/80 text-black font-black py-6">
                {roomData.bossHp <= 0 ? 'รับ 100 EXP แล้วกลับหน้าหลัก' : 'กลับหน้าหลัก'}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
