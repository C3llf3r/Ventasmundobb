import React, { useState, useEffect, useCallback } from 'react';
import { Settings, FileText, Calendar, ChevronLeft, ChevronRight, LogOut, User, Moon, Sun, ChevronUp, ChevronDown, PieChart, PlusCircle, List } from 'lucide-react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './lib/firebase';
import Dashboard from './components/Dashboard';
import EntryForm from './components/EntryForm';
import SalesList from './components/SalesList';
import PdfReportModal from './components/PdfReportModal';
import SettingsModal from './components/SettingsModal';
import Login from './components/Login';
import { salesService } from './services/salesService';

export default function App() {
  // Auth State
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App Data State
  const [sales, setSales] = useState([]);
  const [previousYearSales, setPreviousYearSales] = useState([]); // Nuevo estado para año anterior
  const [currentDate, setCurrentDate] = useState(new Date());
  const [ivaRecuperable, setIvaRecuperable] = useState(0);
  const [maxPaymentLimit, setMaxPaymentLimit] = useState(500000); 
  
  // UI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [showEntryForm, setShowEntryForm] = useState(true);
  const [showDetails, setShowDetails] = useState(false); // Estado para Impuestos
  const [showMetrics, setShowMetrics] = useState(false); // Estado para Gráficos
  const [showHistory, setShowHistory] = useState(true); // Estado para Historial (visible por defecto)
  
  // Theme State
  const [darkMode, setDarkMode] = useState(() => {
    // Intentar leer de localStorage, si no, preferencia del sistema
    const saved = localStorage.getItem('theme');
    return saved === 'dark';
  });

  // App Settings (Global State)
  const [appSettings, setAppSettings] = useState({
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
  });

  // Theme Effect - Asegura que la clase se aplique correctamente
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Sincronizar y obtener perfil
        await salesService.syncUserProfile(currentUser);
        const profile = await salesService.getUserProfile(currentUser.uid);
        setUserProfile(profile);
        setUser(currentUser);
        
        // Cargar configuración global de la empresa
        const globalSettings = await salesService.getGlobalSettings();
        if (globalSettings) {
          setAppSettings(globalSettings);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Derived date values
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();

  // Load Data
  const loadData = useCallback(async () => {
    if (!user) return; // Don't load if not logged in

    try {
      const salesData = await salesService.getSales(month, year);
      setSales(salesData);

      // Cargar ventas del mismo mes pero año anterior
      const prevYearSalesData = await salesService.getSales(month, year - 1);
      setPreviousYearSales(prevYearSalesData);

      const ivaRec = await salesService.getIvaRecuperable(month, year);
      setIvaRecuperable(ivaRec);

      const factFaltante = await salesService.getFacturaFaltante(month, year);
      if (factFaltante !== undefined) {
          setMaxPaymentLimit(factFaltante || 500000); 
      }
    } catch (error) {
      console.error("Error loading data", error);
    }
  }, [month, year, user]);

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

  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  const handleSaveSettings = async (newSettings) => {
    setAppSettings(newSettings);
    // Guardar en Firestore para que sea global
    await salesService.saveGlobalSettings(newSettings);
  };

  const handleIvaRecuperableChange = async (val) => {
    setIvaRecuperable(val);
    await salesService.setIvaRecuperable(month, year, val);
  };

  const handleMaxPaymentLimitChange = async (val) => {
    setMaxPaymentLimit(val);
    await salesService.setFacturaFaltante(month, year, val);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Calculations for PDF Report
  const calculateDashboardData = () => {
    const safeSales = Array.isArray(sales) ? sales : [];
    const totalCash = safeSales.reduce((acc, curr) => acc + (Number(curr.cash) || 0), 0);
    const totalCard = safeSales.reduce((acc, curr) => acc + (Number(curr.card) || 0), 0);
    const totalInvoice = safeSales.reduce((acc, curr) => acc + (Number(curr.invoice) || 0), 0);
    const totalSales = totalCash + totalCard + totalInvoice;
    
    // Constants
    const taxRate = 0.19;
    const ppmRate = 0.02;

    const netSales = Math.round(totalSales / (1 + taxRate));
    const totalIvaCalculated = Math.round(netSales * taxRate);
    const totalPPM = Math.round(netSales * ppmRate);
    const ivaPlusPPM = totalIvaCalculated + totalPPM;
    
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
      totalSales, netSales, totalIvaCalculated, totalPPM, ivaPlusPPM,
      ivaRecuperable, facturaFaltanteNeto, totalRecuperable,
      totalCash, totalCard, finalIvaToPay, totalToPayPocket
    };
  };

  // ------------------------------------------------------------------
  // Render Logic
  // ------------------------------------------------------------------

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const dashboardData = calculateDashboardData();
  const monthName = currentDate.toLocaleString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{appSettings.companyName}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                 <User size={14} />
                 <span>{user.email}</span>
                 {userProfile?.role === 'superadmin' && (
                   <span className="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-amber-200 dark:border-amber-700">
                     Super Admin
                   </span>
                 )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
              <button onClick={() => handleMonthChange(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                <ChevronLeft size={20} />
              </button>
              <span className="min-w-[150px] text-center font-medium capitalize flex items-center justify-center gap-2 text-gray-900 dark:text-white">
                <Calendar size={18} className="text-blue-500 dark:text-blue-400" />
                {monthName}
              </span>
              <button onClick={() => handleMonthChange(1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md transition-colors shadow-sm text-gray-700 dark:text-gray-200">
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="flex gap-2 items-center">
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              >
                {darkMode ? <Sun size={24} className="text-yellow-400" /> : <Moon size={24} />}
              </button>
               <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>
               <button 
                onClick={() => setIsPdfModalOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                title="Reporte PDF"
              >
                <FileText size={24} />
              </button>
              
              {/* Configuración solo para Admins */}
              {(userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title="Configuración"
                >
                  <Settings size={24} />
                </button>
              )}

              <div className="w-px h-8 bg-gray-300 dark:bg-gray-600 mx-1"></div>
              <button
                onClick={handleLogout}
                className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut size={24} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Dashboard 
          sales={sales}
          previousYearSales={previousYearSales} // Nueva prop
          taxRate={0.19}
          ivaRecuperable={ivaRecuperable}
          onIvaRecChange={handleIvaRecuperableChange}
          maxPaymentLimit={maxPaymentLimit}
          onMaxPaymentLimitChange={handleMaxPaymentLimitChange}
          visibleTotals={appSettings.visibleTotals}
          showDetails={showDetails}
          showMetrics={showMetrics}
          userRole={userProfile?.role}
        />
        
        {/* BOTONES DE CONTROL (FILA UNIFICADA) */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* BOTÓN INGRESO DIARIO */}
          <button 
            onClick={() => setShowEntryForm(!showEntryForm)}
            className="flex-1 flex items-center justify-center py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium transition-colors shadow-sm"
          >
            {showEntryForm ? (
              <>
                <ChevronUp className="w-5 h-5 mr-2" /> Ocultar Ingreso
              </>
            ) : (
              <>
                <PlusCircle className="w-5 h-5 mr-2" /> Ingresar Venta
              </>
            )}
          </button>

          {/* BOTÓN IMPUESTOS - Solo Admin/SuperAdmin */}
          {(userProfile?.role === 'admin' || userProfile?.role === 'superadmin') && (
            <button 
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 flex items-center justify-center py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium transition-colors shadow-sm"
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
          )}

          {/* BOTÓN GRÁFICOS */}
          <button 
            onClick={() => setShowMetrics(!showMetrics)}
            className="flex-1 flex items-center justify-center py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium transition-colors shadow-sm"
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

          {/* BOTÓN HISTORIAL */}
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="flex-1 flex items-center justify-center py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium transition-colors shadow-sm"
          >
            {showHistory ? (
              <>
                <ChevronUp className="w-5 h-5 mr-2" /> Ocultar Historial
              </>
            ) : (
              <>
                <List className="w-5 h-5 mr-2" /> Ver Historial
              </>
            )}
          </button>
        </div>

        {showEntryForm && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <EntryForm onSaleAdded={loadData} />
          </div>
        )}
        
        {showHistory && (
          <div className="animate-in fade-in slide-in-from-top-4 duration-300">
            <SalesList 
              sales={sales} 
              onSalesUpdated={loadData} 
              userRole={userProfile?.role}
            />
          </div>
        )}
      </main>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        settings={appSettings}
        onSaveSettings={handleSaveSettings}
        currentUserRole={userProfile?.role}
      />
      
      <PdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        month={month}
        year={year}
        dashboardData={dashboardData}
        sales={sales}
        companySettings={appSettings}
      />
    </div>
  );
}