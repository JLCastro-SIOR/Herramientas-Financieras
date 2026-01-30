
export interface PensionInputs {
  currentAge: number;
  retirementAge: number;
  currentWeeks: number;
  currentDailySalary: number;
  hasSpouse: boolean;
  childrenUnder25: number;
  hasParentsDependent: boolean;
  baseUMA: number;
  inflationRate: number;
  minWage: number;
}

export interface Modalidad40Inputs {
  enabled: boolean;
  investmentMonths: number;
  retroactiveMonths: number;
  salaryInUMAs: number; // Max 25
}

export interface CalculationResult {
  monthlyPension: number;
  annualPension: number;
  pensionPercentage: number;
  totalWeeks: number;
  finalDailySalary: number;
  isMinimumGuaranteed: boolean;
  breakdown: {
    cuantiaBasica: number;
    incrementosAnuales: number;
    foxFactor: number;
    familyAssignment: number;
    isSoledad: boolean;
  };
}

export interface InvestmentDesglose {
  total: number;
  lumpSum: number; // Pago inicial único por retroactivo
  monthlyRemaining: number;
}

export interface ComparisonResult {
  current: CalculationResult;
  optimized: CalculationResult;
  investment: InvestmentDesglose;
  breakEvenMonths: number;
}
