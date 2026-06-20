"use client";

import { useEffect, useState } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts';
import { Zap, Activity, DollarSign, TrendingDown } from 'lucide-react';

export default function DashboardUser({ overrideUserId }: { overrideUserId?: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const url = overrideUserId ? `/api/data?userId=${overrideUserId}` : '/api/data';
    fetch(url).then(res => res.json()).then(setData);
  }, [overrideUserId]);

  if (!data) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  const chartData = data.userData.map((row: any) => {
    const priceObj = data.prices.find((p: any) => p.month === row.month) || data.prices[data.prices.length - 1];
    const price = priceObj ? priceObj.priceKwh : 0;
    const netoKwh = row.consumptionKwh - row.generationKwh;
    const costo = netoKwh > 0 ? netoKwh * price : 0;

    return {
      month: row.month,
      consumo: row.consumptionKwh,
      generacion: row.generationKwh,
      precio: price,
      costo: costo,
      neto: netoKwh
    };
  });

  const latestMonth = chartData[chartData.length - 1] || { consumo: 0, generacion: 0, precio: 0, costo: 0 };
  const isProsumer = data.role === 'PROSUMER' || (overrideUserId && chartData.some((d: any) => d.generacion > 0));

  return (
    <div className="space-y-8 animate-fade-in delay-100">
      
      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel glass-panel-hover p-6 flex items-start space-x-4">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <Activity className="w-8 h-8 text-red-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Consumo Actual</p>
            <p className="text-3xl font-bold text-white">{latestMonth.consumo} <span className="text-lg text-gray-500">kWh</span></p>
          </div>
        </div>

        {isProsumer && (
          <div className="glass-panel glass-panel-hover p-6 flex items-start space-x-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <Zap className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Generación Solar</p>
              <p className="text-3xl font-bold text-white">{latestMonth.generacion} <span className="text-lg text-gray-500">kWh</span></p>
            </div>
          </div>
        )}

        <div className="glass-panel glass-panel-hover p-6 flex items-start space-x-4">
          <div className="p-3 bg-blue-500/10 rounded-xl">
            <TrendingDown className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Tarifa Comunidad</p>
            <p className="text-3xl font-bold text-white">${latestMonth.precio} <span className="text-lg text-gray-500">/ kWh</span></p>
          </div>
        </div>

        <div className="glass-panel glass-panel-hover p-6 flex items-start space-x-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-4 translate-y-4">
            <DollarSign className="w-32 h-32 text-emerald-500" />
          </div>
          <div className="p-3 bg-green-500/10 rounded-xl z-10">
            <DollarSign className="w-8 h-8 text-green-400" />
          </div>
          <div className="z-10">
            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">Costo Proyectado</p>
            <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
              ${latestMonth.costo.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Gráfico de Línea */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg text-white">Evolución Energética</h3>
            <span className="text-xs px-3 py-1 bg-[var(--color-bg-tertiary)] rounded-full text-emerald-400 border border-emerald-500/20">2023</span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="#6b7280" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} />
                <YAxis stroke="#6b7280" tick={{fill: '#9ca3af', fontSize: 12}} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                <Line type="monotone" dataKey="consumo" name="Consumo" stroke="#ef4444" strokeWidth={3} dot={{r: 4, fill: '#030712', strokeWidth: 2}} activeDot={{r: 6}} />
                {isProsumer && <Line type="monotone" dataKey="generacion" name="Generación" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#030712', strokeWidth: 2}} activeDot={{r: 6}} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Dispersión */}
        <div className="glass-panel p-6">
          <div className="mb-6">
            <h3 className="font-semibold text-lg text-white mb-1">Relación Consumo vs Precio</h3>
            <p className="text-sm text-gray-400">Análisis de elasticidad y cobro</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="consumo" name="Consumo" unit=" kWh" stroke="#6b7280" tick={{fill: '#9ca3af'}} />
                <YAxis type="number" dataKey="precio" name="Precio" unit=" $" stroke="#6b7280" tick={{fill: '#9ca3af'}} domain={['dataMin - 10', 'auto']} />
                <RechartsTooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.9)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem' }} 
                />
                <Scatter name="Mes" data={chartData} fill="#3b82f6">
                  {chartData.map((entry: any, index: number) => (
                    <circle key={`cell-${index}`} cx={0} cy={0} r={8} fill={entry.precio > 510 ? '#ef4444' : '#3b82f6'} opacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6">
        <h3 className="font-semibold text-lg mb-6 text-white">Registro Histórico Detallado</h3>
        <div className="overflow-x-auto rounded-lg border border-[var(--glass-border)]">
          <table className="w-full">
            <thead>
              <tr className="bg-[rgba(255,255,255,0.02)]">
                <th>Período</th>
                <th>Consumo Real</th>
                {isProsumer && <th>Producción Solar</th>}
                <th>Tarifa kWh</th>
                <th className="text-right">Total Facturado</th>
              </tr>
            </thead>
            <tbody>
              {[...chartData].reverse().map((row: any) => (
                <tr key={row.month}>
                  <td className="font-medium text-gray-300">{row.month}</td>
                  <td className="text-red-400 font-mono">{row.consumo} <span className="text-xs opacity-50">kWh</span></td>
                  {isProsumer && <td className="text-emerald-400 font-mono">{row.generacion} <span className="text-xs opacity-50">kWh</span></td>}
                  <td className="font-mono text-blue-300">${row.precio}</td>
                  <td className="text-right font-bold font-mono text-white">${row.costo.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
