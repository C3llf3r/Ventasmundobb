import React, { useState } from 'react';
import { DollarSign, CreditCard, Wallet, TrendingUp, BarChart3, Calculator, Percent, Coins, Receipt, Briefcase, FileWarning, PiggyBank, ChevronDown, ChevronUp, PieChart, Calendar } from 'lucide-react';
import { formatCLP, formatNumberWithDots, parseNumberFromDots } from '../lib/utils';
import MetricsSection from './MetricsSection';

export default function Dashboard({
  sales,
  previousYearSales, // Nueva prop
  taxRate = 0.19,
  ivaRecuperable = 0,
  onIvaRecChange,
  maxPaymentLimit = 500000,
  onMaxPaymentLimitChange,
  visibleTotals,
  showDetails,
  showMetrics,
  userRole
}) {
  const safeSales = Array.isArray(sales) ? sales : [];
  
  // Default visibility if undefined (to prevent crash on first load)
  const isVisible = (key) => visibleTotals ? visibleTotals[key] !== false : true;

  const totalCash = safeSales.reduce((acc, curr) => acc + (Number(curr.cash) || 0), 0);
  const totalCard = safeSales.reduce((acc, curr) => acc + (Number(curr.card) || 0), 0);
  const totalInvoice = safeSales.reduce((acc, curr) => acc + (Number(curr.invoice) || 0), 0);
  const totalSales = totalCash + totalCard + totalInvoice;

  // Calcular venta del mismo día del año anterior
  // Usamos new Date() para obtener el día "hoy" real, no el del mes navegado
  const today = new Date();
  const currentDay = today.getDate();
  const isCurrentMonth = today.getMonth() + 1 === new Date(sales[0]?.date || Date.now()).getMonth() + 1; // Aproximación

  // Filtrar ventas del año pasado usando lógica de "Día Equivalente" (Ej: 2do Sábado vs 2do Sábado)
  const getEquivalentDateLastYear = (date) => {
    const currentYear = date.getFullYear();
    const lastYear = currentYear - 1;
    const month = date.getMonth();
    const dayOfWeek = date.getDay(); // 0-6
    
    // 1. Calcular ocurrencia actual (¿Qué número de sábado es hoy?)
    let occurrence = 0;
    for (let d = 1; d <= date.getDate(); d++) {
      if (new Date(currentYear, month, d).getDay() === dayOfWeek) {
        occurrence++;
      }
    }

    // 2. Buscar esa misma ocurrencia en el año pasado
    let count = 0;
    let targetDate = null;
    for (let d = 1; d <= 31; d++) {
      const testDate = new Date(lastYear, month, d);
      if (testDate.getMonth() !== month) break;

      if (testDate.getDay() === dayOfWeek) {
        count++;
        if (count === occurrence) {
          targetDate = testDate;
          break;
        }
      }
    }
    return targetDate;
  };

  const targetDateLastYear = getEquivalentDateLastYear(today);
  
  const sameDaySalesPrevYear = (previousYearSales || []).filter(sale => {
    if (!targetDateLastYear) return false;
    
    // Comparar fecha exacta YYYY-MM-DD
    // El objeto sale.date viene como string UTC "2025-01-XX", targetDate es objeto local
    // Convertimos targetDate a string formato YYYY-MM-DD local para comparar
    const targetString = targetDateLastYear.toLocaleDateString('en-CA'); // YYYY-MM-DD
    return sale.date === targetString;
  });

  const totalSameDayPrevYear = sameDaySalesPrevYear.reduce((acc, s) => 
    acc + (Number(s.cash) || 0) + (Number(s.card) || 0) + (Number(s.invoice) || 0), 0
  );

  // Texto para la tarjeta (Ej: "Año Pasado (Día 11 - Sáb)")
  const labelLastYear = targetDateLastYear 
    ? `Año Pasado (Día ${targetDateLastYear.getDate()})` 
    : `Año Pasado (N/A)`;

  // Calcular Venta de HOY (Mes actual)
  const salesToday = safeSales.filter(sale => {
    const day = parseInt(sale.date.split('-')[2]);
    return day === currentDay;
  });

  const totalSalesToday = salesToday.reduce((acc, s) => 
    acc + (Number(s.cash) || 0) + (Number(s.card) || 0) + (Number(s.invoice) || 0), 0
  );

  // Cálculos base
  const netSales = Math.round(totalSales / (1 + taxRate));
  
  // Total Iva (Neto * 19%)
  const totalIvaCalculated = Math.round(netSales * taxRate);

  // Total PPM: Total Neto * 0,02
  const ppmRate = 0.02;
  const totalPPM = Math.round(netSales * ppmRate);

  // Iva + PPM
  const ivaPlusPPM = totalIvaCalculated + totalPPM;

  // ---------------------------------------------------------
  // LÓGICA DE TOPE Y FACTURA FALTANTE
  // ---------------------------------------------------------
  
  const realDebt = ivaPlusPPM - ivaRecuperable;
  const paymentLimit = maxPaymentLimit;
  
  let finalIvaToPay = 0;
  let facturaFaltanteNeto = 0;

  if (realDebt > paymentLimit) {
    finalIvaToPay = paymentLimit;
    facturaFaltanteNeto = realDebt - paymentLimit;
  } else {
    finalIvaToPay = realDebt;
    facturaFaltanteNeto = 0;
  }

  const totalRecuperable = ivaRecuperable + facturaFaltanteNeto;
  const honorario = 30000;
  const totalToPayPocket = (finalIvaToPay > 0 ? finalIvaToPay : 0) + honorario;

  return (
    <div className="mb-6">
      {/* SECCIÓN PRINCIPAL: SIEMPRE VISIBLE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-4">
        <Card 
          title={`Venta Hoy (Día ${currentDay})`} 
          amount={totalSalesToday} 
          icon={<DollarSign className="text-blue-600 dark:text-blue-400" />} 
          color="border-l-4 border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20"
        />
        <Card 
          title={labelLastYear} 
          amount={totalSameDayPrevYear} 
          icon={<Calendar className="text-amber-600 dark:text-amber-400" />} 
          color="border-l-4 border-amber-500 dark:border-amber-500 bg-amber-50 dark:bg-amber-900/20"
        />
        <Card 
          title="Efectivo (Mes)" 
          amount={totalCash} 
          icon={<Wallet className="text-green-500" />} 
          color="border-l-4 border-green-500"
        />
        <Card 
          title="Tarjeta (Mes)" 
          amount={totalCard} 
          icon={<CreditCard className="text-purple-500" />} 
          color="border-l-4 border-purple-500"
        />
        <Card 
          title="Venta Total (Mes)" 
          amount={totalSales} 
          icon={<TrendingUp className="text-indigo-500" />} 
          color="border-l-4 border-indigo-500"
        />
      </div>

      {/* SECCIÓN MÉTRICAS: OCULTA POR DEFECTO */}
      {showMetrics && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <MetricsSection sales={safeSales} previousYearSales={previousYearSales} />
        </div>
      )}

       {/* SECCIÓN DETALLES: OCULTA POR DEFECTO */}
       {showDetails && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">

           {isVisible('netSales') && (
             <Card
               title="Total Neto"
               amount={netSales}
               icon={<BarChart3 className="text-indigo-500" />}
               color="border-l-4 border-indigo-500"
             />
           )}
           {isVisible('totalIva') && (
             <Card
               title="Total Iva"
               amount={totalIvaCalculated}
               icon={<Calculator className="text-orange-500" />}
               color="border-l-4 border-orange-500"
             />
           )}
           {isVisible('totalPPM') && (
             <Card
               title={`Total PPM (${ppmRate * 100}%)`}
               amount={totalPPM}
               icon={<Percent className="text-yellow-600" />}
               color="border-l-4 border-yellow-600"
             />
           )}
           {isVisible('ivaPlusPPM') && (
             <Card
               title="Iva + PPM"
               amount={ivaPlusPPM}
               icon={<Coins className="text-emerald-500" />}
               color="border-l-4 border-emerald-500"
             />
           )}

           {/* Tarjeta Manual: Iva Recuperable con separador de miles - Siempre visible */}
           <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-cyan-500 transition-colors duration-300">
             <div className="flex justify-between items-start mb-2">
               <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Iva Recuperable</p>
               <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full">
                 <Receipt className="text-cyan-500 w-5 h-5" />
               </div>
             </div>
             <div className="flex items-center bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 focus-within:ring-2 focus-within:ring-cyan-500 transition-colors">
               <span className="text-cyan-700 dark:text-cyan-400 font-bold">$</span>
               <input
                 type="text"
                 inputMode="numeric"
                 placeholder="0"
                 value={formatNumberWithDots(ivaRecuperable)}
                 onChange={(e) => onIvaRecChange(parseNumberFromDots(e.target.value))}
                 className="w-full text-xl font-bold bg-transparent p-1 outline-none text-cyan-700 dark:text-cyan-400 ml-1"
               />
             </div>
           </div>

           {/* Tarjeta Automática: Factura Faltante - Siempre visible */}
           <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-red-600 transition-colors duration-300">
             <div className="flex justify-between items-start">
               <div className="w-full">
                 <p className="text-xs text-red-600 dark:text-red-400 font-bold uppercase tracking-wider">Factura Faltante</p>
                 <div className="flex items-center gap-1 mb-1 text-xs text-gray-400">
                   <span>Meta pagar:</span>
                   <input
                     type="text"
                     inputMode="numeric"
                     value={formatNumberWithDots(maxPaymentLimit)}
                     onChange={(e) => onMaxPaymentLimitChange(parseNumberFromDots(e.target.value))}
                     className="w-24 bg-gray-100 dark:bg-gray-700 border dark:border-gray-600 rounded px-1 text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-300"
                   />
                 </div>
                 <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
                   {formatCLP(facturaFaltanteNeto)}
                 </h3>
               </div>
               <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full shrink-0 ml-2">
                 <FileWarning className="text-red-600 dark:text-red-400 w-5 h-5" />
               </div>
             </div>
           </div>

           {isVisible('totalRecuperable') && (
             <Card
               title="Total Recuperable"
               amount={totalRecuperable}
               icon={<PiggyBank className="text-teal-600 dark:text-teal-400" />}
               color="border-l-4 border-teal-600"
             />
           )}

           {isVisible('finalIvaToPay') && (
             <Card
               title="IVA a Pagar"
               amount={finalIvaToPay}
               icon={<DollarSign className="text-red-500 dark:text-red-400" />}
               color="border-l-4 border-red-500"
               isTax
             />
           )}

           {isVisible('totalToPayPocket') && (
             <Card
               title="TOTAL A PAGAR (c/Honorario)"
               amount={totalToPayPocket}
               icon={<Briefcase className="text-rose-600 dark:text-rose-400" />}
               color="border-l-4 border-rose-600"
               isTax
             />
           )}
         </div>
       )}
    </div>
  );
}

function Card({ title, amount, icon, color, isTax }) {
  const amountColor = isTax ? (amount > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400') : 'text-gray-900 dark:text-white';

  return (
    <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm ${color} transition-colors duration-300`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${amountColor}`}>
            {formatCLP(amount)}
          </h3>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}
