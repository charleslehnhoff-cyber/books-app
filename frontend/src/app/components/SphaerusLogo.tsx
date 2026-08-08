import React from 'react';

interface SphaerusLogoProps {
  size?: number;
}

export default function SphaerusLogo({ size = 36 }: SphaerusLogoProps) {
  return (
    <div 
      style={{ 
        position: 'relative', 
        width: `${size}px`, 
        height: `${size}px`, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0
      }}
    >
      {/* Glow aura */}
      <div 
        style={{
          position: 'absolute',
          inset: '-2px',
          borderRadius: '10px',
          background: 'radial-gradient(circle at center, rgba(0, 204, 255, 0.4) 0%, transparent 70%)',
          filter: 'blur(6px)',
          zIndex: 0
        }}
      />
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <defs>
          <linearGradient id="sphaerusGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#00CCFF" />
            <stop offset="100%" stopColor="#0088FF" />
          </linearGradient>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#070d18" />
            <stop offset="100%" stopColor="#010105" />
          </linearGradient>
        </defs>
        {/* Rounded square container */}
        <rect width="48" height="48" rx="12" fill="url(#bgGrad)" stroke="#182B49" strokeWidth="1.5" />
        {/* Open Book geometry merged with Sphaerus Cyan Arc */}
        <path d="M12 16C12 16 17 14 24 18V34C17 30 12 32 12 32V16Z" fill="url(#sphaerusGrad)" opacity="0.9" />
        <path d="M36 16C36 16 31 14 24 18V34C31 30 36 32 36 32V16Z" fill="url(#sphaerusGrad)" opacity="0.65" />
        {/* Sphaerus ascending orbital arc */}
        <path d="M14 12C20 8 28 8 34 12" stroke="#00CCFF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="34" cy="12" r="2.5" fill="#00CCFF" />
      </svg>
    </div>
  );
}
