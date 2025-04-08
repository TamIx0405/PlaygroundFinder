import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Logo({ className = '', showText = true, size = 'md' }: LogoProps) {
  const sizes = {
    sm: {
      container: 'w-6 sm:w-8 h-6 sm:h-8',
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
        <svg viewBox="0 0 100 120" className="w-full h-full">
          {/* Green base */}
          <ellipse cx="50" cy="105" rx="30" ry="10" fill="#4ADE80" />
          
          {/* Pin shape */}
          <path
            d="M20 50 
                C20 25, 80 25, 80 50 
                L50 95 Z"
            fill="#60A5FA"
          />
          
          {/* Bunny */}
          <g transform="translate(28, 35) scale(0.9)">
            {/* Body */}
            <path
              d="M25 40 
                 C15 40, 15 20, 25 15
                 C35 10, 45 10, 45 15
                 C55 20, 55 40, 45 40
                 Z"
              fill="#FFF5E7"
              stroke="#2F2F2F"
              strokeWidth="2"
            />
            
            {/* Left ear */}
            <path
              d="M25 15
                 C20 0, 30 0, 35 15"
              fill="#FFF5E7"
              stroke="#2F2F2F"
              strokeWidth="2"
            />
            
            {/* Right ear */}
            <path
              d="M35 15
                 C40 0, 50 0, 45 15"
              fill="#FFF5E7"
              stroke="#2F2F2F"
              strokeWidth="2"
            />
            
            {/* Inner ear detail */}
            <path
              d="M27 12
                 C25 5, 30 5, 32 12"
              fill="#FFA07A"
            />
            
            {/* Eye */}
            <circle cx="30" cy="25" r="2" fill="#2F2F2F" />
            
            {/* Smile */}
            <path
              d="M32 30
                 Q35 33 38 30"
              fill="none"
              stroke="#2F2F2F"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </svg>
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