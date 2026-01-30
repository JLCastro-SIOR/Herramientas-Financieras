
import { 
  CUANTIA_TABLE, 
  AGE_PENSION_PERCENTAGE,
  GET_MOD40_PERCENTAGE
} from '../constants';
import { PensionInputs, Modalidad40Inputs, CalculationResult, InvestmentDesglose } from '../types';

export const calculatePension = (
  inputs: PensionInputs, 
  mod40: Modalidad40Inputs
): CalculationResult => {
  const { currentDailySalary, currentWeeks, retirementAge, baseUMA, inflationRate, minWage } = inputs;
  const inflationDec = inflationRate / 100;
  
  const yearsToRetirement = Math.max(0, retirementAge - inputs.currentAge);
  const projectedUMA = baseUMA * Math.pow(1 + inflationDec, yearsToRetirement);

  // 1. Semanas Totales
  const additionalWeeks = mod40.enabled 
    ? Math.floor((mod40.investmentMonths + mod40.retroactiveMonths) * 4.34) 
    : 0;
  const totalWeeks = currentWeeks + additionalWeeks;

  // 2. Salario Promedio (Últimas 250 semanas)
  let finalDailySalary = currentDailySalary;
  if (mod40.enabled) {
    const mod40Daily = mod40.salaryInUMAs * baseUMA; 
    const weightsMod40 = Math.min(250, additionalWeeks);
    const weightsCurrent = Math.max(0, 250 - weightsMod40);
    finalDailySalary = ((currentDailySalary * weightsCurrent) + (mod40Daily * weightsMod40)) / 250;
  }

  // 3. Cuantía Básica e Incrementos
  const ratio = finalDailySalary / projectedUMA;
  let cuantiaBasicaPct = 13.62;
  let incrementoAnualPct = 2.435;

  for (const row of CUANTIA_TABLE) {
    if (ratio <= row[0]) {
      cuantiaBasicaPct = row[1];
      incrementoAnualPct = row[2];
      break;
    }
  }

  const cuantiaBasicaDiaria = finalDailySalary * (cuantiaBasicaPct / 100);
  const extraWeeks = Math.max(0, totalWeeks - 500);
  const totalIncrements = Math.floor(extraWeeks / 52);
  const incrementoAnualDiario = finalDailySalary * (incrementoAnualPct / 100);

  let pensionBaseAnual = (cuantiaBasicaDiaria * 365) + (incrementoAnualDiario * 365 * totalIncrements);
  
  // 4. Factor Fox (11% incremento Decreto 2004)
  const foxFactor = pensionBaseAnual * 0.11;
  pensionBaseAnual += foxFactor;

  // 5. Asignaciones Familiares o Ayuda por Soledad (Art. 164 LSS 1973)
  let familyBonusPct = 0;
  let isSoledad = false;

  if (inputs.hasSpouse) {
    familyBonusPct += 0.15;
  }
  
  familyBonusPct += (inputs.childrenUnder25 * 0.10);

  // Si no hay esposa ni hijos, checamos padres o soledad
  if (!inputs.hasSpouse && inputs.childrenUnder25 === 0) {
    if (inputs.hasParentsDependent) {
      familyBonusPct += 0.10;
    } else {
      // AYUDA POR SOLEDAD: 15% si no tiene a nadie
      familyBonusPct = 0.15;
      isSoledad = true;
    }
  }

  const familyAssignment = pensionBaseAnual * familyBonusPct;
  let totalConAsignaciones = pensionBaseAnual + familyAssignment;

  // 6. Factor de Edad (Cesantía/Vejez)
  const ageFactor = AGE_PENSION_PERCENTAGE[retirementAge] || 1.0;
  let totalAnnual = totalConAsignaciones * ageFactor;

  // 7. Pensión Mínima Garantizada L73
  const monthlyMinPension = (minWage * 30.41) * 1.11;
  const annualMinPension = monthlyMinPension * 12;

  let isMinimumGuaranteed = false;
  let finalMonthlyPension = totalAnnual / 12;

  if (finalMonthlyPension < monthlyMinPension) {
    finalMonthlyPension = monthlyMinPension;
    isMinimumGuaranteed = true;
  }

  return {
    monthlyPension: finalMonthlyPension,
    annualPension: finalMonthlyPension * 12,
    pensionPercentage: ageFactor * 100,
    totalWeeks,
    finalDailySalary,
    isMinimumGuaranteed,
    breakdown: {
      cuantiaBasica: cuantiaBasicaDiaria * 365,
      incrementosAnuales: incrementoAnualDiario * 365 * totalIncrements,
      foxFactor,
      familyAssignment,
      isSoledad
    }
  };
};

export const calculateInvestmentCost = (mod40: Modalidad40Inputs, baseUMA: number, inflationRate: number): InvestmentDesglose => {
  if (!mod40.enabled) return { total: 0, lumpSum: 0, monthlyRemaining: 0 };
  
  let lumpSum = 0;
  let monthlyTotalFuture = 0;
  const inflationDec = inflationRate / 100;
  const surchargeRate = 0.0147; 

  let retroYear = new Date().getFullYear();
  let retroMonth = new Date().getMonth();
  let retroUma = baseUMA;

  for (let m = 1; m <= mod40.retroactiveMonths; m++) {
    retroMonth--;
    if (retroMonth < 0) {
      retroMonth = 11;
      retroYear--;
      retroUma = retroUma / (1 + inflationDec);
    }

    const costPct = GET_MOD40_PERCENTAGE(retroYear);
    const baseMonthly = mod40.salaryInUMAs * retroUma * 30.4 * costPct;
    const surcharges = baseMonthly * (surchargeRate * m);
    const inflationAdjustment = baseMonthly * (inflationDec / 12 * m);
    lumpSum += baseMonthly + surcharges + inflationAdjustment;
  }

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth();
  let currentUma = baseUMA;

  for (let m = 0; m < mod40.investmentMonths; m++) {
    if (currentMonth === 1) currentUma = currentUma * (1 + inflationDec);
    const costPct = GET_MOD40_PERCENTAGE(currentYear);
    const monthlyPayment = mod40.salaryInUMAs * currentUma * 30.4 * costPct;
    monthlyTotalFuture += monthlyPayment;
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return { total: lumpSum + monthlyTotalFuture, lumpSum, monthlyRemaining: monthlyTotalFuture };
};
