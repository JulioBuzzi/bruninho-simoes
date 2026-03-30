'use client';
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      padding: '32px 0',
      marginTop: 40,
    }}>
      <div className="page-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        {/* Left: logo + tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, overflow: 'hidden',
            background: 'var(--red-primary)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <img src="/bruninhoesimoes.png" alt="B&S" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <span style={{ display: 'none', fontFamily: 'Bebas Neue', fontSize: 12, color: 'white' }}>B&S</span>
          </div>
          <div>
            <div style={{ fontFamily: 'Bebas Neue', fontSize: 16, letterSpacing: '0.05em', lineHeight: 1 }}>
              Bruninho <span style={{ color: 'var(--red-primary)' }}>&</span> Simões
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
              Notas do Mengão
            </div>
          </div>
        </div>

        {/* Center: links */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { href: '/', label: 'Jogos' },
            { href: '/estatisticas', label: 'Estatísticas' },
            { href: '/jogadores', label: 'Jogadores' },
            { href: 'https://www.youtube.com/@BruninhoeSimoes', label: '▶ YouTube', external: true },
          ].map(({ href, label, external }) => (
            <a key={href} href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}
              style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', fontWeight: 600, letterSpacing: '0.04em', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >{label}</a>
          ))}
        </div>

        {/* Right: credit */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.04em' }}>
            Desenvolvido por
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Barlow Condensed', letterSpacing: '0.04em' }}>
            Juliada
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', marginTop: 2 }}>
            © {year} · Todos os direitos reservados
          </div>
        </div>
      </div>
    </footer>
  );
}