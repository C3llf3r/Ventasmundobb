import React, { useState } from 'react';
import { Edit2, Save, X, Trash2 } from 'lucide-react';
import { formatCLP, formatNumberWithDots, parseNumberFromDots } from '../lib/utils';
import { salesService } from '../services/salesService';

export default function SalesList({ sales, onSalesUpdated, userRole }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', cash: '', card: '', invoice: '' });

  const canEdit = userRole === 'admin' || userRole === 'superadmin';

  const handleEditClick = (sale) => {
    setEditingId(sale.id);
    setEditForm({
      date: sale.date,
      cash: sale.cash,
      card: sale.card,
      invoice: sale.invoice || 0
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ date: '', cash: '', card: '', invoice: '' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este registro? Esta acción no se puede deshacer.')) {
      try {
        await salesService.deleteSale(id);
        if (onSalesUpdated) onSalesUpdated();
      } catch (error) {
        console.error("Error deleting sale:", error);
        alert("Error al eliminar la venta");
      }
    }
  };

  const handleSave = async (id) => {
    try {
      await salesService.updateSale(id, {
        date: editForm.date,
        cash: parseNumberFromDots(editForm.cash.toString()),
        card: parseNumberFromDots(editForm.card.toString()),
        invoice: parseNumberFromDots(editForm.invoice.toString())
      });
      setEditingId(null);
      if (onSalesUpdated) onSalesUpdated();
    } catch (error) {
      console.error("Error updating sale:", error);
      alert("Error al actualizar la venta");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'cash' || name === 'card' || name === 'invoice') {
        const rawValue = value.replace(/\D/g, ''); // Solo números
        setEditForm(prev => ({ ...prev, [name]: rawValue }));
    } else {
        setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-colors duration-300">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Historial de Movimientos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Efectivo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tarjeta</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Factura</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
              {canEdit && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? "6" : "5"} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  No hay ventas registradas este mes.
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const isEditing = editingId === sale.id;
                
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="date"
                            name="date"
                            value={editForm.date}
                            onChange={handleChange}
                            className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="cash"
                            value={formatNumberWithDots(editForm.cash)}
                            onChange={handleChange}
                            className="w-24 p-1 border border-blue-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="card"
                            value={formatNumberWithDots(editForm.card)}
                            onChange={handleChange}
                            className="w-24 p-1 border border-blue-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            name="invoice"
                            value={formatNumberWithDots(editForm.invoice)}
                            onChange={handleChange}
                            className="w-24 p-1 border border-blue-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900 dark:text-white">
                          {formatCLP(
                            parseNumberFromDots(editForm.cash.toString()) + 
                            parseNumberFromDots(editForm.card.toString()) + 
                            parseNumberFromDots(editForm.invoice.toString())
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2">
                          <button
                            onClick={() => handleSave(sale.id)}
                            className="text-green-600 hover:text-green-800 dark:hover:text-green-400 p-1 bg-green-50 dark:bg-green-900/30 rounded"
                            title="Guardar"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 bg-gray-100 dark:bg-gray-700 rounded"
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                          {new Date(sale.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400">
                          {formatCLP(sale.cash)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600 dark:text-purple-400">
                          {formatCLP(sale.card)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-orange-600 dark:text-orange-400">
                          {formatCLP(sale.invoice || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">
                          {formatCLP(sale.cash + sale.card + (sale.invoice || 0))}
                        </td>
                        {canEdit && (
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2">
                            <button
                              onClick={() => handleEditClick(sale)}
                              className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-400 transition-colors p-1"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(sale.id)}
                              className="text-red-500 hover:text-red-700 dark:hover:text-red-400 transition-colors p-1"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}