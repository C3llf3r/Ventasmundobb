import React, { useState, useEffect } from 'react';
import { Calendar, Moon, Sun, FileText } from 'lucide-react';
import EntryForm from './components/EntryForm';
import Dashboard from './components/Dashboard';
import SalesList from './components/SalesList';
import PdfReportModal from './components/PdfReportModal';
import { salesService } from './services/salesService';

function App() {
  const [sales, setSales] = useState([]);
  const [ivaRecuperable, setIvaRecuperable] = useState(0);
  const [facturaFaltante, setFacturaFaltante] = useState(0);
  const [maxPaymentLimit, setMaxPaymentLimit] = useState(500000);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Estado para Modo Oscuro
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Estado para Modal PDF
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Derive month and year from currentDate state for filtering
  const selectedMonth = currentDate.getMonth() + 1; // 1-12
  const selectedYear = currentDate.getFullYear();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const fetchSales = async () => {
    try {
      const data = await salesService.getSales(selectedMonth, selectedYear);
      setSales(data || []);
      const iva = await salesService.getIvaRecuperable(selectedMonth, selectedYear);
      setIvaRecuperable(iva || 0);
      const fact = await salesService.getFacturaFaltante(selectedMonth, selectedYear);
      setFacturaFaltante(fact || 0);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setSales([]);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [selectedMonth, selectedYear]);

  const handleUpdateIvaRec = async (amount) => {
    await salesService.setIvaRecuperable(selectedMonth, selectedYear, amount);
    setIvaRecuperable(amount);
  };

  const handleUpdateFacturaFaltante = async (amount) => {
    await salesService.setFacturaFaltante(selectedMonth, selectedYear, amount);
    setFacturaFaltante(amount);
  };

  const handleMonthChange = (e) => {
    const [y, m] = e.target.value.split('-');
    setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, 1));
  };

  // Pre-calcular datos para el reporte PDF (replicando lógica de Dashboard)
  const safeSales = Array.isArray(sales) ? sales : [];
  const totalCash = safeSales.reduce((acc, curr) => acc + (Number(curr.cash) || 0), 0);
  const totalCard = safeSales.reduce((acc, curr) => acc + (Number(curr.card) || 0), 0);
  const totalInvoice = safeSales.reduce((acc, curr) => acc + (Number(curr.invoice) || 0), 0);
  const totalSales = totalCash + totalCard + totalInvoice;
  const netSales = Math.round(totalSales / 1.19);
  const totalIvaCalculated = Math.round(netSales * 0.19);
  const totalPPM = Math.round(netSales * 0.02);
  const ivaPlusPPM = totalIvaCalculated + totalPPM;
  
  // Lógica Factura Faltante Automática
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

  const dashboardData = {
    totalSales, netSales, totalIvaCalculated, totalPPM, ivaPlusPPM,
    ivaRecuperable, facturaFaltanteNeto, totalRecuperable,
    totalCash, totalCard, finalIvaToPay, totalToPayPocket
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm sticky top-0 z-10 border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            📊 Control de Ventas
          </h1>
          
          <div className="flex items-center gap-3">
            {/* Selector de Fecha */}
            <div className={`flex items-center gap-2 p-1.5 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
              <Calendar className={`w-5 h-5 ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`} />
              <input
                type="month"
                value={`${selectedYear}-${String(selectedMonth).padStart(2, '0')}`}
                onChange={handleMonthChange}
                className={`bg-transparent border-none text-sm font-medium focus:ring-0 outline-none cursor-pointer ${darkMode ? 'text-white' : 'text-gray-700'}`}
              />
            </div>

            {/* Botón Reporte PDF */}
            <button
              onClick={() => setIsPdfModalOpen(true)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-blue-400 hover:bg-gray-600' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
              title="Generar Reporte PDF"
            >
              <FileText size={20} />
            </button>

            {/* Toggle Día/Noche */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        <Dashboard 
          sales={sales} 
          taxRate={0.19} 
          ivaRecuperable={ivaRecuperable}
          onIvaRecChange={handleUpdateIvaRec}
          maxPaymentLimit={maxPaymentLimit}
          onMaxPaymentLimitChange={setMaxPaymentLimit}
        />

        <EntryForm onSaleAdded={fetchSales} />

        <SalesList sales={sales} onSalesUpdated={fetchSales} />

      </main>

      {/* Modal PDF */}
      <PdfReportModal 
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        month={selectedMonth}
        year={selectedYear}
        dashboardData={dashboardData}
        sales={sales}
      />
    </div>
  );
}

export default App;
