"use client";

import React, { useEffect, useState } from 'react';
import { getViruses, deleteVirus } from '@/lib/firebase/virusService';
import { Virus } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Search, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

export default function InstructorViruses() {
  const [viruses, setViruses] = useState<Virus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchViruses();
  }, []);

  const fetchViruses = async () => {
    setLoading(true);
    try {
      const data = await getViruses();
      setViruses(data);
    } catch (error) {
      console.error("Error fetching viruses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this virus?")) {
      try {
        await deleteVirus(id);
        setViruses(viruses.filter(v => v.virusID !== id));
      } catch (error) {
        console.error("Error deleting virus:", error);
      }
    }
  };

  const filteredViruses = viruses.filter(v => 
    v.virusName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    v.family.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Virus Database</h1>
          <p className="text-slate-500 mt-1">Manage the virology encyclopedia content.</p>
        </div>
        <Link href="/instructor/viruses/edit?id=new">
          <Button leftIcon={<Plus className="w-5 h-5" />}>Add New Virus</Button>
        </Link>
      </div>

      <Card className="p-4 md:p-6 glass">
        <div className="mb-6 flex items-center">
          <div className="w-full md:max-w-md">
            <Input 
              placeholder="Search by name or family..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          </div>
        ) : filteredViruses.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-slate-500 text-center">
            <AlertCircle className="w-12 h-12 mb-3 text-slate-400" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">No viruses found</h3>
            <p>Get started by adding a new virus to the database.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-sm text-slate-500">
                  <th className="pb-3 font-medium px-4">Virus Name</th>
                  <th className="pb-3 font-medium px-4">Family</th>
                  <th className="pb-3 font-medium px-4">Genome</th>
                  <th className="pb-3 font-medium px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredViruses.map((virus, index) => (
                  <motion.tr 
                    key={virus.virusID}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-4 px-4 font-semibold text-slate-900 dark:text-slate-100">{virus.virusName}</td>
                    <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{virus.family}</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        {virus.genome}
                      </span>
                    </td>
                    <td className="py-4 px-4 flex justify-end gap-2">
                      <Link href={`/instructor/viruses/edit?id=${virus.virusID}`}>
                        <Button variant="ghost" size="sm" className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-8 w-8 text-slate-500 hover:text-danger hover:bg-danger/10 border-none"
                        onClick={() => handleDelete(virus.virusID)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
