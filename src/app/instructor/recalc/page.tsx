"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, Shield, User, Flame, TrendingDown, Sparkles, Map, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function RecalcPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Empire reset states
  const [empireLoading, setEmpireLoading] = useState(false);
  const [empireResult, setEmpireResult] = useState<any>(null);
  const [empireError, setEmpireError] = useState<string | null>(null);

  const handleRecalculate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/recalc-exp', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to recalculate');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmpire = async () => {
    if (!confirm('ยืนยันลบข้อมูลและรีเซ็ตสงคราม Virus Empire ทั้งหมดหรือไม่?\n(ระบบจะลบเซกเตอร์ที่ถูกยึดทั้งหมด ล้างกิลด์ และลบประวัติที่เกี่ยวข้อง)')) return;
    setEmpireLoading(true);
    setEmpireError(null);
    try {
      const res = await fetch('/api/admin/reset-empire', { method: 'POST' });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to reset empire');
      }
      setEmpireResult(data);
    } catch (err: any) {
      setEmpireError(err.message || 'Error occurred');
    } finally {
      setEmpireLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-24 pt-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/instructor">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> กลับแผงควบคุมอาจารย์
          </Button>
        </Link>
        <div className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-500/40 px-3 py-1 rounded-full">
          Admin Maintenance Tool
        </div>
      </div>

      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(245,158,11,0.25)]">
          <RefreshCw className={`w-8 h-8 ${loading ? 'animate-spin' : ''}`} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-wider">
          ปรับปรุงคะแนนและเลเวลนิสิตทั้งหมด
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto">
          ระบบจะสแกนประวัติการเล่นจริง (Match History) ของนิสิตทุกคน คำนวณ EXP ใหม่ตามอัตราส่วนที่ถูกต้อง แก้ปัญหาคะแนนเฟ้อจากโหมดแข่งสด และปรับระดับเลเวลเป็นสูตร RPG Progressive อย่างแม่นยำ
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Card 1: Recalculate EXP */}
        <Card className="glass p-6 text-center border-amber-500/30 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">ปรับปรุง EXP และ เลเวลนิสิต</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              สแกนประวัติ ลบประวัติซ้ำซ้อนจาก Kahoot/Battle ปรับ EXP ให้อยู่ในเกณฑ์จริง และคำนวณ Level RPG
            </p>
          </div>

          <Button
            onClick={handleRecalculate}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase py-5 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> กำลังประมวลผล...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> ปรับคะแนนนิสิตทั้งหมด
              </span>
            )}
          </Button>

          {error && (
            <div className="p-3 bg-danger/20 border border-danger/40 rounded-xl text-danger text-xs font-mono text-left">
              ❌ {error}
            </div>
          )}
        </Card>

        {/* Card 2: Reset Virus Empire */}
        <Card className="glass p-6 text-center border-emerald-500/30 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <Map className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">ล้างข้อมูล Virus Empire</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              ลบเซกเตอร์ที่ถูกยึดทั้งหมด ล้างกิลด์ และคืนสถานะแผนที่ให้ว่างเปล่าเนื่องจากนิสิตยังปลดล็อกไม่ถึงเกณฑ์ (1,000 EXP)
            </p>
          </div>

          <Button
            onClick={handleResetEmpire}
            disabled={empireLoading}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-sm uppercase py-5 rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)]"
          >
            {empireLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" /> กำลังล้างข้อมูลแผนที่...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> ล้างข้อมูล Virus Empire ทั้งหมด
              </span>
            )}
          </Button>

          {empireError && (
            <div className="p-3 bg-danger/20 border border-danger/40 rounded-xl text-danger text-xs font-mono text-left">
              ❌ {empireError}
            </div>
          )}

          {empireResult && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400 text-xs font-mono text-left">
              ✅ {empireResult.message}
            </div>
          )}
        </Card>
      </div>

      {/* Results Table */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>ประมวลผลเสร็จสิ้น: ปรับปรุงข้อมูลแล้ว {result.totalUsersProcessed} บัญชี</span>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {new Date(result.timestamp).toLocaleTimeString('th-TH')}
            </span>
          </div>

          <Card className="glass overflow-hidden border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase">
                  <tr>
                    <th className="p-3.5">ชื่อนิสิต</th>
                    <th className="p-3.5">ประวัติที่เล่น</th>
                    <th className="p-3.5 text-right">EXP เดิม</th>
                    <th className="p-3.5 text-right">EXP ใหม่</th>
                    <th className="p-3.5 text-right">การเปลี่ยนแปลง</th>
                    <th className="p-3.5 text-center">เลเวลเดิม</th>
                    <th className="p-3.5 text-center">เลเวลใหม่</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.users.map((u: any) => (
                    <tr key={u.uid} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5 font-bold text-white">
                        <div>{u.fullname}</div>
                        <div className="text-[10px] text-slate-500">{u.email}</div>
                      </td>
                      <td className="p-3.5 text-slate-400">
                        <div>{u.historyCount} รายการ</div>
                        {u.duplicatesRemoved > 0 && (
                          <div className="text-[10px] text-rose-400 font-bold">
                            ลบซ้ำ {u.duplicatesRemoved} รายการ
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-right text-slate-400">
                        {u.oldExp.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right font-bold text-accent">
                        {u.newExp.toLocaleString()}
                      </td>
                      <td className="p-3.5 text-right">
                        {u.expDiff < 0 ? (
                          <span className="text-danger flex items-center justify-end gap-1 font-bold">
                            <TrendingDown className="w-3.5 h-3.5" /> {u.expDiff.toLocaleString()}
                          </span>
                        ) : u.expDiff > 0 ? (
                          <span className="text-emerald-400 font-bold">
                            +{u.expDiff.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center text-slate-400">
                        Lv.{u.oldLevel}
                      </td>
                      <td className="p-3.5 text-center font-bold text-cyan-400">
                        Lv.{u.newLevel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
