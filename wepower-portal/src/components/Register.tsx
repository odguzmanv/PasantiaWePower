import React, { useState } from 'react';
import { Bolt, Sun, User, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';

interface RegisterProps {
  onBackToLogin: () => void;
  onRegisterSuccess: (role: 'prosumer' | 'consumer', username: string) => void;
}

export default function Register({ onBackToLogin, onRegisterSuccess }: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'prosumer' | 'consumer'>('prosumer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState('');

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    if (!agreeTerms) {
      setError('Debes aceptar los Términos y la Política de Privacidad.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setError('');
    // Successful demo registration!
    const username = email.split('@')[0];
    onRegisterSuccess(role, username);
  };

  return (
    <div className="w-full max-w-[1200px] grid lg:grid-cols-2 gap-12 items-center relative z-10 px-4">
      {/* Brand Column on Desktop */}
      <section className="hidden lg:flex flex-col space-y-8 text-left">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-[#00dbe7] flex items-center justify-center shadow-[0_0_20px_rgba(0,219,231,0.3)]">
            <Bolt className="text-[#002022] w-6 h-6 fill-[#002022]/10" />
          </div>
          <h1 className="text-4xl font-bold text-[#00dbe7] tracking-tighter font-sans">WePower</h1>
        </div>

        <div className="space-y-6">
          <h2 className="text-3xl lg:text-4xl font-semibold text-[#e1fdff] leading-tight font-sans">
            Únete a la Red de Energía del Futuro.
          </h2>
          <p className="text-[#b9cacb] text-base leading-relaxed max-w-md">
            Gestiona tu consumo, comparte excedentes y lidera la transición energética comunitaria con transparencia total.
          </p>
        </div>

        {/* Visual Meta statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col">
            <span className="text-[#00dbe7] uppercase font-mono tracking-widest text-[10px] mb-1 font-semibold">Capacidad Total</span>
            <span className="text-3xl font-bold text-white font-sans">1.2 GW</span>
            <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
              <div className="bg-[#00dbe7] h-full w-3/4 shadow-[0_0_8px_rgba(0,219,231,0.5)]"></div>
            </div>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-xl flex flex-col">
            <span className="text-[#79ff5b] uppercase font-mono tracking-widest text-[10px] mb-1 font-semibold">Nodos Activos</span>
            <span className="text-3xl font-bold text-white font-sans">24,812</span>
            <div className="flex mt-3 -space-x-2">
              <div className="w-6 h-6 rounded-full border border-[#111318] bg-slate-700"></div>
              <div className="w-6 h-6 rounded-full border border-[#111318] bg-slate-600"></div>
              <div className="w-6 h-6 rounded-full border border-[#111318] bg-slate-500"></div>
              <div className="w-6 h-6 rounded-full border border-[#111318] bg-[#00f2ff] flex items-center justify-center text-[8px] font-bold text-[#00363a]">+99</div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Column */}
      <section className="w-full max-w-md mx-auto">
        <div className="backdrop-blur-xl bg-[#111318]/60 border border-white/15 p-8 rounded-2xl shadow-2xl relative overflow-hidden text-left">
          {/* Inner glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00dbe7]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#d1bcff]/10 blur-3xl pointer-events-none" />

          <button onClick={onBackToLogin} className="mb-4 inline-flex items-center space-x-2 text-xs text-[#00dbe7] hover:underline bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a Iniciar Sesión</span>
          </button>

          <div className="mb-6">
            <h3 className="text-2xl font-bold text-white font-sans">Crear Cuenta</h3>
            <p className="text-[#b9cacb] text-sm mt-1">Empieza a optimizar tu energía hoy mismo.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/35 text-red-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-[#b9cacb] ml-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#849495] w-5 h-5" />
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej. Alejandro Rivera" 
                  className="w-full pl-12 pr-4 py-2.5 bg-[#0c0e12]/50 border border-white/5 rounded-xl text-sm text-white placeholder:text-white/20 focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7]/30 transition-all outline-none"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-[#b9cacb] ml-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#849495] w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@ejemplo.com" 
                  className="w-full pl-12 pr-4 py-2.5 bg-[#0c0e12]/50 border border-white/5 rounded-xl text-sm text-white placeholder:text-white/20 focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7]/30 transition-all outline-none"
                />
              </div>
            </div>

            {/* Role Radio Picker */}
            <div className="space-y-2">
              <label className="text-[11px] font-semibold tracking-wider uppercase text-[#b9cacb] block ml-1">Selecciona tu Rol</label>
              <div className="grid grid-cols-2 gap-3">
                <label className="cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    value="prosumer"
                    checked={role === 'prosumer'}
                    onChange={() => setRole('prosumer')}
                    className="sr-only"
                  />
                  <div className={`rounded-xl p-3 flex flex-col items-center justify-center space-y-1.5 border transition-all ${role === 'prosumer' ? 'bg-[#00dbe7]/10 border-[#00dbe7] text-[#00dbe7] shadow-[0_0_15px_rgba(0,219,231,0.1)]' : 'bg-[#0c0e12]/30 border-white/5 text-[#849495]'}`}>
                    <Sun className={`w-6 h-6 ${role === 'prosumer' ? 'text-[#00dbe7]' : 'text-[#849495]'}`} />
                    <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">Prosumidor</span>
                  </div>
                </label>

                <label className="cursor-pointer">
                  <input 
                    type="radio" 
                    name="role" 
                    value="consumer"
                    checked={role === 'consumer'}
                    onChange={() => setRole('consumer')}
                    className="sr-only"
                  />
                  <div className={`rounded-xl p-3 flex flex-col items-center justify-center space-y-1.5 border transition-all ${role === 'consumer' ? 'bg-[#00dbe7]/10 border-[#00dbe7] text-[#00dbe7] shadow-[0_0_15px_rgba(0,219,231,0.1)]' : 'bg-[#0c0e12]/30 border-white/5 text-[#849495]'}`}>
                    <Bolt className={`w-6 h-6 ${role === 'consumer' ? 'text-[#00dbe7]' : 'text-[#849495]'}`} />
                    <span className="text-[10px] font-mono tracking-wider uppercase font-semibold">Consumidor</span>
                  </div>
                </label>
              </div>
              <p className="text-[10px] text-[#b9cacb]/60 px-1 mt-1 leading-normal">
                {role === 'prosumer' 
                  ? 'Produce tu propia energía solar, véndela y consume de la comunidad.' 
                  : 'Registra tu consumo inteligente adaptado al costo dinámico de red.'}
              </p>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-[#b9cacb] ml-1">Contraseña</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-2.5 bg-[#0c0e12]/50 border border-white/5 rounded-xl text-sm text-white placeholder:text-white/20 focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7]/30 transition-all outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold tracking-wider uppercase text-[#b9cacb] ml-1">Confirmar</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full px-4 py-2.5 bg-[#0c0e12]/50 border border-white/5 rounded-xl text-sm text-white placeholder:text-white/20 focus:border-[#00dbe7] focus:ring-1 focus:ring-[#00dbe7]/30 transition-all outline-none"
                />
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start space-x-3 pt-2">
              <input 
                id="agree" 
                type="checkbox" 
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 rounded bg-white/5 border-white/10 text-[#00dbe7] focus:ring-[#00dbe7]"
              />
              <label htmlFor="agree" className="text-xs text-[#b9cacb] leading-tight select-none cursor-pointer">
                Acepto los <a href="#" onClick={(e) => { e.preventDefault(); alert('Tratado de términos WePower v2'); }} className="text-[#00dbe7] hover:underline hover:text-white">Términos de Servicio</a> y la <a href="#" onClick={(e) => { e.preventDefault(); alert('Política de protección de datos WePower GDPR'); }} className="text-[#00dbe7] hover:underline hover:text-white">Política de Privacidad</a> de WePower.
              </label>
            </div>

            {/* CTA Button */}
            <button 
              type="submit" 
              className="w-full bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 mt-4 hover:shadow-[0_0_20px_rgba(0,219,231,0.4)] transform hover:scale-[1.01] transition-all group"
            >
              <span className="font-semibold text-sm">Comenzar Registro</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 flex flex-col items-center space-y-3">
            <p className="text-xs text-[#b9cacb]/85">¿Ya eres parte de la red?</p>
            <button onClick={onBackToLogin} className="text-[#00dbe7] font-bold hover:text-white hover:underline transition-color text-xs bg-transparent">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
