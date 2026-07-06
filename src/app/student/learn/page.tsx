"use client";

import React, { useEffect, useState } from 'react';
import { getViruses } from '@/lib/firebase/virusService';
import { Virus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import { Search, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { SVGVirus, familyToVirusType } from '@/components/ui/SVGVirus';

export default function LearningModule() {
  const [viruses, setViruses] = useState<Virus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');

  useEffect(() => {
    const fetchViruses = async () => {
      try {
        const data = await getViruses();
        setViruses(data);
      } catch (error) {
        console.error("Error fetching viruses:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchViruses();
  }, []);

  const families = ['All', ...Array.from(new Set(viruses.map(v => v.family)))];

  const filteredViruses = viruses.filter(v => {
    const matchesSearch = v.virusName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          v.family.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFamily = selectedFamily === 'All' || v.family === selectedFamily;
    return matchesSearch && matchesFamily;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-widest text-glow uppercase">Virus Encyclopedia</h1>
          <p className="text-slate-400 mt-2 font-mono text-sm">ฐานข้อมูลไวรัสสัตวแพทย์ — ศึกษาและค้นหาข้อมูลเชิงลึก</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-96">
          <Input 
            placeholder="Search viruses..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-5 h-5" />}
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full">
          {families.map(family => (
            <button
              key={family}
              onClick={() => setSelectedFamily(family)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                selectedFamily === family 
                  ? 'bg-primary text-white shadow-lg shadow-primary/30 border-primary' 
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:border-primary/50 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {family}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredViruses.map((virus, idx) => (
            <Link key={virus.virusID} href={`/student/learn/detail?id=${virus.virusID}`}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="h-full group cursor-pointer border-slate-700/50 hover:border-primary/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] transition-all duration-300 relative overflow-hidden">
                  {/* Virus SVG watermark */}
                  <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all duration-500 text-primary">
                    <SVGVirus
                      type={familyToVirusType(virus.family)}
                      className="w-20 h-20"
                      glowColor="rgba(59,130,246,0.3)"
                    />
                  </div>

                  <div className="p-6 flex flex-col h-full relative z-10">
                    {/* Virus icon — prominent */}
                    <div className="mb-4 text-primary">
                      <SVGVirus
                        type={familyToVirusType(virus.family)}
                        className="w-14 h-14"
                        glowColor="rgba(59,130,246,0.5)"
                      />
                    </div>

                    <div className="text-xs font-bold text-accent tracking-widest uppercase mb-1">
                      {virus.family}
                    </div>
                    <h3 className="text-base font-black text-white mb-3 leading-tight">
                      {virus.virusName}
                    </h3>
                    <div className="flex gap-2 flex-wrap mb-4">
                      <span className="px-2 py-1 rounded-md text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {virus.genome}
                      </span>
                      {virus.vaccine && (
                        <span className="px-2 py-1 rounded-md text-xs font-bold bg-secondary/15 text-secondary border border-secondary/30">
                          Vaccine ✓
                        </span>
                      )}
                    </div>

                    <div className="mt-auto pt-4 flex items-center justify-between text-primary font-bold text-sm group-hover:translate-x-1 transition-transform border-t border-slate-800">
                      <span>ศึกษาข้อมูล</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </motion.div>
            </Link>
          ))}
          
          {filteredViruses.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 font-mono">
              ไม่พบไวรัสที่ตรงกับคำค้นหาของคุณ
            </div>
          )}
        </div>
      )}
    </div>
  );
}
