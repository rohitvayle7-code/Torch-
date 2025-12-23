import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";

interface AssetStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AssetStudio: React.FC<AssetStudioProps> = ({ isOpen, onClose }) => {
  const [generating, setGenerating] = useState<string | null>(null);
  const [assets, setAssets] = useState<{ [key: string]: string }>({});

  const generateAsset = async (type: 'icon' | 'banner' | 'screenshot') => {
    setGenerating(type);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    
    let prompt = "";
    let aspectRatio: "1:1" | "16:9" | "9:16" = "1:1";

    if (type === 'icon') {
      prompt = "A professional, minimalist 512x512 app icon for 'Lumina Torch'. A central glowing white sphere on a deep dark zinc background with a subtle cyan neon rim. Modern, sleek, high quality.";
      aspectRatio = "1:1";
    } else if (type === 'banner') {
      prompt = "A 1024x500 marketing banner for Lumina Torch app. A dark futuristic room lit by soft neon cyan and purple glows. Sleek smartphone in the center. Abstract light trails. High resolution, professional.";
      aspectRatio = "16:9";
    } else {
      prompt = "A 9:16 mobile app screenshot mockup for a torch app. Showing a beautiful UI with a large glowing power button and glassmorphic controls. Cinematic lighting, professional product photography style.";
      aspectRatio = "9:16";
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: { imageConfig: { aspectRatio } }
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          setAssets(prev => ({ ...prev, [type]: `data:image/png;base64,${part.inlineData?.data}` }));
        }
      }
    } catch (err) {
      console.error("Asset generation failed", err);
    } finally {
      setGenerating(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col p-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white">Asset Studio</h2>
          <p className="text-zinc-400 text-sm">Generate store listing assets with AI</p>
        </div>
        <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        {/* App Icon */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">App Icon (512x512)</h3>
            <button 
              onClick={() => generateAsset('icon')}
              disabled={!!generating}
              className="px-4 py-1.5 bg-cyan-600 rounded-full text-xs font-bold disabled:opacity-50"
            >
              {generating === 'icon' ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <div className="aspect-square bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-800">
            {assets.icon ? <img src={assets.icon} className="w-full h-full object-cover" /> : <span className="text-zinc-700 text-xs">Preview</span>}
          </div>
        </div>

        {/* Banner */}
        <div className="glass-panel p-6 rounded-3xl space-y-4 md:col-span-2">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Store Banner (1024x500)</h3>
            <button 
              onClick={() => generateAsset('banner')}
              disabled={!!generating}
              className="px-4 py-1.5 bg-purple-600 rounded-full text-xs font-bold disabled:opacity-50"
            >
              {generating === 'banner' ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <div className="aspect-[1024/500] bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-800">
            {assets.banner ? <img src={assets.banner} className="w-full h-full object-cover" /> : <span className="text-zinc-700 text-xs">Preview</span>}
          </div>
        </div>

        {/* Screenshots */}
        <div className="glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold">Screenshot (9:16)</h3>
            <button 
              onClick={() => generateAsset('screenshot')}
              disabled={!!generating}
              className="px-4 py-1.5 bg-pink-600 rounded-full text-xs font-bold disabled:opacity-50"
            >
              {generating === 'screenshot' ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <div className="aspect-[9/16] bg-zinc-900 rounded-2xl flex items-center justify-center overflow-hidden border border-zinc-800">
            {assets.screenshot ? <img src={assets.screenshot} className="w-full h-full object-cover" /> : <span className="text-zinc-700 text-xs">Preview</span>}
          </div>
        </div>
      </div>
    </div>
  );
};