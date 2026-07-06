import React from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Navigation } from '@/components/layout/Navigation';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <div className="flex min-h-screen bg-slate-950 text-slate-200 selection:bg-primary/30">
        <Navigation />
        <main className="flex-1 w-full md:ml-64 pb-20 md:pb-0 relative overflow-hidden">
          {/* Background Ambient Glow */}
          <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/10 blur-[100px] pointer-events-none rounded-full" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-danger/10 blur-[100px] pointer-events-none rounded-full" />
          
          <div className="p-4 md:p-8 max-w-7xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
