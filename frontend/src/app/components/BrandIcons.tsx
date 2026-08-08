import React from 'react';

type IconProps = {
  size?: number;
  className?: string;
  fill?: string;
  stroke?: string;
  color?: string;
  strokeWidth?: number;
};

// Isometric glowing book stack
export const SphaerusLibrary = ({ size = 24, className = '', fill = 'none', stroke = 'currentColor', color, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill={fill} stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
    <path d="M12 7v10" strokeWidth={1} opacity={0.5} />
  </svg>
);

// Sharp geometric heart
export const SphaerusHeart = ({ size = 24, className = '', fill = 'none', stroke = 'currentColor', color, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill={fill} stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 21l-8-8a5.5 5.5 0 0 1 8-7 5.5 5.5 0 0 1 8 7l-8 8z" />
    <path d="M12 21v-12" strokeWidth={1} opacity={0.3} />
  </svg>
);

// Modern chronometer
export const SphaerusClock = ({ size = 24, className = '', fill = 'none', stroke = 'currentColor', color, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill={fill} stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <polyline points="12 6 12 12 16 14" />
    <path d="M3 12h1m16 0h1M12 3v1m0 16v1" opacity={0.5} strokeWidth={1.5} />
  </svg>
);

// Dynamic lightning
export const SphaerusZap = ({ size = 24, className = '', fill = 'none', stroke = 'currentColor', color, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill={fill} stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    <path d="M8 8h1M16 16h1" opacity={0.5} strokeWidth={1.5} />
  </svg>
);

// Star shield
export const SphaerusAward = ({ size = 24, className = '', fill = 'none', stroke = 'currentColor', color, strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill={fill} stroke={color || stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    <circle cx="12" cy="12" r="3" strokeWidth={1} opacity={0.5} />
  </svg>
);
