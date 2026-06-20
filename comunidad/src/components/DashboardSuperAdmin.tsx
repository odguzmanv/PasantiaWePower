"use client";

import { useEffect, useState } from 'react';

export default function DashboardSuperAdmin() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/data').then(res => res.json()).then(setData);
  }, []);

  if (!data) return <div className="text-center p-12">Cargando datos maestros...</div>;

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-semibold mb-4 text-white">Soporte Técnico WePower</h2>
        <p className="text-gray-400 mb-6">Visión global de todas las comunidades energéticas registradas.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--color-border)]">
            <h3 className="font-medium text-lg mb-4 text-[var(--color-primary)]">Comunidades Activas</h3>
            <ul className="space-y-2">
              {data.communities.map((c: any) => (
                <li key={c.id} className="flex justify-between border-b border-gray-700 pb-2">
                  <span>{c.name}</span>
                  <span className="text-xs bg-[var(--color-bg)] px-2 py-1 rounded">ID: {c.id}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--color-border)]">
            <h3 className="font-medium text-lg mb-4 text-[var(--color-accent)]">Usuarios del Sistema</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-[var(--color-bg)]">
                  <tr>
                    <th className="px-4 py-2">Usuario</th>
                    <th className="px-4 py-2">Rol</th>
                    <th className="px-4 py-2">Comunidad ID</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-700">
                      <td className="px-4 py-2 font-medium text-white">{u.username}</td>
                      <td className="px-4 py-2">{u.role}</td>
                      <td className="px-4 py-2">{u.communityId || 'N/A'}</td>
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
