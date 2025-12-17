import React from 'react';

interface PowerButtonProps {
  isOn: boolean;
  onClick: () => void;
  color: string;
}

export const PowerButton: React.FC<PowerButtonProps> = ({ isOn, onClick, color }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow Ring */}
      <div 
        className={`absolute inset-0 rounded-full transition-all duration-500 blur-2xl opacity-40`}
        style={{ backgroundColor: isOn ? color : 'transparent', transform: isOn ? 'scale(1.2)' : 'scale(0.8)' }}
      />
      
      {/* Button Container */}
      <button
        onClick={onClick}
        className={`
          relative z-10 w-32 h-32 md:w-40 md:h-40 rounded-full 
          flex items-center justify-center 
          transition-all duration-300 ease-out
          border-4 
          active:scale-95
          group
        `}
        style={{
          borderColor: isOn ? color : '#3f3f46', // zinc-700
          backgroundColor: isOn ? '#18181b' : '#09090b',
          boxShadow: isOn 
            ? `0 0 40px ${color}40, inset 0 0 20px ${color}20` 
            : '0 4px 6px rgba(0,0,0,0.3), inset 0 2px 4px rgba(255,255,255,0.05)'
        }}
      >
        {/* Power Icon */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={`w-12 h-12 md:w-16 md:h-16 transition-colors duration-300 ${isOn ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-500'}`}
          style={{
             color: isOn ? color : undefined,
             filter: isOn ? `drop-shadow(0 0 8px ${color})` : 'none'
          }}
        >
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
      </button>
    </div>
  );
};