"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { getVirus, createVirus, updateVirus } from '@/lib/firebase/virusService';
import { Virus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';
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
            setVirus(data);
          } else {
            setError("Virus not found");
          }
        } catch (err) {
          setError("Failed to fetch virus data");
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
    setVirus(prev => ({ ...prev, [field]: value.split(',').map(s => s.trim()).filter(s => s) }));
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
      setError(err.message || 'Failed to save virus');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/instructor/viruses">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          {isEdit ? 'Edit Virus' : 'Add New Virus'}
        </h1>
      </div>

      <Card className="p-6 md:p-8 glass">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Virus Name" 
              name="virusName" 
              value={virus.virusName} 
              onChange={handleChange} 
              required 
            />
            <Input 
              label="Family" 
              name="family" 
              value={virus.family} 
              onChange={handleChange} 
              required 
            />
            <Input 
              label="Genus" 
              name="genus" 
              value={virus.genus} 
              onChange={handleChange} 
            />
            <Input 
              label="Genome Type (e.g. ssRNA+, dsDNA)" 
              name="genome" 
              value={virus.genome} 
              onChange={handleChange} 
              required 
            />
            <Input 
              label="Host Species (comma separated)" 
              name="host" 
              value={virus.host.join(', ')} 
              onChange={(e) => handleArrayChange(e, 'host')} 
            />
            <Input 
              label="Transmission (comma separated)" 
              name="transmission" 
              value={virus.transmission.join(', ')} 
              onChange={(e) => handleArrayChange(e, 'transmission')} 
            />
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Pathogenesis</label>
              <textarea 
                name="pathogenesis" 
                value={virus.pathogenesis} 
                onChange={handleChange}
                className="w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
            
            <Input 
              label="Clinical Signs (comma separated)" 
              name="clinicalSigns" 
              value={virus.clinicalSigns.join(', ')} 
              onChange={(e) => handleArrayChange(e, 'clinicalSigns')} 
            />
            
            <Input 
              label="Diagnosis Methods (comma separated)" 
              name="diagnosis" 
              value={virus.diagnosis.join(', ')} 
              onChange={(e) => handleArrayChange(e, 'diagnosis')} 
            />

            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="vaccine" 
                checked={virus.vaccine} 
                onChange={(e) => setVirus(prev => ({ ...prev, vaccine: e.target.checked }))}
                className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <label htmlFor="vaccine" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Vaccine Available
              </label>
            </div>
          </div>

          {error && <p className="text-danger text-sm font-medium">{error}</p>}

          <div className="flex justify-end pt-6 border-t border-slate-200 dark:border-slate-800">
            <Button type="submit" isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
              {isEdit ? 'Save Changes' : 'Create Virus'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function VirusForm() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Loading Editor...</div>}>
      <VirusFormContent />
    </Suspense>
  );
}
