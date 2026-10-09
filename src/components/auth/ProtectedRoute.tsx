"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in, redirect to login
        router.push('/login');
      } else if (appUser && allowedRoles && !allowedRoles.includes(appUser.role)) {
        // Logged in but doesn't have the right role
        // Redirect to their respective dashboard
        if (appUser.role === 'student') {
          router.push('/student');
        } else if (appUser.role === 'instructor') {
          router.push('/instructor');
        }
      }
    }
  }, [user, appUser, loading, allowedRoles, router]);

  // Show loading spinner while checking auth
  if (loading || !user || (appUser && allowedRoles && !allowedRoles.includes(appUser.role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If we reach here, they are authorized
  return <>{children}</>;
};
