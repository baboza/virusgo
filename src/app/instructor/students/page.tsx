"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, AlertCircle, Shield, MoreVertical, RefreshCcw, Trash2, X, Gamepad2, Clock, Calendar, Target, Activity, Zap } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { User as AppUser } from '@/types';

export default function StudentProgressPage() {
  const { appUser, loading: authLoading } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<AppUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [selectedStudent, setSelectedStudent] = useState<AppUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [studentHistory, setStudentHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'manage'>('profile');

  // Fetch History when student selected
  useEffect(() => {
    if (!selectedStudent) {
      setStudentHistory([]);
      return;
    }
    const fetchHistory = async () => {
      setHistoryLoading(true);
      try {
        const histRef = collection(db, 'users', selectedStudent.uid, 'history');
        const histSnap = await getDocs(histRef);
        const h: any[] = [];
        histSnap.forEach(d => h.push(d.data()));
        h.sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime());
        setStudentHistory(h);
      } catch (e) {
        console.error(e);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [selectedStudent]);

  const fetchStudents = async () => {
    if (authLoading) return;
    if (!appUser || appUser.role !== 'instructor') return;

    try {
      const usersRef = collection(db, 'users');
      const qStudents = query(usersRef, where("role", "==", "student"));
      const studentsSnap = await getDocs(qStudents);
      
      let studentsList: AppUser[] = [];
      studentsSnap.forEach((d) => {
        studentsList.push(d.data() as AppUser);
      });

      // Sort by level/exp descending
      studentsList.sort((a, b) => {
        const aTotal = ((a.level || 1) * 1000) + (a.exp || 0);
        const bTotal = ((b.level || 1) * 1000) + (b.exp || 0);
        return bTotal - aTotal;
      });

      setStudents(studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [appUser, authLoading]);

  const handleResetExp = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`ยืนยันการรีเซ็ต EXP ของ ${selectedStudent.fullname} กลับเป็น 0 หรือไม่?`)) return;
    
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', selectedStudent.uid);
      await updateDoc(userRef, {
        exp: 0,
        level: 1
      });
      alert('รีเซ็ตคะแนนสำเร็จ!');
      setSelectedStudent(null);
      fetchStudents(); // Refresh data
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setIsProcessing(false);
  };

  const handleDeleteUser = async () => {
    if (!selectedStudent) return;
    if (!window.confirm(`⚠️ คำเตือน: ยืนยันการลบ ${selectedStudent.fullname} ออกจากระบบ? การกระทำนี้ไม่สามารถย้อนกลับได้`)) return;
    
    setIsProcessing(true);
    try {
      const userRef = doc(db, 'users', selectedStudent.uid);
      await deleteDoc(userRef);
      alert('ลบนิสิตออกจากระบบสำเร็จ!');
      setSelectedStudent(null);
      fetchStudents(); // Refresh data
    } catch (e: any) {
      alert("Error: " + e.message);
    }
    setIsProcessing(false);
  };

  // Filter students based on search query
  const filteredStudents = students.filter(student => 
    student.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <div className="text-slate-400 font-mono tracking-widest animate-pulse uppercase">Querying Student Database...</div>
      </div>
    );
  }

  if (!appUser) return null;

  return (
    <div className="space-y-8 relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            ข้อมูลรายชื่อนิสิต (Student Progress)
          </h1>
          <p className="text-slate-500 mt-2">ตรวจสอบพัฒนาการและประวัติการเรียนรู้ของนิสิตในระบบทั้งหมด</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-xl leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-800 focus:border-primary focus:ring-1 focus:ring-primary sm:text-sm transition-colors"
            placeholder="ค้นหาชื่อ หรือ อีเมล..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Table Card */}
      <Card className="p-0 overflow-hidden glass border-slate-700 bg-slate-900/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400 font-mono">
                <th className="px-6 py-4 font-semibold">รายชื่อ (Cadet Profile)</th>
                <th className="px-6 py-4 font-semibold text-center">ระดับ (Level)</th>
                <th className="px-6 py-4 font-semibold">พัฒนาการ (Progress)</th>
                <th className="px-6 py-4 font-semibold">วันที่เข้าร่วม</th>
                <th className="px-6 py-4 text-right font-semibold">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student, idx) => {
                  const level = student.level || 1;
                  const exp = student.exp || 0;
                  const nextLevelExp = level * 100;
                  const progressPercentage = Math.min(100, Math.max(0, (exp / nextLevelExp) * 100));
                  
                  return (
                    <motion.tr 
                      key={student.uid}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Name & Email */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0 border border-slate-700 group-hover:border-primary/50 transition-colors overflow-hidden">
                            {student.photoURL ? (
                              <img src={student.photoURL} alt={student.fullname} className="w-full h-full object-cover" />
                            ) : (
                              <Shield className="w-5 h-5 text-primary/70" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-200">{student.fullname}</div>
                            <div className="text-xs text-slate-500">{student.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Level Badge */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center bg-primary/20 border border-primary/30 text-primary font-black px-3 py-1 rounded-lg text-sm shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                          LVL {level}
                        </div>
                      </td>

                      {/* EXP Bar */}
                      <td className="px-6 py-4 w-[30%]">
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-slate-400">EXP</span>
                            <span className="text-primary">{exp} / {nextLevelExp}</span>
                          </div>
                          <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-700 overflow-hidden relative">
                            <motion.div 
                              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-600 to-primary"
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPercentage}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Join Date */}
                      <td className="px-6 py-4 text-sm text-slate-400 font-mono">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString('th-TH') : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <Button 
                          onClick={() => setSelectedStudent(student)}
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-500 hover:text-white rounded-full hover:bg-primary/20"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <AlertCircle className="w-8 h-8 text-slate-600" />
                      <p className="font-mono text-sm uppercase tracking-widest">
                        {searchQuery ? "ไม่พบรายชื่อนิสิตที่ค้นหา" : "ยังไม่มีนิสิตในระบบ"}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manage Student Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <button 
                onClick={() => { setSelectedStudent(null); setModalTab('profile'); }}
                className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              {/* Header Info */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                  {selectedStudent.photoURL ? (
                    <img src={selectedStudent.photoURL} alt={selectedStudent.fullname} className="w-full h-full object-cover" />
                  ) : (
                    <Shield className="w-10 h-10 text-primary/70" />
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedStudent.fullname}</h3>
                  <p className="text-slate-400 text-sm mb-1">{selectedStudent.email}</p>
                  <div className="flex gap-3 text-sm font-bold">
                    <span className="text-primary flex items-center gap-1"><Target className="w-4 h-4" /> Level {selectedStudent.level || 1}</span>
                    <span className="text-accent flex items-center gap-1"><Zap className="w-4 h-4" /> {selectedStudent.exp || 0} EXP</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-800 mb-6">
                <button 
                  onClick={() => setModalTab('profile')}
                  className={`px-4 py-2 font-bold text-sm tracking-wide border-b-2 transition-colors ${modalTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                  ประวัติการเล่น (History)
                </button>
                <button 
                  onClick={() => setModalTab('manage')}
                  className={`px-4 py-2 font-bold text-sm tracking-wide border-b-2 transition-colors ${modalTab === 'manage' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-white'}`}
                >
                  จัดการ (Manage)
                </button>
              </div>
              
              {/* Profile & History Tab */}
              {modalTab === 'profile' && (
                <div className="space-y-6">
                  {historyLoading ? (
                    <div className="flex justify-center py-10">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                            <Gamepad2 className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-widest">เล่นเกมทั้งหมด</p>
                            <p className="text-2xl font-black text-white">{studentHistory.length} <span className="text-sm font-normal text-slate-500">ครั้ง</span></p>
                          </div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-xl flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Activity className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-slate-400 text-xs uppercase tracking-widest">EXP รวมจากเกม</p>
                            <p className="text-2xl font-black text-white">{studentHistory.reduce((sum, h) => sum + (h.expEarned || 0), 0)}</p>
                          </div>
                        </div>
                      </div>

                      {/* History List */}
                      <div>
                        <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2 uppercase tracking-widest">
                          <Clock className="w-4 h-4 text-slate-400" />
                          ประวัติการเล่นล่าสุด
                        </h4>
                        <div className="space-y-3">
                          {studentHistory.length > 0 ? (
                            studentHistory.slice(0, 10).map((h, i) => (
                              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 border border-slate-800 hover:bg-slate-800/60 transition-colors">
                                <div>
                                  <p className="text-white font-bold">{h.gameName || h.gameId}</p>
                                  <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(h.playedAt).toLocaleString('th-TH')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-accent font-black">+{h.expEarned} EXP</p>
                                  <p className="text-xs text-slate-500">คะแนน: {h.score}</p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-slate-500 border border-dashed border-slate-700 rounded-xl">
                              ยังไม่มีประวัติการเล่นเกม
                            </div>
                          )}
                          {studentHistory.length > 10 && (
                            <p className="text-center text-xs text-slate-500 mt-2">แสดงผล 10 รายการล่าสุด</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Manage Tab */}
              {modalTab === 'manage' && (
                <div className="space-y-4">
                  <Button 
                    onClick={handleResetExp}
                    disabled={isProcessing}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white justify-start py-6"
                  >
                    <RefreshCcw className="w-5 h-5 mr-4 text-blue-400" />
                    <div className="text-left">
                      <p className="font-bold">รีเซ็ต EXP กลับเป็น 0</p>
                      <p className="text-xs text-slate-400 font-normal">เริ่มเก็บคะแนนใหม่ตั้งแต่ Level 1</p>
                    </div>
                  </Button>
                  
                  <div className="pt-6 mt-6 border-t border-slate-800">
                    <Button 
                      onClick={handleDeleteUser}
                      disabled={isProcessing}
                      className="w-full bg-danger/10 hover:bg-danger/20 text-danger border border-danger/30 justify-start py-6"
                    >
                      <Trash2 className="w-5 h-5 mr-4" />
                      <div className="text-left">
                        <p className="font-bold">ลบนิสิตออกจากระบบ</p>
                        <p className="text-xs font-normal opacity-70">การลบข้อมูลจะไม่สามารถกู้คืนได้ และลบประวัติการเล่นทั้งหมด</p>
                      </div>
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
