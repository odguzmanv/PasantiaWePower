import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WePower | Comunidad Energética',
  description: 'Gestión y monitoreo de tu comunidad energética',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
