import React from 'react';
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Settings, 
  Bolt, 
  Receipt, 
  ShieldAlert, 
  HelpCircle, 
  LogOut, 
  RefreshCw,
  Wallet
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentRole: UserRole;
  username: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  onTriggerEmergency: () => void;
  isEmergencyActive: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function Sidebar({
  currentRole,
  activeTab,
  setActiveTab,
  onLogout,
  onSwitchRole,
  onTriggerEmergency,
  isEmergencyActive,
  isSidebarOpen,
  setIsSidebarOpen
}: SidebarProps) {

  // Get brand information according to role
  const getBrandDetails = () => {
    switch (currentRole) {
      case 'super_admin':
        return { name: 'EcoCommand', subtitle: 'Global Admin Terminal', color: 'text-[#00dbe7]', glow: 'shadow-[0_0_20px_rgba(0,219,231,0.4)]' };
      case 'admin':
        return { name: 'EcoCommand', subtitle: 'Community Terminal', color: 'text-[#00dbe7]', glow: 'shadow-[0_0_20px_rgba(0,219,231,0.4)]' };
      case 'consumer':
        return { name: 'EcoEnergía', subtitle: 'Portal Consumidor', color: 'text-[#74f5ff]', glow: 'shadow-[0_0_20px_rgba(116,245,255,0.4)]' };
      case 'prosumer':
        return { name: 'WePower', subtitle: 'Portal Prosumidor', color: 'text-[#00dbe7]', glow: 'shadow-[0_0_20px_rgba(0,219,231,0.4)]' };
    }
  };

  const brand = getBrandDetails();

  // Define navigation tabs per role
  const getNavItems = () => {
    switch (currentRole) {
      case 'super_admin':
        return [
          { id: 'overview', label: 'Vista General', icon: LayoutDashboard },
          { id: 'analytics', label: 'Análisis Global', icon: BarChart3 },
          { id: 'communities', label: 'Comunidades', icon: Users },
          { id: 'grid_control', label: 'Control de Red', icon: Bolt },
          { id: 'settings', label: 'Configuración', icon: Settings },
        ];
      case 'admin':
        return [
          { id: 'overview', label: 'Verificación', icon: LayoutDashboard },
          { id: 'tariffs', label: 'Gestión de Tarifas', icon: BarChart3 }, // Ajuste de precios
          { id: 'communities', label: 'Comunidad', icon: Users },
          { id: 'grid_control', label: 'Control de Red', icon: Bolt },
          { id: 'settings', label: 'Configuración', icon: Settings },
        ];
      case 'consumer':
        return [
          { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
          { id: 'analytics', label: 'Análisis', icon: BarChart3 },
          { id: 'community', label: 'Comunidad', icon: Users },
          { id: 'billing', label: 'Facturación', icon: Receipt },
          { id: 'settings', label: 'Configuración', icon: Settings },
        ];
      case 'prosumer':
        return [
          { id: 'dashboard', label: 'Panel', icon: LayoutDashboard },
          { id: 'analytics', label: 'Análisis', icon: BarChart3 },
          { id: 'community', label: 'Comunidad', icon: Users },
          { id: 'billing', label: 'Facturación', icon: Receipt },
          { id: 'settings', label: 'Configuración', icon: Settings },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-[55]" 
        />
      )}

      <aside className={`w-64 fixed left-0 top-0 h-screen bg-[#111318]/95 lg:bg-[#111318]/60 backdrop-blur-xl border-r border-white/10 flex flex-col py-6 z-[60] text-left transition-transform duration-300 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-8 px-6">
          <div className={`w-10 h-10 rounded-xl bg-[#00dbe7] flex items-center justify-center ${brand.glow} shrink-0`}>
            <Bolt className="text-[#002022] w-5 h-5 fill-[#002022]/10" />
          </div>
          <div>
            <h1 className={`font-sans font-bold text-lg select-none leading-none ${brand.color}`}>{brand.name}</h1>
            <p className="text-[#849495] font-mono tracking-wider text-[10px] mt-1 select-none">{brand.subtitle}</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all border-l-2 outline-none ${
                  isActive 
                    ? 'bg-white/5 text-[#00dbe7] border-[#00dbe7] shadow-[0_0_15px_rgba(0,219,231,0.08)] font-semibold' 
                    : 'text-[#849495] hover:text-[#e2e2e8] hover:bg-white/5 border-transparent'
                }`}
              >
                <IconComponent className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#00dbe7]' : 'text-[#849495]'}`} />
                <span className="text-sm tracking-wide">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Controls Bottom */}
        <div className="space-y-4 px-4 pt-4 border-t border-white/5 mt-auto">
          {/* Dynamic Switch Role helper to easily test multiple portals */}
          <div className="bg-[#1a1c20]/60 border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-semibold text-[#849495] uppercase tracking-wider mb-2 font-mono flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Simulador de Roles</span>
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(['super_admin', 'admin', 'prosumer', 'consumer'] as UserRole[]).map((roleOpt) => (
                <button
                  key={roleOpt}
                  onClick={() => {
                    onSwitchRole(roleOpt);
                    setIsSidebarOpen(false);
                  }}
                  className={`py-1 px-1.5 rounded text-[9px] font-mono tracking-wider transition-all font-semibold select-none overflow-hidden text-ellipsis whitespace-nowrap ${
                    currentRole === roleOpt
                      ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_10px_rgba(0,219,231,0.25)]'
                      : 'bg-[#0c0e12]/45 text-[#849495] hover:text-white hover:bg-[#1e2024]'
                  }`}
                >
                  {roleOpt === 'super_admin' ? 'SuperAdmin' : roleOpt === 'admin' ? 'Admin' : roleOpt === 'prosumer' ? 'Prosumer' : 'Consumer'}
                </button>
              ))}
            </div>
          </div>

          {/* Emergency Cutoff - relevant only for admin controls */}
          {(currentRole === 'super_admin' || currentRole === 'admin') && (
            <button
              onClick={() => {
                onTriggerEmergency();
                setIsSidebarOpen(false);
              }}
              className={`w-full py-3 px-4 rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-2 transition-all outline-none border ${
                isEmergencyActive 
                  ? 'bg-[#93000a] text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.4)]'
                  : 'bg-red-500/10 border-red-500/20 text-[#ffb4ab] hover:bg-red-500/20'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
              <span>{isEmergencyActive ? 'CORTE ACTIVADO' : 'CORTE DE EMERGENCIA'}</span>
            </button>
          )}

          {/* Standard footer items */}
          <div className="space-y-1 text-xs">
            <button
              onClick={() => {
                alert('Soporte WePower: Contacte a soporte@wepower.com');
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-[#849495] hover:text-white transition-colors text-left font-mono"
            >
              <HelpCircle className="w-4 h-4 text-[#849495]" />
              <span>Support</span>
            </button>
            <button
              onClick={() => {
                onLogout();
                setIsSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-[#ffb4ab] hover:text-red-300 transition-colors text-left font-mono"
            >
              <LogOut className="w-4 h-4 text-[#ffb4ab]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
