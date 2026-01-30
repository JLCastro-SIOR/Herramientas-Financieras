
import { GoogleGenAI } from "@google/genai";
import { ComparisonResult } from "../types";

export const getExpertAdvice = async (results: ComparisonResult) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Fix: Property 'totalInvestment' does not exist on type 'ComparisonResult'. Use results.investment.total instead.
  const prompt = `
    Actúa como un experto en pensiones del IMSS Ley 73.
    Analiza la siguiente simulación de Modalidad 40:
    
    ESCENARIO ACTUAL:
    - Pensión mensual: $${results.current.monthlyPension.toFixed(2)} MXN
    - Semanas totales: ${results.current.totalWeeks}
    
    ESCENARIO CON MODALIDAD 40:
    - Inversión total estimada: $${results.investment.total.toFixed(2)} MXN
    - Pensión mensual optimizada: $${results.optimized.monthlyPension.toFixed(2)} MXN
    - Diferencia mensual: $${(results.optimized.monthlyPension - results.current.monthlyPension).toFixed(2)} MXN
    - Tiempo para recuperar inversión (ROI): ${results.breakEvenMonths.toFixed(1)} meses
    
    Proporciona un análisis breve (máximo 3 párrafos) sobre si vale la pena la inversión, 
    considerando el ROI y el incremento en la calidad de vida. Sé profesional y directo.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Lo sentimos, no pudimos obtener el análisis experto en este momento.";
  }
};
