import Link from 'next/link';

export default function Register() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-panel p-8 w-full max-w-md animate-fade-in text-center">
        <h2 className="text-3xl font-bold mb-6 text-white">Registro</h2>
        <p className="text-gray-300 mb-6">
          Para unirte a una Comunidad Energética WePower, contacta con tu administrador para que te genere un acceso directo en el sistema.
        </p>
        <Link href="/login" className="text-blue-400 hover:text-blue-300 block mb-4">
          Ya tengo una cuenta
        </Link>
        <Link href="/" className="btn btn-outline w-full py-3">
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
