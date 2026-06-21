import React, { useState } from 'react';
import { Bolt, ChevronDown, User, Lock, Eye, EyeOff, ArrowRight, Fingerprint, Key } from 'lucide-react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, username: string) => void;
  onNavigateToRegister: () => void;
}

export default function Login({ onLogin, onNavigateToRegister }: LoginProps) {
  const [role, setRole] = useState<UserRole>('prosumer');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const getPlaceholderUsername = (currentRole: UserRole) => {
    switch (currentRole) {
      case 'super_admin': return 'superadmin';
      case 'admin': return 'admin_comunitario';
      case 'prosumer': return 'alex_prosumer';
      case 'consumer': return 'alex_consumer';
    }
  };

  const handleQuickFill = () => {
    const defaultUser = getPlaceholderUsername(role);
    setUsername(defaultUser);
    setPassword('demopass123');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Por favor, ingresa tu usuario.');
      return;
    }
    if (password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    setError('');
    onLogin(role, username);
  };

  return (
    <div className="relative z-10 w-full max-w-[480px] px-6">
      <div className="backdrop-blur-xl bg-[#111318]/60 border border-white/10 rounded-2xl p-8 md:p-12 relative overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#00dbe7]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[#00dbe7]/10 flex items-center justify-center mb-4 border border-[#00dbe7]/20 shadow-[0_0_20px_rgba(0,219,231,0.2)]">
            <Bolt className="text-[#00dbe7] w-8 h-8 fill-[#00dbe7]/20" />
          </div>
          <h1 className="text-3xl font-bold text-[#00dbe7] tracking-tight font-sans">WePower</h1>
          <p className="text-[#849495] mt-1 text-xs uppercase tracking-widest font-mono">Energy Management Portal</p>
        </div>

        {/* Credentials hints */}
        <div className="mb-6 p-3 rounded-lg bg-white/5 border border-white/5 text-xs text-center text-[#b9cacb]/80">
          <p className="font-semibold text-[#00dbe7] mb-1">Acceso de Demostración Rápido</p>
          <p>Selecciona un rol y haz clic abajo para rellenar automáticamente:</p>
          <button 
            type="button"
            onClick={handleQuickFill}
            className="mt-2 px-3 py-1 bg-[#00dbe7]/10 hover:bg-[#00dbe7]/20 text-[#00dbe7] font-semibold rounded border border-[#00dbe7]/20 transition-all text-[11px]"
          >
            Rellenar Datos de Demostración
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/35 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-[#b9cacb] block ml-1">Access Role</label>
            <div className="relative">
              <select 
                value={role} 
                onChange={(e) => {
                  setRole(e.target.value as UserRole);
                  setError('');
                }}
                className="w-full bg-[#0c0e12]/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-white appearance-none cursor-pointer focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7]/30 transition-all outline-none"
              >
                <option value="super_admin">Super Admin (Gestor Global)</option>
                <option value="admin">Administrador de Comunidad</option>
                <option value="prosumer">Prosumidor (Produce y Consume)</option>
                <option value="consumer">Consumidor (Solo consume)</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <ChevronDown className="text-[#849495] w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wider uppercase text-[#b9cacb] block ml-1">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <User className="text-[#849495] w-5 h-5" />
              </div>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nombre de usuario" 
                className="w-full pl-12 pr-4 py-3 bg-[#0c0e12]/50 border border-white/5 rounded-lg text-sm text-white placeholder:text-white/20 focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7]/30 transition-all outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-2">
            <div className="flex justify-between items-center ml-1">
              <label className="text-xs font-semibold tracking-wider uppercase text-[#b9cacb]">Password</label>
              <button 
                type="button" 
                className="text-[#00dbe7] text-[11px] uppercase tracking-wider font-semibold hover:underline bg-transparent"
                onClick={() => alert('Contraseña de demostración: demopass123')}
              >
                Forgot?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Lock className="text-[#849495] w-5 h-5" />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full pl-12 pr-12 py-3 bg-[#0c0e12]/50 border border-white/5 rounded-lg text-sm text-white placeholder:text-white/20 focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7]/30 transition-all outline-none"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-[#849495] hover:text-[#00dbe7] bg-transparent"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center space-x-2 ml-1">
            <input 
              id="remember" 
              type="checkbox" 
              defaultChecked
              className="w-4 h-4 rounded border-white/10 bg-[#1a1c20] text-[#00dbe7] focus:ring-[#00dbe7]/30"
            />
            <label htmlFor="remember" className="text-xs text-[#849495] select-none cursor-pointer">Remember this device</label>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="w-full py-4 bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-bold rounded-lg shadow-[0_0_20px_rgba(0,219,231,0.3)] hover:shadow-[0_0_30px_rgba(0,219,231,0.5)] transform hover:scale-[1.01] active:scale-95 transition-all duration-300 flex items-center justify-center space-x-2 group"
          >
            <span className="text-base font-semibold">Sign In</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </form>

        {/* Biometrics & SSO */}
        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-[#849495] uppercase tracking-widest mb-4 font-mono">Or authenticate via</p>
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => {
                setUsername(getPlaceholderUsername(role));
                setPassword('demopass123');
                alert('Simulado: Autenticación por Biometría aceptada. Datos cargados.');
              }}
              className="py-2.5 bg-[#0c0e12]/30 border border-white/5 hover:border-[#00dbe7]/30 rounded-lg flex items-center justify-center space-x-2 group hover:bg-white/5 transition-colors"
            >
              <Fingerprint className="w-5 h-5 text-[#849495] group-hover:text-white transition-colors" />
              <span className="text-xs font-semibold text-white">Biometrics</span>
            </button>
            <button 
              type="button"
              onClick={() => {
                setUsername(getPlaceholderUsername(role));
                setPassword('demopass123');
                alert('Simulado: Proveedor SSO autenticado.');
              }}
              className="py-2.5 bg-[#0c0e12]/30 border border-white/5 hover:border-[#00dbe7]/30 rounded-lg flex items-center justify-center space-x-2 group hover:bg-white/5 transition-colors"
            >
              <Key className="w-5 h-5 text-[#849495] group-hover:text-white transition-colors" />
              <span className="text-xs font-semibold text-white">SSO</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-sm">
        <p className="text-[#849495]">
          ¿No tienes una cuenta?{' '}
          <button onClick={onNavigateToRegister} className="text-[#00dbe7] font-semibold hover:underline bg-transparent">
            Únete a la comunidad
          </button>
        </p>
        <div className="mt-6 flex justify-center space-x-4 text-xs text-[#849495]/65">
          <button className="hover:text-white bg-transparent">Privacy Policy</button>
          <span>•</span>
          <button className="hover:text-white bg-transparent">Support</button>
          <span>•</span>
          <span>v2.4.1</span>
        </div>
      </div>
    </div>
  );
}
