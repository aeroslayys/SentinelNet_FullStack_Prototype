export default function Header({ onAnalyze, onInject, busy, online }) {
  return (
    <header className="topbar">
      <div className="brand-wrap">
        <div className="brand-mark" aria-hidden="true"><span/><span/><span/></div>
        <div>
          <div className="brand">SENTINEL<span>NET</span></div>
          <div className="subbrand">Multi-Layer Social Media Intelligence</div>
        </div>
      </div>
      <div className="top-actions">
        <div className={`system-pill ${online ? '' : 'offline'}`}><span className="pulse-dot"/> {online ? 'SYSTEM ONLINE' : 'API OFFLINE'}</div>
        <button className="btn ghost" onClick={onInject} disabled={busy || !online}>Inject Demo Event</button>
        <button className="btn primary" onClick={onAnalyze} disabled={busy || !online}>{busy ? 'Analyzing…' : 'Run Analysis'}</button>
      </div>
    </header>
  );
}
