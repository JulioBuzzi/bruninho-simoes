'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, ShieldHalf, BarChart3, Users, Lock, Youtube } from 'lucide-react';

const navLinks = [
  { href: '/',            label: 'Jogos',         icon: ShieldHalf },
  { href: '/estatisticas',label: 'Estatísticas',  icon: BarChart3  },
  { href: '/jogadores',   label: 'Jogadores',     icon: Users      },
  { href: '/admin',       label: 'Admin',          icon: Lock       },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(10,10,15,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      height: '72px', display: 'flex', alignItems: 'center',
    }}>
      <div className="page-container" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>

        {/* Logo + YouTube button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0,
              background: 'var(--red-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px var(--red-glow)',
            }}>
              <img
                src="/bruninhoesimoes.png"
                alt="Bruninho e Simões"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
              <span style={{ display: 'none', alignItems: 'center', justifyContent: 'center', fontFamily: 'Bebas Neue', fontSize: 14, color: 'white', letterSpacing: 1, width: '100%', height: '100%' }}>B&S</span>
            </div>
            <div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: 20, letterSpacing: '0.05em', lineHeight: 1 }}>
                Bruninho <span style={{ color: 'var(--red-primary)' }}>&</span> Simões
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Notas do Tengo
              </div>
            </div>
          </Link>

          {/* YouTube button */}
          <a
            href="https://www.youtube.com/@BruninhoeSimoes"
            target="_blank"
            rel="noopener noreferrer"
            title="Canal no YouTube"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: 8,
              background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.25)',
              color: '#ff3d3d',
              fontFamily: 'Barlow Condensed', fontWeight: 700, fontSize: 12,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              transition: 'all 0.2s', textDecoration: 'none', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,0,0,0.18)'; e.currentTarget.style.borderColor = 'rgba(255,0,0,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,0,0,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,0,0,0.25)'; }}
          >
            <Youtube size={15} />
            <span className="yt-label">YouTube</span>
          </a>
        </div>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', gap: 4 }} className="desktop-nav">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/' && pathname.startsWith(href));
            return (
              <Link key={href} href={href} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 8,
                fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: 14,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                background: active ? 'rgba(232,0,28,0.12)' : 'transparent',
                color: active ? 'var(--red-primary)' : 'var(--text-secondary)',
                border: active ? '1px solid rgba(232,0,28,0.2)' : '1px solid transparent',
                transition: 'all 0.2s',
              }}>
                <Icon size={15} />{label}
              </Link>
            );
          })}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setOpen(!open)} style={{
          display: 'none', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer',
        }} className="mobile-menu-btn">
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{
          position: 'absolute', top: '72px', left: 0, right: 0,
          background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
          padding: '12px 16px 20px',
        }}>
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px',
              borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)',
              fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: 15, letterSpacing: '0.04em',
            }}>
              <Icon size={18} />{label}
            </Link>
          ))}
          <a href="https://www.youtube.com/@BruninhoeSimoes" target="_blank" rel="noopener noreferrer"
            onClick={() => setOpen(false)} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 8px',
              color: '#ff3d3d', fontFamily: 'Barlow Condensed', fontWeight: 600, fontSize: 15,
            }}>
            <Youtube size={18} /> YouTube
          </a>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .yt-label { display: none; }
        }
      `}</style>
    </nav>
  );
}