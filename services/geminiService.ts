import { GoogleGenAI } from "@google/genai";
import { ConversionConfig } from "../types";

export const cleanWithGemini = async (input: string, config: ConversionConfig): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const paragraphRule = config.useParagraphs 
    ? "Paragraphs -> <p>" 
    : "Paragraphs -> <br><br> (Do NOT use <p> tags)";

  const systemPrompt = `
    You are a strictly compliant Legacy HTML Converter. 
    Your goal is to take input text (which might be messy HTML, RTF content, or plain text) and convert it into a specific subset of HTML tags.
    
    RULES:
    1. ALLOWED TAGS ONLY: <b>, <i>, <u>, <sub>, <sup>, <p>, <br>, <ul>, <ol>, <li>.
    2. STRICTLY FORBIDDEN: <div>, <span>, <style>, classes, ids, or inline styles.
    3. MAPPING:
       - Bold/Strong -> <b>
       - Italic/Em -> <i>
       - Underline/Ins -> <u>
       - ${paragraphRule}
    4. Clean up whitespace. Do not leave empty tags like <b></b>.
    5. Return ONLY the HTML snippet. Do not wrap in markdown code blocks. Do not add <html> or <body> tags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: input,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1, // Low temperature for deterministic behavior
      }
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini cleanup failed:", error);
    throw error;
  }
};