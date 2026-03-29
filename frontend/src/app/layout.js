import './globals.css';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'Bruninho e Simões | Notas do Flamengo',
  description: 'Sistema de notas dos jogadores do Flamengo pelo canal Bruninho e Simões',
  icons: {
    icon: '/bruninhoesimoes.png',
    shortcut: '/bruninhoesimoes.png',
    apple: '/bruninhoesimoes.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className="noise-overlay">
        <Navbar />
        <main style={{ paddingTop: '72px', minHeight: '100vh' }}>
          {children}
        </main>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#16161f',
              color: '#f0f0f5',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              fontFamily: 'Barlow, sans-serif',
            },
            success: { iconTheme: { primary: '#00c853', secondary: '#16161f' } },
            error: { iconTheme: { primary: '#e8001c', secondary: '#16161f' } },
          }}
        />
      </body>
    </html>
  );
}