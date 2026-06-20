"use client";

import { useEffect, useState } from 'react';
import DashboardUser from './DashboardUser';
import { Settings, Users, ArrowLeft, PlusCircle, Save, Trash2, Eye } from 'lucide-react';

export default function DashboardAdmin({ communityId }: { communityId: number }) {
  const [data, setData] = useState<any>(null);
  const [month, setMonth] = useState('');
  const [price, setPrice] = useState('');
  const [viewAsUser, setViewAsUser] = useState<string | null>(null);

  const loadData = () => {
    fetch('/api/data').then(res => res.json()).then(setData);
  };

  useEffect(() => {
    loadData();
    const date = new Date();
    setMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }, []);

  useEffect(() => {
    if (data?.prices && month) {
      const currentPriceObj = data.prices.find((p: any) => p.month === month);
      if (currentPriceObj) {
        setPrice(currentPriceObj.priceKwh.toString());
      } else if (data.prices.length > 0) {
        const sortedPrices = [...data.prices].sort((a, b) => b.month.localeCompare(a.month));
        const prevPriceObj = sortedPrices.find((p: any) => p.month < month);
        if (prevPriceObj) {
          setPrice(prevPriceObj.priceKwh.toString());
        } else {
          setPrice(sortedPrices[0].priceKwh.toString());
        }
      }
    }
  }, [month, data]);

  const handleSetPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_price', payload: { month, priceKwh: parseFloat(price) } })
    });
    alert('Precio actualizado con éxito');
    loadData();
  };

  const handleDeleteUser = async (userId: number) => {
    if (confirm('¿Eliminar usuario de forma permanente y borrar su historial? Esta acción es irreversible.')) {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_user', payload: { userId } })
      });
      loadData();
    }
  };

  if (!data) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div></div>;

  if (viewAsUser) {
    const user = data.users.find((u:any) => u.id.toString() === viewAsUser);
    return (
      <div className="animate-fade-in">
        <button onClick={() => setViewAsUser(null)} className="btn btn-outline mb-6">
          <ArrowLeft className="w-4 h-4" /> Regresar al Panel Admin
        </button>
        <div className="bg-emerald-500/10 p-4 mb-6 rounded-lg border border-emerald-500/20 text-emerald-300 flex items-center gap-3">
          <Eye className="w-5 h-5" /> Estás visualizando los datos simulando ser el usuario: <strong>{user?.username}</strong>
        </div>
        <DashboardUser overrideUserId={viewAsUser} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in delay-100">
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Panel de Configuración Financiera */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-panel p-6 border-t border-t-emerald-500/30">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><Settings className="w-6 h-6 text-emerald-400" /></div>
              <h3 className="font-semibold text-xl text-white">Tarifa kWh</h3>
            </div>
            
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Define el valor del mes. Si se omite, el sistema heredará automáticamente el último valor registrado para mantener la liquidez de la red.
            </p>
            
            <form onSubmit={handleSetPrice} className="space-y-5">
              <div>
                <label className="label">Mes de Cobro</label>
                <input 
                  type="month" 
                  className="input-field" 
                  value={month} 
                  onChange={(e) => setMonth(e.target.value)}
                  required 
                />
              </div>
              <div>
                <label className="label">Precio ($/kWh)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    className="input-field pl-8 text-xl font-bold text-emerald-400" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-full mt-2"><Save className="w-4 h-4" /> Guardar Valor</button>
            </form>

            <div className="mt-8">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Historial Tarifario</h4>
              <ul className="space-y-2">
                {data.prices.slice(0, 4).map((p: any) => (
                  <li key={p.id} className="flex justify-between items-center bg-[rgba(0,0,0,0.2)] p-3 rounded-lg border border-white/5">
                    <span className="text-gray-300 font-mono text-sm">{p.month}</span>
                    <span className="font-bold text-white">${p.priceKwh}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Panel de Gestión de Usuarios */}
        <div className="lg:col-span-8">
          <div className="glass-panel p-6 border-t border-t-blue-500/30 h-full">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="w-6 h-6 text-blue-400" /></div>
                <h3 className="font-semibold text-xl text-white">Miembros de la Red</h3>
              </div>
              <button className="btn btn-outline py-2 px-4 text-sm"><PlusCircle className="w-4 h-4" /> Nuevo Usuario</button>
            </div>
            
            <div className="overflow-hidden rounded-xl border border-[var(--glass-border)]">
              <table className="w-full text-sm text-left text-gray-300 m-0 border-spacing-0">
                <thead className="text-xs text-gray-400 uppercase bg-[rgba(0,0,0,0.4)]">
                  <tr>
                    <th className="px-5 py-4 border-b border-[var(--glass-border)]">Identificador</th>
                    <th className="px-5 py-4 border-b border-[var(--glass-border)]">Tipo de Nodo</th>
                    <th className="px-5 py-4 border-b border-[var(--glass-border)] text-right">Acciones de Gestión</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u: any, idx: number) => (
                    <tr key={u.id} className={`hover:bg-white/5 transition-colors ${idx !== data.users.length -1 ? 'border-b border-white/5' : ''}`}>
                      <td className="px-5 py-4 font-medium text-white flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${u.role === 'PROSUMER' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                        {u.username}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.role === 'PROSUMER' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button 
                            onClick={() => setViewAsUser(u.id.toString())}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                            title="Ver Panel de Usuario"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                            title="Eliminar Miembro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
