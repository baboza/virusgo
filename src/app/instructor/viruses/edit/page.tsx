"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVirus, createVirus, updateVirus } from '@/lib/firebase/virusService';
import { Virus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  ArrowLeft, Save, Bug, Dna, Stethoscope, Microscope, 
  Syringe, HeartPulse, ShieldCheck, Image as ImageIcon, 
  CheckCircle2, AlertCircle 
} from 'lucide-react';
import Link from 'next/link';

const initialVirusState: Omit<Virus, 'virusID'> = {
  virusName: '',
  family: '',
  genus: '',
  genome: '',
  host: [],
  transmission: [],
  pathogenesis: '',
  clinicalSigns: [],
  diagnosis: [],
  treatment: '',
  prevention: [],
  vaccine: false,
  image: '',
  references: []
};

function VirusFormContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get('id');
  const isEdit = id !== null && id !== 'new' && id !== '';

  const [virus, setVirus] = useState<Omit<Virus, 'virusID'>>(initialVirusState);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      const fetchVirus = async () => {
        try {
          const data = await getVirus(id);
          if (data) {
            setVirus({
              virusName: data.virusName || '',
              family: data.family || '',
              genus: data.genus || '',
              genome: data.genome || '',
              host: data.host || [],
              transmission: data.transmission || [],
              pathogenesis: data.pathogenesis || '',
              clinicalSigns: data.clinicalSigns || [],
              diagnosis: data.diagnosis || [],
              treatment: data.treatment || '',
              prevention: data.prevention || [],
              vaccine: Boolean(data.vaccine),
              image: data.image || '',
              references: data.references || []
            });
          } else {
            setError("ไม่พบข้อมูลเชื้อไวรัสที่ระบุ");
          }
        } catch (err: any) {
          setError("เกิดข้อผิดพลาดในการดึงข้อมูลไวรัส: " + err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchVirus();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setVirus(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof Virus) => {
    const { value } = e.target;
    setVirus(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()).filter(Boolean) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEdit && id) {
        await updateVirus(id, virus);
      } else {
        await createVirus(virus);
      }
      router.push('/instructor/viruses');
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
        <div className="text-slate-400 font-mono text-xs">กำลังโหลดฟอร์มข้อมูลเชื้อไวรัส...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/instructor/viruses" className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <Bug className="w-6 h-6 text-emerald-400" />
              <span>{isEdit ? `แก้ไขเชื้อ: ${virus.virusName || id}` : 'เพิ่มเชื้อไวรัสใหม่เข้าสู่ระบบ'}</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {isEdit ? `Virus ID: ${id}` : 'กรอกรายละเอียดทางไวรัสวิทยาและข้อมูลคลินิก'}
            </p>
          </div>
        </div>

        <Link href="/instructor/viruses">
          <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs">
            ยกเลิก
          </Button>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Container */}
      <Card className="p-6 md:p-8 glass border-slate-800 bg-slate-900/60 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Virology Classification */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-emerald-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Dna className="w-4 h-4" /> 1. ข้อมูลทางอนุกรมวิธาน & สารพันธุกรรม (Taxonomy & Genome)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  ชื่อไวรัส (Virus Name) <span className="text-rose-400">*</span>
                </label>
                <Input 
                  name="virusName" 
                  value={virus.virusName} 
                  onChange={handleChange} 
                  placeholder="เช่น Canine Parvovirus (CPV-2)"
                  required 
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  วงศ์ (Family) <span className="text-rose-400">*</span>
                </label>
                <Input 
                  name="family" 
                  value={virus.family} 
                  onChange={handleChange} 
                  placeholder="เช่น Parvoviridae, Coronaviridae"
                  required 
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  จีนัส (Genus)
                </label>
                <Input 
                  name="genus" 
                  value={virus.genus} 
                  onChange={handleChange} 
                  placeholder="เช่น Protoparvovirus, Betacoronavirus"
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  สารพันธุกรรม (Genome Type) <span className="text-rose-400">*</span>
                </label>
                <Input 
                  name="genome" 
                  value={virus.genome} 
                  onChange={handleChange} 
                  placeholder="เช่น ssDNA, ssRNA (+), ssRNA (-), dsDNA"
                  required 
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Epidemiology & Hosts */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Bug className="w-4 h-4" /> 2. ระบาดวิทยา & สัตว์โฮสต์ (Epidemiology & Hosts)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  สัตว์ที่เป็นโฮสต์ (Host Species) <span className="text-slate-500 font-mono">(คั่นด้วยจุลภาค ,)</span>
                </label>
                <Input 
                  name="host" 
                  value={virus.host.join(', ')} 
                  onChange={(e) => handleArrayChange(e, 'host')} 
                  placeholder="สุนัข, สัตว์ตระกูลสุนัข"
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  ช่องทางการแพร่กระจาย (Transmission) <span className="text-slate-500 font-mono">(คั่นด้วยจุลภาค ,)</span>
                </label>
                <Input 
                  name="transmission" 
                  value={virus.transmission.join(', ')} 
                  onChange={(e) => handleArrayChange(e, 'transmission')} 
                  placeholder="Fecal-oral, ละอองฝอย, น้ำลาย"
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                กลไกการเกิดโรค (Pathogenesis)
              </label>
              <textarea 
                name="pathogenesis" 
                value={virus.pathogenesis} 
                onChange={handleChange}
                placeholder="อธิบายกลไกการบุกรุกเซลล์ อวัยวะเป้าหมาย และการทำลายเนื้อเยื่อ..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 resize-y"
              />
            </div>
          </div>

          {/* Section 3: Clinical & Diagnosis */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-amber-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Stethoscope className="w-4 h-4" /> 3. อาการทางคลินิก & การตรวจวินิจฉัย (Clinical & Diagnosis)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  อาการทางคลินิก (Clinical Signs) <span className="text-slate-500 font-mono">(คั่นด้วยจุลภาค ,)</span>
                </label>
                <textarea 
                  name="clinicalSigns" 
                  value={virus.clinicalSigns.join(', ')} 
                  onChange={(e) => handleArrayChange(e, 'clinicalSigns')} 
                  placeholder="ไข้สูง, อาเจียน, ท้องเสียเป็นเลือด, เม็ดเลือดขาวต่ำ"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-y"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  วิธีตรวจทางห้องปฏิบัติการ (Diagnosis) <span className="text-slate-500 font-mono">(คั่นด้วยจุลภาค ,)</span>
                </label>
                <textarea 
                  name="diagnosis" 
                  value={virus.diagnosis.join(', ')} 
                  onChange={(e) => handleArrayChange(e, 'diagnosis')} 
                  placeholder="SNAP test, PCR, FAT, ELISA, Virus Isolation"
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 resize-y"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Treatment, Vaccine & Media */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-purple-400 uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-slate-800">
              <Syringe className="w-4 h-4" /> 4. การรักษา การป้องกัน & รูปภาพ (Treatment, Vaccine & Image)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  แนวทางการรักษา (Treatment)
                </label>
                <Input 
                  name="treatment" 
                  value={virus.treatment} 
                  onChange={handleChange} 
                  placeholder="Supportive care, ให้สารน้ำ, ยาต้านจุลชีพคุมเชื้อแทรกซ้อน"
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  มาตรการป้องกัน (Prevention) <span className="text-slate-500 font-mono">(คั่นด้วยจุลภาค ,)</span>
                </label>
                <Input 
                  name="prevention" 
                  value={virus.prevention.join(', ')} 
                  onChange={(e) => handleArrayChange(e, 'prevention')} 
                  placeholder="ฉีดวัคซีนรวม, กักกันโรค, ทำลายเชื้อด้วย Bleach"
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  ลิงก์รูปภาพตัวอย่างเชื้อ (Image URL)
                </label>
                <Input 
                  name="image" 
                  value={virus.image} 
                  onChange={handleChange} 
                  placeholder="https://images.unsplash.com/..."
                  className="bg-slate-950 border-slate-800 text-white rounded-xl text-sm"
                />
              </div>

              {/* Vaccine Toggle Checkbox */}
              <div className="pt-4">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors">
                  <input 
                    type="checkbox" 
                    id="vaccine" 
                    checked={virus.vaccine} 
                    onChange={(e) => setVirus(prev => ({ ...prev, vaccine: e.target.checked }))}
                    className="w-5 h-5 accent-emerald-500 rounded"
                  />
                  <div>
                    <span className="text-sm font-bold text-white block">มีวัคซีนป้องกันในเชิงสัตวแพทย์ (Vaccine Available)</span>
                    <span className="text-[11px] text-slate-400">เลือกหากมีวัคซีนสำเร็จรูปที่ได้รับอนุญาตให้ใช้ในคลินิก</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Image Preview if provided */}
            {virus.image && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                  <img 
                    src={virus.image} 
                    alt="Preview" 
                    className="w-full h-full object-cover" 
                    onError={(e) => { (e.target as any).style.display = 'none'; }}
                  />
                </div>
                <div className="text-xs">
                  <span className="text-emerald-400 font-bold block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ภาพพรีวิวตัวอย่าง
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono break-all line-clamp-1">{virus.image}</span>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800">
            <Link href="/instructor/viruses">
              <Button type="button" variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs px-5">
                ยกเลิก
              </Button>
            </Link>
            <Button 
              type="submit" 
              disabled={saving} 
              leftIcon={<Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 shadow-lg shadow-emerald-600/25"
            >
              {saving ? 'กำลังบันทึกข้อมูล...' : isEdit ? 'บันทึกการแก้ไข' : 'บันทึกเชื้อไวรัสใหม่'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function VirusForm() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Loading Editor...</div>}>
      <VirusFormContent />
    </Suspense>
  );
}
