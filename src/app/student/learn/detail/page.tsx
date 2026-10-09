"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getVirus } from '@/lib/firebase/virusService';
import { Virus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { ArrowLeft, Dna, Activity, Stethoscope, ShieldCheck, Microscope, Info, AlertTriangle, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import dynamic from 'next/dynamic';

const VirusViewer3D = dynamic(() => import('@/components/ui/VirusViewer3D'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-slate-500 font-mono text-[10px]">
      Loading 3D...
    </div>
  ),
});

const getVirusFamilyColor = (family: string) => {
  const f = (family || '').toLowerCase();
  if (f.includes('rhabdo') || f.includes('rabies')) return '#ef4444';
  if (f.includes('parvo')) return '#3b82f6';
  if (f.includes('corona')) return '#10b981';
  if (f.includes('retro')) return '#a855f7';
  if (f.includes('paramyxo')) return '#f97316';
  if (f.includes('arteri')) return '#ec4899';
  if (f.includes('picorna')) return '#f59e0b';
  if (f.includes('asfar')) return '#6366f1';
  if (f.includes('flavi')) return '#84cc16';
  if (f.includes('orthomyxo')) return '#14b8a6';
  if (f.includes('herpes')) return '#f43f5e';
  if (f.includes('birna')) return '#06b6d4';
  if (f.includes('reo')) return '#8b5cf6';
  return '#06b6d4';
};

function VirusProfileContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const { appUser } = useAuth();
  const [virus, setVirus] = useState<Virus | null>(null);
  const [loading, setLoading] = useState(true);
  const [is3D, setIs3D] = useState(true);

  useEffect(() => {
    const fetchVirus = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const data = await getVirus(id);
        setVirus(data);

        // ── Track lesson completion ──────────────────────────────────
        if (appUser && id) {
          try {
            await updateDoc(doc(db, 'users', appUser.uid), {
              completedLessons: arrayUnion(id),
            });
          } catch (e) {
            // Silently fail — non-critical
          }
        }
      } catch (error) {
        console.error("Error fetching virus:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVirus();
  }, [id, appUser]);

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!virus) {
    return (
      <div className="py-20 text-center text-slate-400">
        <h2 className="text-2xl font-bold text-white mb-4">ไม่พบข้อมูลไวรัสนี้</h2>
        <Link href="/student/learn" className="text-primary hover:underline mt-4 inline-block">
          กลับสู่ฐานข้อมูล
        </Link>
      </div>
    );
  }

  const container: any = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const item: any = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 px-2 pt-4">
      <div className="flex items-start gap-4 mb-8">
        <Link href="/student/learn">
          <Button variant="ghost" size="icon" className="rounded-full mt-1 shrink-0 text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-black text-white text-glow">
              {virus.virusName}
            </h1>
            {virus.vaccine && (
              <span className="px-3 py-1 bg-secondary/15 text-secondary border border-secondary/30 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3" /> Preventable
              </span>
            )}
            {appUser?.completedLessons?.includes(virus.virusID) && (
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-1 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" /> ศึกษาสำเร็จแล้ว
              </span>
            )}
          </div>
          <p className="text-primary font-mono text-sm font-bold tracking-wide">
            Family: {virus.family}{virus.genus ? ` | Genus: ${virus.genus}` : ''}
          </p>
        </div>
        <div className="shrink-0 hidden md:block text-primary opacity-80">
          <SVGVirus
            type={familyToVirusType(virus.family)}
            className="w-24 h-24"
            glowColor="rgba(59,130,246,0.6)"
          />
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={item} className="space-y-6">
          <Card className="p-6 glass border-primary/20">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <h3 className="font-black text-lg flex items-center gap-2 text-white">
                <Info className="w-5 h-5 text-primary" />
                Quick Facts
              </h3>
              <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-0.5 text-[10px] font-mono">
                <button
                  type="button"
                  onClick={() => setIs3D(true)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    is3D ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D
                </button>
                <button
                  type="button"
                  onClick={() => setIs3D(false)}
                  className={`px-2 py-0.5 rounded transition-colors ${
                    !is3D ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2D
                </button>
              </div>
            </div>

            <div className="flex justify-center mb-6">
              {is3D ? (
                <div className="w-48 h-48 rounded-2xl bg-slate-950 border border-slate-800 relative overflow-hidden shadow-inner flex items-center justify-center">
                  <VirusViewer3D 
                    type={familyToVirusType(virus.family)}
                    color={getVirusFamilyColor(virus.family)}
                    interactive={true}
                    className="w-full h-full"
                  />
                  <span className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500 pointer-events-none">
                    แตะหมุน 3D
                  </span>
                </div>
              ) : (
                <SVGVirus
                  type={familyToVirusType(virus.family)}
                  className="w-28 h-28"
                  glowColor="rgba(99,102,241,0.6)"
                />
              )}
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Genome</p>
                <div className="flex items-center gap-2">
                  <Dna className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-mono font-bold text-slate-200 text-sm">{virus.genome}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Primary Hosts</p>
                <div className="flex flex-wrap gap-2">
                  {virus.host.map((h, i) => (
                    <span key={i} className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-200">
                      {h}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Transmission</p>
                <div className="flex flex-wrap gap-2">
                  {virus.transmission.map((t, i) => (
                    <span key={i} className="px-2 py-1 bg-accent/10 border border-accent/30 text-accent rounded-lg text-xs font-bold">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {virus.treatment && (
            <Card className="p-6 glass border-slate-700/50">
              <h3 className="font-black text-base mb-3 flex items-center gap-2 text-white border-b border-slate-700 pb-3">
                <Stethoscope className="w-4 h-4 text-slate-400" />
                การรักษา
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">{virus.treatment}</p>
            </Card>
          )}
        </motion.div>

        <motion.div variants={item} className="md:col-span-2 space-y-6">
          <Card className="p-6 glass border-accent/20">
            <h3 className="font-black text-xl mb-4 flex items-center gap-2 text-accent">
              <Activity className="w-6 h-6" />
              Pathogenesis
            </h3>
            <p className="text-slate-200 leading-relaxed whitespace-pre-line">
              {virus.pathogenesis || "ไม่มีข้อมูล Pathogenesis"}
            </p>
          </Card>

          <Card className="p-6 glass border-danger/20">
            <h3 className="font-black text-xl mb-5 flex items-center gap-2 text-danger">
              <AlertTriangle className="w-6 h-6" />
              Clinical Signs
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {virus.clinicalSigns.map((sign, i) => (
                <li key={i} className="flex items-start gap-3 bg-slate-900/50 border border-slate-800 rounded-xl p-3">
                  <div className="w-2 h-2 rounded-full bg-danger mt-1.5 shrink-0" />
                  <span className="text-slate-200 text-sm leading-snug">{sign}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card className="p-6 glass border-primary/20">
              <h3 className="font-black text-base mb-4 flex items-center gap-2 text-primary border-b border-slate-700 pb-3">
                <Microscope className="w-5 h-5" />
                Diagnosis Methods
              </h3>
              <ul className="space-y-2">
                {virus.diagnosis.map((diag, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm py-2 border-b border-slate-800 last:border-0">
                    <span className="text-primary font-black mt-0.5">•</span>
                    <span>{diag}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 glass border-secondary/20">
              <h3 className="font-black text-base mb-4 flex items-center gap-2 text-secondary border-b border-slate-700 pb-3">
                <ShieldCheck className="w-5 h-5" />
                Prevention & Control
              </h3>
              {virus.prevention && virus.prevention.length > 0 ? (
                <ul className="space-y-2">
                  {virus.prevention.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300 text-sm py-2 border-b border-slate-800 last:border-0">
                      <span className="text-secondary font-black mt-0.5">✓</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">ไม่มีวัคซีนหรือมาตรการเฉพาะ</p>
              )}
            </Card>
          </div>

          {virus.references && virus.references.length > 0 && (
            <Card className="p-6 glass border-slate-700/50">
              <h3 className="font-black text-base mb-3 flex items-center gap-2 text-slate-400 border-b border-slate-700 pb-3">
                <BookOpen className="w-4 h-4" />
                References
              </h3>
              <ul className="space-y-1">
                {virus.references.map((ref, i) => (
                  <li key={i} className="text-xs text-slate-500 font-mono leading-relaxed">
                    [{i + 1}] {ref}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function VirusProfile() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-slate-400">Loading Virus Profile...</div>}>
      <VirusProfileContent />
    </Suspense>
  );
}
