import { Community, CommunityMember, Invoice, ActivityLog } from './types';

export const INITIAL_COMMUNITIES: Community[] = [
  {
    id: 'WP-8821',
    name: 'Valle del Sol',
    location: 'Sevilla, ES',
    status: 'OPTIMO',
    userCount: 45,
    efficiency: 94,
    adminEmail: 'admin.sevilla@wepower.com',
    adminName: 'Ana María Gómez',
  },
  {
    id: 'WP-9204',
    name: 'Eólico Cantábrico',
    location: 'Gijón, ES',
    status: 'ESTABLE',
    userCount: 121,
    efficiency: 82,
    adminEmail: 'admin.cantabrico@wepower.com',
    adminName: 'Lucía Torres',
  },
  {
    id: 'WP-4410',
    name: 'EcoDistrito Central',
    location: 'Madrid, ES',
    status: 'ALERTA',
    userCount: 505,
    efficiency: 45,
    adminEmail: 'admin.central@wepower.com',
    adminName: 'Mateo Fernández',
  },
];

export const INITIAL_MEMBERS: CommunityMember[] = [
  {
    id: 'U-001',
    name: 'Carlos Méndez',
    role: 'prosumer',
    status: 'ONLINE',
    generation: 4.2,
    consumption: 1.8,
    tariff: 480,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    communityId: 'WP-8821',
  },
  {
    id: 'U-002',
    name: 'Lucía Torres',
    role: 'consumer',
    status: 'ONLINE',
    generation: 0.0,
    consumption: 2.8,
    tariff: 525,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    communityId: 'WP-9204',
  },
  {
    id: 'U-003',
    name: 'Sofía Chen',
    role: 'prosumer',
    status: 'ONLINE',
    generation: 2.1,
    consumption: 1.1,
    tariff: 510,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    communityId: 'WP-8821',
  },
  {
    id: 'U-004',
    name: 'Solar Array B-4',
    role: 'prosumer',
    status: 'OFFLINE',
    generation: 0.0,
    consumption: 0.0,
    tariff: 450,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    communityId: 'WP-4410',
  },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    month: 'Mayo 2026',
    consumption: 312,
    rate: 750,
    total: 1438500,
    status: 'Pendiente',
  },
  {
    month: 'Abril 2026',
    consumption: 284,
    rate: 740,
    total: 1239420,
    status: 'Pagado',
  },
  {
    month: 'Marzo 2026',
    consumption: 240,
    rate: 740,
    total: 1071000,
    status: 'Pagado',
  },
  {
    month: 'Febrero 2026',
    consumption: 305,
    rate: 750,
    total: 1366680,
    status: 'Pagado',
  },
  {
    month: 'Enero 2026',
    consumption: 215,
    rate: 720,
    total: 893760,
    status: 'Pagado',
  },
];

export const ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    title: 'Venta de 5,2 kWh a la red',
    description: 'Generación excedentaria vertida a la red local.',
    timestamp: 'Hoy, 02:45 PM • +48.000 COP',
    type: 'sale',
  },
  {
    id: 'act-2',
    title: 'Estado del Sistema: Óptimo',
    description: 'Todos los paneles solares están funcionando con normalidad.',
    timestamp: 'Hoy, 09:00 AM • Paneles activos',
    type: 'health',
  },
  {
    id: 'act-3',
    title: 'Pago Mensual Recibido',
    description: 'Abono realizado por venta acumulada de excedentes del mes.',
    timestamp: 'Ayer, 11:30 PM • +1.600.000 COP',
    type: 'payment',
  },
  {
    id: 'act-4',
    title: 'Alerta de Alto Consumo',
    description: 'Pico de consumo detectado que supera el límite establecido.',
    timestamp: 'Oct 24, 06:15 PM • Pico alcanzado',
    type: 'alert',
  },
];

export const CONSUMER_ACTIVITIES: ActivityLog[] = [
  {
    id: 'cact-1',
    title: 'Pico de Consumo Detectado',
    description: 'Superaste los 2.5kW a las 14:30. Revisa tus electrodomésticos.',
    timestamp: 'Hoy, 02:45 PM • Pico alcanzado',
    type: 'alert',
  },
  {
    id: 'cact-2',
    title: 'Factura Generada',
    description: 'Periodo Mayo 2026 - $142.000 COP cargados a tu cartera.',
    timestamp: 'Ayer, 09:00 AM • Verificado',
    type: 'payment',
  },
  {
    id: 'cact-3',
    title: 'Disponibilidad de Red: 98%',
    description: 'Estabilidad óptima basada en el aporte de prosumidores locales.',
    timestamp: 'Hoy, 07:00 AM • Estable',
    type: 'health',
  },
];
