
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
  startAge: number;
  investmentMonths: number;
  retroactiveMonths: number;
  salaryInUMAs: number;
  continueWorking: boolean;
}

export interface CalculationResult {
  monthlyPension: number; // Valor nominal (pesos que recibirá en su cuenta)
  totalWeeks: number;
  finalAverageSalary: number;
  pensionPercentage: number;
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
  lumpSum: number;
  monthlyRemaining: number;
}

export interface ComparisonResult {
  current: CalculationResult;
  optimized: CalculationResult;
  investment: InvestmentDesglose;
  breakEvenMonths: number;
}
