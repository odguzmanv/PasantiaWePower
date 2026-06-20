import Link from 'next/link';
import { Zap, Activity, Cpu, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative">
      
      {/* Decorative Orbs */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="glass-panel p-12 max-w-4xl w-full z-10 animate-fade-in">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-emerald-500/10 rounded-full inline-flex">
            <Zap className="w-12 h-12 text-emerald-400" />
          </div>
        </div>
        
        <h1 className="text-6xl font-extrabold mb-6">
          Comunidad Energética <span className="text-gradient">WePower</span>
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-light">
          Gestiona, monitorea y optimiza la energía de tu comunidad. Una plataforma inteligente y transparente para la era de la transición energética.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login" className="btn btn-primary text-lg px-8 py-4 w-full sm:w-auto">
            Iniciar Sesión <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
          <Link href="/register" className="btn btn-outline text-lg px-8 py-4 w-full sm:w-auto">
            Únete a una red
          </Link>
        </div>
      </div>

      <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full z-10">
        <div className="glass-panel glass-panel-hover p-8 text-left animate-fade-in delay-100">
          <Activity className="w-10 h-10 text-blue-400 mb-6" />
          <h3 className="text-2xl font-semibold mb-3 text-white">Datos Transparentes</h3>
          <p className="text-gray-400 leading-relaxed">Monitorea tu consumo y producción en tiempo real. Entiende tus cobros gracias a la visualización clara de la relación consumo vs precio.</p>
        </div>
        <div className="glass-panel glass-panel-hover p-8 text-left animate-fade-in delay-200">
          <Zap className="w-10 h-10 text-emerald-400 mb-6" />
          <h3 className="text-2xl font-semibold mb-3 text-white">Gestión de Red</h3>
          <p className="text-gray-400 leading-relaxed">Herramientas administrativas avanzadas para configurar tarifas justas y mantener la viabilidad financiera de toda la comunidad.</p>
        </div>
        <div className="glass-panel glass-panel-hover p-8 text-left animate-fade-in delay-300">
          <Cpu className="w-10 h-10 text-purple-400 mb-6" />
          <h3 className="text-2xl font-semibold mb-3 text-white">IoT Ready</h3>
          <p className="text-gray-400 leading-relaxed">Preparados para integrarse nativamente con medidores inteligentes (AMI) para lecturas instantáneas y sin intermediarios.</p>
        </div>
      </div>
    </div>
  );
}
