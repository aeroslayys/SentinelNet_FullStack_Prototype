export default function Alerts({ alerts }) {
  return (
    <section className="panel alert-panel">
      <div className="panel-head">
        <div><div className="eyebrow">PRIORITY QUEUE</div><h2>Threat Alerts</h2></div>
        <span className="count-badge">{alerts.length}</span>
      </div>
      <div className="alert-list">
        {alerts.map(a => <div key={a.id} className={`alert ${a.severity === 'elevated' ? 'warn':''}`}>
          <strong>{a.severity === 'critical' ? 'Critical' : 'Elevated'} · {a.category}</strong>
          <span>{a.message}</span><time>{a.timestamp} · cluster {a.cluster}</time>
        </div>)}
      </div>
    </section>
  );
}
