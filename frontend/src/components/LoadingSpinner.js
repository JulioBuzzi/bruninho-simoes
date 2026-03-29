export default function LoadingSpinner({ text = 'Carregando...' }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: '80px 0', color: 'var(--text-muted)',
    }}>
      <div className="spinner" />
      <span style={{ fontFamily: 'Barlow Condensed', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: 13 }}>
        {text}
      </span>
    </div>
  );
}
