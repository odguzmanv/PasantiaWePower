import Link from 'next/link';

export default function ForgotPassword() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md animate-fade-in text-center">
        <h2 className="text-3xl font-bold mb-6 text-white">Recuperar Contraseña</h2>
        <p className="text-gray-300 mb-6">
          Contacta con el equipo de soporte técnico (superadmin) o con el administrador de tu comunidad para restablecer tus credenciales.
        </p>
        <Link href="/login" className="btn btn-primary w-full py-3 mb-4">
          Volver a Iniciar Sesión
        </Link>
      </div>
    </div>
  );
}
