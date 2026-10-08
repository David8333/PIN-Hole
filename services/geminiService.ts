
import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const getAIAssistedColors = async (baseColor?: string) => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = baseColor 
    ? `Suggest a high-contrast companion color for the hex color ${baseColor}. Provide the results in JSON format with 'primary' and 'secondary' hex codes and a brief explanation of why they contrast well.`
    : "Suggest a pair of highly contrasting and aesthetically pleasing colors for two overlapping rectangles. Provide the results in JSON format with 'primary' and 'secondary' hex codes and a brief explanation.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            primary: { type: Type.STRING, description: "Hex code for the first color" },
            secondary: { type: Type.STRING, description: "Hex code for the second color" },
            explanation: { type: Type.STRING, description: "Why these colors work together" }
          },
          required: ["primary", "secondary", "explanation"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return null;
  }
};
