import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCLP } from '../lib/utils';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

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

export default function MetricsSection({ sales, previousYearSales = [] }) {
  // --- 1. Gráfico de Barras: Evolución Diaria ---
  const salesByDay = sales.reduce((acc, sale) => {
    const dateObj = new Date(sale.date);
    const day = dateObj.getUTCDate();
    if (!acc[day]) {
      acc[day] = { name: `Día ${day}`, day: day, efectivo: 0, tarjeta: 0, factura: 0 };
    }
    acc[day].efectivo += (Number(sale.cash) || 0);
    acc[day].tarjeta += (Number(sale.card) || 0);
    acc[day].factura += (Number(sale.invoice) || 0);
    return acc;
  }, {});
  const barData = Object.values(salesByDay).sort((a, b) => a.day - b.day);

  // --- 2. Gráfico Circular: Distribución ---
  const totalCash = sales.reduce((acc, s) => acc + (Number(s.cash) || 0), 0);
  const totalCard = sales.reduce((acc, s) => acc + (Number(s.card) || 0), 0);
  const totalInvoice = sales.reduce((acc, s) => acc + (Number(s.invoice) || 0), 0);
  const totalSales = totalCash + totalCard + totalInvoice;

  const pieData = [
    { name: 'Efectivo', value: totalCash, color: '#22c55e' }, // green-500
    { name: 'Tarjeta', value: totalCard, color: '#a855f7' }, // purple-500
    { name: 'Factura', value: totalInvoice, color: '#f97316' }, // orange-500
  ].filter(item => item.value > 0);

  // --- 3. Comparativa Anual ---
  const totalPrevYear = previousYearSales.reduce((acc, s) => 
    acc + (Number(s.cash) || 0) + (Number(s.card) || 0) + (Number(s.invoice) || 0), 0
  );

  const growth = totalPrevYear > 0 ? ((totalSales - totalPrevYear) / totalPrevYear) * 100 : 0;
  const growthColor = growth >= 0 ? 'text-green-500' : 'text-red-500';
  const GrowthIcon = growth >= 0 ? TrendingUp : TrendingDown;

  const comparisonData = [
    { name: 'Año Pasado', valor: totalPrevYear, fill: '#9ca3af' }, // gray-400
    { name: 'Este Año', valor: totalSales, fill: growth >= 0 ? '#22c55e' : '#ef4444' },
  ];

  if (sales.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
        No hay datos suficientes para mostrar gráficos este mes.
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      {/* Fila 1: Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 text-center">Evolución Diaria</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} opacity={0.2} />
                <XAxis dataKey="name" tick={{fontSize: 12}} stroke="#9ca3af" />
                <YAxis tickFormatter={(val) => `$${val/1000}k`} tick={{fontSize: 12}} stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
                <Legend />
                <Bar dataKey="efectivo" name="Efectivo" stackId="a" fill="#22c55e" radius={[0, 0, 4, 4]} />
                <Bar dataKey="tarjeta" name="Tarjeta" stackId="a" fill="#a855f7" radius={[0, 0, 4, 4]} />
                <Bar dataKey="factura" name="Factura" stackId="a" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200 text-center">Distribución de Pagos</h3>
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

      {/* Fila 2: Comparativa Anual */}
      {totalPrevYear > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center justify-center md:justify-start gap-2 mb-2">
                <Calendar className="w-5 h-5" />
                Comparativa Interanual (mismo mes)
              </h3>
              <div className="flex items-end justify-center md:justify-start gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Venta Año Pasado</p>
                  <p className="text-xl font-bold text-gray-600 dark:text-gray-300">{formatCLP(totalPrevYear)}</p>
                </div>
                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600"></div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Crecimiento</p>
                  <div className={`flex items-center gap-1 text-2xl font-bold ${growthColor}`}>
                    <GrowthIcon className="w-6 h-6" />
                    {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                Diferencia: <span className={growthColor}>{growth > 0 ? '+' : ''}{formatCLP(totalSales - totalPrevYear)}</span>
              </p>
            </div>

            <div className="h-48 w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#374151" opacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: '#9ca3af'}} stroke="transparent" />
                  <Tooltip cursor={{fill: 'transparent'}} formatter={(value) => formatCLP(value)} contentStyle={{backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff'}} />
                  <Bar dataKey="valor" radius={[0, 4, 4, 0]} barSize={30}>
                    {comparisonData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
