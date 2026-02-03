
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
  const { currentDailySalary, currentWeeks, retirementAge, baseUMA, inflationRate, minWage, currentAge } = inputs;
  const inflationDec = inflationRate / 100;
  const yearsUntilRetirement = Math.max(0, retirementAge - currentAge);
  
  // 1. Proyecciones Nominales al Retiro
  const projectedUMAatRetirement = baseUMA * Math.pow(1 + inflationDec, yearsUntilRetirement);
  const projectedMinWageAtRetirement = minWage * Math.pow(1 + inflationDec, yearsUntilRetirement);

  // 2. Cálculo de Semanas Totales
  let totalWeeksAtRetirement = currentWeeks;

  if (mod40.enabled) {
    // Escenario M40:
    const yearsToStart = Math.max(0, mod40.startAge - currentAge);
    
    // Semanas por seguir trabajando con patrón ANTES de iniciar M40
    if (mod40.continueWorking) {
      totalWeeksAtRetirement += Math.floor(yearsToStart * 52);
    }
    
    // Semanas por pago de Modalidad 40
    const m40Weeks = Math.floor((mod40.investmentMonths + mod40.retroactiveMonths) * 4.34);
    totalWeeksAtRetirement += m40Weeks;
  } else {
    // Escenario Base:
    // Si el usuario marca que sigue cotizando, sumamos las semanas 
    // desde hoy hasta la edad de inicio de pagos (startAge).
    if (mod40.continueWorking) {
      const yearsToStart = Math.max(0, mod40.startAge - currentAge);
      totalWeeksAtRetirement += Math.floor(yearsToStart * 52);
    }
    // Si no marca seguir cotizando, se queda con las semanas actuales (congelado).
  }

  // 3. Salario Promedio de las últimas 250 semanas (Nominal)
  let finalAverageSalary = 0;

  if (!mod40.enabled) {
    // Sin estrategia: Salario actual
    finalAverageSalary = currentDailySalary;
  } else {
    // Con Modalidad 40: Promedio ponderado
    const m40Weeks = Math.floor((mod40.investmentMonths + mod40.retroactiveMonths) * 4.34);
    const weightsM40 = Math.min(250, m40Weeks);
    const weightsPatron = Math.max(0, 250 - weightsM40);

    const yearsToStart = Math.max(0, mod40.startAge - currentAge);
    const umaAtStart = baseUMA * Math.pow(1 + inflationDec, yearsToStart);
    const m40DailySalary = mod40.salaryInUMAs * umaAtStart;

    finalAverageSalary = ((m40DailySalary * weightsM40) + (currentDailySalary * weightsPatron)) / 250;
  }

  // 4. Cálculo de Cuantía (Art. 167 LSS 1973)
  const ratio = finalAverageSalary / projectedUMAatRetirement;
  
  let cuantiaBasicaPct = 13.62;
  let incrementoAnualPct = 2.435;

  for (const row of CUANTIA_TABLE) {
    if (ratio <= row[0]) {
      cuantiaBasicaPct = row[1];
      incrementoAnualPct = row[2];
      break;
    }
  }

  const cuantiaBasicaDiaria = finalAverageSalary * (cuantiaBasicaPct / 100);
  const extraWeeks = Math.max(0, totalWeeksAtRetirement - 500);
  const totalIncrements = Math.floor(extraWeeks / 52);
  const incrementoAnualDiario = finalAverageSalary * (incrementoAnualPct / 100);

  let pensionBaseAnual = (cuantiaBasicaDiaria * 365) + (incrementoAnualDiario * 365 * totalIncrements);
  
  const foxFactor = pensionBaseAnual * 0.11;
  pensionBaseAnual += foxFactor;

  // 5. Asignaciones Familiares
  let familyBonusPct = 0;
  let isSoledad = false;

  if (inputs.hasSpouse) familyBonusPct += 0.15;
  
  // Asignación por hijos (10% por cada uno)
  familyBonusPct += (inputs.childrenUnder25 * 0.10);

  // Si no hay esposa ni hijos, ayuda asistencial por soledad
  if (!inputs.hasSpouse && inputs.childrenUnder25 === 0) {
    if (inputs.hasParentsDependent) {
      familyBonusPct += 0.10;
    } else {
      familyBonusPct = 0.15;
      isSoledad = true;
    }
  }

  const familyAssignment = pensionBaseAnual * familyBonusPct;
  let totalAnualPreEdad = pensionBaseAnual + familyAssignment;

  // 6. Factor por Edad
  const ageFactor = AGE_PENSION_PERCENTAGE[retirementAge] || 1.0;
  let finalAnnualNominal = totalAnualPreEdad * ageFactor;

  // 7. Pensión Mínima Garantizada
  const monthlyMinNominal = (projectedMinWageAtRetirement * 30.41) * 1.11;
  let finalMonthlyNominal = finalAnnualNominal / 12;
  let isMinimumGuaranteed = false;

  if (finalMonthlyNominal < monthlyMinNominal) {
    finalMonthlyNominal = monthlyMinNominal;
    isMinimumGuaranteed = true;
  }

  return {
    monthlyPension: finalMonthlyNominal,
    totalWeeks: totalWeeksAtRetirement,
    finalAverageSalary,
    pensionPercentage: ageFactor * 100,
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

export const calculateInvestmentCost = (mod40: Modalidad40Inputs, baseUMA: number, inflationRate: number, currentAge: number): InvestmentDesglose => {
  if (!mod40.enabled) return { total: 0, lumpSum: 0, monthlyRemaining: 0 };
  
  const inflationDec = inflationRate / 100;
  const yearsToStart = Math.max(0, mod40.startAge - currentAge);
  const umaAtStart = baseUMA * Math.pow(1 + inflationDec, yearsToStart);
  
  let lumpSum = 0;
  for (let m = 1; m <= mod40.retroactiveMonths; m++) {
    const costPct = GET_MOD40_PERCENTAGE(new Date().getFullYear());
    const baseMonthly = mod40.salaryInUMAs * baseUMA * 30.4 * costPct;
    lumpSum += baseMonthly * 1.0147; 
  }

  let monthlyTotalNominal = 0;
  for (let m = 0; m < mod40.investmentMonths; m++) {
    const yearOffset = Math.floor(m / 12);
    const actualYear = new Date().getFullYear() + Math.floor(yearsToStart) + yearOffset;
    const costPct = GET_MOD40_PERCENTAGE(actualYear);
    const effectiveUmaForCost = umaAtStart * Math.pow(1 + inflationDec, yearOffset);
    monthlyTotalNominal += mod40.salaryInUMAs * effectiveUmaForCost * 30.4 * costPct;
  }

  return { total: lumpSum + monthlyTotalNominal, lumpSum, monthlyRemaining: monthlyTotalNominal };
};
