import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, X, CheckSquare, Square, Calendar } from 'lucide-react';
import { formatCLP } from '../lib/utils';

export default function PdfReportModal({
   isOpen,
   onClose,
   month,
   year,
   dashboardData: initialDashboardData,
   sales,
   companySettings
 }) {
   // Estados para fechas (por defecto: primer y último día del mes actual)
   const [startDate, setStartDate] = useState('');
   const [endDate, setEndDate] = useState('');

   useEffect(() => {
     if (isOpen) {
       const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0];
       const lastDay = new Date(year, month, 0).toISOString().split('T')[0];
       setStartDate(firstDay);
       setEndDate(lastDay);
     }
   }, [isOpen, month, year]);

   // Calcular datos filtrados
   const getFilteredData = () => {
     if (!startDate || !endDate) return { filteredSales: [], filteredTotals: initialDashboardData };

     const start = new Date(startDate);
     const end = new Date(endDate);
     end.setHours(23, 59, 59, 999); // Incluir todo el último día

     const filteredSales = sales.filter(sale => {
       const saleDate = new Date(sale.date);
       // Ajuste zona horaria simple comparando strings YYYY-MM-DD
       return sale.date >= startDate && sale.date <= endDate;
     });

     // Recalcular totales
     const totalCash = filteredSales.reduce((acc, curr) => acc + (Number(curr.cash) || 0), 0);
     const totalCard = filteredSales.reduce((acc, curr) => acc + (Number(curr.card) || 0), 0);
     const totalInvoice = filteredSales.reduce((acc, curr) => acc + (Number(curr.invoice) || 0), 0);
     const totalSales = totalCash + totalCard + totalInvoice;

     const taxRate = 0.19;
     const ppmRate = 0.02;
     const netSales = Math.round(totalSales / (1 + taxRate));
     const totalIvaCalculated = Math.round(netSales * taxRate);
     const totalPPM = Math.round(netSales * ppmRate);
     const ivaPlusPPM = totalIvaCalculated + totalPPM;

     // Nota: IVA Recuperable y Factura Faltante son valores mensuales fijos, no dependen del rango,
     // así que usamos los valores globales proporcionales o completos.
     // Para este reporte, usaremos los valores completos del mes, pero recalculando lo que depende de ventas.
     
     const ivaRecuperable = initialDashboardData.ivaRecuperable;
     const maxPaymentLimit = 500000; // Valor por defecto si no tenemos acceso directo a la config raw aquí
     
     const realDebt = ivaPlusPPM - ivaRecuperable;
     let finalIvaToPay = 0;
     let facturaFaltanteNeto = 0;

     if (realDebt > maxPaymentLimit) {
       finalIvaToPay = maxPaymentLimit;
       facturaFaltanteNeto = realDebt - maxPaymentLimit;
     } else {
       finalIvaToPay = realDebt;
       facturaFaltanteNeto = 0;
     }

     const totalRecuperable = ivaRecuperable + facturaFaltanteNeto;
     const honorario = 30000;
     const totalToPayPocket = (finalIvaToPay > 0 ? finalIvaToPay : 0) + honorario;

     return {
       filteredSales,
       filteredTotals: {
         totalSales, netSales, totalIvaCalculated, totalPPM, ivaPlusPPM,
         ivaRecuperable, facturaFaltanteNeto, totalRecuperable,
         totalCash, totalCard, finalIvaToPay, totalToPayPocket
       }
     };
   };

   const { filteredSales, filteredTotals } = getFilteredData();

   const options = [
     { id: 'ventaTotal', label: 'Venta Total', value: filteredTotals.totalSales },
     { id: 'totalNeto', label: 'Total Neto', value: filteredTotals.netSales },
     { id: 'totalIva', label: 'Total IVA', value: filteredTotals.totalIvaCalculated },
     { id: 'totalPPM', label: 'Total PPM', value: filteredTotals.totalPPM },
     { id: 'ivaPlusPPM', label: 'IVA + PPM', value: filteredTotals.ivaPlusPPM },
     { id: 'ivaRecuperable', label: 'IVA Recuperable', value: filteredTotals.ivaRecuperable },
     { id: 'facturaFaltante', label: 'Factura Faltante', value: filteredTotals.facturaFaltanteNeto },
     { id: 'totalRecuperable', label: 'Total Recuperable', value: filteredTotals.totalRecuperable },
     { id: 'efectivo', label: 'Efectivo', value: filteredTotals.totalCash },
     { id: 'tarjeta', label: 'Tarjeta', value: filteredTotals.totalCard },
     { id: 'ivaPagar', label: 'IVA a Pagar', value: filteredTotals.finalIvaToPay },
     { id: 'totalPagar', label: 'Total a Pagar', value: filteredTotals.totalToPayPocket },
   ];

   const [selectedOptions, setSelectedOptions] = useState(
     options.map(o => o.id)
   );

   if (!isOpen) return null;

  const toggleOption = (id) => {
    setSelectedOptions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const loadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    const companyName = companySettings?.companyName || 'Mi Empresa';
    const appTitle = companySettings?.appTitle || 'Reporte de Ventas';
    
    // Intentar cargar logo
    try {
        const logoImg = await loadImage('/logo.png');
        // Calcular dimensiones para mantener proporción (ancho fijo 30mm)
        const aspectRatio = logoImg.width / logoImg.height;
        const logoWidth = 30;
        const logoHeight = logoWidth / aspectRatio;
        doc.addImage(logoImg, 'PNG', 14, 10, logoWidth, logoHeight);
    } catch (e) {
        console.warn("No se pudo cargar el logo", e);
    }

    // Título y Encabezado
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(companyName, 50, 20); // Ajustado a la derecha del logo
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(appTitle, 50, 28);

    doc.setFontSize(10);
    doc.setTextColor(128);
    doc.text(`Rango: ${startDate} al ${endDate}`, 14, 45);
    
    // Resumen Seleccionado
    doc.setFontSize(12);
    doc.setTextColor(40);
    doc.text('Resumen del Período:', 14, 55);

    const summaryData = options
      .filter(opt => selectedOptions.includes(opt.id))
      .map(opt => [opt.label, formatCLP(opt.value)]);

    autoTable(doc, {
      startY: 60,
      head: [['Concepto', 'Monto']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Detalle de Movimientos
    const finalY = doc.lastAutoTable.finalY || 65;
    doc.text('Detalle de Movimientos:', 14, finalY + 10);

    const salesBody = filteredSales.map(sale => [
      new Date(sale.date).toLocaleDateString('es-CL', { timeZone: 'UTC' }),
      formatCLP(sale.cash),
      formatCLP(sale.card),
      formatCLP(sale.invoice || 0),
      formatCLP(sale.cash + sale.card + (sale.invoice || 0))
    ]);

    autoTable(doc, {
      startY: finalY + 14,
      head: [['Fecha', 'Efectivo', 'Tarjeta', 'Factura', 'Total']],
      body: salesBody,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`Reporte_${startDate}_${endDate}.pdf`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md transition-colors duration-300">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generar Reporte PDF</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* Selector de Rango */}
          <div className="mb-4 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              Rango de Fechas
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Desde</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>

          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300 font-medium">Datos a incluir:</p>
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.id}
                onClick={() => toggleOption(option.id)}
                className="flex items-center w-full p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {selectedOptions.includes(option.id) ? (
                  <CheckSquare className="text-blue-600 w-5 h-5 mr-3" />
                ) : (
                  <Square className="text-gray-400 w-5 h-5 mr-3" />
                )}
                <span className="text-gray-700 dark:text-gray-200 text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button 
            onClick={generatePDF}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <FileDown size={18} /> Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
