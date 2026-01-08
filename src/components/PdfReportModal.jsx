import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown, X, CheckSquare, Square } from 'lucide-react';
import { formatCLP } from '../lib/utils';

export default function PdfReportModal({ 
  isOpen, 
  onClose, 
  month, 
  year, 
  dashboardData,
  sales 
}) {
  if (!isOpen) return null;

  // Opciones disponibles para el reporte (basadas en el Dashboard)
  const options = [
    { id: 'ventaTotal', label: 'Venta Total', value: dashboardData.totalSales },
    { id: 'totalNeto', label: 'Total Neto', value: dashboardData.netSales },
    { id: 'totalIva', label: 'Total IVA', value: dashboardData.totalIvaCalculated },
    { id: 'totalPPM', label: 'Total PPM', value: dashboardData.totalPPM },
    { id: 'ivaPlusPPM', label: 'IVA + PPM', value: dashboardData.ivaPlusPPM },
    { id: 'ivaRecuperable', label: 'IVA Recuperable', value: dashboardData.ivaRecuperable },
    { id: 'facturaFaltante', label: 'Factura Faltante', value: dashboardData.facturaFaltanteNeto },
    { id: 'totalRecuperable', label: 'Total Recuperable', value: dashboardData.totalRecuperable },
    { id: 'efectivo', label: 'Efectivo', value: dashboardData.totalCash },
    { id: 'tarjeta', label: 'Tarjeta', value: dashboardData.totalCard },
    { id: 'ivaPagar', label: 'IVA a Pagar', value: dashboardData.finalIvaToPay },
    { id: 'totalPagar', label: 'Total a Pagar', value: dashboardData.totalToPayPocket },
  ];

  const [selectedOptions, setSelectedOptions] = useState(
    options.map(o => o.id) // Por defecto todas seleccionadas
  );

  const toggleOption = (id) => {
    setSelectedOptions(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const monthName = new Date(year, month - 1).toLocaleString('es-CL', { month: 'long' });
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(40);
    doc.text(`Reporte de Ventas e Impuestos - ${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${year}`, 14, 22);
    
    // Resumen Seleccionado
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('Resumen del Mes:', 14, 32);

    const summaryData = options
      .filter(opt => selectedOptions.includes(opt.id))
      .map(opt => [opt.label, formatCLP(opt.value)]);

    autoTable(doc, {
      startY: 36,
      head: [['Concepto', 'Monto']],
      body: summaryData,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
    });

    // Detalle de Movimientos
    const finalY = doc.lastAutoTable.finalY || 40;
    doc.text('Detalle de Movimientos:', 14, finalY + 10);

    const salesBody = sales.map(sale => [
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

    doc.save(`Reporte_Ventas_${month}_${year}.pdf`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Generar Reporte PDF</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">Selecciona los datos a incluir:</p>
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
                <span className="text-gray-700 dark:text-gray-200">{option.label}</span>
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
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <FileDown size={18} /> Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
