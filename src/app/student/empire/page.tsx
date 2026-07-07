"use client";

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, onSnapshot, query, setDoc, doc } from 'firebase/firestore';
import { EmpireTile } from '@/types';
import { SVGVirus } from '@/components/ui/SVGVirus';
import { Loader2, Crosshair, Map, Shield, Swords, Info, AlertTriangle, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const MAP_SIZE = 20;

// Generate a color based on UID
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

export default function EmpireMap() {
  const { appUser } = useAuth();
  const router = useRouter();
  const [tiles, setTiles] = useState<Record<string, EmpireTile>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTile, setSelectedTile] = useState<{x: number, y: number} | null>(null);

  useEffect(() => {
    if (!appUser) return;

    // Check if user has pet
    if ((appUser.exp || 0) < 1000) {
      router.push('/student');
      return;
    }

    const q = query(collection(db, 'empire_tiles'));
    const unsub = onSnapshot(q, (snap) => {
      const newTiles: Record<string, EmpireTile> = {};
      let bossCount = 0;
      snap.forEach(d => {
        const t = d.data() as EmpireTile;
        newTiles[d.id] = t;
        if (t.type === 'boss') bossCount++;
      });
      setTiles(newTiles);
      setLoading(false);

      // Auto-spawn bosses if needed
      if (bossCount < 10) {
        spawnBosses(10 - bossCount, newTiles);
      }
    });

    return () => unsub();
  }, [appUser, router]);

  const spawnBosses = async (count: number, currentTiles: Record<string, EmpireTile>) => {
    const families = ['rabies', 'corona', 'parvo', 'herpes', 'pox'];
    let spawned = 0;
    for (let i = 0; i < 50; i++) {
      if (spawned >= count) break;
      const x = Math.floor(Math.random() * MAP_SIZE);
      const y = Math.floor(Math.random() * MAP_SIZE);
      const id = `${x},${y}`;
      if (!currentTiles[id]) {
        const family = families[Math.floor(Math.random() * families.length)];
        const tileRef = doc(db, 'empire_tiles', id);
        const newBoss: EmpireTile = { id, x, y, type: 'boss', ownerFamily: family };
        setDoc(tileRef, newBoss);
        currentTiles[id] = newBoss; // prevent dupes in same loop
        spawned++;
      }
    }
  };

  const handleInfect = () => {
    if (!selectedTile || !canInfect) return;
    const tileId = `${selectedTile.x},${selectedTile.y}`;
    // Navigate to battle page with tileId
    router.push(`/student/empire/battle?tile=${tileId}`);
  };

  const activeTileData = selectedTile ? tiles[`${selectedTile.x},${selectedTile.y}`] : null;
  const isMyTile = activeTileData?.ownerUid === appUser?.uid;

  // Adjacency Check
  const checkAdjacency = () => {
    if (!selectedTile || !appUser) return false;
    const myTiles = Object.values(tiles).filter(t => t.ownerUid === appUser.uid);
    if (myTiles.length === 0) return true; // First tile can be anywhere
    const { x, y } = selectedTile;
    // 4-way adjacency
    return myTiles.some(t => Math.abs(t.x - x) + Math.abs(t.y - y) === 1);
  };
  const canInfect = checkAdjacency();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative overflow-hidden bg-slate-950">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-black text-cyan-400 uppercase tracking-widest text-glow flex items-center gap-3">
              <Map className="w-8 h-8" />
              Infection Zone
            </h1>
            <p className="text-slate-400 font-mono mt-1">Conquer cells and expand your virus empire</p>
          </div>
          <Link href="/student">
            <Button variant="secondary" className="font-black uppercase tracking-widest">
              Back to Hub
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
          
          {/* Map Area */}
          <div className="lg:col-span-2 glass rounded-3xl p-6 border-slate-700/50 relative overflow-hidden">
            <div className="overflow-auto custom-scrollbar h-[600px] w-full rounded-2xl bg-slate-950/50 border border-slate-800">
              <div 
                className="relative grid gap-1 p-4 w-max"
                style={{ gridTemplateColumns: `repeat(${MAP_SIZE}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: MAP_SIZE * MAP_SIZE }).map((_, i) => {
                  const x = i % MAP_SIZE;
                  const y = Math.floor(i / MAP_SIZE);
                  const id = `${x},${y}`;
                  const tile = tiles[id];
                  
                  const isSelected = selectedTile?.x === x && selectedTile?.y === y;
                  const tileColor = tile?.type === 'player' ? (tile.color || stringToColor(tile.ownerUid!)) : undefined;

                  return (
                    <motion.div
                      key={id}
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setSelectedTile({ x, y })}
                      className={`w-10 h-10 md:w-12 md:h-12 rounded-md cursor-pointer transition-colors border ${
                        isSelected ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.5)] z-20' : 'border-slate-800/50'
                      } ${!tile ? 'bg-slate-900 hover:bg-slate-800' : ''}`}
                      style={{
                        backgroundColor: tileColor,
                        boxShadow: tileColor ? `0 0 10px ${tileColor}40` : undefined,
                        backgroundImage: tile?.type === 'boss' ? 'linear-gradient(45deg, #ef4444 0%, #991b1b 100%)' : undefined
                      }}
                    >
                      {tile?.type === 'boss' && (
                        <div className="w-full h-full p-1 flex items-center justify-center bg-black/40 rounded-md">
                           <SVGVirus type={tile.ownerFamily as any} className="w-full h-full text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]" />
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedTile ? (
                <motion.div
                  key="selected"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className="glass p-6 border-slate-700/50 backdrop-blur-md sticky top-24">
                    <h3 className="text-xl font-black text-white uppercase tracking-widest border-b border-slate-700 pb-4 mb-4 flex items-center justify-between">
                      Sector [{selectedTile.x}, {selectedTile.y}]
                      {isMyTile && <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md">YOURS</span>}
                    </h3>
                    
                    {!activeTileData && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-300">
                          <Info className="text-cyan-400" />
                          <span>Unclaimed Host Cell</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          A weak cell ready to be infected. Conquer this sector to increase your biomass production.
                        </p>
                        <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-sm font-mono text-slate-400 flex justify-between">
                          <span>Est. Defense:</span>
                          <span className="text-white">Very Low</span>
                        </div>
                        {!canInfect && (
                          <div className="text-xs text-orange-400 bg-orange-900/20 p-2 rounded-lg flex items-center gap-2">
                            <Lock className="w-4 h-4" /> You must own an adjacent tile to infect here.
                          </div>
                        )}
                        <Button 
                          onClick={handleInfect}
                          disabled={!canInfect}
                          className={`w-full mt-4 font-black py-4 uppercase tracking-widest ${canInfect ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]' : 'bg-slate-800 text-slate-500'}`}
                        >
                          <Crosshair className="w-5 h-5 mr-2" />
                          Infect Sector
                        </Button>
                      </div>
                    )}

                    {activeTileData?.type === 'player' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-300">
                          <Shield className="text-purple-400" />
                          <span>Controlled by:</span>
                        </div>
                        <div className="text-2xl font-black text-white" style={{ color: activeTileData.color || stringToColor(activeTileData.ownerUid!) }}>
                          {activeTileData.ownerName}
                        </div>
                        <p className="text-sm text-slate-400">
                          Protected by {activeTileData.ownerFamily} virus.
                        </p>
                        
                        {!isMyTile && (
                          <>
                            {!canInfect && (
                              <div className="text-xs text-orange-400 bg-orange-900/20 p-2 rounded-lg flex items-center gap-2">
                                <Lock className="w-4 h-4" /> You must own an adjacent tile to raid here.
                              </div>
                            )}
                            <Button 
                              onClick={handleInfect}
                              disabled={!canInfect}
                              className={`w-full mt-4 font-black py-4 uppercase tracking-widest ${canInfect ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.3)]' : 'bg-slate-800 text-slate-500'}`}
                            >
                              <Swords className="w-5 h-5 mr-2" />
                              Raid Sector
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    {activeTileData?.type === 'boss' && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-red-400">
                          <AlertTriangle className="text-red-500" />
                          <span className="font-black uppercase">Immune System Boss</span>
                        </div>
                        <p className="text-sm text-slate-400">
                          High value target. Contains massive EXP rewards and unique resources.
                        </p>
                        <div className="bg-red-900/20 p-3 rounded-xl border border-red-900/50 text-sm font-mono text-slate-400 flex justify-between">
                          <span>Est. Defense:</span>
                          <span className="text-red-400 font-bold">EXTREME</span>
                        </div>
                        {!canInfect && (
                          <div className="text-xs text-orange-400 bg-orange-900/20 p-2 rounded-lg flex items-center gap-2">
                            <Lock className="w-4 h-4" /> You must own an adjacent tile to engage boss.
                          </div>
                        )}
                        <Button 
                          onClick={handleInfect}
                          disabled={!canInfect}
                          className={`w-full mt-4 font-black py-4 uppercase tracking-widest ${canInfect ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-slate-800 text-slate-500'}`}
                        >
                          <Swords className="w-5 h-5 mr-2" />
                          Engage Boss
                        </Button>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex items-center justify-center p-6 text-center text-slate-500 font-mono"
                >
                  <p>Select a sector on the map to view details or launch an infection.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
