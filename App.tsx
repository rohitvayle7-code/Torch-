import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PowerButton } from './components/PowerButton';
import { ControlPanel } from './components/ControlPanel';
import { PresetSelector } from './components/PresetSelector';
import { AssetStudio } from './components/AssetStudio';
import { LightMode, AmbienceConfig, Preset } from './types';
import { generateAmbience } from './services/geminiService';
import { useWakeLock } from './hooks/useWakeLock';

const App: React.FC = () => {
  // --- State ---
  const [isOn, setIsOn] = useState(false);
  const [mode, setMode] = useState<LightMode>(LightMode.REAR);
  const [brightness, setBrightness] = useState(100);
  const [strobeSpeed, setStrobeSpeed] = useState(0); // 0 = off, 11 = SOS
  const [color, setColor] = useState('#ffffff');
  const [hasHardwareTorch, setHasHardwareTorch] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isAssetStudioOpen, setIsAssetStudioOpen] = useState(false);
  
  // --- Refs ---
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const strobeIntervalRef = useRef<number | null>(null);
  const strobeStateRef = useRef(false); // To toggle on/off during strobe
  
  // --- Hardware Capabilities Check ---
  useEffect(() => {
    const checkCapabilities = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasHardwareTorch(false);
        setMode(LightMode.SCREEN);
        return;
      }
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities() as any;
        
        if ('torch' in capabilities || 'fillLightMode' in capabilities) {
          setHasHardwareTorch(true);
        } else {
          setHasHardwareTorch(Boolean(capabilities.torch));
          if (!capabilities.torch) setMode(LightMode.SCREEN);
        }
        
        track.stop();
      } catch (e) {
        console.log("Torch access denied or unavailable", e);
        setHasHardwareTorch(false);
        setMode(LightMode.SCREEN);
      }
    };
    
    checkCapabilities();
  }, []);

  const applyHardwareTorch = async (state: boolean) => {
    if (!hasHardwareTorch) return;
    
    try {
      if (state) {
        if (!trackRef.current || trackRef.current.readyState === 'ended') {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' }
          });
          trackRef.current = stream.getVideoTracks()[0];
        }
        await trackRef.current.applyConstraints({
          advanced: [{ torch: true } as any]
        });
      } else {
        if (trackRef.current) {
           trackRef.current.stop();
           trackRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to toggle hardware torch", err);
      setMode(LightMode.SCREEN);
    }
  };

  const getStrobeInterval = (speed: number) => {
    if (speed === 0) return 0;
    if (speed === 11) return -1;
    return 1000 - ((speed - 1) * 100); 
  };

  const handleStrobeTick = useCallback(() => {
    strobeStateRef.current = !strobeStateRef.current;
    
    if (mode === LightMode.REAR) {
      applyHardwareTorch(strobeStateRef.current);
    } else {
      const overlay = document.getElementById('screen-overlay-flash');
      if (overlay) {
         overlay.style.opacity = strobeStateRef.current ? (brightness/100).toString() : '0';
      }
    }
  }, [mode, brightness]);

  useEffect(() => {
    if (strobeIntervalRef.current) {
      clearInterval(strobeIntervalRef.current);
      clearTimeout(strobeIntervalRef.current);
      strobeIntervalRef.current = null;
    }

    if (!isOn || strobeSpeed === 0) {
      if (isOn) {
         if (mode === LightMode.REAR) applyHardwareTorch(true);
         const overlay = document.getElementById('screen-overlay-flash');
         if (overlay) overlay.style.opacity = (brightness/100).toString();
      } else {
         if (mode === LightMode.REAR) applyHardwareTorch(false);
         const overlay = document.getElementById('screen-overlay-flash');
         if (overlay) overlay.style.opacity = '0';
      }
      return;
    }

    if (strobeSpeed === 11) {
       const sosPattern = [200, 200, 200, 200, 200, 200, 600, 200, 600, 200, 600, 200, 200, 200, 200, 200, 200, 1500];
       let patternIndex = 0;
       
       const runSOS = () => {
         const duration = sosPattern[patternIndex];
         const isLight = patternIndex % 2 === 0;
         if (mode === LightMode.REAR) applyHardwareTorch(isLight);
         const overlay = document.getElementById('screen-overlay-flash');
         if (overlay) overlay.style.opacity = isLight ? (brightness/100).toString() : '0';
         patternIndex = (patternIndex + 1) % sosPattern.length;
         strobeIntervalRef.current = window.setTimeout(runSOS, duration);
       };
       runSOS();
       return () => { if(strobeIntervalRef.current) clearTimeout(strobeIntervalRef.current); };
    } else {
      const ms = getStrobeInterval(strobeSpeed);
      strobeIntervalRef.current = window.setInterval(handleStrobeTick, ms);
    }

    return () => {
      if (strobeIntervalRef.current) {
        clearInterval(strobeIntervalRef.current);
        clearTimeout(strobeIntervalRef.current);
        if (mode === LightMode.REAR) applyHardwareTorch(false);
      }
    };
  }, [isOn, strobeSpeed, mode, brightness, handleStrobeTick]);

  const applyConfig = (config: AmbienceConfig, forceMode?: LightMode) => {
    setColor(config.color);
    setBrightness(config.brightness);
    if (config.strobeInterval === -1) setStrobeSpeed(11);
    else if (config.strobeInterval === 0) setStrobeSpeed(0);
    else if (config.strobeInterval < 100) setStrobeSpeed(10);
    else if (config.strobeInterval > 900) setStrobeSpeed(1);
    else {
      const speed = 10 - Math.floor(config.strobeInterval / 100);
      setStrobeSpeed(Math.max(1, Math.min(10, speed)));
    }
    if (forceMode) setMode(forceMode);
    else if (config.strobeInterval === -1 && hasHardwareTorch) setMode(LightMode.REAR);
    else setMode(LightMode.SCREEN); 
    setIsOn(true);
  };

  const handlePresetSelect = (preset: Preset) => applyConfig(preset.config, preset.forcedMode);

  const handleSmartAmbience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsThinking(true);
    try {
      const config = await generateAmbience(prompt);
      applyConfig(config);
    } catch (error) {
      console.error("Failed to generate ambience:", error);
    } finally {
      setIsThinking(false);
    }
  };

  useWakeLock(isOn);

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-between py-8 transition-colors duration-700 overflow-hidden`}>
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[80%] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000" style={{ backgroundColor: color }} />

      <header className="relative z-10 w-full px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-br from-white to-zinc-500 rounded-lg flex items-center justify-center shadow-lg"><span className="font-bold text-black text-xs">L</span></div>
           <h1 className="text-xl font-bold tracking-tight text-white">Lumina</h1>
        </div>
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsAssetStudioOpen(true)}
             className="p-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-400 hover:text-cyan-400 transition-colors"
           >
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
           </button>
           <div className="text-xs font-mono text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
              {mode === LightMode.REAR ? 'CAM' : 'SCR'} {isOn ? 'ON' : 'OFF'}
           </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
        <PowerButton isOn={isOn} onClick={() => setIsOn(!isOn)} color={color} />
        <div className="mt-8 text-center h-8">
           {isThinking ? (
             <span className="text-cyan-400 animate-pulse text-sm font-medium tracking-widest">AI GENERATING AMBIENCE...</span>
           ) : (
             strobeSpeed === 11 && isOn ? <span className="text-red-500 font-black tracking-[0.3em] animate-pulse">SOS SIGNAL ACTIVE</span> : null
           )}
        </div>
      </main>

      <footer className="relative z-10 w-full space-y-4 px-4 pb-6">
        <div className="w-full max-w-md mx-auto">
           <form onSubmit={handleSmartAmbience} className="relative group">
              <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Type 'Thunderstorm' or describe a mood..." className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all backdrop-blur-md" />
              <button type="submit" disabled={isThinking || !prompt} className="absolute right-2 top-2 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></button>
           </form>
        </div>

        <PresetSelector onSelect={handlePresetSelect} />

        <ControlPanel 
          mode={mode} 
          setMode={(m) => {
             setMode(m);
             if (m === LightMode.SCREEN && isOn && hasHardwareTorch) applyHardwareTorch(false);
          }} 
          strobeSpeed={strobeSpeed}
          setStrobeSpeed={setStrobeSpeed}
          brightness={brightness}
          setBrightness={setBrightness}
          color={color}
          setColor={setColor}
          hasHardwareTorch={hasHardwareTorch}
        />
        <p className="text-center text-[10px] text-zinc-700 pt-4">Powered by Gemini AI • React • Tailwind</p>
      </footer>

      <div id="screen-overlay-flash" className="fixed inset-0 pointer-events-none z-0" style={{ backgroundColor: color, opacity: (isOn && mode === LightMode.SCREEN && strobeSpeed === 0) ? brightness / 100 : 0, transition: strobeSpeed > 0 ? 'none' : 'opacity 0.2s ease-out' }} />
      {isOn && mode === LightMode.SCREEN && (
        <button onClick={() => setIsOn(false)} className="fixed top-4 right-4 z-50 text-black/50 hover:text-black p-2 bg-white/20 backdrop-blur-md rounded-full" style={{ display: brightness > 50 ? 'block' : 'none' }}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
      )}

      <AssetStudio isOpen={isAssetStudioOpen} onClose={() => setIsAssetStudioOpen(false)} />
    </div>
  );
};

export default App;