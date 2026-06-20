"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound, User, ArrowLeft } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (res.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Credenciales inválidas');
      }
    } catch (err) {
      setError('Error de conexión al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full mix-blend-screen filter blur-[100px] pointer-events-none"></div>
      
      <Link href="/" className="absolute top-8 left-8 text-gray-400 hover:text-white flex items-center gap-2 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      <div className="glass-panel p-10 w-full max-w-md animate-fade-in relative z-10 border-t border-t-emerald-500/30">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 font-heading">Acceso WePower</h2>
          <p className="text-gray-400 text-sm">Gestiona tu comunidad energética</p>
        </div>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-lg mb-6 flex items-center gap-3 text-sm animate-fade-in">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0"></div>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="label" htmlFor="username">Usuario</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                id="username"
                type="text" 
                className="input-field pl-10" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                required
              />
            </div>
          </div>
          <div>
            <label className="label" htmlFor="password">Contraseña</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                id="password"
                type="password" 
                className="input-field pl-10" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end items-center text-sm pt-2">
            <Link href="/forgot-password" className="text-emerald-400 hover:text-emerald-300 transition-colors">
              ¿Problemas para acceder?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary w-full py-3.5 mt-2" disabled={isLoading}>
            {isLoading ? 'Autenticando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-sm text-gray-500">
          <p className="mb-3 uppercase tracking-wider text-xs font-semibold text-gray-600">Credenciales de Demo</p>
          <div className="space-y-2 font-mono text-xs">
            <div className="flex justify-between items-center"><span className="text-gray-400">Soporte IT:</span> <span className="text-white">superadmin / admin123</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-400">Admin Red:</span> <span className="text-white">admin_norte / admin123</span></div>
            <div className="flex justify-between items-center"><span className="text-gray-400">Prosumidor:</span> <span className="text-white">prosumidor1 / user123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
