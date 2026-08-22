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
        <div className="absolute -inset-1.5 bg-gradient-to-tr from-sky-500/20 via-primary/20 to-amber-400/25 blur-md rounded-full pointer-events-none" />
      )}
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Beak Gradient */}
          <linearGradient id="eagleBeakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Eye Gradient */}
          <linearGradient id="eagleEyeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          {/* Primary Shadow/Feather Fill */}
          <linearGradient id="eagleDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#090D16" />
          </linearGradient>
        </defs>

        {/* --- Outer Head Contour (White Crown & Mane) --- */}
        <path
          d="M 95 20 C 60 22, 32 46, 26 78 C 22 98, 26 122, 38 140 C 35 130, 34 116, 38 104 C 44 86, 56 70, 72 60 C 58 72, 48 90, 48 112 C 48 128, 54 142, 64 154 C 58 142, 58 126, 64 114 C 70 102, 80 92, 92 84 C 80 96, 76 112, 80 128 C 84 144, 94 158, 108 168 C 100 156, 100 140, 106 128 C 112 116, 122 108, 134 102 C 124 112, 122 126, 126 138 C 130 150, 138 162, 148 170 C 138 160, 136 146, 140 134 C 144 122, 154 112, 164 104 C 158 114, 158 124, 160 134 C 164 146, 170 154, 178 158 C 172 146, 172 132, 170 118 C 168 100, 160 84, 148 70 C 142 56, 132 42, 118 32 C 110 26, 102 22, 95 20 Z"
          className="fill-slate-100 dark:fill-slate-200"
        />

        {/* --- Main Neck Base & Dark Feathers Silhouette --- */}
        <path
          d="M 38 140 C 46 156, 62 172, 82 184 C 98 194, 115 198, 120 196 C 114 186, 112 174, 116 162 C 122 172, 134 180, 146 182 C 142 170, 144 158, 150 148 C 156 156, 166 162, 176 164 C 174 152, 174 140, 178 128 C 182 116, 186 102, 186 88 C 186 78, 182 68, 176 60 C 170 66, 162 70, 152 70 C 140 70, 130 64, 122 56 C 114 62, 104 66, 92 66 C 80 66, 70 60, 62 52 C 54 58, 44 62, 34 62 C 28 62, 24 60, 20 56 C 20 74, 26 114, 38 140 Z"
          fill="url(#eagleDarkGrad)"
          className="fill-slate-900 dark:fill-slate-950"
        />

        {/* --- Upper Eyebrow & Forehead Shadow --- */}
        <path
          d="M 78 48 C 92 44, 110 44, 128 50 C 144 56, 158 66, 168 78 C 156 72, 142 68, 128 68 C 112 68, 96 74, 82 82 C 92 72, 104 66, 118 64 C 104 62, 90 64, 78 70 C 72 62, 74 54, 78 48 Z"
          fill="url(#eagleDarkGrad)"
          className="fill-slate-900 dark:fill-slate-950"
        />

        {/* --- Sharp Hooked Beak (Gold/Amber) --- */}
        <path
          d="M 148 70 C 160 70, 172 74, 182 82 C 190 88, 196 98, 196 108 C 196 114, 192 118, 186 116 C 178 114, 172 108, 168 100 C 164 94, 158 90, 150 88 C 146 88, 142 86, 140 84 C 142 78, 144 74, 148 70 Z"
          fill="url(#eagleBeakGrad)"
        />

        {/* Beak Mouth Crease / Separation */}
        <path
          d="M 142 84 C 152 86, 164 92, 172 102 C 178 110, 184 116, 192 116 C 184 118, 176 114, 170 106 C 164 98, 154 94, 144 92 Z"
          className="fill-slate-950"
        />

        {/* Nostril Slit */}
        <path
          d="M 158 80 C 162 80, 166 82, 168 84 C 166 85, 162 85, 158 84 Z"
          className="fill-slate-950"
        />

        {/* --- Eagle Eye --- */}
        {/* Eye Socket Shadow */}
        <path
          d="M 112 62 C 122 58, 134 60, 142 66 C 136 72, 126 76, 116 74 C 110 72, 108 66, 112 62 Z"
          className="fill-slate-950"
        />
        {/* Eye Sclera (White) */}
        <path
          d="M 118 64 C 124 62, 132 63, 138 67 C 132 71, 124 72, 118 69 C 116 67, 116 65, 118 64 Z"
          fill="#FFFFFF"
        />
        {/* Intense Cyan Pupil & Iris */}
        <circle cx="128" cy="66.5" r="3.2" fill="url(#eagleEyeGrad)" />
        <circle cx="128" cy="66.5" r="1.8" className="fill-slate-950" />
        <circle cx="129" cy="65.5" r="0.8" fill="#FFFFFF" />

        {/* --- Layered Crown & Feather Highlights --- */}
        <path
          d="M 88 32 C 94 38, 104 46, 116 50 C 104 46, 96 38, 92 30 C 90 28, 88 30, 88 32 Z"
          className="fill-slate-900 dark:fill-slate-950"
        />
        <path
          d="M 72 40 C 80 48, 92 56, 106 60 C 94 56, 84 48, 78 38 C 76 36, 73 38, 72 40 Z"
          className="fill-slate-900 dark:fill-slate-950"
        />
        <path
          d="M 58 54 C 68 64, 82 74, 98 78 C 84 74, 72 64, 64 52 C 62 50, 59 52, 58 54 Z"
          className="fill-slate-900 dark:fill-slate-950"
        />
        <path
          d="M 46 72 C 58 84, 74 94, 92 98 C 76 94, 62 82, 52 68 C 50 66, 47 69, 46 72 Z"
          className="fill-slate-900 dark:fill-slate-950"
        />
        <path
          d="M 38 96 C 52 110, 70 120, 88 124 C 72 118, 56 106, 44 90 C 42 88, 39 92, 38 96 Z"
          className="fill-slate-900 dark:fill-slate-950"
        />
        <path
          d="M 34 122 C 48 136, 68 146, 88 148 C 70 142, 54 130, 40 114 C 38 112, 35 118, 34 122 Z"
          className="fill-slate-900 dark:fill-slate-950"
        />
      </svg>
    </div>
  );
}
