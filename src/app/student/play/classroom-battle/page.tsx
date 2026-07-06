"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Server, ShieldAlert, Trophy, Clock, XCircle, CheckCircle, BarChart3 } from 'lucide-react';
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

const DEFAULT_QUESTIONS = [
  { q: "สัตว์ชนิดใดไม่ติดเชื้อ FMD?", opts: ["โค", "สุกร", "ม้า", "แพะ"], ans: 2 },
  { q: "เชื้อ FMD เป็นเชื้อกลุ่มใด?", opts: ["DNA Virus", "RNA Virus", "Bacteria", "Fungi"], ans: 1 },
];

const TIME_PER_QUESTION_MS = 20000;
const generateRoomCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function ClassroomBattle() {
  const { appUser, user } = useAuth();
  const myUid = appUser?.uid || user?.uid || '';
  const myName = appUser?.displayName || 'Student';
  
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isHostMode, setIsHostMode] = useState(false);
  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);

  // Match State
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);

  const currentScore = roomData?.players?.[myUid]?.score || 0;
  useLiveTracking('classroom-battle', `สถานะ: ${roomData?.state || 'waiting'} | ห้อง: ${roomData?.roomCode || '-'} | คะแนน: ${currentScore}`);


  // Fetch Questions from Firestore
  useEffect(() => {
    const fetchQ = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'game_content', 'classroom_battle'));
        if (docSnap.exists() && docSnap.data().questions?.length > 0) {
          setQuestions(docSnap.data().questions);
        }
      } catch (e) {
        console.error("Failed to load custom questions", e);
      }
    };
    fetchQ();
  }, []);
  
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomCode), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        
        // Reset selected answer if moving to a new question
        if (data.status === 'question' && roomData?.status !== 'question') {
          setSelectedAns(null);
        }
      } else {
        setError('Room closed by Admin.');
        setRoomCode('');
        setRoomData(null);
      }
    });
    return () => unsub();
  }, [roomCode, roomData?.status]);

  // Timer logic for students
  useEffect(() => {
    if (!isHostMode && roomData?.status === 'question' && roomData?.questionStartTime) {
      const interval = setInterval(() => {
        const startTime = roomData.questionStartTime; // In Ms since epoch (saved by host)
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, Math.ceil((TIME_PER_QUESTION_MS - elapsed) / 1000));
        setTimeLeft(remaining);
        
        if (remaining === 0 && selectedAns === null) {
          // Auto submit empty/wrong answer if time runs out
          handleAnswer(-1);
        }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [roomData?.status, roomData?.questionStartTime, isHostMode, selectedAns]);

  // ================= ADMIN CONTROLS =================

  const handleCreateRoom = async () => {
    if (!myUid) return;
    setLoading(true);
    const code = generateRoomCode();
    try {
      await setDoc(doc(db, 'rooms', code), {
        id: code,
        gameType: 'classroom-battle',
        status: 'lobby',
        hostId: myUid,
        players: [],
        scores: {}, // { uid: number }
        accuracy: {}, // { uid: { correct: number, total: number } }
        answers: {}, // { uid: { qIndex: { ans: number, time: number } } }
        currentQuestionIndex: -1,
        createdAt: serverTimestamp()
      });
      setRoomCode(code);
      setIsHostMode(true);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleStartNextQuestion = async () => {
    const nextQ = roomData.currentQuestionIndex + 1;
    if (nextQ >= questions.length) {
      await updateDoc(doc(db, 'rooms', roomCode), { status: 'finished' });
      return;
    }
    await updateDoc(doc(db, 'rooms', roomCode), {
      status: 'question',
      currentQuestionIndex: nextQ,
      questionStartTime: Date.now() // Use client timestamp for simple sync
    });
  };

  const handleShowLeaderboard = async () => {
    await updateDoc(doc(db, 'rooms', roomCode), { status: 'leaderboard' });
  };

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
      if (data.gameType !== 'classroom-battle') throw new Error('Invalid game type');
      if (data.status !== 'lobby') throw new Error('Game already started');
      if (data.players.find((p:any) => p.uid === myUid)) throw new Error('Already in room');

      await updateDoc(roomRef, {
        players: arrayUnion({ uid: myUid, displayName: myName }),
        [`scores.${myUid}`]: 0,
        [`accuracy.${myUid}`]: { correct: 0, total: 0 }
      });
      setRoomCode(code);
      setIsHostMode(false);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleAnswer = async (optIndex: number) => {
    if (selectedAns !== null) return;
    setSelectedAns(optIndex);
    
    const qIndex = roomData.currentQuestionIndex;
    const q = questions[qIndex];
    const isCorrect = optIndex === q.ans;
    
    const timeUsedMs = Date.now() - roomData.questionStartTime;
    const timeRatio = Math.max(0, 1 - (timeUsedMs / TIME_PER_QUESTION_MS)); // 1.0 = fast, 0.0 = slow
    
    let points = 0;
    if (isCorrect) {
      sfx.correct();
      points = 500 + Math.floor(500 * timeRatio); // Max 1000 pts
    } else {
      sfx.wrong();
    }

    try {
      await updateDoc(doc(db, 'rooms', roomCode), {
        [`scores.${myUid}`]: increment(points),
        [`accuracy.${myUid}.total`]: increment(1),
        [`accuracy.${myUid}.correct`]: increment(isCorrect ? 1 : 0),
        [`answers.${myUid}.${qIndex}`]: { ans: optIndex, time: timeUsedMs, correct: isCorrect }
      });
    } catch(e) { console.error(e) }
  };

  // Give EXP on finish
  useEffect(() => {
    if (!isHostMode && roomData?.status === 'finished') {
       sfx.levelUp();
       const save = async () => {
         try {
           const earnedExp = roomData.scores[myUid] || 0;
           await updateDoc(doc(db, 'users', myUid), { exp: increment(earnedExp) });
           const { addDoc, collection } = await import('firebase/firestore');
           await addDoc(collection(db, 'users', myUid, 'history'), {
             gameId: 'classroom-battle',
             gameName: 'Classroom Battle',
             score: earnedExp,
             expEarned: earnedExp,
             playedAt: new Date().toISOString()
           });
         } catch(e) {}
       };
       save();
    }
  }, [roomData?.status, isHostMode]);

  // ================= RENDER LOGIC =================

  if (!roomCode || !roomData) {
    return (
      <div className="max-w-4xl mx-auto mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        {error && <div className="col-span-1 md:col-span-2 p-3 bg-danger/20 text-danger border border-danger rounded-xl text-center text-sm font-bold">{error}</div>}

        {/* Student Join */}
        <Card className="p-8 glass border-pink-500/30 flex flex-col items-center justify-center space-y-6">
          <Users className="w-16 h-16 text-pink-400 mb-2 animate-pulse" />
          <h2 className="text-3xl font-black text-pink-400 uppercase tracking-widest text-glow">Join Battle</h2>
          <form onSubmit={handleJoinRoom} className="w-full space-y-4">
            <input 
              type="text" 
              placeholder="ENTER 6-CHAR PIN" 
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-center font-black tracking-widest uppercase text-white focus:border-pink-500 outline-none"
              maxLength={6}
            />
            <Button type="submit" disabled={loading || joinCode.length !== 6} className="w-full bg-pink-600 hover:bg-pink-500 text-white font-black py-4 uppercase tracking-widest">
              Join Classroom
            </Button>
          </form>
        </Card>

        {/* Admin Host */}
        <Card className="p-8 glass border-yellow-500/30 flex flex-col items-center justify-center space-y-6">
          <ShieldAlert className="w-16 h-16 text-yellow-400 mb-2" />
          <h2 className="text-3xl font-black text-yellow-400 uppercase tracking-widest text-glow">Teacher Host</h2>
          <p className="text-slate-400 text-sm text-center mb-4">Create a live classroom battle for your students.</p>
          <Button onClick={handleCreateRoom} disabled={loading} className="w-full mt-4 bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 uppercase tracking-widest">
            Create Room
          </Button>
        </Card>
      </div>
    );
  }

  // Lobby
  if (roomData.status === 'lobby') {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-8 glass rounded-3xl border-2 border-pink-500/50 text-center">
        <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest mb-2">Classroom PIN</h2>
        <div className="text-7xl font-black text-white tracking-[0.2em] mb-4 text-glow">{roomCode}</div>
        <p className="text-pink-400 font-bold mb-8 text-xl">{roomData.players.length} Players Joined</p>
        
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {roomData.players.map((p:any, i:number) => (
            <motion.div initial={{scale:0}} animate={{scale:1}} key={i} className="bg-slate-800 px-4 py-2 rounded-xl text-md font-bold text-white border border-slate-700 shadow-lg">
              {p.displayName}
            </motion.div>
          ))}
          {roomData.players.length === 0 && (
            <div className="text-slate-500 font-mono">Waiting for students...</div>
          )}
        </div>

        {isHostMode ? (
          <Button onClick={handleStartNextQuestion} disabled={roomData.players.length === 0} className="w-full max-w-md mx-auto py-4 text-2xl font-black tracking-widest uppercase bg-pink-500 hover:bg-pink-400 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            Start First Question
          </Button>
        ) : (
          <div className="text-cyan-500 font-bold animate-pulse text-xl uppercase tracking-widest">
            Waiting for teacher to start...
          </div>
        )}
      </div>
    );
  }

  // Get Sorted Leaderboard
  const sortedPlayers = [...roomData.players].sort((a, b) => (roomData.scores[b.uid] || 0) - (roomData.scores[a.uid] || 0));

  // Question View
  if (roomData.status === 'question') {
    const qIndex = roomData.currentQuestionIndex;
    const q = questions[qIndex];
    
    // Check how many have answered
    const answerCount = Object.keys(roomData.answers).filter(uid => roomData.answers[uid][qIndex]).length;
    const allAnswered = answerCount === roomData.players.length;

    if (isHostMode) {
      return (
        <div className="max-w-4xl mx-auto mt-12 space-y-8 text-center">
          <div className="flex justify-between items-center bg-slate-900 p-4 rounded-xl border border-slate-700">
             <div className="font-bold text-pink-400 uppercase tracking-widest">Question {qIndex + 1} / {questions.length}</div>
             <div className="text-white font-bold">{answerCount} / {roomData.players.length} Answers</div>
          </div>
          
          <Card className="p-12 glass border-pink-500/30 min-h-[400px] flex flex-col justify-center">
            <h2 className="text-4xl font-black text-white mb-12">{q.q}</h2>
            {allAnswered ? (
              <Button onClick={handleShowLeaderboard} className="mx-auto w-64 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 uppercase animate-pulse">
                Show Results
              </Button>
            ) : (
              <div className="text-cyan-400 font-bold text-2xl animate-pulse flex items-center justify-center gap-2">
                <Clock className="w-8 h-8"/> Waiting for answers...
              </div>
            )}
          </Card>
        </div>
      );
    }

    // Student Question View
    return (
      <div className="max-w-3xl mx-auto mt-12 space-y-6">
        <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-700">
          <div className="text-pink-400 font-black uppercase tracking-widest">Q{qIndex + 1}</div>
          <div className="flex items-center gap-2">
            <Clock className={`w-6 h-6 ${timeLeft <= 5 ? 'text-danger animate-ping' : 'text-cyan-400'}`} />
            <span className={`text-2xl font-black ${timeLeft <= 5 ? 'text-danger' : 'text-white'}`}>{timeLeft}s</span>
          </div>
          <div className="text-yellow-400 font-bold">Score: {roomData.scores[myUid] || 0}</div>
        </div>

        <Card className="p-8 glass border-pink-500/30 text-center min-h-[300px]">
          {selectedAns === null ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-8">{q.q}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.opts.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(i)}
                    className="p-6 rounded-xl border-2 font-bold transition-all text-xl bg-slate-800 hover:bg-slate-700 border-slate-700"
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 space-y-4">
              <CheckCircle className="w-24 h-24 text-emerald-500 mx-auto" />
              <h2 className="text-3xl font-black text-white uppercase tracking-widest">Answer Submitted</h2>
              <p className="text-slate-400">Waiting for teacher to show results...</p>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // Leaderboard / Mid-game Results
  if (roomData.status === 'leaderboard') {
    const qIndex = roomData.currentQuestionIndex;
    const q = questions[qIndex];
    
    if (isHostMode) {
      return (
        <div className="max-w-4xl mx-auto mt-8 space-y-8 text-center pb-20">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex justify-between items-center">
            <div className="font-bold text-pink-400 uppercase tracking-widest">Results: Q{qIndex + 1}</div>
            <Button onClick={handleStartNextQuestion} className="bg-pink-500 hover:bg-pink-400 text-white font-black uppercase">
              {qIndex + 1 >= questions.length ? 'Show Final Winners' : 'Next Question'}
            </Button>
          </div>

          <Card className="p-8 glass border-yellow-500/30">
            <h2 className="text-3xl font-black text-white mb-4">{q.q}</h2>
            <div className="text-emerald-400 font-bold text-xl mb-8">Correct Answer: {q.opts[q.ans]}</div>
            
            <div className="space-y-3 mt-8 text-left">
              <h3 className="text-xl font-bold text-slate-300 mb-4 flex items-center gap-2"><BarChart3/> Top 5 Leaderboard</h3>
              {sortedPlayers.slice(0,5).map((p, i) => {
                const score = roomData.scores[p.uid] || 0;
                return (
                  <div key={p.uid} className={`flex justify-between items-center p-4 rounded-xl ${i===0 ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-slate-800'}`}>
                    <div className="flex items-center gap-4">
                      <span className={`text-2xl font-black ${i===0 ? 'text-yellow-400' : 'text-slate-400'}`}>#{i+1}</span>
                      <span className="font-bold text-white text-lg">{p.displayName}</span>
                    </div>
                    <div className="font-black text-yellow-400 text-xl">{score} pts</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      );
    }

    // Student Leaderboard View
    const myRank = sortedPlayers.findIndex(p => p.uid === myUid) + 1;
    const myAnswerData = roomData.answers[myUid]?.[qIndex];
    const isCorrect = myAnswerData?.correct;

    return (
      <div className="max-w-xl mx-auto mt-12 p-8 glass rounded-3xl border-2 border-slate-700 text-center space-y-6">
        {isCorrect ? (
          <>
            <CheckCircle className="w-24 h-24 text-emerald-400 mx-auto" />
            <h1 className="text-4xl font-black text-emerald-400 uppercase tracking-widest text-glow">Correct!</h1>
            <p className="text-emerald-400 font-bold text-xl">+{roomData.scores[myUid] - (roomData.scores[myUid] || 0)} Points (Speed Bonus!)</p>
          </>
        ) : (
          <>
            <XCircle className="w-24 h-24 text-danger mx-auto" />
            <h1 className="text-4xl font-black text-danger uppercase tracking-widest text-glow">Incorrect</h1>
            <p className="text-slate-400">The correct answer was: {q.opts[q.ans]}</p>
          </>
        )}
        
        <div className="mt-8 p-6 bg-slate-900 rounded-xl border border-slate-700">
          <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Current Rank</div>
          <div className="text-5xl font-black text-yellow-400 mb-2">#{myRank}</div>
          <div className="text-slate-300 font-mono text-sm">Total Score: {roomData.scores[myUid] || 0}</div>
        </div>

        <p className="text-cyan-400 animate-pulse mt-8 font-bold">Waiting for teacher to continue...</p>
      </div>
    );
  }

  // Finished (Final Podium)
  if (roomData.status === 'finished') {
    return (
      <div className="max-w-4xl mx-auto mt-12 text-center pb-20">
        <Trophy className="w-32 h-32 text-yellow-400 mx-auto mb-6" />
        <h1 className="text-5xl font-black text-yellow-400 uppercase tracking-widest text-glow mb-12">Final Results</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end mb-12">
          {/* Rank 2 */}
          {sortedPlayers[1] && (
            <div className="order-2 md:order-1 bg-slate-800/80 p-6 rounded-t-3xl border-t-4 border-slate-400 h-48 flex flex-col justify-end relative pb-4">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-black text-slate-300 text-xl border-4 border-slate-800">2</div>
              <div className="font-bold text-white text-xl truncate">{sortedPlayers[1].displayName}</div>
              <div className="text-slate-400 font-black">{roomData.scores[sortedPlayers[1].uid] || 0} pts</div>
            </div>
          )}
          {/* Rank 1 */}
          {sortedPlayers[0] && (
            <div className="order-1 md:order-2 bg-yellow-500/20 p-6 rounded-t-3xl border-t-4 border-yellow-400 h-64 flex flex-col justify-end relative pb-4 shadow-[0_0_30px_rgba(234,179,8,0.3)]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center font-black text-black text-3xl border-4 border-slate-900">1</div>
              <div className="font-bold text-white text-2xl truncate mb-1">{sortedPlayers[0].displayName}</div>
              <div className="text-yellow-400 font-black text-xl">{roomData.scores[sortedPlayers[0].uid] || 0} pts</div>
              <div className="text-xs text-emerald-400 mt-2 font-mono">
                Accuracy: {Math.round(((roomData.accuracy[sortedPlayers[0].uid]?.correct || 0) / (roomData.accuracy[sortedPlayers[0].uid]?.total || 1)) * 100)}%
              </div>
            </div>
          )}
          {/* Rank 3 */}
          {sortedPlayers[2] && (
            <div className="order-3 md:order-3 bg-slate-800/80 p-6 rounded-t-3xl border-t-4 border-orange-700 h-40 flex flex-col justify-end relative pb-4">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center font-black text-orange-700 text-xl border-4 border-slate-800">3</div>
              <div className="font-bold text-white text-xl truncate">{sortedPlayers[2].displayName}</div>
              <div className="text-slate-400 font-black">{roomData.scores[sortedPlayers[2].uid] || 0} pts</div>
            </div>
          )}
        </div>

        <Link href="/student/play" className="inline-block mt-8">
          <Button variant="outline" className="border-slate-600 text-slate-300 py-4 px-12 font-bold uppercase tracking-widest hover:bg-slate-800">
            Exit Battle
          </Button>
        </Link>
      </div>
    );
  }

  return null;
}
