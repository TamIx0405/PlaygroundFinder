import React from 'react';
import logoImage from '../assets/HopspotLogo.png'; 

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: {
      container: 'w-10 sm:w-12 h-6 sm:h-12',
      text: 'text-base sm:text-lg',
    },
    md: {
      container: 'w-12 sm:w-16 h-12 sm:h-16',
      text: 'text-lg sm:text-xl',
    },
    lg: {
      container: 'w-16 sm:w-24 h-16 sm:h-24',
      text: 'text-xl sm:text-3xl',
    },
    xl: {
      container: 'w-20 sm:w-32 h-20 sm:h-32',
      text: 'text-2xl sm:text-4xl',
    },
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className={`relative ${sizes[size].container}`}>
        <img 
          src={logoImage} 
          alt="HopSpot Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <div className="flex items-center">
          <span className={`font-display font-bold ${sizes[size].text}`}>
            <span className="text-[#EC4899]">Hop</span>
            <span className="text-[#3B82F6]">Spot</span>
          </span>
        </div>
      )}
    </div>
  );
}