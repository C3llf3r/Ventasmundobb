import React, { useState } from 'react';
import { DollarSign, CreditCard, Wallet, TrendingUp, BarChart3, Calculator, Percent, Coins, Receipt, Briefcase, FileWarning, PiggyBank, ChevronDown, ChevronUp, PieChart } from 'lucide-react';
import { formatCLP, formatNumberWithDots, parseNumberFromDots } from '../lib/utils';
import MetricsSection from './MetricsSection';

export default function Dashboard({
  sales,
  taxRate = 0.19,
  ivaRecuperable = 0,
  onIvaRecChange,
  maxPaymentLimit = 500000,
  onMaxPaymentLimitChange
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);

  const safeSales = Array.isArray(sales) ? sales : [];
  
  const totalCash = safeSales.reduce((acc, curr) => acc + (Number(curr.cash) || 0), 0);
  const totalCard = safeSales.reduce((acc, curr) => acc + (Number(curr.card) || 0), 0);
  const totalInvoice = safeSales.reduce((acc, curr) => acc + (Number(curr.invoice) || 0), 0);
  const totalSales = totalCash + totalCard + totalInvoice;

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card 
          title="Efectivo" 
          amount={totalCash} 
          icon={<Wallet className="text-green-500" />} 
          color="border-l-4 border-green-500"
        />
        <Card 
          title="Tarjeta" 
          amount={totalCard} 
          icon={<CreditCard className="text-purple-500" />} 
          color="border-l-4 border-purple-500"
        />
        <Card 
          title="Venta Total" 
          amount={totalSales} 
          icon={<TrendingUp className="text-blue-500" />} 
          color="border-l-4 border-blue-500"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        {/* BOTÓN DESPLEGABLE IMPUESTOS */}
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 font-medium transition-colors"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-5 h-5 mr-2" /> Ocultar Detalles
            </>
          ) : (
            <>
              <ChevronDown className="w-5 h-5 mr-2" /> Ver Impuestos
            </>
          )}
        </button>

        {/* BOTÓN DESPLEGABLE GRÁFICOS */}
        <button 
          onClick={() => setShowMetrics(!showMetrics)}
          className="flex-1 flex items-center justify-center py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-600 font-medium transition-colors"
        >
          {showMetrics ? (
            <>
              <ChevronUp className="w-5 h-5 mr-2" /> Ocultar Gráficos
            </>
          ) : (
            <>
              <PieChart className="w-5 h-5 mr-2" /> Ver Gráficos
            </>
          )}
        </button>
      </div>

      {/* SECCIÓN MÉTRICAS: OCULTA POR DEFECTO */}
      {showMetrics && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <MetricsSection sales={safeSales} />
        </div>
      )}

       {/* SECCIÓN DETALLES: OCULTA POR DEFECTO */}
       {showDetails && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">

           <Card
             title="Total Neto"
             amount={netSales}
             icon={<BarChart3 className="text-indigo-500" />}
             color="border-l-4 border-indigo-500"
           />
           <Card
             title="Total Iva"
             amount={totalIvaCalculated}
             icon={<Calculator className="text-orange-500" />}
             color="border-l-4 border-orange-500"
           />
           <Card
             title={`Total PPM (${ppmRate * 100}%)`}
             amount={totalPPM}
             icon={<Percent className="text-yellow-600" />}
             color="border-l-4 border-yellow-600"
           />
           <Card
             title="Iva + PPM"
             amount={ivaPlusPPM}
             icon={<Coins className="text-emerald-500" />}
             color="border-l-4 border-emerald-500"
           />

           {/* Tarjeta Manual: Iva Recuperable con separador de miles - Siempre visible */}
           <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-cyan-500">
             <div className="flex justify-between items-start mb-2">
               <p className="text-sm text-gray-500 font-medium">Iva Recuperable</p>
               <div className="p-2 bg-gray-50 rounded-full">
                 <Receipt className="text-cyan-500 w-5 h-5" />
               </div>
             </div>
             <div className="flex items-center bg-gray-50 border border-gray-200 rounded px-2 focus-within:ring-2 focus-within:ring-cyan-500">
               <span className="text-cyan-700 font-bold">$</span>
               <input
                 type="text"
                 placeholder="0"
                 value={formatNumberWithDots(ivaRecuperable)}
                 onChange={(e) => onIvaRecChange(parseNumberFromDots(e.target.value))}
                 className="w-full text-xl font-bold bg-transparent p-1 outline-none text-cyan-700 ml-1"
               />
             </div>
           </div>

           {/* Tarjeta Automática: Factura Faltante - Siempre visible */}
           <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-600">
             <div className="flex justify-between items-start">
               <div className="w-full">
                 <p className="text-xs text-red-600 font-bold uppercase tracking-wider">Factura Faltante</p>
                 <div className="flex items-center gap-1 mb-1 text-xs text-gray-400">
                   <span>Meta pagar:</span>
                   <input
                     type="text"
                     value={formatNumberWithDots(maxPaymentLimit)}
                     onChange={(e) => onMaxPaymentLimitChange(parseNumberFromDots(e.target.value))}
                     className="w-24 bg-gray-100 border rounded px-1 text-gray-600 focus:outline-none focus:ring-1 focus:ring-red-300"
                   />
                 </div>
                 <h3 className="text-2xl font-bold text-red-600">
                   {formatCLP(facturaFaltanteNeto)}
                 </h3>
               </div>
               <div className="p-2 bg-red-50 rounded-full shrink-0 ml-2">
                 <FileWarning className="text-red-600 w-5 h-5" />
               </div>
             </div>
           </div>

           <Card
             title="Total Recuperable"
             amount={totalRecuperable}
             icon={<PiggyBank className="text-teal-600" />}
             color="border-l-4 border-teal-600"
           />

           <Card
             title="IVA a Pagar"
             amount={finalIvaToPay}
             icon={<DollarSign className="text-red-500" />}
             color="border-l-4 border-red-500"
             isTax
           />

           <Card
             title="TOTAL A PAGAR (c/Honorario)"
             amount={totalToPayPocket}
             icon={<Briefcase className="text-rose-600" />}
             color="border-l-4 border-rose-600"
             isTax
           />
         </div>
       )}
    </div>
  );
}

function Card({ title, amount, icon, color, isTax }) {
  const amountColor = isTax ? (amount > 0 ? 'text-red-600' : 'text-green-600') : 'text-gray-900';

  return (
    <div className={`bg-white p-4 rounded-lg shadow-sm ${color}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className={`text-2xl font-bold mt-1 ${amountColor}`}>
            {formatCLP(amount)}
          </h3>
        </div>
        <div className="p-2 bg-gray-50 rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
}
