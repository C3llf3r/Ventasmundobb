import React, { useState, useEffect, useCallback } from 'react';
import { Settings, FileText, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import SalesList from './components/SalesList';
import PdfReportModal from './components/PdfReportModal';
import SettingsModal from './components/SettingsModal';
import { salesService } from './services/salesService';

export default function App() {
  // State
  const [sales, setSales] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ivaRecuperable, setIvaRecuperable] = useState(0);
  const [maxPaymentLimit, setMaxPaymentLimit] = useState(500000); 
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  
  // App Settings (Local Storage)
  const [appSettings, setAppSettings] = useState(() => {
    const saved = localStorage.getItem('appSettings');
    return saved ? JSON.parse(saved) : {
      companyName: 'Mi Empresa',
      appTitle: 'Sistema de Ventas',
      visibleTotals: {
        netSales: true,
        totalIva: true,
        totalPPM: true,
        ivaPlusPPM: true,
        totalRecuperable: true,
        finalIvaToPay: true,
        totalToPayPocket: true
      }
    };
  });

  // Derived date values
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Load Data
  const loadData = useCallback(async () => {
    try {
      const salesData = await salesService.getSales(month, year);
      setSales(salesData);

      const ivaRec = await salesService.getIvaRecuperable(month, year);
      setIvaRecuperable(ivaRec);

      const factFaltante = await salesService.getFacturaFaltante(month, year);
      // If factFaltante is 0, we might want to keep the default or previous value,
      // but usually 0 is a valid value for "no limit" or "0 limit". 
      // However, if it's the first time, it might return 0. 
      // Let's assume if it returns a value, we use it. If it returns undefined (which it shouldn't per service), we fallback.
      if (factFaltante !== undefined) {
          setMaxPaymentLimit(factFaltante || 500000); 
      }
    } catch (error) {
      console.error("Error loading data", error);
    }
  }, [month, year]);

  useEffect(() => {
    const fetchData = async () => {
      await loadData();
    };
    fetchData();
  }, [loadData]);

  // Handlers
  const handleMonthChange = (increment) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + increment);
      return newDate;
    });
  };

  const handleSaveSettings = (newSettings) => {
    setAppSettings(newSettings);
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
  };

  const handleIvaRecuperableChange = async (val) => {
    setIvaRecuperable(val);
    await salesService.setIvaRecuperable(month, year, val);
  };

  const handleMaxPaymentLimitChange = async (val) => {
    setMaxPaymentLimit(val);
    await salesService.setFacturaFaltante(month, year, val);
  };

  // Calculations for PDF Report
  const calculateDashboardData = () => {
    const safeSales = Array.isArray(sales) ? sales : [];
    const totalCash = safeSales.reduce((acc, curr) => acc + (Number(curr.cash) || 0), 0);
    const totalCard = safeSales.reduce((acc, curr) => acc + (Number(curr.card) || 0), 0);
    const totalInvoice = safeSales.reduce((acc, curr) => acc + (Number(curr.invoice) || 0), 0);
    const totalSales = totalCash + totalCard + totalInvoice;
    
    // Constants (could be moved to settings)
    const taxRate = 0.19;
    const ppmRate = 0.02;

    const netSales = Math.round(totalSales / (1 + taxRate));
    const totalIvaCalculated = Math.round(netSales * taxRate);
    const totalPPM = Math.round(netSales * ppmRate);
    const ivaPlusPPM = totalIvaCalculated + totalPPM;
    
    const realDebt = ivaPlusPPM - ivaRecuperable;
    
    let finalIvaToPay = 0;
    let facturaFaltanteNeto = 0;
    
    // Logic: if debt > limit, pay limit, rest is "missing invoice"
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
      totalSales, netSales, totalIvaCalculated, totalPPM, ivaPlusPPM,
      ivaRecuperable, facturaFaltanteNeto, totalRecuperable,
      totalCash, totalCard, finalIvaToPay, totalToPayPocket
    };
  };

  const dashboardData = calculateDashboardData();

  const monthName = currentDate.toLocaleString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{appSettings.companyName}</h1>
              <p className="text-sm text-gray-500">{appSettings.appTitle}</p>
            </div>
            
            <div className="flex items-center gap-4 bg-gray-50 p-1 rounded-lg border border-gray-200">
              <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white rounded-md transition-colors shadow-sm">
                <ChevronLeft size={20} />
              </button>
              <span className="min-w-[150px] text-center font-medium capitalize flex items-center justify-center gap-2">
                <Calendar size={18} className="text-blue-500" />
                {monthName}
              </span>
              <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white rounded-md transition-colors shadow-sm">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex gap-2">
               <button 
                onClick={() => setIsPdfModalOpen(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Reporte PDF"
              >
                <FileText size={24} />
              </button>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Configuración"
              >
                <Settings size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard 
          sales={sales}
          taxRate={0.19}
          ivaRecuperable={ivaRecuperable}
          onIvaRecChange={handleIvaRecuperableChange}
          maxPaymentLimit={maxPaymentLimit}
          onMaxPaymentLimitChange={handleMaxPaymentLimitChange}
        />
        
        <EntryForm onSaleAdded={loadData} />
        
        <SalesList sales={sales} onSalesUpdated={loadData} />
      </main>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onSaveSettings={handleSaveSettings}
      />
      
      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        month={month}
        year={year}
        dashboardData={dashboardData}
        sales={sales}
      />
    </div>
  );
}