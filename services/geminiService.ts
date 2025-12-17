import { GoogleGenAI, Type } from "@google/genai";
import { AmbienceConfig } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateAmbience = async (prompt: string): Promise<AmbienceConfig> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a lighting configuration based on this mood/description: "${prompt}". 
      Return a JSON object with:
      - color: a hex color string (e.g., #FF0000).
      - brightness: a number between 50 and 100.
      - strobeInterval: a number representing milliseconds for a strobe effect. 
        Use 0 for steady light. 
        Use -1 ONLY if the user is asking for SOS, help, emergency, or distress signals.
        For slow pulse use ~1000, fast strobe ~100.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            color: { type: Type.STRING },
            brightness: { type: Type.NUMBER },
            strobeInterval: { type: Type.NUMBER },
          },
          required: ["color", "brightness", "strobeInterval"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as AmbienceConfig;
  } catch (error) {
    console.error("Error generating ambience:", error);
    // Fallback
    return {
      color: "#ffffff",
      brightness: 100,
      strobeInterval: 0,
      description: "Fallback configuration",
    };
  }
};