import React from 'react';
import { PRESETS } from '../presets';
import { Preset } from '../types';

interface PresetSelectorProps {
  onSelect: (preset: Preset) => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onSelect }) => {
  return (
    <div className="w-full max-w-md mx-auto px-4 mb-2">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Presets</span>
        <div className="h-px bg-zinc-800 flex-1"></div>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 snap-x hide-scrollbar">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset)}
            className={`
              flex-shrink-0 snap-start
              flex items-center gap-2 px-3 py-2 rounded-xl
              bg-zinc-800/50 border border-zinc-700/50 
              hover:bg-zinc-800 hover:border-zinc-600 hover:text-white
              active:scale-95 transition-all duration-200
              group
            `}
          >
            <div className={`p-1.5 rounded-lg bg-zinc-900 group-hover:bg-black transition-colors`}>
              <svg 
                className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-colors" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={preset.iconPath} />
              </svg>
            </div>
            <span className="text-xs font-medium text-zinc-300 group-hover:text-white">{preset.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};