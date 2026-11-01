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
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Custom Uploaded Logo or Blank Store Emblem Frame */}
      <div 
        className={`relative shrink-0 flex items-center justify-center rounded-xl overflow-hidden transition-all duration-200 print:bg-transparent print:border-none print:shadow-none ${
          transparentBg 
            ? 'p-0.5 bg-transparent' 
            : 'p-1 shadow-md bg-stone-900 border border-amber-500/30'
        }`}
      >
        {customLogo && !imgError ? (
          <img
            src={customLogo}
            alt="Firm Logo"
            onError={() => setImgError(true)}
            className={`${currentSize.img} object-contain drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)] transition-transform duration-200 rounded-lg`}
            loading="eager"
          />
        ) : (
          /* Blank Store Emblem Placeholder when no logo is uploaded */
          <div className={`${currentSize.img} flex items-center justify-center bg-stone-100 border border-dashed border-amber-400/60 rounded-xl text-amber-700 shadow-2xs`}>
            <svg
              width={currentSize.icon * 0.6}
              height={currentSize.icon * 0.6}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
              <path d="M2 7h20" />
            </svg>
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className={`font-black tracking-tight uppercase bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent font-serif ${currentSize.text}`}>
              Swarnkar ERP
            </span>
            <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-1.5 py-0.2 rounded font-sans tracking-wide">
              PRO
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className={`text-amber-300/80 font-medium tracking-widest uppercase ${currentSize.sub}`}>
              Jewellery ERP
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
