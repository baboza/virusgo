"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Trophy, Swords, CheckCircle, XCircle, User, ShieldAlert, Users, Server, Play, Clock, Crown } from 'lucide-react';
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

const BOT_NAMES = [
  "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta",
  "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi",
  "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega",
  "Falcon", "Eagle", "Hawk", "Raven", "Owl", "Wolf", "Tiger"
];

const QUESTIONS = [
  { q: "เชื้อ FMD เป็นเชื้อกลุ่มใด?", opts: ["DNA Virus", "RNA Virus", "Bacteria", "Fungi"], ans: 1 },
  { q: "สัตว์ชนิดใดไม่ติดเชื้อ FMD?", opts: ["โค", "สุกร", "ม้า", "แพะ"], ans: 2 },
  { q: "โรค PEDV ในสุกร ทำให้เกิดอาการใดเด่นชัดที่สุด?", opts: ["ไข้สูง", "ท้องเสียรุนแรง", "ไอเรื้อรัง", "แท้งลูก"], ans: 1 },
  { q: "โรคพิษสุนัขบ้า (Rabies) ติดต่อทางใดเป็นหลัก?", opts: ["ทางอากาศ", "น้ำลายผ่านแผล", "กินอาหารปนเปื้อน", "ยุงกัด"], ans: 1 },
  { q: "การส่งตรวจยืนยันเชื้อ Rabies นิยมใช้วิธีใด?", opts: ["FA Test จากสมอง", "Blood smear", "ELISA serum", "PCR อุจจาระ"], ans: 0 },
  { q: "CPV (Canine Parvovirus) มักพบในสุนัขอายุเท่าใด?", opts: ["แรกเกิด", "1-6 เดือน", "3-5 ปี", "สุนัขแก่"], ans: 1 },
  { q: "พาหะนำโรค PRRS คืออะไร?", opts: ["ยุง", "เห็บ", "สุกรป่วย", "นก"], ans: 2 },
  { q: "เชื้อ ASF ในสุกร เป็นเชื้อชนิดใด?", opts: ["DNA Virus", "RNA Virus", "Prion", "Bacteria"], ans: 0 },
  { q: "วัคซีน ASF ในปัจจุบันมีประสิทธิภาพระดับใด?", opts: ["ป้องกันได้ 100%", "ป้องกันได้ 80%", "ป้องกันได้เฉพาะบางสายพันธุ์", "ยังไม่มีวัคซีนที่สมบูรณ์"], ans: 3 },
  { q: "อาการ 'หงอนม่วง' ในไก่ มักพบในโรคใด?", opts: ["NDV (Newcastle)", "AI (Avian Influenza)", "IB (Infectious Bronchitis)", "Fowl Pox"], ans: 1 },
];

const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

type Player = { uid: string; displayName: string; isBot: boolean };
type Match = { id: string; p1: Player | null; p2: Player | null; winner: Player | null };

export default function TournamentMultiplayer() {
  const { appUser, user } = useAuth();
  const myUid = appUser?.uid || user?.uid || '';
  const myName = appUser?.displayName || 'Player';
  
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHostMode, setIsHostMode] = useState(false);
  const [selectedSize, setSelectedSize] = useState<8|16|32>(8);

  useLiveTracking('tournament', `สถานะ: ${roomData?.state || 'waiting'} | ห้อง: ${roomData?.roomCode || '-'}`);


  // Match State (For Player)
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Real-time listener
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomCode), (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data());
      } else {
        setError('Room closed by Admin.');
        setRoomCode('');
        setRoomData(null);
      }
    });
    return () => unsub();
  }, [roomCode]);

  // ================= ADMIN CONTROLS =================

  const handleCreateRoom = async () => {
    if (!myUid) return;
    setLoading(true);
    const code = generateRoomCode();
    try {
      await setDoc(doc(db, 'rooms', code), {
        id: code,
        gameType: 'tournament',
        status: 'waiting',
        hostId: myUid,
        maxSize: selectedSize,
        players: [],
        createdAt: serverTimestamp()
      });
      setRoomCode(code);
      setIsHostMode(true);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleStartTournament = async () => {
    // Admin clicks Start. Auto-fill bots.
    let players = [...roomData.players];
    const needed = roomData.maxSize - players.length;
    
    if (needed > 0) {
      const shuffledBots = [...BOT_NAMES].sort(() => 0.5 - Math.random());
      for (let i = 0; i < needed; i++) {
        players.push({ uid: `bot_${i}_${Date.now()}`, displayName: `Bot ${shuffledBots[i]}`, isBot: true });
      }
    }

    players.sort(() => 0.5 - Math.random()); // Shuffle bracket
    
    // Generate Round 0 (First Round)
    const matches: Match[] = [];
    for (let i = 0; i < players.length; i += 2) {
      matches.push({ id: `m_0_${i/2}`, p1: players[i], p2: players[i+1], winner: null });
    }

    const bracket = { "0": matches }; // Use object instead of array to avoid Firestore nested array error
    
    // Initialize Match Data
    const matchData: any = {};
    matches.forEach(m => {
      matchData[m.id] = { p1Score: 0, p2Score: 0, p1Finished: false, p2Finished: false };
    });

    await updateDoc(doc(db, 'rooms', roomCode), {
      status: 'bracket',
      players,
      bracket,
      matchData,
      currentRound: 0,
      questionIndex: 0
    });
  };

  const startRoundMatches = async () => {
    await updateDoc(doc(db, 'rooms', roomCode), {
      status: 'playing',
      questionIndex: 0
    });
  };

  const proceedToNextRound = async () => {
    const cr = roomData.currentRound;
    const currentMatches = roomData.bracket[cr];
    
    // If it was the final, end tournament
    if (currentMatches.length === 1) {
      await updateDoc(doc(db, 'rooms', roomCode), { status: 'finished' });
      return;
    }

    // Generate next round bracket
    const nextMatches: Match[] = [];
    for (let i = 0; i < currentMatches.length; i += 2) {
      nextMatches.push({ 
        id: `m_${cr+1}_${i/2}`, 
        p1: currentMatches[i].winner, 
        p2: currentMatches[i+1].winner, 
        winner: null 
      });
    }

    const newBracket = { ...roomData.bracket, [cr + 1]: nextMatches };
    
    const newMatchData = { ...roomData.matchData };
    nextMatches.forEach(m => {
      newMatchData[m.id] = { p1Score: 0, p2Score: 0, p1Finished: false, p2Finished: false };
    });

    await updateDoc(doc(db, 'rooms', roomCode), {
      status: 'bracket',
      currentRound: cr + 1,
      bracket: newBracket,
      matchData: newMatchData
    });
  };

  // Bot Simulation Logic (Run by Admin Host)
  useEffect(() => {
    if (isHostMode && roomData?.status === 'playing') {
      const cr = roomData.currentRound;
      const currentMatches = roomData.bracket[cr];
      const matchData = roomData.matchData;
      
      let updatesNeeded = false;
      const newMatchData = { ...matchData };
      const newBracket = { ...roomData.bracket };
      // Deep copy the current round to avoid mutating read-only state directly
      newBracket[cr] = [...newBracket[cr]];
      let allMatchesFinished = true;

      currentMatches.forEach((m: Match, i: number) => {
        const md = newMatchData[m.id];
        if (!md.p1Finished && m.p1?.isBot) {
          md.p1Score += Math.floor(Math.random() * 3); // Bot logic
          md.p1Finished = true;
          updatesNeeded = true;
        }
        if (!md.p2Finished && m.p2?.isBot) {
          md.p2Score += Math.floor(Math.random() * 3);
          md.p2Finished = true;
          updatesNeeded = true;
        }

        if (!md.p1Finished || !md.p2Finished) allMatchesFinished = false;

        // Resolve match if both finished
        if (md.p1Finished && md.p2Finished && !m.winner) {
          if (md.p1Score >= md.p2Score) newBracket[cr][i].winner = m.p1;
          else newBracket[cr][i].winner = m.p2;
          updatesNeeded = true;
        }
      });

      if (updatesNeeded) {
        // Apply updates
        updateDoc(doc(db, 'rooms', roomCode), {
           matchData: newMatchData,
           bracket: newBracket
        });
      }

      if (allMatchesFinished) {
        updateDoc(doc(db, 'rooms', roomCode), {
           status: 'round_finished'
        });
      }
    }
  }, [roomData?.status, roomData?.matchData, isHostMode]);

  // ================= PLAYER CONTROLS =================

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
      if (data.gameType !== 'tournament') throw new Error('Invalid game type');
      if (data.status !== 'waiting') throw new Error('Tournament already started');
      if (data.players.length >= data.maxSize) throw new Error('Room is full');
      if (data.players.find((p:any) => p.uid === myUid)) throw new Error('Already in room');

      await updateDoc(roomRef, {
        players: arrayUnion({ uid: myUid, displayName: myName, isBot: false })
      });
      setRoomCode(code);
      setIsHostMode(false);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleAnswer = async (optIndex: number, correctIndex: number, matchId: string, isP1: boolean) => {
    if (selectedAns !== null) return;
    setSelectedAns(optIndex);
    
    const isCorrect = optIndex === correctIndex;
    if (isCorrect) sfx.correct();
    else sfx.wrong();
    
    setShowExplanation(true);
    
    setTimeout(async () => {
      setSelectedAns(null);
      setShowExplanation(false);
      
      const md = roomData.matchData[matchId];
      const newScore = (isP1 ? md.p1Score : md.p2Score) + (isCorrect ? 1 : 0);
      
      // For this simplified prototype, humans play 1 question per round.
      // (Could be expanded to 3 questions by managing local state, but 1 is best for sync).
      await updateDoc(doc(db, 'rooms', roomCode), {
        [`matchData.${matchId}.${isP1 ? 'p1Score' : 'p2Score'}`]: newScore,
        [`matchData.${matchId}.${isP1 ? 'p1Finished' : 'p2Finished'}`]: true,
      });
      
    }, 1500);
  };

  useEffect(() => {
    // Reward EXP if I won the grand final
    if (!isHostMode && roomData?.status === 'finished') {
       const finalRoundKey = Object.keys(roomData.bracket).length - 1;
       const finalMatch = roomData.bracket[finalRoundKey][0];
       if (finalMatch.winner?.uid === myUid) {
         sfx.levelUp();
         const save = async () => {
           try {
             await updateDoc(doc(db, 'users', myUid), { exp: increment(300) });
             const { addDoc, collection } = await import('firebase/firestore');
             await addDoc(collection(db, 'users', myUid, 'history'), {
               gameId: 'tournament',
               gameName: 'Virus Tournament',
               score: 300,
               expEarned: 300,
               playedAt: new Date().toISOString()
             });
           } catch(e){}
         };
         save();
       }
    }
  }, [roomData?.status, isHostMode]);

  // ================= RENDER LOGIC =================

  if (!roomCode || !roomData) {
    return (
      <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {error && <div className="col-span-1 md:col-span-2 p-3 bg-danger/20 text-danger border border-danger rounded-xl text-center text-sm font-bold">{error}</div>}

        {/* Student Join */}
        <Card className="p-8 glass border-cyan-500/30 flex flex-col items-center justify-center space-y-6">
          <Users className="w-16 h-16 text-cyan-400 mb-2 animate-pulse" />
          <h2 className="text-3xl font-black text-cyan-400 uppercase tracking-widest text-glow">Join Tournament</h2>
          <form onSubmit={handleJoinRoom} className="w-full space-y-4">
            <input 
              type="text" 
              placeholder="ENTER 6-CHAR ROOM CODE" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-center font-black tracking-widest uppercase text-white focus:border-cyan-500 outline-none"
              maxLength={6}
            />
            <Button type="submit" disabled={loading || joinCode.length !== 6} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 uppercase tracking-widest">
              Join Room
            </Button>
          </form>
        </Card>

        {/* Admin Host */}
        <Card className="p-8 glass border-yellow-500/30 flex flex-col items-center justify-center space-y-6">
          <ShieldAlert className="w-16 h-16 text-yellow-400 mb-2" />
          <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest text-glow">Admin Host</h2>
          <div className="w-full space-y-4 text-left">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tournament Size</label>
            <div className="grid grid-cols-3 gap-2">
              {[8, 16, 32].map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size as any)}
                  className={`py-3 rounded-lg font-black border-2 ${selectedSize === size ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                >
                  {size}
                </button>
              ))}
            </div>
            <Button onClick={handleCreateRoom} disabled={loading} className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 uppercase tracking-widest">
              Create Room
            </Button>
          </div>
        </Card>

        <div className="col-span-1 md:col-span-2 text-center">
          <Link href="/student/play" className="text-slate-500 hover:text-white transition-colors uppercase font-bold text-sm">
            ← Back to Hub
          </Link>
        </div>
      </div>
    );
  }

  // Waiting Room
  if (roomData.status === 'waiting') {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 glass rounded-3xl border-2 border-yellow-500/50 text-center">
        <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest mb-2">Room Code</h2>
        <div className="text-6xl font-black text-white tracking-[0.2em] mb-4 text-glow">{roomCode}</div>
        <p className="text-yellow-400 font-bold mb-8">{roomData.players.length} / {roomData.maxSize} Players Joined</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 text-left">
          {roomData.players.map((p:any, i:number) => (
            <div key={i} className="bg-slate-800 p-2 rounded-lg truncate text-sm font-bold text-white border border-slate-700">
              {p.displayName}
            </div>
          ))}
          {[...Array(roomData.maxSize - roomData.players.length)].map((_, i) => (
            <div key={i} className="bg-slate-900/50 p-2 rounded-lg truncate text-sm text-slate-600 border border-slate-800 border-dashed">
              Empty (Auto-bot)
            </div>
          ))}
        </div>

        {isHostMode ? (
          <Button onClick={handleStartTournament} className="w-full py-4 text-xl font-black tracking-widest uppercase bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.5)]">
            Generate Bracket
          </Button>
        ) : (
          <div className="text-cyan-500 font-bold animate-pulse uppercase tracking-widest">
            Waiting for Admin to generate bracket...
          </div>
        )}
      </div>
    );
  }

  // --- Helpers for rendering ---
  const currentMatches = roomData.bracket[roomData.currentRound] as Match[];
  const myMatch = currentMatches?.find(m => m.p1?.uid === myUid || m.p2?.uid === myUid);
  const amIEliminated = roomData.status !== 'waiting' && roomData.status !== 'finished' && !myMatch;
  const isP1 = myMatch?.p1?.uid === myUid;
  const myMd = myMatch ? roomData.matchData[myMatch.id] : null;
  const myFinished = myMd ? (isP1 ? myMd.p1Finished : myMd.p2Finished) : false;

  const roundName = roomData.currentRound === 0 ? (roomData.maxSize === 32 ? "Round of 32" : roomData.maxSize === 16 ? "Round of 16" : "Quarter-Finals") 
                    : currentMatches.length === 1 ? "Grand Final" 
                    : currentMatches.length === 2 ? "Semi-Finals" 
                    : "Quarter-Finals";

  // Admin Dashboard View
  if (isHostMode) {
    return (
      <div className="max-w-6xl mx-auto mt-4 px-2 pb-20 space-y-8">
        <div className="bg-slate-900 p-4 rounded-xl flex items-center justify-between border border-slate-700">
          <div className="font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
            <Server className="w-5 h-5"/> Admin Dashboard
          </div>
          <div className="text-2xl font-black text-white">{roundName}</div>
          <div>
            {roomData.status === 'bracket' && (
               <Button onClick={startRoundMatches} className="bg-yellow-500 hover:bg-yellow-400 text-black font-black uppercase">
                 <Play className="w-4 h-4 mr-2" /> Start Matches
               </Button>
            )}
            {roomData.status === 'playing' && (
               <div className="text-cyan-400 font-bold animate-pulse">Matches in progress...</div>
            )}
            {roomData.status === 'round_finished' && (
               <Button onClick={proceedToNextRound} className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase">
                 Proceed to Next Round
               </Button>
            )}
            {roomData.status === 'finished' && (
               <div className="text-yellow-400 font-black">Tournament Concluded!</div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {currentMatches.map(m => {
            const md = roomData.matchData[m.id];
            return (
              <Card key={m.id} className={`p-4 glass ${m.winner ? 'border-emerald-500/50' : 'border-slate-700'}`}>
                <div className="space-y-2">
                  <div className={`flex justify-between p-2 rounded-lg ${m.winner?.uid === m.p1?.uid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                     <span className="truncate w-32 font-bold">{m.p1?.displayName}</span>
                     <span>{md?.p1Finished ? (md.p1Score > 0 ? '✓' : '✗') : '...'}</span>
                  </div>
                  <div className={`flex justify-between p-2 rounded-lg ${m.winner?.uid === m.p2?.uid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-300'}`}>
                     <span className="truncate w-32 font-bold">{m.p2?.displayName}</span>
                     <span>{md?.p2Finished ? (md.p2Score > 0 ? '✓' : '✗') : '...'}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Player View - Eliminated
  if (amIEliminated && roomData.status !== 'finished') {
    return (
      <div className="max-w-xl mx-auto mt-20 p-12 glass rounded-3xl border-2 border-danger/50 text-center space-y-6">
        <XCircle className="w-24 h-24 text-danger mx-auto" />
        <h1 className="text-4xl font-black text-danger uppercase tracking-widest">Eliminated</h1>
        <p className="text-slate-400 font-mono">You have been knocked out of the tournament.</p>
        <div className="mt-8 p-4 bg-slate-900 rounded-xl border border-slate-700">
          <p className="text-cyan-400 font-bold animate-pulse">Tournament is still in progress...</p>
        </div>
        <Link href="/student/play" className="block mt-4">
          <Button variant="outline" className="border-slate-600 text-slate-300 w-full hover:bg-slate-800">Return to Hub</Button>
        </Link>
      </div>
    );
  }

  // Player View - Playing Match
  if (roomData.status === 'playing' && myMatch && !myFinished) {
    const q = QUESTIONS[roomData.currentRound % QUESTIONS.length];
    
    return (
      <div className="max-w-3xl mx-auto mt-12 space-y-6">
        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-700">
          <div className="text-yellow-400 font-black uppercase tracking-widest">{roundName}</div>
          <div className="text-cyan-400 animate-pulse font-bold flex items-center gap-2"><Clock className="w-5 h-5"/> Answer quickly!</div>
        </div>

        <Card className="p-8 glass border-yellow-500/30 text-center min-h-[300px]">
          <h2 className="text-2xl font-bold text-white mb-8">{q.q}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {q.opts.map((opt, i) => {
              let btnClass = "bg-slate-800 hover:bg-slate-700 border-slate-700";
              if (showExplanation) {
                if (i === q.ans) btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
                else if (i === selectedAns) btnClass = "bg-danger/20 border-danger text-danger";
              } else if (selectedAns === i) {
                btnClass = "bg-yellow-500/20 border-yellow-500 text-yellow-400";
              }

              return (
                <button
                  key={i}
                  onClick={() => handleAnswer(i, q.ans, myMatch.id, isP1)}
                  disabled={showExplanation}
                  className={`p-4 rounded-xl border-2 font-bold transition-all text-lg ${btnClass}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    );
  }

  // Player View - Waiting for others / Bracket View
  if (roomData.status === 'finished') {
    const finalRoundKey = Object.keys(roomData.bracket).length - 1;
    const finalMatch = roomData.bracket[finalRoundKey][0];
    const isChampion = finalMatch.winner?.uid === myUid;
    
    return (
      <div className="max-w-xl mx-auto mt-20 p-12 glass rounded-3xl border-2 border-yellow-500/50 text-center space-y-6">
        {isChampion ? (
          <>
            <Crown className="w-32 h-32 text-yellow-400 mx-auto animate-bounce" />
            <h1 className="text-5xl font-black text-yellow-400 uppercase tracking-widest text-glow">CHAMPION!</h1>
            <p className="text-xl text-white font-bold">You won the Tournament!</p>
            <p className="text-yellow-400 font-bold text-2xl">+300 EXP</p>
          </>
        ) : (
          <>
            <Trophy className="w-24 h-24 text-slate-500 mx-auto" />
            <h1 className="text-3xl font-black text-white uppercase tracking-widest">Tournament Ended</h1>
            <p className="text-slate-400 font-mono">Winner: {finalMatch.winner?.displayName}</p>
          </>
        )}
        <Link href="/student/play" className="block mt-8">
          <Button variant="outline" className="border-slate-600 text-slate-300 w-full py-4 font-bold uppercase hover:bg-slate-800">
            Back to Hub
          </Button>
        </Link>
      </div>
    );
  }

  // Player View - Bracket View (Waiting for next round)
  return (
    <div className="max-w-4xl mx-auto mt-12 space-y-8 pb-20">
      <div className="text-center">
        <h1 className="text-4xl font-black text-yellow-400 uppercase tracking-widest text-glow mb-2">{roundName}</h1>
        {roomData.status === 'bracket' && <p className="text-cyan-400 font-bold animate-pulse">Waiting for Admin to start matches...</p>}
        {(roomData.status === 'playing' || roomData.status === 'round_finished') && <p className="text-slate-400 font-mono">Waiting for all matches to resolve...</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentMatches.map((m: Match) => {
          const isMyMatch = m.id === myMatch?.id;
          const md = roomData.matchData[m.id];
          return (
            <Card key={m.id} className={`p-4 glass ${isMyMatch ? 'border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'border-slate-800 opacity-80'}`}>
              <div className="flex flex-col gap-2">
                <div className={`flex items-center justify-between p-3 rounded-lg ${m.winner?.uid === m.p1?.uid ? 'bg-emerald-500/20 text-emerald-400 font-black' : m.p1?.uid === myUid ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'bg-slate-900 text-slate-300'}`}>
                  <span className="truncate">{m.p1?.displayName}</span>
                  {md?.p1Finished && <CheckCircle className="w-4 h-4" />}
                </div>
                <div className="text-center text-xs font-black text-slate-600">VS</div>
                <div className={`flex items-center justify-between p-3 rounded-lg ${m.winner?.uid === m.p2?.uid ? 'bg-emerald-500/20 text-emerald-400 font-black' : m.p2?.uid === myUid ? 'bg-cyan-500/20 text-cyan-400 font-bold' : 'bg-slate-900 text-slate-300'}`}>
                  <span className="truncate">{m.p2?.displayName}</span>
                  {md?.p2Finished && <CheckCircle className="w-4 h-4" />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
