import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCLP } from '../lib/utils';

export default function MetricsSection({ sales }) {
  // Preparar datos para el gráfico de barras (Diario)
  // Agrupar ventas por día y ordenarlas
  const salesByDay = sales.reduce((acc, sale) => {
    // Ajustar fecha para evitar desfase de zona horaria al mostrar
    const dateObj = new Date(sale.date);
    const day = dateObj.getUTCDate(); // Usar UTC para coincidir con el string YYYY-MM-DD
    
    if (!acc[day]) {
      acc[day] = { name: `Día ${day}`, day: day, efectivo: 0, tarjeta: 0, factura: 0 };
    }
    acc[day].efectivo += (Number(sale.cash) || 0);
    acc[day].tarjeta += (Number(sale.card) || 0);
    acc[day].factura += (Number(sale.invoice) || 0);
    return acc;
  }, {});

  const barData = Object.values(salesByDay).sort((a, b) => a.day - b.day);

  // Preparar datos para el gráfico circular (Totales del mes)
  const totalCash = sales.reduce((acc, s) => acc + (Number(s.cash) || 0), 0);
  const totalCard = sales.reduce((acc, s) => acc + (Number(s.card) || 0), 0);
  const totalInvoice = sales.reduce((acc, s) => acc + (Number(s.invoice) || 0), 0);

  const pieData = [
    { name: 'Efectivo', value: totalCash, color: '#22c55e' }, // green-500
    { name: 'Tarjeta', value: totalCard, color: '#a855f7' }, // purple-500
    { name: 'Factura', value: totalInvoice, color: '#f97316' }, // orange-500
  ].filter(item => item.value > 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg">
          <p className="font-bold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCLP(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (sales.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        No hay datos suficientes para mostrar gráficos este mes.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Gráfico de Barras: Evolución Diaria */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 text-center">Evolución de Ventas Diarias</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
              <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 12}} stroke="#9ca3af" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="efectivo" name="Efectivo" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
              <Bar dataKey="tarjeta" name="Tarjeta" stackId="a" fill="#a855f7" radius={[0, 0, 4, 4]} />
              <Bar dataKey="factura" name="Factura" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico Circular: Distribución */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 text-center">Distribución por Medio de Pago</h3>
        <div className="h-64 flex justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCLP(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
