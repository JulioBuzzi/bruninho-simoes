'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      marginTop: 60,
      padding: '24px 20px',
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      textAlign: 'center'
    }}>
      <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, marginBottom: 6 }}>
        GaloFigurinhas
      </div>

      <div style={{
        fontSize: 12,
        color: 'var(--text-muted)',
        fontFamily: 'Barlow Condensed',
        letterSpacing: '0.05em',
        marginBottom: 12
      }}>
        © {new Date().getFullYear()} • Todos os direitos reservados
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        fontSize: 12
      }}>
        <Link href="/" style={{ color: 'var(--text-muted)' }}>Início</Link>
        <Link href="/estatisticas" style={{ color: 'var(--text-muted)' }}>Estatísticas</Link>
        <Link href="/jogadores" style={{ color: 'var(--text-muted)' }}>Jogadores</Link>
      </div>
    </footer>
  );
}