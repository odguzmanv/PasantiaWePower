export type UserRole = 'super_admin' | 'admin' | 'prosumer' | 'consumer';

export interface Community {
  id: string; // e.g. "WP-8821"
  name: string;
  location: string;
  status: 'OPTIMO' | 'ESTABLE' | 'ALERTA';
  userCount: number;
  efficiency: number; // percentage
  adminEmail?: string;
  adminName?: string;
}

export interface CommunityMember {
  id: string;
  name: string;
  role: 'prosumer' | 'consumer';
  status: 'ONLINE' | 'OFFLINE';
  generation: number; // in kW
  consumption: number; // in kW
  tariff: number; // in COP/kWh
  avatarUrl: string;
  communityId?: string;
}

export interface Invoice {
  month: string;
  consumption: number; // in kWh
  rate: number; // in COP/kWh
  total: number; // in COP
  status: 'Pendiente' | 'Pagado';
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'sale' | 'health' | 'payment' | 'alert';
}
