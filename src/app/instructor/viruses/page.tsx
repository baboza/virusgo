"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Edit2, Trash2, Search, AlertCircle, ArrowLeft, Download, 
  Sparkles, RefreshCw, Eye, Dna, ShieldCheck, ShieldAlert, Bug, 
  Filter, ArrowUpDown, LayoutGrid, List, CheckCircle2, XCircle, 
  Layers, ExternalLink, Activity, Info, X, ChevronRight, Stethoscope,
  Microscope, Syringe, HeartPulse
} from 'lucide-react';
import Link from 'next/link';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Virus } from '@/types';
import { MASTER_CORE_VIRUSES } from '@/data/seedVirusesData';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';
import { sfx } from '@/utils/sound';

export default function InstructorViruses() {
  const { appUser, loading: authLoading } = useAuth();
  
  const [viruses, setViruses] = useState<Virus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedGenome, setSelectedGenome] = useState<string>('all');
  const [selectedVaccine, setSelectedVaccine] = useState<string>('all');
  const [selectedFamily, setSelectedFamily] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'family_asc' | 'host_desc'>('name_asc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modal State
  const [inspectVirus, setInspectVirus] = useState<Virus | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'clinical' | 'treatment'>('overview');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch Viruses from Firestore
  const fetchViruses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'viruses'), orderBy('virusName'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ ...d.data(), virusID: d.id } as Virus));
      setViruses(list);
    } catch (error: any) {
      console.error("Error fetching viruses:", error);
      setStatusMessage({ type: 'error', text: `โหลดข้อมูลไวรัสไม่สำเร็จ: ${error.message}` });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchViruses();
  }, []);

  // Quick Seed 30 Master Pathogens
  const handleSeedMasterViruses = async () => {
    if (!window.confirm(`ยืนยันการนำเข้าและซิงค์คลังไวรัสหลักสูตรทางสัตวแพทย์ ${MASTER_CORE_VIRUSES.length} ชนิด เข้าสู่ Firestore? ข้อมูลเดิมจะถูกอัพเดทข้อมูลใหม่โดยไม่ลบส่วนเพิ่มเติม`)) {
      return;
    }

    setSeeding(true);
    setStatusMessage(null);
    try {
      const now = new Date().toISOString();
      for (const virus of MASTER_CORE_VIRUSES) {
        const docId = virus.virusName.toLowerCase().replace(/[^a-z0-9]/g, '-');
        await setDoc(doc(db, 'viruses', docId), {
          ...virus,
          virusID: docId,
          updatedAt: now
        }, { merge: true });
      }

      setStatusMessage({ 
        type: 'success', 
        text: `ซิงค์คลังไวรัสหลักสูตร ${MASTER_CORE_VIRUSES.length} ชนิดเข้าสู่ Firestore เรียบร้อยแล้ว!` 
      });
      sfx.correct();
      await fetchViruses();
    } catch (err: any) {
      console.error("Error seeding viruses:", err);
      setStatusMessage({ type: 'error', text: `เกิดข้อผิดพลาดในการซิงค์: ${err.message}` });
    } finally {
      setSeeding(false);
    }
  };

  // Delete Virus
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ยืนยันการลบเชื้อไวรัส "${name}" ออกจากฐานข้อมูล?`)) return;

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, 'viruses', id));
      setViruses(prev => prev.filter(v => v.virusID !== id));
      if (inspectVirus?.virusID === id) {
        setInspectVirus(null);
      }
      setStatusMessage({ type: 'success', text: `ลบเชื้อ "${name}" เรียบร้อยแล้ว` });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error: any) {
      console.error("Error deleting virus:", error);
      setStatusMessage({ type: 'error', text: `ไม่สามารถลบข้อมูลได้: ${error.message}` });
    } finally {
      setDeletingId(null);
    }
  };

  // Export to CSV with Thai UTF-8 BOM
  const handleExportCSV = () => {
    if (viruses.length === 0) {
      alert("ไม่มีข้อมูลไวรัสสำหรับส่งออก");
      return;
    }

    const headers = [
      "ลำดับ",
      "ชื่อไวรัส (Virus Name)",
      "วงศ์ (Family)",
      "จีนัส (Genus)",
      "สารพันธุกรรม (Genome)",
      "สัตว์ที่เป็นโฮสต์ (Host)",
      "การติดต่อ (Transmission)",
      "กลไกก่อโรค (Pathogenesis)",
      "อาการทางคลินิก (Clinical Signs)",
      "การวินิจฉัย (Diagnosis)",
      "การรักษา (Treatment)",
      "การป้องกัน (Prevention)",
      "มีวัคซีน (Vaccine)"
    ];

    const rows = filteredViruses.map((v, idx) => [
      idx + 1,
      `"${v.virusName.replace(/"/g, '""')}"`,
      `"${v.family || ''}"`,
      `"${v.genus || ''}"`,
      `"${v.genome || ''}"`,
      `"${(v.host || []).join(', ').replace(/"/g, '""')}"`,
      `"${(v.transmission || []).join(', ').replace(/"/g, '""')}"`,
      `"${(v.pathogenesis || '').replace(/"/g, '""')}"`,
      `"${(v.clinicalSigns || []).join('; ').replace(/"/g, '""')}"`,
      `"${(v.diagnosis || []).join('; ').replace(/"/g, '""')}"`,
      `"${(v.treatment || '').replace(/"/g, '""')}"`,
      `"${(v.prevention || []).join('; ').replace(/"/g, '""')}"`,
      v.vaccine ? "มี" : "ไม่มี"
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `vet_viruses_database_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // List of Unique Families
  const uniqueFamilies = useMemo(() => {
    const fams = new Set<string>();
    viruses.forEach(v => {
      if (v.family) fams.add(v.family);
    });
    return Array.from(fams).sort();
  }, [viruses]);

  // Filtered & Sorted Viruses
  const filteredViruses = useMemo(() => {
    let list = [...viruses];

    // Search Query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(v => 
        v.virusName.toLowerCase().includes(q) ||
        (v.family && v.family.toLowerCase().includes(q)) ||
        (v.genus && v.genus.toLowerCase().includes(q)) ||
        (v.genome && v.genome.toLowerCase().includes(q)) ||
        (v.host && v.host.some(h => h.toLowerCase().includes(q))) ||
        (v.clinicalSigns && v.clinicalSigns.some(s => s.toLowerCase().includes(q))) ||
        (v.diagnosis && v.diagnosis.some(d => d.toLowerCase().includes(q)))
      );
    }

    // Species Filter
    if (selectedSpecies !== 'all') {
      list = list.filter(v => {
        if (!v.host || v.host.length === 0) return false;
        const joined = v.host.join(' ').toLowerCase();
        if (selectedSpecies === 'canine') return joined.includes('สุนัข') || joined.includes('dog') || joined.includes('canine');
        if (selectedSpecies === 'feline') return joined.includes('แมว') || joined.includes('cat') || joined.includes('feline');
        if (selectedSpecies === 'swine') return joined.includes('สุกร') || joined.includes('หมู') || joined.includes('pig') || joined.includes('porcine');
        if (selectedSpecies === 'bovine') return joined.includes('โค') || joined.includes('กระบือ') || joined.includes('วัว') || joined.includes('bovine');
        if (selectedSpecies === 'avian') return joined.includes('ปีก') || joined.includes('ไก่') || joined.includes('เป็ด') || joined.includes('avian') || joined.includes('bird');
        if (selectedSpecies === 'equine') return joined.includes('ม้า') || joined.includes('horse') || joined.includes('equine');
        if (selectedSpecies === 'zoonotic') return joined.includes('มนุษย์') || joined.includes('คน') || joined.includes('human') || joined.includes('zoonotic');
        return true;
      });
    }

    // Genome Filter
    if (selectedGenome !== 'all') {
      list = list.filter(v => {
        if (!v.genome) return false;
        const g = v.genome.toLowerCase();
        if (selectedGenome === 'rna') return g.includes('rna');
        if (selectedGenome === 'dna') return g.includes('dna');
        return g.includes(selectedGenome.toLowerCase());
      });
    }

    // Vaccine Filter
    if (selectedVaccine !== 'all') {
      const hasVac = selectedVaccine === 'yes';
      list = list.filter(v => Boolean(v.vaccine) === hasVac);
    }

    // Family Filter
    if (selectedFamily !== 'all') {
      list = list.filter(v => v.family === selectedFamily);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'name_asc') return a.virusName.localeCompare(b.virusName);
      if (sortBy === 'name_desc') return b.virusName.localeCompare(a.virusName);
      if (sortBy === 'family_asc') return (a.family || '').localeCompare(b.family || '');
      if (sortBy === 'host_desc') return (b.host?.length || 0) - (a.host?.length || 0);
      return 0;
    });

    return list;
  }, [viruses, searchTerm, selectedSpecies, selectedGenome, selectedVaccine, selectedFamily, sortBy]);

  // KPI Metrics
  const metrics = useMemo(() => {
    const total = viruses.length;
    const rnaCount = viruses.filter(v => (v.genome || '').toLowerCase().includes('rna')).length;
    const dnaCount = viruses.filter(v => (v.genome || '').toLowerCase().includes('dna')).length;
    const vaccineCount = viruses.filter(v => v.vaccine).length;
    const vaccinePercent = total > 0 ? Math.round((vaccineCount / total) * 100) : 0;

    return { total, rnaCount, dnaCount, vaccineCount, vaccinePercent };
  }, [viruses]);

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <div className="text-slate-400 font-mono text-xs">Authenticating Instructor Portal...</div>
      </div>
    );
  }

  if (appUser?.role !== 'instructor') {
    return (
      <div className="p-8 text-center text-danger font-mono">
        Access Denied. เฉพาะอาจารย์ผู้สอนเท่านั้นที่สามารถเข้าถึงระบบนี้ได้
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* ─────────────────────────────────────────────────────────────
          1. EXECUTIVE HEADER & ACTIONS
      ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link href="/instructor" className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-slate-800">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Bug className="w-8 h-8 text-emerald-400" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                คลังสารานุกรมและข้อมูลไวรัส (Virus Database)
              </span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            จัดการและตรวจสอบฐานข้อมูลไวรัสทางสัตวแพทย์ 30 ชนิดหลัก พร้อมรายละเอียดกลไกก่อโรคและการวินิจฉัย
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <Button
            variant="outline"
            onClick={handleSeedMasterViruses}
            disabled={seeding || loading}
            leftIcon={<Sparkles className={`w-4 h-4 text-purple-400 ${seeding ? 'animate-spin' : ''}`} />}
            className="bg-slate-900 border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-xs"
          >
            {seeding ? "กำลังซิงค์..." : "ซิงค์คลัง 30 ไวรัสหลัก"}
          </Button>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            disabled={loading || viruses.length === 0}
            leftIcon={<Download className="w-4 h-4 text-cyan-400" />}
            className="bg-slate-900 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs"
          >
            ส่งออก CSV
          </Button>

          <Link href="/instructor/viruses/edit?id=new">
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25"
            >
              เพิ่มเชื้อไวรัสใหม่
            </Button>
          </Link>
        </div>
      </div>

      {/* Alert Banner */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-2xl font-bold flex items-center justify-between text-xs border ${
              statusMessage.type === 'error' 
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="hover:opacity-75">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─────────────────────────────────────────────────────────────
          2. KPI ANALYTICS CARDS (4 STATS)
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Viruses */}
        <Card className="p-5 glass border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">ไวรัสในระบบ</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bug className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{metrics.total} <span className="text-sm font-normal text-slate-400">ชนิด</span></div>
          <p className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" /> ครบทุกกลุ่มในหลักสูตร
          </p>
        </Card>

        {/* Metric 2: RNA Viruses */}
        <Card className="p-5 glass border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">RNA Viruses</span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Dna className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{metrics.rnaCount} <span className="text-sm font-normal text-slate-400">ชนิด</span></div>
          <p className="text-[11px] text-cyan-400/80 mt-1 font-mono">
            ssRNA (+), ssRNA (-), dsRNA
          </p>
        </Card>

        {/* Metric 3: DNA Viruses */}
        <Card className="p-5 glass border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">DNA Viruses</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{metrics.dnaCount} <span className="text-sm font-normal text-slate-400">ชนิด</span></div>
          <p className="text-[11px] text-purple-400/80 mt-1 font-mono">
            Parvo, Herpes, Pox, Asfar, Adeno
          </p>
        </Card>

        {/* Metric 4: Vaccines Available */}
        <Card className="p-5 glass border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">มีวัคซีนป้องกัน</span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Syringe className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{metrics.vaccineCount} <span className="text-sm font-normal text-slate-400">ชนิด ({metrics.vaccinePercent}%)</span></div>
          <p className="text-[11px] text-blue-400/80 mt-1 font-mono">
            พร้อมโปรแกรมวัคซีนในคลินิก
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH, FILTERS & VIEW MODE TOOLBAR
      ───────────────────────────────────────────────────────────── */}
      <Card className="p-4 md:p-6 glass border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center">
          {/* Search Box */}
          <div className="relative flex-1">
            <Input 
              placeholder="ค้นหาตามชื่อไวรัส, วงศ์ (Family), จีนัส, อาการเด่น หรือวิธีตรวจ..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              className="bg-slate-950/80 border-slate-800 text-sm focus:border-emerald-500 rounded-xl"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Toolbar: View Toggle & Refresh */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'table' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">ตาราง</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">การ์ด</span>
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { setRefreshing(true); fetchViruses(); }}
              disabled={refreshing}
              className="bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800 text-xs px-3"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-slate-800/80">
          {/* 1. Host Species Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              ชนิดสัตว์ (Species)
            </label>
            <select
              value={selectedSpecies}
              onChange={(e) => setSelectedSpecies(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">ทุกสปีชีส์ (All)</option>
              <option value="canine">สุนัข (Canine)</option>
              <option value="feline">แมว (Feline)</option>
              <option value="swine">สุกร (Swine)</option>
              <option value="bovine">โค/กระบือ (Bovine)</option>
              <option value="avian">สัตว์ปีก (Avian)</option>
              <option value="equine">ม้า (Equine)</option>
              <option value="zoonotic">สัตว์สู่คน (Zoonotic)</option>
            </select>
          </div>

          {/* 2. Genome Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              สารพันธุกรรม (Genome)
            </label>
            <select
              value={selectedGenome}
              onChange={(e) => setSelectedGenome(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">ทั้งหมด (All Genome)</option>
              <option value="rna">กลุ่ม RNA ทั้งหมด</option>
              <option value="dna">กลุ่ม DNA ทั้งหมด</option>
              <option value="ssRNA (+)">ssRNA (+)</option>
              <option value="ssRNA (-)">ssRNA (-)</option>
              <option value="dsRNA">dsRNA</option>
              <option value="ssDNA">ssDNA</option>
              <option value="dsDNA">dsDNA</option>
            </select>
          </div>

          {/* 3. Vaccine Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              วัคซีน (Vaccine)
            </label>
            <select
              value={selectedVaccine}
              onChange={(e) => setSelectedVaccine(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">ทั้งหมด (All)</option>
              <option value="yes">มีวัคซีน (Vaccine Available)</option>
              <option value="no">ไม่มีวัคซีน (No Vaccine)</option>
            </select>
          </div>

          {/* 4. Family Filter */}
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              วงศ์ (Family)
            </label>
            <select
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="all">ทุกวงศ์ (All Families)</option>
              {uniqueFamilies.map(fam => (
                <option key={fam} value={fam}>{fam}</option>
              ))}
            </select>
          </div>

          {/* 5. Sort By */}
          <div className="col-span-2 lg:col-span-1">
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              เรียงลำดับ (Sort)
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="name_asc">ชื่อไวรัส (A → Z)</option>
              <option value="name_desc">ชื่อไวรัส (Z → A)</option>
              <option value="family_asc">วงศ์ Family (A → Z)</option>
              <option value="host_desc">จำนวนโฮสต์ (มาก → น้อย)</option>
            </select>
          </div>
        </div>

        {/* Filter Count Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 font-mono">
          <span>
            แสดงผล <strong className="text-white">{filteredViruses.length}</strong> จากทั้งหมด {viruses.length} ชนิด
          </span>
          {(searchTerm || selectedSpecies !== 'all' || selectedGenome !== 'all' || selectedVaccine !== 'all' || selectedFamily !== 'all') && (
            <button 
              onClick={() => {
                setSearchTerm('');
                setSelectedSpecies('all');
                setSelectedGenome('all');
                setSelectedVaccine('all');
                setSelectedFamily('all');
              }}
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" /> ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN CONTENT (TABLE VIEW vs GRID CARD VIEW)
      ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <div className="text-slate-400 font-mono text-xs">กำลังโหลดฐานข้อมูลไวรัสจาก Firestore...</div>
        </div>
      ) : filteredViruses.length === 0 ? (
        <Card className="py-16 text-center glass border-slate-800 flex flex-col items-center justify-center space-y-3">
          <div className="p-4 rounded-full bg-slate-800/80 text-slate-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">ไม่พบข้อมูลเชื้อไวรัสที่ตรงกับเงื่อนไข</h3>
          <p className="text-slate-400 text-xs max-w-sm">
            ลองปรับเปลี่ยนคำค้นหา หรือกดปุ่ม <strong>"ซิงค์คลัง 30 ไวรัสหลัก"</strong> เพื่อโหลดข้อมูลหลักสูตรเข้ามาในระบบ
          </p>
          <Button
            size="sm"
            onClick={handleSeedMasterViruses}
            leftIcon={<Sparkles className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-500 text-white mt-2"
          >
            ซิงค์คลัง 30 ไวรัสหลักทันที
          </Button>
        </Card>
      ) : viewMode === 'table' ? (
        /* ──── TABLE VIEW ──── */
        <Card className="glass border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-4">เชื้อไวรัส (Pathogen)</th>
                  <th className="py-3.5 px-4">วงศ์ & จีนัส (Family / Genus)</th>
                  <th className="py-3.5 px-4">สารพันธุกรรม (Genome)</th>
                  <th className="py-3.5 px-4">สัตว์โฮสต์ (Host Species)</th>
                  <th className="py-3.5 px-4">อาการเด่น (Key Signs)</th>
                  <th className="py-3.5 px-4 text-center">วัคซีน</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredViruses.map((v, index) => {
                  const svgType = familyToVirusType(v.family || '');
                  return (
                    <motion.tr
                      key={v.virusID}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(index * 0.02, 0.3) }}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => setInspectVirus(v)}
                    >
                      {/* Name & Icon */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:border-emerald-500/50 transition-colors">
                            {v.image ? (
                              <img 
                                src={v.image} 
                                alt={v.virusName} 
                                className="w-full h-full object-cover" 
                                onError={(e) => { (e.target as any).style.display = 'none'; }}
                              />
                            ) : null}
                            <div className={`absolute inset-0 flex items-center justify-center p-1.5 ${v.image ? 'opacity-0' : 'opacity-100'}`}>
                              <SVGVirus type={svgType} className="w-full h-full" />
                            </div>
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                              {v.virusName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              ID: {v.virusID}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Family & Genus */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{v.family || '-'}</div>
                        <div className="text-[11px] text-slate-400 italic">{v.genus || '-'}</div>
                      </td>

                      {/* Genome */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                          (v.genome || '').toLowerCase().includes('rna')
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        }`}>
                          {v.genome || 'Unknown'}
                        </span>
                      </td>

                      {/* Host Species */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {(v.host || []).slice(0, 3).map((h, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700/60">
                              {h}
                            </span>
                          ))}
                          {(v.host || []).length > 3 && (
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px] font-mono">
                              +{v.host.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Key Signs */}
                      <td className="py-3.5 px-4">
                        <p className="text-slate-300 line-clamp-1 max-w-[200px]" title={(v.clinicalSigns || []).join(', ')}>
                          {(v.clinicalSigns || []).length > 0 ? v.clinicalSigns[0] : '-'}
                        </p>
                      </td>

                      {/* Vaccine */}
                      <td className="py-3.5 px-4 text-center">
                        {v.vaccine ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" /> มี
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
                            ไม่มี
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setInspectVirus(v)}
                            title="ดูรายละเอียดฉบับเต็ม"
                            className="h-8 w-8 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Link href={`/instructor/viruses/edit?id=${v.virusID}`}>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="แก้ไขข้อมูลไวรัส"
                              className="h-8 w-8 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            disabled={deletingId === v.virusID}
                            onClick={() => handleDelete(v.virusID, v.virusName)}
                            title="ลบเชื้อนี้"
                            className="h-8 w-8 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        /* ──── GRID CARD VIEW ──── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredViruses.map((v, index) => {
            const svgType = familyToVirusType(v.family || '');
            return (
              <motion.div
                key={v.virusID}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
              >
                <Card 
                  onClick={() => setInspectVirus(v)}
                  className="p-5 glass border-slate-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between h-full group cursor-pointer relative overflow-hidden bg-slate-900/60"
                >
                  <div className="space-y-3">
                    {/* Card Top: Graphic + Basic Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:scale-105 transition-transform">
                        {v.image ? (
                          <img 
                            src={v.image} 
                            alt={v.virusName} 
                            className="w-full h-full object-cover" 
                            onError={(e) => { (e.target as any).style.display = 'none'; }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center p-2 ${v.image ? 'opacity-0' : 'opacity-100'}`}>
                          <SVGVirus type={svgType} className="w-full h-full" />
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                          (v.genome || '').toLowerCase().includes('rna')
                            ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                            : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        }`}>
                          {v.genome || 'N/A'}
                        </span>
                        {v.vaccine && (
                          <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" title="มีวัคซีน">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {v.virusName}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {v.family} {v.genus ? `• ${v.genus}` : ''}
                      </p>
                    </div>

                    {/* Hosts Badges */}
                    <div className="flex flex-wrap gap-1">
                      {(v.host || []).slice(0, 3).map((h, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] border border-slate-800">
                          {h}
                        </span>
                      ))}
                      {(v.host || []).length > 3 && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 text-[10px] font-mono">
                          +{v.host.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Pathogenesis / Key Signs Preview */}
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 line-clamp-2">
                      {v.pathogenesis || (v.clinicalSigns && v.clinicalSigns.join(', ')) || 'ไม่มีข้อมูลสังเขป'}
                    </div>
                  </div>

                  {/* Card Bottom: Quick Actions */}
                  <div className="pt-4 mt-3 border-t border-slate-800/80 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {v.virusID}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setInspectVirus(v)}
                        className="h-7 w-7 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Link href={`/instructor/viruses/edit?id=${v.virusID}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(v.virusID, v.virusName)}
                        className="h-7 w-7 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. INTERACTIVE VIRUS DETAIL INSPECTION MODAL
      ───────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {inspectVirus && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/50">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden relative">
                    {inspectVirus.image ? (
                      <img 
                        src={inspectVirus.image} 
                        alt={inspectVirus.virusName} 
                        className="w-full h-full object-cover" 
                        onError={(e) => { (e.target as any).style.display = 'none'; }}
                      />
                    ) : null}
                    <div className={`absolute inset-0 flex items-center justify-center p-2 ${inspectVirus.image ? 'opacity-0' : 'opacity-100'}`}>
                      <SVGVirus type={familyToVirusType(inspectVirus.family || '')} className="w-full h-full" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      {inspectVirus.virusName}
                    </h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {inspectVirus.family} • {inspectVirus.genus || 'Unclassified genus'} • {inspectVirus.genome}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setInspectVirus(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-slate-800 px-6 bg-slate-950/20 text-xs font-bold">
                <button
                  onClick={() => setModalTab('overview')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
                    modalTab === 'overview'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Info className="w-4 h-4" /> ข้อมูลทั่วไป & กลไกก่อโรค
                </button>
                <button
                  onClick={() => setModalTab('clinical')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
                    modalTab === 'clinical'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" /> สัตว์ป่วย & การวินิจฉัย
                </button>
                <button
                  onClick={() => setModalTab('treatment')}
                  className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
                    modalTab === 'treatment'
                      ? 'border-emerald-500 text-emerald-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Syringe className="w-4 h-4" /> การรักษา & วัคซีน
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 text-xs">
                {modalTab === 'overview' && (
                  <div className="space-y-4">
                    {/* General Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Family</span>
                        <strong className="text-white text-sm">{inspectVirus.family || '-'}</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Genus</span>
                        <strong className="text-white text-sm">{inspectVirus.genus || '-'}</strong>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                        <span className="text-[10px] font-mono text-slate-400 block uppercase">Genome</span>
                        <strong className="text-cyan-400 text-sm">{inspectVirus.genome || '-'}</strong>
                      </div>
                    </div>

                    {/* Pathogenesis */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2 text-emerald-400">
                        <Activity className="w-4 h-4" /> กลไกการเกิดโรค (Pathogenesis)
                      </h4>
                      <p className="text-slate-300 leading-relaxed">
                        {inspectVirus.pathogenesis || 'ยังไม่มีข้อมูลระบุในระบบ'}
                      </p>
                    </div>

                    {/* Transmission Routes */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2 text-cyan-400">
                        <Bug className="w-4 h-4" /> ช่องทางการติดต่อ (Transmission Routes)
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(inspectVirus.transmission || []).length > 0 ? (
                          inspectVirus.transmission.map((t, idx) => (
                            <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400">ไม่มีข้อมูล</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === 'clinical' && (
                  <div className="space-y-4">
                    {/* Hosts */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2 text-teal-400">
                        สัตว์ที่เป็นโฮสต์ (Host Species)
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(inspectVirus.host || []).map((h, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-xl bg-teal-500/10 text-teal-300 border border-teal-500/20 font-medium">
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Clinical Signs */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2 text-amber-400">
                        <AlertCircle className="w-4 h-4" /> อาการทางคลินิก (Clinical Signs)
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                        {(inspectVirus.clinicalSigns || []).map((sign, idx) => (
                          <li key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                            <span>{sign}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Diagnosis */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2 text-purple-400">
                        <Microscope className="w-4 h-4" /> การตรวจวินิจฉัยทางห้องปฏิบัติการ (Diagnosis)
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(inspectVirus.diagnosis || []).map((diag, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                            {diag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === 'treatment' && (
                  <div className="space-y-4">
                    {/* Vaccine Indicator Card */}
                    <div className={`p-4 rounded-2xl border flex items-center gap-3 ${
                      inspectVirus.vaccine 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}>
                      {inspectVirus.vaccine ? <ShieldCheck className="w-6 h-6 shrink-0" /> : <ShieldAlert className="w-6 h-6 shrink-0" />}
                      <div>
                        <strong className="block text-sm text-white">
                          {inspectVirus.vaccine ? "มีวัคซีนป้องกันในเชิงสัตวแพทย์" : "ยังไม่มีวัคซีนป้องกันที่มีประสิทธิผล"}
                        </strong>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {inspectVirus.vaccine 
                            ? "แนะนำให้ทำโปรแกรมวัคซีนตามเกณฑ์การควบคุมโรค" 
                            : "เน้นการจัดการระบบความปลอดภัยทางชีวภาพ (Biosecurity) และการแยกกัก"}
                        </p>
                      </div>
                    </div>

                    {/* Treatment */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2 text-blue-400">
                        <HeartPulse className="w-4 h-4" /> แนวทางการรักษา (Treatment)
                      </h4>
                      <p className="text-slate-300 leading-relaxed">
                        {inspectVirus.treatment || 'รักษาตามอาการ (Supportive Care) และการป้องกันการติดเชื้อแบคทีเรียแทรกซ้อน'}
                      </p>
                    </div>

                    {/* Prevention */}
                    <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                      <h4 className="font-bold text-white text-xs flex items-center gap-2 text-emerald-400">
                        <ShieldCheck className="w-4 h-4" /> มาตรการป้องกัน & ชีวอนามัย (Prevention)
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {(inspectVirus.prevention || []).map((prev, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700 text-slate-200">
                            {prev}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/70">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(inspectVirus.virusID, inspectVirus.virusName)}
                  leftIcon={<Trash2 className="w-4 h-4 text-rose-400" />}
                  className="bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 text-xs"
                >
                  ลบเชื้อนี้
                </Button>

                <div className="flex items-center gap-2">
                  <Link href={`/instructor/viruses/edit?id=${inspectVirus.virusID}`}>
                    <Button
                      size="sm"
                      leftIcon={<Edit2 className="w-4 h-4" />}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                    >
                      แก้ไขข้อมูล
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInspectVirus(null)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    ปิด
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
