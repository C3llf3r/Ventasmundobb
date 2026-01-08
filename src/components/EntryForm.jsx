import React, { useState } from 'react';
import { PlusCircle, Save } from 'lucide-react';
import { salesService } from '../services/salesService';
import { formatNumberWithDots, parseNumberFromDots } from '../lib/utils';

export default function EntryForm({ onSaleAdded }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cash, setCash] = useState('');
  const [card, setCard] = useState('');
  const [invoice, setInvoice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await salesService.addSale(
        date, 
        parseNumberFromDots(cash), 
        parseNumberFromDots(card), 
        parseNumberFromDots(invoice)
      );
      setCash('');
      setCard('');
      setInvoice('');
      if (onSaleAdded) onSaleAdded();
    } catch (error) {
      console.error("Error adding sale:", error);
      alert("Error al guardar la venta");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (setter) => (e) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Solo números
    setter(rawValue);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
        <PlusCircle className="w-6 h-6 text-blue-500" />
        Ingreso Diario
      </h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Efectivo</label>
          <div className="flex items-center border border-gray-300 rounded-md px-2 focus-within:ring-2 focus-within:ring-green-500">
            <span className="text-gray-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatNumberWithDots(cash)}
              onChange={handleInputChange(setCash)}
              className="w-full p-2 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tarjeta</label>
          <div className="flex items-center border border-gray-300 rounded-md px-2 focus-within:ring-2 focus-within:ring-purple-500">
            <span className="text-gray-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatNumberWithDots(card)}
              onChange={handleInputChange(setCard)}
              className="w-full p-2 outline-none"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Factura</label>
          <div className="flex items-center border border-gray-300 rounded-md px-2 focus-within:ring-2 focus-within:ring-orange-500">
            <span className="text-gray-400">$</span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formatNumberWithDots(invoice)}
              onChange={handleInputChange(setInvoice)}
              className="w-full p-2 outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white p-2 h-[42px] rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? '...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}