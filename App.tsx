import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PowerButton } from './components/PowerButton';
import { ControlPanel } from './components/ControlPanel';
import { ScreenOverlay } from './components/ScreenOverlay';
import { LightMode, AmbienceConfig } from './types';
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
  
  // --- Refs ---
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const strobeIntervalRef = useRef<number | null>(null);
  const strobeStateRef = useRef(false); // To toggle on/off during strobe
  
  // --- Hardware Capabilities Check ---
  useEffect(() => {
    const checkCapabilities = async () => {
      // Check if getUserMedia is supported
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
        // Cast to any to access torch capability which is not yet in the standard type definition
        const capabilities = track.getCapabilities() as any;
        
        // Check specifically for 'torch' capability
        if ('torch' in capabilities || 'fillLightMode' in capabilities) {
          setHasHardwareTorch(true);
        } else {
          setHasHardwareTorch(Boolean(capabilities.torch));
          if (!capabilities.torch) setMode(LightMode.SCREEN);
        }
        
        // Stop the test stream immediately
        track.stop();
      } catch (e) {
        console.log("Torch access denied or unavailable", e);
        setHasHardwareTorch(false);
        setMode(LightMode.SCREEN);
      }
    };
    
    checkCapabilities();
  }, []);

  // --- Torch Logic (Hardware) ---
  const applyHardwareTorch = async (state: boolean) => {
    if (!hasHardwareTorch) return;
    
    try {
      if (state) {
        // Turn ON
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
        // Turn OFF
        if (trackRef.current) {
           // We can either turn torch off or stop the track completely
           // Stopping the track releases the camera, which is better for battery
           trackRef.current.stop();
           trackRef.current = null;
        }
      }
    } catch (err) {
      console.error("Failed to toggle hardware torch", err);
      // Fallback to screen if hardware fails mid-use
      setMode(LightMode.SCREEN);
    }
  };

  // --- Strobe / SOS Logic ---
  // Returns the interval in ms.
  const getStrobeInterval = (speed: number) => {
    if (speed === 0) return 0;
    if (speed === 11) return -1; // Special code for SOS
    // Map 1-10 to 1000ms - 50ms
    return 1000 - ((speed - 1) * 100); 
  };

  const handleStrobeTick = useCallback(() => {
    strobeStateRef.current = !strobeStateRef.current;
    
    if (mode === LightMode.REAR) {
      applyHardwareTorch(strobeStateRef.current);
    } else {
      // For screen mode, direct DOM manipulation handled below or via effect re-runs
      // But to avoid lag, we toggle opacity on the specific overlay element
      const overlay = document.getElementById('screen-overlay-flash');
      if (overlay) {
         overlay.style.opacity = strobeStateRef.current ? (brightness/100).toString() : '0';
      }
    }
  }, [mode, brightness]);

  useEffect(() => {
    // Clear existing
    if (strobeIntervalRef.current) {
      clearInterval(strobeIntervalRef.current);
      clearTimeout(strobeIntervalRef.current);
      strobeIntervalRef.current = null;
    }

    if (!isOn || strobeSpeed === 0) {
      // Steady light logic
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

    // Strobe is active
    if (strobeSpeed === 11) {
       // SOS Pattern: ... --- ...
       const sosPattern = [
         200, 200, 200, 200, 200, 200, // S (on, off, on, off, on, off)
         600, 200, 600, 200, 600, 200, // O
         200, 200, 200, 200, 200, 1500 // S + long pause
       ];
       
       let patternIndex = 0;
       
       const runSOS = () => {
         const duration = sosPattern[patternIndex];
         const isLight = patternIndex % 2 === 0; // Even index = Light ON
         
         if (mode === LightMode.REAR) applyHardwareTorch(isLight);
         const overlay = document.getElementById('screen-overlay-flash');
         if (overlay) overlay.style.opacity = isLight ? (brightness/100).toString() : '0';

         patternIndex = (patternIndex + 1) % sosPattern.length;
         strobeIntervalRef.current = window.setTimeout(runSOS, duration);
       };
       
       runSOS();
       return () => { if(strobeIntervalRef.current) clearTimeout(strobeIntervalRef.current); };

    } else {
      // Regular Strobe
      const ms = getStrobeInterval(strobeSpeed);
      strobeIntervalRef.current = window.setInterval(handleStrobeTick, ms);
    }

    return () => {
      if (strobeIntervalRef.current) {
        clearInterval(strobeIntervalRef.current);
        clearTimeout(strobeIntervalRef.current);
        // Ensure off on cleanup
        if (mode === LightMode.REAR) applyHardwareTorch(false);
      }
    };
  }, [isOn, strobeSpeed, mode, brightness, handleStrobeTick]);

  // --- Gemini Ambience ---
  const handleSmartAmbience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsThinking(true);

    try {
      const config = await generateAmbience(prompt);
      setColor(config.color);
      setBrightness(config.brightness);
      
      // Determine strobe speed from interval
      if (config.strobeInterval === -1) {
        setStrobeSpeed(11); // Activate SOS
      } else if (config.strobeInterval === 0) {
        setStrobeSpeed(0);
      } else if (config.strobeInterval < 100) {
        setStrobeSpeed(10);
      } else if (config.strobeInterval > 900) {
        setStrobeSpeed(1);
      } else {
        // Map 100-900 to 1-10 roughly
        const speed = 10 - Math.floor(config.strobeInterval / 100);
        setStrobeSpeed(Math.max(1, Math.min(10, speed)));
      }

      setMode(LightMode.SCREEN); // Ambience is best on screen
      setIsOn(true);
    } catch (error) {
      console.error("Failed to generate ambience:", error);
      // Optional: Flash an error state or simple alert
    } finally {
      setIsThinking(false);
    }
  };

  // Wake lock
  useWakeLock(isOn);

  // Toggle Handler
  const togglePower = () => {
    setIsOn(!isOn);
  };

  return (
    <div className={`relative min-h-screen flex flex-col items-center justify-between py-8 transition-colors duration-700 overflow-hidden`}>
      
      {/* Background Ambience Glow (UI Decoration) */}
      <div 
         className="absolute top-[-20%] left-[-20%] w-[140%] h-[80%] rounded-full blur-[120px] opacity-20 pointer-events-none transition-colors duration-1000"
         style={{ backgroundColor: color }}
      />

      {/* Header */}
      <header className="relative z-10 w-full px-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-br from-white to-zinc-500 rounded-lg flex items-center justify-center shadow-lg">
             <span className="font-bold text-black text-xs">L</span>
           </div>
           <h1 className="text-xl font-bold tracking-tight text-white">Lumina</h1>
        </div>
        <div className="text-xs font-mono text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800">
           {mode === LightMode.REAR ? 'CAM' : 'SCR'} {isOn ? 'ON' : 'OFF'}
        </div>
      </header>

      {/* Main Power Button Area */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
        <PowerButton isOn={isOn} onClick={togglePower} color={color} />
        
        {/* Status Text */}
        <div className="mt-8 text-center h-8">
           {isThinking ? (
             <span className="text-cyan-400 animate-pulse text-sm font-medium tracking-widest">AI GENERATING AMBIENCE...</span>
           ) : (
             strobeSpeed === 11 && isOn ? <span className="text-red-500 font-black tracking-[0.3em] animate-pulse">SOS SIGNAL ACTIVE</span> : null
           )}
        </div>
      </main>

      {/* Controls & AI Input */}
      <footer className="relative z-10 w-full space-y-4 px-4 pb-6">
        
        {/* AI Input */}
        <div className="w-full max-w-md mx-auto">
           <form onSubmit={handleSmartAmbience} className="relative group">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type 'SOS' or describe a mood..."
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all backdrop-blur-md"
              />
              <button 
                type="submit"
                disabled={isThinking || !prompt}
                className="absolute right-2 top-2 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors disabled:opacity-30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </button>
           </form>
        </div>

        <ControlPanel 
          mode={mode} 
          setMode={(m) => {
             setMode(m);
             // If switching to screen while on, turn off hardware torch
             if (m === LightMode.SCREEN && isOn && hasHardwareTorch) {
                applyHardwareTorch(false);
             }
          }} 
          strobeSpeed={strobeSpeed}
          setStrobeSpeed={setStrobeSpeed}
          brightness={brightness}
          setBrightness={setBrightness}
          color={color}
          setColor={setColor}
          hasHardwareTorch={hasHardwareTorch}
        />
        
        <p className="text-center text-[10px] text-zinc-700 pt-4">
          Powered by Gemini AI • React • Tailwind
        </p>
      </footer>

      {/* Screen Light Overlay (The actual light source for Screen Mode) */}
      <div 
        id="screen-overlay-flash"
        className="fixed inset-0 pointer-events-none z-0" 
        style={{ 
          backgroundColor: color, 
          opacity: (isOn && mode === LightMode.SCREEN && strobeSpeed === 0) ? brightness / 100 : 0,
          transition: strobeSpeed > 0 ? 'none' : 'opacity 0.2s ease-out' 
        }}
      />
      
      {/* Full screen toggle helper for pure white screen torch */}
      {isOn && mode === LightMode.SCREEN && (
        <button 
          onClick={() => setIsOn(false)}
          className="fixed top-4 right-4 z-50 text-black/50 hover:text-black p-2 bg-white/20 backdrop-blur-md rounded-full"
          style={{ display: brightness > 50 ? 'block' : 'none' }} // Only show if bright enough to see screen is blocking
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      )}

    </div>
  );
};

export default App;