import React from 'react';

// Maps virus families → shape type
export type VirusType =
  | 'rabies'        // Rhabdoviridae  — bullet/rod
  | 'parvo'         // Parvoviridae   — icosahedral (naked)
  | 'corona'        // Coronaviridae  — spherical + club spikes
  | 'retro'         // Retroviridae   — spherical enveloped + knob spikes (FIV/FeLV)
  | 'paramyxo'      // Paramyxoviridae — pleomorphic + filament
  | 'arterivirus'   // Arteriviridae (PRRSV) — small enveloped sphere
  | 'picorna'       // Picornaviridae (FMDV) — naked icosahedral
  | 'asfar'         // Asfarviridae (ASFV) — large complex dsDNA
  | 'flavi'         // Flaviviridae (BVDV/CSFV) — enveloped sphere with E protein
  | 'orthomyxo'     // Orthomyxoviridae (Influenza) — spherical segmented + HA/NA
  | 'birna'         // Birnaviridae (IBDV) — icosahedral dsRNA
  | 'herpes'        // Herpesviridae — enveloped icosahedral (tegument)
  | 'reo'           // Reoviridae (Rotavirus) — double-shelled icosahedral
  | 'default';

interface SVGVirusProps {
  type?: VirusType;
  className?: string;
  glowColor?: string;
}

/** Map a virus family string → VirusType */
export function familyToVirusType(family: string): VirusType {
  const f = family.toLowerCase();
  if (f.includes('rhabdo'))     return 'rabies';
  if (f.includes('parvo'))      return 'parvo';
  if (f.includes('corona'))     return 'corona';
  if (f.includes('retro'))      return 'retro';
  if (f.includes('paramyxo'))   return 'paramyxo';
  if (f.includes('arteri'))     return 'arterivirus';
  if (f.includes('picorna'))    return 'picorna';
  if (f.includes('asfar'))      return 'asfar';
  if (f.includes('flavi'))      return 'flavi';
  if (f.includes('orthomyxo'))  return 'orthomyxo';
  if (f.includes('birna'))      return 'birna';
  if (f.includes('herpes'))     return 'herpes';
  if (f.includes('reo'))        return 'reo';
  return 'default';
}

export const SVGVirus: React.FC<SVGVirusProps> = ({
  type = 'default',
  className = 'w-24 h-24',
  glowColor = 'rgba(59,130,246,0.5)',
}) => {
  const s = { filter: `drop-shadow(0 0 10px ${glowColor})` };

  switch (type) {

    /* ── Rhabdoviridae: bullet / bacilliform ───────────────────────── */
    case 'rabies':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <path d="M30,80 C30,92 70,92 70,80 L70,38 C70,18 50,8 50,8 C50,8 30,18 30,38 Z"
            fill="currentColor" opacity="0.85"/>
          <path d="M40,28 Q50,40 60,28 T40,50 T60,72" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.5" strokeDasharray="4 2"/>
          {[-1,1].map(s2 => [40,58].map((y,i) => (
            <line key={`${s2}${i}`} x1={50+s2*20} y1={y} x2={50+s2*32} y2={y} stroke="currentColor" strokeWidth="2.5" opacity="0.8"/>
          )))}
        </svg>
      );

    /* ── Parvoviridae: tiny naked icosahedral ──────────────────────── */
    case 'parvo':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <polygon points="50,14 83,32 83,68 50,86 17,68 17,32"
            fill="currentColor" opacity="0.85"/>
          <line x1="17" y1="32" x2="83" y2="68" stroke="#fff" strokeWidth="1" opacity="0.35"/>
          <line x1="17" y1="68" x2="83" y2="32" stroke="#fff" strokeWidth="1" opacity="0.35"/>
          <line x1="50" y1="14" x2="50" y2="86" stroke="#fff" strokeWidth="1" opacity="0.35"/>
          <circle cx="50" cy="50" r="14" fill="none" stroke="#fff" strokeWidth="2" opacity="0.4" strokeDasharray="3 3"/>
          {[14,32,50,68,86,32,68].map((y,i) => (
            <circle key={i} cx={[50,83,83,50,50,17,17][i]} cy={y} r="3" fill="#fff" opacity="0.5"/>
          ))}
        </svg>
      );

    /* ── Coronaviridae: sphere + club-ended peplomers ──────────────── */
    case 'corona':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <circle cx="50" cy="50" r="26" fill="currentColor" opacity="0.85"/>
          {[0,40,80,120,160,200,240,280,320].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <line x1="50" y1="24" x2="50" y2="9" stroke="currentColor" strokeWidth="3" opacity="0.9"/>
              <circle cx="50" cy="7" r="4.5" fill="currentColor" opacity="0.95"/>
            </g>
          ))}
          <circle cx="50" cy="50" r="10" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.4"/>
          <path d="M36,50 Q50,38 64,50" fill="none" stroke="#fff" strokeWidth="2" opacity="0.4"/>
        </svg>
      );

    /* ── Retroviridae: enveloped sphere + knob glycoproteins ───────── */
    case 'retro':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.8"/>
          <circle cx="50" cy="50" r="16" fill="currentColor" opacity="0.5"/>
          <polygon points="50,34 60,50 50,66 40,50" fill="currentColor" opacity="0.7"/>
          {[0,60,120,180,240,300].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <line x1="50" y1="22" x2="50" y2="12" stroke="currentColor" strokeWidth="2.5" opacity="0.8"/>
              <circle cx="50" cy="10" r="3.5" fill="currentColor" opacity="0.9"/>
            </g>
          ))}
        </svg>
      );

    /* ── Paramyxoviridae: pleomorphic filamentous ──────────────────── */
    case 'paramyxo':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <ellipse cx="50" cy="55" rx="24" ry="30" fill="currentColor" opacity="0.82"/>
          {/* H & N spikes */}
          {[0,45,90,135,180,225,270,315].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 55)`}>
              <line x1="50" y1="25" x2="50" y2="13" stroke="currentColor" strokeWidth="2.5" opacity="0.85"/>
              <rect x="47.5" y="10" width="5" height="4" rx="1" fill="currentColor" opacity="0.9"/>
            </g>
          ))}
          {/* nucleocapsid herringbone */}
          <path d="M36,42 Q50,55 64,42 Q50,68 36,42" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.35" strokeDasharray="3 2"/>
        </svg>
      );

    /* ── Arteriviridae (PRRSV): small enveloped ────────────────────── */
    case 'arterivirus':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <circle cx="50" cy="50" r="24" fill="currentColor" opacity="0.85"/>
          <circle cx="50" cy="50" r="15" fill="none" stroke="#fff" strokeWidth="2" opacity="0.35" strokeDasharray="4 3"/>
          {[0,72,144,216,288].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <line x1="50" y1="26" x2="50" y2="16" stroke="currentColor" strokeWidth="2.5" opacity="0.8"/>
              <circle cx="50" cy="14" r="3" fill="currentColor"/>
            </g>
          ))}
          <circle cx="50" cy="50" r="7" fill="#fff" opacity="0.2"/>
        </svg>
      );

    /* ── Picornaviridae (FMDV): naked icosahedral, pentameric rings ── */
    case 'picorna':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <polygon points="50,12 87,34 87,66 50,88 13,66 13,34"
            fill="currentColor" opacity="0.82"/>
          {/* canyon ring highlight */}
          <polygon points="50,26 74,39 74,61 50,74 26,61 26,39"
            fill="none" stroke="#fff" strokeWidth="2" opacity="0.35"/>
          <circle cx="50" cy="50" r="10" fill="#fff" opacity="0.15"/>
          {[12,34,34,66,66,88,50,13,87,13,87].map((y,i) => (
            <circle key={i} cx={[50,87,13,87,13,50,50,13,87,50,50][i]} cy={y} r="3.5" fill="#fff" opacity="0.55"/>
          ))}
        </svg>
      );

    /* ── Asfarviridae (ASFV): large complex dsDNA icosahedral ──────── */
    case 'asfar':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          {/* outer icosahedral */}
          <polygon points="50,8 89,30 89,70 50,92 11,70 11,30"
            fill="currentColor" opacity="0.75"/>
          {/* inner membrane */}
          <polygon points="50,22 76,37 76,63 50,78 24,63 24,37"
            fill="none" stroke="#fff" strokeWidth="2" opacity="0.45"/>
          {/* core shell */}
          <circle cx="50" cy="50" r="16" fill="#fff" opacity="0.12"/>
          <circle cx="50" cy="50" r="10" fill="currentColor" opacity="0.6"/>
          {/* capsomere dots */}
          {[8,30,30,70,70,92,50,11,89,11,89].map((y,i) => (
            <circle key={i} cx={[50,89,11,89,11,50,50,11,89,50,50][i]} cy={y} r="3" fill="#fff" opacity="0.5"/>
          ))}
        </svg>
      );

    /* ── Flaviviridae (BVDV / CSFV): smooth enveloped sphere ───────── */
    case 'flavi':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <circle cx="50" cy="50" r="28" fill="currentColor" opacity="0.85"/>
          {/* E-protein dimers as short hairpin spikes */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <path d="M47,22 Q50,16 53,22" fill="none" stroke="#fff" strokeWidth="1.8" opacity="0.6"/>
            </g>
          ))}
          <circle cx="50" cy="50" r="14" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.25"/>
          <circle cx="50" cy="50" r="7" fill="#fff" opacity="0.15"/>
        </svg>
      );

    /* ── Orthomyxoviridae (Influenza): sphere + HA rods + NA mushrooms */
    case 'orthomyxo':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <circle cx="50" cy="50" r="26" fill="currentColor" opacity="0.85"/>
          {/* HA spikes (rods) */}
          {[0,60,120,180,240,300].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <line x1="50" y1="24" x2="50" y2="11" stroke="currentColor" strokeWidth="3" opacity="0.9"/>
              <path d="M46,11 L54,11 L50,7 Z" fill="currentColor" opacity="0.9"/>
            </g>
          ))}
          {/* NA spikes (mushroom) */}
          {[30,90,150,210,270,330].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <line x1="50" y1="24" x2="50" y2="12" stroke="currentColor" strokeWidth="2" opacity="0.8"/>
              <circle cx="50" cy="10" r="3.5" fill="currentColor" opacity="0.9"/>
            </g>
          ))}
          {/* segmented genome hint */}
          <path d="M38,50 Q50,40 62,50 T38,50" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.35"/>
        </svg>
      );

    /* ── Birnaviridae (IBDV): naked double-shelled icosahedral ─────── */
    case 'birna':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <polygon points="50,13 85,33 85,67 50,87 15,67 15,33"
            fill="currentColor" opacity="0.85"/>
          <polygon points="50,25 72,37 72,63 50,75 28,63 28,37"
            fill="none" stroke="#fff" strokeWidth="2" opacity="0.4"/>
          {/* T=13 lattice dots */}
          {[13,33,33,67,67,87].map((y,i) => (
            <circle key={i} cx={[50,85,15,85,15,50][i]} cy={y} r="3" fill="#fff" opacity="0.55"/>
          ))}
          <circle cx="50" cy="50" r="12" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.3"/>
        </svg>
      );

    /* ── Herpesviridae: enveloped icosahedral with tegument ─────────── */
    case 'herpes':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          {/* envelope */}
          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.75"/>
          {/* tegument */}
          <circle cx="50" cy="50" r="23" fill="currentColor" opacity="0.3"/>
          {/* capsid */}
          <polygon points="50,27 68,37 68,63 50,73 32,63 32,37"
            fill="currentColor" opacity="0.8"/>
          {/* glycoprotein spikes on envelope */}
          {[0,45,90,135,180,225,270,315].map((a, i) => (
            <g key={i} transform={`rotate(${a} 50 50)`}>
              <line x1="50" y1="20" x2="50" y2="12" stroke="currentColor" strokeWidth="2" opacity="0.7"/>
              <circle cx="50" cy="11" r="2.5" fill="currentColor" opacity="0.8"/>
            </g>
          ))}
          {/* DNA strands inside */}
          <path d="M40,50 Q50,44 60,50 T40,50" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.4"/>
        </svg>
      );

    /* ── Reoviridae (Rotavirus): double-layered icosahedral wheel ──── */
    case 'reo':
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          {/* outer capsid */}
          <polygon points="50,10 88,32 88,68 50,90 12,68 12,32"
            fill="currentColor" opacity="0.8"/>
          {/* inner layer */}
          <polygon points="50,24 74,37 74,63 50,76 26,63 26,37"
            fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.45"/>
          {/* spoke-and-hub (wheel) */}
          {[0,60,120,180,240,300].map((a, i) => (
            <line key={i}
              x1="50" y1="50"
              x2={50 + 20*Math.cos((a-90)*Math.PI/180)}
              y2={50 + 20*Math.sin((a-90)*Math.PI/180)}
              stroke="#fff" strokeWidth="1.5" opacity="0.4"/>
          ))}
          <circle cx="50" cy="50" r="8" fill="#fff" opacity="0.2"/>
          {/* vertex dots */}
          {[10,32,32,68,68,90].map((y,i) => (
            <circle key={i} cx={[50,88,12,88,12,50][i]} cy={y} r="3.5" fill="#fff" opacity="0.6"/>
          ))}
        </svg>
      );

    /* ── Default: bacteriophage ─────────────────────────────────────── */
    default:
      return (
        <svg viewBox="0 0 100 100" className={className} style={s}>
          <polygon points="35,18 65,18 78,40 50,58 22,40" fill="currentColor" opacity="0.85"/>
          <line x1="50" y1="58" x2="50" y2="78" stroke="currentColor" strokeWidth="4" opacity="0.8"/>
          <line x1="50" y1="78" x2="35" y2="93" stroke="currentColor" strokeWidth="2.5" opacity="0.8"/>
          <line x1="50" y1="78" x2="65" y2="93" stroke="currentColor" strokeWidth="2.5" opacity="0.8"/>
          <line x1="50" y1="68" x2="30" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
          <line x1="50" y1="68" x2="70" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.6"/>
          <circle cx="50" cy="35" r="8" fill="#fff" opacity="0.2"/>
        </svg>
      );
  }
};
