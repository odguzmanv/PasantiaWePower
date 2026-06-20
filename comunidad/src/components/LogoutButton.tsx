"use client";

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/login');
    router.refresh();
  };

  return (
    <button onClick={handleLogout} className="btn btn-outline text-sm">
      Cerrar Sesión
    </button>
  );
}
