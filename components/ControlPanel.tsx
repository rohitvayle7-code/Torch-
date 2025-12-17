import React from 'react';
import { LightMode } from '../types';

interface ControlPanelProps {
  mode: LightMode;
  setMode: (mode: LightMode) => void;
  strobeSpeed: number;
  setStrobeSpeed: (speed: number) => void;
  brightness: number;
  setBrightness: (val: number) => void;
  color: string;
  setColor: (color: string) => void;
  hasHardwareTorch: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  setMode,
  strobeSpeed,
  setStrobeSpeed,
  brightness,
  setBrightness,
  color,
  setColor,
  hasHardwareTorch
}) => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 px-4">
      
      {/* Mode Switcher */}
      <div className="glass-panel p-1 rounded-full flex relative overflow-hidden">
        <div 
          className="absolute top-1 bottom-1 w-1/2 bg-zinc-700/50 rounded-full transition-all duration-300 ease-in-out"
          style={{ 
            left: mode === LightMode.REAR ? '4px' : 'calc(50% - 4px)',
            width: 'calc(50% - 0px)' 
          }} 
        />
        <button
          onClick={() => hasHardwareTorch && setMode(LightMode.REAR)}
          disabled={!hasHardwareTorch}
          className={`relative z-10 w-1/2 py-3 text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2 ${mode === LightMode.REAR ? 'text-white' : 'text-zinc-400'} ${!hasHardwareTorch ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Rear Flash
        </button>
        <button
          onClick={() => setMode(LightMode.SCREEN)}
          className={`relative z-10 w-1/2 py-3 text-sm font-medium transition-colors duration-300 flex items-center justify-center gap-2 ${mode === LightMode.SCREEN ? 'text-white' : 'text-zinc-400'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          Screen Light
        </button>
      </div>

      {/* Sliders Container */}
      <div className="glass-panel rounded-2xl p-6 space-y-6">
        
        {/* Brightness */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            <span>Brightness</span>
            <span>{Math.round(brightness)}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-white"
          />
        </div>

        {/* Strobe / SOS */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-zinc-400 uppercase tracking-wider font-semibold">
            <span>Strobe</span>
            <div className="flex gap-2 items-center">
              {strobeSpeed > 0 && strobeSpeed < 11 && <span>Level {strobeSpeed}</span>}
              <button
                onClick={() => setStrobeSpeed(strobeSpeed === 11 ? 0 : 11)}
                className={`
                  px-3 py-1 rounded text-[10px] font-bold tracking-widest transition-all duration-300
                  ${strobeSpeed === 11 
                    ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.7)] animate-pulse' 
                    : 'bg-zinc-800 text-zinc-400 hover:text-red-400 border border-zinc-700'}
                `}
              >
                SOS
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <input
              type="range"
              min="0"
              max="10" 
              step="1"
              value={strobeSpeed === 11 ? 10 : strobeSpeed} // If SOS, show max on slider? or maybe disable? Let's just show max.
              onChange={(e) => {
                // If user touches slider, disable SOS mode if active and go to slider value
                setStrobeSpeed(Number(e.target.value));
              }}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          <div className="flex justify-between text-[10px] text-zinc-600 px-1">
             <span>Steady</span>
             <span>Fast</span>
          </div>
        </div>

        {/* Color Picker (Only visible in Screen Mode) */}
        {mode === LightMode.SCREEN && (
           <div className="space-y-3 pt-2 border-t border-zinc-800">
             <div className="flex justify-between text-xs text-zinc-400 uppercase tracking-wider font-semibold">
                <span>Tint</span>
             </div>
             <div className="flex justify-between gap-2">
                {['#ffffff', '#fecaca', '#fde68a', '#bbf7d0', '#bfdbfe', '#e9d5ff'].map((c) => (
                   <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-8 h-8 rounded-full border-2 transition-transform active:scale-95 ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                   />
                ))}
                <input 
                  type="color" 
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-8 h-8 rounded-full overflow-hidden p-0 border-0"
                />
             </div>
           </div>
        )}
      </div>
    </div>
  );
};