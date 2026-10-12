'use client';
import { useEffect, useRef, useState } from 'react';
import { Share2, Download, X } from 'lucide-react';
import { generateMatchCard } from '../lib/shareCard';

function slug(s) {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Botão "Compartilhar notas": gera a imagem (story 1080x1920) e abre uma prévia com o botão Baixar
export default function ShareCardButton({ data }) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [blob, setBlob]       = useState(null);
  const [url, setUrl]         = useState(null);
  const [dataUrl, setDataUrl] = useState(null); // usado no download (não depende de blob:)
  const [error, setError]     = useState(false);
  const closeRef              = useRef(null);

  const { match } = data;
  const fileName = `notas-flamengo-x-${slug(match.opponent_name)}-${String(match.match_date).slice(0, 10)}.png`;

  const handleOpen = async () => {
    setOpen(true);
    if (blob) return; // já gerada: reabre na hora
    setLoading(true);
    setError(false);
    try {
      const b = await generateMatchCard(data);
      setBlob(b);
      setUrl(URL.createObjectURL(b));
      // Versão "data:" da mesma imagem: o download fica 100% dentro do navegador.
      // Com link blob:, o Edge e gerenciadores de download (IDM etc.) travam em 100% sem salvar.
      setDataUrl(await new Promise((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = reject;
        fr.readAsDataURL(b);
      }));
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

  // Download direto do PNG já gerado (sem novo processamento, sem perder qualidade)
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = dataUrl || url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
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
              width: '100%', minWidth: 0, maxWidth: 420, maxHeight: '94vh',
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

            <div style={{ flex: 1, minHeight: 0, minWidth: 0, overflowY: 'auto', overflowX: 'hidden', padding: 16, display: 'flex', justifyContent: 'center', overscrollBehavior: 'contain' }}>
              {loading && <p style={{ padding: '60px 0', color: 'var(--text-muted)', fontFamily: 'Barlow Condensed', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 13 }}>Gerando imagem...</p>}
              {error && <p style={{ padding: '60px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>Não foi possível gerar a imagem. Tente novamente.</p>}
              {url && !loading && (
                <div style={{ width: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <img src={url} alt="Prévia da imagem com as notas (formato story)" style={{ maxWidth: '100%', maxHeight: '62vh', width: 'auto', height: 'auto', borderRadius: 8, border: '1px solid var(--border)' }} />
                  {/* Plano B no celular (ex.: navegador dentro do Instagram não permite download) */}
                  <p className="touch-only" style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'Barlow Condensed', letterSpacing: '0.03em' }}>
                    Se não baixar, segure o dedo na imagem e toque em “Salvar imagem”.
                  </p>
                </div>
              )}
            </div>

            {url && !loading && (
              <div style={{ display: 'flex', gap: 10, padding: '12px 16px', borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                <button type="button" className="btn btn-primary" onClick={handleDownload} style={{ flex: 1, justifyContent: 'center' }}>
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