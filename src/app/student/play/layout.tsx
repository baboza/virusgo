"use client";

import React from 'react';
import { BackgroundSVG } from '@/components/ui/BackgroundSVG';
import { usePathname } from 'next/navigation';

export default function PlayLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Determine SVG type based on pathname
  let svgType: 'virus' | 'lab' | 'defense' | 'medical' = 'virus';
  if (pathname.includes('lab-detective')) svgType = 'lab';
  else if (pathname.includes('farm-defense') || pathname.includes('boss-battle') || pathname.includes('virus-battle')) svgType = 'defense';
  else if (pathname.includes('diagnosis-duel') || pathname.includes('outbreak')) svgType = 'medical';

  return (
    <div className="relative min-h-screen">
      <BackgroundSVG type={svgType} />
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
