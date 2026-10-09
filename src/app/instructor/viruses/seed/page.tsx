"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Database, CheckCircle, AlertTriangle, ArrowLeft, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { collection, getDocs, setDoc, doc, query, where, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

import { MASTER_CORE_VIRUSES as SEED_DATA } from '@/data/seedVirusesData';


export default function VirusSeedDatabase() {
  const { appUser } = useAuth();
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleSeed = async () => {
    if (!window.confirm('ดำเนินการอัปเดต/เพิ่มฐานข้อมูล Core Viruses 30 ชนิด?')) return;
    setIsRunning(true);
    setIsCompleted(false);
    setLogs(["🚀 กำลังเริ่มต้นกระบวนการ Upsert (อัปเดตของเดิม / เพิ่มของใหม่) ..."]);

    const virusRef = collection(db, 'viruses');
    let added = 0;
    let updated = 0;

    for (let i = 0; i < SEED_DATA.length; i++) {
      const v = SEED_DATA[i];
      try {
        // Query to check if virus exists by name
        const q = query(virusRef, where("virusName", "==", v.virusName));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          // Update the first matching virus
          const existingDoc = snapshot.docs[0];
          await setDoc(doc(db, 'viruses', existingDoc.id), {
            ...v,
            virusID: existingDoc.id, // Preserve existing ID
          }, { merge: true });
          updated++;
          setLogs(prev => [...prev, `[UPDATED] อัปเดตข้อมูล: ${v.virusName}`]);
        } else {
          // Create new
          const newDocRef = doc(virusRef);
          await setDoc(newDocRef, {
            ...v,
            virusID: newDocRef.id
          });
          added++;
          setLogs(prev => [...prev, `[ADDED] เพิ่มไวรัสใหม่: ${v.virusName}`]);
        }
      } catch (e: any) {
        setLogs(prev => [...prev, `[ERROR] เกิดข้อผิดพลาดกับ ${v.virusName}: ${e.message}`]);
      }
    }

    setLogs(prev => [...prev, `✅ เสร็จสิ้น! เพิ่มใหม่: ${added} ชนิด | อัปเดต: ${updated} ชนิด`]);
    setIsRunning(false);
    setIsCompleted(true);
  };

  if (appUser?.role !== 'instructor') {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <Link href="/instructor/viruses" className="inline-flex items-center text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-5 h-5 mr-2" /> กลับไปหน้าคลังไวรัส
      </Link>

      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 glass-neon shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Database className="w-64 h-64 text-accent" />
        </div>
        
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-accent" /> 
          Database Seeding (Upsert Mode)
        </h1>
        <p className="text-slate-400 mt-2 text-lg">
          เครื่องมือพิเศษสำหรับนำเข้า <strong>"Core Veterinary Viruses"</strong> จำนวน 20-30 ชนิดที่สำคัญที่สุดในทางสัตวแพทย์ (ฉบับแปลภาษาไทยและมีข้อมูลครบถ้วน)
        </p>

        <div className="my-6 bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">หลักการทำงาน (Upsert):</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>หากตรวจพบไวรัสชื่อเดิมในระบบ (เช่น Rabies Virus) จะทำการ <strong>อัปเดตข้อมูลทับ</strong> เพื่อให้เนื้อหาสมบูรณ์ขึ้น</li>
                <li>หากเป็นไวรัสชนิดใหม่ที่ยังไม่เคยมีในระบบ จะทำการ <strong>สร้างใหม่</strong> ทันที</li>
                <li>ข้อมูลที่อาจารย์เคยสร้างไว้ (ที่ไม่ซ้ำชื่อกัน) จะไม่ถูกลบทิ้ง ปลอดภัย 100%</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-start">
          <Button 
            onClick={handleSeed} 
            disabled={isRunning || isCompleted}
            className="w-full sm:w-auto bg-accent hover:bg-accent/80 text-black font-black text-lg py-6 px-10 shadow-[0_0_20px_rgba(45,212,191,0.4)]"
            leftIcon={isRunning ? <Loader2 className="w-6 h-6 animate-spin" /> : <Database className="w-6 h-6" />}
          >
            {isRunning ? 'กำลังนำเข้าข้อมูลลง Firestore...' : isCompleted ? 'นำเข้าข้อมูลเรียบร้อยแล้ว' : 'กดปุ่มนี้เพื่อนำเข้าฐานข้อมูล'}
          </Button>
        </div>

        {/* LOG Console */}
        {(logs.length > 0) && (
          <div className="mt-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              System Logs {isCompleted && <CheckCircle className="w-4 h-4 text-emerald-500" />}
            </h3>
            <div className="bg-black/80 rounded-lg p-4 font-mono text-xs overflow-y-auto max-h-64 border border-slate-700 shadow-inner">
              {logs.map((log, i) => (
                <div key={i} className={`py-1 ${
                  log.includes('[ERROR]') ? 'text-red-400' : 
                  log.includes('[UPDATED]') ? 'text-yellow-400' : 
                  log.includes('[ADDED]') ? 'text-emerald-400' : 'text-slate-300'
                }`}>
                  {log}
                </div>
              ))}
              {isRunning && (
                <div className="py-1 text-slate-500 animate-pulse">_</div>
              )}
            </div>
            
            {isCompleted && (
              <div className="mt-6">
                <Link href="/instructor/viruses">
                  <Button variant="outline" rightIcon={<ArrowRight className="w-4 h-4" />} className="bg-emerald-900/30 text-emerald-400 border-emerald-500/50 hover:bg-emerald-900/50 hover:text-emerald-300">
                    ไปดูฐานข้อมูลไวรัส
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
