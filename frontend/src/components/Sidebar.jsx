const items = [
  ['dashboard', '⌁', 'Dashboard'],
  ['network', '◉', 'Network Intelligence'],
  ['evidence', '⬡', 'Evidence Ledger']
];

export default function Sidebar({ view, onChange }) {
  return (
    <aside className="sidebar">
      <nav>
        {items.map(([id, icon, label]) => (
          <button key={id} className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => onChange(id)}>
            <span className="nav-icon">{icon}</span><span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-card">
        <div className="eyebrow">DETECTION PIPELINE</div>
        <div className="pipeline-mini">
          <div><span>01</span> Ingest</div>
          <div><span>02</span> NLP + Sentiment</div>
          <div><span>03</span> Graph Analysis</div>
          <div><span>04</span> Threat Scoring</div>
          <div><span>05</span> Evidence Hash</div>
        </div>
      </div>
      <div className="sidebar-footer">
        <div>SMART INDIA HACKATHON 2026</div>
        <strong>NTRO · PS 26152</strong>
      </div>
    </aside>
  );
}
