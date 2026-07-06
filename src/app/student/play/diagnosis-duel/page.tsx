"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Stethoscope, Users, CheckCircle, Clock, AlertTriangle, ShieldCheck, Microscope, Activity } from 'lucide-react';
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
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { useLiveTracking } from '@/hooks/useLiveTracking';

// Mock Cases
const DEFAULT_CASES = [
  {
    id: 1,
    title: "Case 01: The Drooling Cow",
    symptoms: ["โคเนื้อ อายุ 2 ปี", "มีไข้สูง 40.5 °C", "น้ำลายไหลยืด", "มีแผลหลุดลอกที่ริมฝีปากและเหงือก", "กีบแตก เดินกะเผลก"],
    correct: {
      diag: "FMD",
      lab: "PCR_EPITHELIUM",
      treat: "SUPPORTIVE",
      prev: "VACCINE_BIOSECURITY"
    }
  },
  {
    id: 2,
    title: "Case 02: The Lethargic Puppy",
    symptoms: ["ลูกสุนัข อายุ 3 เดือน (ยังไม่เคยทำวัคซีน)", "ซึม เบื่ออาหาร", "อาเจียนอย่างหนัก", "ท้องเสียมีเลือดปน กลิ่นเหม็นคาว", "ภาวะขาดน้ำรุนแรง"],
    correct: {
      diag: "CPV",
      lab: "SNAP_TEST_FECES",
      treat: "FLUID_ANTIBIOTIC",
      prev: "VACCINE_PROTOCOL"
    }
  }
];

// Options Dictionary
const OPTIONS = {
  diag: [
    { id: "FMD", label: "Foot and Mouth Disease (FMD)" },
    { id: "CPV", label: "Canine Parvovirus (CPV)" },
    { id: "RABIES", label: "Rabies" },
    { id: "PEDV", label: "Porcine Epidemic Diarrhea (PEDV)" }
  ],
  lab: [
    { id: "PCR_EPITHELIUM", label: "เก็บเนื้อเยื่อแผล (Epithelium) ส่ง PCR" },
    { id: "SNAP_TEST_FECES", label: "ใช้ชุดตรวจ Snap Test จากอุจจาระ" },
    { id: "BRAIN_FA", label: "ส่งตรวจสมองด้วยวิธี FA" },
    { id: "BLOOD_SMEAR", label: "เจาะเลือดทำ Blood Smear" }
  ],
  treat: [
    { id: "SUPPORTIVE", label: "รักษาตามอาการ (Supportive Care) และกักกัน" },
    { id: "FLUID_ANTIBIOTIC", label: "ให้สารน้ำทดแทน และยาปฏิชีวนะคุมเชื้อแทรกซ้อน" },
    { id: "EUTHANASIA", label: "การุณยฆาต (Euthanasia) ทันที" },
    { id: "ANTIVIRAL", label: "ให้ยาต้านไวรัสโดยตรง" }
  ],
  prev: [
    { id: "VACCINE_BIOSECURITY", label: "ฉีดวัคซีนรอบจุดเกิดโรค และเข้มงวด Biosecurity" },
    { id: "VACCINE_PROTOCOL", label: "ทำโปรแกรมวัคซีนให้ครบตั้งแต่อายุ 2 เดือน" },
    { id: "CULL_ALL", label: "ทำลายสัตว์ทั้งฟาร์มทันที" },
    { id: "NONE", label: "ปล่อยให้มีภูมิคุ้มกันตามธรรมชาติ" }
  ]
};

const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function DiagnosisDuel() {
  const { user, appUser } = useAuth();
  
  // App State
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Game State
  const [cases, setCases] = useState(DEFAULT_CASES);
  const [myAnswers, setMyAnswers] = useState({ diag: '', lab: '', treat: '', prev: '' });
  const [timeLeft, setTimeLeft] = useState(60);
  
  const myUid = appUser?.uid || user?.uid || '';
  const currentScore = roomData?.players?.[myUid]?.score || 0;
  useLiveTracking('diagnosis-duel', `ห้อง: ${roomData?.roomCode || '-'} | คะแนน: ${currentScore}`);


  useEffect(() => {
    const fetchCases = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'game_content', 'diagnosis_duel'));
        if (docSnap.exists() && docSnap.data().data?.length > 0) {
          setCases(docSnap.data().data);
        }
      } catch (e) {
        console.error("Failed to load custom cases", e);
      }
    };
    fetchCases();
  }, []);

  // Firestore Listener
  useEffect(() => {
    if (!roomCode) return;
    const unsub = onSnapshot(doc(db, 'rooms', roomCode), (docSnap) => {
      if (docSnap.exists()) {
        setRoomData(docSnap.data());
      } else {
        setError('Room not found or closed by host.');
        setRoomCode('');
        setRoomData(null);
      }
    });
    return () => unsub();
  }, [roomCode]);

  // Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (roomData?.status === 'playing' && !roomData?.answers?.[appUser?.uid || user?.uid || '']?.submitted) {
      // Calculate time based on server start time (simplified to local interval for mock)
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setTimeLeft(60);
    }
    return () => clearInterval(timer);
  }, [roomData?.status]);

  const handleCreateRoom = async () => {
    if (!user || !appUser) return;
    setLoading(true);
    const code = generateRoomCode();
    try {
      await setDoc(doc(db, 'rooms', code), {
        id: code,
        gameType: 'diagnosis-duel',
        status: 'waiting',
        hostId: appUser.uid || user.uid,
        players: [{ uid: appUser.uid || user.uid, displayName: appUser.displayName || 'Doctor 1' }],
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
    if (!user || !appUser || !joinCode) return;
    setLoading(true);
    setError('');
    const code = joinCode.toUpperCase();
    try {
      const roomRef = doc(db, 'rooms', code);
      const roomSnap = await getDoc(roomRef);
      if (!roomSnap.exists()) throw new Error('Room not found');
      
      const data = roomSnap.data();
      if (data.gameType !== 'diagnosis-duel') throw new Error('Invalid game type');
      if (data.status !== 'waiting') throw new Error('Game already started');
      if (data.players.length >= 2 && !data.players.find((p:any) => p.uid === (appUser.uid || user.uid))) throw new Error('Room is full');

      await updateDoc(roomRef, {
        players: arrayUnion({ uid: appUser.uid || user.uid, displayName: appUser.displayName || 'Doctor 2' })
      });
      setRoomCode(code);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleStartGame = async () => {
    if (!roomData || roomData.players.length < 2) return;
    // Randomly select a case and start
    const randomCaseId = cases[Math.floor(Math.random() * cases.length)].id;
    await updateDoc(doc(db, 'rooms', roomCode), { 
      status: 'playing',
      caseId: randomCaseId,
      startTime: serverTimestamp(),
      answers: {}
    });
  };

  const handleSelectAnswer = (category: keyof typeof myAnswers, val: string) => {
    sfx.click();
    setMyAnswers(prev => ({ ...prev, [category]: val }));
  };

  const calculateScore = (ans: typeof myAnswers, caseData: typeof CASES[0]) => {
    let score = 0;
    if (ans.diag === caseData.correct.diag) score += 25;
    if (ans.lab === caseData.correct.lab) score += 25;
    if (ans.treat === caseData.correct.treat) score += 25;
    if (ans.prev === caseData.correct.prev) score += 25;
    return score;
  };

  const handleSubmit = async (isAuto = false) => {
    if (!roomData || !roomCode) return;
    sfx.correct();
    
    const caseData = CASES.find(c => c.id === roomData.caseId)!;
    const score = calculateScore(myAnswers, caseData);
    const myUid = appUser?.uid || user?.uid || '';

    await updateDoc(doc(db, 'rooms', roomCode), {
      [`answers.${myUid}`]: {
        ...myAnswers,
        score,
        submitted: true
      }
    });

    // If I'm the second to submit, change status to revealing
    const currentAnswers = roomData.answers || {};
    const otherSubmitted = Object.keys(currentAnswers).filter(k => k !== myUid).length > 0;
    if (otherSubmitted) {
      await updateDoc(doc(db, 'rooms', roomCode), {
        status: 'finished'
      });
    }
  };

  const hasSavedExp = React.useRef(false);
  useEffect(() => {
    if (roomData?.status === 'finished' && !hasSavedExp.current) {
       hasSavedExp.current = true;
       const myUid = appUser?.uid || user?.uid || '';
       const myAns = roomData.answers?.[myUid];
       
       const saveExp = async () => {
         if (myAns?.score && myAns.score > 0) {
            try {
               await updateDoc(doc(db, 'users', myUid), { exp: increment(myAns.score) });
               const { addDoc, collection } = await import('firebase/firestore');
               await addDoc(collection(db, 'users', myUid, 'history'), {
                 gameId: 'diagnosis-duel',
                 gameName: 'Diagnosis Duel',
                 score: myAns.score,
                 expEarned: myAns.score,
                 playedAt: new Date().toISOString()
               });
            } catch(e){}
         }
       };
       saveExp();
    }
  }, [roomData?.status]);

  // Render Logic
  if (!roomCode || !roomData) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 glass rounded-3xl border-2 border-cyan-500/30">
        <div className="text-center mb-8">
          <Stethoscope className="w-16 h-16 text-cyan-400 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-widest text-glow">Diagnosis Duel</h1>
          <p className="text-slate-400 font-mono mt-2">1v1 Veterinary Case Study</p>
        </div>

        {error && <div className="p-3 mb-6 bg-danger/20 text-danger border border-danger rounded-xl text-center text-sm font-bold">{error}</div>}

        <div className="space-y-6">
          <Button onClick={handleCreateRoom} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black py-4 uppercase tracking-widest">
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
              className="w-full bg-slate-900 border-2 border-slate-700 rounded-xl p-4 text-center font-black tracking-widest uppercase text-white focus:border-cyan-500 outline-none"
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
    const isHost = roomData.hostId === (appUser?.uid || user?.uid);
    return (
      <div className="max-w-xl mx-auto mt-20 p-8 glass rounded-3xl border-2 border-cyan-500/50 text-center">
        <h2 className="text-2xl font-black text-slate-300 uppercase tracking-widest mb-2">Room Code</h2>
        <div className="text-6xl font-black text-white tracking-[0.2em] mb-12 text-glow">{roomCode}</div>
        
        <div className="space-y-4 mb-12">
          {roomData.players.map((p:any, i:number) => (
            <div key={i} className="bg-slate-800/50 p-4 rounded-xl flex items-center justify-between border border-slate-700">
              <span className="font-bold text-lg">{p.displayName}</span>
              <span className="text-cyan-400 font-mono flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Ready</span>
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
            className={`w-full py-4 text-xl font-black tracking-widest uppercase ${roomData.players.length === 2 ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.5)]' : 'bg-slate-700 text-slate-400'}`}
          >
            Start Duel
          </Button>
        ) : (
          <div className="text-cyan-500 font-bold animate-pulse uppercase tracking-widest">
            Waiting for host to start...
          </div>
        )}
      </div>
    );
  }

  const activeCase = cases.find(c => c.id === roomData.caseId) || cases[0];
  const mySubmission = roomData.answers?.[myUid];

  if (roomData.status === 'finished') {
    // Determine winner
    const p1 = roomData.players[0];
    const p2 = roomData.players[1];
    const p1Score = roomData.answers?.[p1.uid]?.score || 0;
    const p2Score = roomData.answers?.[p2.uid]?.score || 0;
    
    let winnerText = "It's a Tie!";
    if (p1Score > p2Score) winnerText = `${p1.displayName} Wins!`;
    else if (p2Score > p1Score) winnerText = `${p2.displayName} Wins!`;

    const myScore = myUid === p1.uid ? p1Score : p2Score;

    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 glass rounded-3xl border-2 border-secondary/50 text-center space-y-8">
        <h1 className="text-4xl font-black text-glow uppercase text-secondary">Duel Finished!</h1>
        <div className="text-3xl font-black text-white">{winnerText}</div>
        
        <div className="grid grid-cols-2 gap-8">
          <div className={`p-6 rounded-2xl border-2 ${myUid === p1.uid ? 'bg-secondary/20 border-secondary' : 'bg-slate-800 border-slate-700'}`}>
            <div className="text-xl font-bold mb-2">{p1.displayName}</div>
            <div className="text-4xl font-black text-secondary">{p1Score}</div>
            <div className="text-sm font-mono text-slate-400 mt-2">Accuracy: {p1Score}%</div>
          </div>
          <div className={`p-6 rounded-2xl border-2 ${myUid === p2.uid ? 'bg-secondary/20 border-secondary' : 'bg-slate-800 border-slate-700'}`}>
            <div className="text-xl font-bold mb-2">{p2.displayName}</div>
            <div className="text-4xl font-black text-secondary">{p2Score}</div>
            <div className="text-sm font-mono text-slate-400 mt-2">Accuracy: {p2Score}%</div>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-2xl text-left border border-slate-700 space-y-4">
          <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-center">Correct Answers</h3>
          <div><span className="text-slate-400 w-24 inline-block">Diagnosis:</span> <span className="font-bold text-white">{OPTIONS.diag.find(o=>o.id===activeCase.correct.diag)?.label}</span></div>
          <div><span className="text-slate-400 w-24 inline-block">Lab Test:</span> <span className="font-bold text-white">{OPTIONS.lab.find(o=>o.id===activeCase.correct.lab)?.label}</span></div>
          <div><span className="text-slate-400 w-24 inline-block">Treatment:</span> <span className="font-bold text-white">{OPTIONS.treat.find(o=>o.id===activeCase.correct.treat)?.label}</span></div>
          <div><span className="text-slate-400 w-24 inline-block">Prevention:</span> <span className="font-bold text-white">{OPTIONS.prev.find(o=>o.id===activeCase.correct.prev)?.label}</span></div>
        </div>

        <p className="text-secondary font-bold">You earned {myScore} EXP!</p>

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

  // PLAYING STATE
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 pt-4 px-2">
      <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div className="font-bold text-cyan-400 text-glow flex items-center gap-2 uppercase tracking-widest">
          <Stethoscope className="w-5 h-5" /> Diagnosis Duel
        </div>
        <div className="flex items-center gap-4">
          {roomData.players.map((p:any, i:number) => (
             <div key={i} className={`text-sm font-bold px-3 py-1 rounded-full flex items-center gap-1 ${roomData.answers?.[p.uid]?.submitted ? 'bg-secondary text-black' : 'bg-slate-800 text-slate-400'}`}>
                {p.displayName} {roomData.answers?.[p.uid]?.submitted && <CheckCircle className="w-4 h-4"/>}
             </div>
          ))}
        </div>
        <div className={`font-black text-2xl flex items-center gap-2 ${timeLeft <= 10 ? 'text-danger animate-pulse' : 'text-white'}`}>
          <Clock className="w-6 h-6" /> {timeLeft}s
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Case Info */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="p-6 glass border-cyan-500/30">
            <h2 className="text-xl font-black text-cyan-400 mb-4">{activeCase.title}</h2>
            <div className="space-y-2">
              {activeCase.symptoms.map((sym, i) => (
                <div key={i} className="flex items-start gap-2 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                   <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                   <span className="text-slate-200">{sym}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Actions */}
        <div className="lg:col-span-2 space-y-6">
          {mySubmission ? (
            <Card className="p-12 glass border-secondary/30 text-center flex flex-col items-center justify-center">
              <CheckCircle className="w-20 h-20 text-secondary mb-6 animate-bounce" />
              <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2">Diagnosis Submitted</h2>
              <p className="text-slate-400 font-mono">Waiting for opponent to finish...</p>
            </Card>
          ) : (
            <Card className="p-6 glass border-slate-700 space-y-8">
              {/* Category: Diagnosis */}
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Search className="w-4 h-4" /> 1. Diagnosis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {OPTIONS.diag.map(opt => (
                    <div 
                      key={opt.id} 
                      onClick={() => handleSelectAnswer('diag', opt.id)}
                      className={`p-3 rounded-xl cursor-pointer text-sm font-bold text-center transition-colors border-2 ${myAnswers.diag === opt.id ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Lab Test */}
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Microscope className="w-4 h-4" /> 2. Lab Test
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {OPTIONS.lab.map(opt => (
                    <div 
                      key={opt.id} 
                      onClick={() => handleSelectAnswer('lab', opt.id)}
                      className={`p-3 rounded-xl cursor-pointer text-sm font-bold text-center transition-colors border-2 ${myAnswers.lab === opt.id ? 'bg-purple-500/20 border-purple-400 text-purple-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Treatment */}
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> 3. Treatment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {OPTIONS.treat.map(opt => (
                    <div 
                      key={opt.id} 
                      onClick={() => handleSelectAnswer('treat', opt.id)}
                      className={`p-3 rounded-xl cursor-pointer text-sm font-bold text-center transition-colors border-2 ${myAnswers.treat === opt.id ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Prevention */}
              <div>
                <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> 4. Prevention
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {OPTIONS.prev.map(opt => (
                    <div 
                      key={opt.id} 
                      onClick={() => handleSelectAnswer('prev', opt.id)}
                      className={`p-3 rounded-xl cursor-pointer text-sm font-bold text-center transition-colors border-2 ${myAnswers.prev === opt.id ? 'bg-orange-500/20 border-orange-400 text-orange-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800">
                <Button 
                  onClick={() => handleSubmit(false)}
                  disabled={!myAnswers.diag || !myAnswers.lab || !myAnswers.treat || !myAnswers.prev}
                  className="w-full py-4 text-lg font-black uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 text-white disabled:bg-slate-800 disabled:text-slate-500"
                >
                  Submit Final Diagnosis
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
