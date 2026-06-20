import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import db, { initDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    initDb(); // Asegurar que la DB y el mock data existan
    
    const body = await request.json();
    const { username, password } = body;

    const stmt = db.prepare('SELECT id, username, role, communityId FROM users WHERE username = ? AND password = ?');
    const user = stmt.get(username, password) as any;

    if (user) {
      // Configuramos una cookie simple para la sesión
      const sessionData = JSON.stringify({ id: user.id, username: user.username, role: user.role, communityId: user.communityId });
      
      const cookieStore = await cookies();
      cookieStore.set('session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // 1 semana
        path: '/',
      });

      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  } catch (error) {
    console.error('Auth Error:', error);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ success: true });
}
