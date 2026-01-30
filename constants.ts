
// Valor de la UMA oficial 2025 (Efectiva desde Feb 2025)
export const UMA_VALUE_2025 = 113.43;

// Salario Mínimo General 2025 (Estimado/Oficial para el resto del país)
export const MINIMUM_WAGE_2025 = 278.80;

// Estimación de inflación anual promedio
export const DEFAULT_ANNUAL_INFLATION = 0.045; 

/**
 * Tabla de incrementos de cuota Modalidad 40
 * Incluye años previos para cálculos retroactivos
 */
export const MOD_40_COST_SCHEDULE: Record<number, number> = {
  2022: 0.10075,
  2023: 0.11166,
  2024: 0.12256,
  2025: 0.13347,
  2026: 0.14438,
  2027: 0.15529,
  2028: 0.16620,
  2029: 0.17711,
  2030: 0.18800,
};

export const GET_MOD40_PERCENTAGE = (year: number): number => {
  return MOD_40_COST_SCHEDULE[year] || (year < 2022 ? 0.10075 : 0.18800);
};

// Tabla Artículo 167 - Cuantía Básica e Incremento Anual (Ley 73)
export const CUANTIA_TABLE = [
  [1.0, 80.0, 0.563],
  [1.25, 77.11, 0.814],
  [1.50, 58.18, 1.178],
  [1.75, 49.23, 1.430],
  [2.0, 42.67, 1.615],
  [2.25, 37.65, 1.756],
  [2.5, 33.68, 1.868],
  [2.75, 30.48, 1.958],
  [3.0, 27.83, 2.033],
  [3.25, 25.60, 2.096],
  [3.5, 23.70, 2.149],
  [3.75, 22.07, 2.195],
  [4.0, 20.65, 2.235],
  [4.25, 19.39, 2.271],
  [4.5, 18.29, 2.302],
  [4.75, 17.30, 2.330],
  [5.0, 16.41, 2.355],
  [5.25, 15.61, 2.378],
  [5.5, 14.88, 2.399],
  [5.75, 14.22, 2.418],
  [6.0, 13.62, 2.435]
];

export const AGE_PENSION_PERCENTAGE: Record<number, number> = {
  60: 0.75,
  61: 0.80,
  62: 0.85,
  63: 0.90,
  64: 0.95,
  65: 1.0,
};
