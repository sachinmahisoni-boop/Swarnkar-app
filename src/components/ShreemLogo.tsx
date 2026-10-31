import React, { useState } from 'react';

interface ShreemLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'gold' | 'monochrome' | 'dark';
  customLogo?: string;
  transparentBg?: boolean;
}

export const ShreemLogo: React.FC<ShreemLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'gold',
  customLogo,
  transparentBg = false,
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeMap = {
    sm: { img: 'w-9 h-9', icon: 36, text: 'text-sm', sub: 'text-[9px]' },
    md: { img: 'w-12 h-12', icon: 48, text: 'text-base', sub: 'text-[10px]' },
    lg: { img: 'w-16 h-16', icon: 64, text: 'text-xl', sub: 'text-xs' },
    xl: { img: 'w-24 h-24', icon: 96, text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];
  const logoSrc = customLogo || '/assets/aistudio/Shreem_Mahal_LOGO_355a8e42.png';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Temple Dome Kalash & Sri Yantra "श्रीः" Emblem / Custom Profile Logo */}
      <div 
        className={`relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden transition-all duration-200 print:bg-transparent print:border-none print:shadow-none ${
          transparentBg 
            ? 'p-0.5 bg-transparent' 
            : 'p-1 shadow-md bg-gradient-to-b from-amber-950/40 via-slate-900/50 to-slate-950/70 border border-amber-500/30'
        }`}
      >
        {!imgError ? (
          <img
            src={logoSrc}
            alt="Shreem Mahal Jewellers Official Emblem"
            onError={() => setImgError(true)}
            className={`${currentSize.img} object-contain drop-shadow-[0_2px_10px_rgba(245,158,11,0.55)] transition-transform duration-200`}
            loading="eager"
          />
        ) : (
          <svg
            width={currentSize.icon}
            height={currentSize.icon}
            viewBox="0 0 120 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
          >
            <defs>
              <linearGradient id="goldDomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="25%" stopColor="#FBBF24" />
                <stop offset="60%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="kalashGrad" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#FEF08A" />
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
              <radialGradient id="sunburst" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FEF3C7" stopOpacity="0.9" />
                <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#B45309" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="textGold" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="40%" stopColor="#FDE68A" />
                <stop offset="70%" stopColor="#F59E0B" />
                <stop offset="100%" stopColor="#92400E" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="65" r="46" fill="url(#sunburst)" />
            <circle cx="60" cy="65" r="48" stroke="url(#goldDomeGrad)" strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="60" cy="65" r="44" stroke="url(#goldDomeGrad)" strokeWidth="1" />
            <path d="M 60 4 L 62 11 L 60 14 L 58 11 Z" fill="url(#kalashGrad)" />
            <path d="M 52 16 Q 60 11 68 16 Q 66 22 60 22 Q 54 22 52 16 Z" fill="url(#kalashGrad)" stroke="#78350F" strokeWidth="0.5" />
            <circle cx="60" cy="14" r="2.5" fill="#FEF08A" />
            <path d="M 55 16 Q 60 18 65 16" stroke="#FEF08A" strokeWidth="0.8" fill="none" />
            <path
              d="M 28 65 C 28 42, 42 24, 60 24 C 78 24, 92 42, 92 65 C 92 88, 78 106, 60 106 C 42 106, 28 88, 28 65 Z"
              fill="none"
              stroke="url(#goldDomeGrad)"
              strokeWidth="2.5"
            />
            <circle cx="60" cy="65" r="29" fill="#2E1065" fillOpacity="0.35" stroke="url(#goldDomeGrad)" strokeWidth="1.2" />
            <text
              x="60"
              y="76"
              textAnchor="middle"
              fontFamily="'Tiro Devanagari Hindi', 'Yatra One', 'Noto Serif Devanagari', 'Cinzel', serif"
              fontSize="34"
              fontWeight="900"
              fill="url(#textGold)"
              stroke="#451A03"
              strokeWidth="0.8"
            >
              श्रीः
            </text>
          </svg>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent font-serif ${currentSize.text}`}>
              Shreem Mahal
            </span>
            <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded font-sans tracking-wide">
              ERP
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-amber-300/80 font-medium tracking-widest uppercase ${currentSize.sub}`}>
              Jewellers • Bhopal
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
