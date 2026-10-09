"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Microscope, Activity, Bug } from 'lucide-react';

interface BackgroundSVGProps {
  type?: 'virus' | 'lab' | 'defense' | 'medical';
}

export function BackgroundSVG({ type = 'virus' }: BackgroundSVGProps) {
  const getIcon = () => {
    switch (type) {
      case 'lab': return <Microscope className="w-full h-full" />;
      case 'defense': return <ShieldAlert className="w-full h-full" />;
      case 'medical': return <Activity className="w-full h-full" />;
      case 'virus':
      default:
        return <Bug className="w-full h-full" />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'lab': return 'text-purple-500/5';
      case 'defense': return 'text-emerald-500/5';
      case 'medical': return 'text-cyan-500/5';
      case 'virus':
      default:
        return 'text-danger/5';
    }
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Huge rotating icon in bottom right */}
      <motion.div
        className={`absolute -bottom-32 -right-32 w-[600px] h-[600px] ${getColor()}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
      >
        {getIcon()}
      </motion.div>
      
      {/* Huge rotating icon in top left */}
      <motion.div
        className={`absolute -top-32 -left-32 w-[400px] h-[400px] ${getColor()}`}
        animate={{ rotate: -360 }}
        transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
      >
        {getIcon()}
      </motion.div>

      {/* Floating small icons */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute w-24 h-24 ${getColor()} opacity-50`}
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -50, 0],
            rotate: [0, 90, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2
          }}
        >
          {getIcon()}
        </motion.div>
      ))}
    </div>
  );
}
