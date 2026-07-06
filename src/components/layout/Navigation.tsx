"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { sfx } from '@/utils/sound';
import { 
  LayoutDashboard, 
  Gamepad2, 
  BookOpen, 
  Settings, 
  LogOut,
  Crosshair,
  Database,
  Users,
  Trophy
} from 'lucide-react';
import { auth } from '@/lib/firebase/config';

export function Navigation() {
  const pathname = usePathname();
  const { appUser } = useAuth();

  if (!appUser) return null;

  const handleLogout = async () => {
    sfx.click();
    await auth.signOut();
  };

  const playHover = () => sfx.hover();
  const playClick = () => sfx.click();

  // --------------------------------------------------------
  // GAME HUD (STUDENT)
  // --------------------------------------------------------
  if (appUser.role === 'student') {
    const studentLinks = [
      { href: '/student', icon: LayoutDashboard, label: 'Player Hub' },
      { href: '/student/play', icon: Gamepad2, label: 'Missions' },
      { href: '/student/learn', icon: Database, label: 'Codex' },
      { href: '/student/leaderboard', icon: Trophy, label: 'Rankings' },
      { href: '/student/profile', icon: Settings, label: 'Gear' },
    ];

    return (
      <>
        {/* Top HUD — has a backdrop so content never bleeds through */}
        <div className="fixed top-0 left-0 right-0 h-16 z-50 px-6 flex justify-between items-center bg-slate-950/80 backdrop-blur-md border-b border-primary/10">
          <div className="text-primary font-bold tracking-widest text-glow flex items-center gap-2 select-none">
            <Crosshair className="w-5 h-5 animate-pulse" />
            <span className="hidden xs:inline">VET_VIRUS_OS</span>
            <span className="text-slate-500">v1.0</span>
          </div>
          <button 
            onClick={handleLogout}
            onMouseEnter={playHover}
            className="flex items-center gap-2 text-danger font-bold hover:text-red-400 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" /> ABORT
          </button>
        </div>

        {/* Bottom Game Console Bar */}
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg">
          <div className="glass-neon rounded-full px-4 py-2 md:px-6 md:py-3 flex justify-between items-center relative">
            {studentLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              const Icon = link.icon;
              
              return (
                <Link key={link.href} href={link.href} onClick={playClick} onMouseEnter={playHover}>
                  <div className={`relative p-3 flex flex-col items-center group transition-all duration-300 ${isActive ? 'text-primary' : 'text-slate-400 hover:text-white'}`}>
                    <Icon className={`w-6 h-6 mb-1 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-0 group-hover:opacity-100 transition-opacity absolute -top-6 bg-black/80 px-2 py-1 rounded text-primary border border-primary/30">
                      {link.label}
                    </span>
                    {isActive && (
                      <motion.div 
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/20 rounded-full -z-10 blur-sm"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  // --------------------------------------------------------
  // INSTRUCTOR SIDEBAR (Classic Dashboard)
  // --------------------------------------------------------
  const instructorLinks = [
    { href: '/instructor', icon: LayoutDashboard, label: 'Overview' },
    { href: '/instructor/games', icon: Gamepad2, label: 'Game Content' },
    { href: '/instructor/viruses', icon: Database, label: 'Virus Database' },
    { href: '/instructor/students', icon: Users, label: 'Student Progress' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 h-screen fixed top-0 left-0 glass border-r border-slate-200 dark:border-slate-800 z-40">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            VetVirus Quest
          </h1>
          <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">Instructor Panel</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {instructorLinks.map((link) => {
            const isActive = link.href === '/instructor'
              ? pathname === '/instructor'
              : (pathname === link.href || pathname.startsWith(`${link.href}/`));
            const Icon = link.icon;
            
            return (
              <Link key={link.href} href={link.href}>
                <div className={`flex items-center px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}>
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{link.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 mt-auto">
          <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 text-danger hover:bg-danger/10 rounded-xl transition-colors font-medium">
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Tab for Instructor */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-200 dark:border-slate-800 z-40 flex justify-around p-3 pb-safe">
        {instructorLinks.map((link) => {
          const isActive = link.href === '/instructor'
            ? pathname === '/instructor'
            : (pathname === link.href || pathname.startsWith(`${link.href}/`));
          const Icon = link.icon;
          
          return (
            <Link key={link.href} href={link.href}>
              <div className={`p-2 rounded-xl flex flex-col items-center ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-[10px] font-medium">{link.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
