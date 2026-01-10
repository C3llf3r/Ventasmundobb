import React, { useState, useEffect } from 'react';
import { Settings, X, Save, Building, FileText, Eye, EyeOff, Users, Shield } from 'lucide-react';
import { salesService } from '../services/salesService';

export default function SettingsModal({ isOpen, onClose, settings, onSaveSettings, currentUserRole }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if (isOpen && currentUserRole === 'superadmin') {
      loadUsers();
    }
  }, [isOpen, currentUserRole]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    const usersList = await salesService.getAllUsers();
    setUsers(usersList);
    setLoadingUsers(false);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await salesService.updateUserRole(userId, newRole);
      // Actualizar lista localmente
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      alert("Error al actualizar rol");
    }
  };

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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto transition-colors duration-300">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={20} />
            Panel de Control
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-8">
          {/* Empresa */}
          <div>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
              <Building size={18} />
              Datos de la Empresa
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
              <Eye size={18} />
              Visibilidad de Totales
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {totalOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => toggleVisibility(option.key)}
                  className="flex items-center justify-between w-full p-2 px-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="text-sm text-gray-700 dark:text-gray-200">{option.label}</span>
                  {localSettings.visibleTotals[option.key] ? (
                    <Eye className="text-blue-600 w-4 h-4" />
                  ) : (
                    <EyeOff className="text-gray-400 w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Gestión de Usuarios (Solo Super Admin) */}
          {currentUserRole === 'superadmin' && (
            <div>
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                <Users size={18} />
                Administración de Usuarios
              </h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                {loadingUsers ? (
                  <div className="p-4 text-center text-gray-500">Cargando usuarios...</div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-100 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rol</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-200 truncate max-w-[150px]" title={user.email}>
                            {user.email}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              user.role === 'superadmin' ? 'bg-amber-100 text-amber-800' :
                              user.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role || 'user'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <select
                              value={user.role || 'user'}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={user.role === 'superadmin'} // No puedes cambiar a otro superadmin fácilmente por seguridad
                              className="text-xs border border-gray-300 dark:border-gray-600 rounded p-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                              <option value="user">Usuario</option>
                              <option value="admin">Admin</option>
                              {/* Ocultamos superadmin para no crear conflictos accidentales */}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-b-lg">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 shadow-sm"
          >
            <Save size={18} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}