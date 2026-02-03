
import { GoogleGenAI } from "@google/genai";
import { ComparisonResult } from "../types";

export const getExpertAdvice = async (results: ComparisonResult) => {
  // Always use { apiKey: process.env.API_KEY } for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Condensamos los datos al máximo para ahorrar tokens de entrada
  // Fixed: Replaced incorrect property 'monthlyPensionToday' with 'monthlyPension' as defined in types.ts
  const prompt = `
    DATA:
    ACTUAL: $${results.current.monthlyPension.toFixed(0)}/mes, ${results.current.totalWeeks}sem.
    M40: Inversión $${results.investment.total.toFixed(0)}, Pensión $${results.optimized.monthlyPension.toFixed(0)}/mes.
    ROI: ${results.breakEvenMonths.toFixed(1)} meses.
    DIFF: $${(results.optimized.monthlyPension - results.current.monthlyPension).toFixed(0)}/mes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        // El sistema de instrucciones ahorra tokens al no tener que repetir el rol en cada prompt
        systemInstruction: "Eres un asesor de pensiones IMSS Ley 73 experto. Analiza la viabilidad de la Modalidad 40 basándote en los datos. Sé extremadamente conciso, directo y profesional. Máximo 2 párrafos cortos.",
        maxOutputTokens: 300, // Limita el costo de la respuesta
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 } // Desactiva razonamiento extendido para ahorrar tiempo y tokens
      },
    });
    // Use .text property directly, do not call as a method
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "No se pudo generar el análisis. Verifica tu conexión o cuota de API.";
  }
};
