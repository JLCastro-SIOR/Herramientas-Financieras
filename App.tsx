
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  ArrowRight, 
  BrainCircuit, 
  Loader2, 
  Coins, 
  Mail, 
  MessageCircle, 
  Briefcase, 
  PieChart as PieChartIcon, 
  Baby, 
  Activity, 
  CheckCircle2, 
  TrendingDown, 
  Heart, 
  Printer, 
  FileText 
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area 
} from 'recharts';
import { PensionInputs, Modalidad40Inputs, ComparisonResult } from './types';
import { calculatePension, calculateInvestmentCost } from './services/pensionCalculator';
import { getExpertAdvice } from './services/geminiService';
import { GET_MOD40_PERCENTAGE } from './constants';

const COLORS = ['#0f766e', '#0d9488', '#2dd4bf', '#99f6e4'];

const App: React.FC = () => {
  const [inputs, setInputs] = useState<PensionInputs>({
    currentAge: 55,
    retirementAge: 60,
    currentWeeks: 1900,
    currentDailySalary: 1600,
    hasSpouse: false,
    childrenUnder25: 0,
    hasParentsDependent: false,
    baseUMA: 117.31,
    inflationRate: 5.0,
    minWage: 315.04
  });

  const [mod40, setMod40] = useState<Modalidad40Inputs>({
    enabled: true,
    startAge: 59,
    investmentMonths: 12,
    retroactiveMonths: 0,
    salaryInUMAs: 25,
    continueWorking: true
  });

  const [advice, setAdvice] = useState<string | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);

  // 1. Cálculos en "Condiciones Actuales Hoy" (VALORES ÚNICOS)
  const baseResults = useMemo(() => {
    const baseInputs = { ...inputs, inflationRate: 0 };
    const current = calculatePension(baseInputs, { ...mod40, enabled: false });
    const optimized = calculatePension(baseInputs, mod40);
    const investment = calculateInvestmentCost(mod40, inputs.baseUMA, 0, inputs.currentAge);
    
    const monthlyGain = optimized.monthlyPension - current.monthlyPension;
    const breakEvenMonths = monthlyGain > 0 ? investment.total / monthlyGain : 0;

    return { current, optimized, investment, breakEvenMonths };
  }, [inputs, mod40]);

  const m40MonthlyProjections = useMemo(() => {
    if (!mod40.enabled) return [];
    const data = [];
    const inflationFactor = 1 + (inputs.inflationRate / 100);
    const today = new Date();
    const currentYear = today.getFullYear();
    const yearsUntilStart = Math.max(0, mod40.startAge - inputs.currentAge);
    let runningUMA = inputs.baseUMA * Math.pow(inflationFactor, Math.floor(yearsUntilStart));
    
    for (let m = 0; m < mod40.investmentMonths; m++) {
      const totalMonthsFromNow = (today.getMonth()) + (yearsUntilStart * 12) + m;
      const monthIndex = Math.floor(totalMonthsFromNow) % 12;
      const actualYear = currentYear + Math.floor(totalMonthsFromNow / 12);
      if (monthIndex === 1 && m > 0) runningUMA *= inflationFactor;
      const costPct = GET_MOD40_PERCENTAGE(actualYear);
      const monthlyCost = mod40.salaryInUMAs * runningUMA * 30.41 * costPct;
      const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
      data.push({
        name: `${monthNames[monthIndex]} ${actualYear.toString().slice(-2)}`,
        Cuota: Math.round(monthlyCost),
        UMA: runningUMA.toFixed(2),
        fullName: `${monthNames[monthIndex]} ${actualYear}`
      });
    }
    return data;
  }, [mod40, inputs]);

  const handleInputChange = (field: keyof PensionInputs, value: any) => { setInputs(prev => ({ ...prev, [field]: value })); };
  const handleMod40Change = (field: keyof Modalidad40Inputs, value: any) => { setMod40(prev => ({ ...prev, [field]: value })); };

  const fetchAdvice = async () => {
    setIsAdviceLoading(true);
    const response = await getExpertAdvice(baseResults); 
    setAdvice(response);
    setIsAdviceLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const breakdownData = [
    { name: 'Cuantía Básica', value: baseResults.optimized.breakdown.cuantiaBasica },
    { name: 'Incrementos', value: baseResults.optimized.breakdown.incrementosAnuales },
    { name: baseResults.optimized.breakdown.isSoledad ? 'Ayuda Soledad' : 'Asignaciones', value: baseResults.optimized.breakdown.familyAssignment },
    { name: 'Factor Fox', value: baseResults.optimized.breakdown.foxFactor },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <style>{`
        @media print {
          @page { margin: 1.5cm; }
          .no-print { display: none !important; }
          .print-full { width: 100% !important; margin: 0 !important; border: none !important; box-shadow: none !important; }
          body { background: white !important; }
          main { display: block !important; }
          .lg\\:col-span-1 { display: none !important; }
          .lg\\:col-span-2 { width: 100% !important; }
          .bg-emerald-900 { background-color: #064e3b !important; -webkit-print-color-adjust: exact; }
          .text-white { color: white !important; }
          .rounded-[2.5rem] { border-radius: 1rem !important; }
          .shadow-2xl, .shadow-sm { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
          .print-title { display: block !important; margin-bottom: 2rem; }
        }
        .print-title { display: none; }
      `}</style>

      <header className="bg-emerald-900 text-white pt-10 pb-12 px-4 shadow-xl border-b-4 border-emerald-500 relative z-10 no-print">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-inner group transition-transform hover:scale-105"><Calculator className="text-emerald-900 w-10 h-10" /></div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase italic leading-none">Finanzas en pareja</h1>
              <p className="text-emerald-400 font-bold text-xs mt-2 uppercase tracking-widest text-center md:text-left">Estrategas en Retiro Ley 73</p>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 justify-center md:justify-start">
                <a href="mailto:contacto@parejafinanciera.com" className="flex items-center gap-2 text-xs font-bold text-white hover:text-emerald-300 transition-colors"><Mail className="w-4 h-4" /> contacto@parejafinanciera.com</a>
                <a href="https://wa.me/525569680253" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs font-bold text-white hover:text-emerald-300 transition-colors"><MessageCircle className="w-4 h-4 text-emerald-400" /> 5569680253</a>
              </div>
            </div>
          </div>
          <div className="bg-emerald-800/60 p-5 rounded-2xl border border-emerald-700 backdrop-blur-sm w-full md:w-auto">
             <div className="grid grid-cols-3 gap-6 text-white text-center">
                <div>
                   <p className="text-[10px] text-emerald-200 font-bold uppercase mb-1">UMA 2026</p>
                   <input type="number" step="0.01" value={inputs.baseUMA} onChange={(e) => handleInputChange('baseUMA', Number(e.target.value))} className="bg-emerald-900/50 border border-emerald-600 rounded px-2 py-1 font-bold text-sm w-full outline-none text-center" />
                </div>
                <div>
                   <p className="text-[10px] text-emerald-200 font-bold uppercase mb-1">Salario Mín.</p>
                   <input type="number" step="0.01" value={inputs.minWage} onChange={(e) => handleInputChange('minWage', Number(e.target.value))} className="bg-emerald-900/50 border border-emerald-600 rounded px-2 py-1 font-bold text-sm w-full outline-none text-center" />
                </div>
                <div>
                   <p className="text-[10px] text-emerald-200 font-bold uppercase mb-1">Inflación Est.</p>
                   <div className="flex items-center bg-emerald-900/50 border border-emerald-600 rounded px-2 py-1">
                     <input type="number" step="0.1" value={inputs.inflationRate} onChange={(e) => handleInputChange('inflationRate', Number(e.target.value))} className="bg-transparent font-bold text-sm w-full outline-none text-white text-center" />
                     <span className="text-xs font-bold">%</span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </header>

      <div className="print-title text-center p-8 border-b-2 border-slate-200">
        <h1 className="text-3xl font-black text-slate-800 uppercase">Resumen de Estrategia de Retiro</h1>
        <p className="text-emerald-600 font-bold uppercase tracking-widest text-sm">Finanzas en pareja | Consultoría Ley 73</p>
        <p className="text-slate-400 text-xs mt-2">Fecha de emisión: {new Date().toLocaleDateString('es-MX')}</p>
      </div>

      <main className="max-w-6xl mx-auto px-4 -mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow mb-12 relative z-20">
        <div className="lg:col-span-1 space-y-6 no-print">
          <section className="bg-white p-6 rounded-[2rem] shadow-lg border border-slate-200">
            <h2 className="font-bold text-slate-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-2"><Users className="w-4 h-4 text-emerald-600"/> Perfil Asegurado</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tighter">Edad Actual</label>
                  <input type="number" value={inputs.currentAge} onChange={(e) => handleInputChange('currentAge', Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-slate-900" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tighter">Edad Retiro</label>
                  <select value={inputs.retirementAge} onChange={(e) => handleInputChange('retirementAge', Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-slate-900">
                    {[60, 61, 62, 63, 64, 65].map(age => <option key={age} value={age}>{age} años</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tighter">Semanas Actuales</label>
                <input type="number" value={inputs.currentWeeks} onChange={(e) => handleInputChange('currentWeeks', Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-slate-900" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-tighter">Salario Diario Vigente</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span><input type="number" value={inputs.currentDailySalary} onChange={(e) => handleInputChange('currentDailySalary', Number(e.target.value))} className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-emerald-700" /></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 pb-1">Asignaciones Familiares</p>
                 <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"><input type="checkbox" checked={inputs.hasSpouse} onChange={(e) => handleInputChange('hasSpouse', e.target.checked)} className="w-4 h-4 rounded text-emerald-600" /><span className="text-[11px] font-bold uppercase text-slate-600">Cónyuge (+15%)</span></label>
                 <div className="flex items-center justify-between p-1 rounded hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-2"><Baby className="w-4 h-4 text-slate-400" /><span className="text-[11px] font-bold uppercase text-slate-600">Hijos (-25 años)</span></div>
                    <input type="number" min="0" max="10" value={inputs.childrenUnder25} onChange={(e) => handleInputChange('childrenUnder25', Number(e.target.value))} className="w-12 px-2 py-1 rounded border border-slate-200 text-center font-bold text-xs bg-white" />
                 </div>
                 <label className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-100 transition-colors"><input type="checkbox" checked={inputs.hasParentsDependent} onChange={(e) => handleInputChange('hasParentsDependent', e.target.checked)} className="w-4 h-4 rounded text-emerald-600" /><span className="text-[11px] font-bold uppercase text-slate-600">Padres (+10%)</span></label>
              </div>
            </div>
          </section>
          <section className="bg-emerald-50 p-6 rounded-[2rem] border-2 border-emerald-100 shadow-lg no-print">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-emerald-900 uppercase text-xs tracking-widest flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-700"/> Plan M40</h2>
              <div className="relative inline-block w-12 h-6"><input type="checkbox" checked={mod40.enabled} onChange={(e) => handleMod40Change('enabled', e.target.checked)} className="sr-only peer" id="toggleM40" /><label htmlFor="toggleM40" className="absolute top-0 left-0 right-0 bottom-0 bg-slate-300 rounded-full cursor-pointer peer-checked:bg-emerald-500 transition-colors before:content-[''] before:absolute before:left-1 before:top-1 before:w-4 before:h-4 before:bg-white before:rounded-full before:transition-transform peer-checked:before:translate-x-6"></label></div>
            </div>
            <div className={`space-y-6 ${!mod40.enabled && 'opacity-30 pointer-events-none grayscale'}`}>
              <div className="bg-white/60 p-4 rounded-2xl border border-emerald-200">
                <label className="block text-[10px] font-bold text-emerald-800 mb-1 uppercase tracking-tighter">Edad de Inicio de Pagos</label>
                <select value={mod40.startAge} onChange={(e) => handleMod40Change('startAge', Number(e.target.value))} className="w-full px-3 py-2 rounded-xl bg-white border border-emerald-200 outline-none font-bold text-sm mb-3">
                   {Array.from({length: 15}, (_, i) => inputs.currentAge + i).map(age => <option key={age} value={age}>{age} años</option>)}
                </select>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={mod40.continueWorking} onChange={(e) => handleMod40Change('continueWorking', e.target.checked)} className="rounded" /><span className="text-[10px] font-bold uppercase text-emerald-700">Cotizar hasta el inicio</span></label>
              </div>
              <div>
                <div className="flex justify-between text-[10px] font-bold text-emerald-800 mb-2 uppercase tracking-tighter"><span>Salario: {mod40.salaryInUMAs} UMAs</span><span className="text-emerald-600 font-black">${(mod40.salaryInUMAs * inputs.baseUMA).toLocaleString('es-MX', { maximumFractionDigits: 0 })} S.D.</span></div>
                <input type="range" min="1" max="25" step="1" value={mod40.salaryInUMAs} onChange={(e) => handleMod40Change('salaryInUMAs', Number(e.target.value))} className="w-full h-2 bg-emerald-200 rounded-lg accent-emerald-600 appearance-none cursor-pointer" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-emerald-800 mb-1 uppercase tracking-tighter">Meses Plan</label><input type="number" value={mod40.investmentMonths} onChange={(e) => handleMod40Change('investmentMonths', Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-emerald-200 outline-none font-bold text-sm bg-white" /></div>
                <div><label className="block text-[10px] font-bold text-emerald-800 mb-1 uppercase tracking-tighter">Meses Retro</label><input type="number" value={mod40.retroactiveMonths} onChange={(e) => handleMod40Change('retroactiveMonths', Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-emerald-200 outline-none font-bold text-sm bg-white" /></div>
              </div>
              <div className="bg-emerald-900 text-white p-5 rounded-2xl shadow-inner text-center border-b-4 border-emerald-700">
                 <p className="text-[10px] font-bold text-emerald-300 uppercase mb-1 tracking-[0.2em]">Inversión Estimada (Hoy)</p>
                 <p className="text-2xl font-black">${baseResults.investment.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8 print-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pensión Sin Estrategia */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pensión Sin Estrategia</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Monto Mensual Estimado (Hoy)</p>
                <h3 className="text-4xl font-black text-slate-700 tracking-tighter">${baseResults.current.monthlyPension.toLocaleString('es-MX', { maximumFractionDigits: 0 })}<span className="text-sm text-slate-400 font-bold ml-1 uppercase">/ mes</span></h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter italic">Cálculo al {baseResults.current.pensionPercentage}% por edad</p>
              </div>
              <div className="mt-8 space-y-3 pt-6 border-t border-slate-50">
                 <div className="flex justify-between items-center text-xs"><span className="text-slate-400 font-bold uppercase tracking-tighter">Semanas Totales:</span> <span className="text-slate-700 font-black">{baseResults.current.totalWeeks}</span></div>
                 <div className="flex justify-between items-center text-xs"><span className="text-slate-400 font-bold uppercase tracking-tighter">Salario Diario Prom.:</span> <span className="text-slate-700 font-black">${baseResults.current.finalAverageSalary.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span></div>
              </div>
            </div>

            {/* Pensión Optimizada */}
            <div className="bg-emerald-900 p-8 rounded-[2.5rem] shadow-2xl border-b-4 border-emerald-500 text-white flex flex-col justify-between relative overflow-hidden group hover:scale-[1.01] transition-all">
              <div className="relative z-10">
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Pensión Optimizada (M40)</span>
                <div className="mt-4">
                  <p className="text-[10px] font-black text-emerald-300/60 uppercase mb-1 tracking-tighter">Monto Mensual Estimado (Hoy)</p>
                  <h3 className="text-4xl font-black text-white tracking-tighter">${baseResults.optimized.monthlyPension.toLocaleString('es-MX', { maximumFractionDigits: 0 })}<span className="text-sm text-emerald-300 font-bold ml-1 uppercase">/ mes</span></h3>
                  <p className="text-[10px] font-bold text-emerald-300/60 mt-1 uppercase tracking-tighter italic">Cálculo al {baseResults.optimized.pensionPercentage}% por edad</p>
                </div>
              </div>
              <div className="mt-8 space-y-3 pt-6 border-t border-emerald-800 relative z-10">
                <div className="flex justify-between items-center text-xs"><span className="text-emerald-400 font-bold uppercase tracking-widest">Semanas Finales:</span> <span className="text-emerald-50 font-black">{baseResults.optimized.totalWeeks}</span></div>
                <div className="flex justify-between items-center text-xs"><span className="text-emerald-400 font-bold uppercase tracking-widest">Salario Estrategia:</span> <span className="text-emerald-50 font-black">${baseResults.optimized.finalAverageSalary.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span></div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-1 rounded-[2.5rem] shadow-2xl">
            <div className="bg-white rounded-[2.4rem] p-8 flex flex-col md:flex-row items-center gap-8">
              <div className="bg-emerald-100 p-6 rounded-full flex items-center justify-center shrink-0 shadow-inner group transition-transform hover:scale-105">
                <Activity className="w-12 h-12 text-emerald-600 animate-pulse" />
              </div>
              <div className="flex-grow text-center md:text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Análisis de Retorno de Inversión</p>
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">Recuperación en {baseResults.breakEvenMonths.toFixed(1)} meses</h2>
                <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                  <div className="bg-emerald-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-emerald-100">
                    <TrendingDown className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-700">{(baseResults.breakEvenMonths / 12).toFixed(1)} años de disfrute</span>
                  </div>
                  <div className="bg-teal-50 px-4 py-2 rounded-2xl flex items-center gap-2 border border-teal-100">
                    <Coins className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-teal-700">Utilidad Extra: ${(baseResults.optimized.monthlyPension - baseResults.current.monthlyPension).toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                  </div>
                </div>
              </div>
              <div className="hidden lg:block w-px h-16 bg-slate-100 no-print"></div>
              <div className="shrink-0 text-center">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4" /> Proyecto Altamente Viable
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden relative group no-print">
             <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
               <div>
                 <h3 className="font-black text-slate-800 uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                   <TrendingUp className="w-5 h-5 text-emerald-600" /> Curva de Inversión Mensual (Nominal Futura)
                 </h3>
                 <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic tracking-tight">Costo real proyectado en pesos del año de pago (2026-2030+)</p>
               </div>
               <div className="bg-emerald-50 px-4 py-1.5 rounded-full text-[10px] font-black text-emerald-700 border border-emerald-100 text-center uppercase tracking-tighter">Proyección de Pagos</div>
             </div>
             <div className="h-72 w-full relative z-10 transition-transform group-hover:scale-[1.01]">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={m40MonthlyProjections} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorCuotaArea" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} tickFormatter={(v) => `$${v/1000}k`} />
                   <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                     labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                     formatter={(v: any) => [`$${v.toLocaleString()}`, 'Pago Mensual']}
                     labelFormatter={(label, props) => props[0]?.payload?.fullName || label}
                   />
                   <Area type="monotone" dataKey="Cuota" stroke="#10b981" strokeWidth={5} fillOpacity={1} fill="url(#colorCuotaArea)" animationDuration={2000} />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
              <h3 className="font-black text-slate-800 mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
                <PieChartIcon className="w-5 h-5 text-emerald-600" /> Desglose de Pensión (Hoy)
              </h3>
              <div className="h-64 flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" animationBegin={200} animationDuration={1000}>
                      {breakdownData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" className="hover:opacity-80 transition-opacity" />)}
                    </Pie>
                    <Tooltip 
                      formatter={(v: any, name: any) => [`$${Number(v).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`, name]}
                      contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                    />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '20px', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
              <div>
                <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-xs uppercase tracking-[0.2em]">
                  <Users className="w-5 h-5 text-emerald-600" /> Beneficios Adicionales
                </h3>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${inputs.hasSpouse ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className={`w-4 h-4 ${inputs.hasSpouse ? 'text-emerald-600' : 'text-slate-300'}`} />
                       <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">Esposa / Cónyuge</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700">+15%</span>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${inputs.childrenUnder25 > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                    <div className="flex items-center gap-3">
                       <Baby className={`w-4 h-4 ${inputs.childrenUnder25 > 0 ? 'text-emerald-600' : 'text-slate-300'}`} />
                       <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">Hijos ({inputs.childrenUnder25})</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700">+{inputs.childrenUnder25 * 10}%</span>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${inputs.hasParentsDependent ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                    <div className="flex items-center gap-3">
                       <Heart className={`w-4 h-4 ${inputs.hasParentsDependent ? 'text-emerald-600' : 'text-slate-300'}`} />
                       <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">Padres Dependientes</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700">+10%</span>
                  </div>
                  <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${baseResults.optimized.breakdown.isSoledad ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                    <div className="flex items-center gap-3">
                       <CheckCircle2 className={`w-4 h-4 ${baseResults.optimized.breakdown.isSoledad ? 'text-emerald-600' : 'text-slate-300'}`} />
                       <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tighter">Asistencia Soledad</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700">+15%</span>
                  </div>
                </div>
              </div>
              <div className="mt-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center leading-relaxed">Nota: Los cálculos consideran el factor Fox (1.11) y asignaciones según Art. 164 LSS 1973</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[120px] -mr-40 -mt-40 group-hover:bg-emerald-500/20 transition-all duration-700 no-print"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className="bg-emerald-500 p-5 rounded-3xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform"><BrainCircuit className="w-9 h-9 text-slate-900" /></div>
                <div>
                  <h3 className="text-2xl font-black italic tracking-tight">Análisis Estratégico</h3>
                  <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Diagnóstico por Inteligencia Artificial</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto no-print">
                <button onClick={fetchAdvice} disabled={isAdviceLoading} className="bg-white hover:bg-emerald-50 text-slate-900 font-black px-10 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl hover:-translate-y-1">
                  {isAdviceLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Solicitar Diagnóstico <ArrowRight className="w-5 h-5" /></>}
                </button>
                <button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-4 rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl hover:-translate-y-1">
                  <Printer className="w-5 h-5" /> Imprimir Reporte (PDF)
                </button>
              </div>
            </div>
            {advice && <div className="mt-10 bg-slate-800/60 p-8 rounded-[2rem] border border-slate-700/50 text-slate-100 italic text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-inner">"{advice}"</div>}
          </div>

        </div>
      </main>

      <footer className="bg-[#022c22] text-white py-16 px-6 no-print">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Columna 1 */}
          <div className="space-y-6">
            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              Finanzas en pareja
            </h2>
            <div className="h-1 w-12 bg-emerald-500"></div>
            <p className="text-slate-300 text-sm font-medium leading-relaxed max-w-xs">
              Especialistas en estrategias financieras y planeación de retiro. Maximisamos tu futuro financiero con estrategias personalizadas.
            </p>
          </div>

          {/* Columna 2 */}
          <div className="space-y-8">
            <h3 className="text-emerald-400 font-black uppercase text-xs tracking-[0.2em]">
              Canales de atención
            </h3>
            <div className="space-y-6">
              <p className="text-white font-black text-sm uppercase italic">
                Para una asesoría integral contáctanos:
              </p>
              
              <div className="flex items-center gap-4">
                <div className="bg-[#064e3b] p-3 rounded-xl border border-emerald-800/50">
                  <Mail className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-0.5">Correo Electrónico</p>
                  <a href="mailto:contacto@parejafinanciera.com" className="text-white font-black text-sm hover:text-emerald-300 transition-colors">
                    contacto@parejafinanciera.com
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="bg-[#064e3b] p-3 rounded-xl border border-emerald-800/50">
                  <MessageCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest mb-0.5">Whatsapp Directo</p>
                  <a href="https://wa.me/525569680253" target="_blank" rel="noopener noreferrer" className="text-white font-black text-sm hover:text-emerald-300 transition-colors">
                    55 6968 0253
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Columna 3 */}
          <div className="space-y-8 flex flex-col justify-between">
            <div>
              <h3 className="text-emerald-400 font-black uppercase text-xs tracking-[0.2em] mb-6">
                Información importante
              </h3>
              <p className="text-slate-400 text-xs italic font-medium leading-relaxed">
                Los cálculos mostrados son simulaciones informativas basadas en la Ley LSS 1973. Los montos finales dependen de la resolución oficial del IMSS. "Finanzas en pareja" actúa como consultor de apoyo.
              </p>
            </div>
            
            <div className="pt-8 border-t border-emerald-900/50">
              <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">
                © 2025 Finanzas en pareja
              </p>
              <p className="text-slate-500 font-bold text-[9px] uppercase tracking-tighter">
                Hecho para el retiro digno del trabajador mexicano
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
