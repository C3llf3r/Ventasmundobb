import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Building, FileText, Eye, EyeOff } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings }) {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const updateSetting = (key, value) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const toggleVisibility = (key) => {
    setLocalSettings(prev => ({
      ...prev,
      visibleTotals: { ...prev.visibleTotals, [key]: !prev.visibleTotals[key] }
    }));
  };

  const totalOptions = [
    { key: 'netSales', label: 'Total Neto' },
    { key: 'totalIva', label: 'Total IVA' },
    { key: 'totalPPM', label: 'Total PPM' },
    { key: 'ivaPlusPPM', label: 'IVA + PPM' },
    { key: 'totalRecuperable', label: 'Total Recuperable' },
    { key: 'finalIvaToPay', label: 'IVA a Pagar' },
    { key: 'totalToPayPocket', label: 'Total a Pagar' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={20} />
            Panel de Control
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Empresa */}
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Building size={18} />
              Datos de la Empresa
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Nombre de la Empresa
                </label>
                <input
                  type="text"
                  value={localSettings.companyName}
                  onChange={(e) => updateSetting('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Mi Empresa S.A."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Título de la Aplicación
                </label>
                <input
                  type="text"
                  value={localSettings.appTitle}
                  onChange={(e) => updateSetting('appTitle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Sistema de Ventas e Impuestos"
                />
              </div>
            </div>
          </div>

          {/* Visibilidad de Totales */}
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Eye size={18} />
              Visibilidad de Totales
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              Selecciona qué totales mostrar en la sección de impuestos
            </p>
            <div className="grid grid-cols-1 gap-2">
              {totalOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => toggleVisibility(option.key)}
                  className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-gray-700 dark:text-gray-200">{option.label}</span>
                  {localSettings.visibleTotals[option.key] ? (
                    <Eye className="text-blue-600 w-5 h-5" />
                  ) : (
                    <EyeOff className="text-gray-400 w-5 h-5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Usuarios - Placeholder */}
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <FileText size={18} />
              Administración de Usuarios
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Funcionalidad próximamente. Actualmente es un sistema de usuario único.
            </p>
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
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <Save size={18} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}