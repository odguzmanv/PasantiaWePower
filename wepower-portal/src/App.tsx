import React, { useState, useEffect } from 'react';
import { 
  Bolt, 
  Users, 
  MapPin, 
  TrendingUp, 
  Plus, 
  UserPlus, 
  AlertTriangle, 
  DollarSign, 
  Zap, 
  Sun, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Activity, 
  Clock, 
  BadgePercent,
  CheckCircle,
  FileText,
  CreditCard,
  Building,
  Radio,
  Sliders,
  Sparkles,
  Info
} from 'lucide-react';
import { UserRole, Community, CommunityMember, Invoice, ActivityLog } from './types';
import { 
  INITIAL_COMMUNITIES, 
  INITIAL_MEMBERS, 
  INITIAL_INVOICES, 
  ACTIVITIES, 
  CONSUMER_ACTIVITIES 
} from './data';
import Login from './components/Login';
import Register from './components/Register';
import Sidebar from './components/Sidebar';

export default function App() {
  const [view, setView] = useState<'login' | 'register' | 'portal'>('login');
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; username: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');
  
  // App Core States (Initialized from initial mock data)
  const [communities, setCommunities] = useState<Community[]>(INITIAL_COMMUNITIES);
  const [members, setMembers] = useState<CommunityMember[]>(INITIAL_MEMBERS);
  const [invoices, setInvoices] = useState<Invoice[]>(INITIAL_INVOICES);
  const [logs, setLogs] = useState<ActivityLog[]>(ACTIVITIES);
  const [isEmergencyActive, setIsEmergencyActive] = useState<boolean>(false);

  // Interaction State
  const [prosumerGeneration, setProsumerGeneration] = useState<number>(4.2);
  const [prosumerConsumption, setProsumerConsumption] = useState<number>(1.8);
  const [walletBalance, setWalletBalance] = useState<number>(3150000); // in COP
  const [gridFrequency, setGridFrequency] = useState<number>(60.0); // in Hz
  const [gridVoltage, setGridVoltage] = useState<number>(120); // in V
  const [peakDemandLimit, setPeakDemandLimit] = useState<number>(8.5); // kw

  // Invoicing and Pay states
  const [billingInvoice, setBillingInvoice] = useState<Invoice | null>(null);
  const [customCardName, setCustomCardName] = useState<string>('');
  const [customCardNumber, setCustomCardNumber] = useState<string>('');
  const [billingSuccess, setBillingSuccess] = useState<boolean>(false);

  // Forms states
  const [newCommunityName, setNewCommunityName] = useState<string>('');
  const [newCommunityLocation, setNewCommunityLocation] = useState<string>('');
  const [newCommunityAdmin, setNewCommunityAdmin] = useState<string>('');
  const [showAddCommunityModal, setShowAddCommunityModal] = useState<boolean>(false);

  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberRole, setNewMemberRole] = useState<'prosumer' | 'consumer'>('consumer');
  const [newMemberGeneration, setNewMemberGeneration] = useState<string>('0.0');
  const [newMemberConsumption, setNewMemberConsumption] = useState<string>('2.5');
  const [newMemberTariff, setNewMemberTariff] = useState<string>('480');
  const [showAddMemberModal, setShowAddMemberModal] = useState<boolean>(false);

  // Responsive and Selection States
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('WP-8821');
  const [newMemberCommunityId, setNewMemberCommunityId] = useState<string>('WP-8821');

  // Simulation parameters (Tickers to make energy dashboard live / interactive)
  useEffect(() => {
    const interval = setInterval(() => {
      // Minor fluctuations in voltage & frequency
      setGridFrequency(f => +(f + (Math.random() - 0.5) * 0.04).toFixed(3));
      setGridVoltage(v => +(v + (Math.random() - 0.5) * 0.5).toFixed(1));

      // Fluctuations in active consumption
      if (currentUser?.role === 'prosumer') {
        setProsumerConsumption(c => {
          const delta = (Math.random() - 0.5) * 0.15;
          return +(Math.max(0.5, Math.min(6.0, c + delta))).toFixed(2);
        });
        setProsumerGeneration(g => {
          const delta = (Math.random() - 0.45) * 0.2; // slight bias upwards
          return +(Math.max(3.0, Math.min(8.0, g + delta))).toFixed(2);
        });
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [currentUser]);

  // Handle Logins
  const handleLogin = (role: UserRole, username: string) => {
    setCurrentUser({ role, username });
    setView('portal');
    // Set appropriate initial tab based on role
    if (role === 'consumer' || role === 'prosumer') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('overview');
    }
  };

  const handleRegisterSuccess = (role: 'prosumer' | 'consumer', username: string) => {
    // Add registering user to standard member mock database
    const newM: CommunityMember = {
      id: `U-${Math.floor(100 + Math.random() * 900)}`,
      name: username.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Nuevo Usuario',
      role,
      status: 'ONLINE',
      generation: role === 'prosumer' ? 3.5 : 0.0,
      consumption: 1.8,
      tariff: 480,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    };
    setMembers(prev => [...prev, newM]);

    // Handle session auto login
    setCurrentUser({ role, username });
    setView('portal');
    setActiveTab('dashboard');

    // Add logging
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      title: 'Nuevo Registro',
      description: `Usuario ${username} se ha registrado en WePower como ${role}.`,
      timestamp: 'Justo ahora • Registro exitoso',
      type: 'health'
    };
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('login');
  };

  const handleSwitchRole = (role: UserRole) => {
    // Easily switch roles anywhere inside portal
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
      if (role === 'consumer' || role === 'prosumer') {
        setActiveTab('dashboard');
      } else {
        setActiveTab('overview');
      }
    }
  };

  // Toggle community alarm or emergency cutoff
  const handleTriggerEmergency = () => {
    setIsEmergencyActive(!isEmergencyActive);
    
    // Feed and notify inside logs
    const newLog: ActivityLog = {
      id: `act-${Date.now()}`,
      title: !isEmergencyActive ? 'CORTE GENERAL INICIADO' : 'CORTE GESTIONADO / RESTABLECIDO',
      description: !isEmergencyActive 
        ? 'Corte de emergencia de red aplicado preventivamente.'
        : 'Estado del sistema restaurado de manera segura.',
      timestamp: 'Ahora mismo • Sistema de Gestión',
      type: !isEmergencyActive ? 'alert' : 'health'
    };
    setLogs(prev => [newLog, ...prev]);
  };

  // Trigger tariff changes manually
  const updateTariffOfMember = (id: string, dynamicAdd: number) => {
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        const nextTariff = Math.max(100, m.tariff + dynamicAdd);
        return { ...m, tariff: nextTariff };
      }
      return m;
    }));
  };

  // Create new Virtual Community
  const handleCreateCommunity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommunityName || !newCommunityLocation) return;

    const newCode = `WP-${Math.floor(1000 + Math.random() * 9000)}`;
    const newC: Community = {
      id: newCode,
      name: newCommunityName,
      location: newCommunityLocation,
      status: 'OPTIMO',
      userCount: 0,
      efficiency: 100,
      adminName: newCommunityAdmin || 'Por asignar',
      adminEmail: `${(newCommunityAdmin || 'admin').toLowerCase().replace(/\s/g, '')}@wepower.com`
    };

    setCommunities([...communities, newC]);
    setNewCommunityName('');
    setNewCommunityLocation('');
    setNewCommunityAdmin('');
    setShowAddCommunityModal(false);

    // Register log
    setLogs(prev => [{
      id: `act-${Date.now()}`,
      title: `Comunidad creada: ${newC.name}`,
      description: `Código asignado ${newCode} en ${newC.location}.`,
      timestamp: 'Hace 1 min • Autorizado',
      type: 'health'
    }, ...prev]);
  };

  // Create local Community Member
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName) return;

    const targetCommunityId = newMemberCommunityId || selectedCommunityId || 'WP-8821';
    const newM: CommunityMember = {
      id: `U-0${members.length + 1}`,
      name: newMemberName,
      role: newMemberRole,
      status: 'ONLINE',
      generation: parseFloat(newMemberGeneration) || 0.0,
      consumption: parseFloat(newMemberConsumption) || 0.0,
      tariff: parseInt(newMemberTariff) || 480,
      avatarUrl: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 500000)}?w=150&auto=format&fit=crop&q=80`,
      communityId: targetCommunityId
    };

    setMembers([...members, newM]);
    setCommunities(prev => prev.map(c => {
      if (c.id === targetCommunityId) {
        return { ...c, userCount: (c.userCount || 0) + 1 };
      }
      return c;
    }));

    setNewMemberName('');
    setNewMemberGeneration('0.0');
    setNewMemberConsumption('2.5');
    setNewMemberTariff('480');
    setShowAddMemberModal(false);

    // Register log
    setLogs(prev => [{
      id: `act-${Date.now()}`,
      title: `Miembro añadido: ${newM.name}`,
      description: `Rol ${newM.role} registrado con tarifa base de COP ${newM.tariff}/kWh en la comunidad ${targetCommunityId}.`,
      timestamp: 'Ahora mismo • Gestión ID',
      type: 'sale'
    }, ...prev]);
  };

  // Pay single invoice
  const handlePayInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingInvoice) return;

    // Simulate payment deduction on wallet for high fidelity
    if (currentUser?.role === 'prosumer' || currentUser?.role === 'consumer') {
      if (walletBalance >= billingInvoice.total) {
        setWalletBalance(prev => prev - billingInvoice.total);
      }
    }

    setInvoices(prev => prev.map(inv => {
      if (inv.month === billingInvoice.month) {
        return { ...inv, status: 'Pagado' };
      }
      return inv;
    }));

    setBillingSuccess(true);
    setTimeout(() => {
      setBillingSuccess(false);
      setBillingInvoice(null);
      setCustomCardName('');
      setCustomCardNumber('');
    }, 1200);

    // Register log
    setLogs(prev => [{
      id: `act-${Date.now()}`,
      title: `Factura ${billingInvoice.month} Pagada`,
      description: `Pago procesado electrónicamente de COP ${billingInvoice.total.toLocaleString()} exitoso.`,
      timestamp: 'Hace unos instantes • Transacción PSE',
      type: 'payment'
    }, ...prev]);
  };

  // Calculations for KPI Cards
  const totalGeneracionComunidad = members.reduce((acc, m) => acc + m.generation, 0) + (currentUser?.role === 'prosumer' ? prosumerGeneration : 0);
  const totalConsumoComunidad = members.reduce((acc, m) => acc + m.consumption, 0) + (currentUser?.role === 'prosumer' || currentUser?.role === 'consumer' ? prosumerConsumption : 0);
  const totalCOPRecaudado = invoices.filter(inv => inv.status === 'Pagado').reduce((acc, inv) => acc + inv.total, 0);

  return (
    <div className="min-h-screen bg-[#07090d] text-[#e2e2e8] flex font-sans selection:bg-[#00dbe7]/30 selection:text-white">
      
      {/* Background Ambience / Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00dbe7]/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#1d5cff]/5 rounded-full blur-[100px]" />
        {isEmergencyActive && (
          <div className="absolute inset-0 bg-red-650/5 animate-pulse transition-all duration-1000 z-50 pointer-events-none" />
        )}
      </div>

      {/* LOGIN & REGISTER OUTER VIEWS */}
      {view !== 'portal' ? (
        <main className="w-full min-h-screen flex items-center justify-center py-12 relative z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0f1118] via-[#07090b] to-[#040508]">
          {view === 'login' && (
            <Login 
              onLogin={handleLogin} 
              onNavigateToRegister={() => setView('register')} 
            />
          )}
          {view === 'register' && (
            <Register 
              onBackToLogin={() => setView('login')} 
              onRegisterSuccess={handleRegisterSuccess} 
            />
          )}
        </main>
      ) : (
        /* INNER EXP command-center layout with standard left sidebar and clean panels */
        <div className="w-full flex">
          <Sidebar 
            currentRole={currentUser?.role || 'prosumer'} 
            username={currentUser?.username || 'Anónimo'} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={handleLogout}
            onSwitchRole={handleSwitchRole}
            onTriggerEmergency={handleTriggerEmergency}
            isEmergencyActive={isEmergencyActive}
            isSidebarOpen={isSidebarOpen}
            setIsSidebarOpen={setIsSidebarOpen}
          />

          {/* Sticky Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#07090d]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-40 select-none">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#00dbe7] flex items-center justify-center shrink-0">
                <Bolt className="text-[#002022] w-4.5 h-4.5 fill-[#002022]/10" />
              </div>
              <span className="font-sans font-bold text-base text-white tracking-tight">EcoCommand</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1 text-[#849495] hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          <main className="flex-1 lg:ml-64 min-h-screen p-6 sm:p-8 md:p-10 pt-24 lg:pt-10 relative z-10 overflow-x-hidden w-full max-w-full">
            
            {/* ALERT BOX if emergency is triggered */}
            {isEmergencyActive && (
              <div className="bg-[#560000] border border-red-500/60 p-4 rounded-xl mb-8 flex items-center justify-between shadow-[0_0_20px_rgba(255,0,0,0.3)] animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/20 rounded-lg text-red-200">
                    <AlertTriangle className="w-6 h-6 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-display font-medium text-white">RED FLAGEADA: Corte Energético en Curso</h4>
                    <p className="text-red-300 text-xs mt-1">El súper usuario o administrador comunitario ha dictado un reequilibrio prioritario. Limitando cargas reactivas externas.</p>
                  </div>
                </div>
                <div className="hidden sm:block font-mono text-xs bg-red-950/80 px-3 py-1 rounded border border-red-500/35">
                  FREQ_DROPPED: 0.00Hz
                </div>
              </div>
            )}

            {/* HEADER METRICS */}
            <header className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-white/5 mb-10 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#00dbe7]/15 border border-[#00dbe7]/30 text-[#00dbe7] text-[10px] font-mono uppercase tracking-wider font-semibold">
                    {currentUser?.role.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-[#849495]">• Portal de Autogestión</span>
                </div>
                <h2 className="text-3xl font-bold font-display tracking-tight text-white mt-1.5 flex items-center gap-2">
                  <span>¡Hola, {currentUser?.username || 'Energía Activa'}!</span>
                  <Sparkles className="w-5 h-5 text-[#00dbe7] animate-pulse" />
                </h2>
              </div>

              {/* Server Live Status Indicators */}
              <div className="flex flex-wrap items-center gap-4 bg-[#111318]/50 border border-white/5 p-3 rounded-xl">
                <div className="flex items-center gap-2 pr-4 border-r border-white/10">
                  <Activity className="w-4 h-4 text-[#00dbe7]" />
                  <span className="text-xs text-[#849495] font-mono">Simulador General: <strong className="text-[#00dbe7]">ACTIVO</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#849495]">Frecuencia Red</span>
                    <span className="text-xs font-bold font-mono text-white text-right">{gridFrequency} Hz</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-mono tracking-widest text-[#849495]">Voltaje Promedio</span>
                    <span className="text-xs font-bold font-mono text-white text-right">{gridVoltage} V</span>
                  </div>
                </div>
              </div>
            </header>

            {/* ========================================================= */}
            {/* PORTAL VIEW SWITCHER FOR DIFFERENT ROLE PERSPECTIVES */}
            {/* ========================================================= */}

            {/* A. SUPER ADMIN / GLOBAL GESTOR VIEW */}
            {currentUser?.role === 'super_admin' && (
              <div className="space-y-10">
                {activeTab === 'overview' && (
                  <>
                    {/* KEY STAT INDEX CARDS */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="backdrop-blur-xl bg-[#111318]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#849495] uppercase tracking-wider font-mono font-medium">Comunidades Conectadas</span>
                          <Building className="w-5 h-5 text-[#00dbe7]" />
                        </div>
                        <div className="mt-4 min-w-0">
                          <p className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-white font-display truncate">{communities.length}</p>
                          <p className="text-xs text-[#79ff5b] mt-1.5 flex items-center gap-1 font-mono">
                            <span>+100% de operatividad</span>
                          </p>
                        </div>
                      </div>

                      <div className="backdrop-blur-xl bg-[#111318]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#849495] uppercase tracking-wider font-mono font-medium">Capacidad de Interconexión</span>
                          <Zap className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div className="mt-4 min-w-0">
                          <p className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-white font-display truncate">{(totalGeneracionComunidad * 14.5).toFixed(1)} MW</p>
                          <p className="text-xs text-[#849495] mt-1.5 flex items-center gap-1 font-mono">
                            <span>Excedente inyección local</span>
                          </p>
                        </div>
                      </div>

                      <div className="backdrop-blur-xl bg-[#111318]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#849495] uppercase tracking-wider font-mono font-medium">Prosumidores Registrados</span>
                          <Users className="w-5 h-5 text-[#00dbe7]" />
                        </div>
                        <div className="mt-4 min-w-0">
                          <p className="text-2xl sm:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl font-bold text-white font-display truncate">
                            {members.filter(m => m.role === 'prosumer').length} Nodos
                          </p>
                          <p className="text-xs text-yellow-300 mt-1.5 flex items-center gap-1 font-mono">
                            <span>Aportando energía limpia</span>
                          </p>
                        </div>
                      </div>

                      <div className="backdrop-blur-xl bg-[#111318]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between" title={`$${totalCOPRecaudado.toLocaleString()} COP`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#849495] uppercase tracking-wider font-mono font-medium">Total Facturas Recaudado</span>
                          <DollarSign className="w-5 h-5 text-[#79ff5b]" />
                        </div>
                        <div className="mt-4 min-w-0">
                          <p className="text-xl sm:text-2xl lg:text-[18px] xl:text-2xl 2xl:text-3xl font-bold text-white font-display tracking-tight truncate">
                            ${totalCOPRecaudado.toLocaleString()} COP
                          </p>
                          <p className="text-xs text-[#79ff5b] mt-1.5 flex items-center gap-1 font-mono">
                            <span>Flujo constante</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* VIRTUALIZED COMMUNITIES LIST AND MAP */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      {/* Left: Interactive Communities */}
                      <div className="lg:col-span-7 backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                          <div>
                            <h3 className="text-xl font-bold text-white font-display">Comunidades Administradas</h3>
                            <p className="text-xs text-[#849495] mt-0.5">Control inteligente global de eficiencia en cada nodo geográfico.</p>
                          </div>
                          
                          <button 
                            onClick={() => setShowAddCommunityModal(true)}
                            className="bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(0,219,231,0.2)] transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Crear Comunidad</span>
                          </button>
                        </div>

                        {/* Community Grid */}
                        <div className="space-y-4">
                          {communities.map((c) => (
                            <div key={c.id} className="p-4 bg-[#0c0e12]/60 border border-white/5 rounded-xl hover:border-[#00dbe7]/35 transition-all flex flex-col xl:flex-row justify-between gap-4">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-lg bg-[#00dbe7]/10 border border-[#00dbe7]/20 flex items-center justify-center text-[#00dbe7] shrink-0 font-bold text-sm">
                                  {c.id.slice(3)}
                                </div>
                                <div className="text-left min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="font-semibold text-white text-base truncate">{c.name}</h4>
                                    <span className="font-mono text-[10px] text-[#849495] bg-white/5 px-1.5 py-0.5 rounded shrink-0">{c.id}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap mt-1 text-xs text-[#849495]">
                                    <span className="flex items-center gap-1 truncate">
                                      <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                      {c.location}
                                    </span>
                                    <span>•</span>
                                    <span className="shrink-0">{c.userCount || 12} usuarios directos</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between xl:justify-end gap-6 w-full xl:w-auto shrink-0 flex-wrap">
                                <div className="text-left xl:text-right">
                                  <p className="text-xs text-[#849495]">Eficiencia Solar</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-20 bg-white/5 h-1.5 rounded-full overflow-hidden shrink-0">
                                      <div className="bg-[#00dbe7] h-full" style={{ width: `${c.efficiency}%` }}></div>
                                    </div>
                                    <span className="text-xs font-bold font-mono text-white shrink-0">{c.efficiency}%</span>
                                  </div>
                                </div>

                                <div className="flex flex-col items-start xl:items-end shrink-0">
                                  <span className="text-[10px] text-[#849495] uppercase tracking-wider font-mono font-bold">Estado</span>
                                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded mt-1.5 ${
                                    c.status === 'OPTIMO' 
                                      ? 'bg-green-500/10 text-green-300 border border-green-500/20' 
                                      : c.status === 'ESTABLE' 
                                      ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                                      : 'bg-red-500/10 text-red-300 border border-red-500/20'
                                  }`}>
                                    {c.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Artificial Location Map Overlay */}
                      <div className="lg:col-span-5 backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white font-display">Mapa de Saturación Eléctrica</h3>
                          <p className="text-xs text-[#849495] mt-0.5">Nodos e inyecciones de las subredes en tiempo real.</p>
                        </div>

                        {/* Synthetic Map Graphic */}
                        <div className="my-6 relative bg-[#07090c] border border-white/5 h-64 rounded-xl overflow-hidden flex items-center justify-center p-4">
                          {/* Decorative grid */}
                          <div className="absolute inset-0 bg-gradient-to-br from-[#00dbe7]/5 to-[#1a6bff]/5 opacity-60 pointer-events-none" />
                          <div className="absolute inset-0" style={{ 
                            backgroundImage: 'radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)', 
                            backgroundSize: '20px 20px' 
                          }} />

                          {/* Nodes representation */}
                          <div className="absolute top-1/4 left-1/4 flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-green-400/20 border-2 border-green-400 animate-ping absolute" />
                            <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white relative z-10" />
                            <span className="text-[9px] font-mono mt-1 text-white bg-black/60 px-1 py-0.5 rounded leading-none">Valle Sol</span>
                          </div>

                          <div className="absolute top-1/2 right-1/3 flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-blue-400/20 border-2 border-blue-400 animate-ping absolute" />
                            <div className="w-4 h-4 rounded-full bg-cyan-400 border-2 border-white relative z-10" />
                            <span className="text-[9px] font-mono mt-1 text-white bg-black/60 px-1 py-0.5 rounded leading-none">Cantábrico</span>
                          </div>

                          <div className="absolute bottom-1/3 left-1/3 flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-yellow-400/20 border-2 border-yellow-400 animate-ping absolute" />
                            <div className="w-4 h-4 rounded-full bg-yellow-400 border-2 border-white relative z-10" />
                            <span className="text-[9px] font-mono mt-1 text-white bg-black/60 px-1 py-0.5 rounded leading-none">Sub-Centro</span>
                          </div>

                          <div className="absolute top-1/3 right-10 flex flex-col items-center">
                            <div className="w-4 h-4 rounded-full bg-red-400/20 border-2 border-red-400 animate-pulse absolute" />
                            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white relative z-10" />
                            <span className="text-[9px] font-mono mt-1 text-white bg-black/60 px-1 py-0.5 rounded leading-none">Alerta B-4</span>
                          </div>

                          {/* Center connection lines representation */}
                          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                            <line x1="25%" y1="25%" x2="33%" y2="66%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="5,5" />
                            <line x1="33%" y1="66%" x2="66%" y2="50%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="5,5" />
                            <line x1="66%" y1="50%" x2="25%" y2="25%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" strokeDasharray="5,5" />
                            <line x1="66%" y1="50%" x2="90%" y2="33%" stroke="rgba(239, 68, 68, 0.3)" strokeWidth="2" strokeDasharray="3,3" />
                          </svg>

                          <div className="absolute bottom-3 left-4 right-4 bg-black/75 rounded p-2 border border-white/5 text-center">
                            <p className="text-[10px] font-mono text-[#849495]">
                              Interconexión comunitaria dinámica activa. 4 subredes comunicadas.
                            </p>
                          </div>
                        </div>

                        {/* Interactive adjustments */}
                        <div className="space-y-4">
                          <div className="border-t border-white/5 pt-4">
                            <h4 className="text-xs font-mono text-[#b9cacb]/80 uppercase tracking-wider mb-2 font-semibold">Consumo Municipal Permisible</h4>
                            <div className="flex items-center gap-4 justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                              <span className="text-xs text-[#849495]">Límite de Red</span>
                              <input 
                                type="range" 
                                min="2" 
                                max="15" 
                                step="0.5"
                                value={peakDemandLimit}
                                onChange={(e) => setPeakDemandLimit(parseFloat(e.target.value))}
                                className="w-1/2 accent-[#00dbe7]"
                              />
                              <span className="text-xs font-mono font-bold text-white">{peakDemandLimit} kW</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'analytics' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white font-display">Simulador Core de Demanda y Generación</h3>
                      <p className="text-xs text-[#849495] mt-1">Comparativa en tiempo real de aporte solar vs consumo comunal inducido.</p>
                    </div>

                    {/* Highly stylized custom SVG Chart */}
                    <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-xl relative">
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className="w-3 h-3 rounded bg-[#00dbe7]"></span>
                            <span className="text-[#849495]">Generación total: <strong>{totalGeneracionComunidad.toFixed(1)} kW</strong></span>
                          </span>
                          <span className="flex items-center gap-1.5 text-xs">
                            <span className="w-3 h-3 rounded bg-[#ff7b5b]"></span>
                            <span className="text-[#849495]">Consumo total: <strong>{totalConsumoComunidad.toFixed(1)} kW</strong></span>
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-white/50 bg-[#00dbe7]/10 px-2 py-0.5 rounded border border-[#00dbe7]/20 uppercase">Tiempo real</span>
                      </div>

                      <div className="h-64 relative w-full overflow-hidden">
                        {/* Energy flow lines */}
                        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="cyan-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00dbe7" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#00dbe7" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="orange-gradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ff7b5b" stopOpacity="0.4" />
                              <stop offset="100%" stopColor="#ff7b5b" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Chart grid */}
                          <line x1="0" y1="50" x2="500" y2="50" stroke="rgba(255,255,255,0.05)" />
                          <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.05)" />
                          <line x1="0" y1="150" x2="500" y2="150" stroke="rgba(255,255,255,0.05)" />

                          {/* Path 1: Generación */}
                          <path 
                            d="M 0 160 Q 100 130 180 140 T 300 80 T 400 90 T 500 110 L 500 200 L 0 200 Z" 
                            fill="url(#cyan-gradient)" 
                          />
                          <path 
                            d="M 0 160 Q 100 130 180 140 T 300 80 T 400 90 T 500 110" 
                            fill="none" 
                            stroke="#00dbe7" 
                            strokeWidth="3" 
                          />

                          {/* Path 2: Consumo */}
                          <path 
                            d="M 0 120 Q 90 100 200 120 T 350 140 T 500 90 L 500 200 L 0 200 Z" 
                            fill="url(#orange-gradient)" 
                          />
                          <path 
                            d="M 0 120 Q 90 100 200 120 T 350 140 T 500 90" 
                            fill="none" 
                            stroke="#ff7b5b" 
                            strokeWidth="2.5" 
                            strokeDasharray="4,4"
                          />
                        </svg>

                        <div className="absolute top-2 left-2 text-[10px] font-mono text-[#849495]">Carga (kW)</div>
                        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#849495]">Horas (Simuladas)</div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 border-t border-white/5 pt-4 text-center">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#849495] font-mono">Eficiencia del Almacenamiento</p>
                          <p className="text-xl font-bold text-white font-display mt-0.5">91.8%</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#849495] font-mono">Generación Totalizada</p>
                          <p className="text-xl font-bold text-[#00dbe7] font-display mt-0.5">142 kWh</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#849495] font-mono">Pico de Autonomía</p>
                          <p className="text-xl font-bold text-green-300 font-display mt-0.5">14:00 Hrs</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#849495] font-mono">Carbono Mitigado</p>
                          <p className="text-xl font-bold text-cyan-300 font-display mt-0.5">18.4 Ton</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'communities' && (
                  <div className="space-y-8">
                    {/* Header Controls */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4 text-left">
                        <div>
                          <h3 className="text-2xl font-bold text-white font-display">Consorcio de Comunidades Solares</h3>
                          <p className="text-xs text-[#849495] mt-1">Tabla interactiva de control para registrar microrredes, seleccionar comunidades y asociar miembros activos.</p>
                        </div>
                        <button 
                          onClick={() => {
                            setNewMemberCommunityId(selectedCommunityId);
                            setShowAddCommunityModal(true);
                          }}
                          className="bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,219,231,0.2)] transition-all cursor-pointer self-start sm:self-center"
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <span>Crear Comunidad</span>
                        </button>
                      </div>

                      {/* Communities Table with selection */}
                      <div className="overflow-x-auto w-full rounded-xl border border-white/10 bg-[#0c0e12]/60">
                        <table className="w-full text-left font-sans text-sm min-w-[750px]">
                          <thead>
                            <tr className="border-b border-white/10 text-[#849495] text-xs font-mono uppercase tracking-wider bg-white/5">
                              <th className="py-3 px-4">Identificador</th>
                              <th className="py-3 px-2">Comunidad</th>
                              <th className="py-3 px-2">Ubicación</th>
                              <th className="py-3 px-2">Eficiencia solar</th>
                              <th className="py-3 px-2 text-center">Nodos asignados</th>
                              <th className="py-3 px-2">Estado de red</th>
                              <th className="py-3 px-4 text-right">Acción</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {communities.map((c) => {
                              const isSelected = selectedCommunityId === c.id;
                              const cMembersCount = members.filter(m => m.communityId === c.id).length;
                              return (
                                <tr 
                                  key={c.id} 
                                  onClick={() => setSelectedCommunityId(c.id)}
                                  className={`hover:bg-white/5 transition-all cursor-pointer ${
                                    isSelected ? 'bg-[#00dbe7]/5 border-l-2 border-[#00dbe7]' : ''
                                  }`}
                                >
                                  <td className="py-4 px-4 font-mono font-medium">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                      isSelected ? 'bg-[#00dbe7]/20 text-[#00dbe7]' : 'bg-white/5 text-[#849495]'
                                    }`}>
                                      {c.id}
                                    </span>
                                  </td>
                                  <td className="py-4 px-2 font-semibold text-white">{c.name}</td>
                                  <td className="py-4 px-2 text-xs text-[#b9cacb]/80">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                                      {c.location}
                                    </span>
                                  </td>
                                  <td className="py-4 px-2">
                                    <div className="flex items-center gap-2">
                                      <div className="w-16 bg-white/5 h-1.5 rounded-full overflow-hidden shrink-0">
                                        <div className="bg-[#00dbe7] h-full" style={{ width: `${c.efficiency}%` }} />
                                      </div>
                                      <span className="text-xs font-mono font-bold text-white">{c.efficiency}%</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-2 text-center font-mono text-sm text-white font-bold">
                                    {cMembersCount}
                                  </td>
                                  <td className="py-4 px-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                      c.status === 'OPTIMO' 
                                        ? 'bg-green-500/10 text-green-300 border border-green-500/20' 
                                        : c.status === 'ESTABLE' 
                                        ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' 
                                        : 'bg-red-500/10 text-red-300 border border-red-500/20'
                                    }`}>
                                      {c.status}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4 text-right text-white">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCommunityId(c.id);
                                      }}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                                        isSelected 
                                          ? 'bg-[#00dbe7] text-[#002022] shadow-[0_0_10px_rgba(0,219,231,0.3)]' 
                                          : 'bg-white/5 text-[#849495] hover:text-white border border-white/5 hover:border-white/10'
                                      }`}
                                    >
                                      {isSelected ? 'Gestionando' : 'Seleccionar'}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Divided section: Selected Community Active Panel & Add Member Form */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                      {/* Selected Community Active Members */}
                      <div className="lg:col-span-8 backdrop-blur-xl bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl flex flex-col justify-between">
                        {(() => {
                          const currentComm = communities.find(c => c.id === selectedCommunityId) || communities[0];
                          const commMembers = members.filter(m => m.communityId === selectedCommunityId);

                          return (
                            <>
                              <div>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                                  <div>
                                    <h4 className="text-xl font-bold text-white font-display flex items-baseline gap-2">
                                      <span>Nodos de: <strong>{currentComm?.name || 'Valle del Sol'}</strong></span>
                                      <span className="text-xs text-[#849495] font-mono">({currentComm?.id || 'WP-8821'})</span>
                                    </h4>
                                    <p className="text-xs text-[#849495] mt-0.5">Asociados activos que consumen o inyectan energía solar en esta subred.</p>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      setNewMemberCommunityId(currentComm?.id || 'WP-8821');
                                      setShowAddMemberModal(true);
                                    }}
                                    className="bg-[#00dbe7]/15 hover:bg-[#00dbe7]/25 text-[#00dbe7] border border-[#00dbe7]/30 font-semibold px-3 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer self-start sm:self-center"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Agregar Miembro</span>
                                  </button>
                                </div>

                                {commMembers.length === 0 ? (
                                  <div className="py-12 px-4 rounded-xl bg-[#0c0e12]/60 border border-white/5 text-center flex flex-col items-center justify-center space-y-3">
                                    <Users className="w-10 h-10 text-white/20" />
                                    <p className="text-sm text-white font-medium">No hay miembros asociados</p>
                                    <p className="text-xs text-[#849495] max-w-sm">Esta comunidad virtual de red inteligente está vacía. ¡Asocia nuevos prosumidores o consumidores para inicializar los balances!</p>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto w-full rounded-xl border border-white/5 bg-[#0c0e12]/60">
                                    <table className="w-full text-left font-sans text-sm min-w-[550px]">
                                      <thead>
                                        <tr className="border-b border-white/10 text-[#849495] text-[10px] font-mono uppercase tracking-wider bg-white/5">
                                          <th className="py-2 px-3">Miembro</th>
                                          <th className="py-2 px-2">Rol</th>
                                          <th className="py-2 px-2">Generación</th>
                                          <th className="py-2 px-2">Consumo</th>
                                          <th className="py-2 px-3 text-right">Tarifa</th>
                                          <th className="py-2 px-2 text-center">Estado</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-white/5">
                                        {commMembers.map((m) => (
                                          <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-3 flex items-center gap-2.5">
                                              <img src={m.avatarUrl} alt={m.name} className="w-7 h-7 rounded-full border border-white/15" referrerPolicy="no-referrer" />
                                              <div>
                                                <p className="font-semibold text-white text-xs">{m.name}</p>
                                                <span className="text-[9px] font-mono text-[#849495]">{m.id}</span>
                                              </div>
                                            </td>
                                            <td className="py-3 px-2">
                                              <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-bold ${
                                                m.role === 'prosumer' 
                                                  ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/15' 
                                                  : 'bg-cyan-500/10 text-[#00dbe7] border border-[#00dbe7]/15'
                                              }`}>
                                                {m.role}
                                              </span>
                                            </td>
                                            <td className="py-3 px-2 font-mono text-xs text-white">{m.generation} kW</td>
                                            <td className="py-3 px-2 font-mono text-xs text-[#ff7b5b]">{m.consumption} kW</td>
                                            <td className="py-3 px-3 font-mono text-xs text-white text-right font-medium">${m.tariff} COP</td>
                                            <td className="py-3 px-2 text-center">
                                              <span className={`w-2 h-2 rounded-full inline-block ${
                                                m.status === 'ONLINE' ? 'bg-[#79ff5b] animate-pulse shadow-[0_0_6px_rgba(121,255,91,0.5)]' : 'bg-white/15'
                                              }`} title={m.status} />
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>

                              <div className="border-t border-white/5 pt-4 mt-6 text-xs text-[#849495] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="flex items-center gap-1 text-xs">
                                  <Info className="w-3.5 h-3.5 text-[#00dbe7]" />
                                  <span>Administrador Asignado: <strong>{currentComm?.adminName || 'Ana María Gómez'}</strong> ({currentComm?.adminEmail})</span>
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Right Panel: Member Fast Association Form embedded */}
                      <div className="lg:col-span-4 backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                        {(() => {
                          const currentComm = communities.find(c => c.id === selectedCommunityId) || communities[0];
                          return (
                            <>
                              <div>
                                <h4 className="text-lg font-bold text-white font-display mb-1 flex items-center gap-1.5">
                                  <UserPlus className="text-[#00dbe7] w-5 h-5 block" />
                                  <span>Asociación Directa</span>
                                </h4>
                                <p className="text-xs text-[#849495] mb-5">Agrega dinámicamente un nodo a la microrred de <strong>{currentComm?.name || 'Valle del Sol'}</strong>.</p>

                                <form onSubmit={(e) => {
                                  e.preventDefault();
                                  setNewMemberCommunityId(selectedCommunityId);
                                  handleCreateMember(e);
                                }} className="space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-[#b9cacb]/80 uppercase block">Nombre Completo</label>
                                    <input 
                                      type="text" 
                                      value={newMemberName}
                                      onChange={(e) => setNewMemberName(e.target.value)}
                                      placeholder="Ej. Roberto Rivera"
                                      required
                                      className="w-full px-3 py-2 bg-[#07090c] border border-white/5 rounded-xl text-xs text-white"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-[#b9cacb]/80 uppercase block">Tipo de Inyección</label>
                                    <select 
                                      value={newMemberRole}
                                      onChange={(e) => {
                                        const nextR = e.target.value as 'prosumer' | "consumer";
                                        setNewMemberRole(nextR);
                                        if (nextR === 'consumer') setNewMemberGeneration('0.0');
                                      }}
                                      className="w-full px-3 py-2 bg-[#07090c] border border-white/5 rounded-xl text-xs text-white"
                                    >
                                      <option value="consumer">Consumidor (Solo consume)</option>
                                      <option value="prosumer">Prosumidor (Paneles solares)</option>
                                    </select>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-mono text-[#b9cacb]/80 uppercase block">Generación (kW)</label>
                                      <input 
                                        type="text" 
                                        value={newMemberGeneration}
                                        onChange={(e) => setNewMemberGeneration(e.target.value)}
                                        disabled={newMemberRole === 'consumer'}
                                        placeholder="0.0"
                                        className="w-full px-3 py-2 bg-[#07090c] border border-white/5 rounded-xl text-xs text-white disabled:opacity-40"
                                      />
                                    </div>

                                    <div className="space-y-1">
                                      <label className="text-[10px] font-mono text-[#b9cacb]/80 uppercase block">Consumo (kW)</label>
                                      <input 
                                        type="text" 
                                        value={newMemberConsumption}
                                        onChange={(e) => setNewMemberConsumption(e.target.value)}
                                        required
                                        placeholder="2.5"
                                        className="w-full px-3 py-2 bg-[#07090c] border border-white/5 rounded-xl text-xs text-white"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-mono text-[#b9cacb]/80 uppercase block">Tarifa COP/kWh</label>
                                    <input 
                                      type="number" 
                                      value={newMemberTariff}
                                      onChange={(e) => setNewMemberTariff(e.target.value)}
                                      required
                                      placeholder="480"
                                      className="w-full px-3 py-2 bg-[#07090c] border border-white/5 rounded-xl text-xs text-white"
                                    />
                                  </div>

                                  <button
                                    type="submit"
                                    className="w-full py-2.5 bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-semibold rounded-xl text-xs uppercase duration-200 transition-all shadow-[0_0_12px_rgba(0,219,231,0.25)] flex items-center justify-center gap-1 mt-4 cursor-pointer"
                                  >
                                    <UserPlus className="w-4 h-4 shrink-0" />
                                    <span>Vincular Asociado</span>
                                  </button>
                                </form>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'grid_control' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white font-display">Control General del Grid</h3>
                      <p className="text-xs text-[#849495] mt-1">Interrupción remota y estabilización dinámica del flujo energético.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                      <div className="space-y-6">
                        <div className="p-6 bg-[#0c0e12]/60 border border-white/5 rounded-xl">
                          <h4 className="font-semibold text-white font-display mb-2 flex items-center gap-2">
                            <Radio className="text-[#00dbe7] w-5 h-5 animate-pulse" />
                            <span>Controlador Inteligente de Red</span>
                          </h4>
                          <p className="text-xs text-[#849495] mb-6">Elige el umbral operativo del inversor central de microrredes.</p>

                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-xs text-[#b9cacb] mb-1.5">
                                <span>Frecuencia Máxima Tolerada</span>
                                <span className="font-mono text-white">61.5 Hz</span>
                              </div>
                              <input type="range" className="w-full accent-[#00dbe7]" defaultValue="75" />
                            </div>

                            <div>
                              <div className="flex justify-between text-xs text-[#b9cacb] mb-1.5">
                                <span>Voltaje Límite de Inyección</span>
                                <span className="font-mono text-white">132 V</span>
                              </div>
                              <input type="range" className="w-full accent-[#00dbe7]" defaultValue="65" />
                            </div>
                          </div>
                        </div>

                        <div className="p-6 bg-[#0c0e12]/60 border border-white/5 rounded-xl">
                          <h4 className="font-semibold text-white font-display mb-2 flex items-center gap-2">
                            <AlertTriangle className="text-red-400 w-5 h-5" />
                            <span>Deslastre de Carga Planificado</span>
                          </h4>
                          <p className="text-xs text-[#849495] mb-4">Interrumpe el suministro a cargas industriales prescindibles en caso de picos agudos de demanda.</p>
                          <button 
                            type="button"
                            onClick={() => {
                              alert('Simulado: Orden de deslastre de carga para áreas comerciales enviada con éxito.');
                              const newLog: ActivityLog = {
                                id: `act-${Date.now()}`,
                                title: 'Deslastre de carga selectivo',
                                description: 'Sistema redujo carga en Nodos Comerciales un 15% preventivamente.',
                                timestamp: 'Justo ahora • Automatizado',
                                type: 'alert'
                              };
                              setLogs(prev => [newLog, ...prev]);
                            }}
                            className="text-xs bg-red-500/10 text-red-300 font-semibold border border-red-500/30 px-4 py-2.5 rounded-lg hover:bg-red-500/20 transition-all cursor-pointer"
                          >
                            Forzar Deslastre de Carga Temporal
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-[#0c0e12]/60 border border-white/5 rounded-xl flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-white font-display mb-2">Simulador de Anomalías de Red</h4>
                          <p className="text-xs text-[#849495] mb-6">Inyecta fallos sintéticos para medir el tiempo de auto-recuperación local.</p>

                          <div className="space-y-4">
                            <button 
                              onClick={() => {
                                alert('Inyectando Micro-falla: Simulación de caída momentánea de tensión. Voltaje baja a 98V por 3s.');
                                setGridVoltage(98.1);
                                setGridFrequency(58.2);
                                setTimeout(() => {
                                  setGridVoltage(120.4);
                                  setGridFrequency(60.01);
                                  alert('Sistema auto-restablecido con éxito.');
                                }, 3000);
                              }}
                              className="w-full bg-white/5 border border-white/5 hover:border-[#00dbe7]/30 text-xs font-semibold py-3.5 px-4 rounded-xl text-left transition-all hover:bg-white/10 flex items-center justify-between"
                            >
                              <span>Micro-caída de tensión</span>
                              <span className="text-[10px] font-mono text-amber-300">Inyectar</span>
                            </button>

                            <button 
                              onClick={() => {
                                alert('Inyectando Desfase: Armónicos de frecuencia superan límites tolerables.');
                                setGridFrequency(63.22);
                                setTimeout(() => {
                                  setGridFrequency(60.0);
                                  alert('Arrepentimiento armónico filtrado.');
                                }, 3000);
                              }}
                              className="w-full bg-white/5 border border-white/5 hover:border-[#00dbe7]/30 text-xs font-semibold py-3.5 px-4 rounded-xl text-left transition-all hover:bg-white/10 flex items-center justify-between"
                            >
                              <span>Distorsión Armónica Superior</span>
                              <span className="text-[10px] font-mono text-red-300">Inyectar</span>
                            </button>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-6 mt-6">
                          <p className="text-xs text-[#849495] leading-normal font-mono">
                            * El motor WePower auto-aisla anomalías graves en &lt; 200 milisegundos a través de interruptores de transferencia automáticos comunitarios.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl text-left">
                    <h3 className="text-xl font-bold text-white font-display mb-2">Configuración General de Planta</h3>
                    <p className="text-xs text-[#849495] mb-6">Ajuste de parámetros nucleares para la generación distribuida.</p>

                    <div className="space-y-6 max-w-xl">
                      <div className="space-y-2">
                        <label className="text-xs font-mono text-[#b9cacb]/80 uppercase font-semibold">API Endpoint de Conexión del Grid</label>
                        <input type="text" className="w-full px-4 py-3 bg-[#0c0e12]/50 border border-white/5 rounded-xl text-sm" defaultValue="https://api.grid.wepower.com/v4/nodes/WE-8821" readOnly />
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono text-[#b9cacb]/80 uppercase font-semibold">Modo de Distribución de Excedentes</label>
                        <select className="w-full px-4 py-3 bg-[#0c0e12]/50 border border-white/5 rounded-xl text-sm text-white">
                          <option>Aportación Cooperativa Directa (Pro-rata)</option>
                          <option>Subasta de Carga Exponencial</option>
                          <option>Inyección Total de Red Secundaria</option>
                        </select>
                      </div>

                      <button 
                        onClick={() => alert('Parámetros guardados con éxito en la memoria del consorcio WePower.')}
                        className="bg-[#00dbe7] text-[#002022] font-bold px-6 py-3 rounded-xl text-xs hover:shadow-[0_0_15px_rgba(0,219,231,0.3)] transition-all uppercase tracking-wider cursor-pointer"
                      >
                        Guardar Configuración General
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* B. COMMUNITY ADMIN VIEW */}
            {currentUser?.role === 'admin' && (
              <div className="space-y-10">
                
                {/* KEY STATUS STATCARDS */}
                {activeTab === 'overview' && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="backdrop-blur-xl bg-[#111318]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#849495] uppercase tracking-wider font-mono font-medium">Asociados en Red</span>
                          <Users className="w-5 h-5 text-[#00dbe7]" />
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold text-white font-display">{members.length}</p>
                          <p className="text-xs text-[#79ff5b] mt-1.5 flex items-center gap-1 font-mono">
                            <span>Todos en línea</span>
                          </p>
                        </div>
                      </div>

                      <div className="backdrop-blur-xl bg-[#111318]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#849495] uppercase tracking-wider font-mono font-medium">Generación Activa Local</span>
                          <Sun className="w-5 h-5 text-yellow-500 animate-pulse" />
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold text-white font-display">{totalGeneracionComunidad.toFixed(1)} kW</p>
                          <p className="text-xs text-[#79ff5b] mt-1.5 flex items-center gap-1 font-mono">
                            <span>Aporte de prosumidores</span>
                          </p>
                        </div>
                      </div>

                      <div className="backdrop-blur-xl bg-[#111318]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#849495] uppercase tracking-wider font-mono font-medium">Demanda Total Registrada</span>
                          <Zap className="w-5 h-5 text-[#00dbe7]" />
                        </div>
                        <div className="mt-4">
                          <p className="text-3xl font-bold text-white font-display">{totalConsumoComunidad.toFixed(1)} kW</p>
                          <p className="text-xs text-yellow-300 mt-1.5 flex items-center gap-1 font-mono">
                            <span>Suministro equilibrado</span>
                          </p>
                        </div>
                      </div>

                      <div className="backdrop-blur-xl bg-[#111318]/40 border border-white/5 p-6 rounded-2xl flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#849495] uppercase tracking-wider font-mono font-medium">Balance Neto del Grid</span>
                          <TrendingUp className="w-5 h-5 text-cyan-400" />
                        </div>
                        <div className="mt-4">
                          <p className={`text-3xl font-bold font-display ${totalGeneracionComunidad - totalConsumoComunidad >= 0 ? 'text-[#79ff5b]' : 'text-yellow-400'}`}>
                            {(totalGeneracionComunidad - totalConsumoComunidad).toFixed(1)} kW
                          </p>
                          <p className="text-xs text-[#849495] mt-1.5 flex items-center gap-1 font-mono">
                            <span>{totalGeneracionComunidad - totalConsumoComunidad >= 0 ? 'Superávit ecológico' : 'Consumo secundario'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* MANAGE TARIFF ADJUSTMENT AND LIST OF CLIENTS */}
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-white font-display text-left">Miembros y Auditoría Tarifaria</h3>
                          <p className="text-xs text-[#849495] mt-0.5 text-left">Asigna tarifas dinámicas personalizadas expresadas en COP / kWh.</p>
                        </div>
                        
                        <button 
                          onClick={() => setShowAddMemberModal(true)}
                          className="bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-semibold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all self-start sm:self-center cursor-pointer shadow-[0_0_15px_rgba(0,219,231,0.2)]"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>Asociar Nuevo Miembro</span>
                        </button>
                      </div>

                      {/* Members List with adjust price controller */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-sans text-sm min-w-[600px]">
                          <thead>
                            <tr className="border-b border-white/10 text-[#849495] text-xs font-mono uppercase tracking-wider">
                              <th className="pb-3 pl-4">Miembro</th>
                              <th className="pb-3">Rol</th>
                              <th className="pb-3">Generación</th>
                              <th className="pb-3">Consumo</th>
                              <th className="pb-3 text-right pr-4">Tarifa Asignada</th>
                              <th className="pb-3 text-center pr-4">Ajustar COP/kWh (Acciones)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                            {members.map((member) => (
                              <tr key={member.id} className="hover:bg-white/5 transition-all">
                                <td className="py-4 pl-4 flex items-center gap-3">
                                  <img src={member.avatarUrl} alt={member.name} className="w-8 h-8 rounded-full border border-white/15" referrerPolicy="no-referrer" />
                                  <div>
                                    <p className="font-semibold text-white">{member.name}</p>
                                    <span className="text-[10px] font-mono text-[#849495] bg-white/5 px-1 py-0.5 rounded">{member.id}</span>
                                  </div>
                                </td>
                                <td className="py-4">
                                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded font-bold ${
                                    member.role === 'prosumer' 
                                      ? 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/15' 
                                      : 'bg-cyan-500/10 text-[#00dbe7] border border-[#00dbe7]/15'
                                  }`}>
                                    {member.role}
                                  </span>
                                </td>
                                <td className="py-4 font-mono text-white">{member.generation} kW</td>
                                <td className="py-4 font-mono text-[#ff7b5b]">{member.consumption} kW</td>
                                <td className="py-4 font-mono text-right font-bold text-white pr-4">
                                  ${member.tariff} COP
                                </td>
                                <td className="py-4 text-center pr-4">
                                  <div className="inline-flex gap-1.5 justify-center">
                                    <button 
                                      onClick={() => {
                                        updateTariffOfMember(member.id, -15);
                                        // Logging
                                        setLogs(prev => [{
                                          id: `act-${Date.now()}`,
                                          title: 'Tarifa Disminuida',
                                          description: `Se redujo la tarifa de ${member.name} a COP/kWh.`,
                                          timestamp: 'Justo ahora • Verificador administrativo',
                                          type: 'sale'
                                        }, ...prev]);
                                      }}
                                      className="px-2 py-1 bg-[#79ff5b]/10 hover:bg-[#79ff5b]/20 text-[#79ff5b] font-bold text-xs rounded border border-[#79ff5b]/15 transition-all outline-none cursor-pointer"
                                    >
                                      -15 COP
                                    </button>
                                    <button 
                                      onClick={() => {
                                        updateTariffOfMember(member.id, 15);
                                        // Logging
                                        setLogs(prev => [{
                                          id: `act-${Date.now()}`,
                                          title: 'Tarifa Incrementada',
                                          description: `Se aumentó la tarifa de ${member.name} a COP/kWh.`,
                                          timestamp: 'Justo ahora • Verificador administrativo',
                                          type: 'alert'
                                        }, ...prev]);
                                      }}
                                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-[#ffb4ab] font-bold text-xs rounded border border-red-500/15 transition-all outline-none cursor-pointer"
                                    >
                                      +15 COP
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'tariffs' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl text-left">
                    <h3 className="text-xl font-bold text-white font-display mb-2">Simulador de Tarifas Adaptativas</h3>
                    <p className="text-xs text-[#849495] mb-6">Reglas de negocio inteligentes para fluctuaciones del precio comunitario.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="p-5 bg-[#0c0e12]/60 border border-white/5 rounded-xl">
                          <h4 className="font-semibold text-white font-display mb-2">Tarificación por Exceso de Oferta</h4>
                          <p className="text-xs text-[#849495] mb-4">
                            Si la producción solar comunal supera la demanda en un 20%, reduce la tarifa automáticamente a los consumidores.
                          </p>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded bg-white/5 border-white/10 text-[#00dbe7] focus:ring-[#00dbe7]" />
                            <span className="text-xs text-white">Activar reducción automática (-25% COP/kWh)</span>
                          </label>
                        </div>

                        <div className="p-5 bg-[#0c0e12]/60 border border-white/5 rounded-xl">
                          <h4 className="font-semibold text-white font-display mb-2">Tarificación penalizable por Pico Máximo</h4>
                          <p className="text-xs text-[#849495] mb-4">
                            Aplica recargos a consumidores que excedan más de 4.0 kW individuales durante intervalos sin inyección fotovoltaica.
                          </p>
                          <label className="flex items-center space-x-3 cursor-pointer">
                            <input type="checkbox" defaultChecked className="rounded bg-white/5 border-white/10 text-[#00dbe7] focus:ring-[#00dbe7]" />
                            <span className="text-xs text-white">Activar recargo de pico (+80 COP/kWh)</span>
                          </label>
                        </div>
                      </div>

                      <div className="p-5 bg-[#0c0e12]/60 border border-white/5 rounded-xl flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-[#00dbe7] font-mono uppercase tracking-wider text-xs mb-3">Recomendación WePower</h4>
                          <div className="bg-[#00dbe7]/5 border border-[#00dbe7]/15 rounded-lg p-4 space-y-4">
                            <div className="flex gap-3">
                              <Info className="w-5 h-5 text-[#00dbe7] shrink-0 mt-0.5" />
                              <p className="text-xs text-[#b9cacb] leading-relaxed">
                                Se proyecta un incremento del 15% en radiación solar total para los próximos 3 días. Considere reducir las tarifas de fomento voluntario para evitar saturar el excedente en subestaciones sin almacenamiento térmico.
                              </p>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => alert('Simulado: Algoritmo de Tarificación Adaptativa activado en el nodo.')}
                          className="w-full bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-bold py-3.5 rounded-xl text-xs transition-all uppercase mt-6 cursor-pointer"
                        >
                          Sincronizar Inteligencia de Tarifas
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'communities' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl text-left">
                    <h3 className="text-xl font-bold text-white font-display mb-2">Consumo Agregado y Sub-Nodos</h3>
                    <p className="text-xs text-[#849495] mb-6">Detalles de la subred local administrada.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-5 bg-[#0c0e12]/60 border border-white/5 rounded-xl">
                        <span className="text-[10px] font-mono text-[#849495] uppercase">Indice de Carbono Mitigado</span>
                        <p className="text-2xl font-bold text-green-300 font-display mt-1">4.8 Ton/mes</p>
                        <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
                          <div className="bg-green-400 h-full w-4/5"></div>
                        </div>
                      </div>

                      <div className="p-5 bg-[#0c0e12]/60 border border-white/5 rounded-xl">
                        <span className="text-[10px] font-mono text-[#849495] uppercase">Inyección de Emergencia</span>
                        <p className="text-2xl font-bold text-yellow-400 font-display mt-1">Habilitada (Baterías)</p>
                        <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
                          <div className="bg-yellow-400 h-full w-2/3"></div>
                        </div>
                      </div>

                      <div className="p-5 bg-[#0c0e12]/60 border border-white/5 rounded-xl">
                        <span className="text-[10px] font-mono text-[#849495] uppercase">Demanda de Red Externa</span>
                        <p className="text-2xl font-bold text-[#ff7b5b] font-display mt-1">1.2 kW (Mínimo)</p>
                        <div className="w-full bg-white/5 h-1 mt-4 rounded-full overflow-hidden">
                          <div className="bg-[#ff7b5b] h-full w-1/5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* C. PROSUMER VIEW */}
            {currentUser?.role === 'prosumer' && (
              <div className="space-y-10">
                
                {/* INTERACTIVE STATE CONTROLS AND MULTI-STATS */}
                {activeTab === 'dashboard' && (
                  <>
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Interactive Gen slider */}
                      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between text-left">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase font-mono tracking-wider text-[#849495]">Paneles Fotovoltaicos</span>
                            <div className="px-2 py-0.5 rounded bg-yellow-500/15 border border-yellow-500/25 text-yellow-300 text-[10px] font-mono">Simulado</div>
                          </div>
                          <h4 className="text-2xl font-bold text-white font-display flex items-baseline gap-1.5">
                            <span>{prosumerGeneration} kW</span>
                            <span className="text-xs text-[#849495] font-normal">Active Gen</span>
                          </h4>
                        </div>

                        <div className="mt-6 space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1 bg-transparent">
                              <span className="text-[#849495]">Arreglos e Inclinación Solar</span>
                              <span className="font-mono text-white text-right">Óptimo</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="12" 
                              step="0.1" 
                              value={prosumerGeneration} 
                              onChange={(e) => setProsumerGeneration(parseFloat(e.target.value))}
                              className="w-full accent-[#00dbe7]" 
                            />
                          </div>
                          <p className="text-[10px] text-[#849495] leading-normal font-mono">* Mueve este slider para simular una mayor generación de tus paneles.</p>
                        </div>
                      </div>

                      {/* Interactive Cons slider */}
                      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between text-left">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase font-mono tracking-wider text-[#849495]">Simulador de Demanda Interna</span>
                            <div className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/25 text-[#00dbe7] text-[10px] font-mono">Consumo</div>
                          </div>
                          <h4 className="text-2xl font-bold text-white font-display flex items-baseline gap-1.5">
                            <span className="text-red-300">{prosumerConsumption} kW</span>
                            <span className="text-xs text-[#849495] font-normal">Carga Actual</span>
                          </h4>
                        </div>

                        <div className="mt-6 space-y-4">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1 bg-transparent">
                              <span className="text-[#849495]">Simulación de Carga Hogar</span>
                              <span className="font-mono text-white text-right">Variando</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.2" 
                              max="8" 
                              step="0.1" 
                              value={prosumerConsumption} 
                              onChange={(e) => setProsumerConsumption(parseFloat(e.target.value))}
                              className="w-full accent-cyan-400" 
                            />
                          </div>
                          <p className="text-[10px] text-[#849495] leading-normal font-mono">* Simule encender electrodomésticos para aumentar tu consumo doméstico.</p>
                        </div>
                      </div>

                      {/* virtual wallet statcard */}
                      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#79ff5b]/5 rounded-full blur-2xl pointer-events-none" />
                        <div>
                          <span className="text-xs uppercase font-mono tracking-wider text-[#849495] block mb-2">Billetera de Energía (WPC Credits)</span>
                          <h4 className="text-3xl font-bold text-green-300 font-display">${walletBalance.toLocaleString()} COP</h4>
                          <p className="text-xs text-[#849495] mt-1 font-mono">Excedentes vendidos revalidados en efectivo.</p>
                        </div>

                        <div className="mt-6 border-t border-white/5 pt-4 flex gap-2">
                          <button 
                            onClick={() => {
                              alert('Traspaso solicitado: Transfiriendo fondos a tu cuenta bancaria asociada. Proceso PSE verificado.');
                              setWalletBalance(0);
                            }}
                            className="flex-1 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/25 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer"
                          >
                            Retirar Fondos COP
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* DYNAMIC REACTIVE ANIMATED PERFORMANCE GRAPHICS */}
                    <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left">
                      {/* Animated Solar Energy Flow Chart */}
                      <div className="lg:col-span-8 backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white font-display">Reactor de Transferencia de Energía</h3>
                          <p className="text-xs text-[#849495] mt-0.5">Demostración interactiva de exportación solar en tiempo real.</p>
                        </div>

                        {/* Interactive particles or flow mockup */}
                        <div className="my-8 bg-[#0c0e14] border border-white/5 rounded-xl p-6 relative overflow-hidden h-48 flex items-center justify-around">
                          {/* Solar panels vector mockup */}
                          <div className="flex flex-col items-center relative z-10">
                            <div className="w-16 h-16 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400">
                              <Sun className="w-8 h-8 animate-spin" style={{ animationDuration: '24s' }} />
                            </div>
                            <span className="text-xs font-mono font-medium text-white mt-2">Paneles Solares</span>
                            <span className="text-[10px] font-mono text-[#849495] mt-0.5">{prosumerGeneration} kW</span>
                          </div>

                          {/* Dynamic Transfer Arrow and status indicator */}
                          <div className="flex flex-col items-center flex-1 max-w-[140px] px-2 text-center relative">
                            <span className={`text-[10px] font-semibold px-2 py-1.5 rounded-full font-mono ${
                              prosumerGeneration - prosumerConsumption >= 0 
                                ? 'bg-green-500/10 text-green-300 border border-green-500/15' 
                                : 'bg-[#ff7b5b]/10 text-[#ff7b5b] border border-[#ff7b5b]/15'
                            }`}>
                              {prosumerGeneration - prosumerConsumption >= 0 
                                ? `+${(prosumerGeneration - prosumerConsumption).toFixed(1)} kW Exportados` 
                                : `${(prosumerGeneration - prosumerConsumption).toFixed(1)} kW Importados`}
                            </span>

                            {/* Arrow connection */}
                            <div className="w-full flex items-center justify-center mt-4">
                              <div className="h-[2px] bg-white/15 w-full relative">
                                <div className={`w-3 h-3 rounded-full absolute -top-1 blur-[1px] ${
                                  prosumerGeneration - prosumerConsumption >= 0 
                                    ? 'bg-[#00dbe7] left-0 animate-[ping_1.5s_infinite_linear]' 
                                    : 'bg-red-400 right-0 animate-[ping_1.5s_infinite_linear]'
                                }`} />
                              </div>
                            </div>
                          </div>

                          {/* Smart home / consumption node */}
                          <div className="flex flex-col items-center relative z-10">
                            <div className="w-16 h-16 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                              <Bolt className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-mono font-medium text-white mt-2">Tu Consumo</span>
                            <span className="text-[10px] font-mono text-[#ff7b5b] mt-0.5">{prosumerConsumption} kW</span>
                          </div>
                        </div>

                        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#849495] gap-2">
                          <span>Estado inversor comunal: <strong className="text-green-300 font-mono">OPTIMO (94%)</strong></span>
                          <span>Tarifa de Reabono: <strong className="text-white font-mono">$480 COP / kWh</strong></span>
                        </div>
                      </div>

                      {/* Transaction Feed */}
                      <div className="lg:col-span-4 backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white font-display">Transacciones</h3>
                          <p className="text-xs text-[#849495] mt-0.5">Ventas automáticas de tus excedentes a la microrred.</p>
                        </div>

                        <div className="space-y-4 my-6">
                          {logs.filter(l => l.type === 'sale' || l.type === 'payment').slice(0, 3).map((l) => (
                            <div key={l.id} className="p-3 bg-[#0a0c10]/70 border border-white/5 rounded-xl">
                              <div className="flex justify-between items-start">
                                <h4 className="text-xs font-bold text-white">{l.title}</h4>
                                <span className="text-[10px] text-[#79ff5b] font-mono font-bold">+ {Math.floor(Math.random() * 20000 + 10000).toLocaleString()} COP</span>
                              </div>
                              <p className="text-[11px] text-[#849495] mt-1 pr-6 leading-tight">{l.description}</p>
                            </div>
                          ))}
                        </div>

                        <button 
                          onClick={() => alert('Simulado: Descargando certificado electrónico de bonos de energía para reducción de impuestos.')}
                          className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-lg text-white border border-white/10 transition-colors cursor-pointer"
                        >
                          Exportar Certificados Tributarios
                        </button>
                      </div>
                    </section>
                  </>
                )}

                {activeTab === 'analytics' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl text-left">
                    <h3 className="text-xl font-bold text-white font-display mb-2">Historial de Radiación e Inyecciones</h3>
                    <p className="text-xs text-[#849495] mb-6">Auditoría completa de la capacidad física de tus paneles solares.</p>

                    <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-xl">
                      <div className="h-64 relative w-full">
                        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <path 
                            d="M 0 180 Q 80 150 140 100 T 260 50 T 380 90 T 500 120" 
                            fill="none" 
                            stroke="#00dbe7" 
                            strokeWidth="3.5" 
                          />
                          <path 
                            d="M 0 190 Q 80 170 140 140 T 260 90 T 380 110 T 500 160" 
                            fill="none" 
                            stroke="#00dbe7" 
                            strokeWidth="1.5" 
                            strokeDasharray="4,4"
                            opacity="0.5"
                          />
                        </svg>
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-[#849495]">Excedente acumulado diario (WPC)</div>
                        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#849495]">Historial semanal</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl text-left">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white font-display">Facturación y Consumos Generales</h3>
                      <p className="text-xs text-[#849495] mt-1">Revisa e interactúa con el estado de cobros de tu conexión.</p>
                    </div>

                    <div className="space-y-4">
                      {invoices.map((inv, index) => (
                        <div key={index} className="p-5 bg-[#0c0e12]/60 border border-white/5 rounded-xl hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#00dbe7]/10 flex items-center justify-center text-[#00dbe7]">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white text-base">{inv.month}</h4>
                              <p className="text-xs text-[#849495] mt-0.5">Consumo total: {inv.consumption} kWh • Tarifa asignada: ${inv.rate} COP/kWh</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 justify-between md:justify-end">
                            <div className="text-right">
                              <p className="text-xs text-[#849495]">Total a pagar</p>
                              <p className="text-lg font-bold text-white font-mono">${inv.total.toLocaleString()} COP</p>
                            </div>

                            <div>
                              {inv.status === 'Pagado' ? (
                                <span className="text-xs font-bold text-green-300 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Pagado</span>
                                </span>
                              ) : (
                                <button 
                                  onClick={() => setBillingInvoice(inv)}
                                  className="text-xs font-semibold bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                                >
                                  Pagar Factura Electrónica
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* D. CONSUMER VIEW */}
            {currentUser?.role === 'consumer' && (
              <div className="space-y-10">
                {activeTab === 'dashboard' && (
                  <>
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* Active consumption card with simple indicator */}
                      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between text-left">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs uppercase font-mono tracking-wider text-[#849495]">Consumo de Red en Tiempo Real</span>
                            <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping"></span>
                          </div>
                          <h4 className="text-3xl font-bold text-white font-display flex items-baseline gap-1.5">
                            <span>{prosumerConsumption} kW</span>
                            <span className="text-xs text-[#849495] font-normal">Sorteando Cargas</span>
                          </h4>
                        </div>

                        <div className="mt-6">
                          <input 
                            type="range" 
                            min="0.2" 
                            max="8" 
                            step="0.1" 
                            value={prosumerConsumption} 
                            onChange={(e) => setProsumerConsumption(parseFloat(e.target.value))}
                            className="w-full accent-[#00dbe7]" 
                          />
                          <p className="text-[10px] text-[#849495] leading-normal font-mono mt-3">* Mueva para simular encendido/apagado de electrodomésticos en casa.</p>
                        </div>
                      </div>

                      {/* Wallet simulator */}
                      <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col justify-between text-left">
                        <div>
                          <span className="text-xs uppercase font-mono tracking-wider text-[#849495] block mb-2">Billetera de Recargas</span>
                          <h4 className="text-3xl font-bold text-cyan-300 font-display">${walletBalance.toLocaleString()} COP</h4>
                          <p className="text-xs text-[#849495] mt-1 font-mono">Deducciones PSE automáticas de tu banco.</p>
                        </div>

                        <button 
                          onClick={() => {
                            setWalletBalance(prev => prev + 50000);
                            alert('Saldo cargado: Se han agregado $50,000 COP a tu billetera.');
                          }}
                          className="w-full py-2 bg-[#00dbe7]/10 hover:bg-[#00dbe7]/20 border border-[#00dbe7]/20 text-[#00dbe7] text-xs font-semibold rounded-lg transition-all mt-6 cursor-pointer"
                        >
                          Cargar Saldo PSE (+ $50,000 COP)
                        </button>
                      </div>

                      {/* Active dynamic cost pricing advisor */}
                      <div className="backdrop-blur-xl bg-[#00dbe7]/5 border border-[#00dbe7]/15 p-6 rounded-2xl flex flex-col justify-between text-left">
                        <div>
                          <div className="flex items-center gap-1.5 text-[#00dbe7] mb-2">
                            <Info className="w-4 h-4" />
                            <span className="text-xs uppercase tracking-wider font-mono font-bold">Asistente Tarifario</span>
                          </div>
                          <p className="text-xs text-[#b9cacb] leading-relaxed">
                            {prosumerConsumption > 4.5 
                              ? '⚠️ Detectado pico de alto consumo. Recomendamos apagar calefacción auxiliar para mitigar recargos de hora punta.' 
                              : '💡 Tarifa dinámica recomendada de energía comunal baja ($480/kWh). Los prosumidores locales están aportando excedentes masivos. ¡Momento ideal de carga!'}
                          </p>
                        </div>

                        <div className="border-t border-[#00dbe7]/10 pt-4 mt-4 font-mono text-[10px] text-[#849495]">
                          <span>Precio corriente: $480 COP / kWh</span>
                        </div>
                      </div>
                    </section>

                    {/* STATS BREAKDOWN */}
                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-5 bg-white/5 border border-white/5 rounded-xl text-left">
                        <span className="text-xs text-[#849495] font-mono uppercase">Promedio de Carga</span>
                        <p className="text-xl font-bold text-white font-display mt-1">2.14 kW / Día</p>
                      </div>

                      <div className="p-5 bg-white/5 border border-white/5 rounded-xl text-left">
                        <span className="text-xs text-[#849495] font-mono uppercase">Eficiencia del Gasto</span>
                        <p className="text-xl font-bold text-green-300 font-display mt-1">Excelente A+</p>
                      </div>

                      <div className="p-5 bg-white/5 border border-white/5 rounded-xl text-left">
                        <span className="text-xs text-[#849495] font-mono uppercase">Aporte Verde Reclamado</span>
                        <p className="text-xl font-bold text-cyan-300 font-display mt-1">105.4 kWh Solares</p>
                      </div>
                    </section>
                  </>
                )}

                {activeTab === 'analytics' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl">
                    <h3 className="text-xl font-bold text-white font-display text-left mb-6">Tu Historial de Amortización de Consumo</h3>
                    
                    <div className="bg-[#0b0c10] border border-white/5 p-6 rounded-xl">
                      <div className="h-64 relative w-full">
                        <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                          <path 
                            d="M 0 140 Q 100 120 200 150 T 350 110 T 500 130" 
                            fill="none" 
                            stroke="#ff7b5b" 
                            strokeWidth="3" 
                          />
                        </svg>
                        <div className="absolute top-2 left-2 text-[10px] font-mono text-[#849495]">Historial de consumo por semanas (kWh)</div>
                        <div className="absolute bottom-2 right-2 text-[10px] font-mono text-[#849495]">Últimos 30 días</div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'billing' && (
                  <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl text-left">
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-white font-display">Tus Facturas Electrónicas de Consumo</h3>
                      <p className="text-xs text-[#849495] mt-1">Gestiona de forma transparente el pago de tu electricidad adaptada al consumo inteligente.</p>
                    </div>

                    <div className="space-y-4">
                      {invoices.map((inv, index) => (
                        <div key={index} className="p-5 bg-[#0c0e12]/60 border border-white/5 rounded-xl hover:border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#00dbe7]/10 flex items-center justify-center text-[#00dbe7]">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-white text-base">{inv.month}</h4>
                              <p className="text-xs text-[#849495] mt-0.5">Consumo Facturado: {inv.consumption} kWh • Tarifa de Red: ${inv.rate} COP/kWh</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 justify-between md:justify-end">
                            <div className="text-right">
                              <p className="text-xs text-[#849495]">Total Facturado</p>
                              <p className="text-lg font-bold text-white font-mono">${inv.total.toLocaleString()} COP</p>
                            </div>

                            <div>
                              {inv.status === 'Pagado' ? (
                                <span className="text-xs font-bold text-green-300 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Pagado</span>
                                </span>
                              ) : (
                                <button 
                                  onClick={() => setBillingInvoice(inv)}
                                  className="text-xs font-semibold bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] px-4 py-2 rounded-lg transition-colors cursor-pointer"
                                >
                                  Pagar por PSE / Cartera
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </main>
        </div>
      )}

      {/* ========================================================= */}
      {/* INTERACTIVE MODALS */}
      {/* ========================================================= */}

      {/* 1. Add Community Modal */}
      {showAddCommunityModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] px-4">
          <div className="bg-[#111318] border border-white/15 w-full max-w-md rounded-2xl p-6 relative shadow-2xl text-left">
            <h4 className="text-lg font-bold text-white font-display">Crear Nueva Comunidad</h4>
            <p className="text-xs text-[#849495] mt-1 mb-6">Asigna un nuevo nodo geográfico de microrred al consorcio global.</p>

            <form onSubmit={handleCreateCommunity} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Nombre Comunitario</label>
                <input 
                  type="text" 
                  value={newCommunityName}
                  onChange={(e) => setNewCommunityName(e.target.value)}
                  placeholder="Ej. Bosques Verdes"
                  required
                  className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Ubicación Geográfica</label>
                <input 
                  type="text" 
                  value={newCommunityLocation}
                  onChange={(e) => setNewCommunityLocation(e.target.value)}
                  placeholder="Ej. Cali, CO"
                  required
                  className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Asignar Administrador de Comunidad</label>
                <input 
                  type="text" 
                  value={newCommunityAdmin}
                  onChange={(e) => setNewCommunityAdmin(e.target.value)}
                  placeholder="Nombre de pila (opcional)"
                  className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddCommunityModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-white transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-semibold text-xs rounded-xl transition-all"
                >
                  Confirmar Nodo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Member Community Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] px-4">
          <div className="bg-[#111318] border border-white/15 w-full max-w-md rounded-2xl p-6 relative shadow-2xl text-left">
            <h4 className="text-lg font-bold text-white font-display">Asociar Miembro a Comunidad</h4>
            <p className="text-xs text-[#849495] mt-1 mb-6">Añade usuarios de energía activa a tu microrred controlada.</p>

            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Nombre Completo</label>
                <input 
                  type="text" 
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Ej. Roberto Martínez"
                  required
                  className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#b9cacb]/80 uppercase block">Tipo de Usuario</label>
                  <select 
                    value={newMemberRole}
                    onChange={(e) => {
                      const nextRole = e.target.value as 'prosumer' | "consumer";
                      setNewMemberRole(nextRole);
                      if (nextRole === 'consumer') setNewMemberGeneration('0.0');
                    }}
                    className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm text-white"
                  >
                    <option value="consumer">Consumidor</option>
                    <option value="prosumer">Prosumidor</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Tarifa COP/kWh</label>
                  <input 
                    type="number" 
                    value={newMemberTariff}
                    onChange={(e) => setNewMemberTariff(e.target.value)}
                    placeholder="480"
                    required
                    className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Generación (kW)</label>
                  <input 
                    type="text" 
                    value={newMemberGeneration}
                    onChange={(e) => setNewMemberGeneration(e.target.value)}
                    disabled={newMemberRole === 'consumer'}
                    placeholder="Generación actual"
                    className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Consumo Estimado (kW)</label>
                  <input 
                    type="text" 
                    value={newMemberConsumption}
                    onChange={(e) => setNewMemberConsumption(e.target.value)}
                    placeholder="Carga nominal"
                    required
                    className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddMemberModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-white transition-all border border-white/5"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-semibold text-xs rounded-xl transition-all"
                >
                  Añadir Miembro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Invoicing PSE/Card Mock payment Modal */}
      {billingInvoice && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-[100] px-4">
          <div className="bg-[#111318] border border-white/15 w-full max-w-sm rounded-2xl p-6 relative shadow-2xl text-left">
            <h4 className="text-lg font-bold text-white font-display flex items-center gap-1.5">
              <CreditCard className="text-[#00dbe7]" />
              <span>Pasarela de Pago WePower</span>
            </h4>
            <p className="text-xs text-[#849495] mt-1 mb-6">Paga de manera segura tus consumos dinámicos en pesos colombianos.</p>

            {billingSuccess ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <CheckCircle className="w-16 h-16 text-[#79ff5b] animate-bounce animate-energy-pulse" />
                <p className="text-sm font-semibold tracking-wide text-white text-center">¡PAGO EN COP APROBADO!</p>
                <p className="text-xs text-[#849495] text-center">Transacción PSE / Tarjeta enrutada.</p>
              </div>
            ) : (
              <form onSubmit={handlePayInvoiceSubmit} className="space-y-4">
                <div className="bg-[#0c0e12]/60 p-3 rounded-xl border border-white/5 mb-4">
                  <span className="text-[10px] font-mono text-[#849495] uppercase">Total Facturado ({billingInvoice.month})</span>
                  <p className="text-lg font-bold text-white font-mono mt-0.5">${billingInvoice.total.toLocaleString()} COP</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Nombre en Tarjeta / Identificador</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Roberto Rivera"
                    value={customCardName} 
                    onChange={(e) => setCustomCardName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-[#b9cacb]/80 uppercase">Número de Tarjeta de Crédito o Cuenta PSE</label>
                  <input 
                    type="text" 
                    placeholder="•••• •••• •••• •••• / Nro Cuenta"
                    value={customCardNumber} 
                    onChange={(e) => setCustomCardNumber(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-[#07090c] border border-white/5 rounded-xl text-sm text-white"
                  />
                </div>

                <div className="flex gap-2.5 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setBillingInvoice(null)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-white border border-white/5"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-[#00dbe7] hover:bg-[#00cbdd] text-[#002022] font-semibold text-xs rounded-xl"
                  >
                    Confirmar Transacción
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
