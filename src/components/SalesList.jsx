import React, { useState } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { formatCLP, formatNumberWithDots, parseNumberFromDots } from '../lib/utils';
import { salesService } from '../services/salesService';

export default function SalesList({ sales, onSalesUpdated }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', cash: '', card: '', invoice: '' });

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
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">Historial de Movimientos</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Efectivo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tarjeta</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Factura</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sales.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                  No hay ventas registradas este mes.
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const isEditing = editingId === sale.id;
                
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    {isEditing ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="date"
                            name="date"
                            value={editForm.date}
                            onChange={handleChange}
                            className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            name="cash"
                            value={formatNumberWithDots(editForm.cash)}
                            onChange={handleChange}
                            className="w-24 p-1 border border-blue-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            name="card"
                            value={formatNumberWithDots(editForm.card)}
                            onChange={handleChange}
                            className="w-24 p-1 border border-blue-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            name="invoice"
                            value={formatNumberWithDots(editForm.invoice)}
                            onChange={handleChange}
                            className="w-24 p-1 border border-blue-300 rounded text-right focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                          {formatCLP(
                            parseNumberFromDots(editForm.cash.toString()) + 
                            parseNumberFromDots(editForm.card.toString()) + 
                            parseNumberFromDots(editForm.invoice.toString())
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2">
                          <button
                            onClick={() => handleSave(sale.id)}
                            className="text-green-600 hover:text-green-800 p-1 bg-green-50 rounded"
                            title="Guardar"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="text-gray-500 hover:text-gray-700 p-1 bg-gray-100 rounded"
                            title="Cancelar"
                          >
                            <X size={18} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(sale.date).toLocaleDateString('es-CL', { timeZone: 'UTC' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600">
                          {formatCLP(sale.cash)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-purple-600">
                          {formatCLP(sale.card)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-orange-600">
                          {formatCLP(sale.invoice || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCLP(sale.cash + sale.card + (sale.invoice || 0))}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                          <button
                            onClick={() => handleEditClick(sale)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                        </td>
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