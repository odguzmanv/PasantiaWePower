import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db from '@/lib/db';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { searchParams } = new URL(request.url);
    const viewAsUserId = searchParams.get('userId'); // Si el admin quiere ver como un usuario

    if (session.role === 'SUPERADMIN') {
      const communities = db.prepare('SELECT * FROM communities').all();
      const users = db.prepare('SELECT id, username, role, communityId FROM users').all();
      return NextResponse.json({ communities, users, role: session.role });
    }

    if (session.role === 'ADMIN') {
      const users = db.prepare("SELECT id, username, role FROM users WHERE communityId = ? AND role != 'SUPERADMIN'").all(session.communityId);
      const prices = db.prepare('SELECT id, month, priceKwh FROM community_prices WHERE communityId = ? ORDER BY month DESC').all(session.communityId);
      
      // Si el admin está viendo los datos de un usuario específico
      if (viewAsUserId) {
        const userData = db.prepare('SELECT month, consumptionKwh, generationKwh FROM monthly_data WHERE userId = ? ORDER BY month ASC').all(viewAsUserId);
        return NextResponse.json({ users, prices, role: session.role, userData, viewAsUserId });
      }

      return NextResponse.json({ users, prices, role: session.role });
    }

    // Para CONSUMER o PROSUMER (o el admin viendo como si fuera ellos)
    const targetUserId = viewAsUserId || session.id;
    const userData = db.prepare('SELECT month, consumptionKwh, generationKwh FROM monthly_data WHERE userId = ? ORDER BY month ASC').all(targetUserId);
    const prices = db.prepare('SELECT month, priceKwh FROM community_prices WHERE communityId = ? ORDER BY month ASC').all(session.communityId);
    
    return NextResponse.json({ userData, prices, role: session.role });
  } catch (error) {
    console.error('API Data Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

// POST para que el admin pueda añadir usuarios o cambiar precio
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    if (!sessionCookie) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    
    const session = JSON.parse(sessionCookie.value);
    if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });

    const body = await request.json();
    const { action, payload } = body;

    if (action === 'set_price') {
      const { month, priceKwh } = payload;
      const existing = db.prepare('SELECT id FROM community_prices WHERE communityId = ? AND month = ?').get(session.communityId, month);
      
      if (existing) {
        db.prepare('UPDATE community_prices SET priceKwh = ? WHERE communityId = ? AND month = ?').run(priceKwh, session.communityId, month);
      } else {
        db.prepare('INSERT INTO community_prices (communityId, month, priceKwh) VALUES (?, ?, ?)').run(session.communityId, month, priceKwh);
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'add_user') {
      const { username, password, role } = payload;
      db.prepare('INSERT INTO users (username, password, role, communityId) VALUES (?, ?, ?, ?)').run(username, password, role, session.communityId);
      return NextResponse.json({ success: true });
    }

    if (action === 'delete_user') {
      const { userId } = payload;
      // Eliminar historial y usuario
      db.prepare('DELETE FROM monthly_data WHERE userId = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ? AND communityId = ?').run(userId, session.communityId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
