import React from 'react';

interface EagleLogoProps {
  className?: string;
  size?: number | string;
  withGlow?: boolean;
}

export function EagleLogo({ className = 'w-6 h-6', size, withGlow = false }: EagleLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`} style={style}>
      {withGlow && (
        <div className="absolute -inset-1.5 bg-gradient-to-tr from-amber-500/20 via-blue-500/20 to-amber-400/30 blur-md rounded-full pointer-events-none" />
      )}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Gold Feather Gradient */}
          <linearGradient id="goldFeatherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="30%" stopColor="#EAB308" />
            <stop offset="70%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#946200" />
          </linearGradient>

          {/* Deep Navy Body Gradient */}
          <linearGradient id="navyBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3A8A" />
            <stop offset="40%" stopColor="#0F2864" />
            <stop offset="80%" stopColor="#0A193E" />
            <stop offset="100%" stopColor="#050C22" />
          </linearGradient>

          {/* Cyan/Blue Accent Highlight */}
          <linearGradient id="accentBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#2563EB" />
          </linearGradient>
        </defs>

        {/* --- Top Gold Wing Feathers --- */}
        {/* Feather 1 (Top-Left Sweeping Feather) */}
        <path
          d="M32 26C38 35 48 48 58 54C47 50 36 39 30 29C28 26 30 23 32 26Z"
          fill="url(#goldFeatherGrad)"
        />
        {/* Feather 2 (Main Upward Wing Tip) */}
        <path
          d="M48 20C50 14 55 17 56 22C57 32 63 44 71 50C61 46 54 36 50 25C49 22 47 21 48 20Z"
          fill="url(#goldFeatherGrad)"
        />
        {/* Feather 3 (Right Wing Arch) */}
        <path
          d="M66 26C69 22 74 24 75 28C77 37 81 46 89 51C79 48 74 40 70 31C68 28 66 27 66 26Z"
          fill="url(#goldFeatherGrad)"
        />
        {/* Feather 4 (Outer Wing Edge) */}
        <path
          d="M80 34C82 30 87 32 88 36C89 44 91 51 97 55C89 52 86 46 83 39C82 36 80 35 80 34Z"
          fill="url(#goldFeatherGrad)"
        />

        {/* --- Upper Body & Head Gold Contour --- */}
        <path
          d="M74 53C79 50 86 49 93 51C97 52 101 54 104 57C106 59 104 62 101 62C97 62 93 63 90 65C84 68 80 73 75 79C77 72 77 63 74 53Z"
          fill="url(#goldFeatherGrad)"
        />

        {/* --- Navy Blue Primary Wing Base --- */}
        <path
          d="M30 29C36 39 47 50 58 54C48 52 39 55 33 60C42 61 52 64 61 69C51 68 43 71 37 77C47 77 56 80 64 85C53 85 46 90 42 96C52 94 62 90 71 83C79 76 83 69 88 64C86 63 82 62 78 63C70 65 64 63 59 58C52 50 42 38 30 29Z"
          fill="url(#navyBodyGrad)"
        />

        {/* --- Navy Blue Head, Beak & Chest --- */}
        {/* Head and Brow */}
        <path
          d="M82 53C86 49 92 48 97 50C101 51 105 53 108 56C110 58 108 61 104 61C99 61 95 62 91 65C87 68 84 72 80 77C82 70 82 61 82 53Z"
          fill="url(#navyBodyGrad)"
        />

        {/* Curved Sharp Beak (Golden Amber) */}
        <path
          d="M103 57C107 58 111 60 113 63C113 65 110 66 108 65C104 64 101 62 100 60C100 58 102 57 103 57Z"
          fill="url(#goldFeatherGrad)"
        />

        {/* Eagle Eye (Piercing Cyan / White) */}
        <circle cx="94" cy="54.5" r="1.8" fill="#38BDF8" />
        <circle cx="94.5" cy="54.2" r="0.6" fill="#FFFFFF" />

        {/* --- Swooping Tail & Body Lower Arch --- */}
        <path
          d="M42 96C46 90 53 85 64 85C56 80 47 77 37 77C43 71 51 68 61 69C52 64 42 61 33 60C39 55 48 52 58 54C64 63 70 65 78 63C82 62 86 63 88 64C83 69 79 76 71 83C62 90 52 94 42 96Z"
          fill="url(#navyBodyGrad)"
        />

        {/* Aerodynamic Chest Highlight Feather */}
        <path
          d="M62 72C68 76 74 77 81 74C76 78 69 80 63 79C58 78 55 75 62 72Z"
          fill="url(#accentBlueGrad)"
        />
      </svg>
    </div>
  );
}
