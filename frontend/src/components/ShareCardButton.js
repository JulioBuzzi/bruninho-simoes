'use client';
import { useEffect, useRef, useState } from 'react';
import { Share2, Download, X } from 'lucide-react';
import { generateMatchCard } from '../lib/shareCard';

function slug(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Botão "Compartilhar notas": gera a imagem e abre uma prévia com Baixar / Compartilhar
export default function ShareCardButton({ data }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [blob, setBlob]       = useState(null);
  const [url, setUrl]         = useState(null);
  const [error, setError]     = useState(false);
  const closeRef              = useRef(null);

  const { match } = data;
  const fileName = `notas-flamengo-x-${slug(match.opponent_name)}-${String(match.match_date).slice(0, 10)}.png`;

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setError(false);
    try {
      const b = await generateMatchCard(data);
      setBlob(b);
      setUrl(URL.createObjectURL(b));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => setOpen(false);

  // Libera a URL da imagem quando ela não for mais usada
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  // Esc fecha + trava o scroll da página
  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    const old = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = old; };
  }, [open]);

  const file = blob ? new File([blob], fileName, { type: 'image/png' }) : null;
  const canShareFile = typeof navigator !== 'undefined' && !!file && !!navigator.canShare && navigator.canShare({ files: [file] });

  const handleShare = async () => {
    try {
      await navigator.share({
        files: [file],
        title: `Notas: Flamengo ${match.flamengo_goals} x ${match.opponent_goals} ${match.opponent_name}`,
        text: 'Notas do Bruninho e Simões 🔴⚫',
      });
    } catch { /* usuário cancelou */ }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
  };

  return (
    <>
      <button type="button" className="btn btn-primary" onClick={handleOpen} style={{ fontSize: 13, padding: '8px 16px' }}>
        <Share2 size={16} /> Compartilhar notas
      </button>

      {open && (
        <div
          onClick={handleClose}
          style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(5,5,10,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Imagem com as notas do jogo"
            onClick={e => e.stopPropagation()}
            className="fade-in"
            style={{
              width: '100%', maxWidth: 420, maxHeight: '94vh',
              background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: 24 }}>Compartilhar <span style={{ color: 'var(--red-primary)' }}>notas</span></h3>
              <button ref={closeRef} type="button" onClick={handleClose} className="btn btn-ghost" style={{ padding: '6px 10px' }} aria-label="Fechar">
                <X size={18} /> <span style={{ fontSize: 12 }}>Fechar</span>
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', justifyContent: 'center', overscrollBehavior: 'contain' }}>
              {loading && <p style={{ padding: '60px 0', color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 13 }}>Gerando imagem...</p>}
              {error && <p style={{ padding: '60px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>Não foi possível gerar a imagem. Tente novamente.</p>}
              {url && !loading && (
                <img src={url} alt="Prévia da imagem com as notas (formato story)" style={{ maxWidth: '100%', maxHeight: '62vh', width: 'auto', height: 'auto', borderRadius: 8, border: '1px solid var(--border)' }} />
              )}
            </div>

            {url && !loading && (
              <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {canShareFile && (
                  <button type="button" className="btn btn-primary" onClick={handleShare} style={{ flex: 1, justifyContent: 'center' }}>
                    <Share2 size={16} /> Compartilhar
                  </button>
                )}
                <button type="button" className={canShareFile ? 'btn btn-ghost' : 'btn btn-primary'} onClick={handleDownload} style={{ flex: 1, justifyContent: 'center' }}>
                  <Download size={16} /> Baixar imagem
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}