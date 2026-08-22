import React from 'react';

interface EagleLogoProps {
  className?: string;
  size?: number | string;
  withGlow?: boolean;
}

export function EagleLogo({ className = 'w-6 h-6', size }: EagleLogoProps) {
  const style = size ? { width: size, height: size } : undefined;

  return (
    <img
      src="/eagle_logo.png"
      alt="Eagle Logo"
      className={`object-contain ${className}`}
      style={style}
    />
  );
}
