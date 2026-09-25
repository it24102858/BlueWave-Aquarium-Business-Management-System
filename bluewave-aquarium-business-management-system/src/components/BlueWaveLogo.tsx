import React from 'react';

interface BlueWaveLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const BlueWaveLogo: React.FC<BlueWaveLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
}) => {
  const iconDimensions = {
    sm: { w: 32, h: 32 },
    md: { w: 42, h: 42 },
    lg: { w: 56, h: 56 },
    xl: { w: 84, h: 84 },
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Precision Vector Emblem matching BlueWave Aquarium Logo */}
      <svg
        width={iconDimensions.w}
        height={iconDimensions.h}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-sm transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="bwFishBody" x1="40" y1="20" x2="160" y2="140" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00B4D8" />
            <stop offset="45%" stopColor="#0077B6" />
            <stop offset="100%" stopColor="#023E8A" />
          </linearGradient>
          <linearGradient id="bwFinLight" x1="70" y1="30" x2="140" y2="90" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#90E0EF" />
            <stop offset="60%" stopColor="#00B4D8" />
            <stop offset="100%" stopColor="#0077B6" />
          </linearGradient>
          <linearGradient id="bwTailWave" x1="40" y1="90" x2="155" y2="165" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#023E8A" />
            <stop offset="50%" stopColor="#0077B6" />
            <stop offset="100%" stopColor="#00B4D8" />
          </linearGradient>
          <filter id="bwGlow" x="-10%" y="-10%" width="120%" height="120%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Bubbles */}
        <circle cx="148" cy="62" r="5" fill="#48CAE4" fillOpacity="0.8" />
        <circle cx="158" cy="74" r="3.5" fill="#90E0EF" fillOpacity="0.9" />
        <circle cx="140" cy="50" r="2.5" fill="#90E0EF" fillOpacity="0.7" />

        {/* Dorsal Fin (Top crest) */}
        <path
          d="M85 45 C75 25, 95 18, 105 24 C100 32, 115 28, 125 40 C110 40, 95 44, 85 45 Z"
          fill="url(#bwFinLight)"
        />
        <path
          d="M75 56 C70 38, 88 32, 98 38 C90 44, 105 44, 112 52 Z"
          fill="#0077B6"
          opacity="0.9"
        />

        {/* Main Leaping Fish Body */}
        <path
          d="M62 108 C50 82, 64 54, 96 46 C124 39, 150 56, 156 80 C159 92, 150 102, 136 104 C116 107, 100 95, 82 100 C72 103, 66 106, 62 108 Z"
          fill="url(#bwFishBody)"
        />

        {/* Belly & Gills Highlight Arc */}
        <path
          d="M96 48 C120 44, 142 58, 146 76 C138 68, 120 62, 102 68 C88 72, 80 84, 76 96 C72 82, 80 60, 96 48 Z"
          fill="url(#bwFinLight)"
          opacity="0.4"
        />

        {/* Head Contour & Gill Curve */}
        <path
          d="M136 74 C132 82, 130 92, 136 100"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.9"
        />
        <path
          d="M142 76 C138 84, 137 92, 142 98"
          stroke="#90E0EF"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Eye */}
        <circle cx="138" cy="80" r="5" fill="#12304A" />
        <circle cx="137" cy="79" r="1.8" fill="#FFFFFF" />
        <circle cx="138" cy="80" r="6" stroke="#90E0EF" strokeWidth="1.5" />

        {/* Pectoral Side Fin */}
        <path
          d="M98 78 C94 88, 104 100, 118 96 C112 88, 106 82, 98 78 Z"
          fill="url(#bwFinLight)"
        />
        <path
          d="M98 84 C104 90, 110 93, 116 93"
          stroke="#FFFFFF"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Lower Ventral Fin */}
        <path
          d="M80 102 C84 114, 94 118, 102 110 C94 106, 88 103, 80 102 Z"
          fill="#0077B6"
        />

        {/* Dynamic Wave Tail (Upper fin fork) */}
        <path
          d="M65 106 C52 112, 38 126, 32 142 C44 136, 54 130, 60 120 C54 132, 52 146, 44 154 C56 146, 68 132, 72 118 Z"
          fill="url(#bwFishBody)"
        />

        {/* Dynamic Ocean Wave Tail (Sweeping lower wave arc) */}
        <path
          d="M62 116 C55 128, 54 142, 64 150 C78 162, 104 158, 126 142 C145 128, 155 118, 160 114 C148 122, 130 134, 110 136 C86 138, 70 128, 62 116 Z"
          fill="url(#bwTailWave)"
        />

        {/* Wave Tail Accent Crest */}
        <path
          d="M74 146 C92 152, 120 144, 142 128 C150 122, 156 117, 160 114 C150 124, 136 132, 118 136 C96 140, 82 136, 74 146 Z"
          fill="#48CAE4"
          opacity="0.8"
        />
      </svg>

      {/* Typography with clean hierarchy and zero slop */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center tracking-tight font-extrabold text-[#0077B6]">
            <span className="text-lg md:text-xl tracking-wider text-[#12304A]">BLUE</span>
            <span className="text-lg md:text-xl tracking-wider text-[#0077B6]">WAVE</span>
          </div>
          <span className="text-[10px] md:text-[11px] font-bold tracking-[0.25em] text-[#00B4D8] uppercase">
            AQUARIUM
          </span>
        </div>
      )}
    </div>
  );
};
