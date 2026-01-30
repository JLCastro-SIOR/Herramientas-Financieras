
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  TrendingUp, 
  Users, 
  ShieldCheck, 
  ArrowRight,
  Info,
  BrainCircuit,
  Loader2,
  AlertCircle,
  Coins,
  History,
  Lock,
  Heart,
  CalendarDays,
  LineChart as LineChartIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { PensionInputs, Modalidad40Inputs, ComparisonResult } from './types';
import { calculatePension, calculateInvestmentCost } from './services/pensionCalculator';
import { getExpertAdvice } from './services/geminiService';
import { MINIMUM_WAGE_2025, GET_MOD40_PERCENTAGE } from './constants';

const COLORS = ['#0f766e', '#0d9488', '#2dd4bf', '#99f6e4'];

const App: React.FC = () => {
  const [inputs, setInputs] = useState<PensionInputs>({
    currentAge: 55,
    retirementAge: 60,
    currentWeeks: 1000,
    currentDailySalary: 400,
    hasSpouse: true,
    childrenUnder25: 0,
    hasParentsDependent: false,
    baseUMA: 113.43,
    inflationRate: 4.5,
    minWage: MINIMUM_WAGE_2025
  });

  const [mod40, setMod40] = useState<Modalidad40Inputs>({
    enabled: true,
    investmentMonths: 60,
    retroactiveMonths: 0,
    salaryInUMAs: 25
  });

  const [advice, setAdvice] = useState<string | null>(null);
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);

  const results = useMemo((): ComparisonResult => {
    const current = calculatePension(inputs, { ...mod40, enabled: false });
    const optimized = calculatePension(inputs, mod40);
    const investment = calculateInvestmentCost(mod40, inputs.baseUMA, inputs.inflationRate);
    
    const monthlyGain = optimized.monthlyPension - current.monthlyPension;
    const breakEvenMonths = monthlyGain > 0 ? investment.total / monthlyGain : 0;

    return { current, optimized, investment, breakEvenMonths };
  }, [inputs, mod40]);

  // Generar datos para la gráfica de proyección de pagos mensuales
  const paymentProjectionData = useMemo(() => {
    if (!mod40.enabled || mod40.investmentMonths <= 0) return [];
    
    const data = [];
    const inflationDec = inputs.inflationRate / 100;
    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();
    let currentUma = inputs.baseUMA;

    for (let m = 0; m < mod40.investmentMonths; m++) {
      // Ajuste de UMA cada febrero (aproximado por simplificación a inicio de año)
      if (currentMonth === 1 && m > 0) currentUma = currentUma * (1 + inflationDec);
      
      const costPct = GET_MOD40_PERCENTAGE(currentYear);
      const monthlyPayment = mod40.salaryInUMAs * currentUma * 30.4 * costPct;
      
      // Solo guardamos un punto por cada 3 meses o al final de cada año para que la gráfica no esté saturada
      // Pero para 5 años (60 meses) podemos mostrar todos
      data.push({
        mes: m + 1,
        pago: Math.round(monthlyPayment),
        year: currentYear
      });

      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }
    return data;
  }, [mod40, inputs.baseUMA, inputs.inflationRate]);

  const handleInputChange = (field: keyof PensionInputs, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const handleMod40Change = (field: keyof Modalidad40Inputs, value: any) => {
    setMod40(prev => ({ ...prev, [field]: value }));
  };

  const fetchAdvice = async () => {
    setIsAdviceLoading(true);
    const response = await getExpertAdvice(results);
    setAdvice(response);
    setIsAdviceLoading(false);
  };

  const chartData = [
    { name: 'Base', Pension: Math.round(results.current.monthlyPension) },
    { name: 'Optimizado', Pension: Math.round(results.optimized.monthlyPension) }
  ];

  const breakdownData = [
    { name: 'Cuantía Básica', value: results.optimized.breakdown.cuantiaBasica },
    { name: 'Incrementos', value: results.optimized.breakdown.incrementosAnuales },
    { name: results.optimized.breakdown.isSoledad ? 'Ayuda Soledad' : 'Asignaciones', value: results.optimized.breakdown.familyAssignment },
    { name: 'Factor Fox', value: results.optimized.breakdown.foxFactor },
  ];

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <header className="bg-emerald-900 text-white py-10 px-4 shadow-xl border-b-4 border-emerald-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-2xl shadow-inner">
              <Calculator className="text-emerald-900 w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase italic">Pensiona-T <span className="text-emerald-400">Pro</span></h1>
              <p className="text-emerald-100 opacity-90 font-medium tracking-wide">Expertos en Ley 73 & Modalidad 40</p>
            </div>
          </div>
          <div className="bg-emerald-800/60 p-4 rounded-2xl border border-emerald-700 backdrop-blur-sm">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
               <span className="text-xs uppercase font-bold text-emerald-300">Ajuste Mercado 2025</span>
             </div>
             <div className="flex gap-4 mt-2">
                <div>
                   <p className="text-[9px] text-emerald-200 font-bold uppercase">S. Mínimo</p>
                   <input type="number" value={inputs.minWage} onChange={(e) => handleInputChange('minWage', Number(e.target.value))} className="bg-transparent border-b border-emerald-500 font-bold text-base w-20 outline-none" />
                </div>
                <div>
                   <p className="text-[9px] text-emerald-200 font-bold uppercase">UMA</p>
                   <input type="number" value={inputs.baseUMA} onChange={(e) => handleInputChange('baseUMA', Number(e.target.value))} className="bg-transparent border-b border-emerald-500 font-bold text-base w-16 outline-none" />
                </div>
                <div>
                   <p className="text-[9px] text-emerald-200 font-bold uppercase">Inflación</p>
                   <input type="number" value={inputs.inflationRate} onChange={(e) => handleInputChange('inflationRate', Number(e.target.value))} className="bg-transparent border-b border-emerald-500 font-bold text-base w-12 outline-none" />
                </div>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-1 space-y-6">
          <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Users className="text-emerald-600 w-5 h-5" />
              <h2 className="font-bold text-slate-800 uppercase text-sm tracking-widest">Tus Datos</h2>
            </div>
            
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Edad Actual</label>
                  <input type="number" value={inputs.currentAge} onChange={(e) => handleInputChange('currentAge', Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Retiro</label>
                  <select value={inputs.retirementAge} onChange={(e) => handleInputChange('retirementAge', Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold">
                    {[60, 61, 62, 63, 64, 65].map(age => <option key={age} value={age}>{age} años</option>)}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Semanas Actuales</label>
                <input type="number" value={inputs.currentWeeks} onChange={(e) => handleInputChange('currentWeeks', Number(e.target.value))} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Salario Diario Promedio</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                  <input type="number" value={inputs.currentDailySalary} onChange={(e) => handleInputChange('currentDailySalary', Number(e.target.value))} className="w-full pl-8 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-bold text-emerald-700" />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Dependientes Económicos</p>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={inputs.hasSpouse} onChange={(e) => handleInputChange('hasSpouse', e.target.checked)} className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">Esposa/o (+15%)</span>
                </label>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Hijos (-25 años)</span>
                  <input type="number" value={inputs.childrenUnder25} onChange={(e) => handleInputChange('childrenUnder25', Number(e.target.value))} className="w-16 px-3 py-1 rounded-lg border border-slate-200 outline-none font-bold text-center" min="0" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={inputs.hasParentsDependent} onChange={(e) => handleInputChange('hasParentsDependent', e.target.checked)} className="w-5 h-5 rounded-lg text-emerald-600 focus:ring-emerald-500 border-slate-300" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">Padres (+10%)</span>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-emerald-50 p-6 rounded-3xl border-2 border-emerald-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-700 w-5 h-5" />
                <h2 className="font-bold text-emerald-900 uppercase text-sm tracking-widest">Estrategia M40</h2>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={mod40.enabled} onChange={(e) => handleMod40Change('enabled', e.target.checked)} />
                <div className="w-12 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className={`space-y-6 transition-all ${!mod40.enabled ? 'opacity-30 blur-[1px] pointer-events-none' : 'opacity-100'}`}>
              <div>
                <div className="flex justify-between text-xs font-bold text-emerald-800 mb-2 uppercase">
                  <span>Inversión UMAs</span>
                  <span className="bg-emerald-200 px-2 py-0.5 rounded text-emerald-900 font-mono font-bold">{mod40.salaryInUMAs} UMA</span>
                </div>
                <input type="range" min="1" max="25" step="1" value={mod40.salaryInUMAs} onChange={(e) => handleMod40Change('salaryInUMAs', Number(e.target.value))} className="w-full h-2 bg-emerald-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                
                {/* Visor de Pesos (Salario Diario) */}
                <div className="mt-3 bg-white/60 p-3 rounded-xl border border-emerald-100/50 flex items-center justify-between">
                   <span className="text-[10px] font-black text-emerald-600 uppercase">Salario Diario:</span>
                   <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-emerald-800">${(mod40.salaryInUMAs * inputs.baseUMA).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[10px] font-bold text-emerald-600">MXN</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 mb-1 uppercase">Meses Atrás</label>
                  <input type="number" value={mod40.retroactiveMonths} onChange={(e) => handleMod40Change('retroactiveMonths', Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-white border border-emerald-200 outline-none font-bold" min="0" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 mb-1 uppercase">Meses Futuros</label>
                  <input type="number" value={mod40.investmentMonths} onChange={(e) => handleMod40Change('investmentMonths', Number(e.target.value))} className="w-full px-4 py-2 rounded-xl bg-white border border-emerald-200 outline-none font-bold" min="0" />
                </div>
              </div>

              <div className="bg-white/80 p-5 rounded-2xl border border-emerald-200 space-y-3 shadow-inner">
                <div className="flex justify-between items-center text-emerald-900 border-b border-emerald-100 pb-2">
                  <span className="text-[10px] font-black text-emerald-600 uppercase">Pago Inicial</span>
                  <span className="font-mono font-bold text-lg text-emerald-600">${results.investment.lumpSum.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Inversión Total</span>
                  <span className="text-xl font-black text-emerald-800">${results.investment.total.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-10 -mt-10"></div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin Estrategia</span>
                {results.current.isMinimumGuaranteed && (
                  <span className="bg-amber-100 text-amber-700 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3" /> PISO LEGAL
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-slate-700">${results.current.monthlyPension.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</h3>
                <span className="text-slate-400 font-bold">/ mes</span>
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1"><CalendarDays className="w-3 h-3"/> Semanas: {results.current.totalWeeks}</p>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Edad: {results.current.pensionPercentage}%</p>
              </div>
            </div>

            <div className="bg-emerald-900 p-8 rounded-3xl shadow-xl border-b-4 border-emerald-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform">
                <Coins className="text-white w-20 h-20" />
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest">Optimizado</span>
                {results.optimized.isMinimumGuaranteed && (
                  <span className="bg-emerald-400 text-emerald-900 text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
                    <Lock className="w-3 h-3" /> PISO LEGAL
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <h3 className="text-4xl font-black text-white">${results.optimized.monthlyPension.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</h3>
                <span className="text-emerald-300 font-bold">/ mes</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                 <div className="bg-emerald-800/40 p-2 rounded-xl border border-emerald-700/50">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase">Semanas</p>
                    <p className="text-sm font-bold text-emerald-100">{results.optimized.totalWeeks}</p>
                 </div>
                 <div className="bg-emerald-800/40 p-2 rounded-xl border border-emerald-700/50">
                    <p className="text-[9px] font-bold text-emerald-400 uppercase">ROI</p>
                    <p className="text-sm font-bold text-emerald-100">{(results.breakEvenMonths / 12).toFixed(1)} años</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
             <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Heart className="w-5 h-5 text-emerald-600" />
                Factores Aplicados (Ley 73)
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                   <div className="bg-emerald-100 p-3 rounded-xl">
                      <CalendarDays className="text-emerald-700 w-6 h-6" />
                   </div>
                   <div>
                      <p className="text-xs text-slate-400 font-black uppercase">Factor por Edad</p>
                      <p className="text-xl font-black text-slate-700">{results.optimized.pensionPercentage}% <span className="text-xs font-medium text-slate-400">(Vejez/Cesantía)</span></p>
                   </div>
                </div>
                <div className={`flex items-center gap-4 p-5 rounded-2xl border ${results.optimized.breakdown.isSoledad ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                   <div className={`${results.optimized.breakdown.isSoledad ? 'bg-amber-100' : 'bg-emerald-100'} p-3 rounded-xl`}>
                      <Users className={`${results.optimized.breakdown.isSoledad ? 'text-amber-700' : 'text-emerald-700'} w-6 h-6`} />
                   </div>
                   <div>
                      <p className="text-xs text-slate-400 font-black uppercase">Apoyo Familiar</p>
                      <p className="text-xl font-black text-slate-700">
                         {results.optimized.breakdown.isSoledad ? 'Ayuda Soledad (+15%)' : 'Asignaciones Aplicadas'}
                      </p>
                   </div>
                </div>
             </div>
          </div>

          {/* Nueva Gráfica: Proyección de Pagos Mensuales M40 */}
          {mod40.enabled && paymentProjectionData.length > 0 && (
            <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
               <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                  <LineChartIcon className="w-5 h-5 text-emerald-600" />
                  Proyección de Cuotas Mensuales
               </h3>
               <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={paymentProjectionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                           <linearGradient id="colorPago" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="mes" 
                          label={{ value: 'Meses de Inversión', position: 'insideBottom', offset: -5, fontSize: 10, fontWeight: 'bold' }} 
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis 
                          tickFormatter={(val) => `$${val.toLocaleString()}`}
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip 
                          formatter={(value: any) => [`$${value.toLocaleString()}`, 'Pago Mensual']}
                          labelFormatter={(label) => `Mes ${label}`}
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                        />
                        <Area type="monotone" dataKey="pago" stroke="#10b981" fillOpacity={1} fill="url(#colorPago)" strokeWidth={3} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
               <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  <p className="text-[10px] text-emerald-800 font-medium">
                    Nota: Los incrementos en la cuota se deben a la actualización anual de la UMA (Inflación) y al incremento programado de la tasa de Modalidad 40 por ley.
                  </p>
               </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Diferencia de Ingreso
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                    <YAxis hide />
                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(value: any) => [`$${value.toLocaleString()}`, 'Pensión']} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="Pension" fill="#10b981" radius={[12, 12, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Info className="w-5 h-5 text-emerald-600" />
                Desglose Legal (Anual)
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={breakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                      {breakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`$${value.toLocaleString()}`, 'Monto']} />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-5">
                <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg">
                  <BrainCircuit className="w-8 h-8 text-slate-900" />
                </div>
                <div>
                  <h3 className="text-2xl font-black">Asesor Virtual IA</h3>
                  <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Análisis Retroactivo & ROI</p>
                </div>
              </div>
              <button onClick={fetchAdvice} disabled={isAdviceLoading} className="bg-white hover:bg-emerald-50 text-slate-900 font-black px-8 py-4 rounded-2xl transition-all flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95">
                {isAdviceLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Analizar Viabilidad <ArrowRight className="w-5 h-5" /></>}
              </button>
            </div>
            {advice && (
              <div className="mt-10 bg-slate-800/40 border border-slate-700/50 p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-8 duration-700 backdrop-blur-sm">
                <p className="text-slate-200 leading-relaxed text-lg font-medium italic">"{advice}"</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-100 p-8 rounded-3xl flex gap-6 shadow-sm">
            <div className="bg-blue-500/10 p-3 rounded-2xl shrink-0 h-fit">
               <Info className="text-blue-600 w-6 h-6" />
            </div>
            <div className="text-sm text-blue-900 leading-relaxed">
              <p className="font-black text-blue-950 mb-2 uppercase tracking-tight">Reglas de Asignación y Edad:</p>
              <p className="opacity-80 font-medium">
                Esta calculadora aplica el **Art. 164 de la LSS 1973**: Si no tienes esposa ni hijos, recibes automáticamente **15% de ayuda por soledad**. 
                El factor de edad es vital: a los 60 recibes el **75%** y por cada año de espera tu pensión sube un **5%** adicional hasta llegar al **100%** a los 65 años.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
